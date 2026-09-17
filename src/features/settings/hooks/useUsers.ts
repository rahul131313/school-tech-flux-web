/* ============================================================
   useUsers — TanStack Query hooks for User Provisioning & Security
   Connected to Spring Boot:
   - POST  /api/v1/users
   - PUT   /api/v1/users/{id}/role
   - PATCH /api/v1/users/{id}/status
   - POST  /api/v1/users/{id}/revoke-sessions
   ============================================================ */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../../api/endpoints/users';
import { useToast } from '../../../components/ui/Toast';
import {
  isApiError,
  type ApiError,
  type UserCreateRequest,
  type UserResponse,
  type AccountStatus,
} from '../../../api/types';

const QUERY_KEY = 'users';

export function useCreateUser() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<UserResponse, ApiError | Error, UserCreateRequest>({
    mutationFn: (data: UserCreateRequest) => usersApi.create(data),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`User ${newUser.phoneNumber} created successfully!`);
    },
    onError: (error) => {
      if (isApiError(error)) {
        const trace = error.traceId ? ` [Trace: ${error.traceId}]` : '';
        toast.error(`${error.message || 'Failed to create user'}${trace}`);
      } else {
        toast.error(error.message || 'Failed to create user');
      }
    },
  });
}

export function useAssignUserRole() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<void, ApiError | Error, { userId: string; roleId: string }>({
    mutationFn: ({ userId, roleId }) => usersApi.assignRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Role assigned to user successfully');
    },
    onError: (error) => {
      if (isApiError(error)) {
        const trace = error.traceId ? ` [Trace: ${error.traceId}]` : '';
        toast.error(`${error.message || 'Failed to assign role'}${trace}`);
      } else {
        toast.error('Failed to assign role');
      }
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<void, ApiError | Error, { userId: string; status: AccountStatus }>({
    mutationFn: ({ userId, status }) => usersApi.updateStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('User status updated successfully');
    },
    onError: (error) => {
      if (isApiError(error)) {
        const trace = error.traceId ? ` [Trace: ${error.traceId}]` : '';
        toast.error(`${error.message || 'Failed to update status'}${trace}`);
      } else {
        toast.error('Failed to update status');
      }
    },
  });
}

export function useRevokeUserSessions() {
  const toast = useToast();

  return useMutation<void, ApiError | Error, string>({
    mutationFn: (userId: string) => usersApi.revokeSessions(userId),
    onSuccess: () => {
      toast.success('All active sessions revoked for user');
    },
    onError: (error) => {
      if (isApiError(error)) {
        const trace = error.traceId ? ` [Trace: ${error.traceId}]` : '';
        toast.error(`${error.message || 'Failed to revoke sessions'}${trace}`);
      } else {
        toast.error('Failed to revoke sessions');
      }
    },
  });
}
