/* ============================================================
   SchoolConnect — API Type Definitions
   Standard envelopes, pagination, and shared types.
   These will be replaced by auto-generated types once the
   backend publishes their OpenAPI spec.
   ============================================================ */

// ─── Standard Error Envelope ────────────────────────────────
// Every backend error response follows this exact shape.
export interface ApiError {
  success: false;
  errorCode: string;
  message: string;
  fieldErrors: Record<string, string>;
  traceId: string;
}

// ─── Standard Success Envelope ──────────────────────────────
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// ─── Pagination ─────────────────────────────────────────────
export interface PageRequest {
  page: number;
  size: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ─── User & Auth Types ──────────────────────────────────────
export type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'TEACHER'
  | 'ACCOUNTANT'
  | 'LIBRARIAN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  tenantId: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  permissions: string[];
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

export interface CurrentUserResponse {
  user: User;
  permissions: string[];
}

// ─── Branding / Tenant Config ───────────────────────────────
export interface BrandingConfig {
  tenantId: string;
  schoolName: string;
  tagline?: string;
  logoUrl?: string;
  accentColor?: string;
  faviconUrl?: string;
}

// ─── Type Guard ─────────────────────────────────────────────
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    (error as ApiError).success === false &&
    'errorCode' in error &&
    'message' in error
  );
}
