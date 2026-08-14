'use client';

import { Topbar } from '@/components/layout/Topbar';
import { TeamLeaderRoleDashboard } from '@/components/dashboard/TeamLeaderRoleDashboard';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function TeamLeaderDashboardPage() {
  return (
    <RoleGuard allowedRoles={['TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN']} fallbackTitle="Team Leader Unit Dashboard is restricted to designated team leaders.">
      <div className="flex-1 flex flex-col min-h-0">
        <Topbar title="Team Leader Unit Dashboard" />
        <main className="flex-1 p-6 overflow-auto">
          <TeamLeaderRoleDashboard />
        </main>
      </div>
    </RoleGuard>
  );
}
