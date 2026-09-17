/* ============================================================
   ProfilePage — User Account & Profile Settings
   Path: /settings/profile
   ============================================================ */

import { useState } from 'react';
import { User, Phone, Shield, Building2, Key, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { Button } from '../../../components/ui/Button';
import { PageHeader } from '../components/PageHeader';
import { SetPasswordDialog } from '../../../components/dialog/SetPasswordDialog';

export function ProfilePage() {
  const { user } = useAuthStore();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const displayName = user
    ? user.name || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.phoneNumber || 'User')
    : 'User';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="My Profile"
        description="View and manage your account identity, role credentials, and security settings."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {/* User Identity Card */}
        <div
          style={{
            background: 'var(--color-bg-card, #ffffff)',
            border: '1px solid var(--color-border-primary, #e2e8f0)',
            borderRadius: 'var(--radius-xl, 12px)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'var(--brand-accent-light, #e0e7ff)',
                color: 'var(--brand-accent, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              <User size={28} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {displayName}
              </h3>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 6,
                  backgroundColor: 'var(--brand-accent-light, #e0e7ff)',
                  color: 'var(--brand-accent, #4f46e5)',
                }}
              >
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--color-border-primary, #e2e8f0)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
              <Phone size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ color: 'var(--color-text-secondary)' }}>Phone Number:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{user?.phoneNumber || '—'}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
              <Shield size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ color: 'var(--color-text-secondary)' }}>User ID:</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-primary)' }}>
                {user?.id || '—'}
              </span>
            </div>

            {user?.schoolId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <Building2 size={16} style={{ color: 'var(--color-text-secondary)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>School Tenant:</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-primary)' }}>
                  {user.schoolId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Security & Password Card */}
        <div
          style={{
            background: 'var(--color-bg-card, #ffffff)',
            border: '1px solid var(--color-border-primary, #e2e8f0)',
            borderRadius: 'var(--radius-xl, 12px)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Key size={20} style={{ color: 'var(--brand-accent, #4f46e5)' }} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Security Credentials</h3>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Manage password credentials for your account. You can log in either via passwordless OTP or your configured password.
            </p>

            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#15803d' }}>
              <CheckCircle2 size={16} />
              <span>Passwordless Phone OTP Authentication Active</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border-primary, #e2e8f0)', paddingTop: 16 }}>
            <Button
              icon={<Key size={15} />}
              onClick={() => setIsPasswordModalOpen(true)}
            >
              Set / Change Password
            </Button>
          </div>
        </div>
      </div>

      <SetPasswordDialog
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
