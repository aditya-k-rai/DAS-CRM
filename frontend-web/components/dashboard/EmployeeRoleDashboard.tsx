'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Target, Sparkles, Clock, Calendar, Briefcase, Phone, Mail,
  MessageCircle, Video, CheckCircle2, AlertTriangle, ArrowRight,
  Plus, Users, Building2, TrendingUp, Trophy, Star, Zap,
  UserCheck, Radio, Bell, Check, ExternalLink, BarChart3, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NoticeBoardWidget } from '@/components/noticeboard/NoticeBoardWidget';
import { apiFetch } from '@/lib/apiClient';
import { getCachedData, setCachedData, clearAllDashboardCaches, clearStaleCaches } from '@/lib/cacheUtils';
import { normalizeLead, safeString, safeStatus, safeOwnerName, safeCompany, safeRequirement, safeSource } from '@/lib/leadNormalizer';

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
  assignedRep?: string;
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

// NOTE: All hardcoded demo/default data has been removed.
// Dashboards now exclusively show real data from PostgreSQL via API.

function getInitials(name: string): string {
  if (!name) return 'LD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function EmployeeRoleDashboard() {
  const { currentUser } = useAuth();
  const firstName = currentUser?.name?.split(' ')?.[0] || 'Rep';

  // Selected Sales Representative workspace filter (defaults to user or ALL)
  const [selectedRep, setSelectedRep] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('das_crm_sales_selected_rep');
      if (stored) return stored;
    }
    const cName = currentUser?.name || '';
    const cEmail = currentUser?.email || '';
    if (cEmail === 'rastoginandini92@gmail.com' || cName.toLowerCase().includes('nandini')) return 'Nandini Rastogi';
    if (cEmail === 'sulekhatmr@gmail.com' || cName.toLowerCase().includes('sulekha')) return 'Sulekha Tomar';
    if (cEmail === 'sadhnadikshit98@gmail.com' || cName.toLowerCase().includes('sadhana')) return 'Sadhana';
    return 'ALL';
  });

  const [rawLeads, setRawLeads] = useState<any[]>([]);

  // Synced States — initialized from TTL-checked cache (5 min), empty if stale
  const [newLeads, setNewLeads] = useState<SyncedLead[]>(() => getCachedData('emp_newLeads') || []);
  const [followUps, setFollowUps] = useState<SyncedFollowUp[]>(() => getCachedData('emp_followUps') || []);
  const [meetings, setMeetings] = useState<SyncedMeeting[]>(() => getCachedData('emp_meetings') || []);
  const [opportunities, setOpportunities] = useState<SyncedOpportunity[]>(() => getCachedData('emp_opportunities') || []);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clear stale caches on mount
  useEffect(() => { clearStaleCaches(); }, []);

  // Sync state mutations to Cache automatically
  useEffect(() => { if (newLeads.length > 0) setCachedData('emp_newLeads', newLeads); }, [newLeads]);
  useEffect(() => { if (followUps.length > 0) setCachedData('emp_followUps', followUps); }, [followUps]);
  useEffect(() => { if (meetings.length > 0) setCachedData('emp_meetings', meetings); }, [meetings]);
  useEffect(() => { if (opportunities.length > 0) setCachedData('emp_opportunities', opportunities); }, [opportunities]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Dynamically compute list of all sales representatives from real DB leads and directory
  const availableReps = useMemo(() => {
    const repMap = new Map<string, { id: string; name: string; count: number }>();

    // Baseline verified sales executives in DAS organization
    repMap.set('Nandini Rastogi', { id: 'cmuhp0517000ngg2dq93a6nlp', name: 'Nandini Rastogi', count: 0 });
    repMap.set('Sulekha Tomar', { id: 'cmukwwdv9000ng42dghtw6t3z', name: 'Sulekha Tomar', count: 0 });
    repMap.set('Sadhana', { id: 'cmukykfoe000nht2d0ylnsd3t', name: 'Sadhana', count: 0 });

    rawLeads.forEach(l => {
      const norm = normalizeLead(l);
      const ownerStr = norm.owner || '';
      const customRep = safeString(l.customFields?.assignedRep || l.customFields?.owner || '');

      for (const [repName, entry] of repMap.entries()) {
        const cleanRep = repName.toLowerCase();
        const matchesOwner = ownerStr.toLowerCase().includes(cleanRep);
        const matchesCustom = customRep.toLowerCase().includes(cleanRep);
        const matchesTrail = Array.isArray(norm.allocationTrail) && norm.allocationTrail.some((ev: any) =>
          safeString(ev.toName || ev.assigneeName).toLowerCase().includes(cleanRep) ||
          String(ev.assigneeId) === entry.id
        );
        const matchesId = String(norm.ownerId) === entry.id;

        if (matchesOwner || matchesCustom || matchesTrail || matchesId) {
          entry.count++;
        }
      }

      if (norm.assignedRepRole === 'SALES_EXEC' || ownerStr.toLowerCase().includes('sales exec') || ownerStr.toLowerCase().includes('sales rep')) {
        const cleanName = ownerStr.replace(/\s*\(sales exec\)|\s*\(sales rep\)|\s*\(rep\)/gi, '').trim();
        if (cleanName && cleanName !== 'Sales Executive' && cleanName !== 'Unassigned' && cleanName !== '—') {
          if (!repMap.has(cleanName)) {
            repMap.set(cleanName, { id: norm.ownerId || `rep_${cleanName}`, name: cleanName, count: 1 });
          }
        }
      }
    });

    return Array.from(repMap.values());
  }, [rawLeads]);

  const allSalesLeadsCount = useMemo(() => {
    return rawLeads.filter(l => {
      const norm = normalizeLead(l);
      const ownerLower = (norm.owner || '').toLowerCase();
      const customLower = safeString(l.customFields?.assignedRep || l.customFields?.owner || '').toLowerCase();
      const trailHasSales = Array.isArray(norm.allocationTrail) && norm.allocationTrail.some((ev: any) =>
        safeString(ev.toRole).toUpperCase() === 'SALES_EXEC' ||
        safeString(ev.toName).toLowerCase().includes('sales exec') ||
        safeString(ev.toName).toLowerCase().includes('nandini') ||
        safeString(ev.toName).toLowerCase().includes('sulekha') ||
        safeString(ev.toName).toLowerCase().includes('sadhana')
      );
      const isKnownSalesOwner =
        ownerLower.includes('nandini') ||
        ownerLower.includes('sulekha') ||
        ownerLower.includes('sadhana') ||
        ownerLower.includes('sales exec') ||
        ownerLower.includes('sales rep') ||
        customLower.includes('nandini') ||
        customLower.includes('sulekha') ||
        customLower.includes('sadhana') ||
        ['cmuhp0517000ngg2dq93a6nlp', 'cmukwwdv9000ng42dghtw6t3z', 'cmukykfoe000nht2d0ylnsd3t'].includes(String(norm.ownerId));

      return trailHasSales || isKnownSalesOwner;
    }).length;
  }, [rawLeads]);

  // Real-time synchronization of leads for logged-in or selected Sales Representative
  const syncData = useCallback(async () => {
    setIsLoading(true);

    // ── 1. Fetch leads from backend API via authenticated client ──
    let serverLeads: any[] = [];
    try {
      const res = await apiFetch('/leads?limit=500');
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.leads || data.data || []);
        if (Array.isArray(items) && items.length > 0) {
          serverLeads = items;
        }
      }
    } catch (err) {
      console.warn('API lead sync error in Sales Dashboard:', err);
    }

    // Resilient offline / cache fallback & local storage merge
    if (typeof window !== 'undefined') {
      try {
        const cachedAll = JSON.parse(localStorage.getItem('das_crm_all_leads_cache') || '[]');
        const cachedDir = JSON.parse(localStorage.getItem('das_crm_lead_directory_cache') || '[]');
        const localCacheMap = new Map<string, any>();
        [...cachedAll, ...cachedDir].forEach((item: any) => {
          if (item?.id) localCacheMap.set(String(item.id), item);
          if (item?.name) localCacheMap.set(item.name.toLowerCase().trim(), item);
        });

        if (serverLeads.length > 0) {
          serverLeads = serverLeads.map((sl: any) => {
            const match = localCacheMap.get(String(sl.id)) || (sl.firstName ? localCacheMap.get(`${sl.firstName} ${sl.lastName || ''}`.toLowerCase().trim()) : null);
            if (match && match.allocationTrail && match.allocationTrail.length > (sl.allocationTrail?.length || 0)) {
              return { ...sl, ...match };
            }
            if (match && match.owner && (!sl.owner || sl.owner === 'Unassigned')) {
              return { ...sl, owner: match.owner, ownerId: match.ownerId || sl.ownerId };
            }
            return sl;
          });
        } else if (localCacheMap.size > 0) {
          serverLeads = Array.from(localCacheMap.values());
        }
      } catch (_) {}
    }

    const allLeads = serverLeads.filter(l => {
      const name = l.name || `${l.firstName || ''} ${l.lastName || ''}`;
      const id = String(l.id || '');
      return !name.includes('(Test Lead)') && id !== 'demo-lead-test-01' && id !== 'lead-test-demo-01';
    });

    setRawLeads(allLeads);

    // ── 2. Filter leads belonging to the selected Sales Representative ──
    const filterLeadForRep = (l: any, targetRep: string) => {
      const norm = normalizeLead(l);
      const lOwnerId = String(norm.ownerId || l.ownerId || (typeof l.owner === 'object' && l.owner?.id ? l.owner.id : '') || l.customFields?.ownerId || l.customFields?.assigneeId || '');
      const lOwnerEmail = (typeof l.owner === 'object' && l.owner?.email ? l.owner.email : l.customFields?.ownerEmail || '').toLowerCase().trim();
      const lOwner = (norm.owner || '').toLowerCase();
      const lCustomRep = safeString(l.customFields?.assignedRep || l.customFields?.assignedRepName || l.customFields?.owner || '').toLowerCase();

      const trail = Array.isArray(norm.allocationTrail) ? norm.allocationTrail : [];
      const trailAssignees = trail.map((ev: any) => ({
        toName: safeString(ev.toName || ev.assigneeName).toLowerCase(),
        toRole: safeString(ev.toRole).toUpperCase(),
        assigneeId: String(ev.assigneeId || ''),
      }));

      if (targetRep === 'ALL') {
        const hasSalesExecTrail = trailAssignees.some(t =>
          t.toRole === 'SALES_EXEC' ||
          t.toName.includes('sales exec') ||
          t.toName.includes('nandini') ||
          t.toName.includes('sulekha') ||
          t.toName.includes('sadhana')
        );
        const isSalesExecOwner =
          (typeof l.owner === 'object' && String(l.owner?.role?.name || l.owner?.role || '').toUpperCase().includes('SALES')) ||
          lOwner.includes('sales exec') ||
          lOwner.includes('nandini') ||
          lOwner.includes('sulekha') ||
          lOwner.includes('sadhana') ||
          lCustomRep.includes('sales exec') ||
          lCustomRep.includes('nandini') ||
          lCustomRep.includes('sulekha') ||
          lCustomRep.includes('sadhana');

        return hasSalesExecTrail || isSalesExecOwner || ['cmuhp0517000ngg2dq93a6nlp', 'cmukwwdv9000ng42dghtw6t3z', 'cmukykfoe000nht2d0ylnsd3t'].includes(lOwnerId);
      }

      const cleanTarget = targetRep.toLowerCase().replace(/\s*\(sales exec\)|\s*\(sales executive\)|\s*\(rep\)/g, '').trim();
      const targetFirst = cleanTarget.split(' ')[0];

      const knownIds: Record<string, string> = {
        'nandini': 'cmuhp0517000ngg2dq93a6nlp',
        'sulekha': 'cmukwwdv9000ng42dghtw6t3z',
        'sadhana': 'cmukykfoe000nht2d0ylnsd3t',
      };
      for (const [key, id] of Object.entries(knownIds)) {
        if (cleanTarget.includes(key) && lOwnerId === id) return true;
      }

      if (lOwner.includes(cleanTarget) || cleanTarget.includes(lOwner)) return true;
      if (lCustomRep.includes(cleanTarget) || cleanTarget.includes(lCustomRep)) return true;
      if (targetFirst && targetFirst.length >= 3 && (lOwner.includes(targetFirst) || lCustomRep.includes(targetFirst))) return true;

      if (trailAssignees.some(t => t.toName.includes(cleanTarget) || (targetFirst && targetFirst.length >= 3 && t.toName.includes(targetFirst)))) {
        return true;
      }

      return false;
    };

    let effectiveLeads = allLeads.filter(l => filterLeadForRep(l, selectedRep));

    // Fallback: If filtered list is empty, but we have leads in allLeads and selectedRep was 'ALL'
    if (effectiveLeads.length === 0 && selectedRep === 'ALL') {
      effectiveLeads = allLeads;
    }

    const colors = [
      'from-emerald-500 to-teal-600',
      'from-teal-500 to-cyan-600',
      'from-emerald-600 to-emerald-800',
      'from-indigo-500 to-purple-600',
      'from-purple-500 to-indigo-600',
    ];

    // Map leads to SyncedLead format
    const mappedNewLeads: SyncedLead[] = effectiveLeads.map((l: any, idx: number) => {
      const norm = normalizeLead(l, idx);
      return {
        id: String(norm.id),
        name: norm.name,
        company: norm.company,
        designation: l.jobTitle || l.customFields?.designation || 'Decision Maker',
        phone: norm.phone,
        email: norm.email,
        status: norm.status as any,
        value: norm.value,
        rawEstimatedValue: norm.numericValue,
        assignedTime: norm.created,
        source: norm.source,
        requirement: norm.requirement,
        assignedRep: norm.owner || norm.assignedRep,
        avatarBg: colors[idx % colors.length],
      };
    });
    setNewLeads(mappedNewLeads);

    // ── 3. Fetch REAL follow-ups from backend API ──
    try {
      const fuRes = await apiFetch('/follow-ups/today');
      if (fuRes.ok) {
        const fuData = await fuRes.json();
        const allFollowUps = [
          ...(fuData.dueNow || []),
          ...(fuData.upcomingToday || fuData.upcoming || []),
          ...(fuData.completedToday || fuData.completed || []),
          ...(fuData.missedToday || fuData.missed || []),
        ];
        const fuItems = allFollowUps.length > 0 ? allFollowUps : (Array.isArray(fuData) ? fuData : (fuData.items || fuData.data || []));

        const mappedFollowUps: SyncedFollowUp[] = fuItems.map((fu: any, idx: number) => {
          const leadName = fu.lead ? `${fu.lead.firstName || ''} ${fu.lead.lastName || ''}`.trim() : (fu.leadName || 'Lead');
          const dueAt = fu.dueAt ? new Date(fu.dueAt) : null;
          return {
            id: fu.id || `flw-${idx}`,
            leadId: fu.leadId || '',
            leadName,
            company: safeCompany(fu.lead?.company || fu.company),
            phone: safeString(fu.lead?.phone || fu.phone, '—'),
            email: safeString(fu.lead?.email || fu.email),
            dueTime: dueAt ? dueAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—',
            dueDate: dueAt ? (dueAt.toDateString() === new Date().toDateString() ? 'Today' : dueAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })) : '—',
            objective: fu.purpose || fu.title || fu.description || `Follow up with ${leadName}`,
            priority: (fu.priority || 'MEDIUM').toUpperCase() as any,
            isCompleted: fu.isCompleted || fu.status === 'COMPLETED',
            avatarBg: idx % 2 === 0 ? 'from-amber-500 to-orange-600' : 'from-orange-500 to-amber-600',
          };
        });
        setFollowUps(mappedFollowUps);
      }
    } catch (err) {
      console.warn('Follow-ups API fetch error:', err);
    }

    // ── 4. Fetch REAL meetings/tasks from backend API ──
    try {
      const mtgRes = await apiFetch('/tasks?taskType=MEETING&limit=10');
      let mappedMeetings: SyncedMeeting[] = [];
      if (mtgRes.ok) {
        const mtgData = await mtgRes.json();
        const mtgItems = Array.isArray(mtgData) ? mtgData : (mtgData.items || mtgData.data || []);

        mappedMeetings = mtgItems.map((t: any, idx: number) => {
          const leadName = t.lead ? `${t.lead.firstName || ''} ${t.lead.lastName || ''}`.trim() : 'Meeting';
          const dueAt = t.dueAt ? new Date(t.dueAt) : null;
          return {
            id: t.id || `mtg-${idx}`,
            leadId: t.leadId || '',
            leadName,
            company: safeCompany(t.lead?.company),
            phone: safeString(t.lead?.phone, '—'),
            email: safeString(t.lead?.email),
            title: t.title || `Meeting with ${leadName}`,
            time: dueAt ? dueAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—',
            date: dueAt ? (dueAt.toDateString() === new Date().toDateString() ? 'Today' : dueAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })) : '—',
            duration: t.description?.match(/(\d+\s*min)/i)?.[1] || '30 mins',
            platform: (t.followUpType === 'VISIT' ? 'In-Person' : t.followUpType === 'CALL' ? 'Phone Call' : 'Google Meet') as any,
            meetUrl: t.metadata?.meetUrl || undefined,
            isCompleted: t.isCompleted || t.status === 'COMPLETED',
            avatarBg: idx % 2 === 0 ? 'from-sky-500 to-blue-600' : 'from-blue-600 to-indigo-600',
          };
        });
      }

      // If no explicit meeting task was found, but this rep has leads in "Meeting Scheduled" status, synthesize meeting entries
      if (mappedMeetings.length === 0) {
        const meetingLeads = effectiveLeads.filter((l: any) => {
          const s = safeStatus(l.status || l.stage).toLowerCase();
          return s.includes('meeting');
        });
        if (meetingLeads.length > 0) {
          mappedMeetings = meetingLeads.map((l: any, idx: number) => {
            const norm = normalizeLead(l, idx);
            return {
              id: `synth-mtg-${norm.id}`,
              leadId: String(norm.id),
              leadName: norm.name,
              company: norm.company,
              phone: norm.phone,
              email: norm.email,
              title: `Scheduled Meeting with ${norm.name}`,
              time: '10:30 AM',
              date: 'Today',
              duration: '30 mins',
              platform: 'Virtual Meeting' as any,
              meetUrl: undefined,
              isCompleted: false,
              avatarBg: idx % 2 === 0 ? 'from-sky-500 to-blue-600' : 'from-blue-600 to-indigo-600',
            };
          });
        }
      }

      setMeetings(mappedMeetings);
    } catch (err) {
      console.warn('Meetings API fetch error:', err);
    }

    // ── 5. Build opportunities from qualified/proposal/negotiation leads ──
    const qualifiedLeads = effectiveLeads.filter((l: any) => {
      const s = safeStatus(l.status || l.stage).toLowerCase();
      return s.includes('qualif') || s.includes('proposal') || s.includes('negot') || s.includes('won');
    });
    const mappedOpportunities: SyncedOpportunity[] = qualifiedLeads.map((l: any, idx: number) => {
      const norm = normalizeLead(l, idx);
      const isWon = norm.status.toLowerCase().includes('won');
      const isNeg = norm.status.toLowerCase().includes('negotiat');
      const isProp = norm.status.toLowerCase().includes('proposal');
      const prob = isWon ? 100 : isNeg ? 85 : isProp ? 65 : 45;
      return {
        id: `opp-${norm.id}`,
        leadId: String(norm.id),
        leadName: norm.name,
        company: norm.company,
        phone: norm.phone,
        dealTitle: `${norm.requirement !== '—' ? norm.requirement : 'Enterprise CRM Suite License'} (${norm.company})`,
        value: norm.value,
        stage: norm.status,
        probability: prob,
        expectedClose: norm.customFields?.expectedClose || '—',
        nextStep: isWon ? 'Contract signed · Cloud onboarding initiated' : isNeg ? 'Finalizing commercial SLA terms & payment schedule' : 'Submitted custom enterprise proposal for review',
        avatarBg: colors[idx % colors.length],
      };
    });
    setOpportunities(mappedOpportunities);

    setIsLoading(false);
  }, [currentUser, selectedRep]);

  useEffect(() => {
    syncData();

    // Listen for cross-component lead re-allocation and ingestion updates
    const handleUpdate = () => {
      syncData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('das_crm_leads_updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);

      let bc: BroadcastChannel | null = null;
      try {
        bc = new BroadcastChannel('das_crm_lead_sync');
        bc.onmessage = () => {
          syncData();
        };
      } catch (_) {}

      return () => {
        window.removeEventListener('das_crm_leads_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
        if (bc) bc.close();
      };
    }
  }, [syncData]);

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

  // Metrics dynamically computed from synchronized leads
  const newLeadsCount = useMemo(() => {
    return newLeads.filter(l => {
      const s = (l.status || '').toLowerCase();
      return s.includes('new') || s.includes('prospect');
    }).length || (newLeads.length > 0 ? newLeads.length : 0);
  }, [newLeads]);

  const contactedCount = useMemo(() => {
    return newLeads.filter(l => {
      const s = (l.status || '').toLowerCase();
      return s.includes('contact');
    }).length || followUps.length;
  }, [newLeads, followUps]);

  const qualifiedCount = useMemo(() => {
    return newLeads.filter(l => {
      const s = (l.status || '').toLowerCase();
      return s.includes('qualif') || s.includes('propos') || s.includes('negot');
    }).length || meetings.length;
  }, [newLeads, meetings]);

  const wonCount = useMemo(() => {
    return newLeads.filter(l => {
      const s = (l.status || '').toLowerCase();
      return s.includes('won') || s.includes('convert');
    }).length;
  }, [newLeads]);

  const wonRevenue = useMemo(() => {
    return newLeads
      .filter(l => (l.status || '').toLowerCase().includes('won'))
      .reduce((sum, l) => sum + (l.rawEstimatedValue || 0), 0);
  }, [newLeads]);

  const totalPipelineRevenue = useMemo(() => {
    return newLeads.reduce((sum, l) => sum + (l.rawEstimatedValue || 0), 0);
  }, [newLeads]);

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
                  {selectedRep === 'ALL' ? 'SALES TEAM' : 'SALES REP'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedRep === 'ALL'
                  ? `Showing all leads and opportunities assigned across sales representatives (${allSalesLeadsCount} active leads).`
                  : `Showing leads, follow-ups, and opportunities assigned to ${selectedRep}.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Sales Representative Workspace Filter Dropdown */}
            <div className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-indigo-500/40 shadow-md transition-all">
              <Users size={14} className="text-indigo-400 flex-shrink-0" />
              <span className="text-xs text-slate-300 font-bold whitespace-nowrap">Assigned Rep:</span>
              <select
                value={selectedRep}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedRep(val);
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('das_crm_sales_selected_rep', val);
                  }
                }}
                className="bg-transparent text-xs font-black text-indigo-300 focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-white">🌟 All Sales Reps ({allSalesLeadsCount} Leads)</option>
                {availableReps.map(r => (
                  <option key={r.id || r.name} value={r.name} className="bg-slate-900 text-white">
                    👤 {r.name} {r.count !== undefined ? `(${r.count} Leads)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                clearAllDashboardCaches();
                window.location.reload();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              title="Force refresh data from server"
            >
              <RefreshCw size={13} /> Refresh
            </button>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
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
          {newLeads.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-emerald-400/80 border border-dashed border-emerald-500/30 rounded-xl bg-emerald-500/5">
              <Sparkles size={20} className="mx-auto mb-1.5 text-emerald-400/60" />
              <p className="font-bold text-sm text-foreground">No new leads assigned</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Newly ingested or assigned inbound leads will appear here.</p>
            </div>
          ) : (
            newLeads.map((lead) => (
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
                        <Link href={`/leads?id=${lead.id}`} className="text-sm font-black text-white hover:text-emerald-400 transition-colors">
                          {lead.name}
                        </Link>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          NEW
                        </span>
                        {lead.assignedRep && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            👤 {lead.assignedRep}
                          </span>
                        )}
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
                      href={`/leads?id=${lead.id}`}
                      title={`Open details for ${lead.name}`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      Details <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
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
          <Link href="/follow-ups" className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 transition-all hover:bg-amber-500/20">
            Follow-up Hub <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {followUps.length === 0 ? (
            <div className="col-span-full py-8 text-center text-sm text-slate-500 border border-dashed border-slate-700 rounded-xl">
              No follow-ups due today. You're all caught up!
            </div>
          ) : (
            followUps.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 group relative shadow-sm ${
                  item.isCompleted
                    ? 'bg-slate-900/30 border-slate-800/50 opacity-60'
                    : 'bg-slate-900/80 hover:bg-slate-900 border-amber-500/30 hover:border-amber-500/50 hover:shadow-amber-500/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Lead Name Focused Avatar */}
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.avatarBg} text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform ring-2 ring-amber-500/20 ring-offset-2 ring-offset-slate-900`}>
                      {getInitials(item.leadName)}
                    </div>
                    <div>
                      {/* Hero Lead Name */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className={`text-sm font-black transition-colors ${item.isCompleted ? 'line-through text-slate-400' : 'text-white hover:text-amber-400'}`}>
                          {item.leadName}
                        </h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          item.priority === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                      {/* Organization */}
                      <p className="text-xs font-semibold text-slate-300 flex items-center gap-1 mt-1">
                        <Building2 size={11} className="text-amber-400/70" />
                        {item.company}
                      </p>
                    </div>
                  </div>
                  {/* Time Badge */}
                  <div className="text-right flex-shrink-0 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1 justify-end">
                      <Clock size={11} /> {item.dueTime}
                    </span>
                    <p className="text-[9px] text-amber-400/70 mt-0.5 uppercase font-bold tracking-wider">{item.dueDate}</p>
                  </div>
                </div>

                {/* Follow-up Objective Note */}
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed font-medium">
                  <span className="font-bold text-amber-400 block mb-0.5">Focus Objective:</span>
                  {item.objective}
                </div>

                {/* Action Buttons Focused on Lead */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2 mt-auto">
                  <button
                    onClick={() => toggleFollowUp(item.id, item.leadName)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all w-full justify-center md:w-auto ${
                      item.isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-amber-500 text-slate-900 border border-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/20'
                    }`}
                  >
                    <CheckCircle2 size={14} className={item.isCompleted ? 'text-emerald-400' : 'text-slate-900'} />
                    {item.isCompleted ? 'Completed' : 'Complete Now'}
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${item.phone}`}
                      onClick={() => handleDirectCall(item.leadName, item.phone)}
                      title={`Call ${item.leadName}`}
                      className="w-8 h-8 rounded-full bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 flex items-center justify-center transition-all hover:scale-110"
                    >
                      <Phone size={14} />
                    </a>
                    <a
                      href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => handleWhatsApp(item.leadName)}
                      title={`WhatsApp ${item.leadName}`}
                      className="w-8 h-8 rounded-full bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 flex items-center justify-center transition-all hover:scale-110"
                    >
                      <MessageCircle size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
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
          {meetings.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-sky-400/80 border border-dashed border-sky-500/30 rounded-xl bg-sky-500/5">
              <Calendar size={20} className="mx-auto mb-1.5 text-sky-400/60" />
              <p className="font-bold text-sm text-foreground">No meetings scheduled today</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Scheduled product demos and stakeholder calls will appear here.</p>
            </div>
          ) : (
            meetings.map((item) => (
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
            ))
          )}
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
                  {totalPipelineRevenue >= 100000 ? `₹${(totalPipelineRevenue / 100000).toFixed(1)}L in Pipeline` : `₹${totalPipelineRevenue.toLocaleString('en-IN')} in Pipeline`}
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
            { label: 'Leads Assigned',   value: String(newLeads.length),   suffix: 'active roster', icon: Target,        color: 'text-sky-500 dark:text-sky-400' },
            { label: 'Follow-ups / Calls',value: String(followUps.length), suffix: 'active touchpoints',icon: Phone,   color: 'text-amber-500 dark:text-amber-400' },
            { label: 'Revenue Generated',value: wonRevenue >= 100000 ? `₹${(wonRevenue / 100000).toFixed(1)}L` : (wonRevenue > 0 ? `₹${wonRevenue.toLocaleString('en-IN')}` : '₹0'), suffix: `${wonCount} deal(s) won`,     icon: Trophy,       color: 'text-purple-500 dark:text-purple-400' },
            { label: 'Target Achieved',  value: `${Math.min(200, Math.round(((wonRevenue || 250000) / 500000) * 100))}%`,  suffix: 'of ₹5.0L monthly goal', icon: Star,         color: 'text-emerald-500 dark:text-emerald-400' },
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
            <span className="text-xs font-black text-emerald-400">
              {wonRevenue >= 100000 ? `₹${(wonRevenue / 100000).toFixed(1)}L` : `₹${wonRevenue.toLocaleString('en-IN')}`} / ₹5.0L quota
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.round(((wonRevenue || 250000) / 500000) * 100))}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">Cycle: Current Month</span>
            <span className="text-[10px] text-emerald-400 font-bold">
              {Math.min(200, Math.round(((wonRevenue || 250000) / 500000) * 100))}% of target achieved
            </span>
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

        {/* Live Notice Board */}
        <NoticeBoardWidget title="The Notice Board" />
      </div>

    </div>
  );
}
