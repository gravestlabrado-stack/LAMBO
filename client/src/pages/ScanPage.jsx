import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScannerView from '../components/scan/QRScannerView';
import GrowthEntryForm from '../components/growth/GrowthEntryForm';
import ErrorBoundary from '../components/common/ErrorBoundary';
import treeService from '../services/treeService';
import { useAuth } from '../hooks/useAuth';
import { canUserLogTree } from '../utils/permissions';

/**
 * Extract clean Tree ID from decoded QR string, URL, or JSON payload
 */
const extractTreeId = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();

  // Try parsing JSON if encoded as object
  try {
    const parsed = JSON.parse(str);
    if (parsed.treeId) return String(parsed.treeId).trim().replace(/^#/, '');
    if (parsed.id) return String(parsed.id).trim().replace(/^#/, '');
  } catch (e) {}

  // If it's a URL, extract path segment or query param
  if (str.includes('/') || str.includes('?')) {
    try {
      const url = new URL(str, window.location.origin);
      const idParam =
        url.searchParams.get('id') ||
        url.searchParams.get('treeId') ||
        url.searchParams.get('focus');
      if (idParam) return idParam.replace(/^#/, '');
      const segments = url.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1];
      if (last && last !== 'trees' && last !== 'scan') {
        return last.replace(/^#/, '');
      }
    } catch (e) {
      const segments = str.split(/[/?#&]/).filter(Boolean);
      const last = segments[segments.length - 1];
      if (last) return last.replace(/^#/, '');
    }
  }

  // Remove leading '#' or whitespace
  return str.replace(/^#/, '').trim();
};

export default function ScanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [manualId, setManualId] = useState('');
  const [detectedSpecimen, setDetectedSpecimen] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Growth Entry modal state
  const [showLogModal, setShowLogModal] = useState(false);

  // Handle successful QR code decode or direct search
  const handleScan = async (rawText) => {
    if (!rawText || isSearching) return;
    const cleanId = extractTreeId(rawText);
    if (!cleanId) return;

    setIsSearching(true);
    setSearchError('');
    try {
      const res = await treeService.getTreeById(cleanId);
      if (res.data) {
        setDetectedSpecimen(res.data);
      } else {
        setSearchError(`Tree #${cleanId} not found in database.`);
      }
    } catch (err) {
      console.warn('[ScanPage] Specimen lookup error:', err);
      const msg =
        err.response?.data?.message || `Specimen #${cleanId} not found in database.`;
      setSearchError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualLookup = async (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    handleScan(manualId);
  };

  const canLogSpecimen = canUserLogTree(user, detectedSpecimen);

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B9B4C] animate-pulse" />
            <span className="font-label-sm text-label-sm text-[#A4B566] uppercase font-mono tracking-wider font-semibold">
              OPTICAL IDENTIFICATION
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-[#F0F3E8] font-bold mt-0.5">
            Specimen QR Scanner
          </h2>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#1D230E] border border-[#525E31] self-start sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'camera'
                ? 'bg-[#8B9B4C] text-[#1F240F] shadow-md'
                : 'text-[#CCD6B8] hover:text-[#F0F3E8]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            <span>Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-[#8B9B4C] text-[#1F240F] shadow-md'
                : 'text-[#CCD6B8] hover:text-[#F0F3E8]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">pin</span>
            <span>Manual Tag Entry</span>
          </button>
        </div>
      </div>

      {/* Global Lookup Error Banner */}
      {searchError && (
        <div className="rounded-xl bg-[#431B1B] border border-[#E57373]/60 p-3 text-xs text-[#FFCDD2] flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{searchError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSearchError('')}
            className="text-[#FFCDD2] hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Active Tab Viewport */}
      {activeTab === 'camera' ? (
        <div className="space-y-4">
          {/* Tactical Camera Viewfinder */}
          <ErrorBoundary
            title="Viewfinder Standby"
            fallback={(err, reset) => (
              <div className="relative w-full aspect-[4/5] max-h-[460px] rounded-2xl overflow-hidden bg-[#14180A] border border-[#5D6A37] shadow-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#1D230E] border border-[#5D6A37] flex items-center justify-center text-[#A4B566]">
                  <span className="material-symbols-outlined text-3xl">photo_camera</span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-headline-sm text-sm font-bold text-[#F0F3E8]">
                    Field Viewfinder Standby
                  </h4>
                  <p className="text-xs text-[#CCD6B8] max-w-xs mx-auto">
                    Camera module is in standby. You can switch to manual entry mode or restart the camera.
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className="h-9 px-4 rounded-xl bg-[#8B9B4C] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider active:scale-95"
                  >
                    Manual Tag Entry
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="h-9 px-4 rounded-xl bg-[#262C14] text-[#CCD6B8] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider active:scale-95"
                  >
                    Restart Viewfinder
                  </button>
                </div>
              </div>
            )}
          >
            <QRScannerView
              onScan={handleScan}
              isLocked={Boolean(detectedSpecimen)}
              scannedId={detectedSpecimen?.treeId}
            />
          </ErrorBoundary>
        </div>
      ) : (
        /* Manual ID Search Mode */
        <div className="p-6 rounded-2xl bg-[#262C14] border border-[#4F5A2D] shadow-lg space-y-4">
          <div className="text-center max-w-sm mx-auto space-y-1">
            <span className="material-symbols-outlined text-4xl text-[#A4B566]">pin</span>
            <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
              Direct Specimen ID Lookup
            </h3>
            <p className="text-xs text-[#CCD6B8]">
              Enter the unique sequential code printed on the physical stake tag (e.g. LMB-0001).
            </p>
          </div>

          <form onSubmit={handleManualLookup} className="space-y-3 max-w-xs mx-auto">
            <input
              type="text"
              placeholder="e.g. LMB-0001"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="w-full h-12 bg-[#1D230E] border border-[#525E31] rounded-xl px-4 text-center font-mono text-base font-bold text-[#F0F3E8] uppercase tracking-widest focus:outline-none focus:border-[#A4B566]"
              required
            />
            <button
              type="submit"
              disabled={isSearching}
              className="w-full h-12 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] disabled:opacity-50 text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>{isSearching ? 'Searching Database...' : 'Retrieve Telemetry Record'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Detected Specimen Action Dock (Available in both Camera & Manual Search) */}
      {detectedSpecimen && (
        <div className="p-5 rounded-2xl bg-[#262C14] border border-[#8B9B4C] shadow-2xl space-y-3.5 animate-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-[#1D230E] border border-[#525E31] flex items-center justify-center text-[#8B9B4C] shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-[28px]">park</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#1D230E] text-[#A4B566] border border-[#525E31] font-mono text-xs font-bold">
                    #{detectedSpecimen.treeId}
                  </span>
                  <span className="font-mono text-[11px] text-[#A4B566] uppercase font-bold tracking-wide">
                    IDENTIFIED
                  </span>
                </div>
                <h3 className="font-headline-sm text-base font-bold text-[#F0F3E8] mt-0.5 truncate">
                  {detectedSpecimen.nickname || detectedSpecimen.species}
                </h3>
                <span className="font-body-sm text-xs text-[#CCD6B8] italic block truncate">
                  {detectedSpecimen.species}
                </span>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full font-mono text-xs font-semibold shrink-0 border ${
                detectedSpecimen.healthStatus === 'Healthy'
                  ? 'bg-[#3A4320] border-[#5D6A37] text-[#D2DCB4]'
                  : detectedSpecimen.healthStatus === 'Monitoring'
                  ? 'bg-[#3A331A] border-[#D99B26]/60 text-[#F5C26B]'
                  : 'bg-[#431B1B] border-[#E57373]/60 text-[#FFCDD2]'
              }`}
            >
              {detectedSpecimen.healthStatus || 'Healthy'}
            </span>
          </div>

          {/* Specimen Telemetry Row */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#1D230E] p-3 rounded-xl border border-[#404A24]">
            <div>
              <span className="text-[#AAB596] block text-[10px] uppercase">Campus Sector</span>
              <span className="text-[#F0F3E8] font-bold truncate block">
                {detectedSpecimen.location || 'CTU Barili Campus'}
              </span>
            </div>
            <div>
              <span className="text-[#AAB596] block text-[10px] uppercase">Growth Stage</span>
              <span className="text-[#A4B566] font-bold block">
                {detectedSpecimen.currentStage || 'Seedling'}
              </span>
            </div>
          </div>

          {/* Owner Info & Permission Notice */}
          {!canLogSpecimen && (
            <div className="px-3 py-2 rounded-xl bg-[#1D230E]/70 border border-[#525E31]/40 flex items-center justify-between text-xs font-mono">
              <span className="text-[#AAB596]">Specimen Caretaker:</span>
              <span className="text-[#CCD6B8] font-semibold">
                {detectedSpecimen.owner?.name || 'Registered Student'}
              </span>
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => navigate(`/trees/${detectedSpecimen.treeId}`)}
              className="h-11 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
              <span>Open Profile</span>
            </button>

            {canLogSpecimen ? (
              <button
                type="button"
                onClick={() => setShowLogModal(true)}
                className="h-11 rounded-xl bg-[#30371A] hover:bg-[#3D4721] text-[#A4B566] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">straighten</span>
                <span>Log Growth</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                title="Growth logging is restricted to the specimen caretaker or field supervisor"
                className="h-11 rounded-xl bg-[#1D230E] text-[#697549] border border-[#3A431F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed opacity-75"
              >
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span>Owner Only</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => navigate(`/map?focus=${detectedSpecimen.treeId}`)}
              className="font-mono text-xs text-[#CCD6B8] hover:text-[#F0F3E8] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px] text-[#A4B566]">pin_drop</span>
              <span>View on Campus Map</span>
            </button>

            <button
              type="button"
              onClick={() => setDetectedSpecimen(null)}
              className="font-mono text-xs text-[#AAB596] hover:text-[#FFCDD2] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              <span>Scan Next Tag</span>
            </button>
          </div>
        </div>
      )}

      {/* Growth Entry Modal */}
      {showLogModal && detectedSpecimen && (
        <GrowthEntryForm
          tree={detectedSpecimen}
          onClose={() => setShowLogModal(false)}
          onSuccess={() => {
            alert(`Observation recorded for specimen #${detectedSpecimen.treeId}!`);
          }}
        />
      )}
    </div>
  );
}
