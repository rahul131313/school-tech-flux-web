/* ============================================================
   App — Root component
   Wraps the application in all required providers:
   1. QueryClientProvider (TanStack Query)
   2. RouterProvider (React Router)
   3. ToastProvider (react-hot-toast)
   4. ConfirmDialogProvider
   ============================================================ */

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from 'react-router';
import { queryClient } from './lib/queryClient';
import { router } from './router';
import { ToastProvider } from './components/ui/Toast';
import { ConfirmDialogProvider } from './components/dialog/ConfirmDialog';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmDialogProvider>
        <RouterProvider router={router} />
        <ToastProvider />
      </ConfirmDialogProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  );
}
