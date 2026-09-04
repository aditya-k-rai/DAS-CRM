'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { Topbar } from '@/components/layout/Topbar';
import { DealsKanban } from '@/components/deals/DealsKanban';
import { FileImportEngineModal } from '@/components/ingestion/FileImportEngineModal';
import { LeadAllocationModal } from '@/components/ingestion/LeadAllocationModal';
import { isLeadContactedAndLocked } from '@/components/leads/LeadsTable';
import {
  Shield, Zap, DollarSign, TrendingUp, Users, Target, Building2, Briefcase,
  CheckSquare, Layers, Lock, ArrowRight, Plus, Database, ClipboardList,
  PhoneCall, Play, Download, Clock, CheckCircle2, AlertCircle, Settings,
  Radio, Sliders, Eye, EyeOff, Bot, MessageSquare, Mail, RefreshCw, Activity,
  UserCheck, UserX, AlertTriangle, ArrowUpRight, Upload, FileSpreadsheet, Search, X, GitBranch, Trash2
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

interface FileUploadHistoryItem {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  leadsCount: number;
  uploadedBy: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

interface GoogleSheetHistoryItem {
  id: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  sheetTab: string;
  rangeMapped: string;
  connectedAt: string;
  lastSyncAt: string;
  totalSyncsCount: number;
  totalLeadsIngested: number;
  status: 'ACTIVE_SYNC' | 'PAUSED';
}

interface DatewiseLeadsAnalytics {
  date: string;
  totalLeads: number;
  googleSheets: number;
  fileUploads: number;
  facebookAds: number;
  googleAds: number;
  whatsAppDirect: number;
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

  const rawRole = (currentUser?.role || '').toString().toUpperCase();
  const isAdminOrManager = rawRole === 'SUPER_ADMIN' || rawRole === 'TENANT_ADMIN' || rawRole === 'ADMIN' || rawRole === 'MANAGER' || !currentUser;

  // Widget 4: AI, WhatsApp & Email Marketing State
  const [pathMode, setPathMode] = useState<'PAID_AI' | 'MANUAL_DIALER'>('PAID_AI');
  const [whatsAppConnected, setWhatsAppConnected] = useState(true);
  const [emailCampaignDelegated, setEmailCampaignDelegated] = useState(true);

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

  // Lead Incoming History Active Tab State
  const [historyActiveTab, setHistoryActiveTab] = useState<'DATEWISE' | 'FILE_UPLOADS' | 'GSHEETS_SYNC'>('DATEWISE');

  // History Seed State
  const [fileUploadHistory, setFileUploadHistory] = useState<FileUploadHistoryItem[]>([
    {
      id: 'file_hist_1',
      fileName: 'August_Sales_Leads_Master.xlsx',
      fileSize: '2.4 MB',
      uploadedAt: '2026-08-16 02:30 PM',
      leadsCount: 24,
      uploadedBy: 'Vikram Singh (Admin)',
      status: 'SUCCESS',
    },
    {
      id: 'file_hist_2',
      fileName: 'Mumbai_Campaign_Contacts.csv',
      fileSize: '480 KB',
      uploadedAt: '2026-08-15 11:15 AM',
      leadsCount: 18,
      uploadedBy: 'Priya Sharma (Manager)',
      status: 'SUCCESS',
    },
    {
      id: 'file_hist_3',
      fileName: 'Q2_Archived_Inquiries.csv',
      fileSize: '1.1 MB',
      uploadedAt: '2026-08-14 06:45 PM',
      leadsCount: 40,
      uploadedBy: 'Vikram Singh (Admin)',
      status: 'SUCCESS',
    },
  ]);

  const [googleSheetHistory, setGoogleSheetHistory] = useState<GoogleSheetHistoryItem[]>([
    {
      id: 'gsheet_hist_1',
      spreadsheetTitle: 'August_2026_Inbound_Leads.gsheet',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Inbound_Leads_Sheet1',
      rangeMapped: 'Range A2:F',
      connectedAt: '2026-08-01 09:00 AM',
      lastSyncAt: 'Today, 02:45 PM (Just Now)',
      totalSyncsCount: 420,
      totalLeadsIngested: 1890,
      status: 'ACTIVE_SYNC',
    },
    {
      id: 'gsheet_hist_2',
      spreadsheetTitle: 'Web_Contact_Form_Responses.gsheet',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Form_Submissions',
      rangeMapped: 'Range A2:D',
      connectedAt: '2026-08-10 03:20 PM',
      lastSyncAt: 'Yesterday, 06:10 PM',
      totalSyncsCount: 115,
      totalLeadsIngested: 230,
      status: 'ACTIVE_SYNC',
    },
  ]);

  const [datewiseAnalytics, setDatewiseAnalytics] = useState<DatewiseLeadsAnalytics[]>([
    { date: 'Today (Aug 27)', totalLeads: 48, googleSheets: 18, fileUploads: 12, facebookAds: 10, googleAds: 5, whatsAppDirect: 3 },
    { date: 'Yesterday (Aug 26)', totalLeads: 62, googleSheets: 22, fileUploads: 15, facebookAds: 14, googleAds: 8, whatsAppDirect: 3 },
    { date: 'Aug 25, 2026', totalLeads: 55, googleSheets: 19, fileUploads: 14, facebookAds: 12, googleAds: 6, whatsAppDirect: 4 },
    { date: 'Aug 24, 2026', totalLeads: 41, googleSheets: 14, fileUploads: 10, facebookAds: 9, googleAds: 5, whatsAppDirect: 3 },
    { date: 'Aug 23, 2026', totalLeads: 38, googleSheets: 12, fileUploads: 8, facebookAds: 10, googleAds: 6, whatsAppDirect: 2 },
  ]);

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
  const [newColOptionsStr, setNewColOptionsStr] = useState('Hot Lead, Warm Lead, Cold Lead');

  // 📊 Spreadsheet Ingestion & Employee Allocation Audit History State
  const [webAuditLogs, setWebAuditLogs] = useState([
    {
      id: 'aud-1',
      fileName: 'Q3_Enterprise_Prospects_Import.csv',
      injectedAt: '03 Sep 2026, 07:45 PM',
      leadsCount: 124,
      colsCount: 8,
      platform: 'Google Ads',
      status: 'PENDING_ALLOCATION' as const,
    },
    {
      id: 'aud-2',
      fileName: 'Lotwaala_August_2026_Work_Plan.xlsx',
      injectedAt: '03 Sep 2026, 08:14 PM',
      leadsCount: 32,
      colsCount: 6,
      platform: 'Google Ads',
      status: 'ALLOCATED' as const,
      allocationSummary: 'Assigned to Priya Sharma (TL A) [Rows 1-16], Rohan Kumar [Rows 17-32]',
    },
    {
      id: 'aud-3',
      fileName: 'West_Territory_Cold_Outreach.xlsx',
      injectedAt: '02 Sep 2026, 04:30 PM',
      leadsCount: 214,
      colsCount: 10,
      platform: 'Meta Ads',
      status: 'ALLOCATED' as const,
      allocationSummary: 'Assigned to Amit Shah (Sales Exec) [Direct]',
    },
  ]);

  const [webAuditFilter, setWebAuditFilter] = useState<'ALL' | 'PENDING' | 'ALLOCATED'>('ALL');
  const [selectedWebAuditDetail, setSelectedWebAuditDetail] = useState<typeof webAuditLogs[0] | null>(null);
  const [pendingAllocationSheet, setPendingAllocationSheet] = useState<{ isOpen: boolean; fileName: string; leadsCount: number }>({
    isOpen: false,
    fileName: '',
    leadsCount: 0,
  });

  // Dynamic Custom Columns & Excel Table Config State
  const [customColumns, setCustomColumns] = useState<Array<{ id: string; name: string; type: string; options?: string[] }>>([
    { id: 'col_city', name: 'City', type: 'TEXT' },
    { id: 'col_budget', name: 'Budget', type: 'TEXT' },
    { id: 'col_rating', name: 'Lead Rating', type: 'SELECT', options: ['Hot Lead 🔥', 'Warm Lead ⚡', 'Cold Lead ❄️'] },
    { id: 'col_requirement', name: 'Requirement', type: 'TEXT' },
  ]);

  interface TableColumnConfig {
    id: string;
    label: string;
    isRestricted?: boolean; // If true, appends '*' and restricts to Admin & Manager only
    hidden?: boolean;
  }

  const [tableColumns, setTableColumns] = useState<TableColumnConfig[]>([
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'company', label: 'Company' },
    { id: 'source', label: 'Source' },
    { id: 'stage', label: 'Stage' },
    { id: 'value', label: 'Value', isRestricted: true },
    { id: 'assignedRep', label: 'Assigned Rep' },
    { id: 'col_city', label: 'City' },
    { id: 'col_budget', label: 'Budget', isRestricted: true },
    { id: 'col_rating', label: 'Lead Rating' },
    { id: 'col_requirement', label: 'Requirement' },
  ]);

  const [columnConfigModalOpen, setColumnConfigModalOpen] = useState(false);

  // Excel Column Resizing (Hold & Drag Divider Line) State
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 180,
    email: 180,
    phone: 150,
    company: 180,
    source: 130,
    stage: 130,
    value: 120,
    assignedRep: 150,
    col_city: 130,
    col_budget: 130,
    col_rating: 140,
    col_requirement: 180,
  });

  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleMouseDownResize = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColId(colId);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[colId] || 140;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const newWidth = Math.max(70, startWidthRef.current + deltaX);
      setColumnWidths(prev => ({ ...prev, [colId]: newWidth }));
    };

    const onMouseUp = () => {
      setResizingColId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Column Reorder Helpers
  const moveColumnLeft = (index: number) => {
    if (index <= 0) return;
    setTableColumns(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const moveColumnRight = (index: number) => {
    if (index >= tableColumns.length - 1) return;
    setTableColumns(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  // Excel Row Up / Down Shifting
  const moveRowUp = (leadId: string) => {
    const idx = leadDirectory.findIndex(l => l.id === leadId);
    if (idx <= 0) return;
    setLeadDirectory(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      return copy;
    });
  };

  const moveRowDown = (leadId: string) => {
    const idx = leadDirectory.findIndex(l => l.id === leadId);
    if (idx < 0 || idx >= leadDirectory.length - 1) return;
    setLeadDirectory(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      return copy;
    });
  };

  // Master Lead Directory List
  const [leadDirectory, setLeadDirectory] = useState<DashboardLeadRecord[]>([
    {
      id: 'lead_101',
      name: 'Aditya Sharma',
      email: 'aditya.s@techcorp.in',
      phone: '+91 98765 43210',
      company: 'TechCorp India',
      source: 'Meta Ads (FB & Insta)',
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
      source: 'IndiaMART',
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
      source: 'TradeIndia',
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
    const opts = newColType === 'SELECT'
      ? newColOptionsStr.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    setCustomColumns(prev => [
      ...prev,
      {
        id: colId,
        name: newColName.trim(),
        type: newColType,
        options: opts && opts.length > 0 ? opts : ['Option 1', 'Option 2', 'Option 3'],
      }
    ]);
    setTableColumns(prev => [
      ...prev,
      { id: colId, label: newColName.trim(), isRestricted: false, hidden: false }
    ]);
    setCustomColumnModalOpen(false);
    setNewColName('');
    setNewColOptionsStr('Hot Lead, Warm Lead, Cold Lead');
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
                  12 ACTIVE PLATFORM CHANNELS
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1 flex items-center gap-2">
                <Database size={20} className="text-indigo-400" /> Lead Integration &amp; Ingestion Control Center
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Integrate Ad Gateways, B2B Portals, Insert Single Lead, Import CSV/Excel &amp; Manage Custom Columns
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
                onClick={() => setCustomColumnModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Sliders size={14} /> + Custom Column
              </button>
            </div>
          </div>

          {/* Connected Ingestion Platform Channel Cards (12 Platforms) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { title: 'Google Ads', count: '1,450 Ingested', status: 'Auto-Sync Active', bg: 'border-amber-500/30 bg-amber-500/5', color: 'text-amber-400' },
              { title: 'Meta Ads (FB & Insta)', count: '2,890 Ingested', status: 'Webhook Live', bg: 'border-blue-500/30 bg-blue-500/5', color: 'text-blue-400' },
              { title: 'LinkedIn Ads', count: '620 Ingested', status: 'OAuth 2.0 Connected', bg: 'border-cyan-500/30 bg-cyan-500/5', color: 'text-cyan-400' },
              { title: 'Microsoft Ads (Bing)', count: '380 Ingested', status: 'API Connected', bg: 'border-teal-500/30 bg-teal-500/5', color: 'text-teal-400' },
              { title: 'Pinterest Ads', count: '240 Ingested', status: 'Pixel Tag Active', bg: 'border-rose-500/30 bg-rose-500/5', color: 'text-rose-400' },
              { title: 'X (Twitter) Ads', count: '190 Ingested', status: 'API v2 Live', bg: 'border-sky-500/30 bg-sky-500/5', color: 'text-sky-400' },
              { title: 'IndiaMART', count: '1,120 Ingested', status: 'Lead Push Hook', bg: 'border-emerald-500/30 bg-emerald-500/5', color: 'text-emerald-400' },
              { title: 'TradeIndia', count: '890 Ingested', status: 'Instant Alert Sync', bg: 'border-indigo-500/30 bg-indigo-500/5', color: 'text-indigo-400' },
              { title: 'Justdial', count: '740 Ingested', status: 'HTTP Webhook', bg: 'border-orange-500/30 bg-orange-500/5', color: 'text-orange-400' },
              { title: 'Lotwaala', count: '510 Ingested', status: 'B2B Marketplace API', bg: 'border-purple-500/30 bg-purple-500/5', color: 'text-purple-400' },
              { title: 'Website Forms', count: '960 Ingested', status: 'Embed Form Live', bg: 'border-emerald-500/30 bg-emerald-500/5', color: 'text-emerald-400' },
              { title: 'Custom Channel', count: '430 Ingested', status: 'Custom Webhook / API', bg: 'border-slate-700 bg-slate-900/60', color: 'text-slate-300' },
            ].map(ch => (
              <div key={ch.title} className={`p-3 rounded-xl border ${ch.bg} space-y-1 hover:border-slate-600 transition-all`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white truncate">{ch.title}</p>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className={`text-sm font-extrabold ${ch.color}`}>{ch.count}</p>
                <p className="text-[10px] text-muted truncate">{ch.status}</p>
              </div>
            ))}
          </div>

          {/* 📊 Spreadsheet Ingestion & Employee Allocation Audit History Hub */}
          <div className="crm-card p-5 bg-slate-900/90 border-slate-800 rounded-2xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Database size={16} className="text-indigo-400" />
                  📊 Spreadsheet Ingestion &amp; Employee Allocation Audit Log
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time audit log of when &amp; what time spreadsheet files were injected, employee allocations, and pending unassigned sheets.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setImportCsvModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Upload size={13} /> + Import New Sheet
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2 overflow-x-auto">
              {[
                { id: 'ALL', label: `ALL (${webAuditLogs.length})` },
                { id: 'PENDING', label: `⏳ UNASSIGNED PENDING (${webAuditLogs.filter(a => a.status === 'PENDING_ALLOCATION').length})` },
                { id: 'ALLOCATED', label: `✓ COMPLETED ALLOCATIONS (${webAuditLogs.filter(a => a.status === 'ALLOCATED').length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setWebAuditFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all border ${
                    webAuditFilter === tab.id
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Audit Log Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {webAuditLogs
                .filter(item => {
                  if (webAuditFilter === 'PENDING') return item.status === 'PENDING_ALLOCATION';
                  if (webAuditFilter === 'ALLOCATED') return item.status === 'ALLOCATED';
                  return true;
                })
                .map(item => {
                  const isPending = item.status === 'PENDING_ALLOCATION';
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                        isPending
                          ? 'bg-amber-500/5 border-amber-500/40 shadow-lg shadow-amber-500/5 hover:border-amber-500/60'
                          : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => setSelectedWebAuditDetail(item)}
                            className="text-xs font-black text-indigo-400 hover:text-indigo-300 hover:underline truncate flex items-center gap-1.5 transition-all text-left"
                            title="Click to view Assigned To Whom allocation breakdown"
                          >
                            <FileSpreadsheet size={14} className={isPending ? 'text-amber-400' : 'text-indigo-400'} />
                            {item.fileName}
                            <span className="text-[9px] text-indigo-300 no-underline font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">🔍 Assigned To</span>
                          </button>
                          <span
                            onClick={() => setSelectedWebAuditDetail(item)}
                            className={`px-2 py-0.5 text-[9px] font-black rounded-md border uppercase tracking-wider cursor-pointer ${
                              isPending
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isPending ? '⏳ PENDING' : '✓ ALLOCATED ℹ️'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[11px] text-slate-400">
                          <p className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-500" />
                            Injected At: <span className="text-slate-200 font-bold">{item.injectedAt}</span>
                          </p>
                          <p className="flex items-center gap-1">
                            <Zap size={12} className="text-slate-500" />
                            Extracted Size: <span className="text-emerald-400 font-extrabold">{item.leadsCount} Rows</span> • <span className="text-indigo-300 font-extrabold">{item.colsCount || 6} Columns</span>
                          </p>
                          <p className="flex items-center gap-1">
                            <Radio size={12} className="text-slate-500" />
                            Source Platform: <span className="text-sky-300 font-bold">{item.platform}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              document.getElementById('lead-directory-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[10px] flex items-center gap-1 transition-all"
                            title="Open Sheet Editor to preview and edit row/column contents"
                          >
                            <Eye size={12} /> Preview &amp; Edit Sheet
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete sheet allocation record for "${item.fileName}"?\n\nℹ️ 7-Day Retention Notice: Expired sheet allocation history automatically purges after 7 days.`)) {
                                setWebAuditLogs(prev => prev.filter(a => a.id !== item.id));
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-extrabold text-[10px] flex items-center gap-1 transition-all"
                            title="Delete Sheet Allocation record (7-Day retention policy)"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                        <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                          <Clock size={10} /> Auto-Deletes in 7 Days
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Directory Table with Search, Column Manager & Excel Controls */}
          <div id="lead-directory-section" className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database size={15} className="text-indigo-400" />
                  Live Adjustable Lead Directory ({filteredLeadDirectory.length} Leads)
                </h3>
                <p className="text-[10px] text-muted">
                  Use ▲/▼ to shift rows, ◀/▶ to re-order columns. Columns with <span className="text-amber-400 font-bold">*</span> are restricted to Admin &amp; Managers.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setColumnConfigModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Sliders size={13} /> ⚙️ Column Manager &amp; Visibility (* Admin/Mgr)
                </button>

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
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/80 shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-muted uppercase font-bold text-[10px] border-b border-border select-none">
                  <tr>
                    {/* Excel Row Move Column Header */}
                    <th className="p-2.5 text-center text-slate-500 w-16">Row Shift</th>

                    {/* Dynamic Table Columns */}
                    {tableColumns.filter(c => !c.hidden).map((col, cIdx) => (
                      <th
                        key={col.id}
                        style={{
                          width: columnWidths[col.id] ? `${columnWidths[col.id]}px` : 'auto',
                          minWidth: `${columnWidths[col.id] || 110}px`,
                        }}
                        className="p-3 font-extrabold text-slate-200 border-r border-border/40 last:border-0 hover:bg-slate-900/90 transition-all relative group select-none"
                      >
                        <div className="flex items-center justify-between gap-1.5 pr-2">
                          <span className="truncate flex items-center gap-0.5">
                            {col.label}
                            {col.isRestricted && (
                              <span className="text-amber-400 font-black text-xs ml-0.5" title="Restricted to Admin & Manager only">*</span>
                            )}
                          </span>

                          {/* Column Order Left / Right Control Buttons */}
                          <div className="flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded border border-slate-800 flex-shrink-0">
                            <button
                              onClick={() => moveColumnLeft(cIdx)}
                              disabled={cIdx === 0}
                              title="Move Column Left"
                              className="px-1 py-0.2 rounded hover:bg-indigo-600 hover:text-white text-slate-400 disabled:opacity-20 text-[9px] font-bold"
                            >
                              ◀
                            </button>
                            <button
                              onClick={() => moveColumnRight(cIdx)}
                              disabled={cIdx === tableColumns.filter(c => !c.hidden).length - 1}
                              title="Move Column Right"
                              className="px-1 py-0.2 rounded hover:bg-indigo-600 hover:text-white text-slate-400 disabled:opacity-20 text-[9px] font-bold"
                            >
                              ▶
                            </button>
                          </div>
                        </div>

                        {/* ↕️ EXCEL HOLD & DRAG COLUMN DIVIDER LINE RESIZER */}
                        <div
                          onMouseDown={(e) => handleMouseDownResize(e, col.id)}
                          title="Hold & Drag Line to Resize Column Width"
                          className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-20 hover:bg-cyan-400/80 flex items-center justify-center transition-colors group-hover:bg-cyan-500/30 ${resizingColId === col.id ? 'bg-cyan-400 w-3' : ''}`}
                        >
                          <div className="w-[2px] h-full bg-slate-700/80 group-hover:bg-cyan-300" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-slate-900/40">
                  {filteredLeadDirectory.map((lead, rIdx) => (
                    <tr key={lead.id} className="hover:bg-slate-800/60 transition-colors group">
                      {/* Excel Row Up / Down Control Cell */}
                      <td className="p-2 text-center border-r border-border/40">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => moveRowUp(lead.id)}
                            disabled={rIdx === 0}
                            title="Shift Row Up"
                            className="p-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white disabled:opacity-20 text-[9px] font-bold transition-all"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveRowDown(lead.id)}
                            disabled={rIdx === filteredLeadDirectory.length - 1}
                            title="Shift Row Down"
                            className="p-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white disabled:opacity-20 text-[9px] font-bold transition-all"
                          >
                            ▼
                          </button>
                        </div>
                      </td>

                      {/* Dynamic Cell Values based on Column Order & Restrictions */}
                      {tableColumns.filter(c => !c.hidden).map(col => {
                        // Check if column is restricted with '*' and user is NOT Admin or Manager
                        if (col.isRestricted && !isAdminOrManager) {
                          return (
                            <td key={col.id} className="p-3 border-r border-border/40 last:border-0">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                *** Restricted (Admin/Mgr Only)
                              </span>
                            </td>
                          );
                        }

                        // Render Cell Values
                        if (col.id === 'name') {
                          return <td key={col.id} className="p-3 font-bold text-white border-r border-border/40 last:border-0">{lead.name}</td>;
                        }
                        if (col.id === 'email') {
                          return <td key={col.id} className="p-3 text-muted border-r border-border/40 last:border-0">{lead.email}</td>;
                        }
                        if (col.id === 'phone') {
                          return <td key={col.id} className="p-3 text-emerald-400 font-mono font-medium border-r border-border/40 last:border-0">{lead.phone}</td>;
                        }
                        if (col.id === 'company') {
                          return <td key={col.id} className="p-3 text-slate-300 border-r border-border/40 last:border-0">{lead.company}</td>;
                        }
                        if (col.id === 'source') {
                          return (
                            <td key={col.id} className="p-3 border-r border-border/40 last:border-0">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                                {lead.source}
                              </span>
                            </td>
                          );
                        }
                        if (col.id === 'stage') {
                          return (
                            <td key={col.id} className="p-3 border-r border-border/40 last:border-0">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                {lead.stage}
                              </span>
                            </td>
                          );
                        }
                        if (col.id === 'value') {
                          return <td key={col.id} className="p-3 font-bold text-white border-r border-border/40 last:border-0">₹{lead.value.toLocaleString('en-IN')}</td>;
                        }
                        if (col.id === 'assignedRep') {
                          const isLocked = isLeadContactedAndLocked({ status: lead.stage, stage: lead.stage });
                          const isUnassigned = !lead.assignedRep || lead.assignedRep === 'Unassigned' || lead.assignedRep === '—';

                          if (isLocked) {
                            return (
                              <td key={col.id} className="p-3 border-r border-border/40 last:border-0">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800" title="🔒 Lead Assignment Locked: This lead has already been contacted by Sales/TL and cannot be reassigned to anyone else.">
                                  <Lock size={12} className="text-amber-400" />
                                  <span className="font-bold text-slate-300 text-xs">{lead.assignedRep}</span>
                                  <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20">LOCKED</span>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={col.id} className="p-3 border-r border-border/40 last:border-0">
                              <select
                                value={lead.assignedRep || 'Unassigned'}
                                onChange={(e) => {
                                  const newRep = e.target.value;
                                  setLeadDirectory(prev => prev.map(item => item.id === lead.id ? { ...item, assignedRep: newRep } : item));
                                }}
                                className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none transition-all cursor-pointer ${
                                  isUnassigned
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-extrabold animate-pulse'
                                    : 'bg-slate-950 border-slate-700 text-indigo-300 hover:border-indigo-500'
                                }`}
                              >
                                <option value="Unassigned">⚠️ Unassigned</option>
                                <option value="Rajesh Kumar">Rajesh Kumar (Sales Rep)</option>
                                <option value="Priya Sharma">Priya Sharma (TL A)</option>
                                <option value="Rohan Kumar">Rohan Kumar (Sales Exec)</option>
                                <option value="Amit Shah">Amit Shah (Sales Exec)</option>
                                <option value="Neha Gupta">Neha Gupta (Sales Exec)</option>
                              </select>
                            </td>
                          );
                        }

                        // Custom Fields Cell
                        return (
                          <td key={col.id} className="p-3 text-indigo-300 font-medium border-r border-border/40 last:border-0">
                            {lead.customFields[col.id] || '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 📊 LEAD INCOMING HISTORY & DATA SOURCE AUDIT CENTER          */}
        {/* ============================================================ */}
        <div className="crm-card p-6 border-purple-500/30 bg-slate-950/80 space-y-4 rounded-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AUDIT & INGESTION LOGS
              </span>
              <h3 className="font-extrabold text-base text-white mt-1 flex items-center gap-2">
                <ClipboardList size={18} className="text-purple-400" /> Lead Incoming History & Data Source Audit
              </h3>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold flex-wrap">
              <button
                onClick={() => setHistoryActiveTab('DATEWISE')}
                className={`px-3 py-1.5 rounded-lg transition-all ${historyActiveTab === 'DATEWISE' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                📅 Date-Wise Total Leads ({datewiseAnalytics.reduce((a, b) => a + b.totalLeads, 0)})
              </button>
              <button
                onClick={() => setHistoryActiveTab('FILE_UPLOADS')}
                className={`px-3 py-1.5 rounded-lg transition-all ${historyActiveTab === 'FILE_UPLOADS' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                📄 File Upload History ({fileUploadHistory.length})
              </button>
              <button
                onClick={() => setHistoryActiveTab('GSHEETS_SYNC')}
                className={`px-3 py-1.5 rounded-lg transition-all ${historyActiveTab === 'GSHEETS_SYNC' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                🌐 Webhook &amp; Gateway Logs ({googleSheetHistory.length})
              </button>
            </div>
          </div>

          {/* TAB 1: DATEWISE ANALYTICS BREAKDOWN */}
          {historyActiveTab === 'DATEWISE' && (
            <div className="overflow-x-auto rounded-xl border border-border bg-slate-900/60">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3">Date Window</th>
                    <th className="p-3 text-cyan-300">Total Leads Ingested</th>
                    <th className="p-3 text-emerald-400">Meta &amp; Google Ads</th>
                    <th className="p-3 text-purple-300">File Uploads (CSV/Excel)</th>
                    <th className="p-3 text-blue-400">B2B Portals (IndiaMART/TradeIndia)</th>
                    <th className="p-3 text-amber-400">Microsoft &amp; LinkedIn Ads</th>
                    <th className="p-3 text-emerald-300">Website &amp; Custom Webhooks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {datewiseAnalytics.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60">
                      <td className="p-3 font-extrabold text-white">{row.date}</td>
                      <td className="p-3 font-mono font-black text-cyan-300">{row.totalLeads} Leads</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">+{row.googleSheets}</td>
                      <td className="p-3 font-mono text-purple-300 font-bold">+{row.fileUploads}</td>
                      <td className="p-3 font-mono text-blue-400 font-bold">+{row.facebookAds}</td>
                      <td className="p-3 font-mono text-red-400 font-bold">+{row.googleAds}</td>
                      <td className="p-3 font-mono text-emerald-300 font-bold">+{row.whatsAppDirect}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: FILE UPLOAD HISTORY LOG */}
          {historyActiveTab === 'FILE_UPLOADS' && (
            <div className="overflow-x-auto rounded-xl border border-border bg-slate-900/60">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3">Uploaded File Name</th>
                    <th className="p-3">File Size</th>
                    <th className="p-3 text-purple-300">Total Leads Ingested</th>
                    <th className="p-3">Upload Timestamp</th>
                    <th className="p-3">Uploaded By User</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {fileUploadHistory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-900/60">
                      <td className="p-3 font-extrabold text-white flex items-center gap-1.5">
                        <FileSpreadsheet size={14} className="text-purple-400" /> {item.fileName}
                      </td>
                      <td className="p-3 font-mono text-slate-400">{item.fileSize}</td>
                      <td className="p-3 font-mono font-extrabold text-purple-300">+{item.leadsCount} Leads</td>
                      <td className="p-3 font-mono text-muted text-[11px]">{item.uploadedAt}</td>
                      <td className="p-3 font-semibold text-slate-300">{item.uploadedBy}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: GOOGLE SHEETS INTEGRATION HISTORY */}
          {historyActiveTab === 'GSHEETS_SYNC' && (
            <div className="overflow-x-auto rounded-xl border border-border bg-slate-900/60">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3">Google Sheet Workbook</th>
                    <th className="p-3">Connected Tab</th>
                    <th className="p-3">Cell Range Mapped</th>
                    <th className="p-3 text-emerald-400">Total Ingested Leads</th>
                    <th className="p-3">Last Sync Timestamp</th>
                    <th className="p-3 text-right">Sync Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {googleSheetHistory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-900/60">
                      <td className="p-3 font-extrabold text-emerald-300">
                        <a href={item.spreadsheetUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1.5">
                          <FileSpreadsheet size={14} className="text-emerald-400" /> {item.spreadsheetTitle} ↗
                        </a>
                      </td>
                      <td className="p-3 font-mono text-purple-300 font-bold">{item.sheetTab}</td>
                      <td className="p-3 font-mono text-cyan-300 font-bold">{item.rangeMapped}</td>
                      <td className="p-3 font-mono font-black text-emerald-400">{item.totalLeadsIngested.toLocaleString()} Leads</td>
                      <td className="p-3 font-mono text-muted text-[11px]">{item.lastSyncAt}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit ml-auto">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

        {/* ------------------------------------------------------------ */}
        {/* WIDGET 4: AI, WHATSAPP & EMAIL MARKETING MODULES             */}
        {/* ------------------------------------------------------------ */}
        <div className="crm-card p-5 space-y-4 border border-emerald-500/40 bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 rounded-2xl shadow-xl mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-xs border border-emerald-500/30">
                W4
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Bot size={16} className="text-emerald-400" /> WIDGET 4: AI, WHATSAPP &amp; EMAIL MARKETING MODULES
                </h3>
                <p className="text-[11px] text-muted">Configure Communication Gateways &amp; AI Operation Path Mode</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              Lead Pipeline Active
            </span>
          </div>

          {/* Path Mode Toggle */}
          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
              Operation Path Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPathMode('PAID_AI')}
                className={`p-3.5 rounded-xl border text-left transition-all ${pathMode === 'PAID_AI' ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/50' : 'bg-background border-border text-muted hover:text-white'}`}
              >
                <p className="font-bold text-xs flex items-center gap-1.5">
                  <Bot size={14} className="text-emerald-400" /> Paid AI &amp; Automations
                </p>
                <p className="text-[10px] text-muted mt-0.5">Automated AI Lead Scoring, Instant Auto-Responders &amp; Webhook Triggers</p>
              </button>

              <button
                type="button"
                onClick={() => setPathMode('MANUAL_DIALER')}
                className={`p-3.5 rounded-xl border text-left transition-all ${pathMode === 'MANUAL_DIALER' ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/50' : 'bg-background border-border text-muted hover:text-white'}`}
              >
                <p className="font-bold text-xs flex items-center gap-1.5">
                  <PhoneCall size={14} className="text-indigo-400" /> Manual Dialer
                </p>
                <p className="text-[10px] text-muted mt-0.5">Standard Telephony Calling, Manual Follow-ups &amp; Rep Assignment</p>
              </button>
            </div>
          </div>

          {/* WhatsApp Co-Existence Gateway & Email Campaign Delegation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-background/80 border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <MessageSquare size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-white">WhatsApp Co-Existence Gateway</p>
                  <p className="text-[10px] text-muted">Simultaneous Official Cloud API + Web Session Status</p>
                </div>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold ${whatsAppConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'}`}>
                {whatsAppConnected ? 'ONLINE · CONNECTED' : 'OFFLINE'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-background/80 border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <Mail size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Delegate Email Campaigns to Managers</p>
                  <p className="text-[10px] text-muted">Allows department managers to broadcast email campaigns directly</p>
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
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-muted block mb-1 font-semibold">Company</label>
                  <input value={newLeadCompany} onChange={e => setNewLeadCompany(e.target.value)} placeholder="TechCorp Ltd" className="crm-input w-full" />
                </div>
                <div>
                  <label className="text-muted block mb-1 font-semibold">Value (₹)</label>
                  <input type="number" value={newLeadValue} onChange={e => setNewLeadValue(e.target.value)} className="crm-input w-full" />
                </div>
                <div>
                  <label className="text-muted block mb-1 font-semibold">Source Platform *</label>
                  <select value={newLeadSource} onChange={e => setNewLeadSource(e.target.value)} className="crm-input w-full font-bold text-xs">
                    <option value="Google Ads">Google Ads</option>
                    <option value="Meta Ads (FB & Insta)">Meta Ads (Facebook & Instagram)</option>
                    <option value="LinkedIn Ads">LinkedIn Ads</option>
                    <option value="Microsoft Ads (Bing)">Microsoft Ads (Bing)</option>
                    <option value="Pinterest Ads">Pinterest Ads</option>
                    <option value="X (Twitter) Ads">X (Twitter) Ads</option>
                    <option value="IndiaMART">IndiaMART</option>
                    <option value="TradeIndia">TradeIndia</option>
                    <option value="Justdial">Justdial</option>
                    <option value="Lotwaala">Lotwaala</option>
                    <option value="Website Forms">Website Forms</option>
                    <option value="Custom Channel">Custom Channel</option>
                  </select>
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
                <label className="text-muted block mb-1 font-semibold">Column Label *</label>
                <input value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="e.g. Lead Rating, GST Number, City, Budget Band" className="crm-input w-full" autoFocus />
              </div>
              <div>
                <label className="text-muted block mb-1 font-semibold">Data Type</label>
                <select value={newColType} onChange={e => setNewColType(e.target.value as any)} className="crm-input w-full font-semibold">
                  <option value="TEXT">Text String</option>
                  <option value="NUMBER">Numeric Value</option>
                  <option value="SELECT">Dropdown Options</option>
                </select>
              </div>

              {/* Dropdown Options Builder when Data Type = SELECT */}
              {newColType === 'SELECT' && (
                <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-cyan-500/40 animate-fade-in">
                  <label className="text-cyan-400 font-bold block text-xs flex items-center gap-1.5">
                    <Sliders size={13} /> Dropdown Options (Comma-Separated) *
                  </label>
                  <input
                    value={newColOptionsStr}
                    onChange={e => setNewColOptionsStr(e.target.value)}
                    placeholder="e.g. Hot Lead, Warm Lead, Cold Lead"
                    className="crm-input w-full text-xs font-semibold text-white bg-slate-950"
                  />
                  {newColOptionsStr.trim() && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-muted font-semibold">Options Preview:</span>
                      {newColOptionsStr.split(',').map(s => s.trim()).filter(Boolean).map((opt, i) => (
                        <span key={i} className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => setCustomColumnModalOpen(false)} className="btn-secondary flex-1 py-2 text-xs">Cancel</button>
                <button onClick={handleAddCustomColumn} disabled={!newColName.trim()} className="btn-primary flex-1 py-2 text-xs gap-1.5 disabled:opacity-40"><Plus size={13} /> Add Column</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV / Excel Modal */}
      {importCsvModalOpen && (
        <FileImportEngineModal
          isOpen={importCsvModalOpen}
          onClose={() => setImportCsvModalOpen(false)}
          onImportLeads={(leads, audit) => {
            setLeadDirectory(prev => {
              const newLeads = leads.map((lead, i) => ({
                ...lead,
                id: `lead_${Date.now()}_${i}`,
              }));
              return [...newLeads, ...prev];
            });
            const newAudit: FileUploadHistoryItem = {
              id: `file_hist_${Date.now()}`,
              fileName: audit.filename,
              fileSize: audit.fileSize || '—',
              uploadedAt: audit.date,
              leadsCount: audit.count,
              uploadedBy: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Admin',
              status: 'SUCCESS' as const,
            };
            setFileUploadHistory(prev => [newAudit, ...prev]);
          }}
        />
      )}

      {/* ⚙️ Column & Excel Manager Modal */}
      {columnConfigModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="crm-card max-w-xl w-full p-6 animate-scale-in space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders size={16} className="text-indigo-400" /> ⚙️ Lead Directory Column &amp; Visibility Manager
                </h3>
                <p className="text-[10px] text-muted mt-0.5">
                  Re-order columns, toggle visibility &amp; set <span className="text-amber-400 font-bold">* Admin &amp; Manager Only</span> restriction.
                </p>
              </div>
              <button onClick={() => setColumnConfigModalOpen(false)} className="p-1 rounded text-muted hover:text-white"><X size={16} /></button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold uppercase text-muted px-2 py-1 bg-slate-900 rounded-lg">
                <span className="col-span-2 text-center">Order</span>
                <span className="col-span-4">Column Name</span>
                <span className="col-span-3 text-center">Visibility</span>
                <span className="col-span-3 text-center">Restricted (*)</span>
              </div>

              {tableColumns.map((col, idx) => (
                <div key={col.id} className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <button
                      onClick={() => moveColumnLeft(idx)}
                      disabled={idx === 0}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 disabled:opacity-20 text-[10px] font-bold"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveColumnRight(idx)}
                      disabled={idx === tableColumns.length - 1}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 disabled:opacity-20 text-[10px] font-bold"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="col-span-4 font-bold text-white flex items-center gap-1 truncate">
                    <span>{col.label}</span>
                    {col.isRestricted && <span className="text-amber-400 font-black text-xs">*</span>}
                  </div>

                  <div className="col-span-3 flex justify-center">
                    <button
                      onClick={() => setTableColumns(prev => prev.map(c => c.id === col.id ? { ...c, hidden: !c.hidden } : c))}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${!col.hidden ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                    >
                      {!col.hidden ? '👁️ Shown' : '🙈 Hidden'}
                    </button>
                  </div>

                  <div className="col-span-3 flex justify-center">
                    <button
                      onClick={() => setTableColumns(prev => prev.map(c => c.id === col.id ? { ...c, isRestricted: !c.isRestricted } : c))}
                      className={`px-2.5 py-1 rounded text-[10px] font-extrabold transition-all ${col.isRestricted ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                    >
                      {col.isRestricted ? '⭐ Admin/Mgr (*)' : '🌐 Public'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button onClick={() => setColumnConfigModalOpen(false)} className="btn-primary px-5 py-2 text-xs">Done &amp; Save Table Layout</button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Sheet Allocation Modal */}
      {pendingAllocationSheet.isOpen && (
        <LeadAllocationModal
          isOpen={pendingAllocationSheet.isOpen}
          onClose={() => setPendingAllocationSheet({ isOpen: false, fileName: '', leadsCount: 0 })}
          totalLeadsCount={pendingAllocationSheet.leadsCount}
          fileName={pendingAllocationSheet.fileName}
          onPreviewSheet={() => {
            setPendingAllocationSheet({ isOpen: false, fileName: '', leadsCount: 0 });
            setTimeout(() => {
              document.getElementById('lead-directory-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
        />
      )}
      {/* Web Sheet Audit Allocation Breakdown Modal */}
      {selectedWebAuditDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="crm-card bg-slate-900 border border-slate-700 max-w-md w-full p-5 rounded-2xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-indigo-400" />
                  📄 Sheet Ingestion &amp; Allocation Audit
                </h3>
                <p className="text-[11px] text-slate-400">Detailed employee allocation breakdown &amp; dimensions</p>
              </div>
              <button
                onClick={() => setSelectedWebAuditDetail(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <p className="font-extrabold text-indigo-300 text-sm flex items-center gap-1.5">
                  <FileSpreadsheet size={15} /> {selectedWebAuditDetail.fileName}
                </p>
                <p className="text-slate-400 flex items-center gap-1">
                  <Clock size={13} className="text-slate-500" />
                  Date &amp; Time of Lead Import: <span className="text-slate-200 font-bold">{selectedWebAuditDetail.injectedAt}</span>
                </p>
                <p className="text-slate-400 flex items-center gap-1">
                  <Zap size={13} className="text-slate-500" />
                  No. of Rows &amp; Columns Extracted: <span className="text-emerald-400 font-extrabold">{selectedWebAuditDetail.leadsCount} Rows</span> • <span className="text-indigo-300 font-extrabold">{selectedWebAuditDetail.colsCount || 6} Columns</span>
                </p>
                <p className="text-slate-400 flex items-center gap-1">
                  <Radio size={13} className="text-slate-500" />
                  Source Platform: <span className="text-sky-300 font-bold">{selectedWebAuditDetail.platform}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-1.5">
                <span className="text-xs font-extrabold text-indigo-300 block">👤 Assigned To Whom (Employee Allocation):</span>
                {selectedWebAuditDetail.status === 'PENDING_ALLOCATION' ? (
                  <p className="text-xs font-bold text-amber-400">
                    ⚠️ Unassigned / Pending Allocation. Click 'Allocate Leads Now' on the card to assign sales reps.
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                    {selectedWebAuditDetail.allocationSummary || 'Assigned to sales reps upon spreadsheet ingestion.'}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedWebAuditDetail(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
