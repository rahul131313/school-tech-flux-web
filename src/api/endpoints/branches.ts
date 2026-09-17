/* ============================================================
   SchoolConnect — Branches API Endpoints
   CRUD functions for school branches.
   ============================================================ */

import { apiClient } from '../client';
import type {
  BranchRequest,
  BranchResponse,
  SpringPage,
  SpringPageable,
} from '../types';

const BASE = '/v1/branches';

export const branchesApi = {
  /** GET /api/v1/branches */
  list: async (params?: SpringPageable): Promise<SpringPage<BranchResponse>> => {
    const response = await apiClient.get<SpringPage<BranchResponse>>(BASE, {
      params,
    });
    return response.data;
  },

  /** GET /api/v1/branches/:id */
  get: async (id: string): Promise<BranchResponse> => {
    const response = await apiClient.get<BranchResponse>(`${BASE}/${id}`);
    return response.data;
  },

  /** POST /api/v1/branches */
  create: async (data: BranchRequest): Promise<BranchResponse> => {
    const response = await apiClient.post<BranchResponse>(BASE, data);
    return response.data;
  },

  /** PUT /api/v1/branches/:id */
  update: async (id: string, data: BranchRequest): Promise<BranchResponse> => {
    const response = await apiClient.put<BranchResponse>(`${BASE}/${id}`, data);
    return response.data;
  },

  /** DELETE /api/v1/branches/:id */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
