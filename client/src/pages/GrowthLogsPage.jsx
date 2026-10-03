import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import treeService from '../services/treeService';
import growthLogService from '../services/growthLogService';
import GrowthChart from '../components/growth/GrowthChart';
import GrowthTimeline from '../components/growth/GrowthTimeline';
import GrowthEntryForm from '../components/growth/GrowthEntryForm';
import LogsToolbar from '../components/growth/LogsToolbar';
import LogsSpecimenCard from '../components/growth/LogsSpecimenCard';
import { exportGrowthLogsToExcel } from '../components/growth/GrowthLogExport';
import { canUserLogTree } from '../utils/permissions';
import Icon from '../components/common/Icon';

import {
  getStoredTrees,
  getStoredTreeLogs,
  saveStoredTrees,
  saveStoredTreeLogs,
  notifyConnectionStatus,
} from '../utils/offlineStorage';

export default function GrowthLogsPage() {
  const { id: paramTreeId } = useParams();
  const [searchParams] = useSearchParams();
  const queryTreeId = searchParams.get('tree');
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;

  const [trees, setTrees] = useState([]);
  const [selectedTreeId, setSelectedTreeId] = useState(paramTreeId || queryTreeId || '');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & export feedback
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState(null);

  // Strictly prevent duplicate entries
  const deduplicateLogs = (rawLogs) => {
    if (!Array.isArray(rawLogs)) return [];
    const seenIds = new Set();
    const seenSignatures = new Set();
    return rawLogs.filter((l) => {
      if (!l) return false;
      const id = String(l._id || l.id || '');
      if (id && seenIds.has(id)) return false;
      if (id) seenIds.add(id);

      const timeKey = l.loggedAt ? Math.floor(new Date(l.loggedAt).getTime() / 30000) : '';
      const sig = `${l.tree?._id || l.tree || ''}_${l.height}_${l.notes || ''}_${timeKey}`;
      if (seenSignatures.has(sig)) return false;
      seenSignatures.add(sig);

      return true;
    });
  };

  // 1. Fetch available trees with offline fallback
  const loadTrees = useCallback(async () => {
    const cachedTrees = await getStoredTrees();
    if (cachedTrees && cachedTrees.length > 0) {
      setTrees(cachedTrees);
      if (!selectedTreeId) {
        setSelectedTreeId(cachedTrees[0].treeId);
      }
    }

    try {
      const res = await treeService.getTrees({ all: 'true', limit: 100 });
      const treeList = res.data || [];
      if (treeList.length > 0) {
        setTrees(treeList);
        saveStoredTrees(treeList);
        notifyConnectionStatus('online');
      }

      if (!selectedTreeId && treeList.length > 0) {
        setSelectedTreeId(treeList[0].treeId);
      } else if (paramTreeId) {
        const found = treeList.find(
          (t) =>
            t.treeId?.toLowerCase() === paramTreeId.toLowerCase() ||
            t._id === paramTreeId
        );
        if (found) setSelectedTreeId(found.treeId);
      }
    } catch (err) {
      console.warn('[GrowthLogsPage] Network unavailable, relying on IndexedDB:', err.message);
      notifyConnectionStatus('offline');
      if (!cachedTrees || cachedTrees.length === 0) {
        const fallback = await getStoredTrees();
        if (fallback && fallback.length > 0) {
          setTrees(fallback);
          if (!selectedTreeId) setSelectedTreeId(fallback[0].treeId);
        }
      }
    }
  }, [paramTreeId, selectedTreeId]);

  // 2. Fetch logs for current selected tree or all logs
  const loadLogs = useCallback(async (treeIdTarget) => {
    setLoading(true);
    setError(null);

    if (treeIdTarget) {
      const cached = await getStoredTreeLogs(treeIdTarget);
      if (cached && cached.length > 0) {
        setLogs(deduplicateLogs(cached));
        setLoading(false);
      }
    }

    try {
      const params = treeIdTarget ? { tree: treeIdTarget, limit: 100 } : { limit: 100 };
      const res = await growthLogService.getLogs(params);
      const fetchedLogs = deduplicateLogs(res.data || []);
      setLogs(fetchedLogs);
      notifyConnectionStatus('online');
      if (treeIdTarget && fetchedLogs.length > 0) {
        saveStoredTreeLogs(treeIdTarget, fetchedLogs);
      }
    } catch (err) {
      console.warn('[GrowthLogsPage] Error loading live logs, checking IndexedDB:', err.message);
      notifyConnectionStatus('offline');
      if (treeIdTarget) {
        const cached = await getStoredTreeLogs(treeIdTarget);
        if (cached && cached.length > 0) {
          setLogs(deduplicateLogs(cached));
          setError(null);
          return;
        }
      }
      setError('Unable to retrieve growth telemetry logs. Connect to campus network to sync.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for optimistic offline log updates
  useEffect(() => {
    const handleTreeUpdated = async (e) => {
      const { treeId } = e.detail || {};
      if (!selectedTreeId || treeId === selectedTreeId) {
        const updatedLogs = await getStoredTreeLogs(selectedTreeId || treeId);
        if (updatedLogs && updatedLogs.length > 0) {
          setLogs(deduplicateLogs(updatedLogs));
        }
      }
    };
    window.addEventListener('lambo_tree_updated', handleTreeUpdated);
    return () => window.removeEventListener('lambo_tree_updated', handleTreeUpdated);
  }, [selectedTreeId]);

  useEffect(() => {
    loadTrees();
  }, [loadTrees]);

  useEffect(() => {
    if (selectedTreeId) {
      loadLogs(selectedTreeId);
    } else {
      loadLogs(null);
    }
  }, [selectedTreeId, loadLogs]);

  const activeTree = useMemo(() => {
    return trees.find(
      (t) =>
        t.treeId?.toLowerCase() === String(selectedTreeId).toLowerCase() ||
        t._id === selectedTreeId
    ) || null;
  }, [trees, selectedTreeId]);

  // Telemetry metric calculations
  const telemetryStats = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        heightGain: '0.0',
        percentGain: '0.0',
        durationDays: 0,
        totalAudits: 0,
        latestHeight: 0,
        latestDBH: '—',
      };
    }

    const sorted = [...logs].sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));
    const firstLog = sorted[0];
    const latestLog = sorted[sorted.length - 1];

    const baselineHeight =
      activeTree?.initialHeight || activeTree?.height || firstLog.height || 0;
    const currentHeight = latestLog.height || baselineHeight;
    const gain = currentHeight - baselineHeight;
    const percent = baselineHeight > 0 ? (gain / baselineHeight) * 100 : 0;

    const firstDate = new Date(activeTree?.datePlanted || firstLog.loggedAt);
    const lastDate = new Date(latestLog.loggedAt);
    const diffTime = Math.abs(lastDate - firstDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      heightGain: gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1),
      percentGain: percent > 0 ? `+${percent.toFixed(1)}%` : `${percent.toFixed(1)}%`,
      durationDays: diffDays || 1,
      totalAudits: logs.length,
      latestHeight: currentHeight,
      latestDBH: latestLog.stemDiameter || '—',
    };
  }, [logs, activeTree]);

  // Handle Export to Excel
  const handleExportExcel = () => {
    if (exporting || logs.length === 0) return;
    setExporting(true);
    setExportNotice('exporting');
    try {
      exportGrowthLogsToExcel(logs, activeTree, selectedTreeId);
      setExportNotice('success');
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err) {
      console.error('[GrowthLogsPage] Export error:', err);
      setExportNotice('error');
      setTimeout(() => setExportNotice(null), 4000);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      await growthLogService.deleteLog(logId);
      loadLogs(selectedTreeId);
    } catch (err) {
      console.error('[GrowthLogsPage] Delete log error:', err);
      alert(err.response?.data?.message || 'Failed to remove log entry.');
    }
  };

  return (
    <>
      <div className="space-y-5 pb-20">
        <LogsToolbar
          onRecordEntry={() => setShowLogModal(true)}
          onExportExcel={handleExportExcel}
          exporting={exporting}
          hasLogs={logs.length > 0}
          exportNotice={exportNotice}
          error={error}
        />

        <LogsSpecimenCard
          trees={trees}
          selectedTreeId={selectedTreeId}
          onSelectTreeId={setSelectedTreeId}
          activeTree={activeTree}
          telemetryStats={telemetryStats}
        />

        {/* Interactive Growth Trend Vector Chart */}
        <GrowthChart logs={logs} initialTree={activeTree} />

        {/* Historical Field Entries Observation Ledger */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-[#262C14] rounded w-48 border border-[#4F5A2D]" />
            <div className="h-32 bg-[#262C14] rounded-2xl border border-[#4F5A2D]" />
            <div className="h-32 bg-[#262C14] rounded-2xl border border-[#4F5A2D]" />
          </div>
        ) : (
          <GrowthTimeline
            logs={logs}
            onDeleteLog={handleDeleteLog}
            onEditLog={(log) => {
              setEditingLog(log);
              setShowLogModal(true);
            }}
            currentUser={user}
            currentUserId={currentUserId}
            tree={activeTree}
          />
        )}

        {/* Sticky Bottom Ergonomic Field Action CTA */}
        <div className="sticky bottom-20 z-30 pt-2 pb-1">
          {canUserLogTree(user, activeTree) ? (
            <button
              type="button"
              onClick={() => {
                setEditingLog(null);
                setShowLogModal(true);
              }}
              className="w-full h-12 bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform font-mono text-xs font-bold uppercase tracking-wider border border-[#A4B566] cursor-pointer"
            >
              <Icon name="straighten" className="text-[20px]" />
              <span>+ Record Measurement Entry</span>
            </button>
          ) : (
            <div className="w-full py-3 px-4 rounded-xl bg-[#1D230E] border border-[#525E31]/50 text-center font-mono text-xs text-[#AAB596] flex items-center justify-center gap-2 shadow-md">
              <Icon name="lock" className="text-[16px] text-[#8B9B4C]" />
              <span>Growth telemetry entries restricted to specimen caretaker</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New / Edit Observation Entry */}
      {showLogModal && (
        <GrowthEntryForm
          tree={activeTree}
          trees={trees}
          editingLog={editingLog}
          onClose={() => {
            setShowLogModal(false);
            setEditingLog(null);
          }}
          onSuccess={() => {
            setShowLogModal(false);
            setEditingLog(null);
            loadLogs(selectedTreeId);
          }}
        />
      )}
    </>
  );
}
