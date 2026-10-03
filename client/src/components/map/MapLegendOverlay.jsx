import React from 'react';

export default function MapLegendOverlay() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] p-3 rounded-xl bg-[#1D230E]/90 border border-[#525E31] backdrop-blur-md text-xs font-mono space-y-1.5 shadow-xl pointer-events-auto">
      <span className="text-[#A4B566] font-bold block text-[10px] uppercase tracking-wider">
        Specimen Health Matrix
      </span>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#A4B566] shadow-[0_0_6px_#A4B566]" />
        <span className="text-[#F0F3E8] text-[11px]">Thriving</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#D99B26] shadow-[0_0_6px_#D99B26]" />
        <span className="text-[#F0F3E8] text-[11px]">Stable / Fair</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E57373] shadow-[0_0_6px_#E57373]" />
        <span className="text-[#F0F3E8] text-[11px]">Distressed</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#757575] shadow-[0_0_6px_#757575]" />
        <span className="text-[#F0F3E8] text-[11px]">Dead / Mortality</span>
      </div>
      <div className="pt-1 border-t border-[#525E31]/60 flex items-center gap-1.5 text-[10px] text-[#C2CE9F]">
        <span className="w-2 h-2 rounded-full border border-white bg-[#8B9B4C]" />
        <span>White ring = Your plant</span>
      </div>
    </div>
  );
}
