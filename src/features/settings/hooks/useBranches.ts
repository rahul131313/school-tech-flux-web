/* ============================================================
   useBranches — TanStack Query hooks for Branches
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '../../../api/endpoints/branches';
import { useToast } from '../../../components/ui/Toast';
import type { BranchRequest, SpringPageable } from '../../../api/types';

const QUERY_KEY = 'branches';

export function useBranches(params?: SpringPageable) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => branchesApi.list(params),
  });
}

export function useBranch(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => branchesApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: BranchRequest) => branchesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Branch created successfully');
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BranchRequest }) =>
      branchesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Branch updated successfully');
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => branchesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Branch deleted successfully');
    },
  });
}
