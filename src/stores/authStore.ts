/* ============================================================
   SchoolConnect — Auth Store (Zustand)
   Manages user session, tokens, and permissions.
   ============================================================ */

import { create } from 'zustand';
import { setTokens, clearTokens } from '../api/client';
import type { User, UserRole } from '../api/types';

interface AuthState {
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  isHydrating: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string, permissions: string[]) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
  setHydrating: (isHydrating: boolean) => void;

  // Derived helpers
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: [],
  isAuthenticated: false,
  isHydrating: true, // Start true — we check on app mount

  setAuth: (user, accessToken, refreshToken, permissions) => {
    setTokens(accessToken, refreshToken);
    set({
      user,
      permissions,
      isAuthenticated: true,
      isHydrating: false,
    });
  },

  updateUser: (partial) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...partial } });
    }
  },

  clearAuth: () => {
    clearTokens();
    set({
      user: null,
      permissions: [],
      isAuthenticated: false,
      isHydrating: false,
    });
  },

  setHydrating: (isHydrating) => set({ isHydrating }),

  hasPermission: (permission) => get().permissions.includes(permission),

  hasRole: (role) => get().user?.role === role,
}));
