/* ============================================================
   usePasswordLogin — TanStack Query mutation for Web Password Login
   Calls POST /api/v1/auth/password/login
   ============================================================ */

import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authApi } from '../../../api/endpoints/auth';
import { useAuthStore } from '../../../stores/authStore';
import { useToast } from '../../../components/ui/Toast';
import {
  isApiError,
  normalizeFieldErrors,
  type ApiError,
  type PasswordLoginPayload,
  type TokenResponse,
} from '../../../api/types';

interface UsePasswordLoginOptions {
  onFieldErrors?: (errors: Record<string, string>) => void;
}

export function usePasswordLogin({ onFieldErrors }: UsePasswordLoginOptions = {}) {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: PasswordLoginPayload) => authApi.loginWithPassword(payload),

    onSuccess: (data: TokenResponse) => {
      setSession(data);
      toast.success(
        data.user?.name ? `Welcome back, ${data.user.name}!` : 'Signed in successfully!'
      );

      // Navigate by role
      const userRole = data.user?.role || data.role;
      if (userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN') {
        navigate('/settings/schools', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    },

    onError: (error: unknown) => {
      if (isApiError(error)) {
        const apiError = error as ApiError;
        const mappedErrors = normalizeFieldErrors(apiError.fieldErrors);

        if (Object.keys(mappedErrors).length > 0) {
          onFieldErrors?.(mappedErrors);
        }

        toast.error(apiError.message || 'Invalid credentials. Please try again.');
      } else {
        toast.error('An unexpected error occurred during password login.');
      }
    },
  });
}
