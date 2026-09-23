import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { AvatarImage } from '../../components/common/AvatarImage';
import { CalmLoadingIndicator } from '../../components/common/CalmLoadingIndicator';
import { CalmEmptyState } from '../../components/common/CalmEmptyState';
import { PostItem } from '../../components/post/PostItem';
import { ReportPostDialog } from '../../components/report/ReportPostDialog';
import { profileService } from '../../services/profileService';
import { postService } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import type { UserProfile, PostWithAuthor } from '../../types/models';

interface UserProfilePageProps {
  userId: string;
  onBack: () => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ userId, onBack }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [page, setPage] = useState(0);
  const [reportingPost, setReportingPost] = useState<PostWithAuthor | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const p = await profileService.getProfile(userId);
        setProfile(p);
      } catch (err) {
        console.error('Error fetching creator profile:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const loadUserPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const userPosts = await postService.getUserPosts(userId, user?.id || null, 0);
      setPosts(userPosts);
      setPage(0);
      setHasMorePosts(userPosts.length === 20);
    } catch (err) {
      console.error('Error fetching creator posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [userId, user?.id]);

  useEffect(() => {
    loadUserPosts();
  }, [loadUserPosts]);

  const loadNextPage = useCallback(async () => {
    if (isLoadingMore || !hasMorePosts) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const morePosts = await postService.getUserPosts(userId, user?.id || null, nextPage);
      if (morePosts.length > 0) {
        setPosts((prev) => [...prev, ...morePosts]);
        setPage(nextPage);
        setHasMorePosts(morePosts.length === 20);
      } else {
        setHasMorePosts(false);
      }
    } catch (err) {
      console.error('Error loading more creator posts:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [userId, page, hasMorePosts, isLoadingMore, user?.id]);

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
            return {
              ...p,
              isLikedByCurrentUser: newIsLiked
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
      <CalmTopBar
        title={profile?.displayName || 'Profile'}
        onBack={onBack}
      />

      <main className="flex-1 w-full max-w-[680px] mx-auto px-0 sm:px-4 pb-24 md:pt-4">
        {isLoadingProfile && !profile ? (
          <div className="flex items-center justify-center py-20">
            <CalmLoadingIndicator />
          </div>
        ) : (
          <div>
            {/* Creator Header Card */}
            <div className="px-5 py-3 md:p-6 md:rounded-2xl md:border md:border-[var(--calm-border-subtle)] md:bg-[var(--calm-surface)] md:shadow-2xs mb-2 md:mb-5 transition-colors">
              <div className="flex items-center md:items-start gap-4 md:gap-5">
                <AvatarImage
                  imageUrl={profile?.profileImageUrl}
                  name={profile?.displayName || 'User'}
                  size={72}
                />

                <div className="flex flex-col">
                  <h2 className="text-[20px] md:text-[22px] font-semibold text-[var(--calm-text-primary)] leading-tight">
                    {profile?.displayName || 'Creator'}
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

              <div className="mt-5 border-b border-[var(--calm-border-subtle)] md:hidden" />
            </div>

            {/* Desktop Posts Section Header */}
            <div className="hidden md:flex items-center justify-between pb-2.5 mb-2 px-3 border-b border-[var(--calm-border-subtle)]">
              <h3 className="text-[16px] font-semibold text-[var(--calm-text-primary)]">
                Posts
              </h3>
              <span className="text-[12px] text-[var(--calm-text-tertiary)]">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </span>
            </div>

            {/* Posts */}
            {isLoadingPosts ? (
              <div className="flex items-center justify-center py-16">
                <CalmLoadingIndicator />
              </div>
            ) : posts.length === 0 ? (
              <div className="pt-10">
                <CalmEmptyState
                  title="No posts yet."
                  subtitle="This creator hasn't published any posts yet."
                />
              </div>
            ) : (
              <div className="flex flex-col">
                {posts.map((post) => (
                  <PostItem
                    key={post.id}
                    post={post}
                    onLikeClick={() => handleToggleLike(post)}
                    onProfileClick={() => {}}
                    onReportClick={() => setReportingPost(post)}
                  />
                ))}

                <div ref={observerTarget} className="h-10 flex items-center justify-center">
                  {isLoadingMore && <CalmLoadingIndicator />}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

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
