import React from 'react';
import Icon from '../common/Icon';

export default function ScannerStandbyOverlay({
  cameraLoading = false,
  cameraError = null,
  onStartCamera,
  onUploadClick,
}) {
  return (
    <>
      {/* Field Background when camera is not actively streaming */}
      <div className="absolute inset-0 bg-[#14180A] z-10">
        <img
          src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80"
          alt="Field Camera View"
          className="w-full h-full object-cover opacity-50 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14180A] via-[#14180A]/70 to-[#14180A]/40" />
      </div>

      {/* Camera Standby / Prompt Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-auto">
        <div className="w-14 h-14 rounded-full bg-[#1D230E]/90 border border-[#5D6A37] flex items-center justify-center text-[#A4B566] shadow-xl backdrop-blur-md">
          <Icon name="photo_camera" className="w-8 h-8" />
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
            onClick={onStartCamera}
            disabled={cameraLoading}
            className="h-10 px-4 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Icon name="photo_camera" className="w-4.5 h-4.5" />
            <span>{cameraLoading ? 'Starting...' : 'Start Camera'}</span>
          </button>

          <button
            type="button"
            onClick={onUploadClick}
            className="h-10 px-3.5 rounded-xl bg-[#30371A] hover:bg-[#3D4721] text-[#CCD6B8] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Icon name="upload_file" className="w-4 h-4" />
            <span>Upload QR Image</span>
          </button>
        </div>
      </div>
    </>
  );
}
