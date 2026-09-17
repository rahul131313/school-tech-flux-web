/* ============================================================
   AttendancePage — Student & Staff Attendance Register
   Connected to Spring Boot:
   - Student Attendance:
     - GET /api/v1/attendance/student?sectionId={}&date={}
     - POST /api/v1/attendance/student (bulk mark)
     - GET /api/v1/attendance/student/export?sectionId={}&date={}&format={}
     - POST /api/v1/attendance/student/import (multipart)
     - PATCH /api/v1/attendance/student/{id} (revision)
   - Staff Attendance:
     - POST /api/v1/attendance/staff/check-in
     - POST /api/v1/attendance/staff/check-out
     - POST /api/v1/attendance/staff (bulk mark)
     - GET /api/v1/attendance/staff?from=&to=&staffId=&branchId=
   ============================================================ */

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  Save,
  Users,
  Download,
  Upload,
  UserCheck,
  Edit2,
  X,
  FileSpreadsheet,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useSections } from '../../settings/hooks/useSections';
import { useStudentEnrollments } from '../../settings/hooks/useStudentEnrollments';
import { useStudents } from '../../students/hooks/useStudents';
import { useBranches } from '../../settings/hooks/useBranches';
import {
  useStudentAttendance,
  useMarkStudentAttendance,
  useReviseStudentAttendance,
  useImportStudentAttendance,
  useStaffAttendance,
  useStaffCheckIn,
  useStaffCheckOut,
  useBulkMarkStaffAttendance,
} from '../hooks/useAttendance';
import { attendanceApi } from '../../../api/endpoints/attendance';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import type {
  AttendanceStatus,
  StudentAttendanceEntryRequest,
  StudentAttendanceResponse,
  StaffAttendanceStatus,
  StaffAttendanceBulkEntryRequest,
  ExportFormat,
} from '../../../api/types';
import styles from './AttendancePage.module.css';

interface LocalStudentEntry {
  studentId: string;
  rollNumber: string;
  status: AttendanceStatus;
  remarks: string;
  recordId?: string;
}

