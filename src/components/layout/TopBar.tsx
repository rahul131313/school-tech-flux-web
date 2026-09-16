/* ============================================================
   TopBar — Persistent top navigation bar
   Features:
   - Page title
   - User avatar + name + role badge
   - Notification bell (placeholder)
   - Logout dropdown
   ============================================================ */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { clearTokens } from '../../api/client';
import styles from './TopBar.module.css';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title = 'Dashboard' }: TopBarProps) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    clearTokens();
    navigate('/login', { replace: true });
  };

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : 'User';

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : 'U';

  return (
    <header className={styles.topbar}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.actions}>
        {/* Notification Bell */}
        <button
          className={styles.iconBtn}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={20} />
          {/* Notification dot — uncomment when wired */}
          {/* <span className={styles.notifDot} /> */}
        </button>

        {/* User Menu */}
        <div className={styles.userMenu} ref={dropdownRef}>
          <button
            className={styles.userBtn}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className={styles.avatar}>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className={styles.avatarImg}
                />
              ) : (
                <span className={styles.avatarInitials}>{initials}</span>
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userRole}>
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/settings/profile');
                }}
              >
                <User size={16} />
                <span>My Profile</span>
              </button>
              <div className={styles.divider} />
              <button
                className={`${styles.dropdownItem} ${styles.danger}`}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
