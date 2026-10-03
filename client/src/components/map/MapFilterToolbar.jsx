import React from 'react';
import Icon from '../common/Icon';

const HEALTH_FILTERS = ['All', 'Thriving', 'Stable / Fair', 'Distressed / At Risk', 'Dead / Mortality'];

export default function MapFilterToolbar({
  scope,
  onScopeChange,
  totalTrees = 0,
  myTreesCount = 0,
  selectedHealth,
  onHealthChange,
  healthCounts = {},
  onResetCampus,
  onLocateUser,
  isLocating = false,
}) {
  return (
    <div className="space-y-3">
      {/* Top Header Row with Title & Scope Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-[#A4B566] uppercase font-mono tracking-wider">
              GEOSPATIAL TELEMETRY
            </span>
            <span className="text-[11px] font-mono text-[#D8DFC8] bg-[#1D230E] px-2 py-0.5 rounded-full border border-[#525E31]">
              CTU Barili Campus
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-[#F0F3E8] font-bold">
            Campus Specimen Map
          </h2>
          <p className="font-body-sm text-body-sm text-[#CCD6B8]">
            Interactive GPS locations &amp; real-time health telemetry across Cebu Technological University – Barili Campus
          </p>
        </div>

        {/* Global vs Personal Scope Toggle */}
        <div className="inline-flex p-1 rounded-2xl bg-[#1D230E] border border-[#525E31] self-start sm:self-auto shadow-sm">
          <button
            type="button"
            onClick={() => onScopeChange('all')}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              scope === 'all'
                ? 'bg-[#8B9B4C] text-[#1F240F] shadow-md'
                : 'text-[#D8DFC8] hover:text-[#F0F3E8] hover:bg-[#30371A]'
            }`}
          >
            <Icon name="public" className="text-[17px]" />
            <span>All Campus ({totalTrees})</span>
          </button>

          <button
            type="button"
            onClick={() => onScopeChange('my')}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              scope === 'my'
                ? 'bg-[#8B9B4C] text-[#1F240F] shadow-md'
                : 'text-[#D8DFC8] hover:text-[#F0F3E8] hover:bg-[#30371A]'
            }`}
          >
            <Icon name="person" className="text-[17px]" />
            <span>My Plants &amp; Trees ({myTreesCount})</span>
          </button>
        </div>
      </div>

      {/* Filter Pills & GPS Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {HEALTH_FILTERS.map((f) => {
            const count = healthCounts[f] ?? 0;
            return (
              <button
                key={f}
                type="button"
                onClick={() => onHealthChange(f)}
                className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  selectedHealth === f
                    ? 'bg-[#8B9B4C] text-[#1F240F] shadow-sm'
                    : 'bg-[#262C14] text-[#CCD6B8] border border-[#4F5A2D] hover:bg-[#30371A]'
                }`}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Center to CTU Barili Campus */}
          <button
            type="button"
            onClick={onResetCampus}
            className="h-9 px-3 rounded-xl bg-[#262C14] hover:bg-[#30371A] border border-[#525E31] text-[#C2CE9F] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            title="Center map on CTU Barili Campus"
          >
            <Icon name="school" className="text-[16px] text-[#A4B566]" />
            <span>CTU Barili</span>
          </button>

          {/* Find My Location (GPS) */}
          <button
            type="button"
            onClick={onLocateUser}
            disabled={isLocating}
            className="h-9 px-3.5 rounded-xl bg-[#30371A] hover:bg-[#3D4721] active:scale-95 border border-[#525E31] text-[#A4B566] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            title="Find and center on your live GPS location"
          >
            {isLocating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#A4B566] border-t-transparent rounded-full animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Icon name="my_location" className="text-[16px]" />
                <span>Find My Location</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
