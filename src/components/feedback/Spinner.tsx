/* ============================================================
   Spinner — Loading indicator
   - Full-screen overlay variant for blocking actions (login)
   - Inline variant for buttons / small areas
   ============================================================ */

import styles from './Spinner.module.css';

interface SpinnerProps {
  /** Full-screen overlay spinner (e.g. login) or inline */
  fullScreen?: boolean;
  /** Label for screen readers */
  label?: string;
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({
  fullScreen = false,
  label = 'Loading...',
  size = 'md',
}: SpinnerProps) {
  const spinner = (
    <div
      className={styles.spinner}
      data-size={size}
      role="status"
      aria-label={label}
    >
      <svg
        className={styles.svg}
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className={styles.track}
          cx="25"
          cy="25"
          r="20"
          strokeWidth="4"
        />
        <circle
          className={styles.arc}
          cx="25"
          cy="25"
          r="20"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={styles.overlay}>
        {spinner}
      </div>
    );
  }

  return spinner;
}
