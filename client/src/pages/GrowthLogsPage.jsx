import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useTrees } from '../context/TreeContext';
import { formatDate } from '../utils/formatters';

export default function GrowthLogsPage() {
  const { growthLogs, trees, addGrowthLog } = useTrees();
  const [selectedTimeframe, setSelectedTimeframe] = useState('All Time');
  const [showLogModal, setShowLogModal] = useState(false);

  // Form state for new observation
  const [selectedTreeId, setSelectedTreeId] = useState(trees[0]?.treeId || 'LMB-0001');
  const [height, setHeight] = useState('4.5');
  const [stemDiameter, setStemDiameter] = useState('12.5');
  const [stage, setStage] = useState('Vegetative');
  const [health, setHealth] = useState('Healthy');
  const [notes, setNotes] = useState('');

  const handleExportExcel = () => {
    const dataToExport = growthLogs.map((log) => {
      const parentTree = trees.find((t) => t.treeId === log.treeId);
      return {
        'Tree ID': log.treeId,
        'Species': parentTree ? parentTree.species : 'Wildling Specimen',
        'Height (m)': log.height,
        'Trunk DBH (cm)': log.stemDiameter || 'N/A',
        'Growth Stage': log.growthStage || 'Vegetative',
        'Health Status': log.healthStatus || 'Healthy',
        'Observation Date': formatDate(log.loggedAt, true),
        'Notes': log.notes || 'Routine check',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Growth Observations');
    XLSX.writeFile(workbook, `LAMBO_Botanical_Growth_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleCreateLog = (e) => {
    e.preventDefault();
    addGrowthLog({
      treeId: selectedTreeId,
      height: Number(height),
      stemDiameter: Number(stemDiameter),
      growthStage: stage,
      healthStatus: health,
      notes,
    });
    setShowLogModal(false);
    setNotes('');
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Title & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-label-sm text-label-sm text-[#A4B566] uppercase font-mono tracking-wider">
            CAMPUS RESEARCH DATA
          </span>
          <h2 className="font-headline-md text-headline-md text-[#F1F4E9] font-bold">
            Specimen Growth Telemetry
          </h2>
          <p className="font-body-sm text-body-sm text-[#CCD6B8]">
            Plot 14-B · Muir Coastal Ridge Sanctuary &amp; Agroforestry Plots
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogModal(true)}
            className="h-10 px-3.5 rounded-full bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Record Entry
          </button>
          <button
            onClick={handleExportExcel}
            className="h-10 px-3.5 rounded-full bg-[#333A1B] hover:bg-[#3D4621] text-[#CCD6B8] border border-[#485327] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#A4B566]">download</span>
            Excel Export
          </button>
        </div>
      </div>

      {/* High-Impact Telemetry Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#333A1B] p-4 rounded-xl shadow-sm flex flex-col justify-between border border-[#485327]">
          <div className="flex items-center justify-between text-[#CCD6B8]">
            <span className="font-label-md text-label-md font-medium text-[#CCD6B8]">
              Cumulative Height Gain
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#C4D296]">
              arrow_upward_alt
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-[#F1F4E9] font-bold">
                +3.2
              </span>
              <span className="font-label-lg text-label-lg text-[#C4D296] font-semibold">m</span>
            </div>
            <span className="font-label-sm text-label-sm text-[#C4D296] font-bold">
              +21.0% since intake
            </span>
          </div>
        </div>

        <div className="bg-[#333A1B] p-4 rounded-xl shadow-sm flex flex-col justify-between border border-[#485327]">
          <div className="flex items-center justify-between text-[#CCD6B8]">
            <span className="font-label-md text-label-md font-medium text-[#CCD6B8]">
              Tracked Audits
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#C4D296]">
              history_toggle_off
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-[#F1F4E9] font-bold">
                {growthLogs.length}
              </span>
              <span className="font-label-lg text-label-lg text-[#C4D296] font-semibold">logs</span>
            </div>
            <span className="font-label-sm text-label-sm text-[#CCD6B8]">
              Verified field observations
            </span>
          </div>
        </div>
      </div>

      {/* Timeframe Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['6 Months', '1 Year', 'All Time', 'Milestones'].map((chip) => (
          <button
            key={chip}
            onClick={() => setSelectedTimeframe(chip)}
            className={`px-4 py-2 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
              selectedTimeframe === chip
                ? 'bg-[#C4D296] text-[#20260E] font-bold shadow-md'
                : 'bg-[#333A1B] text-[#CCD6B8] border border-[#485327] hover:bg-[#3D4621]'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Interactive Growth Trend Vector Chart Card */}
      <div className="bg-[#333A1B] p-5 rounded-2xl shadow-md flex flex-col gap-4 border border-[#485327]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#C4D296]">
                ssid_chart
              </span>
              <span className="font-headline-sm text-headline-sm text-[#F1F4E9] font-bold">
                Progression Curves
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-[#CCD6B8]">
              Vertical height vs. DBH girth tracking
            </span>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#3D4621] border border-[#5A6732] text-[#F1F4E9]">
            <span className="font-label-sm text-label-sm font-bold text-[#C4D296]">
              Field-Grade
            </span>
          </div>
        </div>

        {/* Growth Comparison Callout Badge */}
        <div className="bg-[#2B3117] px-4 py-2.5 rounded-xl flex items-center justify-between border border-[#434D25]">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-[20px] text-[#C4D296]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              eco
            </span>
            <span className="font-label-md text-label-md text-[#F1F4E9] font-medium">
              Surpassing regional growth baseline
            </span>
          </div>
          <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-[#C4D296] text-[#20260E] font-bold">
            +14.2%
          </span>
        </div>

        {/* High Contrast Vector Graph on Olive Drab Canvas */}
        <div className="relative w-full h-48 bg-[#232813] rounded-xl p-3 flex flex-col justify-between overflow-hidden border border-[#3E4723]">
          <svg
            className="absolute inset-0 w-full h-full p-2"
            preserveAspectRatio="none"
            viewBox="0 0 340 180"
          >
            <line stroke="#404A24" strokeDasharray="3,3" strokeWidth="1" x1="20" x2="330" y1="30" y2="30" />
            <line stroke="#404A24" strokeDasharray="3,3" strokeWidth="1" x1="20" x2="330" y1="80" y2="80" />
            <line stroke="#404A24" strokeDasharray="3,3" strokeWidth="1" x1="20" x2="330" y1="130" y2="130" />

            <defs>
              <linearGradient id="growthAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C4D296" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#C4D296" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Height Growth Curve */}
            <path d="M 30,145 Q 110,125 180,95 T 310,38 L 310,170 L 30,170 Z" fill="url(#growthAreaGradient)" />
            <path
              d="M 30,145 Q 110,125 180,95 T 310,38"
              fill="none"
              stroke="#C4D296"
              strokeLinecap="round"
              strokeWidth="3.5"
            />
            {/* DBH Secondary Curve */}
            <path
              d="M 30,158 Q 115,142 190,122 T 310,72"
              fill="none"
              stroke="#8B9B4C"
              strokeDasharray="5,4"
              strokeLinecap="round"
              strokeWidth="2.5"
            />

            {/* Anchors */}
            <circle cx="120" cy="120" fill="#2A3016" r="5" stroke="#C4D296" strokeWidth="3" />
            <circle cx="215" cy="82" fill="#2A3016" r="5" stroke="#C4D296" strokeWidth="3" />
            <circle cx="310" cy="38" fill="#2A3016" r="6" stroke="#C4D296" strokeWidth="4" />
          </svg>

          <div className="relative z-10 flex justify-between text-[11px] font-mono text-[#AAB596] pt-1">
            <span>Height (m)</span>
            <span>Intake → Current</span>
          </div>

          <div className="relative z-10 flex justify-between text-[10px] font-mono text-[#AAB596] border-t border-[#404A24]/60 pt-1">
            <span>Spring 2023</span>
            <span>Fall 2023</span>
            <span>Spring 2024</span>
            <span>Latest Fall 2024</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-[#CCD6B8]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#C4D296] rounded-full"></span>
            <span>Tree Height (m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#8B9B4C] border-b border-dashed border-[#8B9B4C]"></span>
            <span>Trunk DBH (cm)</span>
          </div>
        </div>
      </div>

      {/* Observation Feed Cards */}
      <div className="space-y-3">
        <h3 className="font-headline-sm text-headline-sm text-[#F1F4E9] font-bold">
          Field Log Records
        </h3>

        <div className="space-y-3">
          {growthLogs.map((log) => {
            const parentTree = trees.find((t) => t.treeId === log.treeId);
            return (
              <div
                key={log._id}
                className="bg-[#2B3117] p-4 rounded-xl border border-[#485327] shadow-sm space-y-2 hover:border-[#8B9B4C] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1F2410] border border-[#525E31] text-[#A4B566] font-mono text-xs font-bold">
                      #{log.treeId}
                    </span>
                    <span className="font-display font-semibold text-sm text-[#F0F3E8]">
                      {parentTree?.species || 'Wildling'}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#AAB596]">
                    {formatDate(log.loggedAt, true)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1 text-xs font-mono">
                  <div className="bg-[#1F2410] p-2 rounded-lg border border-[#485327]/60">
                    <span className="text-[#AAB596] block text-[10px]">HEIGHT</span>
                    <span className="text-[#F0F3E8] font-bold text-sm">{log.height} m</span>
                  </div>
                  <div className="bg-[#1F2410] p-2 rounded-lg border border-[#485327]/60">
                    <span className="text-[#AAB596] block text-[10px]">DIAMETER</span>
                    <span className="text-[#F0F3E8] font-bold text-sm">
                      {log.stemDiameter ? `${log.stemDiameter} cm` : '—'}
                    </span>
                  </div>
                  <div className="bg-[#1F2410] p-2 rounded-lg border border-[#485327]/60">
                    <span className="text-[#AAB596] block text-[10px]">STAGE</span>
                    <span className="text-[#A4B566] font-bold text-xs">{log.growthStage}</span>
                  </div>
                  <div className="bg-[#1F2410] p-2 rounded-lg border border-[#485327]/60">
                    <span className="text-[#AAB596] block text-[10px]">HEALTH</span>
                    <span className="text-[#D2DCB4] font-bold text-xs">{log.healthStatus}</span>
                  </div>
                </div>

                {log.notes && (
                  <p className="text-xs text-[#CCD6B8] bg-[#1F2410]/70 p-2.5 rounded-lg border border-[#485327]/40 leading-relaxed">
                    "{log.notes}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: New Observation Entry */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#262C14] border border-[#5D6A37] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3">
              <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
                Add Field Growth Log
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="w-8 h-8 rounded-full bg-[#30371A] text-[#AAB596] hover:text-[#F0F3E8] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold">
                  Select Tree Specimen *
                </label>
                <select
                  value={selectedTreeId}
                  onChange={(e) => setSelectedTreeId(e.target.value)}
                  className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                >
                  {trees.map((t) => (
                    <option key={t.treeId} value={t.treeId}>
                      #{t.treeId} — {t.species}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold">
                    Height (Meters) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm font-mono text-[#F0F3E8]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold">
                    Trunk DBH (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={stemDiameter}
                    onChange={(e) => setStemDiameter(e.target.value)}
                    className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm font-mono text-[#F0F3E8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold">
                  Observation Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="Record pruning, leaf condition, or watering observations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#1D230E] border border-[#525E31] rounded-xl p-3 text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add_task</span>
                Save Observation Log
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
