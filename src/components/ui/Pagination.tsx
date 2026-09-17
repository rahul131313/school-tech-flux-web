/* ============================================================
   Pagination — Page navigation controls
   Works with Spring Boot's Page<T> response.
   ============================================================ */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;      // 0-indexed (Spring)
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: PaginationProps) {
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  if (totalElements === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <span className={styles.showing}>
          Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of{' '}
          <strong>{totalElements}</strong>
        </span>
        {onPageSizeChange && (
          <select
            className={styles.sizeSelect}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Page size"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>
                {s} / page
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.controls}>
        <button
          className={styles.btn}
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0}
          aria-label="First page"
          title="First page"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          className={styles.btn}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        <span className={styles.pageInfo}>
          Page <strong>{currentPage + 1}</strong> of <strong>{totalPages}</strong>
        </span>

        <button
          className={styles.btn}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          aria-label="Next page"
          title="Next page"
        >
          <ChevronRight size={16} />
        </button>
        <button
          className={styles.btn}
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1}
          aria-label="Last page"
          title="Last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
