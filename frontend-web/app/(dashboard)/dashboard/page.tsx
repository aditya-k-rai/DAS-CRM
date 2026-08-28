import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { RoleDashboardRouter } from '@/components/dashboard/RoleDashboardRouter';

export const metadata: Metadata = { title: 'Dashboard | DAS CRM' };

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Dashboard" />
      <main className="flex-1 p-6 overflow-auto">
        <RoleDashboardRouter />
      </main>
    </div>
  );
}
