/* ============================================================
   StatusBadge — Colored badge for displaying status values
   ============================================================ */

import styles from './StatusBadge.module.css';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'error',
  PROMOTED: 'info',
  LEFT: 'warning',
  TRANSFERRED: 'warning',
};

/**
 * Automatically maps common status strings to badge variants.
 * Pass a custom `variant` to override.
 */
export function StatusBadge({ label, variant, className }: StatusBadgeProps) {
  const resolvedVariant =
    variant || STATUS_VARIANT_MAP[label.toUpperCase()] || 'neutral';

  return (
    <span
      className={`${styles.badge} ${className || ''}`}
      data-variant={resolvedVariant}
    >
      <span className={styles.dot} />
      {label.charAt(0) + label.slice(1).toLowerCase().replace('_', ' ')}
    </span>
  );
}
