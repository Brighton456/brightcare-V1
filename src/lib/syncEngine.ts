/**
 * Brightcare — Cloud Sync Engine
 * Pushes queued offline changes to Supabase when online
 */

import { supabase } from '@/integrations/supabase/client';
import { getPendingSyncs, markSynced, markFailed, isOnline } from './offlineStore';

let syncInterval: ReturnType<typeof setInterval> | null = null;

async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  if (!isOnline()) return { synced: 0, failed: 0 };

  const pending = await getPendingSyncs();
  let synced = 0;
  let failed = 0;

  for (const entry of pending) {
    try {
      const table = entry.table as any;
      if (entry.operation === 'insert') {
        const { error } = await supabase.from(table).insert(entry.data);
        if (error) throw error;
      } else if (entry.operation === 'update') {
        const { id, ...rest } = entry.data;
        const { error } = await supabase.from(table).update(rest).eq('id', id);
        if (error) throw error;
      } else if (entry.operation === 'delete') {
        const { error } = await supabase.from(table).delete().eq('id', entry.data.id);
        if (error) throw error;
      }
      await markSynced(entry.id);
      synced++;
    } catch (err) {
      console.error(`Sync failed for ${entry.table}:`, err);
      await markFailed(entry.id);
      failed++;
    }
  }

  return { synced, failed };
}

export function startSyncEngine(intervalMs = 30000): void {
  if (syncInterval) return;

  // Sync immediately
  processSyncQueue().then(r => {
    if (r.synced > 0) console.log(`[Sync] Pushed ${r.synced} records`);
  });

  // Then on interval
  syncInterval = setInterval(() => {
    processSyncQueue().then(r => {
      if (r.synced > 0) console.log(`[Sync] Pushed ${r.synced} records`);
    });
  }, intervalMs);

  // Also sync when coming back online
  window.addEventListener('online', () => {
    console.log('[Sync] Back online — syncing...');
    processSyncQueue();
  });
}

export function stopSyncEngine(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export { processSyncQueue };
