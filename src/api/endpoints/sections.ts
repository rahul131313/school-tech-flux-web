/* ============================================================
   SchoolConnect — Sections API Endpoints
   ============================================================ */

import { apiClient } from '../client';
import type {
  SectionRequest,
  SectionResponse,
  SpringPage,
  SpringPageable,
} from '../types';

const BASE = '/v1/sections';

export const sectionsApi = {
  /** GET /api/v1/sections */
  list: async (params?: SpringPageable): Promise<SpringPage<SectionResponse>> => {
    const response = await apiClient.get<SpringPage<SectionResponse>>(BASE, {
      params,
    });
    return response.data;
  },

  /** GET /api/v1/sections/:id */
  get: async (id: string): Promise<SectionResponse> => {
    const response = await apiClient.get<SectionResponse>(`${BASE}/${id}`);
    return response.data;
  },

  /** POST /api/v1/sections */
  create: async (data: SectionRequest): Promise<SectionResponse> => {
    const response = await apiClient.post<SectionResponse>(BASE, data);
    return response.data;
  },

  /** PUT /api/v1/sections/:id */
  update: async (id: string, data: SectionRequest): Promise<SectionResponse> => {
    const response = await apiClient.put<SectionResponse>(`${BASE}/${id}`, data);
    return response.data;
  },

  /** DELETE /api/v1/sections/:id */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
