'use client';

import { useState } from 'react';
import { Bell, Target, CheckSquare, DollarSign, Users, X, Check } from 'lucide-react';

const NOTIFICATIONS = [
  { id: '1', type: 'lead',    icon: Target,      color: 'rgb(99,102,241)',  title: 'New lead assigned to you',       body: 'Rajesh Kumar from TechCorp has been assigned.',    time: '2m ago',  read: false },
  { id: '2', type: 'deal',    icon: DollarSign,  color: 'rgb(245,158,11)',  title: 'Deal moved to Negotiation',       body: 'Grand Palace Hotel deal is now in Negotiation.',    time: '1h ago',  read: false },
  { id: '3', type: 'task',    icon: CheckSquare, color: 'rgb(59,130,246)',  title: 'Task overdue: Follow up with Amit', body: 'This task was due 2 hours ago.',                  time: '2h ago',  read: false },
  { id: '4', type: 'team',    icon: Users,       color: 'rgb(236,72,153)',  title: 'New team member joined',          body: 'Kavita Nair has joined as Sales Executive under your team.', time: '5h ago', read: true },
  { id: '5', type: 'lead',    icon: Target,      color: 'rgb(34,197,94)',   title: 'Lead score updated to 91',        body: 'Sunita RE lead crossed the 80-point threshold.',   time: '1d ago',  read: true },
];

export function NotificationCenter() {
  const [open, setOpen]            = useState(false);
  const [notifications, setNotes]  = useState(NOTIFICATIONS);

  const unread = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotes(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all"
        style={{ background: open ? 'rgba(99,102,241,0.15)' : 'rgb(var(--muted))' }}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ background: 'rgb(99,102,241)' }}>
            {unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-11 w-96 z-50 animate-scale-in rounded-2xl shadow-2xl border overflow-hidden"
            style={{ background: 'rgb(var(--card))', borderColor: 'rgb(var(--border))', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unread > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(99,102,241,0.2)', color: 'rgb(129,140,248)' }}>
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium" style={{ color: 'rgb(129,140,248)' }}>
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="btn-ghost w-6 h-6 p-0 rounded flex items-center justify-center">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 border-b cursor-pointer transition-all hover:bg-muted/20"
                  style={{
                    borderColor: 'rgb(var(--border))',
                    background: !n.read ? 'rgba(99,102,241,0.04)' : 'transparent',
                  }}
                  onClick={() => markRead(n.id)}
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${n.color}15`, color: n.color }}>
                    <n.icon size={16} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-white' : 'text-muted'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted-foreground))' }}>{n.time}</p>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: n.color }} />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 text-center border-t" style={{ borderColor: 'rgb(var(--border))' }}>
              <button className="text-xs font-medium" style={{ color: 'rgb(129,140,248)' }}>
                View all notifications →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
