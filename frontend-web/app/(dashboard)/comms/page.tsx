import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { WhatsAppThread } from '@/components/comms/WhatsAppThread';
import { MessageSquare } from 'lucide-react';

export const metadata: Metadata = { title: 'Communications | NexCRM' };

export default function CommsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Communications" actions={
        <span className="text-xs text-muted flex items-center gap-1.5">
          <MessageSquare size={13} /> WhatsApp · Email · SMS threads per lead
        </span>
      } />
      <main className="flex-1 px-6 pb-6 overflow-hidden">
        <WhatsAppThread />
      </main>
    </div>
  );
}
