/* ============================================================
   DataTable — Reusable data table with pagination
   Features: column definitions, loading skeleton, empty state,
   row actions, pagination, and responsive scroll.
   ============================================================ */

import React from 'react';
import type { SpringPage } from '../../api/types';
import { Pagination } from './Pagination';
import { Skeleton } from '../feedback/Skeleton';
import { EmptyState } from '../feedback/EmptyState';
import { Inbox } from 'lucide-react';
import styles from './DataTable.module.css';

export interface CellContext<T, TValue = any> {
  getValue: () => TValue;
  row: {
    original: T;
  };
}

export interface ColumnDef<T, TValue = any> {
  id?: string;
  accessorKey?: keyof T | string;
  header: React.ReactNode | (() => React.ReactNode);
  cell?: (info: CellContext<T, TValue>) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: SpringPage<T> | undefined;
  isLoading?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  emptyMessage?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  emptyMessage = 'No data found',
  emptyDescription,
  onEmptyAction,
  emptyActionLabel,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <Skeleton variant="table-row" rows={5} columns={columns.length} />
      </div>
    );
  }

  if (!data || !data.content || data.content.length === 0 || data.empty) {
    return (
      <div className={styles.container}>
        <EmptyState
          icon={<Inbox size={48} />}
          message={emptyMessage}
          description={emptyDescription}
          ctaLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              {columns.map((col, idx) => (
                <th key={col.id ?? String(col.accessorKey ?? idx)} className={styles.th}>
                  {typeof col.header === 'function' ? col.header() : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {data.content.map((row, rIdx) => (
              <tr key={(row as { id?: string | number })?.id ?? rIdx} className={styles.tr}>
                {columns.map((col, cIdx) => {
                  const rawValue = col.accessorKey
                    ? (row as Record<string, any>)[col.accessorKey as string]
                    : undefined;
                  return (
                    <td key={col.id ?? String(col.accessorKey ?? cIdx)} className={styles.td}>
                      {col.cell
                        ? col.cell({
                            getValue: () => rawValue,
                            row: { original: row },
                          })
                        : rawValue !== undefined && rawValue !== null
                        ? String(rawValue)
                        : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={data.totalPages}
        totalElements={data.totalElements}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
