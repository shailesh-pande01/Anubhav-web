import React, { useState, useRef, useEffect } from 'react';
import type { PostWithAuthor } from '../../types/models';
import { AvatarImage } from '../common/AvatarImage';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { MoreVertical, Heart } from 'lucide-react';

interface PostItemProps {
  post: PostWithAuthor;
  onLikeClick: () => void;
  onProfileClick: (userId: string) => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  onReportClick?: () => void;
  className?: string;
}

export const PostItem: React.FC<PostItemProps> = ({
  post,
  onLikeClick,
  onProfileClick,
  onEditClick,
  onDeleteClick,
  onReportClick,
  className = '',
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <article
      className={`flex w-full flex-col px-4 py-3 md:px-5 md:py-4 transition-colors md:hover:bg-[var(--calm-surface)]/40 md:rounded-2xl ${className}`}
    >
      {/* 1. Header: Profile avatar, Display name, Relative time, and Overflow Menu */}
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-1 items-center gap-2.5 md:gap-3">
          <AvatarImage
            imageUrl={post.author.profileImageUrl}
            name={post.author.displayName}
            size={38}
            onClick={() => onProfileClick(post.userId)}
          />

          <div
            onClick={() => onProfileClick(post.userId)}
            className="flex flex-col cursor-pointer leading-none"
          >
            <span className="text-[15px] md:text-[15.5px] font-semibold text-calm-text leading-tight hover:underline">
              {post.author.displayName}
            </span>
            {post.relativeTime && (
              <span className="mt-0.5 text-[12px] font-normal text-calm-tertiary leading-tight">
                {post.relativeTime}
              </span>
            )}
          </div>
        </div>

        {/* Overflow Options Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            aria-label="Post options"
            className="flex h-8 w-8 items-center justify-center rounded-full text-calm-tertiary transition-colors hover:bg-calm-surface-variant hover:text-calm-secondary active:scale-95"
          >
            <MoreVertical className="h-[18px] w-[18px]" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-9 z-20 min-w-[140px] rounded-xl border border-calm-subtle bg-calm-surface py-1 shadow-md animate-in fade-in zoom-in-95 duration-100">
              {post.isOwner ? (
                <>
                  {onEditClick && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onEditClick();
                      }}
                      className="flex w-full items-center px-4 py-2.5 text-left text-[14px] text-calm-text hover:bg-calm-surface-variant transition-colors"
                    >
                      Edit Post
                    </button>
                  )}
                  {onDeleteClick && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="flex w-full items-center px-4 py-2.5 text-left text-[14px] text-calm-error hover:bg-calm-surface-variant transition-colors"
                    >
                      Delete Post
                    </button>
                  )}
                </>
              ) : (
                <>
                  {onReportClick && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onReportClick();
                      }}
                      className="flex w-full items-center px-4 py-2.5 text-left text-[14px] text-calm-error hover:bg-calm-surface-variant transition-colors"
                    >
                      Report Post
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Content */}
      <div className="mt-2.5 md:mt-3 pl-12 md:pl-13">
        {post.postType === 'TEXT' ? (
          <p className="whitespace-pre-line text-[16px] md:text-[16.5px] leading-[23px] md:leading-[25px] tracking-[0.15px] text-calm-text">
            {post.content}
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {post.imageUrl && (
              <div className="overflow-hidden rounded-lg md:rounded-xl bg-calm-surface-variant flex items-center justify-center border border-[var(--calm-border-subtle)]/40">
                <img
                  src={post.imageUrl}
                  alt="Post attachment"
                  loading="lazy"
                  className="max-h-[460px] md:max-h-[540px] min-h-[180px] w-full rounded-lg md:rounded-xl object-cover"
                />
              </div>
            )}
            {post.content && (
              <p className="whitespace-pre-line text-[14px] md:text-[15px] leading-[21px] md:leading-[23px] text-calm-text">
                {post.content}
              </p>
            )}
          </div>
        )}

        {/* 3. Footer: Calm Like Action */}
        <div className="mt-2 md:mt-3 flex w-full items-center justify-end">
          <button
            type="button"
            onClick={onLikeClick}
            aria-label={post.isLikedByCurrentUser ? 'Unlike' : 'Like'}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-all hover:bg-calm-surface-variant active:scale-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--calm-primary)]"
          >
            <Heart
              className={`h-[18px] w-[18px] transition-colors ${
                post.isLikedByCurrentUser
                  ? 'fill-[#D9453B] text-[#D9453B]'
                  : 'text-calm-tertiary hover:text-calm-secondary'
              }`}
            />

            {/* STRICT PRODUCT PRIVACY RULE:
                Only display like count if current user is the owner of this post.
                Normal users see ONLY the heart icon. */}
            {post.isOwner && post.ownerLikeCount !== null && (
              <span className="text-[12px] font-medium text-calm-secondary">
                {post.ownerLikeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4. Subtle Divider matching Android HorizontalDivider(thickness = 0.5.dp) */}
      <hr className="mt-3 md:mt-4 border-t-[0.5px] border-calm-subtle" />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete this post?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDeleteClick?.();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </article>
  );
};
