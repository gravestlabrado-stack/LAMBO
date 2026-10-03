import { openDB, applyOptimisticLog, STORES } from './offlineStorage';

const STORE_NAME = STORES.LOGS_QUEUE;

/**
 * Store a new growth log observation into IndexedDB offline queue and apply optimistic local updates
 */
export async function enqueueOfflineLog(logData) {
  const db = await openDB();
  const entryId = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Convert File to base64 if present so it can be serialized into IndexedDB
  let serializedPhoto = logData.photo;
  if (logData.photo instanceof File) {
    serializedPhoto = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(logData.photo);
    });
  }

  const record = {
    id: entryId,
    tree: logData.tree,
    treeId: logData.treeId,
    height: logData.height,
    stemDiameter: logData.stemDiameter,
    leafCount: logData.leafCount,
    fruitCount: logData.fruitCount,
    growthStage: logData.growthStage,
    healthStatus: logData.healthStatus,
    notes: logData.notes,
    photo: serializedPhoto,
    loggedAt: logData.loggedAt || new Date().toISOString(),
    queuedAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);

    req.onsuccess = async () => {
      // Optimistically update the cached specimen and timeline in IndexedDB
      try {
        await applyOptimisticLog(record);
      } catch (e) {
        console.warn('[OfflineQueue] Non-fatal optimistic update warning:', e);
      }

      // Notify application listeners that an offline record was enqueued
      window.dispatchEvent(new CustomEvent('lambo_offline_changed', { detail: { action: 'enqueue', record } }));
      resolve(record);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all queued offline growth log entries
 */
export async function getOfflineLogs() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineQueue] Failed to load offline logs:', err.message);
    return [];
  }
}

/**
 * Delete a synchronized log entry from IndexedDB
 */
export async function removeOfflineLog(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => {
        window.dispatchEvent(new CustomEvent('lambo_offline_changed', { detail: { action: 'remove', id } }));
        resolve(true);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineQueue] Failed to remove offline log:', err.message);
    return false;
  }
}

let isSyncInProgress = false;

/**
 * Synchronize all queued offline growth entries with the backend server
 */
export async function syncOfflineQueue(growthLogService) {
  if (isSyncInProgress) {
    const pending = (await getOfflineLogs()).length;
    return { synced: 0, failed: 0, pending };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0, pending: (await getOfflineLogs()).length };
  }

  isSyncInProgress = true;
  try {
    const logs = await getOfflineLogs();
    if (!logs || logs.length === 0) {
      return { synced: 0, failed: 0, pending: 0 };
    }

  let synced = 0;
  let failed = 0;

  for (const log of logs) {
    try {
      // Reconstitute payload
      let payload;
      if (log.photo && typeof log.photo === 'string' && log.photo.startsWith('data:image')) {
        // Convert base64 data URL to Blob/File for FormData
        const response = await fetch(log.photo);
        const blob = await response.blob();
        const file = new File([blob], `offline_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

        payload = new FormData();
        payload.append('tree', log.tree || log.treeId);
        payload.append('height', log.height);
        if (log.stemDiameter) payload.append('stemDiameter', log.stemDiameter);
        if (log.leafCount) payload.append('leafCount', log.leafCount);
        if (log.fruitCount) payload.append('fruitCount', log.fruitCount);
        if (log.growthStage) payload.append('growthStage', log.growthStage);
        if (log.healthStatus) payload.append('healthStatus', log.healthStatus);
        if (log.notes) payload.append('notes', log.notes);
        if (log.loggedAt) payload.append('loggedAt', log.loggedAt);
        payload.append('photo', file);
      } else {
        payload = {
          tree: log.tree || log.treeId,
          height: log.height,
          stemDiameter: log.stemDiameter,
          leafCount: log.leafCount,
          fruitCount: log.fruitCount,
          growthStage: log.growthStage,
          healthStatus: log.healthStatus,
          notes: log.notes,
          loggedAt: log.loggedAt,
        };
      }

      await growthLogService.createLog(payload);
      await removeOfflineLog(log.id);
      synced++;
    } catch (err) {
      console.error('[OfflineQueue] Sync failed for record:', log.id, err);
      failed++;
    }
  }

      window.dispatchEvent(
        new CustomEvent('lambo_offline_synced', {
          detail: { synced, failed, remaining: logs.length - synced },
        })
      );

      return { synced, failed, remaining: logs.length - synced };
    } finally {
      isSyncInProgress = false;
    }
  }
