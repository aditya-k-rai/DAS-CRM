'use client';

import { useState, useEffect } from 'react';
import { Bell, Target, CheckSquare, DollarSign, Users, X, Check, Zap } from 'lucide-react';

const NOTIFICATIONS: any[] = [];

export function NotificationCenter() {
  const [open, setOpen]            = useState(false);
  const [notifications, setNotes]  = useState(NOTIFICATIONS);

  const fetchLiveNotifications = async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('das_crm_token');
    if (!token) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiBase}/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          const mapped = data.items.map((item: any) => ({
            id: item.id,
            type: item.type === 'LEAD_ASSIGNED' ? 'lead' : 'system',
            icon: item.type === 'LEAD_ASSIGNED' ? Zap : Target,
            color: item.type === 'LEAD_ASSIGNED' ? 'rgb(99,102,241)' : 'rgb(59,130,246)',
            title: item.title || 'Notification',
            body: item.body || '',
            time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            read: !!item.isRead,
          }));
          setNotes(mapped);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 15000);
    window.addEventListener('focus', fetchLiveNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchLiveNotifications);
    };
  }, []);

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
              {notifications.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-muted/40 text-muted-foreground">
                    <Bell size={18} className="opacity-40" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">No notifications</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">You are all caught up with your updates.</p>
                </div>
              ) : (
                notifications.map((n: any) => (
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
                      <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-xs mt-1" style={{ color: 'rgb(var(--muted-foreground))' }}>{n.time}</p>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: n.color }} />
                    )}
                  </div>
                ))
              )}
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
