import React, { useState, useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { CalmTextField } from '../../components/common/CalmTextField';
import { CalmButton } from '../../components/common/CalmButton';
import { CalmLoadingIndicator } from '../../components/common/CalmLoadingIndicator';
import { postService } from '../../services/postService';
import { compressPostImage } from '../../utils/imageCompressor';
import { useAuth } from '../../context/AuthContext';

interface CreatePostPageProps {
  onPostCreated: () => void;
}

export const CreatePostPage: React.FC<CreatePostPageProps> = ({ onPostCreated }) => {
  const { user, profile } = useAuth();
  const [isTextMode, setIsTextMode] = useState(true);
  const [textContent, setTextContent] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isCompressing, setIsCompressing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRestricted = profile?.accountStatus === 'RESTRICTED';

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = '';

    setIsCompressing(true);
    setError(null);
    try {
      const compressedBlob = await compressPostImage(file);
      const compressedFile = new File([compressedBlob], 'photo.jpg', { type: 'image/jpeg' });
      setSelectedFile(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedBlob));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to compress image');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const canPost = isTextMode
    ? textContent.trim().length > 0 && !isPosting
    : (selectedFile !== null || caption.trim().length > 0) && !isPosting && !isCompressing;

  const handleSubmit = async () => {
    if (!user) return;
    if (isRestricted) {
      setError('Your account is currently restricted from creating posts.');
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      if (isTextMode) {
        await postService.createTextPost(user.id, textContent.trim());
      } else {
        if (selectedFile) {
          await postService.createImagePost(user.id, caption.trim(), selectedFile);
        } else {
          await postService.createTextPost(user.id, caption.trim());
        }
      }
      onPostCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to publish post');
      setIsPosting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen md:min-h-0 bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
      {/* Mobile Top Bar (Hidden on desktop) */}
      <CalmTopBar title="Create" className="md:hidden" />

      <div className="flex-1 w-full px-5 py-4 md:p-6 md:rounded-2xl md:border md:border-[var(--calm-border-subtle)] md:bg-[var(--calm-surface)] md:shadow-2xs mb-6 transition-colors">
        {/* Desktop Card Header */}
        <div className="hidden md:flex items-center justify-between pb-3 mb-5 border-b border-[var(--calm-border-subtle)]">
          <h2 className="text-[18px] font-semibold tracking-[-0.3px] text-[var(--calm-text-primary)]">
            Create Post
          </h2>
          <span className="text-[12px] text-[var(--calm-text-tertiary)]">
            Keep it genuine
          </span>
        </div>

        {isRestricted && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[13px]">
            Your account is currently restricted. You cannot publish new posts at this time.
          </div>
        )}

        {/* Mode Selector (Write something vs Add a photo) */}
        <div className="w-full flex rounded-[10px] bg-[var(--calm-surface-variant)] p-1 mb-6">
          <button
            type="button"
            onClick={() => setIsTextMode(true)}
            className={`flex-1 py-2.5 rounded-[8px] text-[14px] font-medium transition-all ${
              isTextMode
                ? 'bg-[var(--calm-surface)] text-[var(--calm-text-primary)] shadow-sm font-semibold'
                : 'text-[var(--calm-text-secondary)] hover:text-[var(--calm-text-primary)]'
            }`}
          >
            Write something
          </button>
          <button
            type="button"
            onClick={() => setIsTextMode(false)}
            className={`flex-1 py-2.5 rounded-[8px] text-[14px] font-medium transition-all ${
              !isTextMode
                ? 'bg-[var(--calm-surface)] text-[var(--calm-text-primary)] shadow-sm font-semibold'
                : 'text-[var(--calm-text-secondary)] hover:text-[var(--calm-text-primary)]'
            }`}
          >
            Add a photo
          </button>
        </div>

        {/* Post Content Composer */}
        {isTextMode ? (
          <div className="w-full">
            <CalmTextField
              value={textContent}
              onChange={(val) => {
                setTextContent(val);
                if (error) setError(null);
              }}
              placeholder="What did you create, explore, or learn today?"
              multiline
              rows={7}
            />
          </div>
        ) : (
          <div className="w-full">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-[220px] rounded-[12px] border border-dashed border-[var(--calm-border)] bg-[var(--calm-surface-variant)]/50 flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--calm-surface-variant)] transition-colors p-4"
              >
                <ImageIcon size={36} className="text-[var(--calm-text-secondary)] mb-2" />
                <p className="text-[15px] font-medium text-[var(--calm-text-primary)]">
                  Select a photo
                </p>
                <p className="text-[12px] text-[var(--calm-text-tertiary)] mt-1">
                  Compressed efficiently before upload
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative w-full rounded-[12px] overflow-hidden bg-[var(--calm-surface-variant)] border border-[var(--calm-border-subtle)]">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Selected preview"
                      className="w-full max-h-[400px] object-cover"
                    />
                  )}

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/65 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X size={18} />
                  </button>

                  {isCompressing && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <CalmLoadingIndicator />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[13px] text-[var(--calm-text-secondary)] hover:text-[var(--calm-text-primary)] transition-colors py-1"
                >
                  Change photo
                </button>

                <div className="mt-2">
                  <CalmTextField
                    value={caption}
                    onChange={setCaption}
                    placeholder="Add a caption (optional)..."
                    multiline
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 text-[13px] text-red-500 font-medium">
            {error}
          </div>
        )}

        {/* Primary Action Button */}
        <div className="mt-7">
          <CalmButton
            text="Post"
            onClick={handleSubmit}
            disabled={!canPost || isRestricted}
            isLoading={isPosting}
          />
        </div>
      </div>
    </div>
  );
};
