/* ============================================================
   StandardsPage — CRUD page for Standards
   ============================================================ */

import { useState, type FormEvent } from 'react';
import { type ColumnDef } from '../../../components/ui/DataTable';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { FormModal } from '../../../components/ui/FormModal';
import { PageHeader } from '../components/PageHeader';
import { useConfirm } from '../../../components/dialog/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { extractErrorMessage } from '../../../lib/queryClient';
import {
  useStandards,
  useCreateStandard,
  useUpdateStandard,
  useDeleteStandard,
} from '../hooks/useStandards';
import { useBranches } from '../hooks/useBranches';
import { standardSchema, type StandardFormData } from '../schemas';
import type { StandardResponse } from '../../../api/types';
import tableStyles from '../../../components/ui/DataTable.module.css';

const EMPTY_FORM: StandardFormData = {
  branchId: '',
  name: '',
  sequenceOrder: 1,
};

export function StandardsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StandardFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useStandards({ page, size: pageSize });
  const { data: branchesData } = useBranches({ page: 0, size: 100 });
  const createMutation = useCreateStandard();
  const updateMutation = useUpdateStandard();
  const deleteMutation = useDeleteStandard();
  const { confirm } = useConfirm();
  const toast = useToast();

  const branchOptions = (branchesData?.content || []).map((b) => ({
    value: b.id,
    label: b.name || b.code,
  }));

  const branchMap = new Map(
    (branchesData?.content || []).map((b) => [b.id, b.name || b.code])
  );

  const columns: ColumnDef<StandardResponse, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'branchId',
      header: 'Branch',
      cell: ({ getValue }) => branchMap.get(getValue() as string) || '—',
    },
    { accessorKey: 'sequenceOrder', header: 'Order' },
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

  const openEdit = (standard: StandardResponse) => {
    setEditingId(standard.id);
    setForm({
      branchId: standard.branchId,
      name: standard.name || '',
      sequenceOrder: standard.sequenceOrder,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (standard: StandardResponse) => {
    const confirmed = await confirm({
      title: 'Delete Standard',
      message: `Are you sure you want to delete "${standard.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(standard.id);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = standardSchema.safeParse(form);
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
        title="Standards"
        description="Manage grade levels / standards for each branch"
        action={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Add Standard
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
        emptyMessage="No standards yet"
        emptyDescription="Create your first standard to get started"
        emptyActionLabel="Add Standard"
        onEmptyAction={openCreate}
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Standard' : 'Add Standard'}
        submitLabel={editingId ? 'Update' : 'Create'}
        loading={isSaving}
        error={activeError ? extractErrorMessage(activeError) : null}
      >
        <FormSelect
          label="Branch"
          options={branchOptions}
          value={form.branchId}
          onChange={(e) => setForm({ ...form, branchId: e.target.value })}
          error={errors.branchId}
          placeholder="Select a branch"
          required
        />
        <FormInput
          label="Name"
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          placeholder="Grade 10"
        />
        <FormInput
          label="Sequence Order"
          type="number"
          value={String(form.sequenceOrder)}
          onChange={(e) =>
            setForm({ ...form, sequenceOrder: Number(e.target.value) })
          }
          error={errors.sequenceOrder}
          required
          helperText="Determines the display order"
        />
      </FormModal>
    </>
  );
}
