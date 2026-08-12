import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { HelpCenter } from '@/components/help/HelpCenter';

export const metadata: Metadata = { title: 'Help & Support | NexCRM' };

export default function HelpPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Help Center & Support" />
      <main className="flex-1 p-6 overflow-auto">
        <HelpCenter />
      </main>
    </div>
  );
}
