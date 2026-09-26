import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTrees } from '../../context/TreeContext';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeUserToPush,
  sendTestAlert,
} from '../../utils/pushManager';
import { formatDate } from '../../utils/formatters';

export default function Header({ title = 'Dashboard', subtitle = 'LAMBO V1.0' }) {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const {
    reminders,
    toggleReminder,
    addReminder,
    deleteReminder,
    offlineCount,
    syncOffline,
  } = useTrees();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReminders, setShowReminders] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNewReminderInput, setShowNewReminderInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTreeId, setNewTreeId] = useState('LMB-0001');
  const [newType, setNewType] = useState('watering');
  const [newInterval, setNewInterval] = useState('none');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Push Notifications state
  const [pushPermission, setPushPermission] = useState(() => getNotificationPermission());
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const [pushMessage, setPushMessage] = useState('');
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Detect whether the PWA is installed / running standalone
  const [isInstalled, setIsInstalled] = useState(() => {
    const isStandalone =
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof window !== 'undefined' && window.navigator?.standalone === true) ||
      (typeof document !== 'undefined' && document.referrer.includes('android-app://'));
    const stored = typeof localStorage !== 'undefined' && localStorage.getItem('lambo_pwa_installed') === 'true';
    return Boolean(isStandalone || stored);
  });

  // Profile Edit Modal State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const fileInputRef = useRef(null);

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

    const handleAppInstalled = () => {
      setIsInstalled(true);
      try {
        localStorage.setItem('lambo_pwa_installed', 'true');
      } catch (err) {}
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e) => {
      if (e.matches) {
        setIsInstalled(true);
        try {
          localStorage.setItem('lambo_pwa_installed', 'true');
        } catch (err) {}
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayChange);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        try {
          localStorage.setItem('lambo_pwa_installed', 'true');
        } catch (err) {}
        setDeferredPrompt(null);
      }
    } else {
      alert(
        'To install LAMBO:\n\n• On Android/Chrome: Tap browser menu (⋮) → "Install app" or "Add to Home screen"\n• On iPhone/iPad (Safari): Tap the Share button (⎋) → "Add to Home Screen" (⊕)'
      );
    }
  };

  const handleOpenEditProfile = () => {
    setEditName(user?.name || '');
    setEditCourse(user?.course || user?.section || '');
    setCurrentPassword('');
    setNewPassword('');
    setShowPasswordFields(false);
    setAvatarFile(null);
    setAvatarPreview(user?.avatar || null);
    setProfileError('');
    setProfileSuccess('');
    setShowProfileMenu(false);
    setShowEditProfile(true);
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setProfileError('Image size must be less than 10MB.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setProfileError('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileError('Full name cannot be empty.');
      return;
    }

    if (newPassword && !currentPassword) {
      setProfileError('Please enter your current password to set a new password.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setProfileError('New password must be at least 6 characters long.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', editName.trim());
      formData.append('course', editCourse.trim());
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      if (newPassword) {
        formData.append('currentPassword', currentPassword);
        formData.append('newPassword', newPassword);
      }

      await updateProfile(formData);
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => {
        setShowEditProfile(false);
        setProfileSuccess('');
      }, 1000);
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const pendingCount = reminders.filter((r) => !r.completed).length;

  const handleEnablePush = async () => {
    setIsSubscribingPush(true);
    setPushMessage('');
    try {
      await subscribeUserToPush();
      setPushPermission(getNotificationPermission());
      setPushMessage('Push alerts active! Tap "Test Alert" to test.');
    } catch (err) {
      setPushMessage(err.message || 'Failed to enable push notifications');
    } finally {
      setIsSubscribingPush(false);
    }
  };

  const handleTestPush = async () => {
    setPushMessage('Sending test alert...');
    try {
      await sendTestAlert();
      setPushMessage('Test alert sent! Check your notification tray.');
    } catch (err) {
      setPushMessage(err.message || 'Failed to dispatch test notification');
    }
  };

  const handleManualSync = async () => {
    setIsSyncingOffline(true);
    try {
      const res = await syncOffline();
      if (res && res.synced > 0) {
        alert(`Successfully synchronized ${res.synced} offline observation log(s)!`);
      }
    } finally {
      setIsSyncingOffline(false);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (newTitle.trim()) {
      await addReminder({
        title: newTitle.trim(),
        treeId: newTreeId.trim().toUpperCase(),
        species: 'Monitored Specimen',
        scheduledDate: new Date().toISOString(),
        dueDate: 'Today',
        type: newType,
        repeatInterval: newInterval,
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

              {/* Offline Pending Queue Badge */}
              {offlineCount > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={!isOnline || isSyncingOffline}
                    title={`${offlineCount} offline log(s) stored locally. Click to sync with server.`}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D99B26]/30 border border-[#D99B26] text-[#F5C26B] font-mono text-[10px] font-bold animate-pulse hover:bg-[#D99B26]/40 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {isSyncingOffline ? 'sync' : 'cloud_upload'}
                    </span>
                    <span>{isSyncingOffline ? 'Syncing...' : `${offlineCount} Offline`}</span>
                  </button>
                  <div className="w-[1px] h-4 bg-[#525E31]/80" />
                </>
              )}

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

              {/* Campus Map Quick Button */}
              <button
                type="button"
                onClick={() => navigate('/map')}
                aria-label="Campus Specimen Map"
                title="Global Campus Specimen Map"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#D8DFC8] hover:text-[#A4B566] hover:bg-[#38411F] transition-all"
              >
                <span className="material-symbols-outlined text-[19px]">map</span>
              </button>

              {/* Install App Quick Button - ONLY visible if app is NOT installed */}
              {!isInstalled && (
                <>
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    title="Install LAMBO App on this device"
                    aria-label="Install App"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#D8DFC8] hover:text-[#A4B566] hover:bg-[#38411F] transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">install_mobile</span>
                  </button>
                  <div className="w-[1px] h-4 bg-[#525E31]/80" />
                </>
              )}

              {/* Profile Avatar Button (Toggles Dropdown) */}
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowReminders(false);
                }}
                className={`relative w-8 h-8 rounded-full overflow-hidden ring-2 ${
                  String(user?.rollNumber).trim() === '9260572'
                    ? 'ring-[#F5C26B] shadow-[0_0_8px_rgba(245,194,107,0.4)]'
                    : 'ring-[#8B9B4C] hover:ring-[#A4B566]'
                } transition-all focus:outline-none flex items-center justify-center bg-[#1D230E] cursor-pointer shrink-0`}
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
                  <span className={`font-mono text-xs font-bold ${
                    String(user?.rollNumber).trim() === '9260572' ? 'text-[#F5C26B]' : 'text-[#A4B566]'
                  }`}>
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
                <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl bg-[#262C14] border border-[#5D6A37] shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95">
                  {/* User Details Header with quick edit indicator */}
                  <div className="flex items-center gap-3 pb-3 border-b border-[#4F5A2D]">
                    <div className="relative shrink-0">
                      <div
                        onClick={handleOpenEditProfile}
                        title="Click to edit profile & photo"
                        className={`relative group w-12 h-12 rounded-full overflow-hidden ring-2 ${
                          String(user?.rollNumber).trim() === '9260572'
                            ? 'ring-[#F5C26B] shadow-[0_0_12px_rgba(245,194,107,0.45)]'
                            : 'ring-[#8B9B4C] hover:ring-[#A4B566]'
                        } flex items-center justify-center bg-[#30371A] cursor-pointer transition-all`}
                      >
                        {user?.avatar ? (
                          <img
                            alt={user.name}
                            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                            src={user.avatar}
                          />
                        ) : (
                          <span className={`font-mono text-sm font-bold ${
                            String(user?.rollNumber).trim() === '9260572' ? 'text-[#F5C26B]' : 'text-[#A4B566]'
                          }`}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="material-symbols-outlined text-white text-[16px]">edit</span>
                        </div>
                      </div>
                      {String(user?.rollNumber).trim() === '9260572' && (
                        <span className="absolute -top-1 -right-1 text-[13px] drop-shadow-md select-none" title="Special">
                          👑
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-bold text-sm text-[#F0F3E8] truncate">
                        {user?.name || 'Student Observer'}
                      </h4>
                      <span className="font-mono text-[11px] text-[#AAB596] block truncate">
                        {user?.rollNumber || 'ID Unavailable'}
                      </span>
                      {user?.course && (
                        <span className="font-mono text-[10px] text-[#8B9B4C] block truncate">
                          {user.course}
                        </span>
                      )}
                      {String(user?.rollNumber).trim() === '9260572' && (
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#D99B26]/30 via-[#E57373]/25 to-[#F5C26B]/30 border border-[#F5C26B]/80 shadow-[0_0_10px_rgba(245,194,107,0.35)] select-none">
                          <span className="text-[10px] font-bold text-[#F5C26B] tracking-tight whitespace-nowrap">
                            my baby the goat🗣️🗣️❤️🔥
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Network Status Badge */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#1D230E] border border-[#525E31]/60 text-xs font-mono">
                    <span className="text-[#AAB596]">Network:</span>
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
                    {/* Global Campus Map Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/map');
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-mono font-medium text-[#D8DFC8] hover:bg-[#30371A] hover:text-[#F0F3E8] transition-colors flex items-center gap-2.5 group"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#A4B566] group-hover:scale-110 transition-transform">
                        map
                      </span>
                      Global Campus Map
                    </button>

                    {/* Edit Profile & Photo Button */}
                    <button
                      type="button"
                      onClick={handleOpenEditProfile}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-mono font-medium text-[#D8DFC8] hover:bg-[#30371A] hover:text-[#F0F3E8] transition-colors flex items-center gap-2.5 group"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#A4B566] group-hover:scale-110 transition-transform">
                        manage_accounts
                      </span>
                      Edit Profile & Photo
                    </button>

                    {/* Install PWA App - ONLY visible if NOT installed */}
                    {!isInstalled && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleInstallClick();
                        }}
                        className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-mono font-medium text-[#D8DFC8] hover:bg-[#30371A] hover:text-[#F0F3E8] transition-colors flex items-center gap-2.5"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#A4B566]">
                          install_mobile
                        </span>
                        Install PWA App
                      </button>
                    )}

                    {/* Logout Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-mono font-bold text-[#E57373] hover:bg-[#431B1B]/80 hover:text-[#FFCDD2] transition-colors flex items-center gap-2.5"
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

      {/* Edit Profile & Photo Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#262C14] border border-[#5D6A37] shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#A4B566] text-[24px]">manage_accounts</span>
                <div>
                  <h3 className="font-display font-bold text-base text-[#F0F3E8]">
                    Edit Student Profile
                  </h3>
                  <p className="font-mono text-[11px] text-[#AAB596]">
                    Manage your account details & avatar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfile(false)}
                className="w-8 h-8 rounded-full bg-[#30371A] border border-[#525E31] text-[#AAB596] flex items-center justify-center hover:text-[#F0F3E8] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Error & Success Feedback */}
            {profileError && (
              <div className="p-3 rounded-xl bg-[#431B1B]/80 border border-[#E57373]/50 text-[#FFCDD2] text-xs font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#E57373]">error</span>
                <span>{profileError}</span>
              </div>
            )}
            {profileSuccess && (
              <div className="p-3 rounded-xl bg-[#1D331A]/80 border border-[#A4B566]/60 text-[#C5E1A5] text-xs font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#A4B566]">check_circle</span>
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Photo Uploader */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[#1D230E] border border-[#525E31]/60">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#8B9B4C] hover:ring-[#A4B566] flex items-center justify-center bg-[#30371A] shrink-0 cursor-pointer shadow-md"
                >
                  {avatarPreview ? (
                    <img
                      alt="Avatar preview"
                      className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                      src={avatarPreview}
                    />
                  ) : (
                    <span className="font-mono text-xl font-bold text-[#A4B566]">
                      {editName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                    <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                    <span className="text-[9px] font-mono">Change</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarSelect}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-xs font-mono text-[#F0F3E8] flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#A4B566]">upload</span>
                    {avatarPreview ? 'Choose Different Photo' : 'Upload Profile Photo'}
                  </button>
                  <p className="font-mono text-[10px] text-[#AAB596]">
                    Supports JPG, PNG, WebP (max 10MB)
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Maria Clara"
                  required
                  className="w-full h-10 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] transition-colors"
                />
              </div>

              {/* Roll / Student ID (Read Only) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
                    Student / Roll Number
                  </label>
                  <span className="text-[10px] font-mono text-[#8B9B4C] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    Permanent ID
                  </span>
                </div>
                <input
                  type="text"
                  value={user?.rollNumber || ''}
                  disabled
                  className="w-full h-10 bg-[#171B0B] border border-[#3E4724] rounded-xl px-3 text-sm font-mono text-[#8B9B4C] cursor-not-allowed select-none opacity-80"
                />
              </div>

              {/* Course / Section */}
              <div className="space-y-1">
                <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
                  Course / Program / Section
                </label>
                <input
                  type="text"
                  value={editCourse}
                  onChange={(e) => setEditCourse(e.target.value)}
                  placeholder="e.g. BS Forestry 2-A"
                  className="w-full h-10 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-sm text-[#F0F3E8] focus:outline-none focus:border-[#A4B566] transition-colors"
                />
              </div>

              {/* Optional Password Update Section */}
              <div className="pt-1 border-t border-[#4F5A2D]/60">
                <button
                  type="button"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                  className="text-xs font-mono text-[#A4B566] hover:underline flex items-center gap-1 py-1"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {showPasswordFields ? 'expand_less' : 'expand_more'}
                  </span>
                  {showPasswordFields ? 'Hide Password Change' : 'Change Password (Optional)'}
                </button>

                {showPasswordFields && (
                  <div className="space-y-2.5 pt-2 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full h-9 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
                        New Password (min 6 characters)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full h-9 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 h-10 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#1F240F] border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  disabled={isSavingProfile}
                  className="h-10 px-4 rounded-xl bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-xs font-mono text-[#D8DFC8] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Care Reminders Drawer / Popover Modal */}
      {showReminders && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#262C14] border border-[#5D6A37] p-4 shadow-2xl space-y-3 animate-in zoom-in-95">
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

            {/* Web Push Notification Control Card */}
            {isPushSupported() && (
              <div className="p-3 rounded-xl bg-[#1D230E] border border-[#525E31] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#A4B566] text-[18px]">
                      {pushPermission === 'granted' ? 'notifications_active' : 'notifications_paused'}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#F0F3E8]">
                      Device Push Alerts
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                      pushPermission === 'granted'
                        ? 'bg-[#2E3C1B] text-[#A4B566] border-[#5D6F28]'
                        : 'bg-[#3A331A] text-[#F5C26B] border-[#8D6B19]'
                    }`}
                  >
                    {pushPermission === 'granted' ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="flex gap-2 pt-0.5">
                  {pushPermission !== 'granted' ? (
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      disabled={isSubscribingPush}
                      className="flex-1 h-8 rounded-lg bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[14px]">add_alert</span>
                      <span>{isSubscribingPush ? 'Enabling...' : 'Enable Push Alerts'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleTestPush}
                      className="flex-1 h-8 rounded-lg bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-[#A4B566] font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">send</span>
                      <span>Send Test Alert</span>
                    </button>
                  )}
                </div>

                {pushMessage && (
                  <p className="font-mono text-[10px] text-[#AAB596] pt-0.5 leading-tight">
                    {pushMessage}
                  </p>
                )}
              </div>
            )}

            {/* Reminders List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {reminders.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#1D230E] border border-[#525E31]/40 text-center text-xs font-mono text-[#AAB596]">
                  No active care tasks scheduled.
                </div>
              ) : (
                reminders.map((rem) => {
                  const remId = rem._id || rem.id;
                  const displayDate = rem.scheduledDate
                    ? formatDate(rem.scheduledDate)
                    : rem.dueDate || 'Today';
                  return (
                    <div
                      key={remId}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                        rem.completed
                          ? 'bg-[#1D230E]/70 border-[#525E31]/40 opacity-60'
                          : 'bg-[#30371A] border-[#525E31] hover:border-[#8B9B4C]'
                      }`}
                    >
                      <div
                        onClick={() => toggleReminder(remId)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
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
                          <span className="font-label-sm text-label-sm text-[#C2CE9F] block truncate">
                            {rem.treeId || rem.tree?.treeId || 'Specimen'} • {displayDate}
                            {rem.repeatInterval && rem.repeatInterval !== 'none' && (
                              <span className="ml-1 text-[#F5C26B]">({rem.repeatInterval})</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-[#1D230E] border border-[#525E31] font-label-sm text-label-sm text-[#D8DFC8]">
                          {rem.type}
                        </span>
                        {deleteReminder && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteReminder(remId);
                            }}
                            className="text-[#AAB596] hover:text-[#E57373] p-1 transition-colors"
                            title="Delete task"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
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
                  required
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Tree ID"
                    value={newTreeId}
                    onChange={(e) => setNewTreeId(e.target.value)}
                    className="h-8 bg-[#1D230E] border border-[#525E31] rounded-lg px-2 text-xs font-mono text-[#F0F3E8] uppercase"
                  />
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="h-8 bg-[#1D230E] border border-[#525E31] rounded-lg px-1.5 text-xs font-mono text-[#F0F3E8]"
                  >
                    <option value="watering">Watering</option>
                    <option value="fertilizer">Fertilizer</option>
                    <option value="inspection">Inspection</option>
                    <option value="custom">Custom</option>
                  </select>
                  <select
                    value={newInterval}
                    onChange={(e) => setNewInterval(e.target.value)}
                    className="h-8 bg-[#1D230E] border border-[#525E31] rounded-lg px-1 text-xs font-mono text-[#F0F3E8]"
                  >
                    <option value="none">One-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 h-8 rounded-lg bg-[#8B9B4C] text-[#1F240F] font-mono text-xs font-bold uppercase hover:bg-[#9EAF6D]"
                  >
                    Save Reminder
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
