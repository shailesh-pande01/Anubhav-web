import React from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  isDanger = false,
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const effectiveConfirmText = confirmLabel || confirmText || 'Confirm';
  const effectiveCancelText = cancelLabel || cancelText || 'Cancel';
  const effectiveDanger = isDestructive || isDanger;

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-sm md:max-w-md rounded-[16px] border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)] p-6 md:p-7 shadow-lg transition-transform animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[17px] font-semibold tracking-[-0.2px] text-[var(--calm-text-primary)]">
          {title}
        </h3>

        <div className="mt-2 text-[14px] leading-relaxed text-[var(--calm-text-secondary)]">
          {message}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-[var(--calm-text-secondary)] hover:bg-[var(--calm-surface-variant)] transition-colors disabled:opacity-40"
          >
            {effectiveCancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex items-center justify-center rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors disabled:opacity-40 ${
              effectiveDanger
                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                : 'text-[var(--calm-primary)] hover:bg-[var(--calm-surface-variant)]'
            }`}
          >
            {isLoading ? (
              <svg
                className="h-4 w-4 animate-spin text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              effectiveConfirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
