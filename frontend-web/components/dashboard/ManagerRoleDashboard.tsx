'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Briefcase, Users, Target, TrendingUp, BarChart3, Shield,
  CheckSquare, ArrowRight, Layers, FileText, Phone, Mail,
  CheckCircle2, AlertTriangle, RefreshCw, UserCheck, UserX,
  Share2, ArrowUpRight, Award, Zap, ChevronRight, Eye,
  Sparkles, Filter, Search, Clock, Calendar, Building2
} from 'lucide-react';
import { useAuth, normalizeRoleStr } from '@/context/AuthContext';
import {
  getUserDirectory,
  subscribeUserDirectory,
  invalidateUserDirectoryCache,
  CachedEmployee,
} from '@/lib/userDirectoryCache';
import { getCachedData, setCachedData } from '@/lib/cacheUtils';

interface DepartmentLead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  value: string;
  numericValue: number;
  source: string;
  assignedRepName: string;
  assignedRepRole: string;
  lastContact: string;
  requirement?: string;
  avatarBg: string;
}

const DEFAULT_DEPT_LEADS: DepartmentLead[] = [
  {
    id: 'mgr-lead-01',
    name: 'Rohan Deshmukh',
    company: 'Apex Innovations Pvt Ltd',
    phone: '+91 98201 44521',
    email: 'rohan.d@apexinnovations.in',
    status: 'Qualified',
    value: '₹3,20,000',
    numericValue: 320000,
    source: 'Website Inbound',
    assignedRepName: 'Sachin Puri',
    assignedRepRole: 'Team Leader',
    lastContact: '15m ago',
    requirement: 'Enterprise CRM Suite · 30 Sales Seats',
    avatarBg: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'mgr-lead-02',
    name: 'Priya Patel',
    company: 'Zenith Global Healthcare',
    phone: '+91 97112 88304',
    email: 'priya.patel@zenithhealth.org',
    status: 'Proposal',
    value: '₹4,85,000',
    numericValue: 485000,
    source: 'WhatsApp Campaign',
    assignedRepName: 'Nandini Rastogi',
    assignedRepRole: 'Sales Exec',
    lastContact: '1h ago',
    requirement: 'Patient Telemetry & Lead Routing Portal',
    avatarBg: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'mgr-lead-03',
    name: 'Kavita Reddy',
    company: 'CloudScale Systems',
    phone: '+91 98230 77112',
    email: 'kavita.r@cloudscale.io',
    status: 'Negotiation',
    value: '₹6,40,000',
    numericValue: 640000,
    source: 'Referral',
    assignedRepName: 'Sulekha Tomar',
    assignedRepRole: 'Sales Exec',
    lastContact: 'Yesterday',
    requirement: 'Cloud ERP Migration & Dedicated API SLA',
    avatarBg: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'mgr-lead-04',
    name: 'Anand Gupta',
    company: 'Bharat Retail Hub',
    phone: '+91 98103 44556',
    email: 'anand.g@bharatretail.in',
    status: 'Won',
    value: '₹5,50,000',
    numericValue: 550000,
    source: 'Google Search Ads',
    assignedRepName: 'Sadhana',
    assignedRepRole: 'Sales Exec',
    lastContact: 'Closed Won',
    requirement: 'Omnichannel POS & Multi-Store Inventory',
    avatarBg: 'from-indigo-500 to-blue-600',
  },
];

