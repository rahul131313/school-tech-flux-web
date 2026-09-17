/* ============================================================
   SchoolConnect — Schools API Endpoints
   CRUD functions for school onboarding.
   ============================================================ */

import { apiClient } from '../client';
import type {
  SchoolRequest,
  SchoolResponse,
  SpringPage,
  SpringPageable,
} from '../types';

const BASE = '/v1/schools';

export const schoolsApi = {
  /**
   * List schools (paginated).
   * GET /api/v1/schools
   */
  list: async (params?: SpringPageable): Promise<SpringPage<SchoolResponse>> => {
    const response = await apiClient.get<SpringPage<SchoolResponse>>(BASE, {
      params,
    });
    return response.data;
  },

  /**
   * Get a single school by ID.
   * GET /api/v1/schools/:id
   */
  get: async (id: string): Promise<SchoolResponse> => {
    const response = await apiClient.get<SchoolResponse>(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Onboard a new school tenant.
   * POST /api/v1/schools
   */
  create: async (data: SchoolRequest): Promise<SchoolResponse> => {
    const response = await apiClient.post<SchoolResponse>(BASE, data);
    return response.data;
  },

  /**
   * Update an existing school.
   * PUT /api/v1/schools/:id
   */
  update: async (id: string, data: SchoolRequest): Promise<SchoolResponse> => {
    const response = await apiClient.put<SchoolResponse>(`${BASE}/${id}`, data);
    return response.data;
  },
};
