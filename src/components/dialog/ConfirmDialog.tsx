/* ============================================================
   ConfirmDialog — "Are you sure?" modal
   Features:
   - Consistent button order: Cancel (left) → Confirm (right)
   - Keyboard: Escape to cancel, Enter to confirm
   - Focus trap (native <dialog>)
   - Portal-rendered overlay
   ============================================================ */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import styles from './ConfirmDialog.module.css';

// ─── Types ──────────────────────────────────────────────────
interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ─── Context ────────────────────────────────────────────────
const ConfirmContext = createContext<ConfirmContextType | null>(null);

// ─── Hook ───────────────────────────────────────────────────
export function useConfirm(): ConfirmContextType {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleConfirm = useCallback(() => {
    resolverRef.current?.(true);
    setIsOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    resolverRef.current?.(false);
    setIsOpen(false);
  }, []);

  // Handle Escape via dialog's native cancel event
  const handleDialogCancel = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      handleCancel();
    },
    [handleCancel]
  );

  // Handle Enter key to confirm
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    },
    [handleConfirm]
  );

  const isDanger = options?.variant === 'danger';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onCancel={handleDialogCancel}
        onKeyDown={handleKeyDown}
      >
        {isOpen && options && (
          <div className={styles.content}>
            <div className={styles.header}>
              {isDanger && (
                <div className={styles.iconWrapper} data-danger>
                  <AlertTriangle size={24} />
                </div>
              )}
              <h3 className={styles.title}>{options.title}</h3>
            </div>
            <p className={styles.message}>{options.message}</p>
            <div className={styles.actions}>
              <Button
                variant="secondary"
                onClick={handleCancel}
                size="md"
              >
                {options.cancelLabel || 'Cancel'}
              </Button>
              <Button
                variant={isDanger ? 'danger' : 'primary'}
                onClick={handleConfirm}
                size="md"
              >
                {options.confirmLabel || 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
