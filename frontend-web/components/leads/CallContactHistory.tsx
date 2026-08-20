'use client';

import React, { useState } from 'react';
import {
  Phone, PhoneOff, PhoneMissed, PhoneIncoming, MessageSquare,
  Mail, Clock, User, Mic, Calendar, ChevronDown, ChevronUp,
  Activity, TrendingUp, CheckCircle2, XCircle, AlertCircle,
  Package, FileText, BarChart2, ArrowRight
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ContactType = 'CALL_OUT' | 'CALL_IN' | 'WHATSAPP' | 'EMAIL' | 'CALL_MISSED' | 'CALL_BUSY' | 'CALL_NOT_RESPONDING' | 'CALL_SWITCH_OFF';

export type ContactOutcome =
  | 'TALKED'
  | 'NOT_INTERESTED'
  | 'WILL_CALL_BACK'
  | 'INTERESTED_MORE_INFO'
  | 'DEAL_CLOSED'
  | 'FOLLOW_UP_SCHEDULED'
  | 'BUSY'
  | 'NO_ANSWER'
  | 'SWITCH_OFF'
  | 'WRONG_NUMBER'
  | 'WA_SENT'
  | 'EMAIL_SENT'
  | 'VOICEMAIL';

export interface ContactAttempt {
  id: string;
  type: ContactType;
  outcome: ContactOutcome;
  by: string;                    // Rep name who made the contact
  byRole: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC';
  timestamp: string;             // Full ISO timestamp
  durationSeconds?: number;      // Call duration in seconds
  notes?: string;                // What was discussed / outcome notes
  productInterest?: string;      // Product discussed
  followUpDate?: string;         // Scheduled callback date
  followUpTime?: string;
  sentMessage?: string;          // WA/Email message snippet
  audioRecordingAvailable?: boolean;
}

// ─── Rich Sample Data ──────────────────────────────────────────────────────────

export const SAMPLE_CONTACT_HISTORY: ContactAttempt[] = [
  {
    id: 'c1',
    type: 'CALL_OUT',
    outcome: 'TALKED',
    by: 'Mighty Rai (Sales)',
    byRole: 'SALES_EXEC',
    timestamp: '2026-08-21T14:45:00+05:30',
    durationSeconds: 258,
    notes: 'Initial outreach. Client very interested in the Enterprise 50-seat CRM plan. Wants pricing deck on WhatsApp before making a decision. Very responsive.',
    productInterest: 'DAS CRM Enterprise Suite',
    followUpDate: '2026-08-22',
    followUpTime: '11:00 AM',
    audioRecordingAvailable: true,
  },
  {
    id: 'c2',
    type: 'WHATSAPP',
    outcome: 'WA_SENT',
    by: 'Mighty Rai (Sales)',
    byRole: 'SALES_EXEC',
    timestamp: '2026-08-21T15:10:00+05:30',
    notes: 'Sent DAS CRM Enterprise Proposal PDF + pricing deck as promised after the call.',
    sentMessage: 'Hi Rajesh, as discussed sending our Enterprise CRM proposal. Please review and let me know your thoughts...',
    productInterest: 'DAS CRM Enterprise Suite',
  },
  {
    id: 'c3',
    type: 'CALL_OUT',
    outcome: 'INTERESTED_MORE_INFO',
    by: 'Mighty Rai (Sales)',
    byRole: 'SALES_EXEC',
    timestamp: '2026-08-20T11:30:00+05:30',
    durationSeconds: 142,
    notes: 'Follow-up call. Client reviewed the proposal. Interested but wants to confirm with CFO. Asked about GST invoice process and annual plan discount.',
    productInterest: 'DAS CRM Enterprise Suite',
    followUpDate: '2026-08-21',
    followUpTime: '03:00 PM',
    audioRecordingAvailable: true,
  },
  {
    id: 'c4',
    type: 'CALL_BUSY',
    outcome: 'BUSY',
    by: 'Mighty Rai (Sales)',
    byRole: 'SALES_EXEC',
    timestamp: '2026-08-20T09:15:00+05:30',
    notes: 'Called — line busy. Tried again after 30 mins.',
  },
  {
    id: 'c5',
    type: 'EMAIL',
    outcome: 'EMAIL_SENT',
    by: 'Priya Sharma (TL)',
    byRole: 'TEAM_LEADER',
    timestamp: '2026-08-19T16:00:00+05:30',
    notes: 'Team Leader sent formal CRM demo invitation email on behalf of the account.',
    sentMessage: 'Subject: Exclusive CRM Demo Invitation — Rajesh, we would love to show you how DAS CRM can double your conversion rates...',
    productInterest: 'DAS CRM Enterprise Suite',
  },
  {
    id: 'c6',
    type: 'CALL_OUT',
    outcome: 'NO_ANSWER',
    by: 'Mighty Rai (Sales)',
    byRole: 'SALES_EXEC',
    timestamp: '2026-08-19T10:00:00+05:30',
    durationSeconds: 0,
    notes: 'No response. Left voicemail.',
    audioRecordingAvailable: false,
  },
  {
    id: 'c7',
    type: 'CALL_NOT_RESPONDING',
    outcome: 'NO_ANSWER',
    by: 'Mighty Rai (Sales)',
    byRole: 'SALES_EXEC',
    timestamp: '2026-08-18T14:20:00+05:30',
    notes: 'Not responding. Sent SMS follow-up.',
  },
  {
    id: 'c8',
    type: 'CALL_OUT',
    outcome: 'WILL_CALL_BACK',
    by: 'Amit Patel (Sales)',
    byRole: 'SALES_EXEC',
    timestamp: '2026-08-17T11:00:00+05:30',
    durationSeconds: 47,
    notes: 'First contact attempt. Client said he\'s in a meeting. Will call back later today.',
    followUpDate: '2026-08-17',
    followUpTime: '05:00 PM',
    audioRecordingAvailable: true,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(secs: number): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTimestamp(iso: string): { date: string; time: string; dayLabel: string } {
  const d = new Date(iso);
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
  [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .forEach(item => {
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
};

const OUTCOME_META: Record<ContactOutcome, { emoji: string; color: string; label: string }> = {
  TALKED: { emoji: '✅', color: '#34d399', label: 'Talked & Responded' },
  NOT_INTERESTED: { emoji: '❌', color: '#ef4444', label: 'Not Interested' },
  WILL_CALL_BACK: { emoji: '🔄', color: '#f59e0b', label: 'Will Call Back' },
  INTERESTED_MORE_INFO: { emoji: '🔥', color: '#f97316', label: 'Interested — Wants More Info' },
  DEAL_CLOSED: { emoji: '🎉', color: '#22c55e', label: 'Deal Closed!' },
  FOLLOW_UP_SCHEDULED: { emoji: '📅', color: '#38bdf8', label: 'Follow-up Scheduled' },
  BUSY: { emoji: '🔴', color: '#f59e0b', label: 'Line Busy' },
  NO_ANSWER: { emoji: '🔕', color: '#94a3b8', label: 'No Answer' },
  SWITCH_OFF: { emoji: '📴', color: '#6b7280', label: 'Switched Off' },
  WRONG_NUMBER: { emoji: '⚠️', color: '#ef4444', label: 'Wrong Number' },
  WA_SENT: { emoji: '💬', color: '#4ade80', label: 'WhatsApp Sent' },
  EMAIL_SENT: { emoji: '📧', color: '#818cf8', label: 'Email Dispatched' },
  VOICEMAIL: { emoji: '📼', color: '#a78bfa', label: 'Voicemail Left' },
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CallContactHistoryProps {
  history?: ContactAttempt[];
  leadName?: string;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CallContactHistory({ history = SAMPLE_CONTACT_HISTORY, leadName = 'Lead' }: CallContactHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | ContactType>('ALL');

  // ── Computed Stats ──────────────────────────────────────────────────────────
  const totalAttempts = history.length;
  const connectedCalls = history.filter(h => ['CALL_OUT', 'CALL_IN'].includes(h.type) && h.durationSeconds && h.durationSeconds > 0).length;
  const missedOrNoAnswer = history.filter(h => ['CALL_MISSED', 'CALL_BUSY', 'CALL_NOT_RESPONDING', 'CALL_SWITCH_OFF'].includes(h.type) || h.outcome === 'NO_ANSWER' || h.outcome === 'BUSY').length;
  const waCount = history.filter(h => h.type === 'WHATSAPP').length;
  const emailCount = history.filter(h => h.type === 'EMAIL').length;
  const totalTalkSecs = history.reduce((acc, h) => acc + (h.durationSeconds || 0), 0);
  const interestedCount = history.filter(h => ['TALKED', 'INTERESTED_MORE_INFO', 'DEAL_CLOSED', 'FOLLOW_UP_SCHEDULED'].includes(h.outcome)).length;

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = filterType === 'ALL' ? history : history.filter(h => h.type === filterType);
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
            <p className="text-[11px] text-slate-400">Every call, WhatsApp & email — with outcome, rep, duration & notes</p>
          </div>
        </div>
        <span className="text-[11px] font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-full">
          {totalAttempts} Total Contact Attempts
        </span>
      </div>

      {/* ── Stats Summary Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { label: 'Connected', value: connectedCalls, color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: <Phone size={13} /> },
          { label: 'Missed/No Ans', value: missedOrNoAnswer, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: <PhoneMissed size={13} /> },
          { label: 'WhatsApp', value: waCount, color: '#4ade80', bg: 'rgba(74,222,128,0.12)', icon: <MessageSquare size={13} /> },
          { label: 'Email', value: emailCount, color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: <Mail size={13} /> },
          { label: 'Talk Time', value: formatDuration(totalTalkSecs), color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', icon: <Mic size={13} /> },
          { label: 'Interested', value: interestedCount, color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: <TrendingUp size={13} /> },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-2.5 rounded-xl border text-center space-y-0.5"
            style={{ background: stat.bg, borderColor: stat.color + '40' }}
          >
            <div className="flex justify-center" style={{ color: stat.color }}>{stat.icon}</div>
            <p className="text-base font-extrabold text-white">{stat.value}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filter Chips ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'CALL_OUT', 'CALL_BUSY', 'CALL_NOT_RESPONDING', 'WHATSAPP', 'EMAIL'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all"
            style={{
              background: filterType === f ? 'rgba(99,102,241,0.25)' : 'rgba(15,23,42,0.8)',
              borderColor: filterType === f ? 'rgba(99,102,241,0.5)' : 'rgb(30,41,59)',
              color: filterType === f ? '#818cf8' : '#94a3b8',
            }}
          >
            {f === 'ALL' ? `All (${totalAttempts})` : f === 'CALL_OUT' ? `📞 Calls (${history.filter(h=>['CALL_OUT','CALL_IN'].includes(h.type)).length})` : f === 'CALL_BUSY' ? `🔴 Busy/Missed (${missedOrNoAnswer})` : f === 'CALL_NOT_RESPONDING' ? `🔕 No Response` : f === 'WHATSAPP' ? `💬 WhatsApp (${waCount})` : `📧 Email (${emailCount})`}
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
                const typeMeta = TYPE_META[attempt.type];
                const outcomeMeta = OUTCOME_META[attempt.outcome];
                const { time, date } = formatTimestamp(attempt.timestamp);
                const isExpanded = expandedId === attempt.id;
                const isPositive = ['TALKED', 'INTERESTED_MORE_INFO', 'DEAL_CLOSED', 'FOLLOW_UP_SCHEDULED', 'WA_SENT', 'EMAIL_SENT'].includes(attempt.outcome);
                const isNegative = ['NOT_INTERESTED', 'NO_ANSWER', 'BUSY', 'SWITCH_OFF', 'WRONG_NUMBER'].includes(attempt.outcome);

                return (
                  <div key={attempt.id} className="flex gap-3 relative">
                    {/* Timeline Node */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center border-2 flex-shrink-0 z-10 mt-0.5"
                      style={{ background: typeMeta.bg, borderColor: typeMeta.border }}
                    >
                      <span style={{ color: typeMeta.color }}>{typeMeta.icon}</span>
                    </div>

                    {/* Card */}
                    <div className="flex-1 rounded-2xl border overflow-hidden" style={{ borderColor: isPositive ? typeMeta.border : 'rgb(30,41,59)', background: 'rgba(15,23,42,0.7)' }}>
                      {/* Card Header — Always Visible */}
                      <button
                        className="w-full text-left p-3 flex items-start gap-3 hover:bg-slate-900/40 transition-colors"
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
                            <span className="text-[11px] font-extrabold" style={{ color: outcomeMeta.color }}>
                              {outcomeMeta.emoji} {outcomeMeta.label}
                            </span>
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
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <User size={10} className="text-slate-500" />
                            <span className="font-bold text-slate-300">{attempt.by}</span>
                            <span>·</span>
                            <Clock size={10} />
                            <span>{time}</span>
                            {attempt.notes && <span className="text-slate-600 text-[10px] italic truncate max-w-[200px] hidden md:block">— {attempt.notes.substring(0, 60)}...</span>}
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
                          {/* Full Notes */}
                          {attempt.notes && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText size={10} /> Call Notes / Outcome Details
                              </p>
                              <p className="text-xs text-slate-200 leading-relaxed italic">"{attempt.notes}"</p>
                            </div>
                          )}

                          {/* Product Interest */}
                          {attempt.productInterest && (
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
                              <Package size={13} className="text-indigo-400 flex-shrink-0" />
                              <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Product Discussed</p>
                                <p className="text-xs font-bold text-indigo-300">{attempt.productInterest}</p>
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

                          {/* Follow-up scheduled */}
                          {attempt.followUpDate && (
                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25">
                              <Calendar size={13} className="text-sky-400 flex-shrink-0" />
                              <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Follow-Up / Callback Scheduled</p>
                                <p className="text-xs font-extrabold text-sky-300">
                                  {new Date(attempt.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  {attempt.followUpTime && <span className="ml-2">at {attempt.followUpTime}</span>}
                                </p>
                              </div>
                            </div>
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
                                background: attempt.byRole === 'SALES_EXEC' ? 'rgba(52,211,153,0.12)' : attempt.byRole === 'TEAM_LEADER' ? 'rgba(56,189,248,0.12)' : 'rgba(129,140,248,0.12)',
                                color: attempt.byRole === 'SALES_EXEC' ? '#34d399' : attempt.byRole === 'TEAM_LEADER' ? '#38bdf8' : '#818cf8',
                              }}
                            >
                              {attempt.byRole === 'SALES_EXEC' ? 'Sales Rep' : attempt.byRole === 'TEAM_LEADER' ? 'Team Leader' : 'Manager'}
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
