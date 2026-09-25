import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
      <span className="font-mono text-4xl font-bold text-[#E57373]">404</span>
      <h2 className="text-xl font-bold font-display text-[#F0F3E8] mt-2">
        Sector Not Found
      </h2>
      <p className="text-xs text-[#AAB596] max-w-xs mt-1 mb-6">
        The coordinates or resource you attempted to access do not exist in the botanical grid.
      </p>
      <Link
        to="/"
        className="bg-[#A4B566] text-[#1D230E] px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#B8C87A] transition-colors"
      >
        Return to HQ
      </Link>
    </div>
  );
}
