/* ============================================================
   SchoolConnect — Auth API Endpoints (Passwordless OTP Model)
   Typed API functions for OTP authentication.
   ============================================================ */

import { apiClient, getRefreshToken } from '../client';
import type {
  BrandingConfig,
  OtpRequestPayload,
  OtpVerifyPayload,
  OtpVerifyResponse,
  PasswordLoginPayload,
  SelectChildPayload,
  SelectSchoolPayload,
  SetPasswordPayload,
  TokenResponse,
} from '../types';

const AUTH_BASE = '/v1/auth';
const BRANDING_BASE = '/v1/branding';

export const authApi = {
  /**
   * Platform Super Admin: Select a school tenant.
   * POST /api/v1/auth/select-school
   * Returns a tenant-scoped TokenResponse.
   */
  selectSchool: async (data: SelectSchoolPayload): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>(
      `${AUTH_BASE}/select-school`,
      data
    );
    return response.data;
  },

  /**
   * Log in with phone number and password on web.
   * POST /api/v1/auth/password/login
   */
  loginWithPassword: async (data: PasswordLoginPayload): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>(
      `${AUTH_BASE}/password/login`,
      data
    );
    return response.data;
  },

  /**
   * Set or update password for the authenticated user.
   * POST /api/v1/auth/password/set
   * Result: 204 No Content; requires access token
   */
  setPassword: async (data: SetPasswordPayload): Promise<void> => {
    await apiClient.post(
      `${AUTH_BASE}/password/set`,
      data
    );
  },
  /**
   * Request a one-time password (OTP).
   * POST /api/v1/auth/otp/request
   * Expected response on success: 204 No Content
   */
  requestOtp: async (data: OtpRequestPayload): Promise<void> => {
    await apiClient.post(`${AUTH_BASE}/otp/request`, data);
  },

  /**
   * Verify the 6-digit OTP.
   * POST /api/v1/auth/otp/verify
   * Returns TokenResponse, or ChildSelectionResponse if multiple children exist.
   */
  verifyOtp: async (data: OtpVerifyPayload): Promise<OtpVerifyResponse> => {
    const response = await apiClient.post<OtpVerifyResponse>(
      `${AUTH_BASE}/otp/verify`,
      data
    );
    return response.data;
  },

  /**
   * Select a child for parent accounts.
   * POST /api/v1/auth/select-child
   */
  selectChild: async (data: SelectChildPayload): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>(
      `${AUTH_BASE}/select-child`,
      data
    );
    return response.data;
  },

  /**
   * Switch the active child profile.
   * POST /api/v1/auth/switch-child
   */
  switchChild: async (data: SelectChildPayload): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>(
      `${AUTH_BASE}/switch-child`,
      data
    );
    return response.data;
  },

  /**
   * Refresh session tokens.
   * POST /api/v1/auth/refresh
   */
  refresh: async (token?: string): Promise<TokenResponse> => {
    const tokenToSend = token || getRefreshToken();
    const response = await apiClient.post<TokenResponse>(
      `${AUTH_BASE}/refresh`,
      { refreshToken: tokenToSend }
    );
    return response.data;
  },

  /**
   * Log out current session.
   * POST /api/v1/auth/logout
   */
  logout: async (refreshToken?: string): Promise<void> => {
    try {
      const token = refreshToken || getRefreshToken();
      await apiClient.post(`${AUTH_BASE}/logout`, { refreshToken: token });
    } catch {
      // Ignore errors on logout
    }
  },

  /**
   * Fetch tenant branding configuration.
   * GET /api/v1/branding/:tenantId
   */
  getBranding: async (tenantId: string): Promise<BrandingConfig> => {
    const response = await apiClient.get<BrandingConfig>(
      `${BRANDING_BASE}/${tenantId}`
    );
    return response.data;
  },
};
