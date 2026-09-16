/* ============================================================
   useForgotPassword — TanStack Query mutation
   ============================================================ */

import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../../api/endpoints/auth';
import { useToast } from '../../../components/ui/Toast';
import type { ApiError, ForgotPasswordRequest } from '../../../api/types';
import { isApiError } from '../../../api/types';

interface UseForgotPasswordOptions {
  onFieldErrors?: (errors: Record<string, string>) => void;
  onSuccess?: () => void;
}

export function useForgotPassword({
  onFieldErrors,
  onSuccess,
}: UseForgotPasswordOptions = {}) {
  const toast = useToast();

  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) =>
      authApi.forgotPassword(data),

    onSuccess: () => {
      toast.success('Password reset email sent. Check your inbox.');
      onSuccess?.();
    },

    onError: (error: unknown) => {
      if (isApiError(error)) {
        const apiError = error as ApiError;
        if (
          apiError.fieldErrors &&
          Object.keys(apiError.fieldErrors).length > 0
        ) {
          onFieldErrors?.(apiError.fieldErrors);
        }
        toast.error(apiError.message || 'Failed to send reset email.');
      } else {
        toast.error('An unexpected error occurred.');
      }
    },
  });
}
