import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { EmployeeLeadWorkspace } from '@/components/leads/EmployeeLeadWorkspace';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Lead Employee Workspace | DAS CRM' };

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.id || '1';
  let id = rawId;
  try {
    id = decodeURIComponent(rawId);
  } catch (_) {
    id = rawId;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Employee Lead Communications & Operations Hub"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/leads" className="btn-secondary text-sm gap-1.5">
              <ArrowLeft size={14} /> Leads
            </Link>
            <button className="btn-primary text-sm gap-1.5">
              <CheckCircle2 size={14} /> Mark Won
            </button>
          </div>
        }
      />

      <main className="flex-1 p-6 overflow-auto">
        <ErrorBoundary fallbackTitle="Lead Workspace Error">
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center p-12 text-slate-400 text-sm">
                Loading Lead Workspace...
              </div>
            }
          >
            <EmployeeLeadWorkspace leadId={id} />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
