/* ============================================================
   useSections — TanStack Query hooks for Sections
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionsApi } from '../../../api/endpoints/sections';
import { useToast } from '../../../components/ui/Toast';
import type { SectionRequest, SpringPageable } from '../../../api/types';

const QUERY_KEY = 'sections';

export function useSections(params?: SpringPageable) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => sectionsApi.list(params),
  });
}

export function useSection(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => sectionsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: SectionRequest) => sectionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Section created successfully');
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SectionRequest }) =>
      sectionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Section updated successfully');
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => sectionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Section deleted successfully');
    },
  });
}
