/* ============================================================
   Toast — Shared toast notification system
   Wraps react-hot-toast with typed API and consistent styling.
   ============================================================ */

import toast, { Toaster, type ToastPosition } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';

// ─── Toast Hook ─────────────────────────────────────────────
export function useToast() {
  return {
    success: (message: string) => {
      toast.custom(
        (t) => (
          <ToastContent
            variant="success"
            message={message}
            onClose={() => toast.dismiss(t.id)}
            visible={t.visible}
          />
        ),
        { duration: 4000 }
      );
    },
    error: (message: string) => {
      toast.custom(
        (t) => (
          <ToastContent
            variant="error"
            message={message}
            onClose={() => toast.dismiss(t.id)}
            visible={t.visible}
          />
        ),
        { duration: 6000 }
      );
    },
    warning: (message: string) => {
      toast.custom(
        (t) => (
          <ToastContent
            variant="warning"
            message={message}
            onClose={() => toast.dismiss(t.id)}
            visible={t.visible}
          />
        ),
        { duration: 5000 }
      );
    },
    info: (message: string) => {
      toast.custom(
        (t) => (
          <ToastContent
            variant="info"
            message={message}
            onClose={() => toast.dismiss(t.id)}
            visible={t.visible}
          />
        ),
        { duration: 4000 }
      );
    },
    dismiss: toast.dismiss,
  };
}

// ─── Toast Content ──────────────────────────────────────────
interface ToastContentProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  visible: boolean;
}

const ICONS: Record<string, ReactNode> = {
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

const COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'var(--color-success-50)',
    border: 'var(--color-success-500)',
    icon: 'var(--color-success-600)',
  },
  error: {
    bg: 'var(--color-error-50)',
    border: 'var(--color-error-500)',
    icon: 'var(--color-error-600)',
  },
  warning: {
    bg: 'var(--color-warning-50)',
    border: 'var(--color-warning-500)',
    icon: 'var(--color-warning-600)',
  },
  info: {
    bg: 'var(--color-info-50)',
    border: 'var(--color-info-500)',
    icon: 'var(--color-info-600)',
  },
};

function ToastContent({ variant, message, onClose, visible }: ToastContentProps) {
  const color = COLORS[variant];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        background: color.bg,
        borderLeft: `4px solid ${color.border}`,
        boxShadow: 'var(--shadow-lg)',
        maxWidth: '420px',
        width: '100%',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'all var(--transition-normal)',
        fontFamily: 'var(--font-family-sans)',
      }}
      role="alert"
    >
      <span style={{ color: color.icon, flexShrink: 0 }}>
        {ICONS[variant]}
      </span>
      <p
        style={{
          flex: 1,
          margin: 0,
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-text-primary)',
          lineHeight: 'var(--line-height-normal)',
        }}
      >
        {message}
      </p>
      <button
        onClick={onClose}
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-tertiary)',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 0,
          transition: 'color var(--transition-fast)',
        }}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Toaster Provider ───────────────────────────────────────
// Drop this once at the app root.
export function ToastProvider() {
  const position: ToastPosition = 'top-right';
  return (
    <Toaster
      position={position}
      containerStyle={{ top: 'calc(var(--topbar-height) + var(--space-2))' }}
      toastOptions={{
        style: { background: 'transparent', boxShadow: 'none', padding: 0 },
      }}
    />
  );
}
