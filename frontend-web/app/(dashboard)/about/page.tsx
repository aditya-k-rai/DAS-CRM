'use client';

/**
 * AboutPage — DAS CRM Web
 *
 * Dedicated Platform Overview & Lead Developer Engineering Showcase.
 * Contains:
 * 1. Platform Overview, Architecture & SLA Specs (v2.5.0)
 * 2. Dedicated Lead Architect & Developer Section (Aditya Kumar Rai)
 * 3. Technology Stack & Multi-Tenant Cloud Topology
 * 4. Release Channel & System Diagnostics
 */

import React from 'react';
import { Topbar } from '@/components/layout/Topbar';
import {
  Sparkles,
  Shield,
  Cpu,
  Layers,
  Database,
  ExternalLink,
  Code2,
  GitBranch,
  Terminal,
  CheckCircle2,
  Workflow,
  Zap,
  Globe,
  Award,
  Users,
  Building,
} from 'lucide-react';

export default function AboutPage() {
  const techStack = [
    { name: 'Next.js 14', role: 'Fullstack Web App & SSR Engine' },
    { name: 'React Native', role: 'Android & iOS Mobile Client' },
    { name: 'NestJS', role: 'Enterprise Modular Microservices Backend' },
    { name: 'TypeScript', role: 'Strict End-to-End Type Safety' },
    { name: 'PostgreSQL & Supabase', role: 'Multi-Tenant Relational Vault' },
    { name: 'Tailwind CSS', role: 'Ultra-Responsive Cyber Design System' },
    { name: 'Redis & BullMQ', role: 'Distributed Rate Limiter & Queue Engine' },
    { name: 'Google Workspace API', role: 'Sheets 2-Way Sync & Drive Storage' },
  ];

  const platformHighlights = [
    {
      title: '3-Model Funnel Engine',
      desc: 'Granular batch row quotas, real-time vanishing claim pools, and automated sales rep routing.',
      icon: Layers,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/15 border-indigo-500/30',
    },
    {
      title: 'Multi-Tenant Storage Vault',
      desc: 'Company-isolated Google Drive vaults with folder-wise access control and automated email exports.',
      icon: Database,
      color: 'text-purple-400',
      bg: 'bg-purple-500/15 border-purple-500/30',
    },
    {
      title: 'Dynamic Rate Guard',
      desc: 'Plan-tier based rate limiting (500 to 5,000 req/hr) preventing lockups and credential stuffing.',
      icon: Shield,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15 border-emerald-500/30',
    },
    {
      title: 'Realtime Telemetry & Audit',
      desc: 'Historical change manifests, salary formulas, geofenced attendance logs, and audit trails.',
      icon: Cpu,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/15 border-cyan-500/30',
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="About DAS CRM & Developer" />

      <main className="flex-1 p-4 sm:p-6 overflow-auto space-y-6 max-w-6xl mx-auto w-full">
        {/* TOP HERO BANNER */}
        <div className="relative rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/35 shadow-inner font-black text-lg">
                  DAS
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  DAS CRM Enterprise
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  v2.5.0 Production Stable
                </span>
              </div>

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Next-generation, high-performance Customer Relationship Management and Sales Operations platform engineered for enterprise speed, multi-tenant security, and real-time cross-device synchronization.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Uptime SLA</div>
                <div className="text-lg font-black text-emerald-400">99.98%</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Engine</div>
                <div className="text-lg font-black text-indigo-400">Cluster v2.5</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── DEDICATED DEVELOPER & LEAD ARCHITECT SECTION ── */}
        <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/90 to-accent/20 p-6 sm:p-8 shadow-xl backdrop-blur-md relative overflow-hidden space-y-6">
          <div className="flex items-center justify-between border-b border-border/70 pb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-400 border border-indigo-500/35 shadow-inner">
                <Code2 className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">
                  Lead Architect &amp; Developer
                </h2>
                <p className="text-xs text-muted-foreground">
                  Core Platform Engineering, Architecture &amp; System Design
                </p>
              </div>
            </div>

            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified Author
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Developer Card Profile */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-br from-slate-950/90 to-slate-900/90 border border-indigo-500/30 space-y-4 shadow-lg shadow-indigo-950/20">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-indigo-500/30 border border-white/20 shrink-0">
                  AKR
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    Aditya Kumar Rai
                  </h3>
                  <p className="text-xs font-bold text-indigo-400">
                    Senior Software Developer &amp; SaaS Architect
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Fullstack Systems, Mobile Architecture &amp; Cloud Infra
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800">
                Architected and built DAS CRM from the ground up — designing the high-concurrency NestJS backend microservices, real-time WebSocket pipelines, cross-platform Android mobile client, and the responsive Next.js web application.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <a
                  href="https://github.com/aditya-k-rai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>GitHub Profile</span>
                  <ExternalLink size={13} />
                </a>

                <a
                  href="https://github.com/aditya-k-rai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all"
                >
                  <GitBranch size={13} className="text-indigo-400" />
                  <span>@aditya-k-rai</span>
                </a>
              </div>
            </div>

            {/* Architecture Responsibilities & Focus */}
            <div className="lg:col-span-7 space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Engineering Responsibilities &amp; Pillars
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-accent/30 border border-border/80 space-y-1">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Workflow className="h-3.5 w-3.5 text-indigo-400" />
                    Distributed CRM Funnel
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Designed batch quotas, real-time round-robin, and vanishing lead claim pools with sub-second locks.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-accent/30 border border-border/80 space-y-1">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    Multi-Tenant Isolation
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Company-level partitioning, role-based transition locks, and secure cloud storage credentials vault.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-accent/30 border border-border/80 space-y-1">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    High-Concurrency Scaling
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Plan-tier dynamic rate limiters (500 to 5,000 req/hr) preventing server degradation and locking.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-accent/30 border border-border/80 space-y-1">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-cyan-400" />
                    Dual Web &amp; Mobile Parity
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Maintained 1:1 functional and design harmony across modern Next.js Web and Android APK builds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TECHNOLOGY STACK MATRIX ── */}
        <div className="crm-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Technology Stack &amp; Infrastructure
              </h3>
              <p className="text-xs text-muted-foreground">
                Production technologies powering the DAS CRM ecosystem
              </p>
            </div>
            <Terminal className="h-5 w-5 text-indigo-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {techStack.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-accent/20 border border-border hover:border-indigo-500/40 transition-colors space-y-1"
              >
                <div className="text-xs font-extrabold text-foreground">{item.name}</div>
                <div className="text-[11px] text-muted-foreground leading-tight">{item.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PLATFORM HIGHLIGHTS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {platformHighlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="crm-card p-5 space-y-2.5">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${item.bg}`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
