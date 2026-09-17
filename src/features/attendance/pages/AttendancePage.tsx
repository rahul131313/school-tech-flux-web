/* ============================================================
   AttendancePage — Student Daily Roll-Call & Attendance Register
   Connected to Spring Boot:
   - GET /api/v1/attendance/student?sectionId={}&date={}
   - POST /api/v1/attendance/student
   ============================================================ */

import { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Save,
  Users,
} from 'lucide-react';
import { useSections } from '../../settings/hooks/useSections';
import { useStudentEnrollments } from '../../settings/hooks/useStudentEnrollments';
import { useStudents } from '../../students/hooks/useStudents';
import {
  useStudentAttendance,
  useMarkStudentAttendance,
} from '../hooks/useAttendance';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { Skeleton } from '../../../components/feedback/Skeleton';
import type { AttendanceStatus, StudentAttendanceEntryRequest } from '../../../api/types';
import styles from './AttendancePage.module.css';

interface LocalEntry {
  studentId: string;
  rollNumber: string;
  status: AttendanceStatus;
  remarks: string;
}

export function AttendancePage() {
  const todayStr = new Date().toISOString().split('T')[0];

  // Filters
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [periodNumber, setPeriodNumber] = useState<number>(1);

  // Queries
  const { data: sectionsData, isLoading: sectionsLoading } = useSections({ size: 100 });
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useStudentEnrollments({
    size: 200,
  });
  const { data: studentsData } = useStudents({ size: 500 });
  const {
    data: attendanceRecords,
    isLoading: attendanceLoading,
  } = useStudentAttendance(selectedSectionId, selectedDate);

  const markMutation = useMarkStudentAttendance();

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
  const [entries, setEntries] = useState<Record<string, LocalEntry>>({});

  // Sync entries when section, students, or existing attendance records change
  useEffect(() => {
    if (sectionStudents.length === 0) {
      setEntries({});
      return;
    }

    const attendanceMap = new Map<string, { status: AttendanceStatus; remarks?: string }>();
    if (attendanceRecords) {
      attendanceRecords.forEach((rec) => {
        attendanceMap.set(rec.studentId, {
          status: rec.status,
          remarks: rec.remarks,
        });
      });
    }

    const initial: Record<string, LocalEntry> = {};
    sectionStudents.forEach((student) => {
      const existing = attendanceMap.get(student.studentId);
      initial[student.studentId] = {
        studentId: student.studentId,
        rollNumber: student.rollNumber || '—',
        status: existing ? existing.status : 'PRESENT',
        remarks: existing?.remarks || '',
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

  // Handlers
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
      const updated: Record<string, LocalEntry> = {};
      Object.keys(prev).forEach((id) => {
        updated[id] = { ...prev[id], status };
      });
      return updated;
    });
  };

  const handleSave = () => {
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
          <h1 className={styles.title}>Student Attendance</h1>
          <p className={styles.subtitle}>
            Daily classroom roll-call register & attendance verification
          </p>
        </div>
      </div>

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
            <option value={1}>Period 1 (Full Day Morning)</option>
            <option value={2}>Period 2</option>
            <option value={3}>Period 3</option>
            <option value={4}>Period 4</option>
            <option value={5}>Period 5</option>
          </select>
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
            onClick={handleSave}
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
                  <th className={styles.th} style={{ width: 100 }}>Roll No</th>
                  <th className={styles.th}>Student</th>
                  <th className={styles.th} style={{ minWidth: 320 }}>Attendance Status</th>
                  <th className={styles.th}>Remarks</th>
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
              onClick={handleSave}
              loading={markMutation.isPending}
            >
              <Save size={16} />
              <span>Submit & Save Register</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
