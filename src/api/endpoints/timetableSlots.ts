/* ============================================================
   SchoolConnect — Timetable Slots API Endpoints
   Note: No PUT/update endpoint per OpenAPI spec.
   ============================================================ */

import { apiClient } from '../client';
import type {
  TimetableSlotRequest,
  TimetableSlotResponse,
  SpringPage,
  SpringPageable,
} from '../types';

const BASE = '/v1/timetable-slots';

export const timetableSlotsApi = {
  /** GET /api/v1/timetable-slots */
  list: async (params?: SpringPageable): Promise<SpringPage<TimetableSlotResponse>> => {
    const response = await apiClient.get<SpringPage<TimetableSlotResponse>>(BASE, {
      params,
    });
    return response.data;
  },

  /** GET /api/v1/timetable-slots/:id */
  get: async (id: string): Promise<TimetableSlotResponse> => {
    const response = await apiClient.get<TimetableSlotResponse>(`${BASE}/${id}`);
    return response.data;
  },

  /** POST /api/v1/timetable-slots */
  create: async (data: TimetableSlotRequest): Promise<TimetableSlotResponse> => {
    const response = await apiClient.post<TimetableSlotResponse>(BASE, data);
    return response.data;
  },

  /** DELETE /api/v1/timetable-slots/:id */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
