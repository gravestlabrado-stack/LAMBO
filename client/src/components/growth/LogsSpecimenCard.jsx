import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../common/Icon';

export default function LogsSpecimenCard({
  trees = [],
  selectedTreeId,
  onSelectTreeId,
  activeTree,
  telemetryStats,
}) {
  return (
    <div className="space-y-4">
      {/* Specimen Selector & Context Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#262C14] border border-[#4F5A2D] shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon name="park" className="text-[20px] text-[#A4B566]" />
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#F0F3E8]">
              Active Specimen Focus:
            </label>
          </div>

          {/* Dropdown to pick tree */}
          <div className="relative min-w-[240px]">
            <select
              value={selectedTreeId}
              onChange={(e) => onSelectTreeId(e.target.value)}
              className="w-full h-10 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 pr-8 font-mono text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] appearance-none cursor-pointer"
            >
              {trees.map((t) => (
                <option key={t.treeId} value={t.treeId}>
                  #{t.treeId} — {t.nickname || t.species} ({t.species})
                </option>
              ))}
            </select>
            <Icon name="expand_more" className="absolute right-2.5 top-2.5 text-[#A4B566] pointer-events-none text-[18px]" />
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
              <Icon name="arrow_forward" className="text-[14px]" />
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
            <Icon name="arrow_upward_alt" className="text-[18px] text-[#A4B566]" />
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
            <Icon name="radio_button_checked" className="text-[18px] text-[#A4B566]" />
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
            <Icon name="history_toggle_off" className="text-[18px] text-[#A4B566]" />
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
            <Icon name="verified" className="text-[18px] text-[#A4B566]" />
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
    </div>
  );
}
