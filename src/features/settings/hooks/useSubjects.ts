/* ============================================================
   useSubjects — TanStack Query hooks for Subjects
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi } from '../../../api/endpoints/subjects';
import { useToast } from '../../../components/ui/Toast';
import type { SubjectRequest, SpringPageable } from '../../../api/types';

const QUERY_KEY = 'subjects';

export function useSubjects(params?: SpringPageable) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => subjectsApi.list(params),
  });
}

export function useSubject(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => subjectsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: SubjectRequest) => subjectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Subject created successfully');
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubjectRequest }) =>
      subjectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Subject updated successfully');
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => subjectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Subject deleted successfully');
    },
  });
}
