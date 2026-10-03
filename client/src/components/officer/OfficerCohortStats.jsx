import React from 'react';
import Icon from '../common/Icon';

/**
 * Top Telemetry Overview Cards for Officer Command Dashboard
 */
export default function OfficerCohortStats({ stats, loading }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Personnel */}
      <div className="rounded-2xl bg-[#30371A] border border-[#525E31] p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-[#C2CE9F] font-mono text-xs">
          <span>Personnel Enrolled</span>
          <Icon name="groups" className="w-4.5 h-4.5 text-[#A4B566]" />
        </div>
        <div className="font-display font-bold text-2xl text-[#F0F3E8]">
          {loading ? '—' : stats?.totalPersonnel ?? stats?.totalCadets ?? 0}
        </div>
        <span className="font-mono text-[11px] text-[#AAB596] block truncate">
          {stats?.totalOfficers !== undefined
            ? `${stats.totalOfficers} officers • ${stats.totalCadets} cadets`
            : 'Enrolled personnel'}
        </span>
      </div>

      {/* Weekly Compliance Rate */}
      <div className="rounded-2xl bg-[#30371A] border border-[#525E31] p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-[#C2CE9F] font-mono text-xs">
          <span>Weekly Compliance</span>
          <Icon name="fact_check" className="w-4.5 h-4.5 text-[#A4B566]" />
        </div>
        <div className="font-display font-bold text-2xl text-[#F0F3E8]">
          {loading ? '—' : `${stats?.activeRate ?? (stats?.totalCadets > 0 ? Math.round((stats.activeCount / stats.totalCadets) * 100) : 100)}%`}
        </div>
        <span className="font-mono text-[11px] text-[#AAB596] block truncate">
          {stats?.activeCount ?? 0} active in past 7d
        </span>
      </div>

      {/* Total Monitored Trees */}
      <div className="rounded-2xl bg-[#30371A] border border-[#525E31] p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-[#C2CE9F] font-mono text-xs">
          <span>Monitored Trees</span>
          <Icon name="forest" className="w-4.5 h-4.5 text-[#A4B566]" />
        </div>
        <div className="font-display font-bold text-2xl text-[#F0F3E8]">
          {loading ? '—' : stats?.totalTrees ?? 0}
        </div>
        <span className="font-mono text-[11px] text-[#AAB596] block truncate">
          {stats ? `${stats.aliveTrees} alive / ${stats.deadTrees} mortalities` : 'Total planted'}
        </span>
      </div>

      {/* Cohort Survival Rate */}
      <div className="rounded-2xl bg-[#30371A] border border-[#525E31] p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-[#C2CE9F] font-mono text-xs">
          <span>Survival Rate</span>
          <Icon name="vital_signs" className="w-4.5 h-4.5 text-[#A4B566]" />
        </div>
        <div className="font-display font-bold text-2xl text-[#F0F3E8]">
          {loading ? '—' : `${stats?.cohortSurvivalRate ?? 100}%`}
        </div>
        <span className="font-mono text-[11px] text-[#AAB596] block truncate">
          Forestry vitality target
        </span>
      </div>
    </div>
  );
}
