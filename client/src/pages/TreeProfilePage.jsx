import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Icon from '../components/common/Icon';
import treeService from '../services/treeService';
import growthLogService from '../services/growthLogService';
import GrowthChart from '../components/growth/GrowthChart';
import GrowthTimeline from '../components/growth/GrowthTimeline';
import GrowthEntryForm from '../components/growth/GrowthEntryForm';
import { useAuth } from '../hooks/useAuth';
import { useTreeMetrics } from '../hooks/useTreeMetrics';
import { canUserLogTree } from '../utils/permissions';
import {
  getStoredTreeById,
  saveStoredTrees,
  getStoredTreeLogs,
  saveStoredTreeLogs,
  notifyConnectionStatus,
} from '../utils/offlineStorage';

// Modular Sub-Components
import TreeProfileHero from '../components/tree/profile/TreeProfileHero';
import TreeMetricsSummary from '../components/tree/profile/TreeMetricsSummary';
import TreeActionToolbar from '../components/tree/profile/TreeActionToolbar';
import TreeQRModal from '../components/tree/profile/TreeQRModal';
import TreePhotoLightbox from '../components/tree/profile/TreePhotoLightbox';

/**
 * Tree Specimen Profile Page
 * Displays botanical taxonomy, historical growth curves, observation timeline, and action toolbar
 */
export default function TreeProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [tree, setTree] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'chart'

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Growth Metrics Hook
  const metrics = useTreeMetrics(tree, logs);

  // Immediately read from local IndexedDB cache on startup
  useEffect(() => {
    if (id) {
      getStoredTreeById(id)
        .then((cachedTree) => {
          if (cachedTree) {
            setTree(cachedTree);
            setLoading(false);
          }
        })
        .catch(() => {});

      getStoredTreeLogs(id)
        .then((cachedLogs) => {
          if (cachedLogs && cachedLogs.length > 0) {
            setLogs(cachedLogs);
          }
        })
        .catch(() => {});
    }
  }, [id]);

  // Network Fetch with useCallback to prevent cascading renders
  const fetchTreeData = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await treeService.getTreeById(id);
      const treeData = res.data;
      setTree(treeData);
      notifyConnectionStatus('online');
      saveStoredTrees([treeData]);

      // Fetch logs for this tree
      try {
        const logsRes = await growthLogService.getLogs({
          tree: treeData._id || treeData.treeId,
          limit: 100,
        });
        const treeLogs = logsRes.data || [];
        setLogs(treeLogs);
        saveStoredTreeLogs(treeData._id || id, treeLogs);
      } catch {
        // Fallback to logs already in IndexedDB
      }
    } catch (err) {
      if (!tree) {
        setError(err.response?.data?.message || err.message || 'Failed to load specimen');
      }
    } finally {
      setLoading(false);
    }
  }, [id, tree]);

  // Initial network sync
  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  // Listen for optimistic offline updates
  useEffect(() => {
    const handleTreeUpdated = async (e) => {
      const { treeId } = e.detail || {};
      if (treeId === id || tree?._id === treeId || tree?.treeId === treeId) {
        const updated = await getStoredTreeById(id);
        if (updated) setTree(updated);
        const updatedLogs = await getStoredTreeLogs(id);
        if (updatedLogs) setLogs(updatedLogs);
      }
    };
    window.addEventListener('lambo_tree_updated', handleTreeUpdated);
    return () => window.removeEventListener('lambo_tree_updated', handleTreeUpdated);
  }, [id, tree]);

  // Handle successful log submission
  const handleLogCreated = (newLog) => {
    setShowLogModal(false);
    setLogs((prev) => [newLog, ...prev]);
    fetchTreeData();
  };

  const canLog = canUserLogTree(user, tree);

  if (loading && !tree) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 space-y-3">
        <Icon name="progress_activity" className="text-3xl text-[#8B9B4C] animate-spin" />
        <span className="font-mono text-xs text-[#AAB596]">Loading specimen telemetry...</span>
      </div>
    );
  }

  if (error && !tree) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center max-w-sm mx-auto space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-700/60 flex items-center justify-center text-red-400">
          <Icon name="warning" className="text-2xl" />
        </div>
        <h2 className="font-headline-sm text-base font-bold text-[#F0F3E8]">Specimen Not Found</h2>
        <p className="font-mono text-xs text-[#AAB596]">{error}</p>
        <Link
          to="/trees"
          className="h-10 px-5 rounded-xl bg-[#8B9B4C] text-[#1F240F] font-mono text-xs font-bold inline-flex items-center gap-2"
        >
          <Icon name="arrow_back" className="text-[16px]" />
          <span>Back to Tree Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5 pb-24">
      {/* Back Link */}
      <div>
        <Link
          to="/trees"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-[#C2CE9F] hover:text-[#E4F5A6] transition-colors"
        >
          <Icon name="arrow_back" className="text-[16px]" />
          <span>Back to Specimen Directory</span>
        </Link>
      </div>

      {/* Hero Banner Component */}
      <TreeProfileHero
        tree={tree}
        vitalityColor={metrics.vitalityColor}
        onOpenPhoto={(url) => setSelectedPhoto(url)}
      />

      {/* Action Toolbar */}
      <TreeActionToolbar
        tree={tree}
        canLog={canLog}
        onOpenLogModal={() => setShowLogModal(true)}
        onOpenQRModal={() => setShowQRModal(true)}
        onOpenReminderModal={() => {}}
      />

      {/* Key Metrics Cards */}
      <TreeMetricsSummary metrics={metrics} />

      {/* Observation History Section with Tabs */}
      <div className="rounded-2xl bg-[#262C14] border border-[#525E31] p-4 sm:p-5 space-y-4">
        {/* Section Header & Tab Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#4F5A2D] pb-3">
          <div className="flex items-center gap-2">
            <Icon name="monitoring" className="text-[#8B9B4C] text-[20px]" />
            <h2 className="font-headline-sm text-base font-bold text-[#F0F3E8]">
              Growth Observation Ledger
            </h2>
          </div>

          <div className="flex items-center bg-[#1D230E] border border-[#525E31] rounded-lg p-0.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'timeline'
                  ? 'bg-[#8B9B4C] text-[#1F240F] font-bold shadow-sm'
                  : 'text-[#AAB596] hover:text-white'
              }`}
            >
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'chart'
                  ? 'bg-[#8B9B4C] text-[#1F240F] font-bold shadow-sm'
                  : 'text-[#AAB596] hover:text-white'
              }`}
            >
              Growth Chart
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'chart' ? (
          <div className="pt-2">
            <GrowthChart logs={logs} tree={tree} />
          </div>
        ) : (
          <GrowthTimeline
            logs={logs}
            tree={tree}
            onOpenPhoto={(url) => setSelectedPhoto(url)}
          />
        )}
      </div>

      {/* Modals */}
      <TreeQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        tree={tree}
      />

      <TreePhotoLightbox
        photoUrl={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />

      {showLogModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#262C14] border border-[#5D6A37] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Icon name="add_a_photo" className="text-[#8B9B4C] text-[20px]" />
                <h3 className="font-headline-sm text-base font-bold text-[#F0F3E8]">
                  Record Growth Observation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="w-7 h-7 rounded-full bg-[#30371A] border border-[#525E31] text-[#AAB596] flex items-center justify-center hover:text-white"
              >
                <Icon name="close" className="text-[16px]" />
              </button>
            </div>

            <GrowthEntryForm
              tree={tree}
              onSuccess={handleLogCreated}
              onCancel={() => setShowLogModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
