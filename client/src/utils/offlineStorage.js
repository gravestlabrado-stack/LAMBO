/**
 * LAMBO Offline Storage Engine
 * High-capacity IndexedDB persistence layer for zero-network operation.
 * Manages specimen catalogues, individual profiles, historical logs, officer rosters, and offline queues.
 */

const DB_NAME = 'lambo_offline_db';
const DB_VERSION = 2;

export const STORES = {
  LOGS_QUEUE: 'growth_logs_queue',
  TREES: 'trees',
  TREE_LOGS: 'tree_logs',
  OFFICER_DATA: 'officer_data',
  APP_META: 'app_meta',
};

/**
 * Dispatch storage activity event for header indicator animation
 */
export function notifyStorageActivity(action = 'saving') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lambo_storage_activity', { detail: { action } }));
  }
}

/**
 * Dispatch global connectivity status
 */
export function notifyConnectionStatus(status = 'online') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lambo_connection_status', { detail: { status } }));
  }
}

/**
 * Open or upgrade the IndexedDB database
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported in this environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Growth logs submission queue
      if (!db.objectStoreNames.contains(STORES.LOGS_QUEUE)) {
        db.createObjectStore(STORES.LOGS_QUEUE, { keyPath: 'id' });
      }

      // 2. Full specimen catalogue
      if (!db.objectStoreNames.contains(STORES.TREES)) {
        const treeStore = db.createObjectStore(STORES.TREES, { keyPath: '_id' });
        treeStore.createIndex('treeId', 'treeId', { unique: false });
        treeStore.createIndex('owner', 'owner', { unique: false });
      }

      // 3. Historical logs per specimen
      if (!db.objectStoreNames.contains(STORES.TREE_LOGS)) {
        const logStore = db.createObjectStore(STORES.TREE_LOGS, { keyPath: '_id' });
        logStore.createIndex('tree', 'tree', { unique: false });
      }

      // 4. Officer roster, macro stats, and inspection records
      if (!db.objectStoreNames.contains(STORES.OFFICER_DATA)) {
        db.createObjectStore(STORES.OFFICER_DATA, { keyPath: 'key' });
      }

      // 5. General metadata & sync timestamps
      if (!db.objectStoreNames.contains(STORES.APP_META)) {
        db.createObjectStore(STORES.APP_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// -------------------------------------------------------------
// SPECIMEN CATALOGUE (TREES) STORAGE
// -------------------------------------------------------------

/**
 * Bulk save trees into IndexedDB
 */
export async function saveStoredTrees(treeList) {
  if (!Array.isArray(treeList) || treeList.length === 0) return;
  notifyStorageActivity('saving');
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.TREES, 'readwrite');
    const store = tx.objectStore(STORES.TREES);

    for (const tree of treeList) {
      if (tree && tree._id) {
        store.put(tree);
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        // Also keep light fallback in localStorage
        try {
          localStorage.setItem('lambo_cached_trees_count', String(treeList.length));
        } catch {}
        setTimeout(() => notifyStorageActivity('saved'), 700);
        resolve(true);
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[OfflineStorage] Error saving trees to IndexedDB:', err);
  }
}

/**
 * Retrieve all trees from IndexedDB
 */
export async function getStoredTrees() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TREES, 'readonly');
      const store = tx.objectStore(STORES.TREES);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineStorage] Error loading trees from IndexedDB:', err);
    return [];
  }
}

/**
 * Retrieve single tree by Mongo _id OR by custom treeId (e.g. #LMB-001)
 */
