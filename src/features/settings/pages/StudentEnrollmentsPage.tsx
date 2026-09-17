/* ============================================================
   StudentEnrollmentsPage — CRUD page for Student Enrollments
   Note: No edit — only create + delete per API spec.
   ============================================================ */

import { useState, type FormEvent } from 'react';
import { type ColumnDef } from '../../../components/ui/DataTable';
import { Plus, Trash2 } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { FormModal } from '../../../components/ui/FormModal';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { PageHeader } from '../components/PageHeader';
import { useConfirm } from '../../../components/dialog/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { extractErrorMessage } from '../../../lib/queryClient';
import {
  useStudentEnrollments,
  useCreateStudentEnrollment,
  useDeleteStudentEnrollment,
} from '../hooks/useStudentEnrollments';
import { useSections } from '../hooks/useSections';
import { useAcademicYears } from '../hooks/useAcademicYears';
import {
  studentEnrollmentSchema,
  type StudentEnrollmentFormData,
} from '../schemas';
import type {
  StudentEnrollmentResponse,
  EnrollmentStatus,
} from '../../../api/types';
import tableStyles from '../../../components/ui/DataTable.module.css';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PROMOTED', label: 'Promoted' },
  { value: 'LEFT', label: 'Left' },
  { value: 'TRANSFERRED', label: 'Transferred' },
];

const EMPTY_FORM: StudentEnrollmentFormData = {
  studentId: '',
  sectionId: '',
  academicYearId: '',
  rollNumber: '',
  status: 'ACTIVE',
  enrolledOn: '',
};

export function StudentEnrollmentsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<StudentEnrollmentFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useStudentEnrollments({ page, size: pageSize });
  const { data: sectionsData } = useSections({ page: 0, size: 100 });
  const { data: yearsData } = useAcademicYears({ page: 0, size: 100 });
  const createMutation = useCreateStudentEnrollment();
  const deleteMutation = useDeleteStudentEnrollment();
  const { confirm } = useConfirm();
  const toast = useToast();

  const sectionOptions = (sectionsData?.content || []).map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const yearOptions = (yearsData?.content || []).map((y) => ({
    value: y.id,
    label: y.name,
  }));

  const sectionMap = new Map(
    (sectionsData?.content || []).map((s) => [s.id, s.name])
  );
  const yearMap = new Map(
    (yearsData?.content || []).map((y) => [y.id, y.name])
  );

  const columns: ColumnDef<StudentEnrollmentResponse, unknown>[] = [
    { accessorKey: 'rollNumber', header: 'Roll No.' },
    {
      accessorKey: 'studentId',
      header: 'Student ID',
      cell: ({ getValue }) => {
        const id = getValue() as string;
        return (
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {id.slice(0, 8)}…
          </span>
        );
      },
    },
    {
      accessorKey: 'sectionId',
      header: 'Section',
      cell: ({ getValue }) => sectionMap.get(getValue() as string) || '—',
    },
    {
      accessorKey: 'academicYearId',
      header: 'Academic Year',
      cell: ({ getValue }) => yearMap.get(getValue() as string) || '—',
    },
    { accessorKey: 'enrolledOn', header: 'Enrolled On' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge label={getValue() as string} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className={tableStyles.actions}>
          <button
            className={tableStyles.actionBtn}
            data-variant="danger"
            onClick={() => handleDelete(row.original)}
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (enrollment: StudentEnrollmentResponse) => {
    const confirmed = await confirm({
      title: 'Delete Enrollment',
      message: `Are you sure you want to delete enrollment for roll number "${enrollment.rollNumber}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(enrollment.id);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = studentEnrollmentSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error('Please resolve the required form fields.');
      return;
    }

    createMutation.mutate(
      {
        ...result.data,
        status: result.data.status as EnrollmentStatus,
      },
      { onSuccess: () => setModalOpen(false) }
    );
  };

  return (
    <>
      <PageHeader
        title="Student Enrollments"
        description="Manage student enrollment records"
        action={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Add Enrollment
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        emptyMessage="No enrollments yet"
        emptyDescription="Create your first enrollment to get started"
        emptyActionLabel="Add Enrollment"
        onEmptyAction={openCreate}
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title="Add Student Enrollment"
        submitLabel="Create"
        loading={createMutation.isPending}
        error={createMutation.error ? extractErrorMessage(createMutation.error) : null}
        size="lg"
      >
        <FormInput
          label="Student ID"
          value={form.studentId}
          onChange={(e) => setForm({ ...form, studentId: e.target.value })}
          error={errors.studentId}
          placeholder="UUID of the student"
          required
        />
        <FormSelect
          label="Section"
          options={sectionOptions}
          value={form.sectionId}
          onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
          error={errors.sectionId}
          placeholder="Select a section"
          required
        />
        <FormSelect
          label="Academic Year"
          options={yearOptions}
          value={form.academicYearId}
          onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}
          error={errors.academicYearId}
          placeholder="Select an academic year"
          required
        />
        <FormInput
          label="Roll Number"
          value={form.rollNumber || ''}
          onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
          error={errors.rollNumber}
          placeholder="2025/001"
          required
        />
        <FormSelect
          label="Status"
          options={STATUS_OPTIONS}
          value={form.status}
          onChange={(e) =>
            setForm({
              ...form,
              status: e.target.value as StudentEnrollmentFormData['status'],
            })
          }
          error={errors.status}
          required
        />
        <FormInput
          label="Enrolled On"
          type="date"
          value={form.enrolledOn}
          onChange={(e) => setForm({ ...form, enrolledOn: e.target.value })}
          error={errors.enrolledOn}
          required
        />
      </FormModal>
    </>
  );
}
