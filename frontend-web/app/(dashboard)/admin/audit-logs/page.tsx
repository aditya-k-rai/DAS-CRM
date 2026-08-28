import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { AuditLogs } from '@/components/admin/AuditLogs';

export const metadata: Metadata = { title: 'Audit Logs | Admin | DAS CRM' };

export default function AuditLogsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Audit Logs" actions={
        <span className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(239,68,68,0.15)', color: 'rgb(239,68,68)' }}>
          Admin / Owner Only
        </span>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <AuditLogs />
      </main>
    </div>
  );
}
