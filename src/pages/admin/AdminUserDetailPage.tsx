import React, { useState, useEffect, useCallback } from 'react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { AvatarImage } from '../../components/common/AvatarImage';
import { CalmButton } from '../../components/common/CalmButton';
import { CalmOutlinedButton } from '../../components/common/CalmOutlinedButton';
import { CalmLoadingIndicator } from '../../components/common/CalmLoadingIndicator';
import { CalmTextField } from '../../components/common/CalmTextField';
import { adminService } from '../../services/adminService';
import type { AdminUserDetail, AccountStatus } from '../../types/models';
import { useAuth } from '../../context/AuthContext';

interface AdminUserDetailPageProps {
  userId: string;
  onBack: () => void;
}

export const AdminUserDetailPage: React.FC<AdminUserDetailPageProps> = ({
  userId,
  onBack
}) => {
  const { user } = useAuth();
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [activeDialog, setActiveDialog] = useState<
    'reset' | 'warn' | 'restrict' | 'suspend' | 'ban' | null
  >(null);
  const [actionReason, setActionReason] = useState('');
  const [selectedDurationDays, setSelectedDurationDays] = useState(7);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getUserDetail(userId);
      if (!data) {
        setError('User not found');
        return;
      }
      setUserDetail(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading user detail');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleExecuteAction = async () => {
    if (!user || !userDetail) return;
    setIsActionLoading(true);

    try {
      if (activeDialog === 'reset') {
        await adminService.resetUserStatus(userId, actionReason, user.id);
        setActionSuccessMessage('User status reset to Active.');
      } else if (activeDialog === 'warn') {
        await adminService.warnUser(userId, actionReason, user.id);
        setActionSuccessMessage('Warning issued to user.');
      } else if (activeDialog === 'restrict') {
        await adminService.restrictUser(userId, selectedDurationDays, actionReason, user.id);
        setActionSuccessMessage(`User restricted for ${selectedDurationDays} days.`);
      } else if (activeDialog === 'suspend') {
        await adminService.suspendUser(userId, selectedDurationDays, actionReason, user.id);
        setActionSuccessMessage(`User suspended for ${selectedDurationDays} days.`);
      } else if (activeDialog === 'ban') {
        await adminService.banUser(userId, actionReason, user.id);
        setActionSuccessMessage('User permanently banned.');
      }

      setActiveDialog(null);
      setActionReason('');
      await loadUser();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
      case 'RESTRICTED':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
      case 'SUSPENDED':
        return 'bg-red-500/15 text-red-500';
      case 'BANNED':
        return 'bg-neutral-800 text-white dark:bg-neutral-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
        <CalmTopBar title="User Moderation" onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <CalmLoadingIndicator />
        </div>
      </div>
    );
  }

  if (error || !userDetail) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
        <CalmTopBar title="User Moderation" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-[14px] text-[var(--calm-text-secondary)] mb-4">{error || 'User not found'}</p>
          <div className="w-[140px]">
            <CalmButton text="Go Back" onClick={onBack} />
          </div>
        </div>
      </div>
    );
  }

  const profile = userDetail.profile;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
      <CalmTopBar
        title="User Moderation"
        subtitle={`@${profile.username}`}
        onBack={onBack}
      />

      <main className="flex-1 w-full max-w-[620px] mx-auto px-5 py-4 pb-28 space-y-6">
        {/* Section 1: User Profile Header */}
        <div>
          <div className="flex items-center gap-4">
            <AvatarImage
              imageUrl={profile.profileImageUrl}
              name={profile.displayName}
              size={64}
            />

            <div>
              <h2 className="text-[20px] font-semibold text-[var(--calm-text-primary)] leading-tight">
                {profile.displayName}
              </h2>
              <p className="text-[14px] text-[var(--calm-text-secondary)] mb-1.5">
                @{profile.username}
              </p>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${getStatusBadge(profile.accountStatus)}`}>
                {profile.accountStatus}
              </span>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-3.5 text-[14px] text-[var(--calm-text-primary)] leading-[22px]">
              {profile.bio}
            </p>
          )}
        </div>

        <div className="border-b border-[var(--calm-border-subtle)]" />

        {/* Section 2: Account Statistics */}
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--calm-text-primary)] mb-3">
            Account Statistics
          </h3>

          <div className="grid grid-cols-3 gap-2.5 mb-2.5">
            <div className="p-3 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface-variant)]/30">
              <p className="text-[11px] text-[var(--calm-text-secondary)]">Posts</p>
              <p className="text-[18px] font-semibold text-[var(--calm-text-primary)] mt-0.5">
                {userDetail.postCount}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface-variant)]/30">
              <p className="text-[11px] text-[var(--calm-text-secondary)]">Reports Recv.</p>
              <p className={`text-[18px] font-semibold mt-0.5 ${userDetail.reportsReceivedCount > 0 ? 'text-red-500' : 'text-[var(--calm-text-primary)]'}`}>
                {userDetail.reportsReceivedCount}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface-variant)]/30">
              <p className="text-[11px] text-[var(--calm-text-secondary)]">Warnings</p>
              <p className={`text-[18px] font-semibold mt-0.5 ${userDetail.warningsCount > 0 ? 'text-red-500' : 'text-[var(--calm-text-primary)]'}`}>
                {userDetail.warningsCount}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface-variant)]/30">
              <p className="text-[11px] text-[var(--calm-text-secondary)]">Removed Posts</p>
              <p className="text-[18px] font-semibold text-[var(--calm-text-primary)] mt-0.5">
                {userDetail.removedPostsCount}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface-variant)]/30">
              <p className="text-[11px] text-[var(--calm-text-secondary)]">Suspensions</p>
              <p className="text-[18px] font-semibold text-[var(--calm-text-primary)] mt-0.5">
                {userDetail.suspensionsCount}
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-[var(--calm-border-subtle)]" />

        {/* Section 3: Direct Actions */}
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--calm-text-primary)] mb-3">
            Actions
          </h3>

          <div className="space-y-2.5">
            {profile.accountStatus !== 'ACTIVE' && (
              <CalmButton
                text="Reset Status to Active (Unban / Unsuspend)"
                onClick={() => {
                  setActionReason('');
                  setActiveDialog('reset');
                }}
              />
            )}

            <CalmOutlinedButton
              text="Warn User"
              onClick={() => {
                setActionReason('');
                setActiveDialog('warn');
              }}
            />

            <CalmOutlinedButton
              text="Restrict User (Temporary)..."
              onClick={() => {
                setActionReason('');
                setSelectedDurationDays(7);
                setActiveDialog('restrict');
              }}
            />

            <CalmOutlinedButton
              text="Suspend User (Temporary)..."
              onClick={() => {
                setActionReason('');
                setSelectedDurationDays(7);
                setActiveDialog('suspend');
              }}
            />

            <CalmButton
              text="Permanently Ban User"
              onClick={() => {
                setActionReason('');
                setActiveDialog('ban');
              }}
            />
          </div>
        </div>

        {/* Section 4: Moderation Audit History */}
        {userDetail.moderationHistory.length > 0 && (
          <div>
            <div className="border-b border-[var(--calm-border-subtle)] mb-5" />

            <h3 className="text-[15px] font-semibold text-[var(--calm-text-primary)] mb-3">
              Moderation History
            </h3>

            <div className="space-y-2.5">
              {userDetail.moderationHistory.map((action) => (
                <div
                  key={action.id}
                  className="p-3.5 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-red-500">
                      {action.action}
                    </span>
                    <span className="text-[11px] text-[var(--calm-text-tertiary)]">
                      {action.createdAt.slice(0, 10)}
                    </span>
                  </div>

                  {action.reason && (
                    <p className="text-[13px] text-[var(--calm-text-primary)]">
                      {action.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Action Dialog */}
      {activeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-[420px] rounded-2xl bg-[var(--calm-surface)] p-6 shadow-xl border border-[var(--calm-border-subtle)] animate-in fade-in zoom-in-95">
            <h3 className="text-[17px] font-semibold text-[var(--calm-text-primary)] mb-2">
              {activeDialog === 'reset' && 'Reset to Active?'}
              {activeDialog === 'warn' && 'Warn User?'}
              {activeDialog === 'restrict' && 'Restrict User'}
              {activeDialog === 'suspend' && 'Suspend User'}
              {activeDialog === 'ban' && 'Permanently Ban User?'}
            </h3>

            <p className="text-[14px] text-[var(--calm-text-secondary)] mb-4">
              {activeDialog === 'reset' && 'Remove any active suspension or ban and restore normal access.'}
              {activeDialog === 'warn' && 'A formal warning will be logged for this user.'}
              {activeDialog === 'restrict' && 'User cannot post or like while restricted.'}
              {activeDialog === 'suspend' && 'User will be locked out of Anubhav until suspension ends.'}
              {activeDialog === 'ban' && 'User will be permanently banned from Anubhav.'}
            </p>

            {(activeDialog === 'restrict' || activeDialog === 'suspend') && (
              <div className="mb-4">
                <label className="block text-[12px] font-medium text-[var(--calm-text-secondary)] mb-1.5">
                  Duration:
                </label>
                <div className="flex gap-2">
                  {[1, 7, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSelectedDurationDays(days)}
                      className={`flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                        selectedDurationDays === days
                          ? 'bg-[var(--calm-primary)] text-[var(--calm-text-inverted)]'
                          : 'bg-[var(--calm-surface-variant)] text-[var(--calm-text-secondary)]'
                      }`}
                    >
                      {days} {days === 1 ? 'day' : 'days'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-5">
              <CalmTextField
                label="Reason (optional)"
                value={actionReason}
                onChange={(val: string) => setActionReason(val)}
                placeholder="Specify rationale..."
                multiline
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveDialog(null)}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-xl text-[14px] text-[var(--calm-text-secondary)] hover:text-[var(--calm-text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isActionLoading}
                className={`px-4 py-2 rounded-xl text-[14px] font-semibold text-white transition-opacity ${
                  activeDialog === 'reset' ? 'bg-[var(--calm-primary)]' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isActionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {actionSuccessMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--calm-primary)] text-[var(--calm-text-inverted)] text-[13px] px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center gap-3">
          <span>{actionSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-xs font-bold underline"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
};
