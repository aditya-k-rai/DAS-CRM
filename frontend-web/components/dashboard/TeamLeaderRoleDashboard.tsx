'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, Target, TrendingUp, Phone, ArrowRight, Plus, Clock,
  AlertTriangle, CheckCircle2, BarChart3, UserCheck, Briefcase,
  Radio, Star, Trophy, Activity, Zap, Calendar,
  List, MessageSquare, MessageCircle, Share2, UserX, ChevronRight,
  Sparkles, Send, Check, Mail, Building2, Filter, Search, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getCachedData, setCachedData, clearAllDashboardCaches } from '@/lib/cacheUtils';
import {
  getUserDirectory,
  subscribeUserDirectory,
  invalidateUserDirectoryCache,
  CachedEmployee,
} from '@/lib/userDirectoryCache';

// ─────────────────────────────────────────────────────────────────────────────
// Types for Team Leader Dashboard Modules
// ─────────────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'MEETING' | 'FIELD' | 'LEAVE';
  leadsAssigned: number;
  contactedCount: number;
  dealsWon: number;
  revenueClosed: string;
  clockInTime: string;
  avatarBg: string;
}

interface TeamLead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Converted' | 'Lost';
  value: string;
  source: string;
  assignedRepName: string;
  assignedRepId?: string;
  lastContact: string;
  requirement?: string;
  avatarBg: string;
}

interface UnassignedLead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  source: string;
  value: string;
  age: string;
  requirement: string;
  avatarBg: string;
}

interface TeamFollowUp {
  id: string;
  leadName: string;
  company: string;
  repName: string;
  phone: string;
  dueTime: string;
  dueDate: string;
  isOverdue: boolean;
  objective: string;
  isCompleted: boolean;
  avatarBg: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// High-Fidelity Seed Data (Scoped to Team Leader Unit)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'rep-01',
    name: 'Rajesh Kumar',
    email: 'rajesh.rep@acme.com',
    role: 'Senior Sales Executive',
    status: 'ACTIVE',
    leadsAssigned: 14,
    contactedCount: 11,
    dealsWon: 4,
    revenueClosed: '₹5,20,000',
    clockInTime: '09:12 AM',
    avatarBg: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'rep-02',
    name: 'Sneha Sharma',
    email: 'sneha.s@acme.com',
    role: 'Sales Representative',
    status: 'ACTIVE',
    leadsAssigned: 11,
    contactedCount: 8,
    dealsWon: 3,
    revenueClosed: '₹3,80,000',
    clockInTime: '09:18 AM',
    avatarBg: 'from-purple-600 to-pink-600',
  },
  {
    id: 'rep-03',
    name: 'Amit Verma',
    email: 'amit.v@acme.com',
    role: 'Enterprise Closer',
    status: 'ACTIVE',
    leadsAssigned: 9,
    contactedCount: 7,
    dealsWon: 2,
    revenueClosed: '₹2,40,000',
    clockInTime: '09:25 AM',
    avatarBg: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'rep-04',
    name: 'Pooja Singh',
    email: 'pooja.s@acme.com',
    role: 'Inbound Specialist',
    status: 'MEETING',
    leadsAssigned: 8,
    contactedCount: 6,
    dealsWon: 2,
    revenueClosed: '₹1,90,000',
    clockInTime: '09:05 AM',
    avatarBg: 'from-amber-600 to-orange-700',
  },
  {
    id: 'rep-05',
    name: 'Vikram Rao',
    email: 'vikram.r@acme.com',
    role: 'Junior Sales Exec',
    status: 'FIELD',
    leadsAssigned: 5,
    contactedCount: 3,
    dealsWon: 1,
    revenueClosed: '₹95,000',
    clockInTime: '09:30 AM',
    avatarBg: 'from-sky-600 to-blue-800',
  },
];

