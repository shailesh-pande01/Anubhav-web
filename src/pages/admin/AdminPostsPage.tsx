import React, { useState, useEffect, useCallback } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { AvatarImage } from '../../components/common/AvatarImage';
import { CalmTextField } from '../../components/common/CalmTextField';
import { CalmLoadingIndicator } from '../../components/common/CalmLoadingIndicator';
import { CalmEmptyState } from '../../components/common/CalmEmptyState';
import { adminService } from '../../services/adminService';
import type { AdminPostSummary } from '../../types/models';
import { useAuth } from '../../context/AuthContext';

interface AdminPostsPageProps {
  onBack: () => void;
}

export const AdminPostsPage: React.FC<AdminPostsPageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<AdminPostSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'MOST_REPORTED' | 'REMOVED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const [postToRemove, setPostToRemove] = useState<AdminPostSummary | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await adminService.getPosts(
        searchQuery.trim() || undefined,
        selectedFilter
      );
      setPosts(fetched);
    } catch (err) {
      console.error('Error fetching admin posts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadPosts]);

  const handleConfirmRemove = async () => {
    if (!user || !postToRemove) return;
    setIsRemoving(true);
    try {
      await adminService.removePost(
        postToRemove.post.id,
        postToRemove.post.userId,
        removeReason.trim(),
        user.id,
        postToRemove.post.imagePath
      );
      setPostToRemove(null);
      setRemoveReason('');
      setSuccessMessage('Post successfully removed.');
      await loadPosts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to remove post');
    } finally {
      setIsRemoving(false);
    }
  };

  const filterOptions = [
    { key: 'ALL', label: 'All Posts' },
    { key: 'MOST_REPORTED', label: 'Most Reported' },
    { key: 'REMOVED', label: 'Removed Posts' }
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
      <CalmTopBar
        title="Posts"
        subtitle="Post Content Management"
        onBack={onBack}
      />

      <main className="flex-1 w-full max-w-[620px] mx-auto pb-24">
        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <CalmTextField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search post text..."
            trailingIcon={<Search size={18} className="text-[var(--calm-text-tertiary)]" />}
          />
        </div>

        {/* Filter Chips */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none border-b border-[var(--calm-border-subtle)]">
          {filterOptions.map(({ key, label }) => {
            const isSelected = selectedFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedFilter(key)}
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

        {/* Posts list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <CalmLoadingIndicator />
          </div>
        ) : posts.length === 0 ? (
          <div className="pt-16">
            <CalmEmptyState
              title="No posts found"
              subtitle="Try adjusting your search query or filter."
            />
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {posts.map((summary) => {
              const post = summary.post;
              return (
                <div
                  key={post.id}
                  className="p-3.5 rounded-xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <AvatarImage
                        imageUrl={post.author.profileImageUrl}
                        name={post.author.displayName}
                        size={36}
                      />
                      <div>
                        <p className="text-[14px] font-semibold text-[var(--calm-text-primary)] leading-tight">
                          {post.author.displayName}
                        </p>
                        <p className="text-[12px] text-[var(--calm-text-secondary)]">
                          @{post.author.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {summary.reportsCount > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-500/15 text-red-500">
                          {summary.reportsCount} Reports
                        </span>
                      )}
                      {post.isRemoved && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--calm-surface-variant)] text-[var(--calm-text-secondary)]">
                          REMOVED
                        </span>
                      )}
                    </div>
                  </div>

                  {post.content && (
                    <p className="text-[14px] text-[var(--calm-text-primary)] mb-2">
                      {post.content}
                    </p>
                  )}

                  {post.imageUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden bg-[var(--calm-surface-variant)]">
                      <img
                        src={post.imageUrl}
                        alt="Post thumbnail"
                        className="w-full max-h-[220px] object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[var(--calm-text-tertiary)]">
                      {post.relativeTime}
                    </span>

                    {!post.isRemoved && (
                      <button
                        type="button"
                        onClick={() => {
                          setRemoveReason('');
                          setPostToRemove(summary);
                        }}
                        className="p-1 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Remove post"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Remove Post Dialog */}
      {postToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-[400px] rounded-2xl bg-[var(--calm-surface)] p-6 shadow-xl border border-[var(--calm-border-subtle)] animate-in fade-in zoom-in-95">
            <h3 className="text-[17px] font-semibold text-[var(--calm-text-primary)] mb-2">
              Remove Post?
            </h3>
            <p className="text-[14px] text-[var(--calm-text-secondary)] mb-4">
              This post will be permanently removed from Anubhav and its storage media pruned.
            </p>

            <div className="mb-5">
              <CalmTextField
                label="Reason (optional)"
                value={removeReason}
                onChange={setRemoveReason}
                placeholder="Specify rationale for audit history..."
                multiline
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPostToRemove(null)}
                disabled={isRemoving}
                className="px-4 py-2 rounded-xl text-[14px] text-[var(--calm-text-secondary)] hover:text-[var(--calm-text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="px-4 py-2 rounded-xl text-[14px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                {isRemoving ? 'Removing...' : 'Remove Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--calm-primary)] text-[var(--calm-text-inverted)] text-[13px] px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center gap-3">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-bold underline"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
};
