'use client';

import Link from 'next/link';
import {
  Shield, Users, Target, CheckSquare, TrendingUp, Phone, Mail,
  ArrowRight, Plus, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function TeamLeaderRoleDashboard() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 text-foreground">
      {/* Header Banner */}
      <div className="crm-card p-6 border-l-4 border-l-blue-500 bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="avatar w-12 h-12 text-base font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">Welcome, {currentUser.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded font-extrabold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  TEAM LEADER
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Team Unit Workspace · Supervizing Sales Executives</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/leads" className="btn-secondary text-xs gap-1.5 flex items-center">
              <Target size={13} /> Distribute Leads
            </Link>
            <Link href="/goals" className="btn-primary text-xs gap-1.5 flex items-center">
              <TrendingUp size={13} /> Unit Goals
            </Link>
          </div>
        </div>
      </div>

      {/* TL KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">Team Unit Revenue</p>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-brand-400">₹0</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Starting monthly cycle</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">Supervised Reps</p>
          <p className="text-2xl font-extrabold text-foreground">0 Execs</p>
          <p className="text-xs text-muted-foreground mt-1">Ready to assign team</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">Unassigned Leads Queue</p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">0</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">Queue clear</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">Overdue Tasks Across Team</p>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-red-400">0</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">All up to date</p>
        </div>
      </div>

      {/* Rep Team Leaderboard */}
      <div className="crm-card">
        <h3 className="font-bold text-base text-foreground mb-4">Supervised Reps Performance & Lead Distribution</h3>
        <div className="p-8 text-center text-muted border border-dashed border-border rounded-xl">
          <Users size={28} className="mx-auto mb-2 text-muted/60" />
          <p className="font-bold text-sm text-foreground">No sales executives assigned yet</p>
          <p className="text-xs text-muted-foreground mt-1">When sales representatives are assigned to your team leader unit, their live deals and calls will appear here.</p>
        </div>
      </div>
    </div>
  );
}
