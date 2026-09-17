/* ============================================================
   Toast — Shared Toast Notification System
   Features:
   - Positioned at bottom-right so it never overrides tabs/headers
   - Fully dismissible (click (X) or click card to cancel)
   - Deduplicated (same message never stacks duplicates)
   - Non-blocking container (pointer-events pass through)
   - High-grade SaaS styling with icons and smooth entry
   ============================================================ */

import toast, { Toaster, type ToastPosition } from 'react-hot-toast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';

// ─── Toast Types & Theme ────────────────────────────────────
type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastContentProps {
  variant: ToastVariant;
  message: string;
  onClose: () => void;
  visible: boolean;
}

const ICONS: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <AlertCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const THEMES: Record<ToastVariant, { bg: string; border: string; iconColor: string; textColor: string }> = {
  success: {
    bg: '#ffffff',
    border: 'var(--color-success-500, #22c55e)',
    iconColor: 'var(--color-success-600, #16a34a)',
    textColor: 'var(--color-neutral-900, #0f172a)',
  },
  error: {
    bg: '#ffffff',
    border: 'var(--color-error-500, #ef4444)',
    iconColor: 'var(--color-error-600, #dc2626)',
    textColor: 'var(--color-neutral-900, #0f172a)',
  },
  warning: {
    bg: '#ffffff',
    border: 'var(--color-warning-500, #f59e0b)',
    iconColor: 'var(--color-warning-600, #d97706)',
    textColor: 'var(--color-neutral-900, #0f172a)',
  },
  info: {
    bg: '#ffffff',
    border: 'var(--color-primary-500, #6366f1)',
    iconColor: 'var(--color-primary-600, #4f46e5)',
    textColor: 'var(--color-neutral-900, #0f172a)',
  },
};

function ToastContent({ variant, message, onClose, visible }: ToastContentProps) {
  const theme = THEMES[variant];

  return (
    <div
      onClick={onClose}
      role="alert"
      title="Click to dismiss"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '12px',
        background: theme.bg,
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderLeft: `5px solid ${theme.border}`,
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 4px 10px -2px rgba(0, 0, 0, 0.08)',
        maxWidth: '420px',
        width: '100%',
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: 'var(--font-family-sans, sans-serif)',
        pointerEvents: 'auto',
      }}
    >
      <span style={{ color: theme.iconColor, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {ICONS[variant]}
      </span>

      <p
        style={{
          flex: 1,
          margin: 0,
          fontSize: '13px',
          fontWeight: 500,
          color: theme.textColor,
          lineHeight: 1.45,
          wordBreak: 'break-word',
        }}
      >
        {message}
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          color: '#94a3b8',
          cursor: 'pointer',
          background: 'rgba(0, 0, 0, 0.04)',
          border: 'none',
          padding: 0,
          transition: 'all 0.15s ease',
        }}
        aria-label="Cancel notification"
        title="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Unified Notification API ───────────────────────────────
export const notify = {
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
      { id: `success-${message}`, duration: 3500 }
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
      { id: `error-${message}`, duration: 4000 }
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
      { id: `warning-${message}`, duration: 3500 }
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
      { id: `info-${message}`, duration: 3500 }
    );
  },
  dismiss: (id?: string) => {
    if (id) toast.dismiss(id);
    else toast.dismiss();
  },
};

export function useToast() {
  return notify;
}

// ─── Toaster Provider Component ─────────────────────────────
export function ToastProvider() {
  const position: ToastPosition = 'bottom-right';

  return (
    <Toaster
      position={position}
      containerStyle={{
        bottom: '24px',
        right: '24px',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      toastOptions={{
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          pointerEvents: 'auto',
        },
      }}
    />
  );
}
