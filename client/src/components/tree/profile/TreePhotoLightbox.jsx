import React from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../common/Icon';

/**
 * Fullscreen photo lightbox modal
 */
export default function TreePhotoLightbox({ photoUrl, onClose }) {
  if (!photoUrl || typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
      >
        <Icon name="close" className="text-[20px]" />
      </button>

      <img
        src={photoUrl}
        alt="Observation Fullscreen"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[95vw] object-contain rounded-xl shadow-2xl border border-white/10"
      />
    </div>,
    document.body
  );
}