function getInitials(name: string): string {
  if (!name) return 'EMP';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ManagerRoleDashboard() {
  const { currentUser, subscription } = useAuth();
  const [employees, setEmployees] = useState<CachedEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deptLeads, setDeptLeads] = useState<DepartmentLead[]>(() => getCachedData('mgr_leads') || []);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TEAM_LEADERS' | 'REPS' | 'LEADS'>('OVERVIEW');
  const [leadFilter, setLeadFilter] = useState<'ALL' | 'NEW' | 'QUALIFIED' | 'WON'>('ALL');

  // Load employee directory scoped to Manager
  const loadDirectory = useCallback(async (force = false) => {
    if (force) setIsRefreshing(true);
    try {
      const res = await getUserDirectory(currentUser, force);
      if (res && Array.isArray(res.employees)) {
        setEmployees(res.employees);
      }
    } catch (e) {
      console.warn('Error loading employee directory in Manager dashboard:', e);
    } finally {
      setLoading(false);
      if (force) setIsRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadDirectory(false);
    const unsub = subscribeUserDirectory(() => {
      loadDirectory(true);
    });
    return () => {
      unsub();
    };
  }, [loadDirectory]);

  // Fetch real leads if available
  useEffect(() => {
    const fetchLeads = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      if (!token) return;
      try {
        const res = await fetch(`${apiBase}/leads?limit=1000`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.leads || data.data || []);
          if (items.length > 0) {
            const colors = [
              'from-emerald-500 to-teal-600',
              'from-teal-500 to-cyan-600',
              'from-purple-500 to-indigo-600',
              'from-indigo-500 to-blue-600',
              'from-amber-500 to-orange-600',
            ];
            const mapped: DepartmentLead[] = items.map((l: any, idx: number) => {
              const rawStatus = l.status?.name || l.status || 'New';
              const numVal = Number(l.estimatedValue) || 250000;
              return {
                id: String(l.id),
                name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.name || 'Unnamed Lead',
                company: l.company || 'Inbound Enterprise',
                phone: l.phone || '+91 98000 00000',
                email: l.email || 'lead@das-crm.local',
                status: rawStatus as any,
                value: l.estimatedValue ? `₹${Number(l.estimatedValue).toLocaleString('en-IN')}` : '₹2,50,000',
                numericValue: numVal,
                source: l.source?.name || l.source || 'Website Inbound',
                assignedRepName: l.owner ? `${l.owner.firstName || ''} ${l.owner.lastName || ''}`.trim() : 'Unassigned',
                assignedRepRole: l.owner?.role || 'Sales Rep',
                lastContact: l.lastCalledAt || 'Recently updated',
                requirement: l.requirement || l.notes || l.customFields?.col_requirement || l.customFields?.requirement || '—',
                avatarBg: colors[idx % colors.length],
              };
            });
            const finalDeptLeads = [
              DEFAULT_DEPT_LEADS[0],
              ...mapped.filter((l: any) => l.id !== DEFAULT_DEPT_LEADS[0].id),
            ];
            setDeptLeads(finalDeptLeads);
            setCachedData('mgr_leads', finalDeptLeads);
          } else {
            setDeptLeads(DEFAULT_DEPT_LEADS);
          }
        } else {
          setDeptLeads(DEFAULT_DEPT_LEADS);
        }
      } catch (_) {
        setDeptLeads(DEFAULT_DEPT_LEADS);
      }
    };
    fetchLeads();
  }, []);

  const handleManualRefresh = async () => {
    invalidateUserDirectoryCache();
    await loadDirectory(true);
  };

  // Extract subordinates hierarchy
  const currentUserId = String(currentUser?.id || '').trim();
  const currentUserEmail = (currentUser?.email || '').toLowerCase().trim();
  const currentUserName = (currentUser?.name || '').toLowerCase().trim();

  // All subordinates excluding self
  const subordinates = useMemo(() => {
    return employees.filter(e => {
      if (currentUserId && e.id === currentUserId) return false;
      if (currentUserEmail && e.email.toLowerCase() === currentUserEmail) return false;
      return e.role !== 'ADMIN' && e.role !== 'UNASSIGNED';
    });
  }, [employees, currentUserId, currentUserEmail]);

  // Team Leaders reporting under Manager
  const teamLeaders = useMemo(() => {
    return subordinates.filter(e => e.role === 'TEAM_LEADER');
  }, [subordinates]);

  // Direct Sales Reps reporting directly to Manager
  const directReps = useMemo(() => {
    return subordinates.filter(e => {
      if (e.role !== 'SALES_EXEC') return false;
      if (!e.assignedManager) return true;
      const mgr = e.assignedManager.toLowerCase().trim();
      const isDirectToManager =
        mgr.includes(currentUserName) ||
        (currentUserEmail && mgr.includes(currentUserEmail)) ||
        mgr === 'admin' ||
        mgr.includes('direct');
      return isDirectToManager;
    });
  }, [subordinates, currentUserName, currentUserEmail]);

  // Total Sales Execs across all units
  const allSalesReps = useMemo(() => {
    return subordinates.filter(e => e.role === 'SALES_EXEC');
  }, [subordinates]);

  // Helper to find reps under a specific Team Leader
  const getRepsUnderTL = useCallback((tl: CachedEmployee) => {
    const tlName = tl.name.toLowerCase().trim();
    const tlEmail = (tl.email || '').toLowerCase().trim();
    const tlId = tl.id.toLowerCase().trim();

    return allSalesReps.filter(rep => {
      if (rep.managerId && rep.managerId === tl.id) return true;
      if (!rep.assignedManager) return false;
      const assigned = rep.assignedManager.toLowerCase().trim();
      return (
        assigned.includes(tlName) ||
        (tlEmail && assigned.includes(tlEmail)) ||
        assigned === tlId
      );
    });
  }, [allSalesReps]);

  // Dynamic KPI Metrics
  const totalSubordinateCount = subordinates.length;
  const totalWonRevenue = useMemo(() => {
    const wonLeads = deptLeads.filter(l => l.status.toLowerCase() === 'won' || l.status.toLowerCase().includes('convert'));
    return wonLeads.reduce((acc, l) => acc + l.numericValue, 0);
  }, [deptLeads]);

  const conversionRate = useMemo(() => {
    if (deptLeads.length === 0) return '0.0%';
    const wonCount = deptLeads.filter(l => l.status.toLowerCase() === 'won' || l.status.toLowerCase().includes('convert')).length;
    const rate = ((wonCount / deptLeads.length) * 100).toFixed(1);
    return `${rate}%`;
  }, [deptLeads]);

  const openLeadsCount = useMemo(() => {
    return deptLeads.filter(l => l.status.toLowerCase() !== 'won' && !l.status.toLowerCase().includes('lost')).length;
  }, [deptLeads]);

  // Has Scenario A (Team Leaders present)
  const isScenarioA = teamLeaders.length > 0;

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    if (leadFilter === 'ALL') return deptLeads;
    if (leadFilter === 'NEW') return deptLeads.filter(l => l.status.toLowerCase() === 'new');
    if (leadFilter === 'QUALIFIED') return deptLeads.filter(l => l.status.toLowerCase() === 'qualified' || l.status.toLowerCase() === 'proposal');
    if (leadFilter === 'WON') return deptLeads.filter(l => l.status.toLowerCase() === 'won');
    return deptLeads;
  }, [deptLeads, leadFilter]);

  return (
    <div className="space-y-6 text-foreground animate-fade-in">
      {/* ── HEADER BANNER ── */}
      <div className="crm-card p-6 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-950/20 via-card to-card rounded-2xl shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-black text-lg flex items-center justify-center shadow-md">
              {currentUser?.name ? getInitials(currentUser.name) : 'DM'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-foreground">Welcome, {currentUser?.name || 'Department Manager'}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  DEPARTMENT MANAGER
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Hierarchy Synced
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manager Operations &amp; Performance Hub ·{' '}
                <strong className="text-purple-400">
                  {isScenarioA
                    ? `Scenario A (${teamLeaders.length} Team Leader${teamLeaders.length > 1 ? 's' : ''} + ${allSalesReps.length} Sales Reps)`
                    : `Scenario B (${allSalesReps.length} Direct Sales Reps)`}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="btn-secondary text-xs gap-1.5 flex items-center px-3 py-2 cursor-pointer disabled:opacity-50"
              title="Refresh Hierarchy & Lead Analytics"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-purple-400' : ''} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Directory'}</span>
            </button>
            <Link href="/hr/employees" className="btn-secondary text-xs gap-1.5 flex items-center px-3 py-2">
              <Users size={13} /> Staff Directory
            </Link>
            <Link href="/pipeline" className="btn-secondary text-xs gap-1.5 flex items-center px-3 py-2">
              <Target size={13} /> Lead Pipeline
            </Link>
            <Link href="/reports" className="btn-primary text-xs gap-1.5 flex items-center px-3 py-2">
              <BarChart3 size={13} /> Work Reports
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Department Revenue */}
        <div className="crm-card p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/5 via-card to-card space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Department Revenue</span>
            <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400"><TrendingUp size={14} /></span>
          </div>
          <p className="text-2xl font-black text-purple-400">₹{(totalWonRevenue / 100000).toFixed(2)}L</p>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <CheckCircle2 size={12} />
            <span>Closed Won &amp; Active Deals</span>
          </div>
        </div>

        {/* Card 2: Total Supervised Employees */}
        <div className="crm-card p-5 rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/5 via-card to-card space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Supervised Staff</span>
            <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400"><Users size={14} /></span>
          </div>
          <p className="text-2xl font-black text-white">
            {totalSubordinateCount} {totalSubordinateCount === 1 ? 'Member' : 'Members'}
          </p>
          <p className="text-[11px] text-indigo-300 font-medium">
            {teamLeaders.length > 0 ? `${teamLeaders.length} TL${teamLeaders.length > 1 ? 's' : ''} · ` : ''}
            {allSalesReps.length} Sales Rep{allSalesReps.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Card 3: Deals Conversion Rate */}
        <div className="crm-card p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 via-card to-card space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Conversion Rate</span>
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400"><Award size={14} /></span>
          </div>
          <p className="text-2xl font-black text-emerald-400">{conversionRate}</p>
          <p className="text-[11px] text-emerald-400/80 font-medium">Unit Win Efficiency</p>
        </div>

        {/* Card 4: Open Leads Queue */}
        <div className="crm-card p-5 rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-500/5 via-card to-card space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Active Department Leads</span>
            <span className="p-1 rounded-lg bg-sky-500/10 text-sky-400"><Target size={14} /></span>
          </div>
          <p className="text-2xl font-black text-sky-400">{openLeadsCount} Leads</p>
          <p className="text-[11px] text-sky-300 font-medium">Allocated across unit staff</p>
        </div>
      </div>

      {/* ── SUBORDINATES & TEAM LEADER UNITS OVERVIEW ── */}
      <div className="crm-card p-6 border border-border rounded-2xl space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border/60 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Users className="text-purple-400" size={18} />
              {isScenarioA ? 'Team Leader Units & Supervised Reps (Scenario A)' : 'Direct Sales Team Overview (Scenario B)'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live hierarchy reflecting staff verified and assigned under your managerial supervision.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/hr/employees"
              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition-colors"
            >
              Manage &amp; Assign in Staff Directory <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* If no subordinates assigned yet */}
        {totalSubordinateCount === 0 && !loading && (
          <div className="p-10 text-center border-2 border-dashed border-purple-500/30 bg-purple-500/5 rounded-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
              <UserX size={28} />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">No Subordinate Staff Assigned Yet</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                You currently have no Team Leaders or Sales Representatives assigned under your reporting tree.
                Open the Staff Directory to assign employees under your department.
              </p>
            </div>
            <Link
              href="/hr/employees"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-lg transition-all"
            >
              <Users size={14} /> Open Staff Directory &amp; Assign Staff →
            </Link>
          </div>
        )}

        {/* Scenario A: Display Team Leader Cards with Reps under each */}
        {isScenarioA && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamLeaders.map(tl => {
              const repsUnderTL = getRepsUnderTL(tl);
              return (
                <div
                  key={tl.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-purple-500/30 hover:border-purple-500/60 transition-all space-y-4 shadow-sm"
                >
                  {/* TL Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                        {getInitials(tl.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white">{tl.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            👑 TEAM LEADER
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Reporting Under: <strong className="text-purple-300">{tl.assignedManager || 'Aditya Kumar Rai (Manager)'}</strong>
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/hr/employees"
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 font-bold flex items-center gap-1 transition-all"
                    >
                      <Eye size={11} /> Inspect
                    </Link>
                  </div>

                  {/* Contact Info */}
                  <div className="text-xs text-slate-300 space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1"><Mail size={12} /> Email:</span>
                      <span className="font-mono text-slate-200">{tl.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1"><Phone size={12} /> Phone:</span>
                      <span className="font-mono text-emerald-400">{tl.phone}</span>
                    </div>
                  </div>

                  {/* Subordinate Reps under this TL */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-300 flex items-center gap-1.5">
                        <Users size={13} className="text-amber-400" />
                        Assigned Sales Reps ({repsUnderTL.length}):
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {repsUnderTL.length > 0 ? 'Active in Unit' : 'No reps assigned'}
                      </span>
                    </div>

                    {repsUnderTL.length === 0 ? (
                      <div className="p-3 text-center border border-dashed border-slate-800 rounded-xl">
                        <p className="text-[11px] text-slate-400">No sales reps assigned under {tl.name} yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {repsUnderTL.map(rep => (
                          <div
                            key={rep.id}
                            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 flex items-center gap-2.5 transition-all"
                          >
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center shrink-0">
                              {getInitials(rep.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">{rep.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono truncate">{rep.phone}</p>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                              SALES
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Direct Reps (Scenario B or direct subordinates alongside TLs) */}
        {directReps.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
              <Target size={14} className="text-emerald-400" />
              Direct Sales Representatives ({directReps.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {directReps.map(rep => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-border hover:border-emerald-500/40 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-xs font-bold flex items-center justify-center">
                        {getInitials(rep.name)}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-white">{rep.name}</h4>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          DIRECT REP
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-0.5 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                    <p className="truncate text-slate-400">✉️ {rep.email}</p>
                    <p className="text-emerald-400 font-mono font-medium">📞 {rep.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── DEPARTMENT LEADS ACCORDION & DIRECTORY ── */}
      <div className="crm-card p-6 border border-border rounded-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Target className="text-brand-400" size={18} />
              Department Active Opportunities &amp; Lead Ingestion
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              High-value pipeline and inbound leads assigned to your subordinate sales executives and team leaders.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['ALL', 'NEW', 'QUALIFIED', 'WON'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setLeadFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  leadFilter === tab
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {tab === 'ALL' ? 'All Leads' : tab === 'NEW' ? 'New Inbound' : tab === 'QUALIFIED' ? 'In Negotiation' : 'Closed Won'}
              </button>
            ))}
          </div>
        </div>

        {/* Leads Table / List */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-extrabold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="p-3.5">Lead / Contact</th>
                <th className="p-3.5">Company &amp; Requirement</th>
                <th className="p-3.5">Assigned Staff</th>
                <th className="p-3.5">Estimated Value</th>
                <th className="p-3.5">Pipeline Stage</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Target size={28} className="text-purple-400/40" />
                      <p className="font-bold text-sm text-foreground">No Leads Found in Department Pipeline</p>
                      <p className="text-xs text-muted-foreground">Import leads via Google Sheets / CSV or assign leads to your team reps to populate this view.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => {
                  const statusBadgeColor =
                    lead.status === 'Won'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : lead.status === 'Negotiation' || lead.status === 'Proposal'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : lead.status === 'Qualified'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/40';

                  return (
                    <tr key={lead.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${lead.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                            {getInitials(lead.name)}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{lead.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{lead.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-200">{lead.company}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{lead.requirement}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-indigo-300">{lead.assignedRepName}</p>
                        <span className="text-[10px] text-slate-400">{lead.assignedRepRole}</span>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400 font-mono">
                        {lead.value}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${statusBadgeColor}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href="/leads"
                          className="text-purple-400 hover:text-purple-300 font-bold text-xs inline-flex items-center gap-0.5"
                        >
                          View <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

