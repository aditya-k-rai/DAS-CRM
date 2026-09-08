import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { DatabaseHubView } from '@/components/database/DatabaseHubView';

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
        <DatabaseHubView initialTab="imports" />
      </main>
    </div>
  );
}

