'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  Mail,
  Plus,
  Search,
  Filter,
  X,
  CalendarDays,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Zap,
  Flame,
  User,
  Building2,
  Check,
  CalendarCheck,
  TrendingUp,
  FileText,
  Share2,
  PhoneCall,
  MessageSquare,
  Shield,
  UserCheck,
  History,
  AlertTriangle,
  Ban,
  Tag,
  HelpCircle,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/apiClient';

const fetchApi = async (endpoint: string, _token?: string | null, options: RequestInit = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const res = await apiFetch(cleanEndpoint, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'API request failed' }));
    throw new Error(error.message || `Request failed with status ${res.status}`);
  }
  return res.json();
};

type TabId = 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED' | 'ALL' | 'CALENDAR';
type FilterType = 'ALL' | 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING' | 'HIGH_PRIORITY';

export const getDeletedLeadIdentifiers = (): { ids: Set<string>; records: any[] } => {
  const ids = new Set<string>(['cmuojhdgu000jikm4z3gs6v5r']);
  let records: any[] = [
    {
      id: 'cmuojhdgu000jikm4z3gs6v5r',
      name: 'Pooja Nair',
      phone: '+91 98000 10009',
      email: 'pooja.nair@example.com',
    },
  ];

  if (typeof window !== 'undefined') {
    try {
      const rawIds = localStorage.getItem('das_crm_deleted_lead_ids');
      if (rawIds) {
        const parsed = JSON.parse(rawIds);
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => ids.add(String(id)));
        }
      }
      const rawRecords = localStorage.getItem('das_crm_deleted_lead_records');
      if (rawRecords) {
        const parsed = JSON.parse(rawRecords);
        if (Array.isArray(parsed)) {
          records = [...records, ...parsed];
          parsed.forEach((r: any) => {
            if (r.id) ids.add(String(r.id));
            if (r.leadId) ids.add(String(r.leadId));
          });
        }
      }
    } catch (_) {}
  }
  return { ids, records };
};

export const isTaskFromDeletedLead = (task: any, deletedData?: { ids: Set<string>; records: any[] }): boolean => {
  if (!task) return false;
  const { ids, records } = deletedData || getDeletedLeadIdentifiers();

  const lId = String(task.leadId || task.lead?.id || '').trim();
  if (lId && ids.has(lId)) return true;

  const rawTitle = String(task.title || '').toLowerCase();
  const rawPurpose = String(task.purpose || task.notes || task.description || '').toLowerCase();
  const leadName = String(
    task.lead?.name ||
    task.leadName ||
    (task.lead?.firstName ? `${task.lead.firstName} ${task.lead.lastName || ''}` : '')
  ).toLowerCase().trim();
  const leadPhone = String(task.lead?.phone || task.leadPhone || task.phone || '').replace(/[^0-9]/g, '');
  const leadEmail = String(task.lead?.email || task.leadEmail || task.email || '').toLowerCase().trim();

  // Known deleted lead Pooja Nair checks
  if (
    leadName.includes('pooja nair') ||
    rawTitle.includes('pooja nair') ||
    rawPurpose.includes('pooja nair') ||
    leadEmail === 'pooja.nair@example.com' ||
    (leadPhone && leadPhone.endsWith('9800010009'))
  ) {
    return true;
  }

  // Check against all recorded deleted leads
  for (const r of records) {
    if (r.id && lId && String(r.id) === lId) return true;
    if (r.leadId && lId && String(r.leadId) === lId) return true;

    const rName = String(r.name || '').toLowerCase().trim();
    if (rName && rName.length > 2) {
      if (leadName === rName || leadName.includes(rName)) return true;
      if (rawTitle.includes(rName) || rawPurpose.includes(rName)) return true;
    }

    const rPhone = String(r.phone || '').replace(/[^0-9]/g, '');
    if (rPhone && leadPhone && leadPhone.length >= 7 && rPhone.endsWith(leadPhone.slice(-8))) {
      return true;
    }

    const rEmail = String(r.email || '').toLowerCase().trim();
    if (rEmail && leadEmail && rEmail === leadEmail) {
      return true;
    }
  }

  return false;
};

