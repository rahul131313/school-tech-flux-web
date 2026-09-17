/* ============================================================
   useRolePermissions — TanStack Query hooks for Action Grants (V9)
   GET    /api/v1/role-permissions
   GET    /api/v1/role-permissions/effective
   POST   /api/v1/role-permissions/{roleId}/{module}
   DELETE /api/v1/role-permissions/{permissionId}
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolePermissionsApi } from '../../../api/endpoints/rolePermissions';
import { useToast } from '../../../components/ui/Toast';
import type { PermissionAction } from '../../../api/types';

const QUERY_KEY = 'role-permissions';

export function useEffectivePermissions() {
  return useQuery({
    queryKey: [QUERY_KEY, 'effective'],
    queryFn: () => rolePermissionsApi.getEffective(),
  });
}

export function useRolePermissions() {
  return useQuery({
    queryKey: [QUERY_KEY, 'overrides'],
    queryFn: () => rolePermissionsApi.listOverrides(),
  });
}

export function useGrantAction() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      roleId,
      module,
      action,
    }: {
      roleId: string;
      module: string;
      action: PermissionAction;
    }) => rolePermissionsApi.grant(roleId, module, action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Granted ${variables.action} on ${variables.module}`);
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to grant permission';
      toast.error(message);
    },
  });
}

export function useRevokeAction() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (permissionId: string) =>
      rolePermissionsApi.revoke(permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Permission revoked successfully');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to revoke permission';
      toast.error(message);
    },
  });
}
