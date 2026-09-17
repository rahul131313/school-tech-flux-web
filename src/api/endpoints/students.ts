/* ============================================================
   SchoolConnect — Students API Endpoints
   Direct student entity management per OpenAPI spec:
   GET /api/v1/students
   POST /api/v1/students
   GET /api/v1/students/{id}
   PATCH /api/v1/students/{id}
   ============================================================ */

import { apiClient } from '../client';
import type {
  StudentRequest,
  StudentResponse,
  StudentGuardianRequest,
  SpringPage,
  SpringPageable,
} from '../types';

const BASE = '/v1/students';

export interface StudentFilterParams extends SpringPageable {
  branchId?: string;
  status?: string;
  search?: string;
}

export const studentsApi = {
  /** GET /api/v1/students (pageable) */
  list: async (params?: StudentFilterParams): Promise<SpringPage<StudentResponse>> => {
    const response = await apiClient.get<SpringPage<StudentResponse>>(BASE, {
      params,
    });
    return response.data;
  },

  /** GET /api/v1/students/:id */
  get: async (id: string): Promise<StudentResponse> => {
    const response = await apiClient.get<StudentResponse>(`${BASE}/${id}`);
    return response.data;
  },

  /** POST /api/v1/students */
  create: async (data: StudentRequest): Promise<StudentResponse> => {
    const response = await apiClient.post<StudentResponse>(BASE, data);
    return response.data;
  },

  /** PATCH /api/v1/students/:id */
  update: async (id: string, data: Partial<StudentRequest>): Promise<StudentResponse> => {
    const response = await apiClient.patch<StudentResponse>(`${BASE}/${id}`, data);
    return response.data;
  },

  /** POST /api/v1/students/:id/guardians — link guardian */
  linkGuardian: async (studentId: string, data: StudentGuardianRequest): Promise<void> => {
    await apiClient.post(`${BASE}/${studentId}/guardians`, data);
  },

  /** DELETE /api/v1/students/:id/guardians/:guardianId — unlink guardian */
  unlinkGuardian: async (studentId: string, guardianId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${studentId}/guardians/${guardianId}`);
  },
};

