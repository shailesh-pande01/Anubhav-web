import React from 'react';

interface CalmOutlinedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  isLoading?: boolean;
}

export const CalmOutlinedButton: React.FC<CalmOutlinedButtonProps> = ({
  text,
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`relative flex h-12 w-full items-center justify-center rounded-[10px] border border-calm-border bg-transparent px-4 text-[14px] font-normal tracking-[0.1px] text-calm-text transition-all hover:bg-calm-surface-variant active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="h-5 w-5 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        text
      )}
    </button>
  );
};
