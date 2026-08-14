'use client';

import { useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, Minus, Home, Sun, Lock, Calendar, User, Shield, X,
  ExternalLink, Building2, Phone, Mail, DollarSign, MessageSquare, Target, ChevronLeft, ChevronRight, Layers
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface UserPersonalActivityLog {
  date: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  status: string;
  hasQualifiedLead: boolean;
  hasVisitNegotiation: boolean;
  totalLeadsHandled: number;
  callsCount: number;
  msgsCount: number;
  leadActivities: {
    type: 'QUALIFIED' | 'VISIT_NEGOTIATION';
    leadName: string;
    email: string;
    phone: string;
    company: string;
    volume: string;
    time: string;
    summary: string;
  }[];
}

const EMPLOYEES = [
  { id: '1', name: 'Rajesh Kumar', role: 'Sales', tl: 'Amit Shah', checkIn: '09:05', checkOut: null, status: 'PRESENT' },
  { id: '2', name: 'Priya Sharma', role: 'Sales', tl: 'Amit Shah', checkIn: '09:32', checkOut: null, status: 'LATE' },
  { id: '3', name: 'Sunita Verma', role: 'Support', tl: 'Neha Joshi', checkIn: null, checkOut: null, status: 'ON_LEAVE' },
  { id: '4', name: 'Amit Patel', role: 'Sales', tl: 'Amit Shah', checkIn: '09:01', checkOut: null, status: 'PRESENT' },
  { id: '5', name: 'Meera Kapoor', role: 'Marketing', tl: 'Neha Joshi', checkIn: '09:15', checkOut: null, status: 'WORK_FROM_HOME' },
  { id: '6', name: 'Ravi Singh', role: 'Finance', tl: 'Neha Joshi', checkIn: null, checkOut: null, status: 'ABSENT' },
  { id: '7', name: 'Kavita Nair', role: 'Sales', tl: 'Amit Shah', checkIn: '09:00', checkOut: '13:30', status: 'HALF_DAY' },
  { id: '8', name: 'Deepak Joshi', role: 'Support', tl: 'Neha Joshi', checkIn: '08:55', checkOut: null, status: 'PRESENT' },
];

// 20-Day Window Generator: Generates 60 Days of realistic Personal Attendance & Lead Activity Logs (3 Pages x 20 Days)
const generate60DaysAttendanceLogs = (): UserPersonalActivityLog[] => {
  const logs: UserPersonalActivityLog[] = [];
  const startDate = new Date(2026, 7, 13); // Aug 13, 2026

  for (let i = 0; i < 60; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() - i);

    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const dateFormatted = i === 0
      ? 'Today (Aug 13)'
      : d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const hasQualified = !isWeekend && (i % 2 === 0 || i % 5 === 0);
    const hasVisit = !isWeekend && (i % 3 === 0 || i % 7 === 0);

    const totalLeads = isWeekend ? 0 : 20 + ((i * 7) % 15);
    const calls = isWeekend ? 0 : Math.floor(totalLeads * 0.65);
    const msgs = isWeekend ? 0 : totalLeads - calls;

    const status = isWeekend
      ? 'WORK_FROM_HOME'
      : i % 8 === 0
      ? 'LATE'
      : i % 14 === 0
      ? 'ON_LEAVE'
      : 'PRESENT';

    const checkIn = isWeekend ? '—' : status === 'LATE' ? '09:35 AM' : '09:02 AM';
    const checkOut = isWeekend ? '—' : i === 0 ? 'Working...' : '06:15 PM';
    const hours = isWeekend ? '0.0 hrs' : '9.0 hrs';

    const leadActivities = [];
    if (hasQualified) {
      leadActivities.push({
        type: 'QUALIFIED' as const,
        leadName: `Lead ${i + 1} - ${['Ananya Sharma', 'Rohan Mehta', 'Vikramaditya Rao', 'Sunita Real Estate', 'TechCorp Ltd'][i % 5]}`,
        email: `lead${i + 1}@company.com`,
        phone: `+91 98${10000000 + i * 3541}`,
        company: ['TechCorp Pvt Ltd', 'Apex Infrastructure', 'Solar Solutions', 'Construkt Builders', 'Lakshmi Auto'][i % 5],
        volume: `₹${(2 + (i % 9) * 1.2).toFixed(1)}L`,
        time: '11:20 AM',
        summary: 'Lead BANT requirement verified & qualified by logged-in rep.',
      });
    }
    if (hasVisit) {
      leadActivities.push({
        type: 'VISIT_NEGOTIATION' as const,
        leadName: `Lead ${i + 10} - ${['Pooja Nair', 'Kavita Verma', 'Siddharth Rao', 'AdAgency Pro', 'Grand Palace'][i % 5]}`,
        email: `visit${i + 1}@enterprise.com`,
        phone: `+91 91${20000000 + i * 4123}`,
        company: ['Grand Palace Hotel', 'AdAgency Pro', 'FMCG Global Network', 'SpeedCars Ltd', 'Innovate Tech'][i % 5],
        volume: `₹${(5 + (i % 7) * 2.1).toFixed(1)}L`,
        time: '03:45 PM',
        summary: 'In-person site visit conducted & discount terms negotiated.',
      });
    }

    logs.push({
      date: dateFormatted,
      checkIn,
      checkOut,
      hours,
      status,
      hasQualifiedLead: hasQualified,
      hasVisitNegotiation: hasVisit,
      totalLeadsHandled: totalLeads,
      callsCount: calls,
      msgsCount: msgs,
      leadActivities,
    });
  }

  return logs;
};