export function AttendancePage() {
  const todayStr = new Date().toISOString().split('T')[0];
  const toast = useToast();

  // Active module tab: 'STUDENTS' | 'STAFF'
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'STAFF'>('STUDENTS');

  // ─── Student Attendance State ──────────────────────────────
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [periodNumber, setPeriodNumber] = useState<number>(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revision state
  const [revisingRecord, setRevisingRecord] = useState<{
    id: string;
    studentName: string;
    status: AttendanceStatus;
    remarks: string;
  } | null>(null);

  // Queries for students
  const { data: sectionsData, isLoading: sectionsLoading } = useSections({ size: 100 });
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useStudentEnrollments({
    size: 200,
  });
  const { data: studentsData } = useStudents({ size: 500 });
  const {
    data: attendanceRecords,
    isLoading: attendanceLoading,
  } = useStudentAttendance(selectedSectionId, selectedDate);

  // Student Mutations
  const markMutation = useMarkStudentAttendance();
  const reviseMutation = useReviseStudentAttendance();
  const importMutation = useImportStudentAttendance();

  // Map studentId -> fullName
  const studentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (studentsData?.content) {
      studentsData.content.forEach((s) => map.set(s.id, s.fullName));
    }
    return map;
  }, [studentsData]);

  // Filter students enrolled in the selected section
  const sectionStudents = useMemo(() => {
    if (!selectedSectionId || !enrollmentsData?.content) return [];
    return enrollmentsData.content
      .filter((e) => e.sectionId === selectedSectionId && e.status === 'ACTIVE')
      .sort((a, b) => (a.rollNumber || '').localeCompare(b.rollNumber || ''));
  }, [selectedSectionId, enrollmentsData]);

  // Local state for attendance entries being marked
  const [entries, setEntries] = useState<Record<string, LocalStudentEntry>>({});

  // Sync entries when section, students, or existing attendance records change
  useEffect(() => {
    if (sectionStudents.length === 0) {
      setEntries({});
      return;
    }

    const attendanceMap = new Map<string, StudentAttendanceResponse>();
    if (attendanceRecords) {
      attendanceRecords.forEach((rec) => {
        attendanceMap.set(rec.studentId, rec);
      });
    }

    const initial: Record<string, LocalStudentEntry> = {};
    sectionStudents.forEach((student) => {
      const existing = attendanceMap.get(student.studentId);
      initial[student.studentId] = {
        studentId: student.studentId,
        rollNumber: student.rollNumber || '—',
        status: (existing?.status as AttendanceStatus) || 'PRESENT',
        remarks: existing?.remarks || '',
        recordId: existing?.id,
      };
    });

    setEntries(initial);
  }, [sectionStudents, attendanceRecords]);

  // Automatically select first section once loaded
  useEffect(() => {
    if (!selectedSectionId && sectionsData?.content && sectionsData.content.length > 0) {
      setSelectedSectionId(sectionsData.content[0].id);
    }
  }, [sectionsData, selectedSectionId]);

  // ─── Staff Attendance State ────────────────────────────────
  const [staffDate, setStaffDate] = useState<string>(todayStr);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isBulkStaffModalOpen, setIsBulkStaffModalOpen] = useState(false);
  const [staffBulkEntries, setStaffBulkEntries] = useState<StaffAttendanceBulkEntryRequest[]>([
    { staffId: '', status: 'PRESENT', remarks: '' },
  ]);

  const { data: branchesData } = useBranches({ size: 100 });
  const {
    data: staffAttendanceList,
    isLoading: staffLoading,
  } = useStaffAttendance({
    from: staffDate,
    to: staffDate,
    branchId: selectedBranchId || undefined,
  });

  const checkInMutation = useStaffCheckIn();
  const checkOutMutation = useStaffCheckOut();
  const bulkMarkStaffMutation = useBulkMarkStaffAttendance();

  // Handlers for student roll-call
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setEntries((prev) => {
      const updated: Record<string, LocalStudentEntry> = {};
      Object.keys(prev).forEach((id) => {
        updated[id] = { ...prev[id], status };
      });
      return updated;
    });
  };

  const handleSaveStudentAttendance = () => {
    if (!selectedSectionId || sectionStudents.length === 0) return;

    const payloadEntries: StudentAttendanceEntryRequest[] = Object.values(entries).map(
      (e) => ({
        studentId: e.studentId,
        status: e.status,
        remarks: e.remarks.trim() || undefined,
      })
    );

    markMutation.mutate({
      sectionId: selectedSectionId,
      date: selectedDate,
      periodNumber,
      entries: payloadEntries,
    });
  };

  const handleExport = async (format: ExportFormat) => {
    if (!selectedSectionId) {
      toast.error('Please select a section to export');
      return;
    }
    try {
      toast.info(`Preparing ${format} download...`);
      await attendanceApi.exportAttendance(selectedSectionId, selectedDate, format);
      toast.success(`${format} attendance file downloaded!`);
    } catch {
      toast.error(`Failed to export ${format} attendance file`);
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please choose an Excel file (.xlsx)');
      return;
    }
    if (importFile.size > 5_000_000) {
      toast.error('File size exceeds 5 MB limit');
      return;
    }
    if (!selectedSectionId) {
      toast.error('Please select a section for import');
      return;
    }

    importMutation.mutate(
      {
        sectionId: selectedSectionId,
        date: selectedDate,
        file: importFile,
        periodNumber,
      },
      {
        onSuccess: () => {
          setIsImportModalOpen(false);
          setImportFile(null);
        },
      }
    );
  };

  const handleReviseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisingRecord) return;
    reviseMutation.mutate(
      {
        id: revisingRecord.id,
        sectionId: selectedSectionId,
        date: selectedDate,
        data: {
          status: revisingRecord.status,
          remarks: revisingRecord.remarks.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setRevisingRecord(null);
        },
      }
    );
  };

  const handleBulkStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validEntries = staffBulkEntries.filter((b) => b.staffId.trim());
    if (validEntries.length === 0) {
      toast.error('Please enter at least one valid Staff ID');
      return;
    }
    bulkMarkStaffMutation.mutate(
      {
        date: staffDate,
        entries: validEntries,
      },
      {
        onSuccess: () => {
          setIsBulkStaffModalOpen(false);
          setStaffBulkEntries([{ staffId: '', status: 'PRESENT', remarks: '' }]);
        },
      }
    );
  };

  // Stats calculation
  const stats = useMemo(() => {
    const list = Object.values(entries);
    const total = list.length;
    const present = list.filter((e) => e.status === 'PRESENT').length;
    const absent = list.filter((e) => e.status === 'ABSENT').length;
    const late = list.filter((e) => e.status === 'LATE').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, rate };
  }, [entries]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Attendance Register</h1>
          <p className={styles.subtitle}>
            Student classroom roll-call, Excel import/export & Staff attendance management
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'STUDENTS' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('STUDENTS')}
          >
            <Users size={16} />
            <span>Student Attendance</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'STAFF' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('STAFF')}
          >
            <UserCheck size={16} />
            <span>Staff Attendance</span>
          </button>
        </div>
      </div>

      {/* ── STUDENT ATTENDANCE TAB ───────────────────────────── */}
      {activeTab === 'STUDENTS' && (
        <>
          {/* Filter Bar */}
          <div className={styles.filterCard}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="sectionSelect">
                Section / Class
              </label>
              <select
                id="sectionSelect"
                className={styles.filterSelect}
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                disabled={sectionsLoading}
              >
                {sectionsLoading ? (
                  <option>Loading classes...</option>
                ) : sectionsData?.content && sectionsData.content.length > 0 ? (
                  sectionsData.content.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      Section: {sec.name}
                    </option>
                  ))
                ) : (
                  <option value="">No sections configured</option>
                )}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="attendanceDate">
                Attendance Date
              </label>
              <input
                id="attendanceDate"
                type="date"
                className={styles.filterInput}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="periodNumber">
                Period
              </label>
              <select
                id="periodNumber"
                className={styles.filterSelect}
                value={periodNumber}
                onChange={(e) => setPeriodNumber(Number(e.target.value))}
              >
                <option value={1}>Period 1 (Morning Roll-Call)</option>
                <option value={2}>Period 2</option>
                <option value={3}>Period 3</option>
                <option value={4}>Period 4</option>
                <option value={5}>Period 5</option>
              </select>
            </div>

            <div className={styles.exportGroup}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setIsImportModalOpen(true)}
                title="Import student attendance from Excel"
              >
                <Upload size={15} style={{ color: 'var(--color-primary-600)' }} />
                <span>Import XLSX</span>
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => handleExport('XLSX')}
                title="Download Excel register"
              >
                <Download size={15} style={{ color: '#10b981' }} />
                <span>Export XLSX</span>
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => handleExport('PDF')}
                title="Download PDF report"
              >
                <Download size={15} style={{ color: '#ef4444' }} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          {sectionStudents.length > 0 && (
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{stats.total}</span>
                <span className={styles.statLabel}>Total Enrolled</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue} style={{ color: '#10b981' }}>
                  {stats.present}
                </span>
                <span className={styles.statLabel}>Present</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue} style={{ color: '#ef4444' }}>
                  {stats.absent}
                </span>
                <span className={styles.statLabel}>Absent</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue} style={{ color: '#f59e0b' }}>
                  {stats.late}
                </span>
                <span className={styles.statLabel}>Late</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue} style={{ color: 'var(--color-primary-600)' }}>
                  {stats.rate}%
                </span>
                <span className={styles.statLabel}>Attendance Rate</span>
              </div>
            </div>
          )}

          {/* Register Table / Card */}
          <div className={styles.registerCard}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.quickActions}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => handleMarkAll('PRESENT')}
                  disabled={sectionStudents.length === 0}
                >
                  <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                  <span>Mark All Present</span>
                </button>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => handleMarkAll('ABSENT')}
                  disabled={sectionStudents.length === 0}
                >
                  <XCircle size={15} style={{ color: '#ef4444' }} />
                  <span>Mark All Absent</span>
                </button>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveStudentAttendance}
                loading={markMutation.isPending}
                disabled={sectionStudents.length === 0}
              >
                <Save size={15} />
                <span>Save Attendance</span>
              </Button>
            </div>

            {/* Content */}
            {enrollmentsLoading || attendanceLoading ? (
              <div style={{ padding: 'var(--space-6)' }}>
                <Skeleton variant="table-row" rows={6} columns={4} />
              </div>
            ) : sectionStudents.length === 0 ? (
              <EmptyState
                icon={<Users size={44} />}
                message="No active students found in this section"
                description="Add or enroll students into this section under Settings → Student Enrollments."
              />
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th} style={{ width: 90 }}>Roll No</th>
                      <th className={styles.th}>Student</th>
                      <th className={styles.th} style={{ minWidth: 320 }}>Attendance Status</th>
                      <th className={styles.th}>Remarks</th>
                      <th className={styles.th} style={{ width: 80 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionStudents.map((student) => {
                      const entry = entries[student.studentId] || {
                        status: 'PRESENT',
                        remarks: '',
                      };
                      const studentName = studentNameMap.get(student.studentId) || 'Student';

                      return (
                        <tr key={student.studentId} className={styles.tr}>
                          <td className={styles.td}>
                            <strong>{student.rollNumber || '—'}</strong>
                          </td>
                          <td className={styles.td}>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {studentName}
                            </div>
                            <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                              {student.studentId}
                            </span>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.statusButtonGroup}>
                              <button
                                type="button"
                                className={`${styles.statusBtn} ${
                                  entry.status === 'PRESENT' ? styles.btnPresentActive : ''
                                }`}
                                onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                className={`${styles.statusBtn} ${
                                  entry.status === 'ABSENT' ? styles.btnAbsentActive : ''
                                }`}
                                onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                className={`${styles.statusBtn} ${
                                  entry.status === 'LATE' ? styles.btnLateActive : ''
                                }`}
                                onClick={() => handleStatusChange(student.studentId, 'LATE')}
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                className={`${styles.statusBtn} ${
                                  entry.status === 'HALF_DAY' ? styles.btnHalfDayActive : ''
                                }`}
                                onClick={() => handleStatusChange(student.studentId, 'HALF_DAY')}
                              >
                                Half Day
                              </button>
                              <button
                                type="button"
                                className={`${styles.statusBtn} ${
                                  entry.status === 'EXCUSED' ? styles.btnExcusedActive : ''
                                }`}
                                onClick={() => handleStatusChange(student.studentId, 'EXCUSED')}
                              >
                                Excused
                              </button>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <input
                              type="text"
                              className={styles.remarkInput}
                              placeholder="Optional note..."
                              value={entry.remarks}
                              onChange={(e) =>
                                handleRemarksChange(student.studentId, e.target.value)
                              }
                              maxLength={500}
                            />
                          </td>
                          <td className={styles.td}>
                            {entry.recordId && (
                              <button
                                type="button"
                                className={styles.actionBtn}
                                title="Revise marked attendance record"
                                onClick={() =>
                                  setRevisingRecord({
                                    id: entry.recordId!,
                                    studentName,
                                    status: entry.status,
                                    remarks: entry.remarks,
                                  })
                                }
                              >
                                <Edit2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {sectionStudents.length > 0 && (
              <div className={styles.saveFooter}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSaveStudentAttendance}
                  loading={markMutation.isPending}
                >
                  <Save size={16} />
                  <span>Submit & Save Register</span>
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── STAFF ATTENDANCE TAB ──────────────────────────────── */}
      {activeTab === 'STAFF' && (
        <>
          {/* Staff Filter & Self-Service Bar */}
          <div className={styles.filterCard}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="staffDate">
                Attendance Date
              </label>
              <input
                id="staffDate"
                type="date"
                className={styles.filterInput}
                value={staffDate}
                onChange={(e) => setStaffDate(e.target.value)}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="branchSelect">
                Branch
              </label>
              <select
                id="branchSelect"
                className={styles.filterSelect}
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                <option value="">All Branches</option>
                {branchesData?.content.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.exportGroup}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => checkInMutation.mutate()}
                loading={checkInMutation.isPending}
                title="Self Check-in"
              >
                <LogIn size={15} style={{ color: '#10b981' }} />
                <span>Self Check-In</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => checkOutMutation.mutate()}
                loading={checkOutMutation.isPending}
                title="Self Check-out"
              >
                <LogOut size={15} style={{ color: '#f59e0b' }} />
                <span>Self Check-Out</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsBulkStaffModalOpen(true)}
              >
                <UserCheck size={15} />
                <span>Bulk Mark Staff</span>
              </Button>
            </div>
          </div>

          {/* Staff Attendance Register Table */}
          <div className={styles.registerCard}>
            <div className={styles.toolbar}>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                Staff Attendance Records for {staffDate}
              </div>
            </div>

            {staffLoading ? (
              <div style={{ padding: 'var(--space-6)' }}>
                <Skeleton variant="table-row" rows={5} columns={6} />
              </div>
            ) : !staffAttendanceList || staffAttendanceList.length === 0 ? (
              <EmptyState
                icon={<UserCheck size={44} />}
                message="No staff attendance recorded for this date"
                description="Staff can self check-in using the button above, or administrators can mark bulk attendance."
              />
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Staff ID</th>
                      <th className={styles.th}>Check-in Time</th>
                      <th className={styles.th}>Check-out Time</th>
                      <th className={styles.th}>Status</th>
                      <th className={styles.th}>Method</th>
                      <th className={styles.th}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffAttendanceList.map((record) => {
                      let badgeClass = styles.badgePresent;
                      if (record.status === 'ABSENT') badgeClass = styles.badgeAbsent;
                      if (record.status === 'ON_LEAVE') badgeClass = styles.badgeLeave;
                      if (record.status === 'HALF_DAY') badgeClass = styles.badgeHalfDay;

                      return (
                        <tr key={record.id} className={styles.tr}>
                          <td className={styles.td}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {record.staffId}
                            </span>
                          </td>
                          <td className={styles.td}>{record.checkInTime || '—'}</td>
                          <td className={styles.td}>{record.checkOutTime || '—'}</td>
                          <td className={styles.td}>
                            <span className={`${styles.badge} ${badgeClass}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className={styles.td}>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                              {record.method || 'MANUAL'}
                            </span>
                          </td>
                          <td className={styles.td}>{record.remarks || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── IMPORT EXCEL MODAL ───────────────────────────────── */}
      {isImportModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Import Student Attendance</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsImportModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.noticeBanner}>
                  <strong>Workbook Requirements:</strong>
                  <br />• File format: <strong>.xlsx</strong> (maximum size 5 MB)
                  <br />• Required column headers: <strong>Student ID</strong>, <strong>Status</strong>, <strong>Remarks</strong>
                  <br />• Valid Status values: <code>PRESENT</code>, <code>ABSENT</code>, <code>LATE</code>, <code>HALF_DAY</code>, <code>EXCUSED</code>
                </div>

                <div
                  className={styles.dropzone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet
                    size={40}
                    style={{ color: 'var(--color-primary-600)', marginBottom: 8 }}
                  />
                  <div>
                    {importFile ? (
                      <strong>{importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</strong>
                    ) : (
                      <span>Click to select an .xlsx attendance spreadsheet</span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImportFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Confirm Target Section</label>
                  <select
                    className={styles.filterSelect}
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                  >
                    {sectionsData?.content.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        Section: {sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Confirm Date</label>
                  <input
                    type="date"
                    className={styles.filterInput}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsImportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={importMutation.isPending}
                  disabled={!importFile}
                >
                  Upload & Import
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REVISE ATTENDANCE MODAL ──────────────────────────── */}
      {revisingRecord && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Revise Attendance</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setRevisingRecord(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReviseSubmit}>
              <div className={styles.modalBody}>
                <div>
                  <strong>Student:</strong> {revisingRecord.studentName}
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>New Status</label>
                  <select
                    className={styles.filterSelect}
                    value={revisingRecord.status}
                    onChange={(e) =>
                      setRevisingRecord((prev) =>
                        prev
                          ? { ...prev, status: e.target.value as AttendanceStatus }
                          : null
                      )
                    }
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="LATE">LATE</option>
                    <option value="HALF_DAY">HALF_DAY</option>
                    <option value="EXCUSED">EXCUSED</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Revision Reason / Remarks</label>
                  <input
                    type="text"
                    className={styles.filterInput}
                    value={revisingRecord.remarks}
                    onChange={(e) =>
                      setRevisingRecord((prev) =>
                        prev ? { ...prev, remarks: e.target.value } : null
                      )
                    }
                    placeholder="E.g., Doctor note submitted"
                    maxLength={500}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRevisingRecord(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={reviseMutation.isPending}
                >
                  Submit Revision
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── BULK MARK STAFF MODAL ────────────────────────────── */}
      {isBulkStaffModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: 640 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Bulk Mark Staff Attendance</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsBulkStaffModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBulkStaffSubmit}>
              <div className={styles.modalBody}>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  Record staff attendance for <strong>{staffDate}</strong>.
                </div>

                {staffBulkEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1.5fr 32px',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="text"
                      className={styles.filterInput}
                      placeholder="Staff UUID / ID"
                      value={entry.staffId}
                      onChange={(e) => {
                        const updated = [...staffBulkEntries];
                        updated[idx].staffId = e.target.value;
                        setStaffBulkEntries(updated);
                      }}
                      required
                    />

                    <select
                      className={styles.filterSelect}
                      value={entry.status}
                      onChange={(e) => {
                        const updated = [...staffBulkEntries];
                        updated[idx].status = e.target.value as StaffAttendanceStatus;
                        setStaffBulkEntries(updated);
                      }}
                    >
                      <option value="PRESENT">PRESENT</option>
                      <option value="ABSENT">ABSENT</option>
                      <option value="ON_LEAVE">ON_LEAVE</option>
                      <option value="HALF_DAY">HALF_DAY</option>
                    </select>

                    <input
                      type="text"
                      className={styles.filterInput}
                      placeholder="Remarks..."
                      value={entry.remarks || ''}
                      onChange={(e) => {
                        const updated = [...staffBulkEntries];
                        updated[idx].remarks = e.target.value;
                        setStaffBulkEntries(updated);
                      }}
                    />

                    {staffBulkEntries.length > 1 && (
                      <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={() =>
                          setStaffBulkEntries((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() =>
                    setStaffBulkEntries((prev) => [
                      ...prev,
                      { staffId: '', status: 'PRESENT', remarks: '' },
                    ])
                  }
                >
                  + Add Staff Row
                </button>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsBulkStaffModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={bulkMarkStaffMutation.isPending}
                >
                  Submit Staff Register
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
