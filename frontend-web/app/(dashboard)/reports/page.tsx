import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export const metadata: Metadata = { title: 'Reports & Analytics | NexCRM' };

export default function ReportsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Reports & Analytics" />
      <main className="flex-1 p-6 overflow-auto">
        <AnalyticsDashboard />
      </main>
    </div>
  );
}
