/* ============================================================
   Sidebar — Persistent left navigation
   Features:
   - Role-based nav items
   - School logo + name (from branding)
   - Collapsible (icon-only mode)
   - Active route highlighting
   - Grouped nav sections
   ============================================================ */

import { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Clock,
  GraduationCap,
  Megaphone,
  Settings,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permissions?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Academics',
    items: [
      { label: 'Students', path: '/students', icon: Users, permissions: ['STUDENT_VIEW'] },
      { label: 'Attendance', path: '/attendance', icon: CalendarCheck, permissions: ['ATTENDANCE_VIEW'] },
      { label: 'Timetable', path: '/timetable', icon: Clock, permissions: ['TIMETABLE_VIEW'] },
      { label: 'Exams & Grades', path: '/exams', icon: GraduationCap, permissions: ['EXAM_VIEW'] },
    ],
  },
  {
    title: 'Communication',
    items: [
      { label: 'Notices', path: '/notices', icon: Megaphone, permissions: ['NOTICE_VIEW'] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Settings', path: '/settings', icon: Settings, permissions: ['SETTINGS_VIEW'] },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { permissions, user } = useAuthStore();
  const { schoolName, logoUrl } = useThemeStore();
  const location = useLocation();

  // Filter nav items by user permissions
  const filteredGroups = useMemo(() => {
    const isFullAccess =
      !user?.role ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'SCHOOL_ADMIN' ||
      permissions.length === 0;

    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.permissions || isFullAccess) return true;
        return item.permissions.some((p) => permissions.includes(p));
      }),
    })).filter((group) => group.items.length > 0);
  }, [permissions, user?.role]);

  return (
    <aside
      className={styles.sidebar}
      data-collapsed={collapsed || undefined}
      aria-label="Main navigation"
    >
      {/* Brand Header */}
      <div className={styles.brand}>
        <div className={styles.logoWrapper}>
          {logoUrl ? (
            <img src={logoUrl} alt={schoolName} className={styles.logo} />
          ) : (
            <div className={styles.logoFallback}>
              {schoolName.charAt(0)}
            </div>
          )}
        </div>
        {!collapsed && (
          <div className={styles.brandText}>
            <span className={styles.schoolName}>{schoolName}</span>
            {user?.role && (
              <span className={styles.roleBadge}>
                {user.role.replace('_', ' ')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {filteredGroups.map((group) => (
          <div key={group.title} className={styles.group}>
            {!collapsed && (
              <span className={styles.groupTitle}>{group.title}</span>
            )}
            <ul className={styles.list}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={`${styles.link} ${isActive ? styles.active : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={20} className={styles.icon} />
                      {!collapsed && (
                        <span className={styles.linkLabel}>{item.label}</span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        className={styles.collapseBtn}
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
