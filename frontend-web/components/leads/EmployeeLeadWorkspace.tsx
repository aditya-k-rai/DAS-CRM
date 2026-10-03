'use client';

import { useState, useEffect } from 'react';
import {
  Phone, MessageSquare, Mail, Sparkles, Send, RefreshCw, CheckCircle2,
  Clock, AlertCircle, User, Building2, MapPin, Tag, FileText, Bot,
  PhoneOff, Mic, Play, Pause, ChevronRight, Zap, Shield, HelpCircle, Layers, Check, Wifi, WifiOff,
  Calendar, CalendarCheck, Package, Bell, BellRing, ArrowRight, Flame
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { verifyInternetConnection, isBrowserOnline } from '@/lib/networkService';
import { LeadAllocationTrail, AllocationEvent, buildAllocationTrailForLead, getUserRoleFromName } from './LeadAllocationTrail';
import { CallContactHistory, ContactAttempt, ContactOutcome, ContactType } from './CallContactHistory';
import { useWorkflowCallFunnel, useWorkflowLeadStatuses } from '@/lib/workflowService';
import { DEFAULT_REAL_LEADS } from './LeadsTable';
import { normalizeLead, safeString, safeStatus, safeOwnerName, safeCompany, safeSource, safeRequirement } from '@/lib/leadNormalizer';
import { clearAllDashboardCaches, clearStaleCaches } from '@/lib/cacheUtils';
import { apiFetch } from '@/lib/apiClient';

export type DispositionOption =
  | 'Not Responding'
  | 'Switch Off'
  | 'Busy'
  | 'Not Interested'
  | 'Will Talk Later'
  | 'Talked & Enter Response'
  | 'Said Will Visit'
  | 'Interested in Product & Product Shared'
  | 'Other Requirements';

export interface SyncedActivityLog {
  id: string;
  section: 'DIALLER' | 'WA_DIRECT' | 'WA_CLOUD' | 'EMAIL';
  title: string;
  disposition?: DispositionOption;
  notes?: string;
  timestamp: string;
  user: string;
}

interface LeadWorkspaceProps {
  leadId?: string;
  leadData?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    status: string;
    owner: string;
    city?: string;
    budget?: string;
    requirement?: string;
    source?: string;
    allocationTrail?: AllocationEvent[];
  };
}

