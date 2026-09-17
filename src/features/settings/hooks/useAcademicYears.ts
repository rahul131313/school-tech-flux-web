/* ============================================================
   useAcademicYears — TanStack Query hooks for Academic Years
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicYearsApi } from '../../../api/endpoints/academicYears';
import { useToast } from '../../../components/ui/Toast';
import type { AcademicYearRequest, SpringPageable } from '../../../api/types';

const QUERY_KEY = 'academic-years';

export function useAcademicYears(params?: SpringPageable) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => academicYearsApi.list(params),
  });
}

export function useAcademicYear(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => academicYearsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: AcademicYearRequest) => academicYearsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Academic year created successfully');
    },
  });
}

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AcademicYearRequest }) =>
      academicYearsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Academic year updated successfully');
    },
  });
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => academicYearsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Academic year deleted successfully');
    },
  });
}
