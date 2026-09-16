/* ============================================================
   ForgotPasswordPage
   - Email input + submit
   - Success state: "Check your email" EmptyState
   - Same validation + error handling patterns as login
   ============================================================ */

import { useState, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router';
import { GraduationCap, ArrowLeft, Mail } from 'lucide-react';
import { FormInput } from '../../../components/ui/FormInput';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { useForgotPassword } from '../hooks/useForgotPassword';
import {
  forgotPasswordSchema,
  validateField,
  type ForgotPasswordFormData,
} from '../schemas';
import { useThemeStore } from '../../../stores/themeStore';
import styles from './ForgotPasswordPage.module.css';

export function ForgotPasswordPage() {
  const { schoolName, logoUrl } = useThemeStore();

  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [emailSent, setEmailSent] = useState(false);

  const mutation = useForgotPassword({
    onFieldErrors: (serverErrors) => {
      setFieldErrors((prev) => ({ ...prev, ...serverErrors }));
    },
    onSuccess: () => setEmailSent(true),
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData({ email: value });
      if (fieldErrors.email) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.email;
          return next;
        });
      }
    },
    [fieldErrors]
  );

  const handleBlur = useCallback(() => {
    setTouched({ email: true });
    const error = validateField(
      forgotPasswordSchema,
      'email',
      formData.email,
      formData
    );
    if (error) {
      setFieldErrors({ email: error });
    } else {
      setFieldErrors({});
    }
  }, [formData]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const result = forgotPasswordSchema.safeParse(formData);
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((err) => {
          const field = err.path[0] as string;
          if (!errors[field]) errors[field] = err.message;
        });
        setFieldErrors(errors);
        setTouched({ email: true });
        return;
      }
      mutation.mutate(result.data);
    },
    [formData, mutation]
  );

  return (
    <div className={styles.page}>
      {/* Background shapes (reuse login aesthetic) */}
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

        {emailSent ? (
          /* ── Success State ─────────────────────────────────── */
          <div className={styles.successState}>
            <EmptyState
              icon={<Mail size={32} />}
              message="Check your email"
              description={`We've sent a password reset link to ${formData.email}. It may take a few minutes to arrive.`}
            />
            <div className={styles.successActions}>
              <Button
                variant="secondary"
                onClick={() => {
                  setEmailSent(false);
                  setFormData({ email: '' });
                }}
                size="md"
              >
                Try a different email
              </Button>
              <Link to="/login" className={styles.backLink}>
                <ArrowLeft size={16} />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          /* ── Form State ────────────────────────────────────── */
          <>
            <div className={styles.textBlock}>
              <h1 className={styles.title}>Forgot your password?</h1>
              <p className={styles.subtitle}>
                Enter your email address and we&rsquo;ll send you a link to
                reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <FormInput
                label="Email Address"
                type="email"
                placeholder="you@school.edu"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email ? fieldErrors.email : undefined}
                required
                autoComplete="email"
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={mutation.isPending}
                disabled={mutation.isPending}
              >
                Send Reset Link
              </Button>
            </form>

            <Link to="/login" className={styles.backLink}>
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
