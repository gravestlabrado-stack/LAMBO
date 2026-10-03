import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../common/Icon';
import { useAuth } from '../../hooks/useAuth';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const isOfficer = user?.role === 'officer' || String(user?.rollNumber).trim() === '9260572';

  const navItems = [
    { name: 'Home', path: '/', icon: 'grid_view' },
    { name: 'Scan', path: '/scan', icon: 'qr_code_scanner' },
    { name: 'Trees', path: '/trees', icon: 'park' },
    { name: 'Logs', path: '/logs', icon: 'query_stats' },
    { name: 'Plant', path: '/register-tree', icon: 'add_circle' },
    ...(isOfficer ? [{ name: 'Officer', path: '/officer', icon: 'shield' }] : []),
  ];

  const checkIsActive = (item) => {
    if (item.path === '/') return pathname === '/';
    if (item.name === 'Officer') {
      return pathname.startsWith('/officer');
    }
    if (item.name === 'Trees') {
      return pathname.startsWith('/trees') && !pathname.endsWith('/logs');
    }
    if (item.name === 'Logs') {
      return pathname.startsWith('/logs') || pathname.endsWith('/logs');
    }
    if (item.name === 'Scan') {
      return pathname.startsWith('/scan');
    }
    if (item.name === 'Plant') {
      return pathname.startsWith('/register-tree');
    }
    return pathname.startsWith(item.path);
  };

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-[#1D230E]/95 backdrop-blur-xl border-t border-[#525E31]/40 shadow-[0_-2px_16px_rgba(0,0,0,0.5)]">
      <div className="h-16 flex items-center justify-around px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = checkIsActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 transition-all relative ${
                active
                  ? 'text-[#A4B566] font-bold scale-105'
                  : 'text-[#D8DFC8] hover:text-[#F0F3E8] opacity-80 hover:opacity-100'
              }`}
            >
              <div
                className={`w-10 h-7 rounded-full flex items-center justify-center transition-all ${
                  active ? 'bg-[#38411F] text-[#A4B566] shadow-sm ring-1 ring-[#8B9B4C]/40' : ''
                }`}
              >
                <Icon
                  name={item.icon}
                  className="w-5 h-5"
                  strokeWidth={active ? 2.5 : 1.75}
                />
              </div>
              <span className={`font-label-sm text-label-sm tracking-wider uppercase ${active ? 'text-[#E1E6BC] font-semibold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
