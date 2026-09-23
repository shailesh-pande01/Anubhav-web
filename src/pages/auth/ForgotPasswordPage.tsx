import React, { useState } from 'react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { CalmTextField } from '../../components/common/CalmTextField';
import { CalmButton } from '../../components/common/CalmButton';
import { authService } from '../../services/authService';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isResetEmailSent, setIsResetEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await authService.sendPasswordResetEmail(email.trim());
      setIsResetEmailSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)] flex flex-col items-center justify-center p-0 md:p-6 transition-colors">
      <div className="w-full max-w-[620px] md:max-w-[460px] flex flex-col min-h-screen md:min-h-0 md:rounded-2xl md:border md:border-[var(--calm-border-subtle)] md:bg-[var(--calm-surface)] md:shadow-2xs overflow-hidden transition-colors">
        <CalmTopBar title="Forgot Password" onBack={onBack} />

        <div className="flex-1 px-7 py-6">
          {isResetEmailSent ? (
            // Dedicated Confirmation State (Requirement 29)
            <div className="flex flex-col items-start pt-3">
              <h2 className="text-[22px] font-semibold text-[var(--calm-text-primary)] mb-3">
                Check your email
              </h2>
              <p className="text-[16px] text-[var(--calm-text-secondary)] mb-2">
                We've sent a password reset link to your email address.
              </p>
              <p className="text-[14px] text-[var(--calm-text-secondary)] mb-9">
                Open the email and click the reset link to create a new password.
              </p>

              <CalmButton
                text="Back to login"
                onClick={() => {
                  setIsResetEmailSent(false);
                  onBack();
                }}
              />

              <div className="w-full text-center mt-4">
                <button
                  type="button"
                  onClick={handleSendReset}
                  disabled={isSending}
                  className="text-[14px] text-[var(--calm-text-secondary)] hover:text-[var(--calm-text-primary)] transition-colors py-2 disabled:opacity-50"
                >
                  {isSending ? 'Resending...' : 'Resend email'}
                </button>
              </div>
            </div>
          ) : (
            // Input Form State
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendReset();
              }}
              className="flex flex-col items-start pt-3"
            >
              <h2 className="text-[22px] font-semibold text-[var(--calm-text-primary)] mb-2">
                Forgot password?
              </h2>
              <p className="text-[14px] text-[var(--calm-text-secondary)] mb-7">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <div className="w-full mb-4">
                <CalmTextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(val) => {
                    setEmail(val);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>

              {error && (
                <div className="mb-4 text-[13px] text-red-500 font-medium">
                  {error}
                </div>
              )}

              <div className="w-full mt-3">
                <CalmButton
                  text="Send reset link"
                  type="submit"
                  isLoading={isSending}
                  disabled={isSending}
                />
              </div>

              <div className="w-full text-center mt-5">
                <button
                  type="button"
                  onClick={onBack}
                  className="text-[14px] text-[var(--calm-text-secondary)] hover:text-[var(--calm-text-primary)] transition-colors py-2"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
