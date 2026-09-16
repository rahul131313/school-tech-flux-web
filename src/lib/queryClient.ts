/* ============================================================
   SchoolConnect — TanStack Query Client Configuration
   ============================================================ */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { isApiError } from '../api/types';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: unknown) => {
      // Show a toast for every uncaught query error (except 401 which is handled by the interceptor)
      if (isApiError(error) && error.errorCode !== 'UNAUTHORIZED') {
        toast.error(error.message || 'Something went wrong');
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: unknown) => {
      // Mutations that DON'T have their own onError handler
      // get a global toast. Mutations with custom onError (like login)
      // handle their own error display.
      if (isApiError(error) && error.errorCode !== 'UNAUTHORIZED') {
        toast.error(error.message || 'Something went wrong');
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (isApiError(error)) {
          const code = error.errorCode;
          if (
            code === 'UNAUTHORIZED' ||
            code === 'FORBIDDEN' ||
            code === 'NOT_FOUND' ||
            code === 'VALIDATION_ERROR'
          ) {
            return false;
          }
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
