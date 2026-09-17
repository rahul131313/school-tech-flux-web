/* ============================================================
   SchoolConnect — Users Role & Session API Endpoints
   Consumes Spring Boot UserRoleAssignmentController:
   - PUT   /api/v1/users/{id}/role
   - PATCH /api/v1/users/{id}/status
   - POST  /api/v1/users/{id}/revoke-sessions
   ============================================================ */

import { apiClient } from '../client';
import type { AccountStatus, UserCreateRequest, UserResponse } from '../types';

const BASE = '/v1/users';

export const usersApi = {
  create: async (data: UserCreateRequest): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>(BASE, data);
    return response.data;
  },

  assignRole: async (userId: string, roleId: string): Promise<void> => {
    await apiClient.put(`${BASE}/${userId}/role`, { roleId });
  },

  updateStatus: async (userId: string, status: AccountStatus): Promise<void> => {
    await apiClient.patch(`${BASE}/${userId}/status`, { status });
  },

  revokeSessions: async (userId: string): Promise<void> => {
    await apiClient.post(`${BASE}/${userId}/revoke-sessions`);
  },
};
