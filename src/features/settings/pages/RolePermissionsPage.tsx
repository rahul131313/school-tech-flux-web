/* ============================================================
   RolePermissionsPage — Custom Roles & Action Grants (V9)
   - Roles CRUD: GET/POST/PUT/DELETE /api/v1/roles
   - Action Grants: POST /api/v1/role-permissions/{roleId}/{module}
   - Action Revoke: DELETE /api/v1/role-permissions/{permissionId}
   - Effective Grants: GET /api/v1/role-permissions/effective
   ============================================================ */

import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Eye,
  Sliders,
  CheckCircle2,
  Users,
  AlertCircle,
  KeyRound,
  UserCheck,
  ShieldAlert,
  UserPlus,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormModal } from '../../../components/ui/FormModal';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useConfirm } from '../../../components/dialog/ConfirmDialog';
import { useAuthStore } from '../../../stores/authStore';
import { useToast } from '../../../components/ui/Toast';
import { usersApi } from '../../../api/endpoints/users';
import { useBranches } from '../hooks/useBranches';
import { useCreateUser } from '../hooks/useUsers';
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeactivateRole,
} from '../hooks/useRoles';
import {
  useRolePermissions,
  useEffectivePermissions,
  useGrantAction,
  useRevokeAction,
} from '../hooks/useRolePermissions';
import {
  isApiError,
  type RoleResponse,
  type PermissionAction,
  type AccountStatus,
  type AuthPolicy,
  type UserCreateRequest,
  type UserResponse,
} from '../../../api/types';

const MODULES = [
  {
    id: 'USER_ROLE_MANAGEMENT',
    name: 'User & Role Management',
    description: 'User provisioning, custom roles, and security permissions',
  },
  {
    id: 'STUDENT_ADMISSION_PROFILE',
    name: 'Student Admission & Profiles',
    description: 'Student directory, admission workflow, and demographic records',
  },
  {
    id: 'STUDENT_ATTENDANCE',
    name: 'Student Attendance',
    description: 'Daily and period-wise student attendance rosters',
  },
  {
    id: 'CLASS_SECTION_TIMETABLE',
    name: 'Class Timetable & Sections',
    description: 'Timetable slots, classes, standards, and sections',
  },
  {
    id: 'EXAMS_TESTS_MARKS',
    name: 'Exams, Tests & Marks',
    description: 'Assessment schedules, test papers, and mark entries',
  },
  {
    id: 'FEE_STRUCTURE_COLLECTION',
    name: 'Fee Structure & Collection',
    description: 'Fee structures, billing, receipts, and payment tracking',
  },
  {
    id: 'NOTICES_REMINDERS_ANNOUNCEMENTS',
    name: 'Notices & Announcements',
    description: 'School circulars, broadcast notices, and reminders',
  },
  {
    id: 'STAFF_EMPLOYEE_PROFILE',
    name: 'Staff & Employee Directory',
    description: 'Teacher profiles, employment records, and assignments',
  },
  {
    id: 'STAFF_ATTENDANCE',
    name: 'Staff Attendance',
    description: 'Daily faculty and staff biometric/manual attendance rosters',
  },
  {
    id: 'AUDIT_LOGS_SYSTEM_SETTINGS',
    name: 'System Settings & Audit Logs',
    description: 'School structure, security policies, and audit logs',
  },
];

// All 10 independent actions per backend V9
const PERMISSION_ACTIONS: PermissionAction[] = [
  'CREATE',
  'VIEW',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'PUBLISH',
  'LOCK',
  'CONFIGURE',
  'SELF_VIEW',
  'SELF_UPDATE',
];

interface RoleFormData {
  code: string;
  name: string;
  description: string;
}

const EMPTY_ROLE_FORM: RoleFormData = {
  code: '',
  name: '',
  description: '',
};

