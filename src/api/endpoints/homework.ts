/* ============================================================
   SchoolConnect — Homework API Endpoints
   Consumes Spring Boot HomeworkController:
   - POST   /api/v1/homework
   - GET    /api/v1/homework?sectionId=&from=&to=
   - GET    /api/v1/homework/export?sectionId=&from=&to=&format=
   - GET    /api/v1/homework/mine?from=&to=
   - PUT    /api/v1/homework/{id}
   - DELETE /api/v1/homework/{id}
   - POST   /api/v1/homework/{id}/submissions
   - GET    /api/v1/homework/{id}/submissions
   - PUT    /api/v1/homework/submissions/{id}/grade
   ============================================================ */

import { apiClient } from '../client';
import { downloadExportFile } from '../../utils/fileDownload';
import type {
  HomeworkRequest,
  HomeworkResponse,
  HomeworkSubmissionRequest,
  HomeworkSubmissionResponse,
  HomeworkGradeRequest,
  ExportFormat,
} from '../types';

const BASE = '/v1/homework';

export const homeworkApi = {
  create: async (data: HomeworkRequest): Promise<HomeworkResponse> => {
    const response = await apiClient.post<HomeworkResponse>(BASE, data);
    return response.data;
  },

  list: async (sectionId: string, from: string, to: string): Promise<HomeworkResponse[]> => {
    const response = await apiClient.get<HomeworkResponse[]>(BASE, {
      params: { sectionId, from, to },
    });
    return response.data;
  },

  listMine: async (from: string, to: string): Promise<HomeworkResponse[]> => {
    const response = await apiClient.get<HomeworkResponse[]>(`${BASE}/mine`, {
      params: { from, to },
    });
    return response.data;
  },

  update: async (id: string, data: HomeworkRequest): Promise<HomeworkResponse> => {
    const response = await apiClient.put<HomeworkResponse>(`${BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },

  exportHomework: async (
    sectionId: string,
    from: string,
    to: string,
    format: ExportFormat = 'XLSX'
  ): Promise<void> => {
    await downloadExportFile(
      `${BASE}/export`,
      { sectionId, from, to, format },
      `homework-${from}.${format.toLowerCase()}`
    );
  },

  submit: async (
    homeworkId: string,
    data: HomeworkSubmissionRequest
  ): Promise<HomeworkSubmissionResponse> => {
    const response = await apiClient.post<HomeworkSubmissionResponse>(
      `${BASE}/${homeworkId}/submissions`,
      data
    );
    return response.data;
  },

  submissions: async (homeworkId: string): Promise<HomeworkSubmissionResponse[]> => {
    const response = await apiClient.get<HomeworkSubmissionResponse[]>(
      `${BASE}/${homeworkId}/submissions`
    );
    return response.data;
  },

  grade: async (
    submissionId: string,
    data: HomeworkGradeRequest
  ): Promise<HomeworkSubmissionResponse> => {
    const response = await apiClient.put<HomeworkSubmissionResponse>(
      `${BASE}/submissions/${submissionId}/grade`,
      data
    );
    return response.data;
  },
};
