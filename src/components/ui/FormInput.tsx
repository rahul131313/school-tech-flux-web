/* ============================================================
   FormInput — Shared form input component
   Features:
   - Red border + red helper text when error is set
   - Server-side and client-side errors render identically
   - Validate on blur support
   - Accessible: label association, aria-describedby for errors
   ============================================================ */

import { forwardRef, type InputHTMLAttributes, useId } from 'react';
import styles from './FormInput.module.css';

interface FormInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      id: externalId,
      className,
      required,
      disabled,
      ...inputProps
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = externalId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);

    return (
      <div
        className={`${styles.wrapper} ${className || ''}`}
        data-size={size}
        data-error={hasError || undefined}
        data-disabled={disabled || undefined}
      >
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          {...inputProps}
        />
        {hasError && (
          <p id={errorId} className={styles.error} role="alert">
            {error}
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

FormInput.displayName = 'FormInput';
