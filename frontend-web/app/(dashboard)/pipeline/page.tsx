'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { Topbar } from '@/components/layout/Topbar';
import { DealsKanban } from '@/components/deals/DealsKanban';
import {
  Shield, Zap, DollarSign, TrendingUp, Users, Target, Building2, Briefcase,
  CheckSquare, Layers, Lock, ArrowRight, Plus, Database, ClipboardList,
  PhoneCall, Play, Download, Clock, CheckCircle2, AlertCircle, Settings,
  Radio, Sliders, Eye, EyeOff, Bot, MessageSquare, Mail, RefreshCw, Activity,
  UserCheck, UserX, AlertTriangle, ArrowUpRight, Upload, FileSpreadsheet, Search, X, GitBranch
} from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';

interface DashboardLeadRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  stage: string;
  value: number;
  assignedRep: string;
  customFields: Record<string, string>;
  createdAt: string;
}

function sanitizeCellString(input: any, fallback: string = '—'): string {
  if (input === null || input === undefined) return fallback;
  const str = String(input).trim();
  if (str === 'Unknown') return 'Unknown';
  if (!str) return fallback;
  const cleaned = str.replace(/[^\x20-\x7E\u00C0-\u024F\u0900-\u097F\u4E00-\u9FFF]/g, '').trim();
  if (!cleaned || (/[^\w\s@\.\+\-\(\),&]/.test(cleaned) && cleaned.length > 20)) {
    return fallback;
  }
  return cleaned;
}

