/* ============================================================
   Student Form Validation Schemas (Zod)
   ============================================================ */

import { z } from 'zod';

export const studentSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  admissionNumber: z.string().trim().min(1, 'Admission number is required'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid Date of Birth (YYYY-MM-DD) is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().optional(),
  photoUrl: z
    .string()
    .trim()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
  admissionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid Admission Date (YYYY-MM-DD) is required'),
  status: z.enum([
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'ALUMNI',
    'TRANSFERRED',
    'GRADUATED',
  ]),
});

export type StudentFormData = z.infer<typeof studentSchema>;
