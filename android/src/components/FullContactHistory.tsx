import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

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
  by: string; // Rep name
  byRole?: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC' | string;
  timestamp: string; // ISO string or human-readable timestamp
  durationSeconds?: number;
  notes?: string;
  productInterest?: string;
  title?: string;
  purpose?: string;
  followUpDate?: string;
  followUpTime?: string;
  sentMessage?: string;
  audioRecordingAvailable?: boolean;

  // Quotation & Invoice tracking fields
  docNo?: string;
  docType?: string;
  docAmount?: number;
  docId?: string;
  sharingMedium?: string;
  sharingMode?: string;
  pdfUrl?: string;

  // Follow-up lifecycle synchronization
  isRescheduled?: boolean;
  rescheduledAt?: string;
  rescheduledFrom?: string;
  rescheduledByName?: string;
  rescheduledByRole?: string;
  rescheduleReason?: string;

  isCompleted?: boolean;
  completedAt?: string;
  completedByName?: string;
  completedByRole?: string;
  completionNotes?: string;

  isCancelled?: boolean;
  cancelledAt?: string;
  cancelledByName?: string;
  cancelledReason?: string;
}

export interface ShareOccurrence {
  id: string;
  timestamp: string;
  formattedDate: string;
  formattedTime: string;
  sharedBy: string;
  medium: string;
  quantity?: string;
  price?: string;
  discount?: string;
  notes?: string;
  sentMessage?: string;
  docNo?: string;
}

export interface InterestedCommercialItem {
  id: string;
  canonicalKey: string;
  name: string;
  quantity?: string;
  price?: string;
  discount?: string;
  docType?: 'PRODUCT' | 'INVOICE' | 'QUOTATION';
  docNo?: string;
  docAmount?: number;
  sharedAt: string;
  firstSharedAt: string;
  sharedBy: string;
  medium: string;
  notes?: string;
  sentMessage?: string;
  shareCount: number;
  shareHistory: ShareOccurrence[];
}

export interface FullContactHistoryProps {
  history?: ContactAttempt[];
  leadName?: string;
  leadPhone?: string;
  leadRequirement?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function formatDuration(secs: number): string {
  if (!secs) return '0s';
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function formatTimestamp(iso?: string): { date: string; time: string; dayLabel: string } {
  if (!iso) {
    return { date: 'Today', time: '11:00 AM', dayLabel: 'Today' };
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return { date: String(iso), time: '', dayLabel: 'Today' };
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
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

    // 2. Semantic content key match
    const timeMinute = item.timestamp ? item.timestamp.slice(0, 16) : '';
    const contentKey = `${item.type}_${item.outcome}_${timeMinute}_${item.followUpDate || ''}_${(item.notes || '').slice(0, 40)}`;
    if (seenContentKeys.has(contentKey)) {
      continue;
    }

    if (item.id) seenIds.add(item.id);
    seenContentKeys.add(contentKey);
    result.push(item);
  }

  return result;
}

export function groupByDate(history: ContactAttempt[]): Record<string, ContactAttempt[]> {
  const groups: Record<string, ContactAttempt[]> = {};
  if (!Array.isArray(history)) return groups;
  const deduped = deduplicateContactAttempts(history);
  [...deduped]
    .sort((a, b) => {
      const tA = new Date(a?.timestamp || 0).getTime() || 0;
      const tB = new Date(b?.timestamp || 0).getTime() || 0;
      return tB - tA;
    })
    .forEach(item => {
      if (!item) return;
      const { dayLabel } = formatTimestamp(item.timestamp);
      if (!groups[dayLabel]) groups[dayLabel] = [];
      groups[dayLabel].push(item);
    });
  return groups;
}

export function resolveAttemptMedium(attempt?: Partial<ContactAttempt>): {
  key: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
} {
  const notes = (attempt?.notes || '').toLowerCase();
  const sentMsg = (attempt?.sentMessage || '').toLowerCase();
  const type = (attempt?.type || '').toUpperCase();
  const medium = (attempt?.sharingMedium || '').toLowerCase();
  const docType = (attempt?.docType || '').toUpperCase();

  // WhatsApp Cloud
  if (
    notes.includes('whatsapp cloud') ||
    notes.includes('wa cloud') ||
    type === 'WHATSAPP_CLOUD' ||
    medium.includes('cloud')
  ) {
    return {
      key: 'WHATSAPP_CLOUD',
      label: 'WHATSAPP CLOUD',
      icon: '💬',
      color: '#2dd4bf',
      bg: 'rgba(45,212,191,0.15)',
      border: 'rgba(45,212,191,0.35)',
    };
  }

  // WhatsApp Direct
  if (
    notes.includes('whatsapp direct') ||
    notes.includes('wa direct') ||
    type === 'WHATSAPP_DIRECT' ||
    type === 'WHATSAPP' ||
    medium.includes('whatsapp') ||
    notes.includes('whatsapp') ||
    sentMsg.includes('whatsapp')
  ) {
    return {
      key: 'WHATSAPP_DIRECT',
      label: 'WHATSAPP DIRECT',
      icon: '💬',
      color: '#4ade80',
      bg: 'rgba(74,222,128,0.15)',
      border: 'rgba(74,222,128,0.35)',
    };
  }

  // Email Automation
  if (
    notes.includes('email automation') ||
    notes.includes('auto email') ||
    type === 'EMAIL_AUTOMATION' ||
    medium.includes('automation')
  ) {
    return {
      key: 'EMAIL_AUTOMATION',
      label: 'EMAIL AUTOMATION',
      icon: '⚡',
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.15)',
      border: 'rgba(167,139,250,0.35)',
    };
  }

  // Email Direct
  if (type === 'EMAIL' || type === 'EMAIL_DIRECT' || medium.includes('email') || notes.includes('email')) {
    return {
      key: 'EMAIL_DIRECT',
      label: 'EMAIL DIRECT',
      icon: '📧',
      color: '#818cf8',
      bg: 'rgba(129,140,248,0.15)',
      border: 'rgba(129,140,248,0.35)',
    };
  }

  // Follow-Up Rescheduled
  if (type === 'FOLLOWUP_RESCHEDULED' || attempt?.outcome === 'FOLLOW_UP_RESCHEDULED') {
    return {
      key: 'FOLLOWUP_RESCHEDULED',
      label: 'RESCHEDULED',
      icon: '⏱️',
      color: '#0ea5e9',
      bg: 'rgba(14,165,233,0.18)',
      border: 'rgba(14,165,233,0.4)',
    };
  }

  // Meeting Scheduled
  const isMeeting =
    attempt?.outcome === 'MEETING_SCHEDULED' ||
    attempt?.scheduledType === 'MEETING' ||
    /meeting|visit|in-person|walkthrough/i.test(notes) ||
    /meeting|visit|in-person|walkthrough/i.test(sentMsg);

  if (isMeeting) {
    return {
      key: 'MEETING_SCHEDULED',
      label: 'MEETING',
      icon: '🏢',
      color: '#a855f7',
      bg: 'rgba(168,85,247,0.15)',
      border: 'rgba(168,85,247,0.35)',
    };
  }

  // Follow-Up Scheduled
  if (type === 'FOLLOWUP_SCHEDULED' || attempt?.outcome === 'FOLLOW_UP_SCHEDULED') {
    return {
      key: 'FOLLOWUP_SCHEDULED',
      label: 'FOLLOW-UP',
      icon: '📅',
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.15)',
      border: 'rgba(56,189,248,0.35)',
    };
  }

