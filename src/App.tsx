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

function sanitizeReturnTo(path?: string | null): string {
  if (!path) return '/';
  const trimmed = path.trim();
  // Strictly allow relative paths starting with a single '/'
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\') && !trimmed.includes(':')) {
    const validPrefixes = ['/create', '/profile', '/settings', '/edit-profile', '/admin', '/posts', '/'];
    if (validPrefixes.some((p) => trimmed === p || trimmed.startsWith(p + '?') || trimmed.startsWith(p + '/'))) {
      return trimmed;
    }
  }
  return '/';
}

function routeFromLocation(): RouteState {
  const hash = window.location.hash;
  const search = window.location.search;
  const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  const searchParams = new URLSearchParams(search);

  if (hash.includes('type=recovery') || hash.includes('access_token=') || search.includes('type=recovery')) {
    return { screen: 'reset_password' };
  }

  if (pathname === '/login' || pathname === '/auth') {
    const rawReturnTo = searchParams.get('returnTo');
    const returnTo = sanitizeReturnTo(rawReturnTo);
    return { screen: 'auth', params: returnTo !== '/' ? { returnTo } : undefined };
  }

  if (pathname === '/forgot-password') {
    return { screen: 'forgot_password' };
  }

  if (pathname === '/reset-password') {
    return { screen: 'reset_password' };
  }

  if (pathname === '/create') {
    return { screen: 'create' };
  }

  if (pathname === '/profile') {
    return { screen: 'profile' };
  }

  if (pathname === '/settings' || pathname === '/edit-profile') {
    return { screen: 'edit_profile' };
  }

  if (pathname === '/admin' || pathname === '/admin/dashboard') {
    return { screen: 'admin_dashboard' };
  }

  if (pathname === '/admin/reports') {
    return { screen: 'admin_reports' };
  }

  if (pathname === '/admin/report-detail') {
    return { screen: 'admin_report_detail', params: { reportId: searchParams.get('reportId') || '' } };
  }

  if (pathname === '/admin/users') {
    return { screen: 'admin_users' };
  }

  if (pathname === '/admin/user-detail') {
    return { screen: 'admin_user_detail', params: { userId: searchParams.get('userId') || '' } };
  }

  if (pathname === '/admin/posts') {
    return { screen: 'admin_posts' };
  }

  if (pathname === '/admin/moderation-history' || pathname === '/admin/history') {
    return { screen: 'admin_moderation_history' };
  }

  return { screen: 'main' };
}

function locationFromRoute(route: RouteState): string {
  switch (route.screen) {
    case 'auth':
      return route.params?.returnTo
        ? `/login?returnTo=${encodeURIComponent(route.params.returnTo)}`
        : '/login';
    case 'forgot_password':
      return '/forgot-password';
    case 'reset_password':
      return '/reset-password';
    case 'create':
      return '/create';
    case 'profile':
      return '/profile';
    case 'edit_profile':
      return '/settings';
    case 'admin_dashboard':
      return '/admin';
    case 'admin_reports':
      return '/admin/reports';
    case 'admin_report_detail':
      return `/admin/report-detail?reportId=${encodeURIComponent(route.params?.reportId || '')}`;
    case 'admin_users':
      return '/admin/users';
    case 'admin_user_detail':
      return `/admin/user-detail?userId=${encodeURIComponent(route.params?.userId || '')}`;
    case 'admin_posts':
      return '/admin/posts';
    case 'admin_moderation_history':
      return '/admin/moderation-history';
    case 'main':
    default:
      return '/';
  }
}

