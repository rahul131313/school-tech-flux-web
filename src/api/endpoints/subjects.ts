/* ============================================================
   SchoolConnect — Subjects API Endpoints
   ============================================================ */

import { apiClient } from '../client';
import type {
  SubjectRequest,
  SubjectResponse,
  SpringPage,
  SpringPageable,
} from '../types';

const BASE = '/v1/subjects';

export const subjectsApi = {
  /** GET /api/v1/subjects */
  list: async (params?: SpringPageable): Promise<SpringPage<SubjectResponse>> => {
    const response = await apiClient.get<SpringPage<SubjectResponse>>(BASE, {
      params,
    });
    return response.data;
  },

  /** GET /api/v1/subjects/:id */
  get: async (id: string): Promise<SubjectResponse> => {
    const response = await apiClient.get<SubjectResponse>(`${BASE}/${id}`);
    return response.data;
  },

  /** POST /api/v1/subjects */
  create: async (data: SubjectRequest): Promise<SubjectResponse> => {
    const response = await apiClient.post<SubjectResponse>(BASE, data);
    return response.data;
  },

  /** PUT /api/v1/subjects/:id */
  update: async (id: string, data: SubjectRequest): Promise<SubjectResponse> => {
    const response = await apiClient.put<SubjectResponse>(`${BASE}/${id}`, data);
    return response.data;
  },

  /** DELETE /api/v1/subjects/:id */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
