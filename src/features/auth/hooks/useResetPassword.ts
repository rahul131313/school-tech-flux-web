/* ============================================================
   useResetPassword — TanStack Query mutation
   ============================================================ */

import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authApi } from '../../../api/endpoints/auth';
import { useToast } from '../../../components/ui/Toast';
import type { ApiError, ResetPasswordRequest } from '../../../api/types';
import { isApiError } from '../../../api/types';

interface UseResetPasswordOptions {
  onFieldErrors?: (errors: Record<string, string>) => void;
}

export function useResetPassword({
  onFieldErrors,
}: UseResetPasswordOptions = {}) {
  const navigate = useNavigate();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) =>
      authApi.resetPassword(data),

    onSuccess: () => {
      toast.success('Password reset successful. Please log in.');
      navigate('/login', { replace: true });
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
        toast.error(apiError.message || 'Failed to reset password.');
      } else {
        toast.error('An unexpected error occurred.');
      }
    },
  });
}
