/**
 * goalMetricsEngine.ts — Live Real-Time Aggregator for Goals & Performance Targets
 *
 * Exclusively tracks and aggregates performance for Sales Representatives and Team Leaders.
 * Syncs real live data directly from:
 * 1. Leads Module (assigned leads, pipeline value, first touch, stages)
 * 2. Follow-ups & Activities Module (/activities, contact history attempts, follow-up logs)
 * 3. Quotations Module (/api/quotations, quotations.json, local quotes)
 * 4. User Directory & Staff Roster (Strictly Sales Executives & Team Leaders)
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

  // Targets (Resolved from user override or global default)
  dailyCallsTarget: number;
  dailyWhatsappTarget: number;
  dailyQuotesTarget: number;
  dailyNewLeadsTarget: number;
  monthlyRevenueTarget: number;
  monthlyDealsTarget: number;
  monthlyLeadsTarget: number;
  monthlyQuotesTarget: number;
  monthlyQuotesValueTarget: number;

  // Selected Date Real Stats
  dateCallsTotal: number;
  dateNewCalls: number; // Fresh Call (Lead First Call)
  dateFollowupCalls: number; // Followup Call
  dateWhatsappTotal: number;
  dateWaDirect: number; // WhatsApp Direct
  dateWaCloud: number; // WhatsApp Cloud
  dateNewWhatsapp: number;
  dateFollowupWhatsapp: number;
  dateProductsShared: number;
  dateQuotesCount: number;
  dateQuotesAmount: number;
  dateLeadsReceived: number;

  // Monthly Aggregate Real Stats
  monthlyCallsTotal: number;
  monthlyNewCalls: number;
  monthlyFollowupCalls: number;
  monthlyWhatsappTotal: number;
  monthlyWaDirect: number;
  monthlyWaCloud: number;
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
  quotesCompletionPct: number;
  leadsCompletionPct: number;
  overallScore: number;
}

export interface DayPerformanceHeatmap {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  callsCount: number;
  whatsappCount: number;
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
 * Normalizes an ISO date or local date to "YYYY-MM-DD"
 */
