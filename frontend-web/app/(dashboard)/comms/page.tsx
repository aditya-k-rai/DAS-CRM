'use client';

import { useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  RefreshCw, Search, MessageSquare, UserPlus,
  CheckCircle2, AlertTriangle, Clock, Activity,
  Wifi, Shield, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types (from Android CommunicationScreen.tsx) ─────────
type CallType = 'INCOMING' | 'OUTGOING' | 'MISSED';
type LogStatus = 'LOGGED_TO_CRM' | 'UNMATCHED';

interface CallLogEntry {
  id: string;
  phoneNumber: string;
  matchedLeadName: string | null;
  leadId: string | null;
  callType: CallType;
  durationSeconds: number;
  timestampStr: string;
  status: LogStatus;
}

// ── Seed data (mirrors Android CommunicationScreen) ──────
const INITIAL_LOGS: CallLogEntry[] = [
  { id: 'log-1', phoneNumber: '+91 98765 43210', matchedLeadName: 'Vikram Singh (Acme Corp)', leadId: 'lead-101', callType: 'OUTGOING',  durationSeconds: 245, timestampStr: 'Today, 10:15 AM',    status: 'LOGGED_TO_CRM' },
  { id: 'log-2', phoneNumber: '+91 98123 76543', matchedLeadName: 'Neha Joshi (LogiTech Systems)', leadId: 'lead-102', callType: 'INCOMING', durationSeconds: 180, timestampStr: 'Today, 11:30 AM',    status: 'LOGGED_TO_CRM' },
  { id: 'log-3', phoneNumber: '+91 97654 32109', matchedLeadName: null, leadId: null, callType: 'MISSED',   durationSeconds: 0,   timestampStr: 'Yesterday, 4:20 PM',  status: 'UNMATCHED' },
  { id: 'log-4', phoneNumber: '+91 91234 56789', matchedLeadName: 'Priya Sharma (RetailEdge)', leadId: 'lead-104', callType: 'OUTGOING',  durationSeconds: 422, timestampStr: 'Yesterday, 2:05 PM',  status: 'LOGGED_TO_CRM' },
  { id: 'log-5', phoneNumber: '+91 99001 23456', matchedLeadName: null, leadId: null, callType: 'INCOMING', durationSeconds: 65,  timestampStr: '2 days ago, 9:50 AM', status: 'UNMATCHED' },
  { id: 'log-6', phoneNumber: '+91 87654 32109', matchedLeadName: 'Rajesh Kumar (TechCorp)', leadId: 'lead-106', callType: 'MISSED',   durationSeconds: 0,   timestampStr: '2 days ago, 3:30 PM', status: 'LOGGED_TO_CRM' },
];

// ── Call type config ──────────────────────────────────────
const CALL_STYLES: Record<CallType, { icon: any; label: string; bg: string; text: string; border: string }> = {
  INCOMING: { icon: PhoneIncoming,  label: 'Incoming',  bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  OUTGOING: { icon: PhoneOutgoing,  label: 'Outgoing',  bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  border: 'border-indigo-500/30'  },
  MISSED:   { icon: PhoneMissed,    label: 'Missed',    bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30'    },
};

function formatDuration(secs: number): string {
  if (secs === 0) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ── WA Cloud Feature Cards ────────────────────────────────
const WA_FEATURES = [
  { icon: Wifi,    title: 'WhatsApp Cloud API',     desc: 'Meta-verified Business API connected. 100K monthly message quota active.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { icon: Shield,  title: 'Verified Business Badge', desc: 'Green verified badge active on +91 98765 00001. Delivery receipts enabled.', color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20'  },
  { icon: Zap,     title: 'Auto-Responder Bot',      desc: 'Bot rules active: greet → qualify → assign to sales exec automatically.', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  { icon: Activity,'title': 'Call Log Telemetry',   desc: 'Device call history synced & matched against CRM leads in real-time.', color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20'    },
];

export default function WhatsAppCloudPage() {
  const [logs, setLogs] = useState<CallLogEntry[]>(INITIAL_LOGS);
  const [filter, setFilter] = useState<'ALL' | CallType>('ALL');
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);

  const filtered = logs.filter((l) => {
    const matchType = filter === 'ALL' || l.callType === filter;
    const matchSearch = !search.trim() || l.phoneNumber.includes(search) ||
      (l.matchedLeadName?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchType && matchSearch;
  });

  const stats = {
    total: logs.length,
    logged: logs.filter(l => l.status === 'LOGGED_TO_CRM').length,
    unmatched: logs.filter(l => l.status === 'UNMATCHED').length,
    missed: logs.filter(l => l.callType === 'MISSED').length,
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      const newLog: CallLogEntry = {
        id: `log-${Date.now()}`,
        phoneNumber: '+91 99887 11223',
        matchedLeadName: 'Sunita Verma (Sunita Logistics)',
        leadId: 'lead-103',
        callType: 'INCOMING',
        durationSeconds: 310,
        timestampStr: 'Just now',
        status: 'LOGGED_TO_CRM',
      };
      setLogs(prev => [newLog, ...prev]);
      setSyncing(false);
    }, 1400);
  };

  const handleCreateLead = (log: CallLogEntry) => {
    const updated = logs.map(l =>
      l.id === log.id
        ? { ...l, matchedLeadName: `New Lead (${l.phoneNumber})`, leadId: `lead_${Date.now()}`, status: 'LOGGED_TO_CRM' as LogStatus }
        : l
    );
    setLogs(updated);
  };

  return (
    <>
      <Topbar
        title="WhatsApp Cloud & Communications"
        actions={
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn-primary text-xs gap-1.5 px-3 py-2 disabled:opacity-60"
          >
            <RefreshCw size={13} className={cn(syncing && 'animate-spin')} />
            {syncing ? 'Syncing...' : 'Sync Call Log'}
          </button>
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto animate-fade-in">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Calls', value: stats.total,     icon: Phone,         color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
            { label: 'Logged to CRM', value: stats.logged,  icon: CheckCircle2,  color: 'text-emerald-400',bg: 'bg-emerald-500/15' },
            { label: 'Unmatched',   value: stats.unmatched, icon: AlertTriangle,  color: 'text-amber-400',  bg: 'bg-amber-500/15' },
            { label: 'Missed',      value: stats.missed,    icon: PhoneMissed,   color: 'text-rose-400',   bg: 'bg-rose-500/15' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between">
                <p className="text-muted text-xs font-medium">{s.label}</p>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.bg)}>
                  <s.icon size={15} className={s.color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── WhatsApp Cloud Feature Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {WA_FEATURES.map((f) => (
            <div key={f.title} className={cn('crm-card p-4 border', f.border)}>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', f.bg)}>
                <f.icon size={18} className={f.color} />
              </div>
              <p className="text-white font-bold text-sm mb-1">{f.title}</p>
              <p className="text-muted text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Call Log Panel ── */}
        <div className="crm-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <Phone size={18} className="text-indigo-400" />
                Device Call Log Telemetry
              </h2>
              <p className="text-muted text-xs mt-1">
                Reads device call history, matches caller numbers against active CRM leads, and logs duration & timestamps automatically.
              </p>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by phone number or lead name..."
                className="crm-input pl-9 w-full"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {(['ALL', 'INCOMING', 'OUTGOING', 'MISSED'] as const).map((t) => {
                const s = t !== 'ALL' ? CALL_STYLES[t] : null;
                return (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                      filter === t && s ? `${s.bg} ${s.text} ${s.border}` :
                      filter === t     ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' :
                      'border-slate-800 text-muted hover:text-white hover:border-slate-600'
                    )}
                  >
                    {t === 'ALL' ? 'All' : CALL_STYLES[t].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Call Log List */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-10">
                <Phone size={36} className="text-muted mx-auto mb-3" />
                <p className="text-white font-semibold">No call logs found</p>
                <p className="text-muted text-sm mt-1">Try syncing or adjusting the filter.</p>
              </div>
            ) : (
              filtered.map((log) => {
                const cs = CALL_STYLES[log.callType];
                const CallIcon = cs.icon;
                return (
                  <div
                    key={log.id}
                    className={cn(
                      'flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-all',
                      log.status === 'UNMATCHED'
                        ? 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40'
                        : 'border-slate-800 hover:border-slate-600'
                    )}
                    style={{ background: log.status === 'UNMATCHED' ? undefined : 'rgb(var(--sidebar-bg))' }}
                  >
                    {/* Call type icon */}
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cs.bg)}>
                      <CallIcon size={18} className={cs.text} />
                    </div>

                    {/* Lead/Phone info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-bold text-sm">
                          {log.matchedLeadName ?? log.phoneNumber}
                        </p>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0', cs.bg, cs.text, cs.border)}>
                          {cs.label}
                        </span>
                        {log.status === 'LOGGED_TO_CRM' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex-shrink-0 flex items-center gap-1">
                            <CheckCircle2 size={9} /> CRM Logged
                          </span>
                        )}
                        {log.status === 'UNMATCHED' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex-shrink-0 flex items-center gap-1">
                            <AlertTriangle size={9} /> Unmatched
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-muted text-xs flex items-center gap-1">
                          <Phone size={10} /> {log.phoneNumber}
                        </span>
                        <span className="text-muted text-xs flex items-center gap-1">
                          <Clock size={10} /> {formatDuration(log.durationSeconds)}
                        </span>
                        <span className="text-muted text-xs">{log.timestampStr}</span>
                      </div>

                      {log.status === 'LOGGED_TO_CRM' && log.matchedLeadName && (
                        <p className="text-emerald-400 text-xs font-semibold mt-1">
                          ✓ Matched Lead — auto-logged to CRM timeline
                        </p>
                      )}
                      {log.status === 'UNMATCHED' && (
                        <p className="text-amber-400 text-xs font-semibold mt-1">
                          ⚠ Unmatched number — create a new lead to track
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={`tel:${log.phoneNumber}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/25 transition-all"
                      >
                        <Phone size={12} /> Call
                      </a>
                      {log.status === 'UNMATCHED' && (
                        <button
                          onClick={() => handleCreateLead(log)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 transition-all"
                        >
                          <UserPlus size={12} /> Create Lead
                        </button>
                      )}
                      {log.leadId && (
                        <a
                          href={`/leads/${log.leadId}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-500/25 transition-all"
                        >
                          <MessageSquare size={12} /> View Lead
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </>
  );
}
