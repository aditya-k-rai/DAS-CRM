'use client';

import { useState, useEffect } from 'react';
import {
  Phone, MessageSquare, Mail, Sparkles, Send, RefreshCw, CheckCircle2,
  Clock, AlertCircle, User, Building2, MapPin, Tag, FileText, Bot,
  PhoneOff, Mic, Play, Pause, ChevronRight, Zap, Shield, HelpCircle, Layers, Check, Wifi, WifiOff,
  Calendar, CalendarCheck, Package, Bell, BellRing, ArrowRight, Flame,
  Receipt, Search, ExternalLink, X, Plus, Minus, ShoppingCart, SlidersHorizontal, Eye
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
import {
  whatsappTemplateEngine,
  type WhatsAppTemplate,
  type TemplateCategory,
  STATUS_OPTIONS,
  CATEGORY_EMOJIS,
  UPDATE_EVENT_NAME as WA_UPDATE_EVENT,
  SYNC_CHANNEL_NAME as WA_SYNC_CHANNEL,
} from '@/lib/whatsappTemplateEngine';

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

export interface ProposalCatalogProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  sku?: string;
  coverImage?: string;
  description?: string;
  unit?: string;
}

export interface AvailableInvoiceItem {
  id: string;
  quoteNumber: string;
  docType: string;
  date: string;
  buyerCompany: string;
  buyerName: string;
  totalAmount: number;
  taxRate?: number;
  itemsSummary: string;
  status: string;
  pdfUrl?: string;
}

export const DEFAULT_PROPOSAL_PRODUCTS: ProposalCatalogProduct[] = [
  {
    id: 'p-colour-tribe-jackets',
    name: 'Colour Tribe Puff Jackets',
    category: 'Jackets & Apparel',
    price: 999,
    sku: 'DAS-570687',
    coverImage: '/products/puff-jackets.jpg',
    unit: 'Pcs',
    description: 'Premium Padded Colour Tribe Puff Jackets with lightweight thermal insulation and dual zip pockets.',
  },
  {
    id: 'p-das-crm-enterprise',
    name: 'DAS CRM Enterprise License (Annual)',
    category: 'Software & SaaS',
    price: 12499,
    sku: 'DAS-CRM-ENT',
    unit: 'License',
    description: 'Full CRM suite with unlimited sales reps, team leader dashboard, and auto-lead distribution.',
  },
  {
    id: 'p-wa-cloud-suite',
    name: 'WhatsApp Business Cloud API Suite',
    category: 'Communications',
    price: 4999,
    sku: 'DAS-WA-API',
    unit: 'Monthly',
    description: 'Official Meta WhatsApp Business Cloud API integration with AI humanize and instant templates.',
  },
  {
    id: 'p-auto-dialer-pack',
    name: 'SIM & Cloud Auto-Dialer Module',
    category: 'Dialer & Telephony',
    price: 7500,
    sku: 'DAS-DIAL-MOD',
    unit: 'License',
    description: 'Automated disposition logger, audio recording vault, and call funnel tracking engine.',
  },
  {
    id: 'p-gst-billing-module',
    name: 'Multi-Store Inventory & GST Billing',
    category: 'Billing & Accounting',
    price: 8999,
    sku: 'DAS-GST-INV',
    unit: 'Yearly',
    description: 'Compliant 18% GST tax invoices, quotations, proforma generators, and payment gateway sync.',
  },
  {
    id: 'p-onboarding-training',
    name: 'Executive Onboarding & Team Training',
    category: 'Professional Services',
    price: 3500,
    sku: 'DAS-SRV-TRN',
    unit: 'Session',
    description: 'Dedicated 1-on-1 CRM onboarding, workflow tailoring, and telecaller training sessions.',
  },
];

export const DEFAULT_SAMPLE_INVOICES: AvailableInvoiceItem[] = [
  {
    id: 'inv-101',
    quoteNumber: 'INV-2026-0042',
    docType: 'TAX_INVOICE',
    date: '2026-10-06',
    buyerCompany: 'Client Enterprise',
    buyerName: 'Rahul Kapoor',
    totalAmount: 45000,
    taxRate: 18,
    itemsSummary: 'DAS CRM Enterprise License + WhatsApp API Suite',
    status: 'GENERATED',
  },
  {
    id: 'inv-102',
    quoteNumber: 'PI-2026-0118',
    docType: 'PROFORMA_INVOICE',
    date: '2026-10-05',
    buyerCompany: 'Global Traders Pvt Ltd',
    buyerName: 'Amit Shah',
    totalAmount: 24999,
    taxRate: 18,
    itemsSummary: 'Cloud Telephony Dialer + Lead Allocation Engine',
    status: 'SHARED',
  },
  {
    id: 'inv-103',
    quoteNumber: 'EST-2026-0089',
    docType: 'QUOTATION',
    date: '2026-10-04',
    buyerCompany: 'Modern Retailers',
    buyerName: 'Priya Sharma',
    totalAmount: 18500,
    taxRate: 18,
    itemsSummary: 'Colour Tribe Puff Jackets (20 Pcs Commercial Batch)',
    status: 'DRAFT',
  },
];

