/* ============================================================
   SettingsLayout — Sub-navigation layout for settings pages
   Tab-based navigation across all school structure resources.
   Fully responsive with smooth scrolling, chevron controls,
   wheel conversion, and drag-to-scroll.
   ============================================================ */

import { useState, useRef, useEffect, useCallback, type WheelEvent } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
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
  Palette,
  Boxes,
  CalendarDays,
  Banknote,
  ChevronLeft,
  ChevronRight,
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
  { label: 'Users, Roles & Security', path: '/settings/permissions', icon: ShieldCheck },
  { label: 'Branding', path: '/settings/branding', icon: Palette },
  { label: 'Feature Modules', path: '/settings/modules', icon: Boxes },
  { label: 'Holidays', path: '/settings/holidays', icon: CalendarDays },
  { label: 'Payroll Config', path: '/settings/payroll', icon: Banknote },
];

export function SettingsLayout() {
  const location = useLocation();
  const tabsRef = useRef<HTMLElement>(null);
  const activeTabRef = useRef<HTMLAnchorElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check whether tabs can scroll in either direction
  const updateScrollBounds = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    updateScrollBounds();
    const el = tabsRef.current;
    if (!el) return;

    const handleResize = () => updateScrollBounds();
    window.addEventListener('resize', handleResize);
    el.addEventListener('scroll', updateScrollBounds, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      el.removeEventListener('scroll', updateScrollBounds);
    };
  }, [updateScrollBounds]);

  // Scroll active tab into view on route change or initial load
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      setTimeout(updateScrollBounds, 350);
    }
  }, [location.pathname, updateScrollBounds]);

  // Arrow click scroll
  const handleScrollClick = (direction: 'left' | 'right') => {
    if (!tabsRef.current) return;
    const offset = direction === 'left' ? -260 : 260;
    tabsRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Convert vertical mouse wheel into horizontal scroll on tabs container
  const handleWheel = (e: WheelEvent<HTMLElement>) => {
    if (!tabsRef.current) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      tabsRef.current.scrollLeft += e.deltaY;
    }
  };

  // Mouse drag-to-scroll support for desktop
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tabsRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - tabsRef.current.offsetLeft;
    scrollLeftStart.current = tabsRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !tabsRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabsRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    tabsRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Settings</h2>
        <p className={styles.subtitle}>
          Manage your school structure and configuration
        </p>
      </div>

      {/* Scrollable Tabs Bar with Controls & Fade Masks */}
      <div className={styles.tabsWrapper}>
        {canScrollLeft && (
          <>
            <div className={styles.fadeLeft} aria-hidden="true" />
            <button
              type="button"
              className={`${styles.scrollBtn} ${styles.scrollBtnLeft}`}
              onClick={() => handleScrollClick('left')}
              aria-label="Scroll tabs left"
              title="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        )}

        <nav
          ref={tabsRef}
          className={styles.tabs}
          aria-label="Settings navigation"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = location.pathname.startsWith(tab.path);

            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                ref={isTabActive ? activeTabRef : undefined}
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

        {canScrollRight && (
          <>
            <div className={styles.fadeRight} aria-hidden="true" />
            <button
              type="button"
              className={`${styles.scrollBtn} ${styles.scrollBtnRight}`}
              onClick={() => handleScrollClick('right')}
              aria-label="Scroll tabs right"
              title="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
