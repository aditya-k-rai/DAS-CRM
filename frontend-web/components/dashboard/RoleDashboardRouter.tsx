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
  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();

  // Normalize role string and match against role dashboard implementations
  if (rawRole === 'SUPER_ADMIN' || rawRole === 'SYSTEM_ADMIN' || rawRole === 'SUPERADMIN') {
    return <SuperAdminDashboard />;
  }

  if (rawRole === 'ADMIN' || rawRole === 'TENANT_ADMIN' || rawRole === 'OWNER' || rawRole === 'COMPANY_ADMIN') {
    return <TenantAdminDashboard />;
  }

  if (rawRole === 'HR' || rawRole === 'HR_MANAGER' || rawRole === 'HUMAN_RESOURCES') {
    return <HRRoleDashboard />;
  }

  if (rawRole === 'MANAGER' || rawRole === 'DEPT_MANAGER' || rawRole === 'SALES_MANAGER') {
    return <ManagerRoleDashboard />;
  }

  if (rawRole === 'TEAM_LEADER' || rawRole === 'TL' || rawRole === 'LEAD') {
    return <TeamLeaderRoleDashboard />;
  }

  if (rawRole === 'SALES_EXEC' || rawRole === 'EMPLOYEE' || rawRole === 'STAFF' || rawRole === 'REP' || rawRole === 'EXECUTIVE' || rawRole === 'SALES_REP') {
    return <EmployeeRoleDashboard />;
  }

  // Fallback
  return <TenantAdminDashboard />;
}
