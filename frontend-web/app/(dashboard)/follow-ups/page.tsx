import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import FollowUpsModule from '@/components/follow-ups/FollowUpsModule';

export const metadata: Metadata = {
  title: 'Follow-ups — Sales CRM',
  description: 'Manage your sales follow-ups, schedule calls, track outcomes, and never miss a follow-up.',
};

export default function FollowUpsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Follow-ups" />
      <main className="flex-1 overflow-auto">
        <Suspense fallback={<div className="p-8 text-center text-muted">Loading follow-ups...</div>}>
          <FollowUpsModule />
        </Suspense>
      </main>
    </div>
  );
}
