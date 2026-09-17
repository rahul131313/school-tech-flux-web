/* ============================================================
   SchoolConnect — Auth Store (Zustand)
   Manages user session, tokens, and permissions.
   Persisted to localStorage for seamless session management.
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setTokens, clearTokens } from '../api/client';
import type { AuthUser, ChildInfo, TokenResponse, UserRole } from '../api/types';

interface AuthState {
  user: AuthUser | null;
  activeChild: ChildInfo | null;
  children: ChildInfo[];
  permissions: string[];
  isAuthenticated: boolean;
  isHydrating: boolean;
  accessToken: string | null;
  refreshToken: string | null;

  // Actions
  setSession: (tokens: TokenResponse) => void;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string, permissions?: string[]) => void;
  setActiveChild: (child: ChildInfo) => void;
  setChildren: (children: ChildInfo[]) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  selectSchool: (schoolId: string, accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  setHydrating: (isHydrating: boolean) => void;

  // Derived helpers
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      activeChild: null,
      children: [],
      permissions: [],
      isAuthenticated: false,
      isHydrating: false,
      accessToken: null,
      refreshToken: null,

      setSession: (tokenResponse) => {
        setTokens(tokenResponse.accessToken, tokenResponse.refreshToken);
        const resolvedUser: AuthUser = tokenResponse.user || {
          id: tokenResponse.userId || '',
          role: (tokenResponse.role as UserRole) || 'SCHOOL_ADMIN',
          schoolId: tokenResponse.schoolId,
        };
        set({
          user: resolvedUser,
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          isAuthenticated: true,
          isHydrating: false,
        });
      },

      setAuth: (user, accessToken, refreshToken, permissions = []) => {
        setTokens(accessToken, refreshToken);
        set({
          user,
          permissions,
          isAuthenticated: true,
          isHydrating: false,
          accessToken,
          refreshToken,
        });
      },

      setActiveChild: (child) => set({ activeChild: child }),

      setChildren: (children) => set({ children }),

      updateUser: (partial) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...partial } });
        }
      },

      selectSchool: (schoolId, accessToken, refreshToken) => {
        const current = get().user;
        const finalRefreshToken = refreshToken || get().refreshToken;
        setTokens(accessToken, finalRefreshToken);
        if (current) {
          set({
            user: { ...current, schoolId },
            accessToken,
            refreshToken: finalRefreshToken,
          });
        }
      },

      clearAuth: () => {
        clearTokens();
        set({
          user: null,
          activeChild: null,
          children: [],
          permissions: [],
          isAuthenticated: false,
          isHydrating: false,
          accessToken: null,
          refreshToken: null,
        });
      },

      setHydrating: (isHydrating) => set({ isHydrating }),

      hasPermission: (permission) => get().permissions.includes(permission),

      hasRole: (role) => get().user?.role === role,
    }),
    {
      name: 'schoolconnect_auth',
      partialize: (state) => ({
        user: state.user,
        activeChild: state.activeChild,
        children: state.children,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setTokens(state.accessToken, state.refreshToken);
        }
        if (state) {
          state.isHydrating = false;
        }
      },
    }
  )
);
