/* ============================================================
   Router Configuration — React Router v7
   ============================================================ */

import { createBrowserRouter, Navigate } from 'react-router';
import { AuthGuard, PublicGuard } from './guards';
import { AppLayout } from '../components/layout/AppLayout';

// Auth pages
import { LoginPage } from '../features/auth/pages/LoginPage';

// Core Application Modules
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { AttendancePage } from '../features/attendance/pages/AttendancePage';
import { TimetablePage } from '../features/timetable/pages/TimetablePage';
import { StudentsPage } from '../features/students/pages/StudentsPage';
import { ExamsPage } from '../features/academics/pages/ExamsPage';
import { HomeworkPage } from '../features/academics/pages/HomeworkPage';
import { RemarksPage } from '../features/academics/pages/RemarksPage';
import { NoticesPage } from '../features/communication/pages/NoticesPage';
import { FeesPage } from '../features/fees/pages/FeesPage';

// Settings (School Structure & Configuration)
import { SettingsLayout } from '../features/settings/components/SettingsLayout';
import { SchoolsPage } from '../features/settings/pages/SchoolsPage';
import { BranchesPage } from '../features/settings/pages/BranchesPage';
import { AcademicYearsPage } from '../features/settings/pages/AcademicYearsPage';
import { StandardsPage } from '../features/settings/pages/StandardsPage';
import { SectionsPage } from '../features/settings/pages/SectionsPage';
import { SubjectsPage } from '../features/settings/pages/SubjectsPage';
import { TimetableSlotsPage } from '../features/settings/pages/TimetableSlotsPage';
import { StudentEnrollmentsPage } from '../features/settings/pages/StudentEnrollmentsPage';
import { RolePermissionsPage } from '../features/settings/pages/RolePermissionsPage';
import { SchoolBrandingPage } from '../features/settings/pages/SchoolBrandingPage';
import { SchoolModulesPage } from '../features/settings/pages/SchoolModulesPage';
import { HolidaysPage } from '../features/settings/pages/HolidaysPage';
import { PayrollConfigPage } from '../features/settings/pages/PayrollConfigPage';
import { ProfilePage } from '../features/settings/pages/ProfilePage';

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
    ],
  },

  // ── Authenticated Routes ──────────────────────────────────
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // ── Main Dashboard ──────────────────────────────
          {
            path: '/',
            element: <DashboardPage />,
          },

          // ── Academics Modules ────────────────────────────
          {
            path: '/students',
            element: <StudentsPage />,
          },
          {
            path: '/attendance',
            element: <AttendancePage />,
          },
          {
            path: '/timetable',
            element: <TimetablePage />,
          },
          {
            path: '/exams',
            element: <ExamsPage />,
          },
          {
            path: '/homework',
            element: <HomeworkPage />,
          },
          {
            path: '/remarks',
            element: <RemarksPage />,
          },
          {
            path: '/holidays',
            element: <HolidaysPage />,
          },
          {
            path: '/calendar',
            element: <HolidaysPage />,
          },

          // ── Finance & Billing ────────────────────────────
          {
            path: '/fees',
            element: <FeesPage />,
          },

          // ── Communication Modules ────────────────────────
          {
            path: '/notices',
            element: <NoticesPage />,
          },

          // ── Settings (School Structure & Configuration) ──
          {
            path: '/settings',
            element: <SettingsLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="/settings/schools" replace />,
              },
              { path: 'schools', element: <SchoolsPage /> },
              { path: 'branches', element: <BranchesPage /> },
              { path: 'academic-years', element: <AcademicYearsPage /> },
              { path: 'standards', element: <StandardsPage /> },
              { path: 'sections', element: <SectionsPage /> },
              { path: 'subjects', element: <SubjectsPage /> },
              { path: 'timetable-slots', element: <TimetableSlotsPage /> },
              { path: 'enrollments', element: <StudentEnrollmentsPage /> },
              { path: 'permissions', element: <RolePermissionsPage /> },
              { path: 'users', element: <Navigate to="/settings/permissions?tab=users" replace /> },
              { path: 'branding', element: <SchoolBrandingPage /> },
              { path: 'modules', element: <SchoolModulesPage /> },
              { path: 'holidays', element: <HolidaysPage /> },
              { path: 'payroll', element: <PayrollConfigPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
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
