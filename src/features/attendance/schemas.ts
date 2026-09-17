/* ============================================================
   Attendance Validation Schemas (Zod)
   Mirrors Spring Boot Bean Validation constraints:
   - date: required, YYYY-MM-DD
   - sectionId: required UUID
   - entries: min 1 item
   ============================================================ */

import { z } from 'zod';

export const attendanceStatusSchema = z.enum([
  'PRESENT',
  'ABSENT',
  'LATE',
  'HALF_DAY',
  'EXCUSED',
]);

export const attendanceEntrySchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  status: attendanceStatusSchema,
  remarks: z.string().max(500, 'Remarks cannot exceed 500 characters').optional(),
});

export const attendanceBulkSchema = z.object({
  sectionId: z.string().min(1, 'Section is required'),
  date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  periodNumber: z.number().int().positive().optional(),
  entries: z.array(attendanceEntrySchema).min(1, 'At least one student entry is required'),
});

export type AttendanceBulkFormData = z.infer<typeof attendanceBulkSchema>;
export type AttendanceEntryFormData = z.infer<typeof attendanceEntrySchema>;
