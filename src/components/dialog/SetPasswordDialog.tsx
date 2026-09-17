/* ============================================================
   SetPasswordDialog — Modal for setting/updating user password
   Consumes POST /api/v1/auth/password/set
   ============================================================ */

import { useState, type FormEvent } from 'react';
import { X, Eye, EyeOff, Lock } from 'lucide-react';
import { useSetPassword } from '../../features/auth/hooks/useSetPassword';
import { setPasswordSchema, type SetPasswordFormData } from '../../features/auth/schemas';
import { Button } from '../ui/Button';
import styles from './SetPasswordDialog.module.css';

interface SetPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetPasswordDialog({ isOpen, onClose }: SetPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setPasswordMutation = useSetPassword({
    onSuccess: () => {
      setPassword('');
      setConfirmPassword('');
      setErrors({});
      onClose();
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData: SetPasswordFormData = {
      password,
      confirmPassword,
    };

    const validation = setPasswordSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setPasswordMutation.mutate({ password });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} style={{ color: 'var(--color-primary-600)' }} />
            <h2 className={styles.title}>Set Account Password</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="newPassword">
                New Password
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password ? (
                <span className={styles.errorText}>{errors.password}</span>
              ) : (
                <span className={styles.hintText}>
                  Min 8 characters, with uppercase, lowercase, number, and special character.
                </span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              {errors.confirmPassword && (
                <span className={styles.errorText}>{errors.confirmPassword}</span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={setPasswordMutation.isPending}
            >
              Save Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
