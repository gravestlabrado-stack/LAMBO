import React from 'react';
import Icon from '../../common/Icon';

/**
 * Tactical Connection Radar Pill displayed in the Header
 */
export default function ConnectionRadar({
  isOnline,
  isSavingDb,
  isSyncing,
  justSynced,
  offlineCount = 0,
  onRetrySync,
  onOpenQueue,
}) {
  if (isSavingDb) {
    return (
      <div
        title="Writing botanical records to local IndexedDB"
        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#38411F] border border-[#8B9B4C]/70 text-[#E1E6BC] font-mono text-[10px] sm:text-[11px] animate-pulse select-none"
      >
        <Icon name="progress_activity" className="text-[12px] text-[#A4B566] animate-spin" />
        <span className="font-semibold text-[#A4B566]">DB Active</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div
        title="Synchronizing offline observation records to campus database"
        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D99B26]/30 border border-[#D99B26] text-[#F5C26B] font-mono text-[10px] sm:text-[11px] shadow-sm select-none"
      >
        <Icon name="sync" className="text-[13px] text-[#F5C26B] animate-spin" />
        <span className="font-bold">Syncing...</span>
      </div>
    );
  }

  if (justSynced) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2D3F1E] border border-[#7A9330] text-[#E4F5A6] font-mono text-[10px] sm:text-[11px] shadow-sm animate-in fade-in select-none"
      >
        <Icon name="check_circle" className="text-[13px] text-[#A4B566]" />
        <span className="font-bold">Synced ✓</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#3A1818] border border-[#8C3A3A] text-[#FFBDBD] font-mono text-[10px] sm:text-[11px] select-none"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="font-bold tracking-tight">Offline</span>
        {offlineCount > 0 && (
          <button
            type="button"
            onClick={onOpenQueue}
            title={`${offlineCount} observation(s) waiting in offline queue`}
            className="px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[9px] font-bold hover:bg-amber-500/50 transition-colors"
          >
            {offlineCount}
          </button>
        )}
        <button
          type="button"
          onClick={onRetrySync}
          title="Tap to retry connection & sync records"
          aria-label="Retry connection and sync records"
          className="ml-0.5 p-1 rounded-full bg-red-950/80 hover:bg-red-900/90 border border-red-700/60 text-red-200 hover:text-white flex items-center justify-center active:scale-90 transition-all"
        >
          <Icon name="sync" className="text-[11px]" />
        </button>
      </div>
    );
  }

  // State: Online
  return (
    <div
      title="Connected to CTU Barili Campus Forestry Network"
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#202810]/70 border border-[#525E31]/80 text-[#D2DEB0] font-mono text-[10px] sm:text-[11px] select-none"
    >
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="font-medium text-[#D2DEB0] hidden xs:inline">Online</span>
      {offlineCount > 0 && (
        <button
          type="button"
          onClick={onOpenQueue}
          title={`${offlineCount} observations in queue. Tap to sync.`}
          className="ml-0.5 px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[9px] font-bold hover:bg-amber-500/50"
        >
          {offlineCount}
        </button>
      )}
    </div>
  );
}
