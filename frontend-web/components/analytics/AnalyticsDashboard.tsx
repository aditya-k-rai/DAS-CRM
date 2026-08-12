'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Users, Target, DollarSign, BarChart3, PieChart, ArrowUpRight, Download, Calendar } from 'lucide-react';

// ─── Lightweight SVG chart primitives ────────────────────
function BarChartSVG({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end justify-between gap-2 h-32">
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-bold" style={{ color: colors[i % colors.length] }}>
            {d.value >= 100000 ? `₹${(d.value / 100000).toFixed(1)}L` : d.value}
          </span>
          <div className="w-full rounded-t-md transition-all" style={{
            height: `${(d.value / max) * 100}%`,
            background: `linear-gradient(to top, ${colors[i % colors.length]}aa, ${colors[i % colors.length]})`,
            minHeight: 4,
          }} />
          <span className="text-[10px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function SparkLine({ points, color }: { points: number[]; color: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 100, h = 40;
  const step = w / (points.length - 1);
  const pathD = points.map((p, i) => {
    const x = i * step;
    const y = h - ((p - min) / range) * h;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${pathD} L ${w} ${h} L 0 ${h} Z`} fill={`url(#sg-${color.replace('#','')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Data ────────────────────────────────────────────────
const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

const REVENUE_BY_MONTH = [
  { label: 'Mar', value: 310000 },
  { label: 'Apr', value: 480000 },
  { label: 'May', value: 420000 },
  { label: 'Jun', value: 590000 },
  { label: 'Jul', value: 670000 },
  { label: 'Aug', value: 840000 },
];

const LEADS_BY_MONTH = [310, 420, 380, 490, 520, 610];
const DEALS_BY_MONTH = [42, 58, 50, 65, 70, 84];
const CONV_BY_MONTH  = [31, 35, 28, 38, 42, 48];

const PIPELINE_STAGES = [
  { label: 'Prospecting', count: 42, value: 1260000, color: '#6366f1' },
  { label: 'Qualification',count: 28, value: 840000, color: '#f59e0b' },
  { label: 'Proposal',    count: 16, value: 960000, color: '#3b82f6' },
  { label: 'Negotiation', count: 9,  value: 720000, color: '#8b5cf6' },
  { label: 'Closed Won',  count: 21, value: 1260000, color: '#22c55e' },
];

const TEAM_PERFORMANCE = [
  { name: 'Rajesh Kumar', leads: 31, deals: 12, revenue: '₹5.2L', conversion: 41, trend: 'up' },
  { name: 'Priya Sharma', leads: 24, deals: 8,  revenue: '₹3.1L', conversion: 33, trend: 'up' },
  { name: 'Amit Patel',   leads: 18, deals: 5,  revenue: '₹2.4L', conversion: 28, trend: 'down' },
  { name: 'Sunita Verma', leads: 12, deals: 4,  revenue: '₹1.8L', conversion: 22, trend: 'up' },
];

const LEAD_SOURCES = [
  { source: 'Website Inquiry', pct: 34, color: '#6366f1' },
  { source: 'LinkedIn',         pct: 24, color: '#3b82f6' },
  { source: 'Referral',         pct: 19, color: '#22c55e' },
  { source: 'Cold Outreach',    pct: 14, color: '#f59e0b' },
  { source: 'Events',           pct: 9,  color: '#ec4899' },
];

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState('6M');

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Analytics Overview</h2>
        <div className="flex items-center gap-1.5">
          {['1M', '3M', '6M', 'YTD', '1Y'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={{
                background: period === p ? 'rgba(99,102,241,0.25)' : 'rgb(var(--muted))',
                color: period === p ? 'rgb(129,140,248)' : 'rgb(var(--muted-foreground))',
              }}>
              {p}
            </button>
          ))}
          <button className="btn-secondary text-xs px-3 py-1.5 ml-2 gap-1.5 flex items-center">
            <Download size={12} /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue (6M)', value: '₹33.1L', change: '+24.6%', up: true, spark: [310,480,420,590,670,840], color: '#22c55e' },
          { label: 'Total Leads',        value: '2,730',  change: '+18.2%', up: true, spark: LEADS_BY_MONTH,           color: '#6366f1' },
          { label: 'Win Rate',           value: '38.4%',  change: '+4.2%',  up: true, spark: CONV_BY_MONTH,            color: '#8b5cf6' },
          { label: 'Avg Deal Size',      value: '₹4.2L',  change: '-2.1%',  up: false, spark: [32,38,35,41,40,42],    color: '#f59e0b' },
        ].map(kpi => (
          <div key={kpi.label} className="crm-card">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted font-medium">{kpi.label}</p>
              <span className={`text-xs font-bold flex items-center gap-0.5 ${kpi.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {kpi.up ? <ArrowUpRight size={11} /> : <TrendingDown size={11} />}{kpi.change}
              </span>
            </div>
            <p className="text-2xl font-extrabold mb-2">{kpi.value}</p>
            <SparkLine points={kpi.spark} color={kpi.color} />
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Revenue Bar Chart */}
        <div className="col-span-12 lg:col-span-7 crm-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">Monthly Revenue</h3>
              <p className="text-xs text-muted mt-0.5">Last 6 months · Total ₹33.1 Lakhs</p>
            </div>
            <BarChart3 size={18} style={{ color: 'rgb(var(--muted-foreground))' }} />
          </div>
          <BarChartSVG data={REVENUE_BY_MONTH} colors={['#6366f1','#7c3aed','#4f46e5','#818cf8','#8b5cf6','#6366f1']} />
        </div>

        {/* Lead Sources Donut */}
        <div className="col-span-12 lg:col-span-5 crm-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Lead Sources</h3>
              <p className="text-xs text-muted mt-0.5">Where your leads come from</p>
            </div>
            <PieChart size={18} style={{ color: 'rgb(var(--muted-foreground))' }} />
          </div>
          <div className="space-y-2.5">
            {LEAD_SOURCES.map(src => (
              <div key={src.source}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{src.source}</span>
                  <span className="font-bold" style={{ color: src.color }}>{src.pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border))' }}>
                  <div className="h-full rounded-full" style={{ width: `${src.pct}%`, background: src.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="crm-card">
        <h3 className="font-semibold mb-4">Pipeline Conversion Funnel</h3>
        <div className="flex items-end justify-between gap-3">
          {PIPELINE_STAGES.map((stage, i) => {
            const maxCount = PIPELINE_STAGES[0].count;
            const widthPct = (stage.count / maxCount) * 100;
            return (
              <div key={stage.label} className="flex-1 text-center">
                <p className="text-xs font-bold mb-1" style={{ color: stage.color }}>{stage.count}</p>
                <div className="rounded-lg mx-auto mb-2 transition-all" style={{
                  width: `${widthPct}%`,
                  minWidth: 40,
                  height: 32,
                  background: `${stage.color}25`,
                  border: `1px solid ${stage.color}40`,
                }} />
                <p className="text-xs text-muted leading-tight">{stage.label}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: stage.color }}>
                  ₹{(stage.value / 100000).toFixed(1)}L
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex gap-1.5 items-center mt-3 text-xs text-muted justify-center">
          {PIPELINE_STAGES.map((s, i) => i < PIPELINE_STAGES.length - 1 && (
            <span key={s.label}>
              {Math.round((PIPELINE_STAGES[i + 1].count / s.count) * 100)}% conv →
            </span>
          ))}
        </div>
      </div>

      {/* Team Leaderboard */}
      <div className="crm-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <h3 className="font-semibold">Team Performance Leaderboard</h3>
        </div>
        <table className="crm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Rep Name</th>
              <th>Leads Handled</th>
              <th>Deals Closed</th>
              <th>Revenue Generated</th>
              <th>Conversion Rate</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {TEAM_PERFORMANCE.map((rep, i) => (
              <tr key={rep.name}>
                <td>
                  <span className="text-sm font-bold" style={{ color: i === 0 ? 'rgb(245,158,11)' : i === 1 ? 'rgb(156,163,175)' : i === 2 ? 'rgb(180,120,80)' : 'rgb(var(--muted-foreground))' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="avatar w-7 h-7 text-xs">{rep.name.split(' ').map(n => n[0]).join('')}</div>
                    <span className="font-medium text-sm">{rep.name}</span>
                  </div>
                </td>
                <td><span className="text-sm">{rep.leads}</span></td>
                <td><span className="text-sm font-semibold">{rep.deals}</span></td>
                <td><span className="font-bold text-sm" style={{ color: 'rgb(var(--brand-400))' }}>{rep.revenue}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border))' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${rep.conversion}%`,
                        background: rep.conversion > 38 ? '#22c55e' : rep.conversion > 28 ? '#f59e0b' : '#ef4444',
                      }} />
                    </div>
                    <span className="text-sm font-bold" style={{ color: rep.conversion > 38 ? '#22c55e' : rep.conversion > 28 ? '#f59e0b' : '#ef4444' }}>
                      {rep.conversion}%
                    </span>
                  </div>
                </td>
                <td>
                  {rep.trend === 'up'
                    ? <TrendingUp size={16} style={{ color: '#22c55e' }} />
                    : <TrendingDown size={16} style={{ color: '#ef4444' }} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