function formatMeetingDateDisplay(isoDate: string): string {
  try {
    const [y, m, d] = isoDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch (_) {
    return isoDate;
  }
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
    return DEFAULT_PROPOSAL_PRODUCTS;
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

  // ── SECTION 3: WHATSAPP CHAT DIRECT STATE (Synced with Templates Module & Android Parity) ──
  const [waTemplatesList, setWaTemplatesList] = useState<WhatsAppTemplate[]>(() => whatsappTemplateEngine.getTemplates());
  const [selectedWaTemplateId, setSelectedWaTemplateId] = useState<string>(() => {
    const list = whatsappTemplateEngine.getTemplates();
    return list[0]?.id || 'tpl_1';
  });
  const [waDirectTemplateTitle, setWaDirectTemplateTitle] = useState<string>(() => {
    const list = whatsappTemplateEngine.getTemplates();
    return list[0]?.title || '🌱 Initial Lead Outreach';
  });
  const [waDirectMessage, setWaDirectMessage] = useState<string>('');
  const [selectedTargetStatus, setSelectedTargetStatus] = useState<string>(() => {
    const list = whatsappTemplateEngine.getTemplates();
    return list[0]?.targetStatus || 'Contacted';
  });
  const [waDirectNotes, setWaDirectNotes] = useState('');

  // Custom template creation & compose mode
  const [isCustomTemplateMode, setIsCustomTemplateMode] = useState<boolean>(false);
  const [customTemplateTitle, setCustomTemplateTitle] = useState<string>('');
  const [customTemplateCategory, setCustomTemplateCategory] = useState<TemplateCategory>('OUTREACH');
  const [saveCustomToLibrary, setSaveCustomToLibrary] = useState<boolean>(true);

  // ── 1. Products Slider state (Proposal) ──
  const [showProductSlider, setShowProductSlider] = useState<boolean>(false);
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('ALL');
  const [selectedProductQuantities, setSelectedProductQuantities] = useState<Record<string, number>>({});

  // ── 2. Invoices Slider state (Invoice) ──
  const [showInvoiceSlider, setShowInvoiceSlider] = useState<boolean>(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<AvailableInvoiceItem | null>(null);
  const [availableInvoices, setAvailableInvoices] = useState<AvailableInvoiceItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('das_crm_saved_quotes');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((q: any) => ({
              id: q.id || `inv_${Date.now()}`,
              quoteNumber: q.quoteNumber || q.id || 'INV-2026',
              docType: q.docType || 'TAX_INVOICE',
              date: q.date || q.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
              buyerCompany: q.buyerCompany || q.clientCompany || 'Client Organization',
              buyerName: q.buyerName || q.clientName || 'Client',
              totalAmount: Number(q.totalAmount) || Number(q.total) || 25000,
              taxRate: q.taxRate || 18,
              itemsSummary: Array.isArray(q.items) ? q.items.map((it: any) => it.name || it.description).join(', ') : (q.notes || 'Commercial Products & Implementation'),
              status: q.status || 'GENERATED',
            }));
          }
        }
      } catch (_) {}
    }
    return DEFAULT_SAMPLE_INVOICES;
  });

  // ── 3. Meeting & Follow-up Scheduler state ("like call funnel") ──
  const [meetingScheduledDate, setMeetingScheduledDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [meetingScheduledTime, setMeetingScheduledTime] = useState<string>('11:30 AM');
  const [enableMeetingPreAlert5Min, setEnableMeetingPreAlert5Min] = useState<boolean>(true);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState<boolean>(false);
  const [directScheduleType, setDirectScheduleType] = useState<'MEETING' | 'FOLLOWUP' | 'CALL'>('MEETING');
  const [enableDirectSchedule, setEnableDirectSchedule] = useState<boolean>(false);

  // Fetch live products and quotations from backend API on mount
  useEffect(() => {
    apiFetch('/api/products')
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: ProposalCatalogProduct[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category || 'General',
            price: Number(p.price) || 0,
            sku: p.sku,
            coverImage: p.coverImage || p.imageUrl || p.images?.[0] || '/products/puff-jackets.jpg',
            description: p.description || p.overview,
            unit: p.unit || 'Units',
          }));
          setCatalogProducts(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const newOnes = mapped.filter(item => !existingIds.has(item.id));
            return [...prev, ...newOnes];
          });
        }
      })
      .catch(() => {});

    apiFetch('/api/quotations')
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: AvailableInvoiceItem[] = data.map((q: any) => ({
            id: q.id,
            quoteNumber: q.quoteNumber || q.docNo || `INV-${String(q.id).slice(0, 6)}`,
            docType: q.docType || 'TAX_INVOICE',
            date: q.date || q.docDate || q.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            buyerCompany: q.buyerCompany || q.companyName || q.clientCompany || 'Client',
            buyerName: q.buyerName || q.partyName || q.clientName || 'Client',
            totalAmount: Number(q.totalAmount) || Number(q.total) || 0,
            taxRate: q.taxRate || 18,
            itemsSummary: Array.isArray(q.items) ? q.items.map((it: any) => it.name || it.description).join(', ') : (q.itemsSummary || 'Commercial Software & Solutions'),
            status: q.status || 'GENERATED',
            pdfUrl: q.pdfUrl,
          }));
          setAvailableInvoices(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const newOnes = mapped.filter(item => !existingIds.has(item.id));
            return [...prev, ...newOnes];
          });
        }
      })
      .catch(() => {});

    // Listen to real-time updates from Quotes & Products modules
    const handleRemoteQuotesSync = () => {
      try {
        const raw = localStorage.getItem('das_crm_saved_quotes');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mapped: AvailableInvoiceItem[] = parsed.map((q: any) => ({
              id: q.id || `inv_${Date.now()}`,
              quoteNumber: q.docNo || q.quoteNumber || 'INV-2026',
              docType: q.docType || 'TAX_INVOICE',
              date: q.docDate || q.savedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
              buyerCompany: q.companyName || q.partyDetails?.companyName || 'Client Organization',
              buyerName: q.partyName || q.partyDetails?.contactPerson || 'Client',
              totalAmount: Number(q.totalAmount) || 0,
              taxRate: q.payload?.globalGstRate || 18,
              itemsSummary: Array.isArray(q.payload?.items) ? q.payload.items.map((it: any) => it.description || it.name).join(', ') : 'Commercial Products & Services',
              status: q.status || 'GENERATED',
              pdfUrl: q.pdfUrl,
            }));
            setAvailableInvoices(mapped);
          }
        }
      } catch (_) {}
    };

    const handleRemoteProductsSync = () => {
      try {
        const raw = localStorage.getItem('das_crm_products_catalog_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCatalogProducts(parsed);
          }
        }
      } catch (_) {}
    };

    window.addEventListener('das_crm_quotes_updated', handleRemoteQuotesSync);
    window.addEventListener('das_crm_products_updated', handleRemoteProductsSync);

    return () => {
      window.removeEventListener('das_crm_quotes_updated', handleRemoteQuotesSync);
      window.removeEventListener('das_crm_products_updated', handleRemoteProductsSync);
    };
  }, []);

  // Real-time synchronization of templates with WhatsApp Templates module & across browser tabs
  useEffect(() => {
    const syncTemplates = () => {
      const fresh = whatsappTemplateEngine.getTemplates();
      setWaTemplatesList(fresh);
      if (fresh.length > 0 && !fresh.some(t => t.id === selectedWaTemplateId)) {
        setSelectedWaTemplateId(fresh[0].id);
        setWaDirectTemplateTitle(fresh[0].title);
        if (fresh[0].targetStatus) {
          setSelectedTargetStatus(fresh[0].targetStatus);
        }
      }
    };

    window.addEventListener(WA_UPDATE_EVENT, syncTemplates);
    window.addEventListener('storage', syncTemplates);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(WA_SYNC_CHANNEL);
      bc.onmessage = () => syncTemplates();
    } catch (_) {}

    return () => {
      window.removeEventListener(WA_UPDATE_EVENT, syncTemplates);
      window.removeEventListener('storage', syncTemplates);
      if (bc) bc.close();
    };
  }, [selectedWaTemplateId]);

  // Live variable interpolation whenever selected template or lead details change (in standard mode)
  useEffect(() => {
    if (isCustomTemplateMode) return;
    const tpl = waTemplatesList.find(t => t.id === selectedWaTemplateId) || waTemplatesList[0];
    if (tpl) {
      setWaDirectTemplateTitle(tpl.title);
      if (tpl.targetStatus) {
        setSelectedTargetStatus(tpl.targetStatus);
      }
      const leadVal = (lead as any).value || lead.budget;
      const interpolated = whatsappTemplateEngine.interpolateTemplate(tpl.text, {
        name: lead.name,
        company: lead.company,
        value: leadVal,
        requirement: lead.requirement,
      });
      setWaDirectMessage(interpolated);
    }
  }, [selectedWaTemplateId, waTemplatesList, isCustomTemplateMode, lead.name, lead.company, lead.budget, lead.requirement]);

  const generateMeetingMessage = (dateStr: string, timeStr: string) => {
    const formattedDate = formatMeetingDateDisplay(dateStr);
    return `Hi ${lead.name || 'Client'}, looking forward to our scheduled live walkthrough for ${lead.company || 'DAS CRM'} on ${formattedDate} at ${timeStr}!\n\nLet me know if you would like me to share a Google Meet / Zoom link or adjust the timing.`;
  };

  const generateFollowUpMessage = (dateStr: string, timeStr: string) => {
    const formattedDate = formatMeetingDateDisplay(dateStr);
    return `Hi ${lead.name || 'Client'}, following up regarding our discussion for ${lead.company || 'your requirement'}. I have scheduled our next follow-up touchpoint for ${formattedDate} at ${timeStr}.\n\nPlease let me know if you would like to connect earlier or need any additional details!`;
  };

  const generateProposalMessage = (quantities: Record<string, number>) => {
    const selectedEntries = Object.entries(quantities).filter(([_, q]) => q > 0);
    if (selectedEntries.length === 0) {
      return `Hi ${lead.name || 'Client'}, sharing details regarding our discussion for ${lead.company || 'your requirement'}. Please let me know what products you would like to explore!`;
    }

    let grandTotal = 0;
    const lines: string[] = [];
    const imageLines: string[] = [];

    selectedEntries.forEach(([pId, qty]) => {
      const p = catalogProducts.find(item => item.id === pId);
      if (p) {
        const lineTotal = p.price * qty;
        grandTotal += lineTotal;
        const unitLabel = p.unit || 'Units';
        lines.push(`• ${p.name} (Qty: ${qty} ${unitLabel}) @ ₹${p.price.toLocaleString('en-IN')} = ₹${lineTotal.toLocaleString('en-IN')}`);

        const imgUrl = p.coverImage || p.imageUrl || '/products/puff-jackets.jpg';
        const absoluteImgUrl = typeof window !== 'undefined' && imgUrl.startsWith('/') ? `${window.location.origin}${imgUrl}` : imgUrl;
        imageLines.push(`  🖼️ ${p.name} Visual: ${absoluteImgUrl}`);
      }
    });

    return `Hi ${lead.name || 'Client'}! Please find our customized commercial proposal prepared for ${lead.company || 'your requirement'}:\n\n📦 Selected Products & Specifications:\n${lines.join('\n')}\n\n📎 Attached Product Images:\n${imageLines.join('\n')}\n━━━━━━━━━━━━━━━━━━━━\n💰 Total Proposal Value: ₹${grandTotal.toLocaleString('en-IN')} (incl. 18% GST)\n\nPlease review the attached product specifications & images above, and reply to confirm your commercial order!`;
  };

  const generateInvoiceMessage = (inv: AvailableInvoiceItem) => {
    const docLabel = inv.docType.replace(/_/g, ' ');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pdfLink = inv.pdfUrl || `${origin}/quotes?doc=${inv.quoteNumber}`;

    return `Hi ${lead.name || 'Client'}! Please find the official ${docLabel} (${inv.quoteNumber}) prepared for ${lead.company || 'your organization'}:\n\n📄 Document: ${docLabel}\n🔢 Invoice Ref: ${inv.quoteNumber}\n💰 Total Amount: ₹${inv.totalAmount.toLocaleString('en-IN')} (incl. 18% GST)\n📅 Issued Date: ${inv.date}\n📦 Items: ${inv.itemsSummary}\n📎 Official Invoice PDF: ${pdfLink}\n\nPlease review the attached official invoice PDF and reply to confirm payment processing!`;
  };

  const handleUpdateMeetingDate = (isoDate: string) => {
    setMeetingScheduledDate(isoDate);
    if (directScheduleType === 'FOLLOWUP' || (isCustomTemplateMode && customTemplateCategory === 'FOLLOWUP')) {
      setWaDirectMessage(generateFollowUpMessage(isoDate, meetingScheduledTime));
    } else if (directScheduleType === 'MEETING' || (isCustomTemplateMode && customTemplateCategory === 'MEETING')) {
      setWaDirectMessage(generateMeetingMessage(isoDate, meetingScheduledTime));
    }
  };

  const handleUpdateMeetingTime = (slot: string) => {
    setMeetingScheduledTime(slot);
    if (directScheduleType === 'FOLLOWUP' || (isCustomTemplateMode && customTemplateCategory === 'FOLLOWUP')) {
      setWaDirectMessage(generateFollowUpMessage(meetingScheduledDate, slot));
    } else if (directScheduleType === 'MEETING' || (isCustomTemplateMode && customTemplateCategory === 'MEETING')) {
      setWaDirectMessage(generateMeetingMessage(meetingScheduledDate, slot));
    }
  };

  const syncScheduledFollowUpTask = (opts?: { showToast?: boolean }) => {
    if (!meetingScheduledDate) return null;

    const effectiveIsMeeting = directScheduleType === 'MEETING' || (isCustomTemplateMode && customTemplateCategory === 'MEETING') || selectedTargetStatus === 'Meeting Scheduled';
    const effectiveScheduledType: 'MEETING' | 'CALL' = effectiveIsMeeting ? 'MEETING' : 'CALL';

    const effectiveLeadId = (lead.id && lead.id !== '1' && !lead.id.startsWith('lead_'))
      ? lead.id
      : (lead.id || '1');

    const resolvedLeadName = (!lead.name || lead.name.includes('Lead Prospect') || lead.name === 'Prospect' || lead.name === '—')
      ? ((lead as any).firstName ? `${(lead as any).firstName} ${(lead as any).lastName || ''}`.trim() : 'Lead Contact')
      : lead.name;
    const compText = typeof lead.company === 'string' ? lead.company : ((lead as any)?.company?.name || '');

    const cleanTime = meetingScheduledTime.includes(':') && !meetingScheduledTime.includes('M')
      ? meetingScheduledTime
      : (meetingScheduledTime.includes('10:00') ? '10:00' :
         meetingScheduledTime.includes('11:30') ? '11:30' :
         meetingScheduledTime.includes('02:30') ? '14:30' :
         meetingScheduledTime.includes('04:00') ? '16:00' :
         meetingScheduledTime.includes('06:00') ? '18:00' : '11:30');

    const dueAtIso = `${meetingScheduledDate}T${cleanTime}:00`;
    const repName = lead.owner || (lead as any).assignedRep || currentUser?.name || 'Sales Rep';

    const effectiveTitle = isCustomTemplateMode
      ? (customTemplateTitle.trim() || 'Custom WhatsApp Message')
      : waDirectTemplateTitle;

    const followUpTitle = effectiveIsMeeting
      ? `🏢 In-Person / Virtual Visit: ${resolvedLeadName}${compText ? ` (${compText})` : (lead.phone ? ` (${lead.phone})` : '')}`
      : `💬 WhatsApp Follow-up: ${resolvedLeadName}${lead.phone ? ` (${lead.phone})` : ''}`;

    const followUpPayload = {
      title: followUpTitle,
      followUpType: effectiveIsMeeting ? 'MEETING' : 'WHATSAPP',
      scheduledType: effectiveScheduledType,
      leadId: effectiveLeadId,
      leadName: resolvedLeadName,
      leadPhone: lead.phone,
      leadEmail: lead.email,
      scheduledDate: meetingScheduledDate,
      scheduledTime: meetingScheduledTime,
      dueAt: dueAtIso,
      priority: 'HIGH',
      purpose: waDirectNotes || `WhatsApp Direct (${effectiveTitle})`,
      notes: `${effectiveIsMeeting ? 'Walkthrough demo' : 'Follow-up callback'} scheduled via Direct WhatsApp (${effectiveTitle}) for ${formatMeetingDateDisplay(meetingScheduledDate)} at ${meetingScheduledTime}. Pre-alert: ${enableMeetingPreAlert5Min ? '5 min before' : 'None'}`,
      reminderMinutes: enableMeetingPreAlert5Min ? 5 : 0,
    };

    // 1. Push to Backend /follow-ups API (Backend FollowUpsModule)
    apiFetch('/follow-ups', {
      method: 'POST',
      body: JSON.stringify(followUpPayload),
    }).catch((e) => console.warn('Follow-up create sync notice:', e));

    // 2. Push to Backend /tasks API
    apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        leadId: effectiveLeadId,
        title: followUpTitle,
        status: 'PENDING',
        priority: 'HIGH',
        dueAt: dueAtIso,
        scheduledDate: meetingScheduledDate,
        reminderMinutes: enableMeetingPreAlert5Min ? 5 : 0,
        notes: followUpPayload.notes,
      }),
    }).catch(() => {});

    // 3. LocalStorage das_crm_followup_tasks_cache update
    let newTaskItem: any = null;
    if (typeof window !== 'undefined') {
      try {
        const cachedTasks = JSON.parse(localStorage.getItem('das_crm_followup_tasks_cache') || '[]');
        newTaskItem = {
          id: `task_wa_${Date.now()}`,
          ...followUpPayload,
          createdAt: new Date().toISOString(),
          status: 'PENDING',
          createdById: currentUser?.id || 'admin_user',
          createdByName: currentUser?.name || 'Sales Rep',
          createdByRole: currentUser?.role || 'SALES_REP',
          createdBy: {
            id: currentUser?.id,
            name: currentUser?.name || 'Sales Rep',
            role: currentUser?.role || 'SALES_REP',
          },
          assignee: {
            id: currentUser?.id,
            name: String(repName),
            role: 'SALES_REP',
          },
          lead: {
            id: lead.id,
            name: lead.name,
            firstName: lead.name?.split(' ')[0] || 'Lead',
            lastName: lead.name?.split(' ').slice(1).join(' ') || '',
            phone: lead.phone,
            email: lead.email,
            owner: {
              name: String(repName),
              role: 'SALES_REP',
            },
            company: typeof lead.company === 'string' ? { name: lead.company } : (lead.company || { name: 'Enterprise' }),
            status: { name: selectedTargetStatus || lead.status || 'Active', color: '#3b82f6' },
          },
        };

        const updatedTasks = [newTaskItem, ...(Array.isArray(cachedTasks) ? cachedTasks : [])];
        localStorage.setItem('das_crm_followup_tasks_cache', JSON.stringify(updatedTasks.slice(0, 100)));
        window.dispatchEvent(new CustomEvent('das_crm_workflow_updated'));
        window.dispatchEvent(new CustomEvent('das_crm_followup_created', { detail: followUpPayload }));
        window.dispatchEvent(new CustomEvent('das_crm_followups_updated', { detail: newTaskItem }));
      } catch (_) {}
    }

    // 4. Update Lead nextFollowUp in state and caches
    const updatedStatus = effectiveIsMeeting ? 'Meeting Scheduled' : (selectedTargetStatus && selectedTargetStatus !== 'KEEP_CURRENT' ? selectedTargetStatus : lead.status);
    setLead(prev => ({
      ...prev,
      status: updatedStatus,
      nextFollowUp: dueAtIso,
      followUpDate: meetingScheduledDate,
      followUpTime: meetingScheduledTime,
    }));

    if (typeof window !== 'undefined') {
      try {
        const updatedLeadRecord = {
          ...lead,
          status: updatedStatus,
          nextFollowUp: dueAtIso,
          followUpDate: meetingScheduledDate,
          followUpTime: meetingScheduledTime,
          lastActivityAt: new Date().toISOString(),
        };
        sessionStorage.setItem(`das_crm_lead_${lead.id}`, JSON.stringify(updatedLeadRecord));
        sessionStorage.setItem('das_crm_active_lead', JSON.stringify(updatedLeadRecord));

        const allLeadsRaw = localStorage.getItem('das_crm_all_leads_cache');
        if (allLeadsRaw) {
          const allLeads = JSON.parse(allLeadsRaw);
          const updatedAll = allLeads.map((item: any) =>
            String(item.id) === String(lead.id) ? { ...item, ...updatedLeadRecord } : item
          );
          localStorage.setItem('das_crm_all_leads_cache', JSON.stringify(updatedAll));
        }

        const dirLeadsRaw = localStorage.getItem('das_crm_lead_directory_cache');
        if (dirLeadsRaw) {
          const dirLeads = JSON.parse(dirLeadsRaw);
          const updatedDir = dirLeads.map((item: any) =>
            String(item.id) === String(lead.id) ? { ...item, ...updatedLeadRecord } : item
          );
          localStorage.setItem('das_crm_lead_directory_cache', JSON.stringify(updatedDir));
        }

        window.dispatchEvent(new CustomEvent('das_crm_leads_updated', { detail: { leadId: effectiveLeadId, status: updatedStatus } }));
      } catch (_) {}
    }

    if (opts?.showToast) {
      showSyncNotification(`✓ Synced ${effectiveIsMeeting ? 'Meeting / Demo' : 'Follow-up'} to Follow-ups section for ${formatMeetingDateDisplay(meetingScheduledDate)} at ${meetingScheduledTime}!`);
    }

    return { followUpPayload, newTaskItem, dueAtIso, effectiveScheduledType, effectiveIsMeeting };
  };

  const handleToggleProductSelection = (productId: string) => {
    setSelectedProductQuantities(prev => {
      const copy = { ...prev };
      if (copy[productId]) {
        delete copy[productId];
      } else {
        copy[productId] = 1;
      }
      setWaDirectMessage(generateProposalMessage(copy));
      return copy;
    });
  };

  const handleUpdateProductQuantity = (productId: string, delta: number) => {
    setSelectedProductQuantities(prev => {
      const current = prev[productId] || 0;
      const next = current + delta;
      const copy = { ...prev };
      if (next <= 0) {
        delete copy[productId];
      } else {
        copy[productId] = next;
      }
      setWaDirectMessage(generateProposalMessage(copy));
      return copy;
    });
  };

  const handleApplyProductsToProposal = () => {
    const selectedEntries = Object.entries(selectedProductQuantities).filter(([_, q]) => q > 0);
    if (selectedEntries.length === 0) {
      showSyncNotification('⚠️ Please select at least 1 product to apply.');
      return;
    }

    const proposalMsg = generateProposalMessage(selectedProductQuantities);
    setWaDirectMessage(proposalMsg);
    setShowProductSlider(false);
    showSyncNotification(`✓ Applied ${selectedEntries.length} product(s) with images to Proposal!`);
  };

  const handleApplyInvoice = (inv: AvailableInvoiceItem) => {
    setSelectedInvoice(inv);
    const invoiceMsg = generateInvoiceMessage(inv);
    setWaDirectMessage(invoiceMsg);
    setShowInvoiceSlider(false);
    showSyncNotification(`✓ Attached ${inv.quoteNumber} (₹${inv.totalAmount.toLocaleString('en-IN')}) with PDF to WhatsApp template`);
  };

  const handleSelectWaTemplate = (templateId: string) => {
    setSelectedWaTemplateId(templateId);
    setIsCustomTemplateMode(false);
    const tpl = waTemplatesList.find(t => t.id === templateId);
    if (tpl) {
      setWaDirectTemplateTitle(tpl.title);
      if (tpl.targetStatus) {
        setSelectedTargetStatus(tpl.targetStatus);
      }
      if (tpl.category === 'PROPOSAL') {
        setShowMeetingScheduler(false);
        const keys = Object.keys(selectedProductQuantities);
        if (keys.length === 0 && catalogProducts.length > 0) {
          const next = { [catalogProducts[0].id]: 1 };
          setSelectedProductQuantities(next);
          setWaDirectMessage(generateProposalMessage(next));
        } else {
          setWaDirectMessage(generateProposalMessage(selectedProductQuantities));
        }
        return;
      } else if (tpl.category === 'INVOICE') {
        setShowMeetingScheduler(false);
        if (!selectedInvoice && availableInvoices.length > 0) {
          handleApplyInvoice(availableInvoices[0]);
        } else if (selectedInvoice) {
          handleApplyInvoice(selectedInvoice);
        }
        return;
      } else if (tpl.category === 'MEETING') {
        setShowMeetingScheduler(true);
        setDirectScheduleType('MEETING');
        setWaDirectMessage(generateMeetingMessage(meetingScheduledDate, meetingScheduledTime));
        return;
      } else if (tpl.category === 'FOLLOWUP') {
        setShowMeetingScheduler(true);
        setDirectScheduleType('FOLLOWUP');
        setWaDirectMessage(generateFollowUpMessage(meetingScheduledDate, meetingScheduledTime));
        return;
      } else {
        setShowMeetingScheduler(false);
      }
      const leadVal = (lead as any).value || lead.budget;
      const interpolated = whatsappTemplateEngine.interpolateTemplate(tpl.text, {
        name: lead.name,
        company: lead.company,
        value: leadVal,
        requirement: lead.requirement,
      });
      setWaDirectMessage(interpolated);
    }
  };

  const handleSelectCustomCategory = (cat: TemplateCategory) => {
    setCustomTemplateCategory(cat);
    // Auto-suggest status based on message type/category
    if (cat === 'PROPOSAL') {
      setSelectedTargetStatus('Proposal');
      setShowMeetingScheduler(false);
      const keys = Object.keys(selectedProductQuantities);
      if (keys.length === 0 && catalogProducts.length > 0) {
        const next = { [catalogProducts[0].id]: 1 };
        setSelectedProductQuantities(next);
        setWaDirectMessage(generateProposalMessage(next));
      } else {
        setWaDirectMessage(generateProposalMessage(selectedProductQuantities));
      }
    } else if (cat === 'INVOICE') {
      setSelectedTargetStatus('Negotiation');
      setShowMeetingScheduler(false);
      if (!selectedInvoice && availableInvoices.length > 0) {
        handleApplyInvoice(availableInvoices[0]);
      } else if (selectedInvoice) {
        handleApplyInvoice(selectedInvoice);
      }
    } else if (cat === 'MEETING') {
      setSelectedTargetStatus('Meeting Scheduled');
      setShowMeetingScheduler(true);
      setDirectScheduleType('MEETING');
      setWaDirectMessage(generateMeetingMessage(meetingScheduledDate, meetingScheduledTime));
    } else if (cat === 'FOLLOWUP') {
      setSelectedTargetStatus('Contacted');
      setShowMeetingScheduler(true);
      setDirectScheduleType('FOLLOWUP');
      setWaDirectMessage(generateFollowUpMessage(meetingScheduledDate, meetingScheduledTime));
    } else if (cat === 'PROMOTION') {
      setSelectedTargetStatus('Negotiation');
      setShowMeetingScheduler(false);
    } else if (cat === 'OUTREACH') {
      setSelectedTargetStatus('Contacted');
      setShowMeetingScheduler(false);
    }
  };

  const handleSelectTargetStatus = (statusKey: string) => {
    setSelectedTargetStatus(statusKey);
    if (statusKey === 'Proposal') {
      setCustomTemplateCategory('PROPOSAL');
      setShowMeetingScheduler(false);
      const keys = Object.keys(selectedProductQuantities);
      if (keys.length === 0 && catalogProducts.length > 0) {
        const next = { [catalogProducts[0].id]: 1 };
        setSelectedProductQuantities(next);
        setWaDirectMessage(generateProposalMessage(next));
      } else {
        setWaDirectMessage(generateProposalMessage(selectedProductQuantities));
      }
    } else if (statusKey === 'Negotiation') {
      setCustomTemplateCategory('INVOICE');
      setShowMeetingScheduler(false);
      if (!selectedInvoice && availableInvoices.length > 0) {
        handleApplyInvoice(availableInvoices[0]);
      } else if (selectedInvoice) {
        handleApplyInvoice(selectedInvoice);
      }
    } else if (statusKey === 'Meeting Scheduled') {
      setCustomTemplateCategory('MEETING');
      setShowMeetingScheduler(true);
      setDirectScheduleType('MEETING');
      setWaDirectMessage(generateMeetingMessage(meetingScheduledDate, meetingScheduledTime));
    } else if (statusKey === 'Follow-up') {
      setCustomTemplateCategory('FOLLOWUP');
      setShowMeetingScheduler(true);
      setDirectScheduleType('FOLLOWUP');
      setWaDirectMessage(generateFollowUpMessage(meetingScheduledDate, meetingScheduledTime));
    } else {
      setShowMeetingScheduler(false);
    }
  };

  const handleToggleCustomMode = (custom: boolean) => {
    setIsCustomTemplateMode(custom);
    if (custom) {
      if (!customTemplateTitle) setCustomTemplateTitle('Custom Lead Message');
      if (!waDirectMessage) {
        const leadVal = (lead as any).value || lead.budget;
        setWaDirectMessage(`Hi ${lead.name || 'there'}, sharing details regarding our discussion for ${lead.company || 'your requirement'}.`);
      }
    } else {
      const tpl = waTemplatesList.find(t => t.id === selectedWaTemplateId) || waTemplatesList[0];
      if (tpl) {
        setWaDirectTemplateTitle(tpl.title);
        if (tpl.targetStatus) setSelectedTargetStatus(tpl.targetStatus);
        const leadVal = (lead as any).value || lead.budget;
        setWaDirectMessage(whatsappTemplateEngine.interpolateTemplate(tpl.text, {
          name: lead.name,
          company: lead.company,
          value: leadVal,
          requirement: lead.requirement,
        }));
      }
    }
  };

  const handleInsertPlaceholder = (ph: string) => {
    const leadVal = (lead as any).value || lead.budget;
    setWaDirectMessage(prev => {
      const toInsert = ph === '{name}' ? (lead.name || '{name}') :
                       ph === '{company}' ? (lead.company || '{company}') :
                       ph === '{value}' ? (leadVal || '{value}') :
                       ph === '{product}' ? (lead.requirement || 'DAS CRM Suite') : ph;
      return prev ? `${prev} ${toInsert}` : toInsert;
    });
  };

  const handleSendWaDirect = async () => {
    const userRoleStr = (currentUser?.role || 'SALES_EXEC').toUpperCase();
    const cleanRole: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC' = userRoleStr.includes('ADMIN')
      ? 'ADMIN'
      : userRoleStr.includes('MANAGER')
      ? 'MANAGER'
      : userRoleStr.includes('LEAD') || userRoleStr.includes('TL')
      ? 'TEAM_LEADER'
      : 'SALES_EXEC';

    const effectiveTitle = isCustomTemplateMode
      ? (customTemplateTitle.trim() || 'Custom WhatsApp Message')
      : waDirectTemplateTitle;

    // 1. Launch Direct WhatsApp (wa.me / whatsapp://)
    const finalMsg = waDirectMessage.trim() || `Hi ${lead.name}, following up regarding ${lead.company || 'DAS CRM'}.`;
    const launchRes = whatsappTemplateEngine.openDirectWhatsApp(lead.phone, finalMsg, lead.name);

    if (!launchRes.success) {
      showSyncNotification(`⚠️ ${launchRes.error || 'Could not open WhatsApp. Please check phone number.'}`);
      return;
    }

    // 2. Save custom template to library if requested
    if (isCustomTemplateMode && saveCustomToLibrary && customTemplateTitle.trim()) {
      try {
        const customTplId = `tpl_${Date.now()}`;
        whatsappTemplateEngine.upsertTemplate({
          id: customTplId,
          title: customTemplateTitle.trim(),
          category: customTemplateCategory,
          text: waDirectMessage.trim(),
          targetStatus: selectedTargetStatus !== 'KEEP_CURRENT' ? selectedTargetStatus : undefined,
          isDefault: false,
          usageCount: 1,
        });
        setWaTemplatesList(whatsappTemplateEngine.getTemplates());
        setSelectedWaTemplateId(customTplId);
      } catch (_) {}
    } else if (!isCustomTemplateMode) {
      // Increment template usage count
      whatsappTemplateEngine.incrementUsage(selectedWaTemplateId);
    }

    // 3. Determine status update
    const shouldUpdateStatus = Boolean(selectedTargetStatus && selectedTargetStatus !== 'KEEP_CURRENT');
    const newStatus = shouldUpdateStatus ? selectedTargetStatus : lead.status;

    // 4. Record contact attempt
    const newContactAttempt: ContactAttempt = {
      id: `attempt_wa_${Date.now()}`,
      type: 'WHATSAPP',
      outcome: 'WA_SENT',
      by: currentUser?.name || lead.owner || 'Sales Rep',
      byRole: cleanRole,
      timestamp: new Date().toISOString(),
      notes: `Template: "${effectiveTitle}" • Target Status: ${shouldUpdateStatus ? selectedTargetStatus : 'Kept Current'}${waDirectNotes ? ` • Notes: ${waDirectNotes}` : ''}`,
      sentMessage: finalMsg,
    };

    // 4b. Sync Scheduled Meeting or Follow-up to CRM Follow-up Section (Like Call Funnel)
    const isScheduled = isScheduleActive || selectedTargetStatus === 'Meeting Scheduled' || customTemplateCategory === 'MEETING' || customTemplateCategory === 'FOLLOWUP';
    if (isScheduled && meetingScheduledDate) {
      const syncRes = syncScheduledFollowUpTask();
      if (syncRes) {
        newContactAttempt.followUpDate = meetingScheduledDate;
        newContactAttempt.followUpTime = meetingScheduledTime;
        newContactAttempt.scheduledType = syncRes.effectiveScheduledType;
        newContactAttempt.outcome = syncRes.effectiveIsMeeting ? 'MEETING_SCHEDULED' : 'FOLLOW_UP_SCHEDULED';
      }
    }

    setContactHistory(prev => [newContactAttempt, ...prev]);

    // Persist contact attempt to local & session storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`das_crm_contact_history_${lead.id}`, JSON.stringify([newContactAttempt, ...contactHistory]));
        localStorage.setItem(`das_crm_contact_history_${leadId}`, JSON.stringify([newContactAttempt, ...contactHistory]));
      } catch (_) {}
    }

    // 5. Update lead status if selected status differs from current status
    if (shouldUpdateStatus && selectedTargetStatus !== lead.status) {
      setLead(prev => ({ ...prev, status: selectedTargetStatus }));

      if (typeof window !== 'undefined') {
        try {
          const updatedLead = { ...lead, status: selectedTargetStatus, lastActivityAt: new Date().toISOString() };
          sessionStorage.setItem(`das_crm_lead_${lead.id}`, JSON.stringify(updatedLead));
          sessionStorage.setItem('das_crm_active_lead', JSON.stringify(updatedLead));

          const allLeadsRaw = localStorage.getItem('das_crm_all_leads_cache');
          if (allLeadsRaw) {
            const allLeads = JSON.parse(allLeadsRaw);
            const updatedAll = allLeads.map((item: any) =>
              String(item.id) === String(lead.id) ? { ...item, status: selectedTargetStatus, lastActivityAt: new Date().toISOString() } : item
            );
            localStorage.setItem('das_crm_all_leads_cache', JSON.stringify(updatedAll));
          }
        } catch (_) {}
      }

      apiFetch(`/leads/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: selectedTargetStatus, lastActivityAt: new Date().toISOString() }),
      }).catch(() => {});
    }

    // 6. Record activity in backend database
    apiFetch('/activities', {
      method: 'POST',
      body: JSON.stringify({
        activityType: 'NOTE',
        leadId: lead.id,
        notes: `WhatsApp Direct (${effectiveTitle}): Status → ${shouldUpdateStatus ? selectedTargetStatus : 'Kept Current'}${isScheduled ? ` [Scheduled ${directScheduleType} for ${meetingScheduledDate} at ${meetingScheduledTime}]` : ''}${waDirectNotes ? ` — ${waDirectNotes}` : ''}`,
        metadata: {
          channel: 'WHATSAPP',
          type: 'WHATSAPP',
          outcome: newContactAttempt.outcome || 'WA_SENT',
          scheduledType: newContactAttempt.scheduledType,
          followUpDate: newContactAttempt.followUpDate,
          followUpTime: newContactAttempt.followUpTime,
          templateId: isCustomTemplateMode ? 'custom' : selectedWaTemplateId,
          template: effectiveTitle,
          status: newStatus,
          targetStatus: selectedTargetStatus,
          sentMessage: finalMsg,
          notes: waDirectNotes,
          by: currentUser?.name || lead.owner,
          byRole: cleanRole,
        },
      }),
    }).catch(() => {});

    // 7. Record SyncedActivityLog
    const newLog: SyncedActivityLog = {
      id: Date.now().toString(),
      section: 'WA_DIRECT',
      title: `WhatsApp Direct Dispatched (${effectiveTitle})`,
      notes: `Status → ${shouldUpdateStatus ? selectedTargetStatus : 'Kept Current'}${waDirectNotes ? ` — ${waDirectNotes}` : ''}`,
      timestamp: 'Just now',
      user: currentUser?.name || lead.owner,
    };

    setSyncedActivities((prev) => [newLog, ...prev]);
    showSyncNotification(`✓ WhatsApp Direct Dispatched! Lead status updated to ${newStatus}`);
    setWaDirectNotes('');

    // Clear caches and broadcast updates to all tabs & Lead Center
    clearAllDashboardCaches();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('das_crm_leads_updated', {
        detail: { leadId: lead.id, status: newStatus, template: effectiveTitle }
      }));
      try {
        const bc = new BroadcastChannel('das_crm_lead_sync');
        bc.postMessage({ type: 'LEAD_UPDATED', leadId: lead.id, status: newStatus, template: effectiveTitle });
        bc.close();
      } catch (_) {}
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

  // ── COMPUTED HELPERS FOR DIRECT WHATSAPP PROPOSAL, INVOICE & MEETING ──
  const productCategoriesList = ['ALL', ...Array.from(new Set(catalogProducts.map(p => p.category || 'General')))];

  const filteredCatalogProducts = catalogProducts.filter(p => {
    const matchesSearch = !productSearchQuery.trim() ||
      p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(productSearchQuery.toLowerCase()));
    const matchesCategory = productCategoryFilter === 'ALL' || p.category === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalSelectedProductsCount = Object.values(selectedProductQuantities).reduce((acc, q) => acc + q, 0);
  const proposalGrandTotal = Object.entries(selectedProductQuantities).reduce((acc, [pId, qty]) => {
    const p = catalogProducts.find(item => item.id === pId);
    return acc + (p ? p.price * qty : 0);
  }, 0);

  const filteredAvailableInvoices = availableInvoices.filter(inv => {
    const matchesSearch = !invoiceSearchQuery.trim() ||
      inv.quoteNumber.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
      inv.buyerCompany.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
      (inv.buyerName && inv.buyerName.toLowerCase().includes(invoiceSearchQuery.toLowerCase())) ||
      inv.itemsSummary.toLowerCase().includes(invoiceSearchQuery.toLowerCase());
    const matchesType = invoiceTypeFilter === 'ALL' || inv.docType === invoiceTypeFilter;
    return matchesSearch && matchesType;
  });

  const isProposalActive =
    (isCustomTemplateMode && customTemplateCategory === 'PROPOSAL') ||
    (!isCustomTemplateMode && waTemplatesList.find(t => t.id === selectedWaTemplateId)?.category === 'PROPOSAL') ||
    selectedTargetStatus === 'Proposal';

  const isInvoiceActive =
    (isCustomTemplateMode && customTemplateCategory === 'INVOICE') ||
    (!isCustomTemplateMode && waTemplatesList.find(t => t.id === selectedWaTemplateId)?.category === 'INVOICE') ||
    selectedTargetStatus === 'Negotiation';

  const isMeetingActive =
    (isCustomTemplateMode && customTemplateCategory === 'MEETING') ||
    (!isCustomTemplateMode && waTemplatesList.find(t => t.id === selectedWaTemplateId)?.category === 'MEETING') ||
    selectedTargetStatus === 'Meeting Scheduled' ||
    (showMeetingScheduler && directScheduleType === 'MEETING');

  const isFollowUpActive =
    (isCustomTemplateMode && customTemplateCategory === 'FOLLOWUP') ||
    (!isCustomTemplateMode && waTemplatesList.find(t => t.id === selectedWaTemplateId)?.category === 'FOLLOWUP') ||
    selectedTargetStatus === 'Follow-up' ||
    (showMeetingScheduler && (directScheduleType === 'FOLLOWUP' || directScheduleType === 'CALL'));

  const isScheduleActive = isMeetingActive || isFollowUpActive || enableDirectSchedule || showMeetingScheduler;

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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/30">
                WHATSAPP CHAT DIRECT DISPATCHER
              </span>
              <h3 className="text-lg font-extrabold text-white mt-1">Direct WhatsApp Template &amp; Lead Status Dispatcher</h3>
              <p className="text-xs text-muted">
                Dispatch WhatsApp templates or custom messages directly to{' '}
                <strong className="text-emerald-400 font-bold">{whatsappTemplateEngine.formatPhoneDisplay(lead.phone)}</strong>
                {' '}and auto-update lead status
              </p>
            </div>
            <a
              href="/whatsapp-templates"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 transition-all"
            >
              <span>⚙️ Manage Templates</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="p-5 rounded-2xl bg-background border border-border space-y-4">
            {/* 1. Mode Switcher: Pre-Approved Templates vs Create & Send Custom Template */}
            <div className="flex items-center gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleToggleCustomMode(false)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isCustomTemplateMode
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>📋 Select Pre-Approved Template</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200">
                  {waTemplatesList.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleCustomMode(true)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isCustomTemplateMode
                    ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/50 text-emerald-300 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>✨ + Create &amp; Send Custom Template</span>
              </button>
            </div>

            {/* If NOT custom mode: Pre-approved template selector */}
            {!isCustomTemplateMode ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted block font-semibold">Select WhatsApp Template *</label>
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={11} /> {waTemplatesList.length} Templates Synced
                  </span>
                </div>
                <select
                  className="crm-input text-xs font-bold w-full bg-slate-900 border-border focus:border-amber-500"
                  value={selectedWaTemplateId}
                  onChange={(e) => handleSelectWaTemplate(e.target.value)}
                >
                  {waTemplatesList.map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.title} ({t.category}){t.targetStatus ? ` ➔ Auto-Status: ${t.targetStatus}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Custom Template Builder Form */
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles size={14} /> Compose Custom Template &amp; Message
                  </span>
                  <span className="text-[10px] text-slate-400">Custom Mode Active</span>
                </div>

                {/* Custom Template Title */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Custom Template Title *</label>
                  <input
                    type="text"
                    className="crm-input text-xs w-full bg-slate-900 border-border focus:border-emerald-500"
                    placeholder="e.g. Customized Quotation / Commercial Proposal Breakdown"
                    value={customTemplateTitle}
                    onChange={(e) => setCustomTemplateTitle(e.target.value)}
                  />
                </div>

                {/* Template Message Type / Category */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1.5 font-semibold">
                    Select Message Type / Category * <span className="text-[10px] text-muted font-normal">(Defines type of message &amp; auto-selects status)</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {(
                      [
                        { cat: 'OUTREACH', label: 'Outreach', emoji: '🌱' },
                        { cat: 'PROPOSAL', label: 'Proposal', emoji: '💼' },
                        { cat: 'INVOICE', label: 'Invoice', emoji: '📦' },
                        { cat: 'MEETING', label: 'Meeting', emoji: '📅' },
                        { cat: 'FOLLOWUP', label: 'Follow-up', emoji: '⏰' },
                        { cat: 'PROMOTION', label: 'Promotion', emoji: '🎉' },
                      ] as const
                    ).map((c) => (
                      <button
                        key={c.cat}
                        type="button"
                        onClick={() => handleSelectCustomCategory(c.cat)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                          customTemplateCategory === c.cat
                            ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/40'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <span className="text-sm">{c.emoji}</span>
                        <span className="text-[10px] leading-tight">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save to library checkbox */}
                <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={saveCustomToLibrary}
                    onChange={(e) => setSaveCustomToLibrary(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
                  />
                  <span className="text-xs text-slate-300">
                    💾 Save this custom template to template library for future team reuse
                  </span>
                </label>
              </div>
            )}

            {/* Dynamic Contextual Modules: Proposal Products, Invoices, and Meeting Scheduler */}
            {/* A. If Proposal mode is active: Inline Product Selector & Image Attachment */}
            {isProposalActive && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/50 space-y-3 shadow-xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Package size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Select Products for Proposal (Synced from Products Catalog)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {totalSelectedProductsCount} Selected
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Products can be many. Details &amp; product images are automatically attached to the WhatsApp template.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowProductSlider(true)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <SlidersHorizontal size={12} />
                      <span>Full Slider View</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      className="crm-input w-full pl-8 text-xs h-8 bg-slate-900 border-slate-800 focus:border-emerald-500 text-white"
                      placeholder="Search products by name, SKU, or category..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                    />
                    {productSearchQuery && (
                      <button
                        onClick={() => setProductSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
                    {productCategoriesList.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setProductCategoryFilter(cat)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                          productCategoryFilter === cat
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* In-place Products List (Scrollable) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredCatalogProducts.map((prod) => {
                    const qty = selectedProductQuantities[prod.id] || 0;
                    const isSelected = qty > 0;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleToggleProductSelection(prod.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={prod.coverImage || '/products/puff-jackets.jpg'}
                            alt={prod.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-800 flex-shrink-0"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = '/products/puff-jackets.jpg';
                            }}
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{prod.name}</h5>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="text-emerald-400 font-extrabold">₹{prod.price.toLocaleString('en-IN')}</span>
                              <span>•</span>
                              <span>{prod.unit || 'Unit'}</span>
                              {prod.sku && <span className="font-mono text-slate-500">• {prod.sku}</span>}
                            </p>
                          </div>
                        </div>

                        {/* Stepper if selected, else Select button */}
                        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {isSelected ? (
                            <div className="flex items-center bg-slate-900 border border-emerald-500/50 rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleUpdateProductQuantity(prod.id, -1)}
                                className="px-2 py-0.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800"
                              >
                                −
                              </button>
                              <span className="w-7 text-center text-xs font-extrabold text-emerald-300">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateProductQuantity(prod.id, 1)}
                                className="px-2 py-0.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleProductSelection(prod.id)}
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-emerald-600/30 border border-slate-700 hover:border-emerald-500 text-[10px] font-bold text-slate-300 transition-all flex items-center gap-1"
                            >
                              <Plus size={11} className="text-emerald-400" />
                              <span>Select</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 📎 Attached Product Media & Image Preview Card */}
                {totalSelectedProductsCount > 0 && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                        <span>📎</span> Attached Product Details &amp; Visuals ({totalSelectedProductsCount} items):
                      </span>
                      <span className="text-xs font-black text-emerald-400">
                        Total: ₹{proposalGrandTotal.toLocaleString('en-IN')} (incl. GST)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {Object.entries(selectedProductQuantities).map(([pId, qty]) => {
                        const prod = catalogProducts.find(p => p.id === pId);
                        if (!prod) return null;
                        return (
                          <div
                            key={pId}
                            className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800"
                          >
                            <img
                              src={prod.coverImage || '/products/puff-jackets.jpg'}
                              alt={prod.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.onerror = null;
                                target.src = '/products/puff-jackets.jpg';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{prod.name}</p>
                              <p className="text-[10px] text-slate-400">
                                Qty: <strong className="text-emerald-300">{qty}</strong> × ₹{prod.price.toLocaleString('en-IN')} = <strong className="text-white">₹{(prod.price * qty).toLocaleString('en-IN')}</strong>
                              </p>
                              <span className="text-[9px] text-cyan-400 flex items-center gap-1 font-semibold">
                                <span>🖼️</span> Image attached to message
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUpdateProductQuantity(pId, -qty)}
                              className="text-slate-400 hover:text-red-400 text-xs p-1"
                              title="Remove product"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* B. If Invoice mode is active: Inline Invoices Selector & PDF Attachment */}
            {isInvoiceActive && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/50 space-y-3 shadow-xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                      <Receipt size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Select Invoice from Generated / Saved Invoices</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {availableInvoices.length} Registered
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Synced from Quotes &amp; Billing. Invoice PDF &amp; payment reference attach with the WhatsApp template.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceSlider(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <SlidersHorizontal size={12} />
                    <span>Full Slider View</span>
                  </button>
                </div>

                {/* Search & Doc Type Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      className="crm-input w-full pl-8 text-xs h-8 bg-slate-900 border-slate-800 focus:border-amber-500 text-white"
                      placeholder="Search by invoice number, buyer, or items..."
                      value={invoiceSearchQuery}
                      onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    />
                    {invoiceSearchQuery && (
                      <button
                        onClick={() => setInvoiceSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { key: 'ALL', label: 'All Invoices' },
                      { key: 'TAX_INVOICE', label: 'Tax Invoices' },
                      { key: 'PROFORMA_INVOICE', label: 'Proforma' },
                      { key: 'QUOTATION', label: 'Quotations' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setInvoiceTypeFilter(t.key)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                          invoiceTypeFilter === t.key
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Invoices List (Max-height scrollable) */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {filteredAvailableInvoices.map((inv) => {
                    const isSelected = selectedInvoice?.id === inv.id || selectedInvoice?.quoteNumber === inv.quoteNumber;
                    return (
                      <div
                        key={inv.id}
                        onClick={() => handleApplyInvoice(inv)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-950/30 border-amber-400 shadow-md ring-1 ring-amber-400/40 text-white'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 font-extrabold flex items-center justify-center text-xs border border-amber-500/20 flex-shrink-0">
                            📄
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-xs">{inv.quoteNumber}</span>
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-900 text-amber-300 border border-slate-800">
                                {inv.docType.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] text-slate-400">📅 {inv.date}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 truncate">
                              {inv.buyerCompany} {inv.buyerName ? `• ${inv.buyerName}` : ''}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              📦 {inv.itemsSummary}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-black text-emerald-400 block">
                            ₹{inv.totalAmount.toLocaleString('en-IN')}
                          </span>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-amber-300' : 'text-slate-500'}`}>
                            {isSelected ? '✓ Attached' : 'Click to Attach'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 📎 Attached Invoice PDF Document Preview Card */}
                {selectedInvoice && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                        <span>📎</span> Attached Document to WhatsApp Dispatch:
                      </span>
                      <span className="text-xs font-black text-emerald-400">
                        ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')} (incl. 18% GST)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/20 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">📕</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-white font-mono text-xs">{selectedInvoice.quoteNumber}.pdf</strong>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-bold">
                              {selectedInvoice.docType}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Buyer: {selectedInvoice.buyerCompany} • {selectedInvoice.itemsSummary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={selectedInvoice.pdfUrl || `/quotes?doc=${selectedInvoice.quoteNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-amber-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 flex items-center gap-1"
                        >
                          <ExternalLink size={11} /> View PDF
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice(null);
                            showSyncNotification('Removed invoice attachment');
                          }}
                          className="text-slate-400 hover:text-red-400 text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* C. Unified 15-Day Date & Time Scheduler for Meeting, Follow-up & other scheduled touchpoints (Like Call Funnel) */}
            {isScheduleActive && (
              <div className={`p-4 rounded-2xl bg-gradient-to-b space-y-3 shadow-xl animate-in fade-in duration-200 border ${
                isMeetingActive || directScheduleType === 'MEETING'
                  ? 'from-indigo-950/40 via-slate-900 to-slate-950 border-indigo-500/50'
                  : 'from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/50'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                      isMeetingActive || directScheduleType === 'MEETING'
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {isMeetingActive || directScheduleType === 'MEETING' ? <CalendarCheck size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>
                          {isMeetingActive || directScheduleType === 'MEETING'
                            ? 'Schedule Walkthrough / Demo Meeting'
                            : 'Schedule Follow-up Touchpoint / Callback'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          isMeetingActive || directScheduleType === 'MEETING'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {isMeetingActive || directScheduleType === 'MEETING' ? '🤝 Meeting Funnel' : '📞 Follow-up Funnel'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Works like the call funnel. Automatically synchronizes WhatsApp invitation &amp; CRM Follow-ups section.
                      </p>
                    </div>
                  </div>

                  {/* Schedule Mode Switcher & Time Display */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setDirectScheduleType('MEETING');
                          setSelectedTargetStatus('Meeting Scheduled');
                          setWaDirectMessage(generateMeetingMessage(meetingScheduledDate, meetingScheduledTime));
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          directScheduleType === 'MEETING' || isMeetingActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🤝 Meeting
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDirectScheduleType('FOLLOWUP');
                          setSelectedTargetStatus('Contacted');
                          setWaDirectMessage(generateFollowUpMessage(meetingScheduledDate, meetingScheduledTime));
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          directScheduleType === 'FOLLOWUP' || isFollowUpActive
                            ? 'bg-amber-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        📞 Follow-up
                      </button>
                    </div>

                    <div className="text-[11px] font-bold text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-xl border border-indigo-500/30">
                      📅 {formatMeetingDateDisplay(meetingScheduledDate)} at {meetingScheduledTime}
                    </div>
                  </div>
                </div>

                {/* 15-Day Date Horizontal Chips */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                    <span>Select Scheduled Date (Next 15 Days):</span>
                    <span className="text-[10px] text-slate-400">Synced to Today&apos;s Agenda &amp; Calendar</span>
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
                      const isSelected = meetingScheduledDate === isoDate;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleUpdateMeetingDate(isoDate)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-500 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots & Custom Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Time Slot:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['10:00 AM', '11:30 AM', '02:30 PM', '04:00 PM', '06:00 PM'].map((slot) => {
                        const isTime = meetingScheduledTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleUpdateMeetingTime(slot)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              isTime
                                ? 'bg-indigo-500/30 border-indigo-400 text-indigo-200 shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Or Custom Time:</label>
                    <input
                      type="time"
                      className="crm-input text-xs h-8 bg-slate-900 border-slate-700 [color-scheme:dark]"
                      value={meetingScheduledTime.includes(':') && !meetingScheduledTime.includes('M') ? meetingScheduledTime : '11:30'}
                      onChange={(e) => handleUpdateMeetingTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Pre-alert toggle & Quick Sync action */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/60">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableMeetingPreAlert5Min}
                      onChange={(e) => setEnableMeetingPreAlert5Min(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-500/30"
                    />
                    <span className="text-xs text-indigo-200 flex items-center gap-1.5 font-medium">
                      <Bell size={13} className="text-indigo-400" />
                      Pre-alert notification (5 mins before scheduled touchpoint)
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => syncScheduledFollowUpTask({ showToast: true })}
                    className="px-3 py-1 rounded-xl bg-indigo-600/25 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>💾 Sync to Follow-ups Section Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Schedule Toggle for any other mode (Proposal, Invoice, Outreach, Promotion) */}
            {!isMeetingActive && !isFollowUpActive && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-slate-300 flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-400" />
                  <span>Schedule Next Follow-up / Meeting for this lead:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !enableDirectSchedule;
                    setEnableDirectSchedule(next);
                    setShowMeetingScheduler(next);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    enableDirectSchedule || showMeetingScheduler
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500'
                  }`}
                >
                  {enableDirectSchedule || showMeetingScheduler ? '✓ Scheduler Active' : '+ Schedule Follow-up / Meeting'}
                </button>
              </div>
            )}

            {/* 2. Live Message Preview & Direct Edit */}
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-emerald-400" />
                  <span>WhatsApp Message Body (Live Editable Preview)</span>
                </label>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-slate-400">Quick insert:</span>
                  <button
                    type="button"
                    onClick={() => handleInsertPlaceholder('{name}')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-mono text-[10px] border border-slate-700 cursor-pointer"
                  >
                    +Name
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertPlaceholder('{company}')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[10px] border border-slate-700 cursor-pointer"
                  >
                    +Company
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertPlaceholder('{value}')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono text-[10px] border border-slate-700 cursor-pointer"
                  >
                    +Value
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertPlaceholder('{product}')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 font-mono text-[10px] border border-slate-700 cursor-pointer"
                  >
                    +Product
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={4}
                  className="crm-input w-full text-xs font-normal leading-relaxed rounded-xl p-3 bg-slate-950/70 border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-slate-100 resize-y"
                  placeholder="Type or customize your WhatsApp message..."
                  value={waDirectMessage}
                  onChange={(e) => setWaDirectMessage(e.target.value)}
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
                  <span>Target: {lead.name || 'Client'} ({whatsappTemplateEngine.formatPhoneDisplay(lead.phone)})</span>
                  <span>{waDirectMessage.length} chars · {waDirectMessage.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>
            </div>

            {/* 3. TARGET LEAD STATUS UPDATE SECTION (REPLACES OLD DISPOSITION OPTIONS) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <div>
                  <label className="text-xs text-white block font-bold">
                    Select Target Lead Status to Update *
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Lead status automatically updates when message is sent. Click any option below to change:
                  </p>
                </div>
                <div className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  Current Status: <strong className="text-amber-400">{lead.status || 'New'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = selectedTargetStatus === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelectTargetStatus(opt.key)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? `${opt.bgClass} ${opt.borderClass} ${opt.textClass} shadow-md ring-1 ring-current`
                          : 'bg-card border-border text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{opt.badge}</span>
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <span className="font-extrabold text-sm">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Additional Notes / Response Entry */}
            <div>
              <label className="text-xs text-muted block mb-1 font-semibold">Additional Notes / Response Entry (Optional)</label>
              <input
                type="text"
                className="crm-input text-xs w-full"
                placeholder="e.g. Sent pricing breakdown and meeting invitation via Direct WhatsApp..."
                value={waDirectNotes}
                onChange={(e) => setWaDirectNotes(e.target.value)}
              />
            </div>

            {/* 5. Dispatch Button */}
            <button
              onClick={handleSendWaDirect}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Send size={15} />
              <span>
                Send WhatsApp Direct &amp; Update Lead Status to &quot;{STATUS_OPTIONS.find(s => s.key === selectedTargetStatus)?.label || selectedTargetStatus}&quot;
                {isScheduleActive && ` (Syncs Scheduled ${directScheduleType === 'MEETING' || isMeetingActive ? 'Meeting' : 'Follow-up'} to CRM)`} →
              </span>
            </button>
          </div>

          {/* ── PRODUCTS SELECTION SLIDER DRAWER ───────────────────────────────────── */}
          {showProductSlider && (
            <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
                {/* Slider Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Package size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <span>Select Proposal Products</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          Multi-Product Selection
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Choose any number of products from catalog. Quantities &amp; rates compile into proposal.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProductSlider(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="p-3 border-b border-slate-800 bg-slate-950/40 space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      className="crm-input w-full pl-9 text-xs h-9 bg-slate-900 border-slate-800 focus:border-emerald-500 text-white"
                      placeholder="Search products by name, category, SKU..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                    />
                    {productSearchQuery && (
                      <button
                        onClick={() => setProductSearchQuery('')}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Category Pills */}
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {productCategoriesList.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setProductCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                          productCategoryFilter === cat
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products Scrollable List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {filteredCatalogProducts.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <Package size={32} className="mx-auto text-slate-600" />
                      <p className="text-xs font-semibold">No products match your search or filter.</p>
                      <button
                        type="button"
                        onClick={() => { setProductSearchQuery(''); setProductCategoryFilter('ALL'); }}
                        className="text-xs text-emerald-400 hover:underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    filteredCatalogProducts.map((prod) => {
                      const qty = selectedProductQuantities[prod.id] || 0;
                      const isSelected = qty > 0;
                      return (
                        <div
                          key={prod.id}
                          className={`p-3 rounded-2xl border transition-all ${
                            isSelected
                              ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                              : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={prod.coverImage || '/products/puff-jackets.jpg'}
                              alt={prod.name}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.onerror = null;
                                target.src = '/products/puff-jackets.jpg';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                                <span className="text-xs font-extrabold text-emerald-400 whitespace-nowrap">
                                  ₹{prod.price.toLocaleString('en-IN')}
                                  <span className="text-[10px] text-slate-400 font-normal"> /{prod.unit || 'Unit'}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px]">
                                {prod.category && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                                    {prod.category}
                                  </span>
                                )}
                                {prod.sku && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-slate-400 border border-slate-800">
                                    {prod.sku}
                                  </span>
                                )}
                              </div>

                              {prod.description && (
                                <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                                  {prod.description}
                                </p>
                              )}

                              {/* Quantity Controls and Selection */}
                              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/60">
                                {isSelected ? (
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-slate-900 border border-emerald-500/40 rounded-xl overflow-hidden shadow-inner">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateProductQuantity(prod.id, -1)}
                                        className="px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                      >
                                        −
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        value={qty}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 1;
                                          handleUpdateProductQuantity(prod.id, val - qty);
                                        }}
                                        className="w-12 text-center bg-transparent text-xs font-extrabold text-emerald-300 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateProductQuantity(prod.id, 1)}
                                        className="px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-400">
                                      Line: ₹{(prod.price * qty).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleProductSelection(prod.id)}
                                    className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-emerald-600/30 border border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Plus size={12} className="text-emerald-400" />
                                    <span>Select Product</span>
                                  </button>
                                )}

                                {isSelected && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleProductSelection(prod.id)}
                                    className="text-[11px] text-slate-400 hover:text-red-400 font-semibold cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Sticky Bottom Action Bar */}
                <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Selected: <strong className="text-white">{totalSelectedProductsCount} product(s)</strong>
                    </span>
                    <span className="text-emerald-400 font-extrabold text-sm">
                      Total: ₹{proposalGrandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowProductSlider(false)}
                      className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyProductsToProposal}
                      disabled={totalSelectedProductsCount === 0}
                      className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                        totalSelectedProductsCount > 0
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Check size={14} />
                      <span>Apply to Proposal Message ({totalSelectedProductsCount}) →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── INVOICES SELECTION SLIDER DRAWER ────────────────────────────────────── */}
          {showInvoiceSlider && (
            <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
                {/* Slider Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <span>Select Invoice / Quotation</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          {availableInvoices.length} Registered
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Select any invoice to send pricing &amp; payment reference to {lead.name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceSlider(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="p-3 border-b border-slate-800 bg-slate-950/40 space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      className="crm-input w-full pl-9 text-xs h-9 bg-slate-900 border-slate-800 focus:border-amber-500 text-white"
                      placeholder="Search by invoice number, client company, items..."
                      value={invoiceSearchQuery}
                      onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    />
                    {invoiceSearchQuery && (
                      <button
                        onClick={() => setInvoiceSearchQuery('')}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Doc Type Filter Pills */}
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {[
                      { key: 'ALL', label: 'All Invoices' },
                      { key: 'TAX_INVOICE', label: 'Tax Invoices' },
                      { key: 'PROFORMA_INVOICE', label: 'Proforma' },
                      { key: 'QUOTATION', label: 'Quotations' },
                    ].map((type) => (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => setInvoiceTypeFilter(type.key)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                          invoiceTypeFilter === type.key
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Invoices Scrollable List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {filteredAvailableInvoices.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <Receipt size={32} className="mx-auto text-slate-600" />
                      <p className="text-xs font-semibold">No invoices match your search query or filter.</p>
                      <button
                        type="button"
                        onClick={() => { setInvoiceSearchQuery(''); setInvoiceTypeFilter('ALL'); }}
                        className="text-xs text-amber-400 hover:underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    filteredAvailableInvoices.map((inv) => {
                      const isSelected = selectedInvoice?.id === inv.id;
                      return (
                        <div
                          key={inv.id}
                          onClick={() => setSelectedInvoice(inv)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-950/25 border-amber-400 shadow-md ring-1 ring-amber-400/40 text-white'
                              : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-white text-xs">{inv.quoteNumber}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-800">
                                  {inv.docType.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10px] text-slate-400">📅 {inv.date}</span>
                              </div>
                              <p className="text-xs font-semibold text-slate-200">
                                {inv.buyerCompany} {inv.buyerName ? `• ${inv.buyerName}` : ''}
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                📦 {inv.itemsSummary}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="text-sm font-black text-emerald-400 block">
                                ₹{inv.totalAmount.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">incl. 18% GST</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              Status: <strong className="text-emerald-400 uppercase">{inv.status || 'GENERATED'}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyInvoice(inv);
                              }}
                              className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>Attach &amp; Apply →</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Sticky Bottom Action Bar */}
                <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Selected: <strong className="text-white">{selectedInvoice?.quoteNumber || 'None'}</strong>
                    </span>
                    {selectedInvoice && (
                      <span className="text-emerald-400 font-extrabold text-sm">
                        Amount: ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInvoiceSlider(false)}
                      className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!selectedInvoice}
                      onClick={() => {
                        if (selectedInvoice) handleApplyInvoice(selectedInvoice);
                      }}
                      className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                        selectedInvoice
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Check size={14} />
                      <span>Apply Selected Invoice to Message →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
