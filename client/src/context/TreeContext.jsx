import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import treeService from '../services/treeService';
import growthLogService from '../services/growthLogService';
import reminderService from '../services/reminderService';
import { enqueueOfflineLog, getOfflineLogs, syncOfflineQueue } from '../utils/offlineQueue';
import { useAuth } from '../hooks/useAuth';

const TreeContext = createContext(null);

export function TreeProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [trees, setTrees] = useState([]);
  const [growthLogs, setGrowthLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [offlineCount, setOfflineCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch trees from live API whenever authenticated
  const fetchTrees = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await treeService.getTrees();
      setTrees(data.data || []);
    } catch (err) {
      console.error('[TreeContext] Failed to fetch trees:', err.message);
      setError('Failed to load trees');
      setTrees([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // 2. Fetch dashboard stats from live API
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await treeService.getTreeStats();
      setStats(data.data || null);
    } catch (err) {
      console.error('[TreeContext] Failed to fetch stats:', err.message);
    }
  }, [isAuthenticated]);

  // 3. Fetch growth logs from live API
  const fetchGrowthLogs = useCallback(async (treeId = null) => {
    if (!isAuthenticated) return;
    try {
      const params = treeId ? { tree: treeId } : {};
      const data = await growthLogService.getLogs(params);
      setGrowthLogs(data.data || []);
    } catch (err) {
      console.error('[TreeContext] Failed to fetch growth logs:', err.message);
      setGrowthLogs([]);
    }
  }, [isAuthenticated]);

  // 4. Fetch care reminders from live API
  const fetchReminders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await reminderService.getReminders();
      setReminders(data.data || []);
      // Automatically evaluate any due reminders on app activity
      reminderService.triggerDueCheck().catch(() => {});
    } catch (err) {
      console.warn('[TreeContext] Failed to fetch reminders from API:', err.message);
    }
  }, [isAuthenticated]);

  // 5. Check and update offline queue count
  const refreshOfflineCount = useCallback(async () => {
    try {
      const pending = await getOfflineLogs();
      setOfflineCount(pending.length);
    } catch (e) {
      setOfflineCount(0);
    }
  }, []);

  // 6. Synchronize offline queue when online
  const syncOffline = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    try {
      const result = await syncOfflineQueue(growthLogService);
      if (result.synced > 0) {
        await fetchTrees();
        await fetchStats();
        await fetchGrowthLogs();
      }
      await refreshOfflineCount();
      return result;
    } catch (err) {
      console.error('[TreeContext] Offline sync error:', err);
    }
  }, [fetchTrees, fetchStats, fetchGrowthLogs, refreshOfflineCount]);

  // Load trees, stats, reminders on mount or when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchTrees();
      fetchStats();
      fetchGrowthLogs();
      fetchReminders();
      refreshOfflineCount();
    } else {
      setTrees([]);
      setGrowthLogs([]);
      setStats(null);
      setReminders([]);
      setOfflineCount(0);
    }
  }, [isAuthenticated, fetchTrees, fetchStats, fetchGrowthLogs, fetchReminders, refreshOfflineCount]);

  // Listen for online status & offline queue changes
  useEffect(() => {
    const handleOnline = () => {
      console.log('[TreeContext] Connection restored. Triggering offline sync...');
      syncOffline();
    };

    const handleOfflineChanged = () => {
      refreshOfflineCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('lambo_offline_changed', handleOfflineChanged);
    window.addEventListener('lambo_offline_synced', handleOfflineChanged);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('lambo_offline_changed', handleOfflineChanged);
      window.removeEventListener('lambo_offline_synced', handleOfflineChanged);
    };
  }, [syncOffline, refreshOfflineCount]);

  const addTree = async (treeData) => {
    try {
      let payload;
      if (treeData instanceof FormData) {
        payload = treeData;
      } else {
        payload = {
          species: treeData.species,
          nickname: treeData.nickname,
          location: treeData.location,
          lat: treeData.lat || treeData.coordinates?.lat,
          lng: treeData.lng || treeData.coordinates?.lng,
          datePlanted: treeData.datePlanted,
          healthStatus: treeData.healthStatus,
          currentStage: treeData.currentStage,
          initialHeight: treeData.height || treeData.initialHeight,
          initialStemDiameter: treeData.stemDiameter || treeData.initialStemDiameter,
          initialLeafCount: treeData.leafCount || treeData.initialLeafCount,
          notes: treeData.notes,
          photoUrl: treeData.photo || treeData.photoUrl,
        };
      }

      const data = await treeService.createTree(payload);
      await fetchTrees();
      await fetchStats();
      return data.data;
    } catch (err) {
      console.error('[TreeContext] Failed to create tree:', err);
      throw err;
    }
  };

  const addGrowthLog = async (logData) => {
    // If device is offline, route directly to IndexedDB offline queue
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineEntry = await enqueueOfflineLog(logData);
      await refreshOfflineCount();
      return { ...offlineEntry, isOffline: true };
    }

    try {
      let payload;
      if (logData instanceof FormData) {
        payload = logData;
      } else {
        payload = {
          tree: logData.treeId || logData.tree,
          height: logData.height,
          stemDiameter: logData.stemDiameter,
          leafCount: logData.leafCount,
          fruitCount: logData.fruitCount,
          growthStage: logData.growthStage,
          healthStatus: logData.healthStatus,
          notes: logData.notes,
          loggedAt: logData.loggedAt,
          photo: logData.photo,
        };
      }

      const data = await growthLogService.createLog(payload);
      await fetchTrees();
      await fetchStats();
      await fetchGrowthLogs();
      return data.data;
    } catch (err) {
      // If network fails unexpectedly while logging, fallback gracefully to offline queue
      if (!navigator.onLine || err.message === 'Network Error' || !err.response) {
        console.warn('[TreeContext] Network unavailable during submit. Storing offline:', err.message);
        const offlineEntry = await enqueueOfflineLog(logData);
        await refreshOfflineCount();
        return { ...offlineEntry, isOffline: true };
      }
      console.error('[TreeContext] Failed to create growth log:', err);
      throw err;
    }
  };

  const getTreeById = (treeId) => {
    return (
      trees.find(
        (t) =>
          t.treeId?.toLowerCase() === String(treeId).toLowerCase() ||
          t._id === treeId
      ) || null
    );
  };

  const getTreeLogs = (treeId) => {
    return growthLogs.filter((l) => {
      const logTreeId = l.tree?.treeId || l.treeId || '';
      return logTreeId.toLowerCase() === String(treeId).toLowerCase();
    });
  };

  const toggleReminder = async (id) => {
    const target = reminders.find((r) => r._id === id || r.id === id);
    if (!target) return;
    const newCompleted = !target.completed;

    // Optimistic UI update
    setReminders((prev) =>
      prev.map((r) =>
        r._id === id || r.id === id ? { ...r, completed: newCompleted } : r
      )
    );

    try {
      const dbId = target._id || (id && !String(id).startsWith('r_') ? id : null);
      if (dbId) {
        const res = await reminderService.updateReminder(dbId, {
          completed: newCompleted,
        });
        if (res.data) {
          setReminders((prev) =>
            prev.map((r) => (r._id === dbId ? res.data : r))
          );
        }
      }
    } catch (err) {
      console.error('[TreeContext] Failed to update reminder status on server:', err);
    }
  };

  const addReminder = async (remData) => {
    try {
      const res = await reminderService.createReminder(remData);
      const created = res.data;
      setReminders((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.warn('[TreeContext] Server reminder creation failed, using local fallback:', err.message);
      const fallback = {
        _id: `r_${Date.now()}`,
        id: `r_${Date.now()}`,
        completed: false,
        ...remData,
      };
      setReminders((prev) => [fallback, ...prev]);
      return fallback;
    }
  };

  const deleteReminder = async (id) => {
    setReminders((prev) => prev.filter((r) => r._id !== id && r.id !== id));
    try {
      const dbId = id && !String(id).startsWith('r_') ? id : null;
      if (dbId) {
        await reminderService.deleteReminder(dbId);
      }
    } catch (err) {
      console.error('[TreeContext] Failed to delete reminder from server:', err);
    }
  };

  return (
    <TreeContext.Provider
      value={{
        trees,
        growthLogs,
        stats,
        reminders,
        offlineCount,
        loading,
        error,
        addTree,
        addGrowthLog,
        getTreeById,
        getTreeLogs,
        toggleReminder,
        addReminder,
        deleteReminder,
        syncOffline,
        refreshTrees: fetchTrees,
        refreshStats: fetchStats,
        refreshLogs: fetchGrowthLogs,
        refreshReminders: fetchReminders,
      }}
    >
      {children}
    </TreeContext.Provider>
  );
}

export function useTrees() {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error('useTrees must be used within a TreeProvider');
  }
  return context;
}
