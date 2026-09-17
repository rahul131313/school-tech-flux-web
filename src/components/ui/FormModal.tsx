/* ============================================================
   FormModal — Reusable modal dialog for create/edit forms
   Built on native <dialog> with fixed viewport centering
   and modern inline/banner error handling.
   ============================================================ */

import {
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type FormEvent,
} from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import styles from './FormModal.module.css';

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  title: string;
  children: ReactNode;
  submitLabel?: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  error?: string | null;
}

export function FormModal({
  open,
  onClose,
  onSubmit,
  title,
  children,
  submitLabel = 'Save',
  loading = false,
  size = 'md',
  error,
}: FormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  const handleCancel = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      onClose();
    },
    [onClose]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      // Close if clicking the backdrop (::backdrop area)
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      data-size={size}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className={styles.form} noValidate>
          <div className={styles.body}>
            {error && (
              <div className={styles.errorBanner} role="alert">
                <AlertCircle size={18} className={styles.errorBannerIcon} />
                <span className={styles.errorBannerText}>{error}</span>
              </div>
            )}
            {children}
          </div>

          <div className={styles.footer}>
            <Button
              variant="secondary"
              onClick={onClose}
              type="button"
              size="md"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              size="md"
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
