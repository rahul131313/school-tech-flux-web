/* ============================================================
   RouteErrorBoundary — Friendly error fallback for React Router
   ============================================================ */

import { useRouteError, isRouteErrorResponse } from 'react-router';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

export function RouteErrorBoundary() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred while loading this page.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = error.data?.message || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'var(--color-danger-50, #fef2f2)',
          color: 'var(--color-danger-600, #dc2626)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
        }}
      >
        <AlertTriangle size={28} />
      </div>

      <h2
        style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {title}
      </h2>

      <p
        style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-text-secondary)',
          maxWidth: 480,
          marginBottom: 'var(--space-6)',
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button
          variant="secondary"
          icon={<RotateCcw size={16} />}
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
        <Button
          variant="primary"
          icon={<Home size={16} />}
          onClick={() => {
            window.location.href = '/';
          }}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
