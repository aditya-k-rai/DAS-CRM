import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { NoticeBoardWeb } from '@/components/noticeboard/NoticeBoardWeb';
import { Megaphone, Filter, Download } from 'lucide-react';

export const metadata: Metadata = { title: 'The Notice Board | DAS CRM' };

export default function NoticeBoardPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="The Notice Board & Admin Broadcasts" actions={
        <div className="flex gap-2">
          <button className="btn-secondary text-sm gap-1.5"><Filter size={14} /> Filter</button>
          <button className="btn-secondary text-sm gap-1.5"><Download size={14} /> Export Notices</button>
        </div>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <NoticeBoardWeb />
      </main>
    </div>
  );
}
