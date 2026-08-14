'use client';

import { Topbar } from '@/components/layout/Topbar';
import { HRRoleDashboard } from '@/components/dashboard/HRRoleDashboard';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function HRDashboardPage() {
  return (
    <RoleGuard allowedRoles={['HR']} fallbackTitle="HR & Operations Dashboard is restricted exclusively to HR personnel.">
      <div className="flex-1 flex flex-col min-h-0">
        <Topbar title="HR & Operations Dashboard" />
        <main className="flex-1 p-6 overflow-auto">
          <HRRoleDashboard />
        </main>
      </div>
    </RoleGuard>
  );
}
