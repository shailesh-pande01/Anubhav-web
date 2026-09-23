import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { CalmTextField } from '../../components/common/CalmTextField';
import { CalmButton } from '../../components/common/CalmButton';
import { CalmLoadingIndicator } from '../../components/common/CalmLoadingIndicator';
import { postService } from '../../services/postService';
import { compressPostImage } from '../../utils/imageCompressor';
import { useAuth } from '../../context/AuthContext';

interface EditPostPageProps {
  postId: string;
  onBack: () => void;
  onPostUpdated: () => void;
}

export const EditPostPage: React.FC<EditPostPageProps> = ({
  postId,
  onBack,
  onPostUpdated
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState<string | null>(null);

  const [isImageRemoved, setIsImageRemoved] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const post = await postService.getPostById(postId, user?.id || null);
        if (!post) {
          setError('Post not found');
          return;
        }

        if (post.userId !== user?.id) {
          setError('You do not have permission to edit this post');
          return;
        }

        setContent(post.content || '');
        setExistingImageUrl(post.imageUrl);
        setExistingImagePath(post.imagePath);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading post');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, user?.id]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsCompressing(true);
    setError(null);
    try {
      const compressedBlob = await compressPostImage(file);
      const compressedFile = new File([compressedBlob], 'photo.jpg', { type: 'image/jpeg' });
      setSelectedFile(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedBlob));
      setIsImageRemoved(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error compressing image');
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
    setIsImageRemoved(true);
  };

  const displayImage = previewUrl || (!isImageRemoved ? existingImageUrl : null);

  const canSave = (displayImage !== null || content.trim().length > 0) && !isSaving && !isCompressing;

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      await postService.updatePost(
        postId,
        user.id,
        content.trim(),
        selectedFile,
        isImageRemoved,
        existingImagePath
      );
      onPostUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)]">
      <CalmTopBar title="Edit Post" onBack={onBack} />

      <main className="flex-1 w-full max-w-[640px] mx-auto px-4 md:px-6 py-4 md:py-8 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <CalmLoadingIndicator />
          </div>
        ) : (
          <div className="w-full md:p-8 md:rounded-2xl md:border md:border-[var(--calm-border-subtle)] md:bg-[var(--calm-surface)] md:shadow-2xs transition-colors">
            <form onSubmit={handleSaveChanges} className="flex flex-col">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Image Section */}
            {displayImage ? (
              <div className="space-y-2 mb-4">
                <div className="relative w-full rounded-[12px] overflow-hidden bg-[var(--calm-surface-variant)] border border-[var(--calm-border-subtle)]">
                  <img
                    src={displayImage}
                    alt="Post photo"
                    className="w-full max-h-[380px] object-cover"
                  />

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
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-[120px] rounded-[12px] border border-dashed border-[var(--calm-border)] bg-[var(--calm-surface-variant)]/40 flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--calm-surface-variant)] transition-colors p-4 mb-4"
              >
                <ImageIcon size={28} className="text-[var(--calm-text-secondary)] mb-1.5" />
                <p className="text-[13px] text-[var(--calm-text-secondary)]">
                  Attach a photo (optional)
                </p>
              </div>
            )}

            {/* Content Field */}
            <CalmTextField
              label={displayImage ? "Caption" : "Post Content"}
              value={content}
              onChange={(val) => {
                setContent(val);
                if (error) setError(null);
              }}
              placeholder={
                displayImage
                  ? "Add a caption..."
                  : "What did you create, explore, or learn?"
              }
              multiline
              rows={displayImage ? 3 : 6}
            />

            {error && (
              <div className="mt-3.5 text-[13px] text-red-500 font-medium">
                {error}
              </div>
            )}

            <div className="mt-7">
              <CalmButton
                text="Save Changes"
                type="submit"
                isLoading={isSaving}
                disabled={!canSave}
              />
            </div>
          </form>
          </div>
        )}
      </main>
    </div>
  );
};
