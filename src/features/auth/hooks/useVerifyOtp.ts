/* ============================================================
   useVerifyOtp — Mutation hook for verifying OTP
   Calls POST /api/v1/auth/otp/verify
   Success: TokenResponse (direct login) or ChildSelectionResponse
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
  type ChildInfo,
  type OtpVerifyPayload,
  type OtpVerifyResponse,
} from '../../../api/types';

interface UseVerifyOtpOptions {
  onChildSelectionRequired?: (children: ChildInfo[]) => void;
  onFieldErrors?: (errors: Record<string, string>) => void;
}

export function useVerifyOtp({
  onChildSelectionRequired,
  onFieldErrors,
}: UseVerifyOtpOptions = {}) {
  const navigate = useNavigate();
  const { setSession, setChildren } = useAuthStore();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: OtpVerifyPayload) => authApi.verifyOtp(payload),

    onSuccess: (data: OtpVerifyResponse) => {
      // Check if child selection is required for parent accounts
      if ('requiresChildSelection' in data && data.requiresChildSelection) {
        setChildren(data.children || []);
        onChildSelectionRequired?.(data.children || []);
        toast.success('Select a child profile to proceed');
        return;
      }

      // Standard token response
      if ('accessToken' in data) {
        setSession(data);
        toast.success(
          data.user?.name
            ? `Welcome, ${data.user.name}!`
            : 'Successfully signed in!'
        );

        // Role-based redirect
        if (data.user?.role === 'SCHOOL_ADMIN' || data.user?.role === 'SUPER_ADMIN') {
          navigate('/settings/schools', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    },

    onError: (error: unknown) => {
      if (isApiError(error)) {
        const apiError = error as ApiError;
        const mappedErrors = normalizeFieldErrors(apiError.fieldErrors);

        if (Object.keys(mappedErrors).length > 0) {
          onFieldErrors?.(mappedErrors);
        }

        toast.error(
          apiError.message || 'Invalid or expired OTP. Please try again.'
        );
      } else {
        toast.error('An unexpected error occurred during verification.');
      }
    },
  });
}
