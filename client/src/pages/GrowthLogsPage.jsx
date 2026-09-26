import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuth } from '../hooks/useAuth';
import treeService from '../services/treeService';
import growthLogService from '../services/growthLogService';
import GrowthChart from '../components/growth/GrowthChart';
import GrowthTimeline from '../components/growth/GrowthTimeline';
import GrowthEntryForm from '../components/growth/GrowthEntryForm';
import { formatDate } from '../utils/formatters';
import { canUserLogTree } from '../utils/permissions';

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

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [exporting, setExporting] = useState(false);

  // 1. Fetch available trees
  const loadTrees = useCallback(async () => {
    try {
      const res = await treeService.getTrees({ all: 'true', limit: 100 });
      const treeList = res.data || [];
      setTrees(treeList);

      // Determine active tree
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
      console.error('[GrowthLogsPage] Error loading trees:', err);
    }
  }, [paramTreeId, selectedTreeId]);

  // 2. Fetch logs for current selected tree or all logs
  const loadLogs = useCallback(async (treeIdTarget) => {
    setLoading(true);
    setError(null);
    try {
      const params = treeIdTarget ? { tree: treeIdTarget, limit: 100 } : { limit: 100 };
      const res = await growthLogService.getLogs(params);
      setLogs(res.data || []);
    } catch (err) {
      console.error('[GrowthLogsPage] Error loading logs:', err);
      setError('Unable to retrieve growth telemetry logs.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Handle Export to Excel via SheetJS
  const handleExportExcel = () => {
    setExporting(true);
    try {
      const dataToExport = logs.map((log) => {
        const auditor = log.loggedBy;
        const auditorName =
          typeof auditor === 'object' && auditor?.name
            ? `${auditor.name} (${auditor.rollNumber || 'Student'})`
            : 'Student Ranger';

        const treeObj =
          typeof log.tree === 'object' ? log.tree : activeTree;

        return {
          'Specimen Tree ID': treeObj?.treeId || selectedTreeId,
          'Botanical Species': treeObj?.species || 'N/A',
          'Specimen Nickname': treeObj?.nickname || '',
          'Campus Location / Sector': treeObj?.location || 'CTU Barili Campus',
          'Observation Date': formatDate(log.loggedAt, true),
          'Timestamp': new Date(log.loggedAt).toISOString(),
          'Height (cm)': log.height,
          'Stem DBH (mm)': log.stemDiameter !== null && log.stemDiameter !== undefined ? log.stemDiameter : '',
          'Leaf Count': log.leafCount !== null && log.leafCount !== undefined ? log.leafCount : '',
          'Fruit / Pod Count': log.fruitCount !== null && log.fruitCount !== undefined ? log.fruitCount : '',
          'Growth Stage': log.growthStage || 'Vegetative',
          'Health Assessment': log.healthStatus || 'Healthy',
          'Auditor Name': auditorName,
          'Field Notes': log.notes || '',
          'Photo Evidence URL': log.photo || '',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      // Auto-fit column widths
      const colWidths = [
        { wch: 18 }, // Tree ID
        { wch: 25 }, // Species
        { wch: 18 }, // Nickname
        { wch: 25 }, // Location
        { wch: 18 }, // Observation Date
        { wch: 24 }, // Timestamp
        { wch: 12 }, // Height
        { wch: 14 }, // DBH
        { wch: 12 }, // Leaf Count
        { wch: 16 }, // Fruit Count
        { wch: 16 }, // Growth Stage
        { wch: 18 }, // Health Assessment
        { wch: 28 }, // Auditor Name
        { wch: 35 }, // Notes
        { wch: 40 }, // Photo URL
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Growth Telemetry');

      const fileName = `LAMBO_${selectedTreeId || 'Campus'}_Growth_Telemetry_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error('[GrowthLogsPage] Export error:', err);
      alert('Failed to generate Excel spreadsheet. Please try again.');
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
    <div className="space-y-5 pb-20">
      {/* Page Title & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B9B4C] animate-pulse" />
            <span className="font-label-sm text-label-sm text-[#A4B566] uppercase font-mono tracking-wider font-semibold">
              FIELD RESEARCH &amp; PHENOLOGY
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-[#F0F3E8] font-bold mt-0.5">
            Specimen Growth Telemetry
          </h2>
          <p className="font-body-sm text-body-sm text-[#CCD6B8]">
            CTU Barili Campus Field Plots • Empirical Growth Curves &amp; Audits
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="h-10 px-3.5 rounded-full bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Record Entry</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || logs.length === 0}
            className="h-10 px-3.5 rounded-full bg-[#30371A] hover:bg-[#3D4721] disabled:opacity-50 text-[#CCD6B8] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            title="Download full observation ledger as Excel (.xlsx)"
          >
            <span className="material-symbols-outlined text-[18px] text-[#A4B566]">
              download
            </span>
            <span>{exporting ? 'Exporting...' : 'Excel Export'}</span>
          </button>
        </div>
      </div>

      {/* Specimen Selector & Context Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#262C14] border border-[#4F5A2D] shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#A4B566]">park</span>
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#F0F3E8]">
              Active Specimen Focus:
            </label>
          </div>

          {/* Dropdown to pick tree */}
          <div className="relative min-w-[240px]">
            <select
              value={selectedTreeId}
              onChange={(e) => setSelectedTreeId(e.target.value)}
              className="w-full h-10 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 pr-8 font-mono text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] appearance-none"
            >
              {trees.map((t) => (
                <option key={t.treeId} value={t.treeId}>
                  #{t.treeId} — {t.nickname || t.species} ({t.species})
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[#A4B566] pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
        </div>

        {activeTree && (
          <div className="pt-2 border-t border-[#38411F] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-headline-sm text-sm font-bold text-[#F0F3E8]">
                {activeTree.nickname || activeTree.species.split(' (')[0]}
              </span>
              <span className="font-mono text-[#A4B566] italic">
                {activeTree.species}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#1D230E] border border-[#525E31] text-[10px] font-mono text-[#BDCE8A]">
                {activeTree.location || 'CTU Barili Plot'}
              </span>
            </div>

            <Link
              to={`/trees/${activeTree.treeId}`}
              className="font-mono text-xs text-[#A4B566] hover:text-[#F0F3E8] flex items-center gap-1 font-semibold"
            >
              <span>View Profile</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        )}
      </div>

      {/* High-Impact Telemetry Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Cumulative Gain */}
        <div className="bg-[#262C14] p-4 rounded-xl shadow-sm flex flex-col justify-between border border-[#4F5A2D]">
          <div className="flex items-center justify-between text-[#CCD6B8]">
            <span className="font-mono text-xs uppercase font-semibold text-[#CCD6B8]">
              Height Gain
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#A4B566]">
              arrow_upward_alt
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-[#F0F3DE]">
                {telemetryStats.heightGain}
              </span>
              <span className="font-mono text-xs text-[#A4B566] font-semibold">cm</span>
            </div>
            <span className="font-mono text-[11px] text-[#A4B566] font-bold">
              {telemetryStats.percentGain} since intake
            </span>
          </div>
        </div>

        {/* Current DBH */}
        <div className="bg-[#262C14] p-4 rounded-xl shadow-sm flex flex-col justify-between border border-[#4F5A2D]">
          <div className="flex items-center justify-between text-[#CCD6B8]">
            <span className="font-mono text-xs uppercase font-semibold text-[#CCD6B8]">
              Trunk DBH
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#A4B566]">
              radio_button_checked
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-[#F0F3DE]">
                {telemetryStats.latestDBH}
              </span>
              <span className="font-mono text-xs text-[#A4B566] font-semibold">mm</span>
            </div>
            <span className="font-mono text-[11px] text-[#CCD6B8]">
              Latest caliper measure
            </span>
          </div>
        </div>

        {/* Tracked Duration */}
        <div className="bg-[#262C14] p-4 rounded-xl shadow-sm flex flex-col justify-between border border-[#4F5A2D]">
          <div className="flex items-center justify-between text-[#CCD6B8]">
            <span className="font-mono text-xs uppercase font-semibold text-[#CCD6B8]">
              Monitoring Span
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#A4B566]">
              history_toggle_off
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-[#F0F3DE]">
                {telemetryStats.durationDays}
              </span>
              <span className="font-mono text-xs text-[#A4B566] font-semibold">days</span>
            </div>
            <span className="font-mono text-[11px] text-[#CCD6B8]">
              Active research ledger
            </span>
          </div>
        </div>

        {/* Verified Audits */}
        <div className="bg-[#262C14] p-4 rounded-xl shadow-sm flex flex-col justify-between border border-[#4F5A2D]">
          <div className="flex items-center justify-between text-[#CCD6B8]">
            <span className="font-mono text-xs uppercase font-semibold text-[#CCD6B8]">
              Field Audits
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#A4B566]">
              verified
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-[#F0F3DE]">
                {telemetryStats.totalAudits}
              </span>
              <span className="font-mono text-xs text-[#A4B566] font-semibold">logs</span>
            </div>
            <span className="font-mono text-[11px] text-[#CCD6B8]">
              Physical observations
            </span>
          </div>
        </div>
      </div>

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
            className="w-full h-12 bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform font-mono text-xs font-bold uppercase tracking-wider border border-[#A4B566]"
          >
            <span className="material-symbols-outlined text-[20px]">straighten</span>
            <span>+ Record Measurement Entry</span>
          </button>
        ) : (
          <div className="w-full py-3 px-4 rounded-xl bg-[#1D230E] border border-[#525E31]/50 text-center font-mono text-xs text-[#AAB596] flex items-center justify-center gap-2 shadow-md">
            <span className="material-symbols-outlined text-[16px] text-[#8B9B4C]">lock</span>
            <span>Growth telemetry entries restricted to specimen caretaker</span>
          </div>
        )}
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
    </div>
  );
}
