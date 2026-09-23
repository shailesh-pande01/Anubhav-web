import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { AvatarImage } from '../../components/common/AvatarImage';
import { CalmTextField } from '../../components/common/CalmTextField';
import { CalmLoadingIndicator } from '../../components/common/CalmLoadingIndicator';
import { CalmEmptyState } from '../../components/common/CalmEmptyState';
import { adminService } from '../../services/adminService';
import type { AdminUserSummary, AccountStatus } from '../../types/models';

interface AdminUsersPageProps {
  onBack: () => void;
  onUserClick: (userId: string) => void;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({
  onBack,
  onUserClick
}) => {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await adminService.getUsers(
        searchQuery.trim() || undefined,
        selectedStatus !== 'ALL' ? (selectedStatus as AccountStatus) : undefined
      );
      setUsers(fetched);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

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

  const statusFilters = ['ALL', 'ACTIVE', 'RESTRICTED', 'SUSPENDED', 'BANNED'];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
      <CalmTopBar
        title="Users"
        subtitle="User Moderation & Status"
        onBack={onBack}
      />

      <main className="flex-1 w-full max-w-[620px] mx-auto pb-24">
        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <CalmTextField
            value={searchQuery}
            onChange={(val: string) => setSearchQuery(val)}
            placeholder="Search by username or name..."
            trailingIcon={<Search size={18} className="text-[var(--calm-text-tertiary)]" />}
          />
        </div>

        {/* Filter Chips */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none border-b border-[var(--calm-border-subtle)]">
          {statusFilters.map((status) => {
            const isSelected = selectedStatus === status;
            const label = status.charAt(0) + status.slice(1).toLowerCase();
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
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

        {/* User list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <CalmLoadingIndicator />
          </div>
        ) : users.length === 0 ? (
          <div className="pt-16">
            <CalmEmptyState
              title="No users found"
              subtitle={searchQuery ? `No users matching '${searchQuery}'.` : 'No users in this category.'}
            />
          </div>
        ) : (
          <div className="p-4 space-y-2.5">
            {users.map((item) => (
              <div
                key={item.profile.id}
                onClick={() => onUserClick(item.profile.id)}
                className="p-3.5 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)] hover:bg-[var(--calm-surface-variant)]/40 transition-colors cursor-pointer flex items-center gap-3.5"
              >
                <AvatarImage
                  imageUrl={item.profile.profileImageUrl}
                  name={item.profile.displayName}
                  size={46}
                />

                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-[var(--calm-text-primary)] truncate">
                    {item.profile.displayName}
                  </h3>
                  <p className="text-[13px] text-[var(--calm-text-secondary)] truncate">
                    @{item.profile.username}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--calm-text-tertiary)]">
                    <span>{item.postCount} posts</span>
                    {item.reportsReceivedCount > 0 && (
                      <span className="font-bold text-red-500">
                        {item.reportsReceivedCount} reports
                      </span>
                    )}
                  </div>
                </div>

                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${getStatusBadge(item.profile.accountStatus)}`}>
                  {item.profile.accountStatus}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
