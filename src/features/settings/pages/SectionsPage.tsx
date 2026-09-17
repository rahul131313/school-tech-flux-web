/* ============================================================
   SectionsPage — CRUD page for Sections
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
  useSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
} from '../hooks/useSections';
import { useStandards } from '../hooks/useStandards';
import { useAcademicYears } from '../hooks/useAcademicYears';
import { sectionSchema, type SectionFormData } from '../schemas';
import type { SectionResponse } from '../../../api/types';
import tableStyles from '../../../components/ui/DataTable.module.css';

const EMPTY_FORM: SectionFormData = {
  standardId: '',
  academicYearId: '',
  name: '',
  classTeacherId: '',
  capacity: undefined as unknown as number,
};

export function SectionsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SectionFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useSections({ page, size: pageSize });
  const { data: standardsData } = useStandards({ page: 0, size: 100 });
  const { data: yearsData } = useAcademicYears({ page: 0, size: 100 });
  const createMutation = useCreateSection();
  const updateMutation = useUpdateSection();
  const deleteMutation = useDeleteSection();
  const { confirm } = useConfirm();
  const toast = useToast();

  const standardOptions = (standardsData?.content || []).map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const yearOptions = (yearsData?.content || []).map((y) => ({
    value: y.id,
    label: y.name,
  }));

  const standardMap = new Map(
    (standardsData?.content || []).map((s) => [s.id, s.name])
  );
  const yearMap = new Map(
    (yearsData?.content || []).map((y) => [y.id, y.name])
  );

  const columns: ColumnDef<SectionResponse, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'standardId',
      header: 'Standard',
      cell: ({ getValue }) => standardMap.get(getValue() as string) || '—',
    },
    {
      accessorKey: 'academicYearId',
      header: 'Academic Year',
      cell: ({ getValue }) => yearMap.get(getValue() as string) || '—',
    },
    { accessorKey: 'capacity', header: 'Capacity' },
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

  const openEdit = (section: SectionResponse) => {
    setEditingId(section.id);
    setForm({
      standardId: section.standardId,
      academicYearId: section.academicYearId,
      name: section.name || '',
      classTeacherId: section.classTeacherId || '',
      capacity: section.capacity,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (section: SectionResponse) => {
    const confirmed = await confirm({
      title: 'Delete Section',
      message: `Are you sure you want to delete "${section.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(section.id);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = sectionSchema.safeParse(form);
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
      standardId: result.data.standardId,
      academicYearId: result.data.academicYearId,
      name: result.data.name || undefined,
      classTeacherId: result.data.classTeacherId || undefined,
      capacity: result.data.capacity || undefined,
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
        title="Sections"
        description="Manage class sections for each standard and academic year"
        action={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Add Section
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
        emptyMessage="No sections yet"
        emptyDescription="Create your first section to get started"
        emptyActionLabel="Add Section"
        onEmptyAction={openCreate}
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Section' : 'Add Section'}
        submitLabel={editingId ? 'Update' : 'Create'}
        loading={isSaving}
        error={activeError ? extractErrorMessage(activeError) : null}
      >
        <FormSelect
          label="Standard"
          options={standardOptions}
          value={form.standardId}
          onChange={(e) => setForm({ ...form, standardId: e.target.value })}
          error={errors.standardId}
          placeholder="Select a standard"
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
          label="Name"
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          placeholder="Section A"
        />
        <FormInput
          label="Class Teacher ID"
          value={form.classTeacherId || ''}
          onChange={(e) => setForm({ ...form, classTeacherId: e.target.value })}
          error={errors.classTeacherId}
          placeholder="UUID of the class teacher"
        />
        <FormInput
          label="Capacity"
          type="number"
          value={form.capacity != null ? String(form.capacity) : ''}
          onChange={(e) =>
            setForm({
              ...form,
              capacity: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          error={errors.capacity}
          placeholder="40"
        />
      </FormModal>
    </>
  );
}
