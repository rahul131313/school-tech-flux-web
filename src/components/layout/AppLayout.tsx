/* ============================================================
   AppLayout — Main application shell
   Composes Sidebar + TopBar + content area.
   Applied to all authenticated routes.
   ============================================================ */

import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SuperAdminSchoolBanner } from './SuperAdminSchoolBanner';
import { useUiStore } from '../../stores/uiStore';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  title?: string;
}

export function AppLayout({ title }: AppLayoutProps) {
  const { mobileMenuOpen, setMobileMenuOpen } = useUiStore();

  return (
    <div className={styles.layout}>
      <Sidebar />
      {mobileMenuOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <div className={styles.mainArea}>
        <TopBar title={title} />
        <SuperAdminSchoolBanner />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
