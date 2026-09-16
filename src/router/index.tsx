/* ============================================================
   Router Configuration — React Router v7
   ============================================================ */

import { createBrowserRouter } from 'react-router';
import { AuthGuard, PublicGuard } from './guards';
import { AppLayout } from '../components/layout/AppLayout';

// Auth pages (lazy loaded)
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';

// Placeholder Dashboard (will be replaced in the Dashboard module build)
function DashboardPage() {
  return (
    <div
      style={{
        padding: 'var(--space-6)',
      }}
    >
      <h2
        style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-4)',
        }}
      >
        Dashboard
      </h2>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Welcome to SchoolConnect. Module screens will be built in upcoming
        sessions.
      </p>
    </div>
  );
}

// 404 page
function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-6)',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-4xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-primary)',
        }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-text-secondary)',
        }}
      >
        Page not found
      </p>
      <a
        href="/"
        style={{
          color: 'var(--color-text-link)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Go to Dashboard
      </a>
    </div>
  );
}

export const router = createBrowserRouter([
  // ── Public Routes (redirect to / if already authenticated) ──
  {
    element: <PublicGuard />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: '/reset-password/:token',
        element: <ResetPasswordPage />,
      },
    ],
  },

  // ── Authenticated Routes ──────────────────────────────────
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/',
            element: <DashboardPage />,
          },
          // Future module routes will be added here:
          // { path: '/students', element: <StudentsPage /> },
          // { path: '/attendance', element: <AttendancePage /> },
          // { path: '/timetable', element: <TimetablePage /> },
          // { path: '/exams', element: <ExamsPage /> },
          // { path: '/notices', element: <NoticesPage /> },
          // { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
