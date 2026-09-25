import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrees } from '../context/TreeContext';
import { SPECIES_PRESETS, GROWTH_STAGES, CAMPUS_COORDINATES } from '../utils/constants';
import LocationPickerMap from '../components/map/LocationPickerMap';
import QRCodeDisplay from '../components/tree/QRCodeDisplay';
import zoneService from '../services/zoneService';

export default function RegisterTreePage() {
  const navigate = useNavigate();
  const { addTree } = useTrees();

  // Basic Details
  const [species, setSpecies] = useState('Narra (Pterocarpus indicus)');
  const [customSpecies, setCustomSpecies] = useState('');
  const [nickname, setNickname] = useState('');
  const [healthStatus, setHealthStatus] = useState('Healthy');
  const [currentStage, setCurrentStage] = useState('Seedling');

  // Forest Zone / Campus Sector from MongoDB
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [loadingZones, setLoadingZones] = useState(true);
  const [showAddZoneInput, setShowAddZoneInput] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [isAddingZone, setIsAddingZone] = useState(false);

  // Map & GPS Coordinates (Defaults to CTU Barili Campus)
  const [coordinates, setCoordinates] = useState({
    lat: CAMPUS_COORDINATES.lat,
    lng: CAMPUS_COORDINATES.lng,
  });

  // Baseline Morphometrics
  const [height, setHeight] = useState(25); // in cm
  const [stemDiameter, setStemDiameter] = useState(8); // in mm
  const [leafCount, setLeafCount] = useState(12);
  const [notes, setNotes] = useState('');

  // Photo Upload
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Submission & Post-Registration State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [registeredTree, setRegisteredTree] = useState(null);

  // Fetch zones on mount
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setLoadingZones(true);
        const res = await zoneService.getZones();
        const zoneList = res.data || [];
        setZones(zoneList);
        if (zoneList.length > 0) {
          setSelectedZone(zoneList[0].name);
        } else {
          // If no zones in database yet, automatically reveal the input
          setShowAddZoneInput(true);
        }
      } catch (err) {
        console.error('[RegisterTree] Failed to load zones:', err);
      } finally {
        setLoadingZones(false);
      }
    };

    fetchZones();
  }, []);

  const handleAddNewZone = async (e) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    setIsAddingZone(true);
    try {
      const res = await zoneService.createZone({ name: newZoneName.trim() });
      const created = res.data;
      if (created) {
        setZones((prev) => {
          const exists = prev.some(
            (z) => z.name.toLowerCase() === created.name.toLowerCase()
          );
          return exists ? prev : [...prev, created];
        });
        setSelectedZone(created.name);
        setNewZoneName('');
        setShowAddZoneInput(false);
      }
    } catch (err) {
      console.error('[RegisterTree] Failed to add zone:', err);
      alert(err.response?.data?.message || 'Could not save new sector to database.');
    } finally {
      setIsAddingZone(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('Photo size must be less than 10MB.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setSubmitError('');
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const adjustMetric = (setter, val, delta, min = 0) => {
    setter(Math.max(min, Number((val + delta).toFixed(1))));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const finalSpecies = customSpecies.trim() || species;
    if (!finalSpecies) {
      setSubmitError('Please select or specify a botanical species.');
      return;
    }

    if (!selectedZone) {
      setSubmitError('Please select a Forest Zone / Campus Sector.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('species', finalSpecies);
      if (nickname.trim()) formData.append('nickname', nickname.trim());
      formData.append('location', selectedZone);
      formData.append('lat', coordinates.lat);
      formData.append('lng', coordinates.lng);
      formData.append('healthStatus', healthStatus);
      formData.append('currentStage', currentStage);
      formData.append('initialHeight', height);
      formData.append('initialStemDiameter', stemDiameter);
      formData.append('initialLeafCount', leafCount);
      if (notes.trim()) formData.append('notes', notes.trim());
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const createdTree = await addTree(formData);
      setRegisteredTree(createdTree);
    } catch (err) {
      console.error('[RegisterTree] Registration error:', err);
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to register specimen. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setRegisteredTree(null);
    setNickname('');
    setCustomSpecies('');
    setNotes('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setHeight(25);
    setStemDiameter(8);
    setLeafCount(12);
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-[#A4B566] uppercase tracking-wider font-semibold">
            FIELD REGISTRATION
          </span>
          <h2 className="font-headline-md text-headline-md text-[#F0F3E8] font-bold">
            Register Plant / Tree
          </h2>
          <p className="font-body-sm text-body-sm text-[#AAB596]">
            Catalog a new wildling or seedling with GPS pin, baseline metrics, and auto-generated QR tag.
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-[#30371A] border border-[#525E31] flex items-center justify-center text-[#A4B566] shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[24px]">add_task</span>
        </div>
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-[#431B1B]/80 border border-[#E57373]/60 text-[#FFCDD2] text-xs font-mono flex items-center gap-2.5 animate-in fade-in">
          <span className="material-symbols-outlined text-[20px] text-[#E57373]">error</span>
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Geospatial Location & Campus Sector */}
        <section className="bg-[#30371A] rounded-2xl p-5 shadow-sm border border-[#525E31] space-y-4">
          <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#A4B566] text-[22px]">
                pin_drop
              </span>
              <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
                Geospatial Location &amp; Sector
              </h3>
            </div>
            <span className="text-xs font-mono text-[#A4B566] bg-[#1D230E] px-2.5 py-1 rounded-full border border-[#525E31]">
              Interactive GPS Pin
            </span>
          </div>

          {/* Interactive Map Pin Placement */}
          <div>
            <label className="block text-xs font-mono font-medium text-[#C2CE9F] mb-1.5">
              Plant / Tree Coordinates (Tap map or drag marker)
            </label>
            <LocationPickerMap
              lat={coordinates.lat}
              lng={coordinates.lng}
              onLocationChange={setCoordinates}
            />
          </div>

          {/* Forest Zone / Campus Sector Dropdown (Fetched from MongoDB) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
                Forest Zone / Campus Sector <span className="text-[#E57373]">*</span>
              </label>
              {!showAddZoneInput && (
                <button
                  type="button"
                  onClick={() => setShowAddZoneInput(true)}
                  className="text-xs font-mono text-[#A4B566] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">add_circle</span>
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
                    onClick={handleAddNewZone}
                    disabled={isAddingZone || !newZoneName.trim()}
                    className="h-9 px-3 rounded-lg bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase disabled:opacity-50"
                  >
                    {isAddingZone ? 'Saving...' : 'Save Sector'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddZoneInput(false);
                      setNewZoneName('');
                    }}
                    className="h-9 px-2.5 rounded-lg bg-[#30371A] border border-[#525E31] text-xs font-mono text-[#AAB596]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="relative">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#A4B566] material-symbols-outlined text-[20px]">
                arrow_drop_down
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 2: Botanical Species & Specimen ID */}
        <section className="bg-[#30371A] rounded-2xl p-5 shadow-sm border border-[#525E31] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#4F5A2D] pb-3">
            <span className="material-symbols-outlined text-[#A4B566] text-[22px]">
              eco
            </span>
            <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
              Botanical Species &amp; Identification
            </h3>
          </div>

          {/* Quick Species Preset Chips */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-medium text-[#C2CE9F] block">
              Fast Presets (Philippine &amp; Campus Flora)
            </span>
            <div className="flex flex-wrap gap-2">
              {SPECIES_PRESETS.map((preset) => {
                const isSelected = species === preset && !customSpecies;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSpecies(preset);
                      setCustomSpecies('');
                    }}
                    className={`px-3 py-1.5 rounded-full font-mono text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-[#8B9B4C] text-[#1F240F] font-bold shadow-md border border-[#A4B566]'
                        : 'bg-[#1D230E] text-[#D8DFC8] border border-[#525E31] hover:bg-[#38411F]'
                    }`}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                    {preset.split(' (')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Species Input */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
              Or Custom Botanical Species Name (Scientific / Common)
            </label>
            <input
              type="text"
              placeholder="e.g. Swietenia macrophylla (Mahogany) or Ficus nota"
              value={customSpecies}
              onChange={(e) => setCustomSpecies(e.target.value)}
              className="w-full h-11 bg-[#1D230E] text-[#F0F3E8] rounded-xl px-3.5 border border-[#525E31] focus:outline-none focus:border-[#A4B566] text-sm"
            />
          </div>

          {/* Specimen Nickname / Tag */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
              Specimen Tag / Nickname (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Quad Sprout Alpha, Plot 4 Sapling"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full h-11 bg-[#1D230E] text-[#F0F3E8] rounded-xl px-3.5 border border-[#525E31] focus:outline-none focus:border-[#A4B566] text-sm"
            />
          </div>
        </section>

        {/* SECTION 3: Wildling Photo & Status */}
        <section className="bg-[#30371A] rounded-2xl p-5 shadow-sm border border-[#525E31] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#4F5A2D] pb-3">
            <span className="material-symbols-outlined text-[#A4B566] text-[22px]">
              photo_camera
            </span>
            <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
              Field Photo &amp; Health Assessment
            </h3>
          </div>

          {/* Photo Upload Container */}
          <div className="p-4 rounded-xl bg-[#1D230E] border border-[#525E31] flex flex-col sm:flex-row items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {photoPreview ? (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden ring-2 ring-[#8B9B4C] shrink-0 shadow-md">
                <img
                  src={photoPreview}
                  alt="Specimen preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/75 text-[#FFCDD2] flex items-center justify-center hover:bg-black transition-colors"
                  title="Remove photo"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-xl border-2 border-dashed border-[#525E31] hover:border-[#8B9B4C] flex flex-col items-center justify-center text-[#AAB596] hover:text-[#F0F3E8] cursor-pointer bg-[#262C14] transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[32px] text-[#A4B566] mb-1">
                  add_a_photo
                </span>
                <span className="font-mono text-[10px] text-center px-2">
                  Snap or Upload Photo
                </span>
              </div>
            )}

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <div>
                <h4 className="font-mono text-xs font-bold text-[#F0F3E8]">
                  Baseline Specimen Photo
                </h4>
                <p className="font-body-sm text-xs text-[#AAB596]">
                  Take a clear photo showing the whole wildling / plant, leaves, and tag for verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 px-4 rounded-xl bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-xs font-mono text-[#D8DFC8] inline-flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-[#A4B566]">upload</span>
                {photoPreview ? 'Change Photo' : 'Choose / Capture Photo'}
              </button>
            </div>
          </div>

          {/* Health Status & Growth Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Health Status Radio Chips */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
                Initial Health Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Healthy', val: 'Healthy', color: 'border-[#5D6A37] text-[#D2DCB4]' },
                  { label: 'Monitor', val: 'Monitoring', color: 'border-[#D99B26]/60 text-[#F5C26B]' },
                  { label: 'Attention', val: 'Needs Attention', color: 'border-[#E57373]/60 text-[#FFCDD2]' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setHealthStatus(item.val)}
                    className={`h-10 rounded-xl font-mono text-xs font-bold transition-all border ${
                      healthStatus === item.val
                        ? 'bg-[#1D230E] ring-2 ring-[#8B9B4C] shadow-sm ' + item.color
                        : 'bg-[#1D230E]/60 border-[#525E31]/60 text-[#8B9B70] hover:bg-[#1D230E]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Growth Stage Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
                Current Growth Stage
              </label>
              <select
                value={currentStage}
                onChange={(e) => setCurrentStage(e.target.value)}
                className="w-full h-10 bg-[#1D230E] text-[#F0F3E8] rounded-xl px-3 border border-[#525E31] focus:outline-none focus:border-[#A4B566] text-xs font-mono"
              >
                {GROWTH_STAGES.map((stg) => (
                  <option key={stg} value={stg}>
                    {stg}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 4: Baseline Morphometrics */}
        <section className="bg-[#30371A] rounded-2xl p-5 shadow-sm border border-[#525E31] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#4F5A2D] pb-3">
            <span className="material-symbols-outlined text-[#A4B566] text-[22px]">
              straighten
            </span>
            <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
              Baseline Measurements
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Height Stepper */}
            <div className="p-3 bg-[#1D230E] border border-[#525E31] rounded-xl flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] text-[#AAB596] block">
                  Height
                </span>
                <span className="font-mono text-lg text-[#F0F3E8] font-bold">
                  {height} <span className="text-xs text-[#8B9B4C]">cm</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustMetric(setHeight, height, -5, 1)}
                  className="w-8 h-8 rounded-lg bg-[#30371A] border border-[#525E31] text-[#D8DFC8] flex items-center justify-center hover:bg-[#3D4721]"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <button
                  type="button"
                  onClick={() => adjustMetric(setHeight, height, 5)}
                  className="w-8 h-8 rounded-lg bg-[#30371A] border border-[#525E31] text-[#D8DFC8] flex items-center justify-center hover:bg-[#3D4721]"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>

            {/* Stem Diameter Stepper */}
            <div className="p-3 bg-[#1D230E] border border-[#525E31] rounded-xl flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] text-[#AAB596] block">
                  Stem DBH
                </span>
                <span className="font-mono text-lg text-[#F0F3E8] font-bold">
                  {stemDiameter} <span className="text-xs text-[#8B9B4C]">mm</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustMetric(setStemDiameter, stemDiameter, -1, 1)}
                  className="w-8 h-8 rounded-lg bg-[#30371A] border border-[#525E31] text-[#D8DFC8] flex items-center justify-center hover:bg-[#3D4721]"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <button
                  type="button"
                  onClick={() => adjustMetric(setStemDiameter, stemDiameter, 1)}
                  className="w-8 h-8 rounded-lg bg-[#30371A] border border-[#525E31] text-[#D8DFC8] flex items-center justify-center hover:bg-[#3D4721]"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>

            {/* Leaf Count Stepper */}
            <div className="p-3 bg-[#1D230E] border border-[#525E31] rounded-xl flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] text-[#AAB596] block">
                  Leaf Count
                </span>
                <span className="font-mono text-lg text-[#F0F3E8] font-bold">
                  {leafCount} <span className="text-xs text-[#8B9B4C]">leaves</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustMetric(setLeafCount, leafCount, -1, 0)}
                  className="w-8 h-8 rounded-lg bg-[#30371A] border border-[#525E31] text-[#D8DFC8] flex items-center justify-center hover:bg-[#3D4721]"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <button
                  type="button"
                  onClick={() => adjustMetric(setLeafCount, leafCount, 1)}
                  className="w-8 h-8 rounded-lg bg-[#30371A] border border-[#525E31] text-[#D8DFC8] flex items-center justify-center hover:bg-[#3D4721]"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Initial Field Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
              Initial Field Notes &amp; Observations
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Planted near east irrigation canal, healthy root ball, staked with bamboo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#1D230E] text-[#F0F3E8] rounded-xl p-3 border border-[#525E31] focus:outline-none focus:border-[#A4B566] text-xs font-mono resize-none"
            />
          </div>
        </section>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 rounded-2xl bg-[#8B9B4C] hover:bg-[#9EAF6D] active:scale-[0.98] transition-all text-[#1F240F] font-mono text-sm font-bold uppercase tracking-wider shadow-xl flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-[#1F240F] border-t-transparent rounded-full animate-spin" />
              <span>Enrolling Specimen &amp; Uploading...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[24px]">app_registration</span>
              <span>Enroll Plant / Tree &amp; Generate QR Tag</span>
            </>
          )}
        </button>
      </form>

      {/* Post-Registration Success Modal with Downloadable QR Code */}
      {registeredTree && (
        <QRCodeDisplay
          tree={registeredTree}
          onClose={() => setRegisteredTree(null)}
          onRegisterAnother={handleResetForm}
        />
      )}
    </div>
  );
}
