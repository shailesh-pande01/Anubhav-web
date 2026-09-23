import React from 'react';
import { Home, Plus, User, LogOut, Settings, ShieldAlert } from 'lucide-react';
import type { BottomTab } from './MainScaffold';
import { ThemeToggle } from '../common/ThemeToggle';
import { AvatarImage } from '../common/AvatarImage';
import { useAuth } from '../../context/AuthContext';

interface DesktopSidebarProps {
  selectedTab: BottomTab;
  onTabSelected: (tab: BottomTab) => void;
  onNavigateToEditProfile: () => void;
  onNavigateToAdminDashboard: () => void;
  onLogout: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  selectedTab,
  onTabSelected,
  onNavigateToEditProfile,
  onNavigateToAdminDashboard,
  onLogout,
}) => {
  const { profile, isAdmin } = useAuth();

  return (
    <aside className="sticky top-6 flex h-[calc(100vh-3rem)] w-[220px] lg:w-[240px] flex-col justify-between py-2 select-none">
      {/* Top section: Brand & Navigation */}
      <div className="flex flex-col">
        {/* Brand Logo & Tagline */}
        <div
          onClick={() => onTabSelected('POSTS')}
          className="group flex cursor-pointer items-center gap-3 px-3 py-2 transition-opacity hover:opacity-85"
        >
          <img
            src="/logo.png"
            alt="Anubhav"
            className="h-8 w-8 rounded-lg object-contain shadow-2xs transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="text-[20px] font-light tracking-[-0.5px] text-[var(--calm-text-primary)] leading-tight">
              Anubhav
            </span>
            <span className="text-[11px] font-normal tracking-[0.2px] text-[var(--calm-text-secondary)] leading-tight">
              Live it. Share it.
            </span>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav className="mt-8 flex flex-col gap-1.5" aria-label="Desktop primary navigation">
          {/* Posts Feed */}
          <button
            type="button"
            onClick={() => onTabSelected('POSTS')}
            className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-medium transition-all ${
              selectedTab === 'POSTS'
                ? 'bg-[var(--calm-surface-variant)] text-[var(--calm-text-primary)] font-semibold shadow-2xs'
                : 'text-[var(--calm-text-secondary)] hover:bg-[var(--calm-surface)] hover:text-[var(--calm-text-primary)]'
            }`}
          >
            <Home
              size={20}
              className={`transition-colors ${
                selectedTab === 'POSTS'
                  ? 'text-[var(--calm-text-primary)] fill-current'
                  : 'text-[var(--calm-text-secondary)]'
              }`}
            />
            <span>Posts</span>
          </button>

          {/* Create Post Button */}
          <button
            type="button"
            onClick={() => onTabSelected('CREATE')}
            className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-medium transition-all ${
              selectedTab === 'CREATE'
                ? 'bg-[var(--calm-surface-variant)] text-[var(--calm-text-primary)] font-semibold shadow-2xs'
                : 'text-[var(--calm-text-secondary)] hover:bg-[var(--calm-surface)] hover:text-[var(--calm-text-primary)]'
            }`}
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-transform ${
                selectedTab === 'CREATE'
                  ? 'bg-[var(--calm-primary)] text-[var(--calm-text-inverted)]'
                  : 'bg-[var(--calm-surface-variant)] text-[var(--calm-text-secondary)]'
              }`}
            >
              <Plus size={15} strokeWidth={2.5} />
            </div>
            <span>Create</span>
          </button>

          {/* Profile */}
          <button
            type="button"
            onClick={() => onTabSelected('PROFILE')}
            className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-medium transition-all ${
              selectedTab === 'PROFILE'
                ? 'bg-[var(--calm-surface-variant)] text-[var(--calm-text-primary)] font-semibold shadow-2xs'
                : 'text-[var(--calm-text-secondary)] hover:bg-[var(--calm-surface)] hover:text-[var(--calm-text-primary)]'
            }`}
          >
            {profile?.profileImageUrl ? (
              <AvatarImage
                imageUrl={profile.profileImageUrl}
                name={profile.displayName || 'User'}
                size={22}
              />
            ) : (
              <User
                size={20}
                className={`transition-colors ${
                  selectedTab === 'PROFILE'
                    ? 'text-[var(--calm-text-primary)] fill-current'
                    : 'text-[var(--calm-text-secondary)]'
                }`}
              />
            )}
            <span>Profile</span>
          </button>
        </nav>
      </div>

      {/* Bottom section: Settings, Theme & Logout */}
      <div className="flex flex-col gap-1 border-t border-[var(--calm-border-subtle)] pt-4">
        {/* Admin Dashboard shortcut if admin */}
        {isAdmin && (
          <button
            type="button"
            onClick={onNavigateToAdminDashboard}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
          >
            <ShieldAlert size={18} />
            <span>Admin</span>
          </button>
        )}

        {/* Edit Profile */}
        <button
          type="button"
          onClick={onNavigateToEditProfile}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-[var(--calm-text-secondary)] hover:bg-[var(--calm-surface)] hover:text-[var(--calm-text-primary)] transition-colors"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        {/* Theme Toggle row */}
        <div className="flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-[13.5px] font-medium text-[var(--calm-text-secondary)]">
          <span>Theme</span>
          <ThemeToggle />
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-[var(--calm-text-secondary)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};
