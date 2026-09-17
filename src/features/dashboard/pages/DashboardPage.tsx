/* ============================================================
   DashboardPage — SchoolConnect Executive Overview
   Aggregates live structure stats from backend queries
   ============================================================ */

import { Link } from 'react-router';
import {
  School,
  Building2,
  Users,
  Layers,
  CalendarCheck,
  Clock,
  Settings,
  Shield,
  ArrowRight,
  Server,
  Compass,
} from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { useThemeStore } from '../../../stores/themeStore';
import { useSchools } from '../../settings/hooks/useSchools';
import { useBranches } from '../../settings/hooks/useBranches';
import { useSections } from '../../settings/hooks/useSections';
import { useStudentEnrollments } from '../../settings/hooks/useStudentEnrollments';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { schoolName } = useThemeStore();

  const { data: schoolsData, isLoading: schoolsLoading } = useSchools({ size: 10 });
  const { data: branchesData, isLoading: branchesLoading } = useBranches({ size: 10 });
  const { data: sectionsData, isLoading: sectionsLoading } = useSections({ size: 10 });
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useStudentEnrollments({ size: 10 });

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={styles.container}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeText}>
          <h1 className={styles.welcomeTitle}>
            Welcome to {schoolName}
          </h1>
          <p className={styles.welcomeSubtitle}>
            {currentDateStr} • Multi-Tenant School Administration Platform
          </p>
          <div className={styles.bannerBadges}>
            <div className={styles.roleBadge}>
              <Shield size={13} />
              <span>ROLE: {user?.role?.replace('_', ' ') || 'SUPER ADMIN'}</span>
            </div>
            <div className={styles.statusBadge}>
              <span className={styles.statusDot} />
              <span>SYSTEM OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        {/* Metric 1: Total Schools */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div
              className={styles.metricIconWrapper}
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}
            >
              <School size={22} />
            </div>
            <span className={styles.metricPill}>Tenant Root</span>
          </div>
          <div className={styles.metricBody}>
            <div className={styles.metricValue}>
              {schoolsLoading ? (
                <span className={styles.metricSkeleton} />
              ) : (
                schoolsData?.totalElements ?? 0
              )}
            </div>
            <div className={styles.metricLabel}>Total Schools</div>
          </div>
        </div>

        {/* Metric 2: Branches */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div
              className={styles.metricIconWrapper}
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
            >
              <Building2 size={22} />
            </div>
            <span className={styles.metricPill}>Campuses</span>
          </div>
          <div className={styles.metricBody}>
            <div className={styles.metricValue}>
              {branchesLoading ? (
                <span className={styles.metricSkeleton} />
              ) : (
                branchesData?.totalElements ?? 0
              )}
            </div>
            <div className={styles.metricLabel}>Campuses & Branches</div>
          </div>
        </div>

        {/* Metric 3: Active Sections */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div
              className={styles.metricIconWrapper}
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}
            >
              <Layers size={22} />
            </div>
            <span className={styles.metricPill}>Classes</span>
          </div>
          <div className={styles.metricBody}>
            <div className={styles.metricValue}>
              {sectionsLoading ? (
                <span className={styles.metricSkeleton} />
              ) : (
                sectionsData?.totalElements ?? 0
              )}
            </div>
            <div className={styles.metricLabel}>Active Sections</div>
          </div>
        </div>

        {/* Metric 4: Enrolled Students */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div
              className={styles.metricIconWrapper}
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}
            >
              <Users size={22} />
            </div>
            <span className={styles.metricPill}>Directory</span>
          </div>
          <div className={styles.metricBody}>
            <div className={styles.metricValue}>
              {enrollmentsLoading ? (
                <span className={styles.metricSkeleton} />
              ) : (
                enrollmentsData?.totalElements ?? 0
              )}
            </div>
            <div className={styles.metricLabel}>Enrolled Students</div>
          </div>
        </div>
      </div>

      {/* Daily Operations Launchpad */}
      <div>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Daily Operations Launchpad</h2>
          <p className={styles.sectionSubtitle}>Direct access to high-frequency administrative workflows</p>
        </div>
        <div className={styles.actionsGrid}>
          <Link to="/attendance" className={styles.actionCard}>
            <div className={styles.actionCardTop}>
              <div
                className={styles.actionIconBox}
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}
              >
                <CalendarCheck size={20} />
              </div>
              <ArrowRight size={16} className={styles.actionArrow} />
            </div>
            <h3 className={styles.actionTitle}>Take Attendance</h3>
            <p className={styles.actionDesc}>
              Mark daily student roll-call attendance across class sections with real-time summary statistics.
            </p>
          </Link>

          <Link to="/timetable" className={styles.actionCard}>
            <div className={styles.actionCardTop}>
              <div
                className={styles.actionIconBox}
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}
              >
                <Clock size={20} />
              </div>
              <ArrowRight size={16} className={styles.actionArrow} />
            </div>
            <h3 className={styles.actionTitle}>Weekly Timetable</h3>
            <p className={styles.actionDesc}>
              View interactive weekly class schedules, subjects, teacher assignments, and period timings.
            </p>
          </Link>

          <Link to="/students" className={styles.actionCard}>
            <div className={styles.actionCardTop}>
              <div
                className={styles.actionIconBox}
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}
              >
                <Users size={20} />
              </div>
              <ArrowRight size={16} className={styles.actionArrow} />
            </div>
            <h3 className={styles.actionTitle}>Student Directory</h3>
            <p className={styles.actionDesc}>
              Browse student enrollments, roll numbers, search identities, and academic section assignments.
            </p>
          </Link>

          <Link to="/settings/schools" className={styles.actionCard}>
            <div className={styles.actionCardTop}>
              <div
                className={styles.actionIconBox}
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}
              >
                <Settings size={20} />
              </div>
              <ArrowRight size={16} className={styles.actionArrow} />
            </div>
            <h3 className={styles.actionTitle}>School Settings</h3>
            <p className={styles.actionDesc}>
              Manage school onboarding, branches, academic years, standards, sections, and subjects.
            </p>
          </Link>
        </div>
      </div>

      {/* Two-Column Bottom Dashboard Section */}
      <div className={styles.dashboardBottomGrid}>
        {/* Onboarding Roadmap */}
        <div className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <h3 className={styles.infoCardTitle}>
              <Compass size={18} style={{ color: '#4f46e5' }} />
              <span>School Setup Roadmap</span>
            </h3>
            <span className={styles.metricPill}>Admin Checklist</span>
          </div>
          <ol className={styles.roadmapList}>
            <li className={styles.roadmapItem}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>Register School Profile</div>
                <p className={styles.stepDesc}>Define institutional name, code, contact details, and board affiliation.</p>
                <Link to="/settings/schools" className={styles.stepLink}>
                  Configure Schools <ArrowRight size={12} />
                </Link>
              </div>
            </li>
            <li className={styles.roadmapItem}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>Add Campus Branches & Academic Years</div>
                <p className={styles.stepDesc}>Create branch facilities and establish the active academic calendar.</p>
                <Link to="/settings/branches" className={styles.stepLink}>
                  Manage Branches <ArrowRight size={12} />
                </Link>
              </div>
            </li>
            <li className={styles.roadmapItem}>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>Define Standards & Class Sections</div>
                <p className={styles.stepDesc}>Create grade levels (e.g. Standard 1–12) and class section divisions.</p>
                <Link to="/settings/standards" className={styles.stepLink}>
                  Setup Standards <ArrowRight size={12} />
                </Link>
              </div>
            </li>
            <li className={styles.roadmapItem}>
              <span className={styles.stepNumber}>4</span>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>Enroll Students & Build Timetables</div>
                <p className={styles.stepDesc}>Register student admissions and allocate weekly teaching periods.</p>
                <Link to="/settings/enrollments" className={styles.stepLink}>
                  Student Enrollments <ArrowRight size={12} />
                </Link>
              </div>
            </li>
          </ol>
        </div>

        {/* System & Architecture Info */}
        <div className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <h3 className={styles.infoCardTitle}>
              <Server size={18} style={{ color: '#10b981' }} />
              <span>Platform Specifications</span>
            </h3>
            <span className={styles.metricPill}>Live Environment</span>
          </div>
          <div className={styles.systemSpecList}>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Backend REST API</span>
              <span className={styles.specValue}>Spring Boot 3.x (Proxied)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Authentication Model</span>
              <span className={styles.specValue}>Phone + OTP & Web Password</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Authorization Context</span>
              <span className={styles.specValue}>Role-Based Access Control (RBAC)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Multi-Tenancy</span>
              <span className={styles.specValue}>Active (Header / Path Tenant Scoping)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Frontend Architecture</span>
              <span className={styles.specValue}>React 19 + TanStack Query + Vite</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Active User Role</span>
              <span className={styles.specValue}>{user?.role || 'SUPER_ADMIN'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
