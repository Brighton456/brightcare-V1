/**
 * Brightcare — Offline-Aware Query Hook
 * Wraps Supabase queries with automatic offline fallback via IndexedDB
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeQuery, safeMutation } from '@/lib/connectivityGuard';
import { offlineBulkPut } from '@/lib/offlineStore';

type StoreName = 'patients' | 'medicines' | 'pharmacy_sales' | 'pharmacy_sale_items' |
  'consultations' | 'prescriptions' | 'prescription_items' | 'lab_tests' |
  'bills' | 'bill_items' | 'staff' | 'appointments' | 'admissions' |
  'beds' | 'wards' | 'vitals_records' | 'nursing_notes' | 'notifications';

interface UseOfflineQueryOptions {
  table: StoreName;
  hospitalId?: string | null;
  enabled?: boolean;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
}

const EMPTY_FILTERS: Record<string, any> = {};

export function useOfflineQuery<T = any>({
  table,
  hospitalId,
  enabled = true,
  orderBy = 'created_at',
  ascending = false,
  filters = EMPTY_FILTERS,
}: UseOfflineQueryOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filtersKey = JSON.stringify(filters);
  const stableFilters = useMemo(() => filters, [filtersKey]);
  const filterAndSortItems = useCallback((items: T[]) => {
    const filtered = items.filter((item: any) => {
      if (hospitalId && item?.hospital_id && item.hospital_id !== hospitalId) return false;
      return Object.entries(stableFilters).every(([key, value]) => item?.[key] === value);
    });

    return [...filtered].sort((a: any, b: any) => {
      const aValue = a?.[orderBy];
      const bValue = b?.[orderBy];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return ascending ? -1 : 1;
      if (bValue == null) return ascending ? 1 : -1;
      if (aValue === bValue) return 0;

      return ascending
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
  }, [ascending, stableFilters, hospitalId, orderBy]);

  const fetch = useCallback(async () => {
    if (!enabled || !hospitalId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const result = await safeQuery<T[]>(table, async () => {
      let query: any = supabase.from(table).select('*').eq('hospital_id', hospitalId);
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
      query = query.order(orderBy, { ascending });
      const res = await query;
      return res;
    });

    setOffline(result.offline);
    if (result.error) {
      setError(result.error.message || 'Query failed');
      setData([]);
    } else {
      const items = filterAndSortItems((result.data || []) as T[]);
      setData(items);
      // Cache to IndexedDB for offline use
      if (!result.offline && items.length > 0) {
        try { await offlineBulkPut(table, items as any); } catch {}
      }
    }
    setLoading(false);
  }, [table, hospitalId, enabled, filterAndSortItems]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, offline, error, refetch: fetch };
}

export function useOfflineMutation(table: StoreName) {
  const [loading, setLoading] = useState(false);
  const [queued, setQueued] = useState(false);

  const mutate = useCallback(async (
    operation: 'insert' | 'update' | 'delete',
    data: any,
    mutationFn: () => Promise<{ data: any; error: any }>
  ) => {
    setLoading(true);
    setQueued(false);
    const result = await safeMutation(table, operation, data, mutationFn);
    setQueued(result.queued);
    setLoading(false);
    return result;
  }, [table]);

  return { mutate, loading, queued };
}
