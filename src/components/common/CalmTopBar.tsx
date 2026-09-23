import React from 'react';
import { ArrowLeft } from 'lucide-react';

export interface CalmTopBarProps {
  title: string;
  subtitle?: string | null;
  navigationIcon?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export const CalmTopBar: React.FC<CalmTopBarProps> = ({
  title,
  subtitle,
  navigationIcon,
  onBack,
  actions,
  rightAction,
  className = '',
}) => {
  const effectiveNavIcon = navigationIcon || (onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="p-1.5 -ml-1 rounded-full hover:bg-[var(--calm-surface-variant)] text-[var(--calm-text-primary)] transition-colors focus:outline-none"
      aria-label="Back"
    >
      <ArrowLeft size={20} />
    </button>
  ) : null);

  const effectiveActions = actions || rightAction;

  return (
    <header
      className={`sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[var(--calm-border-subtle)] bg-[var(--calm-bg)]/95 px-4 backdrop-blur-md transition-colors ${className}`}
    >
      <div className="flex items-center gap-3">
        {effectiveNavIcon && <div className="flex items-center">{effectiveNavIcon}</div>}
        <div className="flex flex-col">
          <h1 className="text-[17px] font-semibold tracking-[-0.3px] text-[var(--calm-text-primary)] leading-tight">
            {title}
          </h1>
          {subtitle && (
            <span className="text-[12px] font-normal tracking-[0.2px] text-[var(--calm-text-secondary)] leading-tight">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {effectiveActions && <div className="flex items-center gap-2">{effectiveActions}</div>}
    </header>
  );
};
