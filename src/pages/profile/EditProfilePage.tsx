import React, { useState, useEffect, useRef } from 'react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { AvatarImage } from '../../components/common/AvatarImage';
import { CalmTextField } from '../../components/common/CalmTextField';
import { CalmButton } from '../../components/common/CalmButton';
import { CalmOutlinedButton } from '../../components/common/CalmOutlinedButton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { authService } from '../../services/authService';
import { compressAvatarImage } from '../../utils/imageCompressor';

interface EditProfilePageProps {
  onBack: () => void;
  onProfileSaved: () => void;
  onAccountDeleted: () => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({
  onBack,
  onProfileSaved,
  onAccountDeleted
}) => {
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [currentlyWorkingOn, setCurrentlyWorkingOn] = useState(profile?.currentlyWorkingOn || '');
  const [thingsIveDone, setThingsIveDone] = useState(profile?.thingsIveDone || '');
  const [bio, setBio] = useState(profile?.bio || '');

  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setUsername(profile.username || '');
      setLocation(profile.location || '');
      setCurrentlyWorkingOn(profile.currentlyWorkingOn || '');
      setThingsIveDone(profile.thingsIveDone || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const compressedBlob = await compressAvatarImage(file);
      const compressedFile = new File([compressedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      setPendingAvatarFile(compressedFile);
      setAvatarPreviewUrl(URL.createObjectURL(compressedBlob));
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error compressing avatar');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!displayName.trim()) {
      setSaveError('Display name is required');
      return;
    }

    if (!username.trim()) {
      setSaveError('Username is required');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // 1. Check username availability if changed
      if (username.trim().toLowerCase() !== profile?.username?.toLowerCase()) {
        const isAvailable = await profileService.isUsernameAvailable(username.trim(), user.id);
        if (!isAvailable) {
          setSaveError('This username is already taken. Please choose another.');
          setIsSaving(false);
          return;
        }
      }

      // 2. Upload avatar if selected
      let profileImageUrl = profile?.profileImageUrl || null;
      if (pendingAvatarFile) {
        profileImageUrl = await profileService.uploadAvatar(user.id, pendingAvatarFile);
      }

      // 3. Save profile
      await profileService.saveProfile({
        id: user.id,
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        location: location.trim(),
        currentlyWorkingOn: currentlyWorkingOn.trim(),
        thingsIveDone: thingsIveDone.trim(),
        profileImageUrl
      });

      await refreshProfile();
      onProfileSaved();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile changes');
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      await authService.deleteAccount();
      setShowDeleteAccountDialog(false);
      onAccountDeleted();
    } catch (err: unknown) {
      setDeleteAccountError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
      <CalmTopBar title="Edit Profile" onBack={onBack} />

      <main className="flex-1 w-full max-w-[640px] mx-auto px-4 md:px-6 py-4 md:py-8 pb-24">
        <div className="w-full md:p-8 md:rounded-2xl md:border md:border-[var(--calm-border-subtle)] md:bg-[var(--calm-surface)] md:shadow-2xs transition-colors">
          <form onSubmit={handleSave} className="flex flex-col items-center">
          {/* Avatar editor */}
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarSelect}
            accept="image/*"
            className="hidden"
          />

          <div
            onClick={() => avatarInputRef.current?.click()}
            className="cursor-pointer group flex flex-col items-center"
          >
            <div className="relative">
              <AvatarImage
                imageUrl={avatarPreviewUrl || profile?.profileImageUrl}
                name={displayName || 'User'}
                size={84}
              />
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="mt-2 text-[13px] text-[var(--calm-text-secondary)] hover:text-[var(--calm-text-primary)] transition-colors"
            >
              Change photo
            </button>
          </div>

          <div className="w-full mt-4 space-y-3.5">
            <CalmTextField
              label="Display Name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Enter your name"
              required
            />

            <CalmTextField
              label="Username"
              value={username}
              onChange={(val) => {
                setUsername(val.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
              }}
              placeholder="Choose a username"
              required
            />

            <CalmTextField
              label="Location"
              value={location}
              onChange={setLocation}
              placeholder="Enter your location"
            />

            <CalmTextField
              label="Currently working on"
              value={currentlyWorkingOn}
              onChange={setCurrentlyWorkingOn}
              placeholder="e.g. Learning pottery, writing a book..."
            />

            <CalmTextField
              label="Things I've done"
              value={thingsIveDone}
              onChange={setThingsIveDone}
              placeholder="e.g. Ran a marathon, learned guitar, built a bookshelf..."
              multiline
              rows={3}
            />

            <CalmTextField
              label="Bio"
              value={bio}
              onChange={setBio}
              placeholder="A brief bio about yourself..."
              multiline
              rows={2}
            />
          </div>

          {saveError && (
            <div className="w-full mt-3.5 text-[13px] text-red-500 font-medium">
              {saveError}
            </div>
          )}

          <div className="w-full mt-7">
            <CalmButton
              text="Save"
              type="submit"
              isLoading={isSaving}
              disabled={isSaving || isDeletingAccount}
            />
          </div>

          <div className="w-full my-8 border-b border-[var(--calm-border-subtle)]" />

          {/* Account Deletion Section */}
          <div className="w-full flex flex-col items-start">
            <h3 className="text-[14px] font-semibold text-[var(--calm-text-primary)]">
              Account
            </h3>
            <p className="text-[13px] text-[var(--calm-text-secondary)] mt-1 mb-3.5">
              Permanently delete your account and all associated data.
            </p>

            <CalmOutlinedButton
              text="Delete Account"
              onClick={() => setShowDeleteAccountDialog(true)}
              disabled={isSaving || isDeletingAccount}
            />
          </div>
        </form>
        </div>
      </main>

      {/* Delete Account Dialog */}
      <ConfirmDialog
        isOpen={showDeleteAccountDialog}
        title="Delete account?"
        message="This will permanently delete your account, profile, posts, and associated data. This action cannot be undone."
        confirmLabel={isDeletingAccount ? "Deleting..." : "Delete account"}
        cancelLabel="Cancel"
        isDestructive
        isLoading={isDeletingAccount}
        onConfirm={handleDeleteAccount}
        onCancel={() => {
          if (!isDeletingAccount) {
            setShowDeleteAccountDialog(false);
            setDeleteAccountError(null);
          }
        }}
      />

      {deleteAccountError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[13px] px-4 py-2 rounded-lg shadow-lg z-50">
          {deleteAccountError}
        </div>
      )}
    </div>
  );
};