const AppContent: React.FC = () => {
  const { user, profile, isAdmin, isLoading, refreshProfile } = useAuth();

  // Route State initialized from current browser URL
  const [currentRoute, setCurrentRoute] = useState<RouteState>(() => routeFromLocation());

  // History listener for browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.screen) {
        setCurrentRoute(event.state as RouteState);
      } else {
        setCurrentRoute(routeFromLocation());
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate helper that synchronizes browser URL and history
  const navigate = useCallback((screen: string, params?: Record<string, string>, replace: boolean = false) => {
    const newRoute: RouteState = { screen, params };
    const targetUrl = locationFromRoute(newRoute);
    setCurrentRoute(newRoute);
    if (replace) {
      window.history.replaceState(newRoute, '', targetUrl);
    } else {
      window.history.pushState(newRoute, '', targetUrl);
    }
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('main');
    }
  }, [navigate]);

  const handleAuthSuccess = async (returnTo?: string) => {
    await refreshProfile();
    const safePath = sanitizeReturnTo(returnTo);
    if (safePath === '/create') {
      navigate('create', undefined, true);
    } else if (safePath === '/profile') {
      navigate('profile', undefined, true);
    } else if (safePath === '/settings' || safePath === '/edit-profile') {
      navigate('edit_profile', undefined, true);
    } else if (safePath.startsWith('/admin')) {
      navigate('admin_dashboard', undefined, true);
    } else {
      navigate('main', undefined, true);
    }
  };

  // 1. Initial authentication loading state (clean bootstrap state)
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

  // 3. Password recovery route
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

  // 4. UNAUTHENTICATED / GUEST EXPERIENCE
  if (!user) {
    if (currentRoute.screen === 'forgot_password') {
      return (
        <ForgotPasswordPage
          onBack={() => navigate('auth')}
        />
      );
    }

    if (currentRoute.screen === 'auth') {
      return (
        <AuthPage
          onAuthSuccess={() => handleAuthSuccess(currentRoute.params?.returnTo)}
          onNavigateToForgotPassword={() => navigate('forgot_password')}
          onBack={() => navigate('main')}
        />
      );
    }

    // Protected routes: redirect guest to login with safe returnTo
    if (currentRoute.screen === 'create') {
      return (
        <AuthPage
          onAuthSuccess={() => handleAuthSuccess('/create')}
          onNavigateToForgotPassword={() => navigate('forgot_password')}
          onBack={() => navigate('main')}
        />
      );
    }

    if (currentRoute.screen === 'profile') {
      return (
        <AuthPage
          onAuthSuccess={() => handleAuthSuccess('/profile')}
          onNavigateToForgotPassword={() => navigate('forgot_password')}
          onBack={() => navigate('main')}
        />
      );
    }

    if (currentRoute.screen === 'edit_profile') {
      return (
        <AuthPage
          onAuthSuccess={() => handleAuthSuccess('/settings')}
          onNavigateToForgotPassword={() => navigate('forgot_password')}
          onBack={() => navigate('main')}
        />
      );
    }

    if (currentRoute.screen.startsWith('admin')) {
      return (
        <AuthPage
          onAuthSuccess={() => handleAuthSuccess('/admin')}
          onNavigateToForgotPassword={() => navigate('forgot_password')}
          onBack={() => navigate('main')}
        />
      );
    }

    // Default Guest View: Root Public Feed
    return (
      <MainScaffold
        isGuest={true}
        onSignIn={() => navigate('auth')}
        onNavigateToUserProfile={() => {}}
        onNavigateToEditProfile={() => navigate('auth', { returnTo: '/settings' })}
        onNavigateToEditPost={() => {}}
        onNavigateToAdminDashboard={() => navigate('auth', { returnTo: '/admin' })}
        onLogout={() => {}}
      />
    );
  }

  // 5. AUTHENTICATED EXPERIENCE
  // If an authenticated user visits /login or /auth, return them to main
  if (currentRoute.screen === 'auth') {
    return (
      <MainScaffold
        isGuest={false}
        initialTab="POSTS"
        onNavigateToUserProfile={(userId) => navigate('user_profile', { userId })}
        onNavigateToEditProfile={() => navigate('edit_profile')}
        onNavigateToEditPost={(postId) => navigate('edit_post', { postId })}
        onNavigateToAdminDashboard={() => navigate('admin_dashboard')}
        onLogout={() => navigate('auth')}
      />
    );
  }

  switch (currentRoute.screen) {
    case 'create':
      return (
        <MainScaffold
          isGuest={false}
          initialTab="CREATE"
          onNavigateToUserProfile={(userId) => navigate('user_profile', { userId })}
          onNavigateToEditProfile={() => navigate('edit_profile')}
          onNavigateToEditPost={(postId) => navigate('edit_post', { postId })}
          onNavigateToAdminDashboard={() => navigate('admin_dashboard')}
          onLogout={() => navigate('auth')}
        />
      );

    case 'profile':
      return (
        <MainScaffold
          isGuest={false}
          initialTab="PROFILE"
          onNavigateToUserProfile={(userId) => navigate('user_profile', { userId })}
          onNavigateToEditProfile={() => navigate('edit_profile')}
          onNavigateToEditPost={(postId) => navigate('edit_post', { postId })}
          onNavigateToAdminDashboard={() => navigate('admin_dashboard')}
          onLogout={() => navigate('auth')}
        />
      );

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

    // Admin Flow (Protected by isAdmin)
    case 'admin_dashboard':
      if (!isAdmin) {
        return (
          <MainScaffold
            isGuest={false}
            onNavigateToUserProfile={(userId) => navigate('user_profile', { userId })}
            onNavigateToEditProfile={() => navigate('edit_profile')}
            onNavigateToEditPost={(postId) => navigate('edit_post', { postId })}
            onNavigateToAdminDashboard={() => navigate('admin_dashboard')}
            onLogout={() => navigate('auth')}
          />
        );
      }
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
      if (!isAdmin) return null;
      return (
        <AdminReportsPage
          onBack={goBack}
          onReportClick={(reportId) => navigate('admin_report_detail', { reportId })}
        />
      );

    case 'admin_report_detail':
      if (!isAdmin) return null;
      return (
        <AdminReportDetailPage
          reportId={currentRoute.params?.reportId || ''}
          onBack={goBack}
        />
      );

    case 'admin_users':
      if (!isAdmin) return null;
      return (
        <AdminUsersPage
          onBack={goBack}
          onUserClick={(userId) => navigate('admin_user_detail', { userId })}
        />
      );

    case 'admin_user_detail':
      if (!isAdmin) return null;
      return (
        <AdminUserDetailPage
          userId={currentRoute.params?.userId || ''}
          onBack={goBack}
        />
      );

    case 'admin_posts':
      if (!isAdmin) return null;
      return (
        <AdminPostsPage
          onBack={goBack}
        />
      );

    case 'admin_moderation_history':
      if (!isAdmin) return null;
      return (
        <AdminAuditLogsPage
          onBack={goBack}
        />
      );

    case 'main':
    default:
      return (
        <MainScaffold
          isGuest={false}
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
