'use client';

import { Target, CheckSquare, DollarSign, User, FileText, Phone, Activity } from 'lucide-react';

interface ActivityItem {
  id: number;
  type: string;
  icon: any;
  color: string;
  text: string;
  sub: string;
  time: string;
}

const activities: ActivityItem[] = [];

export function ActivityFeed() {
  return (
    <div className="crm-card flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Activity Feed</h3>
        <button className="text-xs" style={{ color: 'rgb(var(--brand-400))' }}>See all</button>
      </div>

      {activities.length === 0 ? (
        <div className="p-8 text-center text-muted border border-dashed border-border/80 rounded-xl my-4">
          <Activity size={28} className="mx-auto mb-2 text-muted/60" />
          <p className="font-bold text-sm text-foreground">No recent activity</p>
          <p className="text-xs text-muted-foreground mt-1">Actions, calls, and updates will be logged here in real-time.</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
