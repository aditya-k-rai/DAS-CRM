'use client';

import Link from 'next/link';
import {
  UserCog, Calendar, Users, DollarSign, Clock, CheckCircle2, AlertTriangle,
  FileText, ArrowRight, BarChart3, Plus, UserCheck, Briefcase, Activity,
  Bell, Star, Building2, Shield, TrendingUp, Target,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// HR Manager Dashboard — Built according to the HR role structure
// Sections:
//  1.  Dashboard (this screen)
//  2.  Workforce Overview     → Total Staff, Present Today, On Leave, Vacant
//  3.  Attendance Tracker     → Today's Clock-ins, Leave Requests, Absent
//  4.  Leave Management       → Pending Requests, Approved, Rejected
//  5.  Interview & Hiring     → Open Positions, Scheduled, Completed, Hired
//  6.  Payroll & Salary       → Processed, Pending, Total Disbursed
//  7.  Employee Documents     → KYC, Contracts, Verified, Pending
//  8.  Notice Board           → Company Announcements
//  9.  Team Audit & Reports   → Compliance, Activity, Summary
// ─────────────────────────────────────────────────────────────────────────────

export function HRRoleDashboard() {
  const { currentUser } = useAuth();
  const firstName = currentUser?.name?.split(' ')?.[0] || 'HR';

  return (
    <div className="space-y-6 text-foreground">

      {/* ── Header Banner ──────────────────────────────────────────────── */}
      <div className="crm-card p-5 bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-base flex items-center justify-center shadow-lg shadow-emerald-500/25">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-white">Welcome, {firstName}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">HR MANAGER</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">HR Operations Dashboard · Attendance, Leave, Hiring & Employee Management.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/attendance" className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all">
              <Calendar size={13} /> Mark Attendance
            </Link>
            <Link href="/hr/salary" className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md">
              <DollarSign size={13} /> Payroll Builder
            </Link>
          </div>
        </div>
      </div>

      {/* ── Section 2: Workforce Overview ─────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-black text-foreground">Workforce Overview</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Employees', value: '0', sub: 'Registered staff',    icon: Users,         color: 'text-indigo-500 dark:text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20' },
            { label: 'Present Today',   value: '0', sub: 'Clocked in',          icon: UserCheck,     color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'On Leave Today',  value: '0', sub: 'Approved leave',       icon: AlertTriangle, color: 'text-amber-500 dark:text-amber-400',    bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
            { label: 'Absent / Late',   value: '0', sub: 'Not checked in',       icon: Clock,         color: 'text-rose-500 dark:text-rose-400',      bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
          ].map(c => (
            <div key={c.label} className={`crm-card p-4 border ${c.border} rounded-2xl flex items-center gap-3`}>
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

      {/* ── Section 3: Attendance Tracker ─────────────────────────────── */}
      <div className="crm-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 flex items-center justify-center">
              <Calendar size={14} className="text-sky-500 dark:text-sky-400" />
            </div>
            Today's Attendance Overview
          </h3>
          <Link href="/attendance" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
            Full Attendance <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Checked In',        value: '0 / 0', color: 'text-emerald-400', sub: 'On time' },
            { label: 'Pending Check-In',  value: '0',     color: 'text-amber-400',   sub: 'Not yet' },
            { label: 'Leave Today',       value: '0',     color: 'text-sky-400',     sub: 'Approved' },
          ].map(a => (
            <div key={a.label} className="p-4 rounded-xl border border-border bg-card text-center">
              <p className={`text-2xl font-black ${a.color}`}>{a.value}</p>
              <p className="text-xs font-bold text-foreground mt-1">{a.label}</p>
              <p className="text-[10px] text-muted-foreground">{a.sub}</p>
            </div>
          ))}
        </div>

        <div className="p-8 text-center border border-dashed border-border rounded-xl">
          <Calendar size={24} className="mx-auto mb-2 text-muted-foreground/50" />
          <p className="font-bold text-sm text-foreground">No employee attendance logged today</p>
          <p className="text-xs text-muted-foreground mt-1">Live camera and punch-in records will appear here as employees clock in.</p>
          <Link href="/attendance" className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-500 dark:text-emerald-400 font-bold hover:underline">
            <Plus size={11} /> Mark Manual Attendance
          </Link>
        </div>
      </div>

      {/* ── Section 4: Leave Management ───────────────────────────────── */}
      <div className="crm-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle size={14} className="text-amber-500 dark:text-amber-400" />
            </div>
            Leave Management
          </h3>
          <Link href="/attendance?tab=leaves" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
            Manage Leaves <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending Requests', value: '0', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/8' },
            { label: 'Approved',         value: '0', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/8' },
            { label: 'Rejected',         value: '0', color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/8' },
          ].map(l => (
            <div key={l.label} className={`p-4 rounded-xl border ${l.border} ${l.bg} text-center`}>
              <p className={`text-2xl font-black ${l.color}`}>{l.value}</p>
              <p className="text-xs font-bold text-foreground mt-1">{l.label}</p>
            </div>
          ))}
        </div>

        <div className="p-6 text-center border border-dashed border-border rounded-xl">
          <CheckCircle2 size={20} className="mx-auto mb-2 text-emerald-500/60" />
          <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">No pending leave requests</p>
          <p className="text-xs text-muted-foreground mt-1">All leave requests are up to date.</p>
        </div>
      </div>

      {/* ── Section 5: Interview & Hiring ─────────────────────────────── */}
      <div className="crm-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <UserCog size={14} className="text-purple-500 dark:text-purple-400" />
            </div>
            Interview & Hiring Pipeline
          </h3>
          <Link href="/hr/interviews" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
            All Interviews <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Open Positions',    value: '0', icon: Target,       color: 'text-indigo-400' },
            { label: 'Interviews Sched.', value: '0', icon: Calendar,     color: 'text-sky-400' },
            { label: 'Completed',         value: '0', icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Hired This Month',  value: '0', icon: Star,         color: 'text-amber-400' },
          ].map(h => (
            <div key={h.label} className="crm-card p-4 rounded-2xl flex flex-col gap-1.5 border border-border">
              <h.icon size={15} className={h.color} />
              <span className={`text-2xl font-black ${h.color}`}>{h.value}</span>
              <span className="text-[10px] text-muted-foreground font-bold">{h.label}</span>
            </div>
          ))}
        </div>

        <div className="p-6 text-center border border-dashed border-border rounded-xl">
          <UserCog size={20} className="mx-auto mb-2 text-muted-foreground/50" />
          <p className="font-bold text-sm text-foreground">No interviews scheduled</p>
          <p className="text-xs text-muted-foreground mt-1">Schedule candidate interviews and track your hiring pipeline here.</p>
          <Link href="/hr/interviews" className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline">
            <Plus size={11} /> Schedule Interview
          </Link>
        </div>
      </div>

      {/* ── Section 6: Payroll & Salary ───────────────────────────────── */}
      <div className="crm-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <DollarSign size={14} className="text-emerald-500 dark:text-emerald-400" />
            </div>
            Payroll & Salary
          </h3>
          <Link href="/hr/salary" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
            Payroll Builder <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Processed This Month', value: '0',   sub: 'Payslips generated', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Pending Payroll',      value: '0',   sub: 'Awaiting approval',  icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
            { label: 'Total Disbursed',      value: '₹0',  sub: 'This month',         icon: DollarSign,   color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
          ].map(p => (
            <div key={p.label} className={`p-4 rounded-xl border ${p.border} flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center flex-shrink-0`}><p.icon size={18} className={p.color} /></div>
              <div>
                <p className={`text-2xl font-black ${p.color}`}>{p.value}</p>
                <p className="text-xs font-bold text-foreground">{p.label}</p>
                <p className="text-[10px] text-muted-foreground">{p.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-foreground">Ready for payroll cycle</p>
            <p className="text-[10px] text-muted-foreground">No employees processed yet. Run the payroll builder to generate payslips.</p>
          </div>
          <Link href="/hr/salary" className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-1.5">
            <DollarSign size={12} /> Run Payroll
          </Link>
        </div>
      </div>

      {/* ── Section 7: Employee Documents ─────────────────────────────── */}
      <div className="crm-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 flex items-center justify-center">
              <FileText size={14} className="text-sky-500 dark:text-sky-400" />
            </div>
            Employee Documents & KYC
          </h3>
          <Link href="/hr/employees" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
            Staff Directory <ArrowRight size={11} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'KYC Documents',  value: '0', color: 'text-indigo-400' },
            { label: 'Contracts',      value: '0', color: 'text-sky-400' },
            { label: 'Verified',       value: '0', color: 'text-emerald-400' },
            { label: 'Pending Review', value: '0', color: 'text-amber-400' },
          ].map(d => (
            <div key={d.label} className="crm-card p-4 rounded-2xl border border-border text-center">
              <p className={`text-2xl font-black ${d.color}`}>{d.value}</p>
              <p className="text-[10px] text-muted-foreground font-bold mt-1">{d.label}</p>
            </div>
          ))}
        </div>
        <div className="p-6 text-center border border-dashed border-border rounded-xl">
          <Shield size={20} className="mx-auto mb-2 text-muted-foreground/50" />
          <p className="font-bold text-sm text-foreground">No documents uploaded yet</p>
          <p className="text-xs text-muted-foreground mt-1">Employee KYC documents, contracts, and ID verifications will appear here.</p>
        </div>
      </div>

      {/* ── Sections 8–9: Notice Board + Audit ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Notice Board */}
        <div className="crm-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Bell size={14} className="text-amber-500 dark:text-amber-400" />
              </div>
              Notice Board
            </h3>
            <Link href="/communicate" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">Post Notice <ArrowRight size={11} /></Link>
          </div>
          <div className="p-8 text-center border border-dashed border-border rounded-xl">
            <Bell size={20} className="mx-auto mb-2 text-muted-foreground/50" />
            <p className="font-bold text-sm text-foreground">No notices posted yet</p>
            <p className="text-xs text-muted-foreground mt-1">Company-wide HR announcements, policy updates, and event notifications.</p>
            <Link href="/communicate" className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-500 dark:text-amber-400 font-bold hover:underline">
              <Plus size={11} /> Post an Announcement
            </Link>
          </div>
        </div>

        {/* Team Audit & Reports */}
        <div className="crm-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                <BarChart3 size={14} className="text-indigo-500 dark:text-indigo-400" />
              </div>
              HR Reports & Audit
            </h3>
            <Link href="/reports" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">Full Reports <ArrowRight size={11} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Compliance Reports', href: '/reports', icon: Shield,      color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Attendance Report',  href: '/attendance', icon: Calendar, color: 'text-sky-400',    bg: 'bg-sky-500/10' },
              { label: 'Payroll Report',     href: '/hr/salary',  icon: DollarSign,color: 'text-emerald-400',bg: 'bg-emerald-500/10' },
              { label: 'Activity Audit',     href: '/reports',    icon: Activity,  color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ].map(r => (
              <Link key={r.label} href={r.href} className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all group">
                <div className={`w-7 h-7 rounded-lg ${r.bg} flex items-center justify-center flex-shrink-0`}><r.icon size={13} className={r.color} /></div>
                <span className="text-[11px] font-bold text-foreground group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">{r.label}</span>
                <ArrowRight size={11} className="ml-auto text-muted-foreground group-hover:text-indigo-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
