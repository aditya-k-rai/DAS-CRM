import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { EmailTemplates } from '@/components/emails/EmailTemplates';
import { Plus } from 'lucide-react';

export const metadata: Metadata = { title: 'Email Templates | NexCRM' };

export default function EmailTemplatesPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Email Templates" actions={
        <button className="btn-primary text-sm gap-1.5"><Plus size={14} /> New Template</button>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <EmailTemplates />
      </main>
    </div>
  );
}
