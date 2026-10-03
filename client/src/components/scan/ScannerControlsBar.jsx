import React from 'react';
import Icon from '../common/Icon';

export default function ScannerControlsBar({
  cameras = [],
  onSwitchCamera,
  torchSupported = false,
  torchOn = false,
  onToggleTorch,
  onUploadClick,
}) {
  return (
    <div className="absolute top-3 inset-x-3 flex items-center justify-end z-30 pointer-events-auto">
      <div className="flex items-center gap-2">
        {cameras.length > 1 && (
          <button
            type="button"
            onClick={onSwitchCamera}
            className="w-9 h-9 rounded-full bg-[#191E0D]/90 border border-[#4E5B2E] text-[#D8DFC8] flex items-center justify-center backdrop-blur-md active:scale-95 transition-all hover:border-[#8B9B4C] cursor-pointer"
            title="Flip Camera (Front/Rear)"
          >
            <Icon name="flip_camera_ios" className="w-4.5 h-4.5" />
          </button>
        )}

        {torchSupported && (
          <button
            type="button"
            onClick={onToggleTorch}
            className={`w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-md active:scale-95 transition-all cursor-pointer ${
              torchOn
                ? 'bg-[#A4B566] text-[#1D230E] border-[#A4B566]'
                : 'bg-[#191E0D]/90 border-[#4E5B2E] text-[#D8DFC8]'
            }`}
            title="Toggle Flashlight / Torch"
          >
            <Icon
              name={torchOn ? 'flashlight_on' : 'flashlight_off'}
              className="w-4.5 h-4.5"
            />
          </button>
        )}

        <button
          type="button"
          onClick={onUploadClick}
          className="w-9 h-9 rounded-full bg-[#191E0D]/90 border border-[#4E5B2E] text-[#D8DFC8] flex items-center justify-center backdrop-blur-md active:scale-95 transition-all hover:border-[#8B9B4C] cursor-pointer"
          title="Scan QR from Gallery Image"
        >
          <Icon name="photo_library" className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}
