import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../common/Icon';

/**
 * User Profile Dropdown Menu in the Header
 */
export default function UserProfileMenu({
  isOpen,
  onToggle,
  onClose,
  user,
  onOpenEditProfile,
  onLogout,
}) {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="w-8 h-8 rounded-full border border-[#525E31] bg-[#1D230E] flex items-center justify-center overflow-hidden hover:border-[#8B9B4C] transition-colors focus:outline-none"
        title="Account Options"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="font-mono text-xs font-bold text-[#A4B566]">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#262C14] border border-[#5D6A37] p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
            {/* User Info Card */}
            <div className="p-2.5 rounded-xl bg-[#1D230E] border border-[#525E31] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-xs font-bold text-[#F0F3E8] truncate block">
                  {user?.name || 'Cadet'}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                    user?.role === 'officer'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'bg-[#30371A] text-[#A4B566] border border-[#525E31]'
                  }`}
                >
                  {user?.role === 'officer' ? '🎖️ Officer' : 'Cadet'}
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#C2CE9F] block">
                Roll #{user?.rollNumber || '0000'} {user?.course ? `• ${user.course}` : ''}
              </span>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              {user?.role === 'officer' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/officer');
                  }}
                  className="w-full h-9 rounded-xl px-2.5 text-xs font-mono font-medium text-amber-200 hover:bg-amber-500/15 flex items-center gap-2 transition-colors border border-amber-500/30"
                >
                  <Icon name="shield" className="text-[16px] text-amber-300" />
                  <span>Officer Command Portal</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditProfile();
                }}
                className="w-full h-9 rounded-xl px-2.5 text-xs font-mono font-medium text-[#D8DFC8] hover:bg-[#30371A] flex items-center gap-2 transition-colors"
              >
                <Icon name="manage_accounts" className="text-[16px] text-[#A4B566]" />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full h-9 rounded-xl px-2.5 text-xs font-mono font-medium text-red-300 hover:bg-red-950/40 flex items-center gap-2 transition-colors"
              >
                <Icon name="logout" className="text-[16px] text-red-400" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
