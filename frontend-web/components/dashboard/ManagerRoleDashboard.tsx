'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Briefcase, Users, Target, TrendingUp, BarChart3, Shield,
  CheckSquare, ArrowRight, Layers, FileText, Phone, Mail,
  CheckCircle2, AlertTriangle, RefreshCw, UserCheck, UserX,
  Share2, ArrowUpRight, Award, Zap, ChevronRight, Eye,
  Sparkles, Filter, Search, Clock, Calendar, Building2,
  CalendarDays, MessageSquare
} from 'lucide-react';
import { useAuth, normalizeRoleStr } from '@/context/AuthContext';
import {
  getUserDirectory,
  subscribeUserDirectory,
  invalidateUserDirectoryCache,
  CachedEmployee,
} from '@/lib/userDirectoryCache';
import { getCachedData, setCachedData, clearStaleCaches } from '@/lib/cacheUtils';
import { normalizeLead, safeString } from '@/lib/leadNormalizer';
import { NoticeBoardWidget } from '@/components/noticeboard/NoticeBoardWidget';

export interface DepartmentFollowUp {
  id: string;
  title: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  companyName: string;
  followUpType: 'MEETING' | 'CALL' | 'WHATSAPP' | 'EMAIL';
  isMeeting: boolean;
  priority: string;
  status: string;
  dueAt: string;
  dueTimeFormatted: string;
  dueDateFormatted: string;
  purpose: string;
  assignedRepName: string;
  assignedRepRole: string;
  createdByName: string;
  createdByRole: string;
}

interface DepartmentLead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost' | 'Meeting Scheduled';
  value: string;
  numericValue: number;
  source: string;
  assignedRepName: string;
  assignedRepRole: string;
  lastContact: string;
  requirement?: string;
  avatarBg: string;
}

