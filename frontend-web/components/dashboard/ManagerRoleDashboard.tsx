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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="crm-card p-6 border-l-4 border-l-purple-500 bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="avatar w-12 h-12 text-base font-bold bg-purple-500/20 text-purple-300">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Welcome, {currentUser.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  DEPARTMENT MANAGER
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">Manager Operations Dashboard · {subscription.hasTeamLeaders ? 'Scenario A (With Team Leaders)' : 'Scenario B (Direct Employees)'}</p>
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
          <p className="text-xs text-muted font-medium mb-1">Department Revenue</p>
          <p className="text-2xl font-extrabold text-brand-400">₹24.8L</p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">82% of Monthly Goal</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Total Supervised Employees</p>
          <p className="text-2xl font-extrabold text-white">14 Reps</p>
          <p className="text-xs text-muted mt-1">{subscription.hasTeamLeaders ? 'Via 3 Team Leaders' : 'Direct Supervision'}</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Deals Conversion Rate</p>
          <p className="text-2xl font-extrabold text-emerald-400">34.8%</p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">↑ +4.2% vs target</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Open Leads Queue</p>
          <p className="text-2xl font-extrabold text-blue-400">142</p>
          <p className="text-xs text-blue-300 font-semibold mt-1">Ready for distribution</p>
        </div>
      </div>

      {/* Subordinate Performance Overview */}
      <div className="crm-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-white">
            {subscription.hasTeamLeaders ? 'Team Leader Unit Overview (Scenario A)' : 'Employee Performance Overview (Scenario B)'}
          </h3>
          <Link href="/reports" className="text-xs text-brand-400 font-semibold hover:underline">
            Generate In-Depth Employee Report →
          </Link>
        </div>

        <div className="space-y-2">
          {[
            { name: 'Amit Shah', role: 'Team Leader', leads: 42, won: 18, rev: '₹9.4L', pct: 85 },
            { name: 'Neha Joshi', role: 'Team Leader', leads: 38, won: 14, rev: '₹7.8L', pct: 78 },
            { name: 'Rajesh Kumar', role: 'Sales Executive', leads: 31, won: 12, rev: '₹5.2L', pct: 74 },
          ].map(row => (
            <div key={row.name} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background">
              <div className="flex items-center gap-3">
                <div className="avatar w-8 h-8 text-xs font-bold bg-purple-500/20 text-purple-300">
                  {row.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{row.name}</p>
                  <p className="text-xs text-muted">{row.role} · {row.leads} Leads Handled</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-bold text-sm text-brand-400">{row.rev}</p>
                  <p className="text-[11px] text-emerald-400 font-semibold">{row.won} Deals Won</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded font-bold bg-emerald-500/15 text-emerald-400">
                  {row.pct}% Goal
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
