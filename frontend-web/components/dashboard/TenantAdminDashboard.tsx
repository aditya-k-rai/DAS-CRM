'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, Zap, DollarSign, TrendingUp, Users, Target, Building2, Briefcase,
  CheckSquare, Layers, Lock, ArrowRight, Plus, Database, ClipboardList,
  PhoneCall, Play, Download, Clock, CheckCircle2, AlertCircle, Settings,
  Radio, Sliders, Eye, EyeOff, Bot, MessageSquare, Mail, RefreshCw, Activity,
  UserCheck, UserX, AlertTriangle, ArrowUpRight, Upload, FileSpreadsheet, Search, X
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

  // ============================================================
  // LEAD INTEGRATION & TABLE ADJUSTMENT HUB STATE
  // ============================================================
  const [leadsList, setLeadsList] = useState<DashboardLeadRecord[]>([
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
      customFields: { City: 'Mumbai', Budget: '₹50k-₹1L', Requirement: 'CRM Enterprise' },
      createdAt: '2026-08-16 10:30 AM',
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
      customFields: { City: 'Bangalore', Budget: '₹1L-₹2L', Requirement: 'Call Automation' },
      createdAt: '2026-08-16 11:15 AM',
    },
    {
      id: 'lead_103',
      name: 'Vikram Malhotra',
      email: 'vikram.m@apexind.com',
      phone: '+91 99887 11223',
      company: 'Apex Global',
      source: 'WhatsApp Web',
      stage: 'Negotiation',
      value: 85000,
      assignedRep: 'Amit Shah (TL)',
      customFields: { City: 'Delhi', Budget: '₹80k-₹1L', Requirement: 'Multi-Tenant Setup' },
      createdAt: '2026-08-16 02:45 PM',
    },
    {
      id: 'lead_104',
      name: 'Ananya Roy',
      email: 'ananya.r@sunrealty.com',
      phone: '+91 97654 32109',
      company: 'Sun Realty',
      source: 'Website Form',
      stage: 'Closed Won',
      value: 210000,
      assignedRep: 'Sunita Verma (HR)',
      customFields: { City: 'Pune', Budget: '₹2L+', Requirement: 'Payroll & HR Audit' },
      createdAt: '2026-08-16 04:20 PM',
    },
  ]);

  // Column Visibility Picker State
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    email: true,
    phone: true,
    company: true,
    source: true,
    stage: true,
    value: true,
    assignedRep: true,
  });

  // Custom Columns State
  const [customColumns, setCustomColumns] = useState<string[]>(['City', 'Budget', 'Requirement']);
  const [visibleCustomColumns, setVisibleCustomColumns] = useState<Record<string, boolean>>({
    City: true,
    Budget: true,
    Requirement: true,
  });

  // Modals state
  const [insertLeadModalOpen, setInsertLeadModalOpen] = useState(false);
  const [importCsvModalOpen, setImportCsvModalOpen] = useState(false);
  const [addCustomColModalOpen, setAddCustomColModalOpen] = useState(false);
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for Insert Lead Modal
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('Facebook Ads');
  const [newLeadStage, setNewLeadStage] = useState('Prospecting');
  const [newLeadValue, setNewLeadValue] = useState(50000);
  const [newLeadRep, setNewLeadRep] = useState('Rajesh Kumar');
  const [newLeadCustomValues, setNewLeadCustomValues] = useState<Record<string, string>>({
    City: '',
    Budget: '',
    Requirement: '',
  });

  // Form State for Add Custom Column Modal
  const [newColName, setNewColName] = useState('');

  // ============================================================
  // GOOGLE SHEETS INTEGRATION STATE & HANDLERS
  // ============================================================
  const [googleSheetsModalOpen, setGoogleSheetsModalOpen] = useState(false);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState('August_2026_Inbound_Leads.gsheet');
  const [startRowOffset, setStartRowOffset] = useState('ROW_2');
  const [sheetTabs, setSheetTabs] = useState([
    { name: 'Inbound_Leads_Sheet1', enabled: true },
    { name: 'VIP_Leads_Sheet2', enabled: true },
    { name: 'Archived_Sheet3', enabled: false },
  ]);
  const [cellMapping, setCellMapping] = useState({
    name: 'A2',
    phone: 'B2',
    email: 'C2',
    company: 'D2',
    source: 'E2',
    custom: 'F2',
  });
  const [sheetTestStep, setSheetTestStep] = useState<'CONFIG' | 'TESTING' | 'VERIFIED'>('CONFIG');
  const [sheetTestLoading, setSheetTestLoading] = useState(false);

  const handleStartTestSync = () => {
    setSheetTestStep('TESTING');
  };

  const handleVerifySheetChange = () => {
    setSheetTestLoading(true);
    setTimeout(() => {
      setSheetTestLoading(false);
      setSheetTestStep('VERIFIED');
      // Append detected lead to live leads list
      const detectedLead: DashboardLeadRecord = {
        id: `lead_gsheet_${Date.now()}`,
        name: 'Sameer Deshmukh',
        email: 'sameer@tech.in',
        phone: '+91 98990 12345',
        company: 'Deshmukh Tech Solutions',
        source: 'Google Sheets Sync',
        stage: 'Prospecting',
        value: 110000,
        assignedRep: 'Rajesh Kumar',
        customFields: { City: 'Pune', Budget: '₹1.5L', Requirement: 'Google Sheets Live Hook' },
        createdAt: new Date().toLocaleString(),
      };
      setLeadsList(prev => [detectedLead, ...prev]);
    }, 1200);
  };

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

  const handleInsertLead = () => {
    if (!newLeadName.trim() || !newLeadEmail.trim() || !newLeadPhone.trim()) return;
    const created: DashboardLeadRecord = {
      id: `lead_${Date.now()}`,
      name: newLeadName.trim(),
      email: newLeadEmail.trim(),
      phone: newLeadPhone.trim(),
      company: newLeadCompany.trim() || 'Independent Inquiry',
      source: newLeadSource,
      stage: newLeadStage,
      value: Number(newLeadValue) || 0,
      assignedRep: newLeadRep,
      customFields: { ...newLeadCustomValues },
      createdAt: new Date().toLocaleString(),
    };
    setLeadsList(prev => [created, ...prev]);
    setInsertLeadModalOpen(false);
    setNewLeadName('');
    setNewLeadEmail('');
    setNewLeadPhone('');
    setNewLeadCompany('');
  };

  const handleAddCustomColumn = () => {
    if (!newColName.trim()) return;
    const colKey = newColName.trim();
    if (!customColumns.includes(colKey)) {
      setCustomColumns(prev => [...prev, colKey]);
      setVisibleCustomColumns(prev => ({ ...prev, [colKey]: true }));
    }
    setNewColName('');
    setAddCustomColModalOpen(false);
  };

  const handleExportLeadsCSV = () => {
    let headers: string[] = [];
    if (columnVisibility.name) headers.push('Name');
    if (columnVisibility.email) headers.push('Email');
    if (columnVisibility.phone) headers.push('Phone');
    if (columnVisibility.company) headers.push('Company');
    if (columnVisibility.source) headers.push('Source');
    if (columnVisibility.stage) headers.push('Stage');
    if (columnVisibility.value) headers.push('Value');
    if (columnVisibility.assignedRep) headers.push('Assigned Rep');
    customColumns.forEach(c => {
      if (visibleCustomColumns[c]) headers.push(c);
    });

    let csvContent = headers.join(',') + '\n';
    leadsList.forEach(lead => {
      let row: string[] = [];
      if (columnVisibility.name) row.push(`"${lead.name}"`);
      if (columnVisibility.email) row.push(`"${lead.email}"`);
      if (columnVisibility.phone) row.push(`"${lead.phone}"`);
      if (columnVisibility.company) row.push(`"${lead.company}"`);
      if (columnVisibility.source) row.push(`"${lead.source}"`);
      if (columnVisibility.stage) row.push(`"${lead.stage}"`);
      if (columnVisibility.value) row.push(`"${lead.value}"`);
      if (columnVisibility.assignedRep) row.push(`"${lead.assignedRep}"`);
      customColumns.forEach(c => {
        if (visibleCustomColumns[c]) row.push(`"${lead.customFields[c] || ''}"`);
      });
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulateCsvImport = () => {
    const importedLeads: DashboardLeadRecord[] = [
      {
        id: `lead_csv_${Date.now()}_1`,
        name: 'Rohan Deshmukh',
        email: 'rohan.d@deshmukhenterprise.com',
        phone: '+91 98333 44555',
        company: 'Deshmukh Enterprise',
        source: 'CSV Import Batch',
        stage: 'Prospecting',
        value: 95000,
        assignedRep: 'Rajesh Kumar',
        customFields: { City: 'Nagpur', Budget: '₹1L', Requirement: 'Dialer Auto-Integration' },
        createdAt: new Date().toLocaleString(),
      },
      {
        id: `lead_csv_${Date.now()}_2`,
        name: 'Kavita Menon',
        email: 'kavita@menonlogistics.in',
        phone: '+91 97444 55666',
        company: 'Menon Logistics',
        source: 'CSV Import Batch',
        stage: 'Qualification',
        value: 175000,
        assignedRep: 'Priya Sharma',
        customFields: { City: 'Kochi', Budget: '₹2L', Requirement: 'WhatsApp Bulk Ingestion' },
        createdAt: new Date().toLocaleString(),
      },
    ];
    setLeadsList(prev => [...importedLeads, ...prev]);
    setImportCsvModalOpen(false);
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
      {/* ⚡ LEAD INTEGRATION & INGESTION CONTROL CENTER (NEW SECTION) */}
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

          {/* ACTION BUTTONS TOOLBAR */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setInsertLeadModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Plus size={14} /> + Insert Lead
            </button>
            <button
              onClick={() => setImportCsvModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Upload size={14} /> Import CSV / Excel
            </button>
            <button
              onClick={() => setGoogleSheetsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <FileSpreadsheet size={14} /> Google Sheets Sync
            </button>
            <button
              onClick={handleExportLeadsCSV}
              className="px-3.5 py-2 rounded-xl bg-teal-600/20 border border-teal-500/40 text-teal-300 hover:bg-teal-600/30 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={() => setAddCustomColModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/30 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Plus size={14} /> + Custom Column
            </button>

            {/* COLUMN ADJUSTMENT DROPDOWN TOGGLE */}
            <div className="relative">
              <button
                onClick={() => setColPickerOpen(!colPickerOpen)}
                className={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all ${colPickerOpen ? 'bg-indigo-500/30 border-indigo-500 text-white' : 'bg-background border-border text-muted hover:text-white'}`}
              >
                <Sliders size={14} /> Adjust Columns ({Object.values(columnVisibility).filter(Boolean).length + Object.values(visibleCustomColumns).filter(Boolean).length})
              </button>

              {colPickerOpen && (
                <div className="absolute right-0 mt-2 w-72 p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-2xl z-50 space-y-3 animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="font-bold text-white flex items-center gap-1">
                      <Sliders size={13} className="text-indigo-400" /> Select Visible Columns
                    </span>
                    <button onClick={() => setColPickerOpen(false)} className="text-muted hover:text-white">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Standard Lead Columns</p>
                    {[
                      { key: 'name', label: 'Name Column' },
                      { key: 'email', label: 'Email Column' },
                      { key: 'phone', label: 'Number / Phone Column' },
                      { key: 'company', label: 'Company Column' },
                      { key: 'source', label: 'Lead Source Column' },
                      { key: 'stage', label: 'Sales Stage Column' },
                      { key: 'value', label: 'Lead Value Column' },
                      { key: 'assignedRep', label: 'Assigned Rep Column' },
                    ].map(col => (
                      <label key={col.key} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                        <span className="text-slate-300 font-semibold">{col.label}</span>
                        <input
                          type="checkbox"
                          checked={(columnVisibility as any)[col.key]}
                          onChange={e => setColumnVisibility(prev => ({ ...prev, [col.key]: e.target.checked }))}
                          className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                        />
                      </label>
                    ))}

                    <div className="pt-2 border-t border-border">
                      <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Custom Columns</p>
                      {customColumns.map(col => (
                        <label key={col} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                          <span className="text-purple-300 font-semibold">{col} (Custom)</span>
                          <input
                            type="checkbox"
                            checked={!!visibleCustomColumns[col]}
                            onChange={e => setVisibleCustomColumns(prev => ({ ...prev, [col]: e.target.checked }))}
                            className="accent-purple-500 w-4 h-4 rounded cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONNECTED INTEGRATION CHANNELS PIPELINE */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            {
              name: 'Google Sheets',
              status: 'Live Range A2:F',
              count: `${leadsList.filter(l => l.source === 'Google Sheets Sync').length + 1890} Syncing`,
              lastFetch: 'Just now (Most Recent)',
              sentToday: true,
              speed: 'FAST', // Most recent data fetch -> FAST GREEN BLINK
              color: 'from-emerald-600/25 to-teal-900/20 border-emerald-500/50 shadow-emerald-500/10 shadow-lg',
            },
            {
              name: 'Facebook Ads',
              status: 'Active Hook',
              count: '1,240 Ingested',
              lastFetch: '18 mins ago',
              sentToday: true,
              speed: 'SLOW', // Sent today earlier -> SLOW GREEN BLINK
              color: 'from-blue-600/20 to-blue-900/10 border-blue-500/30',
            },
            {
              name: 'WhatsApp Web',
              status: 'Connected',
              count: '410 Ingested',
              lastFetch: '1.5 hrs ago',
              sentToday: true,
              speed: 'SLOW', // Sent today earlier -> SLOW GREEN BLINK
              color: 'from-emerald-600/20 to-emerald-900/10 border-emerald-500/30',
            },
            {
              name: 'Google Ads',
              status: 'Auto-Sync',
              count: '650 Ingested',
              lastFetch: '4 hrs ago',
              sentToday: true,
              speed: 'SLOW', // Sent today earlier -> SLOW GREEN BLINK
              color: 'from-red-600/20 to-red-900/10 border-red-500/30',
            },
            {
              name: 'Website Form',
              status: 'Webhook Live',
              count: '230 Ingested',
              lastFetch: 'Yesterday (No data today)',
              sentToday: false,
              speed: 'NONE', // NOT sent today -> NO BLINK (Static dot)
              color: 'from-purple-600/20 to-purple-900/10 border-purple-500/30',
            },
            {
              name: 'Zapier API',
              status: 'Key Active',
              count: '890 Ingested',
              lastFetch: '3 days ago',
              sentToday: false,
              speed: 'NONE', // NOT sent today -> NO BLINK (Static dot)
              color: 'from-amber-600/20 to-amber-900/10 border-amber-500/30',
            },
          ].map(ch => (
            <div key={ch.name} className={`p-3 rounded-2xl border bg-gradient-to-b ${ch.color} space-y-1.5 transition-all`}>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white tracking-tight">{ch.name}</span>

                {/* DYNAMIC GREEN BLINK INDICATOR LOGIC */}
                {ch.sentToday ? (
                  ch.speed === 'FAST' ? (
                    // FAST GREEN BLINK (Most recent data fetch today)
                    <div className="flex items-center gap-1">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                      </span>
                    </div>
                  ) : (
                    // SLOW GREEN BLINK (Data sent today, but earlier)
                    <div className="flex items-center gap-1">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                    </div>
                  )
                ) : (
                  // NO BLINK (No data sent today -> Static neutral dot)
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-500/50" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted font-semibold">{ch.status}</p>
                {ch.sentToday && (
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded font-mono ${ch.speed === 'FAST' ? 'bg-emerald-500/30 text-emerald-300 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                    {ch.speed === 'FAST' ? '⚡ FAST BLINK' : '⏳ SLOW'}
                  </span>
                )}
              </div>

              <p className="text-xs font-black text-cyan-300">{ch.count}</p>
              <p className="text-[9px] font-mono text-slate-400 pt-0.5 border-t border-white/5">
                Last: <span className={ch.sentToday ? 'text-emerald-300 font-bold' : 'text-slate-500'}>{ch.lastFetch}</span>
              </p>
            </div>
          ))}
        </div>

        {/* DYNAMIC ADJUSTABLE LEAD DATA TABLE (INSERTED ABOVE LEAD WIDGETS) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <ClipboardList size={16} className="text-indigo-400" /> Live Adjustable Lead Directory ({leadsList.length} Leads)
            </h3>
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-muted" />
              <input
                type="text"
                placeholder="Search leads, emails, or phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="crm-input pl-9 text-xs h-8 w-full"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-slate-950/60 shadow-xl">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-border">
                <tr>
                  {columnVisibility.name && <th className="p-3">Name Column</th>}
                  {columnVisibility.email && <th className="p-3">Email Column</th>}
                  {columnVisibility.phone && <th className="p-3">Number / Phone Column</th>}
                  {columnVisibility.company && <th className="p-3">Company Column</th>}
                  {columnVisibility.source && <th className="p-3">Source</th>}
                  {columnVisibility.stage && <th className="p-3">Sales Stage</th>}
                  {columnVisibility.value && <th className="p-3">Lead Value</th>}
                  {columnVisibility.assignedRep && <th className="p-3">Assigned Rep</th>}
                  {customColumns.map(col => visibleCustomColumns[col] && (
                    <th key={col} className="p-3 text-purple-300">{col} (Custom)</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {leadsList
                  .filter(l =>
                    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    l.phone.includes(searchTerm)
                  )
                  .map(l => (
                    <tr key={l.id} className="hover:bg-slate-900/60 transition-colors">
                      {columnVisibility.name && <td className="p-3 font-extrabold text-white">{l.name}</td>}
                      {columnVisibility.email && <td className="p-3 font-mono text-indigo-300">{l.email}</td>}
                      {columnVisibility.phone && <td className="p-3 font-mono text-emerald-400 font-bold">{l.phone}</td>}
                      {columnVisibility.company && <td className="p-3 font-semibold text-slate-300">{l.company}</td>}
                      {columnVisibility.source && (
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {l.source}
                          </span>
                        </td>
                      )}
                      {columnVisibility.stage && (
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {l.stage}
                          </span>
                        </td>
                      )}
                      {columnVisibility.value && <td className="p-3 font-mono font-bold text-emerald-400">₹{l.value.toLocaleString()}</td>}
                      {columnVisibility.assignedRep && <td className="p-3 font-semibold text-slate-300">{l.assignedRep}</td>}
                      {customColumns.map(col => visibleCustomColumns[col] && (
                        <td key={col} className="p-3 font-mono text-purple-300 font-bold">
                          {l.customFields[col] || '—'}
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

      {/* ============================================================ */}
      {/* MODALS: INSERT LEAD, IMPORT CSV, ADD CUSTOM COLUMN           */}
      {/* ============================================================ */}
      {insertLeadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="crm-card max-w-lg w-full p-6 bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Plus size={18} className="text-indigo-400" /> Insert New Lead Record
              </h3>
              <button onClick={() => setInsertLeadModalOpen(false)} className="text-muted hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted block mb-1 font-bold">Lead Full Name *</label>
                <input className="crm-input h-10 w-full" placeholder="e.g. Vikram Sharma" value={newLeadName} onChange={e => setNewLeadName(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted block mb-1 font-bold">Email Address *</label>
                  <input className="crm-input h-10 w-full" placeholder="vikram@company.com" value={newLeadEmail} onChange={e => setNewLeadEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-muted block mb-1 font-bold">Phone Number *</label>
                  <input className="crm-input h-10 w-full" placeholder="+91 98765 43210" value={newLeadPhone} onChange={e => setNewLeadPhone(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted block mb-1 font-bold">Company Name</label>
                  <input className="crm-input h-10 w-full" placeholder="Acme Enterprises" value={newLeadCompany} onChange={e => setNewLeadCompany(e.target.value)} />
                </div>
                <div>
                  <label className="text-muted block mb-1 font-bold">Lead Source</label>
                  <select className="crm-input h-10 w-full" value={newLeadSource} onChange={e => setNewLeadSource(e.target.value)}>
                    <option value="Facebook Ads">Facebook Ads</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="WhatsApp Web">WhatsApp Web</option>
                    <option value="Website Form">Website Form</option>
                    <option value="Manual Insert">Manual Insert</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted block mb-1 font-bold">Initial Sales Stage</label>
                  <select className="crm-input h-10 w-full" value={newLeadStage} onChange={e => setNewLeadStage(e.target.value)}>
                    <option value="Prospecting">Prospecting</option>
                    <option value="Qualification">Qualification</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed Won">Closed Won</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted block mb-1 font-bold">Deal Value (₹)</label>
                  <input type="number" className="crm-input h-10 w-full font-bold text-emerald-400" value={newLeadValue} onChange={e => setNewLeadValue(Number(e.target.value))} />
                </div>
              </div>

              {/* Custom Fields in Insert Form */}
              {customColumns.length > 0 && (
                <div className="pt-2 border-t border-border space-y-2">
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Custom Column Values</p>
                  <div className="grid grid-cols-2 gap-3">
                    {customColumns.map(col => (
                      <div key={col}>
                        <label className="text-muted block mb-1 font-bold">{col}</label>
                        <input
                          className="crm-input h-9 w-full font-mono text-purple-300"
                          placeholder={`Enter ${col}...`}
                          value={newLeadCustomValues[col] || ''}
                          onChange={e => setNewLeadCustomValues(prev => ({ ...prev, [col]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button onClick={() => setInsertLeadModalOpen(false)} className="btn-secondary text-xs px-4 py-2">
                Cancel
              </button>
              <button onClick={handleInsertLead} className="btn-primary text-xs px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-500 text-white">
                Save & Insert Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {importCsvModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="crm-card max-w-lg w-full p-6 bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Upload size={18} className="text-purple-400" /> Import Leads Batch (CSV / Excel)
              </h3>
              <button onClick={() => setImportCsvModalOpen(false)} className="text-muted hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-6 border-2 border-dashed border-purple-500/30 hover:border-purple-500 rounded-2xl bg-purple-500/5 text-center space-y-2 cursor-pointer">
                <FileSpreadsheet size={32} className="mx-auto text-purple-400" />
                <p className="font-bold text-white">Drag and drop your CSV / Excel lead file</p>
                <p className="text-[11px] text-muted">Supports .csv, .xlsx files up to 10MB</p>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border space-y-2">
                <p className="font-bold text-white">Header-to-Column Auto Mapping Preview:</p>
                <div className="space-y-1 text-[11px] text-muted font-mono">
                  <div className="flex justify-between"><span>CSV Header "Full Name"</span> <strong className="text-indigo-300">Name Column</strong></div>
                  <div className="flex justify-between"><span>CSV Header "Email"</span> <strong className="text-indigo-300">Email Column</strong></div>
                  <div className="flex justify-between"><span>CSV Header "Phone"</span> <strong className="text-emerald-400">Number Column</strong></div>
                  <div className="flex justify-between"><span>CSV Header "City"</span> <strong className="text-purple-300">Custom Column (City)</strong></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button onClick={() => setImportCsvModalOpen(false)} className="btn-secondary text-xs px-4 py-2">
                Cancel
              </button>
              <button onClick={handleSimulateCsvImport} className="btn-primary text-xs px-5 py-2 font-bold bg-purple-600 hover:bg-purple-500 text-white">
                Process & Import 2 Batch Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {addCustomColModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="crm-card max-w-md w-full p-6 bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Plus size={18} className="text-cyan-400" /> Create Custom Lead Table Column
              </h3>
              <button onClick={() => setAddCustomColModalOpen(false)} className="text-muted hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted block mb-1 font-bold">Custom Column Title *</label>
                <input
                  className="crm-input h-10 w-full"
                  placeholder="e.g. Budget, Requirement, City, Industry, Notes"
                  value={newColName}
                  onChange={e => setNewColName(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-xl bg-background border border-border text-[11px] text-muted space-y-1">
                <p className="font-bold text-white">💡 Custom Column Info:</p>
                <p>New custom columns automatically appear in the Lead Directory Table, Insert Lead Form, and CSV Export options.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button onClick={() => setAddCustomColModalOpen(false)} className="btn-secondary text-xs px-4 py-2">
                Cancel
              </button>
              <button onClick={handleAddCustomColumn} className="btn-primary text-xs px-5 py-2 font-bold bg-cyan-600 hover:bg-cyan-500 text-white">
                Create Custom Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* GOOGLE SHEETS REAL-TIME SYNC INTEGRATION MODAL               */}
      {/* ============================================================ */}
      {googleSheetsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="crm-card max-w-2xl w-full p-6 bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl space-y-5 animate-fade-in my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Google Sheets Real-Time Sync Integration</h3>
                  <p className="text-[11px] text-muted">Select Workbook & Sheets, Set Row Offset, Map Cell Addresses & Test Sync</p>
                </div>
              </div>
              <button onClick={() => setGoogleSheetsModalOpen(false)} className="text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* SECTION 1: SPREADSHEET & SHEET SELECTION */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-extrabold text-white flex items-center gap-1.5 text-xs">
                    <Database size={14} className="text-emerald-400" /> Connected Google Drive Account & Workbook
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    CONNECTED: adtyamighty@gmail.com
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted block mb-1 font-bold">Select Google Spreadsheet Workbook *</label>
                    <select
                      className="crm-input h-10 w-full font-bold text-white"
                      value={selectedSpreadsheet}
                      onChange={e => setSelectedSpreadsheet(e.target.value)}
                    >
                      <option value="August_2026_Inbound_Leads.gsheet">August_2026_Inbound_Leads.gsheet (Master)</option>
                      <option value="Q3_Sales_Campaign_Leads.gsheet">Q3_Sales_Campaign_Leads.gsheet</option>
                      <option value="Website_Inquiries_Live.gsheet">Website_Inquiries_Live.gsheet</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-muted block mb-1 font-bold">Start Data Sync From *</label>
                    <select
                      className="crm-input h-10 w-full font-bold text-emerald-300"
                      value={startRowOffset}
                      onChange={e => setStartRowOffset(e.target.value)}
                    >
                      <option value="ROW_2">Row 2 (Headers at Row 1, Data starts Row 2)</option>
                      <option value="ROW_1">Row 1 (First Row contains Data directly)</option>
                      <option value="ROW_3">Row 3 (Sub-headers present at Row 2)</option>
                    </select>
                  </div>
                </div>

                {/* TAB / SHEET SELECTOR */}
                <div>
                  <label className="text-muted block mb-1.5 font-bold">
                    Select Sheet Tabs to Sync / Exclude (Click tab to toggle)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sheetTabs.map(tab => (
                      <button
                        key={tab.name}
                        type="button"
                        onClick={() => {
                          setSheetTabs(prev => prev.map(t => t.name === tab.name ? { ...t, enabled: !t.enabled } : t));
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${tab.enabled ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-500 line-through opacity-60'}`}
                      >
                        <span>{tab.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${tab.enabled ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-800 text-slate-500'}`}>
                          {tab.enabled ? 'SYNC ENABLED' : 'EXCLUDED'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 2: CELL ADDRESS COLUMN MAPPING */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-extrabold text-white flex items-center gap-1.5 text-xs">
                  <Sliders size={14} className="text-indigo-400" /> Cell Address Column Mapping (e.g. A2 = Name, B2 = Number)
                </h4>
                <p className="text-[11px] text-muted">Map Google Sheet Cell Columns directly to CRM Lead Fields:</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-muted block mb-1 font-semibold">Name Column Cell</label>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-indigo-400">Name $\rightarrow$</span>
                      <input
                        className="crm-input h-9 w-20 text-center font-mono font-bold text-white uppercase"
                        value={cellMapping.name}
                        onChange={e => setCellMapping(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-muted block mb-1 font-semibold">Number / Phone Cell</label>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-400">Phone $\rightarrow$</span>
                      <input
                        className="crm-input h-9 w-20 text-center font-mono font-bold text-emerald-300 uppercase"
                        value={cellMapping.phone}
                        onChange={e => setCellMapping(prev => ({ ...prev, phone: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-muted block mb-1 font-semibold">Email Address Cell</label>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-purple-400">Email $\rightarrow$</span>
                      <input
                        className="crm-input h-9 w-20 text-center font-mono font-bold text-purple-300 uppercase"
                        value={cellMapping.email}
                        onChange={e => setCellMapping(prev => ({ ...prev, email: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-muted block mb-1 font-semibold">Company Name Cell</label>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-cyan-400">Company $\rightarrow$</span>
                      <input
                        className="crm-input h-9 w-20 text-center font-mono font-bold text-cyan-300 uppercase"
                        value={cellMapping.company}
                        onChange={e => setCellMapping(prev => ({ ...prev, company: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-muted block mb-1 font-semibold">Lead Source Cell</label>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-400">Source $\rightarrow$</span>
                      <input
                        className="crm-input h-9 w-20 text-center font-mono font-bold text-amber-300 uppercase"
                        value={cellMapping.source}
                        onChange={e => setCellMapping(prev => ({ ...prev, source: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-muted block mb-1 font-semibold">Custom Column Cell</label>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-pink-400">Custom $\rightarrow$</span>
                      <input
                        className="crm-input h-9 w-20 text-center font-mono font-bold text-pink-300 uppercase"
                        value={cellMapping.custom}
                        onChange={e => setCellMapping(prev => ({ ...prev, custom: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: TEST SYNC WORKFLOW & VERIFICATION ACKNOWLEDGMENT */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white flex items-center gap-2">
                    <RefreshCw size={15} className="text-indigo-400" /> 2-Step Live Sync Testing & Acknowledgment
                  </span>
                  {sheetTestStep === 'VERIFIED' && (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 size={13} /> TEST POSITIVE — VERIFIED
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-muted">
                  Click <strong>Test Sync Connection</strong> to preview Google Sheet. Make any change in the Google Sheet data, then click <strong>Verify & Detect Change</strong> to acknowledge the live webhook listener.
                </p>

                {sheetTestStep === 'CONFIG' && (
                  <button
                    onClick={handleStartTestSync}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Play size={14} /> Step 1: Test Sync Connection & Open Google Sheet Preview
                  </button>
                )}

                {sheetTestStep === 'TESTING' && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-slate-900 border border-emerald-500/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Google Sheet Preview Opened ({selectedSpreadsheet})
                      </span>
                      <a
                        href="https://docs.google.com/spreadsheets"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        Open Sheet in Google Drive ↗
                      </a>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 space-y-1">
                      <p className="text-emerald-400 font-bold">📄 Mock Google Sheet Cell Matrix Preview ({startRowOffset}):</p>
                      <p className="text-slate-400">Row 1 (Headers): [{cellMapping.name}: Name | {cellMapping.phone}: Phone | {cellMapping.email}: Email | {cellMapping.company}: Company]</p>
                      <p className="text-white font-bold">Row 2 (Live Data): [{cellMapping.name}: Sameer Deshmukh | {cellMapping.phone}: +91 98990 12345 | {cellMapping.email}: sameer@tech.in]</p>
                    </div>

                    <button
                      onClick={handleVerifySheetChange}
                      disabled={sheetTestLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl"
                    >
                      {sheetTestLoading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Detecting Cell Range Modifications...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} /> Step 2: Verify & Acknowledge Cell Change (Click to Confirm)
                        </>
                      )}
                    </button>
                  </div>
                )}

                {sheetTestStep === 'VERIFIED' && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-sm">
                      <CheckCircle2 size={16} className="text-emerald-400" /> Sync Test Positive — Change Detected & Confirmed!
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Detected live modification at cell range <code className="font-mono text-emerald-400 font-bold">{cellMapping.name}:{cellMapping.phone}</code>: Ingested lead <strong>Sameer Deshmukh (+91 98990 12345)</strong> into DAS CRM active queue.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button onClick={() => setGoogleSheetsModalOpen(false)} className="btn-secondary text-xs px-4 py-2">
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Google Sheets Real-Time Sync configured for ${selectedSpreadsheet}! Sheet mapping (${cellMapping.name}=Name, ${cellMapping.phone}=Phone) active.`);
                  setGoogleSheetsModalOpen(false);
                }}
                className="btn-primary text-xs px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Save Google Sheets Sync Setup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
