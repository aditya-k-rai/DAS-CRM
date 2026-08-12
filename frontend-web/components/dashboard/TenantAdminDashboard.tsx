'use client';

import Link from 'next/link';
import {
  Building2, Users, Target, Shield, Zap, DollarSign, TrendingUp,
  BarChart3, CheckSquare, Layers, Lock, ArrowRight, Plus, Database, ClipboardList
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function TenantAdminDashboard() {
  const { currentUser, subscription } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="crm-card p-6 border-l-4 border-l-indigo-500 bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="avatar w-12 h-12 text-base font-bold bg-indigo-500/20 text-indigo-300">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Welcome, {currentUser.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  TENANT ADMIN
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">Company Executive Control Panel · {subscription.companyName}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/admin/team-leaders" className="btn-secondary text-xs gap-1.5 flex items-center">
              <Shield size={13} /> Team Structure
            </Link>
            <Link href="/admin/workflow" className="btn-primary text-xs gap-1.5 flex items-center">
              <Zap size={13} /> Setup Workflows
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Total Organization Revenue</p>
          <p className="text-2xl font-extrabold text-brand-400">₹48.2L</p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">↑ +12.5% vs last month</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Active Leads Pipeline</p>
          <p className="text-2xl font-extrabold text-white">2,847</p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">↑ +8.3% new leads</p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">User Seats Allocated</p>
          <p className="text-2xl font-extrabold text-purple-400">
            {subscription.userSeatsUsed} / {subscription.userSeatsAllocated}
          </p>
          <p className={`text-xs font-semibold mt-1 ${subscription.userSeatsUsed > subscription.userSeatsAllocated ? 'text-red-400' : 'text-muted'}`}>
            {subscription.userSeatsUsed > subscription.userSeatsAllocated ? '⚠️ Limit Exceeded' : 'Seats On Plan'}
          </p>
        </div>
        <div className="crm-card">
          <p className="text-xs text-muted font-medium mb-1">Organization Structure</p>
          <p className="text-2xl font-extrabold text-emerald-400">
            {subscription.hasTeamLeaders ? 'Scenario A' : 'Scenario B'}
          </p>
          <p className="text-xs text-muted mt-1">
            {subscription.hasTeamLeaders ? 'With Team Leaders' : 'Without Team Leaders'}
          </p>
        </div>
      </div>

      {/* Quick Admin Actions & Setup shortcuts */}
      <div className="crm-card">
        <h3 className="font-bold text-base text-white mb-4">Tenant Admin Quick Controls</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/admin/team-leaders" className="p-4 rounded-xl border border-border bg-background hover:border-brand/40 transition-all group">
            <Shield size={20} className="text-indigo-400 mb-2" />
            <p className="font-bold text-sm text-white group-hover:text-brand-400">Managers & TLs</p>
            <p className="text-[11px] text-muted mt-0.5">Manage department leaders</p>
          </Link>
          <Link href="/admin/workflow" className="p-4 rounded-xl border border-border bg-background hover:border-brand/40 transition-all group">
            <Zap size={20} className="text-purple-400 mb-2" />
            <p className="font-bold text-sm text-white group-hover:text-brand-400">Workflow Setup</p>
            <p className="text-[11px] text-muted mt-0.5">Configure statuses & stages</p>
          </Link>
          <Link href="/admin/custom-fields" className="p-4 rounded-xl border border-border bg-background hover:border-brand/40 transition-all group">
            <ClipboardList size={20} className="text-blue-400 mb-2" />
            <p className="font-bold text-sm text-white group-hover:text-brand-400">Custom Fields</p>
            <p className="text-[11px] text-muted mt-0.5">Add dynamic form attributes</p>
          </Link>
          <Link href="/automations" className="p-4 rounded-xl border border-border bg-background hover:border-brand/40 transition-all group">
            <Zap size={20} className="text-amber-400 mb-2" />
            <p className="font-bold text-sm text-white group-hover:text-brand-400">Automations Engine</p>
            <p className="text-[11px] text-muted mt-0.5">Build trigger-action rules</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
