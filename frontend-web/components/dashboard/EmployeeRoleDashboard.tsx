'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Target, Sparkles, Clock, Calendar, Briefcase, Phone, Mail,
  MessageCircle, Video, CheckCircle2, AlertTriangle, ArrowRight,
  Plus, Users, Building2, TrendingUp, Trophy, Star, Zap,
  UserCheck, Radio, Bell, Check, ExternalLink, BarChart3
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types for Synced Leads & Activities
// ─────────────────────────────────────────────────────────────────────────────

interface SyncedLead {
  id: string;
  name: string;
  company: string;
  designation?: string;
  phone: string;
  email: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  value: string;
  rawEstimatedValue?: number;
  assignedTime: string;
  source: string;
  requirement?: string;
  avatarBg: string;
}

interface SyncedFollowUp {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  phone: string;
  email?: string;
  dueTime: string;
  dueDate: string;
  objective: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isCompleted: boolean;
  avatarBg: string;
}

interface SyncedMeeting {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  phone: string;
  email?: string;
  title: string;
  time: string;
  date: string;
  duration: string;
  platform: 'Google Meet' | 'Zoom' | 'Phone Call' | 'In-Person';
  meetUrl?: string;
  isCompleted: boolean;
  avatarBg: string;
}

interface SyncedOpportunity {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  phone: string;
  dealTitle: string;
  value: string;
  stage: string;
  probability: number;
  expectedClose: string;
  nextStep: string;
  avatarBg: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default High-Fidelity Synced Data (scoped to Sales Rep)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_NEW_LEADS: SyncedLead[] = [
  {
    id: 'lead-101',
    name: 'Rohan Deshmukh',
    company: 'Apex Innovations Pvt Ltd',
    designation: 'VP Technology & Procurement',
    phone: '+91 98201 44521',
    email: 'rohan.d@apexinnovations.in',
    status: 'New',
    value: '₹3,20,000',
    rawEstimatedValue: 320000,
    assignedTime: 'Just now (15m ago)',
    source: 'Website Inbound',
    requirement: 'Enterprise CRM Suite · 30 Sales Rep Seats · API Integration',
    avatarBg: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'lead-102',
    name: 'Priya Patel',
    company: 'Zenith Global Healthcare',
    designation: 'Director of Operations',
    phone: '+91 97112 88304',
    email: 'priya.patel@zenithhealth.org',
    status: 'New',
    value: '₹1,85,000',
    rawEstimatedValue: 185000,
    assignedTime: 'Today at 08:30 AM',
    source: 'WhatsApp Campaign',
    requirement: 'Patient Telemetry & Lead Routing Portal',
    avatarBg: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'lead-103',
    name: 'Vikram Malhotra',
    company: 'BlueSky Logistics India',
    designation: 'Commercial Head',
    phone: '+91 99304 12890',
    email: 'vikram.m@blueskylogistics.com',
    status: 'New',
    value: '₹4,50,000',
    rawEstimatedValue: 450000,
    assignedTime: 'Yesterday, 05:45 PM',
    source: 'Google Ads',
    requirement: 'Fleet Sales Automation & Quotation Builder',
    avatarBg: 'from-emerald-600 to-emerald-800',
  },
];

const DEFAULT_FOLLOW_UPS: SyncedFollowUp[] = [
  {
    id: 'flw-201',
    leadId: 'lead-104',
    leadName: 'Aditya Kumar',
    company: 'Apex Dynamics',
    phone: '+91 98920 11234',
    email: 'aditya.k@apexdynamics.co',
    dueTime: '11:30 AM',
    dueDate: 'Today',
    objective: 'Discuss custom ERP module requirements & review revised proposal',
    priority: 'HIGH',
    isCompleted: false,
    avatarBg: 'from-amber-500 to-orange-600',
  },
  {
    id: 'flw-202',
    leadId: 'lead-105',
    leadName: 'Pooja Verma',
    company: 'Starlight Retail Hub',
    phone: '+91 98114 99231',
    email: 'pooja.verma@starlightretail.in',
    dueTime: '02:15 PM',
    dueDate: 'Today',
    objective: 'Follow up on payment terms & check if legal approved the MSA contract',
    priority: 'MEDIUM',
    isCompleted: false,
    avatarBg: 'from-orange-500 to-amber-600',
  },
  {
    id: 'flw-203',
    leadId: 'lead-106',
    leadName: 'Sunil Narang',
    company: 'Metro Infra Solutions',
    phone: '+91 97720 33412',
    email: 's.narang@metroinfra.in',
    dueTime: '04:45 PM',
    dueDate: 'Today',
    objective: 'Touch base regarding discounted quarter-end multi-branch pricing',
    priority: 'HIGH',
    isCompleted: false,
    avatarBg: 'from-amber-600 to-red-600',
  },
];

const DEFAULT_MEETINGS: SyncedMeeting[] = [
  {
    id: 'mtg-301',
    leadId: 'lead-107',
    leadName: 'Rajesh Sharma',
    company: 'NexTech Solutions India',
    phone: '+91 98450 67123',
    email: 'rajesh@nextechsolutions.in',
    title: 'Product Walkthrough & Quotation Review',
    time: '03:00 PM',
    date: 'Today',
    duration: '45 mins',
    platform: 'Google Meet',
    meetUrl: 'https://meet.google.com/das-crm-demo',
    isCompleted: false,
    avatarBg: 'from-sky-500 to-blue-600',
  },
  {
    id: 'mtg-302',
    leadId: 'lead-108',
    leadName: 'Dr. Meera Nambiar',
    company: 'MediCare Diagnostics Group',
    phone: '+91 99001 22341',
    email: 'meera.nambiar@medicarediag.com',
    title: 'Architecture & Security Compliance Demo',
    time: '05:30 PM',
    date: 'Today',
    duration: '60 mins',
    platform: 'Zoom',
    meetUrl: 'https://zoom.us/j/das-crm-medicare',
    isCompleted: false,
    avatarBg: 'from-blue-600 to-indigo-600',
  },
];

const DEFAULT_OPPORTUNITIES: SyncedOpportunity[] = [
  {
    id: 'opp-401',
    leadId: 'lead-109',
    leadName: 'Kavita Reddy',
    company: 'CloudScale Systems',
    phone: '+91 98230 77112',
    dealTitle: 'Enterprise Cloud ERP & Sales Suite (50 Seats)',
    value: '₹4,80,000',
    stage: 'Negotiation',
    probability: 75,
    expectedClose: 'Oct 15, 2026',
    nextStep: 'Finalizing payment milestones & SLA clauses with CFO',
    avatarBg: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'opp-402',
    leadId: 'lead-110',
    leadName: 'Anand Gupta',
    company: 'Bharat Retail Hub',
    phone: '+91 98103 44556',
    dealTitle: 'Omnichannel POS & Multi-Store Lead Sync',
    value: '₹3,60,000',
    stage: 'Proposal Sent',
    probability: 50,
    expectedClose: 'Oct 20, 2026',
    nextStep: 'Awaiting board approval on annual cloud hosting license',
    avatarBg: 'from-violet-600 to-purple-800',
  },
];

function getInitials(name: string): string {
  if (!name) return 'LD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function EmployeeRoleDashboard() {
  const { currentUser } = useAuth();
  const firstName = currentUser?.name?.split(' ')?.[0] || 'Rep';

  // Synced States
  const [newLeads, setNewLeads] = useState<SyncedLead[]>(DEFAULT_NEW_LEADS);
  const [followUps, setFollowUps] = useState<SyncedFollowUp[]>(DEFAULT_FOLLOW_UPS);
  const [meetings, setMeetings] = useState<SyncedMeeting[]>(DEFAULT_MEETINGS);
  const [opportunities, setOpportunities] = useState<SyncedOpportunity[]>(DEFAULT_OPPORTUNITIES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync leads from backend and local task store on mount
  useEffect(() => {
    const syncData = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      try {
        const res = await fetch(`${apiBase}/leads`, { headers });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.leads || data.data || []);
          if (items.length > 0) {
            // Map fresh leads with status 'New'
            const freshItems: SyncedLead[] = items
              .filter((l: any) => {
                const s = (l.status?.name || l.status || '').toLowerCase();
                return s === 'new' || s === '';
              })
              .slice(0, 6)
              .map((l: any, idx: number) => {
                const colors = [
                  'from-emerald-500 to-teal-600',
                  'from-teal-500 to-cyan-600',
                  'from-emerald-600 to-emerald-800'
                ];
                return {
                  id: String(l.id),
                  name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.name || 'Unnamed Lead',
                  company: l.company || l.source?.name || 'Inbound Prospect',
                  designation: l.jobTitle || 'Decision Maker',
                  phone: l.phone || '+91 98000 00000',
                  email: l.email || 'lead@crm.local',
                  status: 'New',
                  value: l.estimatedValue ? `₹${Number(l.estimatedValue).toLocaleString('en-IN')}` : '₹2,50,000',
                  rawEstimatedValue: Number(l.estimatedValue) || 250000,
                  assignedTime: 'Recently assigned',
                  source: l.source?.name || l.source || 'Direct Inbound',
                  requirement: l.requirement || 'Interested in Enterprise Sales Management',
                  avatarBg: colors[idx % colors.length],
                };
              });

            if (freshItems.length > 0) {
              setNewLeads(freshItems);
            }
          }
        }
      } catch (err) {
        console.warn('API lead sync fallback to high-fidelity seed data:', err);
      }

      // Sync tasks from local storage
      if (typeof window !== 'undefined') {
        try {
          const savedTasksRaw = localStorage.getItem('@das_crm_tasks_v1');
          if (savedTasksRaw) {
            const savedTasks = JSON.parse(savedTasksRaw);
            if (Array.isArray(savedTasks) && savedTasks.length > 0) {
              const taskFollowUps = savedTasks
                .filter((t: any) => t.type === 'FOLLOW_UP' || t.type === 'CALL')
                .map((t: any, idx: number) => ({
                  id: t.id,
                  leadId: t.leadId || `lead-${idx}`,
                  leadName: t.leadName || 'Assigned Lead',
                  company: t.company || 'Enterprise Account',
                  phone: t.phone || '+91 98920 11234',
                  dueTime: t.dueTime || '11:30 AM',
                  dueDate: t.dueDate || 'Today',
                  objective: t.title || t.description || 'Follow-up regarding proposal terms',
                  priority: (t.priority as any) || 'HIGH',
                  isCompleted: !!t.isCompleted,
                  avatarBg: idx % 2 === 0 ? 'from-amber-500 to-orange-600' : 'from-orange-500 to-amber-600',
                }));

              if (taskFollowUps.length > 0) {
                setFollowUps(taskFollowUps);
              }

              const taskMeetings = savedTasks
                .filter((t: any) => t.type === 'MEETING')
                .map((t: any, idx: number) => ({
                  id: t.id,
                  leadId: t.leadId || `lead-mtg-${idx}`,
                  leadName: t.leadName || 'Key Stakeholder',
                  company: t.company || 'Partner Client',
                  phone: t.phone || '+91 98450 67123',
                  title: t.title || 'Product Walkthrough Session',
                  time: t.dueTime || '03:00 PM',
                  date: t.dueDate || 'Today',
                  duration: '45 mins',
                  platform: (idx % 2 === 0 ? 'Google Meet' : 'Zoom') as any,
                  meetUrl: 'https://meet.google.com/das-crm-demo',
                  isCompleted: !!t.isCompleted,
                  avatarBg: idx % 2 === 0 ? 'from-sky-500 to-blue-600' : 'from-blue-600 to-indigo-600',
                }));

              if (taskMeetings.length > 0) {
                setMeetings(taskMeetings);
              }
            }
          }
        } catch (_) {}
      }
    };

    syncData();
  }, []);

  // Quick Action Handlers
  const toggleFollowUp = (id: string, leadName: string) => {
    setFollowUps(prev =>
      prev.map(f => {
        if (f.id === id) {
          const nextState = !f.isCompleted;
          showToast(nextState ? `✅ Follow-up with ${leadName} marked complete!` : `Follow-up with ${leadName} reopened.`);
          return { ...f, isCompleted: nextState };
        }
        return f;
      })
    );
  };

  const toggleMeeting = (id: string, leadName: string) => {
    setMeetings(prev =>
      prev.map(m => {
        if (m.id === id) {
          const nextState = !m.isCompleted;
          showToast(nextState ? `🎯 Meeting with ${leadName} logged as completed!` : `Meeting with ${leadName} reopened.`);
          return { ...m, isCompleted: nextState };
        }
        return m;
      })
    );
  };

  const handleDirectCall = (name: string, phone: string) => {
    showToast(`📞 Connecting call to ${name} (${phone})...`);
  };

  const handleWhatsApp = (name: string) => {
    showToast(`💬 Opening WhatsApp conversation with ${name}...`);
  };

  // Metrics for Leads Overview (synced with state)
  const totalLeadsCount = newLeads.length + followUps.length + meetings.length + opportunities.length;
  const newLeadsCount = newLeads.length;
  const contactedCount = followUps.length;
  const qualifiedCount = meetings.length;
  const wonCount = 1; // Baseline active won deal this month

  return (
    <div className="space-y-7 text-foreground">

      {/* Floating Interactive Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900/95 border border-indigo-500/40 text-white text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

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
              <p className="text-xs text-slate-400 mt-0.5">Your personal sales workspace — leads, follow-ups, meetings, and opportunities synced to you.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/leads" className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all">
              <Target size={13} /> My Leads
            </Link>
            <Link href="/leads?status=New" className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md">
              <Plus size={13} /> New Lead
            </Link>
          </div>
        </div>
      </div>

      {/* ── Section 1: My Leads Overview (KEPT EXACTLY AS IT IS) ────────── */}
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
            { label: 'My Total Leads', value: String(totalLeadsCount), sub: 'Scoped to you', icon: Target, color: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
            { label: 'New Leads', value: String(newLeadsCount), sub: 'This week', icon: Sparkles, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Contacted', value: String(contactedCount), sub: 'Called / messaged', icon: Phone, color: 'text-sky-500 dark:text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
            { label: 'Qualified', value: String(qualifiedCount), sub: 'High intent', icon: CheckCircle2, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { label: 'Won / Converted', value: String(wonCount), sub: 'This month', icon: Trophy, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
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

      {/* ── Section 2: NEW LEADS (Synced Leads · Focused on Lead Name) ─── */}
      <div className="crm-card space-y-4 border border-emerald-500/25 bg-gradient-to-b from-emerald-500/5 via-card to-card p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-foreground">New Leads</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {newLeads.length} Freshly Assigned
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Inbound prospects assigned to you awaiting initial outreach</p>
            </div>
          </div>
          <Link href="/leads?status=New" className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1">
            View All New Leads <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {newLeads.map((lead) => (
            <div
              key={lead.id}
              className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Lead Name Focused Avatar */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${lead.avatarBg} text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform`}>
                    {getInitials(lead.name)}
                  </div>
                  <div>
                    {/* Hero Lead Name */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href="/leads" className="text-sm font-black text-white hover:text-emerald-400 transition-colors">
                        {lead.name}
                      </Link>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        NEW
                      </span>
                    </div>
                    {/* Organization / Company */}
                    <p className="text-xs font-semibold text-slate-300 flex items-center gap-1 mt-0.5">
                      <Building2 size={11} className="text-emerald-400/70" />
                      {lead.company}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{lead.designation}</p>
                  </div>
                </div>
                {/* Lead Estimated Value */}
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-black text-emerald-400">{lead.value}</span>
                  <p className="text-[9px] text-muted-foreground">{lead.source}</p>
                </div>
              </div>

              {/* Requirement Snippet */}
              {lead.requirement && (
                <div className="p-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-[11px] text-emerald-200/90 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{lead.requirement}</span>
                </div>
              )}

              {/* Action Buttons Focused on Lead */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock size={10} /> {lead.assignedTime}
                </span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${lead.phone}`}
                    onClick={() => handleDirectCall(lead.name, lead.phone)}
                    title={`Call ${lead.name}`}
                    className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 text-[11px] font-bold transition-all"
                  >
                    <Phone size={12} /> Call
                  </a>
                  <a
                    href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleWhatsApp(lead.name)}
                    title={`WhatsApp ${lead.name}`}
                    className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 text-[11px] font-bold transition-all"
                  >
                    <MessageCircle size={12} /> WA
                  </a>
                  <Link
                    href="/leads"
                    title={`Open details for ${lead.name}`}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    Details <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: FOLLOW-UPS (Synced Leads · Focused on Lead Name) ── */}
      <div className="crm-card space-y-4 border border-amber-500/25 bg-gradient-to-b from-amber-500/5 via-card to-card p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Clock size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-foreground">Follow-ups</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {followUps.filter(f => !f.isCompleted).length} Due
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Scheduled callbacks and commitment touchpoints with your leads</p>
            </div>
          </div>
          <Link href="/tasks?type=follow-up" className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1">
            Follow-up Hub <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {followUps.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 group relative ${
                item.isCompleted
                  ? 'bg-slate-900/30 border-slate-800/50 opacity-60'
                  : 'bg-slate-900/60 hover:bg-slate-900/90 border-amber-500/20 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Lead Name Focused Avatar */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.avatarBg} text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20`}>
                    {getInitials(item.leadName)}
                  </div>
                  <div>
                    {/* Hero Lead Name */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className={`text-sm font-black transition-colors ${item.isCompleted ? 'line-through text-slate-400' : 'text-white hover:text-amber-400'}`}>
                        {item.leadName}
                      </h4>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                        item.priority === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                    {/* Organization */}
                    <p className="text-xs font-semibold text-slate-300 flex items-center gap-1 mt-0.5">
                      <Building2 size={11} className="text-amber-400/70" />
                      {item.company}
                    </p>
                  </div>
                </div>
                {/* Time Badge */}
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1 justify-end">
                    <Clock size={11} /> {item.dueTime}
                  </span>
                  <p className="text-[9px] text-muted-foreground">{item.dueDate}</p>
                </div>
              </div>

              {/* Follow-up Objective Note */}
              <div className="p-2 rounded-lg bg-amber-500/8 border border-amber-500/15 text-[11px] text-amber-200/90">
                <span className="font-semibold text-amber-300">Goal: </span>
                {item.objective}
              </div>

              {/* Action Buttons Focused on Lead */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                <button
                  onClick={() => toggleFollowUp(item.id, item.leadName)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                    item.isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <CheckCircle2 size={12} className={item.isCompleted ? 'text-emerald-400' : 'text-slate-400'} />
                  {item.isCompleted ? 'Completed' : 'Mark Done'}
                </button>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${item.phone}`}
                    onClick={() => handleDirectCall(item.leadName, item.phone)}
                    title={`Call ${item.leadName}`}
                    className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1 text-[11px] font-bold transition-all"
                  >
                    <Phone size={12} /> Call
                  </a>
                  <a
                    href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleWhatsApp(item.leadName)}
                    title={`WhatsApp ${item.leadName}`}
                    className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1 text-[11px] font-bold transition-all"
                  >
                    <MessageCircle size={12} /> WA
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 4: MEETINGS (Synced Leads · Focused on Lead Name) ──── */}
      <div className="crm-card space-y-4 border border-sky-500/25 bg-gradient-to-b from-sky-500/5 via-card to-card p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Calendar size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-foreground">Meetings</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  {meetings.filter(m => !m.isCompleted).length} Scheduled Today
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Product demonstrations, solution walkthroughs & discovery calls</p>
            </div>
          </div>
          <Link href="/tasks?type=meeting" className="text-xs text-sky-400 font-bold hover:underline flex items-center gap-1">
            Meetings Hub <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 group relative ${
                item.isCompleted
                  ? 'bg-slate-900/30 border-slate-800/50 opacity-60'
                  : 'bg-slate-900/60 hover:bg-slate-900/90 border-sky-500/20 hover:border-sky-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Lead Name Focused Avatar */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.avatarBg} text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-500/20`}>
                    {getInitials(item.leadName)}
                  </div>
                  <div>
                    {/* Hero Lead Name */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-white hover:text-sky-400 transition-colors">
                        {item.leadName}
                      </h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                        <Video size={10} /> {item.platform}
                      </span>
                    </div>
                    {/* Organization */}
                    <p className="text-xs font-semibold text-slate-300 flex items-center gap-1 mt-0.5">
                      <Building2 size={11} className="text-sky-400/70" />
                      {item.company}
                    </p>
                  </div>
                </div>
                {/* Meeting Time */}
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-black text-sky-400 flex items-center gap-1 justify-end">
                    <Clock size={11} /> {item.time}
                  </span>
                  <p className="text-[10px] text-muted-foreground">{item.duration}</p>
                </div>
              </div>

              {/* Meeting Title / Agenda */}
              <div className="p-2.5 rounded-lg bg-sky-500/8 border border-sky-500/15">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Calendar size={12} className="text-sky-400 flex-shrink-0" />
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Lead Contact: <span className="text-sky-300 font-bold">{item.leadName}</span> ({item.phone})
                </p>
              </div>

              {/* Meeting Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                <button
                  onClick={() => toggleMeeting(item.id, item.leadName)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                    item.isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <CheckCircle2 size={12} className={item.isCompleted ? 'text-emerald-400' : 'text-slate-400'} />
                  {item.isCompleted ? 'Completed' : 'Mark Held'}
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${item.phone}`}
                    onClick={() => handleDirectCall(item.leadName, item.phone)}
                    title={`Call ${item.leadName}`}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    <Phone size={12} /> Dial
                  </a>
                  {item.meetUrl && (
                    <a
                      href={item.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition-all"
                    >
                      <Video size={12} /> Join Call with {item.leadName.split(' ')[0]}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 5: ACTIVE OPPORTUNITIES (Synced Leads · Focused on Lead Name) ── */}
      <div className="crm-card space-y-4 border border-purple-500/25 bg-gradient-to-b from-purple-500/5 via-card to-card p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Briefcase size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-foreground">Active Opportunities</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  ₹8.4L in Pipeline
                </span>
              </div>
              <p className="text-xs text-muted-foreground">High-intent deals and qualified pipeline opportunities scoped to you</p>
            </div>
          </div>
          <Link href="/deals" className="text-xs text-purple-400 font-bold hover:underline flex items-center gap-1">
            Pipeline &amp; Deals <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-3 group relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Lead Name Focused Avatar */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${opp.avatarBg} text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/20`}>
                    {getInitials(opp.leadName)}
                  </div>
                  <div>
                    {/* Hero Lead Name */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href="/deals" className="text-sm font-black text-white hover:text-purple-400 transition-colors">
                        {opp.leadName}
                      </Link>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {opp.stage}
                      </span>
                    </div>
                    {/* Organization & Role */}
                    <p className="text-xs font-semibold text-slate-300 flex items-center gap-1 mt-0.5">
                      <Building2 size={11} className="text-purple-400/70" />
                      {opp.company}
                    </p>
                  </div>
                </div>
                {/* Deal Value */}
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-black text-purple-400">{opp.value}</span>
                  <p className="text-[10px] text-emerald-400 font-bold">{opp.probability}% Probability</p>
                </div>
              </div>

              {/* Deal Title & Next Step */}
              <div className="p-2.5 rounded-lg bg-purple-500/8 border border-purple-500/15 space-y-1.5">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap size={12} className="text-purple-400 flex-shrink-0" />
                  {opp.dealTitle}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Next Step: <strong className="text-purple-200">{opp.nextStep}</strong></span>
                </div>
              </div>

              {/* Probability Progress Bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Target Close: {opp.expectedClose}</span>
                  <span className="font-bold text-purple-300">{opp.probability}% Win Probability</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400"
                    style={{ width: `${opp.probability}%` }}
                  />
                </div>
              </div>

              {/* Opportunity Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${opp.phone}`}
                    onClick={() => handleDirectCall(opp.leadName, opp.phone)}
                    title={`Call ${opp.leadName}`}
                    className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 flex items-center gap-1 text-[11px] font-bold transition-all"
                  >
                    <Phone size={12} /> Call {opp.leadName.split(' ')[0]}
                  </a>
                  <a
                    href={`https://wa.me/${opp.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleWhatsApp(opp.leadName)}
                    title={`WhatsApp ${opp.leadName}`}
                    className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 flex items-center gap-1 text-[11px] font-bold transition-all"
                  >
                    <MessageCircle size={12} /> WA
                  </a>
                </div>

                <Link
                  href="/deals"
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
                >
                  <Briefcase size={12} /> View Deal
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 6: My Performance ───────────────────────────────────── */}
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
            { label: 'Calls Made',       value: '14',   suffix: 'calls this week', icon: Phone,        color: 'text-sky-500 dark:text-sky-400' },
            { label: 'Conversion Rate',  value: '22.5%', suffix: 'above target',    icon: TrendingUp,   color: 'text-emerald-500 dark:text-emerald-400' },
            { label: 'Revenue Generated',value: '₹3.2L', suffix: '1 deal won',     icon: Trophy,       color: 'text-purple-500 dark:text-purple-400' },
            { label: 'Target Achieved',  value: '64%',  suffix: 'of monthly goal', icon: Star,         color: 'text-amber-500 dark:text-amber-400' },
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
            <span className="text-xs font-black text-emerald-400">₹3.2L / ₹5.0L quota</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700" style={{ width: '64%' }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">Cycle: Current Month</span>
            <span className="text-[10px] text-emerald-400 font-bold">64% of target achieved</span>
          </div>
        </div>
      </div>

      {/* ── Section 7: Attendance & Notice ──────────────────────────────── */}
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
              { label: 'This Month', value: '22 days', color: 'text-sky-400' },
              { label: 'Present', value: '20', color: 'text-emerald-400' },
              { label: 'Absent / Leave', value: '2', color: 'text-rose-400' },
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
              <p className="text-[10px] text-emerald-400 font-semibold">Active & Clocked In (09:15 AM)</p>
            </div>
            <Link href="/attendance" className="ml-auto flex-shrink-0 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-black border border-sky-500/30 transition-all">
              View Log
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
              The Notice Board
            </h3>
            <Link href="/communicate" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
              All Notices <ArrowRight size={11} />
            </Link>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <Radio size={14} className="text-amber-400 animate-pulse" />
              <p className="text-xs font-bold text-white">Q3 Sales Incentives &amp; Sprint Announced</p>
            </div>
            <p className="text-[11px] text-slate-300">
              Top 3 sales reps closing above ₹10L pipeline by month-end will qualify for executive club bonuses. Keep leads updated in real-time!
            </p>
            <p className="text-[10px] text-amber-400/80 font-semibold">Posted by Management · 2 hours ago</p>
          </div>
        </div>
      </div>

    </div>
  );
}
