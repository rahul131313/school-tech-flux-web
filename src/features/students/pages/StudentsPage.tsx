/* ============================================================
   StudentsPage — Comprehensive Student Directory & Management
   Direct Student Entity CRUD per OpenAPI Spec:
   GET   /api/v1/students
   POST  /api/v1/students
   GET   /api/v1/students/{id}
   PATCH /api/v1/students/{id}
   ============================================================ */

import { useState, useMemo, type FormEvent } from 'react';
import {
  UserPlus,
  UploadCloud,
  Pencil,
  Search,
  Users,
} from 'lucide-react';
import { type ColumnDef, DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect, type SelectOption } from '../../../components/ui/FormSelect';
import { FormModal } from '../../../components/ui/FormModal';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { PageHeader } from '../../settings/components/PageHeader';
import { useToast } from '../../../components/ui/Toast';
import { extractErrorMessage } from '../../../lib/queryClient';
import { useBranches } from '../../settings/hooks/useBranches';
import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useLinkGuardian,
  useUnlinkGuardian,
} from '../hooks/useStudents';
import { studentSchema, type StudentFormData } from '../schemas';
import type {
  StudentResponse,
  Gender,
  StudentLifecycleStatus,
  GuardianRelation,
} from '../../../api/types';
import tableStyles from '../../../components/ui/DataTable.module.css';

const GENDER_OPTIONS: SelectOption[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

const BLOOD_GROUP_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select Blood Group (Optional)' },
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB-' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O-' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'ALUMNI', label: 'Alumni' },
  { value: 'TRANSFERRED', label: 'Transferred' },
  { value: 'GRADUATED', label: 'Graduated' },
];

const EMPTY_FORM: StudentFormData = {
  branchId: '',
  admissionNumber: '',
  fullName: '',
  dateOfBirth: '',
  gender: 'MALE',
  bloodGroup: '',
  photoUrl: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  status: 'ACTIVE',
};

