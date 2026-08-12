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
              {[
                { time: '10:00 AM', title: 'Demo Call with TechCorp CTO', type: 'Call' },
                { time: '02:00 PM', title: 'Follow up with Rajesh Kumar', type: 'Task' },
                { time: '04:30 PM', title: 'Pipeline review with Team Leader', type: 'Meeting' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg flex items-start gap-3" style={{ background: 'rgb(var(--background))' }}>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.15)', color: 'rgb(129,140,248)' }}>
                    {item.time}
                  </span>
                  <div>
                    <p className="text-sm font-medium leading-tight">{item.title}</p>
                    <span className="text-xs text-muted mt-0.5 block">{item.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
