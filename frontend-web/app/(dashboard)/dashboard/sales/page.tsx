'use client';

import { Topbar } from '@/components/layout/Topbar';
import { EmployeeRoleDashboard } from '@/components/dashboard/EmployeeRoleDashboard';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function SalesExecDashboardPage() {
  return (
    <RoleGuard allowedRoles={['SALES_EXEC']} fallbackTitle="Sales Executive Workspace is restricted exclusively to assigned sales representatives.">
      <div className="flex-1 flex flex-col min-h-0">
        <Topbar title="Sales Executive Workspace" />
        <main className="flex-1 p-6 overflow-auto">
          <EmployeeRoleDashboard />
        </main>
      </div>
    </RoleGuard>
  );
}