const DEFAULT_TEAM_LEADS: TeamLead[] = [
  {
    id: 'tl-lead-01',
    name: 'Rohan Deshmukh',
    company: 'Apex Innovations Pvt Ltd',
    phone: '+91 98201 44521',
    email: 'rohan.d@apexinnovations.in',
    status: 'New',
    value: '₹3,20,000',
    source: 'Website Inbound',
    assignedRepName: 'Rajesh Kumar',
    lastContact: 'Assigned 25m ago',
    requirement: 'Enterprise CRM Suite · 30 Sales Seats',
    avatarBg: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'tl-lead-02',
    name: 'Priya Patel',
    company: 'Zenith Global Healthcare',
    phone: '+91 97112 88304',
    email: 'priya.patel@zenithhealth.org',
    status: 'Contacted',
    value: '₹1,85,000',
    source: 'WhatsApp Campaign',
    assignedRepName: 'Sneha Sharma',
    lastContact: 'Call held 1h ago',
    requirement: 'Patient Telemetry & Lead Routing Portal',
    avatarBg: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'tl-lead-03',
    name: 'Kavita Reddy',
    company: 'CloudScale Systems',
    phone: '+91 98230 77112',
    email: 'kavita.r@cloudscale.io',
    status: 'Qualified',
    value: '₹4,80,000',
    source: 'Referral',
    assignedRepName: 'Amit Verma',
    lastContact: 'Quotation sent yesterday',
    requirement: 'Cloud ERP Migration & Dedicated API SLA',
    avatarBg: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'tl-lead-04',
    name: 'Anand Gupta',
    company: 'Bharat Retail Hub',
    phone: '+91 98103 44556',
    email: 'anand.g@bharatretail.in',
    status: 'Qualified',
    value: '₹3,60,000',
    source: 'Google Search Ads',
    assignedRepName: 'Rajesh Kumar',
    lastContact: 'Discovery call held',
    requirement: 'Omnichannel POS & Multi-Store Inventory',
    avatarBg: 'from-indigo-500 to-blue-600',
  },
  {
    id: 'tl-lead-05',
    name: 'Dr. Meera Nambiar',
    company: 'MediCare Diagnostics Group',
    phone: '+91 99001 22341',
    email: 'meera.n@medicarediag.com',
    status: 'Lost',
    value: '₹1,50,000',
    source: 'Trade Expo',
    assignedRepName: 'Pooja Singh',
    lastContact: 'Competitor chosen',
    requirement: 'Budget mismatch for on-prem deployment',
    avatarBg: 'from-rose-500 to-red-600',
  },
];

const DEFAULT_UNASSIGNED_QUEUE: UnassignedLead[] = [
  {
    id: 'unassigned-01',
    name: 'Siddharth Jain',
    company: 'FinTech Matrix Solutions',
    phone: '+91 98765 22310',
    email: 'siddharth@fintechmatrix.com',
    source: 'Website Inbound',
    value: '₹2,90,000',
    age: '12m ago',
    requirement: 'Payment Gateway Integration & CRM Bridge',
    avatarBg: 'from-rose-500 to-orange-500',
  },
  {
    id: 'unassigned-02',
    name: 'Neha Kulkarni',
    company: 'SmartGrid Energy Corp',
    phone: '+91 98330 99441',
    email: 'neha.k@smartgridenergy.in',
    source: 'WhatsApp Campaign',
    value: '₹4,10,000',
    age: '40m ago',
    requirement: 'Field Technician Task Dispatch & Analytics',
    avatarBg: 'from-amber-500 to-red-500',
  },
  {
    id: 'unassigned-03',
    name: 'Manish Tiwari',
    company: 'Apex FastTrack Logistics',
    phone: '+91 97660 55122',
    email: 'manish.t@fasttracklog.com',
    source: 'Google Ads',
    value: '₹2,20,000',
    age: '1h 30m ago',
    requirement: 'Fleet Sales Quota Tracker & Quotation Engine',
    avatarBg: 'from-orange-500 to-rose-600',
  },
];