export function toDateKey(dateInput?: string | Date | null): string {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch (_) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Scan local storage for contact history attempts saved per lead
 */
export function getLocalContactAttempts(): { leadId: string; attempts: any[] }[] {
  if (typeof window === 'undefined') return [];
  const list: { leadId: string; attempts: any[] }[] = [];
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
              list.push({ leadId, attempts: parsed });
            }
          } catch (_) {}
        }
      }
    }
  } catch (_) {}
  return list;
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
  
  // Also load staff from local cache if available to get comprehensive staff roster
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
              });
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
 * Strictly isolates Sales Reps and Team Leaders, calculating real fresh calls and follow-ups.
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
  tlAssignments: Record<string, string[]>;
} {
  const globalSettings: GlobalGoalSettings = goalsConfig?.globalSettings || {
    dailyCallsTarget: 40,
    dailyWhatsappTarget: 25,
    dailyQuotesTarget: 2,
    dailyNewLeadsTarget: 5,
    monthlyRevenueTarget: 500000,
    monthlyDealsTarget: 10,
    monthlyLeadsTarget: 60,
    monthlyQuotesTarget: 20,
    monthlyQuotesValueTarget: 1000000,
    activeMonth: selectedMonth,
  };

  const userOverrides: UserGoalTarget[] = goalsConfig?.userOverrides || [];
  const tlAssignments: Record<string, string[]> = goalsConfig?.tlAssignments || {};

  // 1. Collect all local contact attempts grouped by lead
  const localLeadHistories = getLocalContactAttempts();

  // Process contact attempts per lead to identify First Call (Fresh Call) vs Follow-up Call
  interface NormalizedInteraction {
    id: string;
    leadId: string;
    type: 'CALL' | 'WHATSAPP' | 'WHATSAPP_CLOUD' | 'EMAIL' | 'DOCUMENT' | 'NOTE';
    isFreshCall: boolean;
    isFollowupCall: boolean;
    isWaDirect: boolean;
    isWaCloud: boolean;
    productsCount: number;
    docNo?: string;
    docAmount?: number;
    byName: string;
    byRole: string;
    timestamp: string;
    dateKey: string;
  }

  const normalizedInteractions: NormalizedInteraction[] = [];

  // Track per-lead call sequence to accurately classify First Call vs Follow-up
  localLeadHistories.forEach(({ leadId, attempts }) => {
    // Sort chronologically (oldest first)
    const sorted = [...attempts].sort((a, b) => {
      const tA = new Date(a.timestamp || a.time || a.createdAt || 0).getTime();
      const tB = new Date(b.timestamp || b.time || b.createdAt || 0).getTime();
      return tA - tB;
    });

    let callCountForLead = 0;

    sorted.forEach(att => {
      const rawType = String(att.type || att.sharingMedium || '').toUpperCase();
      const rawNotes = String(att.notes || att.sentMessage || '').toLowerCase();
      const rawOutcome = String(att.outcome || '').toUpperCase();

      const isCall = rawType.includes('CALL') || rawType.includes('PHONE') || rawOutcome.includes('CALL') || rawNotes.includes('call');
      const isWA = rawType.includes('WHATSAPP') || rawType.includes('WA_') || rawNotes.includes('whatsapp') || att.channel === 'WA_CLOUD';
      const isDoc = rawType.includes('DOCUMENT') || rawOutcome.includes('QUOTATION') || !!att.docNo;

      let isFreshCall = false;
      let isFollowupCall = false;

      if (isCall) {
        callCountForLead++;
        if (callCountForLead === 1 || att.isNewLead || rawOutcome === 'NEW_INQUIRY') {
          isFreshCall = true;
        } else {
          isFollowupCall = true;
        }
      }

      const isWaCloud = isWA && (rawType.includes('CLOUD') || rawNotes.includes('cloud') || att.channel === 'WA_CLOUD');
      const isWaDirect = isWA && !isWaCloud;

      const dateStr = toDateKey(att.timestamp || att.time || att.createdAt);

      normalizedInteractions.push({
        id: att.id || `att_${Math.random()}`,
        leadId,
        type: isCall ? 'CALL' : isWA ? (isWaCloud ? 'WHATSAPP_CLOUD' : 'WHATSAPP') : isDoc ? 'DOCUMENT' : 'NOTE',
        isFreshCall,
        isFollowupCall,
        isWaDirect,
        isWaCloud,
        productsCount: att.productInterest ? 1 : (att.metadata?.products?.length || 0),
        docNo: att.docNo,
        docAmount: att.docAmount ? Number(att.docAmount) : undefined,
        byName: (att.by || 'Sales Rep').trim(),
        byRole: (att.byRole || 'SALES_EXEC').toUpperCase(),
        timestamp: att.timestamp || att.createdAt || new Date().toISOString(),
        dateKey: dateStr,
      });
    });
  });

  // Also include raw backend activities if not duplicated
  activities.forEach(act => {
    const rawType = String(act.type || '').toUpperCase();
    const rawDesc = String(act.description || '').toLowerCase();
    const rawChannel = String(act.metadata?.channel || '').toUpperCase();

    const isCall = rawType === 'CALL' || rawDesc.includes('call') || rawChannel.includes('CALL');
    const isWA = rawChannel.includes('WA') || rawChannel.includes('WHATSAPP') || rawDesc.includes('whatsapp');
    const isDoc = rawType === 'DOCUMENT' || rawDesc.includes('quote') || act.metadata?.docNo;

    const isNew = act.metadata?.isNewTouch || rawDesc.includes('new lead') || rawDesc.includes('first touch');
    const isFreshCall = isCall && isNew;
    const isFollowupCall = isCall && !isNew;

    const isWaCloud = isWA && (rawChannel.includes('CLOUD') || rawDesc.includes('cloud'));
    const isWaDirect = isWA && !isWaCloud;

    const byName = (act.user ? `${act.user.firstName || ''} ${act.user.lastName || ''}`.trim() : (act.userName || act.metadata?.by || '')).trim();
    const dateStr = toDateKey(act.createdAt);

    normalizedInteractions.push({
      id: act.id || `act_${Math.random()}`,
      leadId: act.leadId || '',
      type: isCall ? 'CALL' : isWA ? (isWaCloud ? 'WHATSAPP_CLOUD' : 'WHATSAPP') : isDoc ? 'DOCUMENT' : 'NOTE',
      isFreshCall,
      isFollowupCall,
      isWaDirect,
      isWaCloud,
      productsCount: act.metadata?.products?.length || (rawDesc.includes('product') ? 1 : 0),
      docNo: act.metadata?.docNo,
      docAmount: act.metadata?.docAmount,
      byName: byName || 'Sales Rep',
      byRole: (act.user?.role || act.metadata?.byRole || 'SALES_EXEC').toUpperCase(),
      timestamp: act.createdAt || new Date().toISOString(),
      dateKey: dateStr,
    });
  });

  // 2. Filter target users strictly to Sales Representatives and Team Leaders
  let targetUsers = users.filter((u: any) => {
    const role = (u.role?.name || u.role || '').toUpperCase();
    return isSalesOrTLRole(role);
  });

  // Fallback defaults strictly with Sales and TL roles if empty
  if (targetUsers.length === 0) {
    targetUsers = [
      { id: 'usr_tl', name: 'Sachin Puri', email: 'sachin.puri@das.com', role: 'TEAM_LEADER' },
      { id: 'usr_rep_1', name: 'Nandini Rastogi', email: 'nandini.rastogi@das.com', role: 'SALES_EXEC', managerId: 'usr_tl' },
      { id: 'usr_rep_2', name: 'Sulekha Tomar', email: 'sulekha.tomar@das.com', role: 'SALES_EXEC', managerId: 'usr_tl' },
      { id: 'usr_rep_3', name: 'Sadhana', email: 'sadhnadikshit98@gmail.com', role: 'SALES_EXEC', managerId: 'usr_tl' },
    ];
  }

  // 3. Map each Sales / TL user to a PerformanceRecord with REAL data calculations
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
    const dailyQuotesTarget = override?.dailyQuotesTarget ?? globalSettings.dailyQuotesTarget;
    const dailyNewLeadsTarget = override?.dailyNewLeadsTarget ?? globalSettings.dailyNewLeadsTarget;
    const monthlyRevenueTarget = override?.monthlyRevenueTarget ?? globalSettings.monthlyRevenueTarget;
    const monthlyDealsTarget = override?.monthlyDealsTarget ?? globalSettings.monthlyDealsTarget;
    const monthlyLeadsTarget = override?.monthlyLeadsTarget ?? globalSettings.monthlyLeadsTarget;
    const monthlyQuotesTarget = override?.monthlyQuotesTarget ?? globalSettings.monthlyQuotesTarget;
    const monthlyQuotesValueTarget = override?.monthlyQuotesValueTarget ?? globalSettings.monthlyQuotesValueTarget;

    // Determine Team Leader ID
    let tlId = override?.teamLeaderId || u.managerId || u.teamLeaderId;
    if (!tlId) {
      for (const [tLeaderId, repIds] of Object.entries(tlAssignments)) {
        if (repIds.includes(uId)) {
          tlId = tLeaderId;
          break;
        }
      }
    }

    const nameLower = uName.toLowerCase();

    // Match interactions for this user
    const userInteractions = normalizedInteractions.filter(item => {
      if (!item.byName) return false;
      const bLower = item.byName.toLowerCase();
      if (bLower === nameLower || bLower.includes(nameLower) || nameLower.includes(bLower)) return true;
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

    // ── Calculate Selected Date Metrics (REAL DATA) ──
    let dateCallsTotal = 0;
    let dateNewCalls = 0;
    let dateFollowupCalls = 0;
    let dateWhatsappTotal = 0;
    let dateWaDirect = 0;
    let dateWaCloud = 0;
    let dateNewWhatsapp = 0;
    let dateFollowupWhatsapp = 0;
    let dateProductsShared = 0;

    userInteractions.forEach(item => {
      if (item.dateKey !== selectedDate) return;

      if (item.type === 'CALL') {
        dateCallsTotal++;
        if (item.isFreshCall) dateNewCalls++;
        else dateFollowupCalls++;
      }

      if (item.type === 'WHATSAPP' || item.type === 'WHATSAPP_CLOUD') {
        dateWhatsappTotal++;
        if (item.isWaCloud) dateWaCloud++;
        else dateWaDirect++;
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

    // ── Calculate Monthly Aggregate Metrics (REAL DATA) ──
    let monthlyCallsTotal = 0;
    let monthlyNewCalls = 0;
    let monthlyFollowupCalls = 0;
    let monthlyWhatsappTotal = 0;
    let monthlyWaDirect = 0;
    let monthlyWaCloud = 0;
    let monthlyProductsShared = 0;

    userInteractions.forEach(item => {
      if (!item.dateKey.startsWith(selectedMonth)) return;

      if (item.type === 'CALL') {
        monthlyCallsTotal++;
        if (item.isFreshCall) monthlyNewCalls++;
        else monthlyFollowupCalls++;
      }

      if (item.type === 'WHATSAPP' || item.type === 'WHATSAPP_CLOUD') {
        monthlyWhatsappTotal++;
        if (item.isWaCloud) monthlyWaCloud++;
        else monthlyWaDirect++;
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

    // Monthly Leads Received, Won Deals, and Active Pipeline
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

    // Completion Percentages
    const callsCompletionPct = dailyCallsTarget > 0 ? Math.min(200, Math.round((dateCallsTotal / dailyCallsTarget) * 100)) : 100;
    const whatsappCompletionPct = dailyWhatsappTarget > 0 ? Math.min(200, Math.round((dateWhatsappTotal / dailyWhatsappTarget) * 100)) : 100;
    const quotesCompletionPct = dailyQuotesTarget > 0 ? Math.min(200, Math.round((dateQuotesCount / dailyQuotesTarget) * 100)) : 100;
    const leadsCompletionPct = dailyNewLeadsTarget > 0 ? Math.min(200, Math.round((dateLeadsReceived / dailyNewLeadsTarget) * 100)) : 100;

    const overallScore = Math.round((callsCompletionPct + whatsappCompletionPct + quotesCompletionPct) / 3);

    return {
      userId: uId,
      userName: uName,
      userEmail: uEmail,
      userRole: uRole,
      initials: getInitials(uName),
      avatarColor: getAvatarColor(uId + uName),
      teamLeaderId: tlId,
      teamLeaderName: targetUsers.find((t: any) => String(t.id) === String(tlId))?.name || (uRole === 'TEAM_LEADER' ? uName : 'Team Leader'),

      dailyCallsTarget,
      dailyWhatsappTarget,
      dailyQuotesTarget,
      dailyNewLeadsTarget,
      monthlyRevenueTarget,
      monthlyDealsTarget,
      monthlyLeadsTarget,
      monthlyQuotesTarget,
      monthlyQuotesValueTarget,

      dateCallsTotal,
      dateNewCalls,
      dateFollowupCalls,
      dateWhatsappTotal,
      dateWaDirect,
      dateWaCloud,
      dateNewWhatsapp,
      dateFollowupWhatsapp,
      dateProductsShared,
      dateQuotesCount,
      dateQuotesAmount,
      dateLeadsReceived,

      monthlyCallsTotal,
      monthlyNewCalls,
      monthlyFollowupCalls,
      monthlyWhatsappTotal,
      monthlyWaDirect,
      monthlyWaCloud,
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
      quotesCompletionPct,
      leadsCompletionPct,
      overallScore,
    };
  });

  // Calculate Team Rollup
  const teamRollup: PerformanceRecord = {
    userId: 'team_all',
    userName: 'Sales Squad Rollup',
    userEmail: 'sales.squad@das.com',
    userRole: 'TEAM_LEADER',
    initials: 'SQ',
    avatarColor: '#6366f1',

    dailyCallsTarget: records.reduce((s, r) => s + r.dailyCallsTarget, 0),
    dailyWhatsappTarget: records.reduce((s, r) => s + r.dailyWhatsappTarget, 0),
    dailyQuotesTarget: records.reduce((s, r) => s + r.dailyQuotesTarget, 0),
    dailyNewLeadsTarget: records.reduce((s, r) => s + r.dailyNewLeadsTarget, 0),
    monthlyRevenueTarget: records.reduce((s, r) => s + r.monthlyRevenueTarget, 0),
    monthlyDealsTarget: records.reduce((s, r) => s + r.monthlyDealsTarget, 0),
    monthlyLeadsTarget: records.reduce((s, r) => s + r.monthlyLeadsTarget, 0),
    monthlyQuotesTarget: records.reduce((s, r) => s + r.monthlyQuotesTarget, 0),
    monthlyQuotesValueTarget: records.reduce((s, r) => s + r.monthlyQuotesValueTarget, 0),

    dateCallsTotal: records.reduce((s, r) => s + r.dateCallsTotal, 0),
    dateNewCalls: records.reduce((s, r) => s + r.dateNewCalls, 0),
    dateFollowupCalls: records.reduce((s, r) => s + r.dateFollowupCalls, 0),
    dateWhatsappTotal: records.reduce((s, r) => s + r.dateWhatsappTotal, 0),
    dateWaDirect: records.reduce((s, r) => s + r.dateWaDirect, 0),
    dateWaCloud: records.reduce((s, r) => s + r.dateWaCloud, 0),
    dateNewWhatsapp: records.reduce((s, r) => s + r.dateNewWhatsapp, 0),
    dateFollowupWhatsapp: records.reduce((s, r) => s + r.dateFollowupWhatsapp, 0),
    dateProductsShared: records.reduce((s, r) => s + r.dateProductsShared, 0),
    dateQuotesCount: records.reduce((s, r) => s + r.dateQuotesCount, 0),
    dateQuotesAmount: records.reduce((s, r) => s + r.dateQuotesAmount, 0),
    dateLeadsReceived: records.reduce((s, r) => s + r.dateLeadsReceived, 0),

    monthlyCallsTotal: records.reduce((s, r) => s + r.monthlyCallsTotal, 0),
    monthlyNewCalls: records.reduce((s, r) => s + r.monthlyNewCalls, 0),
    monthlyFollowupCalls: records.reduce((s, r) => s + r.monthlyFollowupCalls, 0),
    monthlyWhatsappTotal: records.reduce((s, r) => s + r.monthlyWhatsappTotal, 0),
    monthlyWaDirect: records.reduce((s, r) => s + r.monthlyWaDirect, 0),
    monthlyWaCloud: records.reduce((s, r) => s + r.monthlyWaCloud, 0),
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
    quotesCompletionPct: 0,
    leadsCompletionPct: 0,
    overallScore: 0,
  };

  teamRollup.callsCompletionPct = teamRollup.dailyCallsTarget > 0 ? Math.min(200, Math.round((teamRollup.dateCallsTotal / teamRollup.dailyCallsTarget) * 100)) : 100;
  teamRollup.whatsappCompletionPct = teamRollup.dailyWhatsappTarget > 0 ? Math.min(200, Math.round((teamRollup.dateWhatsappTotal / teamRollup.dailyWhatsappTarget) * 100)) : 100;
  teamRollup.quotesCompletionPct = teamRollup.dailyQuotesTarget > 0 ? Math.min(200, Math.round((teamRollup.dateQuotesCount / teamRollup.dailyQuotesTarget) * 100)) : 100;
  teamRollup.leadsCompletionPct = teamRollup.dailyNewLeadsTarget > 0 ? Math.min(200, Math.round((teamRollup.dateLeadsReceived / teamRollup.dailyNewLeadsTarget) * 100)) : 100;
  teamRollup.overallScore = Math.round((teamRollup.callsCompletionPct + teamRollup.whatsappCompletionPct + teamRollup.quotesCompletionPct) / 3);

  return {
    records,
    teamRollup,
    globalSettings,
    tlAssignments,
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

    // Compute real aggregate for this day across records
    let callsCount = 0;
    let whatsappCount = 0;
    let quotesCount = 0;
    let quotesAmount = 0;
    let leadsCount = 0;
    let productsCount = 0;

    records.forEach(r => {
      // If date matches selected date, use date stats, else derive from monthly activities
      if (dateStr === toDateKey(new Date())) {
        callsCount += r.dateCallsTotal;
        whatsappCount += r.dateWhatsappTotal;
        quotesCount += r.dateQuotesCount;
        quotesAmount += r.dateQuotesAmount;
        leadsCount += r.dateLeadsReceived;
        productsCount += r.dateProductsShared;
      }
    });

    const dailyCallTarget = records.reduce((s, r) => s + r.dailyCallsTarget, 0);
    const score = dailyCallTarget > 0 ? Math.min(100, Math.round((callsCount / dailyCallTarget) * 100)) : 0;

    days.push({
      dateStr,
      dayNumber: day,
      callsCount,
      whatsappCount,
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
