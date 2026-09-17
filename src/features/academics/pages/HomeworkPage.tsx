/* ============================================================
   HomeworkPage — Assignments, Submissions, Grading, and Exports
   Connected to Spring Boot:
   - POST   /api/v1/homework
   - GET    /api/v1/homework?sectionId=&from=&to=
   - GET    /api/v1/homework/export?sectionId=&from=&to=&format=
   - DELETE /api/v1/homework/{id}
   - GET    /api/v1/homework/{id}/submissions
   - PUT    /api/v1/homework/submissions/{id}/grade
   ============================================================ */

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Download,
  Trash2,
  Clock,
  Paperclip,
  X,
  FileCheck,
  Award,
} from 'lucide-react';
import { useSections } from '../../settings/hooks/useSections';
import { useSubjects } from '../../settings/hooks/useSubjects';
import { homeworkApi } from '../../../api/endpoints/homework';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import {
  isApiError,
  type ApiError,
  type HomeworkResponse,
  type HomeworkSubmissionResponse,
  type ExportFormat,
} from '../../../api/types';
import styles from './Academics.module.css';

export function HomeworkPage() {
  const toast = useToast();
  const today = new Date();
  const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const fromDefault = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const toDefault = twoWeeksLater.toISOString().split('T')[0];

  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [fromDate, setFromDate] = useState(fromDefault);
  const [toDate, setToDate] = useState(toDefault);

  // Queries
  const { data: sectionsData, isLoading: sectionsLoading } = useSections({ size: 100 });
  const { data: subjectsData } = useSubjects({ size: 100 });

  const [assignments, setAssignments] = useState<HomeworkResponse[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedHomeworkForSubmissions, setSelectedHomeworkForSubmissions] = useState<HomeworkResponse | null>(null);
  const [submissions, setSubmissions] = useState<HomeworkSubmissionResponse[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Grading state
  const [gradingSubmission, setGradingSubmission] = useState<HomeworkSubmissionResponse | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  // Create form state
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Select first section automatically
  useEffect(() => {
    if (!selectedSectionId && sectionsData?.content && sectionsData.content.length > 0) {
      setSelectedSectionId(sectionsData.content[0].id);
    }
  }, [sectionsData, selectedSectionId]);

  // Load assignments
  const fetchAssignments = async () => {
    if (!selectedSectionId) return;
    setLoadingAssignments(true);
    try {
      const list = await homeworkApi.list(selectedSectionId, fromDate, toDate);
      setAssignments(list);
    } catch {
      toast.error('Failed to load homework assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [selectedSectionId, fromDate, toDate]);

  // Create Assignment
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectionId || !subjectId || !title.trim() || !instructions.trim() || !dueDate) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsCreating(true);
    try {
      await homeworkApi.create({
        sectionId: selectedSectionId,
        subjectId,
        title: title.trim(),
        instructions: instructions.trim(),
        attachmentUrl: attachmentUrl.trim() || undefined,
        dueDate,
      });
      setIsCreateOpen(false);
      setTitle('');
      setInstructions('');
      setAttachmentUrl('');
      setDueDate('');
      toast.success('Homework assignment created!');
      fetchAssignments();
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to create homework');
      } else {
        toast.error('Failed to create homework');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this homework assignment?')) return;
    try {
      await homeworkApi.delete(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success('Assignment removed');
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to delete assignment');
      } else {
        toast.error('Failed to delete assignment');
      }
    }
  };

  // Export
  const handleExport = async (format: ExportFormat) => {
    if (!selectedSectionId) {
      toast.error('Please select a section to export');
      return;
    }
    try {
      toast.info(`Preparing ${format} homework download...`);
      await homeworkApi.exportHomework(selectedSectionId, fromDate, toDate, format);
      toast.success(`${format} export completed!`);
    } catch {
      toast.error(`Failed to export ${format} homework`);
    }
  };

  // View Submissions
  const handleOpenSubmissions = async (hw: HomeworkResponse) => {
    setSelectedHomeworkForSubmissions(hw);
    setLoadingSubmissions(true);
    try {
      const list = await homeworkApi.submissions(hw.id);
      setSubmissions(list);
    } catch {
      toast.error('Failed to load submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Grade Submission
  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission || !gradeInput.trim()) return;

    setIsSubmittingGrade(true);
    try {
      const updated = await homeworkApi.grade(gradingSubmission.id, {
        grade: gradeInput.trim(),
        feedback: feedbackInput.trim() || undefined,
      });

      setSubmissions((prev) =>
        prev.map((s) => (s.id === gradingSubmission.id ? updated : s))
      );
      setGradingSubmission(null);
      setGradeInput('');
      setFeedbackInput('');
      toast.success('Grade and feedback saved!');
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to submit grade');
      } else {
        toast.error('Failed to submit grade');
      }
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const subjectNameMap = new Map(subjectsData?.content.map((s) => [s.id, s.name]));

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Homework & Assignments</h1>
          <p className={styles.subtitle}>
            Publish daily coursework, review student submissions, grade work, and export reports
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExport('XLSX')}
            title="Download Excel register"
          >
            <Download size={15} style={{ color: '#10b981' }} />
            <span>Export XLSX</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExport('PDF')}
            title="Download PDF document"
          >
            <Download size={15} style={{ color: '#ef4444' }} />
            <span>Export PDF</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus size={15} />
            <span>Create Assignment</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Section / Class</label>
          <select
            className={styles.filterSelect}
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            disabled={sectionsLoading}
          >
            {sectionsData?.content.map((sec) => (
              <option key={sec.id} value={sec.id}>
                Section: {sec.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>From Date</label>
          <input
            type="date"
            className={styles.filterInput}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>To Date</label>
          <input
            type="date"
            className={styles.filterInput}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Assignments Table / List */}
      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
            Assignments ({assignments.length})
          </div>
        </div>

        {loadingAssignments ? (
          <div style={{ padding: 'var(--space-6)' }}>
            <Skeleton variant="table-row" rows={5} columns={5} />
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={44} />}
            message="No homework assignments found"
            description="Create an assignment using the button above to assign tasks to this section."
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Title</th>
                  <th className={styles.th}>Subject</th>
                  <th className={styles.th}>Due Date</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Attachment</th>
                  <th className={styles.th} style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((hw) => (
                  <tr key={hw.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div style={{ fontWeight: 600 }}>{hw.title}</div>
                      <div
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-secondary)',
                          maxWidth: 320,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {hw.instructions}
                      </div>
                    </td>
                    <td className={styles.td}>
                      {subjectNameMap.get(hw.subjectId) || hw.subjectId}
                    </td>
                    <td className={styles.td}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} style={{ color: 'var(--color-text-secondary)' }} />
                        {hw.dueDate}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span
                        className={`${styles.badge} ${
                          hw.status === 'ASSIGNED' ? styles.badgeActive : styles.badgeClosed
                        }`}
                      >
                        {hw.status}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {hw.attachmentUrl ? (
                        <a
                          href={hw.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: 'var(--color-primary-600)',
                            fontSize: 'var(--font-size-xs)',
                          }}
                        >
                          <Paperclip size={13} />
                          <span>Link</span>
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => handleOpenSubmissions(hw)}
                          title="View student submissions"
                        >
                          <FileCheck size={13} />
                          <span>Submissions</span>
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => handleDeleteAssignment(hw.id)}
                          title="Delete assignment"
                        >
                          <Trash2 size={13} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE HOMEWORK MODAL ────────────────────────────── */}
      {isCreateOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create Homework Assignment</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsCreateOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Subject</label>
                  <select
                    className={styles.filterSelect}
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjectsData?.content.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Assignment Title</label>
                  <input
                    type="text"
                    className={styles.filterInput}
                    placeholder="E.g., Chapter 4 Exercises 1-10"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={180}
                    required
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Instructions</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Provide full instructions for students..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    maxLength={4000}
                    required
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Due Date</label>
                  <input
                    type="date"
                    className={styles.filterInput}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Attachment URL (Optional)</label>
                  <input
                    type="url"
                    className={styles.filterInput}
                    placeholder="https://..."
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    maxLength={500}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isCreating}
                >
                  Publish Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SUBMISSIONS MODAL ────────────────────────────────── */}
      {selectedHomeworkForSubmissions && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: 640 }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Submissions</h3>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  {selectedHomeworkForSubmissions.title}
                </span>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedHomeworkForSubmissions(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {loadingSubmissions ? (
                <Skeleton variant="table-row" rows={4} columns={3} />
              ) : submissions.length === 0 ? (
                <EmptyState
                  icon={<FileCheck size={40} />}
                  message="No submissions received yet"
                  description="Student submissions will appear here once submitted."
                />
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Student ID</th>
                        <th className={styles.th}>Submission</th>
                        <th className={styles.th}>Grade</th>
                        <th className={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr key={sub.id} className={styles.tr}>
                          <td className={styles.td}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {sub.studentId}
                            </span>
                          </td>
                          <td className={styles.td}>
                            <div style={{ fontSize: 'var(--font-size-xs)' }}>
                              {sub.submissionText || (
                                <a
                                  href={sub.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: 'var(--color-primary-600)' }}
                                >
                                  Attachment
                                </a>
                              )}
                            </div>
                          </td>
                          <td className={styles.td}>
                            {sub.grade ? (
                              <span className={`${styles.badge} ${styles.badgeApproved}`}>
                                {sub.grade}
                              </span>
                            ) : (
                              <span className={`${styles.badge} ${styles.badgeDraft}`}>
                                Ungraded
                              </span>
                            )}
                          </td>
                          <td className={styles.td}>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => {
                                setGradingSubmission(sub);
                                setGradeInput(sub.grade || '');
                                setFeedbackInput(sub.feedback || '');
                              }}
                            >
                              <Award size={13} />
                              <span>Grade</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedHomeworkForSubmissions(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── GRADING MODAL ────────────────────────────────────── */}
      {gradingSubmission && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Grade Submission</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setGradingSubmission(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGradeSubmit}>
              <div className={styles.modalBody}>
                <div>
                  <strong>Student ID:</strong> {gradingSubmission.studentId}
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Grade / Score</label>
                  <input
                    type="text"
                    className={styles.filterInput}
                    placeholder="E.g., A+, 95/100, Excellent"
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    maxLength={30}
                    required
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Feedback (Optional)</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Teacher comments and feedback..."
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    maxLength={2000}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setGradingSubmission(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isSubmittingGrade}
                >
                  Save Grade
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
