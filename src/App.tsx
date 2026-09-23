import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CalmLoadingIndicator } from './components/common/CalmLoadingIndicator';

// Pages
import { AuthPage } from './pages/auth/AuthPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { AccountSuspendedPage } from './pages/error/AccountSuspendedPage';
import { MainScaffold } from './components/navigation/MainScaffold';
import { EditProfilePage } from './pages/profile/EditProfilePage';
import { UserProfilePage } from './pages/profile/UserProfilePage';
import { EditPostPage } from './pages/post/EditPostPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminReportDetailPage } from './pages/admin/AdminReportDetailPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage';
import { AdminPostsPage } from './pages/admin/AdminPostsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

export interface RouteState {
  screen: string;
  params?: Record<string, string>;
}

const AppContent: React.FC = () => {
  const { user, profile, isLoading, refreshProfile } = useAuth();

  // Route State
  const [currentRoute, setCurrentRoute] = useState<RouteState>(() => {
    // Check if recovery link was opened
    const hash = window.location.hash;
    const search = window.location.search;
    if (hash.includes('type=recovery') || hash.includes('access_token=') || search.includes('type=recovery')) {
      return { screen: 'reset_password' };
    }
    return { screen: 'main' };
  });

  // History listener for browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.screen) {
        setCurrentRoute(event.state as RouteState);
      } else {
        // Fallback to main if authenticated or auth if not
        setCurrentRoute({ screen: user ? 'main' : 'auth' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Navigate helper that pushes state to browser history
  const navigate = useCallback((screen: string, params?: Record<string, string>) => {
    const newRoute: RouteState = { screen, params };
    setCurrentRoute(newRoute);
    window.history.pushState(newRoute, '', window.location.pathname);
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate(user ? 'main' : 'auth');
    }
  }, [navigate, user]);

  // 1. Initial authentication loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--calm-bg)] text-[var(--calm-text-primary)] flex items-center justify-center">
        <CalmLoadingIndicator />
      </div>
    );
  }

  // 2. Moderation gate: If account is banned or suspended, lock out app
  if (user && profile && (profile.accountStatus === 'BANNED' || profile.accountStatus === 'SUSPENDED')) {
    return <AccountSuspendedPage />;
  }

  // 3. Password recovery route (accessible whether authenticated or during recovery flow)
  if (currentRoute.screen === 'reset_password') {
    return (
      <ResetPasswordPage
        onResetSuccess={() => {
          navigate('auth');
        }}
        onBackToLogin={() => {
          navigate('auth');
        }}
        onRequestNewLink={() => {
          navigate('forgot_password');
        }}
      />
    );
  }

  // 4. Unauthenticated views
  if (!user) {
    if (currentRoute.screen === 'forgot_password') {
      return (
        <ForgotPasswordPage
          onBack={() => navigate('auth')}
        />
      );
    }

    return (
      <AuthPage
        onAuthSuccess={async () => {
          await refreshProfile();
          navigate('main');
        }}
        onNavigateToForgotPassword={() => navigate('forgot_password')}
      />
    );
  }

  // 5. Authenticated views & sub-screens
  switch (currentRoute.screen) {
    case 'edit_profile':
      return (
        <EditProfilePage
          onBack={goBack}
          onProfileSaved={goBack}
          onAccountDeleted={() => navigate('auth')}
        />
      );

    case 'user_profile':
      return (
        <UserProfilePage
          userId={currentRoute.params?.userId || ''}
          onBack={goBack}
        />
      );

    case 'edit_post':
      return (
        <EditPostPage
          postId={currentRoute.params?.postId || ''}
          onBack={goBack}
          onPostUpdated={goBack}
        />
      );

    // Admin Flow
    case 'admin_dashboard':
      return (
        <AdminDashboardPage
          onBack={goBack}
          onNavigateToReports={() => navigate('admin_reports')}
          onNavigateToUsers={() => navigate('admin_users')}
          onNavigateToPosts={() => navigate('admin_posts')}
          onNavigateToHistory={() => navigate('admin_moderation_history')}
        />
      );

    case 'admin_reports':
      return (
        <AdminReportsPage
          onBack={goBack}
          onReportClick={(reportId) => navigate('admin_report_detail', { reportId })}
        />
      );

    case 'admin_report_detail':
      return (
        <AdminReportDetailPage
          reportId={currentRoute.params?.reportId || ''}
          onBack={goBack}
        />
      );

    case 'admin_users':
      return (
        <AdminUsersPage
          onBack={goBack}
          onUserClick={(userId) => navigate('admin_user_detail', { userId })}
        />
      );

    case 'admin_user_detail':
      return (
        <AdminUserDetailPage
          userId={currentRoute.params?.userId || ''}
          onBack={goBack}
        />
      );

    case 'admin_posts':
      return (
        <AdminPostsPage
          onBack={goBack}
        />
      );

    case 'admin_moderation_history':
      return (
        <AdminAuditLogsPage
          onBack={goBack}
        />
      );

    case 'main':
    default:
      return (
        <MainScaffold
          onNavigateToUserProfile={(userId) => navigate('user_profile', { userId })}
          onNavigateToEditProfile={() => navigate('edit_profile')}
          onNavigateToEditPost={(postId) => navigate('edit_post', { postId })}
          onNavigateToAdminDashboard={() => navigate('admin_dashboard')}
          onLogout={() => navigate('auth')}
        />
      );
  }
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
