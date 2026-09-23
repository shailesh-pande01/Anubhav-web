import React from 'react';

interface CalmEmptyStateProps {
  title?: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
}

export const CalmEmptyState: React.FC<CalmEmptyStateProps> = ({
  title = 'Nothing here yet.',
  subtitle = 'Create something worth sharing.',
  className = '',
  action,
}) => {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center px-8 py-16 text-center ${className}`}
    >
      <h3 className="text-[20px] font-light tracking-[-0.2px] text-calm-text leading-snug">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-[14px] text-calm-secondary leading-relaxed">
        {subtitle}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
