/**
 * Brightcare — Connectivity Guard
 * Wraps cloud calls with offline-aware error handling
 */

import { queueSync, offlineDelete, offlinePut, offlineGetAll, isOnline } from './offlineStore';

type SupabaseTable = string;

let _listeners: Array<(online: boolean) => void> = [];
let _currentStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;

function isRetriableNetworkError(error: any): boolean {
  const message = `${error?.message || ''}`.toLowerCase();
  return (
    error?.name === 'TypeError' ||
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    error?.code === 'PGRST301'
  );
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { _currentStatus = true; _listeners.forEach(l => l(true)); });
  window.addEventListener('offline', () => { _currentStatus = false; _listeners.forEach(l => l(false)); });
}

export function getOnlineStatus(): boolean {
  return _currentStatus;
}

export function onConnectivityChange(cb: (online: boolean) => void): () => void {
  _listeners.push(cb);
  return () => { _listeners = _listeners.filter(l => l !== cb); };
}

/**
 * Safe query — falls back to cached IndexedDB data when offline
 */
export async function safeQuery<T = any>(
  table: SupabaseTable,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheKey?: string
): Promise<{ data: T | null; error: any; offline: boolean }> {
  if (!isOnline()) {
    // Try IndexedDB cache
    try {
      const storeName = table as any;
      const cached = await offlineGetAll(storeName);
      return { data: cached as any, error: null, offline: true };
    } catch {
      return { data: null, error: { message: 'Offline — no cached data available' }, offline: true };
    }
  }

  try {
    const result = await queryFn();
    return { ...result, offline: false };
  } catch (err: any) {
    // Network error — try cache
    if (isRetriableNetworkError(err)) {
      try {
        const cached = await offlineGetAll(table as any);
        return { data: cached as any, error: null, offline: true };
      } catch {
        return { data: null, error: err, offline: true };
      }
    }
    return { data: null, error: err, offline: false };
  }
}

/**
 * Safe mutation — queues to sync queue when offline
 */
export async function safeMutation(
  table: SupabaseTable,
  operation: 'insert' | 'update' | 'delete',
  data: any,
  mutationFn: () => Promise<{ data: any; error: any }>
): Promise<{ data: any; error: any; queued: boolean }> {
  if (!isOnline()) {
    await queueSync(table, operation, data);
    // Also save locally
    if (operation === 'delete' && data?.id) {
      try { await offlineDelete(table as any, data.id); } catch {}
    } else if (data?.id) {
      try { await offlinePut(table as any, data); } catch {}
    }
    return { data, error: null, queued: true };
  }

  try {
    const result = await mutationFn();
    if (result.error) {
      // If it's a network error, queue it
      if (isRetriableNetworkError(result.error)) {
        await queueSync(table, operation, data);
        if (operation === 'delete' && data?.id) {
          try { await offlineDelete(table as any, data.id); } catch {}
        } else if (data?.id) {
          try { await offlinePut(table as any, data); } catch {}
        }
        return { data, error: null, queued: true };
      }
      return { data: null, error: result.error, queued: false };
    }
    return { ...result, queued: false };
  } catch (err: any) {
    if (isRetriableNetworkError(err)) {
      await queueSync(table, operation, data);
      if (operation === 'delete' && data?.id) {
        try { await offlineDelete(table as any, data.id); } catch {}
      } else if (data?.id) {
        try { await offlinePut(table as any, data); } catch {}
      }
      return { data, error: null, queued: true };
    }

    return { data: null, error: err, queued: false };
  }
}

/**
 * Features that require online connectivity
 */
const ONLINE_ONLY_FEATURES = new Set([
  'mpesa_stk_push',
  'insurance_verification',
  'realtime_notifications',
  'ai_assistant',
  'email_sending',
]);

export function isFeatureAvailable(feature: string): boolean {
  if (ONLINE_ONLY_FEATURES.has(feature)) {
    return isOnline();
  }
  return true;
}
