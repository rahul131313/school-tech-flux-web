/* ============================================================
   Auth Validation Schemas (Zod) — Passwordless OTP Model
   Matches backend Bean Validation constraints.
   ============================================================ */

import { z } from 'zod';

// E.164 international phone number regex matching backend: ^\+[1-9]\d{7,14}$
export const E164_REGEX = /^\+[1-9]\d{7,14}$/;

// ─── OTP Request Schema ──────────────────────────────────────
export const otpRequestSchema = z
  .object({
    phoneNumber: z
      .string()
      .min(1, 'Phone number is required')
      .regex(
        E164_REGEX,
        'Phone number must be in E.164 format (e.g. +919876543210)'
      ),
    channel: z.enum(['EMAIL', 'SMS'], {
      error: 'Please select an OTP delivery channel',
    }),
    email: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.channel === 'EMAIL') {
        return (
          !!data.email &&
          data.email.trim().length > 0 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
        );
      }
      return true;
    },
    {
      message: 'A valid email address is required when choosing Email delivery',
      path: ['email'],
    }
  );

export type OtpRequestFormData = z.infer<typeof otpRequestSchema>;

// ─── OTP Verify Schema ───────────────────────────────────────
export const otpVerifySchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(E164_REGEX, 'Invalid phone number format'),
  otp: z
    .string()
    .min(6, 'Enter the 6-digit OTP')
    .max(6, 'Enter the 6-digit OTP')
    .regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export type OtpVerifyFormData = z.infer<typeof otpVerifySchema>;

// ─── Password Login Schema (Web) ─────────────────────────────
export const passwordLoginSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(E164_REGEX, 'Phone number must be in E.164 format (e.g. +919876543210)'),
  password: z.string().min(1, 'Password is required'),
  deviceInfo: z.string().optional(),
});

export type PasswordLoginFormData = z.infer<typeof passwordLoginSchema>;

// ─── Set Password Schema ─────────────────────────────────────
export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

// ─── Validation Helper ───────────────────────────────────────
export function validateField<T extends z.ZodType>(
  schema: T,
  field: string,
  value: unknown,
  formData: Record<string, unknown>
): string | undefined {
  const result = schema.safeParse({ ...formData, [field]: value });
  if (result.success) return undefined;

  const fieldError = result.error.issues.find((err) => err.path[0] === field);
  return fieldError?.message;
}
