/* ============================================================
   SchoolConnect — API Type Definitions
   Standard envelopes, pagination, and shared types.
   These will be replaced by auto-generated types once the
   backend publishes their OpenAPI spec.
   ============================================================ */

// ─── Standard Error Envelope ────────────────────────────────
// Every backend error response follows this exact shape.
export interface FieldErrorItem {
  field: string;
  message: string;
}

export interface ApiError {
  success: false;
  errorCode: string;
  message: string;
  fieldErrors?: Record<string, string> | FieldErrorItem[];
  traceId: string;
}

export function normalizeFieldErrors(
  fieldErrors?: Record<string, string> | FieldErrorItem[]
): Record<string, string> {
  if (!fieldErrors) return {};
  if (Array.isArray(fieldErrors)) {
    return fieldErrors.reduce((acc, curr) => {
      acc[curr.field] = curr.message;
      return acc;
    }, {} as Record<string, string>);
  }
  return fieldErrors;
}

// ─── Standard Success Envelope ──────────────────────────────
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// ─── Pagination ─────────────────────────────────────────────
export interface PageRequest {
  page: number;
  size: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ─── User & Auth Types (Passwordless OTP Model) ──────────────
export type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'ACADEMIC_COORDINATOR'
  | 'TEACHER'
  | 'ACCOUNTANT'
  | 'HR_STAFF'
  | 'STUDENT'
  | 'PARENT'
  | 'SUPPORT_STAFF'
  | 'LIBRARIAN';

export interface AuthUser {
  id: string;
  role: UserRole;
  schoolId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export type OtpChannel = 'EMAIL' | 'SMS';

export interface OtpRequestPayload {
  phoneNumber: string;
  channel: OtpChannel;
  email?: string;
}

export interface OtpVerifyPayload {
  phoneNumber: string;
  otp: string;
}

export interface PasswordLoginPayload {
  phoneNumber: string;
  password: string;
  deviceInfo?: string;
}

export interface SetPasswordPayload {
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  userId?: string;
  schoolId?: string;
  role?: UserRole | string;
  user?: AuthUser;
}

export interface ChildInfo {
  id: string;
  name: string;
  standard?: string;
  section?: string;
  schoolId?: string;
}

export interface ChildSelectionResponse {
  requiresChildSelection: true;
  children: ChildInfo[];
}

export type OtpVerifyResponse = TokenResponse | ChildSelectionResponse;

export interface SelectChildPayload {
  childId: string;
}

export interface SelectSchoolPayload {
  schoolId: string;
}

export interface SelectSchoolResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  userId?: string;
  schoolId?: string;
  role?: UserRole | string;
}

export interface MessageResponse {
  message: string;
}

// ─── Branding / Tenant Config ───────────────────────────────
export interface BrandingConfig {
  tenantId: string;
  schoolName: string;
  tagline?: string;
  logoUrl?: string;
  accentColor?: string;
  faviconUrl?: string;
}

// ─── Type Guard ─────────────────────────────────────────────
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    (error as ApiError).success === false &&
    'errorCode' in error &&
    'message' in error
  );
}

// ─── Spring Pagination ──────────────────────────────────────
// Matches Spring Boot's Page<T> response shape exactly.
export interface SpringPage<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // current page (0-indexed)
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface SpringPageable {
  page?: number;
  size?: number;
  sort?: string[];
}

// ─── School (Onboarding) ────────────────────────────────────
export type SchoolStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface SchoolRequest {
  name?: string;
  slug?: string;
  board?: string;
  subscriptionTier?: string;
  maxStudents: number;
  status: SchoolStatus;
}

export interface SchoolResponse {
  id: string;
  name: string;
  slug: string;
  board: string;
  subscriptionTier: string;
  maxStudents: number;
  status: SchoolStatus;
}

// ─── Branch ─────────────────────────────────────────────────
export type BranchStatus = 'ACTIVE' | 'INACTIVE';

export interface BranchRequest {
  name?: string;
  code?: string;
  address?: string;
  status: BranchStatus;
}

export interface BranchResponse {
  id: string;
  name: string;
  code: string;
  address: string;
  status: BranchStatus;
}

