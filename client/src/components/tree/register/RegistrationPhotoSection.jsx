import React, { useRef } from 'react';
import Icon from '../../common/Icon';
import { GROWTH_STAGES } from '../../../utils/constants';

const HEALTH_OPTIONS = [
  { label: 'Thriving', val: 'Thriving', color: 'border-[#5D6A37] text-[#D2DCB4]' },
  { label: 'Stable / Fair', val: 'Stable / Fair', color: 'border-[#D99B26]/60 text-[#F5C26B]' },
  { label: 'Distressed', val: 'Distressed / At Risk', color: 'border-[#E57373]/60 text-[#FFCDD2]' },
  { label: 'Dead / Mortality', val: 'Dead / Mortality', color: 'border-[#4B5563] text-[#9CA3AF]' },
];

export default function RegistrationPhotoSection({
  photoPreview,
  onPhotoSelect,
  onRemovePhoto,
  isCompressingPhoto = false,
  healthStatus,
  onHealthStatusChange,
  currentStage,
  onStageChange,
}) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleClearPhoto = () => {
    onRemovePhoto();
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <section className="bg-[#30371A] rounded-2xl p-5 shadow-sm border border-[#525E31] space-y-4">
      <div className="flex items-center gap-2 border-b border-[#4F5A2D] pb-3">
        <Icon name="photo_camera" className="text-[#A4B566] w-5 h-5" />
        <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
          Field Photo &amp; Health Assessment
        </h3>
      </div>

      {/* Photo Upload Container */}
      <div className="p-4 rounded-xl bg-[#1D230E] border border-[#525E31] flex flex-col sm:flex-row items-center gap-4">
        {photoPreview ? (
          <div className="relative w-36 h-36 rounded-xl overflow-hidden ring-2 ring-[#8B9B4C] shrink-0 shadow-md">
            <img
              src={photoPreview}
              alt="Specimen preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleClearPhoto}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/75 text-[#FFCDD2] flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
              title="Remove photo"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isCompressingPhoto}
              className="w-full sm:w-32 h-28 rounded-xl border-2 border-dashed border-[#525E31] hover:border-[#8B9B4C] flex flex-col items-center justify-center gap-1 text-[#AAB596] hover:text-[#F0F3E8] cursor-pointer bg-[#262C14] hover:bg-[#30371A] active:scale-95 transition-all shrink-0 group disabled:opacity-50"
            >
              <Icon
                name="photo_camera"
                className="w-6 h-6 text-[#A4B566] group-hover:scale-110 transition-transform"
              />
              <span className="text-xs font-mono font-bold text-[#F0F3E8]">Take Photo</span>
              <span className="text-[10px] font-mono text-[#CCD6B8]">Direct Camera</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isCompressingPhoto}
              className="w-full sm:w-32 h-28 rounded-xl border-2 border-dashed border-[#525E31] hover:border-[#8B9B4C] flex flex-col items-center justify-center gap-1 text-[#AAB596] hover:text-[#F0F3E8] cursor-pointer bg-[#262C14] hover:bg-[#30371A] active:scale-95 transition-all shrink-0 group disabled:opacity-50"
            >
              <Icon
                name="photo_library"
                className="w-6 h-6 text-[#8B9B4C] group-hover:scale-110 transition-transform"
              />
              <span className="text-xs font-mono font-bold text-[#F0F3E8]">Choose File</span>
              <span className="text-[10px] font-mono text-[#CCD6B8]">Gallery / Storage</span>
            </button>
          </div>
        )}

        <div className="space-y-1.5 flex-1 text-center sm:text-left">
          <div>
            <h4 className="font-mono text-xs font-bold text-[#F0F3E8]">
              {isCompressingPhoto ? 'Compressing specimen photo...' : 'Baseline Specimen Photo'}
            </h4>
            <p className="font-body-sm text-xs text-[#AAB596] leading-relaxed">
              Snap directly in the field with your camera or select an existing wildling photo from your device gallery.
            </p>
          </div>
          {photoPreview && (
            <div className="flex gap-2 justify-center sm:justify-start pt-1">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="h-8 px-3 rounded-lg bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-[11px] font-mono text-[#D8DFC8] inline-flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="photo_camera" className="w-3.5 h-3.5 text-[#A4B566]" />
                Retake Camera
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="h-8 px-3 rounded-lg bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-[11px] font-mono text-[#D8DFC8] inline-flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Icon name="photo_library" className="w-3.5 h-3.5 text-[#8B9B4C]" />
                From Gallery
              </button>
            </div>
          )}
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={onPhotoSelect}
          className="hidden"
        />
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*"
          onChange={onPhotoSelect}
          className="hidden"
        />
      </div>

      {/* Health Status & Growth Stage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Health Status Radio Chips */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
            Initial Health Status
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {HEALTH_OPTIONS.map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => onHealthStatusChange(item.val)}
                className={`h-10 rounded-xl font-mono text-xs font-bold transition-all border cursor-pointer ${
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
            onChange={(e) => onStageChange(e.target.value)}
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
  );
}
