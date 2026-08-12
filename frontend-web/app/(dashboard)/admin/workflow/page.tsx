import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { AdminWorkflowBuilder } from '@/components/admin/AdminWorkflowBuilder';

export const metadata: Metadata = { title: 'Workflow Setup | Admin' };

export default function AdminWorkflowPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Workflow Setup" actions={
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: 'rgba(99,102,241,0.15)', color: 'rgb(129,140,248)' }}>
            Admin Only
          </span>
          <button className="btn-primary text-sm">Save Changes</button>
        </div>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <AdminWorkflowBuilder />
      </main>
    </div>
  );
}
