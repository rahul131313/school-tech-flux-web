/* ============================================================
   SchoolConnect — Exams API Endpoints
   Consumes Spring Boot ExamController:
   - POST /api/v1/exams
   - POST /api/v1/exams/{id}/subjects
   - POST /api/v1/exams/subjects/{id}/marks
   - POST /api/v1/exams/{id}/lock
   - POST /api/v1/exams/{id}/publish
   ============================================================ */

import { apiClient } from '../client';
import type {
  ExamRequest,
  ExamSubjectRequest,
  ExamMarkRequest,
} from '../types';

const BASE = '/v1/exams';

export const examsApi = {
  create: async (data: ExamRequest): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>(BASE, data);
    return response.data;
  },

  addSubject: async (examId: string, data: ExamSubjectRequest): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>(`${BASE}/${examId}/subjects`, data);
    return response.data;
  },

  enterMark: async (examSubjectId: string, data: ExamMarkRequest): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>(
      `${BASE}/subjects/${examSubjectId}/marks`,
      data
    );
    return response.data;
  },

  lock: async (id: string): Promise<{ status: string }> => {
    const response = await apiClient.post<{ status: string }>(`${BASE}/${id}/lock`);
    return response.data;
  },

  publish: async (id: string): Promise<{ status: string }> => {
    const response = await apiClient.post<{ status: string }>(`${BASE}/${id}/publish`);
    return response.data;
  },
};
