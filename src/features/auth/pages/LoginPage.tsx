/* ============================================================
   LoginPage — Premium glassmorphism login screen
   Features:
   - School branding (logo, name, tagline) with fallback
   - Email + password fields using <FormInput>
   - "Remember me" checkbox
   - "Forgot password?" link
   - Enter key submits
   - Full-screen Spinner overlay during API call
   - Client-side Zod validation on blur
   - Server-side error mapping to same <FormInput> error prop
   - Responsive: centered card on desktop, full-width on mobile
   ============================================================ */

import { useState, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router';
import { GraduationCap } from 'lucide-react';
import { FormInput } from '../../../components/ui/FormInput';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/feedback/Spinner';
import { useLogin } from '../hooks/useLogin';
import { loginSchema, validateField, type LoginFormData } from '../schemas';
import { useThemeStore } from '../../../stores/themeStore';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { schoolName, tagline, logoUrl } = useThemeStore();

  // ── Form State ──────────────────────────────────────────
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ── Mutation ────────────────────────────────────────────
  const loginMutation = useLogin({
    onFieldErrors: (serverErrors) => {
      // Server-side errors render identically to client-side — same component, same styling
      setFieldErrors((prev) => ({ ...prev, ...serverErrors }));
    },
  });

  // ── Handlers ────────────────────────────────────────────
  const handleChange = useCallback(
    (field: keyof LoginFormData) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
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
    (field: keyof LoginFormData) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      const error = validateField(loginSchema, field, formData[field], formData);
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

      // Full form validation
      const result = loginSchema.safeParse(formData);
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((err) => {
          const field = err.path[0] as string;
          if (!errors[field]) {
            errors[field] = err.message;
          }
        });
        setFieldErrors(errors);
        setTouched({ email: true, password: true });
        return;
      }

      // Submit to API
      loginMutation.mutate(result.data);
    },
    [formData, loginMutation]
  );

  return (
    <div className={styles.page}>
      {/* Full-screen spinner during login */}
      {loginMutation.isPending && <Spinner fullScreen label="Signing in..." />}

      {/* Animated background shapes */}
      <div className={styles.bgShapes}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />
      </div>

      <div className={styles.card}>
        {/* Branding Header */}
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
          <h1 className={styles.schoolName}>{schoolName}</h1>
          <p className={styles.tagline}>{tagline}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FormInput
            label="Email Address"
            type="email"
            placeholder="you@school.edu"
            value={formData.email}
            onChange={handleChange('email')}
            onBlur={handleBlur('email')}
            error={touched.email ? fieldErrors.email : undefined}
            required
            autoComplete="email"
            autoFocus
          />

          <FormInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange('password')}
            onBlur={handleBlur('password')}
            error={touched.password ? fieldErrors.password : undefined}
            required
            autoComplete="current-password"
          />

          <div className={styles.formOptions}>
            <label className={styles.rememberMe}>
              <input type="checkbox" className={styles.checkbox} />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loginMutation.isPending}
            disabled={loginMutation.isPending}
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <p className={styles.footer}>
          Powered by <strong>SchoolConnect</strong>
        </p>
      </div>
    </div>
  );
}
