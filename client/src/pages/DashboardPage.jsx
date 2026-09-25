import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTrees } from '../context/TreeContext';
import { formatRelativeTime } from '../utils/formatters';

export default function DashboardPage() {
  const { user } = useAuth();
  const { trees, reminders } = useTrees();
  const [activeFilter, setActiveFilter] = useState('All');
  const navigate = useNavigate();

  const healthyCount = trees.filter((t) => t.healthStatus === 'Healthy').length;
  const monitoringCount = trees.filter((t) => t.healthStatus === 'Monitoring').length;
  const attentionCount = trees.filter((t) => t.healthStatus === 'Needs Attention').length;
  const totalTrees = trees.length;

  const healthyPct = totalTrees > 0 ? Math.round((healthyCount / totalTrees) * 100) : 84;
  const monitoringPct = totalTrees > 0 ? Math.round((monitoringCount / totalTrees) * 100) : 12;
  const attentionPct = totalTrees > 0 ? Math.round((attentionCount / totalTrees) * 100) : 4;

  const filteredTrees = trees.filter((tree) => {
    if (activeFilter === 'Healthy') return tree.healthStatus === 'Healthy';
    if (activeFilter === 'Monitoring') return tree.healthStatus === 'Monitoring';
    if (activeFilter === 'Needing Care') return tree.healthStatus === 'Needs Attention';
    return true;
  });

  return (
    <div className="space-y-5 pb-6">
      {/* Welcome Header & Field Context */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-[#F0F3E8] font-bold">
            Good morning, {user?.name || 'Cadet Elena'}
          </h2>
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#30371A] border border-[#525E31] text-[#A4B566]">
            <span className="material-symbols-outlined text-[20px]">forest</span>
          </span>
        </div>
        <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-[#1D230E] border border-[#525E31]/60 text-[#D8DFC8] font-label-md text-label-md">
          <span className="material-symbols-outlined text-[16px] text-[#A4B566]">wb_sunny</span>
          <span className="text-[#F0F3E8]">71°F Clear</span>
          <span className="w-1 h-1 rounded-full bg-[#8B9B4C]"></span>
          <span className="font-medium text-[#F0F3E8]">Campus Forest Zone 4B</span>
        </div>
      </div>

      {/* Fast Action Banner: Deep Forest Card with AR Scan Trigger */}
      <div className="relative overflow-hidden rounded-xl bg-[#1D230E] text-[#F0F3E8] p-5 shadow-lg border border-[#5D6A37]">
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-[230px]">
            <div className="inline-flex items-center gap-1.5 text-[#C2CE9F] font-label-sm text-label-sm uppercase tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A4B566] animate-pulse"></span>
              LiDAR Calibration Active
            </div>
            <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
              Field Measurement
            </h3>
            <p className="font-body-sm text-body-sm text-[#D8DFC8]">
              Instant trunk diameter, crown radius, and automated bark condition tag.
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#30371A] border border-[#5D6A37] flex items-center justify-center shrink-0 text-[#A4B566] shadow-inner">
            <span className="material-symbols-outlined text-[28px]">view_in_ar</span>
          </div>
        </div>

        <div className="mt-5 relative z-10">
          <button
            onClick={() => navigate('/scan')}
            className="w-full h-12 rounded-lg bg-[#8B9B4C] hover:bg-[#9EAF6D] active:scale-[0.98] transition-transform text-[#1F240F] font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] font-bold">qr_code_scanner</span>
            <span>Quick AR Scan &amp; Measure</span>
          </button>
        </div>

        {/* Subtle atmospheric geometric backdrop accent */}
        <svg
          className="absolute -right-6 -bottom-6 w-36 h-36 text-[#8B9B4C]/15 pointer-events-none"
          fill="currentColor"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" fill="none" opacity="0.4" r="45" stroke="currentColor" strokeWidth="2"></circle>
          <circle cx="50" cy="50" fill="none" opacity="0.3" r="30" stroke="currentColor" strokeWidth="2"></circle>
          <circle cx="50" cy="50" fill="none" opacity="0.2" r="15" stroke="currentColor" strokeWidth="2"></circle>
          <path d="M50 0 v100 M0 50 h100" opacity="0.25" stroke="currentColor" strokeWidth="1.5"></path>
        </svg>
      </div>

      {/* Quick Stats Telemetry Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Monitored Specimen Count */}
        <div className="col-span-2 rounded-lg bg-[#30371A] p-4 shadow-sm border border-[#525E31] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-[#C2CE9F]">Specimens Monitored</span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1D230E] border border-[#5D6A37] text-[#D2DCB4] font-label-sm text-label-sm font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +12 this wk
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-data-metric text-data-metric text-[#F0F3E8] font-bold">
              {totalTrees}
            </span>
            <span className="font-body-sm text-body-sm text-[#AAB596]">active specimens</span>
          </div>
        </div>

        {/* Canopy Health Metric */}
        <div className="rounded-lg bg-[#30371A] p-3.5 shadow-sm border border-[#525E31] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-[#C2CE9F] truncate">Canopy Health</span>
            <span className="w-2 h-2 rounded-full bg-[#A4B566] shadow-[0_0_8px_#A4B566]"></span>
          </div>
          <div className="font-headline-md text-headline-md text-[#F0F3E8] font-bold">
            {healthyPct}%
          </div>
          <div className="inline-flex px-2 py-0.5 rounded bg-[#3A4320] border border-[#5D6A37] text-[#D2DCB4] font-label-sm text-label-sm font-semibold">
            Optimal
          </div>
        </div>

        {/* Pending Care Reminders */}
        <div className="rounded-lg bg-[#30371A] p-3.5 shadow-sm border border-[#525E31] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-[#C2CE9F] truncate">Care Tasks</span>
            <span className="material-symbols-outlined text-[16px] text-[#A4B566]">event_repeat</span>
          </div>
          <div className="font-headline-md text-headline-md text-[#F0F3E8] font-bold">
            {reminders.filter((r) => !r.completed).length}
          </div>
          <div className="inline-flex px-2 py-0.5 rounded bg-[#1D230E] border border-[#525E31] text-[#D8DFC8] font-label-sm text-label-sm font-semibold truncate">
            Pending action
          </div>
        </div>
      </div>

      {/* Specimen Health Breakdown (Donut & Legend) */}
      <div className="rounded-lg bg-[#30371A] p-5 shadow-sm border border-[#525E31] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
              Specimen Health Breakdown
            </h4>
            <p className="font-body-sm text-body-sm text-[#AAB596]">Forest Sector 4B Distribution</p>
          </div>
          <span className="material-symbols-outlined text-[#C2CE9F]">donut_large</span>
        </div>

        <div className="flex items-center gap-6">
          {/* SVG Donut Chart representing percentages */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle className="stroke-[#1D230E]" cx="18" cy="18" fill="none" r="14" strokeWidth="4.5"></circle>
              {/* Healthy */}
              <circle
                cx="18"
                cy="18"
                fill="none"
                r="14"
                stroke="#A4B566"
                strokeDasharray={`${healthyPct * 0.88} 100`}
                strokeDashoffset="0"
                strokeLinecap="round"
                strokeWidth="4.5"
              ></circle>
              {/* Monitoring */}
              <circle
                cx="18"
                cy="18"
                fill="none"
                r="14"
                stroke="#6B7D3B"
                strokeDasharray={`${monitoringPct * 0.88} 100`}
                strokeDashoffset={`-${healthyPct * 0.88}`}
                strokeLinecap="round"
                strokeWidth="4.5"
              ></circle>
              {/* Intervention / Needs Attention */}
              <circle
                cx="18"
                cy="18"
                fill="none"
                r="14"
                stroke="#E57373"
                strokeDasharray={`${attentionPct * 0.88} 100`}
                strokeDashoffset={`-${(healthyPct + monitoringPct) * 0.88}`}
                strokeLinecap="round"
                strokeWidth="4.5"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
                {healthyPct}%
              </span>
              <span className="font-label-sm text-label-sm text-[#C2CE9F] font-semibold">Good</span>
            </div>
          </div>

          {/* Legend breakdown */}
          <div className="flex flex-col justify-center gap-2 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A4B566] shrink-0"></span>
                <span className="font-body-sm text-body-sm text-[#F0F3E8] truncate">Healthy</span>
              </div>
              <span className="font-label-md text-label-md text-[#F0F3E8] font-semibold">{healthyPct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6B7D3B] shrink-0"></span>
                <span className="font-body-sm text-body-sm text-[#F0F3E8] truncate">Monitoring</span>
              </div>
              <span className="font-label-md text-label-md text-[#F0F3E8] font-semibold">{monitoringPct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E57373] shrink-0"></span>
                <span className="font-body-sm text-body-sm text-[#F0F3E8] truncate">Intervention</span>
              </div>
              <span className="font-label-md text-label-md text-[#F0F3E8] font-semibold">{attentionPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Field Activity Section with Filter Chips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
            Recent Field Observations
          </h3>
          <Link to="/trees" className="font-label-md text-label-md text-[#A4B566] font-bold hover:underline">
            View All ({trees.length})
          </Link>
        </div>

        {/* Filter Chips Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['All', 'Healthy', 'Monitoring', 'Needing Care'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`shrink-0 h-9 px-4 rounded-full font-label-md text-label-md font-bold flex items-center justify-center transition-all ${
                activeFilter === filter
                  ? 'bg-[#8B9B4C] text-[#1F240F] shadow-sm'
                  : 'bg-[#30371A] text-[#D8DFC8] border border-[#525E31] hover:bg-[#38411F]'
              }`}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Specimen Feed List */}
        <div className="space-y-2.5">
          {filteredTrees.map((tree) => {
            const photoUrl =
              tree.photos && tree.photos.length > 0
                ? tree.photos[0].url
                : 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=400&q=80';

            return (
              <div
                key={tree._id || tree.treeId}
                onClick={() => navigate(`/trees/${tree.treeId}`)}
                className="rounded-lg bg-[#30371A] p-3 shadow-sm border border-[#525E31] flex items-center justify-between gap-3 cursor-pointer hover:border-[#8B9B4C] active:bg-[#38411F] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-lg bg-[#1D230E] overflow-hidden shrink-0 ring-1 ring-[#525E31]">
                    <img className="w-full h-full object-cover" alt={tree.species} src={photoUrl} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-label-lg text-label-lg text-[#F0F3E8] font-semibold truncate">
                        #{tree.treeId}
                      </span>
                      <span className="text-[#C2CE9F] font-body-sm text-body-sm truncate">
                        • {tree.nickname || tree.species.split(' ')[0]}
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-[#AAB596] truncate">
                      Planted {formatRelativeTime(tree.datePlanted)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold border ${
                      tree.healthStatus === 'Healthy'
                        ? 'bg-[#3A4320] border-[#5D6A37] text-[#D2DCB4]'
                        : tree.healthStatus === 'Monitoring'
                        ? 'bg-[#3A331A] border-[#D99B26]/60 text-[#F5C26B]'
                        : 'bg-[#431B1B] border-[#E57373]/60 text-[#FFCDD2]'
                    }`}
                  >
                    {tree.healthStatus}
                  </span>
                  <span className="font-label-md text-label-md text-[#A4B566] font-semibold flex items-center">
                    {tree.height}m
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
