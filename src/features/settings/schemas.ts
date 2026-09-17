/* ============================================================
   Settings — Zod Validation Schemas
   Mirror the backend's Bean Validation constraints from the
   OpenAPI spec. Used for client-side form validation.
   Zod v4 uses `message` (not `required_error`) and `error`
   for params on `.number()` and `.enum()`.
   ============================================================ */

import { z } from 'zod';

// ─── School ─────────────────────────────────────────────────
export const schoolSchema = z.object({
  name: z
    .string()
    .max(150, 'Name must be at most 150 characters')
    .optional()
    .or(z.literal('')),
  slug: z
    .string()
    .max(80, 'Slug must be at most 80 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Only lowercase letters, numbers, and hyphens')
    .optional()
    .or(z.literal('')),
  board: z
    .string()
    .max(80, 'Board must be at most 80 characters')
    .optional()
    .or(z.literal('')),
  subscriptionTier: z
    .string()
    .max(80, 'Subscription tier must be at most 80 characters')
    .optional()
    .or(z.literal('')),
  maxStudents: z
    .number({ message: 'Max students is required' })
    .int('Must be a whole number')
    .min(1, 'Must be at least 1'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'], {
    message: 'Status is required',
  }),
});

export type SchoolFormData = z.infer<typeof schoolSchema>;

// ─── Branch ─────────────────────────────────────────────────
export const branchSchema = z.object({
  name: z
    .string()
    .max(120, 'Name must be at most 120 characters')
    .optional()
    .or(z.literal('')),
  code: z
    .string()
    .max(40, 'Code must be at most 40 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Only uppercase letters, numbers, underscores, hyphens')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(500, 'Address must be at most 500 characters')
    .optional()
    .or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    message: 'Status is required',
  }),
});

export type BranchFormData = z.infer<typeof branchSchema>;

// ─── Academic Year ──────────────────────────────────────────
export const academicYearSchema = z
  .object({
    name: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-YY (e.g. 2025-26)')
      .optional()
      .or(z.literal('')),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    current: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export type AcademicYearFormData = z.infer<typeof academicYearSchema>;

// ─── Standard ───────────────────────────────────────────────
export const standardSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  name: z
    .string()
    .max(80, 'Name must be at most 80 characters')
    .optional()
    .or(z.literal('')),
  sequenceOrder: z
    .number({ message: 'Sequence order is required' })
    .int('Must be a whole number')
    .min(0, 'Must be 0 or greater'),
});

export type StandardFormData = z.infer<typeof standardSchema>;

// ─── Section ────────────────────────────────────────────────
export const sectionSchema = z.object({
  standardId: z.string().min(1, 'Standard is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  name: z
    .string()
    .max(20, 'Name must be at most 20 characters')
    .regex(/^[A-Za-z0-9 -]+$/, 'Only letters, numbers, spaces, and hyphens')
    .optional()
    .or(z.literal('')),
  classTeacherId: z.string().optional().or(z.literal('')),
  capacity: z
    .number()
    .int('Must be a whole number')
    .min(1, 'Must be at least 1')
    .optional(),
});

export type SectionFormData = z.infer<typeof sectionSchema>;

// ─── Subject ────────────────────────────────────────────────
export const subjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .regex(/^[A-Za-z0-9 .&()-]+$/, 'Only letters, numbers, spaces, and .&()-'),
});

export type SubjectFormData = z.infer<typeof subjectSchema>;

// ─── Timetable Slot ─────────────────────────────────────────
export const timetableSlotSchema = z
  .object({
    sectionId: z.string().min(1, 'Section is required'),
    dayOfWeek: z.enum(
      ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      { message: 'Day of week is required' }
    ),
    periodNumber: z
      .number({ message: 'Period number is required' })
      .int()
      .min(1, 'Must be at least 1'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    subjectId: z.string().min(1, 'Subject is required'),
    teacherId: z.string().min(1, 'Teacher is required'),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export type TimetableSlotFormData = z.infer<typeof timetableSlotSchema>;

// ─── Student Enrollment ─────────────────────────────────────
export const studentEnrollmentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  sectionId: z.string().min(1, 'Section is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  rollNumber: z
    .string()
    .min(1, 'Roll number is required')
    .regex(/^[A-Za-z0-9/-]+$/, 'Only letters, numbers, slashes, and hyphens'),
  status: z.enum(['ACTIVE', 'PROMOTED', 'LEFT', 'TRANSFERRED'], {
    message: 'Status is required',
  }),
  enrolledOn: z.string().min(1, 'Enrolled date is required'),
});

export type StudentEnrollmentFormData = z.infer<typeof studentEnrollmentSchema>;
