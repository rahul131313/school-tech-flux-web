/* ============================================================
   SchoolConnect — Student Enrollments API Endpoints
   Note: No PUT/update endpoint per OpenAPI spec.
   ============================================================ */

import { apiClient } from '../client';
import type {
  StudentEnrollmentRequest,
  StudentEnrollmentResponse,
  SpringPage,
  SpringPageable,
} from '../types';

const BASE = '/v1/student-enrollments';

export const studentEnrollmentsApi = {
  /** GET /api/v1/student-enrollments */
  list: async (params?: SpringPageable): Promise<SpringPage<StudentEnrollmentResponse>> => {
    const response = await apiClient.get<SpringPage<StudentEnrollmentResponse>>(BASE, {
      params,
    });
    return response.data;
  },

  /** GET /api/v1/student-enrollments/:id */
  get: async (id: string): Promise<StudentEnrollmentResponse> => {
    const response = await apiClient.get<StudentEnrollmentResponse>(`${BASE}/${id}`);
    return response.data;
  },

  /** POST /api/v1/student-enrollments */
  create: async (data: StudentEnrollmentRequest): Promise<StudentEnrollmentResponse> => {
    const response = await apiClient.post<StudentEnrollmentResponse>(BASE, data);
    return response.data;
  },

  /** DELETE /api/v1/student-enrollments/:id */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
