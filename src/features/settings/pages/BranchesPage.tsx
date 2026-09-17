/* ============================================================
   BranchesPage — CRUD page for Branches
   ============================================================ */

import { useState, type FormEvent } from 'react';
import { type ColumnDef } from '../../../components/ui/DataTable';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from '../hooks/useBranches';
import { branchSchema, type BranchFormData } from '../schemas';
import type { BranchResponse, BranchStatus } from '../../../api/types';
import tableStyles from '../../../components/ui/DataTable.module.css';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const EMPTY_FORM: BranchFormData = {
  name: '',
  code: '',
  address: '',
  status: 'ACTIVE',
};

export function BranchesPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useBranches({ page, size: pageSize });
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();
  const { confirm } = useConfirm();
  const toast = useToast();

  const columns: ColumnDef<BranchResponse, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'code', header: 'Code' },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ getValue }) => {
        const addr = getValue() as string;
        return addr?.length > 50 ? `${addr.slice(0, 50)}…` : addr;
      },
    },
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

  const openEdit = (branch: BranchResponse) => {
    setEditingId(branch.id);
    setForm({
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      status: branch.status,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (branch: BranchResponse) => {
    const confirmed = await confirm({
      title: 'Delete Branch',
      message: `Are you sure you want to delete "${branch.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(branch.id);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = branchSchema.safeParse(form);
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
      status: result.data.status as BranchStatus,
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
        title="Branches"
        description="Manage school branches and locations"
        action={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Add Branch
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
        emptyMessage="No branches yet"
        emptyDescription="Create your first branch to get started"
        emptyActionLabel="Add Branch"
        onEmptyAction={openCreate}
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Branch' : 'Add Branch'}
        submitLabel={editingId ? 'Update' : 'Create'}
        loading={isSaving}
        error={activeError ? extractErrorMessage(activeError) : null}
      >
        <FormInput
          label="Name"
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          placeholder="Main Campus"
        />
        <FormInput
          label="Code"
          value={form.code || ''}
          onChange={(e) =>
            setForm({ ...form, code: e.target.value.toUpperCase() })
          }
          error={errors.code}
          placeholder="MAIN-01"
          helperText="Uppercase letters, numbers, underscores, hyphens"
        />
        <FormInput
          label="Address"
          value={form.address || ''}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          error={errors.address}
          placeholder="123 School Street, City"
        />
        <FormSelect
          label="Status"
          options={STATUS_OPTIONS}
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value as BranchFormData['status'] })
          }
          error={errors.status}
          required
        />
      </FormModal>
    </>
  );
}
