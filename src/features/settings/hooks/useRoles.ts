/* ============================================================
   useRoles — TanStack Query hooks for Custom Roles (V9)
   GET    /api/v1/roles
   POST   /api/v1/roles
   PUT    /api/v1/roles/{id}
   DELETE /api/v1/roles/{id}
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../../../api/endpoints/roles';
import { useToast } from '../../../components/ui/Toast';
import type { RoleRequest } from '../../../api/types';

const QUERY_KEY = 'roles';

export function useRoles() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => rolesApi.list(),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: RoleRequest) => rolesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Custom role created successfully');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to create role';
      toast.error(message);
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoleRequest }) =>
      rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Role updated successfully');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to update role';
      toast.error(message);
    },
  });
}

export function useDeactivateRole() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => rolesApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Role deactivated successfully');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to deactivate role';
      toast.error(message);
    },
  });
}
