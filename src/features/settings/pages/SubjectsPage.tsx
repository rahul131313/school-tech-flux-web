/* ============================================================
   SubjectsPage — CRUD page for Subjects
   ============================================================ */

import { useState, type FormEvent } from 'react';
import { type ColumnDef } from '../../../components/ui/DataTable';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormModal } from '../../../components/ui/FormModal';
import { PageHeader } from '../components/PageHeader';
import { useConfirm } from '../../../components/dialog/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { extractErrorMessage } from '../../../lib/queryClient';
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from '../hooks/useSubjects';
import { subjectSchema, type SubjectFormData } from '../schemas';
import type { SubjectResponse } from '../../../api/types';
import tableStyles from '../../../components/ui/DataTable.module.css';

const EMPTY_FORM: SubjectFormData = {
  name: '',
};

export function SubjectsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubjectFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useSubjects({ page, size: pageSize });
  const createMutation = useCreateSubject();
  const updateMutation = useUpdateSubject();
  const deleteMutation = useDeleteSubject();
  const { confirm } = useConfirm();
  const toast = useToast();

  const columns: ColumnDef<SubjectResponse, unknown>[] = [
    { accessorKey: 'name', header: 'Subject Name' },
    {
      accessorKey: 'id',
      header: 'ID',
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

  const openEdit = (subject: SubjectResponse) => {
    setEditingId(subject.id);
    setForm({ name: subject.name });
    setErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (subject: SubjectResponse) => {
    const confirmed = await confirm({
      title: 'Delete Subject',
      message: `Are you sure you want to delete "${subject.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(subject.id);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = subjectSchema.safeParse(form);
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
        title="Subjects"
        description="Manage subjects taught at your school"
        action={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Add Subject
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
        emptyMessage="No subjects yet"
        emptyDescription="Create your first subject to get started"
        emptyActionLabel="Add Subject"
        onEmptyAction={openCreate}
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Subject' : 'Add Subject'}
        submitLabel={editingId ? 'Update' : 'Create'}
        loading={isSaving}
        error={activeError ? extractErrorMessage(activeError) : null}
      >
        <FormInput
          label="Subject Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          placeholder="Mathematics"
          required
        />
      </FormModal>
    </>
  );
}
