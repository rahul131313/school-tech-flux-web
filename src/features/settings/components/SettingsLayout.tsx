/* ============================================================
   SettingsLayout — Sub-navigation layout for settings pages
   Tab-based navigation across all school structure resources.
   ============================================================ */

import { NavLink, Outlet } from 'react-router';
import {
  Building2,
  GitBranch,
  Calendar,
  Layers,
  LayoutGrid,
  BookOpen,
  Clock,
  UserCheck,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import styles from './SettingsLayout.module.css';

interface SettingsTab {
  label: string;
  path: string;
  icon: LucideIcon;
}

const TABS: SettingsTab[] = [
  { label: 'Schools', path: '/settings/schools', icon: Building2 },
  { label: 'Branches', path: '/settings/branches', icon: GitBranch },
  { label: 'Academic Years', path: '/settings/academic-years', icon: Calendar },
  { label: 'Standards', path: '/settings/standards', icon: Layers },
  { label: 'Sections', path: '/settings/sections', icon: LayoutGrid },
  { label: 'Subjects', path: '/settings/subjects', icon: BookOpen },
  { label: 'Timetable Slots', path: '/settings/timetable-slots', icon: Clock },
  { label: 'Enrollments', path: '/settings/enrollments', icon: UserCheck },
  { label: 'Permissions', path: '/settings/permissions', icon: ShieldCheck },
];

export function SettingsLayout() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Settings</h2>
        <p className={styles.subtitle}>
          Manage your school structure and configuration
        </p>
      </div>

      <nav className={styles.tabs} aria-label="Settings navigation">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `${styles.tab} ${isActive ? styles.tabActive : ''}`
              }
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