const FULL_60_DAYS_LOGS = generate60DaysAttendanceLogs();

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PRESENT:       { label: 'Present',       color: 'rgb(34,197,94)',  bg: 'rgba(34,197,94,0.12)',   icon: CheckCircle2 },
  LATE:          { label: 'Late',          color: 'rgb(245,158,11)', bg: 'rgba(245,158,11,0.12)',  icon: Clock },
  ABSENT:        { label: 'Absent',        color: 'rgb(239,68,68)',  bg: 'rgba(239,68,68,0.12)',   icon: XCircle },
  HALF_DAY:      { label: 'Half Day',      color: 'rgb(59,130,246)', bg: 'rgba(59,130,246,0.12)',  icon: Minus },
  ON_LEAVE:      { label: 'On Leave',      color: 'rgb(139,92,246)', bg: 'rgba(139,92,246,0.12)', icon: Sun },
  WORK_FROM_HOME:{ label: 'WFH',           color: 'rgb(99,102,241)', bg: 'rgba(99,102,241,0.12)', icon: Home },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

export function AttendanceSummaryWidget() {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('ALL');
  const [selectedLogModal, setSelectedLogModal] = useState<UserPersonalActivityLog | null>(null);

  // 20-Day Window Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();
  const isEmployeeMode = rawRole === 'SALES_EXEC' || rawRole === 'EMPLOYEE' || rawRole === 'STAFF' || rawRole === 'REP';

  // ── READ-ONLY PERSONAL ATTENDANCE MODE FOR SALES EXECUTIVE ────────────────
  if (isEmployeeMode) {
    const totalPages = Math.ceil(FULL_60_DAYS_LOGS.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentLogsSlice = FULL_60_DAYS_LOGS.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const startDateStr = currentLogsSlice[0]?.date || '';
    const endDateStr = currentLogsSlice[currentLogsSlice.length - 1]?.date || '';

    return (
      <div className="space-y-6">
        {/* Personal Attendance Header Card */}
        <div className="crm-card bg-gradient-to-r from-card via-background to-card border border-border p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand/20 text-brand-400 font-bold text-lg flex items-center justify-center border border-brand/30">
                {currentUser.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-white">My Attendance Log</h3>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    READ-ONLY MODE (20 DAYS / WINDOW)
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Personal attendance & sales activity history for <strong className="text-white">{currentUser.name}</strong> (Strictly User Scoped)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted bg-muted/20 px-3 py-1.5 rounded-xl border border-border">
              <Lock size={13} className="text-amber-400" />
              <span>Attendance records locked & verified by HR</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-background border border-border">
              <p className="text-[10px] text-muted uppercase font-bold">Today's Status</p>
              <p className="text-sm font-extrabold text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={14} /> Present (On Time)
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-background border border-border">
              <p className="text-[10px] text-muted uppercase font-bold">Check-In Time</p>
              <p className="text-sm font-mono font-extrabold text-white mt-0.5">09:05 AM</p>
            </div>
            <div className="p-3 rounded-2xl bg-background border border-border">
              <p className="text-[10px] text-muted uppercase font-bold">Monthly Hours</p>
              <p className="text-sm font-extrabold text-brand-400 mt-0.5">176.5 Hours</p>
            </div>
            <div className="p-3 rounded-2xl bg-background border border-border">
              <p className="text-[10px] text-muted uppercase font-bold">Attendance Score</p>
              <p className="text-sm font-extrabold text-purple-300 mt-0.5">98.2% (Excellent)</p>
            </div>
          </div>
        </div>

        {/* My Attendance History Table (No Admin Buttons / Other Staff Records) */}
        <div className="crm-card p-0 overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar size={15} className="text-brand-400" /> Personal Attendance History
            </h4>
            
            {/* Activity Indicator Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold text-muted bg-background/60 px-3 py-1.5 rounded-xl border border-border">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400/50 shadow-sm" />
                <span className="text-emerald-300">🟢 Lead Qualified</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-400/50 shadow-sm" />
                <span className="text-blue-300">🔵 Visits / Negotiation</span>
              </span>
            </div>
          </div>

          {/* ── 20 DAYS WINDOW & DATE RANGE HEADER BANNER ──────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-background/90 px-4 py-3 border-b border-border text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-brand-400 bg-brand/20 px-2.5 py-1 rounded-lg border border-brand/30">
                WINDOW PAGE {currentPage} OF {totalPages}
              </span>
              <span className="font-bold text-white">
                📅 Date Range: <strong className="text-amber-300 font-mono">{startDateStr}</strong> to <strong className="text-amber-300 font-mono">{endDateStr}</strong> ({currentLogsSlice.length} Days)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous 20 Days
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-40"
              >
                Next 20 Days <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Date (Click Indicator Dots for Lead Details & Volume)</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours Logged</th>
                  <th>Leads Handled (Calls / Msgs)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentLogsSlice.map((row) => {
                  const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.PRESENT;
                  const Icon = cfg.icon;
                  const hasActivities = row.leadActivities && row.leadActivities.length > 0;

                  return (
                    <tr key={row.date} className="hover:bg-brand/5 transition-all">
                      <td className="font-bold text-sm text-white">
                        <div
                          onClick={() => { if (hasActivities) setSelectedLogModal(row); }}
                          className={`flex items-center gap-2 ${hasActivities ? 'cursor-pointer group' : ''}`}
                        >
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {row.hasQualifiedLead && (
                              <span
                                className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400/60 shadow-md group-hover:scale-125 transition-transform"
                                title="🟢 Click to view Lead Qualified details & Deal Volume"
                              />
                            )}
                            {row.hasVisitNegotiation && (
                              <span
                                className="w-3 h-3 rounded-full bg-blue-500 border border-blue-400/60 shadow-md group-hover:scale-125 transition-transform"
                                title="🔵 Click to view Site Visit & Negotiation details & Deal Volume"
                              />
                            )}
                          </div>
                          <span className={hasActivities ? 'group-hover:text-brand-300 group-hover:underline' : ''}>
                            {row.date}
                          </span>
                        </div>
                      </td>
                      <td className="font-mono text-xs font-semibold text-emerald-400">{row.checkIn}</td>
                      <td className="font-mono text-xs font-semibold text-muted">{row.checkOut}</td>
                      <td className="font-mono text-xs font-bold text-brand-300">{row.hours}</td>

                      <td className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white bg-brand/20 px-2 py-0.5 rounded border border-brand/30 font-mono">
                            {row.totalLeadsHandled} Leads
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                            <Phone size={11} /> {row.callsCount} Calls
                          </span>
                          <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                            <MessageSquare size={11} /> {row.msgsCount} Msgs
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── 20 DAYS WINDOW FOOTER NAVIGATION & PAGE CONTROL ────────────────── */}
          <div className="p-4 border-t border-border flex items-center justify-between flex-wrap gap-3 bg-background text-xs">
            <div className="text-muted">
              Showing <strong className="text-white">{startIndex + 1}–{startIndex + currentLogsSlice.length}</strong> of <strong className="text-white">{FULL_60_DAYS_LOGS.length}</strong> Total Attendance Logs
              <span className="ml-2 font-mono text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 font-bold">
                [{startDateStr} — {endDateStr}]
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous 20 Days
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${currentPage === pg ? 'bg-brand text-white border-brand shadow' : 'bg-card border-border text-muted hover:text-white'}`}
                  >
                    Page {pg} (20 Days)
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-40"
              >
                Next 20 Days <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── INTERACTIVE LEAD DETAILS & DEAL VOLUME POPUP MODAL ───────────────── */}
        {selectedLogModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="crm-card max-w-xl w-full p-6 rounded-3xl border border-brand/40 shadow-2xl space-y-5 relative">
              {/* Close Button */}
              <button
                onClick={() => setSelectedLogModal(null)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-background border border-border hover:bg-card text-muted hover:text-white transition-all"
              >
                <X size={16} />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-brand/20 text-brand-300 border border-brand/30">
                    SCOPED TO USER: {currentUser.name.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white">Lead Details & Deal Volume ({selectedLogModal.date})</h3>
                <p className="text-xs text-muted">
                  Showing sales activities performed exclusively by <strong className="text-white">{currentUser.name}</strong> on this date.
                </p>
              </div>

              {/* Engagement Stats Banner */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-background border border-border text-center">
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase block">Total Leads Handled</span>
                  <span className="text-sm font-extrabold font-mono text-white mt-0.5 block">{selectedLogModal.totalLeadsHandled} Leads</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase block">Calls Placed</span>
                  <span className="text-sm font-extrabold font-mono text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                    <Phone size={12} /> {selectedLogModal.callsCount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase block">Messages Sent</span>
                  <span className="text-sm font-extrabold font-mono text-indigo-300 mt-0.5 flex items-center justify-center gap-1">
                    <MessageSquare size={12} /> {selectedLogModal.msgsCount}
                  </span>
                </div>
              </div>

              {/* Lead Activity Items List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {selectedLogModal.leadActivities.map((act, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-background border border-border space-y-3 hover:border-brand/40 transition-all">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {act.type === 'QUALIFIED' ? (
                          <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400 shadow-sm" />
                        ) : (
                          <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-400 shadow-sm" />
                        )}
                        <span className="text-xs font-bold uppercase text-white">
                          {act.type === 'QUALIFIED' ? '🟢 Lead Qualified' : '🔵 Site Visit / Negotiation'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-muted">{act.time}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] text-muted block uppercase font-semibold">Lead Name</span>
                        <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                          <User size={13} className="text-brand-400" /> {act.leadName}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted block uppercase font-semibold">Deal Volume / Value</span>
                        <span className="text-sm font-extrabold text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                          <DollarSign size={14} /> {act.volume}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted block uppercase font-semibold">Company</span>
                        <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 mt-0.5">
                          <Building2 size={13} /> {act.company}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted block uppercase font-semibold">Contact Details</span>
                        <span className="text-xs font-medium text-muted flex items-center gap-1 mt-0.5">
                          <Mail size={12} className="text-brand-400" /> {act.email}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-card border border-border text-xs text-muted leading-relaxed">
                      <strong className="text-white font-bold block mb-0.5">Activity Summary:</strong>
                      {act.summary}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedLogModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-600 text-white font-bold text-xs transition-all shadow-md"
                >
                  Close Lead Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── ADMIN & HR FULL ATTENDANCE MANAGEMENT MODE ───────────────────────────
  const filtered = filter === 'ALL' ? EMPLOYEES : EMPLOYEES.filter((e) => e.status === filter);

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = EMPLOYEES.filter((e) => e.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="crm-card overflow-hidden p-0">
      <div className="p-4 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Today's Attendance</h3>
            <p className="text-xs mt-0.5 text-muted">Aug 11, 2026 · 24 employees</p>
          </div>
          <button className="btn-primary text-xs px-3 py-1.5">+ Mark Attendance</button>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilter('ALL')} className={`pill-tab text-xs py-1 px-3 ${filter === 'ALL' ? 'active' : ''}`}>
            All ({EMPLOYEES.length})
          </button>
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => setFilter(s)} className={`text-xs py-1 px-3 rounded-full font-medium transition-all border ${filter === s ? '' : 'border-transparent'}`}
                style={{
                  background: filter === s ? cfg.bg : 'transparent',
                  color: filter === s ? cfg.color : 'rgb(var(--muted-foreground))',
                  borderColor: filter === s ? cfg.color : 'transparent',
                }}>
                {cfg.label} ({counts[s] ?? 0})
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Team Leader</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => {
              const cfg = STATUS_CONFIG[emp.status];
              const Icon = cfg.icon;
              return (
                <tr key={emp.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar w-8 h-8 text-xs" style={{ background: cfg.bg, color: cfg.color }}>
                        {emp.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{emp.name}</p>
                        <p className="text-xs text-muted">{emp.role}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="text-sm text-muted">{emp.tl}</span></td>
                  <td>
                    {emp.checkIn ? (
                      <span className="text-sm font-mono font-medium">{emp.checkIn}</span>
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {emp.checkOut ? (
                      <span className="text-sm font-mono font-medium">{emp.checkOut}</span>
                    ) : emp.checkIn ? (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: 'rgb(34,197,94)' }}>Working</span>
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <span className="status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={11} />
                      {cfg.label}
                    </span>
                  </td>
                  <td>
                    <button className="btn-secondary text-xs px-2 py-1">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
