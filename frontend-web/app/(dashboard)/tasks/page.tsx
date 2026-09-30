import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { TasksHubView } from '@/components/tasks/TasksHubView';

export const metadata: Metadata = { title: 'Tasks, Follow-ups & Meetings Hub' };

export default function TasksPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Activities & Tasks" />
      <main className="flex-1 p-6 overflow-auto">
        <Suspense fallback={<div className="p-8 text-center text-muted">Loading activities...</div>}>
          <TasksHubView />
        </Suspense>
      </main>
    </div>
  );
}

