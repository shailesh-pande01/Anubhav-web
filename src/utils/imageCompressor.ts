export const MAX_POST_WIDTH = 1280;
export const MAX_POST_HEIGHT = 1280;
export const MAX_AVATAR_WIDTH = 400;
export const MAX_AVATAR_HEIGHT = 400;
export const COMPRESSION_QUALITY = 0.7; // 70% quality matching Android ImageCompressor.kt

/**
 * Resizes and compresses an image in the browser using HTML5 Canvas,
 * mirroring Android ImageCompressor.kt pipeline:
 * - Post image: max 1280x1280, JPEG 70%
 * - Avatar image: max 400x400, JPEG 70%
 */
export async function compressImage(
  file: File | Blob,
  maxWidth: number = MAX_POST_WIDTH,
  maxHeight: number = MAX_POST_HEIGHT,
  quality: number = COMPRESSION_QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          reject(new Error('Invalid image dimensions.'));
          return;
        }

        // Calculate aspect-ratio-preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not initialize canvas context.'));
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image compression failed.'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export async function compressPostImage(file: File | Blob): Promise<Blob> {
  return compressImage(file, MAX_POST_WIDTH, MAX_POST_HEIGHT, COMPRESSION_QUALITY);
}

export async function compressAvatarImage(file: File | Blob): Promise<Blob> {
  return compressImage(file, MAX_AVATAR_WIDTH, MAX_AVATAR_HEIGHT, COMPRESSION_QUALITY);
}
