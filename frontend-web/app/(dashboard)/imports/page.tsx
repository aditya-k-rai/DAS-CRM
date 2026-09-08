import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { DatabaseHubView } from '@/components/database/DatabaseHubView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Database & Imports | DAS CRM' };

export default function ImportsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Database &amp; Lead Imports"
        actions={
          <span className="text-xs text-muted-foreground">CSV · Excel (.xlsx) · Google Sheets · Drive Vault</span>
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading Lead Ingestion Hub...</div>}>
          <DatabaseHubView initialTab="imports" />
        </Suspense>
      </main>
    </div>
  );
}

