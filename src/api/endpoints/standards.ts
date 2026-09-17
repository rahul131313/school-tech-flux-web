/* ============================================================
   SchoolConnect — Standards API Endpoints
   ============================================================ */

import { apiClient } from '../client';
import type {
  StandardRequest,
  StandardResponse,
  SpringPage,
  SpringPageable,
} from '../types';

const BASE = '/v1/standards';

export const standardsApi = {
  /** GET /api/v1/standards */
  list: async (params?: SpringPageable): Promise<SpringPage<StandardResponse>> => {
    const response = await apiClient.get<SpringPage<StandardResponse>>(BASE, {
      params,
    });
    return response.data;
  },

  /** GET /api/v1/standards/:id */
  get: async (id: string): Promise<StandardResponse> => {
    const response = await apiClient.get<StandardResponse>(`${BASE}/${id}`);
    return response.data;
  },

  /** POST /api/v1/standards */
  create: async (data: StandardRequest): Promise<StandardResponse> => {
    const response = await apiClient.post<StandardResponse>(BASE, data);
    return response.data;
  },

  /** PUT /api/v1/standards/:id */
  update: async (id: string, data: StandardRequest): Promise<StandardResponse> => {
    const response = await apiClient.put<StandardResponse>(`${BASE}/${id}`, data);
    return response.data;
  },

  /** DELETE /api/v1/standards/:id */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
