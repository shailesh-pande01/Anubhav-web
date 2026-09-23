import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MoreVertical, LogOut, Trash2 } from 'lucide-react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { AvatarImage } from '../../components/common/AvatarImage';
import { CalmButton } from '../../components/common/CalmButton';
import { CalmOutlinedButton } from '../../components/common/CalmOutlinedButton';
import { CalmLoadingIndicator } from '../../components/common/CalmLoadingIndicator';
import { CalmEmptyState } from '../../components/common/CalmEmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PostItem } from '../../components/post/PostItem';
import { ReportPostDialog } from '../../components/report/ReportPostDialog';
import { postService } from '../../services/postService';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import type { PostWithAuthor } from '../../types/models';

interface ProfilePageProps {
  onNavigateToEditProfile: () => void;
  onNavigateToEditPost: (postId: string) => void;
  onNavigateToAdminDashboard: () => void;
  onNavigateToUserProfile: (userId: string) => void;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigateToEditProfile,
  onNavigateToEditPost,
  onNavigateToAdminDashboard,
  onNavigateToUserProfile,
  onLogout
}) => {
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth();

  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [page, setPage] = useState(0);

  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  const [reportingPost, setReportingPost] = useState<PostWithAuthor | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUserPosts = useCallback(async () => {
    if (!user) return;
    setIsLoadingPosts(true);
    try {
      const userPosts = await postService.getUserPosts(user.id, user.id, 0);
      setPosts(userPosts);
      setPage(0);
      setHasMorePosts(userPosts.length === 20);
    } catch (err) {
      console.error('Failed to load user posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [user]);

  useEffect(() => {
    refreshProfile();
    loadUserPosts();
  }, [refreshProfile, loadUserPosts]);

  const loadNextPage = useCallback(async () => {
    if (!user || isLoadingMore || !hasMorePosts) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const morePosts = await postService.getUserPosts(user.id, user.id, nextPage);
      if (morePosts.length > 0) {
        setPosts((prev) => [...prev, ...morePosts]);
        setPage(nextPage);
        setHasMorePosts(morePosts.length === 20);
      } else {
        setHasMorePosts(false);
      }
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [user, page, hasMorePosts, isLoadingMore]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePosts && !isLoadingMore && !isLoadingPosts) {
          loadNextPage();
        }
      },
      { threshold: 0.5 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [loadNextPage, hasMorePosts, isLoadingMore, isLoadingPosts]);

  const handleToggleLike = async (post: PostWithAuthor) => {
    if (!user) return;
    try {
      const newIsLiked = await postService.toggleLike(post.id, user.id, post.isLikedByCurrentUser);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === post.id) {
            const currentCount = p.ownerLikeCount ?? 0;
            const updatedCount = p.isOwner
              ? newIsLiked
                ? currentCount + 1
                : Math.max(0, currentCount - 1)
              : null;
            return {
              ...p,
              isLikedByCurrentUser: newIsLiked,
              ownerLikeCount: updatedCount
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleDeletePost = async (post: PostWithAuthor) => {
    try {
      await postService.deletePost(post.id, post.imagePath);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      await authService.deleteAccount();
      setShowDeleteAccountDialog(false);
      onLogout();
    } catch (err: unknown) {
      setDeleteAccountError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen md:min-h-0 bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
      {/* Mobile Top Bar (Hidden on desktop) */}
      <CalmTopBar
        title="Profile"
        className="md:hidden"
        rightAction={
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full hover:bg-[var(--calm-surface-variant)] text-[var(--calm-text-secondary)] transition-colors focus:outline-none"
              aria-label="Account options"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--calm-surface)] rounded-xl shadow-lg border border-[var(--calm-border-subtle)] py-1.5 z-50 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowLogoutDialog(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-[14px] text-[var(--calm-text-primary)] hover:bg-[var(--calm-surface-variant)] flex items-center gap-2.5 transition-colors"
                >
                  <LogOut size={16} className="text-[var(--calm-text-secondary)]" />
                  Log out
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteAccountDialog(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-[14px] text-red-500 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                >
                  <Trash2 size={16} className="text-red-500" />
                  Delete account
                </button>
              </div>
            )}
          </div>
        }
      />

      <div className="flex-1 w-full pb-20 md:pb-6">
        {/* Profile Header Card */}
        <div className="px-5 py-3 md:p-6 md:rounded-2xl md:border md:border-[var(--calm-border-subtle)] md:bg-[var(--calm-surface)] md:shadow-2xs mb-2 md:mb-5 transition-colors">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-center md:items-start gap-4 md:gap-5">
              <AvatarImage
                imageUrl={profile?.profileImageUrl}
                name={profile?.displayName || 'User'}
                size={72}
              />

              <div className="flex flex-col">
                <h2 className="text-[20px] md:text-[22px] font-semibold text-[var(--calm-text-primary)] leading-tight">
                  {profile?.displayName || 'Your Profile'}
                </h2>
                {profile?.username && (
                  <p className="text-[14px] text-[var(--calm-text-secondary)] mt-0.5">
                    @{profile.username}
                  </p>
                )}
                {profile?.location && (
                  <p className="text-[12px] md:text-[13px] text-[var(--calm-text-secondary)] mt-1">
                    📍 {profile.location}
                  </p>
                )}
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-2.5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={onNavigateToAdminDashboard}
                  className="px-3.5 py-1.5 rounded-xl text-[13px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                >
                  Admin Dashboard
                </button>
              )}
              <CalmOutlinedButton
                text="Edit Profile"
                onClick={onNavigateToEditProfile}
              />
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <p className="mt-3.5 md:mt-4 text-[14px] md:text-[14.5px] text-[var(--calm-text-primary)] leading-[22px] md:leading-[24px]">
              {profile.bio}
            </p>
          )}

          {/* Currently working on & Things I've done (2 columns on desktop) */}
          {(profile?.currentlyWorkingOn || profile?.thingsIveDone) && (
            <div className="mt-4 md:mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {profile?.currentlyWorkingOn && (
                <div className="rounded-xl bg-[var(--calm-surface-variant)]/60 p-3.5 border border-[var(--calm-border-subtle)]/40">
                  <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.4px] text-[var(--calm-text-tertiary)] mb-1">
                    Currently working on
                  </h3>
                  <p className="text-[13.5px] text-[var(--calm-text-primary)] leading-relaxed">
                    {profile.currentlyWorkingOn}
                  </p>
                </div>
              )}

              {profile?.thingsIveDone && (
                <div className="rounded-xl bg-[var(--calm-surface-variant)]/60 p-3.5 border border-[var(--calm-border-subtle)]/40">
                  <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.4px] text-[var(--calm-text-tertiary)] mb-1">
                    Things I've done
                  </h3>
                  <p className="text-[13.5px] text-[var(--calm-text-primary)] leading-relaxed">
                    {profile.thingsIveDone}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mobile Only Action Buttons */}
          <div className="mt-5 space-y-2.5 md:hidden">
            {isAdmin && (
              <CalmButton
                text="Admin Dashboard"
                onClick={onNavigateToAdminDashboard}
              />
            )}

            <CalmOutlinedButton
              text="Edit Profile"
              onClick={onNavigateToEditProfile}
            />
          </div>

          {/* Mobile Divider */}
          <div className="mt-5 border-b border-[var(--calm-border-subtle)] md:hidden" />
        </div>

        {/* Desktop Posts Section Header */}
        <div className="hidden md:flex items-center justify-between pb-2.5 mb-2 px-3 border-b border-[var(--calm-border-subtle)]">
          <h3 className="text-[16px] font-semibold text-[var(--calm-text-primary)]">
            Your Posts
          </h3>
          <span className="text-[12px] text-[var(--calm-text-tertiary)]">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        </div>

        {/* User's Posts Section */}
        {isLoadingPosts ? (
          <div className="flex items-center justify-center py-16">
            <CalmLoadingIndicator />
          </div>
        ) : posts.length === 0 ? (
          <div className="pt-10">
            <CalmEmptyState
              title="No posts yet."
              subtitle="Share something meaningful you worked on or explored."
            />
          </div>
        ) : (
          <div className="flex flex-col">
            {posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                onLikeClick={() => handleToggleLike(post)}
                onProfileClick={onNavigateToUserProfile}
                onEditClick={() => onNavigateToEditPost(post.id)}
                onDeleteClick={() => handleDeletePost(post)}
                onReportClick={() => setReportingPost(post)}
              />
            ))}

            <div ref={observerTarget} className="h-10 flex items-center justify-center">
              {isLoadingMore && <CalmLoadingIndicator />}
            </div>
          </div>
        )}
      </div>

      {/* Logout Dialog */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        title="Log out?"
        message="Are you sure you want to log out of Anubhav?"
        confirmLabel="Log out"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={async () => {
          setShowLogoutDialog(false);
          await signOut();
          onLogout();
        }}
        onCancel={() => setShowLogoutDialog(false)}
      />

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

      {/* Report Post Dialog */}
      {reportingPost && (
        <ReportPostDialog
          postId={reportingPost.id}
          reportedUserId={reportingPost.userId}
          onDismiss={() => setReportingPost(null)}
          onReportSubmitted={() => setReportingPost(null)}
        />
      )}
    </div>
  );
};
