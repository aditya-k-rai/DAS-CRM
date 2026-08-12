'use client';

import { useState } from 'react';
import { Target, TrendingUp, TrendingDown, Award, Plus, Edit2, Calendar } from 'lucide-react';

interface Goal {
  id: string;
  rep: string;
  initials: string;
  role: string;
  metric: string;
  target: number;
  achieved: number;
  unit: string;
  period: string;
  color: string;
}

const PERIOD_TABS = ['Monthly', 'Quarterly', 'Annual'];

const GOALS: Goal[] = [
  { id: '1', rep: 'John Doe',      initials: 'JD', role: 'Owner',       metric: 'Revenue',       target: 1000000, achieved: 840000, unit: '₹', period: 'Aug 2026', color: '#6366f1' },
  { id: '2', rep: 'Amit Shah',     initials: 'AS', role: 'Team Leader', metric: 'Leads Closed',  target: 30,      achieved: 21,     unit: '',  period: 'Aug 2026', color: '#22c55e' },
  { id: '3', rep: 'Rajesh Kumar',  initials: 'RK', role: 'Sales Exec',  metric: 'Revenue',       target: 500000,  achieved: 390000, unit: '₹', period: 'Aug 2026', color: '#f59e0b' },
  { id: '4', rep: 'Priya Sharma',  initials: 'PS', role: 'Sales Exec',  metric: 'Calls Made',    target: 100,     achieved: 73,     unit: '',  period: 'Aug 2026', color: '#8b5cf6' },
  { id: '5', rep: 'Amit Patel',    initials: 'AP', role: 'Sales Exec',  metric: 'Deals Closed',  target: 15,      achieved: 8,      unit: '',  period: 'Aug 2026', color: '#ec4899' },
  { id: '6', rep: 'Sunita Verma',  initials: 'SV', role: 'Sales Exec',  metric: 'Revenue',       target: 300000,  achieved: 310000, unit: '₹', period: 'Aug 2026', color: '#22c55e' },
];

const TEAM_METRICS = [
  { label: 'Revenue Target (Aug)', target: '₹25L', achieved: '₹18.4L', pct: 74 },
  { label: 'Total Deals Target',   target: '60',    achieved: '41',      pct: 68 },
  { label: 'Lead Conversion Goal', target: '40%',   achieved: '34%',     pct: 85 },
  { label: 'Calls Made Target',    target: '400',   achieved: '312',     pct: 78 },
];

export function SalesGoals() {
  const [period, setPeriod] = useState('Monthly');

  const fmtValue = (g: Goal, val: number) =>
    g.unit === '₹' ? `₹${(val / 100000).toFixed(1)}L` : String(val);

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Sales Goals & Targets</h2>
        <div className="flex gap-1">
          {PERIOD_TABS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={{
                background: period === p ? 'rgba(99,102,241,0.2)' : 'rgb(var(--muted))',
                color: period === p ? 'rgb(129,140,248)' : 'rgb(var(--muted-foreground))',
              }}>
              {p}
            </button>
          ))}
          <button className="btn-primary text-xs px-3 py-1.5 ml-2 flex items-center gap-1.5">
            <Plus size={12} /> Set Goal
          </button>
        </div>
      </div>

      {/* Team overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TEAM_METRICS.map(m => (
          <div key={m.label} className="crm-card">
            <p className="text-xs text-muted mb-1">{m.label}</p>
            <div className="flex items-end justify-between mb-2">
              <span className="text-lg font-extrabold">{m.achieved}</span>
              <span className="text-xs text-muted">/ {m.target}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: 'rgb(var(--border))' }}>
              <div className="h-full rounded-full transition-all" style={{
                width: `${m.pct}%`,
                background: m.pct >= 100 ? 'rgb(34,197,94)' : m.pct >= 70 ? 'rgb(99,102,241)' : 'rgb(245,158,11)',
              }} />
            </div>
            <p className="text-xs font-bold text-right" style={{ color: m.pct >= 100 ? 'rgb(34,197,94)' : m.pct >= 70 ? 'rgb(129,140,248)' : 'rgb(245,158,11)' }}>
              {m.pct}%
            </p>
          </div>
        ))}
      </div>

      {/* Individual Goals */}
      <div className="crm-card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <h3 className="font-semibold">Individual Rep Goals — {period} ({GOALS[0].period})</h3>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Calendar size={12} /> Aug 1 – Aug 31
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
          {GOALS.map((g, rank) => {
            const pct     = Math.min(100, Math.round((g.achieved / g.target) * 100));
            const overAch = g.achieved > g.target;
            const gap     = g.target - g.achieved;
            return (
              <div key={g.id} className="flex items-center gap-4 px-4 py-4">
                {/* Rank */}
                <span className="text-sm font-bold w-6 flex-shrink-0 text-muted">
                  {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
                </span>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs" style={{ background: `${g.color}20`, color: g.color }}>
                  {g.initials}
                </div>

                {/* Name + Role */}
                <div className="w-32 flex-shrink-0">
                  <p className="text-sm font-semibold">{g.rep}</p>
                  <p className="text-xs text-muted">{g.role}</p>
                </div>

                {/* Metric */}
                <div className="w-28 flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${g.color}15`, color: g.color }}>
                    {g.metric}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold">{fmtValue(g, g.achieved)} <span className="text-muted">/ {fmtValue(g, g.target)}</span></span>
                    <span className="font-bold" style={{ color: overAch ? 'rgb(34,197,94)' : pct >= 70 ? g.color : 'rgb(245,158,11)' }}>
                      {overAch ? '✓ Exceeded!' : `${pct}%`}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border))' }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${pct}%`,
                      background: overAch ? 'rgb(34,197,94)' : g.color,
                    }} />
                  </div>
                  {!overAch && (
                    <p className="text-xs text-muted mt-1">
                      {fmtValue(g, gap)} to go · {Math.ceil((new Date(2026, 7, 31).getTime() - Date.now()) / 86400000)} days left
                    </p>
                  )}
                </div>

                {/* Trend */}
                <div className="flex-shrink-0">
                  {pct >= 85 || overAch
                    ? <TrendingUp size={18} style={{ color: '#22c55e' }} />
                    : <TrendingDown size={18} style={{ color: '#ef4444' }} />}
                </div>

                {/* Edit */}
                <button className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center flex-shrink-0">
                  <Edit2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
