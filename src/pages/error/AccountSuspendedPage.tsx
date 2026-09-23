import React from 'react';
import { Ban } from 'lucide-react';
import { CalmButton } from '../../components/common/CalmButton';
import { useAuth } from '../../context/AuthContext';

export const AccountSuspendedPage: React.FC = () => {
  const { profile, signOut } = useAuth();
  const isBanned = profile?.accountStatus === 'BANNED';

  return (
    <div className="min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[420px] flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-5 text-red-500">
          <Ban size={36} />
        </div>

        <h1 className="text-[22px] font-bold text-[var(--calm-text-primary)] mb-2">
          {isBanned ? 'Account Banned' : 'Account Suspended'}
        </h1>

        <p className="text-[15px] text-[var(--calm-text-secondary)] mb-3 leading-relaxed">
          {isBanned
            ? 'Your account has been permanently banned for violating Anubhav community standards.'
            : profile?.suspendedUntil
            ? `Your account has been suspended until ${new Date(profile.suspendedUntil).toLocaleDateString()}.`
            : 'Your account has been temporarily suspended.'}
        </p>

        {profile?.statusReason && (
          <p className="text-[13px] text-[var(--calm-text-tertiary)] mb-8 bg-[var(--calm-surface-variant)] px-4 py-2 rounded-lg">
            Reason: {profile.statusReason}
          </p>
        )}

        <div className="w-full max-w-[240px]">
          <CalmButton
            text="Log Out"
            onClick={signOut}
          />
        </div>
      </div>
    </div>
  );
};
