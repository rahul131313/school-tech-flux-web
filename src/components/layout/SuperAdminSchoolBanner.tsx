/* ============================================================
   SuperAdminSchoolBanner — Prompt for Super Admins without schoolId
   Ensures Platform Super Admins choose a school tenant before
   attempting to call tenant-scoped APIs.
   ============================================================ */

import { useState } from 'react';
import { Building2, ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useSchools } from '../../features/settings/hooks/useSchools';
import { authApi } from '../../api/endpoints/auth';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';

export function SuperAdminSchoolBanner() {
  const { user, selectSchool } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();

  const isSuperAdminWithoutSchool =
    user?.role === 'SUPER_ADMIN' && !user?.schoolId;

  const [chosenSchoolId, setChosenSchoolId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unconditionally call hooks to strictly adhere to React's Rules of Hooks
  const { data: schoolsData, isLoading } = useSchools(
    { size: 100 },
    { enabled: !!isSuperAdminWithoutSchool }
  );
  const schools = schoolsData?.content || [];

  // Only render banner if user is SUPER_ADMIN and does NOT have an active schoolId
  if (!isSuperAdminWithoutSchool) {
    return null;
  }

  const handleSelectSchool = async () => {
    if (!chosenSchoolId) return;

    try {
      setIsSubmitting(true);
      const tokenRes = await authApi.selectSchool({ schoolId: chosenSchoolId });
      selectSchool(chosenSchoolId, tokenRes.accessToken, tokenRes.refreshToken);

      await queryClient.invalidateQueries();

      const schoolName =
        schools.find((s) => s.id === chosenSchoolId)?.name || 'selected school';
      toast.success(`Tenant context switched to ${schoolName}`);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to select school';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#eff6ff',
        borderBottom: '1px solid #bfdbfe',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: '#dbeafe',
            color: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Building2 size={16} />
        </div>
        <div>
          <strong style={{ fontSize: 13, color: '#1e3a8a', display: 'block' }}>
            Platform Super Admin — No School Selected
          </strong>
          <span style={{ fontSize: 12, color: '#3b82f6' }}>
            Select an active school tenant below to access tenant resources (students, classes, and permissions).
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <select
          value={chosenSchoolId}
          onChange={(e) => setChosenSchoolId(e.target.value)}
          disabled={isLoading || isSubmitting}
          style={{
            height: 34,
            padding: '0 10px',
            borderRadius: 6,
            border: '1px solid #93c5fd',
            backgroundColor: '#ffffff',
            fontSize: 13,
            fontWeight: 500,
            outline: 'none',
            color: '#1e293b',
          }}
        >
          <option value="" disabled>
            {isLoading ? 'Loading schools...' : 'Choose a school tenant...'}
          </option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>

        <Button
          size="sm"
          disabled={!chosenSchoolId || isSubmitting}
          loading={isSubmitting}
          onClick={handleSelectSchool}
          icon={<ArrowRight size={13} />}
        >
          Activate Tenant
        </Button>
      </div>
    </div>
  );
}
