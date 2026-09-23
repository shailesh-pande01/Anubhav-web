import React, { useState, useEffect, useCallback } from 'react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { CalmLoadingIndicator } from '../../components/common/CalmLoadingIndicator';
import { CalmEmptyState } from '../../components/common/CalmEmptyState';
import { adminService } from '../../services/adminService';
import type { ModerationAction, ModerationActionType } from '../../types/models';

interface AdminAuditLogsPageProps {
  onBack: () => void;
}

export const AdminAuditLogsPage: React.FC<AdminAuditLogsPageProps> = ({ onBack }) => {
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadActions = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await adminService.getModerationHistory(
        selectedActionFilter !== 'ALL' ? (selectedActionFilter as ModerationActionType) : undefined
      );
      setActions(fetched);
    } catch (err) {
      console.error('Error fetching audit log:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedActionFilter]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const getActionBadge = (action: ModerationActionType) => {
    switch (action) {
      case 'WARNING':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
      case 'POST_REMOVED':
      case 'USER_SUSPENDED':
        return 'bg-red-500/15 text-red-500';
      case 'USER_RESTRICTED':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
      case 'USER_BANNED':
        return 'bg-neutral-800 text-white dark:bg-neutral-700';
      case 'REPORT_DISMISSED':
        return 'bg-[var(--calm-surface-variant)] text-[var(--calm-text-secondary)]';
      case 'STATUS_RESET':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
    }
  };

  const getActionLabel = (action: ModerationActionType) => {
    switch (action) {
      case 'WARNING':
        return 'Warning';
      case 'POST_REMOVED':
        return 'Post Removed';
      case 'USER_RESTRICTED':
        return 'User Restricted';
      case 'USER_SUSPENDED':
        return 'User Suspended';
      case 'USER_BANNED':
        return 'User Banned';
      case 'REPORT_DISMISSED':
        return 'Report Dismissed';
      case 'STATUS_RESET':
        return 'Status Reset';
    }
  };

  const actionFilters = [
    { key: 'ALL', label: 'All Actions' },
    { key: 'WARNING', label: 'Warnings' },
    { key: 'POST_REMOVED', label: 'Posts Removed' },
    { key: 'USER_RESTRICTED', label: 'Restricted' },
    { key: 'USER_SUSPENDED', label: 'Suspended' },
    { key: 'USER_BANNED', label: 'Banned' },
    { key: 'REPORT_DISMISSED', label: 'Dismissed' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
      <CalmTopBar
        title="Audit Log"
        subtitle="Moderation History"
        onBack={onBack}
      />

      <main className="flex-1 w-full max-w-[620px] mx-auto pb-24">
        {/* Action Filters */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none border-b border-[var(--calm-border-subtle)]">
          {actionFilters.map(({ key, label }) => {
            const isSelected = selectedActionFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedActionFilter(key)}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-[var(--calm-primary)] text-[var(--calm-text-inverted)]'
                    : 'bg-[var(--calm-surface-variant)] text-[var(--calm-text-secondary)] hover:text-[var(--calm-text-primary)]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <CalmLoadingIndicator />
          </div>
        ) : actions.length === 0 ? (
          <div className="pt-16">
            <CalmEmptyState
              title="No audit records found"
              subtitle="Administrative actions will appear here."
            />
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {actions.map((action) => (
              <div
                key={action.id}
                className="p-3.5 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${getActionBadge(action.action)}`}>
                    {getActionLabel(action.action)}
                  </span>
                  <span className="text-[11px] text-[var(--calm-text-tertiary)]">
                    {action.relativeTime}
                  </span>
                </div>

                <div className="text-[13px] text-[var(--calm-text-secondary)] mb-1">
                  <span>Admin: </span>
                  <span className="font-semibold text-[var(--calm-text-primary)]">
                    {action.adminDisplayName || 'Admin'}
                  </span>
                  {action.targetUserDisplayName && (
                    <>
                      <span className="mx-2">•</span>
                      <span>Target: </span>
                      <span className="font-semibold text-[var(--calm-text-primary)]">
                        {action.targetUserDisplayName}
                      </span>
                    </>
                  )}
                </div>

                {action.reason && (
                  <p className="text-[13px] text-[var(--calm-text-primary)] mt-1">
                    Reason: {action.reason}
                  </p>
                )}

                {action.durationUntil && (
                  <p className="text-[11px] text-[var(--calm-text-tertiary)] mt-1.5">
                    Until: {action.durationUntil.slice(0, 10)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
