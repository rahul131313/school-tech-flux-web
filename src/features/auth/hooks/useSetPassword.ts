/* ============================================================
   useSetPassword — Mutation hook for setting/updating user password
   Calls POST /api/v1/auth/password/set
   Requires Bearer Authorization token
   ============================================================ */

import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../../api/endpoints/auth';
import { useAuthStore } from '../../../stores/authStore';
import { useToast } from '../../../components/ui/Toast';
import { isApiError, type ApiError, type SetPasswordPayload, type TokenResponse } from '../../../api/types';

interface UseSetPasswordOptions {
  onSuccess?: () => void;
}

export function useSetPassword({ onSuccess }: UseSetPasswordOptions = {}) {
  const { setSession } = useAuthStore();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: SetPasswordPayload) => authApi.setPassword(payload),

    onSuccess: (data: TokenResponse) => {
      if (data.accessToken) {
        setSession(data);
      }
      toast.success('Password updated successfully!');
      onSuccess?.();
    },

    onError: (error: unknown) => {
      if (isApiError(error)) {
        const apiError = error as ApiError;
        toast.error(apiError.message || 'Failed to update password.');
      } else {
        toast.error('An unexpected error occurred while setting password.');
      }
    },
  });
}
