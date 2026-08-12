'use client';

import { Users, Target, TrendingUp, CheckSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const TEAM_LEADERS = [
  {
    id: '1',
    name: 'Amit Shah',
    email: 'amit.shah@company.com',
    since: 'Jan 2024',
    members: [
      { id: 'm1', name: 'Rajesh Kumar', role: 'SALES', leads: 24, tasks: 8, conversion: 34 },
      { id: 'm2', name: 'Priya Sharma', role: 'SALES', leads: 18, tasks: 5, conversion: 28 },
      { id: 'm3', name: 'Amit Patel', role: 'SALES', leads: 31, tasks: 12, conversion: 41 },
    ],
    stats: { totalLeads: 73, totalDeals: 28, revenue: '₹8.4L', conversion: 38 },
  },
  {
    id: '2',
    name: 'Neha Joshi',
    email: 'neha.joshi@company.com',
    since: 'Mar 2024',
    members: [
      { id: 'm4', name: 'Sunita Verma', role: 'SUPPORT', leads: 12, tasks: 15, conversion: 22 },
      { id: 'm5', name: 'Meera Kapoor', role: 'MARKETING', leads: 9, tasks: 7, conversion: 18 },
      { id: 'm6', name: 'Ravi Singh', role: 'FINANCE', leads: 5, tasks: 20, conversion: 15 },
      { id: 'm7', name: 'Deepak Joshi', role: 'SUPPORT', leads: 14, tasks: 11, conversion: 25 },
    ],
    stats: { totalLeads: 40, totalDeals: 14, revenue: '₹3.2L', conversion: 20 },
  },
];

const ROLE_COLORS: Record<string, string> = {
  SALES: 'rgb(99,102,241)', SUPPORT: 'rgb(59,130,246)', MARKETING: 'rgb(245,158,11)',
  FINANCE: 'rgb(34,197,94)', VIEWER: 'rgb(100,116,139)',
};

export function TeamLeaderManagement() {
  const [expanded, setExpanded] = useState<string[]>(['1']);

  const toggle = (id: string) =>
    setExpanded((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="flex flex-col gap-4">
      {/* Role hierarchy diagram */}
      <div className="crm-card p-4" style={{ background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)' }}>
        <h3 className="font-semibold mb-3 text-sm" style={{ color: 'rgb(129,140,248)' }}>Org Hierarchy</h3>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          {['OWNER', '→', 'ADMIN', '→', 'HR / TEAM LEADER', '→', 'SALES / SUPPORT / FINANCE'].map((item, i) => (
            <span key={i} style={{ color: item === '→' ? 'rgb(var(--muted-foreground))' : item.includes('/') ? 'rgb(var(--muted-foreground))' : 'white', fontWeight: item === '→' ? 400 : 600 }}>
              {item}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted mt-2">
          Admins manage Team Leaders. Team Leaders distribute leads to their team. HR manages employee data independently.
        </p>
      </div>

      {/* Team Leader cards */}
      {TEAM_LEADERS.map((tl) => {
        const isOpen = expanded.includes(tl.id);
        return (
          <div key={tl.id} className="crm-card overflow-hidden p-0">
            {/* TL header */}
            <div
              className="p-4 cursor-pointer flex items-center justify-between"
              onClick={() => toggle(tl.id)}
              style={{ background: 'rgb(var(--card))' }}
            >
              <div className="flex items-center gap-4">
                <div className="avatar w-10 h-10 text-sm" style={{ background: 'rgba(99,102,241,0.2)', color: 'rgb(129,140,248)' }}>
                  {tl.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{tl.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(99,102,241,0.15)', color: 'rgb(129,140,248)' }}>
                      TEAM LEADER
                    </span>
                  </div>
                  <p className="text-xs text-muted">{tl.email} · TL since {tl.since}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Stats */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: 'rgb(var(--brand-400))' }}>{tl.stats.totalLeads}</p>
                    <p className="text-xs text-muted">Leads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: 'rgb(34,197,94)' }}>{tl.stats.revenue}</p>
                    <p className="text-xs text-muted">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: 'rgb(245,158,11)' }}>{tl.stats.conversion}%</p>
                    <p className="text-xs text-muted">Conversion</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">{tl.members.length}</p>
                    <p className="text-xs text-muted">Members</p>
                  </div>
                </div>
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
            </div>

            {/* Team members */}
            {isOpen && (
              <div className="border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                <div className="p-3 flex items-center justify-between" style={{ background: 'rgb(var(--background))' }}>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">Team Members ({tl.members.length})</p>
                  <button className="btn-secondary text-xs px-3 py-1.5">+ Assign Member</button>
                </div>
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Leads</th>
                      <th>Tasks</th>
                      <th>Conversion</th>
                      <th>Performance</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tl.members.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar w-7 h-7 text-xs" style={{ background: `${ROLE_COLORS[m.role]}20`, color: ROLE_COLORS[m.role] }}>
                              {m.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <span className="text-sm font-medium">{m.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${ROLE_COLORS[m.role]}15`, color: ROLE_COLORS[m.role] }}>
                            {m.role}
                          </span>
                        </td>
                        <td><span className="text-sm font-medium">{m.leads}</span></td>
                        <td><span className="text-sm">{m.tasks}</span></td>
                        <td>
                          <span className="text-sm font-semibold" style={{ color: m.conversion > 35 ? 'rgb(34,197,94)' : m.conversion > 25 ? 'rgb(245,158,11)' : 'rgb(239,68,68)' }}>
                            {m.conversion}%
                          </span>
                        </td>
                        <td>
                          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border))' }}>
                            <div className="h-full rounded-full" style={{
                              width: `${m.conversion * 2}%`,
                              background: m.conversion > 35 ? '#22c55e' : m.conversion > 25 ? '#f59e0b' : '#ef4444',
                            }} />
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn-secondary text-xs px-2 py-1">Report</button>
                            <button className="btn-secondary text-xs px-2 py-1">Move</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
