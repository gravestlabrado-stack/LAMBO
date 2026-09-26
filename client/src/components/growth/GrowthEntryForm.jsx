import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import growthLogService from '../../services/growthLogService';
import { useAuth } from '../../hooks/useAuth';
import { canUserLogTree, canUserEditOrDeleteLog } from '../../utils/permissions';
import { GROWTH_STAGES, HEALTH_STATUSES } from '../../utils/constants';

export default function GrowthEntryForm({
  tree,
  trees = [],
  editingLog = null,
  onClose,
  onSuccess,
}) {
  const { user } = useAuth();

  const [selectedTreeId, setSelectedTreeId] = useState(
    editingLog?.tree?.treeId ||
      tree?.treeId ||
      (trees.length > 0 ? trees[0].treeId : '')
  );

  const targetTree =
    tree ||
    editingLog?.tree ||
    trees.find((t) => t.treeId === selectedTreeId) ||
    null;

  // Authorization check: Owner or supervisor
  const isAuthorized = editingLog
    ? canUserEditOrDeleteLog(user, editingLog, targetTree)
    : canUserLogTree(user, targetTree);

  // Measurements
  const [height, setHeight] = useState(
    editingLog?.height ??
      (tree?.latestHeight || tree?.initialHeight || tree?.height || '')
  );
  const [stemDiameter, setStemDiameter] = useState(
    editingLog?.stemDiameter ??
      (tree?.latestStemDiameter || tree?.initialStemDiameter || tree?.stemDiameter || '')
  );
  const [leafCount, setLeafCount] = useState(
    editingLog?.leafCount ??
      (tree?.latestLeafCount || tree?.initialLeafCount || tree?.leafCount || '')
  );
  const [fruitCount, setFruitCount] = useState(editingLog?.fruitCount ?? '');
  const [stage, setStage] = useState(
    editingLog?.growthStage || targetTree?.currentStage || 'Seedling'
  );
  const [health, setHealth] = useState(
    editingLog?.healthStatus || targetTree?.healthStatus || 'Healthy'
  );
  const [notes, setNotes] = useState(editingLog?.notes || '');

  // Photo upload (Camera & Gallery options)
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(editingLog?.photo || null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

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
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isAuthorized) {
      setErrorMessage(
        'Permission Denied: Only the specimen owner or authorized field supervisor can save observations.'
      );
      return;
    }

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

      if (stemDiameter !== '' && stemDiameter !== null) {
        formData.append('stemDiameter', parseFloat(stemDiameter));
      }
      if (leafCount !== '' && leafCount !== null) {
        formData.append('leafCount', parseInt(leafCount, 10));
      }
      if (fruitCount !== '' && fruitCount !== null) {
        formData.append('fruitCount', parseInt(fruitCount, 10));
      }

      formData.append('growthStage', stage);
      formData.append('healthStatus', health);
      formData.append('notes', notes.trim());

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      let res;
      if (editingLog?._id) {
        res = await growthLogService.updateLog(editingLog._id, formData);
      } else {
        res = await growthLogService.createLog(formData);
      }

      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error('[GrowthEntryForm] Submit failed:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit growth observation.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg my-auto rounded-2xl bg-[#262C14] border border-[#5D6A37] p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#A4B566] uppercase font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#8B9B4C] animate-pulse" />
              <span>{editingLog ? 'MODIFY LOG' : 'FIELD OBSERVATION ENTRY'}</span>
            </div>
            <h3 className="font-headline-sm text-base sm:text-lg text-[#F0F3E8] font-bold">
              {editingLog ? 'Edit Growth Telemetry' : 'Record Growth Telemetry'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1D230E] text-[#AAB596] hover:text-[#F0F3E8] flex items-center justify-center border border-[#4F5A2D] active:scale-95 transition-all"
            title="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Permission Alert if not authorized */}
          {!isAuthorized && (
            <div className="rounded-xl bg-[#431B1B] border border-[#E57373]/60 p-3.5 text-xs text-[#FFCDD2] flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] shrink-0 text-[#E57373]">lock</span>
              <div>
                <span className="font-bold block uppercase font-mono text-[11px]">
                  Restricted Observation Access
                </span>
                <span>
                  Only the specimen owner or authorized field supervisor can record or edit growth observations for this tree.
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-xl bg-[#431B1B] border border-[#E57373]/60 p-3 text-xs text-[#FFCDD2] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Specimen Tag Banner */}
          {targetTree ? (
            <div className="p-3 rounded-xl bg-[#1D230E] border border-[#4F5A2D] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-[#8B9B4C] text-[22px] shrink-0">park</span>
                <div className="min-w-0">
                  <span className="font-mono text-xs font-bold text-[#F0F3E8] block">
                    #{targetTree.treeId}
                  </span>
                  <span className="font-body-sm text-xs text-[#CCD6B8] block truncate">
                    {targetTree.nickname || targetTree.species}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-[#333B1C] text-[#BDCE8A] border border-[#525E31] shrink-0 truncate max-w-[150px]">
                {targetTree.location || 'Campus Plot'}
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

          {/* Biometrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Height Input */}
            <div>
              <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold">
                Height (cm) * <span className="text-[10px] text-[#AAB596] lowercase">centimeters</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10000"
                  placeholder="e.g. 145.5"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 font-mono text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                  required
                />
                <span className="absolute right-3 top-3 text-[11px] font-mono text-[#AAB596]">cm</span>
              </div>
            </div>

            {/* Stem DBH Input */}
            <div>
              <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold">
                Trunk DBH (mm) <span className="text-[10px] text-[#AAB596] lowercase">millimeters</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 42.0"
                  value={stemDiameter}
                  onChange={(e) => setStemDiameter(e.target.value)}
                  className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 font-mono text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                />
                <span className="absolute right-3 top-3 text-[11px] font-mono text-[#AAB596]">mm</span>
              </div>
            </div>

            {/* Leaf Count */}
            <div>
              <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold">
                Leaf Count <span className="text-[10px] text-[#AAB596] lowercase">approx.</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 180"
                value={leafCount}
                onChange={(e) => setLeafCount(e.target.value)}
                className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 font-mono text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
              />
            </div>

            {/* Fruit / Pod Count */}
            <div>
              <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold">
                Fruit / Pod Count <span className="text-[10px] text-[#AAB596] lowercase">if fruiting</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 12"
                value={fruitCount}
                onChange={(e) => setFruitCount(e.target.value)}
                className="w-full h-11 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 font-mono text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
              />
            </div>
          </div>

          {/* Phenological Stage & Health Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                {HEALTH_STATUSES.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Photo Upload Field */}
          <div>
            <label className="block text-xs font-mono text-[#C2CE9F] uppercase mb-1 font-semibold">
              Observation Photo (Field Verification)
            </label>
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-[#525E31] h-36 bg-black">
                <img
                  src={photoPreview}
                  alt="Observation verification"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-[#FFCDD2] flex items-center justify-center backdrop-blur-md active:scale-95 transition-all"
                  title="Remove photo"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="border-2 border-dashed border-[#525E31] hover:border-[#8B9B4C] rounded-xl p-3.5 text-center cursor-pointer bg-[#1D230E] hover:bg-[#262C14] transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group"
                >
                  <span className="material-symbols-outlined text-2xl text-[#A4B566] group-hover:scale-110 transition-transform">
                    photo_camera
                  </span>
                  <span className="font-mono text-xs font-bold text-[#F0F3E8]">Take Photo</span>
                  <span className="text-[10px] font-mono text-[#CCD6B8]">Direct Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="border-2 border-dashed border-[#525E31] hover:border-[#8B9B4C] rounded-xl p-3.5 text-center cursor-pointer bg-[#1D230E] hover:bg-[#262C14] transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group"
                >
                  <span className="material-symbols-outlined text-2xl text-[#8B9B4C] group-hover:scale-110 transition-transform">
                    photo_library
                  </span>
                  <span className="font-mono text-xs font-bold text-[#F0F3E8]">Choose File</span>
                  <span className="text-[10px] font-mono text-[#CCD6B8]">Gallery / Storage</span>
                </button>
              </div>
            )}

            {/* Direct Camera Input with capture="environment" */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            {/* Storage / Gallery File Picker */}
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
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
              className="flex-1 h-11 rounded-xl bg-[#30371A] hover:bg-[#3D4721] text-[#CCD6B8] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isAuthorized}
              className="flex-1 h-11 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] disabled:opacity-40 disabled:cursor-not-allowed text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>{editingLog ? 'Update Audit' : 'Commit Audit Log'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