// NOTE: All hardcoded demo/default data has been removed.
// Dashboard now exclusively shows real data from PostgreSQL via API.

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
  const [deptLeads, setDeptLeads] = useState<DepartmentLead[]>(() => {
    const raw = getCachedData('mgr_leads') || [];
    return Array.isArray(raw) ? raw.map((l, idx) => {
      const norm = normalizeLead(l, idx);
      return {
        id: norm.id,
        name: norm.name,
        company: norm.company,
        phone: norm.phone,
        email: norm.email,
        status: norm.status as any,
        value: norm.value,
        numericValue: norm.numericValue,
        source: norm.source,
        assignedRepName: norm.assignedRepName,
        assignedRepRole: norm.assignedRepRole,
        lastContact: norm.lastCalledAt || 'Recently updated',
        requirement: norm.requirement,
        avatarBg: 'from-emerald-500 to-teal-600',
      };
    }) : [];
  });
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TEAM_LEADERS' | 'REPS' | 'LEADS'>('OVERVIEW');
  const [leadFilter, setLeadFilter] = useState<'ALL' | 'NEW' | 'MEETINGS' | 'QUALIFIED' | 'WON'>('ALL');
  const [deptFollowUps, setDeptFollowUps] = useState<DepartmentFollowUp[]>([]);
  const [outreachFilter, setOutreachFilter] = useState<'ALL' | 'MEETINGS' | 'CALLS'>('ALL');

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

  // Clear stale caches on mount
  useEffect(() => { clearStaleCaches(); }, []);

  // Fetch real leads from backend API (authoritative source of truth)
  const fetchLeads = useCallback(async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;

    // Fetch from backend API — this is the single source of truth
    if (token) {
      try {
        const res = await fetch(`${apiBase}/leads?limit=500`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.leads || data.data || []);
          if (Array.isArray(items)) {
            const colors = [
              'from-emerald-500 to-teal-600',
              'from-teal-500 to-cyan-600',
              'from-purple-500 to-indigo-600',
              'from-indigo-500 to-blue-600',
              'from-amber-500 to-orange-600',
            ];
            const rawDel = typeof window !== 'undefined' ? localStorage.getItem('das_crm_deleted_lead_ids') : null;
            const delIds = new Set<string>(rawDel ? JSON.parse(rawDel) : []);
            delIds.add('cmuojhdgu000jikm4z3gs6v5r');

            const mapped: DepartmentLead[] = items
              .filter((l: any) => {
                const n = safeString(l.name || `${l.firstName || ''} ${l.lastName || ''}`);
                const id = String(l.id || '');
                return !delIds.has(id) && !n.includes('(Test Lead)') && id !== 'demo-lead-test-01' && id !== 'lead-test-demo-01';
              })
              .map((l: any, idx: number) => {
                const norm = normalizeLead(l, idx);
                return {
                  id: norm.id,
                  name: norm.name,
                  company: norm.company,
                  phone: norm.phone,
                  email: norm.email,
                  status: norm.status as any,
                  value: norm.value,
                  numericValue: norm.numericValue,
                  source: norm.source,
                  assignedRepName: norm.assignedRepName,
                  assignedRepRole: norm.assignedRepRole,
                  lastContact: norm.lastCalledAt || 'Recently updated',
                  requirement: norm.requirement,
                  avatarBg: colors[idx % colors.length],
                };
              });
            setDeptLeads(mapped);
            setCachedData('mgr_leads', mapped);
          }
        }
      } catch (_) {}
    }
  }, []);

  // Fetch follow-ups and scheduled meetings across department
  const fetchFollowUps = useCallback(async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
    let rawItems: any[] = [];

    if (token) {
      try {
        const res = await fetch(`${apiBase}/follow-ups?limit=100`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.followUps || data.data || []);
          if (Array.isArray(items)) rawItems = items;
        }
      } catch (_) {}
    }

    const rawDelIds = typeof window !== 'undefined' ? localStorage.getItem('das_crm_deleted_lead_ids') : null;
    const delIds = new Set<string>(rawDelIds ? JSON.parse(rawDelIds) : []);
    delIds.add('cmuojhdgu000jikm4z3gs6v5r');

    const rawDelRecs = typeof window !== 'undefined' ? localStorage.getItem('das_crm_deleted_lead_records') : null;
    const delRecs: any[] = rawDelRecs ? JSON.parse(rawDelRecs) : [];

    const isDeletedItem = (item: any) => {
      if (!item) return true;
      const id = String(item.leadId || item.lead?.id || '');
      if (id && delIds.has(id)) return true;

      const title = String(item.title || '').toLowerCase();
      const purpose = String(item.purpose || item.notes || '').toLowerCase();
      const name = String(item.lead?.name || item.leadName || (item.lead?.firstName ? `${item.lead.firstName} ${item.lead.lastName || ''}` : '')).toLowerCase().trim();
      const phone = String(item.lead?.phone || item.leadPhone || item.phone || '').replace(/[^0-9]/g, '');
      const email = String(item.lead?.email || item.leadEmail || item.email || '').toLowerCase().trim();

      if (name.includes('pooja nair') || title.includes('pooja nair') || purpose.includes('pooja nair') || email === 'pooja.nair@example.com' || (phone && phone.endsWith('9800010009'))) {
        return true;
      }

      for (const r of delRecs) {
        if (r.id && id && String(r.id) === id) return true;
        const rName = String(r.name || '').toLowerCase().trim();
        if (rName && rName.length > 2 && (name === rName || title.includes(rName))) return true;
        const rPhone = String(r.phone || '').replace(/[^0-9]/g, '');
        if (rPhone && phone && phone.length >= 7 && rPhone.endsWith(phone.slice(-8))) return true;
        const rEmail = String(r.email || '').toLowerCase().trim();
        if (rEmail && email && rEmail === email) return true;
      }
      return false;
    };

    if (typeof window !== 'undefined') {
      try {
        const cachedRaw = localStorage.getItem('das_crm_followup_tasks_cache');
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Array.isArray(cached) && cached.length > 0) {
            const filteredCached = cached.filter((c: any) => !isDeletedItem(c));
            if (filteredCached.length !== cached.length) {
              localStorage.setItem('das_crm_followup_tasks_cache', JSON.stringify(filteredCached));
            }
            const map = new Map<string, any>();
            rawItems.filter((i: any) => !isDeletedItem(i)).forEach(i => map.set(String(i.id), i));
            filteredCached.forEach((c: any) => {
              if (!map.has(String(c.id))) map.set(String(c.id), c);
            });
            rawItems = Array.from(map.values());
          }
        }
      } catch (_) {}
    }

    rawItems = rawItems.filter((i: any) => !isDeletedItem(i));

    // Map and enrich items
    const mapped: DepartmentFollowUp[] = rawItems
      .filter((item: any) => !isDeletedItem(item))
      .map((item: any) => {
        const type = (item.followUpType || 'CALL').toUpperCase();
        const isMeeting = type === 'MEETING' || /meeting|visit/i.test(item.title || '') || /meeting|visit/i.test(item.purpose || '');
        
        let leadName = item.lead?.name || `${item.lead?.firstName || ''} ${item.lead?.lastName || ''}`.trim() || '';
        let leadPhone = item.lead?.phone || item.phone || '';
        let leadEmail = item.lead?.email || item.email || '';
        let companyName = typeof item.lead?.company === 'string' ? item.lead.company : item.lead?.company?.name || '';
        let repName = item.lead?.owner?.name || (item.lead?.owner?.firstName ? `${item.lead.owner.firstName} ${item.lead.owner.lastName || ''}`.trim() : '') || item.assignee?.name || '';
        let repRole = item.lead?.owner?.role?.name || item.lead?.owner?.role || item.assignee?.role?.name || item.assignee?.role || 'SALES_EXEC';
        let title = item.title || '';

        const leadId = String(item.lead?.id || item.leadId || '');

        // Resolve from directory / lead caches
        if (typeof window !== 'undefined') {
          try {
            const rawDir = localStorage.getItem('das_crm_all_leads_cache') || localStorage.getItem('das_crm_lead_directory_cache') || localStorage.getItem('mgr_leads');
            if (rawDir) {
              const list = JSON.parse(rawDir);
              if (Array.isArray(list)) {
                const matched = list.find((l: any) => (leadId && String(l.id) === leadId) || (leadName && l.name && l.name.toLowerCase() === leadName.toLowerCase()));
                if (matched) {
                  const normName = matched.name || `${matched.firstName || ''} ${matched.lastName || ''}`.trim();
                  if (normName && !normName.includes('Lead Prospect')) leadName = normName;
                  if (!leadPhone || leadPhone === '—') leadPhone = matched.phone || '';
                  if (!leadEmail || leadEmail === '—') leadEmail = matched.email || '';
                  if (!companyName || companyName === '—') companyName = matched.company || '';
                  if (!repName || repName === '—') repName = matched.assignedRepName || matched.owner || '';
                  if (matched.assignedRepRole) repRole = matched.assignedRepRole;
                }
              }
            }
          } catch (_) {}
        }

        leadName = leadName || 'Lead Contact';
        leadPhone = leadPhone || '—';
        leadEmail = leadEmail || '—';

        if (title.includes('Lead Prospect') || title.includes('(—)')) {
          title = title
            .replace(/Lead Prospect\s*(\([^\)]*\))?/gi, `${leadName} ${companyName ? `(${companyName})` : ''}`.trim())
            .replace(/\(—\)/g, companyName ? `(${companyName})` : '');
        }
        if (!title || title === '—') {
          title = `${isMeeting ? '🏢 In-Person / Virtual Visit' : '📞 Follow-up Call'}: ${leadName} ${companyName ? `(${companyName})` : ''}`.trim();
        }

        const due = item.dueAt ? new Date(item.dueAt) : null;
        const dueTimeFormatted = due && !isNaN(due.getTime())
          ? due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
          : (item.scheduledTime || '10:30 AM');
        const dueDateFormatted = due && !isNaN(due.getTime())
          ? due.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
          : (item.scheduledDate || 'Today');

        return {
          id: String(item.id),
          title,
          leadId: leadId || '',
          leadName,
          leadPhone,
          leadEmail,
          companyName,
          followUpType: isMeeting ? 'MEETING' : 'CALL',
          isMeeting,
          priority: item.priority || 'HIGH',
          status: item.status || 'PENDING',
          dueAt: item.dueAt || new Date().toISOString(),
          dueTimeFormatted,
          dueDateFormatted,
          purpose: item.purpose || item.notes || 'Client outreach and pipeline progress',
          assignedRepName: repName || 'Sales Representative',
          assignedRepRole: repRole || 'SALES_EXEC',
          createdByName: item.createdByName || item.createdBy?.name || 'Admin',
          createdByRole: item.createdByRole || item.createdBy?.role || 'ADMIN',
        };
      });

    setDeptFollowUps(mapped);
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchFollowUps();

    // Listen for live lead allocation updates across tabs and components
    const handleUpdate = () => {
      fetchLeads();
      fetchFollowUps();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('das_crm_leads_updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);

      let bc: BroadcastChannel | null = null;
      try {
        bc = new BroadcastChannel('das_crm_lead_sync');
        bc.onmessage = () => {
          fetchLeads();
          fetchFollowUps();
        };
      } catch (_) {}

      return () => {
        window.removeEventListener('das_crm_leads_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
        if (bc) bc.close();
      };
    }
  }, [fetchLeads, fetchFollowUps]);

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
    if (leadFilter === 'MEETINGS') return deptLeads.filter(l => l.status.toLowerCase().includes('meet') || l.status.toLowerCase().includes('visit'));
    if (leadFilter === 'QUALIFIED') return deptLeads.filter(l => l.status.toLowerCase() === 'qualified' || l.status.toLowerCase() === 'proposal');
    if (leadFilter === 'WON') return deptLeads.filter(l => l.status.toLowerCase() === 'won');
    return deptLeads;
  }, [deptLeads, leadFilter]);

  const totalScheduledMeetings = useMemo(() => {
    return deptFollowUps.filter(f => f.isMeeting && f.status !== 'CANCELLED').length;
  }, [deptFollowUps]);

  const filteredFollowUps = useMemo(() => {
    if (outreachFilter === 'MEETINGS') return deptFollowUps.filter(f => f.isMeeting);
    if (outreachFilter === 'CALLS') return deptFollowUps.filter(f => !f.isMeeting);
    return deptFollowUps;
  }, [deptFollowUps, outreachFilter]);

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

      {/* 📢 COMPANY NOTICE BOARD (LIVE SYNC ACROSS ALL DASHBOARDS) */}
      <NoticeBoardWidget title="The Notice Board & Department Directives" />

      {/* ── DEPARTMENT FOLLOW-UPS & SCHEDULED OUTREACH CENTER (LIVE SYNC) ── */}
      <div className="crm-card p-6 border border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 rounded-2xl space-y-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shadow-inner">
              <CalendarDays size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-foreground">
                  Department Follow-ups &amp; Scheduled Outreach
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> Live Synced
                </span>
                {totalScheduledMeetings > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    🏢 {totalScheduledMeetings} Meeting{totalScheduledMeetings > 1 ? 's' : ''} Confirmed
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Full supervisory transparency: Track prospect meetings, client visits, and callback schedules across all sales reps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setOutreachFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  outreachFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({deptFollowUps.length})
              </button>
              <button
                onClick={() => setOutreachFilter('MEETINGS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  outreachFilter === 'MEETINGS'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-purple-300/80 hover:text-purple-200'
                }`}
              >
                🏢 Meetings ({totalScheduledMeetings})
              </button>
              <button
                onClick={() => setOutreachFilter('CALLS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  outreachFilter === 'CALLS'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-sky-300/80 hover:text-sky-200'
                }`}
              >
                📞 Callbacks ({Math.max(0, deptFollowUps.length - totalScheduledMeetings)})
              </button>
            </div>

            <Link
              href="/tasks"
              className="text-xs px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold flex items-center gap-1.5 transition-all shadow-md"
            >
              <span>Outreach Hub</span> <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Outreach Cards Grid */}
        {filteredFollowUps.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-purple-500/20 bg-purple-500/5 rounded-2xl space-y-2">
            <Calendar size={28} className="mx-auto text-purple-400/50" />
            <p className="text-sm font-bold text-foreground">No outreach items in this filter</p>
            <p className="text-xs text-muted-foreground">Meetings and callback follow-ups scheduled by reps or admins will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredFollowUps.map(item => {
              const isMeeting = item.isMeeting;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl bg-slate-950/70 border transition-all hover:shadow-md flex flex-col justify-between gap-3 ${
                    isMeeting
                      ? 'border-purple-500/40 hover:border-purple-500/70 bg-gradient-to-b from-purple-950/20 to-slate-950/70'
                      : 'border-slate-800 hover:border-sky-500/40'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header: Badge & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          isMeeting
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        }`}
                      >
                        {isMeeting ? '🏢 MEETING' : '📞 CALLBACK'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock size={11} className="text-purple-400" />
                        <strong className="text-slate-200">{item.dueDateFormatted}</strong> at {item.dueTimeFormatted}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-black text-white leading-snug break-words">
                      {item.title}
                    </h4>

                    {/* Purpose */}
                    {item.purpose && (
                      <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 line-clamp-2">
                        &quot;{item.purpose}&quot;
                      </p>
                    )}

                    {/* Contact & Rep Info */}
                    <div className="text-[11px] text-slate-300 space-y-1 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-medium">Prospect:</span>
                        <strong className="text-white truncate">{item.leadName}</strong>
                      </div>
                      {item.leadPhone && (
                        <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                          <span className="text-slate-400">Phone:</span>
                          <span className="text-emerald-400">{item.leadPhone}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 text-[10px] pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400">Lead Rep:</span>
                        <span className="font-extrabold text-indigo-300 truncate">{item.assignedRepName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                    <span className="text-[9px] text-slate-500 truncate">
                      By {item.createdByName}
                    </span>
                    <Link
                      href={`/leads/${encodeURIComponent(item.leadId)}`}
                      className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                    >
                      Open Workspace <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
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
            {(['ALL', 'NEW', 'MEETINGS', 'QUALIFIED', 'WON'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setLeadFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  leadFilter === tab
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {tab === 'ALL' ? 'All Leads' : tab === 'NEW' ? 'New Inbound' : tab === 'MEETINGS' ? '🏢 Meetings Scheduled' : tab === 'QUALIFIED' ? 'In Negotiation' : 'Closed Won'}
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
                  const statusStr = safeString(lead.status, 'New');
                  const statusBadgeColor =
                    statusStr.toLowerCase().includes('won')
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : statusStr.toLowerCase().includes('meet') || statusStr.toLowerCase().includes('visit')
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : statusStr.toLowerCase().includes('negotiat') || statusStr.toLowerCase().includes('proposal')
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : statusStr.toLowerCase().includes('qualif')
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/40';

                  return (
                    <tr key={lead.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${lead.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                            {getInitials(safeString(lead.name))}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{safeString(lead.name)}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{safeString(lead.phone)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-200">{safeString(lead.company)}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{safeString(lead.requirement)}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-indigo-300">{safeString(lead.assignedRepName)}</p>
                        <span className="text-[10px] text-slate-400">{safeString(lead.assignedRepRole)}</span>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400 font-mono">
                        {safeString(lead.value)}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${statusBadgeColor}`}>
                          {statusStr}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/leads/${encodeURIComponent(lead.id)}`}
                          className="text-purple-400 hover:text-purple-300 font-bold text-xs inline-flex items-center gap-0.5"
                        >
                          Workspace <ChevronRight size={12} />
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

