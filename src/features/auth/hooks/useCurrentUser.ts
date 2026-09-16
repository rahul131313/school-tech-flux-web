/* ============================================================
   useCurrentUser — TanStack Query hook for session rehydration
   Runs on app mount (if a token might exist) to restore session.
   On 401: the global interceptor handles redirect.
   ============================================================ */

import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../api/endpoints/auth';
import { useAuthStore } from '../../../stores/authStore';
import { getAccessToken } from '../../../api/client';

export function useCurrentUser() {
  const { setAuth, setHydrating } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: async () => {
      const data = await authApi.getCurrentUser();

      // Re-hydrate the auth store with the current token
      const currentToken = getAccessToken();
      if (currentToken) {
        setAuth(
          data.user,
          currentToken,
          '', // Refresh token is managed via httpOnly cookie
          data.permissions
        );
      }

      return data;
    },
    // Only run if we might have a token
    enabled: !!getAccessToken(),
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      // After this query settles (success or error), we're done hydrating
      onSettled: () => setHydrating(false),
    },
  });
}
