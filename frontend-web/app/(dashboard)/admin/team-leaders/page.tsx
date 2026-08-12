import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { TeamLeadersSetup } from '@/components/admin/TeamLeadersSetup';

export const metadata: Metadata = { title: 'Team Leaders & Hierarchy | Admin' };

export default function TeamLeadersPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Company Organizational Hierarchy" />
      <main className="flex-1 p-6 overflow-auto">
        <TeamLeadersSetup />
      </main>
    </div>
  );
}
