'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, Zap, DollarSign, TrendingUp, Users, Target, Building2, Briefcase,
  CheckSquare, Layers, Lock, ArrowRight, Plus, Database, ClipboardList,
  PhoneCall, Play, Download, Clock, CheckCircle2, AlertCircle, Settings,
  Radio, Sliders, Eye, EyeOff, Bot, MessageSquare, Mail, RefreshCw, Activity,
  UserCheck, UserX, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';

export function TenantAdminDashboard() {
  const { currentUser, subscription } = useAuth();

  // Widget 1: Ingestion & Routing State
  const [routingStrategy, setRoutingStrategy] = useState<'BATCH_QUOTA' | 'VANISH_POOL' | 'MANUAL'>('BATCH_QUOTA');
  const [batchQuotaLimit, setBatchQuotaLimit] = useState(25);
  const [vanishTimeoutMins, setVanishTimeoutMins] = useState(30);

  // Widget 2: Hierarchy State
  const [selectedUserLock, setSelectedUserLock] = useState<Record<string, boolean>>({
    'usr_rep1': false,
    'usr_rep2': true,
  });

  // Widget 3: Role Permission Policy State
  const [selectedPolicyRole, setSelectedPolicyRole] = useState<'HR' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC'>('MANAGER');
  const [permissionToggles, setPermissionToggles] = useState({
    viewCallCounts: true,
    viewCallDurations: true,
    viewRevenueFigures: true,
    viewCustomerPII: false,
    delegateManagerConfig: true,
  });

  // Widget 4: AI & Channels State
  const [pathMode, setPathMode] = useState<'PAID_AI' | 'MANUAL_DIALER'>('PAID_AI');
  const [whatsAppConnected, setWhatsAppConnected] = useState(true);
  const [emailCampaignDelegated, setEmailCampaignDelegated] = useState(true);

  // Widget 5: Master Pipeline Filter State
  const [pipelineFilterRole, setPipelineFilterRole] = useState<'ALL' | 'MANAGER' | 'TEAM_LEADER' | 'EMPLOYEE'>('ALL');

  // Widget 6: Telemetry Filter / Export
  const [telemetryExporting, setTelemetryExporting] = useState(false);

  const toggleUserLock = (usrId: string) => {
    setSelectedUserLock(prev => ({ ...prev, [usrId]: !prev[usrId] }));
  };

  const handleExportCSV = () => {
    setTelemetryExporting(true);
    setTimeout(() => {
      setTelemetryExporting(false);
      alert('Workforce Telemetry & Call Audit Log exported to CSV successfully!');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* HEADER BANNER & TRIAL BADGE                                  */}
      {/* ============================================================ */}
      <div className="crm-card p-6 border-l-4 border-l-indigo-500 bg-card relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="avatar w-12 h-12 text-base font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-white tracking-tight">TENANT ADMIN COMMAND CENTER</h1>
                <span className="text-[11px] px-3 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  ⏱️ {subscription.trialDaysLeft ?? 14} Days Remaining in Free Trial
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5 font-medium">
                {subscription.companyName} · Executive Operating System & Multi-Tenant Control Hub
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/team-leaders" className="btn-secondary text-xs gap-1.5 flex items-center font-bold">
              <Shield size={14} className="text-indigo-400" /> Structure Builder
            </Link>
            <Link href="/admin/workflow" className="btn-primary text-xs gap-1.5 flex items-center font-bold" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <Zap size={14} /> Workflow Rules
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TOP KPI METRICS BAR (6 COLUMNS)                               */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="crm-card p-4 border border-border/70 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-semibold mb-1">
            <span>Revenue (Won)</span>
            <DollarSign size={14} className="text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-400">$128,400</p>
          <p className="text-[10px] text-emerald-400/80 font-bold mt-1">↑ +14.2% closed</p>
        </div>

        <div className="crm-card p-4 border border-border/70 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-semibold mb-1">
            <span>Active Pipeline</span>
            <TrendingUp size={14} className="text-indigo-400" />
          </div>
          <p className="text-xl font-extrabold text-white">$412,000</p>
          <p className="text-[10px] text-indigo-400 font-bold mt-1">42 Open Deals</p>
        </div>

        <div className="crm-card p-4 border border-border/70 hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-semibold mb-1">
            <span>Total Leads</span>
            <Target size={14} className="text-blue-400" />
          </div>
          <p className="text-xl font-extrabold text-blue-300">3,420</p>
          <p className="text-[10px] text-blue-400 font-bold mt-1">Ingested Multi-Source</p>
        </div>

        <div className="crm-card p-4 border border-border/70 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-semibold mb-1">
            <span>Conversion Rate</span>
            <Activity size={14} className="text-purple-400" />
          </div>
          <p className="text-xl font-extrabold text-purple-300">14.2%</p>
          <p className="text-[10px] text-purple-400 font-bold mt-1">Target: 15.0%</p>
        </div>

        <div className="crm-card p-4 border border-border/70 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-semibold mb-1">
            <span>Active Seats</span>
            <Users size={14} className="text-amber-400" />
          </div>
          <p className="text-xl font-extrabold text-amber-300">18 / 20</p>
          <p className="text-[10px] text-amber-400 font-bold mt-1">2 Seats Available</p>
        </div>

        <div className="crm-card p-4 border border-border/70 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-semibold mb-1">
            <span>System Status</span>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <p className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">TRIAL_ACTIVE</p>
          <p className="text-[10px] text-muted font-semibold mt-1">Full Tier Enabled</p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2X3 MAIN WIDGETS GRID                                         */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ------------------------------------------------------------ */}
        {/* WIDGET 1: LEAD INGESTION & ROUTING CONTROL                    */}
        {/* ------------------------------------------------------------ */}
        <div className="crm-card space-y-4 border border-indigo-500/30">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                W1
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">WIDGET 1: LEAD INGESTION & ROUTING CONTROL</h3>
                <p className="text-[11px] text-muted">Multi-Source Ingestion & Automated Distribution Strategy</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              ACTIVE
            </span>
          </div>

          {/* Active Sources Chips */}
          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
              Active Connected Ingestion Sources
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Facebook Ads', count: '1,240', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                { name: 'Instagram', count: '890', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
                { name: 'Google Ads', count: '650', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
                { name: 'WhatsApp Web', count: '410', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                { name: 'Website Form', count: '230', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
              ].map(s => (
                <span key={s.name} className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 ${s.color}`}>
                  <span>{s.name}</span>
                  <span className="font-extrabold text-[10px] bg-background/50 px-1.5 py-0.2 rounded">{s.count}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Strategy Selector */}
          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
              Routing Distribution Strategy
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'BATCH_QUOTA', label: 'Batch Quota', desc: 'Quota allotments per rep' },
                { key: 'VANISH_POOL', label: 'Vanish Pool', desc: 'Timeout claim pool' },
                { key: 'MANUAL', label: 'Manual Assignment', desc: 'TL/Manager manual' },
              ].map(st => (
                <button
                  key={st.key}
                  onClick={() => setRoutingStrategy(st.key as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${routingStrategy === st.key ? 'bg-indigo-500/25 border-indigo-500 text-white shadow-md' : 'bg-background border-border text-muted hover:text-white'}`}
                >
                  <p className="font-bold text-xs">{st.label}</p>
                  <p className="text-[10px] text-muted leading-tight mt-0.5">{st.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Parameters Form */}
          <div className="p-3 rounded-xl bg-background border border-border space-y-3 text-xs">
            {routingStrategy === 'BATCH_QUOTA' && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-white">Daily Batch Quota per Representative</p>
                  <p className="text-[11px] text-muted">Automatically pauses distribution when limit is reached</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={batchQuotaLimit}
                    onChange={e => setBatchQuotaLimit(Number(e.target.value))}
                    className="crm-input w-20 text-center font-bold text-sm h-8"
                  />
                  <span className="text-muted font-bold">Leads/Day</span>
                </div>
              </div>
            )}

            {routingStrategy === 'VANISH_POOL' && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-white">Vanish Timeout Window</p>
                  <p className="text-[11px] text-muted">Unclaimed leads return to shared pool after timeout</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={vanishTimeoutMins}
                    onChange={e => setVanishTimeoutMins(Number(e.target.value))}
                    className="crm-input w-20 text-center font-bold text-sm h-8"
                  />
                  <span className="text-muted font-bold">Minutes</span>
                </div>
              </div>
            )}

            {routingStrategy === 'MANUAL' && (
              <p className="text-muted text-[11px]">
                ℹ️ Manual Routing Mode enabled: Leads accumulate in unassigned queue until assigned by Team Leaders or Managers.
              </p>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* WIDGET 2: ORGANIZATIONAL HIERARCHY BUILDER                    */}
        {/* ------------------------------------------------------------ */}
        <div className="crm-card space-y-4 border border-purple-500/30">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                W2
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">WIDGET 2: ORGANIZATIONAL HIERARCHY BUILDER</h3>
                <p className="text-[11px] text-muted">Map Reps under Team Leaders & Override Account Restrictions</p>
              </div>
            </div>
            <Link href="/admin/team-leaders" className="text-[11px] font-bold text-purple-300 hover:underline flex items-center gap-1">
              Structure Setup <ArrowUpRight size={12} />
            </Link>
          </div>

          {/* Employee Mapping Directory Sample */}
          <div className="space-y-2">
            {[
              { id: 'usr_tl1', name: 'Amit Shah', role: 'TEAM_LEADER', team: 'West Zone Sales', repsCount: 4, manager: 'Rajesh Mehta' },
              { id: 'usr_rep1', name: 'Rajesh Kumar', role: 'SALES_EXEC', team: 'West Zone Sales', repsCount: 0, manager: 'Amit Shah (TL)' },
              { id: 'usr_rep2', name: 'Priya Sharma', role: 'SALES_EXEC', team: 'North Zone Sales', repsCount: 0, manager: 'Vikram Singh (Admin)' },
            ].map(emp => (
              <div key={emp.id} className="p-3 rounded-xl border border-border bg-background flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="avatar w-8 h-8 text-xs font-bold bg-purple-500/20 text-purple-300">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-white">{emp.name}</p>
                    <p className="text-[10px] text-muted">{emp.role} · Reports to: <strong className="text-purple-300">{emp.manager}</strong></p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleUserLock(emp.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 ${selectedUserLock[emp.id] ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'}`}
                  >
                    {selectedUserLock[emp.id] ? <UserX size={12} /> : <UserCheck size={12} />}
                    <span>{selectedUserLock[emp.id] ? 'LOCKED' : 'ACTIVE'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-center justify-between">
            <span>🔒 Admin Override Controls: Lock or restrict individual employee accounts instantly</span>
            <Link href="/admin/team-leaders" className="btn-secondary text-[11px] py-1 px-2.5 font-bold">
              Manage All Users
            </Link>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* WIDGET 3: ROLE PERMISSION POLICY CONFIGURATOR               */}
        {/* ------------------------------------------------------------ */}
        <div className="crm-card space-y-4 border border-blue-500/30">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">
                W3
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">WIDGET 3: ROLE PERMISSION POLICY CONFIGURATOR</h3>
                <p className="text-[11px] text-muted">Configure Visibility Rules & Delegate Management Rights</p>
              </div>
            </div>
            <Sliders size={15} className="text-blue-400" />
          </div>

          {/* Role Selector Tabs */}
          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
              Select Role Policy to Configure
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedPolicyRole(r)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${selectedPolicyRole === r ? 'bg-blue-500/25 border-blue-500 text-blue-300' : 'bg-background border-border text-muted hover:text-white'}`}
                >
                  {r === 'SALES_EXEC' ? 'EMPLOYEE' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Permission Toggles List */}
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl border border-border bg-background flex items-center justify-between">
              <div>
                <p className="font-bold text-white">View Call Counts & Telemetry</p>
                <p className="text-[10px] text-muted">Allows {selectedPolicyRole} to view outbound call stats</p>
              </div>
              <input
                type="checkbox"
                checked={permissionToggles.viewCallCounts}
                onChange={e => setPermissionToggles(prev => ({ ...prev, viewCallCounts: e.target.checked }))}
                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="p-2.5 rounded-xl border border-border bg-background flex items-center justify-between">
              <div>
                <p className="font-bold text-white">View Call Duration Logs</p>
                <p className="text-[10px] text-muted">Exposes total talk time telemetry in reports</p>
              </div>
              <input
                type="checkbox"
                checked={permissionToggles.viewCallDurations}
                onChange={e => setPermissionToggles(prev => ({ ...prev, viewCallDurations: e.target.checked }))}
                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="p-2.5 rounded-xl border border-border bg-background flex items-center justify-between">
              <div>
                <p className="font-bold text-white">View Revenue & Financial Figures</p>
                <p className="text-[10px] text-muted">Displays deal monetary values and forecast totals</p>
              </div>
              <input
                type="checkbox"
                checked={permissionToggles.viewRevenueFigures}
                onChange={e => setPermissionToggles(prev => ({ ...prev, viewRevenueFigures: e.target.checked }))}
                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="p-2.5 rounded-xl border border-border bg-background flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Delegate Configuration Rights to Managers</p>
                <p className="text-[10px] text-muted">Allows Department Managers to alter sub-team permissions</p>
              </div>
              <input
                type="checkbox"
                checked={permissionToggles.delegateManagerConfig}
                onChange={e => setPermissionToggles(prev => ({ ...prev, delegateManagerConfig: e.target.checked }))}
                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* WIDGET 4: AI, WHATSAPP & EMAIL MARKETING MODULES             */}
        {/* ------------------------------------------------------------ */}
        <div className="crm-card space-y-4 border border-emerald-500/30">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                W4
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">WIDGET 4: AI, WHATSAPP & EMAIL MARKETING MODULES</h3>
                <p className="text-[11px] text-muted">Configure Communication Gateways & AI Path Mode</p>
              </div>
            </div>
            <Bot size={16} className="text-emerald-400" />
          </div>

          {/* Path Mode Toggle */}
          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
              Operation Path Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPathMode('PAID_AI')}
                className={`p-3 rounded-xl border text-left transition-all ${pathMode === 'PAID_AI' ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md' : 'bg-background border-border text-muted hover:text-white'}`}
              >
                <p className="font-bold text-xs flex items-center gap-1.5">
                  <Bot size={14} className="text-emerald-400" /> Paid AI & Automations
                </p>
                <p className="text-[10px] text-muted mt-0.5">Automated AI Lead Scoring & Webhook Triggers</p>
              </button>

              <button
                onClick={() => setPathMode('MANUAL_DIALER')}
                className={`p-3 rounded-xl border text-left transition-all ${pathMode === 'MANUAL_DIALER' ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md' : 'bg-background border-border text-muted hover:text-white'}`}
              >
                <p className="font-bold text-xs flex items-center gap-1.5">
                  <PhoneCall size={14} className="text-indigo-400" /> Manual Dialer
                </p>
                <p className="text-[10px] text-muted mt-0.5">Standard Telephony & Manual Rep Calling</p>
              </button>
            </div>
          </div>

          {/* WhatsApp Co-Existence Gateway */}
          <div className="p-3 rounded-xl bg-background border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-emerald-400" />
                <div>
                  <p className="font-bold text-white">WhatsApp Co-Existence Gateway</p>
                  <p className="text-[10px] text-muted">Simultaneous Official API + Web Session Status</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${whatsAppConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'}`}>
                {whatsAppConnected ? 'ONLINE · CONNECTED' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Email Campaign Delegation */}
          <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-purple-400" />
              <div>
                <p className="font-bold text-white">Delegate Email Campaigns to Managers</p>
                <p className="text-[10px] text-muted">Allows department managers to broadcast email campaigns</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailCampaignDelegated}
              onChange={e => setEmailCampaignDelegated(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* WIDGET 5: MASTER SALES PIPELINE & DEAL FUNNEL               */}
        {/* ------------------------------------------------------------ */}
        <div className="crm-card space-y-4 border border-amber-500/30 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-border flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                W5
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">WIDGET 5: MASTER SALES PIPELINE & DEAL FUNNEL</h3>
                <p className="text-[11px] text-muted">Cross-Departmental Deal Stages, Velocity & Deal ROT Indicators</p>
              </div>
            </div>

            {/* Filter Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted font-semibold">Filter View:</span>
              {(['ALL', 'MANAGER', 'TEAM_LEADER', 'EMPLOYEE'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setPipelineFilterRole(f)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${pipelineFilterRole === f ? 'bg-amber-500/25 border-amber-500 text-amber-300' : 'bg-background border-border text-muted hover:text-white'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Kanban Mini Stage Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { stage: 'Prospecting', count: 14, val: '$95,000', rotCount: 2, color: 'border-t-blue-500' },
              { stage: 'Qualification', count: 12, val: '$140,000', rotCount: 1, color: 'border-t-purple-500' },
              { stage: 'Proposal', count: 10, val: '$110,000', rotCount: 3, color: 'border-t-amber-500' },
              { stage: 'Negotiation', count: 6, val: '$67,000', rotCount: 0, color: 'border-t-emerald-500' },
            ].map(col => (
              <div key={col.stage} className={`p-3 rounded-xl border border-border bg-background border-t-4 ${col.color} space-y-2`}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-white">{col.stage}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-extrabold bg-muted/20 text-muted">
                    {col.count} Deals
                  </span>
                </div>

                <p className="text-lg font-extrabold text-white">{col.val}</p>

                {col.rotCount > 0 ? (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                    <AlertTriangle size={11} /> {col.rotCount} Deals Stagnant (&gt;14d ROT)
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                    <CheckCircle2 size={11} /> Healthy Velocity
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border/50">
            <span>💡 Drag-and-drop deals across department stages to update status and calculate revenue velocity.</span>
            <Link href="/deals" className="text-amber-400 font-bold hover:underline flex items-center gap-1">
              Open Full Master Pipeline →
            </Link>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* WIDGET 6: WORKFORCE TELEMETRY & CALL AUDIT STREAM            */}
        {/* ------------------------------------------------------------ */}
        <div className="crm-card space-y-4 border border-rose-500/30 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-border flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs">
                W6
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">WIDGET 6: WORKFORCE TELEMETRY & CALL AUDIT STREAM</h3>
                <p className="text-[11px] text-muted">Real-Time Call Duration, Telemetry Logs & Export to CSV/Excel</p>
              </div>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={telemetryExporting}
              className="btn-secondary text-xs font-bold gap-1.5 flex items-center bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25"
            >
              <Download size={13} /> {telemetryExporting ? 'Exporting Report...' : 'Export Work Reports (CSV)'}
            </button>
          </div>

          {/* Live Call Telemetry Stream Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted uppercase text-[10px] tracking-wider">
                  <th className="pb-2">Caller / Rep</th>
                  <th className="pb-2">Customer Contact</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Disposition</th>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2 text-right">Audit Audio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {[
                  { rep: 'Rajesh Kumar (Rep)', contact: 'TechCorp Ltd (John)', dur: '12m 45s', status: 'POSITIVE', time: '10 mins ago' },
                  { rep: 'Priya Sharma (Rep)', contact: 'Sunita Real Estate', dur: '04m 12s', status: 'NEUTRAL', time: '22 mins ago' },
                  { rep: 'Amit Shah (TL)', contact: 'Lakshmi Automobiles', dur: '18m 30s', status: 'CLOSED_WON', time: '45 mins ago' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-background/50">
                    <td className="py-2.5 font-bold text-white">{row.rep}</td>
                    <td className="py-2.5 text-muted">{row.contact}</td>
                    <td className="py-2.5 font-mono text-indigo-300 font-semibold">{row.dur}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${row.status === 'CLOSED_WON' ? 'bg-emerald-500/20 text-emerald-300' : row.status === 'POSITIVE' ? 'bg-blue-500/20 text-blue-300' : 'bg-muted/20 text-muted'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted text-[11px]">{row.time}</td>
                    <td className="py-2.5 text-right">
                      <button className="text-[11px] text-rose-400 hover:underline flex items-center gap-1 ml-auto font-bold">
                        <Play size={11} /> Play Recording
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
