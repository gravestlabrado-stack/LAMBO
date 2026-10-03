import React from 'react';
import Icon from '../common/Icon';
import { formatDate } from '../../utils/formatters';

/**
 * Cadet Compliance Roster Table with desktop table & mobile card responsive views
 */
export default function CadetRosterTable({
  roster = [],
  onSelectCadet,
}) {
  const getComplianceBadge = (status) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#3A4320] border border-[#5D6A37] text-[#D2DCB4] font-mono text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A4B566]"></span>
            Active
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#3A331A] border border-[#D99B26]/60 text-[#F5C26B] font-mono text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D99B26] animate-pulse"></span>
            Overdue
          </span>
        );
      case 'Delinquent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#431B1B] border border-[#E57373]/60 text-[#FFCDD2] font-mono text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E57373] animate-ping"></span>
            Delinquent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1D230E] border border-[#525E31] text-[#AAB596] font-mono text-[11px] font-semibold">
            Unassigned
          </span>
        );
    }
  };

  if (roster.length === 0) {
    return (
      <div className="rounded-2xl bg-[#262C14] border border-[#525E31] p-12 text-center space-y-2">
        <Icon name="search_off" className="w-10 h-10 text-[#8B9B4C] mx-auto opacity-70" />
        <h3 className="font-headline-sm text-base font-bold text-[#F0F3E8]">No Personnel Found</h3>
        <p className="font-mono text-xs text-[#AAB596]">
          No cadets match the active filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#262C14] border border-[#525E31] overflow-hidden shadow-lg">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#4F5A2D] bg-[#1D230E]/80 text-[#C2CE9F] font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold">Personnel</th>
              <th className="py-3.5 px-4 font-semibold">Course</th>
              <th className="py-3.5 px-4 font-semibold">Specimens</th>
              <th className="py-3.5 px-4 font-semibold">Last Log</th>
              <th className="py-3.5 px-4 font-semibold">Compliance</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3E4924]/60 font-mono text-xs">
            {roster.map((cadet) => {
              const isOfficer = cadet.role === 'officer';

              return (
                <tr
                  key={cadet.id}
                  className={`hover:bg-[#30371A]/70 transition-colors ${
                    isOfficer ? 'bg-[#30371A]/30' : ''
                  }`}
                >
                  {/* Personnel Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {cadet.avatar ? (
                        <img
                          src={cadet.avatar}
                          alt={cadet.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#525E31]"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#1D230E] border border-[#525E31] flex items-center justify-center font-bold text-[#A4B566]">
                          {cadet.name?.charAt(0) || 'C'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#F0F3E8] truncate block">
                            {cadet.name}
                          </span>
                          {isOfficer && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold text-amber-300">
                              OFFICER
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#AAB596]">#{cadet.rollNumber}</span>
                      </div>
                    </div>
                  </td>

                  {/* Course */}
                  <td className="py-3.5 px-4 text-[#D8DFC8]">
                    {cadet.course || 'Unspecified'}
                  </td>

                  {/* Specimens */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-[#D8DFC8]">
                      <span className="font-bold text-[#F0F3E8]">{cadet.totalTrees}</span>
                      <span className="text-[10px] text-[#AAB596]">
                        ({cadet.aliveTrees} alive / {cadet.deadTrees} dead)
                      </span>
                    </div>
                  </td>

                  {/* Last Log */}
                  <td className="py-3.5 px-4 text-[#D8DFC8]">
                    {cadet.lastLogDate ? (
                      <div>
                        <span>{formatDate(cadet.lastLogDate)}</span>
                        {cadet.daysSinceLastLog !== null && (
                          <span className="block text-[10px] text-[#AAB596]">
                            {cadet.daysSinceLastLog === 0
                              ? 'Today'
                              : `${cadet.daysSinceLastLog}d ago`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#AAB596]">No logs yet</span>
                    )}
                  </td>

                  {/* Compliance Status */}
                  <td className="py-3.5 px-4">
                    {getComplianceBadge(cadet.complianceStatus)}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectCadet(cadet.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-[#E4F5A6] font-mono text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <Icon name="search" className="w-3.5 h-3.5 text-[#8B9B4C]" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden divide-y divide-[#3E4924]/60">
        {roster.map((cadet) => (
          <div key={cadet.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {cadet.avatar ? (
                  <img
                    src={cadet.avatar}
                    alt={cadet.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#525E31]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1D230E] border border-[#525E31] flex items-center justify-center font-bold text-[#A4B566]">
                    {cadet.name?.charAt(0) || 'C'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-[#F0F3E8]">{cadet.name}</span>
                    {cadet.role === 'officer' && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[9px] font-bold text-amber-300">
                        OFFICER
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-[#AAB596]">
                    #{cadet.rollNumber} • {cadet.course || 'Unspecified'}
                  </span>
                </div>
              </div>
              {getComplianceBadge(cadet.complianceStatus)}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[#D8DFC8] pt-1">
              <span>
                Trees: <strong className="text-white">{cadet.totalTrees}</strong> ({cadet.aliveTrees} alive)
              </span>
              <button
                type="button"
                onClick={() => onSelectCadet(cadet.id)}
                className="px-3 py-1 rounded-lg bg-[#30371A] border border-[#525E31] text-[#E4F5A6] font-semibold text-xs flex items-center gap-1"
              >
                <Icon name="search" className="w-3.5 h-3.5" />
                <span>Inspect</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