export async function getStoredTreeById(idOrTreeId) {
  if (!idOrTreeId) return null;
  const cleanId = String(idOrTreeId).trim();

  try {
    const db = await openDB();

    // 1. Try direct primary key lookup (_id)
    const directMatch = await new Promise((resolve) => {
      const tx = db.transaction(STORES.TREES, 'readonly');
      const store = tx.objectStore(STORES.TREES);
      const req = store.get(cleanId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (directMatch) return directMatch;

    // 2. Try index lookup on treeId
    const indexMatch = await new Promise((resolve) => {
      const tx = db.transaction(STORES.TREES, 'readonly');
      const store = tx.objectStore(STORES.TREES);
      const index = store.index('treeId');
      const req = index.get(cleanId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (indexMatch) return indexMatch;

    // 3. Fallback scan across all trees in case casing or formatting differs
    const all = await getStoredTrees();
    return all.find((t) =>
      String(t._id) === cleanId ||
      String(t.treeId).toLowerCase() === cleanId.toLowerCase()
    ) || null;
  } catch (err) {
    console.warn('[OfflineStorage] Error getting tree by ID:', err);
    return null;
  }
}

// -------------------------------------------------------------
// HISTORICAL LOGS STORAGE
// -------------------------------------------------------------

/**
 * Save observation logs for a specific specimen
 */
export async function saveStoredTreeLogs(treeId, logsList) {
  if (!treeId || !Array.isArray(logsList)) return;
  const cleanId = String(treeId).trim();
  notifyStorageActivity('saving');
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.TREE_LOGS, 'readwrite');
    const store = tx.objectStore(STORES.TREE_LOGS);

    // Prune stale or duplicate logs for this tree that are not in the new incoming list
    const incomingIds = new Set(logsList.map((l) => String(l._id || l.id)).filter(Boolean));
    const req = store.getAll();
    req.onsuccess = () => {
      const existing = req.result || [];
      for (const item of existing) {
        const itemTree = typeof item.tree === 'object' ? item.tree?._id || item.tree?.treeId : item.tree;
        if ((String(itemTree) === cleanId || String(item.treeId) === cleanId) && !incomingIds.has(String(item._id))) {
          store.delete(item._id);
        }
      }
    };

    for (const log of logsList) {
      if (log && log._id) {
        store.put(log);
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        setTimeout(() => notifyStorageActivity('saved'), 700);
        resolve(true);
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[OfflineStorage] Error saving tree logs:', err);
  }
}

/**
 * Retrieve cached observation logs for a specific specimen
 */
export async function getStoredTreeLogs(treeId) {
  if (!treeId) return [];
  const cleanId = String(treeId).trim();

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TREE_LOGS, 'readonly');
      const store = tx.objectStore(STORES.TREE_LOGS);
      const req = store.getAll();

      req.onsuccess = () => {
        const allLogs = req.result || [];
        const seenIds = new Set();
        const seenSignatures = new Set();

        const filtered = allLogs.filter((l) => {
          if (!l) return false;
          const lTree = typeof l.tree === 'object' ? l.tree?._id || l.tree?.treeId : l.tree;
          const matches = String(lTree) === cleanId || String(l.treeId) === cleanId;
          if (!matches) return false;

          const id = String(l._id || l.id || '');
          if (id && seenIds.has(id)) return false;
          if (id) seenIds.add(id);

          const timeKey = l.loggedAt ? Math.floor(new Date(l.loggedAt).getTime() / 30000) : '';
          const sig = `${l.height}_${l.notes || ''}_${timeKey}`;
          if (seenSignatures.has(sig)) return false;
          seenSignatures.add(sig);

          return true;
        });
        filtered.sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));
        resolve(filtered);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineStorage] Error loading logs from IndexedDB:', err);
    return [];
  }
}

// -------------------------------------------------------------
// OFFICER DATA STORAGE
// -------------------------------------------------------------

/**
 * Cache officer roster
 */
export async function saveOfficerRoster(roster) {
  if (!Array.isArray(roster)) return;
  notifyStorageActivity('saving');
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.OFFICER_DATA, 'readwrite');
    const store = tx.objectStore(STORES.OFFICER_DATA);
    store.put({ key: 'roster', data: roster, cachedAt: new Date().toISOString() });
    return new Promise((resolve) => {
      tx.oncomplete = () => {
        setTimeout(() => notifyStorageActivity('saved'), 700);
        resolve(true);
      };
    });
  } catch (err) {
    console.warn('[OfflineStorage] Failed to cache officer roster:', err);
  }
}

/**
 * Get cached officer roster
 */
