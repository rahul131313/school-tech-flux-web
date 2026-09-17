/* ============================================================
   AcademicYearsPage — CRUD page for Academic Years
   ============================================================ */

import { useState, type FormEvent } from 'react';
import { type ColumnDef } from '../../../components/ui/DataTable';
import { Plus, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormModal } from '../../../components/ui/FormModal';
import { PageHeader } from '../components/PageHeader';
import { useConfirm } from '../../../components/dialog/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { extractErrorMessage } from '../../../lib/queryClient';
import {
  useAcademicYears,
  useCreateAcademicYear,
  useUpdateAcademicYear,
  useDeleteAcademicYear,
} from '../hooks/useAcademicYears';
import { academicYearSchema, type AcademicYearFormData } from '../schemas';
import type { AcademicYearResponse } from '../../../api/types';
import tableStyles from '../../../components/ui/DataTable.module.css';

const EMPTY_FORM: AcademicYearFormData = {
  name: '',
  startDate: '',
  endDate: '',
  current: false,
};

export function AcademicYearsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AcademicYearFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useAcademicYears({ page, size: pageSize });
  const createMutation = useCreateAcademicYear();
  const updateMutation = useUpdateAcademicYear();
  const deleteMutation = useDeleteAcademicYear();
  const { confirm } = useConfirm();
  const toast = useToast();

  const columns: ColumnDef<AcademicYearResponse, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'startDate', header: 'Start Date' },
    { accessorKey: 'endDate', header: 'End Date' },
    {
      accessorKey: 'current',
      header: 'Current',
      cell: ({ getValue }) =>
        getValue() ? (
          <CheckCircle2
            size={18}
            style={{ color: 'var(--color-success-500)' }}
          />
        ) : (
          <Circle
            size={18}
            style={{ color: 'var(--color-neutral-300)' }}
          />
        ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className={tableStyles.actions}>
          <button
            className={tableStyles.actionBtn}
            onClick={() => openEdit(row.original)}
            title="Edit"
          >
            <Pencil size={15} />
          </button>
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
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (year: AcademicYearResponse) => {
    setEditingId(year.id);
    setForm({
      name: year.name || '',
      startDate: year.startDate,
      endDate: year.endDate,
      current: year.current,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (year: AcademicYearResponse) => {
    const confirmed = await confirm({
      title: 'Delete Academic Year',
      message: `Are you sure you want to delete "${year.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(year.id);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = academicYearSchema.safeParse(form);
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

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: result.data },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      createMutation.mutate(result.data, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const activeError = editingId ? updateMutation.error : createMutation.error;

  return (
    <>
      <PageHeader
        title="Academic Years"
        description="Define academic year periods for your school"
        action={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Add Academic Year
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
        emptyMessage="No academic years yet"
        emptyDescription="Create your first academic year to get started"
        emptyActionLabel="Add Academic Year"
        onEmptyAction={openCreate}
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Academic Year' : 'Add Academic Year'}
        submitLabel={editingId ? 'Update' : 'Create'}
        loading={isSaving}
        error={activeError ? extractErrorMessage(activeError) : null}
      >
        <FormInput
          label="Name"
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          placeholder="2025-26"
          helperText="Format: YYYY-YY"
        />
        <FormInput
          label="Start Date"
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          error={errors.startDate}
          required
        />
        <FormInput
          label="End Date"
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          error={errors.endDate}
          required
        />
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={form.current || false}
            onChange={(e) => setForm({ ...form, current: e.target.checked })}
          />
          Mark as current academic year
        </label>
      </FormModal>
    </>
  );
}
