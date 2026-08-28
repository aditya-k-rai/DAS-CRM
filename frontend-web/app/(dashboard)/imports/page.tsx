import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { ImportWizard } from '@/components/imports/ImportWizard';
import { Upload } from 'lucide-react';

export const metadata: Metadata = { title: 'Import Data | DAS CRM' };

export default function ImportsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Import Data" actions={
        <span className="text-xs text-muted">CSV · Excel (.xlsx) · Google Sheets</span>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <ImportWizard />
      </main>
    </div>
  );
}