  // Quotation
  if (type === 'QUOTATION' || attempt?.outcome === 'QUOTATION_SHARED' || (docType && !docType.includes('INVOICE'))) {
    return {
      key: 'QUOTATION',
      label: 'QUOTATION',
      icon: '📄',
      color: '#818cf8',
      bg: 'rgba(129,140,248,0.15)',
      border: 'rgba(129,140,248,0.35)',
    };
  }

  // Invoice
  if (type === 'INVOICE' || attempt?.outcome === 'INVOICE_SHARED' || docType.includes('INVOICE')) {
    return {
      key: 'INVOICE',
      label: 'INVOICE',
      icon: '🧾',
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.15)',
      border: 'rgba(56,189,248,0.35)',
    };
  }

  // Inbound Call
  if (type === 'CALL_IN') {
    return {
      key: 'CALL_IN',
      label: 'INBOUND CALL',
      icon: '📲',
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.15)',
      border: 'rgba(56,189,248,0.35)',
    };
  }

  // Missed Call / No Answer
  if (type === 'CALL_MISSED' || attempt?.outcome === 'NO_ANSWER') {
    return {
      key: 'CALL_MISSED',
      label: 'MISSED CALL',
      icon: '🔕',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.15)',
      border: 'rgba(239,68,68,0.35)',
    };
  }

  // Busy
  if (type === 'CALL_BUSY' || attempt?.outcome === 'BUSY') {
    return {
      key: 'CALL_BUSY',
      label: 'BUSY / ENGAGED',
      icon: '🔴',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.15)',
      border: 'rgba(245,158,11,0.35)',
    };
  }

  // Not Responding / Switch Off
  if (type === 'CALL_NOT_RESPONDING' || type === 'CALL_SWITCH_OFF' || attempt?.outcome === 'SWITCH_OFF') {
    return {
      key: 'CALL_NOT_RESPONDING',
      label: 'NOT RESPONDING',
      icon: '📵',
      color: '#94a3b8',
      bg: 'rgba(148,163,184,0.12)',
      border: 'rgba(148,163,184,0.25)',
    };
  }

  // Default Outbound Call
  return {
    key: 'CALL_OUT',
    label: 'OUTBOUND CALL',
    icon: '📞',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.15)',
    border: 'rgba(52,211,153,0.35)',
  };
}

