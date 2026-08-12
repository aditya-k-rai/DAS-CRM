'use client';

import { Target, CheckSquare, DollarSign, User, FileText, Phone } from 'lucide-react';

const activities = [
  { id: 1, type: 'lead', icon: Target, color: 'rgb(99 102 241)', text: 'New lead: Rajesh Kumar', sub: 'from Website', time: '2m ago' },
  { id: 2, type: 'call', icon: Phone, color: 'rgb(34 197 94)', text: 'Call with Priya Sharma', sub: '12 min duration', time: '1h ago' },
  { id: 3, type: 'deal', icon: DollarSign, color: 'rgb(245 158 11)', text: 'Deal moved to Proposal', sub: 'TechCorp — ₹5.2L', time: '2h ago' },
  { id: 4, type: 'task', icon: CheckSquare, color: 'rgb(59 130 246)', text: 'Task completed', sub: 'Follow up with Amit', time: '3h ago' },
  { id: 5, type: 'note', icon: FileText, color: 'rgb(139 92 246)', text: 'Note added', sub: 'Sunita RE — Property specs', time: '5h ago' },
  { id: 6, type: 'user', icon: User, color: 'rgb(236 72 153)', text: 'New member invited', sub: 'Anil Singh joined', time: '1d ago' },
];

export function ActivityFeed() {
  return (
    <div className="crm-card flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Activity Feed</h3>
        <button className="text-xs" style={{ color: 'rgb(var(--brand-400))' }}>See all</button>
      </div>

      <div className="flex flex-col relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-0 bottom-4 w-px" style={{ background: 'rgb(var(--border))' }} />

        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 pb-4 relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
              style={{ background: `${activity.color}15`, color: activity.color, border: `1px solid ${activity.color}30` }}
            >
              <activity.icon size={15} />
            </div>
            <div className="flex-1 pt-1.5">
              <p className="text-sm font-medium leading-tight">{activity.text}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--muted-foreground))' }}>{activity.sub}</p>
            </div>
            <span className="text-xs pt-1.5 flex-shrink-0" style={{ color: 'rgb(var(--muted-foreground))' }}>{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
