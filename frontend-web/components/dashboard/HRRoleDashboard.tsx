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
    <div className="space-y-6 text-foreground">
      {/* Header Banner */}
      <div className="crm-card p-6 border-l-4 border-l-emerald-500 bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="avatar w-12 h-12 text-base font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">Welcome, {currentUser.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  HR MANAGER
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">HR Operations Dashboard · Attendance, Leaves, Salary & Employee Audits</p>
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
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Employees Audited</p>
          <p className="text-2xl font-extrabold text-foreground">0</p>
          <p className="text-xs text-muted-foreground font-semibold mt-1">Staff Registered</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">Present Today</p>
          <p className="text-2xl font-extrabold text-foreground">0 / 0</p>
          <p className="text-xs text-muted-foreground font-semibold mt-1">No attendance logged yet</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">Pending Leave Requests</p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">0</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">All Clear</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">Payroll Status</p>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">₹0</p>
          <p className="text-xs text-purple-600 dark:text-purple-300 font-semibold mt-1">Ready for payroll cycle</p>
        </div>
      </div>

      {/* Today's Attendance Overview */}
      <div className="crm-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Calendar size={16} className="text-emerald-500 dark:text-emerald-400" /> Today's Attendance Overview
          </h3>
          <Link href="/attendance" className="text-xs text-indigo-600 dark:text-brand-400 font-semibold hover:underline">
            View All Attendance →
          </Link>
        </div>

        <div className="p-8 text-center text-muted border border-dashed border-border rounded-xl">
          <Calendar size={28} className="mx-auto mb-2 text-muted/60" />
          <p className="font-bold text-sm text-foreground">No employee attendance logged today</p>
          <p className="text-xs text-muted-foreground mt-1">Live camera and punch-in records will appear here.</p>
        </div>
      </div>
    </div>
  );
}