export function extractInterestedCommercials(
  history: ContactAttempt[] = [],
  leadRequirement?: string
): InterestedCommercialItem[] {
  const groups = new Map<string, InterestedCommercialItem>();

  const registerShare = (
    canonicalKey: string,
    payload: {
      name: string;
      docType?: 'PRODUCT' | 'INVOICE' | 'QUOTATION';
      docNo?: string;
      docAmount?: number;
      quantity?: string;
      price?: string;
      discount?: string;
      sharedAt: string;
      sharedBy: string;
      medium: string;
      notes?: string;
      sentMessage?: string;
      attemptId: string;
    }
  ) => {
    const { date, time } = formatTimestamp(payload.sharedAt);
    const occurrence: ShareOccurrence = {
      id: `${canonicalKey}_${payload.attemptId}_${payload.sharedAt}`,
      timestamp: payload.sharedAt,
      formattedDate: date,
      formattedTime: time,
      sharedBy: payload.sharedBy,
      medium: payload.medium,
      quantity: payload.quantity,
      price: payload.price,
      discount: payload.discount,
      notes: payload.notes,
      sentMessage: payload.sentMessage,
      docNo: payload.docNo,
    };

    const existing = groups.get(canonicalKey);
    if (!existing) {
      groups.set(canonicalKey, {
        id: `comm_${canonicalKey}`,
        canonicalKey,
        name: payload.name,
        quantity: payload.quantity,
        price: payload.price,
        discount: payload.discount,
        docType: payload.docType || 'PRODUCT',
        docNo: payload.docNo,
        docAmount: payload.docAmount,
        sharedAt: payload.sharedAt,
        firstSharedAt: payload.sharedAt,
        sharedBy: payload.sharedBy,
        medium: payload.medium,
        notes: payload.notes,
        sentMessage: payload.sentMessage,
        shareCount: 1,
        shareHistory: [occurrence],
      });
    } else {
      existing.shareCount += 1;
      existing.shareHistory.push(occurrence);

      const existingTime = new Date(existing.sharedAt || 0).getTime();
      const newTime = new Date(payload.sharedAt || 0).getTime();

      if (newTime >= existingTime) {
        existing.sharedAt = payload.sharedAt;
        existing.sharedBy = payload.sharedBy;
        existing.medium = payload.medium;
        if (payload.quantity) existing.quantity = payload.quantity;
        if (payload.price) existing.price = payload.price;
        if (payload.discount) existing.discount = payload.discount;
        if (payload.name && payload.name.length > 2) existing.name = payload.name;
        if (payload.notes) existing.notes = payload.notes;
        if (payload.sentMessage) existing.sentMessage = payload.sentMessage;
      }
    }
  };

  for (const h of history) {
    if (!h) continue;
    const med = resolveAttemptMedium(h).label;
    const rep = h.by || 'Sales Rep';
    const ts = h.timestamp || new Date().toISOString();
    const attemptsKeysInThisContact = new Set<string>();

    // 1. Direct productInterest field
    if (h.productInterest && typeof h.productInterest === 'string' && h.productInterest.trim() && h.productInterest !== '—') {
      const raw = h.productInterest.trim();
      const parts = raw.split(/;\s*|\n+/);
      for (const part of parts) {
        const clean = part.trim();
        if (!clean || clean.length < 2) continue;

        const qtyMatch = clean.match(/(?:Qty:\s*|\()(\d+[\s\w()]*?)(?:\s*·|\s*\)|$)/i);
        const priceMatch = clean.match(/(?:₹|Rs\.?\s*)([\d,]+)/i);
        const discMatch = clean.match(/\[([^\]]+)\]/);
        const nameClean = clean.split(/\s*\(Qty:|\s*·\s*₹|\s*\[/)[0].replace(/^[•\s*-]+/, '').trim();
        const finalName = nameClean || clean;
        const key = `prod_${finalName.toLowerCase().replace(/\s+/g, ' ')}`;

        if (!attemptsKeysInThisContact.has(key)) {
          attemptsKeysInThisContact.add(key);
          registerShare(key, {
            name: finalName,
            quantity: qtyMatch ? qtyMatch[1].replace(/[()]/g, '').trim() : undefined,
            price: priceMatch ? `₹${priceMatch[1]}` : undefined,
            discount: discMatch ? discMatch[1].trim() : undefined,
            docType: 'PRODUCT',
            sharedAt: ts,
            sharedBy: rep,
            medium: med,
            notes: h.notes,
            sentMessage: h.sentMessage,
            attemptId: h.id,
          });
        }
      }
    }

    // 2. Invoice / Quotation document
    if (h.docNo || h.docType || h.type === 'INVOICE' || h.type === 'QUOTATION') {
      const docType = h.docType === 'INVOICE' || h.type === 'INVOICE' ? 'INVOICE' : 'QUOTATION';
      const key = `doc_${h.docNo || h.id}`;
      if (!attemptsKeysInThisContact.has(key)) {
        attemptsKeysInThisContact.add(key);
        registerShare(key, {
          name: h.docNo ? `${docType}: ${h.docNo}` : `${docType} Proposal`,
          docType,
          docNo: h.docNo,
          docAmount: h.docAmount,
          price: h.docAmount ? `₹${h.docAmount.toLocaleString('en-IN')}` : undefined,
          sharedAt: ts,
          sharedBy: rep,
          medium: med,
          notes: h.notes,
          sentMessage: h.sentMessage,
          attemptId: h.id,
        });
      }
    }
  }

  // Fallback: If no commercial items in history, but lead requirement exists
  if (groups.size === 0 && leadRequirement && leadRequirement !== '—' && leadRequirement.length > 2) {
    groups.set('lead_req', {
      id: 'comm_lead_req',
      canonicalKey: 'lead_req',
      name: leadRequirement,
      docType: 'PRODUCT',
      sharedAt: new Date().toISOString(),
      firstSharedAt: new Date().toISOString(),
      sharedBy: 'System / Ingestion',
      medium: 'DIRECT REQUIREMENT',
      shareCount: 1,
      shareHistory: [
        {
          id: 'lead_req_first',
          timestamp: new Date().toISOString(),
          formattedDate: 'Today',
          formattedTime: '',
          sharedBy: 'System / Ingestion',
          medium: 'DIRECT REQUIREMENT',
        },
      ],
    });
  }

  return Array.from(groups.values());
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function FullContactHistory({
  history = [],
  leadName,
  leadPhone,
  leadRequirement,
  onRefresh,
  isRefreshing = false,
}: FullContactHistoryProps) {
  const { colors, isDark } = useTheme();

  // Active filter chip
  const [filterType, setFilterType] = useState<string>('ALL');

  // Shrink/Expand toggle for Interested Products & Invoices Ledger
  const [isCommercialsShrunk, setIsCommercialsShrunk] = useState(false);

  // Expanded dates & times sub-audit log per product key
  const [expandedShareHistoryKeys, setExpandedShareHistoryKeys] = useState<Record<string, boolean>>({});

  // 1. Deduplicated Contact Attempts
  const dedupedHistory = useMemo(() => deduplicateContactAttempts(history), [history]);

  // 2. Metrics & Counts Calculation (Identical to Web)
  const {
    totalAttempts,
    connectedCalls,
    missedOrNoAnswer,
    waTotalCount,
    waDirectCount,
    waCloudCount,
    emailTotalCount,
    emailDirectCount,
    emailAutoCount,
    totalTalkSecs,
    quotationCount,
    invoiceCount,
    meetingCount,
    followUpCount,
    totalCalls,
  } = useMemo(() => {
    let connected = 0;
    let missed = 0;
    let waDir = 0;
    let waCld = 0;
    let emDir = 0;
    let emAuto = 0;
    let talkSecs = 0;
    let quote = 0;
    let inv = 0;
    let meet = 0;
    let fu = 0;
    let calls = 0;

    for (const h of dedupedHistory) {
      if (!h) continue;
      const type = (h.type || '').toUpperCase();
      const outcome = (h.outcome || '').toUpperCase();
      const med = resolveAttemptMedium(h).key;
      const notes = (h.notes || '').toLowerCase();
      const sentMsg = (h.sentMessage || '').toLowerCase();

      // Quotations & Invoices
      if (type === 'QUOTATION' || outcome === 'QUOTATION_SHARED' || med === 'QUOTATION') quote++;
      if (type === 'INVOICE' || outcome === 'INVOICE_SHARED' || med === 'INVOICE') inv++;

      // Meetings
      if (
        outcome === 'MEETING_SCHEDULED' ||
        h.scheduledType === 'MEETING' ||
        med === 'MEETING_SCHEDULED' ||
        /meeting|visit/i.test(notes) ||
        /meeting|visit/i.test(sentMsg)
      ) {
        meet++;
      }

      // Follow-ups
      if (
        type.startsWith('FOLLOWUP') ||
        outcome.startsWith('FOLLOW_UP') ||
        h.followUpDate ||
        notes.includes('follow-up') ||
        notes.includes('callback')
      ) {
        fu++;
      }

      // WhatsApp
      if (med === 'WHATSAPP_CLOUD') waCld++;
      else if (med === 'WHATSAPP_DIRECT') waDir++;

      // Email
      if (med === 'EMAIL_AUTOMATION') emAuto++;
      else if (med === 'EMAIL_DIRECT') emDir++;

      // Calls
      if (type.startsWith('CALL') || outcome === 'TALKED' || outcome === 'BUSY' || outcome === 'NO_ANSWER') {
        calls++;
        if (outcome === 'TALKED' || outcome === 'DEAL_CLOSED' || outcome === 'INTERESTED_MORE_INFO') {
          connected++;
        } else if (
          outcome === 'BUSY' ||
          outcome === 'NO_ANSWER' ||
          outcome === 'SWITCH_OFF' ||
          outcome === 'WRONG_NUMBER' ||
          type === 'CALL_MISSED' ||
          type === 'CALL_BUSY' ||
          type === 'CALL_NOT_RESPONDING' ||
          type === 'CALL_SWITCH_OFF'
        ) {
          missed++;
        } else {
          connected++;
        }

        if (h.durationSeconds && h.durationSeconds > 0) {
          talkSecs += h.durationSeconds;
        }
      }
    }

    return {
      totalAttempts: dedupedHistory.length,
      connectedCalls: connected,
      missedOrNoAnswer: missed,
      waTotalCount: waDir + waCld,
      waDirectCount: waDir,
      waCloudCount: waCld,
      emailTotalCount: emDir + emAuto,
      emailDirectCount: emDir,
      emailAutoCount: emAuto,
      totalTalkSecs: talkSecs,
      quotationCount: quote,
      invoiceCount: inv,
      meetingCount: meet,
      followUpCount: fu,
      totalCalls: calls,
    };
  }, [dedupedHistory]);

  // 3. Extracted Commercial Items
  const interestedCommercials = useMemo(
    () => extractInterestedCommercials(dedupedHistory, leadRequirement),
    [dedupedHistory, leadRequirement]
  );
  const totalCommercialsCount = interestedCommercials.length;
  const totalSharesCount = useMemo(
    () => interestedCommercials.reduce((acc, curr) => acc + (curr.shareCount || 1), 0),
    [interestedCommercials]
  );

  const displayProduct = useMemo(() => {
    if (interestedCommercials.length > 0) {
      const top = interestedCommercials[0];
      return `${top.name}${top.price ? ` (${top.price})` : ''}`;
    }
    return leadRequirement && leadRequirement !== '—' ? leadRequirement : '—';
  }, [interestedCommercials, leadRequirement]);

  // 4. Filtered History based on selected filter tab
  const filteredHistory = useMemo(() => {
    if (filterType === 'ALL') return dedupedHistory;

    return dedupedHistory.filter(item => {
      if (!item) return false;
      const type = (item.type || '').toUpperCase();
      const outcome = (item.outcome || '').toUpperCase();
      const med = resolveAttemptMedium(item).key;
      const notes = (item.notes || '').toLowerCase();
      const sentMsg = (item.sentMessage || '').toLowerCase();

      switch (filterType) {
        case 'CALLS':
          return type.startsWith('CALL');
        case 'CALL_BUSY':
          return (
            type === 'CALL_BUSY' ||
            type === 'CALL_MISSED' ||
            type === 'CALL_NOT_RESPONDING' ||
            type === 'CALL_SWITCH_OFF' ||
            outcome === 'BUSY' ||
            outcome === 'NO_ANSWER' ||
            outcome === 'SWITCH_OFF'
          );
        case 'WHATSAPP_DIRECT':
          return med === 'WHATSAPP_DIRECT';
        case 'WHATSAPP_CLOUD':
          return med === 'WHATSAPP_CLOUD';
        case 'EMAIL_DIRECT':
          return med === 'EMAIL_DIRECT';
        case 'EMAIL_AUTOMATION':
          return med === 'EMAIL_AUTOMATION';
        case 'QUOTATION':
          return type === 'QUOTATION' || outcome === 'QUOTATION_SHARED' || med === 'QUOTATION';
        case 'INVOICE':
          return type === 'INVOICE' || outcome === 'INVOICE_SHARED' || med === 'INVOICE';
        case 'MEETING':
          return (
            outcome === 'MEETING_SCHEDULED' ||
            item.scheduledType === 'MEETING' ||
            /meeting|visit/i.test(notes) ||
            /meeting|visit/i.test(sentMsg)
          );
        case 'FOLLOW_UP':
          return (
            type.startsWith('FOLLOWUP') ||
            outcome.startsWith('FOLLOW_UP') ||
            Boolean(item.followUpDate)
          );
        case 'INTERESTED_PRODUCTS':
          return Boolean(item.productInterest || item.docNo || item.docType || item.type === 'INVOICE' || item.type === 'QUOTATION');
        default:
          return true;
      }
    });
  }, [dedupedHistory, filterType]);

  // 5. Grouped by Date
  const grouped = useMemo(() => groupByDate(filteredHistory), [filteredHistory]);

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      {/* ── ⚡ HEADER: FULL CONTACT HISTORY & CALL TIMELINE ──────────────────── */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                ⚡ Full Contact History &amp; Call Timeline
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Unified audit of customer calls, WhatsApp chats, meetings, and emails with outcomes &amp; durations.
            </Text>
          </View>

          {onRefresh && (
            <TouchableOpacity
              onPress={onRefresh}
              disabled={isRefreshing}
              style={[
                styles.refreshBtn,
                { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={isDark ? '#818cf8' : '#4f46e5'} />
              ) : (
                <Text style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#818cf8' : '#4f46e5' }}>
                  Refresh 🔄
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Counter Badges Row */}
        <View style={styles.badgePillRow}>
          <View style={[styles.badgePill, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={[styles.badgePillText, { color: isDark ? '#34d399' : '#059669' }]}>
              {totalAttempts} Total Contact Attempts
            </Text>
          </View>

          {quotationCount > 0 && (
            <View style={[styles.badgePill, { backgroundColor: 'rgba(129,140,248,0.12)', borderColor: 'rgba(129,140,248,0.3)' }]}>
              <Text style={[styles.badgePillText, { color: isDark ? '#a5b4fc' : '#4338ca' }]}>
                📄 {quotationCount} Quotation{quotationCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {invoiceCount > 0 && (
            <View style={[styles.badgePill, { backgroundColor: 'rgba(56,189,248,0.12)', borderColor: 'rgba(56,189,248,0.3)' }]}>
              <Text style={[styles.badgePillText, { color: isDark ? '#7dd3fc' : '#0369a1' }]}>
                🧾 {invoiceCount} Invoice{invoiceCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {meetingCount > 0 && (
            <View style={[styles.badgePill, { backgroundColor: 'rgba(168,85,247,0.12)', borderColor: 'rgba(168,85,247,0.3)' }]}>
              <Text style={[styles.badgePillText, { color: isDark ? '#c084fc' : '#7e22ce' }]}>
                🏢 {meetingCount} Meeting{meetingCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {followUpCount > 0 && (
            <View style={[styles.badgePill, { backgroundColor: 'rgba(14,165,233,0.12)', borderColor: 'rgba(14,165,233,0.3)' }]}>
              <Text style={[styles.badgePillText, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                ⏱️ {followUpCount} Follow-Up{followUpCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── 📊 SUMMARY STATS GRID (6 TILES) ─────────────────────────────────── */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Connected', value: connectedCalls, color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '📞', key: 'CALLS' },
          { label: 'Missed/No Ans', value: missedOrNoAnswer, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '🔕', key: 'CALL_BUSY' },
          { label: 'WhatsApp', value: waTotalCount, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: '💬', key: 'WHATSAPP_DIRECT' },
          { label: 'Email', value: emailTotalCount, color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: '✉️', key: 'EMAIL_DIRECT' },
          { label: 'Talk Time', value: formatDuration(totalTalkSecs), color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', icon: '🎙️', key: 'CALLS' },
          { label: 'Interested Product', value: displayProduct, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '📦', key: 'INTERESTED_PRODUCTS' },
        ].map(stat => (
          <TouchableOpacity
            key={stat.label}
            activeOpacity={0.7}
            onPress={() => {
              if (stat.key === 'INTERESTED_PRODUCTS') {
                if (filterType === 'INTERESTED_PRODUCTS') {
                  setIsCommercialsShrunk(!isCommercialsShrunk);
                } else {
                  setFilterType('INTERESTED_PRODUCTS');
                  setIsCommercialsShrunk(false);
                }
              } else {
                setFilterType(filterType === stat.key ? 'ALL' : stat.key);
              }
            }}
            style={[
              styles.statCard,
              {
                backgroundColor: stat.bg,
                borderColor: filterType === stat.key ? stat.color : `${stat.color}40`,
                borderWidth: filterType === stat.key ? 2 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 13, marginBottom: 2 }}>{stat.icon}</Text>
            <Text
              style={[styles.statValue, { color: colors.text }]}
              numberOfLines={1}
            >
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
              {stat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── 🏷️ FILTER CHIPS (HORIZONTAL SCROLL) ─────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
        style={styles.filterScrollView}
      >
        {[
          { key: 'ALL', label: `All (${totalAttempts})`, color: '#818cf8' },
          { key: 'INTERESTED_PRODUCTS', label: `📦 Products & Invoices (${totalCommercialsCount})`, color: '#f59e0b' },
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
        ].map(chip => {
          const isActive = filterType === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              onPress={() => {
                if (chip.key === 'INTERESTED_PRODUCTS' && filterType === 'INTERESTED_PRODUCTS') {
                  setIsCommercialsShrunk(!isCommercialsShrunk);
                } else {
                  setFilterType(chip.key);
                  if (chip.key === 'INTERESTED_PRODUCTS') {
                    setIsCommercialsShrunk(false);
                  }
                }
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? `${chip.color}25` : colors.cardBgElevated,
                  borderColor: isActive ? chip.color : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isActive ? chip.color : colors.textSecondary, fontWeight: isActive ? '900' : '700' },
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── 📦 SYNCED INTERESTED PRODUCTS & COMMERCIALS LEDGER CARD ─────────── */}
      {(filterType === 'INTERESTED_PRODUCTS' || totalCommercialsCount > 0) && (
        <View style={[styles.commercialsPanel, { backgroundColor: colors.cardBgElevated, borderColor: isDark ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.45)' }]}>
          <View style={styles.commercialsHeader}>
            <TouchableOpacity
              style={styles.commercialsTitleGroup}
              activeOpacity={0.7}
              onPress={() => setIsCommercialsShrunk(!isCommercialsShrunk)}
            >
              <View style={[styles.packageIconBadge, { backgroundColor: 'rgba(245,158,11,0.2)' }]}>
                <Text style={{ fontSize: 13 }}>📦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={[styles.commercialsHeading, { color: colors.text }]}>
                    Synced Products &amp; Invoices
                  </Text>
                  <View style={[styles.uniqueCountPill, { backgroundColor: 'rgba(245,158,11,0.2)', borderColor: 'rgba(245,158,11,0.4)' }]}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: isDark ? '#fbbf24' : '#b45309' }}>
                      {totalCommercialsCount} Unique ({totalSharesCount} Share{totalSharesCount !== 1 ? 's' : ''})
                    </Text>
                  </View>
                </View>
                <Text style={[styles.commercialsSubtext, { color: colors.textSecondary }]}>
                  Deduplicated with exact share count, price, and sharing history across channels.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsCommercialsShrunk(!isCommercialsShrunk)}
              style={[styles.shrinkBtn, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' }]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#fbbf24' : '#b45309' }}>
                {isCommercialsShrunk ? `Expand (${totalCommercialsCount}) ▾` : '− Shrink ▴'}
              </Text>
            </TouchableOpacity>
          </View>

          {isCommercialsShrunk ? (
            /* Shrunk Summary Strip */
            <TouchableOpacity
              onPress={() => setIsCommercialsShrunk(false)}
              style={[styles.shrunkStrip, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: colors.textSecondary }}>
                  📦 Shrunk Summary:
                </Text>
                {interestedCommercials.slice(0, 3).map((item, i) => (
                  <View
                    key={item.canonicalKey || i}
                    style={[styles.shrunkPill, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
                  >
                    <Text style={{ fontSize: 8, fontWeight: '800', color: colors.text }}>
                      {item.name}
                    </Text>
                    {item.shareCount > 1 && (
                      <Text style={{ fontSize: 8, fontWeight: '900', color: isDark ? '#fbbf24' : '#b45309' }}>
                        ({item.shareCount}x)
                      </Text>
                    )}
                    {item.price && (
                      <Text style={{ fontSize: 8, fontWeight: '900', color: isDark ? '#34d399' : '#059669' }}>
                        {item.price}
                      </Text>
                    )}
                  </View>
                ))}
                {totalCommercialsCount > 3 && (
                  <View style={[styles.shrunkPill, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' }]}>
                    <Text style={{ fontSize: 8, fontWeight: '900', color: isDark ? '#fbbf24' : '#b45309' }}>
                      +{totalCommercialsCount - 3} more
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 8, fontWeight: '800', color: isDark ? '#fbbf24' : '#b45309' }}>
                Expand ▾
              </Text>
            </TouchableOpacity>
          ) : (
            /* Full Product / Commercial Cards */
            <View style={{ gap: 8, paddingTop: 4 }}>
              {interestedCommercials.map((item, idx) => {
                const { time: latestTime, date: latestDate } = formatTimestamp(item.sharedAt);
                const isDoc = item.docType === 'INVOICE' || item.docType === 'QUOTATION';
                const isHistoryOpen = Boolean(expandedShareHistoryKeys[item.canonicalKey || item.id]);

                return (
                  <View
                    key={item.canonicalKey || item.id || idx}
                    style={[styles.productLedgerCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                  >
                    {/* Top Row: Icon, Title, Price */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <Text style={{ fontSize: 18 }}>{isDoc ? (item.docType === 'INVOICE' ? '🧾' : '📄') : '📦'}</Text>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={[styles.productNameText, { color: colors.text }]} numberOfLines={2}>
                              {item.name}
                            </Text>
                            {item.quantity && (
                              <View style={[styles.qtyBadge, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.35)' }]}>
                                <Text style={{ fontSize: 8, fontWeight: '800', color: isDark ? '#34d399' : '#059669' }}>
                                  Qty: {item.quantity}
                                </Text>
                              </View>
                            )}
                          </View>
                          {item.docNo && (
                            <Text style={{ fontSize: 9, color: isDark ? '#fbbf24' : '#b45309', fontWeight: '800', marginTop: 2 }}>
                              Ref: {item.docNo}
                            </Text>
                          )}
                        </View>
                      </View>

                      {item.price && (
                        <View style={[styles.priceTagPill, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: isDark ? '#34d399' : '#059669' }}>
                            {item.price}
                          </Text>
                        </View>
                      )}
                    </View>

                    {item.discount && (
                      <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 }}>
                        <Text style={{ fontSize: 8, fontWeight: '800', color: isDark ? '#fbbf24' : '#b45309' }}>
                          🎉 {item.discount}
                        </Text>
                      </View>
                    )}

                    {/* Share count & History Toggle */}
                    <View style={styles.shareCountRow}>
                      <View
                        style={[
                          styles.shareCountPill,
                          {
                            backgroundColor: item.shareCount > 1 ? 'rgba(245,158,11,0.18)' : colors.cardBgElevated,
                            borderColor: item.shareCount > 1 ? 'rgba(245,158,11,0.35)' : colors.border,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 8, fontWeight: '800', color: item.shareCount > 1 ? (isDark ? '#fbbf24' : '#b45309') : colors.textSecondary }}>
                          🔁 {item.shareCount === 1 ? 'Shared 1 time to this user' : `Shared ${item.shareCount} times to this user`}
                        </Text>
                      </View>

                      {item.shareCount > 1 && (
                        <TouchableOpacity
                          onPress={() =>
                            setExpandedShareHistoryKeys(prev => ({
                              ...prev,
                              [item.canonicalKey || item.id]: !prev[item.canonicalKey || item.id],
                            }))
                          }
                          style={[styles.historyToggleBtn, { backgroundColor: 'rgba(56,189,248,0.12)', borderColor: 'rgba(56,189,248,0.3)' }]}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 8, fontWeight: '800', color: isDark ? '#38bdf8' : '#0284c7' }}>
                            {isHistoryOpen ? 'Hide History ▴' : `View All ${item.shareCount} Timestamps ▾`}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Latest share info footer */}
                    <View style={[styles.productCardFooter, { borderTopColor: colors.border }]}>
                      <Text style={{ fontSize: 8, color: colors.textSecondary }}>
                        Shared by: <Text style={{ fontWeight: '800', color: colors.text }}>{item.sharedBy}</Text>
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={[styles.mediumPillSmall, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                          <Text style={{ fontSize: 8, fontWeight: '800', color: isDark ? '#34d399' : '#059669' }}>
                            {item.medium}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 8, color: colors.textSecondary, fontWeight: '700' }}>
                          • {latestDate} @ {latestTime}
                        </Text>
                      </View>
                    </View>

                    {/* Expanded All Sharing Timestamps */}
                    {isHistoryOpen && item.shareHistory && item.shareHistory.length > 0 && (
                      <View style={[styles.expandedHistoryContainer, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                        <Text style={[styles.expandedHistoryTitle, { color: colors.textSecondary }]}>
                          📅 All Sharing Timestamps ({item.shareHistory.length} logs):
                        </Text>
                        {item.shareHistory.map((sh, sIdx) => (
                          <View
                            key={sh.id || sIdx}
                            style={[styles.historyLogRow, { borderBottomColor: colors.border }]}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                              <Text style={{ fontSize: 8, fontWeight: '900', color: isDark ? '#fbbf24' : '#b45309' }}>
                                #{item.shareHistory.length - sIdx}
                              </Text>
                              <Text style={{ fontSize: 8, fontWeight: '800', color: colors.text }}>
                                {sh.formattedDate} @ {sh.formattedTime}
                              </Text>
                              <Text style={{ fontSize: 8, color: colors.textSecondary }}>via</Text>
                              <Text style={{ fontSize: 8, fontWeight: '800', color: isDark ? '#34d399' : '#059669' }}>
                                {sh.medium}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 8, color: colors.textSecondary }}>By {sh.sharedBy}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* ── 🗓️ DATE-GROUPED TIMELINE CARDS ───────────────────────────────────── */}
      <View style={styles.timelineSection}>
        {Object.keys(grouped).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No Activity Logged Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Calls, WhatsApp chats, meetings, and emails will appear here automatically.
            </Text>
          </View>
        ) : (
          Object.entries(grouped).map(([dayLabel, items]) => (
            <View key={dayLabel} style={styles.dayGroupContainer}>
              {/* Day Divider */}
              <View style={styles.dayDividerRow}>
                <View style={[styles.dayBadge, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: isDark ? '#a5b4fc' : '#4338ca' }}>
                    📅 {dayLabel.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.dayLine, { backgroundColor: colors.border }]} />
                <Text style={{ fontSize: 9, fontWeight: '800', color: colors.textSecondary }}>
                  {items.length} interaction{items.length !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Items in this Day */}
              <View style={{ gap: 8 }}>
                {items.map((item, idx) => {
                  const med = resolveAttemptMedium(item);
                  const { time } = formatTimestamp(item.timestamp);
                  const durStr = item.durationSeconds ? formatDuration(item.durationSeconds) : undefined;
                  const roleStr = String(item.byRole || '').toUpperCase();
                  const roleLabel = roleStr.includes('LEADER') || roleStr.includes('TL') ? 'TL' : roleStr.includes('MANAGER') ? 'Manager' : roleStr.includes('ADMIN') ? 'Admin' : 'Sales Rep';
                  const roleColor = roleStr.includes('LEADER') || roleStr.includes('TL') ? (isDark ? '#38bdf8' : '#0284c7') : roleStr.includes('MANAGER') ? (isDark ? '#818cf8' : '#4f46e5') : roleStr.includes('ADMIN') ? (isDark ? '#f59e0b' : '#b45309') : (isDark ? '#34d399' : '#059669');

                  return (
                    <View
                      key={item.id || idx}
                      style={[
                        styles.timelineCard,
                        {
                          backgroundColor: colors.cardBgElevated,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      {/* Top Row: Medium Pill, Outcome / Title, Duration, Timestamp */}
                      <View style={styles.timelineCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                          <View
                            style={[
                              styles.mediumTagPill,
                              { backgroundColor: med.bg, borderColor: med.border },
                            ]}
                          >
                            <Text style={{ fontSize: 8 }}>{med.icon}</Text>
                            <Text style={[styles.mediumTagText, { color: med.color }]}>
                              {med.label}
                            </Text>
                          </View>

                          {durStr && (
                            <View style={[styles.durationPill, { backgroundColor: 'rgba(52,211,153,0.15)' }]}>
                              <Text style={{ fontSize: 8, fontWeight: '800', color: isDark ? '#34d399' : '#059669' }}>
                                🎙️ {durStr}
                              </Text>
                            </View>
                          )}

                          {item.docNo && (
                            <View style={[styles.docTagPill, { backgroundColor: 'rgba(129,140,248,0.15)', borderColor: 'rgba(129,140,248,0.35)' }]}>
                              <Text style={{ fontSize: 8, fontWeight: '800', color: isDark ? '#a5b4fc' : '#4338ca' }}>
                                {item.docType || 'DOC'}: {item.docNo}
                              </Text>
                            </View>
                          )}

                          {item.productInterest && (
                            <View style={[styles.productTagPill, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.35)' }]}>
                              <Text style={{ fontSize: 8, fontWeight: '800', color: isDark ? '#fbbf24' : '#b45309' }} numberOfLines={1}>
                                📦 {item.productInterest}
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                          {time}
                        </Text>
                      </View>

                      {/* Scheduled Follow-Up / Meeting banner if set */}
                      {item.followUpDate && (
                        <View
                          style={[
                            styles.scheduledBanner,
                            {
                              backgroundColor: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(2,132,199,0.08)',
                              borderColor: isDark ? 'rgba(56,189,248,0.35)' : 'rgba(2,132,199,0.25)',
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 9, fontWeight: '900', color: isDark ? '#38bdf8' : '#0284c7' }}>
                            🕒 Scheduled Follow-up: {item.followUpDate} {item.followUpTime ? `@ ${item.followUpTime}` : ''}
                          </Text>
                        </View>
                      )}

                      {/* Actor & Role attribution */}
                      <View style={styles.actorRow}>
                        <Text style={{ fontSize: 9, color: colors.textSecondary }}>By:</Text>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: colors.text }}>
                          {item.by || 'Sales Rep'}
                        </Text>
                        <View style={[styles.roleTag, { backgroundColor: roleColor + '20', borderColor: roleColor + '50' }]}>
                          <Text style={{ fontSize: 8, fontWeight: '900', color: roleColor }}>
                            {roleLabel}
                          </Text>
                        </View>
                      </View>

                      {/* Notes / Discussion Summary */}
                      {item.notes ? (
                        <View style={[styles.notesContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                          <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                            "{item.notes}"
                          </Text>
                        </View>
                      ) : null}

                      {/* Sent message snippet (WhatsApp/Email preview) */}
                      {item.sentMessage ? (
                        <View
                          style={[
                            styles.sentMessagePreview,
                            {
                              backgroundColor: isDark ? '#020617' : '#f0fdf4',
                              borderColor: isDark ? 'rgba(34,197,94,0.3)' : '#bbf7d0',
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 8, fontWeight: '900', color: '#16a34a', textTransform: 'uppercase', marginBottom: 2 }}>
                            Message Preview:
                          </Text>
                          <Text
                            style={[
                              styles.messagePreviewText,
                              { color: isDark ? '#cbd5e1' : '#166534' },
                            ]}
                            numberOfLines={4}
                          >
                            {item.sentMessage}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  headerContainer: {
    marginBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 9,
    marginTop: 2,
    lineHeight: 12,
  },
  refreshBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 6,
  },
  badgePill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // Stats Grid (3 columns, 2 rows)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  statCard: {
    width: '31.5%',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 1,
  },
  statLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 1,
    textAlign: 'center',
  },

  // Filter chips
  filterScrollView: {
    marginBottom: 12,
  },
  filterScrollContent: {
    gap: 6,
    paddingRight: 6,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  filterChipText: {
    fontSize: 9,
  },

  // Commercials panel
  commercialsPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
  },
  commercialsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  commercialsTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  packageIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commercialsHeading: {
    fontSize: 11,
    fontWeight: '900',
  },
  uniqueCountPill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  commercialsSubtext: {
    fontSize: 8,
    marginTop: 1,
  },
  shrinkBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  shrunkStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    marginTop: 4,
  },
  shrunkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },

  productLedgerCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  productNameText: {
    fontSize: 10,
    fontWeight: '900',
  },
  qtyBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  priceTagPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  shareCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 6,
  },
  shareCountPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  historyToggleBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  productCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 6,
  },
  mediumPillSmall: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },

  expandedHistoryContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    marginTop: 6,
  },
  expandedHistoryTitle: {
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  historyLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 4,
  },

  // Timeline section
  timelineSection: {
    marginTop: 2,
  },
  dayGroupContainer: {
    marginBottom: 12,
  },
  dayDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dayBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dayLine: {
    flex: 1,
    height: 1,
  },

  timelineCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  mediumTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mediumTagText: {
    fontSize: 8,
    fontWeight: '900',
  },
  durationPill: {
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  docTagPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  productTagPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    maxWidth: 140,
  },
  timeText: {
    fontSize: 8,
    fontWeight: '700',
  },

  scheduledBanner: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 6,
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  roleTag: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },

  notesContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    marginTop: 6,
  },
  notesText: {
    fontSize: 9,
    fontStyle: 'italic',
    lineHeight: 13,
  },

  sentMessagePreview: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    marginTop: 6,
  },
  messagePreviewText: {
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 12,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
    lineHeight: 13,
  },
});
