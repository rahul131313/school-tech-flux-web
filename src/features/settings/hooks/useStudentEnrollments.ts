/* ============================================================
   useStudentEnrollments — TanStack Query hooks for Enrollments
   Note: No update mutation (API doesn't support PUT).
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEnrollmentsApi } from '../../../api/endpoints/studentEnrollments';
import { useToast } from '../../../components/ui/Toast';
import type { StudentEnrollmentRequest, SpringPageable } from '../../../api/types';

const QUERY_KEY = 'student-enrollments';

export function useStudentEnrollments(params?: SpringPageable) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => studentEnrollmentsApi.list(params),
  });
}

export function useStudentEnrollment(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => studentEnrollmentsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateStudentEnrollment() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: StudentEnrollmentRequest) =>
      studentEnrollmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Student enrollment created successfully');
    },
  });
}

export function useDeleteStudentEnrollment() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => studentEnrollmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Student enrollment deleted successfully');
    },
  });
}
