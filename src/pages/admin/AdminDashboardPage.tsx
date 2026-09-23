import React, { useState, useEffect, useCallback } from 'react';
import { Flag, Users, FileText, History, AlertTriangle, ShieldAlert } from 'lucide-react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { CalmButton } from '../../components/common/CalmButton';
import { CalmLoadingIndicator } from '../../components/common/CalmLoadingIndicator';
import { adminService } from '../../services/adminService';
import type { AdminDashboardStats, HighAttentionPost } from '../../types/models';
import { useAuth } from '../../context/AuthContext';

interface AdminDashboardPageProps {
  onBack: () => void;
  onNavigateToReports: () => void;
  onNavigateToUsers: () => void;
  onNavigateToPosts: () => void;
  onNavigateToHistory: () => void;
  onReviewReport?: (reportId: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onBack,
  onNavigateToReports,
  onNavigateToUsers,
  onNavigateToPosts,
  onNavigateToHistory
}) => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [highAttentionPosts, setHighAttentionPosts] = useState<HighAttentionPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedStats, fetchedHighAttention] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getHighAttentionPosts()
      ]);
      setStats(fetchedStats);
      setHighAttentionPosts(fetchedHighAttention);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadDashboard();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin, loadDashboard]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
        <CalmTopBar title="Admin Dashboard" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert size={48} className="text-red-500 mb-4" />
          <h2 className="text-[18px] font-semibold text-[var(--calm-text-primary)] mb-2">
            Access Denied
          </h2>
          <p className="text-[14px] text-[var(--calm-text-secondary)] mb-6 max-w-sm">
            Administrator privileges are required to view this page.
          </p>
          <div className="w-[160px]">
            <CalmButton text="Go Back" onClick={onBack} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
      <CalmTopBar
        title="Admin Dashboard"
        subtitle="Moderation & Governance"
        onBack={onBack}
      />

      <main className="flex-1 w-full max-w-[620px] mx-auto px-5 py-4 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <CalmLoadingIndicator />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-[14px] text-red-500 mb-4">{error}</p>
            <div className="w-[140px] mx-auto">
              <CalmButton text="Retry" onClick={loadDashboard} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section 1: Metrics Overview */}
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--calm-text-primary)] mb-3">
                Overview
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface-variant)]/40">
                  <p className="text-[12px] text-[var(--calm-text-secondary)] mb-1">
                    Total Users
                  </p>
                  <p className="text-[22px] font-semibold text-[var(--calm-text-primary)]">
                    {stats?.totalUsers ?? 0}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface-variant)]/40">
                  <p className="text-[12px] text-[var(--calm-text-secondary)] mb-1">
                    Total Posts
                  </p>
                  <p className="text-[22px] font-semibold text-[var(--calm-text-primary)]">
                    {stats?.totalPosts ?? 0}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface-variant)]/40">
                  <p className="text-[12px] text-[var(--calm-text-secondary)] mb-1">
                    Pending Reports
                  </p>
                  <p
                    className={`text-[22px] font-semibold ${
                      (stats?.pendingReports ?? 0) > 0 ? 'text-red-500' : 'text-[var(--calm-text-primary)]'
                    }`}
                  >
                    {stats?.pendingReports ?? 0}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface-variant)]/40">
                  <p className="text-[12px] text-[var(--calm-text-secondary)] mb-1">
                    Blocked / Restricted
                  </p>
                  <p className="text-[22px] font-semibold text-[var(--calm-text-primary)]">
                    {(stats?.bannedUsers ?? 0) + (stats?.restrictedUsers ?? 0) + (stats?.suspendedUsers ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-[var(--calm-border-subtle)]" />

            {/* Section 2: Management Navigation Shortcuts */}
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--calm-text-primary)] mb-3">
                Management
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onNavigateToReports}
                  className="p-4 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)] hover:bg-[var(--calm-surface-variant)] transition-colors flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <Flag size={20} className="text-[var(--calm-primary)]" />
                    <span className="text-[15px] font-medium text-[var(--calm-text-primary)]">
                      Reports
                    </span>
                  </div>
                  {(stats?.pendingReports ?? 0) > 0 && (
                    <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {stats?.pendingReports}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onNavigateToUsers}
                  className="p-4 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)] hover:bg-[var(--calm-surface-variant)] transition-colors flex items-center gap-3 text-left"
                >
                  <Users size={20} className="text-[var(--calm-primary)]" />
                  <span className="text-[15px] font-medium text-[var(--calm-text-primary)]">
                    Users
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToPosts}
                  className="p-4 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)] hover:bg-[var(--calm-surface-variant)] transition-colors flex items-center gap-3 text-left"
                >
                  <FileText size={20} className="text-[var(--calm-primary)]" />
                  <span className="text-[15px] font-medium text-[var(--calm-text-primary)]">
                    Posts
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToHistory}
                  className="p-4 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)] hover:bg-[var(--calm-surface-variant)] transition-colors flex items-center gap-3 text-left"
                >
                  <History size={20} className="text-[var(--calm-primary)]" />
                  <span className="text-[15px] font-medium text-[var(--calm-text-primary)]">
                    Moderation Log
                  </span>
                </button>
              </div>
            </div>

            {/* Section 3: Needs Attention */}
            {((stats?.pendingReports ?? 0) > 0 || highAttentionPosts.length > 0) && (
              <div>
                <div className="border-b border-[var(--calm-border-subtle)] mb-5" />

                <div className="flex items-center gap-2 mb-3 text-red-500">
                  <AlertTriangle size={18} />
                  <h2 className="text-[15px] font-semibold text-[var(--calm-text-primary)]">
                    Needs Attention
                  </h2>
                </div>

                {highAttentionPosts.length > 0 ? (
                  <div className="space-y-3">
                    {highAttentionPosts.map((post) => (
                      <div
                        key={post.postId}
                        onClick={onNavigateToReports}
                        className="p-3.5 rounded-xl border border-red-500/30 bg-[var(--calm-surface)] cursor-pointer hover:bg-[var(--calm-surface-variant)]/60 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] font-semibold text-[var(--calm-text-primary)]">
                            @{post.author.username}
                          </span>
                          <span className="text-[11px] font-bold bg-red-500/15 text-red-500 px-2 py-0.5 rounded-md">
                            {post.totalReports} Reports
                          </span>
                        </div>

                        {post.content && (
                          <p className="text-[13px] text-[var(--calm-text-secondary)] line-clamp-2 mb-2">
                            {post.content}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(post.reportsByReason).map(([reason, count]) => (
                            <span
                              key={reason}
                              className="text-[11px] bg-[var(--calm-surface-variant)] text-[var(--calm-text-tertiary)] px-2 py-0.5 rounded"
                            >
                              {reason}: {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={onNavigateToReports}
                    className="p-4 rounded-xl bg-[var(--calm-surface-variant)]/50 cursor-pointer hover:bg-[var(--calm-surface-variant)] transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-[var(--calm-text-primary)]">
                        {stats?.pendingReports} pending reports awaiting review
                      </p>
                      <p className="text-[12px] text-[var(--calm-text-secondary)] mt-0.5">
                        Tap to open reports queue
                      </p>
                    </div>
                    <Flag size={18} className="text-red-500" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
