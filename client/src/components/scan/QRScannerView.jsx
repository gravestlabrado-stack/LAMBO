import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScannerView({
  onScan,
  onError,
  isLocked = false,
  scannedId = null,
}) {
  const containerId = 'lambo-hud-qr-reader';
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);
  const isStartingRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [gridOn, setGridOn] = useState(true);
  const [cameras, setCameras] = useState([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  // Acoustic lock-on chirp using Web Audio API
  const playTacticalChirp = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Audio autoplay policy
    }
  };

  // Mobile haptic vibration
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 30, 40]);
    }
  };

  // Handle successful scan decode
  const handleDecodedText = useCallback(
    (decodedText) => {
      playTacticalChirp();
      triggerHaptic();
      if (onScan) {
        onScan(decodedText);
      }
    },
    [onScan]
  );

  // Safely stop the camera
  const stopCamera = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (e) {}

    try {
      if (!scanner.isScanning) {
        scanner.clear();
      }
    } catch (e) {}

    if (isMountedRef.current) {
      setCameraActive(false);
      setCameraLoading(false);
      setTorchOn(false);
      setTorchSupported(false);
    }
  };

  // Start Camera with camera enumeration
  const startCamera = async (specificCameraId = null) => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    setCameraLoading(true);
    setCameraError(null);

    try {
      const container = document.getElementById(containerId);
      if (!container || !isMountedRef.current) {
        isStartingRef.current = false;
        setCameraLoading(false);
        return;
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId, {
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          verbose: false,
        });
      }
      const scanner = scannerRef.current;

      // Stop if currently active before re-starting
      if (scanner.isScanning) {
        try {
          await scanner.stop();
        } catch (e) {}
      }

      if (!isMountedRef.current) {
        isStartingRef.current = false;
        return;
      }

      const scanConfig = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edge = Math.max(200, Math.floor(minEdge * 0.9));
          return { width: edge, height: edge };
        },
      };

      // Query available camera devices
      let camList = [];
      try {
        camList = await Html5Qrcode.getCameras();
        if (camList && camList.length > 0) {
          setCameras(camList);
        }
      } catch (e) {
        console.log('[QRScannerView] getCameras query failed, using facingMode fallback:', e);
      }

      let started = false;

      if (specificCameraId) {
        await scanner.start(specificCameraId, scanConfig, handleDecodedText, () => {});
        started = true;
      } else if (camList && camList.length > 0) {
        // Prefer rear/environment camera on phones, or first device
        const backCam = camList.find((c) =>
          /back|rear|environment/i.test(c.label)
        );
        const selectedCam = backCam || camList[camList.length - 1] || camList[0];
        const camIdx = camList.findIndex((c) => c.id === selectedCam.id);
        setActiveCameraIndex(camIdx >= 0 ? camIdx : 0);

        try {
          await scanner.start(selectedCam.id, scanConfig, handleDecodedText, () => {});
          started = true;
        } catch (camErr) {
          console.warn('[QRScannerView] Specific camera start failed, trying first available device:', camErr);
          await scanner.start(camList[0].id, scanConfig, handleDecodedText, () => {});
          setActiveCameraIndex(0);
          started = true;
        }
      } else {
        // Fallback to facingMode constraint
        try {
          await scanner.start({ facingMode: 'environment' }, scanConfig, handleDecodedText, () => {});
          started = true;
        } catch (envErr) {
          console.log('[QRScannerView] Environment facingMode failed, falling back to front camera:', envErr);
          await scanner.start({ facingMode: 'user' }, scanConfig, handleDecodedText, () => {});
          started = true;
        }
      }

      if (!isMountedRef.current) {
        try {
          if (scanner.isScanning) await scanner.stop();
          scanner.clear();
        } catch (e) {}
        isStartingRef.current = false;
        return;
      }

      if (started) {
        setCameraActive(true);
        setCameraLoading(false);
        setCameraError(null);

        // Check torch support
        try {
          const videoElem = document.querySelector(`#${containerId} video`);
          if (videoElem && videoElem.srcObject) {
            const track = videoElem.srcObject.getVideoTracks()[0];
            const capabilities = track.getCapabilities?.();
            if (capabilities && capabilities.torch) {
              setTorchSupported(true);
            }
          }
        } catch (e) {}
      }
    } catch (err) {
      if (!isMountedRef.current) {
        isStartingRef.current = false;
        return;
      }
      console.warn('[QRScannerView] Camera start failed:', err);
      let errMsg = 'Camera access was denied or no compatible camera hardware was detected.';
      const raw = err?.message || String(err || '');
      if (err?.name === 'NotFoundError' || /NotFoundError|Requested device not found/i.test(raw)) {
        errMsg = 'No camera hardware detected on this device. You can upload an image of the QR tag or switch to Manual Tag Entry.';
      } else if (err?.name === 'NotAllowedError' || /Permission denied|NotAllowedError/i.test(raw)) {
        errMsg = 'Camera access was blocked by the browser. Please allow camera permissions in your address bar.';
      }

      setCameraError(errMsg);
      setCameraActive(false);
      setCameraLoading(false);
      if (onError) onError(errMsg);
    } finally {
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    startCamera();

    return () => {
      isMountedRef.current = false;
      const scanner = scannerRef.current;
      if (scanner) {
        const cleanup = async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch (e) {}
          try {
            if (!scanner.isScanning) {
              scanner.clear();
            }
          } catch (e) {}
        };
        cleanup();
      }
    };
  }, []);

  // Torch toggle handler
  const handleToggleTorch = async () => {
    if (!torchSupported || !cameraActive) return;
    try {
      const videoElem = document.querySelector(`#${containerId} video`);
      if (videoElem && videoElem.srcObject) {
        const track = videoElem.srcObject.getVideoTracks()[0];
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      }
    } catch (e) {
      console.warn('[QRScannerView] Torch toggle error:', e);
    }
  };

  // Flip / switch camera between rear and front if multiple available
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const nextIdx = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(nextIdx);
    startCamera(cameras[nextIdx].id);
  };

  // Helper to invert image luminance for dark-mode / white-on-black QR codes
  const invertImageBlob = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            d[i] = 255 - d[i];
            d[i + 1] = 255 - d[i + 1];
            d[i + 2] = 255 - d[i + 2];
          }
          ctx.putImageData(imgData, 0, 0);
          canvas.toBlob((blob) => resolve(blob), 'image/png');
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  // Decode QR from an uploaded photo using an isolated temporary reader
  const handleFileScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tempId = `lambo-temp-file-scanner-${Date.now()}`;
    const tempDiv = document.createElement('div');
    tempDiv.id = tempId;
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);

    try {
      const fileScanner = new Html5Qrcode(tempId, {
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        verbose: false,
      });

      let decodedText = null;
      try {
        decodedText = await fileScanner.scanFile(file, false);
      } catch (err) {
        // If standard decode failed, attempt color-inverted decode (for dark-mode QR tags)
        try {
          const invertedBlob = await invertImageBlob(file);
          if (invertedBlob) {
            const invertedFile = new File([invertedBlob], 'inverted_' + file.name, {
              type: 'image/png',
            });
            decodedText = await fileScanner.scanFile(invertedFile, false);
          }
        } catch (invertErr) {
          console.warn('[QRScannerView] Invert scan attempt failed:', invertErr);
        }
      }

      try {
        fileScanner.clear();
      } catch (err) {}

      if (decodedText) {
        playTacticalChirp();
        triggerHaptic();
        if (onScan) onScan(decodedText);
      } else {
        alert('Could not detect a clear QR barcode in this image. Please ensure the QR tag is clearly visible.');
      }
    } catch (err) {
      alert('Could not process this image. Please upload a clear photo of the specimen QR tag.');
    } finally {
      tempDiv.remove();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative w-full aspect-[4/5] max-h-[520px] rounded-2xl overflow-hidden bg-[#111508] border border-[#5D6A37] shadow-2xl select-none">
      {/* Underlying Camera Feed Container - always preserved with valid dimensions */}
      <div
        id={containerId}
        className={`absolute inset-0 w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover ${
          cameraActive ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Field Background when camera is not actively streaming */}
      {!cameraActive && (
        <div className="absolute inset-0 bg-[#14180A] z-10">
          <img
            src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80"
            alt="Field Camera View"
            className="w-full h-full object-cover opacity-50 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14180A] via-[#14180A]/70 to-[#14180A]/40" />
        </div>
      )}

      {/* Camera Standby / Prompt Overlay */}
      {!cameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-auto">
          <div className="w-14 h-14 rounded-full bg-[#1D230E]/90 border border-[#5D6A37] flex items-center justify-center text-[#A4B566] shadow-xl backdrop-blur-md">
            <span className="material-symbols-outlined text-3xl">photo_camera</span>
          </div>

          <div className="space-y-1.5 mt-2">
            <h4 className="font-headline-sm text-sm font-bold text-[#F0F3E8]">
              {cameraLoading
                ? 'Connecting to Camera Feed...'
                : cameraError
                ? 'Camera Hardware Notice'
                : 'Field Camera Ready'}
            </h4>
            <p className="text-xs text-[#CCD6B8] max-w-xs mx-auto leading-relaxed">
              {cameraLoading
                ? 'Initializing optical sensors...'
                : cameraError || 'Point camera at the QR tag attached to the tree stake.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            <button
              type="button"
              onClick={() => startCamera()}
              disabled={cameraLoading}
              className="h-10 px-4 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <span>{cameraLoading ? 'Starting...' : 'Start Camera'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-3.5 rounded-xl bg-[#30371A] hover:bg-[#3D4721] text-[#CCD6B8] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>Upload QR Image</span>
            </button>
          </div>
        </div>
      )}

      {/* Ambient Lighting Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#14180A]/60 via-transparent to-[#14180A]/80 pointer-events-none z-15" />

      {/* Optional Coordinate Reticle Grid Overlay */}
      {gridOn && (
        <div className="absolute inset-0 pointer-events-none opacity-25 z-20">
          <svg className="w-full h-full">
            <defs>
              <pattern
                id="hudReticleGridPattern"
                width="44"
                height="44"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 44 0 L 0 0 0 44"
                  fill="none"
                  stroke="#BDCE8A"
                  strokeWidth="0.75"
                  strokeDasharray="2 3"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hudReticleGridPattern)" />
          </svg>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-end z-30 pointer-events-auto">
        {/* Action Controls: Flip Camera, Torch, Grid, Upload QR */}
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="w-9 h-9 rounded-full bg-[#191E0D]/90 border border-[#4E5B2E] text-[#D8DFC8] flex items-center justify-center backdrop-blur-md active:scale-95 transition-all hover:border-[#8B9B4C]"
              title="Flip Camera (Front/Rear)"
            >
              <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span>
            </button>
          )}

          {torchSupported && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-md active:scale-95 transition-all ${
                torchOn
                  ? 'bg-[#A4B566] text-[#1D230E] border-[#A4B566]'
                  : 'bg-[#191E0D]/90 border-[#4E5B2E] text-[#D8DFC8]'
              }`}
              title="Toggle Flashlight / Torch"
            >
              <span className="material-symbols-outlined text-[18px]">
                {torchOn ? 'flashlight_on' : 'flashlight_off'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setGridOn(!gridOn)}
            className={`w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-md active:scale-95 transition-all ${
              gridOn
                ? 'bg-[#A4B566] text-[#1D230E] border-[#A4B566]'
                : 'bg-[#191E0D]/90 border-[#4E5B2E] text-[#D8DFC8]'
            }`}
            title="Toggle Tactical Coordinate Grid"
          >
            <span className="material-symbols-outlined text-[18px]">grid_4x4</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-full bg-[#191E0D]/90 border border-[#4E5B2E] text-[#D8DFC8] flex items-center justify-center backdrop-blur-md active:scale-95 transition-all hover:border-[#8B9B4C]"
            title="Scan QR from Gallery Image"
          >
            <span className="material-symbols-outlined text-[18px]">photo_library</span>
          </button>
        </div>
      </div>

      {/* Tactical Reticle Bounding Box Calipers (NO moving laser animation) */}
      <div className="absolute inset-x-8 top-16 bottom-20 pointer-events-none flex flex-col justify-between z-25">
        {/* Top Reticle Brackets */}
        <div className="flex justify-between items-start">
          <div
            className={`w-9 h-9 border-t-[3px] border-l-[3px] rounded-tl transition-all duration-300 ${
              isLocked
                ? 'border-[#BDCE8A] shadow-[0_0_14px_rgba(189,206,138,1)]'
                : 'border-[#A4B566] shadow-[0_0_8px_rgba(164,181,102,0.8)]'
            }`}
          />

          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#191E0D]/95 border border-[#A4B566]/60 backdrop-blur-md text-[#F0F3E8] shadow-md -translate-y-2">
            <span
              className={`material-symbols-outlined text-[14px] ${
                isLocked ? 'text-[#BDCE8A]' : 'text-[#A4B566]'
              }`}
            >
              {isLocked ? 'verified' : 'filter_center_focus'}
            </span>
            <span className="font-mono text-xs font-semibold text-[#A4B566]">
              {isLocked && scannedId ? `#${scannedId} LOCKED` : 'Align Specimen QR Tag'}
            </span>
          </div>

          <div
            className={`w-9 h-9 border-t-[3px] border-r-[3px] rounded-tr transition-all duration-300 ${
              isLocked
                ? 'border-[#BDCE8A] shadow-[0_0_14px_rgba(189,206,138,1)]'
                : 'border-[#A4B566] shadow-[0_0_8px_rgba(164,181,102,0.8)]'
            }`}
          />
        </div>

        {/* Center Target Indicator (Static crosshair dots without moving scan line) */}
        <div className="relative w-full flex items-center justify-center my-auto">
          <div className="w-16 h-16 rounded-full border border-[#A4B566]/30 flex items-center justify-center">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-transform duration-300 ${
                isLocked ? 'bg-[#BDCE8A] scale-150' : 'bg-[#A4B566]/80'
              }`}
            />
          </div>
        </div>

        {/* Bottom Reticle Brackets */}
        <div className="flex justify-between items-end">
          <div
            className={`w-9 h-9 border-b-[3px] border-l-[3px] rounded-bl transition-all duration-300 ${
              isLocked
                ? 'border-[#BDCE8A] shadow-[0_0_14px_rgba(189,206,138,1)]'
                : 'border-[#A4B566] shadow-[0_0_8px_rgba(164,181,102,0.8)]'
            }`}
          />
          <div
            className={`w-9 h-9 border-b-[3px] border-r-[3px] rounded-br transition-all duration-300 ${
              isLocked
                ? 'border-[#BDCE8A] shadow-[0_0_14px_rgba(189,206,138,1)]'
                : 'border-[#A4B566] shadow-[0_0_8px_rgba(164,181,102,0.8)]'
            }`}
          />
        </div>
      </div>

      {/* Hidden file input for gallery QR scan */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileScan}
        className="hidden"
      />
    </div>
  );
}
