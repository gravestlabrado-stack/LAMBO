import React from 'react';
import Icon from '../common/Icon';

/**
 * Filter and Search Toolbar for Officer Cadet Roster
 */
export default function RosterFilterToolbar({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  complianceFilter,
  onComplianceFilterChange,
  courseFilter,
  onCourseFilterChange,
  courses = [],
  totalCount = 0,
  filteredCount = 0,
  onExportExcel,
  isExporting = false,
}) {
  return (
    <div className="space-y-3">
      {/* Search Input & Export Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Icon name="search" className="absolute left-3 top-3 text-[#AAB596] w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="Search by cadet name, roll number, or tree ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl pl-9 pr-8 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] placeholder-[#6E7B54]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-3 text-[#AAB596] hover:text-[#F0F3E8]"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Button & Counter */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="text-xs font-mono text-[#AAB596]">
            Showing <strong className="text-[#F0F3E8]">{filteredCount}</strong> of {totalCount}
          </span>
          <button
            type="button"
            onClick={onExportExcel}
            disabled={isExporting || totalCount === 0}
            className="h-10 px-3.5 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] active:scale-95 transition-all text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Icon name="download_for_offline" className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Dropdowns */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {/* Role Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#1D230E] rounded-xl border border-[#4F5A2D] shrink-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'cadet', label: 'Cadets' },
            { id: 'officer', label: 'Officers' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onRoleFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                roleFilter === tab.id
                  ? 'bg-[#8B9B4C] text-[#1F240F] shadow-sm'
                  : 'text-[#AAB596] hover:text-[#F0F3E8] hover:bg-[#283015]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Compliance Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'Active', 'Overdue', 'Delinquent'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onComplianceFilterChange(status)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-all ${
                complianceFilter === status
                  ? 'bg-[#8B9B4C] text-[#1F240F]'
                  : 'bg-[#262C14] text-[#AAB596] border border-[#525E31] hover:text-white'
              }`}
            >
              {status === 'all' ? 'All Status' : status}
            </button>
          ))}

          {/* Academic Course Filter Dropdown */}
          {courses.length > 0 && (
            <select
              value={courseFilter}
              onChange={(e) => onCourseFilterChange(e.target.value)}
              className="h-8 px-2.5 rounded-full bg-[#1D230E] border border-[#525E31] text-[11px] font-mono text-[#D8DFC8] focus:outline-none focus:border-[#A4B566]"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
