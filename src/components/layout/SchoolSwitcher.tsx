/* ============================================================
   SchoolSwitcher — Tenant selector for Platform Super Admins
   Calls POST /api/v1/auth/select-school to obtain a tenant-scoped
   bearer token, enabling super admins to access tenant endpoints.
   ============================================================ */

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useSchools } from '../../features/settings/hooks/useSchools';
import { authApi } from '../../api/endpoints/auth';
import { useToast } from '../ui/Toast';
import styles from './SchoolSwitcher.module.css';

export function SchoolSwitcher() {
  const { user, selectSchool } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isSwitching, setIsSwitching] = useState(false);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Unconditionally call hooks to strictly adhere to React's Rules of Hooks
  const { data: schoolsData, isLoading } = useSchools(
    { size: 100 },
    { enabled: !!isSuperAdmin }
  );
  const schools = schoolsData?.content || [];

  // Only super admins can switch schools
  if (!isSuperAdmin) {
    return null;
  }

  const handleSchoolChange = async (newSchoolId: string) => {
    if (!newSchoolId || newSchoolId === user?.schoolId) return;

    try {
      setIsSwitching(true);
      const tokenRes = await authApi.selectSchool({ schoolId: newSchoolId });
      selectSchool(newSchoolId, tokenRes.accessToken, tokenRes.refreshToken);

      // Invalidate all active queries so tenant-scoped data reloads immediately
      await queryClient.invalidateQueries();

      const schoolName = schools.find((s) => s.id === newSchoolId)?.name || 'selected school';
      toast.success(`Active school switched to ${schoolName}`);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to switch school context';
      toast.error(errorMsg);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className={styles.switcherWrapper} title="Switch active tenant school">
      <Building2 size={16} className={styles.icon} />
      {isSwitching ? (
        <span className={styles.loadingSpinner} />
      ) : (
        <select
          className={styles.select}
          value={user?.schoolId || ''}
          onChange={(e) => handleSchoolChange(e.target.value)}
          disabled={isLoading || isSwitching}
          aria-label="Select School Context"
        >
          <option value="" disabled>
            {isLoading ? 'Loading schools...' : 'Select a School'}
          </option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
