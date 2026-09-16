/* ============================================================
   Auth Validation Schemas (Zod)
   Mirror the backend's Bean Validation rules.
   Used for client-side validation on blur/submit.
   ============================================================ */

import { z } from 'zod';

// ─── Login ──────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Forgot Password ───────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password ────────────────────────────────────────
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'At least one uppercase letter')
      .regex(/[a-z]/, 'At least one lowercase letter')
      .regex(/[0-9]/, 'At least one digit')
      .regex(/[^A-Za-z0-9]/, 'At least one special character'),
    confirmPassword: z
      .string()
      .min(1, 'Confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Validation Helper ─────────────────────────────────────
/**
 * Validates a single field against a schema and returns the error
 * message (if any). Used for on-blur validation.
 */
export function validateField<T extends z.ZodType>(
  schema: T,
  field: string,
  value: unknown,
  formData: Record<string, unknown>
): string | undefined {
  const result = schema.safeParse({ ...formData, [field]: value });
  if (result.success) return undefined;

  const fieldError = result.error.issues.find(
    (err) => err.path[0] === field
  );
  return fieldError?.message;
}
