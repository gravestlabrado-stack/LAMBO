import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-8 max-w-xl mx-auto">
      {/* Tactical Radar Beacon Visual */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-[#262C14] border-2 border-[#5D6A37] flex items-center justify-center shadow-xl relative overflow-hidden">
          {/* Animated radar rings */}
          <div className="absolute inset-0 rounded-full border border-[#8B9B4C]/30 animate-ping opacity-30" />
          <div className="w-16 h-16 rounded-full border border-[#525E31] flex items-center justify-center">
            <Icon name="radar" className="w-9 h-9 text-[#A4B566]" />
          </div>
        </div>
        {/* Warning Badge */}
        <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[#3B1E1E] border border-[#7A3333] text-[10px] font-mono font-bold text-[#FF8585] shadow-md uppercase tracking-wider">
          ERR_404
        </div>
      </div>

      {/* Status Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#262C14] border border-[#4F5A2D] text-[11px] font-mono text-[#A4B566] uppercase tracking-widest font-bold">
          <span className="w-2 h-2 rounded-full bg-[#E57373] animate-pulse" />
          COORDINATES_UNRESOLVED
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-black text-[#F0F3E8] tracking-tight">
          Sector Not Found
        </h1>

        <p className="font-body-md text-sm text-[#CCD6B8] max-w-md mx-auto leading-relaxed">
          The botanical telemetry coordinates or tree specimen ID you attempted to survey could not be pinpointed within the active CTU Barili field sectors.
        </p>
      </div>

      {/* Tactical Terminal Box */}
      <div className="w-full my-6 p-4 rounded-2xl bg-[#1D230E] border border-[#525E31] text-left font-mono text-xs text-[#AAB596] shadow-inner space-y-1 relative">
        <div className="flex items-center justify-between text-[10px] text-[#7E8B54] uppercase tracking-wider border-b border-[#3D4721] pb-2 mb-2">
          <span>LAMBO_SYSTEM_DIAGNOSTIC</span>
          <span>STATUS: OUT_OF_BOUNDS</span>
        </div>
        <p className="text-[#D8DFC8]">
          <span className="text-[#A4B566]">&gt;</span> PATH: {window.location.pathname}
        </p>
        <p className="text-[#AAB596]">
          <span className="text-[#A4B566]">&gt;</span> REASON: Sector reference is unindexed or has been relocated.
        </p>
        <p className="text-[#8B9B4C] text-[11px]">
          <span className="text-[#A4B566]">&gt;</span> SUGGESTION: Re-align GPS grid or scan botanical physical tag.
        </p>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 gap-2.5 w-full">
        <Link
          to="/"
          className="h-11 px-4 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Icon name="dashboard" className="w-4.5 h-4.5" />
          <span>Dashboard</span>
        </Link>
        <Link
          to="/trees"
          className="h-11 px-4 rounded-xl bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-[#F0F3E8] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Icon name="park" className="w-4.5 h-4.5 text-[#A4B566]" />
          <span>Tree Ledger</span>
        </Link>
        <Link
          to="/map"
          className="h-11 px-4 rounded-xl bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-[#F0F3E8] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Icon name="map" className="w-4.5 h-4.5 text-[#A4B566]" />
          <span>Campus Map</span>
        </Link>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="h-11 px-4 rounded-xl bg-[#262C14] hover:bg-[#30371A] border border-[#4F5A2D] text-[#CCD6B8] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Icon name="arrow_back" className="w-4.5 h-4.5" />
          <span>Previous Screen</span>
        </button>
      </div>
    </div>
  );
}
