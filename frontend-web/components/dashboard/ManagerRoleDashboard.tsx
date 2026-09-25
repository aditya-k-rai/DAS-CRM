'use client';

import Link from 'next/link';
import {
  Briefcase, Users, Target, TrendingUp, BarChart3, Shield,
  CheckSquare, ArrowRight, Layers, FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function ManagerRoleDashboard() {
  const { currentUser, subscription } = useAuth();

  return (
    <div className="space-y-6 text-foreground">
      {/* Header Banner */}
      <div className="crm-card p-6 border-l-4 border-l-purple-500 bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="avatar w-12 h-12 text-base font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">Welcome, {currentUser.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded font-extrabold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  DEPARTMENT MANAGER
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Manager Operations Dashboard · {subscription.hasTeamLeaders ? 'Scenario A (With Team Leaders)' : 'Scenario B (Direct Employees)'}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/goals" className="btn-secondary text-xs gap-1.5 flex items-center">
              <TrendingUp size={13} /> Team Targets
            </Link>
            <Link href="/reports" className="btn-primary text-xs gap-1.5 flex items-center">
              <BarChart3 size={13} /> Employee Work Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Manager KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">Department Revenue</p>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-brand-400">₹0</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Starting monthly cycle</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Supervised Employees</p>
          <p className="text-2xl font-extrabold text-foreground">0 Reps</p>
          <p className="text-xs text-muted-foreground mt-1">Ready to assign team</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">Deals Conversion Rate</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">0.0%</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Baseline metric</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">Open Leads Queue</p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">0</p>
          <p className="text-xs text-blue-600 dark:text-blue-300 font-semibold mt-1">No pending unassigned leads</p>
        </div>
      </div>

      {/* Subordinate Performance Overview */}
      <div className="crm-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-foreground">
            {subscription?.hasTeamLeaders ? 'Team Leader Unit Overview (Scenario A)' : 'Employee Performance Overview (Scenario B)'}
          </h3>
          <Link href="/reports" className="text-xs text-indigo-600 dark:text-brand-400 font-semibold hover:underline">
            Generate In-Depth Employee Report →
          </Link>
        </div>

        <div className="p-8 text-center text-muted border border-dashed border-border rounded-xl">
          <Users size={28} className="mx-auto mb-2 text-muted/60" />
          <p className="font-bold text-sm text-foreground">No subordinate staff assigned yet</p>
          <p className="text-xs text-muted-foreground mt-1">Assign team leaders or employees under your department to view performance tracking.</p>
        </div>
      </div>
    </div>
  );
}
