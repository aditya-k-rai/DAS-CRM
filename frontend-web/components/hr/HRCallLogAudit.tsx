'use client';

import { useState } from 'react';
import {
  PhoneCall, Users, Calendar, Clock, Download, Search, Shield,
  CheckCircle2, AlertCircle, Phone, Sliders
} from 'lucide-react';
import { downloadCSV } from '@/lib/exportUtils';

interface EmployeeCallLogAudit {
  id: string;
  employeeName: string;
  role: string;
  manager: string;
  totalCallsToday: number;
  totalDurationMins: number;
  interestedCount: number;
  followupCount: number;
  noAnswerCount: number;
  lastCallTime: string;
  attendanceStatus: 'Present' | 'Late' | 'WFH';
}

const CALL_AUDIT_DATA: EmployeeCallLogAudit[] = [];

export function HRCallLogAudit() {
  const [search, setSearch] = useState('');

  const filtered = CALL_AUDIT_DATA.filter(e =>
    !search || e.employeeName.toLowerCase().includes(search.toLowerCase()) || e.manager.toLowerCase().includes(search.toLowerCase())
  );

  const totalCalls = filtered.reduce((acc, e) => acc + e.totalCallsToday, 0);
  const totalMins = filtered.reduce((acc, e) => acc + e.totalDurationMins, 0);
  const totalInterested = filtered.reduce((acc, e) => acc + e.interestedCount, 0);
  const totalFollowups = filtered.reduce((acc, e) => acc + e.followupCount, 0);

  const handleExportCSV = () => {
    const headers = ['Employee Name', 'Role', 'Manager', 'Calls Today', 'Total Duration (Mins)', 'Interested', 'Follow-up Required', 'No Answer', 'Last Call Time', 'Attendance'];
    const rows = filtered.map(e => [
      e.employeeName, e.role, e.manager, e.totalCallsToday, e.totalDurationMins,
      e.interestedCount, e.followupCount, e.noAnswerCount, e.lastCallTime, e.attendanceStatus,
    ]);
    downloadCSV('Employee_Call_Logs_Audit', headers, rows);
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="crm-card flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <PhoneCall size={20} />
          </div>
          <div>
            <h2 className="font-bold text-base text-white">Employee Call Logs & Outreach Audit</h2>
            <p className="text-xs text-muted">Configured by Admin for HR & Manager oversight · Daily call counts, durations, and post-call outcomes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn-secondary text-xs gap-1.5 flex items-center h-9">
            <Download size={13} /> Export Call Audit CSV
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Total Employee Calls Today</p>
          <p className="text-2xl font-extrabold text-white">{totalCalls} Calls</p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">Across {filtered.length} Reps</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Total Call Duration</p>
          <p className="text-2xl font-extrabold text-brand-400">{totalMins} Mins</p>
          <p className="text-xs text-brand-400 font-semibold mt-1">{(totalMins / 60).toFixed(1)} Hours Total</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Interested Outcomes</p>
          <p className="text-2xl font-extrabold text-emerald-400">{totalInterested} Leads</p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">Positive Response</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Follow-up Required</p>
          <p className="text-2xl font-extrabold text-amber-400">{totalFollowups} Leads</p>
          <p className="text-xs text-amber-400 font-semibold mt-1">Scheduled in Calendar</p>
        </div>
      </div>

      {/* Audit Table */}
      <div className="crm-card p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">Employee Call Performance Table</h3>
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="crm-input pl-9 text-xs h-8"
              placeholder="Search employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="crm-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Calls Made Today</th>
              <th>Total Talk Time</th>
              <th>Post-Call Outcomes</th>
              <th>Last Activity</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">
                  <PhoneCall size={28} className="mx-auto mb-2 text-muted/60" />
                  <p className="font-bold text-sm text-white">No call logs recorded today</p>
                  <p className="text-xs text-muted mt-1">Live calls logged through the dialer will appear here in real-time.</p>
                </td>
              </tr>
            ) : (
              filtered.map(emp => (
              <tr key={emp.id}>
                <td>
                  <div>
                    <p className="font-bold text-sm text-white">{emp.employeeName}</p>
                    <p className="text-xs text-muted">{emp.role} · Under {emp.manager}</p>
                  </div>
                </td>
                <td>
                  <span className="font-extrabold text-sm text-brand-400">{emp.totalCallsToday} calls</span>
                </td>
                <td>
                  <span className="font-mono text-xs font-bold text-white">{emp.totalDurationMins} mins</span>
                </td>
                <td>
                  <div className="flex gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400" title="Interested">
                      ✓ {emp.interestedCount} Interested
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-500/20 text-blue-400" title="Follow-up">
                      📅 {emp.followupCount} Follow-up
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-400" title="No Answer">
                      ✕ {emp.noAnswerCount} No Answer
                    </span>
                  </div>
                </td>
                <td><span className="text-xs text-muted">{emp.lastCallTime}</span></td>
                <td>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${emp.attendanceStatus === 'Present' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {emp.attendanceStatus}
                  </span>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
