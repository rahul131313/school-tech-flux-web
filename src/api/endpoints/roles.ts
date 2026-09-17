/* ============================================================
   SchoolConnect — Custom Roles API Endpoints (V9)
   GET    /api/v1/roles
   POST   /api/v1/roles
   PUT    /api/v1/roles/{id}
   DELETE /api/v1/roles/{id}
   ============================================================ */

import { apiClient } from '../client';
import type { RoleRequest, RoleResponse } from '../types';

const BASE = '/v1/roles';

export const rolesApi = {
  /** GET /api/v1/roles — list system roles and tenant custom roles */
  list: async (): Promise<RoleResponse[]> => {
    const response = await apiClient.get<RoleResponse[]>(BASE);
    return response.data;
  },

  /** POST /api/v1/roles — create custom role */
  create: async (data: RoleRequest): Promise<RoleResponse> => {
    const response = await apiClient.post<RoleResponse>(BASE, data);
    return response.data;
  },

  /** PUT /api/v1/roles/:id — edit custom role */
  update: async (id: string, data: RoleRequest): Promise<RoleResponse> => {
    const response = await apiClient.put<RoleResponse>(`${BASE}/${id}`, data);
    return response.data;
  },

  /** DELETE /api/v1/roles/:id — deactivate custom role */
  deactivate: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
