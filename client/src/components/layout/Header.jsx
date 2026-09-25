import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTrees } from '../../context/TreeContext';

export default function Header({ title = 'Dashboard', subtitle = 'LAMBO V1.0' }) {
  const { user, logout } = useAuth();
  const { reminders, toggleReminder, addReminder } = useTrees();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReminders, setShowReminders] = useState(false);
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

          {/* Action Pills & User Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Install App Button */}
            <button
              type="button"
              onClick={handleInstallClick}
              title="Install LAMBO on this device"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">install_mobile</span>
              <span className="hidden xs:inline">Install</span>
            </button>

            {/* Reminders Bell Trigger */}
            <button
              type="button"
              onClick={() => setShowReminders(!showReminders)}
              aria-label="Care Reminders"
              className="relative p-1.5 rounded-full bg-[#30371A] border border-[#525E31] text-[#D8DFC8] hover:text-[#F0F3E8] hover:border-[#8B9B4C] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D99B26] text-[#1D230E] font-mono text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Offline Ready Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-semibold transition-colors ${
                isOnline
                  ? 'bg-[#30371A] border-[#525E31] text-[#D2DCB4]'
                  : 'bg-[#431B1B] border-[#E57373]/60 text-[#FFCDD2]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isOnline ? 'text-[#A4B566]' : 'text-[#E57373]'
                }`}
              >
                {isOnline ? 'cloud_done' : 'cloud_off'}
              </span>
              <span className="hidden sm:inline font-label-sm text-label-sm">
                {isOnline ? 'Offline Ready' : 'Offline Mode'}
              </span>
            </div>

            {/* User Profile Avatar with Ring */}
            {user ? (
              <div className="flex items-center gap-2">
                <div
                  title={`${user.name} (${user.rollNumber})`}
                  className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center ring-2 ring-[#8B9B4C]/70 shadow-sm bg-[#30371A]"
                >
                  {user.avatar ? (
                    <img
                      alt={user.name}
                      className="w-full h-full object-cover"
                      src={user.avatar}
                    />
                  ) : (
                    <span className="font-mono text-xs font-bold text-[#A4B566]">
                      {user.name?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  className="text-[#AAB596] hover:text-[#E57373] p-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </button>
              </div>
            ) : null}
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
