/* ============================================================
   useTimetableSlots — TanStack Query hooks for Timetable Slots
   Note: No update mutation (API doesn't support PUT).
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timetableSlotsApi } from '../../../api/endpoints/timetableSlots';
import { useToast } from '../../../components/ui/Toast';
import type { TimetableSlotRequest, SpringPageable } from '../../../api/types';

const QUERY_KEY = 'timetable-slots';

export function useTimetableSlots(params?: SpringPageable) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => timetableSlotsApi.list(params),
  });
}

export function useTimetableSlot(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => timetableSlotsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateTimetableSlot() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: TimetableSlotRequest) => timetableSlotsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Timetable slot created successfully');
    },
  });
}

export function useDeleteTimetableSlot() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => timetableSlotsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Timetable slot deleted successfully');
    },
  });
}
