import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { CalmTopBar } from '../../components/common/CalmTopBar';
import { CalmTextField } from '../../components/common/CalmTextField';
import { CalmButton } from '../../components/common/CalmButton';
import { CalmLoadingIndicator } from '../../components/common/CalmLoadingIndicator';
import { authService } from '../../services/authService';
import { supabase } from '../../config/supabase';

interface ResetPasswordPageProps {
  onResetSuccess: () => void;
  onBackToLogin: () => void;
  onRequestNewLink: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  onResetSuccess,
  onBackToLogin,
  onRequestNewLink
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isVerifying, setIsVerifying] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpiredOrInvalid, setIsExpiredOrInvalid] = useState(false);

  useEffect(() => {
    // Check if we have a valid session or recovery token
    const verifyRecoverySession = async () => {
      try {
        const hash = window.location.hash;
        const search = window.location.search;

        if (hash.includes('error=') || search.includes('error=')) {
          setIsExpiredOrInvalid(true);
          setErrorMessage('The password reset link has expired or is invalid. Please request a new one.');
          setIsVerifying(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          // If hash contains access_token, give Supabase auth state listener a moment to establish session
          if (hash.includes('access_token=') || search.includes('code=')) {
            // Wait briefly
            setTimeout(async () => {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (retrySession) {
                setIsVerifying(false);
              } else {
                setIsExpiredOrInvalid(true);
                setErrorMessage('Unable to verify reset link. It may have expired.');
                setIsVerifying(false);
              }
            }, 800);
            return;
          }

          setIsExpiredOrInvalid(true);
          setErrorMessage('No active recovery session found. Please request a new reset link.');
          setIsVerifying(false);
          return;
        }

        setIsVerifying(false);
      } catch (err: unknown) {
        setIsExpiredOrInvalid(true);
        setErrorMessage(err instanceof Error ? err.message : 'Error validating reset link');
        setIsVerifying(false);
      }
    };

    verifyRecoverySession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsUpdating(true);
    setErrorMessage(null);

    try {
      await authService.updatePassword(newPassword);
      setIsSuccess(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)] flex flex-col items-center justify-center p-0 md:p-6 transition-colors">
      <div className="w-full max-w-[620px] md:max-w-[460px] flex flex-col min-h-screen md:min-h-0 md:rounded-2xl md:border md:border-[var(--calm-border-subtle)] md:bg-[var(--calm-surface)] md:shadow-2xs overflow-hidden transition-colors">
        <CalmTopBar title="Reset Password" onBack={onBackToLogin} />

        <div className="flex-1 px-7 py-6">
          {/* 1. Verifying Token State */}
          {isVerifying && (
            <div className="flex flex-col items-center justify-center py-20">
              <CalmLoadingIndicator />
              <p className="mt-4 text-[14px] text-[var(--calm-text-secondary)]">
                Verifying reset link...
              </p>
            </div>
          )}

          {/* 2. Expired / Invalid Token State */}
          {!isVerifying && isExpiredOrInvalid && (
            <div className="flex flex-col items-start pt-3">
              <h2 className="text-[22px] font-semibold text-[var(--calm-text-primary)] mb-3">
                Reset link expired
              </h2>
              <p className="text-[16px] text-[var(--calm-text-secondary)] mb-9">
                {errorMessage || 'This password reset link is invalid or has expired.'}
              </p>

              <CalmButton
                text="Request new link"
                onClick={onRequestNewLink}
              />

              <div className="w-full text-center mt-4">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-[14px] text-[var(--calm-text-secondary)] hover:text-[var(--calm-text-primary)] transition-colors py-2"
                >
                  Back to log in
                </button>
              </div>
            </div>
          )}

          {/* 3. Success State */}
          {!isVerifying && !isExpiredOrInvalid && isSuccess && (
            <div className="flex flex-col items-start pt-3">
              <h2 className="text-[22px] font-semibold text-[var(--calm-text-primary)] mb-3">
                Password updated
              </h2>
              <p className="text-[16px] text-[var(--calm-text-secondary)] mb-2">
                Your password has been changed successfully.
              </p>
              <p className="text-[14px] text-[var(--calm-text-tertiary)] mb-9">
                You can now log in with your new password.
              </p>

              <CalmButton
                text="Continue to login"
                onClick={onResetSuccess}
              />
            </div>
          )}

          {/* 4. Password Entry Form State */}
          {!isVerifying && !isExpiredOrInvalid && !isSuccess && (
            <form onSubmit={handleUpdatePassword} className="flex flex-col items-start pt-3">
              <h2 className="text-[22px] font-semibold text-[var(--calm-text-primary)] mb-2">
                Reset password
              </h2>
              <p className="text-[14px] text-[var(--calm-text-secondary)] mb-7">
                Create a new password for your Anubhav account.
              </p>

              <div className="w-full mb-4">
                <CalmTextField
                  label="New password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(val) => {
                    setNewPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="At least 6 characters"
                  required
                  trailingIcon={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[var(--calm-text-tertiary)] hover:text-[var(--calm-text-secondary)] focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </div>

              <div className="w-full mb-4">
                <CalmTextField
                  label="Confirm password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(val) => {
                    setConfirmPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Confirm your new password"
                  required
                  trailingIcon={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[var(--calm-text-tertiary)] hover:text-[var(--calm-text-secondary)] focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </div>

              {errorMessage && (
                <div className="mb-4 text-[13px] text-red-500 font-medium">
                  {errorMessage}
                </div>
              )}

              <div className="w-full mt-3">
                <CalmButton
                  text={isUpdating ? 'Updating password...' : 'Update password'}
                  type="submit"
                  isLoading={isUpdating}
                  disabled={isUpdating}
                />
              </div>

              <div className="w-full text-center mt-5">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-[14px] text-[var(--calm-text-secondary)] hover:text-[var(--calm-text-primary)] transition-colors py-2"
                >
                  Back to log in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
