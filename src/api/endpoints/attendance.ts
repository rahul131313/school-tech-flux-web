/* ============================================================
   SchoolConnect — Attendance API Endpoints
   Consumes Spring Boot student attendance controller:
   - GET  /api/v1/attendance/student?sectionId={}&date={}
   - POST /api/v1/attendance/student (bulk marking)
   ============================================================ */

import { apiClient } from '../client';
import type {
  StudentAttendanceBulkRequest,
  StudentAttendanceResponse,
} from '../types';

const BASE = '/v1/attendance/student';

export const attendanceApi = {
  /**
   * List attendance records for a specific section and date.
   * GET /api/v1/attendance/student?sectionId={}&date={}
   */
  list: async (sectionId: string, date: string): Promise<StudentAttendanceResponse[]> => {
    const response = await apiClient.get<StudentAttendanceResponse[]>(BASE, {
      params: { sectionId, date },
    });
    return response.data;
  },

  /**
   * Mark student attendance in bulk.
   * POST /api/v1/attendance/student
   */
  mark: async (data: StudentAttendanceBulkRequest): Promise<StudentAttendanceResponse[]> => {
    const response = await apiClient.post<StudentAttendanceResponse[]>(BASE, data);
    return response.data;
  },
};