// ─── Academic Year ──────────────────────────────────────────
export interface AcademicYearRequest {
  name?: string;
  startDate: string; // ISO date (yyyy-MM-dd)
  endDate: string;
  current?: boolean;
}

export interface AcademicYearResponse {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

// ─── Standard ───────────────────────────────────────────────
export interface StandardRequest {
  branchId: string;
  name?: string;
  sequenceOrder: number;
}

export interface StandardResponse {
  id: string;
  branchId: string;
  name: string;
  sequenceOrder: number;
}

// ─── Section ────────────────────────────────────────────────
export interface SectionRequest {
  standardId: string;
  academicYearId: string;
  name?: string;
  classTeacherId?: string;
  capacity?: number;
}

export interface SectionResponse {
  id: string;
  standardId: string;
  academicYearId: string;
  name: string;
  classTeacherId?: string;
  capacity?: number;
}

// ─── Subject ────────────────────────────────────────────────
export interface SubjectRequest {
  name?: string;
}

export interface SubjectResponse {
  id: string;
  name: string;
}

// ─── Timetable Slot ─────────────────────────────────────────
export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface TimetableSlotRequest {
  sectionId: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string; // HH:mm:ss
  endTime: string;
  subjectId: string;
  teacherId: string;
}

export interface TimetableSlotResponse {
  id: string;
  sectionId: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
}

// ─── Student Enrollment ─────────────────────────────────────
export type EnrollmentStatus = 'ACTIVE' | 'PROMOTED' | 'LEFT' | 'TRANSFERRED';

export interface StudentEnrollmentRequest {
  studentId: string;
  sectionId: string;
  academicYearId: string;
  rollNumber?: string;
  status: EnrollmentStatus;
  enrolledOn: string; // ISO date
}

export interface StudentEnrollmentResponse {
  id: string;
  studentId: string;
  sectionId: string;
  academicYearId: string;
  rollNumber: string;
  status: EnrollmentStatus;
  enrolledOn: string;
}

// ─── Student Attendance ─────────────────────────────────────
export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'EXCUSED';

export interface StudentAttendanceEntryRequest {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface StudentAttendanceBulkRequest {
  sectionId: string;
  date: string; // YYYY-MM-DD
  periodNumber?: number;
  entries: StudentAttendanceEntryRequest[];
}

export interface StudentAttendanceResponse {
  id: string;
  studentId: string;
  sectionId: string;
  date: string;
  periodNumber?: number;
  status: AttendanceStatus;
  remarks?: string;
}

// ─── Students (Direct Management) ───────────────────────────
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type StudentLifecycleStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'ALUMNI'
  | 'TRANSFERRED'
  | 'GRADUATED';

export interface StudentRequest {
  branchId: string;
  admissionNumber: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  bloodGroup?: string;
  photoUrl?: string;
  admissionDate: string; // YYYY-MM-DD
  status: StudentLifecycleStatus;
}

export interface StudentResponse {
  id: string;
  branchId: string;
  admissionNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string;
  photoUrl?: string;
  admissionDate: string;
  status: StudentLifecycleStatus;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Guardian Types ─────────────────────────────────────────
export type GuardianRelation = 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';

export interface GuardianRequest {
  phoneNumber: string;
  name: string;
  email?: string;
}

export interface StudentGuardianRequest {
  guardianId?: string;
  guardian?: GuardianRequest;
  relation: GuardianRelation;
  primaryContact: boolean;
}

// ─── Custom Roles & Action Grants (V9) ──────────────────────
export type RoleStatus = 'ACTIVE' | 'INACTIVE';

export interface RoleRequest {
  code: string;
  name: string;
  description?: string;
}

export interface RoleResponse {
  id: string;
  schoolId?: string;
  code: string;
  name: string;
  description?: string;
  system: boolean;
  status: RoleStatus;
}

export type PermissionAction =
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'PUBLISH'
  | 'LOCK'
  | 'CONFIGURE'
  | 'SELF_VIEW'
  | 'SELF_UPDATE';

export interface RolePermissionGrantRequest {
  action: PermissionAction;
}

export interface RolePermissionResponse {
  id: string;
  schoolId?: string;
  roleId: string;
  moduleKey: string;
  action: PermissionAction;
}

export type RolePermissionItem = RolePermissionResponse;

export type EffectivePermissionsResponse = RolePermissionResponse[];



