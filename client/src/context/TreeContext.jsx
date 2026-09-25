import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import treeService from '../services/treeService';
import growthLogService from '../services/growthLogService';
import { useAuth } from '../hooks/useAuth';

const TreeContext = createContext(null);

export function TreeProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [trees, setTrees] = useState([]);
  const [growthLogs, setGrowthLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch trees from live API whenever authenticated
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

  // Fetch dashboard stats from live API
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await treeService.getTreeStats();
      setStats(data.data || null);
    } catch (err) {
      console.error('[TreeContext] Failed to fetch stats:', err.message);
    }
  }, [isAuthenticated]);

  // Fetch growth logs from live API
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

  // Load trees + stats on mount or when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchTrees();
      fetchStats();
      fetchGrowthLogs();
    } else {
      setTrees([]);
      setGrowthLogs([]);
      setStats(null);
      setReminders([]);
    }
  }, [isAuthenticated, fetchTrees, fetchStats, fetchGrowthLogs]);

  const addTree = async (treeData) => {
    try {
      // Support FormData for photo uploads
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
      // Refresh the list
      await fetchTrees();
      await fetchStats();
      return data.data;
    } catch (err) {
      console.error('[TreeContext] Failed to create tree:', err);
      throw err;
    }
  };

  const addGrowthLog = async (logData) => {
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
      // Refresh lists
      await fetchTrees();
      await fetchStats();
      await fetchGrowthLogs();
      return data.data;
    } catch (err) {
      console.error('[TreeContext] Failed to create growth log:', err);
      throw err;
    }
  };

  const getTreeById = (treeId) => {
    return trees.find(
      (t) => t.treeId?.toLowerCase() === String(treeId).toLowerCase() ||
             t._id === treeId
    ) || null;
  };

  const getTreeLogs = (treeId) => {
    return growthLogs.filter(
      (l) => {
        const logTreeId = l.tree?.treeId || l.treeId || '';
        return logTreeId.toLowerCase() === String(treeId).toLowerCase();
      }
    );
  };

  const toggleReminder = (id) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const addReminder = (remData) => {
    const newRem = {
      id: `r_${Date.now()}`,
      completed: false,
      ...remData,
    };
    setReminders((prev) => [newRem, ...prev]);
    return newRem;
  };

  return (
    <TreeContext.Provider
      value={{
        trees,
        growthLogs,
        stats,
        reminders,
        loading,
        error,
        addTree,
        addGrowthLog,
        getTreeById,
        getTreeLogs,
        toggleReminder,
        addReminder,
        refreshTrees: fetchTrees,
        refreshStats: fetchStats,
        refreshLogs: fetchGrowthLogs,
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
