/* ============================================================
   useSetPassword — Mutation hook for setting/updating user password
   Calls POST /api/v1/auth/password/set
   Requires Bearer Authorization token
   ============================================================ */

import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../../api/endpoints/auth';
import { useToast } from '../../../components/ui/Toast';
import { isApiError, type ApiError, type SetPasswordPayload } from '../../../api/types';

interface UseSetPasswordOptions {
  onSuccess?: () => void;
}

export function useSetPassword({ onSuccess }: UseSetPasswordOptions = {}) {
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: SetPasswordPayload) => authApi.setPassword(payload),

    onSuccess: () => {
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
