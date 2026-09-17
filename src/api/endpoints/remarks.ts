/* ============================================================
   SchoolConnect — Remarks API Endpoints
   Consumes Spring Boot RemarkController:
   - POST /api/v1/remarks
   - POST /api/v1/remarks/{id}/approve
   - POST /api/v1/remarks/{id}/reject
   - GET  /api/v1/remarks/students/{studentId}
   - GET  /api/v1/remarks/students/{studentId}/export?format=
   ============================================================ */

import { apiClient } from '../client';
import { downloadExportFile } from '../../utils/fileDownload';
import type { RemarkRequest, RemarkResponse, ExportFormat } from '../types';

const BASE = '/v1/remarks';

export const remarksApi = {
  create: async (data: RemarkRequest): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>(BASE, data);
    return response.data;
  },

  approve: async (id: string): Promise<{ status: string }> => {
    const response = await apiClient.post<{ status: string }>(`${BASE}/${id}/approve`);
    return response.data;
  },

  reject: async (id: string): Promise<{ status: string }> => {
    const response = await apiClient.post<{ status: string }>(`${BASE}/${id}/reject`);
    return response.data;
  },

  listForStudent: async (studentId: string): Promise<RemarkResponse[]> => {
    const response = await apiClient.get<RemarkResponse[]>(`${BASE}/students/${studentId}`);
    return response.data;
  },

  exportRemarks: async (studentId: string, format: ExportFormat = 'PDF'): Promise<void> => {
    await downloadExportFile(
      `${BASE}/students/${studentId}/export`,
      { format },
      `remarks-${studentId}.${format.toLowerCase()}`
    );
  },
};
