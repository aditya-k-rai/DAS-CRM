'use client';

import { Topbar } from '@/components/layout/Topbar';
import {
  Radio, MessageSquare, Bell, Megaphone, Users,
  Zap, Lock, Sparkles, Vote, Calendar, FileText,
  BarChart3, Shield, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Planned feature list ──────────────────────────────────
const PLANNED_FEATURES = [
  { icon: Megaphone,    title: 'Company-Wide Announcements',       desc: 'Push rich announcements to all employees or specific departments with read-receipt tracking.',           color: 'text-indigo-400',  bg: 'bg-indigo-500/15',  border: 'border-indigo-500/20' },
  { icon: MessageSquare,title: 'Employee Direct Messaging',         desc: 'One-on-one & group chat channels between managers and team members, fully encrypted.',                   color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20' },
  { icon: Bell,         title: 'Push Notification Broadcasts',      desc: 'Send urgent alerts or policy updates via in-app push, WhatsApp, and email simultaneously.',              color: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/20' },
  { icon: Vote,         title: 'Employee Polls & Surveys',          desc: 'Create quick polls, satisfaction surveys, and anonymous feedback forms with live result dashboards.',     color: 'text-cyan-400',    bg: 'bg-cyan-500/15',    border: 'border-cyan-500/20' },
  { icon: Calendar,     title: 'Team Meeting Scheduler',            desc: 'Schedule team syncs with integrated availability calendar, agenda builder, and attendance tracking.',     color: 'text-rose-400',    bg: 'bg-rose-500/15',    border: 'border-rose-500/20' },
  { icon: FileText,     title: 'Policy & Document Distribution',    desc: 'Distribute HR policies, SOPs, and documents with e-signature acknowledgement tracking.',                 color: 'text-purple-400',  bg: 'bg-purple-500/15',  border: 'border-purple-500/20' },
  { icon: BarChart3,    title: 'Engagement Analytics',              desc: 'Track employee read rates, response rates, and overall internal communication engagement scores.',        color: 'text-teal-400',    bg: 'bg-teal-500/15',    border: 'border-teal-500/20' },
  { icon: Shield,       title: 'Role-Based Communication Access',   desc: 'Admins control who can broadcast to whom — by role, department, location, or team.',                    color: 'text-slate-400',   bg: 'bg-slate-500/15',   border: 'border-slate-500/20' },
];

const TIMELINE = [
  { phase: 'Phase 1', label: 'Announcements & Push Broadcasts',   eta: 'Q4 2026', status: 'planned' },
  { phase: 'Phase 2', label: 'Direct Messaging & Group Channels', eta: 'Q1 2027', status: 'planned' },
  { phase: 'Phase 3', label: 'Polls, Surveys & Engagement Tools', eta: 'Q2 2027', status: 'planned' },
  { phase: 'Phase 4', label: 'Full Analytics Dashboard & API',    eta: 'Q3 2027', status: 'planned' },
];

export default function CommunicateWithEmployeesPage() {
  return (
    <>
      <Topbar title="Communicate with Employees" actions={
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30">
          <Clock size={13} className="text-amber-400" />
          <span className="text-amber-400 text-xs font-bold">Upcoming Feature</span>
        </div>
      } />

      <main className="flex-1 p-4 sm:p-6 overflow-auto animate-fade-in">

        {/* Hero Banner */}
        <div className="crm-card p-8 sm:p-12 mb-6 text-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/6 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/6 rounded-full blur-2xl" />
          </div>

          <div className="relative z-10">
            {/* Icon */}
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30">
                <Radio size={42} className="text-white" />
              </div>
              {/* Glow rings */}
              <div className="absolute inset-0 rounded-3xl bg-indigo-400/20 animate-ping" style={{ animationDuration: '3s' }} />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/30 mb-6">
              <Sparkles size={14} className="text-amber-400" />
              <span className="text-amber-400 text-sm font-bold">Under Active Development · Launching Q4 2026</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Communicate with Employees
            </h1>
            <p className="text-muted text-base max-w-2xl mx-auto leading-relaxed">
              A powerful internal communication hub for admins and managers — broadcast announcements,
              send direct messages, run polls, schedule meetings, and track employee engagement,
              all from inside your DAS CRM dashboard.
            </p>

            <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
              {[
                { icon: Users,        label: 'Team-Wide Broadcasts' },
                { icon: Lock,         label: 'Role-Based Access' },
                { icon: Zap,          label: 'Real-Time Messaging' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-muted text-sm">
                  <item.icon size={16} className="text-indigo-400" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Planned Features Grid */}
        <div className="mb-6">
          <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" /> Planned Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PLANNED_FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={cn('crm-card p-5 border transition-all hover:scale-[1.02]', f.border)}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', f.bg)}>
                  <f.icon size={20} className={f.color} />
                </div>
                <p className="text-white font-bold text-sm mb-1.5">{f.title}</p>
                <p className="text-muted text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap Timeline */}
        <div className="crm-card p-6">
          <h2 className="text-white font-bold text-base mb-5 flex items-center gap-2">
            <Calendar size={16} className="text-cyan-400" /> Development Roadmap
          </h2>
          <div className="space-y-0">
            {TIMELINE.map((phase, idx) => (
              <div key={phase.phase} className="flex items-start gap-4">
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  </div>
                  {idx < TIMELINE.length - 1 && (
                    <div className="w-px h-10 bg-gradient-to-b from-indigo-500/40 to-transparent my-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-indigo-400 text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30">{phase.phase}</span>
                    <p className="text-white font-semibold text-sm">{phase.label}</p>
                    <span className="text-muted text-xs ml-auto flex items-center gap-1"><Clock size={10} /> ETA: {phase.eta}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
