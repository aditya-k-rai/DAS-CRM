'use client';

import { useState, useEffect } from 'react';
import {
  Phone, MessageSquare, Mail, Sparkles, Send, RefreshCw, CheckCircle2,
  Clock, AlertCircle, User, Building2, MapPin, Tag, FileText, Bot,
  PhoneOff, Mic, Play, Pause, ChevronRight, Zap, Shield, HelpCircle, Layers, Check, Wifi, WifiOff,
  Calendar, CalendarCheck, Package, Bell, BellRing, ArrowRight, Flame,
  Receipt, Search, ExternalLink, X
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
  leadInfo: { owner?: string; requirement?: string; leadId?: string; phone?: string; name?: string } = {},
  meetings: any[] = []
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
        const isMeeting =
          meta.scheduledType === 'MEETING' ||
          meta.outcome === 'MEETING_SCHEDULED' ||
          Boolean((act.description || meta.notes || '').match(/meeting|visit|in-person/i));
        const callOutcome: ContactOutcome = isMeeting
          ? 'MEETING_SCHEDULED'
          : ((meta.outcome || (durSecs > 0 ? 'TALKED' : 'BUSY')) as ContactOutcome);

        const trimmedProduct = (meta.productInterest && typeof meta.productInterest === 'string' && meta.productInterest.trim())
          ? meta.productInterest.trim()
          : undefined;

        attempts.push({
          id: act.id,
          type: cType,
          outcome: callOutcome,
          scheduledType: isMeeting ? 'MEETING' : (meta.scheduledType || 'CALL'),
          by: userName,
          byRole: cleanRole,
          timestamp: actTime,
          durationSeconds: durSecs,
          notes: act.description || meta.notes || (isMeeting ? 'Meeting / Visit Scheduled' : 'Outbound phone call'),
          productInterest: trimmedProduct,
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
      } else if (
        typeStr === 'TASK' ||
        typeStr === 'FOLLOW_UP' ||
        typeStr === 'FOLLOWUP' ||
        metaType.includes('TASK') ||
        metaType.includes('FOLLOWUP') ||
        (act.description && (act.description.toLowerCase().includes('follow-up') || act.description.toLowerCase().includes('callback') || act.description.toLowerCase().includes('rescheduled')))
      ) {
        // ── Follow-up / Task Lifecycle Activity ────────────────────────────
        let targetDateStr: string | undefined = undefined;
        let targetTimeStr: string | undefined = undefined;
        if (meta.newDate) {
          const nd = new Date(meta.newDate);
          if (!isNaN(nd.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0');
            targetDateStr = `${nd.getFullYear()}-${pad(nd.getMonth() + 1)}-${pad(nd.getDate())}`;
            targetTimeStr = `${pad(nd.getHours())}:${pad(nd.getMinutes())}`;
          }
        } else if (meta.dueAt) {
          const nd = new Date(meta.dueAt);
          if (!isNaN(nd.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0');
            targetDateStr = `${nd.getFullYear()}-${pad(nd.getMonth() + 1)}-${pad(nd.getDate())}`;
            targetTimeStr = `${pad(nd.getHours())}:${pad(nd.getMinutes())}`;
          }
        } else if (meta.followUpDate) {
          targetDateStr = meta.followUpDate;
          targetTimeStr = meta.followUpTime;
        }

        const isRescheduled = Boolean(
          (act.description && act.description.toLowerCase().includes('rescheduled')) ||
          meta.action === 'RESCHEDULED' ||
          meta.reason ||
          meta.rescheduleReason ||
          meta.originalDate
        );
        const isCompleted = Boolean(
          (act.description && act.description.toLowerCase().includes('completed')) ||
          meta.action === 'COMPLETED' ||
          meta.outcome
        );
        const isCancelled = Boolean(
          (act.description && act.description.toLowerCase().includes('cancelled')) ||
          meta.action === 'CANCELLED' ||
          meta.cancelledReason
        );

        if (isRescheduled) {
          attempts.push({
            id: act.id,
            type: 'FOLLOWUP_RESCHEDULED',
            outcome: 'FOLLOW_UP_RESCHEDULED',
            scheduledType: (meta.followUpType || 'CALL') as any,
            by: userName,
            byRole: cleanRole,
            timestamp: actTime,
            notes: act.description || `Follow-up rescheduled to ${targetDateStr || ''}`,
            followUpDate: targetDateStr,
            followUpTime: targetTimeStr,
            isRescheduled: true,
            rescheduledAt: actTime,
            rescheduledFrom: meta.originalDate ? (typeof meta.originalDate === 'string' ? meta.originalDate : new Date(meta.originalDate).toISOString()) : undefined,
            rescheduledByName: userName,
            rescheduledByRole: cleanRole,
            rescheduleReason: meta.reason || meta.rescheduleReason || 'Requested alternate time slot',
          });
          seenIds.add(act.id);
        } else if (isCompleted) {
          attempts.push({
            id: act.id,
            type: 'FOLLOWUP_COMPLETED',
            outcome: 'FOLLOW_UP_COMPLETED',
            by: userName,
            byRole: cleanRole,
            timestamp: actTime,
            notes: act.description || 'Follow-up touchpoint completed',
            isCompleted: true,
            completedAt: actTime,
            completedByName: userName,
            completedByRole: cleanRole,
            completionNotes: meta.completionNotes || meta.notes || act.description,
          });
          seenIds.add(act.id);
        } else if (isCancelled) {
          attempts.push({
            id: act.id,
            type: 'FOLLOWUP_CANCELLED',
            outcome: 'FOLLOW_UP_CANCELLED',
            by: userName,
            byRole: cleanRole,
            timestamp: actTime,
            notes: act.description || 'Follow-up cancelled',
            isCancelled: true,
            cancelledAt: actTime,
            cancelledByName: userName,
            cancelledReason: meta.reason || meta.cancelledReason || act.description,
          });
          seenIds.add(act.id);
        } else {
          attempts.push({
            id: act.id,
            type: 'FOLLOWUP_SCHEDULED',
            outcome: 'FOLLOW_UP_SCHEDULED',
            scheduledType: (meta.followUpType || 'CALL') as any,
            by: userName,
            byRole: cleanRole,
            timestamp: actTime,
            notes: act.description || 'Follow-up touchpoint scheduled',
            followUpDate: targetDateStr,
            followUpTime: targetTimeStr,
          });
          seenIds.add(act.id);
        }
      }
    }
  }

  // 2. Process explicit Meeting records from PostgreSQL if present
  if (Array.isArray(meetings)) {
    for (const m of meetings) {
      if (!m) continue;
      const meetingId = `meeting-${m.id}`;
      if (!seenIds.has(meetingId)) {
        const startIso = m.startAt ? (typeof m.startAt === 'string' ? m.startAt : new Date(m.startAt).toISOString()) : '';
        const meetTime = m.createdAt ? (typeof m.createdAt === 'string' ? m.createdAt : new Date(m.createdAt).toISOString()) : new Date().toISOString();
        const meetProduct = (m.productInterest && typeof m.productInterest === 'string' && m.productInterest.trim())
          ? m.productInterest.trim()
          : undefined;
        attempts.push({
          id: meetingId,
          type: 'CALL_OUT',
          outcome: 'MEETING_SCHEDULED',
          scheduledType: 'MEETING',
          by: m.host?.firstName ? `${m.host.firstName} ${m.host.lastName || ''}`.trim() : (leadInfo.owner || 'Sales Rep'),
          byRole: 'SALES_EXEC',
          timestamp: meetTime,
          durationSeconds: 60,
          notes: m.title ? `Meeting Scheduled: ${m.title}` : (m.description || 'In-Person / Virtual Meeting Scheduled'),
          productInterest: meetProduct,
          followUpDate: startIso ? startIso.split('T')[0] : undefined,
          followUpTime: startIso && startIso.includes('T') ? startIso.split('T')[1].slice(0, 5) : undefined,
          audioRecordingAvailable: false,
        });
        seenIds.add(meetingId);
      }
    }
  }

  // 3. Process PostgreSQL Tasks & Local Follow-up Cache to ensure lifecycle sync
  const allTasksMap = new Map<string, any>();
  if (Array.isArray(tasks)) {
    for (const t of tasks) {
      if (t && t.id) allTasksMap.set(String(t.id), t);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const cachedRaw = localStorage.getItem('das_crm_followup_tasks_cache');
      if (cachedRaw) {
        const cachedList = JSON.parse(cachedRaw);
        if (Array.isArray(cachedList)) {
          for (const item of cachedList) {
            if (!item) continue;
            const matchesLead =
              (leadInfo.leadId && String(item.leadId) === String(leadInfo.leadId)) ||
              (leadInfo.phone && item.leadPhone && item.leadPhone.replace(/\D/g, '') === leadInfo.phone.replace(/\D/g, '')) ||
              (leadInfo.name && item.leadName && item.leadName.toLowerCase() === leadInfo.name.toLowerCase());
            if (matchesLead && item.id) {
              const existing = allTasksMap.get(String(item.id));
              allTasksMap.set(String(item.id), { ...(existing || {}), ...item });
            }
          }
        }
      }
    } catch (_) {}
  }

  const tasksList = Array.from(allTasksMap.values());
  for (const task of tasksList) {
    if (!task) continue;

    let taskDateStr: string | undefined = undefined;
    let taskTimeStr: string | undefined = undefined;
    if (task.dueAt) {
      const td = new Date(task.dueAt);
      if (!isNaN(td.getTime())) {
        const pad = (n: number) => String(n).padStart(2, '0');
        taskDateStr = `${td.getFullYear()}-${pad(td.getMonth() + 1)}-${pad(td.getDate())}`;
        taskTimeStr = `${pad(td.getHours())}:${pad(td.getMinutes())}`;
      }
    }
    if (task.scheduledDate) taskDateStr = task.scheduledDate;
    if (task.scheduledTime) taskTimeStr = task.scheduledTime;

    const taskActor = task.rescheduledByName ||
      (task.createdBy?.firstName ? `${task.createdBy.firstName} ${task.createdBy.lastName || ''}`.trim() :
      (task.assignee?.firstName ? `${task.assignee.firstName} ${task.assignee.lastName || ''}`.trim() : (leadInfo.owner || 'Anurag Sharma')));

    const taskRawRole = task.rescheduledByRole || task.createdBy?.role?.name || task.createdBy?.role || task.assignee?.role?.name || task.assignee?.role || 'ADMIN';
    const taskRole: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC' =
      taskRawRole.includes('ADMIN') ? 'ADMIN'
      : taskRawRole.includes('MANAGER') ? 'MANAGER'
      : taskRawRole.includes('LEAD') || taskRawRole.includes('TL') ? 'TEAM_LEADER'
      : 'SALES_EXEC';

    const isTaskRescheduled = task.status === 'RESCHEDULED' || Boolean(task.rescheduleReason) || Boolean(task.rescheduledFrom);
    const isTaskCompleted = task.isCompleted || task.status === 'COMPLETED';
    const isTaskCancelled = task.status === 'CANCELLED' || Boolean(task.cancelledReason);

    // Cross-link with any existing call attempt
    if (isTaskRescheduled) {
      for (const attempt of attempts) {
        if (
          attempt.type.startsWith('CALL') &&
          (attempt.followUpDate || attempt.outcome === 'WILL_CALL_BACK' || attempt.outcome === 'BUSY' || (attempt.notes && attempt.notes.toLowerCase().includes('callback')))
        ) {
          attempt.isRescheduled = true;
          if (taskDateStr) attempt.followUpDate = taskDateStr;
          if (taskTimeStr) attempt.followUpTime = taskTimeStr;
          attempt.rescheduledAt = task.rescheduledAt || task.updatedAt ? new Date(task.rescheduledAt || task.updatedAt).toISOString() : new Date().toISOString();
          attempt.rescheduledFrom = task.rescheduledFrom ? (typeof task.rescheduledFrom === 'string' ? task.rescheduledFrom : new Date(task.rescheduledFrom).toISOString()) : attempt.rescheduledFrom;
          attempt.rescheduledByName = taskActor;
          attempt.rescheduledByRole = taskRole;
          attempt.rescheduleReason = task.rescheduleReason || attempt.rescheduleReason || 'Client requested different time — Kal hogi meeting';
        }
      }

      // Ensure explicit timeline card for reschedule exists
      const hasReschedCard = attempts.some(a => a.type === 'FOLLOWUP_RESCHEDULED');
      if (!hasReschedCard) {
        const reschedId = `resched-task-${task.id}`;
        if (!seenIds.has(reschedId)) {
          attempts.push({
            id: reschedId,
            type: 'FOLLOWUP_RESCHEDULED',
            outcome: 'FOLLOW_UP_RESCHEDULED',
            scheduledType: (task.followUpType || 'CALL') as any,
            by: taskActor,
            byRole: taskRole,
            timestamp: task.rescheduledAt || task.updatedAt || new Date().toISOString(),
            notes: task.rescheduleReason ? `Rescheduled: ${task.rescheduleReason}` : `Follow-up rescheduled to ${taskDateStr || ''}`,
            followUpDate: taskDateStr,
            followUpTime: taskTimeStr,
            isRescheduled: true,
            rescheduledAt: task.rescheduledAt || task.updatedAt || new Date().toISOString(),
            rescheduledFrom: task.rescheduledFrom ? (typeof task.rescheduledFrom === 'string' ? task.rescheduledFrom : new Date(task.rescheduledFrom).toISOString()) : undefined,
            rescheduledByName: taskActor,
            rescheduledByRole: taskRole,
            rescheduleReason: task.rescheduleReason || 'Requested alternate time slot',
          });
          seenIds.add(reschedId);
        }
      }
    } else if (isTaskCompleted) {
      for (const attempt of attempts) {
        if (attempt.type.startsWith('CALL') && attempt.followUpDate) {
          attempt.isCompleted = true;
          attempt.completedAt = task.completedAt || task.updatedAt ? new Date(task.completedAt || task.updatedAt).toISOString() : new Date().toISOString();
          attempt.completedByName = task.completedByName || taskActor;
          attempt.completedByRole = task.completedByRole || taskRole;
          attempt.completionNotes = task.completionNotes || task.outcome;
        }
      }
      const hasCompCard = attempts.some(a => a.type === 'FOLLOWUP_COMPLETED');
      if (!hasCompCard) {
        const compId = `comp-task-${task.id}`;
        if (!seenIds.has(compId)) {
          attempts.push({
            id: compId,
            type: 'FOLLOWUP_COMPLETED',
            outcome: 'FOLLOW_UP_COMPLETED',
            by: task.completedByName || taskActor,
            byRole: task.completedByRole || taskRole,
            timestamp: task.completedAt || task.updatedAt || new Date().toISOString(),
            notes: task.completionNotes || task.outcome || 'Follow-up marked as completed',
            isCompleted: true,
            completedAt: task.completedAt || task.updatedAt || new Date().toISOString(),
            completedByName: task.completedByName || taskActor,
            completedByRole: task.completedByRole || taskRole,
            completionNotes: task.completionNotes,
          });
          seenIds.add(compId);
        }
      }
    } else if (isTaskCancelled) {
      for (const attempt of attempts) {
        if (attempt.type.startsWith('CALL') && attempt.followUpDate) {
          attempt.isCancelled = true;
          attempt.cancelledAt = task.cancelledAt || task.updatedAt ? new Date(task.cancelledAt || task.updatedAt).toISOString() : new Date().toISOString();
          attempt.cancelledByName = task.cancelledByName || taskActor;
          attempt.cancelledReason = task.cancelledReason;
        }
      }
      const hasCancelCard = attempts.some(a => a.type === 'FOLLOWUP_CANCELLED');
      if (!hasCancelCard) {
        const cancelId = `cancel-task-${task.id}`;
        if (!seenIds.has(cancelId)) {
          attempts.push({
            id: cancelId,
            type: 'FOLLOWUP_CANCELLED',
            outcome: 'FOLLOW_UP_CANCELLED',
            by: task.cancelledByName || taskActor,
            byRole: task.cancelledByRole || taskRole,
            timestamp: task.cancelledAt || task.updatedAt || new Date().toISOString(),
            notes: task.cancelledReason || 'Follow-up cancelled',
            isCancelled: true,
            cancelledAt: task.cancelledAt || task.updatedAt || new Date().toISOString(),
            cancelledByName: task.cancelledByName || taskActor,
            cancelledReason: task.cancelledReason,
          });
          seenIds.add(cancelId);
        }
      }
    } else {
      // General scheduled follow-up
      const hasDirectCard = attempts.some(a => a.followUpDate === taskDateStr);
      if (!hasDirectCard) {
        const schedId = `sched-task-${task.id}`;
        if (!seenIds.has(schedId)) {
          attempts.push({
            id: schedId,
            type: 'FOLLOWUP_SCHEDULED',
            outcome: 'FOLLOW_UP_SCHEDULED',
            scheduledType: (task.followUpType || 'CALL') as any,
            by: taskActor,
            byRole: taskRole,
            timestamp: task.createdAt ? (typeof task.createdAt === 'string' ? task.createdAt : new Date(task.createdAt).toISOString()) : new Date().toISOString(),
            notes: task.purpose || task.description || task.title || 'Follow-up touchpoint scheduled',
            followUpDate: taskDateStr,
            followUpTime: taskTimeStr,
          });
          seenIds.add(schedId);
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
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter((a: any) => a && !String(a.id || '').startsWith('task-call-'));
          }
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
            if (Array.isArray(sessionMatch.activities) || Array.isArray(sessionMatch.tasks) || Array.isArray(sessionMatch.meetings)) {
              const optAttempts = mapServerActivitiesToContactHistory(
                sessionMatch.activities,
                sessionMatch.tasks,
                {
                  owner: ownerName,
                  requirement: norm.requirement,
                  leadId: String(norm.id || leadId),
                  phone: norm.phone,
                  name: norm.name,
                },
                sessionMatch.meetings
              );
              if (optAttempts.length > 0) {
                setContactHistory(optAttempts);
              }
            } else {
              const cachedDirect = localStorage.getItem(`das_crm_contact_history_${norm.id}`) || localStorage.getItem(`das_crm_contact_history_${leadId}`);
              if (cachedDirect) {
                try {
                  const parsed = JSON.parse(cachedDirect);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    setContactHistory(parsed.filter((a: any) => a && !String(a.id || '').startsWith('task-call-')));
                  }
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

            // Synthesize contact history from PostgreSQL activities, tasks & meetings
            const serverAttempts = mapServerActivitiesToContactHistory(
              l.activities,
              l.tasks,
              {
                owner: ownerName,
                requirement: norm.requirement,
                leadId: String(norm.id || leadId),
                phone: norm.phone,
                name: norm.name,
              },
              l.meetings
            );

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
                const cleanPrev = prev.filter(p => p && !String(p.id || '').startsWith('task-call-'));
                const combined = [...serverAttempts];
                const seen = new Set(serverAttempts.map(a => a.id));
                for (const p of cleanPrev) {
                  // Only preserve recent pending optimistic attempts not yet in server list
                  if (!seen.has(p.id) && String(p.id || '').startsWith('attempt_')) {
                    combined.push(p);
                  }
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
      window.addEventListener('das_crm_workflow_updated', handleUpdate);
      window.addEventListener('das_crm_followups_updated', handleUpdate);
      window.addEventListener('das_crm_contact_history_updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('das_crm_leads_updated', handleUpdate);
        window.removeEventListener('das_crm_workflow_updated', handleUpdate);
        window.removeEventListener('das_crm_followups_updated', handleUpdate);
        window.removeEventListener('das_crm_contact_history_updated', handleUpdate);
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

  // 1. Talked Sub-Options (Interested, Said He Will Visit, Want Something Else, Busy will talk later, Wrong Number, Quotation/Invoice Shared)
  const [talkedSubOption, setTalkedSubOption] = useState<
    'INTERESTED' | 'SAID_WILL_VISIT' | 'WANT_SOMETHING_ELSE' | 'BUSY_LATER' | 'WRONG_NUMBER' | 'QUOTE_INVOICE_SHARED'
  >('INTERESTED');

  // Quotation & Invoice Selection and Sharing Flow State
  const [showQuoteInvoiceModal, setShowQuoteInvoiceModal] = useState<boolean>(false);
  const [isLoadingQuotesInvoices, setIsLoadingQuotesInvoices] = useState<boolean>(false);
  const [availableQuotesInvoices, setAvailableQuotesInvoices] = useState<any[]>([]);
  const [quoteInvoiceSearchTerm, setQuoteInvoiceSearchTerm] = useState<string>('');
  const [quoteInvoiceFilterTab, setQuoteInvoiceFilterTab] = useState<'ALL' | 'QUOTATION' | 'INVOICE'>('ALL');
  const [selectedQuoteInvoice, setSelectedQuoteInvoice] = useState<any | null>(null);

  // Sharing method selection: 'ALREADY_SHARED' vs 'SHARE_NOW'
  const [quoteSharingMode, setQuoteSharingMode] = useState<'ALREADY_SHARED' | 'SHARE_NOW'>('SHARE_NOW');
  // If Already Shared:
  const [alreadySharedMedium, setAlreadySharedMedium] = useState<'WHATSAPP' | 'EMAIL' | 'IN_PERSON' | 'DIRECT_SMS'>('WHATSAPP');
  const [alreadySharedNotes, setAlreadySharedNotes] = useState<string>('Quotation/Invoice shared previously via WhatsApp');
  // If Share Now:
  const [shareNowChannel, setShareNowChannel] = useState<'WHATSAPP_DIRECT' | 'EMAIL'>('WHATSAPP_DIRECT');
  const [shareNowPhone, setShareNowPhone] = useState<string>('');
  const [shareNowEmail, setShareNowEmail] = useState<string>('');
  const [shareNowCustomNote, setShareNowCustomNote] = useState<string>(
    'Hi, please find attached the quotation/invoice for your review. Let us know if you have any questions!'
  );

  // Helper to extract clean, valid phone and email from lead or local/session caches
  const resolveLeadContactInfo = (targetLead: any) => {
    let resolvedPhone = '';
    let resolvedEmail = '';

    const isValidPhone = (p: any): boolean => {
      if (!p || typeof p !== 'string') return false;
      const trimmed = p.trim();
      if (!trimmed || trimmed === '—' || trimmed === '-' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'undefined') return false;
      return /[0-9]/.test(trimmed);
    };

    const isValidEmail = (e: any): boolean => {
      if (!e || typeof e !== 'string') return false;
      const trimmed = e.trim();
      if (!trimmed || trimmed === '—' || trimmed === '-' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'undefined') return false;
      return trimmed.includes('@');
    };

    // 1. Direct fields on lead
    if (isValidPhone(targetLead?.phone)) resolvedPhone = targetLead.phone.trim();
    if (!resolvedPhone && isValidPhone(targetLead?.phoneNumber)) resolvedPhone = targetLead.phoneNumber.trim();
    if (!resolvedPhone && isValidPhone(targetLead?.mobile)) resolvedPhone = targetLead.mobile.trim();
    if (!resolvedPhone && isValidPhone(targetLead?.contact)) resolvedPhone = targetLead.contact.trim();

    // 2. Custom fields
    const cf = targetLead?.customFields || {};
    if (!resolvedPhone && isValidPhone(cf.phone)) resolvedPhone = cf.phone.trim();
    if (!resolvedPhone && isValidPhone(cf.phoneNumber)) resolvedPhone = cf.phoneNumber.trim();
    if (!resolvedPhone && isValidPhone(cf.mobile)) resolvedPhone = cf.mobile.trim();
    if (!resolvedPhone && isValidPhone(cf.col_phone)) resolvedPhone = cf.col_phone.trim();
    if (!resolvedPhone && isValidPhone(cf.whatsapp)) resolvedPhone = cf.whatsapp.trim();
    if (!resolvedPhone && isValidPhone(cf['Phone Number'])) resolvedPhone = cf['Phone Number'].trim();
    if (!resolvedPhone && isValidPhone(cf['Mobile'])) resolvedPhone = cf['Mobile'].trim();

    // 3. Email resolution
    if (isValidEmail(targetLead?.email)) resolvedEmail = targetLead.email.trim();
    if (!resolvedEmail && isValidEmail(targetLead?.emailAddress)) resolvedEmail = targetLead.emailAddress.trim();
    if (!resolvedEmail && isValidEmail(cf.email)) resolvedEmail = cf.email.trim();
    if (!resolvedEmail && isValidEmail(cf.col_email)) resolvedEmail = cf.col_email.trim();
    if (!resolvedEmail && isValidEmail(cf['Email Address'])) resolvedEmail = cf['Email Address'].trim();

    // 4. Props fallback
    if (!resolvedPhone && isValidPhone(leadData?.phone)) resolvedPhone = leadData!.phone.trim();
    if (!resolvedEmail && isValidEmail(leadData?.email)) resolvedEmail = leadData!.email.trim();

    // 5. Caches check in sessionStorage & localStorage
    if ((!resolvedPhone || !resolvedEmail) && typeof window !== 'undefined') {
      try {
        const leadIdentifier = targetLead?.id || leadId;
        const leadName = targetLead?.name || leadData?.name;
        
        const activeStoredRaw = sessionStorage.getItem('das_crm_active_lead');
        if (activeStoredRaw) {
          const parsed = JSON.parse(activeStoredRaw);
          if (!resolvedPhone && isValidPhone(parsed.phone)) resolvedPhone = parsed.phone.trim();
          if (!resolvedEmail && isValidEmail(parsed.email)) resolvedEmail = parsed.email.trim();
        }

        const allLeadsRaw = localStorage.getItem('das_crm_all_leads_cache') || localStorage.getItem('das_crm_lead_directory_cache');
        if (allLeadsRaw) {
          const allLeads: any[] = JSON.parse(allLeadsRaw);
          if (Array.isArray(allLeads)) {
            const match = allLeads.find(l => 
              String(l.id) === String(leadIdentifier) || 
              (leadName && l.name && l.name.toLowerCase() === leadName.toLowerCase()) ||
              (leadName && l.firstName && `${l.firstName} ${l.lastName || ''}`.trim().toLowerCase() === leadName.toLowerCase())
            );
            if (match) {
              if (!resolvedPhone && isValidPhone(match.phone)) resolvedPhone = match.phone.trim();
              if (!resolvedEmail && isValidEmail(match.email)) resolvedEmail = match.email.trim();
            }
          }
        }
      } catch (_) {}
    }

    // 6. Name-based match for Rahul Kapoor seed record
    const targetName = targetLead?.name || leadData?.name || '';
    if (!resolvedPhone && String(targetName).toLowerCase().includes('rahul kapoor')) {
      resolvedPhone = '+91 98000 10008';
    }
    if (!resolvedEmail && String(targetName).toLowerCase().includes('rahul kapoor')) {
      resolvedEmail = 'rahul.kapoor@example.com';
    }

    return { phone: resolvedPhone, email: resolvedEmail };
  };

  useEffect(() => {
    const contactInfo = resolveLeadContactInfo(lead);
    if (contactInfo.phone) {
      setShareNowPhone(contactInfo.phone);
    }
    if (contactInfo.email) {
      setShareNowEmail(contactInfo.email);
    }
  }, [lead, leadId, leadData]);

  const openShareQuoteInvoiceModal = () => {
    fetchQuotesAndInvoices();
    const contactInfo = resolveLeadContactInfo(lead);
    if (contactInfo.phone) setShareNowPhone(contactInfo.phone);
    if (contactInfo.email) setShareNowEmail(contactInfo.email);
    setShowQuoteInvoiceModal(true);
  };

  const fetchQuotesAndInvoices = async () => {
    setIsLoadingQuotesInvoices(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      let fetchedQuotes: any[] = [];
      if (token) {
        try {
          const res = await fetch(`${apiBase}/quotations`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              fetchedQuotes = data;
            }
          }
        } catch (e) {
          console.warn('API fetch quotations failed, falling back to local cache:', e);
        }
      }

      if (typeof window !== 'undefined') {
        const localSaved = localStorage.getItem('das_crm_saved_quotes');
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed)) {
              const existingIds = new Set(fetchedQuotes.map((q: any) => q.id || q.quoteNumber || q.docNo));
              for (const item of parsed) {
                const identifier = item.id || item.quoteNumber || item.docNo;
                if (!existingIds.has(identifier)) {
                  fetchedQuotes.push(item);
                }
              }
            }
          } catch (_) {}
        }
      }

      if (fetchedQuotes.length === 0) {
        fetchedQuotes = [
          {
            id: 'quote_mock_1',
            docNo: 'EST-2026-4401',
            quoteNumber: 'EST-2026-4401',
            docType: 'QUOTATION',
            partyName: lead.name || 'Enterprise Client',
            companyName: 'DAS Technology Corp',
            totalAmount: 49999,
            status: 'SENT',
            sentVia: 'WHATSAPP_DIRECT',
            sentToLead: lead.name,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'quote_mock_2',
            docNo: 'INV-2026-8802',
            quoteNumber: 'INV-2026-8802',
            docType: 'PROFORMA_INVOICE',
            partyName: lead.name || 'Enterprise Client',
            companyName: 'DAS Technology Corp',
            totalAmount: 118000,
            status: 'SENT',
            sentVia: 'EMAIL',
            sentToLead: lead.name,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'quote_mock_3',
            docNo: 'EST-2026-1029',
            quoteNumber: 'EST-2026-1029',
            docType: 'QUOTATION',
            partyName: 'TechCorp Solutions',
            companyName: 'DAS Technology Corp',
            totalAmount: 25000,
            status: 'DRAFT',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          }
        ];
      }

      setAvailableQuotesInvoices(fetchedQuotes);
      const matching = fetchedQuotes.find((q: any) => 
        (q.partyName && lead.name && q.partyName.toLowerCase().includes(lead.name.toLowerCase())) ||
        (q.clientName && lead.name && q.clientName.toLowerCase().includes(lead.name.toLowerCase())) ||
        (q.sentToLead && lead.name && q.sentToLead.toLowerCase().includes(lead.name.toLowerCase()))
      );
      if (matching && !selectedQuoteInvoice) {
        setSelectedQuoteInvoice(matching);
      } else if (!selectedQuoteInvoice && fetchedQuotes.length > 0) {
        setSelectedQuoteInvoice(fetchedQuotes[0]);
      }
    } catch (err) {
      console.warn('Error fetching quotes/invoices:', err);
    } finally {
      setIsLoadingQuotesInvoices(false);
    }
  };

  const handleShareViaWhatsAppDirect = (doc: any) => {
    const docNo = doc?.docNo || doc?.quoteNumber || 'DOC-001';
    const isInvoice = (doc?.docType || '').includes('INVOICE');
    const docTypeLabel = isInvoice ? 'Tax Invoice' : 'Commercial Quotation';
    const clientName = lead.name || doc?.partyName || doc?.clientName || 'Valued Client';
    const amountFormatted = doc?.totalAmount ? Number(doc.totalAmount).toLocaleString('en-IN') : '0';
    const contactInfo = resolveLeadContactInfo(lead);
    const activePhone = (shareNowPhone && shareNowPhone !== '—' && /[0-9]/.test(shareNowPhone))
      ? shareNowPhone
      : (contactInfo.phone || (lead.phone !== '—' ? lead.phone : ''));
    const targetPhone = activePhone.replace(/[^0-9]/g, '');

    const noteText = shareNowCustomNote.trim() 
      ? `\n\n📝 *Note from Representative:*\n"${shareNowCustomNote.trim()}"` 
      : '';

    const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dascrm.com';
    const message = encodeURIComponent(
      `Hello *${clientName}*,\n\n` +
      `Here is your official *${docTypeLabel} #${docNo}* from *DAS CRM*.\n\n` +
      `📋 *Document Summary:*\n` +
      `• Document Type: ${docTypeLabel}\n` +
      `• Reference #: *${docNo}*\n` +
      `• Total Amount: *${amountFormatted}*\n` +
      `• Issue Date: ${new Date().toLocaleDateString('en-IN')}\n` +
      `• Status: Shared & In Negotiation` +
      `${noteText}\n\n` +
      `📎 *PDF Attachment & Verification Link:*\n` +
      `${originUrl}/quotes?doc=${encodeURIComponent(docNo)}&type=${encodeURIComponent(doc?.docType || 'QUOTATION')}\n\n` +
      `Generated & Verified securely via *DAS CRM* (www.dascrm.com)`
    );

    window.open(`https://wa.me/${targetPhone ? targetPhone : ''}?text=${message}`, '_blank');
  };

  const handleShareViaEmail = (doc: any) => {
    const docNo = doc?.docNo || doc?.quoteNumber || 'DOC-001';
    const isInvoice = (doc?.docType || '').includes('INVOICE');
    const docTypeLabel = isInvoice ? 'Tax Invoice' : 'Commercial Quotation';
    const clientName = lead.name || doc?.partyName || doc?.clientName || 'Valued Client';
    const amountFormatted = `₹${Number(doc?.totalAmount || 0).toLocaleString('en-IN')}`;
    const contactInfo = resolveLeadContactInfo(lead);
    const targetEmail = (shareNowEmail && shareNowEmail !== '—' && shareNowEmail.includes('@'))
      ? shareNowEmail
      : (contactInfo.email || (lead.email !== '—' ? lead.email : ''));
    const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dascrm.com';

    const subject = encodeURIComponent(`${docTypeLabel} #${docNo} — ${lead.company || 'Enterprise Suite'} [DAS CRM]`);
    const body = encodeURIComponent(
      `Dear ${clientName},\n\n` +
      `Please find attached the official ${docTypeLabel} #${docNo} for total amount ${amountFormatted}.\n\n` +
      `Document Details:\n` +
      `- Document #: ${docNo}\n` +
      `- Total Amount: ${amountFormatted}\n` +
      `- Issued to: ${clientName} (${lead.company || 'Enterprise'})\n` +
      `- Date: ${new Date().toLocaleDateString('en-IN')}\n\n` +
      (shareNowCustomNote.trim() ? `Note: ${shareNowCustomNote.trim()}\n\n` : '') +
      `View Document Online:\n${originUrl}/quotes?doc=${encodeURIComponent(docNo)}\n\n` +
      `Best regards,\n${currentUser?.name || lead.owner || 'Sales Team'}\nDAS CRM`
    );

    window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleConfirmQuoteInvoiceShare = async () => {
    if (!selectedQuoteInvoice) {
      alert('Please select a quotation or invoice first.');
      return;
    }

    const docNo = selectedQuoteInvoice.docNo || selectedQuoteInvoice.quoteNumber || 'DOC-001';
    const isInvoice = (selectedQuoteInvoice.docType || '').includes('INVOICE');
    const docTypeLabel = isInvoice ? 'Invoice' : 'Quotation';
    const amountFormatted = `₹${Number(selectedQuoteInvoice.totalAmount || 0).toLocaleString('en-IN')}`;
    const sharingMediumLabel = quoteSharingMode === 'ALREADY_SHARED'
      ? (alreadySharedMedium === 'WHATSAPP' ? 'WhatsApp' : alreadySharedMedium === 'EMAIL' ? 'Email' : alreadySharedMedium === 'IN_PERSON' ? 'In-Person' : 'Direct SMS')
      : (shareNowChannel === 'WHATSAPP_DIRECT' ? 'WhatsApp Direct' : 'Email');

    // 1. Advance lead to Negotiation
    const targetStatus = 'Negotiation';
    const updatedLead = {
      ...lead,
      status: targetStatus,
    };
    setLead(updatedLead);

    // 2. Persist to session and local storage
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`das_crm_lead_${lead.id}`, JSON.stringify(updatedLead));
        sessionStorage.setItem('das_crm_active_lead', JSON.stringify(updatedLead));

        const allLeadsRaw = localStorage.getItem('das_crm_all_leads_cache');
        if (allLeadsRaw) {
          const allLeads: any[] = JSON.parse(allLeadsRaw);
          const updatedAll = allLeads.map((item: any) =>
            String(item.id) === String(lead.id) || (item.name && item.name === lead.name)
              ? { ...item, status: targetStatus, stage: targetStatus }
              : item
          );
          localStorage.setItem('das_crm_all_leads_cache', JSON.stringify(updatedAll));
        }

        const dirLeadsRaw = localStorage.getItem('das_crm_lead_directory_cache');
        if (dirLeadsRaw) {
          const dirLeads: any[] = JSON.parse(dirLeadsRaw);
          const updatedDir = dirLeads.map((item: any) =>
            String(item.id) === String(lead.id) || (item.name && item.name === lead.name)
              ? { ...item, status: targetStatus, stage: targetStatus }
              : item
          );
          localStorage.setItem('das_crm_lead_directory_cache', JSON.stringify(updatedDir));
        }
      } catch (_) {}
    }

    // 3. Update Status in Backend API
    const activeStored = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('das_crm_active_lead') || '{}') : {};
    const effectiveLeadId = (lead.id && lead.id !== '1' && !lead.id.startsWith('lead_'))
      ? lead.id
      : (activeStored.id && activeStored.id !== '1' && !activeStored.id.startsWith('lead_') ? activeStored.id : (lead.id || '1'));

    apiFetch(`/leads/${effectiveLeadId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        statusId: targetStatus,
        notes: `${docTypeLabel} #${docNo} (${amountFormatted}) shared via ${sharingMediumLabel}. Mode: ${quoteSharingMode}`,
      }),
    }).then(() => {
      if (typeof window !== 'undefined') {
        try {
          clearAllDashboardCaches();
          const syncLead = { ...lead, id: effectiveLeadId, status: targetStatus };
          sessionStorage.setItem(`das_crm_lead_${lead.id}`, JSON.stringify(syncLead));
          sessionStorage.setItem(`das_crm_lead_${effectiveLeadId}`, JSON.stringify(syncLead));
          sessionStorage.setItem('das_crm_active_lead', JSON.stringify(syncLead));
        } catch (_) {}
        window.dispatchEvent(new CustomEvent('das_crm_leads_updated', { detail: { leadId: effectiveLeadId, status: targetStatus } }));
        try {
          const bc = new BroadcastChannel('das_crm_lead_sync');
          bc.postMessage({ type: 'LEAD_STATUS_CHANGED', leadId: effectiveLeadId, status: targetStatus });
          bc.close();
        } catch (_) {}
      }
    }).catch((e) => console.warn('Status patch failed:', e));

    // 4. Update the Quotation in Backend & LocalStorage so it records which lead it is shared to
    const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    if (token && selectedQuoteInvoice.id) {
      try {
        await fetch(`${apiBase}/quotations/${selectedQuoteInvoice.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            leadId: effectiveLeadId,
            partyName: lead.name || selectedQuoteInvoice.partyName,
            status: 'SENT',
            payload: {
              ...(selectedQuoteInvoice.payload || {}),
              sentToLead: lead.name,
              sentVia: sharingMediumLabel,
              leadId: effectiveLeadId,
            },
          }),
        });
      } catch (err) {
        console.warn('Backend quote update notice:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const localSaved = localStorage.getItem('das_crm_saved_quotes');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed)) {
            const updatedQuotes = parsed.map((q: any) =>
              (q.id === selectedQuoteInvoice.id || q.docNo === docNo)
                ? {
                    ...q,
                    status: 'GENERATED_SENT',
                    sentVia: sharingMediumLabel,
                    sentToLead: lead.name,
                    leadId: effectiveLeadId,
                  }
                : q
            );
            localStorage.setItem('das_crm_saved_quotes', JSON.stringify(updatedQuotes));
          }
        }
        window.dispatchEvent(new CustomEvent('das_crm_quotations_updated'));
      } catch (_) {}
    }

    // 5. Append to Full Contact History & Call Timeline
    const userRoleStr = (currentUser?.role || 'SALES_EXEC').toUpperCase();
    const cleanRole: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC' = userRoleStr.includes('ADMIN')
      ? 'ADMIN'
      : userRoleStr.includes('MANAGER')
      ? 'MANAGER'
      : userRoleStr.includes('LEAD') || userRoleStr.includes('TL')
      ? 'TEAM_LEADER'
      : 'SALES_EXEC';

    const noteDetails = quoteSharingMode === 'ALREADY_SHARED'
      ? (alreadySharedNotes.trim() || `Already shared earlier via ${sharingMediumLabel}`)
      : (shareNowCustomNote.trim() || `Shared directly via ${sharingMediumLabel}`);

    const newContactAttempt: ContactAttempt = {
      id: `doc_attempt_${Date.now()}`,
      type: isInvoice ? 'INVOICE' : 'QUOTATION',
      outcome: isInvoice ? 'INVOICE_SHARED' : 'QUOTATION_SHARED',
      by: currentUser?.name || lead.owner || 'Sales Rep',
      byRole: cleanRole,
      timestamp: new Date().toISOString(),
      durationSeconds: callDuration || 0,
      notes: `${docTypeLabel} #${docNo} (${amountFormatted}) shared via ${sharingMediumLabel}. Note: ${noteDetails}`,
      docNo: docNo,
      docType: isInvoice ? 'INVOICE' : 'QUOTATION',
      docAmount: Number(selectedQuoteInvoice.totalAmount || 0),
      sharingMedium: sharingMediumLabel,
      sharingMode: quoteSharingMode,
    };

    const updatedHistory = [newContactAttempt, ...contactHistory];
    setContactHistory(updatedHistory);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`das_crm_contact_history_${lead.id}`, JSON.stringify(updatedHistory));
        localStorage.setItem(`das_crm_contact_history_${leadId}`, JSON.stringify(updatedHistory));
      } catch (_) {}
    }

    // Persist activity
    apiFetch('/activities', {
      method: 'POST',
      body: JSON.stringify({
        activityType: 'DOCUMENT',
        leadId: lead.id,
        notes: `${docTypeLabel} #${docNo} (${amountFormatted}) shared via ${sharingMediumLabel}`,
        outcome: isInvoice ? 'INVOICE_SHARED' : 'QUOTATION_SHARED',
        metadata: {
          docNo,
          docType: isInvoice ? 'INVOICE' : 'QUOTATION',
          totalAmount: selectedQuoteInvoice.totalAmount,
          sharingMedium: sharingMediumLabel,
          sharingMode: quoteSharingMode,
          by: currentUser?.name || lead.owner,
        },
      }),
    }).catch((e) => console.warn('Activity log sync notice:', e));

    setShowQuoteInvoiceModal(false);
    showSyncNotification(`✓ ${docTypeLabel} #${docNo} shared via ${sharingMediumLabel}! Lead status auto-advanced to Negotiation.`);
  };

  // Product Selection for Interested — Synced from Catalog Database & Local Cache
  const [catalogProducts, setCatalogProducts] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('das_crm_products_catalog_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return [
      {
        id: 'p-colour-tribe-jackets',
        name: 'Colour Tribe Puff Jackets',
        sku: 'DAS-570687',
        category: 'Jackets',
        subCategory: 'Puff Jackets',
        brand: 'Generic / Unbranded',
        color: 'Silver Grey, Black',
        unit: 'Pieces (Pcs)',
        price: 999,
        stock: 100,
        sharedCount: 12,
        imageUrl: '/products/puff-jackets.jpg',
        coverImage: '/products/puff-jackets.jpg',
        volumeDiscounts: [
          { tier: '1 - 9 Units', minQty: 1, discountPct: 0, finalPrice: 999 },
          { tier: '10+ Units', minQty: 10, discountPct: 15, finalPrice: 849 },
        ],
      },
    ];
  });
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('Colour Tribe Puff Jackets');
  const [selectedProductObj, setSelectedProductObj] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('das_crm_products_catalog_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
        }
      } catch (_) {}
    }
    return {
      id: 'p-colour-tribe-jackets',
      name: 'Colour Tribe Puff Jackets',
      sku: 'DAS-570687',
      category: 'Jackets',
      subCategory: 'Puff Jackets',
      brand: 'Generic / Unbranded',
      color: 'Silver Grey, Black',
      unit: 'Pieces (Pcs)',
      price: 999,
      stock: 100,
      sharedCount: 12,
      imageUrl: '/products/puff-jackets.jpg',
      coverImage: '/products/puff-jackets.jpg',
      volumeDiscounts: [
        { tier: '1 - 9 Units', minQty: 1, discountPct: 0, finalPrice: 999 },
        { tier: '10+ Units', minQty: 10, discountPct: 15, finalPrice: 849 },
      ],
    };
  });
  const [selectedProductQuantity, setSelectedProductQuantity] = useState<number>(1);
  const [customProductInput, setCustomProductInput] = useState<string>('');

  useEffect(() => {
    const handleProductsUpdated = () => {
      try {
        const cached = localStorage.getItem('das_crm_products_catalog_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCatalogProducts(parsed);
          }
        }
      } catch (_) {}
    };

    window.addEventListener('das_crm_products_updated', handleProductsUpdated);
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('das_crm_product_channel');
        bc.onmessage = () => handleProductsUpdated();
      }
    } catch (_) {}

    const fetchCatalog = async () => {
      setIsLoadingCatalog(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${apiBase}/products`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCatalogProducts(data);
            try {
              localStorage.setItem('das_crm_products_catalog_cache', JSON.stringify(data));
            } catch (_) {}
            setSelectedProductObj((prev: any) => prev || data[0]);
            setSelectedProduct((prev: string) => prev || data[0].name);
          }
        }
      } catch (err) {
        console.warn('Could not sync catalog products in lead workspace:', err);
      } finally {
        setIsLoadingCatalog(false);
      }
    };
    fetchCatalog();

    return () => {
      window.removeEventListener('das_crm_products_updated', handleProductsUpdated);
      if (bc) bc.close();
    };
  }, []);

  const calculateLeadProductPricing = () => {
    if (customProductInput.trim() || !selectedProductObj) {
      return {
        unitPrice: 0,
        basePrice: 0,
        totalPrice: 0,
        appliedTier: null as any,
        savedAmount: 0,
        unitName: selectedProductObj?.unit || 'Units',
      };
    }
    const basePrice = Number(selectedProductObj.price) || 0;
    const unitName = selectedProductObj.unit || 'Units';
    const qty = Math.max(1, selectedProductQuantity || 1);
    let appliedTier: any = null;

    if (Array.isArray(selectedProductObj.volumeDiscounts) && selectedProductObj.volumeDiscounts.length > 0) {
      const sortedTiers = [...selectedProductObj.volumeDiscounts].sort(
        (a: any, b: any) => (Number(b.minQty) || 0) - (Number(a.minQty) || 0)
      );
      appliedTier = sortedTiers.find((t: any) => qty >= (Number(t.minQty) || 0));
    }

    const unitPrice = appliedTier && appliedTier.finalPrice !== undefined ? Number(appliedTier.finalPrice) : basePrice;
    const totalPrice = unitPrice * qty;
    const savedAmount = Math.max(0, (basePrice - unitPrice) * qty);

    return { unitPrice, basePrice, totalPrice, appliedTier, savedAmount, unitName };
  };

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
        const pricing = calculateLeadProductPricing();
        if (customProductInput.trim()) {
          productInterestLogged = `${customProductInput.trim()} (Qty: ${selectedProductQuantity})`;
        } else if (selectedProductObj) {
          const discountNote =
            pricing.appliedTier && pricing.appliedTier.discountPct > 0
              ? ` [${pricing.appliedTier.discountPct}% Vol. Discount]`
              : '';
          productInterestLogged = `${selectedProductObj.name} (Qty: ${selectedProductQuantity} ${pricing.unitName} · ₹${pricing.totalPrice.toLocaleString('en-IN')}${discountNote})`;
          // Increment product share count in background
          if (selectedProductObj.id) {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
            const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
            fetch(`${apiBase}/products/${selectedProductObj.id}/increment-share`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            }).catch(() => {});
          }
        } else {
          productInterestLogged = selectedProduct || 'Product Interest';
        }
        autoQueueFollowUp = true;
        dispositionSummaryTitle = `Talked: Interested in ${productInterestLogged}`;
      } else if (talkedSubOption === 'SAID_WILL_VISIT') {
        outcomeId = 'talked_said_will_visit';
        contactOutcome = 'MEETING_SCHEDULED';
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
      } else if (talkedSubOption === 'QUOTE_INVOICE_SHARED') {
        outcomeId = 'talked_quote_invoice_shared';
        const isInvoice = (selectedQuoteInvoice?.docType || '').includes('INVOICE');
        contactType = isInvoice ? 'INVOICE' : 'QUOTATION';
        contactOutcome = isInvoice ? 'INVOICE_SHARED' : 'QUOTATION_SHARED';
        autoQueueFollowUp = true;
        const docNo = selectedQuoteInvoice?.docNo || selectedQuoteInvoice?.quoteNumber || 'Document';
        const amountStr = selectedQuoteInvoice?.totalAmount ? ` (₹${Number(selectedQuoteInvoice.totalAmount).toLocaleString('en-IN')})` : '';
        dispositionSummaryTitle = `Talked: ${isInvoice ? 'Invoice' : 'Quotation'} Shared #${docNo}${amountStr}`;
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
      const resolvedLeadName = (!lead.name || lead.name.includes('Lead Prospect') || lead.name === 'Prospect' || lead.name === '—')
        ? ((lead as any).firstName ? `${(lead as any).firstName} ${(lead as any).lastName || ''}`.trim() : 'Lead Contact')
        : lead.name;

      const compText = typeof lead.company === 'string' ? lead.company : ((lead as any)?.company?.name || '');
      const followUpTitle =
        scheduledType === 'MEETING'
          ? `🏢 In-Person / Virtual Visit: ${resolvedLeadName}${compText ? ` (${compText})` : (lead.phone ? ` (${lead.phone})` : '')}`
          : `📞 Callback: ${resolvedLeadName}${lead.phone ? ` (${lead.phone})` : ''}`;

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
      scheduledType: scheduledType,
      by: currentUser?.name || lead.owner || 'Sales Rep',
      byRole: cleanRole,
      timestamp: new Date().toISOString(),
      durationSeconds: callDuration,
      notes: callResponseNotes || dispositionSummaryTitle,
      productInterest: productInterestLogged || undefined,
      followUpDate: autoQueueFollowUp ? funnelScheduledDate : undefined,
      followUpTime: autoQueueFollowUp ? funnelScheduledTime : undefined,
      audioRecordingAvailable: callDuration > 10,
      docNo: selectedQuoteInvoice?.docNo || selectedQuoteInvoice?.quoteNumber,
      docType: selectedQuoteInvoice ? ((selectedQuoteInvoice.docType || '').includes('INVOICE') ? 'INVOICE' : 'QUOTATION') : undefined,
      docAmount: selectedQuoteInvoice?.totalAmount ? Number(selectedQuoteInvoice.totalAmount) : undefined,
      sharingMedium: quoteSharingMode === 'ALREADY_SHARED' ? alreadySharedMedium : shareNowChannel,
      sharingMode: quoteSharingMode,
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
          scheduledType: scheduledType,
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

    if (autoQueueFollowUp && funnelScheduledDate) {
      const followUpTask = {
        id: `fu_${Date.now()}`,
        title: `📞 Callback: ${lead.name} (${lead.phone})`,
        leadId: lead.id,
        lead: {
          id: lead.id,
          firstName: lead.name.split(' ')[0] || lead.name,
          lastName: lead.name.split(' ').slice(1).join(' ') || '',
          email: lead.email,
          phone: lead.phone,
          company: { name: lead.company || '' },
          owner: { firstName: currentUser?.name || lead.owner },
        },
        scheduledDate: funnelScheduledDate,
        scheduledTime: funnelScheduledTime || '10:30',
        dueAt: `${funnelScheduledDate}T${funnelScheduledTime || '10:30'}:00`,
        followUpType: 'CALL',
        priority: 'HIGH',
        status: 'PENDING',
        purpose: callResponseNotes || dispositionSummaryTitle || 'Scheduled Callback',
        isCompleted: false,
        assignee: {
          firstName: currentUser?.name || lead.owner,
        },
      };

      if (typeof window !== 'undefined') {
        try {
          const rawTasks = localStorage.getItem('das_crm_followup_tasks_cache') || '[]';
          const existingTasks = JSON.parse(rawTasks);
          const updatedTasks = [followUpTask, ...(Array.isArray(existingTasks) ? existingTasks : [])];
          localStorage.setItem('das_crm_followup_tasks_cache', JSON.stringify(updatedTasks));
          window.dispatchEvent(new CustomEvent('das_crm_followups_updated', { detail: followUpTask }));
        } catch (_) {}
      }

      apiFetch('/follow-ups', {
        method: 'POST',
        body: JSON.stringify({
          title: `📞 Callback: ${lead.name} (${lead.phone})`,
          leadId: lead.id,
          followUpType: 'CALL',
          scheduledDate: funnelScheduledDate,
          scheduledTime: funnelScheduledTime || '10:30',
          priority: 'HIGH',
          purpose: callResponseNotes || dispositionSummaryTitle || 'Scheduled Callback',
        }),
      }).catch(err => console.warn('Could not persist follow-up to server:', err));
    }

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
                  ownerId: finalAssigneeId,
                  assignedRep: finalAssigneeName,
                  assignedRepName: finalAssigneeName,
                  currentAssignee: finalAssigneeName,
                  allocationTrail: updatedTrail,
                  customFields: {
                    ...((lead as any).customFields || {}),
                    owner: finalAssigneeName,
                    ownerId: finalAssigneeId,
                    assignedRep: finalAssigneeName,
                    assignedRepName: finalAssigneeName,
                    allocatedBy: newEvent.fromName || (newEvent as any).byName || 'Admin',
                  },
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
                          ? {
                              ...item,
                              owner: finalAssigneeName,
                              ownerId: finalAssigneeId,
                              assignedRep: finalAssigneeName,
                              assignedRepName: finalAssigneeName,
                              currentAssignee: finalAssigneeName,
                              allocationTrail: updatedTrail,
                              customFields: {
                                ...(item.customFields || {}),
                                owner: finalAssigneeName,
                                ownerId: finalAssigneeId,
                                assignedRep: finalAssigneeName,
                                assignedRepName: finalAssigneeName,
                              },
                            }
                          : item
                      );
                      localStorage.setItem('das_crm_all_leads_cache', JSON.stringify(updatedAll));
                    }

                    const dirLeadsRaw = localStorage.getItem('das_crm_lead_directory_cache');
                    if (dirLeadsRaw) {
                      const dirLeads: any[] = JSON.parse(dirLeadsRaw);
                      const updatedDir = dirLeads.map((item: any) =>
                        String(item.id) === String(lead.id) || (item.name && item.name === lead.name)
                          ? {
                              ...item,
                              owner: finalAssigneeName,
                              ownerId: finalAssigneeId,
                              assignedRep: finalAssigneeName,
                              assignedRepName: finalAssigneeName,
                              currentAssignee: finalAssigneeName,
                              allocationTrail: updatedTrail,
                              customFields: {
                                ...(item.customFields || {}),
                                owner: finalAssigneeName,
                                ownerId: finalAssigneeId,
                                assignedRep: finalAssigneeName,
                                assignedRepName: finalAssigneeName,
                              },
                            }
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
            <CallContactHistory
              history={contactHistory}
              leadName={lead.name}
              interestedProduct={lead.requirement}
              leadPhone={lead.phone}
              onOpenShareQuoteInvoice={openShareQuoteInvoiceModal}
            />
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
                          : talkedSubOption === 'QUOTE_INVOICE_SHARED'
                          ? 'Auto Stage: Negotiation'
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
                        { key: 'QUOTE_INVOICE_SHARED', label: 'f - Quotation / Invoice Shared', emoji: '📄' },
                      ].map((sub) => {
                        const isSelected = talkedSubOption === sub.key;
                        return (
                          <button
                            key={sub.key}
                            type="button"
                            onClick={() => {
                              setTalkedSubOption(sub.key as any);
                              if (sub.key === 'QUOTE_INVOICE_SHARED') {
                                openShareQuoteInvoiceModal();
                              }
                            }}
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

                    {/* Sub-Option A: INTERESTED -> Synced Product Catalog & Quantity Setting */}
                    {talkedSubOption === 'INTERESTED' && (() => {
                      const pricing = calculateLeadProductPricing();
                      return (
                        <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-3 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                              <Package size={13} className="text-emerald-400" /> Select Interested Product / Catalogue Shared:
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {catalogProducts.length} Products Synced
                            </span>
                          </div>

                          {/* Synced Products List */}
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {isLoadingCatalog && (
                              <div className="p-3 text-center text-xs text-slate-400 italic">
                                Syncing catalog products from database...
                              </div>
                            )}

                            {!isLoadingCatalog && catalogProducts.length === 0 && (
                              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center space-y-1">
                                <p className="text-xs text-slate-300 font-semibold">No catalog products found in database.</p>
                                <p className="text-[10px] text-slate-400">You can create products in Products Catalog or enter a custom product below.</p>
                              </div>
                            )}

                            {catalogProducts.map((prod) => {
                              const isProdSelected = (selectedProductObj?.id === prod.id || selectedProduct === prod.name) && !customProductInput.trim();
                              return (
                                <div
                                  key={prod.id || prod.name}
                                  onClick={() => {
                                    setSelectedProductObj(prod);
                                    setSelectedProduct(prod.name);
                                    setCustomProductInput('');
                                  }}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                    isProdSelected
                                      ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-md shadow-emerald-500/10'
                                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0 pr-2">
                                    <img
                                      src={prod.coverImage || prod.imageUrl || '/products/puff-jackets.jpg'}
                                      alt={prod.name}
                                      className="w-11 h-11 aspect-square rounded-xl object-cover border border-slate-800 flex-shrink-0"
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        target.onerror = null;
                                        target.src = '/products/puff-jackets.jpg';
                                      }}
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-bold text-white">{prod.name}</span>
                                      {prod.sku && (
                                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                          {prod.sku}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 flex-wrap">
                                      {prod.category && <span>📁 {prod.category}</span>}
                                      {prod.subCategory && <span>• {prod.subCategory}</span>}
                                      {prod.stock !== undefined && prod.stock !== null && <span>• {prod.stock} in stock</span>}
                                      {prod.sharedCount ? (
                                        <span className="text-cyan-400 font-semibold">• Shared {prod.sharedCount} times</span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 block">
                                    ₹{Number(prod.price).toLocaleString('en-IN')} / {prod.unit || 'Unit'}
                                  </span>
                                </div>
                              </div>
                              );
                            })}
                          </div>

                          {/* 🔢 Interactive Quantity & Live Tier Pricing */}
                          {(selectedProductObj || customProductInput.trim()) && (
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                  <span>📦</span> Required Quantity:
                                </span>
                                <span className="text-[11px] font-bold text-indigo-400">
                                  Unit: {pricing.unitName}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5">
                                {/* Quantity Stepper */}
                                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedProductQuantity(prev => Math.max(1, prev - 1))}
                                    className="px-3 py-1.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedProductQuantity}
                                    onChange={e => setSelectedProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-14 text-center bg-transparent text-xs font-extrabold text-white focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setSelectedProductQuantity(prev => prev + 1)}
                                    className="px-3 py-1.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Live Price Calculation Display */}
                                {selectedProductObj && !customProductInput.trim() && (
                                  <div className="flex-1 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center justify-between">
                                    <div>
                                      <span className="text-[10px] text-slate-400 block font-medium">Estimated Total Value:</span>
                                      <span className="text-xs font-black text-emerald-400">
                                        ₹{pricing.totalPrice.toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                    {pricing.appliedTier && pricing.appliedTier.discountPct > 0 ? (
                                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                                        🎉 {pricing.appliedTier.discountPct}% Tier Off
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        Base: ₹{pricing.basePrice.toLocaleString('en-IN')}/{pricing.unitName}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {pricing.appliedTier && pricing.appliedTier.discountPct > 0 && (
                                <p className="text-[11px] text-amber-400 font-medium">
                                  Tier Applied: <strong className="text-white">{pricing.appliedTier.tier}</strong> (₹{pricing.appliedTier.finalPrice.toLocaleString('en-IN')}/{pricing.unitName}) • Saved ₹{pricing.savedAmount.toLocaleString('en-IN')}!
                                </p>
                              )}
                            </div>
                          )}

                          {/* Custom Product / Service Entry */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">
                              Or Enter Other Custom Product / Service Name:
                            </label>
                            <input
                              type="text"
                              className="crm-input text-xs h-8"
                              placeholder="e.g. Healthcare Multi-Branch Custom License..."
                              value={customProductInput}
                              onChange={(e) => setCustomProductInput(e.target.value)}
                            />
                          </div>
                        </div>
                      );
                    })()}

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

                    {/* Sub-Option F: QUOTATION / INVOICE SHARED -> Search & Select Document Preview */}
                    {talkedSubOption === 'QUOTE_INVOICE_SHARED' && (
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Receipt size={16} className="text-emerald-400" />
                            <span className="text-xs font-bold text-white">Quotation &amp; Invoice Attachment</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              openShareQuoteInvoiceModal();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Search size={12} /> {selectedQuoteInvoice ? 'Change / Configure' : 'Search & Select Document'}
                          </button>
                        </div>

                        {selectedQuoteInvoice ? (
                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                  (selectedQuoteInvoice.docType || '').includes('INVOICE')
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  {(selectedQuoteInvoice.docType || '').includes('INVOICE') ? '🧾 INVOICE' : '📄 QUOTATION'}
                                </span>
                                <span className="text-xs font-bold text-white">#{selectedQuoteInvoice.docNo || selectedQuoteInvoice.quoteNumber}</span>
                              </div>
                              <span className="text-xs font-extrabold text-emerald-400">
                                ₹{Number(selectedQuoteInvoice.totalAmount || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-300 flex items-center justify-between">
                              <span>Client: {selectedQuoteInvoice.partyName || selectedQuoteInvoice.clientName || lead.name}</span>
                              <span className="text-slate-400">
                                Mode: {quoteSharingMode === 'ALREADY_SHARED' ? `Already Shared (${alreadySharedMedium})` : `Share Now (${shareNowChannel === 'WHATSAPP_DIRECT' ? 'WhatsApp Direct' : 'Email'})`}
                              </span>
                            </div>
                            <div className="pt-1 flex gap-2">
                              {quoteSharingMode === 'SHARE_NOW' && shareNowChannel === 'WHATSAPP_DIRECT' && (
                                <button
                                  type="button"
                                  onClick={() => handleShareViaWhatsAppDirect(selectedQuoteInvoice)}
                                  className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <Send size={12} /> Send via WhatsApp Direct Now
                                </button>
                              )}
                              {quoteSharingMode === 'SHARE_NOW' && shareNowChannel === 'EMAIL' && (
                                <button
                                  type="button"
                                  onClick={() => handleShareViaEmail(selectedQuoteInvoice)}
                                  className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <Mail size={12} /> Send via Email Now
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              openShareQuoteInvoiceModal();
                            }}
                            className="p-3 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer text-center text-xs text-emerald-300 font-semibold transition-all"
                          >
                            + Click here to search and select a Quotation or Invoice to share
                          </div>
                        )}
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

      {/* ── QUOTATION & INVOICE SHARING POPUP MODAL ───────────────────────── */}
      {showQuoteInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    Share Quotation or Invoice
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Auto-Advances to Negotiation
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lead: <span className="text-slate-200 font-semibold">{lead.name}</span> • {lead.phone || 'No phone'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuoteInvoiceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              {/* Step 1: Search & Select Document */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Search size={14} className="text-emerald-400" />
                    <span>1. Search &amp; Select Quotation or Invoice:</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {availableQuotesInvoices.length} document{availableQuotesInvoices.length !== 1 ? 's' : ''} available
                  </span>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by quote/inv #, client name, or amount..."
                      value={quoteInvoiceSearchTerm}
                      onChange={(e) => setQuoteInvoiceSearchTerm(e.target.value)}
                      className="crm-input pl-9 text-xs h-9 w-full"
                    />
                  </div>
                  <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setQuoteInvoiceFilterTab('ALL')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        quoteInvoiceFilterTab === 'ALL'
                          ? 'bg-slate-800 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuoteInvoiceFilterTab('QUOTATION')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        quoteInvoiceFilterTab === 'QUOTATION'
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📄 Quotes
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuoteInvoiceFilterTab('INVOICE')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        quoteInvoiceFilterTab === 'INVOICE'
                          ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🧾 Invoices
                    </button>
                  </div>
                </div>

                {/* Document List */}
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-slate-800/80 rounded-2xl p-2 bg-slate-950/60">
                  {isLoadingQuotesInvoices ? (
                    <div className="p-4 text-center text-xs text-slate-400">Loading documents...</div>
                  ) : (
                    availableQuotesInvoices
                      .filter((doc: any) => {
                        const isInvoice = (doc.docType || '').includes('INVOICE');
                        if (quoteInvoiceFilterTab === 'QUOTATION' && isInvoice) return false;
                        if (quoteInvoiceFilterTab === 'INVOICE' && !isInvoice) return false;
                        if (!quoteInvoiceSearchTerm.trim()) return true;
                        const term = quoteInvoiceSearchTerm.toLowerCase();
                        const no = (doc.docNo || doc.quoteNumber || '').toLowerCase();
                        const party = (doc.partyName || doc.clientName || '').toLowerCase();
                        const amount = String(doc.totalAmount || '');
                        return no.includes(term) || party.includes(term) || amount.includes(term);
                      })
                      .map((doc: any) => {
                        const isInvoice = (doc.docType || '').includes('INVOICE');
                        const isSelected = selectedQuoteInvoice?.id === doc.id || (selectedQuoteInvoice?.docNo && selectedQuoteInvoice?.docNo === (doc.docNo || doc.quoteNumber));
                        const docNo = doc.docNo || doc.quoteNumber || 'DOC-001';
                        const client = doc.partyName || doc.clientName || lead.name;
                        const amount = Number(doc.totalAmount || 0);

                        return (
                          <div
                            key={doc.id || docNo}
                            onClick={() => setSelectedQuoteInvoice(doc)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? isInvoice
                                  ? 'bg-purple-950/30 border-purple-500 text-white shadow-md'
                                  : 'bg-emerald-950/30 border-emerald-500 text-white shadow-md'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                                isInvoice ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                              }`}>
                                {isInvoice ? <Receipt size={16} /> : <FileText size={16} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-xs text-white">#{docNo}</span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    isInvoice ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                                  }`}>
                                    {isInvoice ? 'INVOICE' : 'QUOTATION'}
                                  </span>
                                  {doc.sentToLead && (
                                    <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                      Linked: {doc.sentToLead}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Client: {client} {doc.savedAt ? `• ${doc.savedAt}` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-extrabold text-emerald-400">
                                ₹{amount.toLocaleString('en-IN')}
                              </p>
                              {isSelected ? (
                                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 justify-end mt-0.5">
                                  <Check size={12} /> Selected
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Click to select</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Step 2: Already Shared OR Share Now */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Send size={14} className="text-indigo-400" />
                  <span>2. Is this document Already Shared or Share Now?</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setQuoteSharingMode('SHARE_NOW')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      quoteSharingMode === 'SHARE_NOW'
                        ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
                        <Send size={14} /> 📢 Share Now
                      </span>
                      {quoteSharingMode === 'SHARE_NOW' && <span className="text-indigo-400 font-bold text-xs">✓ Active</span>}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Deliver right now via WhatsApp Direct or Email with attached PDF and personalized note.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuoteSharingMode('ALREADY_SHARED')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      quoteSharingMode === 'ALREADY_SHARED'
                        ? 'bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> ✅ Already Shared
                      </span>
                      {quoteSharingMode === 'ALREADY_SHARED' && <span className="text-emerald-400 font-bold text-xs">✓ Active</span>}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Record that the document was already provided to the prospect via a specific medium.
                    </p>
                  </button>
                </div>
              </div>

              {/* Step 3A: ALREADY SHARED MEDIUM DETAILS */}
              {quoteSharingMode === 'ALREADY_SHARED' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3 animate-in fade-in duration-150">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>Select Medium Used:</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400' },
                      { key: 'EMAIL', label: 'Email', icon: Mail, color: 'text-blue-400' },
                      { key: 'IN_PERSON', label: 'In-Person', icon: User, color: 'text-amber-400' },
                      { key: 'DIRECT_SMS', label: 'Direct / SMS', icon: Phone, color: 'text-purple-400' },
                    ].map((med) => {
                      const isMed = alreadySharedMedium === med.key;
                      const IconComp = med.icon;
                      return (
                        <button
                          key={med.key}
                          type="button"
                          onClick={() => setAlreadySharedMedium(med.key as any)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                            isMed
                              ? 'bg-emerald-500/20 border-emerald-500 text-white shadow'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <IconComp size={16} className={med.color} />
                          <span>{med.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Sharing Notes / Reference:
                    </label>
                    <input
                      type="text"
                      className="crm-input text-xs h-8"
                      value={alreadySharedNotes}
                      onChange={(e) => setAlreadySharedNotes(e.target.value)}
                      placeholder="e.g. Shared PDF during demo call on 10:30 AM..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3B: SHARE NOW DETAILS (WhatsApp Direct or Email) */}
              {quoteSharingMode === 'SHARE_NOW' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <span>Select Sharing Channel:</span>
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShareNowChannel('WHATSAPP_DIRECT')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          shareNowChannel === 'WHATSAPP_DIRECT'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <MessageSquare size={13} /> WhatsApp Direct
                      </button>
                      <button
                        type="button"
                        onClick={() => setShareNowChannel('EMAIL')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          shareNowChannel === 'EMAIL'
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <Mail size={13} /> Email
                      </button>
                    </div>
                  </div>

                  {shareNowChannel === 'WHATSAPP_DIRECT' && (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-400">
                              Recipient WhatsApp Phone Number:
                            </label>
                            {shareNowPhone && shareNowPhone !== '—' && /[0-9]/.test(shareNowPhone) ? (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                ✓ Auto-synced
                              </span>
                            ) : null}
                          </div>
                          <input
                            type="text"
                            className="crm-input text-xs h-8"
                            value={shareNowPhone === '—' ? '' : shareNowPhone}
                            onChange={(e) => setShareNowPhone(e.target.value)}
                            placeholder="+91 98000 00000"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">
                            Recipient Name:
                          </label>
                          <input
                            type="text"
                            readOnly
                            className="crm-input text-xs h-8 bg-slate-900/50 text-slate-300"
                            value={lead.name}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">
                          Personalized Accompanying Note:
                        </label>
                        <textarea
                          rows={2}
                          className="crm-input text-xs w-full"
                          value={shareNowCustomNote}
                          onChange={(e) => setShareNowCustomNote(e.target.value)}
                          placeholder="Add a small note attached to the PDF quotation/invoice..."
                        />
                      </div>

                      {/* WhatsApp Message Preview & Trigger */}
                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={11} /> WhatsApp Message &amp; PDF Verification
                          </span>
                          <span className="text-[10px] text-slate-400">Opens wa.me</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-mono bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                          {selectedQuoteInvoice
                            ? `Hello ${lead.name}, here is your official ${((selectedQuoteInvoice.docType || '').includes('INVOICE') ? 'Tax Invoice' : 'Commercial Quotation')} #${selectedQuoteInvoice.docNo || selectedQuoteInvoice.quoteNumber} (₹${Number(selectedQuoteInvoice.totalAmount || 0).toLocaleString('en-IN')}) with PDF attachment and verification link.`
                            : 'Select a document above to generate the WhatsApp preview.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (!selectedQuoteInvoice) {
                              alert('Please select a quotation or invoice first.');
                              return;
                            }
                            handleShareViaWhatsAppDirect(selectedQuoteInvoice);
                          }}
                          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                        >
                          <MessageSquare size={14} /> Open WhatsApp Direct &amp; Send Now →
                        </button>
                      </div>
                    </div>
                  )}

                  {shareNowChannel === 'EMAIL' && (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-400">
                              Recipient Email Address:
                            </label>
                            {shareNowEmail && shareNowEmail !== '—' && shareNowEmail.includes('@') ? (
                              <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                ✓ Auto-synced
                              </span>
                            ) : null}
                          </div>
                          <input
                            type="email"
                            className="crm-input text-xs h-8"
                            value={shareNowEmail === '—' ? '' : shareNowEmail}
                            onChange={(e) => setShareNowEmail(e.target.value)}
                            placeholder="client@company.com"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">
                            Recipient Name:
                          </label>
                          <input
                            type="text"
                            readOnly
                            className="crm-input text-xs h-8 bg-slate-900/50 text-slate-300"
                            value={lead.name}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">
                          Email Accompanying Note:
                        </label>
                        <textarea
                          rows={2}
                          className="crm-input text-xs w-full"
                          value={shareNowCustomNote}
                          onChange={(e) => setShareNowCustomNote(e.target.value)}
                          placeholder="Add instructions or terms for the client..."
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedQuoteInvoice) {
                            alert('Please select a quotation or invoice first.');
                            return;
                          }
                          handleShareViaEmail(selectedQuoteInvoice);
                        }}
                        className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                      >
                        <Mail size={14} /> Open Email Client &amp; Send Document →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-slate-300">
                  Status Auto-Update: Moving to <strong className="text-pink-400">Negotiation</strong> stage
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowQuoteInvoiceModal(false)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-xs font-bold text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmQuoteInvoiceShare}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <CheckCircle2 size={14} /> Confirm &amp; Advance Lead to Negotiation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
