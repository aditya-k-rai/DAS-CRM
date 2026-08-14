'use client';

import { useAuth, normalizeRoleStr, inferRoleFromEmail } from '@/context/AuthContext';
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';
import { TenantAdminDashboard } from './TenantAdminDashboard';
import { HRRoleDashboard } from './HRRoleDashboard';
import { ManagerRoleDashboard } from './ManagerRoleDashboard';
import { TeamLeaderRoleDashboard } from './TeamLeaderRoleDashboard';
import { EmployeeRoleDashboard } from './EmployeeRoleDashboard';

export function RoleDashboardRouter() {
  const { currentUser } = useAuth();

  // Security Check: SuperAdminDashboard is ONLY rendered if user email is explicitly adtyamighty@gmail.com with SUPER_ADMIN role
  const isGenuineSuperAdmin =
    currentUser?.role === 'SUPER_ADMIN' &&
    currentUser?.email?.toLowerCase() === 'adtyamighty@gmail.com';

  if (isGenuineSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  const resolvedRole = normalizeRoleStr(currentUser?.role || inferRoleFromEmail(currentUser?.email));

  // 1. HR & Payroll Dashboard
  if (resolvedRole === 'HR') {
    return <HRRoleDashboard />;
  }

  // 2. Department Manager Dashboard
  if (resolvedRole === 'MANAGER') {
    return <ManagerRoleDashboard />;
  }

  // 3. Team Leader Dashboard
  if (resolvedRole === 'TEAM_LEADER') {
    return <TeamLeaderRoleDashboard />;
  }

  // 4. Sales Executive / Employee Dashboard
  if (resolvedRole === 'SALES_EXEC') {
    return <EmployeeRoleDashboard />;
  }

  // 5. Tenant / Company Admin Dashboard (Default)
  if (resolvedRole === 'ADMIN') {
    return <TenantAdminDashboard />;
  }

  // Safe Fallback for any workspace user
  return <TenantAdminDashboard />;
}
