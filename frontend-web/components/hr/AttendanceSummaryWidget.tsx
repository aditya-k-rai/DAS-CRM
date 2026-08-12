'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Minus, Home, Sun, Lock, Calendar, User, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

const MY_PERSONAL_ATTENDANCE = [
  { date: 'Today (Aug 13)', checkIn: '09:05 AM', checkOut: 'Working...', hours: '7.5 hrs', status: 'PRESENT' },
  { date: 'Aug 12, 2026', checkIn: '09:01 AM', checkOut: '06:15 PM', hours: '9.2 hrs', status: 'PRESENT' },
  { date: 'Aug 11, 2026', checkIn: '09:28 AM', checkOut: '06:30 PM', hours: '9.0 hrs', status: 'LATE' },
  { date: 'Aug 10, 2026', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9.0 hrs', status: 'PRESENT' },
  { date: 'Aug 09, 2026', checkIn: '09:10 AM', checkOut: '06:00 PM', hours: '8.8 hrs', status: 'WORK_FROM_HOME' },
];

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

  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();
  const isEmployeeMode = rawRole === 'SALES_EXEC' || rawRole === 'EMPLOYEE' || rawRole === 'STAFF' || rawRole === 'REP';

  // ── READ-ONLY PERSONAL ATTENDANCE MODE FOR SALES EXECUTIVE ────────────────
  if (isEmployeeMode) {
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
                    READ-ONLY MODE
                  </span>
                </div>
                <p className="text-xs text-muted">Personal attendance history for <strong className="text-white">{currentUser.name}</strong></p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted bg-muted/20 px-3 py-1.5 rounded-xl border border-border">
              <Lock size={13} className="text-amber-400" />
              <span>Attendance records are locked & verified by HR</span>
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
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar size={15} className="text-brand-400" /> Personal Attendance History
            </h4>
            <span className="text-xs text-muted">Last 30 Days Record</span>
          </div>

          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours Logged</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {MY_PERSONAL_ATTENDANCE.map((row) => {
                  const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.PRESENT;
                  const Icon = cfg.icon;
                  return (
                    <tr key={row.date}>
                      <td className="font-bold text-sm text-white">{row.date}</td>
                      <td className="font-mono text-xs font-semibold text-emerald-400">{row.checkIn}</td>
                      <td className="font-mono text-xs font-semibold text-muted">{row.checkOut}</td>
                      <td className="font-mono text-xs font-bold text-brand-300">{row.hours}</td>
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
        </div>
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
