import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { DatabaseHubView } from '@/components/database/DatabaseHubView';

export const metadata: Metadata = {
  title: 'Database & Storage | DAS CRM',
  description: 'Enterprise Lead Import History, Multi-Tenant Storage Vault & Folder Email Export'
};

export default function DatabasePage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Database Management"
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-foreground/80">Active Engine:</span>
            <span>PostgreSQL &amp; Google Drive Multi-Tenant Vault</span>
          </div>
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        <DatabaseHubView initialTab="imports" />
      </main>
    </div>
  );
}