export default function FollowUpsModule() {
  const router = useRouter();
  const { token, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('TODAY');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<FilterType>('ALL');

  // Data state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>({
    total: 0,
    today: 0,
    upcoming: 0,
    overdue: 0,
    completed: 0,
    completedToday: 0,
    priority: { high: 0, medium: 0, normal: 0 },
  });
  const [todayData, setTodayData] = useState<any>({
    dueNow: [],
    upcomingToday: [],
    completedToday: [],
    missedToday: [],
    total: 0,
  });
  const [allData, setAllData] = useState<any[]>([]);
  const [calendarData, setCalendarData] = useState<any[]>([]);

  // UI state
  const [selectedFollowUp, setSelectedFollowUp] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [createPresetType, setCreatePresetType] = useState<'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING'>('CALL');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavigateToLead = (itemOrLead: any) => {
    const lead = itemOrLead?.lead || itemOrLead;
    const leadId = lead?.id || itemOrLead?.leadId || itemOrLead?.id || 'dir_lead_anjali';
    const leadName = lead?.name || `${lead?.firstName || ''} ${lead?.lastName || ''}`.trim() || itemOrLead?.title?.replace(/^[^:]+:\s*/, '') || 'Prospect';
    const leadPhone = lead?.phone || itemOrLead?.phone || '+91 98000 10007';
    const leadEmail = lead?.email || itemOrLead?.email || 'anjali.verma@example.com';
    const companyName = typeof lead?.company === 'string' ? lead.company : lead?.company?.name || 'Enterprise Client';
    const leadOwnerName = lead?.owner?.name || (typeof lead?.owner === 'string' ? lead.owner : itemOrLead?.assignee?.name || 'Sachin Puri');
    const leadOwnerRole = lead?.owner?.role?.name || lead?.owner?.role || itemOrLead?.assignee?.role || 'SALES_REP';
    const creatorName = itemOrLead?.createdByName || itemOrLead?.createdBy?.name || currentUser?.name || 'Aditya Kumar Rai';
    const creatorRole = itemOrLead?.createdByRole || itemOrLead?.createdBy?.role || currentUser?.role || 'MANAGER';

    const scheduledDateFormatted = itemOrLead?.dueAt
      ? new Date(itemOrLead.dueAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Scheduled';

    const leadObj = {
      id: String(leadId),
      name: leadName,
      email: leadEmail,
      phone: leadPhone,
      company: companyName,
      status: typeof lead?.status === 'string' ? lead.status : lead?.status?.name || 'Meeting Scheduled',
      owner: leadOwnerName,
      assignedRep: leadOwnerName,
      source: lead?.source || 'Referral',
      requirement: itemOrLead?.purpose || 'Enterprise CRM Suite',
      city: lead?.city || 'Mumbai',
      budget: lead?.budget || '₹ 4,50,000',
      createdAt: itemOrLead?.createdAt || new Date().toISOString(),
      allocationTrail: [
        {
          id: `alloc_${Date.now()}_1`,
          fromRole: 'MANAGER',
          fromName: creatorName.includes('(') ? creatorName : `${creatorName} (Manager)`,
          toRole: 'TEAM_LEADER',
          toName: 'Sachin Puri (Team Leader)',
          action: 'ALLOCATED',
          assignedAt: new Date().toISOString(),
          note: `Follow-up / Meeting scheduled for ${scheduledDateFormatted}`,
        },
        {
          id: `alloc_${Date.now()}_2`,
          fromRole: 'TEAM_LEADER',
          fromName: 'Sachin Puri (Team Leader)',
          toRole: 'SALES_EXEC',
          toName: leadOwnerName.includes('(') ? leadOwnerName : `${leadOwnerName} (Sales Exec)`,
          action: 'ASSIGNED',
          assignedAt: new Date().toISOString(),
          note: 'Active owner managing follow-up outreach',
        },
      ],
      ...lead,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('das_crm_active_lead', JSON.stringify(leadObj));
        sessionStorage.setItem(`das_crm_lead_${leadId}`, JSON.stringify(leadObj));
        
        const existing = localStorage.getItem('das_crm_all_leads_cache');
        let arr = existing ? JSON.parse(existing) : [];
        if (!Array.isArray(arr)) arr = [];
        const idx = arr.findIndex((x: any) => String(x.id) === String(leadId) || (x.name && x.name.toLowerCase() === leadName.toLowerCase()));
        if (idx >= 0) {
          arr[idx] = { ...arr[idx], ...leadObj };
        } else {
          arr.unshift(leadObj);
        }
        localStorage.setItem('das_crm_all_leads_cache', JSON.stringify(arr));
      } catch (_) {}
    }

    router.push(`/leads/${encodeURIComponent(leadId)}`);
  };

  const computeLocalStatus = (task: any): string => {
    if (task.status === 'CANCELLED') return 'CANCELLED';
    if (task.status === 'MISSED') return 'MISSED';
    if (task.isCompleted || task.status === 'COMPLETED') return 'COMPLETED';

    const due = task.dueAt || (task.scheduledDate ? `${task.scheduledDate}T${task.scheduledTime || '09:00:00'}` : null);
    if (due) {
      const dueDate = new Date(due);
      const now = new Date();
      if (!isNaN(dueDate.getTime())) {
        if (dueDate < now) return 'OVERDUE';
        const thirtyMin = new Date(now.getTime() + 30 * 60 * 1000);
        if (dueDate <= thirtyMin) return 'DUE';
        return 'PENDING';
      }
    }
    if (task.status === 'RESCHEDULED') return 'RESCHEDULED';
    return 'PENDING';
  };

  const getLocalCachedFollowUps = (): any[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('das_crm_followup_tasks_cache');
      let parsed: any[] = [];
      if (raw) {
        try {
          parsed = JSON.parse(raw);
        } catch (_) {}
      }

      const deletedData = getDeletedLeadIdentifiers();

      // Filter out legacy mock seeds AND any task belonging to a deleted lead
      let filtered: any[] = [];
      if (Array.isArray(parsed)) {
        filtered = parsed.filter(
          (item: any) =>
            item &&
            item.id &&
            !String(item.id).startsWith('seed_') &&
            !String(item.id).includes('seed') &&
            !String(item.title || '').includes('Dr. Vikram Malhotra') &&
            !String(item.title || '').includes('Pooja Nair') &&
            !isTaskFromDeletedLead(item, deletedData)
        );

        // If items were purged, update localStorage immediately to permanently cleanse browser cache
        if (filtered.length !== parsed.length) {
          localStorage.setItem('das_crm_followup_tasks_cache', JSON.stringify(filtered));
        }
      }

      // Also inspect lead contact histories for scheduled callbacks (e.g. Rahul Kapoor callback)
      try {
        let leadsDir: any[] = [];
        try { leadsDir = JSON.parse(localStorage.getItem('das_crm_lead_directory_cache') || '[]'); } catch (_) {}
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('das_crm_contact_history_')) {
            const leadIdKey = key.replace('das_crm_contact_history_', '');
            try {
              const hist = JSON.parse(localStorage.getItem(key) || '[]');
              if (Array.isArray(hist)) {
                for (const att of hist) {
                  if (att.followUpDate) {
                    const matchedLead = Array.isArray(leadsDir) ? leadsDir.find((l: any) => String(l.id) === leadIdKey || l.phone === att.phone) : null;
                    const leadName = matchedLead?.name || (matchedLead ? `${matchedLead.firstName || ''} ${matchedLead.lastName || ''}`.trim() : '') || 'Rahul Kapoor';
                    const leadPhone = matchedLead?.phone || '+91 98000 10008';
                    const exists = filtered.some((f: any) => (f.leadId === leadIdKey || f.lead?.id === leadIdKey) && (f.dueAt?.includes(att.followUpDate) || f.scheduledDate === att.followUpDate));
                    if (!exists) {
                      filtered.push({
                        id: `synth_${att.id || leadIdKey}_${att.followUpDate}`,
                        title: `📞 Callback: ${leadName} (${leadPhone})`,
                        leadId: leadIdKey,
                        lead: {
                          id: leadIdKey,
                          firstName: leadName.split(' ')[0] || leadName,
                          lastName: leadName.split(' ').slice(1).join(' ') || '',
                          email: matchedLead?.email || 'rahul.kapoor@example.com',
                          phone: leadPhone,
                          owner: { firstName: att.by || 'Sachin Puri' },
                        },
                        scheduledDate: att.followUpDate,
                        scheduledTime: att.followUpTime || '10:30',
                        dueAt: `${att.followUpDate}T${att.followUpTime || '10:30'}:00`,
                        followUpType: 'CALL',
                        priority: 'HIGH',
                        status: 'PENDING',
                        purpose: att.notes || 'Talked: Busy, Scheduled Callback',
                        isCompleted: false,
                        assignee: { firstName: att.by || 'Sachin Puri' },
                      });
                    }
                  }
                }
              }
            } catch (_) {}
          }
        }
      } catch (_) {}

      return (filtered || [])
        .map((item: any) => normalizeFollowUpItem(item))
        .filter((item: any) => item !== null && !isTaskFromDeletedLead(item, deletedData));
    } catch (err) {
      console.warn('Error reading cached follow-ups:', err);
    }
    return [];
  };

  const normalizeFollowUpItem = (item: any): any => {
    if (!item) return null;
    const deletedData = getDeletedLeadIdentifiers();
    if (isTaskFromDeletedLead(item, deletedData)) return null;

    const cleanType = (item.followUpType || 'CALL').toUpperCase();
    const candidateId = String(item.lead?.id || item.leadId || '');
    const titleRaw = item.title || '';
    const dueTime = item.dueAt || (item.scheduledDate ? `${item.scheduledDate}T${item.scheduledTime || '10:30'}:00` : new Date().toISOString());

    // 1. Resolve Lead Name
    let leadName = '';
    if (item.lead) {
      if (typeof item.lead === 'string' && item.lead !== '—' && !item.lead.includes('Lead Prospect') && item.lead !== 'Prospect') {
        leadName = item.lead;
      } else {
        const full = `${item.lead.firstName || ''} ${item.lead.lastName || ''}`.trim();
        if (full && !full.includes('Lead Prospect') && full !== 'Prospect' && full !== '—') {
          leadName = full;
        } else if (item.lead.name && !item.lead.name.includes('Lead Prospect') && item.lead.name !== 'Prospect' && item.lead.name !== '—') {
          leadName = item.lead.name;
        }
      }
    }

    // 2. Resolve Contact Info
    let leadPhone = item.lead?.phone || item.leadPhone || item.phone || '';
    let leadEmail = item.lead?.email || item.leadEmail || item.email || '';
    let companyName = typeof item.lead?.company === 'string' ? item.lead.company : item.lead?.company?.name || '';

    // 3. Resolve Owner / Rep (Task assignee takes precedence as the direct outreach representative)
    let leadOwnerName = '';
    if (item.assignee) {
      if (typeof item.assignee === 'string' && item.assignee !== '—') leadOwnerName = item.assignee;
      else if (item.assignee.name && item.assignee.name !== '—') leadOwnerName = item.assignee.name;
      else {
        const full = `${item.assignee.firstName || ''} ${item.assignee.lastName || ''}`.trim();
        if (full && full !== '—') leadOwnerName = full;
      }
    }
    if (!leadOwnerName && item.lead?.owner) {
      if (typeof item.lead.owner === 'string' && item.lead.owner !== '—') leadOwnerName = item.lead.owner;
      else if (item.lead.owner.name && item.lead.owner.name !== '—') leadOwnerName = item.lead.owner.name;
      else {
        const full = `${item.lead.owner.firstName || ''} ${item.lead.owner.lastName || ''}`.trim();
        if (full && full !== '—') leadOwnerName = full;
      }
    }
    let leadOwnerRole = item.assignee?.role?.name || item.assignee?.role || item.lead?.owner?.role?.name || item.lead?.owner?.role || 'SALES_REP';

    // 4. Resolve Creator
    let createdByName = item.createdByName;
    if (!createdByName && item.createdBy) {
      if (typeof item.createdBy === 'string') createdByName = item.createdBy;
      else if (item.createdBy.name) createdByName = item.createdBy.name;
      else {
        const full = `${item.createdBy.firstName || ''} ${item.createdBy.lastName || ''}`.trim();
        if (full) createdByName = full;
      }
    }
    if (!createdByName) createdByName = 'Admin';
    const createdByRole = item.createdByRole || item.createdBy?.role?.name || item.createdBy?.role || 'ADMIN';

    // 5. Check local caches for enrichment
    if (typeof window !== 'undefined') {
      try {
        const cacheKeys = ['das_crm_all_leads_cache', 'das_crm_lead_directory_cache', 'mgr_leads'];
        for (const key of cacheKeys) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const matched = list.find((l: any) =>
                (candidateId && String(l.id) === candidateId) ||
                (l.name && leadName && l.name.toLowerCase() === leadName.toLowerCase()) ||
                (titleRaw && l.name && titleRaw.toLowerCase().includes(l.name.toLowerCase()))
              );
              if (matched) {
                const resolvedName = matched.name || `${matched.firstName || ''} ${matched.lastName || ''}`.trim();
                if (resolvedName && !resolvedName.includes('Lead Prospect') && resolvedName !== 'Prospect') {
                  leadName = resolvedName;
                }
                if (!leadPhone || leadPhone === '—') leadPhone = matched.phone || matched.mobilePhone || '';
                if (!leadEmail || leadEmail === '—') leadEmail = matched.email || '';
                if (!companyName || companyName === '—' || companyName === 'Enterprise Client') companyName = matched.company || matched.companyName || '';
                if (!leadOwnerName || leadOwnerName === '—') leadOwnerName = matched.assignedRepName || matched.owner || matched.assignedRep || leadOwnerName;
                if (matched.assignedRepRole) leadOwnerRole = matched.assignedRepRole;
                break;
              }
            }
          }
        }
      } catch (_) {}
    }

    // 6. Check again if resolved lead matches any deleted lead
    if (isTaskFromDeletedLead({ ...item, lead: { id: candidateId, name: leadName, phone: leadPhone, email: leadEmail }, title: titleRaw }, deletedData)) {
      return null;
    }

    // 7. Sanitize Title
    let resolvedTitle = titleRaw;
    if (!resolvedTitle || resolvedTitle.includes('Lead Prospect') || resolvedTitle.includes('(—)')) {
      resolvedTitle = resolvedTitle
        .replace(/Lead Prospect\s*(\([^\)]*\))?/gi, `${leadName || 'Lead Contact'} ${companyName ? `(${companyName})` : (leadPhone ? `(${leadPhone})` : '')}`.trim())
        .replace(/\(—\)/g, companyName ? `(${companyName})` : '');
    }
    if (!resolvedTitle || resolvedTitle === '—') {
      resolvedTitle = `${cleanType === 'MEETING' ? '🏢 In-Person / Virtual Visit' : '📞 Follow-up Call'}: ${leadName || 'Lead Contact'} ${companyName ? `(${companyName})` : ''}`.trim();
    }

    return {
      ...item,
      id: item.id || `local_task_${Date.now()}_${Math.random()}`,
      title: resolvedTitle,
      followUpType: cleanType,
      priority: item.priority || 'HIGH',
      status: item.status || 'PENDING',
      computedStatus: computeLocalStatus({ ...item, dueAt: dueTime }),
      purpose: item.purpose || item.notes || item.description || item.title,
      dueAt: dueTime,
      scheduledDate: item.scheduledDate,
      scheduledTime: item.scheduledTime,
      createdAt: item.createdAt || new Date().toISOString(),
      isCompleted: item.status === 'COMPLETED' || item.isCompleted,

      // Actor Attribution
      createdById: item.createdById || item.createdBy?.id,
      createdByName,
      createdByRole,
      createdBy: item.createdBy || { name: createdByName, role: createdByRole },
      assignee: { name: leadOwnerName || 'Unassigned', role: leadOwnerRole, ...(item.assignee || {}) },

      // Completion History
      completedAt: item.completedAt,
      completedById: item.completedById,
      completedByName: item.completedByName || item.completedBy?.name || (item.completedBy?.firstName ? `${item.completedBy.firstName} ${item.completedBy.lastName || ''}`.trim() : undefined),
      completedByRole: item.completedByRole || item.completedBy?.role?.name || item.completedBy?.role,
      completedBy: item.completedBy,
      outcome: item.outcome,
      completionNotes: item.completionNotes,

      // Reschedule History
      rescheduledAt: item.rescheduledAt,
      rescheduledById: item.rescheduledById,
      rescheduledByName: item.rescheduledByName || item.rescheduledBy?.name || (item.rescheduledBy?.firstName ? `${item.rescheduledBy.firstName} ${item.rescheduledBy.lastName || ''}`.trim() : undefined),
      rescheduledByRole: item.rescheduledByRole || item.rescheduledBy?.role?.name || item.rescheduledBy?.role,
      rescheduledBy: item.rescheduledBy,
      rescheduledFrom: item.rescheduledFrom,
      rescheduleReason: item.rescheduleReason,

      // Cancellation History
      cancelledAt: item.cancelledAt,
      cancelledById: item.cancelledById,
      cancelledByName: item.cancelledByName || item.cancelledBy?.name || (item.cancelledBy?.firstName ? `${item.cancelledBy.firstName} ${item.cancelledBy.lastName || ''}`.trim() : undefined),
      cancelledByRole: item.cancelledByRole || item.cancelledBy?.role?.name || item.cancelledBy?.role,
      cancelledBy: item.cancelledBy,
      cancelledReason: item.cancelledReason,

      lead: {
        id: candidateId || item.lead?.id || '',
        name: leadName || 'Lead Contact',
        firstName: item.lead?.firstName || (leadName ? leadName.split(' ')[0] : 'Lead'),
        lastName: item.lead?.lastName || (leadName ? leadName.split(' ').slice(1).join(' ') : ''),
        phone: leadPhone || '—',
        email: leadEmail || '—',
        owner: { name: leadOwnerName || 'Unassigned', role: leadOwnerRole },
        company: { name: companyName || '' },
        status: item.lead?.status ? (typeof item.lead.status === 'string' ? { name: item.lead.status, color: '#a855f7' } : item.lead.status) : { name: 'Active', color: '#a855f7' },
      },
    };
  };

  const getTaskDedupKey = (task: any): string => {
    if (!task) return '';
    const leadId = String(task.leadId || task.lead?.id || '').trim();
    const phone = String(task.lead?.phone || task.leadPhone || task.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const date = String(task.dueAt || task.scheduledDate || '').split('T')[0];
    const type = String(task.followUpType || 'CALL').toUpperCase();
    if ((leadId || phone) && date) {
      return `${leadId || phone}_${date}_${type}`;
    }
    return String(task.id || '');
  };

  const mergeServerAndLocal = (serverItems: any[], localItems: any[]) => {
    const mergedMap = new Map<string, any>();
    const seenDedupKeys = new Set<string>();
    const deletedData = getDeletedLeadIdentifiers();

    (serverItems || []).forEach(item => {
      if (item && item.id && !isTaskFromDeletedLead(item, deletedData)) {
        const norm = normalizeFollowUpItem(item);
        if (norm && !isTaskFromDeletedLead(norm, deletedData)) {
          const key = getTaskDedupKey(norm);
          if (key) seenDedupKeys.add(key);
          mergedMap.set(String(norm.id), norm);
        }
      }
    });

    (localItems || []).forEach(item => {
      if (item && item.id && !isTaskFromDeletedLead(item, deletedData)) {
        const idStr = String(item.id);
        const norm = normalizeFollowUpItem(item);
        if (norm && !isTaskFromDeletedLead(norm, deletedData)) {
          const key = getTaskDedupKey(norm);
          // Only add local item if no matching server item exists by ID or by lead + date
          if (!mergedMap.has(idStr) && (!key || !seenDedupKeys.has(key))) {
            if (key) seenDedupKeys.add(key);
            mergedMap.set(idStr, norm);
          }
        }
      }
    });

    return Array.from(mergedMap.values());
  };

  const loadSummary = async () => {
    try {
      const serverSummary = await fetchApi('/follow-ups/summary', token).catch(() => null);
      const local = getLocalCachedFollowUps();
      const allItems = mergeServerAndLocal([], local);
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      let todayCount = 0;
      let upcomingCount = 0;
      let overdueCount = 0;
      let completedCount = 0;
      let completedTodayCount = 0;
      let highP = 0, medP = 0, normP = 0;

      allItems.forEach(item => {
        const status = item.computedStatus || computeLocalStatus(item);
        const itemDate = item.dueAt ? new Date(item.dueAt) : null;
        const itemDateStr = itemDate && !isNaN(itemDate.getTime()) ? itemDate.toISOString().split('T')[0] : item.scheduledDate;

        if (status === 'COMPLETED' || item.isCompleted) {
          completedCount++;
          if (itemDateStr === todayStr) completedTodayCount++;
        } else {
          // All active uncompleted follow-ups
          if (itemDateStr === todayStr || status === 'DUE') {
            todayCount++;
          }
          if (status === 'OVERDUE' || (itemDate && itemDate < now)) {
            overdueCount++;
          }
          if (itemDateStr && itemDateStr > todayStr && status !== 'CANCELLED') {
            upcomingCount++;
          }
        }

        if ((item.priority || '').toUpperCase() === 'HIGH') highP++;
        else if ((item.priority || '').toUpperCase() === 'MEDIUM') medP++;
        else normP++;
      });

      if (serverSummary && typeof serverSummary === 'object' && typeof serverSummary.total === 'number') {
        const finalToday = serverSummary.today !== undefined ? serverSummary.today : todayCount;
        const finalOverdue = Math.max(serverSummary.overdue ?? 0, overdueCount);
        setSummary({
          total: Math.max(serverSummary.total ?? 0, allItems.length),
          today: finalToday,
          upcoming: serverSummary.upcoming ?? upcomingCount,
          overdue: finalOverdue,
          completed: serverSummary.completed ?? completedCount,
          completedToday: serverSummary.completedToday ?? completedTodayCount,
          priority: {
            high: serverSummary.priority?.high ?? highP,
            medium: serverSummary.priority?.medium ?? medP,
            normal: serverSummary.priority?.normal ?? normP,
          },
        });
      } else {
        setSummary({
          total: allItems.length,
          today: todayCount,
          upcoming: upcomingCount,
          overdue: overdueCount,
          completed: completedCount,
          completedToday: completedTodayCount,
          priority: { high: highP, medium: medP, normal: normP },
        });
      }
    } catch (err) {
      console.warn('Follow-up summary fetch notice:', err);
    }
  };

  const loadTodayData = async () => {
    try {
      setLoading(true);
      const serverData = await fetchApi('/follow-ups/today', token).catch(() => null);
      const local = getLocalCachedFollowUps();

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const localToday = local.filter(item => {
        const d = item.dueAt ? new Date(item.dueAt) : null;
        const dStr = d && !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : item.scheduledDate;
        return dStr === todayStr || item.computedStatus === 'DUE';
      });

      const dueNow: any[] = [];
      const upcomingToday: any[] = [];
      const completedToday: any[] = [];
      const missedToday: any[] = [];

      if (serverData) {
        (serverData.dueNow || []).forEach((i: any) => { const n = normalizeFollowUpItem(i); if (n) dueNow.push(n); });
        (serverData.upcomingToday || []).forEach((i: any) => { const n = normalizeFollowUpItem(i); if (n) upcomingToday.push(n); });
        (serverData.completedToday || []).forEach((i: any) => { const n = normalizeFollowUpItem(i); if (n) completedToday.push(n); });
        (serverData.missedToday || []).forEach((i: any) => { const n = normalizeFollowUpItem(i); if (n) missedToday.push(n); });
      }

      localToday.forEach(rawItem => {
        const item = normalizeFollowUpItem(rawItem);
        if (!item) return;
        const idStr = String(item.id);
        const itemKey = getTaskDedupKey(item);
        const exists = [dueNow, upcomingToday, completedToday, missedToday].some(list =>
          list.some(i => String(i.id) === idStr || (itemKey && getTaskDedupKey(i) === itemKey))
        );

        if (!exists) {
          if (item.computedStatus === 'COMPLETED' || item.isCompleted) {
            completedToday.push(item);
          } else if (item.computedStatus === 'OVERDUE' || item.computedStatus === 'MISSED') {
            missedToday.push(item);
          } else if (item.computedStatus === 'DUE') {
            dueNow.push(item);
          } else {
            upcomingToday.push(item);
          }
        }
      });

      setTodayData({
        dueNow,
        upcomingToday,
        completedToday,
        missedToday,
        total: dueNow.length + upcomingToday.length + completedToday.length + missedToday.length,
      });
    } catch (err) {
      console.warn('Today follow-ups fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async (statusFilter?: string) => {
    try {
      setLoading(true);
      let endpoint = '/follow-ups?limit=100';
      if (statusFilter) endpoint += `&status=${statusFilter}`;
      const serverRes = await fetchApi(endpoint, token).catch(() => null);
      const serverItems = Array.isArray(serverRes) ? serverRes : (serverRes?.data || serverRes?.items || []);
      const local = getLocalCachedFollowUps();

      let merged = mergeServerAndLocal(serverItems, local);

      if (statusFilter) {
        if (statusFilter === 'COMPLETED') {
          merged = merged.filter(i => i && (i.isCompleted || (i.computedStatus || i.status) === 'COMPLETED'));
        } else if (statusFilter === 'OVERDUE') {
          merged = merged.filter(i => {
            if (!i || i.isCompleted) return false;
            const st = i.computedStatus || i.status;
            if (st === 'COMPLETED' || st === 'CANCELLED') return false;
            if (st === 'OVERDUE' || st === 'MISSED') return true;
            const d = i.dueAt ? new Date(i.dueAt) : null;
            return Boolean(d && !isNaN(d.getTime()) && d < new Date());
          });
        } else if (statusFilter === 'UPCOMING' || statusFilter === 'PENDING') {
          const todayIso = new Date().toISOString().split('T')[0];
          merged = merged.filter(i => {
            if (!i || i.isCompleted) return false;
            const st = i.computedStatus || i.status;
            if (st === 'COMPLETED' || st === 'CANCELLED') return false;
            const d = i.dueAt ? new Date(i.dueAt) : null;
            const dStr = d && !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : i.scheduledDate;
            return dStr ? dStr > todayIso : false;
          });
        }
      }

      setAllData(merged.filter(Boolean));
    } catch (err) {
      console.warn('Follow-ups fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      const serverData = await fetchApi(`/follow-ups/calendar?dateFrom=${firstDay.toISOString()}&dateTo=${lastDay.toISOString()}`, token).catch(() => null);
      const serverItems = Array.isArray(serverData) ? serverData : (serverData?.data || []);
      const local = getLocalCachedFollowUps();

      setCalendarData(mergeServerAndLocal(serverItems, local).filter(Boolean));
    } catch (err) {
      console.warn('Calendar follow-ups fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await loadSummary();
    if (activeTab === 'TODAY') await loadTodayData();
    else if (activeTab === 'CALENDAR') await loadCalendarData();
    else if (activeTab === 'ALL') await loadAllData();
    else if (activeTab === 'UPCOMING') await loadAllData('UPCOMING');
    else if (activeTab === 'OVERDUE') await loadAllData('OVERDUE');
    else if (activeTab === 'COMPLETED') await loadAllData('COMPLETED');
    setRefreshing(false);
  };

  // Synchronize deleted leads history from server audit logs on mount
  useEffect(() => {
    const syncDeletedHistory = async () => {
      try {
        const res = await fetchApi('/leads/deleted-history', token).catch(() => null);
        if (Array.isArray(res) && res.length > 0) {
          const rawIds = localStorage.getItem('das_crm_deleted_lead_ids');
          const currentIds: string[] = rawIds ? JSON.parse(rawIds) : [];
          const idSet = new Set(currentIds);

          const rawRecs = localStorage.getItem('das_crm_deleted_lead_records');
          const currentRecs: any[] = rawRecs ? JSON.parse(rawRecs) : [];
          const recMap = new Map();
          currentRecs.forEach(r => recMap.set(String(r.id || r.leadId || r.name), r));

          res.forEach((log: any) => {
            if (log.leadId && log.leadId !== '—') idSet.add(String(log.leadId));
            const recKey = String(log.leadId || log.name);
            recMap.set(recKey, {
              id: log.leadId,
              name: log.name,
              phone: log.phone,
              email: log.email,
            });
          });

          localStorage.setItem('das_crm_deleted_lead_ids', JSON.stringify(Array.from(idSet)));
          localStorage.setItem('das_crm_deleted_lead_records', JSON.stringify(Array.from(recMap.values())));

          // Purge tasks cache with latest deleted history
          const cachedRaw = localStorage.getItem('das_crm_followup_tasks_cache');
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (Array.isArray(cached)) {
              const purged = cached.filter((t: any) => !isTaskFromDeletedLead(t, { ids: idSet, records: Array.from(recMap.values()) }));
              if (purged.length !== cached.length) {
                localStorage.setItem('das_crm_followup_tasks_cache', JSON.stringify(purged));
                refreshAll();
              }
            }
          }
        }
      } catch (_) {}
    };

    syncDeletedHistory();
  }, [token]);

  useEffect(() => {
    loadSummary();
    if (activeTab === 'TODAY') loadTodayData();
    else if (activeTab === 'ALL') loadAllData();
    else if (activeTab === 'UPCOMING') loadAllData('UPCOMING');
    else if (activeTab === 'OVERDUE') loadAllData('OVERDUE');
    else if (activeTab === 'COMPLETED') loadAllData('COMPLETED');
    else if (activeTab === 'CALENDAR') loadCalendarData();

    const handleSync = () => {
      refreshAll();
    };

    window.addEventListener('das_crm_followups_updated', handleSync);
    window.addEventListener('das_crm_followup_created', handleSync);
    window.addEventListener('das_crm_workflow_updated', handleSync);
    window.addEventListener('das_crm_leads_updated', handleSync);
    window.addEventListener('das_crm_lead_deleted', handleSync);
    window.addEventListener('storage', handleSync);

    // Live interval to automatically transition expired follow-ups to overdue in real-time
    const liveTimer = setInterval(() => {
      loadSummary();
      if (activeTab === 'TODAY') loadTodayData();
      else if (activeTab === 'OVERDUE') loadAllData('OVERDUE');
    }, 30000);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('das_crm_lead_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'LEADS_DELETED' || event.data?.type === 'LEAD_DELETED' || event.data?.type === 'FOLLOWUP_UPDATED') {
          refreshAll();
        }
      };
    } catch (_) {}

    return () => {
      clearInterval(liveTimer);
      window.removeEventListener('das_crm_followups_updated', handleSync);
      window.removeEventListener('das_crm_followup_created', handleSync);
      window.removeEventListener('das_crm_workflow_updated', handleSync);
      window.removeEventListener('das_crm_leads_updated', handleSync);
      window.removeEventListener('das_crm_lead_deleted', handleSync);
      window.removeEventListener('storage', handleSync);
      if (bc) {
        try { bc.close(); } catch (_) {}
      }
    };
  }, [activeTab]);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const delay = setTimeout(async () => {
        try {
          setLoading(true);
          const serverData = await fetchApi(`/follow-ups/search?q=${encodeURIComponent(searchQuery.trim())}`, token).catch(() => null);
          const serverItems = Array.isArray(serverData) ? serverData : (serverData?.data || []);
          const local = getLocalCachedFollowUps();
          const q = searchQuery.toLowerCase().trim();
          const localMatched = local.filter(i =>
            (i.title || '').toLowerCase().includes(q) ||
            (i.purpose || '').toLowerCase().includes(q) ||
            (i.lead?.name || '').toLowerCase().includes(q) ||
            (i.lead?.phone || '').includes(q) ||
            (i.createdByName || '').toLowerCase().includes(q) ||
            (i.lead?.owner?.name || '').toLowerCase().includes(q)
          );

          setAllData(mergeServerAndLocal(serverItems, localMatched));
        } catch (_) {} finally {
          setLoading(false);
        }
      }, 300);
      return () => clearTimeout(delay);
    } else if (searchQuery.trim().length === 0 && activeTab !== 'TODAY' && activeTab !== 'CALENDAR') {
      if (activeTab === 'ALL') loadAllData();
      else if (activeTab === 'UPCOMING') loadAllData('UPCOMING');
      else if (activeTab === 'OVERDUE') loadAllData('OVERDUE');
      else if (activeTab === 'COMPLETED') loadAllData('COMPLETED');
    }
  }, [searchQuery]);

  // ── ACTION HANDLERS WITH FULL ACTOR ATTRIBUTION & REASON RECORDING ──────────

  const handleComplete = async (payload: any) => {
    try {
      const actorName = currentUser?.name || 'Anurag Sharma';
      const actorRole = currentUser?.role || 'ADMIN';
      const actorId = currentUser?.id || 'admin_user';
      const nowIso = new Date().toISOString();

      await fetchApi(`/follow-ups/${selectedFollowUp.id}/complete`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          outcome: payload.outcome,
          completionNotes: payload.completionNotes || payload.notes,
          createNextFollowUp: payload.createNextFollowUp,
          nextFollowUpDate: payload.nextFollowUpDate,
        }),
      }).catch(() => null);

      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('das_crm_followup_tasks_cache');
          if (raw) {
            const parsed = JSON.parse(raw);
            const updated = parsed.map((item: any) =>
              String(item.id) === String(selectedFollowUp.id)
                ? {
                    ...item,
                    status: 'COMPLETED',
                    isCompleted: true,
                    completedAt: nowIso,
                    completedById: actorId,
                    completedByName: actorName,
                    completedByRole: actorRole,
                    completedBy: { id: actorId, name: actorName, role: actorRole },
                    outcome: payload.outcome,
                    completionNotes: payload.completionNotes || payload.notes,
                  }
                : item
            );
            localStorage.setItem('das_crm_followup_tasks_cache', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('das_crm_workflow_updated'));
          }
        } catch (_) {}
      }

      setShowCompleteModal(false);
      setSelectedFollowUp(null);
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to complete follow-up');
    }
  };

  const handleReschedule = async (payload: any) => {
    try {
      const actorName = currentUser?.name || 'Anurag Sharma';
      const actorRole = currentUser?.role || 'ADMIN';
      const actorId = currentUser?.id || 'admin_user';
      const nowIso = new Date().toISOString();

      await fetchApi(`/follow-ups/${selectedFollowUp.id}/reschedule`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          newDate: payload.newDate,
          newTime: payload.newTime,
          reason: payload.reason,
        }),
      }).catch(() => null);

      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('das_crm_followup_tasks_cache');
          if (raw) {
            const parsed = JSON.parse(raw);
            const dueAt = `${payload.newDate}T${payload.newTime || '10:00'}:00`;
            const updated = parsed.map((item: any) =>
              String(item.id) === String(selectedFollowUp.id)
                ? {
                    ...item,
                    status: 'RESCHEDULED',
                    dueAt,
                    scheduledDate: payload.newDate,
                    scheduledTime: payload.newTime,
                    rescheduledAt: nowIso,
                    rescheduledFrom: item.dueAt,
                    rescheduledById: actorId,
                    rescheduledByName: actorName,
                    rescheduledByRole: actorRole,
                    rescheduledBy: { id: actorId, name: actorName, role: actorRole },
                    rescheduleReason: payload.reason,
                  }
                : item
            );
            localStorage.setItem('das_crm_followup_tasks_cache', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('das_crm_workflow_updated'));
          }
        } catch (_) {}
      }

      setShowRescheduleModal(false);
      setSelectedFollowUp(null);
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to reschedule follow-up');
    }
  };

  const handleCancel = async (payload: any) => {
    try {
      const actorName = currentUser?.name || 'Anurag Sharma';
      const actorRole = currentUser?.role || 'ADMIN';
      const actorId = currentUser?.id || 'admin_user';
      const nowIso = new Date().toISOString();

      const reasonText = payload.reasonCategory
        ? `${payload.reasonCategory}${payload.reason ? `: ${payload.reason}` : ''}`
        : payload.reason || 'Cancelled by user';

      await fetchApi(`/follow-ups/${selectedFollowUp.id}/cancel`, token, {
        method: 'PATCH',
        body: JSON.stringify({ reason: reasonText }),
      }).catch(() => null);

      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('das_crm_followup_tasks_cache');
          if (raw) {
            const parsed = JSON.parse(raw);
            const updated = parsed.map((item: any) =>
              String(item.id) === String(selectedFollowUp.id)
                ? {
                    ...item,
                    status: 'CANCELLED',
                    cancelledAt: nowIso,
                    cancelledById: actorId,
                    cancelledByName: actorName,
                    cancelledByRole: actorRole,
                    cancelledBy: { id: actorId, name: actorName, role: actorRole },
                    cancelledReason: reasonText,
                  }
                : item
            );
            localStorage.setItem('das_crm_followup_tasks_cache', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('das_crm_workflow_updated'));
          }
        } catch (_) {}
      }

      setShowCancelModal(false);
      setSelectedFollowUp(null);
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel follow-up');
    }
  };

  const handleQuickCreatePreset = (type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING') => {
    setCreatePresetType(type);
    setShowCreateModal(true);
  };

  // Filter list based on selected quick chip & search query
  const filterList = (items: any[]) => {
    if (!items || !Array.isArray(items)) return [];
    let result = items;
    if (selectedTypeFilter === 'HIGH_PRIORITY') {
      result = result.filter(i => (i.priority || '').toUpperCase() === 'HIGH');
    } else if (selectedTypeFilter === 'MEETING') {
      result = result.filter(i => {
        const type = (i.followUpType || '').toUpperCase();
        const title = (i.title || '').toLowerCase();
        const purpose = (i.purpose || '').toLowerCase();
        return type === 'MEETING' || type === 'VISIT' || title.includes('meeting') || title.includes('visit') || title.includes('demo') || purpose.includes('meeting') || purpose.includes('visit');
      });
    } else if (selectedTypeFilter === 'CALL') {
      result = result.filter(i => {
        const type = (i.followUpType || '').toUpperCase();
        const title = (i.title || '').toLowerCase();
        return type === 'CALL' || title.includes('call') || title.includes('callback');
      });
    } else if (selectedTypeFilter === 'WHATSAPP') {
      result = result.filter(i => {
        const type = (i.followUpType || '').toUpperCase();
        const title = (i.title || '').toLowerCase();
        return type === 'WHATSAPP' || title.includes('whatsapp') || title.includes('chat');
      });
    } else if (selectedTypeFilter === 'EMAIL') {
      result = result.filter(i => {
        const type = (i.followUpType || '').toUpperCase();
        const title = (i.title || '').toLowerCase();
        return type === 'EMAIL' || title.includes('email') || title.includes('mail');
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((i) => {
        const title = (i.title || '').toLowerCase();
        const purpose = (i.purpose || '').toLowerCase();
        const leadName = (i.lead?.name || (i.lead?.firstName ? `${i.lead.firstName || ''} ${i.lead.lastName || ''}` : '')).toLowerCase();
        const leadPhone = (i.lead?.phone || i.leadPhone || i.phone || '').toLowerCase();
        const leadEmail = (i.lead?.email || i.leadEmail || i.email || '').toLowerCase();
        const leadCompany = (typeof i.lead?.company === 'string' ? i.lead.company : i.lead?.company?.name || '').toLowerCase();
        const creatorName = (i.createdByName || i.createdBy?.name || '').toLowerCase();
        const assigneeName = (i.assignee?.name || '').toLowerCase();
        const repName = (i.lead?.owner?.name || '').toLowerCase();
        const outcome = (i.outcome || '').toLowerCase();
        const notes = (i.completionNotes || i.rescheduleReason || i.cancelledReason || '').toLowerCase();

        return (
          title.includes(q) ||
          purpose.includes(q) ||
          leadName.includes(q) ||
          leadPhone.includes(q) ||
          leadEmail.includes(q) ||
          leadCompany.includes(q) ||
          creatorName.includes(q) ||
          assigneeName.includes(q) ||
          repName.includes(q) ||
          outcome.includes(q) ||
          notes.includes(q)
        );
      });
    }

    return result;
  };

  const filteredAllData = useMemo(() => filterList(allData), [allData, selectedTypeFilter, searchQuery]);
  const filteredDueNow = useMemo(() => filterList(todayData.dueNow), [todayData.dueNow, selectedTypeFilter, searchQuery]);
  const filteredUpcomingToday = useMemo(() => filterList(todayData.upcomingToday), [todayData.upcomingToday, selectedTypeFilter, searchQuery]);
  const filteredCompletedToday = useMemo(() => filterList(todayData.completedToday), [todayData.completedToday, selectedTypeFilter, searchQuery]);
  const filteredMissedToday = useMemo(() => filterList(todayData.missedToday), [todayData.missedToday, selectedTypeFilter, searchQuery]);

  const hasAnyTodayItems = filteredDueNow.length > 0 || filteredUpcomingToday.length > 0 || filteredCompletedToday.length > 0 || filteredMissedToday.length > 0;

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* ── TOP HEADER & QUICK ACTION BAR ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <CalendarCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Follow-ups & Outreach Center
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Live Sync
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Full transparency on deal outreach: track scheduled meetings, assigned reps, action reasons, and team audit trails.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <button
            onClick={() => handleQuickCreatePreset('CALL')}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Schedule a Phone Call"
          >
            <Phone size={13} className="text-amber-400" /> + Call
          </button>
          <button
            onClick={() => handleQuickCreatePreset('WHATSAPP')}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Schedule WhatsApp Message"
          >
            <MessageSquare size={13} className="text-emerald-400" /> + WhatsApp
          </button>
          <button
            onClick={() => handleQuickCreatePreset('MEETING')}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Book a Meeting / Demo"
          >
            <CalendarDays size={13} className="text-sky-400" /> + Meeting
          </button>
          <button
            onClick={() => refreshAll()}
            disabled={refreshing}
            className="p-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center cursor-pointer"
            title="Refresh Follow-ups"
          >
            <RefreshCw size={14} className={cn(refreshing && 'animate-spin text-indigo-400')} />
          </button>
          <button
            onClick={() => {
              setCreatePresetType('CALL');
              setShowCreateModal(true);
            }}
            className="btn-primary text-xs sm:text-sm px-4 py-2 font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 ml-auto md:ml-0"
          >
            <Plus size={16} /> New Follow-up
          </button>
        </div>
      </div>

      {/* ── 5 HIGH-IMPACT METRIC CARDS ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Today Due Card */}
        <div
          onClick={() => setActiveTab('TODAY')}
          className={cn(
            'p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-md',
            activeTab === 'TODAY'
              ? 'bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border-amber-500/60 ring-2 ring-amber-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40 hover:bg-slate-850'
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-amber-400" /> Due Today
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ACTION
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {summary.today ?? 0}
            </span>
            <CalendarIcon size={18} className="text-amber-400/60" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pending outreach today</p>
        </div>

        {/* Upcoming Card */}
        <div
          onClick={() => setActiveTab('UPCOMING')}
          className={cn(
            'p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-md',
            activeTab === 'UPCOMING'
              ? 'bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-950 border-sky-500/60 ring-2 ring-sky-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-sky-500/40 hover:bg-slate-850'
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-sky-400 mb-2">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-sky-400" /> Upcoming
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
              PIPELINE
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {summary.upcoming ?? 0}
            </span>
            <Clock size={18} className="text-sky-400/60" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Next 7 to 30 days</p>
        </div>

        {/* Overdue Card */}
        <div
          onClick={() => setActiveTab('OVERDUE')}
          className={cn(
            'p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-md',
            activeTab === 'OVERDUE'
              ? 'bg-gradient-to-br from-rose-500/25 via-slate-900 to-slate-950 border-rose-500/60 ring-2 ring-rose-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40 hover:bg-slate-850'
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-rose-400 mb-2">
            <span className="flex items-center gap-1.5">
              <AlertCircle size={14} className="text-rose-400" /> Overdue
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
              URGENT
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight">
              {summary.overdue ?? 0}
            </span>
            <Flame size={18} className="text-rose-400/60" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Missed / delayed actions</p>
        </div>

        {/* Completed Card */}
        <div
          onClick={() => setActiveTab('COMPLETED')}
          className={cn(
            'p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-md',
            activeTab === 'COMPLETED'
              ? 'bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 border-emerald-500/60 ring-2 ring-emerald-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850'
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" /> Completed
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              DONE
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {summary.completed ?? 0}
            </span>
            <CheckCircle2 size={18} className="text-emerald-400/60" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.completedToday > 0 ? `${summary.completedToday} closed today` : 'Closed communications'}
          </p>
        </div>

        {/* Total Active Card */}
        <div
          onClick={() => setActiveTab('ALL')}
          className={cn(
            'p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-md col-span-2 sm:col-span-1',
            activeTab === 'ALL'
              ? 'bg-gradient-to-br from-purple-500/20 via-slate-900 to-slate-950 border-purple-500/60 ring-2 ring-purple-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-purple-500/40 hover:bg-slate-850'
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />
          <div className="flex items-center justify-between text-xs font-bold text-purple-400 mb-2">
            <span className="flex items-center gap-1.5">
              <ListTodo size={14} className="text-purple-400" /> All Follow-ups
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
              CATALOG
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {summary.total ?? 0}
            </span>
            <ListTodo size={18} className="text-purple-400/60" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total active workload</p>
        </div>
      </div>

      {/* ── TABS & QUICK FILTER PILLS BAR ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
          {/* Main Segmented Tab Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {([
              { id: 'TODAY', label: 'Today', count: summary.today },
              { id: 'UPCOMING', label: 'Upcoming', count: summary.upcoming },
              { id: 'OVERDUE', label: 'Overdue', count: summary.overdue, badgeColor: 'bg-rose-500/20 text-rose-300' },
              { id: 'COMPLETED', label: 'Completed', count: summary.completed },
              { id: 'ALL', label: 'All Follow-ups', count: summary.total },
              { id: 'CALENDAR', label: 'Calendar View', count: undefined, badgeColor: undefined, isSpecial: true },
            ] as Array<{ id: TabId; label: string; count?: number; badgeColor?: string; isSpecial?: boolean }>).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedFollowUp(null);
                  }}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                  )}
                >
                  {tab.id === 'CALENDAR' && <CalendarIcon size={13} className={isActive ? 'text-white' : 'text-slate-400'} />}
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded-full font-black',
                        isActive
                          ? 'bg-white/20 text-white'
                          : tab.badgeColor || 'bg-slate-800 text-slate-400'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search bar inside tab row */}
          {activeTab !== 'CALENDAR' && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search prospect, rep, creator, note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Filter Sub-Pills */}
        {activeTab !== 'CALENDAR' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-semibold py-0.5">
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider pl-1 flex items-center gap-1">
              <Filter size={11} /> Filter:
            </span>
            {[
              { id: 'ALL', label: 'All Actions' },
              { id: 'CALL', label: '📞 Phone Calls' },
              { id: 'WHATSAPP', label: '💬 WhatsApp' },
              { id: 'EMAIL', label: '✉️ Email' },
              { id: 'MEETING', label: '🤝 Meetings' },
              { id: 'HIGH_PRIORITY', label: '🔥 High Priority' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedTypeFilter(f.id as FilterType)}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all text-[11px] whitespace-nowrap cursor-pointer border',
                  selectedTypeFilter === f.id
                    ? 'bg-slate-800 text-indigo-300 border-indigo-500/40 shadow-sm font-bold'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:border-slate-700'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── WORKSPACE SPLIT CONTAINER ────────────────────────────────────────── */}
      <div className="flex-1 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col lg:flex-row overflow-hidden min-h-[600px] shadow-2xl backdrop-blur-xl">
        {/* LEFT COLUMN: LIST / CARDS */}
        <div
          className={cn(
            'flex flex-col border-r border-slate-800/80 transition-all',
            selectedFollowUp ? 'hidden lg:flex lg:w-[460px] xl:w-[500px] shrink-0' : 'w-full lg:w-[460px] xl:w-[520px] shrink-0'
          )}
        >
          <div className="p-3.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <ListTodo size={14} className="text-indigo-400" />
              {activeTab === 'TODAY' && "Today's Agenda"}
              {activeTab === 'UPCOMING' && 'Upcoming Pipeline'}
              {activeTab === 'OVERDUE' && 'Overdue Attention List'}
              {activeTab === 'COMPLETED' && 'Completed Log'}
              {activeTab === 'ALL' && 'All Communications'}
              {activeTab === 'CALENDAR' && 'Calendar Month'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {activeTab === 'TODAY' ? todayData.total || 0 : filteredAllData.length} records
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[720px]">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw size={24} className="animate-spin text-indigo-400 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Synchronizing follow-ups with server...</p>
              </div>
            ) : activeTab === 'TODAY' ? (
              hasAnyTodayItems ? (
                <div className="space-y-4">
                  {/* Due Now */}
                  {filteredDueNow.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-400 px-1">
                        <Flame size={12} className="animate-pulse" /> Due Now / Urgent ({filteredDueNow.length})
                      </div>
                      {filteredDueNow.map((item: any) => (
                        <FollowUpCard
                          key={item.id}
                          item={item}
                          onSelect={setSelectedFollowUp}
                          selected={selectedFollowUp?.id === item.id}
                          onNavigateToLead={handleNavigateToLead}
                          onQuickComplete={() => {
                            setSelectedFollowUp(item);
                            setShowCompleteModal(true);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Missed Today */}
                  {filteredMissedToday.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-rose-400 px-1">
                        <AlertCircle size={12} /> Overdue / Missed Earlier ({filteredMissedToday.length})
                      </div>
                      {filteredMissedToday.map((item: any) => (
                        <FollowUpCard
                          key={item.id}
                          item={item}
                          onSelect={setSelectedFollowUp}
                          selected={selectedFollowUp?.id === item.id}
                          onNavigateToLead={handleNavigateToLead}
                          onQuickComplete={() => {
                            setSelectedFollowUp(item);
                            setShowCompleteModal(true);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Upcoming Today */}
                  {filteredUpcomingToday.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-sky-400 px-1">
                        <Clock size={12} /> Scheduled Later Today ({filteredUpcomingToday.length})
                      </div>
                      {filteredUpcomingToday.map((item: any) => (
                        <FollowUpCard
                          key={item.id}
                          item={item}
                          onSelect={setSelectedFollowUp}
                          selected={selectedFollowUp?.id === item.id}
                          onNavigateToLead={handleNavigateToLead}
                          onQuickComplete={() => {
                            setSelectedFollowUp(item);
                            setShowCompleteModal(true);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Completed Today */}
                  {filteredCompletedToday.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-400 px-1">
                        <CheckCircle2 size={12} /> Completed Today ({filteredCompletedToday.length})
                      </div>
                      {filteredCompletedToday.map((item: any) => (
                        <FollowUpCard
                          key={item.id}
                          item={item}
                          onSelect={setSelectedFollowUp}
                          selected={selectedFollowUp?.id === item.id}
                          onNavigateToLead={handleNavigateToLead}
                          onQuickComplete={() => {}}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyFollowUpsState onNew={() => setShowCreateModal(true)} tab="TODAY" />
              )
            ) : activeTab === 'CALENDAR' ? (
              <SimpleCalendar data={calendarData} onSelectFollowUp={setSelectedFollowUp} />
            ) : filteredAllData.length > 0 ? (
              <div className="space-y-2">
                {filteredAllData.map((item) => (
                  <FollowUpCard
                    key={item.id}
                    item={item}
                    onSelect={setSelectedFollowUp}
                    selected={selectedFollowUp?.id === item.id}
                    onNavigateToLead={handleNavigateToLead}
                    onQuickComplete={() => {
                      setSelectedFollowUp(item);
                      setShowCompleteModal(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyFollowUpsState onNew={() => setShowCreateModal(true)} tab={activeTab} />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: WORKBENCH / INTERACTIVE DETAIL */}
        <div className={cn('flex-1 bg-slate-900/40 flex flex-col overflow-hidden min-w-0', selectedFollowUp ? 'flex' : 'hidden lg:flex')}>
          {selectedFollowUp ? (
            <FollowUpDetails
              item={selectedFollowUp}
              onClose={() => setSelectedFollowUp(null)}
              onComplete={() => setShowCompleteModal(true)}
              onReschedule={() => setShowRescheduleModal(true)}
              onCancel={() => setShowCancelModal(true)}
              onNavigateToLead={handleNavigateToLead}
            />
          ) : (
            <ProductivityWorkbench
              summary={summary}
              todayData={todayData}
              onScheduleNew={() => setShowCreateModal(true)}
              onSelectQuickType={handleQuickCreatePreset}
            />
          )}
        </div>
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateFollowUpModal
          presetType={createPresetType}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refreshAll();
          }}
        />
      )}
      {showCompleteModal && selectedFollowUp && (
        <CompleteFollowUpModal
          item={selectedFollowUp}
          onClose={() => setShowCompleteModal(false)}
          onSubmit={handleComplete}
        />
      )}
      {showRescheduleModal && selectedFollowUp && (
        <RescheduleModal
          item={selectedFollowUp}
          onClose={() => setShowRescheduleModal(false)}
          onSubmit={handleReschedule}
        />
      )}
      {showCancelModal && selectedFollowUp && (
        <CancelFollowUpModal
          item={selectedFollowUp}
          onClose={() => setShowCancelModal(false)}
          onSubmit={handleCancel}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

function FollowUpCard({
  item,
  onSelect,
  selected,
  onQuickComplete,
  onNavigateToLead,
}: {
  item: any;
  onSelect: (i: any) => void;
  selected: boolean;
  onQuickComplete: () => void;
  onNavigateToLead?: (i: any) => void;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'OVERDUE':
      case 'MISSED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'DUE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'RESCHEDULED':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'CANCELLED':
        return 'bg-slate-800 text-slate-400 border-slate-700 line-through';
      default:
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    }
  };

  const Icon =
    item.followUpType === 'CALL'
      ? Phone
      : item.followUpType === 'WHATSAPP'
      ? MessageSquare
      : item.followUpType === 'EMAIL'
      ? Mail
      : item.followUpType === 'MEETING'
      ? CalendarDays
      : Clock;

  const typeIconColor =
    item.followUpType === 'CALL'
      ? 'text-amber-400 bg-amber-500/15'
      : item.followUpType === 'WHATSAPP'
      ? 'text-emerald-400 bg-emerald-500/15'
      : item.followUpType === 'EMAIL'
      ? 'text-sky-400 bg-sky-500/15'
      : item.followUpType === 'MEETING'
      ? 'text-purple-400 bg-purple-500/15'
      : 'text-indigo-400 bg-indigo-500/15';

  const priorityBorder =
    item.priority === 'HIGH'
      ? 'border-l-4 border-l-rose-500'
      : item.priority === 'MEDIUM'
      ? 'border-l-4 border-l-amber-500'
      : 'border-l-4 border-l-slate-700';

  const dueTime = item.dueAt ? new Date(item.dueAt) : null;
  const timeFormatted = dueTime
    ? dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : 'No time';
  const dateFormatted = dueTime
    ? dueTime.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : '';

  const createdTime = item.createdAt ? new Date(item.createdAt) : null;
  const createdTimeFormatted = createdTime
    ? `${createdTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${createdTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`
    : 'Recently';

  const resolvedLeadName = (item.lead?.name && !item.lead.name.includes('Lead Prospect') && item.lead.name !== 'Prospect' && item.lead.name !== '—') 
    ? item.lead.name 
    : (item.lead?.firstName ? `${item.lead.firstName} ${item.lead.lastName || ''}`.trim() : 'Lead Contact');
  const leadPhone = (item.lead?.phone && item.lead.phone !== '—') ? item.lead.phone : (item.phone && item.phone !== '—') ? item.phone : '—';
  const leadEmail = (item.lead?.email && item.lead.email !== '—') ? item.lead.email : (item.email && item.email !== '—') ? item.email : '—';
  const leadOwnerName = (item.assignee?.name && item.assignee.name !== '—') 
    ? item.assignee.name 
    : (item.assignee?.firstName ? `${item.assignee.firstName} ${item.assignee.lastName || ''}`.trim() : '') ||
    (item.lead?.owner?.name && item.lead.owner.name !== '—'
      ? item.lead.owner.name
      : (item.lead?.owner?.firstName ? `${item.lead.owner.firstName} ${item.lead.owner.lastName || ''}`.trim() : 'Assigned Rep'));
  const creatorName = item.createdByName || item.createdBy?.name || 'Admin';
  const creatorRole = item.createdByRole || item.createdBy?.role || 'ADMIN';

  const cardTitle = (item.title || '')
    .replace(/Lead Prospect\s*(\([^\)]*\))?/gi, `${resolvedLeadName} ${item.lead?.company?.name ? `(${item.lead?.company?.name})` : (leadPhone && leadPhone !== '—' ? `(${leadPhone})` : '')}`.trim())
    .replace(/\(—\)/g, item.lead?.company?.name ? `(${item.lead?.company?.name})` : '');

  return (
    <div
      onClick={() => onSelect(item)}
      className={cn(
        'p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative group flex flex-col gap-2.5',
        priorityBorder,
        selected
          ? 'bg-slate-850 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/50'
          : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700 hover:bg-slate-850/80'
      )}
    >
      {/* Top row: Title + Type + Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/5 mt-0.5', typeIconColor)}>
            <Icon size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white break-words leading-snug group-hover:text-indigo-300 transition-colors">
              {cardTitle}
            </h4>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
              <CalendarIcon size={10} className="text-slate-500 shrink-0" />
              <span>{dateFormatted}</span> • <span>{timeFormatted}</span>
            </p>
          </div>
        </div>

        <span className={cn('text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider shrink-0', getStatusBadge(item.computedStatus || item.status))}>
          {item.computedStatus || item.status}
        </span>
      </div>

      {/* Purpose note banner */}
      {item.purpose && (
        <p className="text-[11px] text-slate-300 break-words line-clamp-2 bg-slate-950/60 px-2.5 py-1.5 rounded-md border border-slate-800/50 font-sans leading-relaxed">
          {String(item.purpose).replace(/^Call Funnel:\s*/i, '')}
        </p>
      )}

      {/* WHOSE LEAD IS THAT & CONTACT INFO */}
      <div className="flex flex-col gap-1.5 text-[11px] text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
        <div className="flex items-center justify-between gap-2">
          <div
            onClick={(e) => {
              if (onNavigateToLead) {
                e.stopPropagation();
                onNavigateToLead(item);
              }
            }}
            className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer group/lead"
            title="Click to open Lead Profile Workspace"
          >
            <Building2 size={11} className="text-indigo-400 shrink-0" />
            <span className="font-bold text-white break-words group-hover/lead:text-indigo-300 group-hover/lead:underline transition-colors">
              {resolvedLeadName}
            </span>
            {item.lead?.company?.name && (
              <span className="text-[10px] text-slate-400 truncate">({item.lead.company.name})</span>
            )}
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20 group-hover/lead:bg-indigo-500/25 shrink-0">
              Open ↗
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-indigo-300 font-semibold shrink-0">
            <UserCheck size={11} className="text-indigo-400" />
            <span>Rep: {leadOwnerName}</span>
          </div>
        </div>

        {/* Visible Phone and Email in Card */}
        <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap pt-1 border-t border-slate-800/40">
          {leadPhone && leadPhone !== '—' && (
            <span className="text-amber-400 font-medium flex items-center gap-1 shrink-0">
              <Phone size={10} className="text-amber-500" /> {leadPhone}
            </span>
          )}
          {leadPhone && leadPhone !== '—' && leadEmail && leadEmail !== '—' && <span className="text-slate-600">•</span>}
          {leadEmail && leadEmail !== '—' && (
            <span className="text-sky-300/90 break-all flex items-center gap-1">
              <Mail size={10} className="text-sky-400 shrink-0" /> {leadEmail}
            </span>
          )}
        </div>
      </div>

      {/* WHO & WHEN SCHEDULED (Matching lead page timeline attribution) */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/50 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1" title={`Scheduled by ${creatorName} (${creatorRole}) on ${createdTimeFormatted}`}>
          <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] font-black text-slate-300 shrink-0">
            {creatorName.charAt(0).toUpperCase()}
          </div>
          <span className="break-words">
            Scheduled by <strong className="text-slate-300 font-bold">{creatorName}</strong> ({creatorRole}) • {createdTimeFormatted}
          </span>
        </div>

        {!item.isCompleted && item.computedStatus !== 'CANCELLED' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickComplete();
            }}
            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 transition-all flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
            title="Mark Complete"
          >
            <Check size={10} /> Done
          </button>
        )}
      </div>

      {/* Completed / Cancelled / Rescheduled action snippet */}
      {item.isCompleted && (
        <div className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-1 text-emerald-300 flex items-center gap-1 break-words">
          <CheckCircle2 size={10} className="shrink-0 text-emerald-400" />
          <span>
            Done by {item.completedByName || 'Rep'}: &quot;{item.outcome || item.completionNotes || 'Completed'}&quot;
          </span>
        </div>
      )}
      {item.computedStatus === 'CANCELLED' && (
        <div className="text-[10px] bg-rose-500/10 border border-rose-500/20 rounded px-2 py-1 text-rose-300 flex items-center gap-1 break-words">
          <Ban size={10} className="shrink-0 text-rose-400" />
          <span>
            Cancelled by {item.cancelledByName || 'Rep'}: &quot;{item.cancelledReason || 'Cancelled'}&quot;
          </span>
        </div>
      )}
    </div>
  );
}

function FollowUpDetails({
  item,
  onClose,
  onComplete,
  onReschedule,
  onCancel,
  onNavigateToLead,
}: {
  item: any;
  onClose: () => void;
  onComplete: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onNavigateToLead?: (i: any) => void;
}) {
  const router = useRouter();

  const Icon =
    item.followUpType === 'CALL'
      ? Phone
      : item.followUpType === 'WHATSAPP'
      ? MessageSquare
      : item.followUpType === 'EMAIL'
      ? Mail
      : item.followUpType === 'MEETING'
      ? CalendarDays
      : Clock;

  const leadName = (item.lead?.name && !item.lead.name.includes('Lead Prospect') && item.lead.name !== 'Prospect' && item.lead.name !== '—') 
    ? item.lead.name 
    : (item.lead?.firstName ? `${item.lead.firstName} ${item.lead.lastName || ''}`.trim() : 'Lead Contact');
  const leadPhone = (item.lead?.phone && item.lead.phone !== '—') ? item.lead.phone : (item.phone && item.phone !== '—') ? item.phone : '—';
  const leadEmail = (item.lead?.email && item.lead.email !== '—') ? item.lead.email : (item.email && item.email !== '—') ? item.email : '—';
  const companyName = item.lead?.company?.name || (typeof item.lead?.company === 'string' ? item.lead.company : '');
  const leadOwnerName = (item.assignee?.name && item.assignee.name !== '—') 
    ? item.assignee.name 
    : (item.assignee?.firstName ? `${item.assignee.firstName} ${item.assignee.lastName || ''}`.trim() : '') ||
    (item.lead?.owner?.name && item.lead.owner.name !== '—' 
      ? item.lead.owner.name 
      : (item.lead?.owner?.firstName ? `${item.lead.owner.firstName} ${item.lead.owner.lastName || ''}`.trim() : 'Assigned Rep'));
  const leadOwnerRole = item.assignee?.role?.name || item.assignee?.role || item.lead?.owner?.role?.name || item.lead?.owner?.role || 'SALES_REP';
  const creatorName = item.createdByName || item.createdBy?.name || 'Admin';
  const creatorRole = item.createdByRole || item.createdBy?.role || 'ADMIN';

  const scheduledDateFormatted = item.dueAt
    ? new Date(item.dueAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Not Set';

  const createdAtFormatted = item.createdAt
    ? new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Recently';

  // Navigate smoothly to lead profile page with hydrated session data
  const handleNavigateToLead = (targetLead?: any) => {
    const leadId = targetLead?.id || item.lead?.id || item.leadId;
    if (!leadId || getDeletedLeadIdentifiers().ids.has(String(leadId))) {
      alert('This lead has been deleted and its profile is no longer available.');
      return;
    }
    const rawStatus = targetLead?.status?.name || (typeof targetLead?.status === 'string' ? targetLead.status : item.lead?.status?.name || 'Meeting Scheduled');
    const comp = typeof targetLead?.company === 'string' ? targetLead.company : targetLead?.company?.name || companyName || '';
    
    const leadObj = {
      id: String(leadId),
      name: leadName,
      email: leadEmail,
      phone: leadPhone,
      company: comp,
      status: rawStatus,
      owner: leadOwnerName,
      assignedRep: leadOwnerName,
      source: targetLead?.source || item.lead?.source || 'Referral',
      requirement: item.purpose || 'Multi-Branch CRM Enterprise Suite',
      city: targetLead?.city || item.lead?.city || 'Mumbai',
      budget: targetLead?.budget || item.lead?.budget || '₹ 4,50,000',
      createdAt: item.createdAt || new Date().toISOString(),
      allocationTrail: [
        {
          id: `alloc_${Date.now()}_1`,
          fromRole: 'MANAGER',
          fromName: creatorName.includes('(') ? creatorName : `${creatorName} (Manager)`,
          toRole: 'TEAM_LEADER',
          toName: 'Sachin Puri (Team Leader)',
          action: 'ALLOCATED',
          assignedAt: new Date().toISOString(),
          note: `Follow-up / Meeting scheduled for ${scheduledDateFormatted}`,
        },
        {
          id: `alloc_${Date.now()}_2`,
          fromRole: 'TEAM_LEADER',
          fromName: 'Sachin Puri (Team Leader)',
          toRole: 'SALES_EXEC',
          toName: leadOwnerName.includes('(') ? leadOwnerName : `${leadOwnerName} (Sales Exec)`,
          action: 'ASSIGNED',
          assignedAt: new Date().toISOString(),
          note: 'Active owner managing follow-up outreach',
        },
      ],
      ...item.lead,
      ...targetLead,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('das_crm_active_lead', JSON.stringify(leadObj));
        sessionStorage.setItem(`das_crm_lead_${leadId}`, JSON.stringify(leadObj));
        
        // Ensure present in local cache for instant lookup
        const existing = localStorage.getItem('das_crm_all_leads_cache');
        let arr = existing ? JSON.parse(existing) : [];
        if (!Array.isArray(arr)) arr = [];
        const idx = arr.findIndex((x: any) => String(x.id) === String(leadId) || (x.name && x.name.toLowerCase() === leadName.toLowerCase()));
        if (idx >= 0) {
          arr[idx] = { ...arr[idx], ...leadObj };
        } else {
          arr.unshift(leadObj);
        }
        localStorage.setItem('das_crm_all_leads_cache', JSON.stringify(arr));
      } catch (_) {}
    }

    router.push(`/leads/${encodeURIComponent(leadId)}`);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── TOP HEADER WITH ACTIONS & CLICKABLE HEADING ROUTE ───────────────── */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between bg-slate-900/80 gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <button onClick={onClose} className="lg:hidden p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white shrink-0 mt-0.5 sm:mt-0">
            <ChevronLeft size={18} />
          </button>
          
          <div
            onClick={() => onNavigateToLead ? onNavigateToLead(item) : handleNavigateToLead(item.lead)}
            className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-inner cursor-pointer hover:bg-indigo-500/30 hover:scale-105 transition-all"
            title="Click to view Lead Profile"
          >
            <Icon size={20} />
          </div>

          {/* Interactive, full-width non-truncated Heading with Routing to Lead */}
          <div
            onClick={() => onNavigateToLead ? onNavigateToLead(item) : handleNavigateToLead(item.lead)}
            className="min-w-0 flex-1 cursor-pointer group p-1.5 -ml-1.5 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-indigo-500/30 transition-all"
            title="Click heading to open Lead Profile Workspace"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight break-words group-hover:text-indigo-300 transition-colors">
                {(item.title || '')
                  .replace(/Lead Prospect\s*(\([^\)]*\))?/gi, `${leadName} (${companyName || leadPhone})`)
                  .replace(/\(—\)/g, `(${companyName || 'Adorable Trading'})`)}
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 group-hover:bg-indigo-500/25 px-2 py-0.5 rounded-md border border-indigo-500/30 transition-all shrink-0 shadow-sm">
                <span>Open Lead Profile</span>
                <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap mt-1.5">
              <span className="font-bold text-slate-200">{scheduledDateFormatted}</span>
              <span>•</span>
              <span className="font-extrabold text-indigo-300">{item.followUpType || 'MEETING'}</span>
              <span>•</span>
              <span
                className={cn(
                  'font-black text-[10px] px-2 py-0.2 rounded-full uppercase',
                  item.priority === 'HIGH'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : item.priority === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                )}
              >
                {item.priority} Priority
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {!item.isCompleted && item.computedStatus !== 'CANCELLED' ? (
            <>
              <button
                onClick={onReschedule}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Clock size={12} className="text-indigo-400" /> Reschedule
              </button>
              <button
                onClick={onComplete}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 size={13} /> Mark Complete
              </button>
            </>
          ) : item.isCompleted ? (
            <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Completed
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
              <Ban size={13} /> Cancelled
            </span>
          )}
        </div>
      </div>

      {/* ── BODY CONTENT ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Status Alert Banners */}
        {item.computedStatus === 'OVERDUE' && (
          <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3.5 flex items-start gap-3">
            <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">Overdue Follow-up Attention</h4>
              <p className="text-xs text-rose-200/90 mt-0.5">
                This communication was scheduled for {scheduledDateFormatted}. Immediate outreach is advised to preserve pipeline momentum.
              </p>
            </div>
          </div>
        )}

        {/* ── 1. WHO & WHEN SCHEDULED + WHOSE LEAD IS THAT (KEY AUDIT CARD) ──── */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-indigo-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <span className="text-[11px] font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <History size={13} className="text-indigo-400" /> Attribution & Ownership Chain
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Audit Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Scheduled By Details */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <User size={11} className="text-indigo-400" /> Scheduled By
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {creatorRole}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-xs flex items-center justify-center shadow-md">
                  {creatorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">{creatorName}</h4>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock size={10} className="text-slate-500" /> {createdAtFormatted}
                  </p>
                </div>
              </div>
            </div>

            {/* Whose Lead Is That (Assigned Sales Rep & Lead Owner) */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Briefcase size={11} className="text-amber-400" /> Lead Owner / Assigned Rep
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {leadOwnerRole}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-600/30 border border-amber-500/30 text-amber-300 font-black text-xs flex items-center justify-center shadow-md">
                  {leadOwnerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">{leadOwnerName}</h4>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Building2 size={10} className="text-slate-500" />
                    <span>Lead Status: <strong className="text-indigo-300">{item.lead?.status?.name || 'Active Prospect'}</strong></span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. LINKED PROSPECT DETAILS WITH VISIBLE PHONE & EMAIL ─────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User size={13} className="text-indigo-400" /> Linked Prospect Profile
              </span>
              <button
                onClick={() => onNavigateToLead ? onNavigateToLead(item) : handleNavigateToLead(item.lead)}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-0.5 rounded-md border border-indigo-500/20 transition-all shadow-sm"
              >
                <span>View Full Lead Workspace</span>
                <ExternalLink size={11} />
              </button>
            </div>
            {item.lead?.status?.name && (
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {item.lead.status.name}
              </span>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Prospect Identity & Contact Details (Clickable to Lead Page) */}
            <div 
              onClick={() => handleNavigateToLead(item.lead)}
              className="flex items-start gap-3.5 min-w-0 cursor-pointer group flex-1"
              title="Click to view full lead profile"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-black text-base shrink-0 shadow-md group-hover:scale-105 transition-transform">
                {leadName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors break-words">
                    {leadName}
                  </h4>
                  {companyName && (
                    <span className="text-[11px] font-semibold text-slate-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1">
                      <Building2 size={11} className="text-slate-400" /> {companyName}
                    </span>
                  )}
                </div>

                {/* VISIBLE PHONE & EMAIL PILLS WITH CLICK-TO-ACTION */}
                <div className="flex items-center gap-2.5 flex-wrap text-xs pt-0.5" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`tel:${leadPhone}`}
                    className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all font-mono font-bold group shadow-sm"
                    title={`Click to call ${leadPhone}`}
                  >
                    <Phone size={12} className="text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>{leadPhone}</span>
                  </a>

                  <a
                    href={`mailto:${leadEmail}`}
                    className="inline-flex items-center gap-1.5 text-sky-300 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg border border-sky-500/30 transition-all font-mono font-bold group shadow-sm"
                    title={`Click to send email to ${leadEmail}`}
                  >
                    <Mail size={12} className="text-sky-400 group-hover:scale-110 transition-transform" />
                    <span className="break-all">{leadEmail}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Direct Connect Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
              <a
                href={`tel:${leadPhone}`}
                className="px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title={`Call ${leadPhone}`}
              >
                <PhoneCall size={14} /> Call
              </a>
              <a
                href={`https://wa.me/${leadPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title={`WhatsApp ${leadPhone}`}
              >
                <MessageSquare size={14} /> WhatsApp
              </a>
              <a
                href={`mailto:${leadEmail}`}
                className="px-3 py-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title={`Email ${leadEmail}`}
              >
                <Mail size={14} /> Email
              </a>
            </div>
          </div>
        </div>

        {/* ── 3. FOLLOW-UP AGENDA & PURPOSE ──────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText size={12} className="text-indigo-400" /> Follow-up Agenda / Purpose
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 break-words">
            {item.purpose || item.description || 'General touchpoint to review client interest, answer technical questions, and discuss proposal progression.'}
          </p>
        </div>

        {/* ── 4. LIFECYCLE AUDIT TRAIL / TIMELINE (RECORD WHO DID WHAT & WHY) ─ */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <History size={13} className="text-indigo-400" /> Action & Decision Trail
          </h3>

          <div className="space-y-3 pl-2 border-l-2 border-slate-800 ml-2">
            {/* Step 1: Created / Scheduled */}
            <div className="relative pl-4 space-y-1">
              <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-900" />
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Scheduled by {creatorName}</span>
                <span className="text-[10px] text-slate-500 font-mono">{createdAtFormatted}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Scheduled for <strong className="text-slate-200">{scheduledDateFormatted}</strong> ({item.followUpType}). Assigned to <strong className="text-indigo-300">{leadOwnerName}</strong>.
              </p>
            </div>

            {/* Step 2: Rescheduled (if applicable) */}
            {(item.rescheduledAt || item.rescheduleReason || item.status === 'RESCHEDULED') && (
              <div className="relative pl-4 space-y-1">
                <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-sky-500 border-2 border-slate-900" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-300">
                    Rescheduled by {item.rescheduledByName || creatorName} {item.rescheduledByRole ? `(${item.rescheduledByRole})` : ''}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.rescheduledAt ? new Date(item.rescheduledAt).toLocaleString() : 'Updated'}
                  </span>
                </div>
                <div className="text-[11px] bg-sky-950/40 p-2 rounded-lg border border-sky-500/20 text-slate-300 space-y-0.5">
                  <p><strong className="text-sky-200">Reason:</strong> {item.rescheduleReason || 'Requested alternate time slot'}</p>
                  <p className="text-[10px] text-slate-400">Moved to: {scheduledDateFormatted}</p>
                </div>
              </div>
            )}

            {/* Step 3: Completed (if applicable) */}
            {item.isCompleted && (
              <div className="relative pl-4 space-y-1">
                <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">
                    Marked Complete by {item.completedByName || creatorName} {item.completedByRole ? `(${item.completedByRole})` : ''}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.completedAt ? new Date(item.completedAt).toLocaleString() : 'Completed'}
                  </span>
                </div>
                <div className="text-[11px] bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/20 text-slate-200 space-y-1">
                  {item.outcome && (
                    <p><strong className="text-emerald-300">Outcome:</strong> {item.outcome}</p>
                  )}
                  {item.completionNotes && (
                    <p><strong className="text-emerald-300">Notes:</strong> {item.completionNotes}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Cancelled (if applicable) */}
            {item.computedStatus === 'CANCELLED' && (
              <div className="relative pl-4 space-y-1">
                <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-slate-900" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-400">
                    Cancelled by {item.cancelledByName || creatorName} {item.cancelledByRole ? `(${item.cancelledByRole})` : ''}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.cancelledAt ? new Date(item.cancelledAt).toLocaleString() : 'Cancelled'}
                  </span>
                </div>
                <div className="text-[11px] bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/20 text-rose-200">
                  <strong className="text-rose-300">Reason for Cancellation:</strong> {item.cancelledReason || 'Follow-up cancelled by user'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info & Cancel trigger */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Follow-up ID: <code className="font-mono text-[10px]">{String(item.id).slice(0, 14)}</code></span>
          {!item.isCompleted && item.computedStatus !== 'CANCELLED' && (
            <button
              onClick={onCancel}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer hover:underline flex items-center gap-1"
            >
              <Ban size={12} /> Cancel Follow-up
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductivityWorkbench({
  summary,
  todayData,
  onScheduleNew,
  onSelectQuickType,
}: {
  summary: any;
  todayData: any;
  onScheduleNew: () => void;
  onSelectQuickType: (type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING') => void;
}) {
  return (
    <div className="h-full flex flex-col justify-center items-center p-8 text-center max-w-lg mx-auto space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600/30 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-2xl">
          <CalendarCheck size={40} />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
          ✓
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-black text-white">Daily Outreach & Follow-up Workbench</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Select any scheduled communication from the list to view lead attribution, make direct calls, launch WhatsApp touchpoints, or mark outcomes with audit notes.
        </p>
      </div>

      {/* Quick Launchpad Buttons */}
      <div className="w-full bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block text-left">
          ⚡ Quick Schedule Launcher
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <button
            onClick={() => onSelectQuickType('CALL')}
            className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-2 transition-all cursor-pointer text-left"
          >
            <Phone size={15} className="text-amber-400" />
            <div>
              <p className="font-black">Phone Call</p>
              <p className="text-[10px] text-slate-400 font-normal">Direct outreach</p>
            </div>
          </button>
          <button
            onClick={() => onSelectQuickType('WHATSAPP')}
            className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-2 transition-all cursor-pointer text-left"
          >
            <MessageSquare size={15} className="text-emerald-400" />
            <div>
              <p className="font-black">WhatsApp</p>
              <p className="text-[10px] text-slate-400 font-normal">Fast response</p>
            </div>
          </button>
          <button
            onClick={() => onSelectQuickType('MEETING')}
            className="p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-2 transition-all cursor-pointer text-left"
          >
            <CalendarDays size={15} className="text-sky-400" />
            <div>
              <p className="font-black">Demo / Meeting</p>
              <p className="text-[10px] text-slate-400 font-normal">Close prospect</p>
            </div>
          </button>
          <button
            onClick={() => onSelectQuickType('EMAIL')}
            className="p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-2 transition-all cursor-pointer text-left"
          >
            <Mail size={15} className="text-purple-400" />
            <div>
              <p className="font-black">Formal Email</p>
              <p className="text-[10px] text-slate-400 font-normal">Quote / Spec</p>
            </div>
          </button>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
        <Sparkles size={13} className="text-indigo-400" />
        <span>Pro Tip: 80% of enterprise sales require 5 follow-ups after the initial meeting.</span>
      </div>
    </div>
  );
}

function EmptyFollowUpsState({ onNew, tab }: { onNew: () => void; tab: string }) {
  return (
    <div className="py-16 px-6 text-center space-y-4 max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 mx-auto shadow-inner">
        <Sparkles size={28} />
      </div>
      <div>
        <h4 className="text-sm font-black text-white">All Caught Up In This View!</h4>
        <p className="text-xs text-slate-400 mt-1">
          {tab === 'TODAY'
            ? 'No follow-ups due today. Take initiative and schedule your next outreach.'
            : tab === 'OVERDUE'
            ? 'Awesome! No overdue follow-ups on your desk.'
            : 'No follow-ups found for the selected view.'}
        </p>
      </div>
      <button onClick={onNew} className="btn-primary text-xs font-bold px-4 py-2 inline-flex items-center gap-1.5 shadow-md">
        <Plus size={14} /> Schedule Follow-up
      </button>
    </div>
  );
}

function SimpleCalendar({ data, onSelectFollowUp }: any) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  const getFollowUpsForDay = (day: number) => {
    return (data || []).filter((d: any) => {
      const date = new Date(d.dueAt);
      return date.getDate() === day && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  };

  const handlePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="font-black text-white text-sm sm:text-base">
          {monthName} {currentYear}
        </h3>
        <div className="flex gap-1.5">
          <button onClick={handlePrev} className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <button onClick={handleNext} className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 flex-1">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="bg-slate-950/30 rounded-xl" />;
          const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
          const items = getFollowUpsForDay(day);

          return (
            <div
              key={`day-${day}`}
              className={cn(
                'min-h-[70px] bg-slate-950 border rounded-xl p-1.5 flex flex-col hover:border-slate-600 transition-colors',
                isToday ? 'border-indigo-500/60 bg-indigo-950/20' : 'border-slate-800/80'
              )}
            >
              <span className={cn('text-[10px] font-black', isToday ? 'text-indigo-400' : 'text-slate-400')}>{day}</span>
              <div className="flex-1 space-y-1 mt-1 overflow-y-auto no-scrollbar">
                {items.slice(0, 2).map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectFollowUp(item)}
                    className="text-[9px] font-bold p-1 rounded bg-slate-900 border border-slate-800 text-slate-200 truncate cursor-pointer hover:border-indigo-400"
                  >
                    {item.title}
                  </div>
                ))}
                {items.length > 2 && (
                  <span className="text-[8px] font-bold text-slate-500 block text-center">+{items.length - 2} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MODALS
// ============================================================================

function CompleteFollowUpModal({ item, onClose, onSubmit }: any) {
  const { currentUser } = useAuth();
  const [outcome, setOutcome] = useState('Meeting Completed - Positive');
  const [notes, setNotes] = useState('');
  const [createNext, setCreateNext] = useState(false);
  const [nextDate, setNextDate] = useState('');

  const actorName = currentUser?.name || 'Anurag Sharma';
  const actorRole = currentUser?.role || 'ADMIN';

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit({
      outcome,
      completionNotes: notes,
      createNextFollowUp: createNext,
      nextFollowUpDate: createNext ? nextDate : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <CheckCircle2 className="text-emerald-400" size={18} /> Mark Follow-up Complete
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Logged by: <strong className="text-slate-200">{actorName}</strong> ({actorRole})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
            <span className="text-[10px] text-slate-500 uppercase font-black block">Completing Action For</span>
            <span className="font-bold text-white block truncate">{item.title}</span>
            <span className="text-[11px] text-slate-400 block">{item.lead?.name} ({item.lead?.company?.name || 'Enterprise'})</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Communication Outcome *</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="Meeting Completed - Positive">🤝 Meeting Completed - Positive / Interested</option>
              <option value="Deal Closed / Advance Received">🎉 Deal Closed / Advance Received</option>
              <option value="Quotation Requested">📄 Quotation / Proposal Requested</option>
              <option value="Meeting Completed - Follow-up Needed">🔄 Meeting Done - Needs Follow-up Touchpoint</option>
              <option value="Call Later / Busy">⏳ Call Later / Busy (Rescheduled)</option>
              <option value="Not Interested / Dropped">🚫 Not Interested / Budget Issue</option>
              <option value="General Conversation">💬 General Informational Conversation</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">
              Conversation Notes & Reason Details *
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
              rows={3}
              placeholder="Detail what was discussed, client objections/feedback, who attended, and next steps..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createNext}
                onChange={(e) => setCreateNext(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 bg-slate-950"
              />
              <span className="text-xs font-bold text-white">Schedule Next Follow-up Immediately</span>
            </label>

            {createNext && (
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Next Follow-up Date *</label>
                <input
                  type="date"
                  required
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark] focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-600/30">
              Save Outcome & Mark Complete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RescheduleModal({ item, onClose, onSubmit }: any) {
  const { currentUser } = useAuth();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [reasonCategory, setReasonCategory] = useState('Client requested different time');
  const [reasonDetails, setReasonDetails] = useState('');

  const actorName = currentUser?.name || 'Anurag Sharma';
  const actorRole = currentUser?.role || 'ADMIN';

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const finalReason = reasonDetails.trim()
      ? `${reasonCategory} — ${reasonDetails.trim()}`
      : reasonCategory;
    onSubmit({ newDate: date, newTime: time, reason: finalReason });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <Clock className="text-indigo-400" size={18} /> Reschedule Follow-up
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Acting as: <strong className="text-slate-200">{actorName}</strong> ({actorRole})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
            <span className="text-[10px] text-slate-500 uppercase font-black block">Current Scheduled Time</span>
            <span className="font-bold text-indigo-300 block">
              {item.dueAt ? new Date(item.dueAt).toLocaleString() : 'Not Set'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">New Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark] focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">New Time *</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark] focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Reason for Rescheduling *</label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none mb-2"
            >
              <option value="Client requested different time">Client requested different time / day</option>
              <option value="Prospect travelling / busy">Prospect travelling or temporarily unreachable</option>
              <option value="Preparing updated quotation / demo">Need more preparation / custom proposal setup</option>
              <option value="Internal schedule conflict">Internal team availability clash</option>
              <option value="Other reason">Other custom reason</option>
            </select>
            <input
              type="text"
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              placeholder="Additional explanation notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs shadow-lg shadow-indigo-600/30">
              Confirm Reschedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CancelFollowUpModal({ item, onClose, onSubmit }: any) {
  const { currentUser } = useAuth();
  const [reasonCategory, setReasonCategory] = useState('Client Cancelled / Postponed Indefinitely');
  const [reasonDetails, setReasonDetails] = useState('');

  const actorName = currentUser?.name || 'Anurag Sharma';
  const actorRole = currentUser?.role || 'ADMIN';

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit({
      reasonCategory,
      reason: reasonDetails.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-rose-950/30">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <Ban className="text-rose-400" size={18} /> Cancel Scheduled Follow-up
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cancelling as: <strong className="text-slate-200">{actorName}</strong> ({actorRole})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-black block">Cancelling Follow-up</span>
            <p className="font-bold text-white">{item.title}</p>
            <p className="text-[11px] text-slate-400">
              Scheduled for: <strong className="text-slate-300">{item.dueAt ? new Date(item.dueAt).toLocaleString() : 'N/A'}</strong>
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Cancellation Reason Category *</label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
            >
              <option value="Client Cancelled / Postponed Indefinitely">Client Cancelled / Postponed Indefinitely</option>
              <option value="Prospect Not Interested / Dropped">Prospect Not Interested / Budget Issue</option>
              <option value="Duplicate or Erroneous Schedule">Duplicate or Erroneous Schedule</option>
              <option value="Unreachable after multiple attempts">Unreachable after multiple touchpoints</option>
              <option value="Deal Lost to Competitor">Deal Lost to Competitor</option>
              <option value="Other Reason">Other Reason (specified below)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">
              Detailed Reason / Note *
            </label>
            <textarea
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              required
              rows={3}
              placeholder="Provide context on why this follow-up is being cancelled for audit history..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800/80">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Keep Follow-up
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 border border-rose-500 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              Confirm Cancellation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface LeadOption {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  status?: string;
  owner?: string;
}

const DEFAULT_FALLBACK_LEADS: LeadOption[] = [];

function getAggregatedLeadOptions(extraServerLeads: any[] = []): LeadOption[] {
  const map = new Map<string, LeadOption>();

  // 1. Defaults
  DEFAULT_FALLBACK_LEADS.forEach((lead) => {
    map.set(lead.name.toLowerCase().trim(), lead);
  });

  if (typeof window !== 'undefined') {
    // 2. das_crm_all_leads_cache
    try {
      const rawAll = localStorage.getItem('das_crm_all_leads_cache');
      if (rawAll) {
        const parsed = JSON.parse(rawAll);
        if (Array.isArray(parsed)) {
          parsed.forEach((l: any) => {
            const name = (l.name || `${l.firstName || ''} ${l.lastName || ''}`).trim();
            if (name) {
              const key = name.toLowerCase();
              map.set(key, {
                id: String(l.id || `lead_${key}`),
                name,
                phone: l.phone || l.mobilePhone || '',
                email: l.email || '',
                company: typeof l.company === 'string' ? l.company : l.company?.name || l.companyName || '',
                status: typeof l.status === 'string' ? l.status : l.status?.name || 'Active',
                owner: typeof l.owner === 'string' ? l.owner : l.owner?.name || (l.owner?.firstName ? `${l.owner.firstName} ${l.owner.lastName || ''}`.trim() : 'Sachin Puri'),
              });
            }
          });
        }
      }
    } catch (_) {}

    // 3. das_crm_lead_directory_cache
    try {
      const rawDir = localStorage.getItem('das_crm_lead_directory_cache');
      if (rawDir) {
        const parsed = JSON.parse(rawDir);
        if (Array.isArray(parsed)) {
          parsed.forEach((l: any) => {
            const name = (l.name || `${l.firstName || ''} ${l.lastName || ''}`).trim();
            if (name) {
              const key = name.toLowerCase();
              const existing = map.get(key);
              map.set(key, {
                id: String(l.id || existing?.id || `lead_${key}`),
                name,
                phone: l.phone || l.mobilePhone || existing?.phone || '',
                email: l.email || existing?.email || '',
                company: typeof l.company === 'string' ? l.company : l.company?.name || l.companyName || existing?.company || '',
                status: typeof l.status === 'string' ? l.status : l.status?.name || existing?.status || 'Active',
                owner: typeof l.owner === 'string' ? l.owner : l.owner?.name || existing?.owner || 'Sachin Puri',
              });
            }
          });
        }
      }
    } catch (_) {}

    // 4. das_crm_followup_tasks_cache
    try {
      const rawTasks = localStorage.getItem('das_crm_followup_tasks_cache');
      if (rawTasks) {
        const parsed = JSON.parse(rawTasks);
        if (Array.isArray(parsed)) {
          parsed.forEach((task: any) => {
            if (task.lead) {
              const l = task.lead;
              const name = (l.name || `${l.firstName || ''} ${l.lastName || ''}`).trim();
              if (name) {
                const key = name.toLowerCase();
                const existing = map.get(key);
                map.set(key, {
                  id: String(l.id || existing?.id || `lead_${key}`),
                  name,
                  phone: l.phone || existing?.phone || '',
                  email: l.email || existing?.email || '',
                  company: typeof l.company === 'string' ? l.company : l.company?.name || existing?.company || '',
                  status: typeof l.status === 'string' ? l.status : l.status?.name || existing?.status || 'Active',
                  owner: typeof l.owner === 'string' ? l.owner : l.owner?.name || existing?.owner || 'Sachin Puri',
                });
              }
            }
          });
        }
      }
    } catch (_) {}
  }

  // 5. Server extra leads
  if (Array.isArray(extraServerLeads)) {
    extraServerLeads.forEach((l: any) => {
      const name = (l.name || `${l.firstName || ''} ${l.lastName || ''}`).trim();
      if (name) {
        const key = name.toLowerCase();
        const existing = map.get(key);
        map.set(key, {
          id: String(l.id || existing?.id || `lead_${key}`),
          name,
          phone: l.phone || l.mobilePhone || existing?.phone || '',
          email: l.email || existing?.email || '',
          company: typeof l.company === 'string' ? l.company : l.company?.name || l.companyName || existing?.company || '',
          status: typeof l.status === 'string' ? l.status : l.status?.name || existing?.status || 'Active',
          owner: typeof l.owner === 'string' ? l.owner : l.owner?.name || (l.owner?.firstName ? `${l.owner.firstName} ${l.owner.lastName || ''}`.trim() : existing?.owner || 'Sachin Puri'),
        });
      }
    });
  }

  return Array.from(map.values());
}

function CreateFollowUpModal({
  presetType = 'CALL',
  onClose,
  onCreated,
}: {
  presetType?: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING';
  onClose: () => void;
  onCreated: () => void;
}) {
  const { token, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsList, setLeadsList] = useState<LeadOption[]>(() => getAggregatedLeadOptions([]));
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    followUpType: presetType,
    leadId: undefined as string | undefined,
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '11:00',
    priority: 'MEDIUM',
    purpose: '',
  });

  // Fetch available leads from API and merge
  useEffect(() => {
    let isMounted = true;
    const loadLeads = async () => {
      try {
        setLeadsLoading(true);
        const data = await fetchApi('/leads?limit=200', token).catch(() => null);
        const raw = Array.isArray(data) ? data : data?.data || data?.leads || [];
        if (isMounted) {
          const merged = getAggregatedLeadOptions(raw);
          setLeadsList(merged);
        }
      } catch (err) {
        console.warn('Leads fetch notice:', err);
      } finally {
        if (isMounted) setLeadsLoading(false);
      }
    };
    loadLeads();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Filtered leads based on search query
  const filteredLeads = useMemo(() => {
    const q = leadSearchQuery.toLowerCase().trim();
    if (!q) return leadsList.slice(0, 10);
    const cleanQ = q.replace(/[\s+-]/g, '');

    return leadsList
      .filter((l) => {
        const nameMatch = l.name.toLowerCase().includes(q);
        const phoneMatch = l.phone ? l.phone.toLowerCase().replace(/[\s+-]/g, '').includes(cleanQ) : false;
        const companyMatch = l.company ? l.company.toLowerCase().includes(q) : false;
        const emailMatch = l.email ? l.email.toLowerCase().includes(q) : false;
        const ownerMatch = l.owner ? l.owner.toLowerCase().includes(q) : false;
        const statusMatch = l.status ? l.status.toLowerCase().includes(q) : false;
        return nameMatch || phoneMatch || companyMatch || emailMatch || ownerMatch || statusMatch;
      })
      .slice(0, 15);
  }, [leadsList, leadSearchQuery]);

  const hasExactMatch = useMemo(() => {
    const q = leadSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return leadsList.some((l) => l.name.toLowerCase().trim() === q);
  }, [leadsList, leadSearchQuery]);

  const handleSelectLead = (lead: LeadOption) => {
    setSelectedLead(lead);
    setIsDropdownOpen(false);
    setLeadSearchQuery('');

    const typePrefix =
      formData.followUpType === 'MEETING'
        ? 'Demo & Meeting with'
        : formData.followUpType === 'CALL'
        ? 'Call with'
        : formData.followUpType === 'WHATSAPP'
        ? 'WhatsApp Follow-up with'
        : formData.followUpType === 'EMAIL'
        ? 'Email Touchpoint with'
        : 'Follow-up with';

    const suggestedTitle = `${typePrefix} ${lead.name}${lead.company ? ` (${lead.company})` : ''}`;

    setFormData((prev) => ({
      ...prev,
      leadId: lead.id,
      title: prev.title && !prev.title.startsWith('Call with') && !prev.title.startsWith('Meeting with') && !prev.title.startsWith('Demo') && !prev.title.startsWith('Follow-up with') && !prev.title.startsWith('WhatsApp') && !prev.title.startsWith('Email')
        ? prev.title
        : suggestedTitle,
    }));
  };

  const handleCreateCustomProspect = () => {
    const trimmed = leadSearchQuery.trim();
    if (!trimmed) return;
    const customLead: LeadOption = {
      id: `custom_lead_${Date.now()}`,
      name: trimmed,
      company: '',
      phone: '',
      email: '',
      status: 'Custom Prospect',
      owner: currentUser?.name || 'Aditya Kumar Rai',
    };
    handleSelectLead(customLead);
  };

  const handleClearSelectedLead = () => {
    setSelectedLead(null);
    setFormData((prev) => ({ ...prev, leadId: undefined }));
  };

  const handleChannelChange = (newType: any) => {
    const typePrefix =
      newType === 'MEETING'
        ? 'Demo & Meeting with'
        : newType === 'CALL'
        ? 'Call with'
        : newType === 'WHATSAPP'
        ? 'WhatsApp Follow-up with'
        : newType === 'EMAIL'
        ? 'Email Touchpoint with'
        : 'Follow-up with';

    setFormData((prev) => ({
      ...prev,
      followUpType: newType,
      title: selectedLead
        ? `${typePrefix} ${selectedLead.name}${selectedLead.company ? ` (${selectedLead.company})` : ''}`
        : prev.title,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetchApi('/follow-ups', token, {
        method: 'POST',
        body: JSON.stringify(formData),
      }).catch(() => null);

      if (typeof window !== 'undefined') {
        try {
          const cachedTasks = JSON.parse(localStorage.getItem('das_crm_followup_tasks_cache') || '[]');
          const dueAtIso = `${formData.scheduledDate}T${formData.scheduledTime || '11:00'}:00`;
          const creatorName = currentUser?.name || 'Aditya Kumar Rai';
          const creatorRole = currentUser?.role || 'MANAGER';
          const repName = selectedLead?.owner || 'Sachin Puri';

          cachedTasks.unshift({
            id: res?.id || `task_${Date.now()}`,
            ...formData,
            dueAt: dueAtIso,
            createdAt: new Date().toISOString(),
            status: 'PENDING',
            createdById: currentUser?.id || 'mgr_aditya',
            createdByName: creatorName,
            createdByRole: creatorRole,
            createdBy: { name: creatorName, role: creatorRole },
            assignee: { name: repName, role: 'SALES_REP' },
            lead: selectedLead ? {
              id: selectedLead.id,
              name: selectedLead.name,
              firstName: selectedLead.name.split(' ')[0],
              lastName: selectedLead.name.split(' ').slice(1).join(' '),
              phone: selectedLead.phone,
              email: selectedLead.email,
              owner: { name: repName, role: 'SALES_REP' },
              company: { name: selectedLead.company || 'Enterprise Client' },
              status: { name: selectedLead.status || 'Active', color: '#3b82f6' },
            } : undefined,
          });
          localStorage.setItem('das_crm_followup_tasks_cache', JSON.stringify(cachedTasks.slice(0, 100)));
          window.dispatchEvent(new CustomEvent('das_crm_workflow_updated'));
          window.dispatchEvent(new CustomEvent('das_crm_followup_created', { detail: formData }));
        } catch (_) {}
      }

      onCreated();
    } catch (err: any) {
      alert(err.message || 'Failed to create follow-up');
    } finally {
      setLoading(false);
    }
  };

  const modalTitle =
    formData.followUpType === 'MEETING'
      ? 'Schedule Product Demo / Meeting'
      : formData.followUpType === 'CALL'
      ? 'Schedule Phone Call'
      : formData.followUpType === 'WHATSAPP'
      ? 'Schedule WhatsApp Touchpoint'
      : 'Schedule New Follow-up';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              {formData.followUpType === 'MEETING' ? (
                <CalendarCheck className="text-amber-400" size={18} />
              ) : (
                <Plus className="text-indigo-400" size={18} />
              )}
              {modalTitle}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Creator: <strong className="text-slate-200">{currentUser?.name || 'Aditya Kumar Rai'}</strong> ({currentUser?.role || 'MANAGER'})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 max-h-[82vh] overflow-y-auto">
          {/* ── 1. SEARCH & SELECT LEAD / PROSPECT ───────────────────────────── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User size={13} className="text-indigo-400" /> Select Lead / Prospect
              </label>
              {selectedLead && (
                <button
                  type="button"
                  onClick={handleClearSelectedLead}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                >
                  Change Lead
                </button>
              )}
            </div>

            {selectedLead ? (
              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-500/30 shrink-0">
                    {selectedLead.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                      <span className="truncate">{selectedLead.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-extrabold shrink-0 border border-indigo-500/30">
                        {selectedLead.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 truncate mt-0.5">
                      {selectedLead.phone && <span>📞 {selectedLead.phone}</span>}
                      {selectedLead.company && <span className="truncate">🏢 {selectedLead.company}</span>}
                      {selectedLead.owner && <span className="text-indigo-300">👤 Rep: {selectedLead.owner}</span>}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedLead}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0 ml-2 cursor-pointer"
                  title="Remove lead association"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(true)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                    title="Open prospect search"
                  >
                    <Search size={14} />
                  </button>
                  <input
                    type="text"
                    placeholder="Search prospect by name (e.g. Anjali), company, phone, email..."
                    value={leadSearchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onClick={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setLeadSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-14 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {leadSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setLeadSearchQuery('')}
                        className="text-slate-500 hover:text-white cursor-pointer p-0.5"
                        title="Clear search"
                      >
                        <X size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="text-slate-400 hover:text-white text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Toggle dropdown"
                    >
                      {isDropdownOpen ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Dropdown list */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-800/60 no-scrollbar">
                    {leadsLoading ? (
                      <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw size={13} className="animate-spin text-indigo-400" />
                        Syncing leads directory...
                      </div>
                    ) : filteredLeads.length === 0 && hasExactMatch ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        {leadSearchQuery ? 'No matching leads found.' : 'No leads available.'}
                      </div>
                    ) : (
                      filteredLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => handleSelectLead(lead)}
                          className="p-2.5 hover:bg-slate-900 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-indigo-600/30 text-slate-300 group-hover:text-indigo-300 font-black text-[11px] flex items-center justify-center shrink-0 border border-slate-700/60 transition-colors">
                              {lead.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                                <span className="truncate group-hover:text-indigo-300 transition-colors">{lead.name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold shrink-0">
                                  {lead.status}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 truncate mt-0.5">
                                {lead.phone && <span>📞 {lead.phone}</span>}
                                {lead.company && <span className="truncate">🏢 {lead.company}</span>}
                                {lead.owner && <span className="text-indigo-300 truncate">👤 {lead.owner}</span>}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300 hover:underline shrink-0 ml-2">
                            Select →
                          </span>
                        </div>
                      ))
                    )}

                    {/* Fallback: Create / Use typed query as Custom Prospect */}
                    {leadSearchQuery.trim() && !hasExactMatch && (
                      <div
                        onClick={handleCreateCustomProspect}
                        className="p-3 bg-indigo-950/60 hover:bg-indigo-900/80 border-t border-indigo-500/30 cursor-pointer flex items-center justify-between text-indigo-300 font-bold transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Plus size={14} className="text-indigo-400 shrink-0" />
                          <span className="text-xs truncate">
                            Use <strong className="text-white">&ldquo;{leadSearchQuery.trim()}&rdquo;</strong> as custom prospect
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 font-bold shrink-0 ml-2">
                          + Select
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 2. CHANNEL TYPE & PRIORITY ────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Channel Type *</label>
              <select
                value={formData.followUpType}
                onChange={(e) => handleChannelChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="MEETING">🤝 Demo / Meeting</option>
                <option value="CALL">📞 Phone Call</option>
                <option value="WHATSAPP">💬 WhatsApp Message</option>
                <option value="EMAIL">✉️ Email Touchpoint</option>
                <option value="GENERAL">⚡ General Follow-up</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Priority Level</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="HIGH">🔥 High Priority</option>
                <option value="MEDIUM">⚡ Medium Priority</option>
                <option value="NORMAL">Normal Priority</option>
              </select>
            </div>
          </div>

          {/* ── 3. TITLE / TOPIC ──────────────────────────────────────────────── */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Title / Topic *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Discuss Q4 software quotation & onboarding"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* ── 4. SCHEDULED DATE & TIME ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Date *</label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark] focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Time *</label>
              <input
                type="time"
                required
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark] focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ── 5. AGENDA & NOTES ─────────────────────────────────────────────── */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Agenda & Key Talking Points</label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              rows={2}
              placeholder="What questions to ask, key objectives, demo points..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* ── 6. SUBMIT BUTTONS ─────────────────────────────────────────────── */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800/80">
            <button type="button" onClick={onClose} disabled={loading} className="btn-secondary text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Scheduling...
                </>
              ) : formData.followUpType === 'MEETING' ? (
                'Save & Schedule Meeting'
              ) : (
                'Save & Schedule Follow-up'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

