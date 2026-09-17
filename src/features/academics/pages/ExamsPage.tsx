/* ============================================================
   ExamsPage — Exams & Grading Module
   Backend Status: PENDING BACKEND API
   ============================================================ */

import { GraduationCap } from 'lucide-react';
import { EmptyState } from '../../../components/feedback/EmptyState';

export function ExamsPage() {
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            margin: '0 0 var(--space-1) 0',
          }}
        >
          Exams & Grading
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Manage examinations, assessments, grade books, and report cards
        </p>
      </div>

      <div
        style={{
          background: 'var(--color-bg-card, #ffffff)',
          border: '1px solid var(--color-border-primary, #e2e8f0)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-10) var(--space-6)',
        }}
      >
        <EmptyState
          icon={<GraduationCap size={48} />}
          message="Examinations API Pending Backend Implementation"
          description="Spring Boot endpoints for exam scheduling, grade configuration, and report card generation are currently in development by the backend team. This module will connect directly once the OpenAPI routes are published."
        />
      </div>
    </div>
  );
}
