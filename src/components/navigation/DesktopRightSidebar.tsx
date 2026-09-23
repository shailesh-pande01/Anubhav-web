import React from 'react';
import type { BottomTab } from './MainScaffold';
import { AvatarImage } from '../common/AvatarImage';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Sparkles } from 'lucide-react';

interface DesktopRightSidebarProps {
  selectedTab: BottomTab;
  onTabSelected: (tab: BottomTab) => void;
}

export const DesktopRightSidebar: React.FC<DesktopRightSidebarProps> = ({
  selectedTab,
  onTabSelected,
}) => {
  const { profile } = useAuth();

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[260px] lg:w-[280px] flex-col gap-4 py-2 select-none lg:flex">
      {/* 1. Contextual User Snapshot (visible when on Posts or Create) */}
      {profile && selectedTab !== 'PROFILE' && (
        <div className="rounded-2xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)] p-4 shadow-2xs transition-colors">
          <div className="flex items-center gap-3">
            <AvatarImage
              imageUrl={profile.profileImageUrl}
              name={profile.displayName || 'User'}
              size={44}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[14.5px] font-semibold text-[var(--calm-text-primary)] leading-tight">
                {profile.displayName || 'Creator'}
              </span>
              <span className="truncate text-[12px] text-[var(--calm-text-secondary)] leading-tight mt-0.5">
                @{profile.username || 'user'}
              </span>
            </div>
          </div>

          {profile.currentlyWorkingOn && (
            <div className="mt-3.5 rounded-xl bg-[var(--calm-surface-variant)]/60 px-3 py-2 border border-[var(--calm-border-subtle)]/50">
              <span className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--calm-text-tertiary)] block">
                Working on
              </span>
              <p className="mt-0.5 line-clamp-2 text-[12.5px] text-[var(--calm-text-primary)] leading-snug">
                {profile.currentlyWorkingOn}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => onTabSelected('PROFILE')}
            className="mt-3.5 flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-[12.5px] font-medium text-[var(--calm-text-secondary)] hover:bg-[var(--calm-surface-variant)] hover:text-[var(--calm-text-primary)] transition-colors"
          >
            <span>View your profile</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 2. Contextual Advice when creating a post */}
      {selectedTab === 'CREATE' ? (
        <div className="rounded-2xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)] p-4 shadow-2xs transition-colors">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
            <Sparkles size={16} />
            <span className="text-[13px] font-semibold">Quiet Sharing</span>
          </div>
          <p className="text-[12.5px] leading-relaxed text-[var(--calm-text-secondary)]">
            Share what you genuinely built, explored, or learned today.
          </p>
          <ul className="mt-2.5 space-y-1.5 text-[12px] text-[var(--calm-text-secondary)]">
            <li className="flex items-start gap-1.5">
              <span className="text-[var(--calm-text-tertiary)]">•</span>
              <span>An honest milestone or craft update</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[var(--calm-text-tertiary)]">•</span>
              <span>A real creation, without engagement hooks</span>
            </li>
          </ul>
        </div>
      ) : (
        /* 3. Understated Philosophy & Brand Identity Card */
        <div className="rounded-2xl border border-[var(--calm-border-subtle)] bg-[var(--calm-surface)] p-4 shadow-2xs transition-colors">
          <h4 className="text-[13px] font-semibold text-[var(--calm-text-primary)] tracking-[-0.1px]">
            Live it. Share it.
          </h4>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--calm-text-secondary)]">
            A calm, minimal space for real experiences, learning, and meaningful work.
          </p>
          <div className="mt-3.5 pt-3 border-t border-[var(--calm-border-subtle)]/70 flex flex-col gap-1">
            <span className="text-[11.5px] text-[var(--calm-text-tertiary)] font-normal">
              Create more. Share less.
            </span>
            <span className="text-[11px] text-[var(--calm-text-tertiary)]/70">
              Anubhav • Minimalist Web
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
