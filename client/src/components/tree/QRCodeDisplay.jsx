import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '../common/Icon';

export default function QRCodeDisplay({
  tree,
  onClose,
  onRegisterAnother,
}) {
  const navigate = useNavigate();
  const qrRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState(null);

  if (!tree) return null;

  const downloadQR = () => {
    if (isDownloading) return;
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    setIsDownloading(true);
    setDownloadNotice('downloading');

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // High resolution for clean printing
    const size = 600;
    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      try {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 20, 20, size - 40, size - 40);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `LAMBO_${tree.treeId}_QR.png`;
        downloadLink.href = pngFile;
        downloadLink.click();

        setDownloadNotice('success');
      } catch (err) {
        console.error('[QRCodeDisplay] Export failed:', err);
        setDownloadNotice(null);
      } finally {
        setTimeout(() => {
          setIsDownloading(false);
          setDownloadNotice(null);
        }, 3000);
      }
    };

    img.onerror = () => {
      setIsDownloading(false);
      setDownloadNotice(null);
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-[#262C14] border border-[#5D6A37] p-6 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
        {/* Success Icon */}
        <div className="w-14 h-14 mx-auto rounded-full bg-[#38411F] text-[#A4B566] border border-[#5D6A37] flex items-center justify-center shadow-md">
          <Icon name="check_circle" className="w-8 h-8 text-[#A4B566]" />
        </div>

        {/* Specimen Header */}
        <div>
          <span className="font-mono text-xs text-[#A4B566] font-bold uppercase tracking-wider">
            ENROLLMENT SUCCESSFUL
          </span>
          <h3 className="font-display font-bold text-2xl text-[#F0F3E8] mt-0.5">
            #{tree.treeId}
          </h3>
          <p className="font-body-md text-sm text-[#D8DFC8] font-medium truncate mt-0.5">
            {tree.nickname ? `"${tree.nickname}" • ` : ''}{tree.species}
          </p>
          {tree.location && (
            <p className="font-mono text-[11px] text-[#AAB596] truncate mt-0.5">
              {tree.location}
            </p>
          )}
        </div>

        {/* QR Code Container */}
        <div
          ref={qrRef}
          className="bg-white p-4 rounded-2xl border-2 border-[#525E31] flex flex-col items-center justify-center shadow-lg mx-auto w-fit"
        >
          <QRCodeSVG
            value={tree.treeId}
            size={160}
            level="H"
            includeMargin={true}
          />
          <div className="mt-2 text-center select-all">
            <span className="font-mono text-xs font-bold text-[#1D230E] tracking-widest block">
              {tree.treeId}
            </span>
            <span className="font-sans text-[10px] text-[#555] uppercase tracking-wider">
              LAMBO Specimen Tag
            </span>
          </div>
        </div>

        {/* Download & Print Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={downloadQR}
            disabled={isDownloading}
            className="h-10 px-3 rounded-xl bg-[#30371A] hover:bg-[#3D4721] disabled:opacity-60 disabled:cursor-not-allowed border border-[#525E31] text-[#D8DFC8] hover:text-[#F0F3E8] font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-95"
          >
            {isDownloading ? (
              <>
                <Icon name="progress_activity" className="w-4 h-4 text-[#A4B566] animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icon name="download" className="w-4 h-4 text-[#A4B566]" />
                <span>Download PNG</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="h-10 px-3 rounded-xl bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-[#D8DFC8] hover:text-[#F0F3E8] font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-95"
          >
            <Icon name="print" className="w-4 h-4 text-[#A4B566]" />
            Print Tag
          </button>
        </div>

        {/* Real-time Download Feedback Banner */}
        {downloadNotice === 'downloading' && (
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#38411F] border border-[#5D6A37] text-xs font-mono text-[#D8DFC8] animate-in fade-in zoom-in-95">
            <Icon name="progress_activity" className="w-4 h-4 text-[#A4B566] animate-spin" />
            <span>Generating high-res PNG tag... download starting</span>
          </div>
        )}
        {downloadNotice === 'success' && (
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#2D3F1E] border border-[#7A9330] text-xs font-mono text-[#E4F5A6] animate-in fade-in zoom-in-95">
            <Icon name="check_circle" className="w-4 h-4 text-[#A4B566]" />
            <span>Tag downloaded! Check your downloads.</span>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex gap-2 pt-1 border-t border-[#4F5A2D]">
          <button
            type="button"
            onClick={() => navigate(`/trees/${tree.treeId}`)}
            className="flex-1 h-11 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-colors"
          >
            <Icon name="visibility" className="w-4 h-4" />
            Open Profile
          </button>
          <button
            type="button"
            onClick={() => {
              if (onRegisterAnother) {
                onRegisterAnother();
              } else if (onClose) {
                onClose();
              }
            }}
            className="h-11 px-3.5 rounded-xl bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-[#F0F3E8] font-mono text-xs font-bold uppercase transition-colors"
          >
            Register Another
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
