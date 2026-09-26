import React, { useState, useRef } from 'react';
import growthLogService from '../../services/growthLogService';
import { GROWTH_STAGES, HEALTH_STATUSES } from '../../utils/constants';

export default function GrowthEntryForm({
  tree,
  trees = [],
  onClose,
  onSuccess,
}) {
  const [selectedTreeId, setSelectedTreeId] = useState(
    tree?.treeId || (trees.length > 0 ? trees[0].treeId : '')
  );

  // Measurements
  const [height, setHeight] = useState(
    tree?.latestHeight || tree?.initialHeight || tree?.height || ''
  );
  const [stemDiameter, setStemDiameter] = useState(
    tree?.latestStemDiameter || tree?.initialStemDiameter || tree?.stemDiameter || ''
  );
  const [leafCount, setLeafCount] = useState(
    tree?.latestLeafCount || tree?.initialLeafCount || tree?.leafCount || ''
  );
  const [fruitCount, setFruitCount] = useState('');
  const [stage, setStage] = useState(tree?.currentStage || 'Seedling');
  const [health, setHealth] = useState(tree?.healthStatus || 'Healthy');
  const [notes, setNotes] = useState('');

  // Photo upload
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedTreeId) {
      setErrorMessage('Please select a specimen tree or plant.');
      return;
    }

    if (!height || isNaN(parseFloat(height))) {
      setErrorMessage('Height measurement is required and must be a valid number.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('tree', selectedTreeId);
      formData.append('height', parseFloat(height));

      if (stemDiameter) {
        formData.append('stemDiameter', parseFloat(stemDiameter));
      }
      if (leafCount) {
        formData.append('leafCount', parseInt(leafCount, 10));
      }
      if (fruitCount) {
        formData.append('fruitCount', parseInt(fruitCount, 10));
      }

      formData.append('growthStage', stage);
      formData.append('healthStatus', health);
      formData.append('notes', notes.trim());

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await growthLogService.createLog(formData);
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error('[GrowthEntryForm] Submit failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to submit growth observation.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const targetTree = tree || trees.find((t) => t.treeId === selectedTreeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg my-auto rounded-2xl bg-[#262C14] border border-[#5D6A37] p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#A4B566] uppercase font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#8B9B4C] animate-pulse" />
              <span>FIELD OBSERVATION ENTRY</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
              Record Growth Telemetry
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1D230E] text-[#AAB596] hover:text-[#F0F3E8] flex items-center justify-center border border-[#4F5A2D] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="rounded-xl bg-[#431B1B] border border-[#E57373]/60 p-3 text-xs text-[#FFCDD2] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Specimen Selector / Banner */}
          {tree ? (
            <div className="p-3 rounded-xl bg-[#1D230E] border border-[#4F5A2D] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#8B9B4C] text-[20px]">park</span>
                <div>
                  <span className="font-mono text-xs font-bold text-[#F0F3E8]">
                    #{tree.treeId}
                  </span>
                  <span className="font-body-sm text-xs text-[#CCD6B8] block">
                    {tree.nickname || tree.species}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-[#333B1C] text-[#BDCE8A] border border-[#525E31]">
                {tree.location || 'Campus Plot'}
              </span>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold">
                Select Monitored Specimen *
              </label>
              <select
                value={selectedTreeId}
                onChange={(e) => setSelectedTreeId(e.target.value)}
                className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                required
              >
                {trees.map((t) => (
                  <option key={t.treeId} value={t.treeId}>
                    #{t.treeId} — {t.nickname || t.species} ({t.species})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Core Morphometrics (Height & Stem DBH) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold flex items-center justify-between">
                <span>Height (cm) *</span>
                <span className="text-[10px] text-[#A4B566]">Centimeters</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 145.5"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 pr-10 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                  required
                />
                <span className="absolute right-3 font-mono text-xs text-[#8B9B4C] pointer-events-none">
                  cm
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold flex items-center justify-between">
                <span>Trunk DBH (mm)</span>
                <span className="text-[10px] text-[#A4B566]">Millimeters</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 42.0"
                  value={stemDiameter}
                  onChange={(e) => setStemDiameter(e.target.value)}
                  className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 pr-10 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                />
                <span className="absolute right-3 font-mono text-xs text-[#8B9B4C] pointer-events-none">
                  mm
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Morphometrics (Leaf & Fruit Count) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold flex items-center justify-between">
                <span>Leaf Count</span>
                <span className="text-[10px] text-[#CCD6B8]">Approx.</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 180"
                value={leafCount}
                onChange={(e) => setLeafCount(e.target.value)}
                className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold flex items-center justify-between">
                <span>Fruit / Pod Count</span>
                <span className="text-[10px] text-[#CCD6B8]">If fruiting</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 12"
                value={fruitCount}
                onChange={(e) => setFruitCount(e.target.value)}
                className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
              />
            </div>
          </div>

          {/* Growth Stage & Health Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold">
                Phenological Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
              >
                {GROWTH_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold">
                Health Status
              </label>
              <select
                value={health}
                onChange={(e) => setHealth(e.target.value)}
                className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
              >
                {HEALTH_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Photo Upload Attachment */}
          <div>
            <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1.5 font-semibold">
              Observation Photo (Field Verification)
            </label>

            {photoPreview ? (
              <div className="relative w-full h-32 rounded-xl bg-[#1D230E] border border-[#525E31] overflow-hidden">
                <img
                  src={photoPreview}
                  alt="Observation preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 text-[#FFCDD2] border border-[#E57373]/50 font-mono text-xs flex items-center gap-1 hover:bg-black/90"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  <span>Remove</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 rounded-xl bg-[#1D230E] border-2 border-dashed border-[#525E31] hover:border-[#8B9B4C] flex flex-col items-center justify-center gap-1.5 text-[#CCD6B8] hover:text-[#F0F3E8] transition-colors"
              >
                <span className="material-symbols-outlined text-2xl text-[#8B9B4C]">add_a_photo</span>
                <span className="font-mono text-xs">Tap to capture or upload field photo</span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          {/* Notes & Field Observations */}
          <div>
            <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold">
              Field Notes / Ecological Observations
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Pruned dead lower branches, apical stem vigorous, applied organic compost..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#1D230E] border border-[#525E31] rounded-xl p-3 text-xs text-[#F0F3E8] placeholder:text-[#CCD6B8]/50 focus:outline-none focus:border-[#A4B566]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl bg-[#30371A] hover:bg-[#3D4721] text-[#CCD6B8] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-12 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] disabled:opacity-50 text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  <span>Saving Audit...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Commit Audit Log</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
