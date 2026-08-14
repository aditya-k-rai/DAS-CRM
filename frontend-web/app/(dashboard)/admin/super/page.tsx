'use client';

import { Topbar } from '@/components/layout/Topbar';
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function SuperAdminPage() {
  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']} fallbackTitle="Super Admin Administrative Portal is restricted exclusively to authorized System Administrators.">
      <div className="flex-1 flex flex-col min-h-0">
        <Topbar title="Administrative Portal" actions={
          <span className="text-xs px-3 py-1 rounded-full font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            SUPER ADMIN OVERLORD
          </span>
        } />
        <main className="flex-1 p-6 overflow-auto">
          <SuperAdminDashboard />
        </main>
      </div>
    </RoleGuard>
  );
}
