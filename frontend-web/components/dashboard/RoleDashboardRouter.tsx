'use client';

import { useAuth } from '@/context/AuthContext';
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

  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();

  // 1. Tenant / Company Admin Dashboard
  if (rawRole === 'ADMIN' || rawRole === 'TENANT_ADMIN' || rawRole === 'OWNER' || rawRole === 'COMPANY_ADMIN') {
    return <TenantAdminDashboard />;
  }

  // 2. HR & Payroll Dashboard
  if (rawRole === 'HR' || rawRole === 'HR_MANAGER' || rawRole === 'HUMAN_RESOURCES') {
    return <HRRoleDashboard />;
  }

  // 3. Department Manager Dashboard
  if (rawRole === 'MANAGER' || rawRole === 'DEPT_MANAGER' || rawRole === 'SALES_MANAGER') {
    return <ManagerRoleDashboard />;
  }

  // 4. Team Leader Dashboard
  if (rawRole === 'TEAM_LEADER' || rawRole === 'TL' || rawRole === 'LEAD') {
    return <TeamLeaderRoleDashboard />;
  }

  // 5. Sales Executive / Employee Dashboard
  if (rawRole === 'SALES_EXEC' || rawRole === 'EMPLOYEE' || rawRole === 'STAFF' || rawRole === 'REP' || rawRole === 'EXECUTIVE' || rawRole === 'SALES_REP' || rawRole === 'SALES') {
    return <EmployeeRoleDashboard />;
  }

  // Safe Fallback for any workspace user
  return <TenantAdminDashboard />;
}
