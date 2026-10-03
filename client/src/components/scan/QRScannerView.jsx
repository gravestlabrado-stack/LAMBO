import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Icon from '../common/Icon';
import ScannerControlsBar from './ScannerControlsBar';
import ScannerStandbyOverlay from './ScannerStandbyOverlay';
import { playTacticalChirp, triggerHaptic, invertImageBlob } from './scannerAudio';

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
  const [cameras, setCameras] = useState([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  const lastScanTimeRef = useRef(0);
  const lastHapticTimeRef = useRef(0);
  const lastScannedCodeRef = useRef('');

  const handleDecodedText = useCallback(
    (decodedText) => {
      const now = Date.now();
      if (now - lastScanTimeRef.current < 400) return;
      lastScanTimeRef.current = now;

      if (decodedText !== lastScannedCodeRef.current || now - lastHapticTimeRef.current > 1200) {
        lastHapticTimeRef.current = now;
        triggerHaptic();
        playTacticalChirp();
      }
      lastScannedCodeRef.current = decodedText;

      if (onScan) {
        onScan(decodedText);
      }
    },
    [onScan]
  );

  const startCamera = useCallback(async (specificCameraId = null) => {
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
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          verbose: false,
        });
      }
      const scanner = scannerRef.current;

      if (scanner.isScanning) {
        try {
          await scanner.stop();
        } catch {}
      }

      if (!isMountedRef.current) {
        isStartingRef.current = false;
        return;
      }

      const scanConfig = {
        fps: 15,
        qrbox: (w, h) => {
          const edge = Math.max(200, Math.floor(Math.min(w, h) * 0.9));
          return { width: edge, height: edge };
        },
      };

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
        const backCam = camList.find((c) => /back|rear|environment/i.test(c.label));
        const selectedCam = backCam || camList[camList.length - 1] || camList[0];
        const camIdx = camList.findIndex((c) => c.id === selectedCam.id);
        setActiveCameraIndex(camIdx >= 0 ? camIdx : 0);

        try {
          await scanner.start(selectedCam.id, scanConfig, handleDecodedText, () => {});
          started = true;
        } catch {
          await scanner.start(camList[0].id, scanConfig, handleDecodedText, () => {});
          setActiveCameraIndex(0);
          started = true;
        }
      } else {
        try {
          await scanner.start({ facingMode: 'environment' }, scanConfig, handleDecodedText, () => {});
          started = true;
        } catch {
          await scanner.start({ facingMode: 'user' }, scanConfig, handleDecodedText, () => {});
          started = true;
        }
      }

      if (!isMountedRef.current) {
        try {
          if (scanner.isScanning) await scanner.stop();
          scanner.clear();
        } catch {}
        isStartingRef.current = false;
        return;
      }

      if (started) {
        setCameraActive(true);
        setCameraLoading(false);
        setCameraError(null);

        try {
          const videoElem = document.querySelector(`#${containerId} video`);
          if (videoElem && videoElem.srcObject) {
            const track = videoElem.srcObject.getVideoTracks()[0];
            const capabilities = track.getCapabilities?.();
            if (capabilities && capabilities.torch) {
              setTorchSupported(true);
            }
          }
        } catch {}
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
        errMsg = 'No camera hardware detected on this device. You can upload an image of the QR tag.';
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
  }, [handleDecodedText, onError]);

  useEffect(() => {
    isMountedRef.current = true;
    startCamera();

    return () => {
      isMountedRef.current = false;
      const scanner = scannerRef.current;
      if (scanner) {
        const cleanup = async () => {
          try {
            if (scanner.isScanning) await scanner.stop();
          } catch {}
          try {
            if (!scanner.isScanning) scanner.clear();
          } catch {}
        };
        cleanup();
      }
    };
  }, [startCamera]);

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

  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const nextIdx = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(nextIdx);
    startCamera(cameras[nextIdx].id);
  };

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
      } catch {
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
      } catch {}

      if (decodedText) {
        playTacticalChirp();
        triggerHaptic();
        if (onScan) onScan(decodedText);
      } else {
        alert('Could not detect a clear QR barcode in this image. Please ensure the QR tag is clearly visible.');
      }
    } catch {
      alert('Could not process this image. Please upload a clear photo of the specimen QR tag.');
    } finally {
      tempDiv.remove();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative w-full aspect-[4/5] max-h-[520px] rounded-2xl overflow-hidden bg-[#111508] border border-[#5D6A37] shadow-2xl select-none">
      {/* Underlying Camera Feed Container */}
      <div
        id={containerId}
        className={`absolute inset-0 w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover ${
          cameraActive ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Camera Standby Overlay */}
      {!cameraActive && (
        <ScannerStandbyOverlay
          cameraLoading={cameraLoading}
          cameraError={cameraError}
          onStartCamera={() => startCamera()}
          onUploadClick={() => fileInputRef.current?.click()}
        />
      )}

      {/* Ambient Lighting Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#14180A]/60 via-transparent to-[#14180A]/80 pointer-events-none z-15" />

      {/* Top Controls Bar */}
      <ScannerControlsBar
        cameras={cameras}
        onSwitchCamera={handleSwitchCamera}
        torchSupported={torchSupported}
        torchOn={torchOn}
        onToggleTorch={handleToggleTorch}
        onUploadClick={() => fileInputRef.current?.click()}
      />

      {/* Clean Scanner Status Indicator */}
      <div className="absolute top-16 inset-x-0 flex justify-center pointer-events-none z-25">
        <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#191E0D]/90 border border-[#525E31] backdrop-blur-md text-[#F0F3E8] shadow-lg">
          <Icon
            name={isLocked ? 'verified' : 'qr_code_scanner'}
            className={`w-3.5 h-3.5 ${
              isLocked ? 'text-[#BDCE8A]' : 'text-[#A4B566]'
            }`}
          />
          <span className="font-mono text-xs font-semibold text-[#A4B566]">
            {isLocked && scannedId ? `#${scannedId} LOCKED` : 'Align Specimen QR Tag'}
          </span>
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
