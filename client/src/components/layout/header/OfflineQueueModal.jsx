import React from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../common/Icon';
import { formatDate } from '../../../utils/formatters';

/**
 * Modal displaying pending offline growth logs awaiting sync
 */
export default function OfflineQueueModal({
  isOpen,
  onClose,
  queue = [],
  isSyncing,
  onRetrySync,
  onDeleteItem,
}) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#262C14] border border-[#5D6A37] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3">
          <div className="flex items-center gap-2">
            <Icon name="cloud_off" className="text-amber-400 text-[22px]" />
            <div>
              <h3 className="font-headline-sm text-sm sm:text-headline-sm text-[#F0F3E8] font-bold">
                Offline Observation Ledger
              </h3>
              <span className="font-label-sm text-label-sm text-[#C2CE9F]">
                {queue.length} observation(s) awaiting server sync
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#30371A] border border-[#525E31] text-[#AAB596] flex items-center justify-center hover:text-[#F0F3E8]"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>

        {/* Queue Items List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {queue.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-[#1D230E] border border-[#525E31]/40 space-y-2">
              <Icon name="cloud_done" className="text-emerald-400 text-[28px] mx-auto" />
              <p className="font-mono text-xs text-[#D8DFC8]">
                All field observations are synchronized with the campus server.
              </p>
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-[#1D230E] border border-[#525E31] flex items-center gap-3"
              >
                {item.photo ? (
                  <img
                    src={item.photo}
                    alt="Observation evidence"
                    className="w-12 h-12 rounded-lg object-cover border border-[#525E31] shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#30371A] border border-[#525E31] flex items-center justify-center shrink-0 text-[#AAB596]">
                    <Icon name="photo" className="text-[20px]" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-bold text-[#F0F3E8] truncate">
                      {item.treeId ? `#${item.treeId}` : 'Specimen'}
                    </span>
                    <span className="font-mono text-[10px] text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-500/20">
                      Pending
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#A4B566] block">
                    Height: {item.height} cm • Stage: {item.growthStage || 'Seedling'}
                  </span>
                  <span className="font-mono text-[9px] text-[#AAB596] block truncate">
                    Queued: {formatDate(item.queuedAt || item.loggedAt)}
                  </span>
                </div>

                {onDeleteItem && (
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-[#AAB596] hover:text-red-400 transition-colors"
                    title="Remove from queue"
                  >
                    <Icon name="delete" className="text-[16px]" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex gap-2.5 pt-2 border-t border-[#4F5A2D]">
          {queue.length > 0 && (
            <button
              type="button"
              onClick={onRetrySync}
              disabled={isSyncing}
              className="flex-1 h-10 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Icon name="sync" className={`text-[16px] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing Now...' : 'Sync All Pending'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-xs font-mono text-[#D8DFC8] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
