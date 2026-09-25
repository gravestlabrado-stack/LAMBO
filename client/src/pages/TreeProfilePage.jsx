import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useTrees } from '../context/TreeContext';
import { formatDate } from '../utils/formatters';
import { GROWTH_STAGES } from '../utils/constants';

export default function TreeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTreeById, getTreeLogs, addGrowthLog } = useTrees();
  const tree = getTreeById(id || 'LMB-0001');
  const logs = getTreeLogs(tree.treeId);

  const [showQRModal, setShowQRModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [newHeight, setNewHeight] = useState(tree.height || 18.5);
  const [newDiameter, setNewDiameter] = useState(tree.stemDiameter || 46.5);
  const [newStage, setNewStage] = useState(tree.currentStage || 'Vegetative');
  const [newHealth, setNewHealth] = useState(tree.healthStatus || 'Healthy');
  const [newNotes, setNewNotes] = useState('');

  const currentStageIndex = GROWTH_STAGES.indexOf(tree.currentStage);

  const handleLogSubmit = (e) => {
    e.preventDefault();
    addGrowthLog({
      treeId: tree.treeId,
      height: Number(newHeight),
      stemDiameter: Number(newDiameter),
      growthStage: newStage,
      healthStatus: newHealth,
      notes: newNotes,
    });
    setShowLogModal(false);
    setNewNotes('');
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('specimen-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 80;
      ctx.fillStyle = '#1D230E';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      ctx.fillStyle = '#F0F3E8';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(tree.treeId, canvas.width / 2, canvas.height - 30);
      ctx.fillStyle = '#A4B566';
      ctx.font = '12px sans-serif';
      ctx.fillText(tree.species.split(' ')[0], canvas.width / 2, canvas.height - 12);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${tree.treeId}-QR-TAG.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <Link
          to="/trees"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#30371A] border border-[#525E31] text-[#D8DFC8] hover:text-[#F0F3E8] font-mono text-xs font-semibold"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Registry
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQRModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#38411F] border border-[#5D6A37] text-[#A4B566] hover:bg-[#485327] font-mono text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[16px]">qr_code</span>
            QR Tag
          </button>
          <button
            onClick={() => navigate('/map')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#30371A] border border-[#525E31] text-[#D8DFC8] hover:text-[#F0F3E8] font-mono text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">pin_drop</span>
            Map
          </button>
        </div>
      </div>

      {/* Hero Photo Banner */}
      <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden shadow-lg border border-[#4F5A2D] bg-[#111508]">
        <img
          src={tree.photos?.[0]?.url || 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1000&q=80'}
          alt={tree.species}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D0D]/95 via-[#1A1D0D]/40 to-transparent pointer-events-none" />

        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1D230E]/90 border border-[#5D6A37] text-[#A4B566] font-mono text-[11px] font-bold">
              #{tree.treeId}
            </span>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[#F0F3E8] mt-1 drop-shadow">
              {tree.nickname || tree.species.split(' ')[0]}
            </h2>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-semibold shadow-md ${
              tree.healthStatus === 'Healthy'
                ? 'bg-[#3A4320] border border-[#5D6A37] text-[#D2DCB4]'
                : tree.healthStatus === 'Monitoring'
                ? 'bg-[#3A331A] border border-[#D99B26]/60 text-[#F5C26B]'
                : 'bg-[#431B1B] border border-[#E57373]/60 text-[#FFCDD2]'
            }`}
          >
            {tree.healthStatus}
          </span>
        </div>
      </div>

      {/* Tree Metadata Section */}
      <div className="flex flex-col p-5 rounded-2xl bg-[#262C14] shadow-md border border-[#4F5A2D] space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="font-headline-md text-headline-md text-[#F0F3DE] font-bold tracking-tight truncate uppercase">
              {tree.species}
            </span>
            <span className="font-body-sm text-body-sm text-[#A6B768] italic">
              Botanical Family: Native Wildling
            </span>
          </div>
          <span className="shrink-0 px-2.5 py-0.5 rounded bg-[#333B1C] border border-[#4F5A2D] text-[#BDCE8A] font-label-sm text-label-sm font-semibold uppercase tracking-wider">
            Active
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1 text-[#C5C8BC] font-body-sm text-body-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#A6B768]">location_on</span>
            <span className="truncate font-mono text-[12px]">{tree.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#A6B768]">calendar_month</span>
            <span>
              Registered {formatDate(tree.datePlanted)}{' '}
              <span className="text-[#BDCE8A] font-medium font-mono">(In active study)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Growth Stage Progress Bar */}
      <div className="p-4 rounded-2xl bg-[#262C14] border border-[#4F5A2D] shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-[#C2CE9F] uppercase tracking-wider font-semibold">
            Botanical Growth Stage
          </span>
          <span className="font-mono text-xs font-bold text-[#A4B566]">
            {tree.currentStage}
          </span>
        </div>

        {/* Multi-step progress tracks */}
        <div className="grid grid-cols-6 gap-1.5">
          {GROWTH_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div key={stage} className="flex flex-col gap-1 items-center">
                <div
                  className={`w-full h-2 rounded-full transition-all ${
                    isCurrent
                      ? 'bg-[#A4B566] shadow-[0_0_8px_rgba(164,181,102,0.8)]'
                      : isCompleted
                      ? 'bg-[#6B7D3B]'
                      : 'bg-[#1D220D] border border-[#4F5A2D]/50'
                  }`}
                />
                <span
                  className={`text-[9px] font-mono truncate w-full text-center ${
                    isCurrent ? 'text-[#F0F3E8] font-bold' : 'text-[#8F9779]'
                  }`}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vital Telemetry Section Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-[#A6B768]">monitoring</span>
          <h3 className="font-label-lg text-label-lg text-[#F0F3DE] font-bold uppercase tracking-wider">
            Vital Telemetry
          </h3>
        </div>
        <span className="font-label-sm text-label-sm text-[#A6B768] font-medium font-mono uppercase">
          Live Sync
        </span>
      </div>

      {/* 2x2 Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Height Metric */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-[#262C14] shadow-md border border-[#4F5A2D] gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-[#C5C8BC] uppercase tracking-wider">
              Total Height
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#A6B768]">height</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1">
              <span className="font-data-metric text-data-metric text-[#F0F3DE] font-bold tracking-tight">
                {tree.height}
              </span>
              <span className="font-label-md text-label-md text-[#A6B768] font-semibold">m</span>
            </div>
            <div className="flex items-center gap-1 font-label-sm text-label-sm text-[#BDCE8A] font-semibold">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              <span>+0.8m this season</span>
            </div>
          </div>
          {/* Mini Sparkline Graph */}
          <div className="w-full pt-1">
            <svg className="w-full h-6 overflow-visible" fill="none" viewBox="0 0 100 28">
              <path
                d="M 0 24 Q 25 20, 50 14 T 100 4"
                stroke="#A6B768"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
              <circle cx="100" cy="4" fill="#BDCE8A" r="3.5" />
            </svg>
          </div>
        </div>

        {/* DBH Trunk Diameter */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-[#262C14] shadow-md border border-[#4F5A2D] gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-[#C5C8BC] uppercase tracking-wider">
              Trunk DBH
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#A6B768]">
              radio_button_checked
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1">
              <span className="font-data-metric text-data-metric text-[#F0F3DE] font-bold tracking-tight">
                {tree.stemDiameter || '—'}
              </span>
              <span className="font-label-md text-label-md text-[#A6B768] font-semibold">cm</span>
            </div>
            <div className="flex items-center gap-1 font-label-sm text-label-sm text-[#BDCE8A] font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+2.1cm annual</span>
            </div>
          </div>
          <div className="w-full bg-[#1D220D] rounded h-2 mt-2 overflow-hidden border border-[#4F5A2D]">
            <div className="bg-[#8B9B4C] h-full rounded" style={{ width: '72%' }} />
          </div>
        </div>

        {/* Leaf / Fruit Count */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-[#262C14] shadow-md border border-[#4F5A2D] gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-[#C5C8BC] uppercase tracking-wider">
              Fruit Clusters
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#A6B768]">nutrition</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-data-metric text-data-metric text-[#F0F3DE] font-bold tracking-tight">
              {tree.fruitCount || '0'}
            </span>
            <span className="font-label-md text-label-md text-[#A6B768] font-semibold">pods</span>
          </div>
          <span className="font-label-sm text-label-sm text-[#BDCE8A]">
            {tree.leafCount || 120} active leaves
          </span>
        </div>

        {/* Health Index */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-[#262C14] shadow-md border border-[#4F5A2D] gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-[#C5C8BC] uppercase tracking-wider">
              Health Index
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#A6B768]">favorite</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-data-metric text-data-metric text-[#A4B566] font-bold tracking-tight">
              96%
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-[#D2DCB4]">
            Optimal root hydration
          </span>
        </div>
      </div>

      {/* Fast Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => setShowLogModal(true)}
          className="h-12 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] active:scale-[0.98] transition-all text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
        >
          <span className="material-symbols-outlined text-[18px]">add_chart</span>
          Record New Entry
        </button>
        <button
          onClick={() => setShowQRModal(true)}
          className="h-12 rounded-xl bg-[#30371A] border border-[#525E31] hover:bg-[#38411F] text-[#F0F3E8] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
        >
          <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
          Print QR Tag
        </button>
      </div>

      {/* Observation History Timeline */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
            Specimen Growth Audit History
          </h3>
          <span className="font-label-sm text-label-sm text-[#A4B566] font-mono">
            {logs.length} Audits Logged
          </span>
        </div>

        <div className="space-y-2.5">
          {logs.map((log) => (
            <div
              key={log._id}
              className="p-4 rounded-xl bg-[#262C14] border border-[#4F5A2D] shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#A4B566]">
                    verified
                  </span>
                  <span className="font-mono text-xs font-bold text-[#F0F3E8]">
                    Height: {log.height}m {log.stemDiameter ? `• DBH: ${log.stemDiameter}cm` : ''}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#AAB596]">
                  {formatDate(log.loggedAt, true)}
                </span>
              </div>
              {log.notes && (
                <p className="text-xs text-[#D8DFC8] bg-[#1D230E] p-2.5 rounded-lg border border-[#4F5A2D]/50">
                  {log.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Record Growth Entry */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#262C14] border border-[#5D6A37] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3">
              <div>
                <span className="font-mono text-[11px] text-[#A4B566] uppercase">
                  #{tree.treeId} OBSERVATION
                </span>
                <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
                  Record Growth Measurement
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="w-8 h-8 rounded-full bg-[#30371A] text-[#AAB596] hover:text-[#F0F3E8] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1">
                  Height (Meters) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newHeight}
                  onChange={(e) => setNewHeight(e.target.value)}
                  className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1">
                  Stem DBH (Centimeters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newDiameter}
                  onChange={(e) => setNewDiameter(e.target.value)}
                  className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1">
                    Growth Stage
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-2.5 text-xs text-[#F0F3E8]"
                  >
                    {GROWTH_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1">
                    Health Status
                  </label>
                  <select
                    value={newHealth}
                    onChange={(e) => setNewHealth(e.target.value)}
                    className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-2.5 text-xs text-[#F0F3E8]"
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Monitoring">Monitoring</option>
                    <option value="Needs Attention">Needs Attention</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1">
                  Field Notes / Observations
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Added organic fertilizer, new branch bud emergence..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[#1D230E] border border-[#525E31] rounded-xl p-3 text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Commit Observation Audit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Printable QR Code Tag */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#262C14] border border-[#5D6A37] p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-[#4F5A2D] pb-3">
              <span className="font-mono text-xs text-[#A4B566] font-bold">
                PHYSICAL QR TAG GENERATOR
              </span>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-7 h-7 rounded-full bg-[#30371A] text-[#AAB596] hover:text-[#F0F3E8] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="bg-[#1D230E] p-6 rounded-2xl border-2 border-dashed border-[#8B9B4C] flex flex-col items-center justify-center shadow-inner">
              <QRCodeSVG
                id="specimen-qr-code"
                value={tree.treeId}
                size={180}
                bgColor="#1D230E"
                fgColor="#A4B566"
                level="H"
                includeMargin={false}
              />
              <span className="font-mono font-bold text-lg text-[#F0F3E8] mt-4 tracking-wider">
                {tree.treeId}
              </span>
              <span className="font-body-sm text-xs text-[#C2CE9F] italic">
                {tree.species}
              </span>
            </div>

            <p className="text-xs text-[#AAB596]">
              Download and print this weatherproof tag to attach to seedling stakes for instant camera identification in the field.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadQR}
                className="flex-1 h-11 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download PNG
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 h-11 rounded-xl bg-[#30371A] border border-[#525E31] text-[#F0F3E8] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
