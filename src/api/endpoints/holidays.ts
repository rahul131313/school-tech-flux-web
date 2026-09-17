/* ============================================================
   SchoolConnect — Holidays API Endpoints
   Consumes Spring Boot HolidayController:
   - POST   /api/v1/holidays
   - GET    /api/v1/holidays?from=&to=
   - PUT    /api/v1/holidays/{id}
   - DELETE /api/v1/holidays/{id}
   ============================================================ */

import { apiClient } from '../client';
import type { HolidayRequest, HolidayResponse } from '../types';

const BASE = '/v1/holidays';

export const holidaysApi = {
  list: async (from: string, to: string): Promise<HolidayResponse[]> => {
    const response = await apiClient.get<HolidayResponse[]>(BASE, {
      params: { from, to },
    });
    return response.data;
  },

  create: async (data: HolidayRequest): Promise<HolidayResponse> => {
    const response = await apiClient.post<HolidayResponse>(BASE, data);
    return response.data;
  },

  update: async (id: string, data: HolidayRequest): Promise<HolidayResponse> => {
    const response = await apiClient.put<HolidayResponse>(`${BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