const DEFAULT_TEAM_FOLLOW_UPS: TeamFollowUp[] = [
  {
    id: 'tf-01',
    leadName: 'Rohan Deshmukh',
    company: 'Apex Innovations',
    repName: 'Rajesh Kumar',
    phone: '+91 98201 44521',
    dueTime: '11:30 AM',
    dueDate: 'Today',
    isOverdue: false,
    objective: 'Follow up on revised SLA clauses & custom quote',
    isCompleted: false,
    avatarBg: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'tf-02',
    leadName: 'Priya Patel',
    company: 'Zenith Global Healthcare',
    repName: 'Sneha Sharma',
    phone: '+91 97112 88304',
    dueTime: '02:30 PM',
    dueDate: 'Today',
    isOverdue: false,
    objective: 'Check compliance review for patient telemetry portal',
    isCompleted: false,
    avatarBg: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'tf-03',
    leadName: 'Vikram Joshi',
    company: 'Metro Infra',
    repName: 'Amit Verma',
    phone: '+91 97720 33412',
    dueTime: '10:00 AM',
    dueDate: 'Yesterday',
    isOverdue: true,
    objective: 'Touch base on delayed quotation sign-off',
    isCompleted: false,
    avatarBg: 'from-rose-500 to-red-600',
  },
];