export default function LeadPipelinePage() {
  const { currentUser } = useAuth();

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

  // Ingestion Modal States
  const [insertLeadModalOpen, setInsertLeadModalOpen] = useState(false);
  const [importCsvModalOpen, setImportCsvModalOpen] = useState(false);
  const [googleSheetsModalOpen, setGoogleSheetsModalOpen] = useState(false);
  const [customColumnModalOpen, setCustomColumnModalOpen] = useState(false);
  const [importSuccessModalOpen, setImportSuccessModalOpen] = useState(false);

  // Single Insert Form
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('Website Form');
  const [newLeadValue, setNewLeadValue] = useState('45000');
  const [newLeadAssignedRep, setNewLeadAssignedRep] = useState('Rajesh Kumar');

  // Custom Column Form
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<'TEXT' | 'NUMBER' | 'SELECT'>('TEXT');

  // Dynamic Custom Columns Array
  const [customColumns, setCustomColumns] = useState<Array<{ id: string; name: string; type: string }>>([
    { id: 'col_city', name: 'City', type: 'TEXT' },
    { id: 'col_budget', name: 'Budget', type: 'TEXT' },
    { id: 'col_requirement', name: 'Requirement', type: 'TEXT' },
  ]);

  // Master Lead Directory List
  const [leadDirectory, setLeadDirectory] = useState<DashboardLeadRecord[]>([
    {
      id: 'lead_101',
      name: 'Aditya Sharma',
      email: 'aditya.s@techcorp.in',
      phone: '+91 98765 43210',
      company: 'TechCorp India',
      source: 'Facebook Ads',
      stage: 'Prospecting',
      value: 45000,
      assignedRep: 'Rajesh Kumar',
      customFields: { col_city: 'Mumbai', col_budget: '50k-1L', col_requirement: 'CRM Enterprise License' },
      createdAt: 'Today, 02:45 PM',
    },
    {
      id: 'lead_102',
      name: 'Priya Patel',
      email: 'priya.p@innovate.io',
      phone: '+91 98123 76543',
      company: 'Innovate Solutions',
      source: 'Google Ads',
      stage: 'Proposal',
      value: 120000,
      assignedRep: 'Priya Sharma',
      customFields: { col_city: 'Bangalore', col_budget: '1L-2L', col_requirement: 'Call Automation Suite' },
      createdAt: 'Today, 01:15 PM',
    },
    {
      id: 'lead_103',
      name: 'Vikram Malhotra',
      email: 'vikram.m@apexind.com',
      phone: '+91 99887 11223',
      company: 'Apex Global',
      source: 'WhatsApp',
      stage: 'Negotiation',
      value: 85000,
      assignedRep: 'Amit Shah (TL)',
      customFields: { col_city: 'Delhi', col_budget: '80k-1L', col_requirement: 'Multi-Tenant Setup' },
      createdAt: 'Yesterday, 05:20 PM',
    },
    {
      id: 'lead_104',
      name: 'Neha Joshi',
      email: 'neha.j@logitech.org',
      phone: '+91 97654 32109',
      company: 'LogiTech Systems',
      source: 'Google Sheets',
      stage: 'Qualification',
      value: 65000,
      assignedRep: 'Meera Kapoor',
      customFields: { col_city: 'Pune', col_budget: '50k-80k', col_requirement: 'Attendance Tracker' },
      createdAt: 'Yesterday, 11:00 AM',
    },
  ]);

  const [leadSearchQuery, setLeadSearchQuery] = useState('');

  // Handle Single Lead Insertion
  const handleInsertSingleLead = () => {
    if (!newLeadName.trim() || !newLeadPhone.trim()) {
      alert('Please enter Lead Name and Phone Number');
      return;
    }
    const created: DashboardLeadRecord = {
      id: `lead_${Date.now()}`,
      name: newLeadName.trim(),
      email: newLeadEmail.trim() || '—',
      phone: newLeadPhone.trim(),
      company: newLeadCompany.trim() || 'Individual Lead',
      source: newLeadSource,
      stage: 'Prospecting',
      value: parseFloat(newLeadValue) || 0,
      assignedRep: newLeadAssignedRep,
      customFields: {},
      createdAt: 'Just now',
    };
    setLeadDirectory(prev => [created, ...prev]);
    setInsertLeadModalOpen(false);
    setNewLeadName(''); setNewLeadEmail(''); setNewLeadPhone(''); setNewLeadCompany('');
  };

  // Handle Custom Column Addition
  const handleAddCustomColumn = () => {
    if (!newColName.trim()) return;
    const colId = `col_${newColName.toLowerCase().replace(/\s+/g, '_')}`;
    setCustomColumns(prev => [...prev, { id: colId, name: newColName.trim(), type: newColType }]);
    setCustomColumnModalOpen(false);
    setNewColName('');
  };

  const filteredLeadDirectory = leadDirectory.filter(lead => {
    if (!leadSearchQuery.trim()) return true;
    const q = leadSearchQuery.toLowerCase();
    return lead.name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.phone.toLowerCase().includes(q) ||
      lead.company.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Lead Pipeline & Ingestion Control Center"
        actions={
          <button
            onClick={() => setInsertLeadModalOpen(true)}
            className="btn-primary text-xs gap-1.5 px-3 py-2"
          >
            <Plus size={14} /> Insert Lead
          </button>
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto space-y-6 animate-fade-in">

        {/* ============================================================ */}
        {/* ⚡ LEAD INTEGRATION & INGESTION CONTROL CENTER               */}
        {/* ============================================================ */}
        <div className="crm-card p-6 border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 space-y-6 rounded-2xl shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ⚡ INTEGRATION & DATA HUB
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  5 ACTIVE CHANNELS
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1 flex items-center gap-2">
                <Database size={20} className="text-indigo-400" /> Lead Integration & Ingestion Control Center
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Integrate Webhooks, Insert Single Lead, Import/Export CSV, Configure Custom Columns & Adjust Lead Table Views
              </p>
            </div>

            {/* Toolbar Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setInsertLeadModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-brand hover:from-indigo-500 hover:to-brand-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
              >
                <Plus size={14} /> + Insert Lead
              </button>
              <button
                onClick={() => setImportCsvModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Upload size={14} className="text-indigo-400" /> Import CSV / Excel
              </button>
              <button
                onClick={() => setGoogleSheetsModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <FileSpreadsheet size={14} /> Google Sheets Sync
              </button>
              <button
                onClick={() => setCustomColumnModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Sliders size={14} /> + Custom Column
              </button>
            </div>
          </div>

          {/* Connected Ingestion Channel Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { title: 'Google Sheets', count: '1890 Syncing', status: 'Live Range A2:F', tag: 'FAST BLINK', bg: 'border-emerald-500/30 bg-emerald-500/5', color: 'text-emerald-400' },
              { title: 'Facebook Ads', count: '1,240 Ingested', status: 'Active Hook', tag: 'SLOW', bg: 'border-indigo-500/30 bg-indigo-500/5', color: 'text-indigo-400' },
              { title: 'WhatsApp Web', count: '410 Ingested', status: 'Connected', tag: 'SLOW', bg: 'border-emerald-500/30 bg-emerald-500/5', color: 'text-emerald-400' },
              { title: 'Google Ads', count: '650 Ingested', status: 'Auto-Sync', tag: 'SLOW', bg: 'border-amber-500/30 bg-amber-500/5', color: 'text-amber-400' },
              { title: 'Website Form', count: '230 Ingested', status: 'Webhook Live', tag: 'OFFLINE', bg: 'border-purple-500/30 bg-purple-500/5', color: 'text-purple-400' },
              { title: 'Zapier API', count: '890 Ingested', status: 'Key Active', tag: 'OFFLINE', bg: 'border-slate-800 bg-slate-900/60', color: 'text-slate-400' },
            ].map(ch => (
              <div key={ch.title} className={`p-3 rounded-xl border ${ch.bg} space-y-1`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white truncate">{ch.title}</p>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className={`text-sm font-extrabold ${ch.color}`}>{ch.count}</p>
                <p className="text-[10px] text-muted">{ch.status}</p>
              </div>
            ))}
          </div>

          {/* Directory Table with Search & Columns */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database size={15} className="text-indigo-400" />
                Live Adjustable Lead Directory ({filteredLeadDirectory.length} Leads)
              </h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={leadSearchQuery}
                  onChange={e => setLeadSearchQuery(e.target.value)}
                  placeholder="Search leads, emails, or phone..."
                  className="crm-input pl-9 w-full sm:w-64 text-xs h-8"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-muted uppercase font-bold text-[10px] border-b border-border">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Company</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3">Value</th>
                    <th className="p-3">Assigned Rep</th>
                    {customColumns.map(col => (
                      <th key={col.id} className="p-3 text-indigo-400">{col.name} (Custom)</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredLeadDirectory.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-white">{lead.name}</td>
                      <td className="p-3 text-muted">{lead.email}</td>
                      <td className="p-3 text-emerald-400 font-mono font-medium">{lead.phone}</td>
                      <td className="p-3 text-slate-300">{lead.company}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                          {lead.source}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {lead.stage}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white">₹{lead.value.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-slate-300 font-semibold">{lead.assignedRep}</td>
                      {customColumns.map(col => (
                        <td key={col.id} className="p-3 text-indigo-300 font-medium">
                          {lead.customFields[col.id] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2X3 MAIN CONTROL WIDGETS (WIDGETS 1, 2, 3)                   */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

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
                  <p className="text-[11px] text-muted">Multi Source Ingestion & Automated Distribution Strategy</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">ACTIVE</span>
            </div>

            {/* Strategy Selectors */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300">Routing Distribution Strategy</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'BATCH_QUOTA', label: 'Batch Quota', sub: 'Quota allotments per rep' },
                  { id: 'VANISH_POOL', label: 'Vanish Pool', sub: 'Timeout claim pool' },
                  { id: 'MANUAL', label: 'Manual Assignment', sub: 'TL/Manager manual' },
                ].map(strat => (
                  <button
                    key={strat.id}
                    onClick={() => setRoutingStrategy(strat.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      routingStrategy === strat.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold text-xs">{strat.label}</p>
                    <p className="text-[9px] text-muted leading-tight mt-0.5">{strat.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Batch Quota Limit / Rep</p>
                  <p className="text-[10px] text-muted">Max leads auto-assigned per 24h window</p>
                </div>
                <input
                  type="number"
                  value={batchQuotaLimit}
                  onChange={e => setBatchQuotaLimit(parseInt(e.target.value) || 10)}
                  className="crm-input w-20 text-center text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Vanish Timeout Window</p>
                  <p className="text-[10px] text-muted">Uncontacted lead re-pool timer</p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={vanishTimeoutMins}
                    onChange={e => setVanishTimeoutMins(parseInt(e.target.value) || 15)}
                    className="crm-input w-16 text-center text-xs font-bold"
                  />
                  <span className="text-xs text-muted font-bold">mins</span>
                </div>
              </div>
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
              <Users size={16} className="text-purple-400" />
            </div>

            <div className="space-y-2">
              {[
                { id: 'usr_rep1', name: 'Amit Shah', role: 'TEAM_LEADER', reportsTo: 'Rajesh Mehta', status: 'ACTIVE' },
                { id: 'usr_rep2', name: 'Rajesh Kumar', role: 'SALES_EXEC', reportsTo: 'Amit Shah (TL)', status: 'ACTIVE' },
                { id: 'usr_rep3', name: 'Priya Sharma', role: 'SALES_EXEC', reportsTo: 'Vikram Singh (Admin)', status: 'LOCKED' },
              ].map(usr => (
                <div key={usr.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/80 bg-slate-900/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center">
                      {usr.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">{usr.name}</p>
                      <p className="text-[9px] text-muted">{usr.role} · Reports to: {usr.reportsTo}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUserLock(prev => ({ ...prev, [usr.id]: !prev[usr.id] }))}
                    className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                      selectedUserLock[usr.id]
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {selectedUserLock[usr.id] ? <Lock size={10} /> : <CheckCircle2 size={10} />}
                    {selectedUserLock[usr.id] ? 'LOCKED' : 'ACTIVE'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* WIDGET 3: ROLE PERMISSION POLICY CONFIGURATOR               */}
          {/* ------------------------------------------------------------ */}
          <div className="crm-card space-y-4 border border-cyan-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                  W3
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">WIDGET 3: ROLE PERMISSION POLICY CONFIGURATOR</h3>
                  <p className="text-[11px] text-muted">Granular Visibility Overrides per Employee Tier</p>
                </div>
              </div>
              <Shield size={16} className="text-cyan-400" />
            </div>

            {/* Role selector */}
            <div className="flex gap-1">
              {(['HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedPolicyRole(role)}
                  className={`flex-1 py-1 rounded text-[9px] font-bold uppercase transition-all ${
                    selectedPolicyRole === role
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900 text-muted hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Toggles */}
            <div className="space-y-2 text-xs">
              {[
                { key: 'viewCallCounts', label: 'View Telemetry Call Counts' },
                { key: 'viewCallDurations', label: 'View Call Duration Telemetry' },
                { key: 'viewRevenueFigures', label: 'View Revenue & Financial Figures' },
                { key: 'viewCustomerPII', label: 'View Unmasked Phone/Email PII' },
              ].map(tog => (
                <div key={tog.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-border/50">
                  <span className="text-slate-300 font-medium">{tog.label}</span>
                  <input
                    type="checkbox"
                    checked={(permissionToggles as any)[tog.key]}
                    onChange={e => setPermissionToggles(prev => ({ ...prev, [tog.key]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* MASTER SALES PIPELINE & DEALS KANBAN BOARD                   */}
        {/* ============================================================ */}
        <div className="crm-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <GitBranch size={20} className="text-indigo-400" />
                Master Sales Pipeline & Deals Kanban
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Drag-and-drop deal cards across prospecting, proposal, negotiation & closed stages.
              </p>
            </div>
          </div>

          <DealsKanban />
        </div>

      </main>

      {/* ============================================================ */}
      {/* INGESTION MODALS                                             */}
      {/* ============================================================ */}
      {/* Single Lead Insert Modal */}
      {insertLeadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="crm-card max-w-lg w-full p-6 animate-scale-in space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-indigo-400" /> Insert Single Lead Record
              </h3>
              <button onClick={() => setInsertLeadModalOpen(false)} className="p-1 rounded text-muted hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted block mb-1">Full Name *</label>
                <input value={newLeadName} onChange={e => setNewLeadName(e.target.value)} placeholder="e.g. Aditya Sharma" className="crm-input w-full" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-muted block mb-1">Email</label>
                  <input type="email" value={newLeadEmail} onChange={e => setNewLeadEmail(e.target.value)} placeholder="lead@company.com" className="crm-input w-full" />
                </div>
                <div>
                  <label className="text-muted block mb-1">Phone *</label>
                  <input type="tel" value={newLeadPhone} onChange={e => setNewLeadPhone(e.target.value)} placeholder="+91 98765 43210" className="crm-input w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-muted block mb-1">Company</label>
                  <input value={newLeadCompany} onChange={e => setNewLeadCompany(e.target.value)} placeholder="TechCorp Ltd" className="crm-input w-full" />
                </div>
                <div>
                  <label className="text-muted block mb-1">Estimated Value (₹)</label>
                  <input type="number" value={newLeadValue} onChange={e => setNewLeadValue(e.target.value)} className="crm-input w-full" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setInsertLeadModalOpen(false)} className="btn-secondary flex-1 py-2 text-xs">Cancel</button>
                <button onClick={handleInsertSingleLead} className="btn-primary flex-1 py-2 text-xs gap-1.5"><Plus size={13} /> Save Lead</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Column Modal */}
      {customColumnModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="crm-card max-w-md w-full p-6 animate-scale-in space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders size={16} className="text-cyan-400" /> Add Custom Field Column
              </h3>
              <button onClick={() => setCustomColumnModalOpen(false)} className="p-1 rounded text-muted hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted block mb-1">Column Label *</label>
                <input value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="e.g. GST Number, City, Budget Band" className="crm-input w-full" autoFocus />
              </div>
              <div>
                <label className="text-muted block mb-1">Data Type</label>
                <select value={newColType} onChange={e => setNewColType(e.target.value as any)} className="crm-input w-full">
                  <option value="TEXT">Text String</option>
                  <option value="NUMBER">Numeric Value</option>
                  <option value="SELECT">Dropdown Options</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setCustomColumnModalOpen(false)} className="btn-secondary flex-1 py-2 text-xs">Cancel</button>
                <button onClick={handleAddCustomColumn} disabled={!newColName.trim()} className="btn-primary flex-1 py-2 text-xs gap-1.5 disabled:opacity-40"><Plus size={13} /> Add Column</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
