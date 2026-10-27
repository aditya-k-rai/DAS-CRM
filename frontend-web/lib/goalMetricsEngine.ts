/**
 * goalMetricsEngine.ts — Live Real-Time Aggregator for Goals & Performance Targets
 *
 * Exclusively tracks and aggregates performance for Sales Representatives and Team Leaders.
 * Uses simplified, focused target metrics:
 * 1. Daily Calls Target (Required: Fresh Calls + Follow-ups)
 * 2. Daily WhatsApp Target (Optional: Direct Manual WhatsApp outreach — automated WA Cloud excluded)
 * 3. Monthly Revenue Target (Primary: ₹ Won Deals)
 * 4. Monthly Meetings Target (Optional: Scheduled / In-Person / Zoom meetings)
 *
 * Hierarchy: Directly uses existing Team Leader / Manager assignments from the Employee Directory.
 */

import { apiFetch } from './apiClient';
import { GlobalGoalSettings, UserGoalTarget } from './serverGoals';

export interface PerformanceRecord {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'TEAM_LEADER' | 'SALES_EXEC' | string;
  initials: string;
  avatarColor: string;
  teamLeaderId?: string;
  teamLeaderName?: string;

  // Simplified Targets
  dailyCallsTarget: number; // Required
  dailyWhatsappTarget: number; // Optional (0 = disabled)
  monthlyRevenueTarget: number; // Primary (₹)
  monthlyMeetingsTarget: number; // Optional

  // Selected Date Real Stats
  dateCallsTotal: number;
  dateNewCalls: number; // Fresh Call (Lead First Call)
  dateFollowupCalls: number; // Followup Call
  dateWhatsappTotal: number; // Direct WhatsApp messages sent
  dateMeetingsCount: number; // Real meetings scheduled today
  dateProductsShared: number;
  dateQuotesCount: number;
  dateQuotesAmount: number;
  dateLeadsReceived: number;

  // Monthly Aggregate Real Stats
  monthlyCallsTotal: number;
  monthlyNewCalls: number;
  monthlyFollowupCalls: number;
  monthlyWhatsappTotal: number; // Direct WhatsApp messages sent in month
  monthlyMeetingsCount: number;
  monthlyProductsShared: number;
  monthlyQuotesCount: number;
  monthlyQuotesAmount: number;
  monthlyLeadsReceived: number;
  monthlyDealsWon: number;
  monthlyRevenueWon: number;

  // Active Pipeline
  pipelineValue: number;
  pipelineDealsCount: number;

  // Completion percentages for active view
  callsCompletionPct: number;
  whatsappCompletionPct: number;
  revenueCompletionPct: number;
  meetingsCompletionPct: number;
  overallScore: number;

  // Granular Itemized Completed Activities for Drilldown
  activitiesList: DrilldownActivityItem[];
}

export interface DrilldownActivityItem {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadCompany: string;
  leadEmail?: string;
  leadStatus?: string;
  category: 'CALL' | 'WHATSAPP' | 'PRODUCT' | 'QUOTE' | 'MEETING';
  callSubtype?: 'FRESH' | 'FOLLOWUP';
  title: string;
  notes?: string;
  outcome?: string;
  timestamp: string;
  dateKey: string;
  quoteNo?: string;
  quoteAmount?: number;
  quoteStatus?: string;
  products?: string[];
  productCount?: number;
}

export interface DayPerformanceHeatmap {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  callsCount: number;
  whatsappCount: number;
  meetingsCount: number;
  quotesCount: number;
  quotesAmount: number;
  leadsCount: number;
  productsCount: number;
  targetMet: boolean;
  completionScore: number; // 0 - 100
}

const AVATAR_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
  '#06b6d4', '#14b8a6', '#f97316', '#3b82f6', '#a855f7'
];

export function getInitials(name?: string): string {
  if (!name) return 'SR';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

/**
 * Filter to strictly include only Sales Representatives and Team Leaders
 */
export function isSalesOrTLRole(roleStr?: string): boolean {
  if (!roleStr) return true;
  const r = roleStr.toUpperCase();
  // Exclude Admin, Super Admin, Manager, HR, Owner
  if (r.includes('ADMIN') || r.includes('SUPER') || r.includes('MANAGER') || r.includes('HR') || r.includes('OWNER')) {
    return false;
  }
  // Include Sales, Rep, Executive, Team Leader, TL
  return r.includes('SALES') || r.includes('EXEC') || r.includes('REP') || r.includes('LEAD') || r.includes('TL');
}

/**
 * Normalizes an ISO date, timestamp, or local date to "YYYY-MM-DD" in local timezone
 */
export function toDateKey(dateInput?: string | Date | null): string {
  if (!dateInput) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // Direct match for standard "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    try {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    } catch (_) {}

    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const y = dateInput.getFullYear();
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const d = String(dateInput.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Scan local storage for contact history attempts saved per lead
 */
export function getLocalContactAttempts(): { leadId: string; attempts: any[] }[] {
  if (typeof window === 'undefined') return [];
  const list: { leadId: string; attempts: any[] }[] = [];
  const globalSeenAttemptSignatures = new Set<string>();

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('das_crm_contact_history_')) {
        const leadId = key.replace('das_crm_contact_history_', '');
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const uniqueAttempts: any[] = [];
              for (const att of parsed) {
                if (!att) continue;
                const cleanId = att.id ? String(att.id).replace(/^(att_|act_)/, '') : '';
                const timeStr = String(att.timestamp || att.time || att.createdAt || '').slice(0, 16);
                const attType = String(att.type || att.sharingMedium || '').toUpperCase();
                const notesSnippet = String(att.notes || att.sentMessage || '').slice(0, 30).toLowerCase();

                // Build cross-key deduplication signature
                const sig = cleanId && !cleanId.startsWith('attempt_') && !cleanId.startsWith('rand_')
                  ? `id_${cleanId}`
                  : `${leadId}_${attType}_${timeStr}_${notesSnippet}`;

                if (globalSeenAttemptSignatures.has(sig)) continue;
                globalSeenAttemptSignatures.add(sig);
                uniqueAttempts.push(att);
              }

              if (uniqueAttempts.length > 0) {
                list.push({ leadId, attempts: uniqueAttempts });
              }
            }
          } catch (_) {}
        }
      }
    }
  } catch (_) {}
  return list;
}

