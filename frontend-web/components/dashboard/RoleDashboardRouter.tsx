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

  switch (currentUser.role) {
    case 'SUPER_ADMIN':
      return <SuperAdminDashboard />;
    case 'ADMIN':
      return <TenantAdminDashboard />;
    case 'HR':
      return <HRRoleDashboard />;
    case 'MANAGER':
      return <ManagerRoleDashboard />;
    case 'TEAM_LEADER':
      return <TeamLeaderRoleDashboard />;
    case 'SALES_EXEC':
      return <EmployeeRoleDashboard />;
    default:
      return <TenantAdminDashboard />;
  }
}
