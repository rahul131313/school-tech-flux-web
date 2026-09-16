/* ============================================================
   Skeleton — Shimmer loading placeholders
   Variants: text, circle, rect, table-row
   Composable for building page-specific skeleton screens
   ============================================================ */

import styles from './Skeleton.module.css';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect' | 'table-row';
  width?: string | number;
  height?: string | number;
  lines?: number;         // For 'text' variant — how many lines
  columns?: number;       // For 'table-row' variant — how many cells
  rows?: number;          // For 'table-row' variant — how many rows
  className?: string;
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  lines = 3,
  columns = 5,
  rows = 5,
  className,
}: SkeletonProps) {
  if (variant === 'text') {
    return (
      <div className={`${styles.textWrapper} ${className || ''}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={styles.shimmer}
            style={{
              height: height || '14px',
              width: i === lines - 1 ? '60%' : width || '100%',
              borderRadius: 'var(--radius-md)',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    const size = typeof width === 'number' ? `${width}px` : width || '40px';
    return (
      <div
        className={`${styles.shimmer} ${className || ''}`}
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--radius-full)',
        }}
      />
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={`${styles.tableWrapper} ${className || ''}`}>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className={styles.tableRow}>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div
                key={colIdx}
                className={styles.shimmer}
                style={{
                  flex: colIdx === 0 ? 2 : 1,
                  height: '16px',
                  borderRadius: 'var(--radius-md)',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Default: rect
  return (
    <div
      className={`${styles.shimmer} ${className || ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width || '100%',
        height: typeof height === 'number' ? `${height}px` : height || '120px',
        borderRadius: 'var(--radius-lg)',
      }}
    />
  );
}
