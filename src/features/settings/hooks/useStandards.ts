/* ============================================================
   useStandards — TanStack Query hooks for Standards
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { standardsApi } from '../../../api/endpoints/standards';
import { useToast } from '../../../components/ui/Toast';
import type { StandardRequest, SpringPageable } from '../../../api/types';

const QUERY_KEY = 'standards';

export function useStandards(params?: SpringPageable) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => standardsApi.list(params),
  });
}

export function useStandard(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => standardsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateStandard() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: StandardRequest) => standardsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Standard created successfully');
    },
  });
}

export function useUpdateStandard() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StandardRequest }) =>
      standardsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Standard updated successfully');
    },
  });
}

export function useDeleteStandard() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => standardsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Standard deleted successfully');
    },
  });
}