export function RolePermissionsPage() {
  const { user } = useAuthStore();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'roles' | 'grants' | 'effective' | 'user-security'>('roles');

  useEffect(() => {
    if (tabParam === 'users' || tabParam === 'user-security') {
      setActiveTab('user-security');
    }
  }, [tabParam]);

  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  // User Role & Security Assignment State
  const [targetUserId, setTargetUserId] = useState('');
  const [assignRoleId, setAssignRoleId] = useState('');
  const [statusUserId, setStatusUserId] = useState('');
  const [targetStatus, setTargetStatus] = useState<AccountStatus>('ACTIVE');
  const [revokeUserId, setRevokeUserId] = useState('');
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  // Tenant User Creation State
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<UserResponse[]>([]);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  const [userForm, setUserForm] = useState<{
    phoneNumber: string;
    email: string;
    roleId: string;
    status: AccountStatus;
    authPolicy: AuthPolicy;
    attachStaffProfile: boolean;
    branchId: string;
    designation: string;
    joiningDate: string;
    staffStatus: AccountStatus;
  }>({
    phoneNumber: '',
    email: '',
    roleId: '',
    status: 'ACTIVE',
    authPolicy: 'EITHER',
    attachStaffProfile: false,
    branchId: '',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    staffStatus: 'ACTIVE',
  });

  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});
  const [createUserTraceId, setCreateUserTraceId] = useState<string | null>(null);

  // Role Form Modal State
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormData>(EMPTY_ROLE_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Queries
  const { data: roles = [], isLoading: loadingRoles } = useRoles();
  const { data: branchesData } = useBranches({ size: 100 });
  const branches = branchesData?.content || [];
  const { data: overrides = [] } = useRolePermissions();
  const { data: effectiveGrants = [], isLoading: loadingEffective } =
    useEffectivePermissions();

  // Mutations
  const createUserMutation = useCreateUser();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deactivateRoleMutation = useDeactivateRole();
  const grantActionMutation = useGrantAction();
  const revokeActionMutation = useRevokeAction();
  const { confirm } = useConfirm();

  // Permission Guard Check: USER_ROLE_MANAGEMENT / CONFIGURE
  const canManageRoles = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') return true;
    if (Array.isArray(effectiveGrants)) {
      return effectiveGrants.some(
        (g) =>
          g.moduleKey === 'USER_ROLE_MANAGEMENT' &&
          (g.action === 'CONFIGURE' || g.action === 'UPDATE' || g.action === 'CREATE')
      );
    }
    return true; // default open for testing/admin
  }, [user, effectiveGrants]);

  // Set default selected role
  useMemo(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0];
  }, [roles, selectedRoleId]);

  // Map of overrides: `roleId:moduleKey:action` -> permissionId
  const grantsMap = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(overrides)) {
      overrides.forEach((item) => {
        const key = `${item.roleId}:${item.moduleKey}:${item.action}`;
        map.set(key, item.id);
      });
    }
    return map;
  }, [overrides]);

  const handleOpenCreateRole = () => {
    setEditingRoleId(null);
    setRoleForm(EMPTY_ROLE_FORM);
    setFormErrors({});
    setRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: RoleResponse) => {
    setEditingRoleId(role.id);
    setRoleForm({
      code: role.code,
      name: role.name,
      description: role.description || '',
    });
    setFormErrors({});
    setRoleModalOpen(true);
  };

  const handleDeactivateRole = async (role: RoleResponse) => {
    const confirmed = await confirm({
      title: 'Deactivate Custom Role',
      message: `Are you sure you want to deactivate the role "${role.name}" (${role.code})? Users with this role will lose its permissions.`,
      confirmLabel: 'Deactivate',
      variant: 'danger',
    });

    if (confirmed) {
      deactivateRoleMutation.mutate(role.id);
    }
  };

  const handleRoleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!roleForm.code.trim()) {
      errors.code = 'Role code is required';
    } else if (!/^[A-Z][A-Z0-9_]{2,79}$/.test(roleForm.code.trim())) {
      errors.code =
        'Code must start with uppercase letter, only A-Z, 0-9, _, 3-80 chars (e.g. LAB_STAFF)';
    }

    if (!roleForm.name.trim()) {
      errors.name = 'Role name is required';
    } else if (roleForm.name.trim().length > 120) {
      errors.name = 'Name cannot exceed 120 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      code: roleForm.code.trim().toUpperCase(),
      name: roleForm.name.trim(),
      description: roleForm.description.trim() || undefined,
    };

    if (editingRoleId) {
      updateRoleMutation.mutate(
        { id: editingRoleId, data: payload },
        { onSuccess: () => setRoleModalOpen(false) }
      );
    } else {
      createRoleMutation.mutate(payload, {
        onSuccess: () => setRoleModalOpen(false),
      });
    }
  };

  const handleToggleAction = (module: string, action: PermissionAction) => {
    if (!selectedRole) return;
    const grantKey = `${selectedRole.id}:${module}:${action}`;
    const existingGrantId = grantsMap.get(grantKey);

    if (existingGrantId) {
      // Revoke action
      revokeActionMutation.mutate(existingGrantId);
    } else {
      // Grant action
      grantActionMutation.mutate({
        roleId: selectedRole.id,
        module,
        action,
      });
    }
  };

  const handleAssignRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim() || !assignRoleId) {
      toast.error('Enter User UUID and select role');
      return;
    }
    setIsAssigningRole(true);
    try {
      await usersApi.assignRole(targetUserId.trim(), assignRoleId);
      toast.success('Role assigned to user successfully!');
      setTargetUserId('');
    } catch {
      toast.error('Failed to assign role to user');
    } finally {
      setIsAssigningRole(false);
    }
  };

  const handleUpdateUserStatus = async (e: FormEvent) => {
    e.preventDefault();
    if (!statusUserId.trim()) {
      toast.error('Enter User UUID');
      return;
    }
    setIsUpdatingStatus(true);
    try {
      await usersApi.updateStatus(statusUserId.trim(), targetStatus);
      toast.success(`User status updated to ${targetStatus}!`);
      setStatusUserId('');
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRevokeSessions = async (e: FormEvent) => {
    e.preventDefault();
    if (!revokeUserId.trim()) {
      toast.error('Enter User UUID');
      return;
    }
    setIsRevokingSessions(true);
    try {
      await usersApi.revokeSessions(revokeUserId.trim());
      toast.success('All active refresh sessions revoked for user!');
      setRevokeUserId('');
    } catch {
      toast.error('Failed to revoke sessions');
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const handleOpenCreateUser = () => {
    setUserFormErrors({});
    setCreateUserTraceId(null);
    setUserForm({
      phoneNumber: '',
      email: '',
      roleId: roles.length > 0 ? roles[0].id : '',
      status: 'ACTIVE',
      authPolicy: 'EITHER',
      attachStaffProfile: false,
      branchId: branches.length > 0 ? branches[0].id : '',
      designation: '',
      joiningDate: new Date().toISOString().split('T')[0],
      staffStatus: 'ACTIVE',
    });
    setCreateUserModalOpen(true);
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setUserFormErrors({});
    setCreateUserTraceId(null);

    const errors: Record<string, string> = {};
    const phonePattern = /^\+[1-9]\d{7,14}$/;
    if (!userForm.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!phonePattern.test(userForm.phoneNumber.trim())) {
      errors.phoneNumber = 'Phone number must be valid E.164 format (e.g. +919999999999)';
    }

    if (!userForm.roleId) {
      errors.roleId = 'Role selection is required';
    }

    if (userForm.attachStaffProfile) {
      if (!userForm.branchId) {
        errors.branchId = 'Branch is required for staff profile';
      }
      if (!userForm.designation.trim()) {
        errors.designation = 'Designation is required for staff profile';
      }
      if (!userForm.joiningDate) {
        errors.joiningDate = 'Joining date is required for staff profile';
      }
    }

    if (Object.keys(errors).length > 0) {
      setUserFormErrors(errors);
      return;
    }

    const payload: UserCreateRequest = {
      phoneNumber: userForm.phoneNumber.trim(),
      email: userForm.email.trim() || undefined,
      roleId: userForm.roleId,
      status: userForm.status,
      authPolicy: userForm.authPolicy,
      staffProfile: userForm.attachStaffProfile
        ? {
            branchId: userForm.branchId,
            designation: userForm.designation.trim(),
            joiningDate: userForm.joiningDate,
            status: userForm.staffStatus,
          }
        : undefined,
    };

    try {
      const newUser = await createUserMutation.mutateAsync(payload);
      setCreatedUsers((prev) => [newUser, ...prev]);
      setTargetUserId(newUser.id);
      setStatusUserId(newUser.id);
      setRevokeUserId(newUser.id);
      setCreateUserModalOpen(false);
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.traceId) setCreateUserTraceId(err.traceId);
        if (err.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(err.fieldErrors)) {
            mapped[k] = v;
          }
          setUserFormErrors(mapped);
        }
      }
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedUserId(id);
    setTimeout(() => setCopiedUserId(null), 2000);
    toast.success('User UUID copied to clipboard');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Roles & Action Grants Administration"
        description="Manage system and custom roles, grant granular module permissions, assign roles to users, and inspect effective authorization policies."
        action={
          canManageRoles ? (
            activeTab === 'user-security' ? (
              <Button icon={<UserPlus size={16} />} onClick={handleOpenCreateUser}>
                Create Tenant User
              </Button>
            ) : (
              <Button icon={<Plus size={16} />} onClick={handleOpenCreateRole}>
                Create Custom Role
              </Button>
            )
          ) : undefined
        }
      />

      {!canManageRoles && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: 8,
            color: '#92400e',
            fontSize: 14,
          }}
        >
          <AlertCircle size={18} />
          <span>
            You have read-only access to roles. Modifying custom roles or action grants requires{' '}
            <strong>USER_ROLE_MANAGEMENT / CONFIGURE</strong> grant.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          borderBottom: '1px solid var(--color-border-primary, #e2e8f0)',
          paddingBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('roles')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 'var(--radius-lg, 8px)',
            border: 'none',
            background:
              activeTab === 'roles'
                ? 'var(--brand-accent-light, #e0e7ff)'
                : 'transparent',
            color:
              activeTab === 'roles'
                ? 'var(--brand-accent, #4f46e5)'
                : 'var(--color-text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Users size={16} />
          <span>Roles Directory ({roles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('grants')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 'var(--radius-lg, 8px)',
            border: 'none',
            background:
              activeTab === 'grants'
                ? 'var(--brand-accent-light, #e0e7ff)'
                : 'transparent',
            color:
              activeTab === 'grants'
                ? 'var(--brand-accent, #4f46e5)'
                : 'var(--color-text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Sliders size={16} />
          <span>Action Grants Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('effective')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 'var(--radius-lg, 8px)',
            border: 'none',
            background:
              activeTab === 'effective'
                ? 'var(--brand-accent-light, #e0e7ff)'
                : 'transparent',
            color:
              activeTab === 'effective'
                ? 'var(--brand-accent, #4f46e5)'
                : 'var(--color-text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Eye size={16} />
          <span>My Effective Grants</span>
        </button>

        <button
          onClick={() => setActiveTab('user-security')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 'var(--radius-lg, 8px)',
            border: 'none',
            background:
              activeTab === 'user-security'
                ? 'var(--brand-accent-light, #e0e7ff)'
                : 'transparent',
            color:
              activeTab === 'user-security'
                ? 'var(--brand-accent, #4f46e5)'
                : 'var(--color-text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <UserPlus size={16} />
          <span>User Provisioning & Security</span>
        </button>
      </div>

      {/* ── TAB 1: Roles Directory ────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div
          style={{
            background: 'var(--color-bg-card, #ffffff)',
            border: '1px solid var(--color-border-primary, #e2e8f0)',
            borderRadius: 'var(--radius-xl, 12px)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-primary, #e2e8f0)' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>System & Custom Roles</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Built-in platform roles and tenant-created custom roles.
            </p>
          </div>

          {loadingRoles ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading roles...
            </div>
          ) : roles.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No roles found.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-secondary, #f8fafc)', borderBottom: '1px solid var(--color-border-primary, #e2e8f0)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Role Name</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Code</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    style={{
                      borderBottom: '1px solid var(--color-border-primary, #e2e8f0)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {role.name}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 12,
                          background: 'var(--color-surface-secondary, #f1f5f9)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        {role.code}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {role.system ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 12,
                            backgroundColor: '#e0e7ff',
                            color: '#4338ca',
                          }}
                        >
                          System Role
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 12,
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                          }}
                        >
                          Custom Role
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <StatusBadge label={role.status || 'ACTIVE'} />
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--color-text-secondary)', maxWidth: 280 }}>
                      {role.description || '—'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Sliders size={13} />}
                          onClick={() => {
                            setSelectedRoleId(role.id);
                            setActiveTab('grants');
                          }}
                          title="Configure Action Grants"
                        >
                          Grants
                        </Button>
                        {!role.system && canManageRoles && (
                          <>
                            <button
                              onClick={() => handleOpenEditRole(role)}
                              title="Edit Role"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: 6,
                                borderRadius: 6,
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeactivateRole(role)}
                              title="Deactivate Custom Role"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: 6,
                                borderRadius: 6,
                                color: '#dc2626',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 2: Action Grants Matrix ───────────────────────────── */}
      {activeTab === 'grants' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Role selector bar */}
          <div
            style={{
              background: 'var(--color-bg-card, #ffffff)',
              border: '1px solid var(--color-border-primary, #e2e8f0)',
              borderRadius: 'var(--radius-xl, 12px)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Configure Grants for Role:
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid var(--color-border-primary, #cbd5e1)',
                fontSize: 14,
                fontWeight: 600,
                background: 'var(--color-bg-primary, #fff)',
              }}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code}) {r.system ? '— System' : '— Custom'}
                </option>
              ))}
            </select>
            {selectedRole && (
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                {selectedRole.description || 'No description provided.'}
              </span>
            )}
          </div>

          {/* Action Grants Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 16,
            }}
          >
            {MODULES.map((mod) => (
              <div
                key={mod.id}
                style={{
                  background: 'var(--color-bg-card, #ffffff)',
                  border: '1px solid var(--color-border-primary, #e2e8f0)',
                  borderRadius: 'var(--radius-xl, 12px)',
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Shield size={16} style={{ color: 'var(--brand-accent, #4f46e5)' }} />
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{mod.name}</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {mod.description}
                  </p>
                </div>

                {/* 10 Independent Action Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PERMISSION_ACTIONS.map((action) => {
                    const grantKey = `${selectedRoleId}:${mod.id}:${action}`;
                    const isGranted = grantsMap.has(grantKey);

                    return (
                      <label
                        key={action}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 8px',
                          borderRadius: 6,
                          backgroundColor: isGranted ? '#e0e7ff' : '#f8fafc',
                          border: `1px solid ${isGranted ? '#6366f1' : '#e2e8f0'}`,
                          cursor: canManageRoles ? 'pointer' : 'not-allowed',
                          fontSize: 11,
                          fontWeight: isGranted ? 600 : 400,
                          color: isGranted ? '#3730a3' : '#334155',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isGranted}
                          disabled={!canManageRoles || grantActionMutation.isPending || revokeActionMutation.isPending}
                          onChange={() => handleToggleAction(mod.id, action)}
                          style={{ margin: 0, cursor: 'inherit' }}
                        />
                        <span>{action}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: My Effective Grants ────────────────────────────── */}
      {activeTab === 'effective' && (
        <div
          style={{
            background: 'var(--color-bg-card, #ffffff)',
            border: '1px solid var(--color-border-primary, #e2e8f0)',
            borderRadius: 'var(--radius-xl, 12px)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={20} style={{ color: 'var(--brand-accent, #4f46e5)' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                Effective Action Grants for Current Session
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Derived from GET /api/v1/role-permissions/effective (platform defaults + tenant overrides)
              </p>
            </div>
          </div>

          {loadingEffective ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading effective grants...</p>
          ) : effectiveGrants.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No specific effective grants returned. Default system role permissions apply.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 12,
              }}
            >
              {effectiveGrants.map((grant) => (
                <div
                  key={grant.id}
                  style={{
                    border: '1px solid var(--color-border-primary, #e2e8f0)',
                    borderRadius: 8,
                    padding: 12,
                    background: 'var(--color-surface-secondary, #f8fafc)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>
                    {grant.moduleKey.replace(/_/g, ' ')}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      background: '#dcfce7',
                      color: '#15803d',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={12} />
                    {grant.action}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: User Provisioning, Role Assignment & Security ───── */}
      {activeTab === 'user-security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Top Banner with Quick Action */}
          <div
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              borderRadius: 'var(--radius-xl, 12px)',
              padding: 'var(--space-6)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.18)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserPlus size={22} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Tenant User Provisioning</h3>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', maxWidth: 640 }}>
                Create school-scoped user accounts with verified phone numbers, assign system or custom roles, attach optional branch staff profiles, and govern live lifecycle security.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleOpenCreateUser}
              style={{ background: '#ffffff', color: '#4f46e5', fontWeight: 600, border: 'none' }}
              icon={<UserPlus size={16} />}
            >
              Create Tenant User
            </Button>
          </div>

          {/* Session Created Users List */}
          {createdUsers.length > 0 && (
            <div
              style={{
                background: 'var(--color-bg-card, #ffffff)',
                border: '1px solid var(--color-border-primary, #e2e8f0)',
                borderRadius: 'var(--radius-xl, 12px)',
                padding: 'var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} style={{ color: 'var(--color-primary-600, #4f46e5)' }} />
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                    Recently Created Users in This Session ({createdUsers.length})
                  </h4>
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary, #64748b)' }}>
                  Click an action to auto-fill UUID into security tools below
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {createdUsers.map((u) => {
                  const roleObj = roles.find((r) => r.id === u.roleId);
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>
                            {u.phoneNumber}
                          </span>
                          {u.email && (
                            <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>
                              ({u.email})
                            </span>
                          )}
                        </div>

                        <span
                          style={{
                            padding: '2px 8px',
                            background: '#e0e7ff',
                            color: '#3730a3',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {roleObj ? `${roleObj.name} (${roleObj.code})` : u.roleId}
                        </span>

                        <span
                          style={{
                            padding: '2px 8px',
                            background: u.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                            color: u.status === 'ACTIVE' ? '#15803d' : '#991b1b',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {u.status}
                        </span>

                        {u.staffProfileCreated && (
                          <span
                            style={{
                              padding: '2px 8px',
                              background: '#fef3c7',
                              color: '#92400e',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            Staff Profile Attached
                          </span>
                        )}

                        <button
                          onClick={() => handleCopyId(u.id)}
                          title="Copy User UUID"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: 11,
                            cursor: 'pointer',
                            color: '#475569',
                          }}
                        >
                          {copiedUserId === u.id ? <Check size={12} style={{ color: '#16a34a' }} /> : <Copy size={12} />}
                          <span>{u.id.substring(0, 8)}...</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setTargetUserId(u.id);
                            toast.info(`Populated UUID for role assignment`);
                          }}
                        >
                          Set Role
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setStatusUserId(u.id);
                            toast.info(`Populated UUID for status update`);
                          }}
                        >
                          Update Status
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setRevokeUserId(u.id);
                            toast.info(`Populated UUID for session revocation`);
                          }}
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3 Grid Security Management Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
            {/* Card 1: Role Assignment */}
            <div
              style={{
                background: 'var(--color-bg-card, #ffffff)',
                border: '1px solid var(--color-border-primary, #e2e8f0)',
                borderRadius: 'var(--radius-xl, 12px)',
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <KeyRound size={18} style={{ color: 'var(--color-primary-600)' }} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Assign User Role</h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Directly attach any system or custom role to a school user account
                </p>
              </div>

              <form onSubmit={handleAssignRole} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    User UUID / ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter User UUID"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Select Target Role
                  </label>
                  <select
                    value={assignRoleId}
                    onChange={(e) => setAssignRoleId(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                    required
                  >
                    <option value="">Choose Role...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code}) {r.system ? '[System]' : '[Custom]'}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isAssigningRole}
                  disabled={!targetUserId || !assignRoleId}
                >
                  Assign Role
                </Button>
              </form>
            </div>

            {/* Card 2: Status Management */}
            <div
              style={{
                background: 'var(--color-bg-card, #ffffff)',
                border: '1px solid var(--color-border-primary, #e2e8f0)',
                borderRadius: 'var(--radius-xl, 12px)',
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserCheck size={18} style={{ color: '#10b981' }} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Update Account Status</h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Set account lifecycle status to ACTIVE, INACTIVE, or SUSPENDED
                </p>
              </div>

              <form onSubmit={handleUpdateUserStatus} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    User UUID / ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter User UUID"
                    value={statusUserId}
                    onChange={(e) => setStatusUserId(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Status
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as AccountStatus)}
                    style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isUpdatingStatus}
                  disabled={!statusUserId}
                >
                  Update Status
                </Button>
              </form>
            </div>

            {/* Card 3: Revoke Sessions */}
            <div
              style={{
                background: 'var(--color-bg-card, #ffffff)',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-xl, 12px)',
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={18} style={{ color: '#ef4444' }} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#991b1b' }}>Revoke Sessions</h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7f1d1d' }}>
                  Immediately invalidate all active refresh tokens and sign out user on all devices
                </p>
              </div>

              <form onSubmit={handleRevokeSessions} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    User UUID / ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter User UUID"
                    value={revokeUserId}
                    onChange={(e) => setRevokeUserId(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  loading={isRevokingSessions}
                  disabled={!revokeUserId}
                >
                  Revoke All Sessions
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Tenant User Modal (POST /api/v1/users) ───────────── */}
      <FormModal
        open={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        onSubmit={handleCreateUser}
        title="Create Tenant User"
        submitLabel="Create User"
        loading={createUserMutation.isPending}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {createUserTraceId && (
            <div
              style={{
                padding: '8px 12px',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              Trace ID: <code>{createUserTraceId}</code>
            </div>
          )}

          <FormInput
            label="Phone Number"
            value={userForm.phoneNumber}
            onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })}
            error={userFormErrors.phoneNumber}
            placeholder="+919999999999"
            helperText="E.164 international format (+[1-9] followed by 7-14 digits)"
            required
          />

          <FormInput
            label="Email Address (Optional)"
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            error={userFormErrors.email}
            placeholder="teacher@example.com"
          />

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
              Assigned Role <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={userForm.roleId}
              onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                border: userFormErrors.roleId ? '1px solid #ef4444' : '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 14,
              }}
              required
            >
              <option value="">Select a Role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code}) {r.system ? '[System]' : '[Custom]'}
                </option>
              ))}
            </select>
            {userFormErrors.roleId && (
              <span style={{ display: 'block', fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                {userFormErrors.roleId}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                Account Status
              </label>
              <select
                value={userForm.status}
                onChange={(e) => setUserForm({ ...userForm, status: e.target.value as AccountStatus })}
                style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                Authentication Policy
              </label>
              <select
                value={userForm.authPolicy}
                onChange={(e) => setUserForm({ ...userForm, authPolicy: e.target.value as AuthPolicy })}
                style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
              >
                <option value="EITHER">EITHER (OTP or Password)</option>
                <option value="OTP_ONLY">OTP_ONLY</option>
                <option value="PASSWORD_ONLY">PASSWORD_ONLY</option>
              </select>
            </div>
          </div>

          {/* Staff Profile Toggle */}
          <div
            style={{
              marginTop: 4,
              padding: 12,
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              background: userForm.attachStaffProfile ? '#f8fafc' : '#ffffff',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={userForm.attachStaffProfile}
                onChange={(e) => setUserForm({ ...userForm, attachStaffProfile: e.target.checked })}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                Attach Staff Profile (Teachers, Administrators, Accountants, HR)
              </span>
            </label>

            {userForm.attachStaffProfile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Assigned Branch <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={userForm.branchId}
                    onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      border: userFormErrors.branchId ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                    required
                  >
                    <option value="">Select Branch...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                  {userFormErrors.branchId && (
                    <span style={{ display: 'block', fontSize: 11, color: '#ef4444', marginTop: 3 }}>
                      {userFormErrors.branchId}
                    </span>
                  )}
                </div>

                <FormInput
                  label="Designation"
                  value={userForm.designation}
                  onChange={(e) => setUserForm({ ...userForm, designation: e.target.value })}
                  error={userFormErrors.designation}
                  placeholder="e.g. Mathematics Teacher"
                  required
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FormInput
                    label="Joining Date"
                    type="date"
                    value={userForm.joiningDate}
                    onChange={(e) => setUserForm({ ...userForm, joiningDate: e.target.value })}
                    error={userFormErrors.joiningDate}
                    required
                  />

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Staff Status
                    </label>
                    <select
                      value={userForm.staffStatus}
                      onChange={(e) => setUserForm({ ...userForm, staffStatus: e.target.value as AccountStatus })}
                      style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: '#f1f5f9',
              fontSize: 12,
              color: '#475569',
              lineHeight: 1.5,
            }}
          >
            <strong>Note:</strong> Newly created users sign in with OTP. Password login works only after the user sets a password through the authenticated <code>/api/v1/auth/password/set</code> flow.
          </div>
        </div>
      </FormModal>

      {/* Create / Edit Custom Role Modal */}
      <FormModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        onSubmit={handleRoleSubmit}
        title={editingRoleId ? 'Edit Custom Role' : 'Create Custom Role'}
        submitLabel={editingRoleId ? 'Update Role' : 'Create Role'}
        loading={createRoleMutation.isPending || updateRoleMutation.isPending}
      >
        <FormInput
          label="Role Code"
          value={roleForm.code}
          onChange={(e) =>
            setRoleForm({ ...roleForm, code: e.target.value.toUpperCase() })
          }
          error={formErrors.code}
          placeholder="e.g. LAB_INSTRUCTOR"
          helperText="Uppercase letters, numbers, underscores (3-80 chars). Must start with letter."
          required
          disabled={Boolean(editingRoleId)}
        />
        <FormInput
          label="Role Name"
          value={roleForm.name}
          onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
          error={formErrors.name}
          placeholder="e.g. Laboratory Instructor"
          required
        />
        <FormInput
          label="Description"
          value={roleForm.description}
          onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
          error={formErrors.description}
          placeholder="Brief description of the responsibilities and access scope"
        />
      </FormModal>
    </div>
  );
}
