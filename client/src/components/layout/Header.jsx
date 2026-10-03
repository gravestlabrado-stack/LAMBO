import React, { useState } from 'react';
import Icon from '../common/Icon';
import { useAuth } from '../../hooks/useAuth';
import { useTrees } from '../../context/TreeContext';
import { useNetworkRadar } from '../../hooks/useNetworkRadar';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { usePWAInstall } from '../../hooks/usePWAInstall';

import ConnectionRadar from './header/ConnectionRadar';
import RemindersDrawer from './header/RemindersDrawer';
import UserProfileMenu from './header/UserProfileMenu';
import EditProfileModal from './header/EditProfileModal';
import OfflineQueueModal from './header/OfflineQueueModal';

/**
 * Top Tactical App Header
 * Coordinates real-time connectivity radar, offline queue, reminders, and profile controls
 */
export default function Header({ title = 'Dashboard', subtitle = 'LAMBO V2.5' }) {
  const { user, logout, updateProfile } = useAuth();
  const { trees = [], reminders = [], toggleReminder, addReminder, deleteReminder } = useTrees();

  // Custom Hooks
  const { isOnline, dbStatus, checkConnection } = useNetworkRadar();
  const { queue, queueCount, isSyncing, syncFlash, triggerSync, deleteQueueItem } = useOfflineQueue();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  // Modal / Drawer UI State
  const [showReminders, setShowReminders] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);

  const pendingRemindersCount = reminders.filter((r) => !r.completed).length;

  const handleRetrySync = async () => {
    await checkConnection();
    await triggerSync();
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-[#1D230E]/95 backdrop-blur-xl border-b border-[#525E31]/40 shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
        <div className="h-16 px-4 flex items-center justify-between gap-3 max-w-5xl mx-auto">
          {/* Brand & Page Titles */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <img
              alt="LAMBO Logo"
              className="h-8 w-8 object-contain shrink-0 drop-shadow rounded-lg"
              src="/lambo-logo.svg"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-[10px] sm:text-label-sm text-[#C2CE9F] uppercase tracking-wider truncate">
                {subtitle}
              </span>
              <h1 className="font-headline-sm text-sm sm:text-headline-sm text-[#F0F3E8] truncate font-bold">
                {title}
              </h1>
            </div>
          </div>

          {/* Unified Tactical Pill Toolbar */}
          <div className="relative shrink-0 flex items-center gap-2">
            <div className="flex items-center bg-[#30371A]/90 border border-[#525E31] rounded-full p-1 pl-2.5 sm:pl-3 pr-1 gap-1 sm:gap-1.5 shadow-sm">
              {/* Connection Radar */}
              <ConnectionRadar
                isOnline={isOnline}
                isSavingDb={dbStatus === 'saving'}
                isSyncing={isSyncing}
                justSynced={syncFlash}
                offlineCount={queueCount}
                onRetrySync={handleRetrySync}
                onOpenQueue={() => setShowQueueModal(true)}
              />

              {/* Reminders / Notifications Bell Button */}
              <button
                type="button"
                onClick={() => setShowReminders(true)}
                title="View Care Reminders"
                className="relative w-8 h-8 rounded-full border border-[#525E31] bg-[#1D230E] flex items-center justify-center text-[#D8DFC8] hover:text-white hover:border-[#8B9B4C] transition-colors"
              >
                <Icon name="notifications" className="text-[17px]" />
                {pendingRemindersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#8B9B4C] text-[#1F240F] font-mono text-[9px] font-bold">
                    {pendingRemindersCount}
                  </span>
                )}
              </button>

              {/* PWA Install Action Button */}
              {isInstallable && !isInstalled && (
                <button
                  type="button"
                  onClick={promptInstall}
                  title="Install LAMBO on this device"
                  className="h-8 px-2.5 rounded-full bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Icon name="download" className="text-[14px]" />
                  <span className="hidden sm:inline">Install</span>
                </button>
              )}

              {/* User Avatar & Menu */}
              <UserProfileMenu
                isOpen={showProfileMenu}
                onToggle={() => setShowProfileMenu(!showProfileMenu)}
                onClose={() => setShowProfileMenu(false)}
                user={user}
                onOpenEditProfile={() => setShowEditProfile(true)}
                onLogout={logout}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Reminders Drawer */}
      <RemindersDrawer
        isOpen={showReminders}
        onClose={() => setShowReminders(false)}
        reminders={reminders}
        trees={trees}
        onToggleReminder={toggleReminder}
        onAddReminder={addReminder}
        onDeleteReminder={deleteReminder}
      />

      {/* Offline Queue Modal */}
      <OfflineQueueModal
        isOpen={showQueueModal}
        onClose={() => setShowQueueModal(false)}
        queue={queue}
        isSyncing={isSyncing}
        onRetrySync={handleRetrySync}
        onDeleteItem={deleteQueueItem}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        user={user}
        onUpdateProfile={updateProfile}
      />
    </>
  );
}
