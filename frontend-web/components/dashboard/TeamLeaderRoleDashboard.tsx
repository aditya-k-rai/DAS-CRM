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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="crm-card p-6 border-l-4 border-l-blue-500 bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="avatar w-12 h-12 text-base font-bold bg-blue-500/20 text-blue-300">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Welcome, {currentUser.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  TEAM LEADER
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">Team Unit Workspace · Supervizing Sales Executives</p>
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
          <p className="text-xs text-muted font-medium mb-1">Team Unit Revenue</p>
          <p className="text-2xl font-extrabold text-brand-400">₹14.2L</p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">🥇 #1 Team in Region</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Supervised Reps</p>
          <p className="text-2xl font-extrabold text-white">5 Execs</p>
          <p className="text-xs text-muted mt-1">Rajesh, Priya, Amit, Sunita, Anil</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Unassigned Leads Queue</p>
          <p className="text-2xl font-extrabold text-amber-400">18</p>
          <p className="text-xs text-amber-400 font-semibold mt-1">Pending allocation</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Overdue Tasks Across Team</p>
          <p className="text-2xl font-extrabold text-red-400">3</p>
          <p className="text-xs text-red-400 font-semibold mt-1">Requires follow-up</p>
        </div>
      </div>

      {/* Rep Team Leaderboard */}
      <div className="crm-card">
        <h3 className="font-bold text-base text-white mb-4">Supervised Reps Performance & Lead Distribution</h3>
        <div className="space-y-3">
          {[
            { name: 'Rajesh Kumar', leads: 31, won: 12, rev: '₹5.2L', calls: 84 },
            { name: 'Priya Sharma', leads: 24, won: 8, rev: '₹3.1L', calls: 65 },
            { name: 'Amit Patel', leads: 18, won: 5, rev: '₹2.4L', calls: 52 },
          ].map(rep => (
            <div key={rep.name} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background">
              <div className="flex items-center gap-3">
                <div className="avatar w-8 h-8 text-xs font-bold bg-blue-500/20 text-blue-300">
                  {rep.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{rep.name}</p>
                  <p className="text-xs text-muted">{rep.leads} Leads Assigned · {rep.calls} Calls Made</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-sm text-brand-400">{rep.rev}</p>
                  <p className="text-[11px] text-emerald-400 font-semibold">{rep.won} Won</p>
                </div>
                <Link href="/leads" className="btn-secondary text-xs py-1 px-2.5">
                  Assign Lead →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
