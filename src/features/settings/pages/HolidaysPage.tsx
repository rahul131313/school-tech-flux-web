/* ============================================================
   HolidaysPage — Academic Calendar & Holidays
   Connected to Spring Boot:
   - POST   /api/v1/holidays
   - GET    /api/v1/holidays?from=&to=
   - PUT    /api/v1/holidays/{id}
   - DELETE /api/v1/holidays/{id}
   Features:
   - Interactive Monthly Calendar Grid (visual calendar)
   - Detailed List / Register Table View
   - Fast Month Navigation with Today jumper
   - Click-to-add on any calendar day
   - Branch scoping & School-wide flags
   - Summary stat cards
   ============================================================ */

import { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  CalendarDays,
  Sparkles,
  Building,
  X,
} from 'lucide-react';
import { useBranches } from '../hooks/useBranches';
import { holidaysApi } from '../../../api/endpoints/holidays';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { isApiError, type ApiError, type HolidayResponse } from '../../../api/types';
import styles from './HolidaysPage.module.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HolidaysPage() {
  const toast = useToast();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Month navigation state for Calendar view
  const [viewDate, setViewDate] = useState(() => new Date());

  // Date range filter for List view
  const currentYear = new Date().getFullYear();
  const [fromDate, setFromDate] = useState(`${currentYear}-01-01`);
  const [toDate, setToDate] = useState(`${currentYear}-12-31`);

  const { data: branchesData } = useBranches({ size: 100 });
  const branches = branchesData?.content || [];
  const branchNameMap = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name])),
    [branches]
  );

  const [holidays, setHolidays] = useState<HolidayResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Add / Edit Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayResponse | null>(null);
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [branchId, setBranchId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch holidays for the selected range or current year
  const fetchHolidays = async () => {
    setLoading(true);
    try {
      // In calendar view, load the whole year of the active viewDate
      const activeYear = viewDate.getFullYear();
      const from = viewMode === 'calendar' ? `${activeYear}-01-01` : fromDate;
      const to = viewMode === 'calendar' ? `${activeYear}-12-31` : toDate;

      const list = await holidaysApi.list(from, to);
      setHolidays(list.sort((a, b) => a.date.localeCompare(b.date)));
    } catch {
      toast.error('Failed to load academic calendar holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [fromDate, toDate, viewMode, viewDate.getFullYear()]);

  // Index holidays by date (YYYY-MM-DD)
  const holidaysByDate = useMemo(() => {
    const map = new Map<string, HolidayResponse[]>();
    holidays.forEach((h) => {
      const existing = map.get(h.date) || [];
      existing.push(h);
      map.set(h.date, existing);
    });
    return map;
  }, [holidays]);

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Today YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      // Construct date string manually to avoid timezone shift
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill out 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let nextD = 1; nextD <= remaining; nextD++) {
      const nextDate = new Date(year, month + 1, nextD);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: nextD,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [viewDate]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setViewDate(new Date());
  };

  // Open modal for a specific day
  const handleDayClick = (dateStr: string) => {
    setEditingHoliday(null);
    setDate(dateStr);
    setTitle('');
    setDescription('');
    setBranchId('');
    setIsOpen(true);
  };

  const handleOpenEdit = (h: HolidayResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingHoliday(h);
    setDate(h.date);
    setTitle(h.title);
    setDescription(h.description || '');
    setBranchId(h.branchId || '');
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !title.trim()) {
      toast.error('Date and title are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        date,
        title: title.trim(),
        description: description.trim() || undefined,
        branchId: branchId || undefined,
      };

      if (editingHoliday) {
        await holidaysApi.update(editingHoliday.id, payload);
        toast.success('Holiday updated successfully!');
      } else {
        await holidaysApi.create(payload);
        toast.success('Holiday added to academic calendar!');
      }

      setIsOpen(false);
      setEditingHoliday(null);
      setDate('');
      setTitle('');
      setDescription('');
      setBranchId('');
      fetchHolidays();
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to save holiday');
      } else {
        toast.error('Operation failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await holidaysApi.delete(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      toast.success('Holiday removed from calendar');
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to delete holiday');
      } else {
        toast.error('Delete failed');
      }
    }
  };

  // Upcoming holidays
  const upcomingHolidays = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return holidays.filter((h) => h.date >= today).slice(0, 3);
  }, [holidays]);

  // Current month count
  const currentMonthCount = useMemo(() => {
    const year = viewDate.getFullYear();
    const mm = String(viewDate.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${mm}`;
    return holidays.filter((h) => h.date.startsWith(prefix)).length;
  }, [holidays, viewDate]);

  return (
    <div className={styles.container}>
      {/* ── Top Header & Actions ─────────────────────────────────── */}
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Academic Calendar & Holidays</h2>
          <p className={styles.subtitle}>
            Official institutional calendar, national holidays, vacation breaks, and non-instructional days
          </p>
        </div>

        <div className={styles.actionsGroup}>
          {/* View Toggle */}
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'calendar' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays size={15} />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('list')}
            >
              <ListFilter size={15} />
              <span>List Table</span>
            </button>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setEditingHoliday(null);
              setDate(new Date().toISOString().split('T')[0]);
              setTitle('');
              setDescription('');
              setBranchId('');
              setIsOpen(true);
            }}
            icon={<Plus size={16} />}
          >
            Add Holiday
          </Button>
        </div>
      </div>

      {/* ── Stats Summary Bar ───────────────────────────────────── */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: '#e0e7ff', color: '#4338ca' }}>
            <CalendarDays size={22} />
          </div>
          <div>
            <div className={styles.summaryValue}>{holidays.length}</div>
            <div className={styles.summaryLabel}>Total Holidays Configured</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: '#fef3c7', color: '#b45309' }}>
            <CalendarIcon size={22} />
          </div>
          <div>
            <div className={styles.summaryValue}>{currentMonthCount}</div>
            <div className={styles.summaryLabel}>
              Holidays in {MONTH_NAMES[viewDate.getMonth()]}
            </div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: '#dcfce7', color: '#15803d' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div className={styles.summaryValue}>
              {upcomingHolidays.length > 0 ? upcomingHolidays[0].title : 'None'}
            </div>
            <div className={styles.summaryLabel}>
              {upcomingHolidays.length > 0
                ? `Next: ${upcomingHolidays[0].date}`
                : 'No upcoming holidays'}
            </div>
          </div>
        </div>
      </div>

      {/* ── CALENDAR VIEW ───────────────────────────────────────── */}
      {viewMode === 'calendar' && (
        <div className={styles.calendarCard}>
          {/* Calendar Navigation */}
          <div className={styles.calendarNav}>
            <div className={styles.monthTitle}>
              <CalendarIcon size={20} style={{ color: 'var(--brand-accent, #4f46e5)' }} />
              <span>
                {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
            </div>

            <div className={styles.navControls}>
              <button
                type="button"
                className={styles.todayBtn}
                onClick={handleToday}
                title="Jump to Current Month"
              >
                Today
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={handlePrevMonth}
                aria-label="Previous Month"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={handleNextMonth}
                aria-label="Next Month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Weekday Header */}
          <div className={styles.weekdayHeader}>
            {WEEKDAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* 7-Column Days Grid */}
          {loading ? (
            <div style={{ padding: 40 }}>
              <Skeleton variant="table-row" rows={5} columns={7} />
            </div>
          ) : (
            <div className={styles.daysGrid}>
              {calendarDays.map((d) => {
                const dayHolidays = holidaysByDate.get(d.dateStr) || [];
                return (
                  <div
                    key={d.dateStr}
                    className={`${styles.dayCell} ${
                      !d.isCurrentMonth ? styles.dayCellOtherMonth : ''
                    } ${d.isToday ? styles.dayCellToday : ''}`}
                    onClick={() => handleDayClick(d.dateStr)}
                    title="Click to schedule holiday on this day"
                  >
                    <div className={styles.dayHeader}>
                      <span
                        className={`${styles.dayNumber} ${
                          d.isToday ? styles.dayNumberToday : ''
                        }`}
                      >
                        {d.dayNumber}
                      </span>
                    </div>

                    {/* Holiday Badges for this day */}
                    {dayHolidays.map((h) => (
                      <div
                        key={h.id}
                        className={styles.holidayBadge}
                        onClick={(e) => handleOpenEdit(h, e)}
                        title={`${h.title}${h.description ? ` — ${h.description}` : ''}`}
                      >
                        <div>{h.title}</div>
                        <span className={styles.branchTag}>
                          {h.branchId
                            ? branchNameMap.get(h.branchId) || 'Branch'
                            : 'All Branches'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── LIST TABLE VIEW ─────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Filter Bar */}
          <div className={styles.filterBar}>
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

          {/* Table */}
          <div className={styles.tableWrapper}>
            {loading ? (
              <div style={{ padding: 'var(--space-6)' }}>
                <Skeleton variant="table-row" rows={5} columns={4} />
              </div>
            ) : holidays.length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={44} />}
                message="No holidays configured in this date range"
                description="Use 'Add Holiday' to schedule vacations, breaks, and observances."
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 140 }}>Date</th>
                      <th>Holiday Title & Description</th>
                      <th>Scope / Branch</th>
                      <th style={{ width: 100 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map((h) => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600, color: '#1e293b' }}>{h.date}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{h.title}</div>
                          {h.description && (
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                              {h.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                            <Building size={14} style={{ color: '#94a3b8' }} />
                            <span>
                              {h.branchId
                                ? `Branch: ${branchNameMap.get(h.branchId) || h.branchId}`
                                : 'All Branches (School-wide)'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEdit(h, e)}
                              style={{
                                border: '1px solid #cbd5e1',
                                background: '#fff',
                                borderRadius: 4,
                                padding: '4px 6px',
                                cursor: 'pointer',
                              }}
                              title="Edit Holiday"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(h.id, e)}
                              style={{
                                border: '1px solid #cbd5e1',
                                background: '#fff',
                                borderRadius: 4,
                                padding: '4px 6px',
                                cursor: 'pointer',
                              }}
                              title="Delete Holiday"
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
        </div>
      )}

      {/* ── CREATE / EDIT HOLIDAY MODAL ───────────────────────── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 500,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {editingHoliday ? 'Edit Academic Holiday' : 'Add Academic Holiday'}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                  Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                  Holiday Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Independence Day, Winter Break"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Brief notes about the observance or affected classes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                  Applicable Branch
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                >
                  <option value="">All Branches (School-wide Holiday)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Leave as All Branches to apply across the entire institution.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={isSubmitting}>
                  {editingHoliday ? 'Save Changes' : 'Schedule Holiday'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
