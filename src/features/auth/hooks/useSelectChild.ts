/* ============================================================
   useSelectChild — Hook for selecting active child in parent session
   Calls POST /api/v1/auth/select-child
   ============================================================ */

import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authApi } from '../../../api/endpoints/auth';
import { useAuthStore } from '../../../stores/authStore';
import { useToast } from '../../../components/ui/Toast';
import {
  isApiError,
  type ApiError,
  type ChildInfo,
  type SelectChildPayload,
  type TokenResponse,
} from '../../../api/types';

export function useSelectChild(selectedChild?: ChildInfo) {
  const navigate = useNavigate();
  const { setSession, setActiveChild } = useAuthStore();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: SelectChildPayload) => authApi.selectChild(payload),

    onSuccess: (data: TokenResponse) => {
      setSession(data);
      if (selectedChild) {
        setActiveChild(selectedChild);
      }
      toast.success(
        selectedChild?.name
          ? `Switched to ${selectedChild.name}`
          : 'Profile selected successfully'
      );
      navigate('/', { replace: true });
    },

    onError: (error: unknown) => {
      if (isApiError(error)) {
        const apiError = error as ApiError;
        toast.error(apiError.message || 'Failed to select child profile.');
      } else {
        toast.error('An unexpected error occurred.');
      }
    },
  });
}
