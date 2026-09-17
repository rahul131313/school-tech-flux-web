/* ============================================================
   SchoolConnect — Student Attendance API Endpoints
   Consumes Spring Boot student attendance controller:
   - GET  /api/v1/attendance/student?sectionId={}&date={}
   - POST /api/v1/attendance/student (bulk marking)
   - GET  /api/v1/attendance/student/export?sectionId={}&date={}&format={}
   - POST /api/v1/attendance/student/import (multipart/form-data)
   - PATCH /api/v1/attendance/student/{id} (revision)
   ============================================================ */

import { apiClient } from '../client';
import { downloadExportFile } from '../../utils/fileDownload';
import type {
  StudentAttendanceBulkRequest,
  StudentAttendanceResponse,
  StudentAttendanceUpdateRequest,
  ExportFormat,
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

  /**
   * Export student attendance workbook (XLSX or PDF).
   * GET /api/v1/attendance/student/export?sectionId={}&date={}&format={}
   */
  exportAttendance: async (
    sectionId: string,
    date: string,
    format: ExportFormat = 'XLSX'
  ): Promise<void> => {
    await downloadExportFile(
      `${BASE}/export`,
      { sectionId, date, format },
      `attendance-${date}.${format.toLowerCase()}`
    );
  },

  /**
   * Import student attendance from spreadsheet (.xlsx).
   * POST /api/v1/attendance/student/import
   */
  importExcel: async (
    sectionId: string,
    date: string,
    file: File,
    periodNumber?: number
  ): Promise<StudentAttendanceResponse[]> => {
    const formData = new FormData();
    formData.append('sectionId', sectionId);
    formData.append('date', date);
    if (periodNumber !== undefined && periodNumber !== null) {
      formData.append('periodNumber', String(periodNumber));
    }
    formData.append('file', file);

    const response = await apiClient.post<StudentAttendanceResponse[]>(
      `${BASE}/import`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  /**
   * Revise an individual attendance record.
   * PATCH /api/v1/attendance/student/{id}
   */
  revise: async (
    id: string,
    data: StudentAttendanceUpdateRequest
  ): Promise<StudentAttendanceResponse> => {
    const response = await apiClient.patch<StudentAttendanceResponse>(`${BASE}/${id}`, data);
    return response.data;
  },
};
