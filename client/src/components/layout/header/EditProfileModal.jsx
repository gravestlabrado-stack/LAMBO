import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../common/Icon';

/**
 * Modal dialog for updating cadet/officer user profile and credentials
 */
export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  onUpdateProfile,
}) {
  const [editName, setEditName] = useState(user?.name || '');
  const [editCourse, setEditCourse] = useState(user?.course || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    setProfileError('');
  };

  const handleSave = async (e) => {
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

    setIsSaving(true);
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

      await onUpdateProfile(formData);
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => {
        onClose();
        setProfileSuccess('');
      }, 1000);
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#262C14] border border-[#5D6A37] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#4F5A2D] pb-3">
          <div className="flex items-center gap-2">
            <Icon name="manage_accounts" className="text-[#A4B566] text-[22px]" />
            <h3 className="font-headline-sm text-sm sm:text-headline-sm text-[#F0F3E8] font-bold">
              Edit Personnel Profile
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#30371A] border border-[#525E31] text-[#AAB596] flex items-center justify-center hover:text-[#F0F3E8]"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>

        {profileError && (
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-700/80 text-red-200 text-xs font-mono">
            {profileError}
          </div>
        )}

        {profileSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs font-mono">
            {profileSuccess}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#8B9B4C]"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#1D230E] border-2 border-[#525E31] flex items-center justify-center font-headline-sm font-bold text-lg text-[#F0F3E8]">
                  {editName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#8B9B4C] text-[#1F240F] flex items-center justify-center hover:bg-[#9EAF6D] shadow-md"
                title="Change Avatar"
              >
                <Icon name="photo_camera" className="text-[14px]" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-mono font-medium text-[#F0F3E8]">
                Profile Photo
              </span>
              <span className="block text-[11px] font-mono text-[#AAB596]">
                JPG, PNG, or WebP. Max 5MB.
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
              Full Name *
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Cadet John Doe"
              required
              className="w-full h-9 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
            />
          </div>

          {/* Course */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
              Academic Degree / Course
            </label>
            <input
              type="text"
              value={editCourse}
              onChange={(e) => setEditCourse(e.target.value)}
              placeholder="e.g. DVM, BSA, BSF"
              className="w-full h-9 bg-[#1D230E] border border-[#525E31] rounded-xl px-3 text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
            />
          </div>

          {/* Password Change Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              className="flex items-center gap-1.5 text-xs font-mono text-[#A4B566] hover:text-[#B9CB7B]"
            >
              <Icon name={showPasswordFields ? 'expand_less' : 'expand_more'} className="text-[16px]" />
              <span>{showPasswordFields ? 'Hide Password Options' : 'Change Password'}</span>
            </button>

            {showPasswordFields && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#1D230E] border border-[#525E31] space-y-2.5">
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full h-9 bg-[#262C14] border border-[#525E31] rounded-xl px-3 text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-medium text-[#C2CE9F]">
                    New Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full h-9 bg-[#262C14] border border-[#525E31] rounded-xl px-3 text-xs text-[#F0F3E8] focus:outline-none focus:border-[#A4B566]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 h-10 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#1F240F] border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Icon name="save" className="text-[16px]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="h-10 px-4 rounded-xl bg-[#30371A] hover:bg-[#3D4721] border border-[#525E31] text-xs font-mono text-[#D8DFC8] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
