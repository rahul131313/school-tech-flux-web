/* ============================================================
   EmptyState — Centered empty content placeholder
   Props: icon, message, ctaLabel, onAction
   ============================================================ */

import type { ReactNode } from 'react';
import { Button } from '../ui/Button';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  description?: string;
  ctaLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  message,
  description,
  ctaLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>{icon}</div>
      <h3 className={styles.message}>{message}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {ctaLabel && onAction && (
        <Button variant="primary" onClick={onAction} size="md">
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
