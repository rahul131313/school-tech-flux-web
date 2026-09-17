/* ============================================================
   SchoolConnect — Staff Attendance API Endpoints
   Consumes Spring Boot StaffAttendanceController:
   - POST /api/v1/attendance/staff/check-in
   - POST /api/v1/attendance/staff/check-out
   - POST /api/v1/attendance/staff (bulk)
   - GET  /api/v1/attendance/staff?from=&to=&staffId=&branchId=
   ============================================================ */

import { apiClient } from '../client';
import type {
  StaffAttendanceResponse,
  StaffAttendanceBulkRequest,
} from '../types';

const BASE = '/v1/attendance/staff';

export interface StaffAttendanceFilter {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  staffId?: string;
  branchId?: string;
}

export const staffAttendanceApi = {
  /** Self check-in */
  checkIn: async (): Promise<StaffAttendanceResponse> => {
    const response = await apiClient.post<StaffAttendanceResponse>(`${BASE}/check-in`);
    return response.data;
  },

  /** Self check-out */
  checkOut: async (): Promise<StaffAttendanceResponse> => {
    const response = await apiClient.post<StaffAttendanceResponse>(`${BASE}/check-out`);
    return response.data;
  },

  /** Bulk mark staff attendance */
  bulkMark: async (data: StaffAttendanceBulkRequest): Promise<StaffAttendanceResponse[]> => {
    const response = await apiClient.post<StaffAttendanceResponse[]>(BASE, data);
    return response.data;
  },

  /** List staff attendance by date range and filters */
  list: async (filters: StaffAttendanceFilter): Promise<StaffAttendanceResponse[]> => {
    const response = await apiClient.get<StaffAttendanceResponse[]>(BASE, {
      params: filters,
    });
    return response.data;
  },
};
