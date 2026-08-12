import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { SalaryConfigBuilder } from '@/components/hr/SalaryConfigBuilder';

export const metadata: Metadata = { title: 'Salary Configuration | HR' };

export default function SalaryConfigPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Salary Configuration" actions={
        <div className="flex gap-2">
          <button className="btn-secondary text-sm">Load Template</button>
          <button className="btn-primary text-sm">+ New Config</button>
        </div>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <SalaryConfigBuilder />
      </main>
    </div>
  );
}
