/* ============================================================
   RemarksPage — Student Behavioral Notes, Commendations, and Disciplinary Remarks
   Connected to Spring Boot:
   - POST /api/v1/remarks
   - POST /api/v1/remarks/{id}/approve
   - POST /api/v1/remarks/{id}/reject
   - GET  /api/v1/remarks/students/{studentId}
   - GET  /api/v1/remarks/students/{studentId}/export?format=
   ============================================================ */

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Download,
  ThumbsUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { useStudents } from '../../students/hooks/useStudents';
import { remarksApi } from '../../../api/endpoints/remarks';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import {
  isApiError,
  type ApiError,
  type RemarkResponse,
  type RemarkCategory,
  type ExportFormat,
} from '../../../api/types';
import styles from './Academics.module.css';

export function RemarksPage() {
  const toast = useToast();
  const { data: studentsData, isLoading: studentsLoading } = useStudents({ size: 500 });

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [remarksList, setRemarksList] = useState<RemarkResponse[]>([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [category, setCategory] = useState<RemarkCategory>('POSITIVE');
  const [content, setContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Review states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Automatically select first student once loaded
  useEffect(() => {
    if (!selectedStudentId && studentsData?.content && studentsData.content.length > 0) {
      setSelectedStudentId(studentsData.content[0].id);
    }
  }, [studentsData, selectedStudentId]);

  // Fetch student remarks
  const fetchRemarks = async () => {
    if (!selectedStudentId) return;
    setLoadingRemarks(true);
    try {
      const list = await remarksApi.listForStudent(selectedStudentId);
      setRemarksList(list);
    } catch {
      toast.error('Failed to load student remarks');
    } finally {
      setLoadingRemarks(false);
    }
  };

  useEffect(() => {
    fetchRemarks();
  }, [selectedStudentId]);

  // Create Remark
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !content.trim()) return;

    setIsCreating(true);
    try {
      await remarksApi.create({
        studentId: selectedStudentId,
        category,
        content: content.trim(),
      });
      setIsCreateOpen(false);
      setContent('');
      toast.success('Remark added! (Pending administrative review)');
      fetchRemarks();
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to submit remark');
      } else {
        toast.error('Failed to create remark');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Review: Approve
  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      await remarksApi.approve(id);
      toast.success('Remark approved!');
      fetchRemarks();
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to approve remark');
      } else {
        toast.error('Approval failed');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Review: Reject
  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    try {
      await remarksApi.reject(id);
      toast.success('Remark rejected');
      fetchRemarks();
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to reject remark');
      } else {
        toast.error('Rejection failed');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Export
  const handleExport = async (format: ExportFormat) => {
    if (!selectedStudentId) {
      toast.error('Please select a student to export remarks');
      return;
    }
    try {
      toast.info(`Preparing ${format} download...`);
      await remarksApi.exportRemarks(selectedStudentId, format);
      toast.success(`${format} remarks document downloaded!`);
    } catch {
      toast.error(`Failed to export ${format} remarks`);
    }
  };

  const selectedStudent = studentsData?.content.find((s) => s.id === selectedStudentId);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Student Remarks & Behavior Notes</h1>
          <p className={styles.subtitle}>
            Commendations, disciplinary logs, coordinator reviews, and PDF/XLSX export
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExport('PDF')}
            title="Download PDF report"
          >
            <Download size={15} style={{ color: '#ef4444' }} />
            <span>Export PDF</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExport('XLSX')}
            title="Download Excel spreadsheet"
          >
            <Download size={15} style={{ color: '#10b981' }} />
            <span>Export XLSX</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            disabled={!selectedStudentId}
          >
            <Plus size={15} />
            <span>Add Remark</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterCard}>
        <div className={styles.filterGroup} style={{ gridColumn: 'span 2' }}>
          <label className={styles.filterLabel}>Select Student</label>
          <select
            className={styles.filterSelect}
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            disabled={studentsLoading}
          >
            {studentsLoading ? (
              <option>Loading student directory...</option>
            ) : studentsData?.content && studentsData.content.length > 0 ? (
              studentsData.content.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} ({st.admissionNumber})
                </option>
              ))
            ) : (
              <option value="">No students found</option>
            )}
          </select>
        </div>
      </div>

      {/* Remarks Register */}
      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
            Remarks for {selectedStudent?.fullName || 'Student'} ({remarksList.length})
          </div>
        </div>

        {loadingRemarks ? (
          <div style={{ padding: 'var(--space-6)' }}>
            <Skeleton variant="table-row" rows={4} columns={4} />
          </div>
        ) : remarksList.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={44} />}
            message="No approved remarks recorded for this student"
            description="Use 'Add Remark' to submit positive commendations or corrective behavioral observations."
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} style={{ width: 140 }}>Category</th>
                  <th className={styles.th}>Remark / Content</th>
                  <th className={styles.th} style={{ width: 120 }}>Status</th>
                  <th className={styles.th} style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {remarksList.map((rem) => (
                  <tr key={rem.id} className={styles.tr}>
                    <td className={styles.td}>
                      {rem.category === 'POSITIVE' ? (
                        <span
                          className={styles.badge}
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#065f46',
                            gap: 4,
                          }}
                        >
                          <ThumbsUp size={12} />
                          <span>Positive</span>
                        </span>
                      ) : (
                        <span
                          className={styles.badge}
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#92400e',
                            gap: 4,
                          }}
                        >
                          <AlertTriangle size={12} />
                          <span>Corrective</span>
                        </span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                        {rem.content}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span
                        className={`${styles.badge} ${
                          rem.status === 'APPROVED'
                            ? styles.badgeApproved
                            : rem.status === 'REJECTED'
                            ? styles.badgeRejected
                            : styles.badgeDraft
                        }`}
                      >
                        {rem.status}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {rem.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleApprove(rem.id)}
                            disabled={actionLoadingId === rem.id}
                            title="Approve remark"
                          >
                            <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleReject(rem.id)}
                            disabled={actionLoadingId === rem.id}
                            title="Reject remark"
                          >
                            <XCircle size={13} style={{ color: '#ef4444' }} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                          Reviewed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE REMARK MODAL ──────────────────────────────── */}
      {isCreateOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Student Remark</h3>
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
                <div>
                  <strong>Student:</strong> {selectedStudent?.fullName} ({selectedStudent?.admissionNumber})
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Remark Category</label>
                  <select
                    className={styles.filterSelect}
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RemarkCategory)}
                  >
                    <option value="POSITIVE">POSITIVE (Commendation / Academic Excellence)</option>
                    <option value="CORRECTIVE">CORRECTIVE (Disciplinary / Behavioral Note)</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Observation / Content</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Describe student's accomplishment or behavioral note..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={2000}
                    required
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
                  Submit Remark
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
