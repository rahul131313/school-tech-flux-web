/* ============================================================
   SchoolsPage — CRUD page for Schools
   ============================================================ */

import { useState, type FormEvent } from 'react';
import { type ColumnDef } from '../../../components/ui/DataTable';
import { Plus, Pencil } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { FormModal } from '../../../components/ui/FormModal';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../../../components/ui/Toast';
import { extractErrorMessage } from '../../../lib/queryClient';
import { useSchools, useCreateSchool, useUpdateSchool } from '../hooks/useSchools';
import { schoolSchema, type SchoolFormData } from '../schemas';
import type { SchoolResponse, SchoolStatus } from '../../../api/types';
import tableStyles from '../../../components/ui/DataTable.module.css';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const EMPTY_FORM: SchoolFormData = {
  name: '',
  slug: '',
  board: '',
  subscriptionTier: '',
  maxStudents: 100,
  status: 'ACTIVE',
};

export function SchoolsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SchoolFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useSchools({ page, size: pageSize });
  const createMutation = useCreateSchool();
  const updateMutation = useUpdateSchool();
  const toast = useToast();

  const columns: ColumnDef<SchoolResponse, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'board', header: 'Board' },
    { accessorKey: 'subscriptionTier', header: 'Tier' },
    { accessorKey: 'maxStudents', header: 'Max Students' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <StatusBadge label={getValue() as string} />
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

  const openEdit = (school: SchoolResponse) => {
    setEditingId(school.id);
    setForm({
      name: school.name || '',
      slug: school.slug || '',
      board: school.board || '',
      subscriptionTier: school.subscriptionTier || '',
      maxStudents: school.maxStudents,
      status: school.status,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = schoolSchema.safeParse(form);
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

    const payload = {
      ...result.data,
      status: result.data.status as SchoolStatus,
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
    <>
      <PageHeader
        title="Schools"
        description="Manage school tenants and their configuration"
        action={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Add School
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
        emptyMessage="No schools yet"
        emptyDescription="Create your first school to get started"
        emptyActionLabel="Add School"
        onEmptyAction={openCreate}
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit School' : 'Add School'}
        submitLabel={editingId ? 'Update' : 'Create'}
        loading={isSaving}
        error={activeError ? extractErrorMessage(activeError) : null}
      >
        <FormInput
          label="Name"
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          placeholder="Springfield Elementary"
        />
        <FormInput
          label="Slug"
          value={form.slug || ''}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          error={errors.slug}
          placeholder="springfield-elementary"
          helperText="URL-friendly identifier (lowercase, hyphens)"
        />
        <FormInput
          label="Board"
          value={form.board || ''}
          onChange={(e) => setForm({ ...form, board: e.target.value })}
          error={errors.board}
          placeholder="CBSE"
        />
        <FormInput
          label="Subscription Tier"
          value={form.subscriptionTier || ''}
          onChange={(e) => setForm({ ...form, subscriptionTier: e.target.value })}
          error={errors.subscriptionTier}
          placeholder="PRO"
        />
        <FormInput
          label="Max Students"
          type="number"
          value={String(form.maxStudents)}
          onChange={(e) =>
            setForm({ ...form, maxStudents: Number(e.target.value) })
          }
          error={errors.maxStudents}
          required
        />
        <FormSelect
          label="Status"
          options={STATUS_OPTIONS}
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value as SchoolFormData['status'] })
          }
          error={errors.status}
          required
        />
      </FormModal>
    </>
  );
}
