import React, { useRef } from 'react';
import Icon from '../common/Icon';
import { compressImage } from '../../utils/imageCompressor';

/**
 * Camera and gallery photo picker with client-side canvas compression pipeline
 */
export default function ObservationPhotoPicker({
  photoFile,
  photoPreview,
  onPhotoSelected,
  onRemovePhoto,
  disabled = false,
}) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    try {
      const compressed = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 });
      onPhotoSelected(compressed, URL.createObjectURL(compressed));
    } catch {
      onPhotoSelected(file, URL.createObjectURL(file));
    }
  };

  const handleClear = () => {
    onRemovePhoto();
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-mono font-bold text-[#E4F5A6] uppercase tracking-wider">
          Photographic Evidence *
        </label>
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40">
          📸 Audit Mandatory
        </span>
      </div>

      {photoPreview ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-[#8B9B4C] bg-black h-48 w-full group">
          <img
            src={photoPreview}
            alt="Observation preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold flex items-center gap-1 shadow-lg transition-transform active:scale-95"
            >
              <Icon name="delete" className="text-[16px]" />
              <span>Retake Photo</span>
            </button>
          </div>
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono text-emerald-300 font-bold">
            ✓ Evidence Attached
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-xl border-2 border-dashed border-[#525E31] bg-[#1D230E] hover:border-[#8B9B4C] transition-colors text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#262C14] border border-[#525E31] flex items-center justify-center text-[#A4B566] mx-auto">
            <Icon name="add_a_photo" className="text-[20px]" />
          </div>

          <div className="space-y-0.5">
            <p className="font-mono text-xs font-bold text-[#F0F3E8]">
              Attach Field Photo of Seedling
            </p>
            <p className="font-mono text-[11px] text-[#AAB596]">
              Take a live photo in the plot or upload from device gallery
            </p>
          </div>

          <div className="flex gap-2.5 max-w-xs mx-auto">
            {/* Shutter Capture Button */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 h-9 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] active:scale-95 text-[#1F240F] font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Icon name="photo_camera" className="text-[16px]" />
              <span>Camera</span>
            </button>

            {/* Gallery Upload Button */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => galleryInputRef.current?.click()}
              className="flex-1 h-9 rounded-xl bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-[#E4F5A6] font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Icon name="photo_library" className="text-[16px]" />
              <span>Gallery</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