export async function getStoredOfficerRoster() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.OFFICER_DATA, 'readonly');
      const store = tx.objectStore(STORES.OFFICER_DATA);
      const req = store.get('roster');
      req.onsuccess = () => resolve(req.result?.data || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Cache officer summary stats
 */
export async function saveOfficerStats(stats) {
  if (!stats) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.OFFICER_DATA, 'readwrite');
    const store = tx.objectStore(STORES.OFFICER_DATA);
    store.put({ key: 'stats', data: stats, cachedAt: new Date().toISOString() });
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  } catch (err) {
    console.warn('[OfflineStorage] Failed to cache officer stats:', err);
  }
}

/**
 * Get cached officer summary stats
 */
export async function getStoredOfficerStats() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.OFFICER_DATA, 'readonly');
      const store = tx.objectStore(STORES.OFFICER_DATA);
      const req = store.get('stats');
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Cache cadet inspection details
 */
export async function saveCadetDetails(cadetId, details) {
  if (!cadetId || !details) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.OFFICER_DATA, 'readwrite');
    const store = tx.objectStore(STORES.OFFICER_DATA);
    store.put({ key: `cadet_${cadetId}`, data: details, cachedAt: new Date().toISOString() });
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  } catch (err) {
    console.warn('[OfflineStorage] Failed to cache cadet details:', err);
  }
}

/**
 * Get cached cadet inspection details
 */
export async function getStoredCadetDetails(cadetId) {
  if (!cadetId) return null;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.OFFICER_DATA, 'readonly');
      const store = tx.objectStore(STORES.OFFICER_DATA);
      const req = store.get(`cadet_${cadetId}`);
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// OPTIMISTIC OFFLINE UPDATES
// -------------------------------------------------------------

/**
 * Immediately apply an offline observation to the local cached tree and timeline
 */
export async function applyOptimisticLog(logData) {
  if (!logData) return;
  notifyStorageActivity('saving');
  const targetId = logData.tree || logData.treeId;

  try {
    const tree = await getStoredTreeById(targetId);
    if (tree) {
      // 1. Update tree metrics optimistically
      if (logData.height) tree.height = parseFloat(logData.height);
      if (logData.stemDiameter) tree.stemDiameter = parseFloat(logData.stemDiameter);
      if (logData.leafCount) tree.leafCount = parseInt(logData.leafCount, 10);
      if (logData.fruitCount) tree.fruitCount = parseInt(logData.fruitCount, 10);
      if (logData.growthStage) tree.currentStage = logData.growthStage;
      if (logData.healthStatus) tree.healthStatus = logData.healthStatus;

      // Append photo if provided as base64 data URL
      if (logData.photo && typeof logData.photo === 'string') {
        if (!tree.photos) tree.photos = [];
        tree.photos.unshift({
          url: logData.photo,
          caption: `${logData.growthStage || 'Field'} Observation (Pending Sync)`,
          uploadedAt: new Date().toISOString(),
        });
      }

      await saveStoredTrees([tree]);
    }

    // 2. Insert optimistic log into tree_logs store
    const optimisticLog = {
      _id: `temp_log_${Date.now()}`,
      tree: targetId,
      height: parseFloat(logData.height) || 0,
      stemDiameter: logData.stemDiameter ? parseFloat(logData.stemDiameter) : undefined,
      leafCount: logData.leafCount ? parseInt(logData.leafCount, 10) : undefined,
      fruitCount: logData.fruitCount ? parseInt(logData.fruitCount, 10) : undefined,
      growthStage: logData.growthStage || 'Sapling',
      healthStatus: logData.healthStatus || 'Thriving / Healthy',
      notes: logData.notes || '',
      photo: logData.photo || null,
      loggedAt: logData.loggedAt || new Date().toISOString(),
      isPendingSync: true,
    };

    const db = await openDB();
    const tx = db.transaction(STORES.TREE_LOGS, 'readwrite');
    tx.objectStore(STORES.TREE_LOGS).put(optimisticLog);

    await new Promise((resolve) => {
      tx.oncomplete = () => {
        setTimeout(() => notifyStorageActivity('saved'), 700);
        window.dispatchEvent(
          new CustomEvent('lambo_tree_updated', {
            detail: { treeId: targetId, log: optimisticLog, tree },
          })
        );
        resolve(true);
      };
    });
  } catch (err) {
    console.warn('[OfflineStorage] Error applying optimistic log:', err);
  }
}
