/* ============================================================
   useLogin — TanStack Query mutation for login
   Handles:
   - Calling authApi.login()
   - Storing tokens + user in authStore
   - Fetching branding config
   - Navigating to dashboard
   - Mapping fieldErrors to form + message to toast
   ============================================================ */

import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authApi } from '../../../api/endpoints/auth';
import { useAuthStore } from '../../../stores/authStore';
import { useThemeStore } from '../../../stores/themeStore';
import { useToast } from '../../../components/ui/Toast';
import type { ApiError, LoginRequest } from '../../../api/types';
import { isApiError } from '../../../api/types';

interface UseLoginOptions {
  onFieldErrors?: (errors: Record<string, string>) => void;
}

export function useLogin({ onFieldErrors }: UseLoginOptions = {}) {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { setBranding } = useThemeStore();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),

    onSuccess: async (data) => {
      // 1. Store auth state
      setAuth(data.user, data.accessToken, data.refreshToken, data.permissions);

      // 2. Fetch branding (non-blocking — don't fail login if this fails)
      try {
        const branding = await authApi.getBranding(data.user.tenantId);
        setBranding(branding);
      } catch {
        // Branding fetch failed — use defaults
        console.warn('Branding fetch failed, using defaults');
      }

      // 3. Navigate to dashboard
      toast.success(`Welcome back, ${data.user.firstName}!`);
      navigate('/', { replace: true });
    },

    onError: (error: unknown) => {
      if (isApiError(error)) {
        const apiError = error as ApiError;

        // Map fieldErrors to form inputs
        if (
          apiError.fieldErrors &&
          Object.keys(apiError.fieldErrors).length > 0
        ) {
          onFieldErrors?.(apiError.fieldErrors);
        }

        // Show top-level message as toast
        toast.error(apiError.message || 'Login failed. Please try again.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    },
  });
}
