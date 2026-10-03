import React, { useState } from 'react';
import growthLogService from '../../services/growthLogService';
import { useAuth } from '../../hooks/useAuth';
import { canUserLogTree, canUserEditOrDeleteLog } from '../../utils/permissions';
import { enqueueOfflineLog } from '../../utils/offlineQueue';
import Icon from '../common/Icon';

// Modular Sub-Components
import ObservationPhotoPicker from './ObservationPhotoPicker';
import ObservationVitalitySelector from './ObservationVitalitySelector';
import ObservationMetricsInputs from './ObservationMetricsInputs';

/**
 * Growth Observation Entry Form
 * Supports mandatory photo capture, offline queueing, and Forestry Standard vitality ratings
 */
export default function GrowthEntryForm({
  tree,
  trees = [],
  editingLog = null,
  onCancel,
  onClose,
  onSuccess,
}) {
  const { user } = useAuth();
  const handleCancelAction = onCancel || onClose;

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

  // Form State
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
    editingLog?.healthStatus || targetTree?.healthStatus || 'Thriving'
  );
  const [notes, setNotes] = useState(editingLog?.notes || '');

  // Photo Evidence State
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(editingLog?.photo || null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) {
      setErrorMessage('You are not authorized to record observations for this specimen.');
      return;
    }

    if (!photoFile && !photoPreview && !editingLog?.photo) {
      setErrorMessage('Visual photographic evidence is mandatory for all observation entries.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const treeIdent = targetTree?._id || targetTree?.treeId || selectedTreeId;

    // Check if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        const queuedRecord = await enqueueOfflineLog({
          tree: targetTree?._id || treeIdent,
          treeId: targetTree?.treeId || selectedTreeId,
          height: parseFloat(height),
          stemDiameter: stemDiameter ? parseFloat(stemDiameter) : null,
          leafCount: leafCount ? parseInt(leafCount, 10) : null,
          fruitCount: fruitCount ? parseInt(fruitCount, 10) : null,
          growthStage: stage,
          healthStatus: health,
          notes: notes.trim(),
          photo: photoFile || photoPreview,
          loggedAt: new Date().toISOString(),
        });

        if (onSuccess) {
          onSuccess({
            ...queuedRecord,
            _isOfflineDraft: true,
          });
        }
        return;
      } catch (err) {
        setErrorMessage('Failed to queue offline entry: ' + err.message);
        setSubmitting(false);
        return;
      }
    }

    // Online submission via FormData
    try {
      const formData = new FormData();
      formData.append('tree', treeIdent);
      formData.append('height', height);
      if (stemDiameter) formData.append('stemDiameter', stemDiameter);
      if (leafCount) formData.append('leafCount', leafCount);
      if (fruitCount) formData.append('fruitCount', fruitCount);
      formData.append('growthStage', stage);
      formData.append('healthStatus', health);
      if (notes.trim()) formData.append('notes', notes.trim());

      if (photoFile) {
        formData.append('photo', photoFile);
      } else if (photoPreview) {
        formData.append('photo', photoPreview);
      }

      let res;
      if (editingLog) {
        res = await growthLogService.updateLog(editingLog._id || editingLog.id, formData);
      } else {
        res = await growthLogService.createLog(formData);
      }

      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err) {
      // If network dropped during request, fallback to offline queue
      if (!navigator.onLine || err.message?.includes('Network Error')) {
        try {
          const queued = await enqueueOfflineLog({
            tree: targetTree?._id || treeIdent,
            treeId: targetTree?.treeId || selectedTreeId,
            height: parseFloat(height),
            stemDiameter: stemDiameter ? parseFloat(stemDiameter) : null,
            leafCount: leafCount ? parseInt(leafCount, 10) : null,
            fruitCount: fruitCount ? parseInt(fruitCount, 10) : null,
            growthStage: stage,
            healthStatus: health,
            notes: notes.trim(),
            photo: photoFile || photoPreview,
            loggedAt: new Date().toISOString(),
          });
          if (onSuccess) onSuccess({ ...queued, _isOfflineDraft: true });
          return;
        } catch (queueErr) {
          setErrorMessage('Error queueing offline log: ' + queueErr.message);
        }
      } else {
        setErrorMessage(err.response?.data?.message || err.message || 'Failed to submit log entry.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-700/80 text-red-200 text-xs font-mono">
          {errorMessage}
        </div>
      )}

      {/* Specimen Selector if multiple trees available */}
      {trees.length > 1 && !tree && !editingLog && (
        <div className="space-y-1">
          <label className="block text-xs font-mono font-bold text-[#E4F5A6] uppercase tracking-wider">
            Select Specimen *
          </label>
          <select
            value={selectedTreeId}
            onChange={(e) => setSelectedTreeId(e.target.value)}
            className="w-full h-10 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
          >
            {trees.map((t) => (
              <option key={t.treeId} value={t.treeId}>
                #{t.treeId} — {t.nickname ? `${t.nickname} (${t.species})` : t.species}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Mandatory Photo Evidence Picker */}
      <ObservationPhotoPicker
        photoFile={photoFile}
        photoPreview={photoPreview}
        onPhotoSelected={(file, preview) => {
          setPhotoFile(file);
          setPhotoPreview(preview);
          setErrorMessage('');
        }}
        onRemovePhoto={() => {
          setPhotoFile(null);
          setPhotoPreview(null);
        }}
        disabled={submitting}
      />

      {/* Forestry Standard Vitality Selector */}
      <ObservationVitalitySelector
        value={health}
        onChange={setHealth}
        disabled={submitting}
      />

      {/* Botanical Telemetry Inputs */}
      <ObservationMetricsInputs
        height={height}
        onHeightChange={setHeight}
        stemDiameter={stemDiameter}
        onStemDiameterChange={setStemDiameter}
        leafCount={leafCount}
        onLeafCountChange={setLeafCount}
        fruitCount={fruitCount}
        onFruitCountChange={setFruitCount}
        growthStage={stage}
        onGrowthStageChange={setStage}
        disabled={submitting}
      />

      {/* Field Notes */}
      <div className="space-y-1">
        <label className="block text-xs font-mono font-medium text-[#C2CE9F] uppercase tracking-wider">
          Field Notes & Observations
        </label>
        <textarea
          rows={3}
          value={notes}
          disabled={submitting}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Added mulch around root perimeter. Minor leaf yellowing under control."
          className="w-full bg-[#1D230E] border border-[#525E31] rounded-xl p-3 text-xs font-mono text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] placeholder-[#5B664B]"
        />
      </div>

      {/* Form Action Buttons */}
      <div className="flex gap-2.5 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 h-11 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-[#1F240F] border-t-transparent rounded-full animate-spin" />
              <span>Recording...</span>
            </>
          ) : (
            <>
              <Icon name="check_circle" className="text-[18px]" />
              <span>{editingLog ? 'Update Entry' : 'Submit Observation'}</span>
            </>
          )}
        </button>

        {handleCancelAction && (
          <button
            type="button"
            onClick={handleCancelAction}
            disabled={submitting}
            className="h-11 px-5 rounded-xl bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-xs font-mono text-[#D8DFC8] transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
