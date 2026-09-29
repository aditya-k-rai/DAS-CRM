'use client';

import Link from 'next/link';
import {
  Target, CheckSquare, Sparkles, TrendingUp, Clock, CheckCircle2,
  AlertCircle, AlertTriangle, ArrowRight, Plus, Users, Phone, Calendar,
  BarChart3, Bell, Star, Zap, Trophy, Activity, UserCheck, Radio,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Sales Executive / Sales Rep Dashboard
// Default Sections (always visible, cannot be removed):
//   1. Dashboard (this screen)
//   2. My Total Leads
//   3. New Leads
//   4. Follow-ups Due Today
//   5. Overdue Follow-ups
//   6. Active Opportunities
//   7. My Performance
//   8. Attendance & Notice
// ─────────────────────────────────────────────────────────────────────────────

export function EmployeeRoleDashboard() {
  const { currentUser } = useAuth();
  const firstName = currentUser?.name?.split(' ')?.[0] || 'Rep';

  return (
    <div className="space-y-6 text-foreground">

      {/* ── Header Banner ──────────────────────────────────────────────── */}
      <div className="crm-card p-5 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-base flex items-center justify-center shadow-lg shadow-indigo-500/25">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-white">Good morning, {firstName}! 👋</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  SALES REP
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Your personal sales workspace — track leads, follow-ups, and performance in real-time.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/leads" className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all">
              <Target size={13} /> My Leads
            </Link>
            <Link href="/leads?filter=new" className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md">
              <Plus size={13} /> New Lead
            </Link>
          </div>
        </div>
      </div>

      {/* ── Section 2–3: My Total Leads + New Leads ────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 rounded-full bg-indigo-500" />
          <h2 className="text-sm font-black text-foreground">My Leads Overview</h2>
          <Link href="/leads" className="ml-auto text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
            View All <ArrowRight size={11} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: 'My Total Leads', value: '0', sub: 'Scoped to you', icon: Target, color: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
            { label: 'New Leads', value: '0', sub: 'This week', icon: Sparkles, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Contacted', value: '0', sub: 'Called / messaged', icon: Phone, color: 'text-sky-500 dark:text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
            { label: 'Qualified', value: '0', sub: 'High intent', icon: CheckCircle2, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { label: 'Won / Converted', value: '0', sub: 'This month', icon: Trophy, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
          ].map(card => (
            <div key={card.label} className={`crm-card p-4 border ${card.border} rounded-2xl flex flex-col gap-2`}>
              <div className={`w-8 h-8 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon size={16} className={card.color} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{card.label}</p>
                <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 4–5: Follow-ups Due Today + Overdue ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Follow-ups Due Today */}
        <div className="crm-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Clock size={14} className="text-amber-500 dark:text-amber-400" />
              </div>
              Follow-ups Due Today
            </h3>
            <Link href="/leads?filter=followup-today" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
              View All <ArrowRight size={11} />
            </Link>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-400 font-bold">Due Today</span>
              <span className="text-2xl font-black text-amber-500 dark:text-amber-400">0</span>
            </div>
          </div>
          <div className="p-8 text-center border border-dashed border-border rounded-xl">
            <Clock size={24} className="mx-auto mb-2 text-muted-foreground/50" />
            <p className="font-bold text-sm text-foreground">No follow-ups scheduled today</p>
            <p className="text-xs text-muted-foreground mt-1">When you add follow-up dates to leads, they appear here on the due date.</p>
            <Link href="/leads" className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline">
              <Plus size={11} /> Schedule a Follow-up
            </Link>
          </div>
        </div>

        {/* Overdue Follow-ups */}
        <div className="crm-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center">
                <AlertTriangle size={14} className="text-rose-500 dark:text-rose-400" />
              </div>
              Overdue Follow-ups
            </h3>
            <Link href="/leads?filter=overdue" className="text-xs text-rose-400 font-bold hover:underline flex items-center gap-1">
              View All <ArrowRight size={11} />
            </Link>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/8 border border-rose-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-400 font-bold">Overdue</span>
              <span className="text-2xl font-black text-rose-500 dark:text-rose-400">0</span>
            </div>
          </div>
          <div className="p-8 text-center border border-dashed border-border rounded-xl">
            <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500/60" />
            <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">All caught up! 🎉</p>
            <p className="text-xs text-muted-foreground mt-1">No overdue follow-ups. Keep it up!</p>
          </div>
        </div>
      </div>

      {/* ── Section 6: Active Opportunities ────────────────────────────── */}
      <div className="crm-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Zap size={14} className="text-purple-500 dark:text-purple-400" />
            </div>
            Active Opportunities
          </h3>
          <Link href="/pipeline" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
            Pipeline View <ArrowRight size={11} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { stage: 'Proposal Sent', count: '0', color: 'text-sky-400', dot: 'bg-sky-400' },
            { stage: 'Negotiation', count: '0', color: 'text-amber-400', dot: 'bg-amber-400' },
            { stage: 'Meeting Done', count: '0', color: 'text-purple-400', dot: 'bg-purple-400' },
            { stage: 'Won This Month', count: '0', color: 'text-emerald-400', dot: 'bg-emerald-400' },
          ].map(opp => (
            <div key={opp.stage} className="p-3.5 rounded-xl bg-card border border-border flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${opp.dot}`} />
                <span className="text-[10px] text-muted-foreground font-bold">{opp.stage}</span>
              </div>
              <span className={`text-2xl font-black ${opp.color}`}>{opp.count}</span>
            </div>
          ))}
        </div>
        <div className="p-8 text-center border border-dashed border-border rounded-xl">
          <Zap size={24} className="mx-auto mb-2 text-muted-foreground/50" />
          <p className="font-bold text-sm text-foreground">No active opportunities yet</p>
          <p className="text-xs text-muted-foreground mt-1">Move your leads through the pipeline stages to track active deals here.</p>
        </div>
      </div>

      {/* ── Section 7: My Performance ───────────────────────────────────── */}
      <div className="crm-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <BarChart3 size={14} className="text-emerald-500 dark:text-emerald-400" />
            </div>
            My Performance
          </h3>
          <Link href="/reports" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
            Full Report <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Calls Made',       value: '0',    suffix: 'calls',     icon: Phone,        color: 'text-sky-500 dark:text-sky-400' },
            { label: 'Conversion Rate',  value: '0.0%', suffix: 'baseline',  icon: TrendingUp,   color: 'text-emerald-500 dark:text-emerald-400' },
            { label: 'Revenue Generated',value: '₹0',   suffix: '0 deals',   icon: Trophy,       color: 'text-purple-500 dark:text-purple-400' },
            { label: 'Target Achieved',  value: '0%',   suffix: 'of goal',   icon: Star,         color: 'text-amber-500 dark:text-amber-400' },
          ].map(p => (
            <div key={p.label} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-1.5 mb-2">
                <p.icon size={13} className={p.color} />
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{p.label}</p>
              </div>
              <p className={`text-2xl font-black ${p.color}`}>{p.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{p.suffix}</p>
            </div>
          ))}
        </div>

        {/* Progress bar for target */}
        <div className="p-4 rounded-xl border border-border bg-card/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground">Monthly Target Progress</span>
            <span className="text-xs font-black text-muted-foreground">0 / 0 leads converted</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700" style={{ width: '0%' }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">Start of cycle</span>
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold">0% of monthly goal</span>
          </div>
        </div>
      </div>

      {/* ── Section 8: Attendance & Notice ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attendance */}
        <div className="crm-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 flex items-center justify-center">
                <Calendar size={14} className="text-sky-500 dark:text-sky-400" />
              </div>
              My Attendance
            </h3>
            <Link href="/attendance" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
              Full View <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'This Month', value: '0 days', color: 'text-sky-400' },
              { label: 'Present', value: '0', color: 'text-emerald-400' },
              { label: 'Absent / Leave', value: '0', color: 'text-rose-400' },
            ].map(a => (
              <div key={a.label} className="p-3 rounded-xl border border-border bg-card text-center">
                <p className={`text-lg font-black ${a.color}`}>{a.value}</p>
                <p className="text-[9px] text-muted-foreground font-bold mt-0.5">{a.label}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl bg-sky-500/8 border border-sky-500/20 flex items-center gap-3">
            <UserCheck size={16} className="text-sky-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">Today's Status</p>
              <p className="text-[10px] text-muted-foreground">Not clocked in yet. Mark your attendance.</p>
            </div>
            <Link href="/attendance" className="ml-auto flex-shrink-0 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-black border border-sky-500/30 transition-all">
              Clock In
            </Link>
          </div>
        </div>

        {/* Notice Board */}
        <div className="crm-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Bell size={14} className="text-amber-500 dark:text-amber-400" />
              </div>
              Notice Board
            </h3>
            <Link href="/communicate" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
              All Notices <ArrowRight size={11} />
            </Link>
          </div>
          <div className="p-8 text-center border border-dashed border-border rounded-xl">
            <Radio size={24} className="mx-auto mb-2 text-muted-foreground/50" />
            <p className="font-bold text-sm text-foreground">No notices posted yet</p>
            <p className="text-xs text-muted-foreground mt-1">Company-wide announcements from your Admin or Team Leader will appear here.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
