import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../common/Icon';
import officerService from '../../services/officerService';
import { formatDate } from '../../utils/formatters';

/**
 * Detailed Cadet Inspection Drawer / Modal for Officers
 */
export default function CadetInspectionModal({
  cadetId,
  isOpen,
  onClose,
  onOpenPhoto,
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cadetId || !isOpen) {
      setDetails(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    officerService
      .getCadetInspection(cadetId)
      .then((res) => {
        if (isMounted) {
          setDetails(res.data || null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load cadet inspection details');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [cadetId, isOpen]);

  if (!isOpen || !cadetId || typeof document === 'undefined') return null;

  const cadet = details?.cadet;
  const specimens = details?.specimens || [];
  const recentLogs = details?.recentLogs || [];

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-[#262C14] border-l border-[#5D6A37] p-5 sm:p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right-10 duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-4">
          <div className="flex items-center gap-2.5">
            <Icon name="verified_user" className="text-[#A4B566] text-[24px]" />
            <div>
              <h2 className="font-headline-sm text-base sm:text-lg font-bold text-[#F0F3E8]">
                Cadet Field Inspection
              </h2>
              <span className="font-mono text-xs text-[#C2CE9F]">
                Observation audit & specimen verification
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#30371A] border border-[#525E31] text-[#AAB596] flex items-center justify-center hover:text-white"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-2">
            <Icon name="progress_activity" className="text-3xl text-[#8B9B4C] animate-spin mx-auto" />
            <p className="font-mono text-xs text-[#AAB596]">Loading cadet telemetry...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-700 text-red-200 font-mono text-xs">
            {error}
          </div>
        ) : cadet ? (
          <>
            {/* Cadet Info Card */}
            <div className="p-4 rounded-2xl bg-[#1D230E] border border-[#525E31] space-y-3">
              <div className="flex items-center gap-3">
                {cadet.avatar ? (
                  <img
                    src={cadet.avatar}
                    alt={cadet.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#8B9B4C]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#30371A] border border-[#525E31] flex items-center justify-center font-bold text-xl text-[#A4B566]">
                    {cadet.name?.charAt(0) || 'C'}
                  </div>
                )}
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-[#F0F3E8]">
                    {cadet.name}
                  </h3>
                  <span className="font-mono text-xs text-[#C2CE9F] block">
                    Roll #{cadet.rollNumber} • {cadet.course || 'Unspecified Course'}
                  </span>
                  <span className="font-mono text-[10px] text-[#AAB596] block pt-0.5">
                    {cadet.phone ? `Phone: ${cadet.phone} • ` : ''}Enrolled: {formatDate(cadet.enrolledAt)}
                  </span>
                </div>
              </div>

              {/* Mini KPIs */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#3E4924]/60 text-center font-mono">
                <div className="p-2 rounded-lg bg-[#262C14]">
                  <span className="block text-[10px] text-[#AAB596]">Survival</span>
                  <strong className="text-sm text-emerald-400">{details.survivalRate}%</strong>
                </div>
                <div className="p-2 rounded-lg bg-[#262C14]">
                  <span className="block text-[10px] text-[#AAB596]">Trees</span>
                  <strong className="text-sm text-[#F0F3E8]">{details.totalTrees}</strong>
                </div>
                <div className="p-2 rounded-lg bg-[#262C14]">
                  <span className="block text-[10px] text-[#AAB596]">Total Logs</span>
                  <strong className="text-sm text-[#8B9B4C]">{details.totalLogs}</strong>
                </div>
              </div>
            </div>

            {/* Assigned Specimens */}
            <div className="space-y-2.5">
              <h4 className="font-mono text-xs text-[#C2CE9F] uppercase font-bold tracking-wider">
                Assigned Specimens ({specimens.length})
              </h4>
              <div className="space-y-2">
                {specimens.length === 0 ? (
                  <p className="font-mono text-xs text-[#AAB596] italic">No trees assigned to this cadet.</p>
                ) : (
                  specimens.map((tree) => {
                    const thumb = tree.photos && tree.photos.length > 0 ? tree.photos[0].url : null;

                    return (
                      <div
                        key={tree._id}
                        className="p-3 rounded-xl bg-[#1D230E] border border-[#525E31] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={tree.species}
                              onClick={() => onOpenPhoto && onOpenPhoto(thumb)}
                              className="w-10 h-10 rounded-lg object-cover border border-[#525E31] cursor-pointer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#30371A] flex items-center justify-center text-[#AAB596]">
                              <Icon name="psychiatry" className="text-[18px]" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-mono text-xs font-bold text-[#F0F3E8] block truncate">
                              #{tree.treeId} — {tree.nickname || tree.species}
                            </span>
                            <span className="font-mono text-[10px] text-[#AAB596] block truncate">
                              {tree.species} • {tree.currentStage || 'Seedling'}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#30371A] text-[#A4B566] border border-[#525E31]">
                          {tree.healthStatus || 'Thriving'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Growth Observations Timeline with Photographic Evidence */}
            <div className="space-y-2.5">
              <h4 className="font-mono text-xs text-[#C2CE9F] uppercase font-bold tracking-wider">
                Photographic Audit History ({recentLogs.length})
              </h4>

              <div className="space-y-3">
                {recentLogs.length === 0 ? (
                  <p className="font-mono text-xs text-[#AAB596] italic">No observation logs submitted.</p>
                ) : (
                  recentLogs.map((log) => (
                    <div
                      key={log._id}
                      className="p-3.5 rounded-xl bg-[#1D230E] border border-[#525E31] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#E4F5A6]">
                          {log.tree ? `#${log.tree.treeId}` : 'Specimen'}
                        </span>
                        <span className="font-mono text-[10px] text-[#AAB596]">
                          {formatDate(log.loggedAt)}
                        </span>
                      </div>

                      {/* Photo Thumbnail */}
                      {log.photo && (
                        <div className="relative rounded-lg overflow-hidden border border-[#525E31] h-36 bg-black">
                          <img
                            src={log.photo}
                            alt="Observation proof"
                            onClick={() => onOpenPhoto && onOpenPhoto(log.photo)}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
                            📸 Verified Proof
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                        <span className="text-[#C2CE9F]">Height: <strong>{log.height} cm</strong></span>
                        <span className="text-[#C2CE9F]">Vitality: <strong>{log.healthStatus}</strong></span>
                      </div>

                      {log.notes && (
                        <p className="font-mono text-[11px] text-[#D8DFC8] bg-[#262C14] p-2 rounded-lg italic">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
