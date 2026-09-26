import React, { useState } from 'react';
import { formatDate } from '../../utils/formatters';
import { canUserEditOrDeleteLog } from '../../utils/permissions';

export default function GrowthTimeline({
  logs = [],
  onDeleteLog = null,
  onEditLog = null,
  currentUser = null,
  currentUserId = null,
  tree = null,
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-[#262C14] border border-[#4F5A2D] rounded-2xl p-8 text-center space-y-2">
        <span className="material-symbols-outlined text-3xl text-[#525E31]">
          history_toggle_off
        </span>
        <h4 className="font-display font-bold text-sm text-[#F0F3E8]">
          No Field Growth Audits Recorded
        </h4>
        <p className="text-xs text-[#CCD6B8] max-w-sm mx-auto">
          Record physical measurements (height, DBH, stage) to build the specimen's phenological audit ledger.
        </p>
      </div>
    );
  }

  // Sort latest first
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.loggedAt) - new Date(a.loggedAt)
  );

  return (
    <div className="space-y-4">
      {/* Timeline Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#A4B566]">
            event_note
          </span>
          <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
            Field Observation Ledger
          </h3>
        </div>
        <span className="font-mono text-xs font-semibold text-[#A4B566]">
          {logs.length} Total Audits
        </span>
      </div>

      {/* Timeline Container with Tactical Olive Drab Rail */}
      <div className="relative flex flex-col gap-4 pl-6">
        <div className="absolute left-2.5 top-3 bottom-6 w-0.5 bg-[#4F5A2D]" />

        {sortedLogs.map((log, index) => {
          const isLatest = index === 0;
          const auditor = log.loggedBy;
          const targetTree = tree || log.tree;
          const activeUser = currentUser || currentUserId;
          const canModify = canUserEditOrDeleteLog(activeUser, log, targetTree);

          // Calculate delta if previous chronological log exists
          const prevChronologicalLog = sortedLogs[index + 1];
          const heightDelta =
            prevChronologicalLog && log.height && prevChronologicalLog.height
              ? (log.height - prevChronologicalLog.height).toFixed(1)
              : null;
          const dbhDelta =
            prevChronologicalLog && log.stemDiameter && prevChronologicalLog.stemDiameter
              ? (log.stemDiameter - prevChronologicalLog.stemDiameter).toFixed(1)
              : null;

          return (
            <div
              key={log._id}
              className="relative flex flex-col bg-[#262C14] rounded-2xl p-4 sm:p-5 shadow-sm border border-[#4F5A2D] space-y-3 hover:border-[#8B9B4C]/80 transition-colors"
            >
              {/* Tactical Node Circle Indicator on Rail */}
              <div
                className={`absolute -left-[22px] top-5 w-4 h-4 rounded-full flex items-center justify-center ring-4 ring-[#1D230E] ${
                  isLatest ? 'bg-[#A4B566] shadow-md' : 'bg-[#3E4724] border border-[#5D6A35]'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLatest ? 'bg-[#1F240F]' : 'bg-[#A4B566]'
                  }`}
                />
              </div>

              {/* Card Header: Date & Time */}
              <div className="flex items-center justify-between pb-1 border-b border-[#38411F]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs sm:text-sm text-[#F0F3E8] font-bold">
                    {formatDate(log.loggedAt, true)}
                  </span>
                  {isLatest && (
                    <span className="px-2 py-0.5 rounded-full bg-[#3D4621] border border-[#5A6732] text-[#A4B566] font-mono text-[10px] font-bold">
                      Latest Audit
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-[#AAB596] mr-1">
                    {new Date(log.loggedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {onEditLog && canModify && (
                    <button
                      type="button"
                      onClick={() => onEditLog(log)}
                      className="text-[#AAB596] hover:text-[#A4B566] p-1 transition-colors rounded-lg hover:bg-[#30371A]"
                      title="Edit this observation log"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                  )}
                  {onDeleteLog && canModify && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Delete this growth observation entry?')) {
                          onDeleteLog(log._id);
                        }
                      }}
                      className="text-[#AAB596] hover:text-[#FFCDD2] p-1 transition-colors rounded-lg hover:bg-[#30371A]"
                      title="Delete this observation"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Metrics Grid Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Height */}
                <div className="bg-[#1D230E] p-2.5 rounded-xl border border-[#404A24]">
                  <span className="font-mono text-[10px] text-[#AAB596] block uppercase font-semibold">
                    Height
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono text-sm sm:text-base text-[#F0F3E8] font-bold">
                      {log.height}
                    </span>
                    <span className="font-mono text-[10px] text-[#AAB596]">cm</span>
                    {heightDelta !== null && (
                      <span
                        className={`ml-auto font-mono text-[10px] font-bold ${
                          parseFloat(heightDelta) >= 0 ? 'text-[#A4B566]' : 'text-[#FFCDD2]'
                        }`}
                      >
                        {parseFloat(heightDelta) >= 0 ? `+${heightDelta}` : heightDelta}
                      </span>
                    )}
                  </div>
                </div>

                {/* DBH */}
                <div className="bg-[#1D230E] p-2.5 rounded-xl border border-[#404A24]">
                  <span className="font-mono text-[10px] text-[#AAB596] block uppercase font-semibold">
                    Trunk DBH
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono text-sm sm:text-base text-[#F0F3E8] font-bold">
                      {log.stemDiameter ? log.stemDiameter : '—'}
                    </span>
                    <span className="font-mono text-[10px] text-[#AAB596]">mm</span>
                    {dbhDelta !== null && (
                      <span
                        className={`ml-auto font-mono text-[10px] font-bold ${
                          parseFloat(dbhDelta) >= 0 ? 'text-[#A4B566]' : 'text-[#FFCDD2]'
                        }`}
                      >
                        {parseFloat(dbhDelta) >= 0 ? `+${dbhDelta}` : dbhDelta}
                      </span>
                    )}
                  </div>
                </div>

                {/* Growth Stage */}
                <div className="bg-[#1D230E] p-2.5 rounded-xl border border-[#404A24]">
                  <span className="font-mono text-[10px] text-[#AAB596] block uppercase font-semibold">
                    Stage
                  </span>
                  <span className="font-mono text-xs font-bold text-[#A4B566] block truncate mt-0.5">
                    {log.growthStage || 'Vegetative'}
                  </span>
                </div>

                {/* Health Status */}
                <div className="bg-[#1D230E] p-2.5 rounded-xl border border-[#404A24]">
                  <span className="font-mono text-[10px] text-[#AAB596] block uppercase font-semibold">
                    Health
                  </span>
                  <span
                    className={`font-mono text-xs font-bold block truncate mt-0.5 ${
                      log.healthStatus === 'Healthy'
                        ? 'text-[#C2CE9F]'
                        : log.healthStatus === 'Monitoring'
                        ? 'text-[#F5C26B]'
                        : 'text-[#FFCDD2]'
                    }`}
                  >
                    {log.healthStatus || 'Healthy'}
                  </span>
                </div>
              </div>

              {/* Photo & Notes section */}
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                {log.photo && (
                  <div
                    onClick={() => setSelectedPhoto(log.photo)}
                    className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#1D230E] border border-[#525E31] cursor-pointer group shadow-sm"
                  >
                    <img
                      src={log.photo}
                      alt="Field observation"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px] text-white opacity-80 group-hover:opacity-100">
                        zoom_in
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1.5">
                  {log.notes ? (
                    <p className="font-body-sm text-xs text-[#CCD6B8] bg-[#1D230E] p-2.5 rounded-xl border border-[#38411F] leading-relaxed">
                      "{log.notes}"
                    </p>
                  ) : (
                    <p className="font-body-sm text-xs text-[#8B9B70] italic">
                      Routine field measurement audit recorded.
                    </p>
                  )}

                  {/* Auditor Info */}
                  <div className="flex items-center gap-1.5 text-mono text-[11px] text-[#A4B566]">
                    <span className="material-symbols-outlined text-[14px]">shield_person</span>
                    <span>
                      Audited by{' '}
                      <span className="font-bold text-[#F0F3E8]">
                        {typeof auditor === 'object' && auditor?.name
                          ? `${auditor.name} (${auditor.rollNumber || 'Student'})`
                          : 'Student Ranger'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal for enlarged photo */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 !m-0 z-[100] flex items-center justify-center p-4 bg-[#14180A]/60 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden border border-[#525E31] bg-[#1D230E] shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <img
              src={selectedPhoto}
              alt="Enlarged field observation"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center border border-white/30"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
