/* ============================================================
   TimetablePage — Visual Weekly Schedule Grid
   Consumes /api/v1/timetable-slots, /api/v1/sections, /api/v1/subjects
   ============================================================ */

import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { Settings, Calendar } from 'lucide-react';
import { useSections } from '../../settings/hooks/useSections';
import { useSubjects } from '../../settings/hooks/useSubjects';
import { useTimetableSlots } from '../../settings/hooks/useTimetableSlots';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { Skeleton } from '../../../components/feedback/Skeleton';
import type { DayOfWeek, TimetableSlotResponse } from '../../../api/types';
import styles from './TimetablePage.module.css';

const DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export function TimetablePage() {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  const { data: sectionsData, isLoading: sectionsLoading } = useSections({ size: 100 });
  const { data: subjectsData } = useSubjects({ size: 100 });
  const { data: slotsData, isLoading: slotsLoading } = useTimetableSlots({ size: 300 });

  // Map subjects by ID for instant name lookup
  const subjectMap = useMemo(() => {
    const map = new Map<string, string>();
    if (subjectsData?.content) {
      subjectsData.content.forEach((s) => map.set(s.id, s.name));
    }
    return map;
  }, [subjectsData]);

  // Set default section
  const effectiveSectionId =
    selectedSectionId || (sectionsData?.content?.[0]?.id ?? '');

  // Filter slots for active section
  const sectionSlots = useMemo(() => {
    if (!effectiveSectionId || !slotsData?.content) return [];
    return slotsData.content.filter((slot) => slot.sectionId === effectiveSectionId);
  }, [effectiveSectionId, slotsData]);

  // Slot lookup map by `day-period`
  const slotGrid = useMemo(() => {
    const map = new Map<string, TimetableSlotResponse>();
    sectionSlots.forEach((slot) => {
      map.set(`${slot.dayOfWeek}-${slot.periodNumber}`, slot);
    });
    return map;
  }, [sectionSlots]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Weekly Timetable</h1>
          <p className={styles.subtitle}>
            Interactive weekly schedule grid for classes and sections
          </p>
        </div>

        <Link
          to="/settings/timetable-slots"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-primary-600)',
            textDecoration: 'none',
          }}
        >
          <Settings size={16} />
          <span>Manage Slots & Periods</span>
        </Link>
      </div>

      {/* Filter Section Bar */}
      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="timetableSection">
            Class Section:
          </label>
          <select
            id="timetableSection"
            className={styles.filterSelect}
            value={effectiveSectionId}
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
              <option value="">No sections found</option>
            )}
          </select>
        </div>
      </div>

      {/* Grid Schedule */}
      {slotsLoading || sectionsLoading ? (
        <div style={{ padding: 'var(--space-6)' }}>
          <Skeleton variant="rect" height="350px" />
        </div>
      ) : sectionSlots.length === 0 ? (
        <EmptyState
          icon={<Calendar size={44} />}
          message="No timetable slots scheduled for this section"
          description="Create slots with period timings and subjects in Settings → Timetable Slots."
        />
      ) : (
        <div className={styles.gridCard}>
          <table className={styles.gridTable}>
            <thead>
              <tr>
                <th className={`${styles.gridTh} ${styles.dayColumnHeader}`}>Day</th>
                {PERIODS.map((period) => (
                  <th key={period} className={styles.gridTh}>
                    Period {period}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day}>
                  <td className={`${styles.gridTd} ${styles.dayCell}`}>
                    {day.slice(0, 3)}
                  </td>
                  {PERIODS.map((period) => {
                    const slot = slotGrid.get(`${day}-${period}`);
                    return (
                      <td key={period} className={styles.gridTd}>
                        {slot ? (
                          <div className={styles.slotCard}>
                            <span className={styles.subjectName}>
                              {subjectMap.get(slot.subjectId) || 'Subject'}
                            </span>
                            <span className={styles.slotTime}>
                              {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                            </span>
                          </div>
                        ) : (
                          <div className={styles.emptySlot}>—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
