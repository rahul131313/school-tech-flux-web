/* ============================================================
   ResetPasswordPage
   - Token from URL params
   - New password + confirm password
   - Zod validation with password strength rules
   - Success: redirect to login with toast
   ============================================================ */

import { useState, useCallback, type FormEvent } from 'react';
import { useParams, Link } from 'react-router';
import { GraduationCap, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { FormInput } from '../../../components/ui/FormInput';
import { Button } from '../../../components/ui/Button';
import { useResetPassword } from '../hooks/useResetPassword';
import {
  resetPasswordSchema,
  validateField,
  type ResetPasswordFormData,
} from '../schemas';
import { useThemeStore } from '../../../stores/themeStore';
import styles from './ResetPasswordPage.module.css';

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const { schoolName, logoUrl } = useThemeStore();

  const [formData, setFormData] = useState<ResetPasswordFormData>({
    newPassword: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mutation = useResetPassword({
    onFieldErrors: (serverErrors) => {
      setFieldErrors((prev) => ({ ...prev, ...serverErrors }));
    },
  });

  const handleChange = useCallback(
    (field: keyof ResetPasswordFormData) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
        }
      },
    [fieldErrors]
  );

  const handleBlur = useCallback(
    (field: keyof ResetPasswordFormData) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const error = validateField(
        resetPasswordSchema,
        field,
        formData[field],
        formData
      );
      if (error) {
        setFieldErrors((prev) => ({ ...prev, [field]: error }));
      } else {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [formData]
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const result = resetPasswordSchema.safeParse(formData);
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((err) => {
          const field = err.path[0] as string;
          if (!errors[field]) errors[field] = err.message;
        });
        setFieldErrors(errors);
        setTouched({ newPassword: true, confirmPassword: true });
        return;
      }

      if (!token) {
        setFieldErrors({ newPassword: 'Invalid or expired reset link.' });
        return;
      }

      mutation.mutate({ token, newPassword: result.data.newPassword });
    },
    [formData, token, mutation]
  );

  // Password strength indicator
  const getPasswordStrength = (
    password: string
  ): { label: string; level: number; color: string } => {
    if (!password) return { label: '', level: 0, color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: 'Weak', level: 1, color: 'var(--color-error-500)' };
    if (score <= 3) return { label: 'Fair', level: 2, color: 'var(--color-warning-500)' };
    if (score <= 4) return { label: 'Good', level: 3, color: 'var(--color-info-500)' };
    return { label: 'Strong', level: 4, color: 'var(--color-success-500)' };
  };

  const strength = getPasswordStrength(formData.newPassword);

  return (
    <div className={styles.page}>
      <div className={styles.bgShapes}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
      </div>

      <div className={styles.card}>
        {/* Brand */}
        <div className={styles.brandHeader}>
          <div className={styles.logoContainer}>
            {logoUrl ? (
              <img src={logoUrl} alt={schoolName} className={styles.logo} />
            ) : (
              <div className={styles.logoFallback}>
                <GraduationCap size={32} />
              </div>
            )}
          </div>
        </div>

        <div className={styles.textBlock}>
          <div className={styles.shieldIcon}>
            <ShieldCheck size={24} />
          </div>
          <h1 className={styles.title}>Reset your password</h1>
          <p className={styles.subtitle}>
            Choose a strong password that you haven&rsquo;t used before.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.passwordWrapper}>
            <FormInput
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={formData.newPassword}
              onChange={handleChange('newPassword')}
              onBlur={handleBlur('newPassword')}
              error={
                touched.newPassword ? fieldErrors.newPassword : undefined
              }
              required
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password strength bar */}
          {formData.newPassword && (
            <div className={styles.strengthWrapper}>
              <div className={styles.strengthBar}>
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={styles.strengthSegment}
                    style={{
                      backgroundColor:
                        level <= strength.level
                          ? strength.color
                          : 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ))}
              </div>
              <span
                className={styles.strengthLabel}
                style={{ color: strength.color }}
              >
                {strength.label}
              </span>
            </div>
          )}

          <div className={styles.passwordWrapper}>
            <FormInput
              label="Confirm Password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              error={
                touched.confirmPassword
                  ? fieldErrors.confirmPassword
                  : undefined
              }
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={
                showConfirm ? 'Hide password' : 'Show password'
              }
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={mutation.isPending}
            disabled={mutation.isPending}
          >
            Reset Password
          </Button>
        </form>

        <Link to="/login" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
}
