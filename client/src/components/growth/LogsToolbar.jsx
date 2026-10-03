import React from 'react';
import Icon from '../common/Icon';

export default function LogsToolbar({
  onRecordEntry,
  onExportExcel,
  exporting = false,
  hasLogs = false,
  exportNotice = null,
  error = null,
}) {
  return (
    <div className="space-y-3">
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
            onClick={onRecordEntry}
            className="h-10 px-3.5 rounded-full bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Icon name="add_circle" className="text-[18px]" />
            <span>Record Entry</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            disabled={exporting || !hasLogs}
            className="h-10 px-3.5 rounded-full bg-[#30371A] hover:bg-[#3D4721] disabled:opacity-50 disabled:cursor-not-allowed text-[#CCD6B8] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            title="Download full observation ledger as Excel (.xlsx)"
          >
            {exporting ? (
              <>
                <Icon name="progress_activity" className="text-[18px] text-[#A4B566] animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Icon name="download" className="text-[18px] text-[#A4B566]" />
                <span>Excel Export</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-time Download Feedback Banner */}
      {exportNotice === 'exporting' && (
        <div className="flex items-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#38411F] border border-[#5D6A37] text-xs font-mono text-[#D8DFC8] shadow-md animate-in fade-in slide-in-from-top-1">
          <Icon name="progress_activity" className="text-[18px] text-[#A4B566] animate-spin" />
          <span>Preparing and compiling Excel (.xlsx) growth ledger... please wait</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#4A1E1E] border border-[#8C3A3A] text-xs font-mono text-[#F5C6C6] shadow-md animate-in fade-in slide-in-from-top-1">
          <Icon name="error" className="text-[18px] text-[#FF8585]" />
          <span>{error}</span>
        </div>
      )}
      {exportNotice === 'success' && (
        <div className="flex items-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#2D3F1E] border border-[#7A9330] text-xs font-mono text-[#E4F5A6] shadow-md animate-in fade-in slide-in-from-top-1">
          <Icon name="check_circle" className="text-[18px] text-[#A4B566]" />
          <span>Spreadsheet download initiated! Check your downloads folder.</span>
        </div>
      )}
      {exportNotice === 'error' && (
        <div className="flex items-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#4A1E1E] border border-[#8C3A3A] text-xs font-mono text-[#F5C6C6] shadow-md animate-in fade-in slide-in-from-top-1">
          <Icon name="error" className="text-[18px] text-[#FF8585]" />
          <span>Failed to compile spreadsheet. Please try again.</span>
        </div>
      )}
    </div>
  );
}
