/* ============================================================
   FormSelect — Shared select dropdown component
   Mirrors the FormInput API for consistency.
   ============================================================ */

import { forwardRef, type SelectHTMLAttributes, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import styles from './FormSelect.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      size = 'md',
      placeholder,
      id: externalId,
      className,
      required,
      disabled,
      ...selectProps
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = externalId || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const hasError = Boolean(error);

    return (
      <div
        className={`${styles.wrapper} ${className || ''}`}
        data-size={size}
        data-error={hasError || undefined}
        data-disabled={disabled || undefined}
      >
        <label htmlFor={selectId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={styles.select}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          {...selectProps}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasError && (
          <p id={errorId} className={styles.error} role="alert">
            <AlertCircle size={13} className={styles.errorIcon} />
            <span>{error}</span>
          </p>
        )}
        {!hasError && helperText && (
          <p id={helperId} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
