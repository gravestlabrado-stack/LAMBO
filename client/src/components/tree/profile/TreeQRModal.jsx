import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '../../common/Icon';

/**
 * Modal displaying printable vector QR code for physical tree tagging
 */
export default function TreeQRModal({ isOpen, onClose, tree }) {
  const qrRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !tree || typeof document === 'undefined') return null;

  const qrValue = `${window.location.origin}/trees/${tree._id || tree.treeId}`;

  const handleDownloadPNG = () => {
    setIsDownloading(true);
    try {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // High-resolution canvas for print quality (600x600)
      canvas.width = 600;
      canvas.height = 700;

      img.onload = () => {
        // Draw army-green background card
        ctx.fillStyle = '#1D230E';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header Title
        ctx.fillStyle = '#E4F5A6';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`LAMBO BOTANICAL TAG`, canvas.width / 2, 50);

        ctx.fillStyle = '#A4B566';
        ctx.font = '20px monospace';
        ctx.fillText(`TREE ID: #${tree.treeId}`, canvas.width / 2, 85);

        // Draw white backing box for QR
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(70, 115, 460, 460);

        // Draw QR SVG into canvas
        ctx.drawImage(img, 90, 135, 420, 420);

        // Draw Bottom Details
        ctx.fillStyle = '#F0F3E8';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(tree.nickname || tree.species, canvas.width / 2, 620);

        ctx.fillStyle = '#C2CE9F';
        ctx.font = 'italic 18px sans-serif';
        ctx.fillText(tree.species, canvas.width / 2, 655);

        // Trigger file download
        const a = document.createElement('a');
        a.download = `LAMBO_TAG_${tree.treeId}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        setIsDownloading(false);
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.warn('[TreeQRModal] Download error:', err);
      setIsDownloading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-[#262C14] border border-[#5D6A37] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-center">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3">
          <div className="flex items-center gap-2">
            <Icon name="qr_code" className="text-[#A4B566] text-[22px]" />
            <h3 className="font-headline-sm text-sm font-bold text-[#F0F3E8]">
              Physical Specimen Tag
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#30371A] border border-[#525E31] text-[#AAB596] flex items-center justify-center hover:text-[#F0F3E8]"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>

        {/* QR Code Canvas */}
        <div
          ref={qrRef}
          className="p-5 rounded-2xl bg-white mx-auto inline-block shadow-inner border-4 border-[#8B9B4C]"
        >
          <QRCodeSVG
            value={qrValue}
            size={220}
            level="H"
            includeMargin={false}
          />
        </div>

        <div className="space-y-1">
          <span className="font-mono text-sm font-bold text-[#E4F5A6] block">
            #{tree.treeId}
          </span>
          <span className="font-headline-sm text-sm font-bold text-[#F0F3E8] block truncate">
            {tree.nickname || tree.species}
          </span>
          <p className="font-mono text-[11px] text-[#AAB596] leading-tight pt-1">
            Print, laminate, and attach to the fixed reference stake adjacent to the seedling.
          </p>
        </div>

        {/* Modal Buttons */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleDownloadPNG}
            disabled={isDownloading}
            className="flex-1 h-10 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Icon name="download" className="text-[16px]" />
            <span>{isDownloading ? 'Preparing...' : 'Download Tag PNG'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-xs font-mono text-[#D8DFC8]"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
