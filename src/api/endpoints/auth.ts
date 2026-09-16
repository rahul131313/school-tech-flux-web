/* ============================================================
   SchoolConnect — Auth API Endpoints
   Typed API functions for authentication.
   All components access these via TanStack Query hooks — never
   imported directly into a component.
   ============================================================ */

import { apiClient } from '../client';
import type {
  ApiResponse,
  BrandingConfig,
  CurrentUserResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  ResetPasswordRequest,
} from '../types';

const AUTH_BASE = '/v1/auth';
const BRANDING_BASE = '/v1/branding';

export const authApi = {
  /**
   * Authenticate a user with email and password.
   * POST /api/v1/auth/login
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      `${AUTH_BASE}/login`,
      data
    );
    return response.data.data;
  },

  /**
   * Request a password reset email.
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(
      `${AUTH_BASE}/forgot-password`,
      data
    );
    return response.data.data;
  },

  /**
   * Reset password with a token received via email.
   * POST /api/v1/auth/reset-password
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(
      `${AUTH_BASE}/reset-password`,
      data
    );
    return response.data.data;
  },

  /**
   * Get the currently authenticated user's profile and permissions.
   * GET /api/v1/auth/me
   */
  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    const response = await apiClient.get<ApiResponse<CurrentUserResponse>>(
      `${AUTH_BASE}/me`
    );
    return response.data.data;
  },

  /**
   * Log out the current user (invalidate tokens server-side).
   * POST /api/v1/auth/logout
   */
  logout: async (): Promise<MessageResponse> => {
    const response = await apiClient.post<ApiResponse<MessageResponse>>(
      `${AUTH_BASE}/logout`
    );
    return response.data.data;
  },

  /**
   * Fetch branding config for a tenant.
   * GET /api/v1/branding/:tenantId
   */
  getBranding: async (tenantId: string): Promise<BrandingConfig> => {
    const response = await apiClient.get<ApiResponse<BrandingConfig>>(
      `${BRANDING_BASE}/${tenantId}`
    );
    return response.data.data;
  },
};
