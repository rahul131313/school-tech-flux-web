/* ============================================================
   SchoolConnect — Notifications API Endpoints
   Consumes Spring Boot NotificationController:
   - POST /api/v1/notifications
   - GET  /api/v1/notifications/mine
   - POST /api/v1/notifications/{id}/read
   ============================================================ */

import { apiClient } from '../client';
import type { NotificationRequest, NotificationResponse } from '../types';

const BASE = '/v1/notifications';

export const notificationsApi = {
  create: async (data: NotificationRequest): Promise<NotificationResponse> => {
    const response = await apiClient.post<NotificationResponse>(BASE, data);
    return response.data;
  },

  mine: async (): Promise<NotificationResponse[]> => {
    const response = await apiClient.get<NotificationResponse[]>(`${BASE}/mine`);
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.post(`${BASE}/${id}/read`);
  },
};
