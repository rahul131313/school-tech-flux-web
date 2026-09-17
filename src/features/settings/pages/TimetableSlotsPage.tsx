/* ============================================================
   TimetableSlotsPage — CRUD page for Timetable Slots
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
import { PageHeader } from '../components/PageHeader';
import { useConfirm } from '../../../components/dialog/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { extractErrorMessage } from '../../../lib/queryClient';
import {
  useTimetableSlots,
  useCreateTimetableSlot,
  useDeleteTimetableSlot,
} from '../hooks/useTimetableSlots';
import { useSections } from '../hooks/useSections';
import { useSubjects } from '../hooks/useSubjects';
import { timetableSlotSchema, type TimetableSlotFormData } from '../schemas';
import type { TimetableSlotResponse, DayOfWeek } from '../../../api/types';
import tableStyles from '../../../components/ui/DataTable.module.css';

const DAY_OPTIONS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

const EMPTY_FORM: TimetableSlotFormData = {
  sectionId: '',
  dayOfWeek: 'MONDAY' as DayOfWeek,
  periodNumber: 1,
  startTime: '',
  endTime: '',
  subjectId: '',
  teacherId: '',
};

export function TimetableSlotsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TimetableSlotFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useTimetableSlots({ page, size: pageSize });
  const { data: sectionsData } = useSections({ page: 0, size: 100 });
  const { data: subjectsData } = useSubjects({ page: 0, size: 100 });
  const createMutation = useCreateTimetableSlot();
  const deleteMutation = useDeleteTimetableSlot();
  const { confirm } = useConfirm();
  const toast = useToast();

  const sectionOptions = (sectionsData?.content || []).map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const subjectOptions = (subjectsData?.content || []).map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const sectionMap = new Map(
    (sectionsData?.content || []).map((s) => [s.id, s.name])
  );
  const subjectMap = new Map(
    (subjectsData?.content || []).map((s) => [s.id, s.name])
  );

  const formatDay = (day: string) =>
    day.charAt(0) + day.slice(1).toLowerCase();

  const columns: ColumnDef<TimetableSlotResponse, unknown>[] = [
    {
      accessorKey: 'dayOfWeek',
      header: 'Day',
      cell: ({ getValue }) => formatDay(getValue() as string),
    },
    { accessorKey: 'periodNumber', header: 'Period' },
    { accessorKey: 'startTime', header: 'Start' },
    { accessorKey: 'endTime', header: 'End' },
    {
      accessorKey: 'sectionId',
      header: 'Section',
      cell: ({ getValue }) => sectionMap.get(getValue() as string) || '—',
    },
    {
      accessorKey: 'subjectId',
      header: 'Subject',
      cell: ({ getValue }) => subjectMap.get(getValue() as string) || '—',
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

  const handleDelete = async (slot: TimetableSlotResponse) => {
    const confirmed = await confirm({
      title: 'Delete Timetable Slot',
      message: `Are you sure you want to delete this ${formatDay(slot.dayOfWeek)} period ${slot.periodNumber} slot? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(slot.id);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = timetableSlotSchema.safeParse(form);
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
        dayOfWeek: result.data.dayOfWeek as DayOfWeek,
      },
      { onSuccess: () => setModalOpen(false) }
    );
  };

  return (
    <>
      <PageHeader
        title="Timetable Slots"
        description="Manage period slots for each section"
        action={
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Add Slot
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
        emptyMessage="No timetable slots yet"
        emptyDescription="Create your first slot to build the timetable"
        emptyActionLabel="Add Slot"
        onEmptyAction={openCreate}
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title="Add Timetable Slot"
        submitLabel="Create"
        loading={createMutation.isPending}
        error={createMutation.error ? extractErrorMessage(createMutation.error) : null}
        size="lg"
      >
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
          label="Day of Week"
          options={DAY_OPTIONS}
          value={form.dayOfWeek}
          onChange={(e) =>
            setForm({ ...form, dayOfWeek: e.target.value as DayOfWeek })
          }
          error={errors.dayOfWeek}
          required
        />
        <FormInput
          label="Period Number"
          type="number"
          value={String(form.periodNumber)}
          onChange={(e) =>
            setForm({ ...form, periodNumber: Number(e.target.value) })
          }
          error={errors.periodNumber}
          required
        />
        <FormInput
          label="Start Time"
          type="time"
          value={form.startTime}
          onChange={(e) => setForm({ ...form, startTime: e.target.value + ':00' })}
          error={errors.startTime}
          required
        />
        <FormInput
          label="End Time"
          type="time"
          value={form.endTime}
          onChange={(e) => setForm({ ...form, endTime: e.target.value + ':00' })}
          error={errors.endTime}
          required
        />
        <FormSelect
          label="Subject"
          options={subjectOptions}
          value={form.subjectId}
          onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
          error={errors.subjectId}
          placeholder="Select a subject"
          required
        />
        <FormInput
          label="Teacher ID"
          value={form.teacherId}
          onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
          error={errors.teacherId}
          placeholder="UUID of the teacher"
          required
        />
      </FormModal>
    </>
  );
}
