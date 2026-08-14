'use client';

import { Topbar } from '@/components/layout/Topbar';
import { ManagerRoleDashboard } from '@/components/dashboard/ManagerRoleDashboard';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function ManagerDashboardPage() {
  return (
    <RoleGuard allowedRoles={['MANAGER', 'ADMIN', 'SUPER_ADMIN']} fallbackTitle="Department Manager Dashboard is restricted to authorized managers.">
      <div className="flex-1 flex flex-col min-h-0">
        <Topbar title="Department Manager Dashboard" />
        <main className="flex-1 p-6 overflow-auto">
          <ManagerRoleDashboard />
        </main>
      </div>
    </RoleGuard>
  );
}