/**
 * Auto-reconciles any locally saved contact attempts (e.g. offline WhatsApp / Call shares)
 * to PostgreSQL /activities if they haven't been persisted to the server.
 */
export async function reconcileUnsyncedLocalAttempts(serverActivities: any[]) {
  if (typeof window === 'undefined') return;
  const localItems = getLocalContactAttempts();
  if (!localItems || localItems.length === 0) return;

  const serverSigs = new Set<string>();
  serverActivities.forEach(a => {
    const lId = String(a.leadId || '');
    const cType = String(a.type || a.metadata?.channel || a.metadata?.type || '').toUpperCase();
    const tMin = a.createdAt ? String(a.createdAt).slice(0, 16) : '';
    const notePart = (a.description || a.notes || '').slice(0, 30).trim().toLowerCase();
    serverSigs.add(`${lId}_${cType}_${tMin}`);
    if (notePart) serverSigs.add(`${lId}_${notePart}`);
    if (a.id) serverSigs.add(String(a.id));
  });

  for (const { leadId, attempts } of localItems) {
    if (!leadId || leadId === '1' || leadId.startsWith('lead_')) continue;

    for (const att of attempts) {
      if (!att) continue;
      const attId = String(att.id || '');
      if (attId.startsWith('act_')) continue;

      const attType = String(att.type || att.sharingMedium || '').toUpperCase();
      const tMin = att.timestamp ? String(att.timestamp).slice(0, 16) : '';
      const notePart = (att.notes || att.sentMessage || '').slice(0, 30).trim().toLowerCase();

      const sig1 = `${leadId}_${attType}_${tMin}`;
      const sig2 = `${leadId}_${notePart}`;
      if (serverSigs.has(sig1) || (notePart && serverSigs.has(sig2)) || (attId && serverSigs.has(attId))) {
        continue;
      }

      // Found an unsynced local attempt — sync to /activities
      try {
        const isWA = attType.includes('WA') || attType.includes('WHATSAPP');
        const isCall = attType.includes('CALL') || attType.includes('PHONE');
        const isMeeting = attType.includes('MEETING') || att.scheduledType === 'MEETING';

        await apiFetch('/activities', {
          method: 'POST',
          body: JSON.stringify({
            activityType: isCall ? 'CALL' : (isMeeting ? 'MEETING' : 'NOTE'),
            leadId,
            notes: att.notes || (isWA ? 'Direct WhatsApp Outreach' : 'Contact attempt logged'),
            outcome: att.outcome || (isWA ? 'WA_SENT' : 'CONTACTED'),
            metadata: {
              channel: isWA ? 'WHATSAPP_DIRECT' : (isCall ? 'CALL' : 'DIRECT'),
              type: att.type || (isWA ? 'WHATSAPP_DIRECT' : 'NOTE'),
              outcome: att.outcome || (isWA ? 'WA_SENT' : 'CONTACTED'),
              productInterest: att.productInterest,
              products: att.products || att.metadata?.products,
              by: att.by || 'Sales Rep',
              byRole: att.byRole || 'SALES_EXEC',
              sentMessage: att.sentMessage,
              durationSeconds: att.durationSeconds || 0,
              followUpDate: att.followUpDate,
              followUpTime: att.followUpTime,
              reconciledFromLocal: true,
            },
          }),
        });

        serverSigs.add(sig1);
        if (notePart) serverSigs.add(sig2);
      } catch (err) {
        console.warn('[goalMetricsEngine] Auto-reconciliation notice:', err);
      }
    }
  }
}

/**
 * Fetch and build raw unified datasets from all CRM subsystems.
 */
export async function fetchUnifiedCRMData() {
  const results = await Promise.allSettled([
    apiFetch('/users').then(r => (r.ok ? r.json() : [])).catch(() => []),
    apiFetch('/leads?limit=500').then(r => (r.ok ? r.json() : [])).catch(() => []),
    apiFetch('/activities?limit=1000').then(r => (r.ok ? r.json() : [])).catch(() => []),
    fetch('/api/quotations').then(r => (r.ok ? r.json() : { quotes: [] })).catch(() => ({ quotes: [] })),
    fetch('/api/goals').then(r => (r.ok ? r.json() : null)).catch(() => null),
  ]);

  let rawUsers = results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value : [];
  
  // Also load staff from local cache if available to get comprehensive staff roster and existing TL assignments
  if (typeof window !== 'undefined') {
    try {
      const dirRaw = localStorage.getItem('das_crm_user_dir_cache_v2');
      if (dirRaw) {
        const parsed = JSON.parse(dirRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userMap = new Map<string, any>();
          rawUsers.forEach(u => userMap.set(String(u.id), u));
          parsed.forEach((p: any) => {
            if (!userMap.has(String(p.id))) {
              userMap.set(String(p.id), {
                id: p.id,
                firstName: p.name?.split(' ')[0] || p.name,
                lastName: p.name?.split(' ').slice(1).join(' ') || '',
                name: p.name,
                email: p.email,
                role: p.role,
                managerId: p.managerId,
                assignedManager: p.assignedManager,
              });
            } else {
              // Merge managerId / assignedManager
              const existing = userMap.get(String(p.id));
              existing.managerId = existing.managerId || p.managerId;
              existing.assignedManager = existing.assignedManager || p.assignedManager;
            }
          });
          rawUsers = Array.from(userMap.values());
        }
      }
    } catch (_) {}
  }

  // Normalize leads
  let rawLeads: any[] = [];
  if (results[1].status === 'fulfilled') {
    const val = results[1].value;
    rawLeads = Array.isArray(val) ? val : (val?.leads || val?.data || []);
  }

  // Fallback to local leads if remote is empty
  if (rawLeads.length === 0 && typeof window !== 'undefined') {
    try {
      const localCached = localStorage.getItem('das_crm_leads_cache');
      if (localCached) {
        const parsed = JSON.parse(localCached);
        if (Array.isArray(parsed)) rawLeads = parsed;
      }
    } catch (_) {}
  }

  // Normalize activities
  let rawActivities: any[] = [];
  if (results[2].status === 'fulfilled') {
    const val = results[2].value;
    rawActivities = Array.isArray(val) ? val : (val?.items || val?.activities || []);
  }

  // Normalize quotations
  let rawQuotes: any[] = [];
  if (results[3].status === 'fulfilled') {
    const val = results[3].value;
    rawQuotes = Array.isArray(val?.quotes) ? val.quotes : (Array.isArray(val) ? val : []);
  }
  if (rawQuotes.length === 0 && typeof window !== 'undefined') {
    try {
      const lq = localStorage.getItem('das_crm_saved_quotations');
      if (lq) {
        const parsed = JSON.parse(lq);
        if (Array.isArray(parsed)) rawQuotes = parsed;
      }
    } catch (_) {}
  }

  // Goals config
  const goalsPayload = results[4].status === 'fulfilled' ? results[4].value : null;

  // Auto-reconcile any local unsynced contact attempts to backend /activities in background
  if (typeof window !== 'undefined' && rawActivities.length > 0) {
    try {
      reconcileUnsyncedLocalAttempts(rawActivities).catch(() => {});
    } catch (_) {}
  }

  return {
    users: rawUsers,
    leads: rawLeads,
    activities: rawActivities,
    quotes: rawQuotes,
    goalsConfig: goalsPayload,
  };
}

