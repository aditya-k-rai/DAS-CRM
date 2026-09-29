'use client';

import Link from 'next/link';
import {
  Users, Target, CheckSquare, TrendingUp, Phone, ArrowRight, Plus,
  Clock, AlertTriangle, CheckCircle2, BarChart3, UserCheck, Briefcase,
  Radio, Star, Trophy, Activity, Zap, Calendar, GitBranch,
  List, MessageSquare, MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Team Leader Dashboard — Default Sections:
//
//  1.  Dashboard (this screen — always visible for all roles)
//  2.  My Team              → Total Members, Active, Inactive
//  3.  Leads                → Team Total, New, Contacted, Qualified, Unqualified/Lost
//  4.  Follow-ups           → Due Today, Upcoming, Overdue, Completed
//  5.  Sales                → Open Opps, Won Deals, Lost Deals, Pipeline Value, Won Revenue
//  6.  Team Activity        (live feed)
//  7.  Team Member Details  (quick overview cards)
//  8.  Team Leads           → All, Unassigned, New, Contacted, Qualified, Proposal,
//                             Negotiation, Converted, Lost
//  9.  Lead Assignment      → Distribute assigned leads
//  10. Unassigned Leads     (queue for distribution)
//  11. Team Pipeline        (pipeline kanban overview)
//  12. Team Follow-ups      (aggregate follow-up list)
//  13. Team Calls           (call log summary)
//  14. Team WhatsApp Direct
//  15. Team WhatsApp Cloud
//  16. Team Performance     (leaderboard)
// ─────────────────────────────────────────────────────────────────────────────

interface StatPillProps { label: string; value: string | number; color: string; }
function StatPill({ label, value, color }: StatPillProps) {
  return (
    <div className="flex flex-col">
      <span className={`text-xl font-black ${color}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground font-bold mt-0.5 leading-tight">{label}</span>
    </div>
  );
}

export function TeamLeaderRoleDashboard() {
  const { currentUser } = useAuth();
  const firstName = currentUser?.name?.split(' ')?.[0] || 'TL';

  return (
    <div className="space-y-6 text-foreground">

      {/* ── Header Banner ──────────────────────────────────────────────── */}
      <div className="crm-card p-5 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 border border-blue-500/30 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-lg shadow-blue-500/25">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-white">Welcome, {firstName}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">TEAM LEADER</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Team Unit Dashboard · Supervising Sales Executives & tracking full team performance.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/leads?filter=unassigned" className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all">
              <Target size={13} /> Distribute Leads
            </Link>
            <Link href="/goals" className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md">
              <TrendingUp size={13} /> Unit Goals
            </Link>
          </div>
        </div>
      </div>

      {/* ── Section 2: My Team ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 rounded-full bg-blue-500" />
          <h2 className="text-sm font-black text-foreground">My Team</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Team Members', value: '0', sub: 'Assigned to your unit', icon: Users,     color: 'text-blue-500 dark:text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
            { label: 'Active Members',     value: '0', sub: 'Working today',         icon: UserCheck,  color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Inactive Members',   value: '0', sub: 'On leave / absent',     icon: AlertTriangle, color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
          ].map(c => (
            <div key={c.label} className={`crm-card p-4 border ${c.border} rounded-2xl flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                <c.icon size={18} className={c.color} />
              </div>
              <div>
                <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                <p className="text-xs font-bold text-foreground">{c.label}</p>
                <p className="text-[10px] text-muted-foreground">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Leads ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 rounded-full bg-indigo-500" />
          <h2 className="text-sm font-black text-foreground">Leads</h2>
          <Link href="/leads" className="ml-auto text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">View All <ArrowRight size={11} /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: 'Team Total Leads',    value: '0', icon: List,         color: 'text-indigo-400' },
            { label: 'New Leads',           value: '0', icon: Plus,         color: 'text-emerald-400' },
            { label: 'Contacted',           value: '0', icon: Phone,        color: 'text-sky-400' },
            { label: 'Qualified',           value: '0', icon: CheckCircle2, color: 'text-amber-400' },
            { label: 'Unqualified / Lost',  value: '0', icon: AlertTriangle,color: 'text-rose-400' },
          ].map(s => (
            <div key={s.label} className="crm-card p-4 rounded-2xl flex flex-col gap-1.5 border border-border">
              <s.icon size={15} className={s.color} />
              <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
              <span className="text-[10px] text-muted-foreground font-bold">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 4: Follow-ups ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 rounded-full bg-amber-500" />
          <h2 className="text-sm font-black text-foreground">Team Follow-ups</h2>
          <Link href="/leads?filter=followups" className="ml-auto text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">Manage <ArrowRight size={11} /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Due Today',  value: '0', color: 'text-amber-400', dot: 'bg-amber-400' },
            { label: 'Upcoming',   value: '0', color: 'text-sky-400',   dot: 'bg-sky-400' },
            { label: 'Overdue',    value: '0', color: 'text-rose-400',  dot: 'bg-rose-400' },
            { label: 'Completed',  value: '0', color: 'text-emerald-400', dot: 'bg-emerald-400' },
          ].map(f => (
            <div key={f.label} className="crm-card p-4 rounded-2xl border border-border flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${f.dot}`} />
                <span className="text-[10px] text-muted-foreground font-bold">{f.label}</span>
              </div>
              <span className={`text-2xl font-black ${f.color}`}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 5: Sales ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-black text-foreground">Sales Overview</h2>
          <Link href="/deals" className="ml-auto text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">Deals <ArrowRight size={11} /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: 'Open Opportunities',  value: '0',    icon: Zap,        color: 'text-sky-400' },
            { label: 'Won Deals',           value: '0',    icon: Trophy,     color: 'text-emerald-400' },
            { label: 'Lost Deals',          value: '0',    icon: AlertTriangle, color: 'text-rose-400' },
            { label: 'Pipeline Value',      value: '₹0',   icon: GitBranch,  color: 'text-purple-400' },
            { label: 'Won Revenue',         value: '₹0',   icon: TrendingUp, color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="crm-card p-4 rounded-2xl flex flex-col gap-1.5 border border-border">
              <s.icon size={15} className={s.color} />
              <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
              <span className="text-[10px] text-muted-foreground font-bold">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 6 + 7: Team Activity & Member Details ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Team Activity Feed */}
        <div className="crm-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Activity size={14} className="text-purple-500 dark:text-purple-400" />
              </div>
              Team Activity
            </h3>
          </div>
          <div className="p-8 text-center border border-dashed border-border rounded-xl">
            <Activity size={24} className="mx-auto mb-2 text-muted-foreground/50" />
            <p className="font-bold text-sm text-foreground">No team activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">Live call logs, lead status updates, and follow-up completions from your team will appear here.</p>
          </div>
        </div>

        {/* Team Member Details */}
        <div className="crm-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 flex items-center justify-center">
                <Users size={14} className="text-sky-500 dark:text-sky-400" />
              </div>
              Team Member Details
            </h3>
            <Link href="/hr/employees" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">View All <ArrowRight size={11} /></Link>
          </div>
          <div className="p-8 text-center border border-dashed border-border rounded-xl">
            <Users size={24} className="mx-auto mb-2 text-muted-foreground/50" />
            <p className="font-bold text-sm text-foreground">No sales executives assigned yet</p>
            <p className="text-xs text-muted-foreground mt-1">When sales representatives are assigned to your team leader unit, their live stats appear here.</p>
            <Link href="/hr/employees" className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline">
              <Plus size={11} /> Add Team Members
            </Link>
          </div>
        </div>
      </div>

      {/* ── Section 8: Team Leads Pipeline ────────────────────────────── */}
      <div className="crm-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <GitBranch size={14} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            Team Leads (Pipeline Stages)
          </h3>
          <Link href="/pipeline" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">Full Pipeline <ArrowRight size={11} /></Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {[
            { stage: 'All',         count: 0, color: 'text-slate-400' },
            { stage: 'Unassigned',  count: 0, color: 'text-slate-400' },
            { stage: 'New',         count: 0, color: 'text-indigo-400' },
            { stage: 'Contacted',   count: 0, color: 'text-sky-400' },
            { stage: 'Qualified',   count: 0, color: 'text-amber-400' },
            { stage: 'Proposal',    count: 0, color: 'text-purple-400' },
            { stage: 'Negotiation', count: 0, color: 'text-orange-400' },
            { stage: 'Converted',   count: 0, color: 'text-emerald-400' },
            { stage: 'Lost',        count: 0, color: 'text-rose-400' },
          ].map(s => (
            <div key={s.stage} className="p-3 rounded-xl border border-border bg-card flex flex-col items-center text-center gap-1">
              <span className={`text-xl font-black ${s.color}`}>{s.count}</span>
              <span className="text-[9px] text-muted-foreground font-bold leading-tight">{s.stage}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 9–10: Lead Assignment + Unassigned Leads ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Lead Assignment */}
        <div className="crm-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Target size={14} className="text-amber-500 dark:text-amber-400" />
              </div>
              Lead Assignment
            </h3>
            <Link href="/leads?filter=assign" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
              Distribute <ArrowRight size={11} />
            </Link>
          </div>
          <p className="text-[11px] text-muted-foreground">Assign leads distributed to you and distribute them across your sales executive team.</p>
          <div className="p-6 text-center border border-dashed border-border rounded-xl">
            <Target size={20} className="mx-auto mb-2 text-muted-foreground/50" />
            <p className="font-bold text-sm text-foreground">No leads to distribute</p>
            <p className="text-xs text-muted-foreground mt-1">Leads assigned to your unit will appear here for distribution.</p>
          </div>
          <Link href="/leads?filter=assign" className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-black border border-amber-500/30 transition-all">
            <Target size={13} /> Open Lead Distribution
          </Link>
        </div>

        {/* Unassigned Leads Queue */}
        <div className="crm-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center">
                <AlertTriangle size={14} className="text-rose-500 dark:text-rose-400" />
              </div>
              Unassigned Leads Queue
            </h3>
            <span className="text-xs font-black text-rose-400 px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/20">0 Pending</span>
          </div>
          <div className="p-6 text-center border border-dashed border-rose-500/20 rounded-xl bg-rose-500/5">
            <CheckCircle2 size={20} className="mx-auto mb-2 text-emerald-500/60" />
            <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">All leads assigned! 🎉</p>
            <p className="text-xs text-muted-foreground mt-1">The unassigned lead queue is clear.</p>
          </div>
        </div>
      </div>

      {/* ── Section 11: Team Pipeline ─────────────────────────────────── */}
      <div className="crm-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <BarChart3 size={14} className="text-purple-500 dark:text-purple-400" />
            </div>
            Team Pipeline Overview
          </h3>
          <Link href="/pipeline" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">Open Pipeline <ArrowRight size={11} /></Link>
        </div>
        <div className="p-8 text-center border border-dashed border-border rounded-xl">
          <BarChart3 size={24} className="mx-auto mb-2 text-muted-foreground/50" />
          <p className="font-bold text-sm text-foreground">No pipeline data yet</p>
          <p className="text-xs text-muted-foreground mt-1">Your team's lead pipeline progress across all stages will appear as a visual chart here.</p>
        </div>
      </div>

      {/* ── Section 12–13–14–15: Comms Overview Grid ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Team Follow-ups',      icon: Clock,            color: 'text-amber-400', href: '/leads?filter=followups', count: '0',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
          { title: 'Team Calls',           icon: Phone,            color: 'text-sky-400',   href: '/leads',                  count: '0',   bg: 'bg-sky-500/10',     border: 'border-sky-500/20' },
          { title: 'Team WhatsApp Direct', icon: MessageCircle,    color: 'text-emerald-400', href: '/whatsapp-templates',  count: '0',   bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { title: 'Team WhatsApp Cloud',  icon: MessageSquare,    color: 'text-indigo-400', href: '/comms',                count: '0',   bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20' },
        ].map(c => (
          <div key={c.title} className={`crm-card p-4 border ${c.border} rounded-2xl flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
              <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center`}><c.icon size={15} className={c.color} /></div>
              <Link href={c.href} className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold hover:underline">View →</Link>
            </div>
            <div>
              <span className={`text-2xl font-black ${c.color}`}>{c.count}</span>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{c.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 16: Team Performance Leaderboard ─────────────────── */}
      <div className="crm-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Star size={14} className="text-amber-500 dark:text-amber-400" />
            </div>
            Team Performance
          </h3>
          <Link href="/reports" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">Reports <ArrowRight size={11} /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Top Performer This Week',   value: '—',  sub: 'No data yet',   icon: Trophy,     color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
            { label: 'Team Avg Conversion Rate',  value: '0%', sub: 'Baseline',       icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Team Total Revenue Won',    value: '₹0', sub: 'This month',     icon: Briefcase,  color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
          ].map(p => (
            <div key={p.label} className={`p-4 rounded-2xl border ${p.border} flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center flex-shrink-0`}><p.icon size={18} className={p.color} /></div>
              <div>
                <p className={`text-xl font-black ${p.color}`}>{p.value}</p>
                <p className="text-xs font-bold text-foreground">{p.label}</p>
                <p className="text-[10px] text-muted-foreground">{p.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 text-center border border-dashed border-border rounded-xl">
          <Star size={24} className="mx-auto mb-2 text-muted-foreground/50" />
          <p className="font-bold text-sm text-foreground">Performance leaderboard is empty</p>
          <p className="text-xs text-muted-foreground mt-1">When your sales executives close deals and complete follow-ups, their rankings appear here.</p>
        </div>
      </div>

    </div>
  );
}
