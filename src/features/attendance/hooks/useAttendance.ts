/* ============================================================
   useAttendance — TanStack Query hooks for Attendance
   Supports:
   - Student Attendance (list, mark, import, revise, export)
   - Staff Attendance (list, check-in, check-out, bulk-mark)
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../../../api/endpoints/attendance';
import {
  staffAttendanceApi,
  type StaffAttendanceFilter,
} from '../../../api/endpoints/staffAttendance';
import { useToast } from '../../../components/ui/Toast';
import {
  isApiError,
  type ApiError,
  type StudentAttendanceBulkRequest,
  type StudentAttendanceUpdateRequest,
  type StaffAttendanceBulkRequest,
} from '../../../api/types';

// ─── Student Attendance Hooks ─────────────────────────────────

export function useStudentAttendance(sectionId: string, date: string) {
  return useQuery({
    queryKey: ['attendance', 'student', sectionId, date],
    queryFn: () => attendanceApi.list(sectionId, date),
    enabled: !!sectionId && !!date,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMarkStudentAttendance() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: StudentAttendanceBulkRequest) => attendanceApi.mark(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'student', variables.sectionId, variables.date],
      });
      toast.success('Attendance recorded successfully!');
    },
    onError: (error: unknown) => {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to submit attendance');
      } else {
        toast.error('An unexpected error occurred while saving attendance.');
      }
    },
  });
}

export function useReviseStudentAttendance() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      sectionId: string;
      date: string;
      data: StudentAttendanceUpdateRequest;
    }) => attendanceApi.revise(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'student', variables.sectionId, variables.date],
      });
      toast.success('Attendance record revised successfully!');
    },
    onError: (error: unknown) => {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to revise attendance');
      } else {
        toast.error('An unexpected error occurred while revising attendance.');
      }
    },
  });
}

export function useImportStudentAttendance() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      sectionId,
      date,
      file,
      periodNumber,
    }: {
      sectionId: string;
      date: string;
      file: File;
      periodNumber?: number;
    }) => attendanceApi.importExcel(sectionId, date, file, periodNumber),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'student', variables.sectionId, variables.date],
      });
      toast.success(`Imported ${data.length} student attendance records!`);
    },
    onError: (error: unknown) => {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to import attendance workbook');
      } else {
        toast.error('Unable to import Excel file. Check format and required headers.');
      }
    },
  });
}

// ─── Staff Attendance Hooks ───────────────────────────────────

export function useStaffAttendance(filters: StaffAttendanceFilter) {
  return useQuery({
    queryKey: ['attendance', 'staff', filters],
    queryFn: () => staffAttendanceApi.list(filters),
    enabled: !!filters.from && !!filters.to,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStaffCheckIn() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: () => staffAttendanceApi.checkIn(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'staff'] });
      toast.success(`Checked in at ${res.checkInTime || 'now'}`);
    },
    onError: (error: unknown) => {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to check in');
      } else {
        toast.error('Check-in failed');
      }
    },
  });
}

export function useStaffCheckOut() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: () => staffAttendanceApi.checkOut(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'staff'] });
      toast.success(`Checked out at ${res.checkOutTime || 'now'}`);
    },
    onError: (error: unknown) => {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to check out');
      } else {
        toast.error('Check-out failed');
      }
    },
  });
}

export function useBulkMarkStaffAttendance() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: StaffAttendanceBulkRequest) => staffAttendanceApi.bulkMark(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'staff'] });
      toast.success(`Staff attendance marked for ${res.length} entries!`);
    },
    onError: (error: unknown) => {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to mark staff attendance');
      } else {
        toast.error('Staff attendance marking failed');
      }
    },
  });
}
