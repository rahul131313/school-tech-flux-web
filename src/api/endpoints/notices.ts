/* ============================================================
   SchoolConnect — Notices API Endpoints
   Consumes Spring Boot NoticeController:
   - POST   /api/v1/notices
   - GET    /api/v1/notices (published)
   - GET    /api/v1/notices/management (all)
   - PUT    /api/v1/notices/{id}
   - POST   /api/v1/notices/{id}/publish
   - DELETE /api/v1/notices/{id}
   ============================================================ */

import { apiClient } from '../client';
import type { NoticeRequest, NoticeResponse } from '../types';

const BASE = '/v1/notices';

export const noticesApi = {
  create: async (data: NoticeRequest): Promise<NoticeResponse> => {
    const response = await apiClient.post<NoticeResponse>(BASE, data);
    return response.data;
  },

  listPublished: async (): Promise<NoticeResponse[]> => {
    const response = await apiClient.get<NoticeResponse[]>(BASE);
    return response.data;
  },

  listManagement: async (): Promise<NoticeResponse[]> => {
    const response = await apiClient.get<NoticeResponse[]>(`${BASE}/management`);
    return response.data;
  },

  update: async (id: string, data: NoticeRequest): Promise<NoticeResponse> => {
    const response = await apiClient.put<NoticeResponse>(`${BASE}/${id}`, data);
    return response.data;
  },

  publish: async (id: string): Promise<NoticeResponse> => {
    const response = await apiClient.post<NoticeResponse>(`${BASE}/${id}/publish`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
