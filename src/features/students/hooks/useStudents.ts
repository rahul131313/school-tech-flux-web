/* ============================================================
   useStudents — TanStack Query hooks for Students CRUD
   GET /api/v1/students
   POST /api/v1/students
   GET /api/v1/students/{id}
   PATCH /api/v1/students/{id}
   ============================================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi, type StudentFilterParams } from '../../../api/endpoints/students';
import { useToast } from '../../../components/ui/Toast';
import type { StudentRequest, StudentGuardianRequest } from '../../../api/types';

const QUERY_KEY = 'students';

export function useStudents(params?: StudentFilterParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => studentsApi.list(params),
  });
}

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => studentsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: StudentRequest) => studentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Student created successfully');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create student';
      toast.error(message);
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StudentRequest> }) =>
      studentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Student updated successfully');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update student';
      toast.error(message);
    },
  });
}

export function useLinkGuardian() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      studentId,
      data,
    }: {
      studentId: string;
      data: StudentGuardianRequest;
    }) => studentsApi.linkGuardian(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Guardian linked successfully');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to link guardian';
      toast.error(message);
    },
  });
}

export function useUnlinkGuardian() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      studentId,
      guardianId,
    }: {
      studentId: string;
      guardianId: string;
    }) => studentsApi.unlinkGuardian(studentId, guardianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Guardian unlinked successfully');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to unlink guardian';
      toast.error(message);
    },
  });
}
