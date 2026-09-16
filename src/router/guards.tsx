/* ============================================================
   Route Guards — AuthGuard, PublicGuard, RoleGuard
   ============================================================ */

import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { Spinner } from '../components/feedback/Spinner';
import type { UserRole } from '../api/types';

/**
 * AuthGuard — protects authenticated routes.
 * If not authenticated, redirects to /login (preserving intended destination).
 * While hydrating (checking stored token on app mount), shows a full-screen spinner.
 */
export function AuthGuard() {
  const { isAuthenticated, isHydrating } = useAuthStore();
  const location = useLocation();

  if (isHydrating) {
    return <Spinner fullScreen label="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/**
 * PublicGuard — protects public-only routes (login, forgot password).
 * If already authenticated, redirects to dashboard.
 */
export function PublicGuard() {
  const { isAuthenticated, isHydrating } = useAuthStore();

  if (isHydrating) {
    return <Spinner fullScreen label="Loading..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/**
 * RoleGuard — restricts access to specific roles.
 * Shows a 403 page if the user doesn't have the required role.
 */
interface RoleGuardProps {
  allowedRoles: UserRole[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-16)',
          textAlign: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
          }}
        >
          403
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-text-secondary)',
          }}
        >
          You don&rsquo;t have permission to access this page.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
