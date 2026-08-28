import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { SalesGoals } from '@/components/goals/SalesGoals';

export const metadata: Metadata = { title: 'Sales Goals | DAS CRM' };

export default function GoalsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Sales Goals & Targets" />
      <main className="flex-1 p-6 overflow-auto">
        <SalesGoals />
      </main>
    </div>
  );
}
