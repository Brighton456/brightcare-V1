import { useState, useEffect, useCallback } from 'react';
import { getOnlineStatus, onConnectivityChange } from '@/lib/connectivityGuard';
import { getPendingSyncs } from '@/lib/offlineStore';
import { processSyncQueue } from '@/lib/syncEngine';

export function useConnectivity() {
  const [online, setOnline] = useState(getOnlineStatus);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    const unsub = onConnectivityChange((status) => {
      setOnline(status);
      if (status) {
        // Auto-sync when coming back online
        triggerSync();
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    getPendingSyncs().then((pending) => setPendingCount(pending.length));

    const interval = setInterval(async () => {
      const pending = await getPendingSyncs();
      setPendingCount(pending.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await processSyncQueue();
      if (result.synced > 0) setLastSynced(new Date());
      const pending = await getPendingSyncs();
      setPendingCount(pending.length);
    } finally {
      setSyncing(false);
    }
  }, []);

  return { online, pendingCount, syncing, lastSynced, triggerSync };
}
