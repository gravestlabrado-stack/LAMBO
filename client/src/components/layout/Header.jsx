import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTrees } from '../../context/TreeContext';

export default function Header({ title = 'Dashboard', subtitle = 'LAMBO V1.0' }) {
  const { user, logout } = useAuth();
  const { reminders, toggleReminder, addReminder } = useTrees();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReminders, setShowReminders] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNewReminderInput, setShowNewReminderInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTreeId, setNewTreeId] = useState('LMB-0001');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('To install LAMBO:\n\n• On Android/Chrome: Tap browser menu (⋮) → "Install app" or "Add to Home screen"\n• On iPhone/iPad (Safari): Tap the Share button (⎋) → "Add to Home Screen" (⊕)');
    }
  };

  const pendingCount = reminders.filter((r) => !r.completed).length;

  const handleCreateReminder = (e) => {
    e.preventDefault();
    if (newTitle.trim()) {
      addReminder({
        title: newTitle.trim(),
        treeId: newTreeId,
        species: 'Monitored Specimen',
        dueDate: 'Today',
        type: 'watering',
      });
      setNewTitle('');
      setShowNewReminderInput(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-[#1D230E]/95 backdrop-blur-xl border-b border-[#525E31]/40 shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
        <div className="h-16 px-4 flex items-center justify-between gap-3 max-w-5xl mx-auto">
          {/* Brand & Page Info */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              alt="LAMBO Logo"
              className="h-8 w-8 object-contain shrink-0 drop-shadow rounded-lg"
              src="/lambo-logo.svg"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-[#C2CE9F] uppercase tracking-wider truncate">
                {subtitle}
              </span>
              <h1 className="font-headline-sm text-headline-sm text-[#F0F3E8] truncate font-bold">
                {title}
              </h1>
            </div>
          </div>

          {/* Unified Tactical Pill Toolbar */}
          <div className="relative">
            <div className="flex items-center bg-[#30371A]/90 border border-[#525E31] rounded-full p-1 pl-3 pr-1 gap-1.5 shadow-sm">
              {/* Online / Offline Status Indicator */}
              <div
                title={isOnline ? 'Network: Online' : 'Network: Offline'}
                className="flex items-center gap-1.5 pr-1 select-none"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline
                      ? 'bg-[#A4B566] shadow-[0_0_6px_#A4B566]'
                      : 'bg-[#E57373] shadow-[0_0_6px_#E57373] animate-pulse'
                  }`}
                />
                <span className="font-mono text-[11px] font-semibold text-[#D8DFC8] hidden xs:inline">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Divider */}
              <div className="w-[1px] h-4 bg-[#525E31]/80" />

              {/* Reminders Bell Button */}
              <button
                type="button"
                onClick={() => {
                  setShowReminders(!showReminders);
                  setShowProfileMenu(false);
                }}
                aria-label="Care Reminders"
                title="Care Reminders"
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-[#D8DFC8] hover:text-[#F0F3E8] hover:bg-[#38411F] transition-all"
              >
                <span className="material-symbols-outlined text-[19px]">notifications</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#D99B26] text-[#1D230E] font-mono text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {pendingCount}
                  </span>
                )}
              </button>

              {/* Install App Quick Button */}
              <button
                type="button"
                onClick={handleInstallClick}
                title="Install LAMBO App on this device"
                aria-label="Install App"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#D8DFC8] hover:text-[#A4B566] hover:bg-[#38411F] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">install_mobile</span>
              </button>

              {/* Divider */}
              <div className="w-[1px] h-4 bg-[#525E31]/80" />

              {/* Profile Avatar Button (Toggles Dropdown) */}
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowReminders(false);
                }}
                className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#8B9B4C] hover:ring-[#A4B566] transition-all focus:outline-none flex items-center justify-center bg-[#1D230E] cursor-pointer shrink-0"
                title="Account Menu"
                aria-label="Account Profile Menu"
              >
                {user?.avatar ? (
                  <img
                    alt={user.name}
                    className="w-full h-full object-cover"
                    src={user.avatar}
                  />
                ) : (
                  <span className="font-mono text-xs font-bold text-[#A4B566]">
                    {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <>
                {/* Click-away backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />

                {/* Dropdown Card */}
                <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl bg-[#262C14] border border-[#5D6A37] shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95">
                  {/* User Details */}
                  <div className="flex items-center gap-3 pb-3 border-b border-[#4F5A2D]">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#8B9B4C] flex items-center justify-center bg-[#30371A] shrink-0">
                      {user?.avatar ? (
                        <img
                          alt={user.name}
                          className="w-full h-full object-cover"
                          src={user.avatar}
                        />
                      ) : (
                        <span className="font-mono text-sm font-bold text-[#A4B566]">
                          {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display font-bold text-sm text-[#F0F3E8] truncate">
                        {user?.name || 'Student Observer'}
                      </h4>
                      <span className="font-mono text-[11px] text-[#AAB596] block truncate">
                        {user?.rollNumber || '2024-BSAB-001'} {(user?.course || user?.section) ? `• ${user?.course || user?.section}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Network Status Badge */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#1D230E] border border-[#525E31]/60 text-xs font-mono">
                    <span className="text-[#AAB596]">Network Status:</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOnline
                            ? 'bg-[#A4B566] shadow-[0_0_6px_#A4B566]'
                            : 'bg-[#E57373] animate-pulse'
                        }`}
                      />
                      <span className={isOnline ? 'text-[#A4B566] font-semibold' : 'text-[#E57373] font-semibold'}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Actions */}
                  <div className="space-y-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleInstallClick();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-mono font-medium text-[#D8DFC8] hover:bg-[#30371A] hover:text-[#F0F3E8] transition-colors flex items-center gap-2.5"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#A4B566]">
                        install_mobile
                      </span>
                      Install PWA App
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-mono font-bold text-[#E57373] hover:bg-[#431B1B]/80 hover:text-[#FFCDD2] transition-colors flex items-center gap-2.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign Out / Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Care Reminders Drawer / Popover Modal */}
      {showReminders && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#262C14] border border-[#5D6A37] p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#A4B566]">event_available</span>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-[#F0F3E8] font-bold">
                    Care Reminders
                  </h3>
                  <span className="font-label-sm text-label-sm text-[#C2CE9F]">
                    {pendingCount} actions pending
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReminders(false)}
                className="w-7 h-7 rounded-full bg-[#30371A] border border-[#525E31] text-[#AAB596] flex items-center justify-center hover:text-[#F0F3E8]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* Reminders List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {reminders.map((rem) => (
                <div
                  key={rem.id}
                  onClick={() => toggleReminder(rem.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                    rem.completed
                      ? 'bg-[#1D230E]/70 border-[#525E31]/40 opacity-60'
                      : 'bg-[#30371A] border-[#525E31] hover:border-[#8B9B4C]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        rem.completed ? 'text-[#A4B566]' : 'text-[#AAB596]'
                      }`}
                    >
                      {rem.completed ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <div className="min-w-0">
                      <span
                        className={`font-body-md text-body-md font-semibold truncate block ${
                          rem.completed ? 'line-through text-[#AAB596]' : 'text-[#F0F3E8]'
                        }`}
                      >
                        {rem.title}
                      </span>
                      <span className="font-label-sm text-label-sm text-[#C2CE9F]">
                        {rem.treeId} • {rem.dueDate}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#1D230E] border border-[#525E31] font-label-sm text-label-sm text-[#D8DFC8]">
                    {rem.type}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Add Reminder Form */}
            {showNewReminderInput ? (
              <form onSubmit={handleCreateReminder} className="pt-2 border-t border-[#4F5A2D] space-y-2">
                <input
                  type="text"
                  placeholder="Task (e.g. Add organic compost)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-9 bg-[#1D230E] border border-[#525E31] rounded-lg px-2.5 text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tree ID (e.g. LMB-0001)"
                    value={newTreeId}
                    onChange={(e) => setNewTreeId(e.target.value)}
                    className="w-28 h-8 bg-[#1D230E] border border-[#525E31] rounded-lg px-2 text-xs font-mono text-[#F0F3E8] uppercase"
                  />
                  <button
                    type="submit"
                    className="flex-1 h-8 rounded-lg bg-[#8B9B4C] text-[#1F240F] font-mono text-xs font-bold uppercase hover:bg-[#9EAF6D]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewReminderInput(false)}
                    className="h-8 px-2 rounded-lg bg-[#30371A] border border-[#525E31] text-xs text-[#AAB596]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewReminderInput(true)}
                className="w-full py-2 rounded-xl bg-[#30371A] border border-[#525E31] text-[#D8DFC8] hover:text-[#F0F3E8] hover:border-[#8B9B4C] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add New Care Task
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
