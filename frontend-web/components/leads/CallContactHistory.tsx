'use client';

import React, { useState } from 'react';
import {
  Phone, PhoneOff, PhoneMissed, PhoneIncoming, MessageSquare,
  Mail, Clock, User, Mic, Calendar, ChevronDown, ChevronUp,
  Activity, TrendingUp, CheckCircle2, XCircle, AlertCircle,
  Package, FileText, BarChart2, ArrowRight, Receipt, ExternalLink, Send
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ContactType =
  | 'CALL_OUT'
  | 'CALL_IN'
  | 'WHATSAPP'
  | 'WHATSAPP_DIRECT'
  | 'WHATSAPP_CLOUD'
  | 'EMAIL'
  | 'EMAIL_DIRECT'
  | 'EMAIL_AUTOMATION'
  | 'CALL_MISSED'
  | 'CALL_BUSY'
  | 'CALL_NOT_RESPONDING'
  | 'CALL_SWITCH_OFF'
  | 'FOLLOWUP_SCHEDULED'
  | 'FOLLOWUP_RESCHEDULED'
  | 'FOLLOWUP_COMPLETED'
  | 'FOLLOWUP_CANCELLED'
  | 'QUOTATION'
  | 'INVOICE';

export type ContactOutcome =
  | 'TALKED'
  | 'NOT_INTERESTED'
  | 'WILL_CALL_BACK'
  | 'INTERESTED_MORE_INFO'
  | 'DEAL_CLOSED'
  | 'FOLLOW_UP_SCHEDULED'
  | 'FOLLOW_UP_RESCHEDULED'
  | 'FOLLOW_UP_COMPLETED'
  | 'FOLLOW_UP_CANCELLED'
  | 'MEETING_SCHEDULED'
  | 'BUSY'
  | 'NO_ANSWER'
  | 'SWITCH_OFF'
  | 'WRONG_NUMBER'
  | 'WA_SENT'
  | 'EMAIL_SENT'
  | 'VOICEMAIL'
  | 'QUOTATION_SHARED'
  | 'INVOICE_SHARED';

export interface ContactAttempt {
  id: string;
  type: ContactType;
  outcome: ContactOutcome;
  scheduledType?: 'CALL' | 'MEETING';
  by: string;                    // Rep name who made the contact or took action
  byRole: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC';
  timestamp: string;             // Full ISO timestamp
  durationSeconds?: number;      // Call duration in seconds
  notes?: string;                // What was discussed / outcome notes
  productInterest?: string;      // Product discussed
  followUpDate?: string;         // Scheduled callback date
  followUpTime?: string;
  sentMessage?: string;          // WA/Email message snippet
  audioRecordingAvailable?: boolean;

  // Quotation & Invoice tracking fields
  docNo?: string;
  docType?: string;
  docAmount?: number;
  docId?: string;
  sharingMedium?: 'WHATSAPP' | 'EMAIL' | 'IN_PERSON' | 'DIRECT' | 'WHATSAPP_DIRECT' | 'WHATSAPP_CLOUD' | 'EMAIL_DIRECT' | 'EMAIL_AUTOMATION' | string;
  sharingMode?: 'ALREADY_SHARED' | 'SHARED_NOW' | 'SHARE_NOW' | string;
  pdfUrl?: string;

  // Follow-up lifecycle synchronization fields
  isRescheduled?: boolean;
  rescheduledAt?: string;
  rescheduledFrom?: string;
  rescheduledById?: string;
  rescheduledByName?: string;
  rescheduledByRole?: string;
  rescheduleReason?: string;

  isCompleted?: boolean;
  completedAt?: string;
  completedById?: string;
  completedByName?: string;
  completedByRole?: string;
  completionNotes?: string;

  isCancelled?: boolean;
  cancelledAt?: string;
  cancelledById?: string;
  cancelledByName?: string;
  cancelledByRole?: string;
  cancelledReason?: string;
}

// ─── Rich Sample Data ──────────────────────────────────────────────────────────

export const SAMPLE_CONTACT_HISTORY: ContactAttempt[] = [];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(secs: number): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTimestamp(iso?: string): { date: string; time: string; dayLabel: string } {
  if (!iso) {
    return { date: 'Today', time: '11:00 AM', dayLabel: 'Today' };
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return { date: String(iso), time: '', dayLabel: 'Today' };
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  let dayLabel: string;
  if (dd.getTime() === today.getTime()) dayLabel = 'Today';
  else if (dd.getTime() === yesterday.getTime()) dayLabel = 'Yesterday';
  else dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return { date, time, dayLabel };
}

export function deduplicateContactAttempts(history: ContactAttempt[]): ContactAttempt[] {
  if (!Array.isArray(history)) return [];
  const result: ContactAttempt[] = [];
  const seenIds = new Set<string>();
  const seenContentKeys = new Set<string>();

  for (const item of history) {
    if (!item) continue;

    // 1. Exact ID match
    if (item.id && seenIds.has(item.id)) {
      continue;
    }

    // 2. Exact semantic content key match (timestamp minute + type + outcome + notes)
    const timeMinute = item.timestamp ? item.timestamp.slice(0, 16) : '';
    const contentKey = `${item.type}_${item.outcome}_${timeMinute}_${item.followUpDate || ''}_${item.followUpTime || ''}_${(item.notes || '').slice(0, 40)}`;
    if (seenContentKeys.has(contentKey)) {
      continue;
    }

    // 3. Prevent duplicate generic FOLLOWUP_SCHEDULED card if a CALL attempt on the same day already covers that scheduled follow-up
    if (item.type === 'FOLLOWUP_SCHEDULED' && item.followUpDate) {
      const isAlreadyCoveredByCall = history.some(other =>
        other &&
        other !== item &&
        other.type.startsWith('CALL') &&
        other.followUpDate === item.followUpDate &&
        (other.followUpTime === item.followUpTime || !item.followUpTime || !other.followUpTime)
      );
      if (isAlreadyCoveredByCall) {
        continue;
      }
    }

    if (item.id) seenIds.add(item.id);
    seenContentKeys.add(contentKey);
    result.push(item);
  }

  return result;
}

function groupByDate(history: ContactAttempt[]): Record<string, ContactAttempt[]> {
  const groups: Record<string, ContactAttempt[]> = {};
  if (!Array.isArray(history)) return groups;
  const deduped = deduplicateContactAttempts(history);
  [...deduped].sort((a, b) => {
    const tA = new Date(a?.timestamp || 0).getTime() || 0;
    const tB = new Date(b?.timestamp || 0).getTime() || 0;
    return tB - tA;
  }).forEach(item => {
    if (!item) return;
    const { dayLabel } = formatTimestamp(item.timestamp);
    if (!groups[dayLabel]) groups[dayLabel] = [];
    groups[dayLabel].push(item);
  });
  return groups;
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  CALL_OUT: { icon: <Phone size={12} />, color: '#34d399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)', label: 'Outbound Call' },
  CALL_IN: { icon: <PhoneIncoming size={12} />, color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.35)', label: 'Inbound Call' },
  CALL_MISSED: { icon: <PhoneMissed size={12} />, color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', label: 'Missed Call' },
  CALL_BUSY: { icon: <PhoneOff size={12} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', label: 'Busy / Engaged' },
  CALL_NOT_RESPONDING: { icon: <PhoneOff size={12} />, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', label: 'Not Responding' },
  CALL_SWITCH_OFF: { icon: <PhoneOff size={12} />, color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', label: 'Switch Off' },
  WHATSAPP: { icon: <MessageSquare size={12} />, color: '#4ade80', bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.35)', label: 'WhatsApp' },
  WHATSAPP_DIRECT: { icon: <MessageSquare size={12} />, color: '#4ade80', bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.35)', label: 'WhatsApp Direct' },
  WHATSAPP_CLOUD: { icon: <MessageSquare size={12} />, color: '#2dd4bf', bg: 'rgba(45,212,191,0.15)', border: 'rgba(45,212,191,0.35)', label: 'WhatsApp Cloud' },
  EMAIL: { icon: <Mail size={12} />, color: '#818cf8', bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.35)', label: 'Email' },
  EMAIL_DIRECT: { icon: <Mail size={12} />, color: '#818cf8', bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.35)', label: 'Email Direct' },
  EMAIL_AUTOMATION: { icon: <Send size={12} />, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)', label: 'Email Automation' },
  FOLLOWUP_SCHEDULED: { icon: <Calendar size={12} />, color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.35)', label: 'Follow-Up Scheduled' },
  FOLLOWUP_RESCHEDULED: { icon: <Clock size={12} />, color: '#0ea5e9', bg: 'rgba(14,165,233,0.2)', border: 'rgba(14,165,233,0.45)', label: 'Follow-Up Rescheduled' },
  FOLLOWUP_COMPLETED: { icon: <CheckCircle2 size={12} />, color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', label: 'Follow-Up Completed' },
  FOLLOWUP_CANCELLED: { icon: <XCircle size={12} />, color: '#f43f5e', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.35)', label: 'Follow-Up Cancelled' },
  QUOTATION: { icon: <FileText size={12} />, color: '#818cf8', bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.35)', label: 'Quotation Shared' },
  INVOICE: { icon: <Receipt size={12} />, color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.35)', label: 'Invoice Shared' },
};

const OUTCOME_META: Record<ContactOutcome, { emoji: string; color: string; label: string }> = {
  TALKED: { emoji: '✅', color: '#34d399', label: 'Talked & Responded' },
  NOT_INTERESTED: { emoji: '❌', color: '#ef4444', label: 'Not Interested' },
  WILL_CALL_BACK: { emoji: '🔄', color: '#f59e0b', label: 'Will Call Back' },
  INTERESTED_MORE_INFO: { emoji: '🔥', color: '#f97316', label: 'Interested — Wants More Info' },
  DEAL_CLOSED: { emoji: '🎉', color: '#22c55e', label: 'Deal Closed!' },
  FOLLOW_UP_SCHEDULED: { emoji: '📅', color: '#38bdf8', label: 'Follow-up Scheduled' },
  FOLLOW_UP_RESCHEDULED: { emoji: '⏱️', color: '#0ea5e9', label: 'Follow-up Rescheduled' },
  FOLLOW_UP_COMPLETED: { emoji: '✅', color: '#10b981', label: 'Follow-up Done' },
  FOLLOW_UP_CANCELLED: { emoji: '🚫', color: '#f43f5e', label: 'Follow-up Cancelled' },
  MEETING_SCHEDULED: { emoji: '🏢', color: '#a855f7', label: 'Meeting Scheduled' },
  BUSY: { emoji: '🔴', color: '#f59e0b', label: 'Line Busy' },
  NO_ANSWER: { emoji: '🔕', color: '#94a3b8', label: 'No Answer' },
  SWITCH_OFF: { emoji: '📴', color: '#6b7280', label: 'Switched Off' },
  WRONG_NUMBER: { emoji: '⚠️', color: '#ef4444', label: 'Wrong Number' },
  WA_SENT: { emoji: '💬', color: '#4ade80', label: 'WhatsApp Sent' },
  EMAIL_SENT: { emoji: '📧', color: '#818cf8', label: 'Email Dispatched' },
  VOICEMAIL: { emoji: '📼', color: '#a78bfa', label: 'Voicemail Left' },
  QUOTATION_SHARED: { emoji: '📄', color: '#818cf8', label: 'Quotation Shared' },
  INVOICE_SHARED: { emoji: '🧾', color: '#38bdf8', label: 'Invoice Shared' },
};

/**
 * Intelligently and accurately resolves what communication medium was used for an attempt:
 * (WhatsApp Direct, WhatsApp Cloud, Email Direct, Email Automation, Outbound/Inbound Call, Follow-up Scheduled, etc.)
 */
export function resolveAttemptMedium(attempt?: Partial<ContactAttempt>): {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
} {
  const notes = (attempt?.notes || '').toLowerCase();
  const sentMsg = (attempt?.sentMessage || '').toLowerCase();
  const type = (attempt?.type || '').toUpperCase();
  const medium = (attempt?.sharingMedium || '').toLowerCase();
  const docType = (attempt?.docType || '').toUpperCase();

  // 1. WhatsApp Cloud
  if (
    notes.includes('whatsapp cloud') ||
    notes.includes('wa cloud') ||
    notes.includes('wacloud') ||
    type === 'WHATSAPP_CLOUD' ||
    medium.includes('cloud')
  ) {
    return {
      key: 'WHATSAPP_CLOUD',
      label: 'WHATSAPP CLOUD',
      icon: <MessageSquare size={11} />,
      color: '#2dd4bf',
      bg: 'rgba(45,212,191,0.15)',
      border: 'rgba(45,212,191,0.35)',
    };
  }

  // 2. WhatsApp Direct
  if (
    notes.includes('whatsapp direct') ||
    notes.includes('wa direct') ||
    (medium.includes('direct') && (medium.includes('whatsapp') || type === 'WHATSAPP')) ||
    type === 'WHATSAPP_DIRECT' ||
    medium === 'whatsapp_direct' ||
    (type === 'WHATSAPP' && (notes.includes('direct') || !notes.includes('cloud')))
  ) {
    return {
      key: 'WHATSAPP_DIRECT',
      label: 'WHATSAPP DIRECT',
      icon: <MessageSquare size={11} />,
      color: '#4ade80',
      bg: 'rgba(74,222,128,0.15)',
      border: 'rgba(74,222,128,0.35)',
    };
  }

  // Generic WhatsApp
  if (
    type === 'WHATSAPP' ||
    medium.includes('whatsapp') ||
    notes.includes('whatsapp') ||
    sentMsg.includes('whatsapp')
  ) {
    return {
      key: 'WHATSAPP_DIRECT',
      label: 'WHATSAPP DIRECT',
      icon: <MessageSquare size={11} />,
      color: '#4ade80',
      bg: 'rgba(74,222,128,0.15)',
      border: 'rgba(74,222,128,0.35)',
    };
  }

  // 3. Email Automation
  if (
    notes.includes('email automation') ||
    notes.includes('auto email') ||
    notes.includes('automation') ||
    notes.includes('drip') ||
    notes.includes('campaign') ||
    type === 'EMAIL_AUTOMATION' ||
    medium.includes('automation')
  ) {
    return {
      key: 'EMAIL_AUTOMATION',
      label: 'EMAIL AUTOMATION',
      icon: <Send size={11} />,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.15)',
      border: 'rgba(167,139,250,0.35)',
    };
  }

  // 4. Email Direct
  if (
    notes.includes('email direct') ||
    (medium.includes('direct') && (medium.includes('email') || type === 'EMAIL')) ||
    type === 'EMAIL_DIRECT' ||
    medium === 'email_direct'
  ) {
    return {
      key: 'EMAIL_DIRECT',
      label: 'EMAIL DIRECT',
      icon: <Mail size={11} />,
      color: '#818cf8',
      bg: 'rgba(129,140,248,0.15)',
      border: 'rgba(129,140,248,0.35)',
    };
  }

  // Generic Email
  if (
    type === 'EMAIL' ||
    medium.includes('email') ||
    notes.includes('email') ||
    sentMsg.includes('email')
  ) {
    return {
      key: 'EMAIL_DIRECT',
      label: 'EMAIL DIRECT',
      icon: <Mail size={11} />,
      color: '#818cf8',
      bg: 'rgba(129,140,248,0.15)',
      border: 'rgba(129,140,248,0.35)',
    };
  }

  // 5. Follow-Up Rescheduled
  if (type === 'FOLLOWUP_RESCHEDULED' || attempt?.outcome === 'FOLLOW_UP_RESCHEDULED') {
    return {
      key: 'FOLLOWUP_RESCHEDULED',
      label: 'FOLLOW-UP RESCHEDULED',
      icon: <Clock size={11} />,
      color: '#0ea5e9',
      bg: 'rgba(14,165,233,0.2)',
      border: 'rgba(14,165,233,0.45)',
    };
  }

  // 6. Scheduled Meeting
  const isMeeting =
    attempt?.outcome === 'MEETING_SCHEDULED' ||
    attempt?.scheduledType === 'MEETING' ||
    /meeting|visit|in-person|walkthrough/i.test(notes) ||
    /meeting|visit|in-person|walkthrough/i.test(sentMsg);

  if (isMeeting) {
    return {
      key: 'MEETING_SCHEDULED',
      label: 'FOLLOW-UP SCHEDULED',
      icon: <Calendar size={11} />,
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.15)',
      border: 'rgba(56,189,248,0.35)',
    };
  }

  // 7. Follow-Up Scheduled
  if (type === 'FOLLOWUP_SCHEDULED' || attempt?.outcome === 'FOLLOW_UP_SCHEDULED') {
    return {
      key: 'FOLLOWUP_SCHEDULED',
      label: 'FOLLOW-UP SCHEDULED',
      icon: <Calendar size={11} />,
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.15)',
      border: 'rgba(56,189,248,0.35)',
    };
  }

  // 8. Quotation standalone
  if (type === 'QUOTATION' || attempt?.outcome === 'QUOTATION_SHARED' || (docType && !docType.includes('INVOICE'))) {
    return {
      key: 'QUOTATION',
      label: 'QUOTATION',
      icon: <FileText size={11} />,
      color: '#818cf8',
      bg: 'rgba(129,140,248,0.15)',
      border: 'rgba(129,140,248,0.35)',
    };
  }

  // 9. Invoice standalone
  if (type === 'INVOICE' || attempt?.outcome === 'INVOICE_SHARED' || docType.includes('INVOICE')) {
    return {
      key: 'INVOICE',
      label: 'INVOICE',
      icon: <Receipt size={11} />,
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.15)',
      border: 'rgba(56,189,248,0.35)',
    };
  }

  // 10. Phone Calls
  if (type === 'CALL_IN') {
    return {
      key: 'CALL_IN',
      label: 'INBOUND CALL',
      icon: <PhoneIncoming size={11} />,
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.15)',
      border: 'rgba(56,189,248,0.35)',
    };
  }
  if (type === 'CALL_MISSED' || attempt?.outcome === 'NO_ANSWER') {
    return {
      key: 'CALL_MISSED',
      label: 'MISSED CALL',
      icon: <PhoneMissed size={11} />,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.15)',
      border: 'rgba(239,68,68,0.35)',
    };
  }
  if (type === 'CALL_BUSY' || attempt?.outcome === 'BUSY') {
    return {
      key: 'CALL_BUSY',
      label: 'BUSY / ENGAGED',
      icon: <PhoneOff size={11} />,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.15)',
      border: 'rgba(245,158,11,0.35)',
    };
  }
  if (type === 'CALL_NOT_RESPONDING') {
    return {
      key: 'CALL_NOT_RESPONDING',
      label: 'NOT RESPONDING',
      icon: <PhoneOff size={11} />,
      color: '#94a3b8',
      bg: 'rgba(148,163,184,0.1)',
      border: 'rgba(148,163,184,0.25)',
    };
  }
  if (type === 'CALL_SWITCH_OFF' || attempt?.outcome === 'SWITCH_OFF') {
    return {
      key: 'CALL_SWITCH_OFF',
      label: 'SWITCH OFF',
      icon: <PhoneOff size={11} />,
      color: '#6b7280',
      bg: 'rgba(107,114,128,0.12)',
      border: 'rgba(107,114,128,0.3)',
    };
  }

  // Default: Outbound Call
  return {
    key: 'CALL_OUT',
    label: 'OUTBOUND CALL',
    icon: <Phone size={11} />,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.15)',
    border: 'rgba(52,211,153,0.35)',
  };
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CallContactHistoryProps {
  history?: ContactAttempt[];
  leadName?: string;
  leadPhone?: string;
  interestedProduct?: string;
  onOpenShareQuoteInvoice?: () => void;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CallContactHistory({
  history = SAMPLE_CONTACT_HISTORY,
  leadName = 'Lead',
  leadPhone = '',
  interestedProduct = '—',
  onOpenShareQuoteInvoice,
}: CallContactHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  // ── Clean & Deduplicate History Attempts ────────────────────────────────────
  const cleanHistory = deduplicateContactAttempts(history);

  // ── Computed Stats ──────────────────────────────────────────────────────────
  const totalAttempts = cleanHistory.length;
  const connectedCalls = cleanHistory.filter(h => ['CALL_OUT', 'CALL_IN'].includes(h.type) && h.durationSeconds && h.durationSeconds > 0).length;
  const missedOrNoAnswer = cleanHistory.filter(h => ['CALL_MISSED', 'CALL_BUSY', 'CALL_NOT_RESPONDING', 'CALL_SWITCH_OFF'].includes(h.type) || h.outcome === 'NO_ANSWER' || h.outcome === 'BUSY').length;
  const totalCalls = cleanHistory.filter(h => ['CALL_OUT', 'CALL_IN', 'CALL_MISSED', 'CALL_BUSY', 'CALL_NOT_RESPONDING', 'CALL_SWITCH_OFF'].includes(h.type)).length;
  
  const meetingCount = cleanHistory.filter(h => h.outcome === 'MEETING_SCHEDULED' || h.scheduledType === 'MEETING' || Boolean(h.notes && /meeting|visit|in-person/i.test(h.notes))).length;
  
  const waDirectCount = cleanHistory.filter(h => {
    const m = resolveAttemptMedium(h);
    return (m.key === 'WHATSAPP_DIRECT' || m.key === 'WHATSAPP') && !m.key.includes('CLOUD');
  }).length;

  const waCloudCount = cleanHistory.filter(h => {
    const m = resolveAttemptMedium(h);
    return m.key === 'WHATSAPP_CLOUD';
  }).length;

  const emailDirectCount = cleanHistory.filter(h => {
    const m = resolveAttemptMedium(h);
    return m.key === 'EMAIL_DIRECT' || (m.key === 'EMAIL' && !m.key.includes('AUTOMATION'));
  }).length;

  const emailAutoCount = cleanHistory.filter(h => {
    const m = resolveAttemptMedium(h);
    return m.key === 'EMAIL_AUTOMATION';
  }).length;

  const waTotalCount = waDirectCount + waCloudCount;
  const emailTotalCount = emailDirectCount + emailAutoCount;

  const followUpCount = cleanHistory.filter(h => h.type.startsWith('FOLLOWUP_') || Boolean(h.followUpDate) || Boolean(h.isRescheduled)).length;
  const quotationCount = cleanHistory.filter(h => h.type === 'QUOTATION' || h.outcome === 'QUOTATION_SHARED' || (h.docType && !h.docType.includes('INVOICE')) || Boolean(h.notes && /quotation/i.test(h.notes))).length;
  const invoiceCount = cleanHistory.filter(h => h.type === 'INVOICE' || h.outcome === 'INVOICE_SHARED' || (h.docType && h.docType.includes('INVOICE')) || Boolean(h.notes && /invoice/i.test(h.notes))).length;
  const totalTalkSecs = cleanHistory.reduce((acc, h) => acc + (h.durationSeconds || 0), 0);
  
  // Resolve Interested Product / Service (from lead profile or logged history)
  const displayProduct = (interestedProduct && interestedProduct !== '—' && interestedProduct.trim())
    ? interestedProduct
    : (cleanHistory.find(h => h.productInterest)?.productInterest || '—');

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = filterType === 'ALL'
    ? cleanHistory
    : filterType === 'MEETING'
    ? cleanHistory.filter(h => h.outcome === 'MEETING_SCHEDULED' || h.scheduledType === 'MEETING' || Boolean(h.notes && /meeting|visit|in-person/i.test(h.notes)))
    : filterType === 'CALLS'
    ? cleanHistory.filter(h => ['CALL_OUT', 'CALL_IN', 'CALL_MISSED', 'CALL_BUSY', 'CALL_NOT_RESPONDING', 'CALL_SWITCH_OFF'].includes(h.type))
    : filterType === 'FOLLOW_UP'
    ? cleanHistory.filter(h => h.type.startsWith('FOLLOWUP_') || Boolean(h.followUpDate) || Boolean(h.isRescheduled))
    : filterType === 'QUOTATION'
    ? cleanHistory.filter(h => h.type === 'QUOTATION' || h.outcome === 'QUOTATION_SHARED' || (h.docType && !h.docType.includes('INVOICE')) || Boolean(h.notes && /quotation/i.test(h.notes)))
    : filterType === 'INVOICE'
    ? cleanHistory.filter(h => h.type === 'INVOICE' || h.outcome === 'INVOICE_SHARED' || (h.docType && h.docType.includes('INVOICE')) || Boolean(h.notes && /invoice/i.test(h.notes)))
    : filterType === 'WHATSAPP_DIRECT'
    ? cleanHistory.filter(h => {
        const m = resolveAttemptMedium(h);
        return m.key === 'WHATSAPP_DIRECT' || (m.key === 'WHATSAPP' && !m.key.includes('CLOUD'));
      })
    : filterType === 'WHATSAPP_CLOUD'
    ? cleanHistory.filter(h => resolveAttemptMedium(h).key === 'WHATSAPP_CLOUD')
    : filterType === 'EMAIL_DIRECT'
    ? cleanHistory.filter(h => {
        const m = resolveAttemptMedium(h);
        return m.key === 'EMAIL_DIRECT' || (m.key === 'EMAIL' && !m.key.includes('AUTOMATION'));
      })
    : filterType === 'EMAIL_AUTOMATION'
    ? cleanHistory.filter(h => resolveAttemptMedium(h).key === 'EMAIL_AUTOMATION')
    : filterType === 'CALL_BUSY'
    ? cleanHistory.filter(h => ['CALL_MISSED', 'CALL_BUSY', 'CALL_NOT_RESPONDING', 'CALL_SWITCH_OFF'].includes(h.type) || h.outcome === 'NO_ANSWER' || h.outcome === 'BUSY')
    : cleanHistory.filter(h => h.type === filterType);
  const grouped = groupByDate(filtered);

  return (
    <div className="crm-card space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Activity size={16} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Full Contact History & Call Timeline</h3>
            <p className="text-[11px] text-slate-400">Every call, WhatsApp, email, quotation & invoice — with outcome, rep & notes</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {quotationCount > 0 && (
            <span className="text-[11px] font-extrabold text-indigo-300 bg-indigo-500/15 border border-indigo-500/35 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span>📄</span> {quotationCount} Quotation{quotationCount > 1 ? 's' : ''}
            </span>
          )}
          {invoiceCount > 0 && (
            <span className="text-[11px] font-extrabold text-sky-300 bg-sky-500/15 border border-sky-500/35 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span>🧾</span> {invoiceCount} Invoice{invoiceCount > 1 ? 's' : ''}
            </span>
          )}
          {meetingCount > 0 && (
            <span className="text-[11px] font-extrabold text-purple-300 bg-purple-500/15 border border-purple-500/35 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span>🏢</span> {meetingCount} Meeting{meetingCount > 1 ? 's' : ''}
            </span>
          )}
          {followUpCount > 0 && (
            <span className="text-[11px] font-extrabold text-sky-300 bg-sky-500/15 border border-sky-500/35 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Clock size={11} className="text-sky-400" /> {followUpCount} Follow-Up{followUpCount > 1 ? 's' : ''}
            </span>
          )}
          {onOpenShareQuoteInvoice && (
            <button
              onClick={onOpenShareQuoteInvoice}
              className="text-[11px] font-extrabold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              title="Share Quotation or Invoice with Lead"
            >
              <span>📄</span> + Share Quote / Invoice
            </button>
          )}
          <span className="text-[11px] font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-full">
            {totalAttempts} Total Contact Attempts
          </span>
        </div>
      </div>

      {/* ── Stats Summary Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { label: 'Connected', value: connectedCalls, color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: <Phone size={13} /> },
          { label: 'Missed/No Ans', value: missedOrNoAnswer, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: <PhoneMissed size={13} /> },
          { label: 'WhatsApp', value: waTotalCount, color: '#4ade80', bg: 'rgba(74,222,128,0.12)', icon: <MessageSquare size={13} /> },
          { label: 'Email', value: emailTotalCount, color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: <Mail size={13} /> },
          { label: 'Talk Time', value: formatDuration(totalTalkSecs), color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', icon: <Mic size={13} /> },
          { label: 'Interested Product / Service', value: displayProduct, color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: <Package size={13} /> },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-2.5 rounded-xl border text-center space-y-0.5 min-w-0 flex flex-col justify-between"
            style={{ background: stat.bg, borderColor: stat.color + '40' }}
            title={typeof stat.value === 'string' ? stat.value : undefined}
          >
            <div className="flex justify-center" style={{ color: stat.color }}>{stat.icon}</div>
            <p className="text-sm font-extrabold text-white truncate px-0.5 leading-tight" title={String(stat.value)}>
              {stat.value}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate" title={stat.label}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filter Chips ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'ALL', label: `All (${totalAttempts})`, color: '#818cf8' },
          { key: 'MEETING', label: `🏢 Meetings (${meetingCount})`, color: '#c084fc' },
          { key: 'CALLS', label: `📞 Calls (${totalCalls})`, color: '#34d399' },
          { key: 'FOLLOW_UP', label: `⏱️ Follow-ups (${followUpCount})`, color: '#38bdf8' },
          { key: 'QUOTATION', label: `📄 Quotations (${quotationCount})`, color: '#a5b4fc' },
          { key: 'INVOICE', label: `🧾 Invoices (${invoiceCount})`, color: '#7dd3fc' },
          { key: 'WHATSAPP_DIRECT', label: `💬 WhatsApp Direct (${waDirectCount})`, color: '#4ade80' },
          { key: 'WHATSAPP_CLOUD', label: `💬 WhatsApp Cloud (${waCloudCount})`, color: '#2dd4bf' },
          { key: 'EMAIL_DIRECT', label: `📧 Email Direct (${emailDirectCount})`, color: '#818cf8' },
          { key: 'EMAIL_AUTOMATION', label: `⚡ Email Automation (${emailAutoCount})`, color: '#a78bfa' },
          { key: 'CALL_BUSY', label: `🔴 Busy/Missed (${missedOrNoAnswer})`, color: '#f59e0b' },
        ].map(chip => (
          <button
            key={chip.key}
            onClick={() => setFilterType(chip.key)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer"
            style={{
              background: filterType === chip.key ? `${chip.color}25` : 'rgba(15,23,42,0.8)',
              borderColor: filterType === chip.key ? `${chip.color}60` : 'rgb(30,41,59)',
              color: filterType === chip.key ? chip.color : '#94a3b8',
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Date-Grouped Timeline ──────────────────────────────────────────────── */}
      <div className="space-y-5">
        {Object.entries(grouped).map(([dayLabel, items]) => (
          <div key={dayLabel}>
            {/* Date Group Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                <Calendar size={11} className="text-indigo-400" />
                {dayLabel}
              </div>
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] font-bold text-slate-500">{items.length} contact{items.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Items */}
            <div className="space-y-2 relative">
              {/* Vertical timeline track */}
              <div className="absolute left-[18px] top-6 bottom-2 w-0.5 bg-gradient-to-b from-slate-700 to-transparent pointer-events-none" />

              {items.map((attempt, idx) => {
                // Intelligently detect if this outreach record represents a scheduled meeting / visit
                const isMeeting =
                  attempt?.outcome === 'MEETING_SCHEDULED' ||
                  attempt?.scheduledType === 'MEETING' ||
                  Boolean(attempt?.notes && /meeting|visit|in-person|walkthrough/i.test(attempt.notes)) ||
                  Boolean(attempt?.sentMessage && /meeting|visit|in-person|walkthrough/i.test(attempt.sentMessage));

                // Fallback resolution for followUpDate and followUpTime if missing from direct attempt object
                const resolvedFollowUpDate = attempt?.followUpDate || (() => {
                  const match = (attempt?.notes || attempt?.sentMessage || '').match(/(?:Scheduled\s+(?:MEETING|FOLLOWUP|CALL)\s+for\s+|due:\s*|on\s+)(\d{4}-\d{2}-\d{2})/i);
                  return match ? match[1] : undefined;
                })();

                const resolvedFollowUpTime = attempt?.followUpTime || (() => {
                  const match = (attempt?.notes || attempt?.sentMessage || '').match(/(?:at\s+|time:\s*)(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i);
                  return match ? match[1] : undefined;
                })();

                const isFollowUpAction = attempt?.type?.startsWith('FOLLOWUP_') || attempt?.outcome?.startsWith('FOLLOW_UP_') || isMeeting || Boolean(resolvedFollowUpDate);

                // Accurate medium resolution
                const mediumMeta = resolveAttemptMedium(attempt);

                // Outcome resolution
                let resolvedOutcome: ContactOutcome = attempt?.outcome || 'TALKED';
                if (
                  attempt?.outcome === 'QUOTATION_SHARED' ||
                  attempt?.type === 'QUOTATION' ||
                  (Boolean(attempt?.docType) && !attempt?.docType?.includes('INVOICE')) ||
                  (Boolean(attempt?.notes) && /quotation/i.test(attempt?.notes || ''))
                ) {
                  resolvedOutcome = 'QUOTATION_SHARED';
                } else if (
                  attempt?.outcome === 'INVOICE_SHARED' ||
                  attempt?.type === 'INVOICE' ||
                  (Boolean(attempt?.docType) && attempt?.docType?.includes('INVOICE')) ||
                  (Boolean(attempt?.notes) && /invoice/i.test(attempt?.notes || ''))
                ) {
                  resolvedOutcome = 'INVOICE_SHARED';
                } else if (isMeeting) {
                  resolvedOutcome = 'MEETING_SCHEDULED';
                } else if (mediumMeta.key === 'WHATSAPP_DIRECT' || mediumMeta.key === 'WHATSAPP' || mediumMeta.key === 'WHATSAPP_CLOUD') {
                  if (attempt?.outcome === 'FOLLOW_UP_SCHEDULED' && !isMeeting) {
                    resolvedOutcome = 'FOLLOW_UP_SCHEDULED';
                  } else if (!attempt?.outcome || attempt?.outcome === 'TALKED' || attempt?.outcome === 'WA_SENT') {
                    resolvedOutcome = 'WA_SENT';
                  }
                } else if (mediumMeta.key === 'EMAIL_DIRECT' || mediumMeta.key === 'EMAIL' || mediumMeta.key === 'EMAIL_AUTOMATION') {
                  if (!attempt?.outcome || attempt?.outcome === 'TALKED' || attempt?.outcome === 'EMAIL_SENT') {
                    resolvedOutcome = 'EMAIL_SENT';
                  }
                }

                const outcomeMeta = isMeeting
                  ? OUTCOME_META.MEETING_SCHEDULED
                  : (OUTCOME_META[resolvedOutcome] || OUTCOME_META.TALKED);

                const { time, date } = formatTimestamp(attempt?.timestamp);
                const isExpanded = expandedId === attempt?.id;
                const isPositive = ['TALKED', 'INTERESTED_MORE_INFO', 'DEAL_CLOSED', 'FOLLOW_UP_SCHEDULED', 'FOLLOW_UP_RESCHEDULED', 'FOLLOW_UP_COMPLETED', 'MEETING_SCHEDULED', 'WA_SENT', 'EMAIL_SENT'].includes(attempt?.outcome || '') || isMeeting || isFollowUpAction;

                // Timeline Left Node appearance
                let nodeBg = mediumMeta.bg;
                let nodeBorder = mediumMeta.border;
                let nodeIcon = mediumMeta.icon;
                let nodeColor = mediumMeta.color;

                if (isMeeting) {
                  nodeBg = 'rgba(168,85,247,0.15)';
                  nodeBorder = 'rgba(168,85,247,0.45)';
                  nodeIcon = <Calendar size={13} className="text-purple-400" />;
                  nodeColor = '#c084fc';
                } else if (mediumMeta.key === 'WHATSAPP_DIRECT' || mediumMeta.key === 'WHATSAPP') {
                  nodeBg = 'rgba(74,222,128,0.15)';
                  nodeBorder = 'rgba(74,222,128,0.45)';
                  nodeIcon = <MessageSquare size={13} className="text-emerald-400" />;
                  nodeColor = '#4ade80';
                } else if (mediumMeta.key === 'WHATSAPP_CLOUD') {
                  nodeBg = 'rgba(45,212,191,0.15)';
                  nodeBorder = 'rgba(45,212,191,0.45)';
                  nodeIcon = <MessageSquare size={13} className="text-teal-400" />;
                  nodeColor = '#2dd4bf';
                } else if (mediumMeta.key === 'EMAIL_AUTOMATION') {
                  nodeBg = 'rgba(167,139,250,0.15)';
                  nodeBorder = 'rgba(167,139,250,0.45)';
                  nodeIcon = <Send size={13} className="text-violet-400" />;
                  nodeColor = '#a78bfa';
                } else if (mediumMeta.key === 'EMAIL_DIRECT' || mediumMeta.key === 'EMAIL') {
                  nodeBg = 'rgba(129,140,248,0.15)';
                  nodeBorder = 'rgba(129,140,248,0.45)';
                  nodeIcon = <Mail size={13} className="text-indigo-400" />;
                  nodeColor = '#818cf8';
                } else if (attempt?.type === 'FOLLOWUP_RESCHEDULED' || attempt?.outcome === 'FOLLOW_UP_RESCHEDULED') {
                  nodeBg = 'rgba(14,165,233,0.2)';
                  nodeBorder = 'rgba(14,165,233,0.5)';
                  nodeIcon = <Clock size={13} className="text-sky-400" />;
                  nodeColor = '#38bdf8';
                } else if (attempt?.type === 'FOLLOWUP_SCHEDULED' || attempt?.outcome === 'FOLLOW_UP_SCHEDULED') {
                  nodeBg = 'rgba(56,189,248,0.15)';
                  nodeBorder = 'rgba(56,189,248,0.35)';
                  nodeIcon = <Calendar size={13} className="text-sky-400" />;
                  nodeColor = '#38bdf8';
                }

                // Card container styling
                const cardBorder = isMeeting
                  ? 'rgba(168,85,247,0.4)'
                  : attempt?.type === 'FOLLOWUP_RESCHEDULED'
                  ? 'rgba(14,165,233,0.45)'
                  : mediumMeta.key === 'WHATSAPP_DIRECT' || mediumMeta.key === 'WHATSAPP'
                  ? 'rgba(74,222,128,0.35)'
                  : mediumMeta.key === 'WHATSAPP_CLOUD'
                  ? 'rgba(45,212,191,0.35)'
                  : mediumMeta.key === 'EMAIL_AUTOMATION'
                  ? 'rgba(167,139,250,0.35)'
                  : mediumMeta.key === 'EMAIL_DIRECT' || mediumMeta.key === 'EMAIL'
                  ? 'rgba(129,140,248,0.35)'
                  : isPositive
                  ? mediumMeta.border
                  : 'rgb(30,41,59)';

                const cardBg = isMeeting
                  ? 'rgba(26,16,43,0.7)'
                  : attempt?.type === 'FOLLOWUP_RESCHEDULED'
                  ? 'rgba(12,25,44,0.75)'
                  : mediumMeta.key === 'WHATSAPP_DIRECT' || mediumMeta.key === 'WHATSAPP'
                  ? 'rgba(10,30,22,0.7)'
                  : mediumMeta.key === 'WHATSAPP_CLOUD'
                  ? 'rgba(10,32,30,0.7)'
                  : mediumMeta.key === 'EMAIL_AUTOMATION'
                  ? 'rgba(24,18,40,0.7)'
                  : mediumMeta.key === 'EMAIL_DIRECT' || mediumMeta.key === 'EMAIL'
                  ? 'rgba(16,20,40,0.7)'
                  : 'rgba(15,23,42,0.7)';

                return (
                  <div key={attempt?.id || `attempt-${idx}`} className="flex gap-3 relative">
                    {/* Timeline Node */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center border-2 flex-shrink-0 z-10 mt-0.5"
                      style={{
                        background: nodeBg,
                        borderColor: nodeBorder,
                      }}
                    >
                      <span style={{ color: nodeColor }}>
                        {nodeIcon}
                      </span>
                    </div>

                    {/* Card */}
                    <div
                      className="flex-1 rounded-2xl border overflow-hidden"
                      style={{
                        borderColor: cardBorder,
                        background: cardBg,
                      }}
                    >
                      {/* Card Header — Always Visible */}
                      <button
                        className="w-full text-left p-3 flex items-start gap-3 hover:bg-slate-900/40 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : attempt.id)}
                      >
                        <div className="flex-1 min-w-0">
                          {/* Type badge + outcome */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {/* Medium Badge (Badge 1) */}
                            <span
                              className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1"
                              style={{ background: mediumMeta.bg, color: mediumMeta.color, border: `1px solid ${mediumMeta.border}` }}
                            >
                              {mediumMeta.icon} {mediumMeta.label}
                            </span>

                            {/* Outcome Badge (Badge 2) */}
                            <span
                              className="text-[11px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1"
                              style={{
                                color: outcomeMeta.color,
                                background: isMeeting ? 'rgba(168,85,247,0.15)' : attempt?.type === 'FOLLOWUP_RESCHEDULED' ? 'rgba(14,165,233,0.15)' : 'transparent',
                                border: isMeeting ? '1px solid rgba(168,85,247,0.3)' : attempt?.type === 'FOLLOWUP_RESCHEDULED' ? '1px solid rgba(14,165,233,0.3)' : 'none',
                              }}
                            >
                              <span>{outcomeMeta.emoji}</span> <span>{outcomeMeta.label}</span>
                            </span>

                            {attempt.isRescheduled && attempt.type !== 'FOLLOWUP_RESCHEDULED' && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                                🔄 Callback Rescheduled
                              </span>
                            )}
                            {Boolean(attempt.productInterest && typeof attempt.productInterest === 'string' && attempt.productInterest.trim()) && (
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 flex items-center gap-1 shadow-sm">
                                <Package size={9} className="text-emerald-400" /> {attempt.productInterest!.trim()}
                              </span>
                            )}
                            {Boolean(resolvedFollowUpDate && attempt.type !== 'FOLLOWUP_SCHEDULED' && attempt.type !== 'FOLLOWUP_RESCHEDULED') && (
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/35 flex items-center gap-1 shadow-sm">
                                <Clock size={9} className="text-sky-400" /> Follow-up: {resolvedFollowUpDate} {resolvedFollowUpTime ? `@ ${resolvedFollowUpTime}` : ''}
                              </span>
                            )}
                            {attempt.durationSeconds !== undefined && attempt.durationSeconds > 0 && (
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Mic size={9} /> {formatDuration(attempt.durationSeconds)}
                              </span>
                            )}
                            {attempt.audioRecordingAvailable && (
                              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 rounded">
                                🎙 Rec
                              </span>
                            )}
                          </div>

                          {/* Rep + timestamp */}
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                            <User size={10} className="text-slate-500" />
                            <span className="font-bold text-slate-300">{attempt.by}</span>
                            <span>·</span>
                            <Clock size={10} />
                            <span>{time}</span>
                            {attempt.rescheduleReason && (
                              <span className="text-sky-300/90 text-[10px] font-semibold truncate max-w-[260px] hidden md:inline-block">
                                — Reason: {attempt.rescheduleReason}
                              </span>
                            )}
                            {!attempt.rescheduleReason && attempt.notes && (
                              <span className="text-slate-400 text-[10px] italic truncate max-w-[320px] hidden md:block">
                                — {attempt.notes.substring(0, 70)}...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expand icon */}
                        <div className="flex-shrink-0 text-slate-500">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3 border-t border-slate-800/60">
                          {/* Full Notes / Summary */}
                          {attempt.notes && attempt.type !== 'FOLLOWUP_RESCHEDULED' && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText size={10} /> {attempt.type.startsWith('CALL') ? 'Call Notes / Outcome Details' : 'Activity Notes & Details'}
                              </p>
                              <p className="text-xs text-slate-200 leading-relaxed italic">"{attempt.notes}"</p>
                            </div>
                          )}

                          {/* 🔄 ACTION & DECISION TRAIL FOR FOLLOW-UP RESCHEDULED */}
                          {attempt.type === 'FOLLOWUP_RESCHEDULED' && (
                            <div className="mt-3 p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/35 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-extrabold text-sky-300 flex items-center gap-1.5">
                                  <Clock size={13} className="text-sky-400" />
                                  Rescheduled by {attempt.rescheduledByName || attempt.by} {attempt.rescheduledByRole ? `(${attempt.rescheduledByRole})` : ''}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {attempt.timestamp ? new Date(attempt.timestamp).toLocaleString('en-IN') : 'Updated'}
                                </span>
                              </div>
                              {attempt.rescheduleReason && (
                                <div className="text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-slate-200 leading-relaxed">
                                  <strong className="text-sky-300">Reason:</strong> {attempt.rescheduleReason}
                                </div>
                              )}
                              <div className="flex items-center justify-between pt-1 text-xs flex-wrap gap-2">
                                <p className="text-sky-200 font-extrabold flex items-center gap-1.5">
                                  <Calendar size={13} className="text-sky-400" />
                                  Moved to: <span>{(() => {
                                    const d = new Date(attempt.followUpDate || '');
                                    return !isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (attempt.followUpDate || 'New Slot');
                                  })()} {attempt.followUpTime ? `at ${attempt.followUpTime}` : ''}</span>
                                </p>
                                {attempt.rescheduledFrom && (
                                  <span className="text-[10px] text-slate-500">
                                    Original slot: {attempt.rescheduledFrom}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* ✅ ACTION & DECISION TRAIL FOR FOLLOW-UP COMPLETED */}
                          {attempt.type === 'FOLLOWUP_COMPLETED' && (
                            <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-extrabold text-emerald-300 flex items-center gap-1.5">
                                  <CheckCircle2 size={13} className="text-emerald-400" />
                                  Marked Complete by {attempt.completedByName || attempt.by} {attempt.completedByRole ? `(${attempt.completedByRole})` : ''}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {attempt.completedAt || attempt.timestamp ? new Date(attempt.completedAt || attempt.timestamp).toLocaleString('en-IN') : 'Completed'}
                                </span>
                              </div>
                              {attempt.outcome && (
                                <p className="text-xs text-emerald-300 font-semibold"><strong className="text-emerald-400">Outcome:</strong> {attempt.outcome}</p>
                              )}
                              {attempt.completionNotes && (
                                <p className="text-xs text-slate-200 italic"><strong className="text-emerald-400">Notes:</strong> "{attempt.completionNotes}"</p>
                              )}
                            </div>
                          )}

                          {/* ❌ ACTION & DECISION TRAIL FOR FOLLOW-UP CANCELLED */}
                          {attempt.type === 'FOLLOWUP_CANCELLED' && (
                            <div className="mt-3 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-extrabold text-rose-300 flex items-center gap-1.5">
                                  <XCircle size={13} className="text-rose-400" />
                                  Cancelled by {attempt.cancelledByName || attempt.by} {attempt.cancelledByRole ? `(${attempt.cancelledByRole})` : ''}
                                </span>
                              </div>
                              {attempt.cancelledReason && (
                                <p className="text-xs text-slate-200"><strong className="text-rose-400">Reason:</strong> {attempt.cancelledReason}</p>
                              )}
                            </div>
                          )}

                          {/* 📄 / 🧾 QUOTATION OR INVOICE SHARED CARD */}
                          {(attempt.type === 'QUOTATION' || attempt.type === 'INVOICE' || attempt.outcome === 'QUOTATION_SHARED' || attempt.outcome === 'INVOICE_SHARED' || attempt.docNo) && (
                            <div className="p-3 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-2.5">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{attempt.type === 'INVOICE' || attempt.outcome === 'INVOICE_SHARED' || (attempt.docType && attempt.docType.includes('INVOICE')) ? '🧾' : '📄'}</span>
                                  <div>
                                    <span className="text-xs font-mono font-black text-indigo-300">
                                      {attempt.docNo ? `#${attempt.docNo}` : (attempt.type === 'INVOICE' ? 'Invoice Document' : 'Quotation Document')}
                                    </span>
                                    {attempt.docType && (
                                      <span className="ml-2 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                        {attempt.docType.replace('_', ' ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {attempt.docAmount !== undefined && attempt.docAmount > 0 && (
                                  <span className="text-xs font-black font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                    ₹{Number(attempt.docAmount).toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>

                              {/* Medium and sharing mode badge */}
                              <div className="flex items-center gap-2 flex-wrap text-[10px]">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700 flex items-center gap-1">
                                  {attempt.sharingMedium === 'WHATSAPP' || (attempt.sharingMedium as any) === 'WHATSAPP_DIRECT' ? (
                                    <><span>💬</span> Via WhatsApp Direct</>
                                  ) : attempt.sharingMedium === 'EMAIL' ? (
                                    <><span>📧</span> Via Email</>
                                  ) : attempt.sharingMedium === 'IN_PERSON' ? (
                                    <><span>🤝</span> In-Person / Handover</>
                                  ) : (
                                    <><span>🚀</span> Direct Share</>
                                  )}
                                </span>
                                {attempt.sharingMode && (
                                  <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/30">
                                    {attempt.sharingMode === 'ALREADY_SHARED' ? '✓ Already Shared' : '⚡ Shared Direct'}
                                  </span>
                                )}
                                <a
                                  href="/quotes"
                                  className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 font-bold border border-indigo-500/40 flex items-center gap-1 transition-colors"
                                >
                                  <ExternalLink size={10} /> View in Quotes Module
                                </a>
                                {leadPhone && (
                                  <a
                                    href={`https://wa.me/${leadPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${leadName}, following up regarding your ${attempt.docType ? attempt.docType.replace('_', ' ') : 'Quotation'} #${attempt.docNo || ''}.`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1 transition-colors"
                                  >
                                    <MessageSquare size={10} /> Re-open on WhatsApp
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Product Interest */}
                          {Boolean(attempt.productInterest && typeof attempt.productInterest === 'string' && attempt.productInterest.trim()) && (
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
                              <Package size={13} className="text-indigo-400 flex-shrink-0" />
                              <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Product Discussed</p>
                                <p className="text-xs font-bold text-indigo-300">{attempt.productInterest!.trim()}</p>
                              </div>
                            </div>
                          )}

                          {/* WhatsApp / Email message sent */}
                          {attempt.sentMessage && (
                            <div className="p-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 space-y-1">
                              <p className="text-[10px] font-extrabold text-slate-400 uppercase flex items-center gap-1.5">
                                <MessageSquare size={10} /> Message Sent
                              </p>
                              <p className="text-[11px] text-slate-300 italic leading-relaxed">"{attempt.sentMessage}"</p>
                            </div>
                          )}

                          {/* Follow-up OR Meeting scheduled (Differentiated with distinct styling & label) */}
                          {resolvedFollowUpDate && (
                            isMeeting ? (
                              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-500/12 border border-purple-500/35">
                                <Calendar size={15} className="text-purple-400 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <span>🏢</span> IN-PERSON / VIRTUAL MEETING SCHEDULED
                                  </p>
                                  <p className="text-xs font-extrabold text-purple-200 mt-0.5">
                                    {(() => {
                                      const d = new Date(resolvedFollowUpDate);
                                      return !isNaN(d.getTime())
                                        ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : resolvedFollowUpDate;
                                    })()}
                                    {resolvedFollowUpTime && <span className="ml-2 font-black text-white">at {resolvedFollowUpTime}</span>}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar size={13} className="text-sky-400" />
                                    <p className="text-[10px] font-extrabold text-slate-300 uppercase">
                                      {attempt.isRescheduled ? 'Follow-Up / Callback (Rescheduled)' : 'Follow-Up / Callback Scheduled'}
                                    </p>
                                  </div>
                                  {attempt.isRescheduled && (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                                      🔄 Rescheduled
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs font-extrabold text-sky-300">
                                  {(() => {
                                    const d = new Date(resolvedFollowUpDate);
                                    return !isNaN(d.getTime())
                                      ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                      : resolvedFollowUpDate;
                                  })()}
                                  {resolvedFollowUpTime && <span className="ml-2 font-black text-white">at {resolvedFollowUpTime}</span>}
                                </p>

                                {attempt.isRescheduled && (
                                  <div className="text-[11px] bg-sky-950/70 p-2.5 rounded-lg border border-sky-500/30 text-slate-200 space-y-1">
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="font-bold text-sky-300">
                                        Rescheduled by {attempt.rescheduledByName || attempt.by} {attempt.rescheduledByRole ? `(${attempt.rescheduledByRole})` : ''}
                                      </span>
                                      <span className="text-slate-400 font-mono">
                                        {attempt.rescheduledAt ? new Date(attempt.rescheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Updated'}
                                      </span>
                                    </div>
                                    {attempt.rescheduleReason && (
                                      <p className="text-[11px] text-slate-200">
                                        <strong className="text-sky-300">Reason:</strong> {attempt.rescheduleReason}
                                      </p>
                                    )}
                                    {attempt.rescheduledFrom && (
                                      <p className="text-[10px] text-slate-400">
                                        Original Slot: {attempt.rescheduledFrom}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          )}

                          {/* Full timestamp */}
                          <div className="flex items-center justify-between pt-1">
                            <p className="text-[10px] text-slate-500">
                              <Clock size={9} className="inline mr-1" />
                              {date} · {time}
                            </p>
                            <span
                              className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                              style={{
                                background:
                                  attempt.byRole === 'ADMIN'
                                    ? 'rgba(239,68,68,0.15)'
                                    : attempt.byRole === 'MANAGER'
                                    ? 'rgba(129,140,248,0.15)'
                                    : attempt.byRole === 'TEAM_LEADER'
                                    ? 'rgba(56,189,248,0.15)'
                                    : 'rgba(52,211,153,0.15)',
                                color:
                                  attempt.byRole === 'ADMIN'
                                    ? '#f87171'
                                    : attempt.byRole === 'MANAGER'
                                    ? '#818cf8'
                                    : attempt.byRole === 'TEAM_LEADER'
                                    ? '#38bdf8'
                                    : '#34d399',
                              }}
                            >
                              {attempt.byRole === 'ADMIN'
                                ? 'Admin'
                                : attempt.byRole === 'MANAGER'
                                ? 'Manager'
                                : attempt.byRole === 'TEAM_LEADER'
                                ? 'Team Leader'
                                : 'Sales Rep'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-2xl">📞</div>
            <p className="text-sm font-bold text-white">No contacts yet</p>
            <p className="text-xs text-slate-400">No contact history found for this filter. Make a call to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
