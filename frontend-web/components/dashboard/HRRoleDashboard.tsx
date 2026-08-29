'use client';

import Link from 'next/link';
import {
  UserCog, Calendar, CheckSquare, DollarSign, Users, CheckCircle2,
  AlertCircle, Clock, FileText, ArrowRight, Shield
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function HRRoleDashboard() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="crm-card p-6 border-l-4 border-l-emerald-500 bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="avatar w-12 h-12 text-base font-bold bg-emerald-500/20 text-emerald-300">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Welcome, {currentUser.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  HR MANAGER
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">HR Operations Dashboard · Attendance, Leaves, Salary & Employee Audits</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/attendance" className="btn-secondary text-xs gap-1.5 flex items-center">
              <Calendar size={13} /> Mark Attendance
            </Link>
            <Link href="/hr/salary" className="btn-primary text-xs gap-1.5 flex items-center">
              <DollarSign size={13} /> Payroll Builder
            </Link>
          </div>
        </div>
      </div>

      {/* HR KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Total Employees Audited</p>
          <p className="text-2xl font-extrabold text-white">24</p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">Managers & Employees</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Present Today</p>
          <p className="text-2xl font-extrabold text-emerald-400">19 / 24</p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">79.2% Attendance Rate</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Pending Leave Requests</p>
          <p className="text-2xl font-extrabold text-amber-400">3</p>
          <p className="text-xs text-amber-400 font-semibold mt-1">Awaiting HR Approval</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Payroll Status (Aug 2026)</p>
          <p className="text-2xl font-extrabold text-purple-400">₹8.4L</p>
          <p className="text-xs text-purple-300 font-semibold mt-1">24 Payslips Ready</p>
        </div>
      </div>

      {/* Today's Attendance Overview */}
      <div className="crm-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Calendar size={16} className="text-emerald-400" /> Today's Attendance Overview (Managers & Employees)
          </h3>
          <Link href="/attendance" className="text-xs text-brand-400 font-semibold hover:underline">
            View All Attendance →
          </Link>
        </div>

        <div className="space-y-2">
          {[
            { name: 'Rajesh Kumar', role: 'Sales Executive', tl: 'Amit Shah (Manager)', time: '09:05 AM', status: 'Present', color: '#22c55e' },
            { name: 'Priya Sharma', role: 'Sales Executive', tl: 'Amit Shah (Manager)', time: '09:32 AM', status: 'Late', color: '#f59e0b' },
            { name: 'Sunita Verma', role: 'Senior Executive', tl: 'Neha Joshi (Manager)', time: '—', status: 'On Leave', color: '#8b5cf6' },
            { name: 'Amit Shah', role: 'Manager', tl: 'Vikram Singh (Admin)', time: '08:58 AM', status: 'Present', color: '#22c55e' },
          ].map(row => (
            <div key={row.name} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
              <div>
                <p className="font-bold text-sm text-white">{row.name}</p>
                <p className="text-xs text-muted">{row.role} · Under {row.tl}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted">{row.time}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ background: `${row.color}20`, color: row.color }}>
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
