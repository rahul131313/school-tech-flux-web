/* ============================================================
   ExamsPage — Examinations, Subjects, Marks, and Report Cards
   Connected to Spring Boot:
   - POST /api/v1/exams
   - POST /api/v1/exams/{id}/subjects
   - POST /api/v1/exams/subjects/{id}/marks
   - POST /api/v1/exams/{id}/lock
   - POST /api/v1/exams/{id}/publish
   ============================================================ */

import { useState } from 'react';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Lock,
  Globe,
  FileText,
  X,
  Award,
} from 'lucide-react';
import { useAcademicYears } from '../../settings/hooks/useAcademicYears';
import { useSections } from '../../settings/hooks/useSections';
import { useSubjects } from '../../settings/hooks/useSubjects';
import { useStudents } from '../../students/hooks/useStudents';
import { examsApi } from '../../../api/endpoints/exams';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { useToast } from '../../../components/ui/Toast';
import { isApiError, type ApiError } from '../../../api/types';
import styles from './Academics.module.css';

interface CreatedExam {
  id: string;
  name: string;
  academicYearId: string;
  sectionId: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'LOCKED' | 'PUBLISHED';
  subjects: Array<{
    id: string;
    subjectId: string;
    maxMarks: number;
    passMarks: number;
    examDate: string;
  }>;
}

