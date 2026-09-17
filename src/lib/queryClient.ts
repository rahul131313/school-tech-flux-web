/* ============================================================
   SchoolConnect — TanStack Query Client Configuration
   ============================================================ */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { notify } from '../components/ui/Toast';
import { isApiError } from '../api/types';

export function extractErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong';
  if (typeof error === 'string') return error;
  if (isApiError(error)) return error.message || 'Operation failed';
  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (typeof err.message === 'string') return err.message;
    if (typeof err.error === 'string') return err.error;
    if (err.response && typeof err.response === 'object') {
      const respData = (err.response as Record<string, unknown>).data;
      if (respData && typeof respData === 'object') {
        const msg = (respData as Record<string, unknown>).message;
        if (typeof msg === 'string') return msg;
      }
    }
  }
  if (error instanceof Error) return error.message;
  return 'Operation failed. Please try again.';
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Background query errors are handled locally by components (empty states, skeletons)
    // without popping intrusive toasts that block UI interactions.
  }),
  mutationCache: new MutationCache({
    onError: (error: unknown) => {
      if (isApiError(error) && error.errorCode === 'UNAUTHORIZED') return;
      notify.error(extractErrorMessage(error));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false, // Prevents rapid re-fetching loops and UI flickering on failures
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
