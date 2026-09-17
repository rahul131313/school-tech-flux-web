/* ============================================================
   SchoolModulesPage — Module Enable/Disable Configuration
   Connected to Spring Boot:
   - GET /api/v1/school-modules
   - PUT /api/v1/school-modules
   ============================================================ */

import { useState, useEffect } from 'react';
import { schoolConfigurationApi } from '../../../api/endpoints/schoolConfiguration';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { isApiError, type ApiError } from '../../../api/types';

interface ModuleConfigItem {
  key: string;
  name: string;
  description: string;
  category: string;
}

const AVAILABLE_MODULES: ModuleConfigItem[] = [
  {
    key: 'STUDENT_ATTENDANCE',
    name: 'Student Attendance Register',
    description: 'Daily roll-call, period tracking, Excel import/export, and revision history',
    category: 'Academics',
  },
  {
    key: 'STAFF_ATTENDANCE',
    name: 'Staff & Faculty Attendance',
    description: 'Employee check-in, check-out, biometric logging, and admin bulk register',
    category: 'Human Resources',
  },
  {
    key: 'HOMEWORK_ASSIGNMENTS',
    name: 'Homework & Coursework',
    description: 'Teacher assignments, student submissions, file attachments, and grading',
    category: 'Academics',
  },
  {
    key: 'EXAMS_TESTS_MARKS',
    name: 'Examinations & Marks Entry',
    description: 'Exam scheduling, subject thresholds, marks entry, locking, and publishing',
    category: 'Academics',
  },
  {
    key: 'REPORT_CARDS',
    name: 'Report Cards & Performance',
    description: 'Automated term grade calculation, GPA computation, and PDF report cards',
    category: 'Academics',
  },
  {
    key: 'REMARKS_BEHAVIOR_NOTES',
    name: 'Behavior Notes & Commendations',
    description: 'Teacher commendations, disciplinary logs, coordinator reviews, and export',
    category: 'Student Welfare',
  },
  {
    key: 'HOLIDAYS_ACADEMIC_CALENDAR',
    name: 'Holidays & Academic Calendar',
    description: 'School term dates, national holidays, vacations, and institutional calendar',
    category: 'Administration',
  },
  {
    key: 'NOTICES_REMINDERS_ANNOUNCEMENTS',
    name: 'Notices & Broadcasts',
    description: 'Official school bulletins, scheduled announcements, and targeted notices',
    category: 'Communication',
  },
  {
    key: 'FEE_STRUCTURE_COLLECTION',
    name: 'Fee Structure & Invoicing',
    description: 'Tuition fees, student invoices, offline receipts, concessions, and waivers',
    category: 'Finance',
  },
  {
    key: 'STAFF_PAYROLL_SALARY_SLIPS',
    name: 'Payroll Components & Salary',
    description: 'Earnings, deductions, fixed and percentage salary structure rules',
    category: 'Finance',
  },
];

export function SchoolModulesPage() {
  const toast = useToast();
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const list = await schoolConfigurationApi.getModules();
      const map: Record<string, boolean> = {};
      list.forEach((m) => {
        map[m.module] = m.enabled;
      });
      setModuleStates(map);
    } catch {
      toast.error('Failed to load school modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleToggle = async (moduleKey: string, currentStatus: boolean) => {
    setTogglingKey(moduleKey);
    const newStatus = !currentStatus;
    try {
      await schoolConfigurationApi.updateModule({
        module: moduleKey,
        enabled: newStatus,
      });

      setModuleStates((prev) => ({
        ...prev,
        [moduleKey]: newStatus,
      }));

      toast.success(
        `Module ${newStatus ? 'activated' : 'deactivated'} successfully!`
      );
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to update module');
      } else {
        toast.error('Failed to toggle module');
      }
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
          }}
        >
          School Feature Modules
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Enable or disable specific institutional capabilities for your school tenant
        </p>
      </div>

      <div
        style={{
          background: 'var(--color-bg-card, #ffffff)',
          border: '1px solid var(--color-border-primary, #e2e8f0)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        {loading ? (
          <div style={{ padding: 'var(--space-6)' }}>
            <Skeleton variant="table-row" rows={6} columns={3} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {AVAILABLE_MODULES.map((mod, index) => {
              const isEnabled = moduleStates[mod.key] ?? true;
              const isToggling = togglingKey === mod.key;

              return (
                <div
                  key={mod.key}
                  style={{
                    padding: 'var(--space-4) var(--space-6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom:
                      index === AVAILABLE_MODULES.length - 1
                        ? 'none'
                        : '1px solid var(--color-border-primary, #e2e8f0)',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                        {mod.name}
                      </strong>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 9999,
                          background: 'rgba(99, 102, 241, 0.08)',
                          color: 'var(--color-primary-700)',
                          fontWeight: 600,
                        }}
                      >
                        {mod.category}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {mod.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(mod.key, isEnabled)}
                    disabled={isToggling}
                    style={{
                      width: 48,
                      height: 26,
                      borderRadius: 9999,
                      background: isEnabled ? '#10b981' : '#cbd5e1',
                      border: 'none',
                      cursor: isToggling ? 'not-allowed' : 'pointer',
                      position: 'relative',
                      transition: 'background-color 0.2s',
                    }}
                    aria-label={`Toggle ${mod.name}`}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 3,
                        left: isEnabled ? 25 : 3,
                        width: 20,
                        height: 20,
                        borderRadius: 9999,
                        background: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
