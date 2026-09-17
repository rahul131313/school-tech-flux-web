/* ============================================================
   useSchools — TanStack Query hooks for Schools
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolsApi } from '../../../api/endpoints/schools';
import { useToast } from '../../../components/ui/Toast';
import type { SchoolRequest, SpringPageable } from '../../../api/types';

const QUERY_KEY = 'schools';

export function useSchools(
  params?: SpringPageable,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => schoolsApi.list(params),
    ...options,
  });
}

export function useSchool(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => schoolsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: SchoolRequest) => schoolsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('School created successfully');
    },
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SchoolRequest }) =>
      schoolsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('School updated successfully');
    },
  });
}
