/* ============================================================
   useRequestOtp — Mutation hook for requesting OTP
   Calls POST /api/v1/auth/otp/request
   Success: 204 No Content
   Failure: ApiError envelope with fieldErrors
   ============================================================ */

import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../../api/endpoints/auth';
import { useToast } from '../../../components/ui/Toast';
import {
  isApiError,
  normalizeFieldErrors,
  type ApiError,
  type OtpRequestPayload,
} from '../../../api/types';

interface UseRequestOtpOptions {
  onSuccess?: () => void;
  onFieldErrors?: (errors: Record<string, string>) => void;
}

export function useRequestOtp({ onSuccess, onFieldErrors }: UseRequestOtpOptions = {}) {
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: OtpRequestPayload) => authApi.requestOtp(payload),

    onSuccess: () => {
      toast.success('Verification code sent successfully!');
      onSuccess?.();
    },

    onError: (error: unknown) => {
      if (isApiError(error)) {
        const apiError = error as ApiError;
        const mappedErrors = normalizeFieldErrors(apiError.fieldErrors);

        if (Object.keys(mappedErrors).length > 0) {
          onFieldErrors?.(mappedErrors);
        }

        toast.error(
          apiError.message || 'Failed to send OTP. Please verify your details.'
        );
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    },
  });
}
