/* ============================================================
   SchoolConnect — Role Permissions API Endpoints (V9 Action Grants)
   GET    /api/v1/role-permissions
   GET    /api/v1/role-permissions/effective
   POST   /api/v1/role-permissions/{roleId}/{module}
   DELETE /api/v1/role-permissions/{permissionId}
   ============================================================ */

import { apiClient } from '../client';
import type {
  RolePermissionResponse,
  PermissionAction,
  EffectivePermissionsResponse,
} from '../types';

const BASE = '/v1/role-permissions';

export const rolePermissionsApi = {
  /** GET /api/v1/role-permissions — list school-specific overrides */
  listOverrides: async (): Promise<RolePermissionResponse[]> => {
    const response = await apiClient.get<RolePermissionResponse[]>(BASE);
    return response.data;
  },

  /** Alias for backward compatibility */
  list: async (): Promise<RolePermissionResponse[]> => {
    const response = await apiClient.get<RolePermissionResponse[]>(BASE);
    return response.data;
  },

  /** GET /api/v1/role-permissions/effective — list effective grants */
  getEffective: async (): Promise<EffectivePermissionsResponse> => {
    const response = await apiClient.get<EffectivePermissionsResponse>(
      `${BASE}/effective`
    );
    return response.data;
  },

  /** POST /api/v1/role-permissions/{roleId}/{module} — grant one action to a role */
  grant: async (
    roleId: string,
    module: string,
    action: PermissionAction
  ): Promise<RolePermissionResponse> => {
    const response = await apiClient.post<RolePermissionResponse>(
      `${BASE}/${roleId}/${module}`,
      { action }
    );
    return response.data;
  },

  /** DELETE /api/v1/role-permissions/{permissionId} — revoke a grant */
  revoke: async (permissionId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${permissionId}`);
  },
};
