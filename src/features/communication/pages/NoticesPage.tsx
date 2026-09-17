/* ============================================================
   NoticesPage — Notices & Broadcast Communication Module
   Backend Status: PENDING BACKEND API
   ============================================================ */

import { Megaphone } from 'lucide-react';
import { EmptyState } from '../../../components/feedback/EmptyState';

export function NoticesPage() {
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
          School Notices & Bulletins
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Broadcast announcements, event bulletins, and circulars to parents, teachers, and students
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
          icon={<Megaphone size={48} />}
          message="Notices & Broadcasts API Pending Backend Implementation"
          description="Spring Boot communication services for notices, audience targeted broadcasts, and circular attachments are currently in development by the backend team. This screen will wire directly to the endpoint once available."
        />
      </div>
    </div>
  );
}
