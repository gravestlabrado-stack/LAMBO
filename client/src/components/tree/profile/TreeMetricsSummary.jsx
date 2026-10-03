import React from 'react';
import Icon from '../../common/Icon';

/**
 * Specimen Key Metrics Dashboard Grid
 */
export default function TreeMetricsSummary({ metrics }) {
  const {
    latestHeight,
    totalHeightGain,
    latestStemDiameter,
    latestLeafCount,
    daysPlanted,
    observationCount,
  } = metrics;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Height Metric */}
      <div className="p-3.5 rounded-xl bg-[#262C14] border border-[#525E31] space-y-1">
        <div className="flex items-center justify-between text-[#C2CE9F]">
          <span className="font-mono text-[11px] uppercase font-semibold">Height</span>
          <Icon name="straighten" className="text-[16px] text-[#8B9B4C]" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-headline-sm text-lg sm:text-xl font-bold text-[#F0F3E8]">
            {latestHeight !== null ? `${latestHeight}` : '—'}
          </span>
          <span className="font-mono text-xs text-[#AAB596]">cm</span>
        </div>
        {totalHeightGain > 0 && (
          <span className="font-mono text-[10px] text-emerald-400 font-bold block">
            +{totalHeightGain} cm gain
          </span>
        )}
      </div>

      {/* Stem Caliper Metric */}
      <div className="p-3.5 rounded-xl bg-[#262C14] border border-[#525E31] space-y-1">
        <div className="flex items-center justify-between text-[#C2CE9F]">
          <span className="font-mono text-[11px] uppercase font-semibold">Stem Caliper</span>
          <Icon name="radio_button_unchecked" className="text-[16px] text-[#8B9B4C]" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-headline-sm text-lg sm:text-xl font-bold text-[#F0F3E8]">
            {latestStemDiameter !== null ? `${latestStemDiameter}` : '—'}
          </span>
          <span className="font-mono text-xs text-[#AAB596]">mm</span>
        </div>
        <span className="font-mono text-[10px] text-[#AAB596] block">Diameter</span>
      </div>

      {/* Leaf / Foliage Metric */}
      <div className="p-3.5 rounded-xl bg-[#262C14] border border-[#525E31] space-y-1">
        <div className="flex items-center justify-between text-[#C2CE9F]">
          <span className="font-mono text-[11px] uppercase font-semibold">Foliage</span>
          <Icon name="eco" className="text-[16px] text-[#8B9B4C]" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-headline-sm text-lg sm:text-xl font-bold text-[#F0F3E8]">
            {latestLeafCount !== null ? `${latestLeafCount}` : '—'}
          </span>
          <span className="font-mono text-xs text-[#AAB596]">leaves</span>
        </div>
        <span className="font-mono text-[10px] text-[#AAB596] block">Observed count</span>
      </div>

      {/* Observation History Metric */}
      <div className="p-3.5 rounded-xl bg-[#262C14] border border-[#525E31] space-y-1">
        <div className="flex items-center justify-between text-[#C2CE9F]">
          <span className="font-mono text-[11px] uppercase font-semibold">Field Audits</span>
          <Icon name="history_edu" className="text-[16px] text-[#8B9B4C]" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-headline-sm text-lg sm:text-xl font-bold text-[#F0F3E8]">
            {observationCount}
          </span>
          <span className="font-mono text-xs text-[#AAB596]">logs</span>
        </div>
        <span className="font-mono text-[10px] text-[#C2CE9F] block">
          {daysPlanted} days in plot
        </span>
      </div>
    </div>
  );
}
