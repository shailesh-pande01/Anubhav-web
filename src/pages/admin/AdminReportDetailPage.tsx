import React, { useState, useEffect, useCallback } from 'react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { AvatarImage } from '../../components/common/AvatarImage';
import { CalmButton } from '../../components/common/CalmButton';
import { CalmOutlinedButton } from '../../components/common/CalmOutlinedButton';
import { CalmLoadingIndicator } from '../../components/common/CalmLoadingIndicator';
import { CalmTextField } from '../../components/common/CalmTextField';
import { adminService } from '../../services/adminService';
import { reportService } from '../../services/reportService';
import type { ReportWithDetails, AdminUserDetail } from '../../types/models';
import { useAuth } from '../../context/AuthContext';

interface AdminReportDetailPageProps {
  reportId: string;
  onBack: () => void;
}

export const AdminReportDetailPage: React.FC<AdminReportDetailPageProps> = ({
  reportId,
  onBack
}) => {
  const { user } = useAuth();
  const [report, setReport] = useState<ReportWithDetails | null>(null);
  const [reportedUserDetail, setReportedUserDetail] = useState<AdminUserDetail | null>(null);
  const [previousReportsCount, setPreviousReportsCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [activeDialog, setActiveDialog] = useState<
    'dismiss' | 'removePost' | 'warn' | 'restrict' | 'suspend' | 'ban' | null
  >(null);
  const [actionReason, setActionReason] = useState('');
  const [selectedDurationDays, setSelectedDurationDays] = useState(7);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getReportDetail(reportId);
      if (!data) {
        setError('Report not found');
        return;
      }
      setReport(data);

      // Load reported user detail and post context
      if (data.reportedUserId) {
        const uDetail = await adminService.getUserDetail(data.reportedUserId);
        setReportedUserDetail(uDetail);
      }

      if (data.postId) {
        const count = await adminService.getReportsCountForPost(data.postId);
        setPreviousReportsCount(count);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading report');
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExecuteAction = async () => {
    if (!user || !report) return;
    setIsActionLoading(true);

    try {
      if (activeDialog === 'dismiss') {
        await reportService.updateReportStatus(report.id, 'DISMISSED', user.id, actionReason);
        await adminService.logModerationAction({
          action: 'REPORT_DISMISSED',
          adminId: user.id,
          targetPostId: report.postId,
          targetUserId: report.reportedUserId,
          reason: actionReason || 'Report dismissed'
        });
        setActionSuccessMessage('Report dismissed.');
      } else if (activeDialog === 'removePost' && report.postId) {
        await adminService.removePost(
          report.postId,
          report.reportedUserId || undefined,
          actionReason,
          user.id,
          report.post?.imagePath || undefined
        );
        setActionSuccessMessage('Post successfully removed and media pruned.');
      } else if (activeDialog === 'warn') {
        if (!report.reportedUserId) throw new Error('Reported user not found.');
        await adminService.warnUser(report.reportedUserId, actionReason, user.id);
        setActionSuccessMessage('Formal warning issued to user.');
      } else if (activeDialog === 'restrict') {
        if (!report.reportedUserId) throw new Error('Reported user not found.');
        await adminService.restrictUser(report.reportedUserId, selectedDurationDays, actionReason, user.id);
        setActionSuccessMessage(`User restricted for ${selectedDurationDays} days.`);
      } else if (activeDialog === 'suspend') {
        if (!report.reportedUserId) throw new Error('Reported user not found.');
        await adminService.suspendUser(report.reportedUserId, selectedDurationDays, actionReason, user.id);
        setActionSuccessMessage(`User suspended for ${selectedDurationDays} days.`);
      } else if (activeDialog === 'ban') {
        if (!report.reportedUserId) throw new Error('Reported user not found.');
        await adminService.banUser(report.reportedUserId, actionReason, user.id);
        setActionSuccessMessage('User permanently banned from Anubhav.');
      }

      setActiveDialog(null);
      setActionReason('');
      await loadReport();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
        <CalmTopBar title="Review Report" onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <CalmLoadingIndicator />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
        <CalmTopBar title="Review Report" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-[14px] text-[var(--calm-text-secondary)] mb-4">{error || 'Report not found'}</p>
          <div className="w-[140px]">
            <CalmButton text="Go Back" onClick={onBack} />
          </div>
        </div>
      </div>
    );
  }

  const post = report.post;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
      <CalmTopBar
        title="Review Report"
        subtitle={`Report #${report.id.slice(0, 8).toUpperCase()}`}
        onBack={onBack}
      />

      <main className="flex-1 w-full max-w-[620px] mx-auto px-5 py-4 pb-28 space-y-5">
        {/* Section 1: Report Information Card */}
        <div className="p-4 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-semibold text-red-500">
              Reason: {report.reason}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-500/15 text-red-500">
              {report.status}
            </span>
          </div>

          {report.description && (
            <div className="mt-2.5">
              <p className="text-[12px] font-medium text-[var(--calm-text-secondary)]">Description:</p>
              <p className="text-[14px] text-[var(--calm-text-primary)] mt-0.5">{report.description}</p>
            </div>
          )}

          {report.resolution && (
            <div className="mt-2.5">
              <p className="text-[12px] font-medium text-[var(--calm-text-secondary)]">Resolution:</p>
              <p className="text-[13px] text-[var(--calm-text-secondary)] mt-0.5">{report.resolution}</p>
            </div>
          )}

          <p className="text-[11px] text-[var(--calm-text-tertiary)] mt-3">
            Reported {report.relativeTime}
          </p>
        </div>

        {/* Section 2: Reported Post Content */}
        <div>
          <h3 className="text-[14px] font-semibold text-[var(--calm-text-primary)] mb-2">
            Reported Content
          </h3>
          <div className="p-4 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)]">
            {post ? (
              <div>
                {post.imageUrl && (
                  <div className="mb-3 rounded-lg overflow-hidden bg-[var(--calm-surface-variant)]">
                    <img
                      src={post.imageUrl}
                      alt="Reported content"
                      className="w-full max-h-[260px] object-cover"
                    />
                  </div>
                )}

                {post.content && (
                  <p className="text-[14px] text-[var(--calm-text-primary)] mb-2">
                    {post.content}
                  </p>
                )}

                <p className="text-[12px] text-[var(--calm-text-tertiary)]">
                  Posted {post.relativeTime} by @{post.author.username}
                </p>

                {post.isRemoved && (
                  <p className="mt-2 text-[12px] text-red-500 font-medium">
                    ⚠️ This post has already been removed ({post.removalReason || 'Removed'})
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[14px] text-[var(--calm-text-secondary)]">
                Post no longer exists or was deleted by the author.
              </p>
            )}
          </div>
        </div>

        {/* Section 3: Reported User & Reporter */}
        <div className="grid grid-cols-2 gap-3">
          {/* Reported User */}
          <div className="p-3.5 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)]">
            <p className="text-[11px] font-bold text-red-500 mb-2">Reported User</p>
            <AvatarImage
              imageUrl={report.reportedUser?.profileImageUrl}
              name={report.reportedUser?.displayName || 'User'}
              size={44}
            />
            <p className="text-[14px] font-medium text-[var(--calm-text-primary)] mt-1.5 leading-tight">
              {report.reportedUser?.displayName}
            </p>
            <p className="text-[12px] text-[var(--calm-text-secondary)]">
              @{report.reportedUser?.username}
            </p>
            <p className="text-[11px] font-bold text-[var(--calm-text-primary)] mt-2">
              Status: {report.reportedUser?.accountStatus || 'ACTIVE'}
            </p>
            {reportedUserDetail && (
              <div className="text-[11px] text-[var(--calm-text-secondary)] mt-1 space-y-0.5">
                <p>Reports: {reportedUserDetail.reportsReceivedCount}</p>
                <p>Warnings: {reportedUserDetail.warningsCount}</p>
              </div>
            )}
          </div>

          {/* Reporter */}
          <div className="p-3.5 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)]">
            <p className="text-[11px] font-bold text-[var(--calm-text-secondary)] mb-2">Reporter</p>
            <AvatarImage
              imageUrl={report.reporter?.profileImageUrl}
              name={report.reporter?.displayName || 'Reporter'}
              size={44}
            />
            <p className="text-[14px] font-medium text-[var(--calm-text-primary)] mt-1.5 leading-tight">
              {report.reporter?.displayName}
            </p>
            <p className="text-[12px] text-[var(--calm-text-secondary)]">
              @{report.reporter?.username}
            </p>
          </div>
        </div>

        {/* Context */}
        {previousReportsCount > 1 && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[13px] font-medium">
            🚨 Context: This post has received {previousReportsCount} reports
          </div>
        )}

        <div className="border-b border-[var(--calm-border-subtle)]" />

        {/* Section 5: Moderation Action Buttons */}
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--calm-text-primary)] mb-3">
            Moderation Actions
          </h3>

          <div className="space-y-2.5">
            <CalmOutlinedButton
              text="Dismiss Report"
              onClick={() => {
                setActionReason('');
                setActiveDialog('dismiss');
              }}
            />

            {post && !post.isRemoved && (
              <CalmButton
                text="Remove Post"
                onClick={() => {
                  setActionReason('');
                  setActiveDialog('removePost');
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
              text="Restrict User..."
              onClick={() => {
                setActionReason('');
                setSelectedDurationDays(7);
                setActiveDialog('restrict');
              }}
            />

            <CalmOutlinedButton
              text="Suspend User..."
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
      </main>

      {/* Action Dialog */}
      {activeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-[420px] rounded-2xl bg-[var(--calm-surface)] p-6 shadow-xl border border-[var(--calm-border-subtle)] animate-in fade-in zoom-in-95">
            <h3 className="text-[17px] font-semibold text-[var(--calm-text-primary)] mb-2">
              {activeDialog === 'dismiss' && 'Dismiss Report?'}
              {activeDialog === 'removePost' && 'Remove Post?'}
              {activeDialog === 'warn' && 'Warn User?'}
              {activeDialog === 'restrict' && 'Restrict User'}
              {activeDialog === 'suspend' && 'Suspend User'}
              {activeDialog === 'ban' && 'Permanently Ban User?'}
            </h3>

            <p className="text-[14px] text-[var(--calm-text-secondary)] mb-4">
              {activeDialog === 'dismiss' && 'This report will be marked as dismissed.'}
              {activeDialog === 'removePost' && 'This post will be permanently removed and media pruned.'}
              {activeDialog === 'warn' && 'A formal warning will be logged on the user account.'}
              {activeDialog === 'restrict' && 'User cannot post or like while restricted.'}
              {activeDialog === 'suspend' && 'User will be locked out of Anubhav until suspension expires.'}
              {activeDialog === 'ban' && 'User will be permanently banned from the community.'}
            </p>

            {/* Duration selector for restrict / suspend */}
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
                onChange={setActionReason}
                placeholder="Specify rationale for audit history..."
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
                  activeDialog === 'dismiss' ? 'bg-[var(--calm-primary)]' : 'bg-red-500 hover:bg-red-600'
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
