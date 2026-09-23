import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { CalmLoadingIndicator } from '../../components/common/CalmLoadingIndicator';
import { CalmEmptyState } from '../../components/common/CalmEmptyState';
import { CalmButton } from '../../components/common/CalmButton';
import { PostItem } from '../../components/post/PostItem';
import { ReportPostDialog } from '../../components/report/ReportPostDialog';
import { postService } from '../../services/postService';
import type { PostWithAuthor } from '../../types/models';
import { useAuth } from '../../context/AuthContext';

interface FeedPageProps {
  onNavigateToProfile: (userId: string) => void;
  onNavigateToEditPost: (postId: string) => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({
  onNavigateToProfile,
  onNavigateToEditPost
}) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [reportingPost, setReportingPost] = useState<PostWithAuthor | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  const loadInitialFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const initialPosts = await postService.getFeedPosts(user?.id || null, 0);
      setPosts(initialPosts);
      setPage(0);
      setHasMorePages(initialPosts.length === 20);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't load posts.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadInitialFeed();
  }, [loadInitialFeed]);

  const loadNextPage = useCallback(async () => {
    if (isLoadingMore || !hasMorePages) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const morePosts = await postService.getFeedPosts(user?.id || null, nextPage);
      if (morePosts.length > 0) {
        setPosts((prev) => [...prev, ...morePosts]);
        setPage(nextPage);
        setHasMorePages(morePosts.length === 20);
      } else {
        setHasMorePages(false);
      }
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMorePages, isLoadingMore, user?.id]);

  // Infinite scroll intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePages && !isLoadingMore && !isLoading) {
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
  }, [loadNextPage, hasMorePages, isLoadingMore, isLoading]);

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

  return (
    <div className="flex flex-col min-h-screen md:min-h-0 bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
      {/* Mobile Top Bar (Hidden on desktop) */}
      <CalmTopBar
        title="Anubhav"
        subtitle="Live it. Share it."
        className="md:hidden"
      />

      {/* Desktop Feed Header */}
      <div className="hidden md:flex items-center justify-between pb-3 mb-2 px-4 border-b border-[var(--calm-border-subtle)]">
        <h2 className="text-[18px] font-semibold tracking-[-0.3px] text-[var(--calm-text-primary)]">
          Feed
        </h2>
        <span className="text-[12px] font-medium text-[var(--calm-text-tertiary)]">
          Recent updates
        </span>
      </div>

      <div className="flex-1 w-full px-0">
        {isLoading && posts.length === 0 ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <CalmLoadingIndicator />
          </div>
        ) : error && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
            <p className="text-[15px] text-[var(--calm-text-secondary)] mb-4">{error}</p>
            <div className="w-[160px]">
              <CalmButton text="Try again" onClick={loadInitialFeed} />
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="pt-20">
            <CalmEmptyState
              title="Nothing here yet."
              subtitle="Create something worth sharing."
            />
          </div>
        ) : (
          <div className="flex flex-col">
            {posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                onLikeClick={() => handleToggleLike(post)}
                onProfileClick={onNavigateToProfile}
                onEditClick={() => onNavigateToEditPost(post.id)}
                onDeleteClick={post.isOwner ? () => handleDeletePost(post) : undefined}
                onReportClick={() => setReportingPost(post)}
              />
            ))}

            {/* Bottom target for pagination */}
            <div ref={observerTarget} className="h-10 flex items-center justify-center">
              {isLoadingMore && <CalmLoadingIndicator />}
            </div>

            <div className="h-8" />
          </div>
        )}
      </div>

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