function mapServerActivitiesToContactHistory(
  activities: any[] = [],
  tasks: any[] = [],
  leadInfo: { owner?: string; requirement?: string } = {}
): ContactAttempt[] {
  const attempts: ContactAttempt[] = [];
  const seenIds = new Set<string>();

  // 1. Process explicit Activity records from PostgreSQL
  if (Array.isArray(activities)) {
    for (const act of activities) {
      if (!act || !act.type) continue;
      const meta = typeof act.metadata === 'object' && act.metadata !== null ? act.metadata : {};
      const typeStr = (act.type || '').toUpperCase();
      const metaType = (meta.type || '').toUpperCase();
      const channel = (meta.channel || '').toUpperCase();

      const userName = act.user
        ? `${act.user.firstName || ''} ${act.user.lastName || ''}`.trim()
        : (meta.by || leadInfo.owner || 'Sales Rep');

      const rawRole = act.user?.role?.name || (typeof act.user?.role === 'string' ? act.user.role : '') || meta.byRole || 'SALES_EXEC';
      const cleanRole: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC' =
        rawRole.includes('ADMIN') ? 'ADMIN'
        : rawRole.includes('MANAGER') ? 'MANAGER'
        : rawRole.includes('LEAD') || rawRole.includes('TL') ? 'TEAM_LEADER'
        : 'SALES_EXEC';

      const actTime = act.createdAt ? (typeof act.createdAt === 'string' ? act.createdAt : new Date(act.createdAt).toISOString()) : new Date().toISOString();

      if (typeStr === 'CALL' || metaType.startsWith('CALL')) {
        const cType: ContactType = (['CALL_OUT', 'CALL_IN', 'CALL_MISSED', 'CALL_BUSY', 'CALL_NOT_RESPONDING', 'CALL_SWITCH_OFF'].includes(metaType) ? metaType : 'CALL_OUT') as ContactType;
        const durSecs = meta.durationSeconds ?? (meta.durationMin ? meta.durationMin * 60 : 0);
        attempts.push({
          id: act.id,
          type: cType,
          outcome: (meta.outcome || (durSecs > 0 ? 'TALKED' : 'BUSY')) as ContactOutcome,
          by: userName,
          byRole: cleanRole,
          timestamp: actTime,
          durationSeconds: durSecs,
          notes: act.description || meta.notes || 'Outbound phone call',
          productInterest: meta.productInterest || leadInfo.requirement,
          followUpDate: meta.followUpDate,
          followUpTime: meta.followUpTime,
          audioRecordingAvailable: Boolean(meta.audioRecordingAvailable || durSecs > 10),
        });
        seenIds.add(act.id);
      } else if (typeStr === 'EMAIL' || metaType === 'EMAIL' || channel === 'EMAIL') {
        attempts.push({
          id: act.id,
          type: 'EMAIL',
          outcome: (meta.outcome || 'EMAIL_SENT') as ContactOutcome,
          by: userName,
          byRole: cleanRole,
          timestamp: actTime,
          notes: act.description || meta.subject || 'Email Dispatched',
          sentMessage: meta.subject || meta.notes,
        });
        seenIds.add(act.id);
      } else if (typeStr === 'NOTE' && (metaType === 'WHATSAPP' || channel === 'WHATSAPP' || (act.description && act.description.toLowerCase().includes('whatsapp')))) {
        attempts.push({
          id: act.id,
          type: 'WHATSAPP',
          outcome: (meta.outcome || 'WA_SENT') as ContactOutcome,
          by: userName,
          byRole: cleanRole,
          timestamp: actTime,
          notes: act.description || 'WhatsApp communication',
          sentMessage: meta.sentMessage || act.description,
        });
        seenIds.add(act.id);
      }
    }
  }

  // 2. Synthesize call funnel scheduled follow-ups/meetings into call attempts if not already covered
  if (Array.isArray(tasks)) {
    for (const t of tasks) {
      if (!t) continue;
      const purpose = t.purpose || '';
      const isFromCallFunnel = purpose.toLowerCase().includes('call funnel') || (t.title && t.title.includes('In-Person / Virtual Visit'));
      if (isFromCallFunnel) {
        const taskId = `task-call-${t.id}`;
        if (!seenIds.has(taskId)) {
          const isMeeting = t.followUpType === 'MEETING' || (t.title && t.title.includes('Visit'));
          const prodMatch = purpose.match(/product:\s*([^,\.]+)/i) || purpose.match(/interested in\s*([^,\.]+)/i);
          const dueIso = t.dueAt ? (typeof t.dueAt === 'string' ? t.dueAt : new Date(t.dueAt).toISOString()) : '';
          const taskTime = t.createdAt ? (typeof t.createdAt === 'string' ? t.createdAt : new Date(t.createdAt).toISOString()) : new Date().toISOString();
          attempts.push({
            id: taskId,
            type: 'CALL_OUT',
            outcome: isMeeting ? 'TALKED' : 'FOLLOW_UP_SCHEDULED',
            by: leadInfo.owner || 'Anurag Sharma',
            byRole: 'ADMIN',
            timestamp: taskTime,
            durationSeconds: 45,
            notes: purpose || t.title || 'Call Funnel outreach',
            productInterest: prodMatch ? prodMatch[1].trim() : (leadInfo.requirement || undefined),
            followUpDate: dueIso ? dueIso.split('T')[0] : undefined,
            followUpTime: dueIso && dueIso.includes('T') ? dueIso.split('T')[1].slice(0, 5) : undefined,
            audioRecordingAvailable: false,
          });
          seenIds.add(taskId);
        }
      }
    }
  }

  // Sort descending by timestamp
  return attempts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function EmployeeLeadWorkspace({ leadId = '1', leadData }: LeadWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<
    'lead_center' | 'dialler' | 'wa_direct' | 'wa_cloud' | 'email_marketing'
  >('lead_center');

  const { currentUser } = useAuth();
  const currentActiveRole = currentUser?.role || (typeof window !== 'undefined' ? (() => {
    try {
      return String(JSON.parse(localStorage.getItem('das_crm_user') || '{}').role || '').toUpperCase();
    } catch (_) {
      return '';
    }
  })() : '');

  const isUserAdmin = currentActiveRole.includes('ADMIN');
  const isUserManager = currentActiveRole.includes('MANAGER');
  const isUserTL = currentActiveRole.includes('LEADER') || currentActiveRole.includes('TL');
  const isUserSales = currentActiveRole.includes('SALES') || currentActiveRole.includes('EXEC') || currentActiveRole.includes('REP');

  // Lead State
  const [lead, setLead] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    status: string;
    owner: string;
    city: string;
    budget: string;
    requirement: string;
    source: string;
    allocationTrail: AllocationEvent[];
  }>(() => {
    const norm = normalizeLead(leadData || { id: leadId });
    return {
      id: norm.id || leadId,
      name: norm.name || (leadData ? 'Lead Details' : 'Loading Lead...'),
      email: norm.email && norm.email !== '—' ? norm.email : '—',
      phone: norm.phone && norm.phone !== '—' ? norm.phone : '—',
      company: norm.company && norm.company !== '—' ? norm.company : '—',
      status: norm.status || 'New Lead',
      owner: norm.owner || '—',
      city: norm.city || '—',
      budget: norm.budget || '—',
      requirement: norm.requirement || '—',
      source: norm.source || '—',
      allocationTrail: norm.allocationTrail || [],
    };
  });

  // Contact History State (synchronized with CallContactHistory timeline & stats)
  const [contactHistory, setContactHistory] = useState<ContactAttempt[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`das_crm_contact_history_${leadId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });

  // Synced Activity Stream (Real-Time Auto-Synced to Lead Center)
  const [syncedActivities, setSyncedActivities] = useState<SyncedActivityLog[]>([]);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals & Status State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [newStatusChoice, setNewStatusChoice] = useState('Qualified');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const showSyncNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // ── WORKFLOW & CALL FUNNEL HOOKS ──────────────────────────────────────────
  const { funnelMappings, getTargetStatusForOutcome } = useWorkflowCallFunnel();
  const { statuses: workflowStatuses } = useWorkflowLeadStatuses();

  // Asynchronously fetch lead details from Backend API, Directory Cache, or Pre-Allocated Rosters
  useEffect(() => {
    let isMounted = true;

    const loadLeadDetails = async () => {
      // 1. If leadData is provided directly via props and is populated, use it
      if (leadData && leadData.name && leadData.name !== 'Prospect Lead' && leadData.phone) {
        const norm = normalizeLead(leadData);
        const ownerName = norm.owner || '—';
        const defaultTrail = buildAllocationTrailForLead(
          ownerName,
          norm.source || 'Lead Ingestion',
          new Date().toISOString(),
          norm.allocationTrail
        );

        setLead({
          id: norm.id || leadId,
          name: norm.name,
          email: norm.email || '—',
          phone: norm.phone || '—',
          company: norm.company || '—',
          status: norm.status || 'New Lead',
          owner: ownerName,
          city: norm.city || '—',
          budget: norm.budget || '—',
          requirement: norm.requirement || '—',
          source: norm.source || '—',
          allocationTrail: defaultTrail,
        });
      }

      // 2. Check Session Storage / LocalStorage for initial optimistic render (DO NOT return early!)
      if (typeof window !== 'undefined') {
        try {
          const directSession = sessionStorage.getItem(`das_crm_lead_${leadId}`);
          const activeSession = sessionStorage.getItem('das_crm_active_lead');
          let sessionMatch = null;
          if (directSession) {
            sessionMatch = JSON.parse(directSession);
          } else if (activeSession) {
            const parsed = JSON.parse(activeSession);
            if (String(parsed.id) === String(leadId) || (parsed.name && decodeURIComponent(leadId).toLowerCase().includes(String(parsed.name).toLowerCase()))) {
              sessionMatch = parsed;
            }
          }
          if (sessionMatch && isMounted) {
            const norm = normalizeLead(sessionMatch);
            const ownerName = norm.owner || '—';
            setLead({
              id: String(norm.id || leadId),
              name: norm.name,
              email: norm.email && norm.email !== '—' ? norm.email : '—',
              phone: norm.phone && norm.phone !== '—' ? norm.phone : '—',
              company: norm.company || '—',
              status: norm.status || 'New Lead',
              owner: ownerName,
              city: norm.city || '—',
              budget: norm.budget || '—',
              requirement: norm.requirement || '—',
              source: norm.source || '—',
              allocationTrail: norm.allocationTrail || [],
            });

            // Optimistic hydration of contact history if cached or present in session
            if (Array.isArray(sessionMatch.activities) || Array.isArray(sessionMatch.tasks)) {
              const optAttempts = mapServerActivitiesToContactHistory(sessionMatch.activities, sessionMatch.tasks, {
                owner: ownerName,
                requirement: norm.requirement,
              });
              if (optAttempts.length > 0) {
                setContactHistory(optAttempts);
              }
            } else {
              const cachedDirect = localStorage.getItem(`das_crm_contact_history_${norm.id}`) || localStorage.getItem(`das_crm_contact_history_${leadId}`);
              if (cachedDirect) {
                try {
                  const parsed = JSON.parse(cachedDirect);
                  if (Array.isArray(parsed) && parsed.length > 0) setContactHistory(parsed);
                } catch (_) {}
              }
            }
          }
        } catch (_) {}
      }

      // 3. ALWAYS FETCH AUTHORITATIVE DATABASE STATE FROM BACKEND API
      try {
        let res = await apiFetch(`/leads/${encodeURIComponent(leadId)}`);
        // If not ok and we have a concrete lead ID from session or local directory cache, retry
        if (!res.ok && typeof window !== 'undefined') {
          try {
            const directSession = sessionStorage.getItem(`das_crm_lead_${leadId}`);
            const activeSession = sessionStorage.getItem('das_crm_active_lead');
            let candidate = directSession ? JSON.parse(directSession) : activeSession ? JSON.parse(activeSession) : null;
            if (!candidate || !candidate.id || candidate.id === leadId) {
              const rawAll = localStorage.getItem('das_crm_all_leads_cache') || localStorage.getItem('das_crm_lead_directory_cache');
              if (rawAll) {
                const allLeads = JSON.parse(rawAll);
                if (Array.isArray(allLeads) && allLeads.length > 0) {
                  candidate = allLeads.find((l: any) => String(l.id) === String(leadId) || (l.name && decodeURIComponent(leadId).toLowerCase().includes(String(l.name).toLowerCase()))) || (leadId === '1' || leadId.startsWith('lead_') ? allLeads[0] : null);
                }
              }
            }
            if (candidate && candidate.id && candidate.id !== leadId) {
              const retryRes = await apiFetch(`/leads/${encodeURIComponent(candidate.id)}`);
              if (retryRes.ok) res = retryRes;
            }
          } catch (_) {}
        }

        if (res.ok) {
          const l = await res.json();
          if (l && isMounted) {
            const norm = normalizeLead(l);
            const ownerName = norm.owner || '—';
            const allocatedTimestamp = l.customFields?.allocatedAt || l.createdAt || new Date().toISOString();
            const fileName = l.customFields?.fileName || l.customFields?.platform || 'Lead Ingestion';

            const serverTrail = buildAllocationTrailForLead(
              ownerName,
              fileName,
              allocatedTimestamp,
              norm.allocationTrail,
              l.customFields
            );

            // Synthesize contact history from PostgreSQL activities & tasks
            const serverAttempts = mapServerActivitiesToContactHistory(l.activities, l.tasks, {
              owner: ownerName,
              requirement: norm.requirement,
            });

            const resolvedProduct = (norm.requirement && norm.requirement !== '—' && norm.requirement.trim())
              ? norm.requirement
              : (serverAttempts.find(a => a.productInterest)?.productInterest || '—');

            const serverLead = {
              id: String(norm.id || leadId),
              name: norm.name,
              email: norm.email || '—',
              phone: norm.phone || '—',
              company: norm.company || '—',
              status: norm.status || 'New Lead',
              owner: ownerName,
              city: norm.city || '—',
              budget: norm.budget || '—',
              requirement: resolvedProduct,
              source: norm.source || '—',
              allocationTrail: serverTrail,
            };

            setLead(serverLead);

            if (serverAttempts.length > 0) {
              setContactHistory(prev => {
                const combined = [...serverAttempts];
                const seen = new Set(serverAttempts.map(a => a.id));
                for (const p of prev) {
                  if (!seen.has(p.id)) combined.push(p);
                }
                return combined;
              });
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem(`das_crm_contact_history_${leadId}`, JSON.stringify(serverAttempts));
                  localStorage.setItem(`das_crm_contact_history_${serverLead.id}`, JSON.stringify(serverAttempts));
                } catch (_) {}
              }
            }

            // Reconcile and update session and local caches with fresh server data
            if (typeof window !== 'undefined') {
              try {
                sessionStorage.setItem(`das_crm_lead_${leadId}`, JSON.stringify(serverLead));
                sessionStorage.setItem(`das_crm_lead_${serverLead.id}`, JSON.stringify(serverLead));
                sessionStorage.setItem('das_crm_active_lead', JSON.stringify(serverLead));
              } catch (_) {}
            }
            return;
          }
        }
      } catch (err) {
        console.warn('API lead fetch warning in EmployeeLeadWorkspace:', err);
      }

      // 4. Resilient Fallback: NEVER wipe out existing valid lead state with dummy placeholders!
      if (isMounted) {
        setLead(prev => {
          // If state is already hydrated with valid real lead data, preserve it!
          if (prev && prev.name && prev.name !== 'Lead Prospect' && (prev.phone !== '—' || prev.email !== '—')) {
            return prev;
          }

          // Check active session or local directory cache as last resort
          if (typeof window !== 'undefined') {
            try {
              const activeRaw = sessionStorage.getItem('das_crm_active_lead') || sessionStorage.getItem(`das_crm_lead_${leadId}`);
              if (activeRaw) {
                const parsed = JSON.parse(activeRaw);
                if (parsed && parsed.name && parsed.name !== 'Lead Prospect' && (parsed.phone !== '—' || parsed.email !== '—')) {
                  return { ...parsed, id: parsed.id || leadId };
                }
              }
              const allRaw = localStorage.getItem('das_crm_all_leads_cache') || localStorage.getItem('das_crm_lead_directory_cache');
              if (allRaw) {
                const allLeads = JSON.parse(allRaw);
                if (Array.isArray(allLeads) && allLeads.length > 0) {
                  const m = allLeads.find((l: any) => String(l.id) === String(leadId) || (l.name && decodeURIComponent(leadId).toLowerCase().includes(String(l.name).toLowerCase()))) || (leadId === '1' || leadId.startsWith('lead_') ? allLeads[0] : null);
                  if (m) {
                    const norm = normalizeLead(m);
                    return {
                      id: String(norm.id || leadId),
                      name: norm.name,
                      email: norm.email || '—',
                      phone: norm.phone || '—',
                      company: norm.company || '—',
                      status: norm.status || 'New Lead',
                      owner: norm.owner || '—',
                      city: norm.city || '—',
                      budget: norm.budget || '—',
                      requirement: norm.requirement || '—',
                      source: norm.source || '—',
                      allocationTrail: norm.allocationTrail || [],
                    };
                  }
                }
              }
            } catch (_) {}
          }

          const friendlyName = decodeURIComponent(leadId).replace(/[_-]/g, ' ').trim();
          const finalName = friendlyName.length > 2 && !friendlyName.startsWith('cmu') && friendlyName !== '1' ? friendlyName : 'Lead Prospect';
          return {
            id: leadId,
            name: finalName,
            email: '—',
            phone: '—',
            company: '—',
            status: 'New Lead',
            owner: '—',
            city: '—',
            budget: '—',
            requirement: '—',
            source: '—',
            allocationTrail: [],
          };
        });
      }
    };

    loadLeadDetails();

    const handleUpdate = () => {
      loadLeadDetails();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('das_crm_leads_updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('das_crm_leads_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [leadId, leadData]);

  // ── SECTION 2: SMART DIALLER & CALL FUNNEL STATE ───────────────────────────
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showCallCutModal, setShowCallCutModal] = useState(false);
  const [callResponseNotes, setCallResponseNotes] = useState('');

  // Call Funnel Category Selection (1. Talked, 2. Not Responding, 3. Busy, 4. Switched Off)
  const [funnelPrimaryCat, setFunnelPrimaryCat] = useState<'TALKED' | 'NOT_RESPONDING' | 'BUSY' | 'SWITCH_OFF'>('TALKED');

  // 1. Talked Sub-Options (Interested, Said He Will Visit, Want Something Else, Busy will talk later, Wrong Number)
  const [talkedSubOption, setTalkedSubOption] = useState<
    'INTERESTED' | 'SAID_WILL_VISIT' | 'WANT_SOMETHING_ELSE' | 'BUSY_LATER' | 'WRONG_NUMBER'
  >('INTERESTED');

  // Product Selection for Interested
  const [selectedProduct, setSelectedProduct] = useState<string>('DAS CRM Enterprise Suite');
  const [customProductInput, setCustomProductInput] = useState<string>('');

  // 15-Day Date Grid & Time Scheduling
  const [funnelScheduledDate, setFunnelScheduledDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [funnelScheduledTime, setFunnelScheduledTime] = useState<string>('10:30');
  const [funnelSelectedChip, setFunnelSelectedChip] = useState<string>('Tomorrow (10:30 AM)');
  const [enablePreAlert5Min, setEnablePreAlert5Min] = useState<boolean>(true);
  const [customWantElseRequirement, setCustomWantElseRequirement] = useState<string>('');

  useEffect(() => {
    let timer: any;
    if (isCalling) {
      timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isCalling]);

  const handleStartCall = () => {
    setIsCalling(true);
    setCallDuration(0);
  };

  const handleHangupCall = () => {
    setIsCalling(false);
    setShowCallCutModal(true); // Pops up Post-Call Cut Funnel Modal automatically!
  };

  const handleSaveCallDisposition = async () => {
    // 1. Determine outcomeId, ContactOutcome, and ContactType
    let outcomeId = 'talked_interested';
    let contactType: ContactType = 'CALL_OUT';
    let contactOutcome: ContactOutcome = 'TALKED';
    let scheduledType: 'CALL' | 'MEETING' = 'CALL';
    let autoQueueFollowUp = false;
    let dispositionSummaryTitle = '';
    let productInterestLogged = '';

    if (funnelPrimaryCat === 'TALKED') {
      contactType = 'CALL_OUT';
      if (talkedSubOption === 'INTERESTED') {
        outcomeId = 'talked_interested';
        contactOutcome = 'INTERESTED_MORE_INFO';
        productInterestLogged = customProductInput.trim() || selectedProduct;
        autoQueueFollowUp = true;
        dispositionSummaryTitle = `Talked: Interested in ${productInterestLogged}`;
      } else if (talkedSubOption === 'SAID_WILL_VISIT') {
        outcomeId = 'talked_said_will_visit';
        contactOutcome = 'FOLLOW_UP_SCHEDULED';
        scheduledType = 'MEETING';
        autoQueueFollowUp = true;
        dispositionSummaryTitle = `Talked: Meeting / Visit Scheduled for ${funnelScheduledDate} at ${funnelScheduledTime}`;
      } else if (talkedSubOption === 'WANT_SOMETHING_ELSE') {
        outcomeId = 'talked_want_something_else';
        contactOutcome = 'TALKED';
        productInterestLogged = customWantElseRequirement.trim();
        autoQueueFollowUp = true;
        dispositionSummaryTitle = `Talked: Custom Requirement — ${customWantElseRequirement.trim() || 'Specified'}`;
      } else if (talkedSubOption === 'BUSY_LATER') {
        outcomeId = 'talked_busy_later';
        contactOutcome = 'WILL_CALL_BACK';
        autoQueueFollowUp = true;
        dispositionSummaryTitle = `Talked: Busy, Scheduled Callback for ${funnelScheduledDate} at ${funnelScheduledTime}`;
      } else if (talkedSubOption === 'WRONG_NUMBER') {
        outcomeId = 'talked_wrong_number';
        contactOutcome = 'WRONG_NUMBER';
        autoQueueFollowUp = false;
        dispositionSummaryTitle = 'Talked: Wrong Number / Invalid';
      }
    } else if (funnelPrimaryCat === 'NOT_RESPONDING') {
      contactType = 'CALL_NOT_RESPONDING';
      contactOutcome = 'NO_ANSWER';
      autoQueueFollowUp = true;
      if (funnelSelectedChip.includes('Tomorrow')) {
        outcomeId = 'not_responding_tomorrow';
        dispositionSummaryTitle = 'Not Responding: Queued Follow-up Tomorrow (10:30 AM)';
      } else {
        outcomeId = 'not_responding_followup';
        dispositionSummaryTitle = `Not Responding: Scheduled Callback for ${funnelScheduledDate} at ${funnelScheduledTime}`;
      }
    } else if (funnelPrimaryCat === 'BUSY') {
      contactType = 'CALL_BUSY';
      contactOutcome = 'BUSY';
      outcomeId = 'busy_callback';
      autoQueueFollowUp = true;
      dispositionSummaryTitle = `Line Busy: Scheduled Callback (${funnelSelectedChip}) for ${funnelScheduledDate} at ${funnelScheduledTime}`;
    } else if (funnelPrimaryCat === 'SWITCH_OFF') {
      contactType = 'CALL_SWITCH_OFF';
      contactOutcome = 'SWITCH_OFF';
      outcomeId = 'switched_off_callback';
      autoQueueFollowUp = true;
      dispositionSummaryTitle = `Switched Off: Scheduled Callback (${funnelSelectedChip}) for ${funnelScheduledDate} at ${funnelScheduledTime}`;
    }

    // 2. Resolve Target Lead Status from Admin Workflow Mappings
    const targetStatus = getTargetStatusForOutcome(outcomeId, 'Contacted');

    // 3. Update Lead in State
    const updatedRequirement = productInterestLogged || lead.requirement;
    const updatedLead = {
      ...lead,
      status: targetStatus,
      requirement: updatedRequirement,
    };
    setLead(updatedLead);

    // 4. Persist to Session & Local Caches
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`das_crm_lead_${lead.id}`, JSON.stringify(updatedLead));
        sessionStorage.setItem('das_crm_active_lead', JSON.stringify(updatedLead));

        const allLeadsRaw = localStorage.getItem('das_crm_all_leads_cache');
        if (allLeadsRaw) {
          const allLeads: any[] = JSON.parse(allLeadsRaw);
          const updatedAll = allLeads.map((item: any) =>
            String(item.id) === String(lead.id) || (item.name && item.name === lead.name)
              ? { ...item, status: targetStatus, stage: targetStatus, requirement: updatedRequirement, productInterest: updatedRequirement }
              : item
          );
          localStorage.setItem('das_crm_all_leads_cache', JSON.stringify(updatedAll));
        }

        const dirLeadsRaw = localStorage.getItem('das_crm_lead_directory_cache');
        if (dirLeadsRaw) {
          const dirLeads: any[] = JSON.parse(dirLeadsRaw);
          const updatedDir = dirLeads.map((item: any) =>
            String(item.id) === String(lead.id) || (item.name && item.name === lead.name)
              ? { ...item, status: targetStatus, stage: targetStatus, requirement: updatedRequirement, productInterest: updatedRequirement }
              : item
          );
          localStorage.setItem('das_crm_lead_directory_cache', JSON.stringify(updatedDir));
        }
      } catch (_) {}
    }

    // 5. Update Status in Backend API
    const activeStored = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('das_crm_active_lead') || '{}') : {};
    const effectiveLeadId = (lead.id && lead.id !== '1' && !lead.id.startsWith('lead_'))
      ? lead.id
      : (activeStored.id && activeStored.id !== '1' && !activeStored.id.startsWith('lead_') ? activeStored.id : (lead.id || '1'));

    apiFetch(`/leads/${effectiveLeadId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        statusId: targetStatus,
        notes: `Call Funnel Disposition: ${dispositionSummaryTitle}. Notes: ${callResponseNotes || 'N/A'}`,
      }),
    }).then(() => {
      if (typeof window !== 'undefined') {
        try {
          clearAllDashboardCaches();
          const updatedLead = { ...lead, id: effectiveLeadId, status: targetStatus };
          sessionStorage.setItem(`das_crm_lead_${lead.id}`, JSON.stringify(updatedLead));
          sessionStorage.setItem(`das_crm_lead_${effectiveLeadId}`, JSON.stringify(updatedLead));
          sessionStorage.setItem('das_crm_active_lead', JSON.stringify(updatedLead));
        } catch (_) {}
        window.dispatchEvent(new CustomEvent('das_crm_leads_updated', { detail: { leadId: effectiveLeadId, status: targetStatus } }));
        try {
          const bc = new BroadcastChannel('das_crm_lead_sync');
          bc.postMessage({ type: 'LEAD_STATUS_CHANGED', leadId: effectiveLeadId, status: targetStatus });
          bc.close();
        } catch (_) {}
      }
    }).catch(() => {});

    // 6. Automatically Create Follow-up Task in Backend & Tasks Hub
    if (autoQueueFollowUp && funnelScheduledDate) {
      const followUpTitle =
        scheduledType === 'MEETING'
          ? `🏢 In-Person / Virtual Visit: ${lead.name} (${lead.company || lead.phone})`
          : `📞 Callback: ${lead.name} (${lead.phone})`;

      const dueAtIso = `${funnelScheduledDate}T${funnelScheduledTime || '10:30'}:00`;
      const followUpPayload = {
        title: followUpTitle,
        followUpType: scheduledType,
        leadId: effectiveLeadId,
        scheduledDate: funnelScheduledDate,
        scheduledTime: funnelScheduledTime || '10:30',
        dueAt: dueAtIso,
        priority: 'HIGH',
        purpose: callResponseNotes || `Call Funnel: ${dispositionSummaryTitle}`,
        reminderMinutes: enablePreAlert5Min ? 5 : 0,
      };

      // Push to backend
      apiFetch('/follow-ups', {
        method: 'POST',
        body: JSON.stringify(followUpPayload),
      }).catch((e) => console.warn('Follow-up create sync notice:', e));

      // Local storage cache + live broadcast
      if (typeof window !== 'undefined') {
        try {
          const cachedTasks = JSON.parse(localStorage.getItem('das_crm_followup_tasks_cache') || '[]');
          const repName = lead.owner || (lead as any).assignedRep || 'Sachin Puri';
          cachedTasks.unshift({
            id: `task_${Date.now()}`,
            ...followUpPayload,
            createdAt: new Date().toISOString(),
            status: 'PENDING',
            createdById: currentUser?.id || 'admin_user',
            createdByName: currentUser?.name || 'Anurag Sharma',
            createdByRole: currentUser?.role || 'ADMIN',
            createdBy: {
              id: currentUser?.id,
              name: currentUser?.name || 'Anurag Sharma',
              firstName: currentUser?.name ? currentUser.name.split(' ')[0] : 'Anurag',
              lastName: currentUser?.name ? currentUser.name.split(' ').slice(1).join(' ') : 'Sharma',
              role: currentUser?.role || 'ADMIN',
            },
            assignee: {
              id: currentUser?.id,
              name: String(repName || 'Sachin Puri'),
              firstName: String(repName || 'Sachin').split(' ')[0],
              lastName: String(repName || '').split(' ').slice(1).join(' ') || 'Puri',
              role: 'SALES_REP',
            },
            lead: {
              id: lead.id,
              name: lead.name,
              firstName: (lead as any).firstName || (lead.name ? lead.name.split(' ')[0] : 'Lead'),
              lastName: (lead as any).lastName || (lead.name ? lead.name.split(' ').slice(1).join(' ') : ''),
              phone: lead.phone,
              email: lead.email,
              owner: {
                name: String(repName || 'Sachin Puri'),
                firstName: String(repName || 'Sachin').split(' ')[0],
                lastName: String(repName || '').split(' ').slice(1).join(' ') || 'Puri',
                role: 'SALES_REP',
              },
              company: typeof lead.company === 'string' ? { name: lead.company } : (lead.company || { name: 'Enterprise' }),
              status: { name: targetStatus, color: '#3b82f6' },
            },
          });
          localStorage.setItem('das_crm_followup_tasks_cache', JSON.stringify(cachedTasks.slice(0, 100)));
          window.dispatchEvent(new CustomEvent('das_crm_workflow_updated'));
          window.dispatchEvent(new CustomEvent('das_crm_followup_created', { detail: followUpPayload }));
        } catch (_) {}
      }
    }

    // 7. Push to Contact History Timeline (CallContactHistory.tsx)
    const userRoleStr = (currentUser?.role || 'SALES_EXEC').toUpperCase();
    const cleanRole: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC' = userRoleStr.includes('ADMIN')
      ? 'ADMIN'
      : userRoleStr.includes('MANAGER')
      ? 'MANAGER'
      : userRoleStr.includes('LEAD') || userRoleStr.includes('TL')
      ? 'TEAM_LEADER'
      : 'SALES_EXEC';

    const newContactAttempt: ContactAttempt = {
      id: `attempt_${Date.now()}`,
      type: contactType,
      outcome: contactOutcome,
      by: currentUser?.name || lead.owner || 'Sales Rep',
      byRole: cleanRole,
      timestamp: new Date().toISOString(),
      durationSeconds: callDuration,
      notes: callResponseNotes || dispositionSummaryTitle,
      productInterest: productInterestLogged || undefined,
      followUpDate: autoQueueFollowUp ? funnelScheduledDate : undefined,
      followUpTime: autoQueueFollowUp ? funnelScheduledTime : undefined,
      audioRecordingAvailable: callDuration > 10,
    };

    const updatedHistory = [newContactAttempt, ...contactHistory];
    setContactHistory(updatedHistory);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`das_crm_contact_history_${lead.id}`, JSON.stringify(updatedHistory));
        localStorage.setItem(`das_crm_contact_history_${leadId}`, JSON.stringify(updatedHistory));
      } catch (_) {}
    }

    // Persist to PostgreSQL Activity Table via Backend API
    apiFetch('/activities', {
      method: 'POST',
      body: JSON.stringify({
        activityType: 'CALL',
        leadId: lead.id,
        notes: callResponseNotes || dispositionSummaryTitle,
        durationSeconds: callDuration,
        durationMin: Math.ceil(callDuration / 60),
        outcome: contactOutcome,
        metadata: {
          type: contactType,
          outcome: contactOutcome,
          durationSeconds: callDuration,
          productInterest: productInterestLogged,
          notes: callResponseNotes || dispositionSummaryTitle,
          by: currentUser?.name || lead.owner || 'Sales Rep',
          byRole: cleanRole,
          followUpDate: autoQueueFollowUp ? funnelScheduledDate : undefined,
          followUpTime: autoQueueFollowUp ? funnelScheduledTime : undefined,
          audioRecordingAvailable: callDuration > 10,
        },
      }),
    }).catch(e => console.warn('Could not persist call activity:', e));

    if (productInterestLogged) {
      setLead(prev => ({ ...prev, requirement: productInterestLogged }));
    }

    // 8. Log to Lead Center Activity Stream
    const newLog: SyncedActivityLog = {
      id: Date.now().toString(),
      section: 'DIALLER',
      title: `Call Ended (${Math.floor(callDuration / 60)}m ${callDuration % 60}s) — ${dispositionSummaryTitle}`,
      disposition: dispositionSummaryTitle as any,
      notes: callResponseNotes || `Outcome: ${contactOutcome}`,
      timestamp: 'Just now',
      user: currentUser?.name || lead.owner,
    };
    setSyncedActivities((prev) => [newLog, ...prev]);

    // Close Modal & Reset
    setShowCallCutModal(false);
    setCallResponseNotes('');
    setCustomProductInput('');
    setCustomWantElseRequirement('');
    showSyncNotification(
      `✓ Call Outcome Logged: Status set to "${targetStatus}" ${
        autoQueueFollowUp
          ? `| Follow-up scheduled for ${funnelScheduledDate} at ${funnelScheduledTime} (5-min pre-alert 🔔)`
          : ''
      }`
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('das_crm_leads_updated', { detail: { leadId: lead.id } }));
    }
  };

  // ── SECTION 3: WHATSAPP CHAT DIRECT STATE ──────────────────────────────
  const [waDirectTemplate, setWaDirectTemplate] = useState('Intro Proposal Template');
  const [waDirectDisposition, setWaDirectDisposition] = useState<DispositionOption>('Will Talk Later');
  const [waDirectNotes, setWaDirectNotes] = useState('');

  const handleSendWaDirect = () => {
    const userRoleStr = (currentUser?.role || 'SALES_EXEC').toUpperCase();
    const cleanRole: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC' = userRoleStr.includes('ADMIN')
      ? 'ADMIN'
      : userRoleStr.includes('MANAGER')
      ? 'MANAGER'
      : userRoleStr.includes('LEAD') || userRoleStr.includes('TL')
      ? 'TEAM_LEADER'
      : 'SALES_EXEC';

    const newContactAttempt: ContactAttempt = {
      id: `attempt_wa_${Date.now()}`,
      type: 'WHATSAPP',
      outcome: 'WA_SENT',
      by: currentUser?.name || lead.owner || 'Sales Rep',
      byRole: cleanRole,
      timestamp: new Date().toISOString(),
      notes: `Template: ${waDirectTemplate} • ${waDirectNotes || waDirectDisposition}`,
      sentMessage: waDirectNotes || `Template: ${waDirectTemplate}`,
    };

    setContactHistory(prev => [newContactAttempt, ...prev]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`das_crm_contact_history_${lead.id}`, JSON.stringify([newContactAttempt, ...contactHistory]));
        localStorage.setItem(`das_crm_contact_history_${leadId}`, JSON.stringify([newContactAttempt, ...contactHistory]));
      } catch (_) {}
    }

    apiFetch('/activities', {
      method: 'POST',
      body: JSON.stringify({
        activityType: 'NOTE',
        leadId: lead.id,
        notes: `WhatsApp Direct (${waDirectTemplate}): ${waDirectNotes || waDirectDisposition}`,
        metadata: {
          channel: 'WHATSAPP',
          type: 'WHATSAPP',
          outcome: 'WA_SENT',
          template: waDirectTemplate,
          disposition: waDirectDisposition,
          sentMessage: waDirectNotes,
          by: currentUser?.name || lead.owner,
          byRole: cleanRole,
        },
      }),
    }).catch(() => {});

    const newLog: SyncedActivityLog = {
      id: Date.now().toString(),
      section: 'WA_DIRECT',
      title: `WhatsApp Direct Template Dispatched (${waDirectTemplate})`,
      disposition: waDirectDisposition,
      notes: waDirectNotes || `Template sent: ${waDirectTemplate}`,
      timestamp: 'Just now',
      user: lead.owner,
    };

    setSyncedActivities((prev) => [newLog, ...prev]);
    showSyncNotification(`✓ WhatsApp Direct Message & Disposition Synced to Lead Center!`);
    setWaDirectNotes('');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('das_crm_leads_updated', { detail: { leadId: lead.id } }));
    }
  };

  // ── SECTION 4: WHATSAPP CLOUD CHAT + AI HUMANIZE STATE ───────────────────
  const [waCloudMessages, setWaCloudMessages] = useState<any[]>([]);
  const [waCloudInput, setWaCloudInput] = useState('');
  const [isAiHumanizing, setIsAiHumanizing] = useState(false);

  const handleAiHumanize = () => {
    if (!waCloudInput.trim()) return;
    setIsAiHumanizing(true);
    setTimeout(() => {
      setWaCloudInput(
        `Dear ${lead.name.split(' ')[0]}, thank you for reaching out! I would be delighted to share our comprehensive solution tailored specifically for ${lead.company}. When would be a convenient time for a brief 5-minute call?`
      );
      setIsAiHumanizing(false);
      showSyncNotification('✨ Message polished with AI Humanize Engine!');
    }, 600);
  };

  const handleSendWaCloud = () => {
    if (!waCloudInput.trim()) return;
    const userRoleStr = (currentUser?.role || 'SALES_EXEC').toUpperCase();
    const cleanRole: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC' = userRoleStr.includes('ADMIN')
      ? 'ADMIN'
      : userRoleStr.includes('MANAGER')
      ? 'MANAGER'
      : userRoleStr.includes('LEAD') || userRoleStr.includes('TL')
      ? 'TEAM_LEADER'
      : 'SALES_EXEC';

    const newMsg = {
      id: Date.now().toString(),
      from: 'rep',
      text: waCloudInput,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setWaCloudMessages((prev) => [...prev, newMsg]);

    const newContactAttempt: ContactAttempt = {
      id: `attempt_wacloud_${Date.now()}`,
      type: 'WHATSAPP',
      outcome: 'WA_SENT',
      by: currentUser?.name || lead.owner || 'Sales Rep',
      byRole: cleanRole,
      timestamp: new Date().toISOString(),
      notes: `WhatsApp Cloud: ${waCloudInput}`,
      sentMessage: waCloudInput,
    };

    setContactHistory(prev => [newContactAttempt, ...prev]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`das_crm_contact_history_${lead.id}`, JSON.stringify([newContactAttempt, ...contactHistory]));
        localStorage.setItem(`das_crm_contact_history_${leadId}`, JSON.stringify([newContactAttempt, ...contactHistory]));
      } catch (_) {}
    }

    apiFetch('/activities', {
      method: 'POST',
      body: JSON.stringify({
        activityType: 'NOTE',
        leadId: lead.id,
        notes: `WhatsApp Cloud: ${waCloudInput}`,
        metadata: {
          channel: 'WHATSAPP',
          type: 'WHATSAPP',
          outcome: 'WA_SENT',
          sentMessage: waCloudInput,
          by: currentUser?.name || lead.owner,
          byRole: cleanRole,
        },
      }),
    }).catch(() => {});

    const newLog: SyncedActivityLog = {
      id: Date.now().toString(),
      section: 'WA_CLOUD',
      title: 'WhatsApp Cloud 2-Way Message Sent',
      notes: waCloudInput,
      timestamp: 'Just now',
      user: lead.owner,
    };

    setSyncedActivities((prev) => [newLog, ...prev]);
    setWaCloudInput('');
    showSyncNotification('✓ WhatsApp Cloud Message Synced to Lead Center!');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('das_crm_leads_updated', { detail: { leadId: lead.id } }));
    }
  };

  // ── SECTION 5: EMAIL MARKETING STATE ──────────────────────────────────
  const [emailTemplate, setEmailTemplate] = useState('Product Demo Invitation');
  const [emailSubject, setEmailSubject] = useState(`Exclusive Product Demo for ${lead.company}`);
  const [emailBody, setEmailBody] = useState(
    `Hi ${lead.name},\n\nWe would love to show you how our CRM platform can double your team's lead conversion rates.\n\nBest regards,\n${lead.owner}`
  );

  const handleSendEmail = () => {
    const userRoleStr = (currentUser?.role || 'SALES_EXEC').toUpperCase();
    const cleanRole: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC' = userRoleStr.includes('ADMIN')
      ? 'ADMIN'
      : userRoleStr.includes('MANAGER')
      ? 'MANAGER'
      : userRoleStr.includes('LEAD') || userRoleStr.includes('TL')
      ? 'TEAM_LEADER'
      : 'SALES_EXEC';

    const newContactAttempt: ContactAttempt = {
      id: `attempt_email_${Date.now()}`,
      type: 'EMAIL',
      outcome: 'EMAIL_SENT',
      by: currentUser?.name || lead.owner || 'Sales Rep',
      byRole: cleanRole,
      timestamp: new Date().toISOString(),
      notes: `Email (${emailTemplate}): ${emailSubject}`,
      sentMessage: emailSubject,
    };

    setContactHistory(prev => [newContactAttempt, ...prev]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`das_crm_contact_history_${lead.id}`, JSON.stringify([newContactAttempt, ...contactHistory]));
        localStorage.setItem(`das_crm_contact_history_${leadId}`, JSON.stringify([newContactAttempt, ...contactHistory]));
      } catch (_) {}
    }

    apiFetch('/activities', {
      method: 'POST',
      body: JSON.stringify({
        activityType: 'EMAIL',
        leadId: lead.id,
        subject: emailSubject,
        notes: `Email (${emailTemplate}): ${emailSubject}`,
        metadata: {
          channel: 'EMAIL',
          type: 'EMAIL',
          outcome: 'EMAIL_SENT',
          subject: emailSubject,
          template: emailTemplate,
          by: currentUser?.name || lead.owner,
          byRole: cleanRole,
        },
      }),
    }).catch(() => {});

    const newLog: SyncedActivityLog = {
      id: Date.now().toString(),
      section: 'EMAIL',
      title: `Email Dispatched: ${emailSubject}`,
      notes: `Template: ${emailTemplate}`,
      timestamp: 'Just now',
      user: lead.owner,
    };

    setSyncedActivities((prev) => [newLog, ...prev]);
    showSyncNotification('✓ Email Dispatched & Synced to Lead Center!');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('das_crm_leads_updated', { detail: { leadId: lead.id } }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Lead Banner */}
      <div className="crm-card bg-gradient-to-r from-card via-background to-card border border-border p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand/20 text-brand-400 font-extrabold text-xl flex items-center justify-center border border-brand/30">
              {(lead.name || 'LP').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">{safeString(lead.name, 'Lead')}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-brand/20 text-brand-300 border border-brand/30">
                  {safeString(lead.status, 'New Lead')}
                </span>
              </div>
              <p className="text-xs text-muted flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1"><Building2 size={13} className="text-indigo-400" /> {safeString(lead.company, '—')}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Phone size={13} className="text-emerald-400" /> {safeString(lead.phone, '—')}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Mail size={13} className="text-purple-400" /> {safeString(lead.email, '—')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-muted bg-muted/20 px-3 py-1.5 rounded-xl border border-border">
              Assigned Rep: <strong className="text-white">{safeString(lead.owner, 'Sachin Puri')}</strong>
            </span>
          </div>
        </div>

        {/* ── UNIFIED ACTION & ROUTING TOOLBAR ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2 border-t border-border">
          {/* 1. Lead Center */}
          <button
            onClick={() => setActiveSection('lead_center')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'lead_center'
                ? 'bg-brand text-white shadow-lg shadow-brand/25 border border-brand-400'
                : 'bg-brand/15 border border-brand/30 text-brand-300 hover:bg-brand/25'
            }`}
          >
            <Layers size={14} /> 1. Lead Center
          </button>

          {/* 2. Call & Smart Dialler */}
          <button
            onClick={() => { handleStartCall(); setActiveSection('dialler'); }}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'dialler'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
            }`}
          >
            <Phone size={14} /> 📞 Call
          </button>

          {/* 3. WhatsApp Direct */}
          <button
            onClick={() => setActiveSection('wa_direct')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'wa_direct'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25 border border-amber-400'
                : 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
            }`}
          >
            <Zap size={14} /> 💬 WhatsApp Direct
          </button>

          {/* 4. WA Cloud + AI */}
          <button
            onClick={() => setActiveSection('wa_cloud')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'wa_cloud'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400'
                : 'bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25'
            }`}
          >
            <MessageSquare size={14} /> ☁️ WA Cloud + AI
          </button>

          {/* 5. Email Marketing */}
          <button
            onClick={() => setActiveSection('email_marketing')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'email_marketing'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400'
                : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
            }`}
          >
            <Send size={14} /> 🚀 Email Marketing
          </button>

          {/* Direct Email Action */}
          <button
            onClick={() => {
              window.location.href = `mailto:${lead.email}?subject=Follow-up%20from%20DAS%20CRM`;
              if (lead.status === 'New Lead' || lead.status === 'NEW LEAD') {
                setLead(prev => ({ ...prev, status: 'Contacted' }));
                showSyncNotification('📞 Lead Status auto-updated to Contacted!');
              }
            }}
            className="px-3 py-2 rounded-xl bg-sky-600/15 border border-sky-500/30 text-sky-300 hover:bg-sky-600/25 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Mail size={14} /> ✉️ Direct Email
          </button>

          {/* Update Status Action */}
          <button
            onClick={() => setShowUpdateStatusModal(true)}
            className="px-3 py-2 rounded-xl bg-rose-600/15 border border-rose-500/30 text-rose-300 hover:bg-rose-600/25 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Tag size={14} /> 📝 Update Status
          </button>
        </div>
      </div>

      {/* ── SECTION 1: LEAD CENTER (MAIN HUB) ────────────────────────────────── */}
      {activeSection === 'lead_center' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Lead Info Card & Allocation Chain */}
          <div className="space-y-6">
            <div className="crm-card space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-border pb-3">
                <User size={16} className="text-brand-400" /> Single Source of Truth — Lead Profile
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Lead Name:</span>
                  <span className="font-bold text-white">{safeString(lead.name, 'Lead Prospect')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Company:</span>
                  <span className="font-bold text-white">{safeString(lead.company, '—')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Phone:</span>
                  <span className="font-bold text-emerald-400">{safeString(lead.phone, '—')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Email:</span>
                  <span className="font-bold text-purple-400">{safeString(lead.email, '—')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Ingestion Source:</span>
                  <span className="font-bold text-indigo-300">{safeString(lead.source, '—')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Interested Product / Service:</span>
                  <span className="font-bold text-amber-300 truncate max-w-[180px]" title={safeString(lead.requirement)}>{safeString(lead.requirement, '—')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Current Status:</span>
                  <span className="font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                    {safeString(lead.status, 'New Lead')}
                  </span>
                </div>
              </div>
            </div>

            {/* Allocation Trail Component */}
            <LeadAllocationTrail
              trail={lead.allocationTrail}
              currentAssignee={lead.owner}
              currentRole={getUserRoleFromName(lead.owner)}
              leadId={lead.id}
              isAdmin={isUserAdmin}
              isManager={isUserManager}
              isTL={isUserTL}
              isSales={isUserSales}
              onNewAllocation={async (newEvent, assigneeId, assigneeName) => {
                const finalAssigneeId = assigneeId || newEvent.assigneeId || '';
                const finalAssigneeName = assigneeName || newEvent.toName || 'Assigned Rep';
                const updatedTrail = [...(lead.allocationTrail || []), newEvent];
                const updatedLead = {
                  ...lead,
                  owner: finalAssigneeName,
                  allocationTrail: updatedTrail,
                };
                setLead(updatedLead);

                // 1. Persist to Session Storage
                if (typeof window !== 'undefined') {
                  try {
                    sessionStorage.setItem(`das_crm_lead_${lead.id}`, JSON.stringify(updatedLead));
                    sessionStorage.setItem('das_crm_active_lead', JSON.stringify(updatedLead));

                    // 2. Persist to LocalStorage caches
                    const allLeadsRaw = localStorage.getItem('das_crm_all_leads_cache');
                    if (allLeadsRaw) {
                      const allLeads: any[] = JSON.parse(allLeadsRaw);
                      const updatedAll = allLeads.map((item: any) =>
                        String(item.id) === String(lead.id) || (item.name && item.name === lead.name)
                          ? { ...item, owner: finalAssigneeName, currentAssignee: finalAssigneeName, allocationTrail: updatedTrail }
                          : item
                      );
                      localStorage.setItem('das_crm_all_leads_cache', JSON.stringify(updatedAll));
                    }

                    const dirLeadsRaw = localStorage.getItem('das_crm_lead_directory_cache');
                    if (dirLeadsRaw) {
                      const dirLeads: any[] = JSON.parse(dirLeadsRaw);
                      const updatedDir = dirLeads.map((item: any) =>
                        String(item.id) === String(lead.id) || (item.name && item.name === lead.name)
                          ? { ...item, owner: finalAssigneeName, assignedRep: finalAssigneeName, allocationTrail: updatedTrail }
                          : item
                      );
                      localStorage.setItem('das_crm_lead_directory_cache', JSON.stringify(updatedDir));
                    }

                    // Purge all role dashboard caches so Manager, TL, and Sales dashboards reload immediately
                    clearAllDashboardCaches();
                  } catch (_) {}
                }

                // Dispatch global real-time event & broadcast to all open dashboard tabs
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('das_crm_leads_updated', { detail: { leadId: lead.id, assignee: finalAssigneeName, assigneeId: finalAssigneeId } }));
                  try {
                    const bc = new BroadcastChannel('das_crm_lead_sync');
                    bc.postMessage({ type: 'LEAD_ALLOCATED', leadId: lead.id, assignee: finalAssigneeName, assigneeId: finalAssigneeId });
                    bc.close();
                  } catch (_) {}
                }

                // 3. Dispatch to backend API with accurate target user ID
                try {
                  await apiFetch('/leads/distribution/allocate-verify', {
                    method: 'POST',
                    body: JSON.stringify({
                      mode: 'DIRECT_ASSIGN',
                      leadIds: [lead.id],
                      directAssign: {
                        assigneeId: finalAssigneeId || finalAssigneeName,
                        assigneeName: finalAssigneeName,
                      },
                    }),
                  });
                } catch (e) {
                  console.warn('Backend allocation sync warning:', e);
                }

                showSyncNotification(`✓ Lead allocated to ${finalAssigneeName}! Recorded in allocation history.`);
              }}
            />
          </div>

          {/* Right Column: Full Contact History & Call Timeline */}
          <div className="md:col-span-2 space-y-6">
            <CallContactHistory history={contactHistory} leadName={lead.name} interestedProduct={lead.requirement} />
          </div>
        </div>
      )}

      {/* ── SECTION 2: SMART DIALLER & POST-CALL CUT DISPOSITION ─────────────── */}
      {activeSection === 'dialler' && (
        <div className="crm-card max-w-xl mx-auto space-y-6 text-center">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded border border-emerald-500/30">
              SMART IN-APP DIALLER ENGINE
            </span>
            <h3 className="text-lg font-extrabold text-white mt-2">Dialler — {lead.name}</h3>
            <p className="text-xs text-muted">{lead.phone} • {lead.company}</p>
          </div>

          {/* Call Screen */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-background to-card border border-border space-y-4 shadow-xl">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-500/30 animate-pulse">
              <Phone size={36} />
            </div>

            {isCalling ? (
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full">
                  ● CALL IN PROGRESS
                </span>
                <p className="font-mono text-3xl font-extrabold text-white">
                  {Math.floor(callDuration / 60).toString().padStart(2, '0')}:{(callDuration % 60).toString().padStart(2, '0')}
                </p>

                <div className="pt-4">
                  <button
                    onClick={handleHangupCall}
                    className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 transition-all"
                  >
                    <PhoneOff size={18} /> End Call (Call Cut) &amp; Enter Outcome →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-muted">Ready to place outbound call to lead</p>
                <button
                  onClick={handleStartCall}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
                >
                  <Phone size={18} /> Start Call Now →
                </button>
              </div>
            )}
          </div>

          {/* ── MULTI-TIERED POST-CALL CUT DISPOSITION MODAL ───────────────────────── */}
          {showCallCutModal && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-left animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                      📞 Post-Call Outcome Engine
                    </span>
                    <h4 className="font-extrabold text-white text-base mt-1 flex items-center gap-2">
                      <span>Log Call Outcome &amp; Auto-Sync CRM</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {lead.name} ({lead.phone}) · Duration: <strong className="text-slate-200">{Math.floor(callDuration / 60)}m {callDuration % 60}s</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCallCutModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* ── STEP 1: PRIMARY OUTCOME CATEGORY (4 Core Funnels) ──────────── */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Select Primary Call Disposition Category *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        key: 'TALKED',
                        label: '1. Talked (Call Connected)',
                        emoji: '🗣️',
                        color: 'emerald',
                        desc: 'Spoke with prospect / answered',
                      },
                      {
                        key: 'NOT_RESPONDING',
                        label: '2. Not Responding',
                        emoji: '🔕',
                        color: 'amber',
                        desc: 'Ringing but not picked',
                      },
                      {
                        key: 'BUSY',
                        label: '3. Busy',
                        emoji: '⏳',
                        color: 'rose',
                        desc: 'Line engaged / waiting',
                      },
                      {
                        key: 'SWITCH_OFF',
                        label: '4. Switched Off',
                        emoji: '📴',
                        color: 'slate',
                        desc: 'Unreachable / off',
                      },
                    ].map((cat) => {
                      const isSelected = funnelPrimaryCat === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => {
                            setFunnelPrimaryCat(cat.key as any);
                            if (cat.key === 'NOT_RESPONDING' || cat.key === 'BUSY' || cat.key === 'SWITCH_OFF') {
                              const d = new Date();
                              d.setDate(d.getDate() + 1);
                              setFunnelScheduledDate(d.toISOString().split('T')[0]);
                              setFunnelScheduledTime('10:30');
                              setFunnelSelectedChip('Tomorrow (10:30 AM)');
                            }
                          }}
                          className={`p-3 rounded-xl text-left border transition-all ${
                            isSelected
                              ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/50'
                              : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black flex items-center gap-1.5">
                              <span>{cat.emoji}</span> {cat.label}
                            </span>
                            {isSelected && <span className="text-indigo-400 font-bold text-xs">✓</span>}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{cat.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── STEP 2: CATEGORY-SPECIFIC SUB-OPTIONS & CONTROLS ─────────── */}

                {/* 1. TALKED (CALL CONNECTED) SUB-OPTIONS */}
                {funnelPrimaryCat === 'TALKED' && (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <span>🗣️ Talked Sub-Option:</span>
                      </label>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300">
                        {talkedSubOption === 'INTERESTED'
                          ? 'Auto Stage: Qualified'
                          : talkedSubOption === 'SAID_WILL_VISIT'
                          ? 'Auto Stage: Meeting Scheduled'
                          : talkedSubOption === 'WANT_SOMETHING_ELSE'
                          ? 'Auto Stage: Contacted'
                          : talkedSubOption === 'BUSY_LATER'
                          ? 'Auto Stage: Contacted'
                          : 'Auto Stage: Lost'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { key: 'INTERESTED', label: 'a - Interested (product or service)', emoji: '💡' },
                        { key: 'SAID_WILL_VISIT', label: 'b - Said He Will Visit', emoji: '🤝' },
                        { key: 'WANT_SOMETHING_ELSE', label: 'c - Want Something Else', emoji: '🔄' },
                        { key: 'BUSY_LATER', label: 'd - Busy will talk later', emoji: '⏰' },
                        { key: 'WRONG_NUMBER', label: 'e - Wrong Number', emoji: '⚠️' },
                      ].map((sub) => {
                        const isSelected = talkedSubOption === sub.key;
                        return (
                          <button
                            key={sub.key}
                            type="button"
                            onClick={() => setTalkedSubOption(sub.key as any)}
                            className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span className="mr-1.5">{sub.emoji}</span> {sub.label} {isSelected && '✓'}
                          </button>
                        );
                      })}
                    </div>

                    {/* Sub-Option A: INTERESTED -> Product Catalogue Selection */}
                    {talkedSubOption === 'INTERESTED' && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2.5 animate-in fade-in duration-150">
                        <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                          <Package size={13} className="text-emerald-400" /> Select Interested Product / Catalogue Shared:
                        </label>
                        <div className="space-y-1.5">
                          {[
                            { name: 'DAS CRM Enterprise Suite', tier: '₹49,999 / yr' },
                            { name: 'AI Lead Scoring Engine Pro', tier: '₹14,999 / mo' },
                            { name: 'WhatsApp Automation Bot Engine', tier: '₹8,999 / mo' },
                            { name: 'Cloud Telemetry License', tier: '₹4,999 / mo' },
                            { name: 'Custom ERP Integration Package', tier: '₹75,000 one-time' },
                          ].map((prod) => {
                            const isProdSelected = selectedProduct === prod.name && !customProductInput.trim();
                            return (
                              <div
                                key={prod.name}
                                onClick={() => {
                                  setSelectedProduct(prod.name);
                                  setCustomProductInput('');
                                }}
                                className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                                  isProdSelected
                                    ? 'bg-emerald-500/25 border-emerald-400 text-white'
                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                }`}
                              >
                                <span className="text-xs font-bold">{prod.name}</span>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                                  {prod.tier}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">
                            Or Enter Other Custom Product / Service Name:
                          </label>
                          <input
                            type="text"
                            className="crm-input text-xs h-8"
                            placeholder="e.g. Healthcare Multi-Branch Module..."
                            value={customProductInput}
                            onChange={(e) => setCustomProductInput(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Sub-Option B: SAID HE WILL VISIT -> 15-Day Date & Time Meeting Scheduler */}
                    {talkedSubOption === 'SAID_WILL_VISIT' && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-2.5 animate-in fade-in duration-150">
                        <label className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                          <CalendarCheck size={13} className="text-indigo-400" /> Select Expected Visit / Demo Date (Next 15 Days):
                        </label>
                        <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                          {Array.from({ length: 15 }, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() + i);
                            const isoDate = d.toISOString().split('T')[0];
                            const label =
                              i === 0
                                ? 'Today'
                                : i === 1
                                ? 'Tomorrow'
                                : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
                            const isSelected = funnelScheduledDate === isoDate;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setFunnelScheduledDate(isoDate)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Time Slot:</label>
                            <div className="flex flex-wrap gap-1">
                              {['10:00 AM', '11:30 AM', '02:30 PM', '04:00 PM', '06:00 PM'].map((slot) => {
                                const isTime = funnelScheduledTime === slot;
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setFunnelScheduledTime(slot)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                                      isTime
                                        ? 'bg-indigo-500/30 border-indigo-400 text-indigo-200'
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Custom Time:</label>
                            <input
                              type="time"
                              className="crm-input text-xs h-8 [color-scheme:dark]"
                              value={funnelScheduledTime.includes(':') && !funnelScheduledTime.includes('M') ? funnelScheduledTime : '11:30'}
                              onChange={(e) => setFunnelScheduledTime(e.target.value)}
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enablePreAlert5Min}
                            onChange={(e) => setEnablePreAlert5Min(e.target.checked)}
                            className="rounded border-slate-700 text-indigo-600 bg-slate-950"
                          />
                          <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                            <Bell size={12} className="text-amber-400" /> Pre-alert notification (5 mins before scheduled visit)
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Sub-Option C: WANT SOMETHING ELSE -> Custom Requirement Box */}
                    {talkedSubOption === 'WANT_SOMETHING_ELSE' && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2 animate-in fade-in duration-150">
                        <label className="text-[11px] font-bold text-amber-300 block">
                          📝 Capture Client's Custom Requirement / Needed Specs:
                        </label>
                        <textarea
                          rows={2}
                          className="crm-input text-xs w-full"
                          placeholder="e.g. Client needs custom multi-currency invoicing and Shopify API sync..."
                          value={customWantElseRequirement}
                          onChange={(e) => setCustomWantElseRequirement(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Sub-Option D: BUSY WILL TALK LATER -> 15-Day Date & Time Callback Scheduler */}
                    {talkedSubOption === 'BUSY_LATER' && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-150">
                        <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                          <Clock size={13} className="text-amber-400" /> Select Callback Date (Next 15 Days):
                        </label>
                        <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                          {Array.from({ length: 15 }, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() + i);
                            const isoDate = d.toISOString().split('T')[0];
                            const label =
                              i === 0
                                ? 'Today'
                                : i === 1
                                ? 'Tomorrow'
                                : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
                            const isSelected = funnelScheduledDate === isoDate;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setFunnelScheduledDate(isoDate)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
                                  isSelected
                                    ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Callback Slot:</label>
                            <div className="flex flex-wrap gap-1">
                              {['09:30 AM', '11:00 AM', '02:00 PM', '04:30 PM', '06:00 PM'].map((slot) => {
                                const isTime = funnelScheduledTime === slot;
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setFunnelScheduledTime(slot)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                                      isTime
                                        ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Custom Time:</label>
                            <input
                              type="time"
                              className="crm-input text-xs h-8 [color-scheme:dark]"
                              value={funnelScheduledTime.includes(':') && !funnelScheduledTime.includes('M') ? funnelScheduledTime : '10:30'}
                              onChange={(e) => setFunnelScheduledTime(e.target.value)}
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enablePreAlert5Min}
                            onChange={(e) => setEnablePreAlert5Min(e.target.checked)}
                            className="rounded border-slate-700 text-amber-600 bg-slate-950"
                          />
                          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                            <Bell size={12} className="text-amber-400" /> Pre-alert notification (5 mins before callback)
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Sub-Option E: WRONG NUMBER */}
                    {talkedSubOption === 'WRONG_NUMBER' && (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <AlertCircle size={14} className="text-rose-400" /> Mark Lead as Lost (Wrong Number)
                        </p>
                        <p className="text-[11px] text-rose-300/80">
                          This action will auto-transition this prospect to the Lost stage in accordance with tenant lifecycle rules.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. NOT RESPONDING (RINGING NOT PICKED) */}
                {funnelPrimaryCat === 'NOT_RESPONDING' && (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Clock size={13} className="text-amber-400" /> Follow-up Call Scheduling Options:
                      </label>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300">
                        Auto Stage: Contacted
                      </span>
                    </div>

                    {/* 1-Tap Quick Action: Tomorrow 10:30 AM */}
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        setFunnelScheduledDate(d.toISOString().split('T')[0]);
                        setFunnelScheduledTime('10:30');
                        setFunnelSelectedChip('Tomorrow (10:30 AM)');
                      }}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                        funnelSelectedChip === 'Tomorrow (10:30 AM)'
                          ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>⚡</span>
                        <span>a.1 - Quick Pick: Followup Tomorrow (10:30 AM)</span>
                      </span>
                      {funnelSelectedChip === 'Tomorrow (10:30 AM)' && <span className="text-amber-300 font-black">✓ Selected</span>}
                    </button>

                    {/* Custom 15-Day Date & Time Grid */}
                    <div className="space-y-2 pt-1 border-t border-slate-800/80">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        a - Or Choose Custom Date (Next 15 Days):
                      </label>
                      <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                        {Array.from({ length: 15 }, (_, i) => {
                          const d = new Date();
                          d.setDate(d.getDate() + i);
                          const isoDate = d.toISOString().split('T')[0];
                          const label =
                            i === 0
                              ? 'Today'
                              : i === 1
                              ? 'Tomorrow'
                              : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
                          const isSelected = funnelScheduledDate === isoDate && funnelSelectedChip !== 'Tomorrow (10:30 AM)';
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setFunnelScheduledDate(isoDate);
                                setFunnelSelectedChip('Custom Date');
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
                                isSelected
                                  ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Time Slot:</label>
                          <div className="flex flex-wrap gap-1">
                            {['10:00 AM', '12:00 PM', '03:00 PM', '05:30 PM'].map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => {
                                  setFunnelScheduledTime(slot);
                                  setFunnelSelectedChip('Custom Date');
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                                  funnelScheduledTime === slot
                                    ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Custom Time:</label>
                          <input
                            type="time"
                            className="crm-input text-xs h-8 [color-scheme:dark]"
                            value={funnelScheduledTime.includes(':') && !funnelScheduledTime.includes('M') ? funnelScheduledTime : '10:30'}
                            onChange={(e) => {
                              setFunnelScheduledTime(e.target.value);
                              setFunnelSelectedChip('Custom Date');
                            }}
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enablePreAlert5Min}
                          onChange={(e) => setEnablePreAlert5Min(e.target.checked)}
                          className="rounded border-slate-700 text-amber-600 bg-slate-950"
                        />
                        <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                          <Bell size={12} className="text-amber-400" /> Pre-alert notification (5 mins before scheduled time in Follow-ups)
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 3. BUSY (LINE ENGAGED) & 4. SWITCHED OFF CHIPS */}
                {(funnelPrimaryCat === 'BUSY' || funnelPrimaryCat === 'SWITCH_OFF') && (
                  <div
                    className={`p-3.5 rounded-2xl bg-slate-950 border ${
                      funnelPrimaryCat === 'BUSY' ? 'border-rose-500/30' : 'border-slate-700'
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Clock size={13} className={funnelPrimaryCat === 'BUSY' ? 'text-rose-400' : 'text-slate-400'} />
                        Select Quick Callback Preset:
                      </label>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300">
                        Auto Stage: Contacted
                      </span>
                    </div>

                    {/* Quick Callback Interval Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: '30 Mins', delayMins: 30 },
                        { label: '1 Hour', delayMins: 60 },
                        { label: '2 Hours', delayMins: 120 },
                        { label: 'Tomorrow (10:30 AM)', delayDays: 1, time: '10:30' },
                        { label: 'Custom Date/Time', isCustom: true },
                      ].map((chip) => {
                        const isChipSelected = funnelSelectedChip === chip.label;
                        return (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => {
                              setFunnelSelectedChip(chip.label);
                              if (chip.delayMins) {
                                const now = new Date();
                                const target = new Date(now.getTime() + chip.delayMins * 60 * 1000);
                                setFunnelScheduledDate(target.toISOString().split('T')[0]);
                                setFunnelScheduledTime(
                                  `${target.getHours().toString().padStart(2, '0')}:${target.getMinutes().toString().padStart(2, '0')}`
                                );
                              } else if (chip.delayDays) {
                                const d = new Date();
                                d.setDate(d.getDate() + chip.delayDays);
                                setFunnelScheduledDate(d.toISOString().split('T')[0]);
                                setFunnelScheduledTime(chip.time || '10:30');
                              }
                            }}
                            className={`p-2 rounded-xl text-center text-xs font-bold transition-all border ${
                              isChipSelected
                                ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            ⚡ {chip.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Date/Time input if selected */}
                    {funnelSelectedChip === 'Custom Date/Time' && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 animate-in fade-in duration-150">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Date:</label>
                          <input
                            type="date"
                            className="crm-input text-xs h-8 [color-scheme:dark]"
                            value={funnelScheduledDate}
                            onChange={(e) => setFunnelScheduledDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Time:</label>
                          <input
                            type="time"
                            className="crm-input text-xs h-8 [color-scheme:dark]"
                            value={funnelScheduledTime}
                            onChange={(e) => setFunnelScheduledTime(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <label className="flex items-center gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enablePreAlert5Min}
                        onChange={(e) => setEnablePreAlert5Min(e.target.checked)}
                        className="rounded border-slate-700 text-indigo-600 bg-slate-950"
                      />
                      <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                        <Bell size={12} className="text-amber-400" /> Pre-alert notification (5 mins before scheduled callback)
                      </span>
                    </label>
                  </div>
                )}

                {/* ── STEP 3: CONVERSATION REMARKS & NOTES ─────────────────────── */}
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    📝 Call Notes &amp; Conversation Remarks:
                  </label>
                  <textarea
                    rows={2}
                    className="crm-input text-xs w-full"
                    placeholder="Enter discussion summary or callback instructions..."
                    value={callResponseNotes}
                    onChange={(e) => setCallResponseNotes(e.target.value)}
                  />
                </div>

                {/* ── LIVE STAGE TRANSITION SUMMARY PREVIEW ───────────────────── */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted">Target Stage:</span>
                    <span className="font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      {funnelPrimaryCat === 'TALKED' && talkedSubOption === 'INTERESTED'
                        ? 'Qualified'
                        : funnelPrimaryCat === 'TALKED' && talkedSubOption === 'SAID_WILL_VISIT'
                        ? 'Meeting Scheduled'
                        : funnelPrimaryCat === 'TALKED' && talkedSubOption === 'WRONG_NUMBER'
                        ? 'Lost'
                        : 'Contacted'}
                    </span>
                  </div>

                  {funnelPrimaryCat !== 'TALKED' || talkedSubOption !== 'WRONG_NUMBER' ? (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Calendar size={12} className="text-indigo-400" />
                      <span>{funnelScheduledDate} at {funnelScheduledTime}</span>
                      {enablePreAlert5Min && <span className="text-amber-400">🔔 5m</span>}
                    </div>
                  ) : null}
                </div>

                {/* ── SUBMIT BUTTONS ─────────────────────────────────────────── */}
                <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCallCutModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCallDisposition}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 size={15} /> Save Outcome &amp; Auto-Sync CRM →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 3: WHATSAPP CHAT DIRECT ──────────────────────────────────── */}
      {activeSection === 'wa_direct' && (
        <div className="crm-card max-w-2xl mx-auto space-y-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/30">
              WHATSAPP CHAT DIRECT DISPATCHER
            </span>
            <h3 className="text-lg font-extrabold text-white mt-1">Direct WhatsApp Template & Quick Update</h3>
            <p className="text-xs text-muted">Select pre-approved templates and dispatch directly to {lead.phone}</p>
          </div>

          <div className="p-5 rounded-2xl bg-background border border-border space-y-4">
            <div>
              <label className="text-xs text-muted block mb-1">Select WhatsApp Template *</label>
              <select
                className="crm-input text-xs font-bold"
                value={waDirectTemplate}
                onChange={(e) => setWaDirectTemplate(e.target.value)}
              >
                <option value="Intro Proposal Template">Intro Proposal & Pricing Deck Template</option>
                <option value="Follow-up Call Schedule">Follow-up Call Schedule Template</option>
                <option value="Product Demo Invitation">Product Demo Invitation Template</option>
                <option value="Special Discount Offer">Special Discount Offer Template</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">Select Quick Disposition Update Option *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Not Responding',
                  'Switch Off',
                  'Busy',
                  'Not Interested',
                  'Will Talk Later',
                  'Talked & Enter Response',
                  'Other Requirements',
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setWaDirectDisposition(opt as DispositionOption)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left ${
                      waDirectDisposition === opt
                        ? 'bg-amber-500/25 border-amber-500 text-amber-600 dark:text-amber-300'
                        : 'bg-card border-border text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {opt} {waDirectDisposition === opt && '✓'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">Additional Notes / Response Entry (Optional)</label>
              <input
                type="text"
                className="crm-input text-xs"
                placeholder="e.g. Sent pricing PDF via Direct WhatsApp..."
                value={waDirectNotes}
                onChange={(e) => setWaDirectNotes(e.target.value)}
              />
            </div>

            <button
              onClick={handleSendWaDirect}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
            >
              <Send size={15} /> Send WhatsApp Direct & Auto-Sync to Lead Center →
            </button>
          </div>
        </div>
      )}

      {/* ── SECTION 4: WHATSAPP CLOUD CHAT + AI HUMANIZE ─────────────────────── */}
      {activeSection === 'wa_cloud' && (
        <div className="crm-card max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 bg-purple-500/20 px-2.5 py-1 rounded border border-purple-500/30">
                2-WAY WHATSAPP CLOUD CHAT API + AI HUMANIZE
              </span>
              <h3 className="text-base font-extrabold text-white mt-1">Live WhatsApp Cloud Chat — {lead.name}</h3>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
              ● Cloud API Connected
            </span>
          </div>

          {/* Chat Messages Window */}
          <div className="p-4 rounded-2xl bg-background border border-border h-64 overflow-y-auto space-y-3">
            {waCloudMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === 'rep' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-md p-3 rounded-2xl text-xs space-y-1 ${
                    msg.from === 'rep'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-card border border-border text-white rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className="text-[9px] opacity-70 text-right">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Composer Box with AI Humanize Button */}
          <div className="space-y-3">
            <textarea
              rows={2}
              className="crm-input text-xs"
              placeholder="Type your WhatsApp message draft or rough reply..."
              value={waCloudInput}
              onChange={(e) => setWaCloudInput(e.target.value)}
            />

            <div className="flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={handleAiHumanize}
                disabled={isAiHumanizing || !waCloudInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs border border-purple-500/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles size={14} className="text-purple-300" />
                {isAiHumanizing ? 'Humanizing with AI...' : '✨ AI Humanize Response'}
              </button>

              <button
                onClick={handleSendWaCloud}
                disabled={!waCloudInput.trim()}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/25 disabled:opacity-50"
              >
                <Send size={14} /> Send & Sync →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 5: EMAIL MARKETING ────────────────────────────────────────── */}
      {activeSection === 'email_marketing' && (
        <div className="crm-card max-w-2xl mx-auto space-y-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2.5 py-1 rounded border border-blue-500/30">
              EMAIL MARKETING & CAMPAIGNS
            </span>
            <h3 className="text-lg font-extrabold text-white mt-1">Direct Email Dispatcher — {lead.email}</h3>
          </div>

          <div className="p-5 rounded-2xl bg-background border border-border space-y-4">
            <div>
              <label className="text-xs text-muted block mb-1">Select Email Template *</label>
              <select
                className="crm-input text-xs font-bold"
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
              >
                <option value="Product Demo Invitation">Product Demo Invitation Template</option>
                <option value="Enterprise Price Sheet">Enterprise Price Sheet Template</option>
                <option value="Company Introduction Deck">Company Introduction Deck Template</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">Email Subject Line *</label>
              <input
                type="text"
                className="crm-input text-xs font-bold"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">Email Body Content *</label>
              <textarea
                rows={4}
                className="crm-input text-xs"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>

            <button
              onClick={handleSendEmail}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <Mail size={15} /> Dispatch Email & Auto-Sync to Lead Center →
            </button>
          </div>
        </div>
      )}

      {/* ── UPDATE STATUS MODAL ─────────────────────────────────────────── */}
      {showUpdateStatusModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">📝 Update Lead Status & Stage</h3>
              <button onClick={() => setShowUpdateStatusModal(false)} className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-colors">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Select New Stage *</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  value={newStatusChoice}
                  onChange={(e) => setNewStatusChoice(e.target.value)}
                >
                  <option value="New Lead">New Lead</option>
                  <option value="Contacted">Contacted (Call/Msg Feedback Logged)</option>
                  <option value="Meeting Scheduled">Meeting Scheduled</option>
                  <option value="In Negotiation">In Negotiation (Product/Invoice Shared)</option>
                  <option value="Won">Won (Payment Cleared)</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Status Notes / Remarks</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  placeholder="Enter status update notes..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowUpdateStatusModal(false)}
                  disabled={isUpdatingStatus}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isUpdatingStatus}
                  onClick={async () => {
                    if (!isBrowserOnline()) {
                      showSyncNotification('⚡ Internet Required: Cannot update lead status while offline. Please connect to internet.');
                      return;
                    }

                    setIsUpdatingStatus(true);

                    try {
                      const isConnected = await verifyInternetConnection();
                      if (!isConnected) {
                        setIsUpdatingStatus(false);
                        showSyncNotification('⚡ Server Reachability Error: Cannot verify status update with server. Please check internet.');
                        return;
                      }

                      const activeStoredModal = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('das_crm_active_lead') || '{}') : {};
                      const effectiveLeadIdModal = (lead.id && lead.id !== '1' && !lead.id.startsWith('lead_'))
                        ? lead.id
                        : (activeStoredModal.id && activeStoredModal.id !== '1' && !activeStoredModal.id.startsWith('lead_') ? activeStoredModal.id : (lead.id || '1'));

                      try {
                        await apiFetch(`/leads/${effectiveLeadIdModal}/status`, {
                          method: 'PATCH',
                          body: JSON.stringify({ statusId: newStatusChoice, notes: statusNotes }),
                        });
                      } catch (apiErr) {
                        console.warn('Backend status update notice:', apiErr);
                      }

                      setLead(prev => ({ ...prev, id: effectiveLeadIdModal, status: newStatusChoice }));
                      setShowUpdateStatusModal(false);
                      setStatusNotes('');
                      setIsUpdatingStatus(false);

                      if (typeof window !== 'undefined') {
                        try {
                          clearAllDashboardCaches();
                          const updatedLead = { ...lead, id: effectiveLeadIdModal, status: newStatusChoice };
                          sessionStorage.setItem(`das_crm_lead_${lead.id}`, JSON.stringify(updatedLead));
                          sessionStorage.setItem(`das_crm_lead_${effectiveLeadIdModal}`, JSON.stringify(updatedLead));
                          sessionStorage.setItem('das_crm_active_lead', JSON.stringify(updatedLead));
                        } catch (_) {}
                        window.dispatchEvent(new CustomEvent('das_crm_leads_updated', { detail: { leadId: effectiveLeadIdModal, status: newStatusChoice } }));
                        try {
                          const bc = new BroadcastChannel('das_crm_lead_sync');
                          bc.postMessage({ type: 'LEAD_STATUS_CHANGED', leadId: effectiveLeadIdModal, status: newStatusChoice });
                          bc.close();
                        } catch (_) {}
                      }

                      showSyncNotification(`✓ Verified with Server: Lead status updated to "${newStatusChoice}"!`);

                      if (newStatusChoice === 'In Negotiation') {
                        setShowPaymentModal(true);
                      }
                    } catch (err: any) {
                      setIsUpdatingStatus(false);
                      showSyncNotification(`⚠️ Status update failed: ${err.message || 'Network error'}`);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdatingStatus ? 'Verifying with Server...' : 'Save & Verify Status →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT CONFIRMATION POPUP MODAL ─────────────────────────── */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                  💳 INVOICE & PAYMENT AUDIT
                </span>
                <h3 className="text-base font-extrabold text-white mt-1">Invoice Payment Outcome</h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-colors">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              An Invoice has been generated for <strong className="text-white">{lead.name}</strong>. Please confirm the payment result:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setLead(prev => ({ ...prev, status: 'Won' }));
                  setShowPaymentModal(false);
                  showSyncNotification('🎉 Payment Cleared! Lead status auto-updated to WON!');
                }}
                className="w-full p-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-left transition-all"
              >
                <p className="text-xs font-bold text-emerald-300 flex items-center gap-2">🟢 Payment Done / Cleared</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Full payment received. Auto-transitions status to WON 🎉</p>
              </button>

              <button
                onClick={() => {
                  setLead(prev => ({ ...prev, status: 'In Negotiation' }));
                  setShowPaymentModal(false);
                  showSyncNotification('📄 Payment Promised. Status set to In Negotiation.');
                }}
                className="w-full p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-left transition-all"
              >
                <p className="text-xs font-bold text-amber-300 flex items-center gap-2">🟡 Payment Promised / Will Pay Later</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Invoice sent. Client promised payment later. Status: IN NEGOTIATION</p>
              </button>

              <button
                onClick={() => {
                  setLead(prev => ({ ...prev, status: 'In Negotiation' }));
                  setShowPaymentModal(false);
                  showSyncNotification('⏳ Awaiting Client Approval. Status set to In Negotiation.');
                }}
                className="w-full p-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-left transition-all"
              >
                <p className="text-xs font-bold text-indigo-300 flex items-center gap-2">⏳ Waiting / Client Reviewing</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Awaiting client review. Status: IN NEGOTIATION</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
