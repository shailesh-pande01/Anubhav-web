import React, { useState } from 'react';
import { reportService, DuplicateReportError } from '../../services/reportService';
import { REPORT_REASONS, type ReportReason } from '../../types/models';
import { CalmButton } from '../common/CalmButton';
import { CalmTextField } from '../common/CalmTextField';

export interface ReportPostDialogProps {
  isOpen?: boolean;
  postId: string;
  reportedUserId: string;
  onDismiss: () => void;
  onReportSubmitted?: () => void;
}

export const ReportPostDialog: React.FC<ReportPostDialogProps> = ({
  isOpen = true,
  postId,
  reportedUserId,
  onDismiss,
  onReportSubmitted,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('Spam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        if (isSuccess) {
          handleDone();
        } else {
          onDismiss();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, isSuccess, onDismiss]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await reportService.submitReport(postId, reportedUserId, selectedReason, description);
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof DuplicateReportError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage((err as Error).message || "Couldn't submit report. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setIsSuccess(false);
    onDismiss();
    onReportSubmitted?.();
  };

  if (isSuccess) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      >
        <div
          className="w-full max-w-sm rounded-[14px] border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)] p-6 shadow-sm animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-[17px] font-semibold text-[var(--calm-text-primary)]">
            Report Submitted
          </h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--calm-text-secondary)]">
            Thank you for helping keep Anubhav safe. Our moderation team will review this post.
          </p>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleDone}
              className="rounded-lg px-4 py-2 text-[14px] font-medium text-[var(--calm-primary)] hover:bg-[var(--calm-surface-variant)] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        if (!isSubmitting) onDismiss();
      }}
    >
      <div
        className="w-full max-w-md rounded-[16px] border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)] p-6 shadow-sm animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[18px] font-semibold tracking-[-0.2px] text-[var(--calm-text-primary)]">
          Report Post
        </h3>
        <p className="mt-1 text-[14px] text-[var(--calm-text-secondary)]">
          Why are you reporting this post?
        </p>

        {/* Reasons list */}
        <div className="mt-4 space-y-1">
          {REPORT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <label
                key={reason}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-[var(--calm-surface-variant)]"
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={reason}
                  checked={isSelected}
                  disabled={isSubmitting}
                  onChange={() => {
                    setSelectedReason(reason);
                    setErrorMessage(null);
                  }}
                  className="h-4 w-4 accent-[var(--calm-primary)]"
                />
                <span className="text-[14px] text-[var(--calm-text-primary)]">{reason}</span>
              </label>
            );
          })}
        </div>

        {/* Description */}
        <div className="mt-4">
          <CalmTextField
            label="Additional details (optional)"
            placeholder="Provide context to help us understand..."
            value={description}
            onChange={setDescription}
            multiline
            rows={2}
            disabled={isSubmitting}
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 whitespace-pre-line text-[12px] leading-relaxed text-red-500 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex flex-col gap-2">
          <CalmButton
            text="Submit Report"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onDismiss}
            className="flex h-11 w-full items-center justify-center rounded-[10px] text-[14px] font-medium text-[var(--calm-text-secondary)] hover:bg-[var(--calm-surface-variant)] transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
