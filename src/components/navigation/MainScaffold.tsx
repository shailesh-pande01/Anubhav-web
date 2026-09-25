import React, { useState } from 'react';
import { CalmBottomBar } from './CalmBottomBar';
import { DesktopSidebar } from './DesktopSidebar';
import { DesktopRightSidebar } from './DesktopRightSidebar';
import { FeedPage } from '../../pages/feed/FeedPage';
import { CreatePostPage } from '../../pages/create/CreatePostPage';
import { ProfilePage } from '../../pages/profile/ProfilePage';

export type BottomTab = 'POSTS' | 'CREATE' | 'PROFILE';

interface MainScaffoldProps {
  onNavigateToUserProfile: (userId: string) => void;
  onNavigateToEditProfile: () => void;
  onNavigateToEditPost: (postId: string) => void;
  onNavigateToAdminDashboard: () => void;
  onLogout: () => void;
  isGuest?: boolean;
  onSignIn?: () => void;
  initialTab?: BottomTab;
}

export const MainScaffold: React.FC<MainScaffoldProps> = ({
  onNavigateToUserProfile,
  onNavigateToEditProfile,
  onNavigateToEditPost,
  onNavigateToAdminDashboard,
  onLogout,
  isGuest = false,
  onSignIn,
  initialTab = 'POSTS',
}) => {
  const [selectedTab, setSelectedTab] = useState<BottomTab>(isGuest ? 'POSTS' : initialTab);

  return (
    <div className="min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)] flex flex-col justify-between transition-colors">
      {/* Centered Application Container */}
      <div className="mx-auto w-full max-w-[1240px] flex-1 px-0 sm:px-4 md:px-6">
        <div className="flex w-full justify-center gap-6 lg:gap-8">
          {/* Left Column: Persistent Desktop Sidebar (Visible on md and up) */}
          <div className="hidden md:block shrink-0">
            <DesktopSidebar
              selectedTab={selectedTab}
              onTabSelected={setSelectedTab}
              onNavigateToEditProfile={onNavigateToEditProfile}
              onNavigateToAdminDashboard={onNavigateToAdminDashboard}
              onLogout={onLogout}
              isGuest={isGuest}
              onSignIn={onSignIn}
            />
          </div>

          {/* Center Column: Active View (Feed / Create / Profile) */}
          <main
            className={`flex-1 min-w-0 max-w-[680px] w-full pt-0 md:pt-4 ${
              isGuest ? 'pb-6' : 'pb-20 md:pb-6'
            }`}
          >
            {selectedTab === 'POSTS' && (
              <FeedPage
                onNavigateToProfile={onNavigateToUserProfile}
                onNavigateToEditPost={onNavigateToEditPost}
                onSignIn={onSignIn}
              />
            )}

            {!isGuest && selectedTab === 'CREATE' && (
              <CreatePostPage
                onPostCreated={() => setSelectedTab('POSTS')}
              />
            )}

            {!isGuest && selectedTab === 'PROFILE' && (
              <ProfilePage
                onNavigateToEditProfile={onNavigateToEditProfile}
                onNavigateToEditPost={onNavigateToEditPost}
                onNavigateToAdminDashboard={onNavigateToAdminDashboard}
                onNavigateToUserProfile={onNavigateToUserProfile}
                onLogout={onLogout}
              />
            )}
          </main>

          {/* Right Column: Contextual Card / Space (Visible on lg and up) */}
          <div className="hidden lg:block shrink-0">
            <DesktopRightSidebar
              selectedTab={selectedTab}
              onTabSelected={setSelectedTab}
            />
          </div>
        </div>
      </div>

      {/* Mobile-Only Bottom Navigation (Hidden on desktop via md:hidden, and hidden completely for guests) */}
      {!isGuest && (
        <CalmBottomBar
          selectedTab={selectedTab}
          onTabSelected={setSelectedTab}
        />
      )}
    </div>
  );
};
