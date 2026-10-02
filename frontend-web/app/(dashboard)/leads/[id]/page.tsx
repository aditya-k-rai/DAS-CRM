import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { EmployeeLeadWorkspace } from '@/components/leads/EmployeeLeadWorkspace';
import { ArrowLeft, CheckCircle2, Edit2 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Lead Employee Workspace | DAS CRM' };

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Employee Lead Communications & Operations Hub"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/leads" className="btn-secondary text-sm gap-1.5"><ArrowLeft size={14} /> Leads</Link>
            <button className="btn-primary text-sm gap-1.5"><CheckCircle2 size={14} /> Mark Won</button>
          </div>
        }
      />

      <main className="flex-1 p-6 overflow-auto">
        <EmployeeLeadWorkspace leadId={id} />
      </main>
    </div>
  );
}
