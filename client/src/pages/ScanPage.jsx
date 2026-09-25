import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useTrees } from '../context/TreeContext';

export default function ScanPage() {
  const navigate = useNavigate();
  const { trees } = useTrees();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [torchOn, setTorchOn] = useState(false);
  const [gridOn, setGridOn] = useState(true);
  const [manualId, setManualId] = useState('');
  const [detectedSpecimen, setDetectedSpecimen] = useState(trees[0] || null);

  useEffect(() => {
    let scanner = null;
    if (activeTab === 'camera') {
      try {
        scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          false
        );

        scanner.render(
          (decodedText) => {
            // Check if matches a tree ID
            const matched = trees.find(
              (t) => t.treeId.toUpperCase() === decodedText.toUpperCase()
            );
            if (matched) {
              setDetectedSpecimen(matched);
            } else {
              setDetectedSpecimen({
                treeId: decodedText.toUpperCase(),
                species: 'External Botanical QR',
                nickname: 'Scanned Tag',
                healthStatus: 'Healthy',
                height: 1.5,
              });
            }
          },
          (error) => {
            // scanning pass
          }
        );
      } catch (err) {
        console.warn('QR scanner camera init error:', err);
      }
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [activeTab, trees]);

  const handleManualLookup = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      const matched = trees.find(
        (t) => t.treeId.toUpperCase() === manualId.trim().toUpperCase()
      );
      if (matched) {
        navigate(`/trees/${matched.treeId}`);
      } else {
        navigate(`/trees/${manualId.trim().toUpperCase()}`);
      }
    }
  };

  const handleSimulateScan = (tree) => {
    setDetectedSpecimen(tree);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Switcher: Camera Viewfinder vs Manual Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#1D230E] border border-[#525E31]">
          <button
            onClick={() => setActiveTab('camera')}
            className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'camera'
                ? 'bg-[#8B9B4C] text-[#1F240F] shadow-sm'
                : 'text-[#D8DFC8] hover:text-[#F0F3E8]'
            }`}
          >
            HUD Camera
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'manual'
                ? 'bg-[#8B9B4C] text-[#1F240F] shadow-sm'
                : 'text-[#D8DFC8] hover:text-[#F0F3E8]'
            }`}
          >
            Manual Tag Entry
          </button>
        </div>

        {/* GPS Precision Beacon */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D230E] border border-[#4E5B2E] text-xs font-mono text-[#D8DFC8]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A4B566] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A4B566]"></span>
          </span>
          <span>GPS ±1.2m</span>
        </div>
      </div>

      {activeTab === 'camera' ? (
        <div className="space-y-4">
          {/* Tactical Viewfinder Viewport Container */}
          <div className="relative w-full aspect-[4/5] max-h-[500px] overflow-hidden rounded-2xl bg-[#111508] border border-[#5D6A37] shadow-2xl">
            {/* Simulated Background Camera Photo */}
            <img
              src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80"
              alt="Field Camera View"
              className="w-full h-full object-cover opacity-85 scale-105"
            />

            {/* Gradient Lighting Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#14180A]/80 via-transparent to-[#14180A]/90 pointer-events-none" />

            {/* Optional Coordinate Reticle Grid Overlay */}
            {gridOn && (
              <div className="absolute inset-0 pointer-events-none opacity-30">
                <svg className="w-full h-full">
                  <defs>
                    <pattern id="gridReticlePattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#BDCE8A" strokeWidth="0.75" strokeDasharray="2 3" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#gridReticlePattern)" />
                </svg>
              </div>
            )}

            {/* Top Quick Field Controls */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#191E0D]/90 border border-[#4E5B2E] backdrop-blur-md text-[#BDCE8A] text-xs font-mono">
                <span className="material-symbols-outlined text-[15px] text-[#A4B566]">eco</span>
                <span>AR Optical Live</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTorchOn(!torchOn)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-md transition-all ${
                    torchOn
                      ? 'bg-[#A4B566] text-[#1D230E] border-[#A4B566]'
                      : 'bg-[#191E0D]/90 border-[#4E5B2E] text-[#D8DFC8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {torchOn ? 'flashlight_on' : 'flashlight_off'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setGridOn(!gridOn)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-md transition-all ${
                    gridOn
                      ? 'bg-[#A4B566] text-[#1D230E] border-[#A4B566]'
                      : 'bg-[#191E0D]/90 border-[#4E5B2E] text-[#D8DFC8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">grid_4x4</span>
                </button>
              </div>
            </div>

            {/* Camera Reticle Brackets */}
            <div className="absolute inset-x-8 top-16 bottom-20 pointer-events-none flex flex-col justify-between">
              {/* Top Bracket Reticle */}
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 border-t-[3px] border-l-[3px] border-[#A4B566] rounded-tl shadow-[0_0_8px_rgba(164,181,102,0.8)]" />
                <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#191E0D]/95 border border-[#A4B566]/60 backdrop-blur-md text-[#F0F3E8] shadow-md -translate-y-2">
                  <span className="material-symbols-outlined text-[14px] text-[#A4B566]">verified</span>
                  <span className="font-mono text-xs font-semibold text-[#A4B566]">
                    {detectedSpecimen ? `#${detectedSpecimen.treeId}` : 'Scan Target Area'}
                  </span>
                </div>
                <div className="w-8 h-8 border-t-[3px] border-r-[3px] border-[#A4B566] rounded-tr shadow-[0_0_8px_rgba(164,181,102,0.8)]" />
              </div>

              {/* Center Target Laser Circle with Rings */}
              <div className="relative flex items-center justify-center my-auto">
                <div className="w-24 h-24 rounded-full border border-[#A4B566]/40 animate-pulse" />
                <div className="absolute w-14 h-14 rounded-full border-2 border-[#A4B566] shadow-[0_0_12px_rgba(164,181,102,0.7)] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#A4B566] animate-ping" />
                </div>
                <div className="absolute -bottom-8 flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#14180A]/95 border border-[#A4B566]/50 text-[#A4B566] shadow-md text-[11px] font-mono font-bold">
                  <span className="material-symbols-outlined text-[14px]">straighten</span>
                  <span>Target Range: 1.8m</span>
                </div>
              </div>

              {/* Bottom Bracket Reticle */}
              <div className="flex justify-between items-end">
                <div className="w-8 h-8 border-b-[3px] border-l-[3px] border-[#A4B566] rounded-bl shadow-[0_0_8px_rgba(164,181,102,0.8)]" />
                <div className="w-8 h-8 border-b-[3px] border-r-[3px] border-[#A4B566] rounded-br shadow-[0_0_8px_rgba(164,181,102,0.8)]" />
              </div>
            </div>

            {/* Hidden container where html5-qrcode attaches if permitted */}
            <div id="qr-reader-container" className="hidden" />
          </div>

          {/* Quick Demo Simulator Bar for instant testing */}
          <div className="p-3 rounded-xl bg-[#262C14] border border-[#4F5A2D] space-y-2">
            <span className="font-label-sm text-label-sm text-[#AAB596] block">
              DEMO SIMULATOR — TAP TO DETECT TAG:
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {trees.slice(0, 3).map((t) => (
                <button
                  key={t.treeId}
                  onClick={() => handleSimulateScan(t)}
                  className="px-3 py-1.5 rounded-lg bg-[#30371A] border border-[#525E31] text-xs font-mono text-[#D8DFC8] hover:border-[#A4B566] whitespace-nowrap active:scale-95"
                >
                  Simulate #{t.treeId}
                </button>
              ))}
            </div>
          </div>

          {/* Detected Specimen Action Dock */}
          {detectedSpecimen && (
            <div className="p-5 rounded-2xl bg-[#262C14] border border-[#5D6A37] shadow-xl space-y-3 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#30371A] border border-[#525E31] flex items-center justify-center text-[#A4B566]">
                    <span className="material-symbols-outlined text-[24px]">park</span>
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-[#A4B566]">
                      #{detectedSpecimen.treeId} IDENTIFIED
                    </span>
                    <h3 className="font-display font-bold text-base text-[#F0F3E8]">
                      {detectedSpecimen.species}
                    </h3>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#3A4320] border border-[#5D6A37] text-[#D2DCB4] font-mono text-xs font-semibold">
                  {detectedSpecimen.healthStatus || 'Healthy'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => navigate(`/trees/${detectedSpecimen.treeId}`)}
                  className="h-11 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] active:scale-[0.98] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  Open Profile
                </button>
                <button
                  onClick={() => navigate(`/trees/${detectedSpecimen.treeId}`)}
                  className="h-11 rounded-xl bg-[#30371A] border border-[#525E31] hover:bg-[#38411F] text-[#F0F3E8] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add_chart</span>
                  Log Growth
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Manual Search Mode */
        <div className="p-6 rounded-2xl bg-[#262C14] border border-[#4F5A2D] shadow-lg space-y-4">
          <div className="text-center max-w-sm mx-auto space-y-1">
            <span className="material-symbols-outlined text-3xl text-[#A4B566]">pin</span>
            <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
              Direct Specimen ID Lookup
            </h3>
            <p className="text-xs text-[#AAB596]">
              Enter the unique sequential code printed on the physical stake tag.
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
              className="w-full h-12 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              Retrieve Telemetry Records
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