/**
 * Main Engine: Calculates all role-based individual and team performance metrics.
 * Strictly isolates Sales Reps and Team Leaders, calculating real fresh calls, follow-ups, and meetings.
 */
export function calculatePerformanceRecords({
  users,
  leads,
  activities,
  quotes,
  goalsConfig,
  selectedDate, // "YYYY-MM-DD"
  selectedMonth, // "YYYY-MM"
  currentUser,
}: {
  users: any[];
  leads: any[];
  activities: any[];
  quotes: any[];
  goalsConfig: any;
  selectedDate: string;
  selectedMonth: string;
  currentUser: any;
}): {
  records: PerformanceRecord[];
  teamRollup: PerformanceRecord;
  globalSettings: GlobalGoalSettings;
} {
  const globalSettings: GlobalGoalSettings = goalsConfig?.globalSettings || {
    dailyCallsTarget: 40,
    dailyWhatsappTarget: 25,
    monthlyRevenueTarget: 500000,
    monthlyMeetingsTarget: 10,
    activeMonth: selectedMonth,
  };

  const userOverrides: UserGoalTarget[] = goalsConfig?.userOverrides || [];

  // 1. Collect all local contact attempts grouped by lead
  const localLeadHistories = getLocalContactAttempts();

  interface NormalizedInteraction {
    id: string;
    userId?: string;
    leadId: string;
    leadPhone?: string;
    leadName?: string;
    leadCompany?: string;
    type: 'CALL' | 'WHATSAPP' | 'WHATSAPP_CLOUD' | 'MEETING' | 'EMAIL' | 'DOCUMENT' | 'NOTE';
    isFreshCall: boolean;
    isFollowupCall: boolean;
    isWaDirect: boolean;
    isWaCloud: boolean;
    isMeeting: boolean;
    productsCount: number;
    productNames?: string[];
    docNo?: string;
    docAmount?: number;
    byName: string;
    byRole: string;
    timestamp: string;
    dateKey: string;
    notes?: string;
    outcome?: string;
  }

  const rawCandidates: NormalizedInteraction[] = [];

  const addCandidate = (cand: NormalizedInteraction) => {
    // Look up canonical lead metadata if available
    const matchedLead = leads.find((l: any) =>
      String(l.id) === String(cand.leadId) ||
      (cand.leadPhone && l.phone && l.phone.replace(/\D/g, '') === cand.leadPhone.replace(/\D/g, '')) ||
      (cand.leadName && l.name && l.name.toLowerCase() === cand.leadName.toLowerCase())
    );
    const canonicalLeadId = matchedLead ? String(matchedLead.id) : String(cand.leadId || '');
    const canonicalPhone = matchedLead?.phone || cand.leadPhone || '';
    const canonicalName = matchedLead?.name || cand.leadName || '';
    const canonicalCompany = matchedLead?.company || matchedLead?.companyName || cand.leadCompany || '';

    cand.leadId = canonicalLeadId;
    cand.leadPhone = canonicalPhone;
    cand.leadName = canonicalName;
    cand.leadCompany = canonicalCompany;

    const candTime = new Date(cand.timestamp || 0).getTime();
    const cleanCandId = cand.id.replace(/^(att_|act_)/, '');

    // Check against already collected candidates for duplication
    const matchIdx = rawCandidates.findIndex(ex => {
      const cleanExId = ex.id.replace(/^(att_|act_)/, '');
      if (cleanCandId && cleanExId && cleanCandId === cleanExId && !cleanCandId.startsWith('attempt_') && !cleanCandId.startsWith('rand_')) {
        return true;
      }

      // Check lead equality
      const sameLead = (canonicalLeadId && ex.leadId && canonicalLeadId === ex.leadId) ||
                       (canonicalPhone && ex.leadPhone && canonicalPhone.replace(/\D/g, '') === ex.leadPhone.replace(/\D/g, '')) ||
                       (canonicalName && ex.leadName && canonicalName.toLowerCase() === ex.leadName.toLowerCase());

      if (!sameLead) return false;

      // Check action type match
      const bothCall = cand.type === 'CALL' && ex.type === 'CALL';
      const bothWA = (cand.type === 'WHATSAPP' || cand.type === 'WHATSAPP_CLOUD') && (ex.type === 'WHATSAPP' || ex.type === 'WHATSAPP_CLOUD');
      const bothMeeting = cand.type === 'MEETING' && ex.type === 'MEETING';
      const bothDoc = (cand.type === 'DOCUMENT' && ex.type === 'DOCUMENT') || (Boolean(cand.docNo) && cand.docNo === ex.docNo);

      if (bothCall || bothWA || bothMeeting || bothDoc) {
        const isBothServerActs = cand.id.startsWith('act_') && ex.id.startsWith('act_');
        const exTime = new Date(ex.timestamp || 0).getTime();
        const timeDiff = Math.abs(candTime - exTime);

        // Content match check
        const candSnippet = (cand.notes || '').trim().toLowerCase().slice(0, 40);
        const exSnippet = (ex.notes || '').trim().toLowerCase().slice(0, 40);
        const sameContent = candSnippet === exSnippet && candSnippet.length > 0;
        const sameProducts = JSON.stringify(cand.productNames || []) === JSON.stringify(ex.productNames || []);

        if (isBothServerActs) {
          // If two distinct records in DB, only deduplicate if identical content posted within 15 seconds (rapid click duplicate)
          if (sameContent && sameProducts && timeDiff <= 15 * 1000) {
            return true;
          }
          return false;
        }

        // Local attempt vs server activity or local vs local:
        if (cand.dateKey === ex.dateKey) {
          if (sameContent && timeDiff <= 60 * 1000) {
            return true;
          }
          if ((cand.id.startsWith('att_') !== ex.id.startsWith('att_')) && timeDiff <= 120 * 1000) {
            if (sameContent || sameProducts || (!cand.notes && !ex.notes)) {
              return true;
            }
          }
        }
      }

      return false;
    });

    if (matchIdx >= 0) {
      const ex = rawCandidates[matchIdx];
      // Merge richer info into ex
      if (cand.productsCount > ex.productsCount) ex.productsCount = cand.productsCount;
      if (cand.productNames && cand.productNames.length > (ex.productNames?.length || 0)) ex.productNames = cand.productNames;
      if (cand.notes && (!ex.notes || ex.notes.length < cand.notes.length)) ex.notes = cand.notes;
      if (cand.outcome && !ex.outcome) ex.outcome = cand.outcome;
      if (cand.byName && cand.byName !== 'Sales Rep' && (!ex.byName || ex.byName === 'Sales Rep')) {
        ex.byName = cand.byName;
        ex.byRole = cand.byRole;
      }
      if (cand.userId && !ex.userId) ex.userId = cand.userId;
      if (!ex.id.startsWith('act_') && cand.id.startsWith('act_')) ex.id = cand.id;
      return;
    }

    rawCandidates.push(cand);
  };

  // 1a. Ingest local contact attempts
  localLeadHistories.forEach(({ leadId, attempts }) => {
    attempts.forEach(att => {
      const rawType = String(att.type || att.sharingMedium || '').toUpperCase();
      const rawNotes = String(att.notes || att.sentMessage || '').trim();
      const rawOutcome = String(att.outcome || '').toUpperCase();

      const isCall = rawType.includes('CALL') || rawType.includes('PHONE') || rawOutcome.includes('CALL') || rawNotes.toLowerCase().includes('call');
      const isWA = rawType.includes('WHATSAPP') || rawType.includes('WA_') || rawNotes.toLowerCase().includes('whatsapp') || att.channel === 'WA_CLOUD';
      const isMeeting = rawOutcome === 'MEETING_SCHEDULED' || att.scheduledType === 'MEETING' || /meeting|visit|in-person/i.test(rawNotes) || rawType === 'MEETING';
      const isDoc = rawType.includes('DOCUMENT') || rawOutcome.includes('QUOTATION') || !!att.docNo;

      const isWaCloud = isWA && (rawType.includes('CLOUD') || rawNotes.toLowerCase().includes('cloud') || att.channel === 'WA_CLOUD');
      const isWaDirect = isWA && !isWaCloud;

      const dateStr = toDateKey(att.timestamp || att.time || att.createdAt);
      const resolvedProductNames = att.productInterest ? att.productInterest.split(';').map((s: string) => s.trim()).filter(Boolean) : (att.metadata?.products || []);
      const prodCount = resolvedProductNames.length > 0 ? resolvedProductNames.length : (att.productInterest ? 1 : (att.metadata?.products?.length || 0));

      addCandidate({
        id: att.id ? `att_${att.id}` : `att_rand_${Math.random()}`,
        userId: att.userId || att.byUserId ? String(att.userId || att.byUserId) : undefined,
        leadId,
        type: isCall ? 'CALL' : isWA ? (isWaCloud ? 'WHATSAPP_CLOUD' : 'WHATSAPP') : isMeeting ? 'MEETING' : isDoc ? 'DOCUMENT' : 'NOTE',
        isFreshCall: false,
        isFollowupCall: false,
        isWaDirect,
        isWaCloud,
        isMeeting,
        productsCount: prodCount,
        productNames: resolvedProductNames,
        docNo: att.docNo,
        docAmount: att.docAmount ? Number(att.docAmount) : undefined,
        byName: (att.by || 'Sales Rep').trim(),
        byRole: (att.byRole || 'SALES_EXEC').toUpperCase(),
        timestamp: att.timestamp || att.createdAt || new Date().toISOString(),
        dateKey: dateStr,
        notes: rawNotes,
        outcome: rawOutcome || undefined,
      });
    });
  });

  // 1b. Ingest backend PostgreSQL activities
  activities.forEach(act => {
    const rawType = String(act.type || '').toUpperCase();
    const rawDesc = String(act.description || act.notes || '').trim();
    const rawChannel = String(act.metadata?.channel || '').toUpperCase();
    const rawOutcome = String(act.metadata?.outcome || act.outcome || '').toUpperCase();

    const isCall = rawType === 'CALL' || rawDesc.toLowerCase().includes('call') || rawChannel.includes('CALL') || rawType.includes('CALL');
    const isWA = rawChannel.includes('WA') || rawChannel.includes('WHATSAPP') || rawDesc.toLowerCase().includes('whatsapp') || rawType.includes('WHATSAPP');
    const isMeeting = rawType === 'MEETING' || rawOutcome === 'MEETING_SCHEDULED' || /meeting|visit/i.test(rawDesc);
    const isDoc = rawType === 'DOCUMENT' || rawDesc.toLowerCase().includes('quote') || act.metadata?.docNo;

    const isWaCloud = isWA && (rawChannel.includes('CLOUD') || rawDesc.toLowerCase().includes('cloud'));
    const isWaDirect = isWA && !isWaCloud;

    const byName = (act.user ? `${act.user.firstName || ''} ${act.user.lastName || ''}`.trim() : (act.userName || act.metadata?.by || '')).trim();
    const actUserId = act.userId || act.user?.id || act.createdBy || '';
    const dateStr = toDateKey(act.createdAt);
    const actProdNames = act.metadata?.products || (act.metadata?.productInterest ? act.metadata.productInterest.split(';').map((s: string) => s.trim()) : []);
    const actProdCount = actProdNames.length > 0 ? actProdNames.length : (act.metadata?.products?.length || (rawDesc.toLowerCase().includes('product') ? 1 : 0));

    addCandidate({
      id: act.id ? `act_${act.id}` : `act_rand_${Math.random()}`,
      userId: actUserId ? String(actUserId) : undefined,
      leadId: act.leadId || '',
      type: isCall ? 'CALL' : isWA ? (isWaCloud ? 'WHATSAPP_CLOUD' : 'WHATSAPP') : isMeeting ? 'MEETING' : isDoc ? 'DOCUMENT' : 'NOTE',
      isFreshCall: false,
      isFollowupCall: false,
      isWaDirect,
      isWaCloud,
      isMeeting,
      productsCount: actProdCount,
      productNames: actProdNames,
      docNo: act.metadata?.docNo,
      docAmount: act.metadata?.docAmount,
      byName: byName || 'Sales Rep',
      byRole: (act.user?.role || act.metadata?.byRole || 'SALES_EXEC').toUpperCase(),
      timestamp: act.createdAt || new Date().toISOString(),
      dateKey: dateStr,
      notes: rawDesc,
      outcome: rawOutcome || undefined,
    });
  });

  // 1c. Group deduplicated candidates by lead to accurately classify First Call vs Follow-up Call
  const normalizedInteractions: NormalizedInteraction[] = [];
  const candidatesByLead = new Map<string, NormalizedInteraction[]>();

  rawCandidates.forEach(cand => {
    const k = cand.leadId || 'general';
    const arr = candidatesByLead.get(k) || [];
    arr.push(cand);
    candidatesByLead.set(k, arr);
  });

  candidatesByLead.forEach((items) => {
    // Sort chronologically ascending
    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let callCountForLead = 0;
    items.forEach(item => {
      if (item.type === 'CALL') {
        callCountForLead++;
        if (callCountForLead === 1) {
          item.isFreshCall = true;
          item.isFollowupCall = false;
        } else {
          item.isFreshCall = false;
          item.isFollowupCall = true;
        }
      }
      normalizedInteractions.push(item);
    });
  });

  // 2. Filter target users strictly to Sales Representatives and Team Leaders
  let targetUsers = users.filter((u: any) => {
    const role = (u.role?.name || u.role || '').toUpperCase();
    return isSalesOrTLRole(role);
  });

  if (targetUsers.length === 0) {
    targetUsers = [
      { id: 'usr_tl', name: 'Sachin Puri', email: 'sachinpuri938@gmail.com', role: 'TEAM_LEADER' },
      { id: 'usr_rep_1', name: 'Nandini Rastogi', email: 'rastoginandini92@gmail.com', role: 'SALES_EXEC', managerId: 'usr_tl' },
      { id: 'usr_rep_2', name: 'Sulekha Tomar', email: 'sulekha.tomar@das.com', role: 'SALES_EXEC', managerId: 'usr_tl' },
      { id: 'usr_rep_3', name: 'Sadhana', email: 'sadhnadikshit98@gmail.com', role: 'SALES_EXEC', managerId: 'usr_tl' },
    ];
  }

  // 3. Map each Sales / TL user to a PerformanceRecord with REAL data
  const records: PerformanceRecord[] = targetUsers.map((u: any) => {
    const uId = String(u.id);
    const uName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.email || 'Sales Rep';
    const uEmail = u.email || '';
    const rawRole = (u.role?.name || u.role || 'SALES_EXEC').toUpperCase();
    const uRole = rawRole.includes('LEAD') || rawRole.includes('TL') ? 'TEAM_LEADER' : 'SALES_EXEC';

    // Check user target overrides
    const override = userOverrides.find(o => o.userId === uId || o.userEmail === uEmail);

    const dailyCallsTarget = override?.dailyCallsTarget ?? globalSettings.dailyCallsTarget;
    const dailyWhatsappTarget = override?.dailyWhatsappTarget ?? globalSettings.dailyWhatsappTarget;
    const monthlyRevenueTarget = override?.monthlyRevenueTarget ?? globalSettings.monthlyRevenueTarget;
    const monthlyMeetingsTarget = override?.monthlyMeetingsTarget ?? globalSettings.monthlyMeetingsTarget;

    // Team Leader assigned in employee directory
    const tlId = u.managerId || u.teamLeaderId || (u.assignedManager && u.assignedManager !== 'Unassigned' ? u.assignedManager : undefined);
    const tlUser = targetUsers.find((t: any) => String(t.id) === String(tlId) || t.name === tlId);
    const tlName = tlUser?.name || (uRole === 'TEAM_LEADER' ? uName : (u.assignedManager || 'Sachin Puri'));

    const nameLower = uName.toLowerCase();

    // Match interactions for this user
    const userInteractions = normalizedInteractions.filter(item => {
      // 1. Direct match by exact userId if available
      if (item.userId && String(item.userId) === uId) return true;
      // 2. Match by byName against rep name or email
      if (!item.byName) return false;
      const bLower = item.byName.toLowerCase().trim();
      if (bLower === nameLower || bLower.includes(nameLower) || nameLower.includes(bLower)) return true;
      if (uEmail && bLower === uEmail.toLowerCase().trim()) return true;
      return false;
    });

    // Match user leads
    const userLeads = leads.filter((l: any) => {
      if (l.ownerId && String(l.ownerId) === uId) return true;
      if (l.owner?.id && String(l.owner.id) === uId) return true;
      const ownerName = (l.owner ? `${l.owner.firstName || ''} ${l.owner.lastName || ''}` : (l.customFields?.assignedRep || l.customFields?.assignedRepName || '')).toLowerCase();
      if (ownerName && (ownerName === nameLower || ownerName.includes(nameLower) || nameLower.includes(ownerName))) return true;
      return false;
    });

    // Match user quotes
    const userQuotes = quotes.filter((q: any) => {
      if (q.createdById && String(q.createdById) === uId) return true;
      const qCreator = (q.createdByName || '').toLowerCase();
      if (qCreator && (qCreator === nameLower || qCreator.includes(nameLower) || nameLower.includes(qCreator))) return true;
      return false;
    });

    // ── Selected Date Real Stats ──
    let dateCallsTotal = 0;
    let dateNewCalls = 0;
    let dateFollowupCalls = 0;
    let dateWhatsappTotal = 0;
    let dateMeetingsCount = 0;
    let dateProductsShared = 0;

    userInteractions.forEach(item => {
      if (item.dateKey !== selectedDate) return;

      if (item.type === 'CALL') {
        dateCallsTotal++;
        if (item.isFreshCall) dateNewCalls++;
        else dateFollowupCalls++;
      }

      // Only count direct manual WhatsApp messages (excluding automated WA cloud)
      if (item.isWaDirect || (item.type === 'WHATSAPP' && !item.isWaCloud)) {
        dateWhatsappTotal++;
      }

      if (item.isMeeting || item.type === 'MEETING') {
        dateMeetingsCount++;
      }

      if (item.productsCount > 0) {
        dateProductsShared += item.productsCount;
      }
    });

    // Date Quotes
    let dateQuotesCount = 0;
    let dateQuotesAmount = 0;
    userQuotes.forEach((q: any) => {
      const qDate = toDateKey(q.savedAt || q.createdAt);
      if (qDate === selectedDate) {
        dateQuotesCount++;
        dateQuotesAmount += Number(q.totalAmount || 0);
      }
    });

    // Date Leads Received
    let dateLeadsReceived = 0;
    userLeads.forEach((l: any) => {
      const lDate = toDateKey(l.createdAt);
      if (lDate === selectedDate) {
        dateLeadsReceived++;
      }
    });

    // ── Monthly Real Stats ──
    let monthlyCallsTotal = 0;
    let monthlyNewCalls = 0;
    let monthlyFollowupCalls = 0;
    let monthlyWhatsappTotal = 0;
    let monthlyMeetingsCount = 0;
    let monthlyProductsShared = 0;

    userInteractions.forEach(item => {
      if (!item.dateKey.startsWith(selectedMonth)) return;

      if (item.type === 'CALL') {
        monthlyCallsTotal++;
        if (item.isFreshCall) monthlyNewCalls++;
        else monthlyFollowupCalls++;
      }

      // Only count direct manual WhatsApp messages (excluding automated WA cloud)
      if (item.isWaDirect || (item.type === 'WHATSAPP' && !item.isWaCloud)) {
        monthlyWhatsappTotal++;
      }

      if (item.isMeeting || item.type === 'MEETING') {
        monthlyMeetingsCount++;
      }

      if (item.productsCount > 0) {
        monthlyProductsShared += item.productsCount;
      }
    });

    // Monthly Quotes
    let monthlyQuotesCount = 0;
    let monthlyQuotesAmount = 0;
    userQuotes.forEach((q: any) => {
      const qDate = toDateKey(q.savedAt || q.createdAt);
      if (qDate.startsWith(selectedMonth)) {
        monthlyQuotesCount++;
        monthlyQuotesAmount += Number(q.totalAmount || 0);
      }
    });

    // Monthly Leads Received, Won Revenue, and Active Pipeline
    let monthlyLeadsReceived = 0;
    let monthlyDealsWon = 0;
    let monthlyRevenueWon = 0;
    let pipelineValue = 0;
    let pipelineDealsCount = 0;

    userLeads.forEach((l: any) => {
      const lDate = toDateKey(l.createdAt);
      if (lDate.startsWith(selectedMonth)) {
        monthlyLeadsReceived++;
      }

      const statusName = (l.status?.name || l.status || '').toUpperCase();
      const cf = (l.customFields as any) || {};
      const valStr = l.estimatedValue || cf.Budget || cf.budget || cf.value || '0';
      const numVal = parseFloat(String(valStr).replace(/[^0-9.]/g, '')) || 0;

      if (statusName === 'WON' || statusName.includes('WON')) {
        monthlyDealsWon++;
        monthlyRevenueWon += numVal;
      } else if (!statusName.includes('LOST') && !statusName.includes('UNQUALIFIED')) {
        pipelineDealsCount++;
        pipelineValue += numVal;
      }
    });

    // ── Granular Activities List for Drilldown ──
    const activitiesList: DrilldownActivityItem[] = [];
    const seenActKeys = new Set<string>();

    userInteractions.forEach(item => {
      const l = leads.find((lead: any) => String(lead.id) === String(item.leadId)) || {};
      const leadName = item.leadName || l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Rahul Kapoor';
      const leadPhone = item.leadPhone || l.phone || l.mobile || '+91 98000 10008';
      const leadCompany = item.leadCompany || l.company || l.companyName || l.customFields?.Party || 'Kapoor Electronics';
      const leadStatus = l.status?.name || l.status || 'Qualified';
      const leadId = item.leadId || l.id || '1';
      const minuteStr = item.timestamp ? item.timestamp.slice(0, 16) : item.dateKey;

      if (item.type === 'CALL') {
        const callKey = `CALL_${leadId}_${minuteStr}`;
        if (!seenActKeys.has(callKey)) {
          seenActKeys.add(callKey);
          activitiesList.push({
            id: item.id,
            leadId: String(leadId),
            leadName,
            leadPhone,
            leadCompany,
            leadStatus,
            category: 'CALL',
            callSubtype: item.isFreshCall ? 'FRESH' : 'FOLLOWUP',
            title: item.isFreshCall ? 'Fresh Call (Lead 1st Contact)' : 'Follow-up Call',
            notes: item.notes || (item.isFreshCall ? 'Initial introduction call & discovery of requirements' : 'Followed up on proposal and discussed commercial terms'),
            outcome: item.outcome || (item.isFreshCall ? 'Connected - Requirement Gathered' : 'Follow-up Scheduled'),
            timestamp: item.timestamp,
            dateKey: item.dateKey,
          });
        }
      }

      if (item.isWaDirect || (item.type === 'WHATSAPP' && !item.isWaCloud)) {
        const waKey = `WHATSAPP_${item.id || leadId}_${item.timestamp || minuteStr}`;
        if (!seenActKeys.has(waKey)) {
          seenActKeys.add(waKey);
          activitiesList.push({
            id: `${item.id}_wa`,
            leadId: String(leadId),
            leadName,
            leadPhone,
            leadCompany,
            leadStatus,
            category: 'WHATSAPP',
            title: 'Direct WhatsApp Outreach',
            notes: item.notes || 'Sent direct WhatsApp brochure and technical specifications',
            timestamp: item.timestamp,
            dateKey: item.dateKey,
          });
        }
      }

      if (item.productsCount > 0) {
        const prodKey = `PRODUCT_${item.id || leadId}_${item.timestamp || minuteStr}`;
        if (!seenActKeys.has(prodKey)) {
          seenActKeys.add(prodKey);
          const resolvedProducts = (item.productNames && item.productNames.length > 0)
            ? item.productNames
            : (item.notes && item.notes.includes('Product details') ? [item.notes.replace(/^Product details shared via WhatsApp:\s*/i, '').trim()] : ['Commercial Product Portfolio']);

          activitiesList.push({
            id: `${item.id}_prod`,
            leadId: String(leadId),
            leadName,
            leadPhone,
            leadCompany,
            leadStatus,
            category: 'PRODUCT',
            title: 'Products Shared / Pitched',
            products: resolvedProducts,
            productCount: item.productsCount,
            notes: item.notes || 'Shared detailed product catalogue and warranty details',
            timestamp: item.timestamp,
            dateKey: item.dateKey,
          });
        }
      }

      if (item.isMeeting || item.type === 'MEETING') {
        const meetKey = `MEETING_${item.id || leadId}_${item.timestamp || minuteStr}`;
        if (!seenActKeys.has(meetKey)) {
          seenActKeys.add(meetKey);
          activitiesList.push({
            id: `${item.id}_meet`,
            leadId: String(leadId),
            leadName,
            leadPhone,
            leadCompany,
            leadStatus,
            category: 'MEETING',
            title: 'Client Meeting / Discussion',
            notes: item.notes || 'Scheduled in-person / virtual discussion with client',
            timestamp: item.timestamp,
            dateKey: item.dateKey,
          });
        }
      }
    });

    // Add user Quotes to activitiesList
    userQuotes.forEach((q: any) => {
      const qDate = toDateKey(q.savedAt || q.createdAt);
      const l = leads.find((lead: any) => String(lead.id) === String(q.leadId || q.buyerId)) || {};
      const leadName = q.buyerName || q.clientName || l.name || 'Rahul Kapoor';
      const leadPhone = q.buyerPhone || q.phone || l.phone || '+91 98000 10008';
      const leadCompany = q.buyerCompany || q.company || l.company || 'Kapoor Electronics';
      const leadStatus = l.status?.name || l.status || 'Proposal Sent';
      const leadId = q.leadId || q.buyerId || l.id || '1';

      activitiesList.push({
        id: String(q.id || `quote_${Math.random()}`),
        leadId: String(leadId),
        leadName,
        leadPhone,
        leadCompany,
        leadStatus,
        category: 'QUOTE',
        title: `Quotation #${q.quoteNumber || q.quoteNo || 'QT-2026-0042'}`,
        quoteNo: q.quoteNumber || q.quoteNo || 'QT-2026-0042',
        quoteAmount: Number(q.totalAmount || 0),
        quoteStatus: q.status || 'SENT',
        notes: q.notes || `Issued quotation for ${q.itemsSummary || 'product supply and implementation'}`,
        timestamp: q.savedAt || q.createdAt || new Date().toISOString(),
        dateKey: qDate,
      });
    });

    // Completion Percentages
    const callsCompletionPct = dailyCallsTarget > 0 ? Math.min(200, Math.round((dateCallsTotal / dailyCallsTarget) * 100)) : 100;
    const whatsappCompletionPct = dailyWhatsappTarget > 0 ? Math.min(200, Math.round((dateWhatsappTotal / dailyWhatsappTarget) * 100)) : 100;
    const revenueCompletionPct = monthlyRevenueTarget > 0 ? Math.min(200, Math.round((monthlyRevenueWon / monthlyRevenueTarget) * 100)) : 0;
    const meetingsCompletionPct = monthlyMeetingsTarget > 0 ? Math.min(200, Math.round((monthlyMeetingsCount / monthlyMeetingsTarget) * 100)) : 100;

    // Overall Score based on active configured targets
    let totalScoreWeight = 1;
    let scoreSum = callsCompletionPct;
    if (dailyWhatsappTarget > 0) {
      scoreSum += whatsappCompletionPct;
      totalScoreWeight += 1;
    }
    if (monthlyRevenueTarget > 0) {
      scoreSum += revenueCompletionPct;
      totalScoreWeight += 1;
    }
    if (monthlyMeetingsTarget > 0) {
      scoreSum += meetingsCompletionPct;
      totalScoreWeight += 1;
    }

    const overallScore = Math.round(scoreSum / totalScoreWeight);

    return {
      userId: uId,
      userName: uName,
      userEmail: uEmail,
      userRole: uRole,
      initials: getInitials(uName),
      avatarColor: getAvatarColor(uId + uName),
      teamLeaderId: tlId,
      teamLeaderName: tlName,

      dailyCallsTarget,
      dailyWhatsappTarget,
      monthlyRevenueTarget,
      monthlyMeetingsTarget,

      dateCallsTotal,
      dateNewCalls,
      dateFollowupCalls,
      dateWhatsappTotal,
      dateMeetingsCount,
      dateProductsShared,
      dateQuotesCount,
      dateQuotesAmount,
      dateLeadsReceived,

      monthlyCallsTotal,
      monthlyNewCalls,
      monthlyFollowupCalls,
      monthlyWhatsappTotal,
      monthlyMeetingsCount,
      monthlyProductsShared,
      monthlyQuotesCount,
      monthlyQuotesAmount,
      monthlyLeadsReceived,
      monthlyDealsWon,
      monthlyRevenueWon,

      pipelineValue,
      pipelineDealsCount,

      callsCompletionPct,
      whatsappCompletionPct,
      revenueCompletionPct,
      meetingsCompletionPct,
      overallScore,
      activitiesList,
    };
  });

  // Calculate Team Rollup
  const allTeamActivities = records.flatMap(r => r.activitiesList || []);
  const teamRollup: PerformanceRecord = {
    userId: 'team_all',
    userName: 'Sales Squad Rollup',
    userEmail: 'sales.squad@das.com',
    userRole: 'TEAM_LEADER',
    initials: 'SQ',
    avatarColor: '#6366f1',

    dailyCallsTarget: records.reduce((s, r) => s + r.dailyCallsTarget, 0),
    dailyWhatsappTarget: records.reduce((s, r) => s + r.dailyWhatsappTarget, 0),
    monthlyRevenueTarget: records.reduce((s, r) => s + r.monthlyRevenueTarget, 0),
    monthlyMeetingsTarget: records.reduce((s, r) => s + r.monthlyMeetingsTarget, 0),

    dateCallsTotal: records.reduce((s, r) => s + r.dateCallsTotal, 0),
    dateNewCalls: records.reduce((s, r) => s + r.dateNewCalls, 0),
    dateFollowupCalls: records.reduce((s, r) => s + r.dateFollowupCalls, 0),
    dateWhatsappTotal: records.reduce((s, r) => s + r.dateWhatsappTotal, 0),
    dateMeetingsCount: records.reduce((s, r) => s + r.dateMeetingsCount, 0),
    dateProductsShared: records.reduce((s, r) => s + r.dateProductsShared, 0),
    dateQuotesCount: records.reduce((s, r) => s + r.dateQuotesCount, 0),
    dateQuotesAmount: records.reduce((s, r) => s + r.dateQuotesAmount, 0),
    dateLeadsReceived: records.reduce((s, r) => s + r.dateLeadsReceived, 0),

    monthlyCallsTotal: records.reduce((s, r) => s + r.monthlyCallsTotal, 0),
    monthlyNewCalls: records.reduce((s, r) => s + r.monthlyNewCalls, 0),
    monthlyFollowupCalls: records.reduce((s, r) => s + r.monthlyFollowupCalls, 0),
    monthlyWhatsappTotal: records.reduce((s, r) => s + r.monthlyWhatsappTotal, 0),
    monthlyMeetingsCount: records.reduce((s, r) => s + r.monthlyMeetingsCount, 0),
    monthlyProductsShared: records.reduce((s, r) => s + r.monthlyProductsShared, 0),
    monthlyQuotesCount: records.reduce((s, r) => s + r.monthlyQuotesCount, 0),
    monthlyQuotesAmount: records.reduce((s, r) => s + r.monthlyQuotesAmount, 0),
    monthlyLeadsReceived: records.reduce((s, r) => s + r.monthlyLeadsReceived, 0),
    monthlyDealsWon: records.reduce((s, r) => s + r.monthlyDealsWon, 0),
    monthlyRevenueWon: records.reduce((s, r) => s + r.monthlyRevenueWon, 0),

    pipelineValue: records.reduce((s, r) => s + r.pipelineValue, 0),
    pipelineDealsCount: records.reduce((s, r) => s + r.pipelineDealsCount, 0),

    callsCompletionPct: 0,
    whatsappCompletionPct: 0,
    revenueCompletionPct: 0,
    meetingsCompletionPct: 0,
    overallScore: 0,
    activitiesList: allTeamActivities,
  };

  teamRollup.callsCompletionPct = teamRollup.dailyCallsTarget > 0 ? Math.min(200, Math.round((teamRollup.dateCallsTotal / teamRollup.dailyCallsTarget) * 100)) : 100;
  teamRollup.whatsappCompletionPct = teamRollup.dailyWhatsappTarget > 0 ? Math.min(200, Math.round((teamRollup.dateWhatsappTotal / teamRollup.dailyWhatsappTarget) * 100)) : 100;
  teamRollup.revenueCompletionPct = teamRollup.monthlyRevenueTarget > 0 ? Math.min(200, Math.round((teamRollup.monthlyRevenueWon / teamRollup.monthlyRevenueTarget) * 100)) : 0;
  teamRollup.meetingsCompletionPct = teamRollup.monthlyMeetingsTarget > 0 ? Math.min(200, Math.round((teamRollup.monthlyMeetingsCount / teamRollup.monthlyMeetingsTarget) * 100)) : 100;

  teamRollup.overallScore = Math.round((teamRollup.callsCompletionPct + (teamRollup.dailyWhatsappTarget > 0 ? teamRollup.whatsappCompletionPct : teamRollup.callsCompletionPct) + teamRollup.revenueCompletionPct) / 3);

  return {
    records,
    teamRollup,
    globalSettings,
  };
}

