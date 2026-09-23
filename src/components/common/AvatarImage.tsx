import React, { useState } from 'react';

interface AvatarImageProps {
  imageUrl?: string | null;
  name: string;
  size?: number; // size in px
  onClick?: () => void;
  className?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  imageUrl,
  name,
  size = 40,
  onClick,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const initial = name ? name.trim().charAt(0).toUpperCase() : '?';

  const baseStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${Math.round(size * 0.42)}px`,
  };

  const isClickable = Boolean(onClick);

  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={`${name}'s avatar`}
        style={baseStyle}
        onError={() => setImgError(true)}
        onClick={onClick}
        className={`shrink-0 rounded-full border-[0.5px] border-calm-subtle bg-calm-surface-variant object-cover ${
          isClickable ? 'cursor-pointer transition-opacity hover:opacity-90' : ''
        } ${className}`}
      />
    );
  }

  return (
    <div
      style={baseStyle}
      onClick={onClick}
      className={`flex shrink-0 items-center justify-center rounded-full border-[0.5px] border-calm-subtle bg-calm-surface-variant font-medium text-calm-secondary ${
        isClickable ? 'cursor-pointer transition-opacity hover:opacity-90' : ''
      } ${className}`}
    >
      <span>{initial}</span>
    </div>
  );
};