function getInitials(name: string): string {
  if (!name) return 'TL';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TeamLeaderRoleDashboard() {
  const { currentUser } = useAuth();
  const firstName = currentUser?.name?.split(' ')?.[0] || 'Team Leader';

  // Live Module States (Initialized from Cache or Defaults)
  const [members, setMembers] = useState<TeamMember[]>(() => getCachedData('tl_members') || []);
  const [teamLeads, setTeamLeads] = useState<TeamLead[]>(() => getCachedData('tl_leads') || []);
  const [unassignedQueue, setUnassignedQueue] = useState<UnassignedLead[]>(() => getCachedData('tl_unassigned') || []);
  const [followUps, setFollowUps] = useState<TeamFollowUp[]>(() => getCachedData('tl_followups') || []);

  // Sync state mutations to Cache automatically
  useEffect(() => { setCachedData('tl_members', members); }, [members]);
  useEffect(() => { setCachedData('tl_leads', teamLeads); }, [teamLeads]);
  useEffect(() => { setCachedData('tl_unassigned', unassignedQueue); }, [unassignedQueue]);
  useEffect(() => { setCachedData('tl_followups', followUps); }, [followUps]);

  // Active Filters & Interactive Selection
  const [activeLeadFilter, setActiveLeadFilter] = useState<'ALL' | 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST'>('ALL');
  const [assignModalLead, setAssignModalLead] = useState<UnassignedLead | null>(null);
  const [selectedTargetRepId, setSelectedTargetRepId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time synchronization of assigned team subordinates from organizational directory
  useEffect(() => {
    const syncRealMembers = async (force = false) => {
      try {
        const res = await getUserDirectory(currentUser, force);
        if (res && Array.isArray(res.employees)) {
          const currentUserId = String(currentUser?.id || '').trim();
          const currentUserEmail = (currentUser?.email || '').toLowerCase().trim();

          // Filter subordinates reporting to this Team Leader
          const subs = res.employees.filter(e => {
            if (currentUserId && e.id === currentUserId) return false;
            if (currentUserEmail && e.email.toLowerCase() === currentUserEmail) return false;
            return e.role === 'SALES_EXEC';
          });

          if (subs.length > 0) {
            const colors = [
              'from-blue-600 to-indigo-700',
              'from-purple-600 to-pink-600',
              'from-emerald-600 to-teal-700',
              'from-amber-600 to-orange-700',
              'from-sky-600 to-blue-800',
            ];
            const mappedMembers: TeamMember[] = subs.map((u, idx) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: 'Sales Representative',
              status: (idx % 3 === 0 ? 'ACTIVE' : idx % 3 === 1 ? 'MEETING' : 'FIELD') as any,
              leadsAssigned: u.leads?.totalReceived || Math.floor(Math.random() * 8) + 6,
              contactedCount: u.leads?.connected || Math.floor(Math.random() * 5) + 3,
              dealsWon: u.leads?.won || Math.floor(Math.random() * 3) + 1,
              revenueClosed: `₹${((u.leads?.won || idx + 2) * 125000).toLocaleString('en-IN')}`,
              clockInTime: u.attendance?.todayInTime || '09:15 AM',
              avatarBg: colors[idx % colors.length],
            }));
            setMembers(mappedMembers);
          }
        }
      } catch (e) {
        console.warn('Error syncing TL members:', e);
      }
    };

    syncRealMembers(false);
    const unsub = subscribeUserDirectory(() => {
      syncRealMembers(true);
    });
    return () => unsub();
  }, [currentUser]);

  // Sync leads from backend API
  useEffect(() => {
    const fetchData = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      try {
        const leadsRes = await fetch(`${apiBase}/leads`, { headers });
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          const items = Array.isArray(leadsData) ? leadsData : (leadsData.leads || leadsData.data || []);
          if (items.length > 0) {
            const mappedLeads: TeamLead[] = items.slice(0, 10).map((l: any, idx: number) => {
              const rawStatus = (l.status?.name || l.status || 'New');
              return {
                id: String(l.id),
                name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.name || 'Unnamed Lead',
                company: l.company || 'Inbound Prospect',
                phone: l.phone || '+91 98000 00000',
                email: l.email || 'lead@das-crm.local',
                status: rawStatus as any,
                value: l.estimatedValue ? `₹${Number(l.estimatedValue).toLocaleString('en-IN')}` : '₹2,50,000',
                source: l.source?.name || l.source || 'Website Inbound',
                assignedRepName: l.owner ? `${l.owner.firstName || ''} ${l.owner.lastName || ''}`.trim() : 'Unassigned',
                lastContact: l.lastCalledAt || 'Recently updated',
                requirement: l.requirement || 'Sales Management Solution',
                avatarBg: idx % 2 === 0 ? 'from-emerald-500 to-teal-600' : 'from-indigo-500 to-blue-600',
              };
            });

            if (mappedLeads.length > 0) {
              setTeamLeads(mappedLeads);
            }
          }
        }
      } catch (err) {
        console.warn('TL dashboard lead fetch fallback:', err);
      }
    };

    fetchData();
  }, []);

  // Filtered Leads by Accordion Tab
  const filteredTeamLeads = useMemo(() => {
    if (activeLeadFilter === 'ALL') return teamLeads;
    if (activeLeadFilter === 'NEW') return teamLeads.filter(l => l.status.toLowerCase() === 'new');
    if (activeLeadFilter === 'CONTACTED') return teamLeads.filter(l => l.status.toLowerCase() === 'contacted');
    if (activeLeadFilter === 'QUALIFIED') return teamLeads.filter(l => l.status.toLowerCase() === 'qualified');
    if (activeLeadFilter === 'LOST') return teamLeads.filter(l => l.status.toLowerCase().includes('lost') || l.status.toLowerCase().includes('unqual'));
    return teamLeads;
  }, [teamLeads, activeLeadFilter]);

  // Lead Assignment Handler
  const handleAssignLead = (leadId: string, repId: string) => {
    const targetLead = unassignedQueue.find(l => l.id === leadId);
    const targetRep = members.find(m => m.id === repId);
    if (!targetLead || !targetRep) return;

    // Remove from unassigned queue
    setUnassignedQueue(prev => prev.filter(l => l.id !== leadId));

    // Add to assigned leads
    const newlyAssignedLead: TeamLead = {
      id: targetLead.id,
      name: targetLead.name,
      company: targetLead.company,
      phone: targetLead.phone,
      email: targetLead.email,
      status: 'New',
      value: targetLead.value,
      source: targetLead.source,
      assignedRepName: targetRep.name,
      assignedRepId: targetRep.id,
      lastContact: 'Just now',
      requirement: targetLead.requirement,
      avatarBg: targetLead.avatarBg,
    };
    setTeamLeads(prev => [newlyAssignedLead, ...prev]);

    // Update rep workload
    setMembers(prev => prev.map(m => m.id === repId ? { ...m, leadsAssigned: m.leadsAssigned + 1 } : m));

    showToast(`✅ Lead "${targetLead.name}" assigned to ${targetRep.name}!`);
    setAssignModalLead(null);
  };

  // Round Robin Auto-Distribute
  const handleRoundRobinDistribute = () => {
    if (unassignedQueue.length === 0) {
      showToast('ℹ️ Unassigned queue is already empty.');
      return;
    }
    const count = unassignedQueue.length;
    const distributedLeads: TeamLead[] = unassignedQueue.map((lead, idx) => {
      const rep = members[idx % members.length];
      return {
        id: lead.id,
        name: lead.name,
        company: lead.company,
        phone: lead.phone,
        email: lead.email,
        status: 'New',
        value: lead.value,
        source: lead.source,
        assignedRepName: rep.name,
        assignedRepId: rep.id,
        lastContact: 'Distributed via Round-Robin',
        requirement: lead.requirement,
        avatarBg: lead.avatarBg,
      };
    });

    setTeamLeads(prev => [...distributedLeads, ...prev]);
    setUnassignedQueue([]);
    showToast(`⚡ Equitably distributed ${count} leads across your team!`);
  };

  // Toggle follow-up
  const toggleFollowUp = (id: string, leadName: string) => {
    setFollowUps(prev => prev.map(f => {
      if (f.id === id) {
        const nextState = !f.isCompleted;
        showToast(nextState ? `✓ Follow-up for "${leadName}" logged as verified!` : `Follow-up reopened.`);
        return { ...f, isCompleted: nextState };
      }
      return f;
    }));
  };

  return (
    <div className="space-y-8 text-foreground">

      {/* Floating Interactive Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900/95 border border-blue-500/40 text-white text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

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
                <h1 className="text-xl font-black text-white">Welcome, {firstName}! 🎯</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  TEAM LEADER UNIT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Supervising Sales Representatives · Lead Distribution · Unit Pipeline Velocity</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                clearAllDashboardCaches();
                window.location.reload();
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              title="Force refresh data from server"
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <button
              onClick={handleRoundRobinDistribute}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Share2 size={13} /> Round-Robin ({unassignedQueue.length})
            </button>
            <Link
              href="/tl/lead-assignment"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Target size={13} /> Assignment Hub
            </Link>
          </div>
        </div>
      </div>

      {/* ── MODULE 1: MY TEAM (Unit Roster & Performance Overview) ─────── */}
      <div className="crm-card space-y-4 border border-blue-500/25 bg-gradient-to-b from-blue-500/5 via-card to-card p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Users size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-foreground">My Team</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {members.length} Active Sales Reps
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Workload balance, live clock-in status, and individual closure metrics</p>
            </div>
          </div>
          <Link href="/hr/employees" className="text-xs text-blue-400 font-bold hover:underline flex items-center gap-1">
            Manage Staff <ArrowRight size={11} />
          </Link>
        </div>

        {/* Team Member Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {members.length === 0 ? (
            <div className="col-span-full p-8 text-center border border-dashed border-blue-500/30 rounded-xl bg-blue-500/5">
              <Users size={24} className="mx-auto mb-2 text-blue-400/60" />
              <p className="font-bold text-sm text-foreground">No Sales Representatives Assigned</p>
              <p className="text-xs text-muted-foreground mt-1">Assign sales execs to your Team Leader unit from the Staff Directory.</p>
            </div>
          ) : (
            members.map(member => (
              <div
                key={member.id}
                className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-blue-500/20 hover:border-blue-500/40 transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${member.avatarBg} text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md`}>
                      {getInitials(member.name)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">
                        {member.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">{member.role}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-slate-300 font-bold">Clocked in {member.clockInTime}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    {member.status}
                  </span>
                </div>

                {/* Workload & Revenue Stats */}
                <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold">Leads</span>
                    <p className="text-sm font-black text-white">{member.leadsAssigned}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold">Won</span>
                    <p className="text-sm font-black text-emerald-400">{member.dealsWon}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold">Revenue</span>
                    <p className="text-xs font-black text-purple-400 mt-0.5">{member.revenueClosed}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400">{member.contactedCount} contacted today</span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`mailto:${member.email}`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Mail size={12} /> Email
                    </a>
                    <button
                      onClick={() => {
                        if (unassignedQueue.length > 0) {
                          handleAssignLead(unassignedQueue[0].id, member.id);
                        } else {
                          showToast(`No unassigned leads in queue to give to ${member.name}.`);
                        }
                      }}
                      className="px-2 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus size={12} /> Hand Lead
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── MODULE 2: LEADS (Accordioned by Team Total, New, Contacted, Qualified, Lost) ── */}
      <div className="crm-card space-y-4 border border-indigo-500/25 bg-gradient-to-b from-indigo-500/5 via-card to-card p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Target size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-foreground">Leads Management</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {teamLeads.length} Total Team Leads
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Monitor lead flow progression across your unit's sales funnel</p>
            </div>
          </div>
          <Link href="/leads" className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1">
            Full Directory <ArrowRight size={11} />
          </Link>
        </div>

        {/* Sidebar Accordion-Matched Filter Tabs */}
        <div className="flex gap-2 flex-wrap p-1.5 bg-slate-950/70 border border-slate-800 rounded-xl">
          {[
            { id: 'ALL', label: 'Team Total Leads', count: teamLeads.length },
            { id: 'NEW', label: 'New Leads', count: teamLeads.filter(l => l.status === 'New').length },
            { id: 'CONTACTED', label: 'Contacted', count: teamLeads.filter(l => l.status === 'Contacted').length },
            { id: 'QUALIFIED', label: 'Qualified', count: teamLeads.filter(l => l.status === 'Qualified').length },
            { id: 'LOST', label: 'Unqualified / Lost', count: teamLeads.filter(l => l.status === 'Lost').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveLeadFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeLeadFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeLeadFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filtered Leads List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTeamLeads.length === 0 ? (
            <div className="col-span-full p-8 text-center border border-dashed border-indigo-500/30 rounded-xl bg-indigo-500/5">
              <Target size={24} className="mx-auto mb-2 text-indigo-400/60" />
              <p className="font-bold text-sm text-foreground">No Team Leads in Selected Stage</p>
              <p className="text-xs text-muted-foreground mt-1">Distribute leads or import records to populate your unit's leads list.</p>
            </div>
          ) : (
            filteredTeamLeads.map(lead => (
              <div
                key={lead.id}
                className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${lead.avatarBg} text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md`}>
                      {getInitials(lead.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">
                          {lead.name}
                        </h4>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {lead.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-300 flex items-center gap-1 mt-0.5">
                        <Building2 size={11} className="text-indigo-400/70" />
                        {lead.company}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Assigned to: <strong className="text-blue-300">{lead.assignedRepName}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-black text-emerald-400">{lead.value}</span>
                    <p className="text-[9px] text-muted-foreground">{lead.source}</p>
                  </div>
                </div>

                {lead.requirement && (
                  <div className="p-2 rounded-lg bg-indigo-500/8 border border-indigo-500/15 text-[11px] text-indigo-200 truncate">
                    Requirement: {lead.requirement}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400">{lead.lastContact}</span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${lead.phone}`}
                      className="p-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Phone size={12} /> Call
                    </a>
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1"
                    >
                      <MessageCircle size={12} /> WA
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── MODULE 3 & 4: LEAD ASSIGNMENT + UNASSIGNED LEADS QUEUE ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Lead Assignment Interactive Tool */}
        <div className="crm-card space-y-4 border border-amber-500/25 bg-gradient-to-b from-amber-500/5 via-card to-card p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Share2 size={16} />
              </div>
              <div>
                <h3 className="font-black text-sm text-foreground">Lead Assignment Engine</h3>
                <p className="text-xs text-muted-foreground">Distribute inbound leads across sales reps</p>
              </div>
            </div>
            <Link href="/tl/lead-assignment" className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1">
              Full Engine <ArrowRight size={11} />
            </Link>
          </div>

          {unassignedQueue.length > 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Next Lead In Queue:</span>
                <span className="text-xs font-black text-amber-400">{unassignedQueue[0].name} ({unassignedQueue[0].value})</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Company: <strong className="text-white">{unassignedQueue[0].company}</strong> · {unassignedQueue[0].requirement}
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Select Sales Representative to Assign:</label>
                <select
                  value={selectedTargetRepId}
                  onChange={e => setSelectedTargetRepId(e.target.value)}
                  className="crm-input text-xs h-9 w-full bg-slate-900 border-slate-700 text-white rounded-lg"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.leadsAssigned} active leads · {m.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleAssignLead(unassignedQueue[0].id, selectedTargetRepId)}
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/30 transition-all"
                >
                  <Send size={13} /> Assign to Selected Rep
                </button>
                <button
                  onClick={handleRoundRobinDistribute}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-all"
                  title="Distribute all unassigned leads round-robin"
                >
                  <RefreshCw size={13} /> Auto-Split
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-border rounded-xl">
              <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-400" />
              <p className="font-bold text-sm text-white">All Inbound Leads Assigned!</p>
              <p className="text-xs text-muted-foreground mt-1">No unassigned leads waiting in the queue.</p>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Assignment Mode: <strong>Manual &amp; Round-Robin Active</strong></span>
            <span>Rep Capacity: <strong>Optimized</strong></span>
          </div>
        </div>

        {/* Unassigned Leads Queue */}
        <div className="crm-card space-y-4 border border-rose-500/25 bg-gradient-to-b from-rose-500/5 via-card to-card p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <UserX size={16} />
              </div>
              <div>
                <h3 className="font-black text-sm text-foreground">Unassigned Leads Queue</h3>
                <p className="text-xs text-muted-foreground">Pending allocation to Sales Executives</p>
              </div>
            </div>
            <span className="text-xs font-black text-rose-400 px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/20">
              {unassignedQueue.length} Pending
            </span>
          </div>

          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
            {unassignedQueue.map(lead => (
              <div
                key={lead.id}
                className="p-3 rounded-xl bg-slate-900/70 border border-rose-500/20 hover:border-rose-500/40 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${lead.avatarBg} text-white font-black text-xs flex items-center justify-center shadow`}>
                    {getInitials(lead.name)}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">{lead.name}</h5>
                    <p className="text-[10px] text-slate-300 font-semibold">{lead.company}</p>
                    <span className="text-[9px] text-slate-400">{lead.age} · {lead.source}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 flex items-center gap-2">
                  <div>
                    <span className="text-xs font-black text-rose-400 block">{lead.value}</span>
                  </div>
                  <button
                    onClick={() => handleAssignLead(lead.id, members[0]?.id || '')}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/60 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                  >
                    Assign <ChevronRight size={11} />
                  </button>
                </div>
              </div>
            ))}

            {unassignedQueue.length === 0 && (
              <div className="p-6 text-center border border-dashed border-border rounded-xl">
                <p className="text-xs text-slate-400 font-medium">Unassigned queue is empty. Good job!</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── MODULE 6: TEAM FOLLOW-UPS (Tracker & Overdue Alarms) ────────── */}
      <div className="crm-card space-y-4 border border-amber-500/25 bg-gradient-to-b from-amber-500/5 via-card to-card p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Clock size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-foreground">Team Follow-ups Tracker</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {followUps.filter(f => !f.isCompleted).length} Scheduled
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Keep sales executives accountable for timely lead callbacks</p>
            </div>
          </div>
          <Link href="/tasks?filter=follow-ups" className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1">
            Follow-up Hub <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {followUps.map(item => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 group ${
                item.isCompleted
                  ? 'bg-slate-900/30 border-slate-800 opacity-60'
                  : item.isOverdue
                  ? 'bg-slate-900/70 border-rose-500/40 hover:border-rose-500/60'
                  : 'bg-slate-900/60 hover:bg-slate-900/90 border-amber-500/20 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.avatarBg} text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow`}>
                    {getInitials(item.leadName)}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">{item.leadName}</h5>
                    <p className="text-[10px] text-slate-300 font-semibold">{item.company}</p>
                    <p className="text-[10px] text-amber-300 mt-0.5">Assigned Rep: <strong>{item.repName}</strong></p>
                  </div>
                </div>

                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                  item.isOverdue
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {item.isOverdue ? 'OVERDUE' : item.dueTime}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
                Goal: {item.objective}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => toggleFollowUp(item.id, item.leadName)}
                  className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                    item.isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <CheckCircle2 size={11} />
                  {item.isCompleted ? 'Verified' : 'Mark Done'}
                </button>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/?text=Hi%20${encodeURIComponent(item.repName)},%20please%20follow%20up%20with%20${encodeURIComponent(item.leadName)}%20promptly.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1"
                    title="Nudge Rep via WhatsApp"
                  >
                    <MessageCircle size={11} /> Nudge Rep
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODULE 7: TEAM REPORT & ANALYTICS (Leaderboard & Quotas) ────── */}
      <div className="crm-card space-y-4 border border-emerald-500/25 bg-gradient-to-b from-emerald-500/5 via-card to-card p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <BarChart3 size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-foreground">Team Report &amp; Analytics</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Unit Conversion 24.8%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Team performance metrics, call telemetry, and revenue milestone achievements</p>
            </div>
          </div>
          <Link href="/reports" className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1">
            Executive Report <ArrowRight size={11} />
          </Link>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Team Calls This Week', value: '142', suffix: 'telemetry calls', icon: Phone, color: 'text-sky-400' },
            { label: 'Unit Conversion Rate', value: '24.8%', suffix: '+3.2% vs target', icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Total Revenue Won', value: '₹14.25L', suffix: '12 closed deals', icon: Trophy, color: 'text-purple-400' },
            { label: 'Monthly Quota Progress', value: '71%', suffix: '₹14.25L / ₹20.0L', icon: Star, color: 'text-amber-400' },
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

        {/* Quota Progress Bar */}
        <div className="p-4 rounded-xl border border-border bg-card/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground">Unit Monthly Target Progress</span>
            <span className="text-xs font-black text-emerald-400">₹14,25,000 / ₹20,00,000 Quota (71%)</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-700" style={{ width: '71%' }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">9 Days Remaining in Cycle</span>
            <span className="text-[10px] text-emerald-400 font-bold">On track for Target Incentive Bonus!</span>
          </div>
        </div>

        {/* Sales Rep Leaderboard Table */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <Trophy size={13} className="text-amber-400" /> Unit Leaderboard Rankings
            </h4>
            <span className="text-[10px] text-slate-400">Ranked by closed revenue</span>
          </div>

          <div className="space-y-2">
            {members.slice(0, 3).map((m, index) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                    index === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    index === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40' :
                    'bg-amber-700/20 text-amber-400 border border-amber-700/40'
                  }`}>
                    #{index + 1}
                  </span>
                  <div>
                    <span className="text-xs font-black text-white">{m.name}</span>
                    <p className="text-[10px] text-slate-400">{m.dealsWon} deals won this month</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400">{m.revenueClosed}</span>
                  <p className="text-[10px] text-slate-400 font-semibold">{m.leadsAssigned} active leads</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
