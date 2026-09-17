/* ============================================================
   useAttendance — TanStack Query hooks for Student Attendance
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../../../api/endpoints/attendance';
import { useToast } from '../../../components/ui/Toast';
import { isApiError, type ApiError, type StudentAttendanceBulkRequest } from '../../../api/types';

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
