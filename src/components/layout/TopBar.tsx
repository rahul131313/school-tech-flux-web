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
import { Bell, LogOut, User, ChevronDown, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { clearTokens } from '../../api/client';
import { authApi } from '../../api/endpoints/auth';
import { notificationsApi } from '../../api/endpoints/notifications';
import { SetPasswordDialog } from '../dialog/SetPasswordDialog';
import { SchoolSwitcher } from './SchoolSwitcher';
import type { NotificationResponse } from '../../api/types';
import styles from './TopBar.module.css';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title = 'Dashboard' }: TopBarProps) {
  const { user, clearAuth, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSetPasswordOpen, setIsSetPasswordOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // In-app notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const list = await notificationsApi.mine();
      setNotifications(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Close popups on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
    clearAuth();
    clearTokens();
    navigate('/login', { replace: true });
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' as any } : n))
      );
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => n.status !== 'READ').length;

  const displayName = user
    ? user.name || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.phoneNumber || 'User')
    : 'User';

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.firstName
    ? `${user.firstName.charAt(0)}${user.lastName ? user.lastName.charAt(0) : ''}`
    : 'SC';

  return (
    <header className={styles.topbar}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.actions}>
        {/* Super Admin School Switcher */}
        <SchoolSwitcher />

        {/* Notification Bell */}
        <div className={styles.notifWrapper} ref={notifRef}>
          <button
            className={styles.iconBtn}
            aria-label="Notifications"
            title="Notifications"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className={styles.notifDot} />}
          </button>

          {notifOpen && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>
                Notifications ({unreadCount} unread)
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={styles.notifItem}
                    onClick={() => handleMarkRead(n.id)}
                    style={{ opacity: n.status === 'READ' ? 0.6 : 1 }}
                  >
                    <div className={styles.notifTitle}>{n.title}</div>
                    <div className={styles.notifBody}>{n.body}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

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
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  setDropdownOpen(false);
                  setIsSetPasswordOpen(true);
                }}
              >
                <Lock size={16} />
                <span>Set Password</span>
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

      <SetPasswordDialog
        isOpen={isSetPasswordOpen}
        onClose={() => setIsSetPasswordOpen(false)}
      />
    </header>
  );
}