export function ExamsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'EXAMS' | 'REPORT_CARDS'>('EXAMS');

  // Queries for dropdowns
  const { data: yearsData } = useAcademicYears({ size: 100 });
  const { data: sectionsData } = useSections({ size: 100 });
  const { data: subjectsData } = useSubjects({ size: 100 });
  const { data: studentsData } = useStudents({ size: 500 });

  // Local storage of configured exams in session
  const [examsList, setExamsList] = useState<CreatedExam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // Modals
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isEnterMarksOpen, setIsEnterMarksOpen] = useState(false);
  const [selectedSubjectIdForMarks, setSelectedSubjectIdForMarks] = useState<string>('');

  // Form states
  const [examName, setExamName] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Add Subject Form
  const [subjectId, setSubjectId] = useState('');
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [passMarks, setPassMarks] = useState<number>(35);
  const [examDate, setExamDate] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  // Enter Marks Form
  const [studentId, setStudentId] = useState('');
  const [marksObtained, setMarksObtained] = useState<number | ''>('');
  const [absent, setAbsent] = useState(false);
  const [isEnteringMarks, setIsEnteringMarks] = useState(false);

  // Workflow states
  const [isLocking, setIsLocking] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const selectedExam = examsList.find((e) => e.id === selectedExamId);

  // Handler: Create Exam
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academicYearId || !sectionId || !examName.trim() || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (endDate < startDate) {
      toast.error('End date cannot be before start date');
      return;
    }

    setIsCreating(true);
    try {
      const res = await examsApi.create({
        academicYearId,
        sectionId,
        name: examName.trim(),
        startDate,
        endDate,
      });

      const newExam: CreatedExam = {
        id: res.id,
        name: examName.trim(),
        academicYearId,
        sectionId,
        startDate,
        endDate,
        status: 'DRAFT',
        subjects: [],
      };

      setExamsList((prev) => [newExam, ...prev]);
      setSelectedExamId(res.id);
      setIsCreateExamOpen(false);
      setExamName('');
      toast.success(`Exam "${newExam.name}" scheduled successfully!`);
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to create exam');
      } else {
        toast.error('Failed to create examination schedule');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Handler: Add Subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !subjectId || !examDate) {
      toast.error('Please fill in all subject details');
      return;
    }
    if (passMarks > maxMarks) {
      toast.error('Pass marks cannot exceed maximum marks');
      return;
    }

    setIsAddingSubject(true);
    try {
      const res = await examsApi.addSubject(selectedExamId, {
        subjectId,
        maxMarks: Number(maxMarks),
        passMarks: Number(passMarks),
        examDate,
      });

      setExamsList((prev) =>
        prev.map((ex) =>
          ex.id === selectedExamId
            ? {
                ...ex,
                subjects: [
                  ...ex.subjects,
                  {
                    id: res.id,
                    subjectId,
                    maxMarks: Number(maxMarks),
                    passMarks: Number(passMarks),
                    examDate,
                  },
                ],
              }
            : ex
        )
      );

      setIsAddSubjectOpen(false);
      setSubjectId('');
      toast.success('Subject added to examination schedule!');
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to add exam subject');
      } else {
        toast.error('Failed to configure exam subject');
      }
    } finally {
      setIsAddingSubject(false);
    }
  };

  // Handler: Enter Mark
  const handleEnterMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectIdForMarks || !studentId) {
      toast.error('Select student and paper');
      return;
    }
    if (!absent && (marksObtained === '' || Number(marksObtained) < 0)) {
      toast.error('Enter valid marks obtained');
      return;
    }

    setIsEnteringMarks(true);
    try {
      await examsApi.enterMark(selectedSubjectIdForMarks, {
        studentId,
        marksObtained: absent ? undefined : Number(marksObtained),
        absent,
      });
      setIsEnterMarksOpen(false);
      setStudentId('');
      setMarksObtained('');
      setAbsent(false);
      toast.success('Marks recorded successfully!');
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to enter marks');
      } else {
        toast.error('Failed to submit student marks');
      }
    } finally {
      setIsEnteringMarks(false);
    }
  };

  // Handler: Lock Exam
  const handleLockExam = async (examId: string) => {
    setIsLocking(true);
    try {
      const res = await examsApi.lock(examId);
      setExamsList((prev) =>
        prev.map((ex) => (ex.id === examId ? { ...ex, status: res.status as any } : ex))
      );
      toast.success('Exam locked! Subject and mark entries are now frozen.');
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to lock exam');
      } else {
        toast.error('Failed to lock exam');
      }
    } finally {
      setIsLocking(false);
    }
  };

  // Handler: Publish Exam
  const handlePublishExam = async (examId: string) => {
    setIsPublishing(true);
    try {
      const res = await examsApi.publish(examId);
      setExamsList((prev) =>
        prev.map((ex) => (ex.id === examId ? { ...ex, status: res.status as any } : ex))
      );
      toast.success('Exam published! Grades are now visible to students and parents.');
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to publish exam');
      } else {
        toast.error('Failed to publish exam');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const subjectNameMap = new Map(subjectsData?.content.map((s) => [s.id, s.name]));
  const sectionNameMap = new Map(sectionsData?.content.map((s) => [s.id, s.name]));

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Examinations & Assessment</h1>
          <p className={styles.subtitle}>
            Schedule tests, configure subjects, record marks, lock & publish grades
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'EXAMS' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('EXAMS')}
          >
            <GraduationCap size={16} />
            <span>Exams & Marks Entry</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'REPORT_CARDS' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('REPORT_CARDS')}
          >
            <FileText size={16} />
            <span>Report Cards</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: EXAMS & MARKS ──────────────────────────────── */}
      {activeTab === 'EXAMS' && (
        <>
          <div className={styles.filterCard}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Active Examination</label>
              <select
                className={styles.filterSelect}
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                {examsList.length === 0 ? (
                  <option value="">No examinations created yet</option>
                ) : (
                  examsList.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.status})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateExamOpen(true)}
              >
                <Plus size={15} />
                <span>Create Exam</span>
              </Button>

              {selectedExam && selectedExam.status === 'DRAFT' && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsAddSubjectOpen(true)}
                  >
                    <BookOpen size={15} />
                    <span>Add Subject</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleLockExam(selectedExam.id)}
                    loading={isLocking}
                  >
                    <Lock size={15} />
                    <span>Lock Exam</span>
                  </Button>
                </>
              )}

              {selectedExam && selectedExam.status === 'LOCKED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handlePublishExam(selectedExam.id)}
                  loading={isPublishing}
                >
                  <Globe size={15} />
                  <span>Publish Exam</span>
                </Button>
              )}
            </div>
          </div>

          {/* Exam Details & Subjects Table */}
          {selectedExam ? (
            <div className={styles.card}>
              <div className={styles.toolbar}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 600 }}>
                    {selectedExam.name}
                  </h3>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    Section: {sectionNameMap.get(selectedExam.sectionId) || selectedExam.sectionId} •
                    Schedule: {selectedExam.startDate} to {selectedExam.endDate} •
                    Status:{' '}
                    <span
                      className={`${styles.badge} ${
                        selectedExam.status === 'PUBLISHED'
                          ? styles.badgePublished
                          : selectedExam.status === 'LOCKED'
                          ? styles.badgeLocked
                          : styles.badgeDraft
                      }`}
                    >
                      {selectedExam.status}
                    </span>
                  </div>
                </div>

                {selectedExam.status === 'DRAFT' && selectedExam.subjects.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedSubjectIdForMarks(selectedExam.subjects[0].id);
                      setIsEnterMarksOpen(true);
                    }}
                  >
                    <Award size={15} />
                    <span>Enter Marks</span>
                  </Button>
                )}
              </div>

              {selectedExam.subjects.length === 0 ? (
                <EmptyState
                  icon={<BookOpen size={44} />}
                  message="No subjects added to this exam"
                  description="Click 'Add Subject' above to assign papers, test dates, and marks thresholds."
                />
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Subject</th>
                        <th className={styles.th}>Exam Date</th>
                        <th className={styles.th}>Max Marks</th>
                        <th className={styles.th}>Pass Marks</th>
                        <th className={styles.th} style={{ width: 120 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedExam.subjects.map((sub) => (
                        <tr key={sub.id} className={styles.tr}>
                          <td className={styles.td}>
                            <strong>{subjectNameMap.get(sub.subjectId) || sub.subjectId}</strong>
                          </td>
                          <td className={styles.td}>{sub.examDate}</td>
                          <td className={styles.td}>{sub.maxMarks}</td>
                          <td className={styles.td}>{sub.passMarks}</td>
                          <td className={styles.td}>
                            {selectedExam.status === 'DRAFT' && (
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => {
                                  setSelectedSubjectIdForMarks(sub.id);
                                  setIsEnterMarksOpen(true);
                                }}
                              >
                                <Award size={13} />
                                <span>Marks</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<GraduationCap size={44} />}
              message="No exam selected"
              description="Create a new examination schedule above to begin configuring subjects and entering marks."
            />
          )}
        </>
      )}

      {/* ── TAB 2: REPORT CARDS (EMPTY STATE PER CONTRACT) ── */}
      {activeTab === 'REPORT_CARDS' && (
        <div className={styles.card} style={{ padding: 'var(--space-10) var(--space-6)' }}>
          <EmptyState
            icon={<FileText size={48} />}
            message="Report Cards Generation Pending Module Release"
            description="The Spring Boot report cards and grade book generation engine is scheduled for the next backend release. Exam results, percentage calculation, and printable report cards will connect automatically once live."
          />
        </div>
      )}

      {/* ── CREATE EXAM MODAL ────────────────────────────────── */}
      {isCreateExamOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create New Examination</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsCreateExamOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExam}>
              <div className={styles.modalBody}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Exam Name</label>
                  <input
                    type="text"
                    className={styles.filterInput}
                    placeholder="E.g., Mid-Term Assessment 2026"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Academic Year</label>
                  <select
                    className={styles.filterSelect}
                    value={academicYearId}
                    onChange={(e) => setAcademicYearId(e.target.value)}
                    required
                  >
                    <option value="">Select Academic Year</option>
                    {yearsData?.content.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name} {y.current ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Section / Class</label>
                  <select
                    className={styles.filterSelect}
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    required
                  >
                    <option value="">Select Class Section</option>
                    {sectionsData?.content.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Start Date</label>
                    <input
                      type="date"
                      className={styles.filterInput}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>End Date</label>
                    <input
                      type="date"
                      className={styles.filterInput}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreateExamOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isCreating}
                >
                  Create Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD SUBJECT MODAL ────────────────────────────────── */}
      {isAddSubjectOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Subject to Exam</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsAddSubjectOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubject}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Max Marks</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.filterInput}
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(Number(e.target.value))}
                      required
                      min={0.01}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Pass Marks</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.filterInput}
                      value={passMarks}
                      onChange={(e) => setPassMarks(Number(e.target.value))}
                      required
                      min={0}
                    />
                  </div>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Exam Date</label>
                  <input
                    type="date"
                    className={styles.filterInput}
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddSubjectOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isAddingSubject}
                >
                  Save Subject
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ENTER MARKS MODAL ────────────────────────────────── */}
      {isEnterMarksOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Enter Student Mark</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsEnterMarksOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEnterMark}>
              <div className={styles.modalBody}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Student</label>
                  <select
                    className={styles.filterSelect}
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  >
                    <option value="">Select Enrolled Student</option>
                    {studentsData?.content.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.fullName} ({st.admissionNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    id="absentCheck"
                    type="checkbox"
                    checked={absent}
                    onChange={(e) => setAbsent(e.target.checked)}
                  />
                  <label htmlFor="absentCheck" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                    Mark Student as Absent
                  </label>
                </div>

                {!absent && (
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Marks Obtained</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.filterInput}
                      placeholder="E.g. 85.5"
                      value={marksObtained}
                      onChange={(e) =>
                        setMarksObtained(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      required={!absent}
                      min={0}
                    />
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEnterMarksOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isEnteringMarks}
                >
                  Save Marks
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