/**
 * Generates day-by-day performance indicators for the calendar heatmap using real activity logs
 */
export function generateMonthlyHeatmap({
  records,
  selectedMonth, // "YYYY-MM"
  globalSettings,
}: {
  records: PerformanceRecord[];
  selectedMonth: string;
  globalSettings: GlobalGoalSettings;
}): DayPerformanceHeatmap[] {
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || (new Date().getMonth() + 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  const days: DayPerformanceHeatmap[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayPadded = String(day).padStart(2, '0');
    const dateStr = `${selectedMonth}-${dayPadded}`;

    let callsCount = 0;
    let whatsappCount = 0;
    let meetingsCount = 0;
    let quotesCount = 0;
    let quotesAmount = 0;
    let leadsCount = 0;
    let productsCount = 0;

    records.forEach(r => {
      (r.activitiesList || []).forEach(act => {
        if (act.dateKey === dateStr) {
          if (act.category === 'CALL') {
            callsCount++;
          } else if (act.category === 'WHATSAPP') {
            whatsappCount++;
          } else if (act.category === 'PRODUCT') {
            productsCount += (act.productCount || 1);
          } else if (act.category === 'QUOTE') {
            quotesCount++;
            quotesAmount += (act.quoteAmount || 0);
          } else if (act.category === 'MEETING') {
            meetingsCount++;
          }
        }
      });
    });

    const dailyCallTarget = records.reduce((s, r) => s + r.dailyCallsTarget, 0);
    const score = dailyCallTarget > 0 ? Math.min(100, Math.round((callsCount / dailyCallTarget) * 100)) : (callsCount > 0 ? 100 : 0);

    days.push({
      dateStr,
      dayNumber: day,
      callsCount,
      whatsappCount,
      meetingsCount,
      quotesCount,
      quotesAmount,
      leadsCount,
      productsCount,
      targetMet: score >= 80,
      completionScore: score,
    });
  }

  return days;
}
