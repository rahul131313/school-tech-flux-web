/* ============================================================
   SchoolConnect — Academic Years API Endpoints
   ============================================================ */

import { apiClient } from '../client';
import type {
  AcademicYearRequest,
  AcademicYearResponse,
  SpringPage,
  SpringPageable,
} from '../types';

const BASE = '/v1/academic-years';

export const academicYearsApi = {
  /** GET /api/v1/academic-years */
  list: async (params?: SpringPageable): Promise<SpringPage<AcademicYearResponse>> => {
    const response = await apiClient.get<SpringPage<AcademicYearResponse>>(BASE, {
      params,
    });
    return response.data;
  },

  /** GET /api/v1/academic-years/:id */
  get: async (id: string): Promise<AcademicYearResponse> => {
    const response = await apiClient.get<AcademicYearResponse>(`${BASE}/${id}`);
    return response.data;
  },

  /** POST /api/v1/academic-years */
  create: async (data: AcademicYearRequest): Promise<AcademicYearResponse> => {
    const response = await apiClient.post<AcademicYearResponse>(BASE, data);
    return response.data;
  },

  /** PUT /api/v1/academic-years/:id */
  update: async (id: string, data: AcademicYearRequest): Promise<AcademicYearResponse> => {
    const response = await apiClient.put<AcademicYearResponse>(`${BASE}/${id}`, data);
    return response.data;
  },

  /** DELETE /api/v1/academic-years/:id */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