export function StudentsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals & Dialogs state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Guardian Modal & Form State
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [guardianDialogStudent, setGuardianDialogStudent] = useState<StudentResponse | null>(null);
  const [guardianForm, setGuardianForm] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    relation: 'FATHER' as GuardianRelation,
    primaryContact: true,
  });
  const [unlinkGuardianId, setUnlinkGuardianId] = useState('');
  const [guardianErrors, setGuardianErrors] = useState<Record<string, string>>({});

  // Queries & Mutations
  const { data: branchesData } = useBranches({ size: 100 });
  const { data: studentsData, isLoading } = useStudents({
    page,
    size: pageSize,
    branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
    status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
    search: searchQuery.trim() || undefined,
  });

  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const linkGuardianMutation = useLinkGuardian();
  const unlinkGuardianMutation = useUnlinkGuardian();
  const toast = useToast();

  // Branch map for quick lookup
  const branchMap = useMemo(() => {
    const map = new Map<string, string>();
    if (branchesData?.content) {
      branchesData.content.forEach((b) => map.set(b.id, b.name));
    }
    return map;
  }, [branchesData]);

  const branchSelectOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [{ value: '', label: 'Select Branch' }];
    if (branchesData?.content) {
      branchesData.content.forEach((b) =>
        opts.push({ value: b.id, label: `${b.name} (${b.code || 'Main'})` })
      );
    }
    return opts;
  }, [branchesData]);

  // Client-side fallback filter if backend does not search text
  const displayedStudents = useMemo(() => {
    if (!studentsData) return undefined;
    if (!searchQuery.trim()) return studentsData;

    const q = searchQuery.toLowerCase();
    const filtered = studentsData.content.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q)
    );
    return {
      ...studentsData,
      content: filtered,
      totalElements: filtered.length,
    };
  }, [studentsData, searchQuery]);

  const columns: ColumnDef<StudentResponse>[] = [
    {
      accessorKey: 'fullName',
      header: 'Student',
      cell: ({ row }) => {
        const student = row.original;
        const initials = student.fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: 'var(--brand-accent-light, #e0e7ff)',
                color: 'var(--brand-accent, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 13,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.fullName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {student.fullName}
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                DOB: {student.dateOfBirth || '—'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'admissionNumber',
      header: 'Admission #',
      cell: ({ getValue }) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 600,
            background: 'var(--color-surface-secondary, #f1f5f9)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {(getValue() as string) || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'branchId',
      header: 'Branch',
      cell: ({ getValue }) =>
        branchMap.get(getValue() as string) || 'Main Branch',
    },
    {
      accessorKey: 'gender',
      header: 'Gender / Blood Group',
      cell: ({ row }) => {
        const s = row.original;
        const bgLabel = s.bloodGroup
          ? s.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')
          : null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{s.gender}</span>
            {bgLabel && (
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  padding: '1px 6px',
                  borderRadius: 4,
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  fontWeight: 600,
                }}
              >
                {bgLabel}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'admissionDate',
      header: 'Admission Date',
      cell: ({ getValue }) => (getValue() as string) || '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge label={getValue() as string} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className={tableStyles.actions}>
          <button
            className={tableStyles.actionBtn}
            onClick={() => openEdit(row.original)}
            title="Edit Student"
            aria-label="Edit Student"
          >
            <Pencil size={15} />
          </button>
          <button
            className={tableStyles.actionBtn}
            onClick={() => setGuardianDialogStudent(row.original)}
            title="Manage Guardians"
            aria-label="Manage Guardians"
          >
            <Users size={15} />
          </button>
        </div>
      ),
    },
  ];

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      branchId: branchesData?.content?.[0]?.id || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (student: StudentResponse) => {
    setEditingId(student.id);
    setForm({
      branchId: student.branchId || '',
      admissionNumber: student.admissionNumber || '',
      fullName: student.fullName || '',
      dateOfBirth: student.dateOfBirth || '',
      gender: student.gender || 'MALE',
      bloodGroup: student.bloodGroup || '',
      photoUrl: student.photoUrl || '',
      admissionDate: student.admissionDate || '',
      status: student.status || 'ACTIVE',
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = studentSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error('Please resolve required fields before submitting.');
      return;
    }

    const payload = {
      ...result.data,
      gender: result.data.gender as Gender,
      status: result.data.status as StudentLifecycleStatus,
      bloodGroup: result.data.bloodGroup || undefined,
      photoUrl: result.data.photoUrl || undefined,
    };

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: payload },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const activeError = editingId ? updateMutation.error : createMutation.error;

  return (
    <div
      style={{
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      <PageHeader
        title="Students Directory"
        description="Comprehensive directory of student records, lifecycle statuses, and admissions."
        action={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              icon={<UploadCloud size={16} />}
              onClick={() => setCsvModalOpen(true)}
            >
              Import CSV
            </Button>
            <Button icon={<UserPlus size={16} />} onClick={openCreate}>
              Add Student
            </Button>
          </div>
        }
      />

      {/* Filters Bar */}
      <div
        style={{
          background: 'var(--color-bg-card, #ffffff)',
          border: '1px solid var(--color-border-primary, #e2e8f0)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-tertiary)',
            }}
          />
          <input
            type="text"
            placeholder="Search by name or admission #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: 38,
              paddingLeft: 36,
              paddingRight: 12,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-primary, #cbd5e1)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            Branch:
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            style={{
              height: 38,
              padding: '0 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-primary, #cbd5e1)',
              fontSize: 'var(--font-size-sm)',
              background: 'var(--color-bg-primary, #fff)',
            }}
          >
            <option value="ALL">All Branches</option>
            {branchesData?.content?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            Status:
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              height: 38,
              padding: '0 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-primary, #cbd5e1)',
              fontSize: 'var(--font-size-sm)',
              background: 'var(--color-bg-primary, #fff)',
            }}
          >
            <option value="ALL">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={displayedStudents}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        emptyMessage="No students found"
        emptyDescription="Create your first student or adjust your search filters."
        emptyActionLabel="Add Student"
        onEmptyAction={openCreate}
      />

      {/* Add / Edit Student Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Student Details' : 'Register New Student'}
        submitLabel={editingId ? 'Save Changes' : 'Register Student'}
        loading={isSaving}
        error={activeError ? extractErrorMessage(activeError) : null}
      >
        <FormSelect
          label="Branch"
          options={branchSelectOptions}
          value={form.branchId}
          onChange={(e) => setForm({ ...form, branchId: e.target.value })}
          error={errors.branchId}
          required
        />
        <FormInput
          label="Admission Number"
          value={form.admissionNumber}
          onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })}
          error={errors.admissionNumber}
          placeholder="e.g. ADM-2024-001"
          required
        />
        <FormInput
          label="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          error={errors.fullName}
          placeholder="e.g. Aarav Sharma"
          required
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormInput
            type="date"
            label="Date of Birth"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            error={errors.dateOfBirth}
            required
          />
          <FormSelect
            label="Gender"
            options={GENDER_OPTIONS}
            value={form.gender}
            onChange={(e) =>
              setForm({ ...form, gender: e.target.value as Gender })
            }
            error={errors.gender}
            required
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormSelect
            label="Blood Group"
            options={BLOOD_GROUP_OPTIONS}
            value={form.bloodGroup || ''}
            onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
            error={errors.bloodGroup}
          />
          <FormInput
            type="date"
            label="Admission Date"
            value={form.admissionDate}
            onChange={(e) =>
              setForm({ ...form, admissionDate: e.target.value })
            }
            error={errors.admissionDate}
            required
          />
        </div>
        <FormInput
          label="Photo URL"
          value={form.photoUrl || ''}
          onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
          error={errors.photoUrl}
          placeholder="https://example.com/photos/student.jpg (Optional)"
        />
        <FormSelect
          label="Lifecycle Status"
          options={STATUS_OPTIONS}
          value={form.status}
          onChange={(e) =>
            setForm({
              ...form,
              status: e.target.value as StudentLifecycleStatus,
            })
          }
          error={errors.status}
          required
        />
      </FormModal>

      {/* CSV Import Information Dialog */}
      {csvModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="csv-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setCsvModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#e0e7ff',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UploadCloud size={20} />
              </div>
              <div>
                <h3 id="csv-modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                  Bulk CSV Import
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  Student Cohort Batch Onboarding
                </p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              The bulk CSV import endpoint is currently scheduled for rollout in an upcoming backend release. You can currently register individual students using the <strong>Add Student</strong> button.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCsvModalOpen(false)}>Understood</Button>
            </div>
          </div>
        </div>
      )}

      {/* Guardian Linking Modal */}
      {guardianDialogStudent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="guardian-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setGuardianDialogStudent(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: 24,
              maxWidth: 540,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#e0e7ff',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={20} />
              </div>
              <div>
                <h3 id="guardian-modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                  Guardian Linkage
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  Student: {guardianDialogStudent.fullName} ({guardianDialogStudent.admissionNumber})
                </p>
              </div>
            </div>

            {/* UI Placeholder Notice */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: 12,
                color: '#475569',
                lineHeight: 1.5,
              }}
            >
              <strong>UI Placeholder:</strong> Guardian link and unlink operations are retained as a preview interface pending backend endpoint publication in an upcoming release.
            </div>

            {/* Link New Guardian Section */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const errs: Record<string, string> = {};
                if (!guardianForm.name.trim()) errs.name = 'Guardian name is required';
                if (!guardianForm.phoneNumber.trim()) {
                  errs.phoneNumber = 'Phone number is required';
                } else if (!/^\+[1-9]\d{7,14}$/.test(guardianForm.phoneNumber.trim())) {
                  errs.phoneNumber = 'E.164 format required (e.g. +919876543210)';
                }

                if (Object.keys(errs).length > 0) {
                  setGuardianErrors(errs);
                  return;
                }

                linkGuardianMutation.mutate(
                  {
                    studentId: guardianDialogStudent.id,
                    data: {
                      guardian: {
                        name: guardianForm.name.trim(),
                        phoneNumber: guardianForm.phoneNumber.trim(),
                        email: guardianForm.email.trim() || undefined,
                      },
                      relation: guardianForm.relation,
                      primaryContact: guardianForm.primaryContact,
                    },
                  },
                  {
                    onSuccess: () => {
                      setGuardianDialogStudent(null);
                    },
                  }
                );
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Link New Guardian / Parent
              </h4>
              <FormInput
                label="Phone Number"
                value={guardianForm.phoneNumber}
                onChange={(e) =>
                  setGuardianForm({ ...guardianForm, phoneNumber: e.target.value })
                }
                error={guardianErrors.phoneNumber}
                placeholder="+919876543210"
                helperText="E.164 international phone number"
                required
              />
              <FormInput
                label="Full Name"
                value={guardianForm.name}
                onChange={(e) =>
                  setGuardianForm({ ...guardianForm, name: e.target.value })
                }
                error={guardianErrors.name}
                placeholder="Guardian / Parent Name"
                required
              />
              <FormInput
                label="Email"
                type="email"
                value={guardianForm.email}
                onChange={(e) =>
                  setGuardianForm({ ...guardianForm, email: e.target.value })
                }
                placeholder="guardian@example.com (Optional)"
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
                <FormSelect
                  label="Relationship"
                  options={[
                    { value: 'FATHER', label: 'Father' },
                    { value: 'MOTHER', label: 'Mother' },
                    { value: 'GUARDIAN', label: 'Guardian' },
                    { value: 'OTHER', label: 'Other' },
                  ]}
                  value={guardianForm.relation}
                  onChange={(e) =>
                    setGuardianForm({
                      ...guardianForm,
                      relation: e.target.value as GuardianRelation,
                    })
                  }
                  required
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={guardianForm.primaryContact}
                    onChange={(e) =>
                      setGuardianForm({ ...guardianForm, primaryContact: e.target.checked })
                    }
                  />
                  <span>Primary Emergency Contact</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setGuardianDialogStudent(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={linkGuardianMutation.isPending}>
                  Link Guardian
                </Button>
              </div>
            </form>

            {/* Unlink Existing Guardian Section */}
            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 20, paddingTop: 16 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Unlink Existing Guardian
              </h4>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Enter Guardian UUID to unlink..."
                  value={unlinkGuardianId}
                  onChange={(e) => setUnlinkGuardianId(e.target.value)}
                  style={{
                    flex: 1,
                    height: 38,
                    padding: '0 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    fontFamily: 'monospace',
                  }}
                />
                <Button
                  variant="danger"
                  disabled={!unlinkGuardianId.trim() || unlinkGuardianMutation.isPending}
                  loading={unlinkGuardianMutation.isPending}
                  onClick={() => {
                    unlinkGuardianMutation.mutate(
                      {
                        studentId: guardianDialogStudent.id,
                        guardianId: unlinkGuardianId.trim(),
                      },
                      {
                        onSuccess: () => {
                          setUnlinkGuardianId('');
                          setGuardianDialogStudent(null);
                        },
                      }
                    );
                  }}
                >
                  Unlink
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
