import { useState, useEffect, useCallback } from 'react';
import { getOfflineLogs, removeOfflineLog, syncOfflineQueue } from '../utils/offlineQueue';
import growthLogService from '../services/growthLogService';

/**
 * Hook for managing the client IndexedDB offline queue and sync lifecycle
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [syncFlash, setSyncFlash] = useState(false);

  const loadQueue = useCallback(async () => {
    try {
      const items = await getOfflineLogs();
      setQueue(items || []);
    } catch {
      setQueue([]);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;

    setIsSyncing(true);
    try {
      const result = await syncOfflineQueue(growthLogService);
      setLastSyncResult(result);
      if (result && result.synced > 0) {
        setSyncFlash(true);
        setTimeout(() => setSyncFlash(false), 3000);
      }
      await loadQueue();
      return result;
    } catch (err) {
      console.warn('[useOfflineQueue] Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, loadQueue]);

  const deleteQueueItem = useCallback(async (id) => {
    const success = await removeOfflineLog(id);
    if (success) {
      await loadQueue();
    }
    return success;
  }, [loadQueue]);

  useEffect(() => {
    loadQueue();

    const handleQueueChange = () => {
      loadQueue();
    };

    const handleOnline = () => {
      // Automatically attempt background sync when network is restored
      triggerSync();
    };

    window.addEventListener('lambo_offline_changed', handleQueueChange);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('lambo_offline_changed', handleQueueChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [loadQueue, triggerSync]);

  return {
    queue,
    queueCount: queue.length,
    isSyncing,
    syncFlash,
    lastSyncResult,
    loadQueue,
    triggerSync,
    deleteQueueItem,
  };
}
