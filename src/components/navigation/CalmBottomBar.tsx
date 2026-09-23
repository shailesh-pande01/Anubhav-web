import React from 'react';
import { Home, User, Plus } from 'lucide-react';

export type BottomTab = 'POSTS' | 'CREATE' | 'PROFILE';

interface CalmBottomBarProps {
  selectedTab: BottomTab;
  onTabSelected: (tab: BottomTab) => void;
  className?: string;
}

export const CalmBottomBar: React.FC<CalmBottomBarProps> = ({
  selectedTab,
  onTabSelected,
  className = '',
}) => {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 flex h-[58px] w-full items-center justify-around border-t border-calm-subtle bg-calm-bg/95 px-6 backdrop-blur-md transition-colors md:hidden ${className}`}
    >
      {/* 1. Posts Tab (Home) */}
      <button
        type="button"
        onClick={() => onTabSelected('POSTS')}
        aria-label="Posts"
        className="flex flex-1 items-center justify-center py-2 transition-transform active:scale-95"
      >
        <Home
          className={`h-6 w-6 transition-colors ${
            selectedTab === 'POSTS'
              ? 'fill-current text-calm-text'
              : 'text-calm-tertiary hover:text-calm-secondary'
          }`}
        />
      </button>

      {/* 2. Create Tab (Center + Action) */}
      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={() => onTabSelected('CREATE')}
          aria-label="Create Post"
          className={`flex h-[38px] w-[38px] items-center justify-center rounded-full bg-calm-accent text-calm-on-accent shadow-xs transition-transform active:scale-90 ${
            selectedTab === 'CREATE' ? 'ring-2 ring-calm-border' : 'opacity-95 hover:opacity-100'
          }`}
        >
          <Plus className="h-[22px] w-[22px] stroke-[2.5]" />
        </button>
      </div>

      {/* 3. Profile Tab (User) */}
      <button
        type="button"
        onClick={() => onTabSelected('PROFILE')}
        aria-label="Profile"
        className="flex flex-1 items-center justify-center py-2 transition-transform active:scale-95"
      >
        <User
          className={`h-6 w-6 transition-colors ${
            selectedTab === 'PROFILE'
              ? 'fill-current text-calm-text'
              : 'text-calm-tertiary hover:text-calm-secondary'
          }`}
        />
      </button>
    </nav>
  );
};
