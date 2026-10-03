import React, { useState } from 'react';
import Icon from '../../common/Icon';
import LocationPickerMap from '../../map/LocationPickerMap';

export default function RegistrationLocationSection({
  coordinates,
  onLocationChange,
  selectedZone,
  onZoneChange,
  zones = [],
  loadingZones = false,
  onAddNewZone,
}) {
  const [showAddZoneInput, setShowAddZoneInput] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [isAddingZone, setIsAddingZone] = useState(false);

  const handleSaveSector = async (e) => {
    e.preventDefault();
    if (!newZoneName.trim() || !onAddNewZone) return;

    setIsAddingZone(true);
    try {
      await onAddNewZone(newZoneName.trim());
      setNewZoneName('');
      setShowAddZoneInput(false);
    } catch {
      // Error handled by parent or alert
    } finally {
      setIsAddingZone(false);
    }
  };

  return (
    <section className="bg-[#30371A] rounded-2xl p-5 shadow-sm border border-[#525E31] space-y-4">
      <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3">
        <div className="flex items-center gap-2">
          <Icon name="pin_drop" className="text-[#A4B566] w-5 h-5" />
          <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
            Geospatial Location &amp; Sector
          </h3>
        </div>
      </div>

      {/* Interactive Map Pin Placement */}
      <div>
        <label className="block text-xs font-mono font-medium text-[#C2CE9F] mb-1.5">
          Plant / Tree Coordinates (Tap map or drag marker)
        </label>
        <LocationPickerMap
          lat={coordinates.lat}
          lng={coordinates.lng}
          onLocationChange={onLocationChange}
        />
      </div>

      {/* Forest Zone / Campus Sector Dropdown (Fetched from MongoDB) */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
            Forest Zone / Campus Sector <span className="text-[#E57373]">*</span>
          </label>
          {!showAddZoneInput && onAddNewZone && (
            <button
              type="button"
              onClick={() => setShowAddZoneInput(true)}
              className="text-xs font-mono text-[#A4B566] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Icon name="add_circle" className="w-3.5 h-3.5" />
              Add New Sector
            </button>
          )}
        </div>

        {/* Inline Add New Sector Form */}
        {showAddZoneInput && (
          <div className="p-3 rounded-xl bg-[#1D230E] border border-[#8B9B4C] space-y-2 animate-in fade-in">
            <span className="text-[11px] font-mono text-[#C2CE9F] font-semibold block">
              Add New Campus Sector / Forest Zone to Database:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Zone 5A - Experimental Agroforest"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                className="flex-1 h-9 bg-[#262C14] border border-[#525E31] rounded-lg px-2.5 text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveSector}
                disabled={isAddingZone || !newZoneName.trim()}
                className="h-9 px-3 rounded-lg bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase disabled:opacity-50 cursor-pointer"
              >
                {isAddingZone ? 'Saving...' : 'Save Sector'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddZoneInput(false);
                  setNewZoneName('');
                }}
                className="h-9 px-2.5 rounded-lg bg-[#30371A] border border-[#525E31] text-xs font-mono text-[#AAB596] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <select
            value={selectedZone}
            onChange={(e) => onZoneChange(e.target.value)}
            disabled={loadingZones}
            className="w-full h-11 bg-[#1D230E] text-[#F0F3E8] rounded-xl px-3.5 border border-[#525E31] focus:outline-none focus:border-[#A4B566] text-sm appearance-none pr-10"
          >
            {loadingZones ? (
              <option value="">Loading campus zones from database...</option>
            ) : zones.length === 0 ? (
              <option value="">No sectors found. Click 'Add New Sector' above</option>
            ) : (
              zones.map((z) => (
                <option key={z._id || z.name} value={z.name}>
                  {z.name}
                </option>
              ))
            )}
          </select>
          <Icon
            name="arrow_drop_down"
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#A4B566] w-5 h-5"
          />
        </div>
      </div>
    </section>
  );
}
