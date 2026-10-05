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
  | 'EMAIL'
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
  sharingMedium?: 'WHATSAPP' | 'EMAIL' | 'IN_PERSON' | 'DIRECT' | 'WHATSAPP_DIRECT' | string;
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

function groupByDate(history: ContactAttempt[]): Record<string, ContactAttempt[]> {
  const groups: Record<string, ContactAttempt[]> = {};
  if (!Array.isArray(history)) return groups;
  [...history].sort((a, b) => {
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

const TYPE_META: Record<ContactType, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  CALL_OUT: { icon: <Phone size={12} />, color: '#34d399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)', label: 'Outbound Call' },
  CALL_IN: { icon: <PhoneIncoming size={12} />, color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.35)', label: 'Inbound Call' },
  CALL_MISSED: { icon: <PhoneMissed size={12} />, color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', label: 'Missed Call' },
  CALL_BUSY: { icon: <PhoneOff size={12} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', label: 'Busy / Engaged' },
  CALL_NOT_RESPONDING: { icon: <PhoneOff size={12} />, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', label: 'Not Responding' },
  CALL_SWITCH_OFF: { icon: <PhoneOff size={12} />, color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', label: 'Switch Off' },
  WHATSAPP: { icon: <MessageSquare size={12} />, color: '#4ade80', bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.35)', label: 'WhatsApp' },
  EMAIL: { icon: <Mail size={12} />, color: '#818cf8', bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.35)', label: 'Email' },
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
  const [filterType, setFilterType] = useState<'ALL' | 'MEETING' | 'FOLLOW_UP' | 'QUOTATION' | 'INVOICE' | ContactType>('ALL');

  // ── Computed Stats ──────────────────────────────────────────────────────────
  const totalAttempts = history.length;
  const connectedCalls = history.filter(h => ['CALL_OUT', 'CALL_IN'].includes(h.type) && h.durationSeconds && h.durationSeconds > 0).length;
  const missedOrNoAnswer = history.filter(h => ['CALL_MISSED', 'CALL_BUSY', 'CALL_NOT_RESPONDING', 'CALL_SWITCH_OFF'].includes(h.type) || h.outcome === 'NO_ANSWER' || h.outcome === 'BUSY').length;
  const meetingCount = history.filter(h => h.outcome === 'MEETING_SCHEDULED' || h.scheduledType === 'MEETING' || Boolean(h.notes && /meeting|visit|in-person/i.test(h.notes))).length;
  const waCount = history.filter(h => h.type === 'WHATSAPP').length;
  const emailCount = history.filter(h => h.type === 'EMAIL').length;
  const followUpCount = history.filter(h => h.type.startsWith('FOLLOWUP_') || Boolean(h.followUpDate) || Boolean(h.isRescheduled)).length;
  const quotationCount = history.filter(h => h.type === 'QUOTATION' || h.outcome === 'QUOTATION_SHARED' || (h.docType && !h.docType.includes('INVOICE')) || Boolean(h.notes && /quotation/i.test(h.notes))).length;
  const invoiceCount = history.filter(h => h.type === 'INVOICE' || h.outcome === 'INVOICE_SHARED' || (h.docType && h.docType.includes('INVOICE')) || Boolean(h.notes && /invoice/i.test(h.notes))).length;
  const totalTalkSecs = history.reduce((acc, h) => acc + (h.durationSeconds || 0), 0);
  
  // Resolve Interested Product / Service (from lead profile or logged history)
  const displayProduct = (interestedProduct && interestedProduct !== '—' && interestedProduct.trim())
    ? interestedProduct
    : (history.find(h => h.productInterest)?.productInterest || '—');

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = filterType === 'ALL'
    ? history
    : filterType === 'MEETING'
    ? history.filter(h => h.outcome === 'MEETING_SCHEDULED' || h.scheduledType === 'MEETING' || Boolean(h.notes && /meeting|visit|in-person/i.test(h.notes)))
    : filterType === 'FOLLOW_UP'
    ? history.filter(h => h.type.startsWith('FOLLOWUP_') || Boolean(h.followUpDate) || Boolean(h.isRescheduled))
    : filterType === 'QUOTATION'
    ? history.filter(h => h.type === 'QUOTATION' || h.outcome === 'QUOTATION_SHARED' || (h.docType && !h.docType.includes('INVOICE')) || Boolean(h.notes && /quotation/i.test(h.notes)))
    : filterType === 'INVOICE'
    ? history.filter(h => h.type === 'INVOICE' || h.outcome === 'INVOICE_SHARED' || (h.docType && h.docType.includes('INVOICE')) || Boolean(h.notes && /invoice/i.test(h.notes)))
    : history.filter(h => h.type === filterType);
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
          { label: 'WhatsApp', value: waCount, color: '#4ade80', bg: 'rgba(74,222,128,0.12)', icon: <MessageSquare size={13} /> },
          { label: 'Email', value: emailCount, color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: <Mail size={13} /> },
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
        {(['ALL', 'MEETING', 'CALL_OUT', 'FOLLOW_UP', 'QUOTATION', 'INVOICE', 'CALL_BUSY', 'CALL_NOT_RESPONDING', 'WHATSAPP', 'EMAIL'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer"
            style={{
              background: filterType === f 
                ? (f === 'MEETING' ? 'rgba(168,85,247,0.25)' : f === 'FOLLOW_UP' ? 'rgba(14,165,233,0.25)' : f === 'QUOTATION' ? 'rgba(129,140,248,0.25)' : f === 'INVOICE' ? 'rgba(56,189,248,0.25)' : 'rgba(99,102,241,0.25)') 
                : 'rgba(15,23,42,0.8)',
              borderColor: filterType === f 
                ? (f === 'MEETING' ? 'rgba(168,85,247,0.5)' : f === 'FOLLOW_UP' ? 'rgba(14,165,233,0.5)' : f === 'QUOTATION' ? 'rgba(129,140,248,0.5)' : f === 'INVOICE' ? 'rgba(56,189,248,0.5)' : 'rgba(99,102,241,0.5)') 
                : 'rgb(30,41,59)',
              color: filterType === f 
                ? (f === 'MEETING' ? '#c084fc' : f === 'FOLLOW_UP' ? '#38bdf8' : f === 'QUOTATION' ? '#a5b4fc' : f === 'INVOICE' ? '#7dd3fc' : '#818cf8') 
                : '#94a3b8',
            }}
          >
            {f === 'ALL' ? `All (${totalAttempts})` : f === 'MEETING' ? `🏢 Meetings (${meetingCount})` : f === 'CALL_OUT' ? `📞 Calls (${history.filter(h=>['CALL_OUT','CALL_IN'].includes(h.type)).length})` : f === 'FOLLOW_UP' ? `⏱️ Follow-ups (${followUpCount})` : f === 'QUOTATION' ? `📄 Quotations (${quotationCount})` : f === 'INVOICE' ? `🧾 Invoices (${invoiceCount})` : f === 'CALL_BUSY' ? `🔴 Busy/Missed (${missedOrNoAnswer})` : f === 'CALL_NOT_RESPONDING' ? `🔕 No Response` : f === 'WHATSAPP' ? `💬 WhatsApp (${waCount})` : `📧 Email (${emailCount})`}
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
                const typeMeta = (attempt?.type && TYPE_META[attempt.type]) || TYPE_META.CALL_OUT;
                
                // Intelligently detect if this outreach record represents a scheduled meeting / visit
                const isMeeting =
                  attempt?.outcome === 'MEETING_SCHEDULED' ||
                  attempt?.scheduledType === 'MEETING' ||
                  Boolean(attempt?.notes && /meeting|visit|in-person/i.test(attempt.notes));

                const isFollowUpAction = attempt?.type?.startsWith('FOLLOWUP_') || attempt?.outcome?.startsWith('FOLLOW_UP_');

                const outcomeMeta = isMeeting
                  ? OUTCOME_META.MEETING_SCHEDULED
                  : (attempt?.outcome && OUTCOME_META[attempt.outcome]) || OUTCOME_META.TALKED;

                const { time, date } = formatTimestamp(attempt?.timestamp);
                const isExpanded = expandedId === attempt?.id;
                const isPositive = ['TALKED', 'INTERESTED_MORE_INFO', 'DEAL_CLOSED', 'FOLLOW_UP_SCHEDULED', 'FOLLOW_UP_RESCHEDULED', 'FOLLOW_UP_COMPLETED', 'MEETING_SCHEDULED', 'WA_SENT', 'EMAIL_SENT'].includes(attempt?.outcome || '') || isMeeting || isFollowUpAction;
                const isNegative = ['NOT_INTERESTED', 'NO_ANSWER', 'BUSY', 'SWITCH_OFF', 'WRONG_NUMBER', 'FOLLOW_UP_CANCELLED'].includes(attempt?.outcome || '') || attempt?.type === 'FOLLOWUP_CANCELLED';

                return (
                  <div key={attempt?.id || `attempt-${idx}`} className="flex gap-3 relative">
                    {/* Timeline Node */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center border-2 flex-shrink-0 z-10 mt-0.5"
                      style={{
                        background: isMeeting ? 'rgba(168,85,247,0.15)' : attempt?.type === 'FOLLOWUP_RESCHEDULED' ? 'rgba(14,165,233,0.2)' : typeMeta.bg,
                        borderColor: isMeeting ? 'rgba(168,85,247,0.45)' : attempt?.type === 'FOLLOWUP_RESCHEDULED' ? 'rgba(14,165,233,0.5)' : typeMeta.border,
                      }}
                    >
                      <span style={{ color: isMeeting ? '#c084fc' : attempt?.type === 'FOLLOWUP_RESCHEDULED' ? '#38bdf8' : typeMeta.color }}>
                        {isMeeting ? <Calendar size={13} className="text-purple-400" /> : attempt?.type === 'FOLLOWUP_RESCHEDULED' ? <Clock size={13} className="text-sky-400" /> : typeMeta.icon}
                      </span>
                    </div>

                    {/* Card */}
                    <div
                      className="flex-1 rounded-2xl border overflow-hidden"
                      style={{
                        borderColor: isMeeting ? 'rgba(168,85,247,0.4)' : attempt?.type === 'FOLLOWUP_RESCHEDULED' ? 'rgba(14,165,233,0.45)' : isPositive ? typeMeta.border : 'rgb(30,41,59)',
                        background: isMeeting ? 'rgba(26,16,43,0.7)' : attempt?.type === 'FOLLOWUP_RESCHEDULED' ? 'rgba(12,25,44,0.75)' : 'rgba(15,23,42,0.7)',
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
                            <span
                              className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1"
                              style={{ background: typeMeta.bg, color: typeMeta.color, border: `1px solid ${typeMeta.border}` }}
                            >
                              {typeMeta.icon} {typeMeta.label}
                            </span>
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
                              <span className="text-slate-500 text-[10px] italic truncate max-w-[200px] hidden md:block">
                                — {attempt.notes.substring(0, 60)}...
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
                          {attempt.followUpDate && (
                            isMeeting ? (
                              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-500/12 border border-purple-500/35">
                                <Calendar size={15} className="text-purple-400 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <span>🏢</span> IN-PERSON / VIRTUAL MEETING SCHEDULED
                                  </p>
                                  <p className="text-xs font-extrabold text-purple-200 mt-0.5">
                                    {(() => {
                                      const d = new Date(attempt.followUpDate);
                                      return !isNaN(d.getTime())
                                        ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : attempt.followUpDate;
                                    })()}
                                    {attempt.followUpTime && <span className="ml-2 font-black text-white">at {attempt.followUpTime}</span>}
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
                                    const d = new Date(attempt.followUpDate);
                                    return !isNaN(d.getTime())
                                      ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                      : attempt.followUpDate;
                                  })()}
                                  {attempt.followUpTime && <span className="ml-2 font-black text-white">at {attempt.followUpTime}</span>}
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
