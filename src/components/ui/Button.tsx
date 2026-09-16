/* ============================================================
   Button — Shared button component
   Variants: primary, secondary, ghost, danger
   Sizes: sm, md, lg
   States: loading (with spinner), disabled
   ============================================================ */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth = false,
      children,
      disabled,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`${styles.button} ${className || ''}`}
        data-variant={variant}
        data-size={size}
        data-full-width={fullWidth || undefined}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className={styles.spinner} size={size === 'sm' ? 14 : 18} />
        ) : icon ? (
          <span className={styles.icon}>{icon}</span>
        ) : null}
        {children && <span className={styles.label}>{children}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
