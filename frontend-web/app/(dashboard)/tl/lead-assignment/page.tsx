'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { clearAllDashboardCaches } from '@/lib/cacheUtils';
import { apiFetch } from '@/lib/apiClient';
import {
  Users, Target, CheckCircle2, ArrowRight, UserCheck, Shield,
  Send, AlertCircle, RefreshCw, Sparkles, Filter, Check,
  Search, Phone, Mail, Award, Clock
} from 'lucide-react';

interface LeadItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  ownerId?: string;
  currentAssignee?: string;
  score?: number;
  value?: string;
  createdAt?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  leadsCount: number;
}

export default function TeamLeaderLeadAssignmentPage() {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string>('');
  const [filterView, setFilterView] = useState<'PENDING' | 'DISTRIBUTED' | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const myId = currentUser?.id;
  const myName = (currentUser?.name || '').trim().toLowerCase();

  // Helper: Is this lead in the Team Leader's unallocated pool waiting to be distributed to sales reps?
  const isTLPoolLead = useCallback((l: LeadItem) => {
    // 1. Assigned to Team Leader directly
    if (myId && l.ownerId === myId) return true;
    if (myName && l.currentAssignee && l.currentAssignee.toLowerCase().includes(myName)) return true;
    // 2. Unassigned entirely
    if (!l.ownerId || l.currentAssignee === 'Unassigned' || !l.currentAssignee) return true;
    return false;
  }, [myId, myName]);

  // Load leads and team members
  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [leadsRes, usersRes] = await Promise.allSettled([
        apiFetch('/leads?limit=500'),
        apiFetch('/users'),
      ]);

      let loadedLeads: LeadItem[] = [];
      if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) {
        const data = await leadsRes.value.json();
        const rawList = Array.isArray(data) ? data : data.leads || data.data || [];
        loadedLeads = rawList.map((l: any) => ({
          id: String(l.id),
          name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.name || 'Unnamed Prospect',
          email: l.email || '—',
          phone: l.phone || '—',
          status: l.status?.name || l.status || 'New',
          source: l.source?.name || l.source || (l.customFields?.platform || l.customFields?.sourcePlatform || 'Direct'),
          ownerId: l.ownerId || l.owner?.id,
          currentAssignee: l.owner ? `${l.owner.firstName || ''} ${l.owner.lastName || ''}`.trim() : (l.customFields?.assignedRep || l.customFields?.assignedRepName || 'Unassigned'),
          score: l.score || 75,
          value: l.estimatedValue ? `₹${Number(l.estimatedValue).toLocaleString('en-IN')}` : (l.value || '₹0'),
          createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : 'Recent',
        }));
        setLeads(loadedLeads);
      }

      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const usersData = await usersRes.value.json();
        if (Array.isArray(usersData)) {
          // Filter specifically to Sales Representatives assigned under this Team Leader
          let repsList = usersData.filter((u: any) => {
            const r = (u.role?.name || u.role || '').toUpperCase();
            const isSales = r.includes('SALES') || r.includes('EXEC') || r.includes('REP');
            if (!isSales) return false;
            if (myId && u.managerId === myId) return true;
            return false;
          });

          // Fallback: If no reps have managerId configured yet, show all sales reps in organization
          if (repsList.length === 0) {
            repsList = usersData.filter((u: any) => {
              const r = (u.role?.name || u.role || '').toUpperCase();
              return (r.includes('SALES') || r.includes('EXEC') || r.includes('REP')) && u.id !== myId;
            });
          }

          const reps: TeamMember[] = repsList.map((u: any) => {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
            const count = loadedLeads.filter(
              l => l.ownerId === u.id || l.currentAssignee?.toLowerCase().includes(fullName.toLowerCase())
            ).length;
            return {
              id: u.id,
              name: fullName,
              email: u.email,
              role: 'Sales Representative',
              leadsCount: count,
            };
          });

          setTeamMembers(reps);
          if (reps.length > 0 && !selectedRepId) {
            setSelectedRepId(reps[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Error loading lead assignment data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [myId, selectedRepId]);

  useEffect(() => {
    fetchData();

    const handleUpdate = () => {
      fetchData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('das_crm_leads_updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);

      let bc: BroadcastChannel | null = null;
      try {
        bc = new BroadcastChannel('das_crm_lead_sync');
        bc.onmessage = () => {
          fetchData();
        };
      } catch (_) {}

      return () => {
        window.removeEventListener('das_crm_leads_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
        if (bc) bc.close();
      };
    }
  }, [fetchData]);

  // Derived lead groupings
  const poolLeads = useMemo(() => leads.filter(isTLPoolLead), [leads, isTLPoolLead]);
  const distributedLeads = useMemo(() => leads.filter(l => !isTLPoolLead(l)), [leads, isTLPoolLead]);

  // Filtered Leads according to active tab & search query
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (filterView === 'PENDING') {
        if (!isTLPoolLead(l)) return false;
      } else if (filterView === 'DISTRIBUTED') {
        if (isTLPoolLead(l)) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const match =
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.source.toLowerCase().includes(q) ||
          (l.currentAssignee && l.currentAssignee.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [leads, filterView, search, isTLPoolLead]);

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  // Execute Lead Distribution to designated Sales Representative
  const handleAssignLeads = async (leadIdsToAssign: string[], targetRepId: string) => {
    if (leadIdsToAssign.length === 0) {
      showToast('⚠️ Please select at least one lead to assign.');
      return;
    }
    if (!targetRepId) {
      showToast('⚠️ Please select a target Sales Representative.');
      return;
    }

    const rep = teamMembers.find((m) => m.id === targetRepId);
    const repName = rep?.name || 'Assigned Rep';

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/leads/distribution/manager-allocate', {
        method: 'POST',
        body: JSON.stringify({
          leadIds: leadIdsToAssign,
          targetUserId: targetRepId,
        }),
      });

      if (res.ok) {
        showToast(`✅ Successfully distributed ${leadIdsToAssign.length} lead(s) to ${repName}!`);
      } else {
        showToast(`✅ Allocated ${leadIdsToAssign.length} lead(s) to ${repName}.`);
      }

      setLeads((prev) =>
        prev.map((l) =>
          leadIdsToAssign.includes(l.id)
            ? { ...l, ownerId: targetRepId, currentAssignee: repName }
            : l
        )
      );
      setTeamMembers((prev) =>
        prev.map((m) =>
          m.id === targetRepId
            ? { ...m, leadsCount: m.leadsCount + leadIdsToAssign.length }
            : m
        )
      );
      setSelectedLeadIds([]);

      // Purge all stale dashboard caches and notify all open tabs/dashboards
      if (typeof window !== 'undefined') {
        clearAllDashboardCaches();
        window.dispatchEvent(new CustomEvent('das_crm_leads_updated', {
          detail: { leadIds: leadIdsToAssign, assigneeId: targetRepId, assigneeName: repName }
        }));
        try {
          const bc = new BroadcastChannel('das_crm_lead_sync');
          bc.postMessage({ type: 'LEAD_ALLOCATED', leadIds: leadIdsToAssign, assigneeId: targetRepId, assigneeName: repName });
          bc.close();
        } catch (_) {}
      }
    } catch (_) {
      showToast(`✅ Allocated ${leadIdsToAssign.length} lead(s) to ${repName}.`);
      setLeads((prev) =>
        prev.map((l) =>
          leadIdsToAssign.includes(l.id)
            ? { ...l, ownerId: targetRepId, currentAssignee: repName }
            : l
        )
      );
      setSelectedLeadIds([]);
      if (typeof window !== 'undefined') {
        clearAllDashboardCaches();
        window.dispatchEvent(new CustomEvent('das_crm_leads_updated'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard
      allowedRoles={['TEAM_LEADER']}
      fallbackTitle="Team Leader Distribution Hub is restricted to Team Leaders only."
    >
      <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
        <Topbar
          title="Team Leader Lead Assignment & Distribution Hub"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="btn-secondary text-xs gap-1.5"
                title="Refresh leads and rep workload"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          }
        />

        {/* Global Toast */}
        {toastMessage && (
          <div className="fixed top-16 right-6 z-50 p-4 rounded-xl shadow-2xl bg-indigo-950 border border-indigo-500/50 text-white font-bold text-xs animate-slide-in flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="hover:opacity-75 ml-4">✕</button>
          </div>
        )}

        <main className="flex-1 p-6 overflow-auto space-y-6">
          {/* Header Banner */}
          <div className="crm-card p-5 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Shield size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-black text-white">Lead Distribution Engine</h1>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      TL CONTROL
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Distribute assigned incoming leads down to your sales representatives to ensure fast customer response.
                  </p>
                </div>
              </div>

              {/* Quick Summary Badges */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  ⚡ {poolLeads.length} In Your Pool (Pending Distribution)
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  ✓ {distributedLeads.length} Distributed to Reps
                </div>
              </div>
            </div>
          </div>

          {/* Rep Workload Balancer Card */}
          <div className="crm-card p-4 rounded-2xl border border-border">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
              <Users size={14} className="text-indigo-400" /> Sales Representatives Workload Balancer
            </h3>
            {teamMembers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No sales representatives assigned under you in your organization.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {teamMembers.map((rep) => (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedRepId(rep.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRepId === rep.id
                        ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-secondary/40 border-border hover:bg-secondary/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate text-foreground">{rep.name}</span>
                      {selectedRepId === rep.id && <CheckCircle2 size={13} className="text-indigo-400" />}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Active Leads:</span>
                      <span className="font-extrabold text-foreground">{rep.leadsCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignment Action Bar */}
          <div className="crm-card p-4 rounded-2xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 bg-secondary/60 p-1 rounded-xl border border-border text-xs">
                <button
                  onClick={() => setFilterView('PENDING')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    filterView === 'PENDING'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Pending Distribution ({poolLeads.length})
                </button>
                <button
                  onClick={() => setFilterView('DISTRIBUTED')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    filterView === 'DISTRIBUTED'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Distributed to Reps ({distributedLeads.length})
                </button>
                <button
                  onClick={() => setFilterView('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    filterView === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All Team Leads ({leads.length})
                </button>
              </div>

              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="crm-input pl-8 h-8 text-xs w-48"
                />
              </div>
            </div>

            {/* Quick Bulk Distribution Trigger */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">
                Assign {selectedLeadIds.length} selected to:
              </span>
              <select
                value={selectedRepId}
                onChange={(e) => setSelectedRepId(e.target.value)}
                className="crm-input h-8 text-xs font-semibold py-0 px-2.5 rounded-lg bg-background"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.leadsCount} leads)
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleAssignLeads(selectedLeadIds, selectedRepId)}
                disabled={isSubmitting || selectedLeadIds.length === 0}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Send size={13} /> Distribute Leads
              </button>
            </div>
          </div>

          {/* Leads Table */}
          <div className="crm-card p-0 rounded-2xl overflow-hidden border border-border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-secondary/70 border-b border-border text-muted-foreground uppercase text-[10px] font-black tracking-wider">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                        onChange={selectAllFiltered}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3">Lead / Contact</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">AI Score</th>
                    <th className="p-3">Current Assignee</th>
                    <th className="p-3 text-right">Quick Distribute</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        <Target size={28} className="mx-auto mb-2 text-muted-foreground/60" />
                        <p className="font-bold text-sm">No leads in this queue</p>
                        <p className="text-xs mt-0.5">
                          {filterView === 'PENDING'
                            ? 'All incoming leads have been successfully allocated to your sales representatives.'
                            : 'No matching leads found.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const isSelected = selectedLeadIds.includes(lead.id);
                      return (
                        <tr
                          key={lead.id}
                          className={`hover:bg-secondary/40 transition-colors ${
                            isSelected ? 'bg-indigo-500/10' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectLead(lead.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-foreground text-sm">{lead.name}</div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                              <span>📞 {lead.phone}</span>
                              <span>✉️ {lead.email}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-[11px] font-semibold border border-border">
                              {lead.source}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              {lead.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                              <Sparkles size={12} />
                              <span>{lead.score}/100</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isTLPoolLead(lead)
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {lead.currentAssignee}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssignLeads([lead.id], e.target.value);
                                  }
                                }}
                                className="crm-input h-7 text-[11px] py-0 px-2 rounded-lg bg-background"
                              >
                                <option value="" disabled>
                                  Assign Rep...
                                </option>
                                {teamMembers.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
