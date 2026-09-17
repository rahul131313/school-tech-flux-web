/* ============================================================
   SchoolConnect — Axios API Client
   Single Axios instance with:
   - Auth token injection
   - Global 401 interceptor → redirect to login
   - Token refresh on 401 (if refresh token available)
   - Transform errors into typed ApiError objects
   ============================================================ */

import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError, ApiResponse, TokenResponse } from './types';

// ─── Axios Instance ─────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Token Management ───────────────────────────────────────
// Access token kept in memory (not localStorage) for security.
// We import/export functions so the auth store can set it.
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string | null, refresh: string | null): void {
  accessToken = access;
  refreshToken = refresh;
}

export function getAccessToken(): string | null {
  if (!accessToken) {
    try {
      const stored = localStorage.getItem('schoolconnect_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.accessToken) {
          accessToken = parsed.state.accessToken;
          refreshToken = parsed.state.refreshToken;
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  return accessToken;
}

export function getRefreshToken(): string | null {
  if (!refreshToken) {
    try {
      const stored = localStorage.getItem('schoolconnect_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.refreshToken) {
          accessToken = parsed.state.accessToken;
          refreshToken = parsed.state.refreshToken;
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  return refreshToken;
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  try {
    localStorage.removeItem('schoolconnect_auth');
  } catch {
    // ignore
  }
}

// ─── Request Interceptor ────────────────────────────────────
// Attach Bearer token and X-Trace-Id to every outgoing request.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.headers) {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      if (!config.headers['X-Trace-Id']) {
        config.headers['X-Trace-Id'] =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────────────
// Global 401 handler with token refresh attempt.
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: AxiosRequestConfig;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (token) {
      if (config.headers) {
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }
      resolve(apiClient(config));
    } else {
      reject(error);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 — attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request to retry after refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;

      const currentRefreshToken = refreshToken || getRefreshToken();
      if (currentRefreshToken) {
        isRefreshing = true;

        try {
          const response = await axios.post<TokenResponse | ApiResponse<TokenResponse>>(
            `${apiClient.defaults.baseURL}/v1/auth/refresh`,
            { refreshToken: currentRefreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const payload = response.data;
          const newTokens: TokenResponse = 'data' in payload ? (payload.data as TokenResponse) : payload;
          setTokens(newTokens.accessToken, newTokens.refreshToken);

          processQueue(null, newTokens.accessToken);
          isRefreshing = false;

          // Retry the original request with the new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          }
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          // Refresh failed — clear everything and redirect to login
          clearTokens();
          redirectToLogin();
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available — redirect to login
        clearTokens();
        redirectToLogin();
      }
    }

    // Transform error response into typed ApiError
    if (error.response?.data && typeof error.response.data === 'object') {
      return Promise.reject(error.response.data);
    }

    // Network error or timeout — create a synthetic ApiError
    const syntheticError: ApiError = {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: error.message || 'A network error occurred. Please try again.',
      fieldErrors: {},
      traceId: '',
    };

    return Promise.reject(syntheticError);
  }
);

// ─── Redirect Helper ────────────────────────────────────────
function redirectToLogin(): void {
  try {
    localStorage.removeItem('schoolconnect_auth');
  } catch {
    // Ignore storage errors
  }
  // Avoid redirect if already on login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}
