import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../common/Icon';

/**
 * Tactical Action Toolbar for tree specimen profile
 */
export default function TreeActionToolbar({
  tree,
  canLog,
  onOpenLogModal,
  onOpenQRModal,
  onOpenReminderModal,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Primary Log Button */}
      {canLog && (
        <button
          type="button"
          onClick={onOpenLogModal}
          className="flex-1 min-w-[140px] h-11 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md"
        >
          <Icon name="add_a_photo" className="text-[18px]" />
          <span>Record Log</span>
        </button>
      )}

      {/* QR Code Tag Action */}
      <button
        type="button"
        onClick={onOpenQRModal}
        className="h-11 px-3.5 rounded-xl bg-[#262C14] hover:bg-[#30371A] border border-[#525E31] text-[#D8DFC8] font-mono text-xs font-medium flex items-center gap-1.5 transition-colors"
        title="View and download printable QR tag"
      >
        <Icon name="qr_code_2" className="text-[18px] text-[#A4B566]" />
        <span className="hidden sm:inline">QR Tag</span>
      </button>

      {/* Campus Map Action */}
      {tree?.coordinates?.lat && tree?.coordinates?.lng ? (
        <Link
          to={`/map?lat=${tree.coordinates.lat}&lng=${tree.coordinates.lng}&focus=${tree._id}`}
          className="h-11 px-3.5 rounded-xl bg-[#262C14] hover:bg-[#30371A] border border-[#525E31] text-[#D8DFC8] font-mono text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Locate specimen on campus forestry map"
        >
          <Icon name="map" className="text-[18px] text-[#A4B566]" />
          <span className="hidden sm:inline">View on Map</span>
        </Link>
      ) : null}

      {/* Schedule Care Reminder Action */}
      <button
        type="button"
        onClick={onOpenReminderModal}
        className="h-11 px-3.5 rounded-xl bg-[#262C14] hover:bg-[#30371A] border border-[#525E31] text-[#D8DFC8] font-mono text-xs font-medium flex items-center gap-1.5 transition-colors"
        title="Schedule care task or watering reminder"
      >
        <Icon name="alarm_add" className="text-[18px] text-[#A4B566]" />
        <span className="hidden sm:inline">Add Task</span>
      </button>
    </div>
  );
}
