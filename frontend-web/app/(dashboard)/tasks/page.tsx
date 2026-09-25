import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { TasksWidget } from '@/components/dashboard/TasksWidget';
import { Plus, Calendar, CheckSquare, Clock, Filter } from 'lucide-react';

export const metadata: Metadata = { title: 'Tasks & Follow-ups' };

export default function TasksPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Tasks & Follow-ups" actions={
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-sm gap-1.5"><Filter size={14} /> Filter Tasks</button>
          <button className="btn-primary text-sm gap-1.5"><Plus size={14} /> Create Task</button>
        </div>
      } />
      <main className="flex-1 p-6 overflow-auto grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <TasksWidget />
        </div>
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="crm-card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-brand" style={{ color: 'rgb(129,140,248)' }} /> Today's Schedule
            </h3>
            <div className="space-y-2.5">
              {[].length === 0 ? (
                <div className="p-6 text-center text-muted border border-dashed border-border rounded-xl">
                  <Clock size={24} className="mx-auto mb-2 text-muted/60" />
                  <p className="font-semibold text-xs text-foreground">No events scheduled today</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Calls, demos and team reviews will appear here.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
