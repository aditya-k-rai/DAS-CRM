'use client';

import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const tasks = [
  { id: 1, title: 'Follow up with Rajesh Kumar', due: 'Today 2:00 PM', lead: 'Rajesh Kumar', priority: 'high', done: false },
  { id: 2, title: 'Send quotation to TechCorp', due: 'Today 5:00 PM', lead: 'TechCorp Ltd', priority: 'high', done: false },
  { id: 3, title: 'Schedule demo — Real Estate lead', due: 'Tomorrow', lead: 'Priya Sharma', priority: 'medium', done: false },
  { id: 4, title: 'Review proposal for Construkt', due: 'Tomorrow', lead: 'Construkt Inc', priority: 'low', done: true },
  { id: 5, title: 'Update pipeline — Q3 review', due: 'Aug 12', lead: 'Internal', priority: 'low', done: false },
];

const priorityColor: Record<string, string> = {
  high: 'rgb(239 68 68)',
  medium: 'rgb(245 158 11)',
  low: 'rgb(100 116 139)',
};

export function TasksWidget() {
  return (
    <div className="crm-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">My Tasks</h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--muted-foreground))' }}>5 tasks · 2 due today</p>
        </div>
        <button className="btn-secondary text-xs px-3 py-1.5">+ Add Task</button>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 p-3 rounded-lg transition-all"
            style={{ background: task.done ? 'rgb(var(--muted) / 0.3)' : 'rgb(var(--background))' }}
          >
            <button className="mt-0.5 flex-shrink-0">
              <CheckCircle2
                size={17}
                style={{ color: task.done ? 'rgb(34 197 94)' : 'rgb(var(--border))' }}
              />
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-tight ${task.done ? 'line-through text-muted' : ''}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  {task.lead}
                </span>
                <span className="text-xs">·</span>
                <div className="flex items-center gap-1">
                  <Clock size={11} style={{ color: 'rgb(var(--muted-foreground))' }} />
                  <span className="text-xs" style={{ color: task.due.includes('Today') ? 'rgb(239 68 68)' : 'rgb(var(--muted-foreground))' }}>
                    {task.due}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: priorityColor[task.priority] }} />
          </div>
        ))}
      </div>

      <button className="btn-ghost w-full mt-3 text-sm">View all tasks →</button>
    </div>
  );
}
