'use client';

import { CheckCircle2, Clock, CheckSquare } from 'lucide-react';
import Link from 'next/link';

interface TaskItem {
  id: number;
  title: string;
  due: string;
  lead: string;
  priority: 'high' | 'medium' | 'low';
  done: boolean;
}

const tasks: TaskItem[] = [];

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
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--muted-foreground))' }}>{tasks.length} tasks scheduled</p>
        </div>
        <button className="btn-secondary text-xs px-3 py-1.5">+ Add Task</button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/80 rounded-xl my-auto">
          <CheckSquare size={32} className="text-muted/60 mb-2" />
          <p className="font-bold text-sm text-foreground">All caught up!</p>
          <p className="text-xs text-muted-foreground mt-1">No pending tasks or follow-ups for your workspace.</p>
        </div>
      ) : (
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
      )}

      <Link href="/tasks" className="btn-ghost w-full mt-3 text-sm text-center block">View all tasks →</Link>
    </div>
  );
}
