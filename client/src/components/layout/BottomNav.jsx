import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Home', path: '/', icon: 'grid_view' },
  { name: 'Scan', path: '/scan', icon: 'qr_code_scanner' },
  { name: 'Trees', path: '/trees', icon: 'park' },
  { name: 'Logs', path: '/logs', icon: 'query_stats' },
  { name: 'Register', path: '/register-tree', icon: 'add_circle' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-[#1D230E]/95 backdrop-blur-xl border-t border-[#525E31]/40 shadow-[0_-2px_16px_rgba(0,0,0,0.5)]">
      <div className="h-16 flex items-center justify-around px-2 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 transition-all relative ${
                isActive
                  ? 'text-[#A4B566] font-bold scale-105'
                  : 'text-[#D8DFC8] hover:text-[#F0F3E8] opacity-80 hover:opacity-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-10 h-7 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-[#38411F] text-[#A4B566] shadow-sm' : ''
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm tracking-wider uppercase">
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
