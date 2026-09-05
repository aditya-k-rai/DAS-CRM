'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Users, Shield, Zap, DollarSign, Tag, Check, X,
  Plus, Trash2, Edit2, Key, CheckCircle2, MessageSquare, Mail, RefreshCw, QrCode, CreditCard,
  Ban, Lock, Unlock, TrendingUp, UserX, UserCheck, Eye, ChevronRight, Calendar, Sparkles, Filter, Layers, Clock, PhoneCall
} from 'lucide-react';
import { useAuth, CompanySubscription, PlanType } from '@/context/AuthContext';

interface CompanyRecord {
  id: string;
  name: string;
  domain?: string;
  adminName: string;
  adminEmail: string;
  registrationKey: string;
  plan: PlanType;
  trialDaysLeft: number;
  isExpired: boolean;
  seatsAllocated: number;
  seatsUsed: number;
  totalUsersCount: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  isActive: boolean;
  createdAt: string;
  expiryDate: string;
  whatsappUsed: number;
  whatsappLimit: number;
}

interface CompanyEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  keyUsed: string;
}

interface KeyRecord {
  id: string;
  key: string;
  companyName: string;
  planTier: PlanType;
  memberLimit: number;
  validityDays: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
  qrCodeDataUrl?: string;
}

interface UpgradeRequest {
  id: string;
  companyName: string;
  requestedPlan: string;
  amountInr: number;
  razorpayOrderId: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

interface WhatsAppDailyLog {
  date: string;
  messagesSent: number;
  deliveryRate: number;
  activeChats: number;
}

const INITIAL_COMPANIES: CompanyRecord[] = [
  {
    id: 'comp_acme',
    name: 'Acme Sales Solutions',
    adminName: 'Vikram Singh',
    adminEmail: 'vikram.admin@acme.com',
    registrationKey: 'ACME-KX-7421',
    plan: 'FREE_TRIAL',
    trialDaysLeft: 30,
    isExpired: false,
    seatsAllocated: 10,
    seatsUsed: 6,
    totalUsersCount: 11, // 6 Assigned + 5 Unassigned
    totalLeads: 142,
    convertedLeads: 38,
    conversionRate: 26.7,
    isActive: true,
    createdAt: '2026-08-01',
    expiryDate: '2026-09-30',
    whatsappUsed: 0,
    whatsappLimit: 0,
  },
  {
    id: 'comp_growth',
    name: 'NextGen Growth Technologies',
    adminName: 'Rohan Verma',
    adminEmail: 'rohan.admin@nextgen.com',
    registrationKey: 'NGEN-GR-2041',
    plan: 'GROWTH',
    trialDaysLeft: 0,
    isExpired: false,
    seatsAllocated: 20,
    seatsUsed: 14,
    totalUsersCount: 16,
    totalLeads: 85,
    convertedLeads: 22,
    conversionRate: 25.8,
    isActive: true,
    createdAt: '2026-07-15',
    expiryDate: '2026-12-31',
    whatsappUsed: 0,
    whatsappLimit: 0,
  },
  {
    id: 'comp_business',
    name: 'Apex Business Solutions',
    adminName: 'Sunita Sharma',
    adminEmail: 'sunita.admin@apexcorp.com',
    registrationKey: 'APEX-BZ-5088',
    plan: 'BUSINESS',
    trialDaysLeft: 0,
    isExpired: false,
    seatsAllocated: 50,
    seatsUsed: 38,
    totalUsersCount: 42,
    totalLeads: 320,
    convertedLeads: 84,
    conversionRate: 26.2,
    isActive: true,
    createdAt: '2026-06-01',
    expiryDate: '2026-12-31',
    whatsappUsed: 28400,
    whatsappLimit: 100000,
  },
  {
    id: 'comp_enterprise',
    name: 'Global Enterprise Holdings',
    adminName: 'Amitabh Mehta',
    adminEmail: 'admin@globalholdings.com',
    registrationKey: 'GLBL-EP-1002',
    plan: 'ENTERPRISE',
    trialDaysLeft: 0,
    isExpired: false,
    seatsAllocated: 100,
    seatsUsed: 78,
    totalUsersCount: 85,
    totalLeads: 890,
    convertedLeads: 245,
    conversionRate: 27.5,
    isActive: true,
    createdAt: '2026-05-01',
    expiryDate: '2027-05-01',
    whatsappUsed: 94200,
    whatsappLimit: 500000,
  },
];

const INITIAL_KEYS: KeyRecord[] = [
  {
    id: 'key_1',
    key: 'ACME-KX-7421',
    companyName: 'Acme Sales Solutions',
    planTier: 'FREE_TRIAL',
    memberLimit: 10,
    validityDays: 30,
    status: 'ACTIVE',
    expiresAt: '2026-09-30',
    createdAt: '2026-08-01',
  },
  {
    id: 'key_2',
    key: 'NGEN-GR-2041',
    companyName: 'NextGen Growth Technologies',
    planTier: 'GROWTH',
    memberLimit: 20,
    validityDays: 365,
    status: 'ACTIVE',
    expiresAt: '2026-12-31',
    createdAt: '2026-07-15',
  },
  {
    id: 'key_3',
    key: 'APEX-BZ-5088',
    companyName: 'Apex Business Solutions',
    planTier: 'BUSINESS',
    memberLimit: 50,
    validityDays: 365,
    status: 'ACTIVE',
    expiresAt: '2026-12-31',
    createdAt: '2026-06-01',
  },
  {
    id: 'key_4',
    key: 'GLBL-EP-1002',
    companyName: 'Global Enterprise Holdings',
    planTier: 'ENTERPRISE',
    memberLimit: 100,
    validityDays: 365,
    status: 'ACTIVE',
    expiresAt: '2027-05-01',
    createdAt: '2026-05-01',
  },
];

const INITIAL_UPGRADE_REQUESTS: UpgradeRequest[] = [];

export function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<CompanyRecord[]>(INITIAL_COMPANIES);
  const [keysList, setKeysList] = useState<KeyRecord[]>(INITIAL_KEYS);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>(INITIAL_UPGRADE_REQUESTS);
  
  // Navigation Section Selector
  const [activeSection, setActiveSection] = useState<
    'overview' | 'keys' | 'edit_modal' | 'templates' | 'whatsapp' | 'pending' | 'employees'
  >('overview');

  // Active Template Sub-Tab
  const [templateTab, setTemplateTab] = useState<'funnel' | 'whatsapp' | 'email'>('funnel');

  // Company Details Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState<PlanType>('FREE_TRIAL');
  const [editSeats, setEditSeats] = useState(10);
  const [editTrialDuration, setEditTrialDuration] = useState(30); // 15 to 40 days
  const [editExpiryDate, setEditExpiryDate] = useState('');

  // WhatsApp Date-Wise Chat Log Modal
  const [chatLogModalOpen, setChatLogModalOpen] = useState(false);
  const [chatLogCompany, setChatLogCompany] = useState<CompanyRecord | null>(null);
  const [dailyLogs, setDailyLogs] = useState<WhatsAppDailyLog[]>([]);

  // Key Generation Modal
  const [genKeyModalOpen, setGenKeyModalOpen] = useState(false);
  const [genCompanyName, setGenCompanyName] = useState('');
  const [genPlan, setGenPlan] = useState<PlanType>('FREE_TRIAL');
  const [genSeats, setGenSeats] = useState(10);
  const [genValidityDays, setGenValidityDays] = useState(30);

  const handleGenPlanChange = (newPlan: PlanType) => {
    setGenPlan(newPlan);
    if (newPlan === 'FREE_TRIAL') {
      setGenSeats(10);
      setGenValidityDays(30);
    } else if (newPlan === 'GROWTH') {
      setGenSeats(20);
      setGenValidityDays(30);
    } else if (newPlan === 'BUSINESS') {
      setGenSeats(50);
      setGenValidityDays(30);
    } else if (newPlan === 'ENTERPRISE') {
      setGenSeats(100);
      setGenValidityDays(365);
    }
  };

  const { updateSubscription } = useAuth();

  // Metrics Calculations
  const totalCompanies = companies.length;
  const totalUsers = companies.reduce((acc, c) => acc + c.totalUsersCount, 0);
  const activeCompanies = companies.filter(c => c.isActive).length;
  const activeUsers = companies.filter(c => c.isActive).reduce((acc, c) => acc + c.seatsUsed, 0);
  const activeFreeTrials = companies.filter(c => c.plan === 'FREE_TRIAL').length;
  const activePaidPlans = companies.filter(c => c.plan !== 'FREE_TRIAL').length;
  const pendingRequestsCount = upgradeRequests.filter(r => r.status === 'PENDING_APPROVAL').length;

  // Plan change in edit modal
  const handleEditPlanChange = (newPlan: PlanType) => {
    setEditPlan(newPlan);
    if (newPlan === 'FREE_TRIAL') {
      setEditSeats(10);
      const expiry = new Date(Date.now() + editTrialDuration * 86400000).toISOString().split('T')[0];
      setEditExpiryDate(expiry);
    } else if (newPlan === 'GROWTH') {
      setEditSeats(20);
      const expiry = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      setEditExpiryDate(expiry);
    } else if (newPlan === 'BUSINESS' || newPlan === 'PRO' || newPlan === 'PRO_50') {
      setEditSeats(50);
      const expiry = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      setEditExpiryDate(expiry);
    } else if (newPlan === 'ENTERPRISE' || newPlan === 'PRO_MAX' || newPlan === 'MAX') {
      setEditSeats(100);
      const expiry = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
      setEditExpiryDate(expiry);
    }
  };

  // Adjust trial duration between 15 and 40 days
  const handleTrialDurationChange = (days: number) => {
    const clamped = Math.max(15, Math.min(40, days));
    setEditTrialDuration(clamped);
    const expiry = new Date(Date.now() + clamped * 86400000).toISOString().split('T')[0];
    setEditExpiryDate(expiry);
  };

  // Open Edit Modal for a specific company
  const handleOpenEditModal = (comp: CompanyRecord) => {
    setEditingCompany(comp);
    setEditName(comp.name);
    setEditPlan(comp.plan);
    const defaultSeats = comp.seatsAllocated || (comp.plan === 'FREE_TRIAL' ? 10 : comp.plan === 'GROWTH' ? 20 : comp.plan === 'BUSINESS' ? 50 : 100);
    setEditSeats(defaultSeats);
    const defaultTrialDays = comp.trialDaysLeft > 0 ? Math.min(40, Math.max(15, comp.trialDaysLeft)) : 30;
    setEditTrialDuration(defaultTrialDays);
    setEditExpiryDate(comp.expiryDate || new Date(Date.now() + defaultTrialDays * 86400000).toISOString().split('T')[0]);
    setEditModalOpen(true);
  };

  // Save Company Edit Changes
  const handleSaveCompanyEdit = () => {
    if (!editingCompany) return;
    setCompanies(prev =>
      prev.map(c =>
        c.id === editingCompany.id
          ? {
              ...c,
              name: editName,
              plan: editPlan,
              seatsAllocated: editSeats,
              trialDaysLeft: editPlan === 'FREE_TRIAL' ? editTrialDuration : 0,
              expiryDate: editExpiryDate,
            }
          : c
      )
    );
    setKeysList(prev =>
      prev.map(k =>
        k.companyName === editingCompany.name
          ? { ...k, companyName: editName, planTier: editPlan, memberLimit: editSeats, expiresAt: editExpiryDate }
          : k
      )
    );
    if (editingCompany.id === 'comp_acme' || editingCompany.name === 'Acme Sales Solutions') {
      updateSubscription({
        planType: editPlan,
        userSeatsAllocated: editSeats,
        trialDaysLeft: editPlan === 'FREE_TRIAL' ? editTrialDuration : 0,
      });
    }
    setEditModalOpen(false);
  };

  // Open WhatsApp Date-Wise Chat Log Modal
  const handleOpenChatLogModal = (comp: CompanyRecord) => {
    setChatLogCompany(comp);
    setDailyLogs([
      { date: '2026-08-14 (Today)', messagesSent: Math.floor(comp.whatsappUsed * 0.12), deliveryRate: 98.4, activeChats: 142 },
      { date: '2026-08-13 (Yesterday)', messagesSent: Math.floor(comp.whatsappUsed * 0.18), deliveryRate: 97.8, activeChats: 210 },
      { date: '2026-08-12', messagesSent: Math.floor(comp.whatsappUsed * 0.15), deliveryRate: 99.1, activeChats: 185 },
      { date: '2026-08-11', messagesSent: Math.floor(comp.whatsappUsed * 0.14), deliveryRate: 96.5, activeChats: 164 },
      { date: '2026-08-10', messagesSent: Math.floor(comp.whatsappUsed * 0.16), deliveryRate: 98.9, activeChats: 195 },
    ]);
    setChatLogModalOpen(true);
  };

  // Generate Key Handler
  const handleGenerateKey = () => {
    if (!genCompanyName.trim()) return;
    const firstWord = genCompanyName.trim().split(/\s+/)[0]?.toUpperCase() || 'COMP';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const alpha = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const digits = Math.floor(1000 + Math.random() * 9000).toString();
    const newKey = `${firstWord}-${alpha}-${digits}`;

    const newRecord: KeyRecord = {
      id: `key_${Date.now()}`,
      key: newKey,
      companyName: genCompanyName,
      planTier: genPlan,
      memberLimit: genSeats,
      validityDays: genValidityDays,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + genValidityDays * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setKeysList([newRecord, ...keysList]);
    setGenKeyModalOpen(false);
    setGenCompanyName('');
  };

  const handleApproveUpgrade = (reqId: string) => {
    setUpgradeRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'APPROVED' } : r));
    updateSubscription({
      planType: 'PRO',
      features: { whatsApp: true, emailAutomation: true, aiLeadScoring: true, customSalaryBuilder: true, exportCSV: true },
    });
  };

  const handleRejectUpgrade = (reqId: string) => {
    setUpgradeRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'REJECTED' } : r));
  };

  const handleToggleBlockCompany = (comp: CompanyRecord) => {
    setCompanies(prev => prev.map(c => c.id === comp.id ? { ...c, isActive: !c.isActive } : c));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── TOP BANNER & SECTION TABS ─────────────────────────────────────────────── */}
      <div className="crm-card p-6 border-l-4 border-l-cyan-500 bg-card shadow-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-xl">
              SA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">Super Admin Dashboard</h1>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PLATFORM CONTROL HUB
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">Control hub for managing company keys, subscriptions, WhatsApp Cloud usage, templates, and approvals.</p>
            </div>
          </div>

          <button
            onClick={() => setGenKeyModalOpen(true)}
            className="btn-primary text-xs px-4 py-2.5 gap-2 flex items-center shadow-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold"
          >
            <Key size={15} /> Generate New Registration Key
          </button>
        </div>

        {/* Core 7 Sections Navigation Bar */}
        <div className="flex items-center gap-2 pt-6 mt-6 border-t border-border/60 overflow-x-auto">
          {[
            { id: 'overview', label: '1. Dashboard Metrics', icon: TrendingUp },
            { id: 'keys', label: '2. Keys & Companies', icon: Key },
            { id: 'templates', label: '4. System Templates', icon: Layers },
            { id: 'whatsapp', label: '5. WhatsApp Cloud Uses', icon: MessageSquare },
            { id: 'pending', label: '6. Pending Approvals', badge: pendingRequestsCount, icon: Clock },
            { id: 'employees', label: '7. Companies & Staff', icon: Users },
          ].map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                activeSection === sec.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg'
                  : 'bg-background/60 text-muted hover:text-white border border-border/50'
              }`}
            >
              <sec.icon size={14} />
              <span>{sec.label}</span>
              {sec.badge && sec.badge > 0 ? (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center">
                  {sec.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* ── FEATURE 1: DASHBOARD METRICS BANNER (CYAN PILL CARDS) ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Companies & Users */}
        <div className="crm-card p-5 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-card to-card relative overflow-hidden group hover:border-cyan-500/60 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">Number Of Companies & Users</p>
              <h3 className="text-3xl font-black text-white mt-1">{totalCompanies} <span className="text-base font-normal text-muted">Companies</span></h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-500/30">
              <Building2 size={20} />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border/40">
            <span>Total Registered Accounts:</span>
            <strong className="text-white font-mono font-bold">{totalUsers} Users</strong>
          </div>
        </div>

        {/* Card 2: Active Companies & Users */}
        <div className="crm-card p-5 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-card to-card relative overflow-hidden group hover:border-emerald-500/60 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Active Companies & Users</p>
              <h3 className="text-3xl font-black text-emerald-400 mt-1">{activeCompanies} <span className="text-base font-normal text-muted">Active Orgs</span></h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border/40">
            <span>Active Active Users:</span>
            <strong className="text-emerald-300 font-mono font-bold">{activeUsers} Users</strong>
          </div>
        </div>

        {/* Card 3: Active Free Trials & Paid Plans */}
        <div className="crm-card p-5 border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-card to-card relative overflow-hidden group hover:border-purple-500/60 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Active Free Trials & Plans</p>
              <h3 className="text-3xl font-black text-white mt-1">{activeFreeTrials} <span className="text-sm font-normal text-amber-400 font-bold">Trials</span></h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border/40">
            <span>Paid Subscriptions:</span>
            <strong className="text-purple-300 font-mono font-bold">{activePaidPlans} Paid Plans</strong>
          </div>
        </div>

        {/* Card 4: Number of Pending Requests */}
        <div className="crm-card p-5 border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-card to-card relative overflow-hidden group hover:border-amber-500/60 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Number of Pending Requests</p>
              <h3 className="text-3xl font-black text-amber-400 mt-1">{pendingRequestsCount} <span className="text-base font-normal text-muted">Pending</span></h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <Clock size={20} />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border/40">
            <span>Awaiting Approval:</span>
            <button
              onClick={() => setActiveSection('pending')}
              className="text-amber-400 font-bold hover:underline"
            >
              Review Requests →
            </button>
          </div>
        </div>
      </div>

      {/* ── FEATURE 2: KEYS AND THEIR COMPANIES TABLE ───────────────────────────── */}
      {(activeSection === 'overview' || activeSection === 'keys') && (
        <div className="crm-card p-0 overflow-hidden shadow-2xl border border-indigo-500/30">
          <div className="p-5 border-b flex justify-between items-center flex-wrap gap-4 bg-card" style={{ borderColor: 'rgb(var(--border))' }}>
            <div>
              <div className="flex items-center gap-2">
                <Key size={18} className="text-cyan-400" />
                <h2 className="font-extrabold text-lg text-white">Keys and Their Companies</h2>
              </div>
              <p className="text-xs text-muted mt-0.5">Registration key registry mapped to companies, plan tiers, expiry dates, and seat quotas.</p>
            </div>

            <button
              onClick={() => setGenKeyModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Company Key
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="crm-table w-full">
              <thead>
                <tr>
                  <th>Keys</th>
                  <th>Company Name</th>
                  <th>Plan</th>
                  <th>Expiry Date</th>
                  <th>No of Users</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(comp => (
                  <tr key={comp.id} className="hover:bg-card/60 transition-colors">
                    <td>
                      <span className="font-mono font-bold text-xs text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/30">
                        {comp.registrationKey}
                      </span>
                    </td>
                    <td>
                      <p className="font-bold text-sm text-white">{comp.name}</p>
                      <p className="text-[11px] text-muted">{comp.adminEmail}</p>
                    </td>
                    <td>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-extrabold ${
                        comp.plan === 'FREE_TRIAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        comp.plan === 'PRO_MAX' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {comp.plan.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="text-xs">
                        <p className="font-mono text-white font-semibold">{comp.expiryDate}</p>
                        <p className="text-[10px] text-muted">{comp.trialDaysLeft > 0 ? `${comp.trialDaysLeft} days trial left` : 'Subscription Active'}</p>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-bold text-white">
                        {comp.seatsUsed} / {comp.seatsAllocated} Users
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleOpenEditModal(comp)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-md transition-all"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FEATURE 4: SYSTEM TEMPLATES HUB (LEAD FUNNEL, WHATSAPP, EMAIL) ────── */}
      {(activeSection === 'overview' || activeSection === 'templates') && (
        <div className="crm-card space-y-6 border border-purple-500/30">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-purple-400" />
                <h2 className="font-extrabold text-lg text-white">System Templates</h2>
              </div>
              <p className="text-xs text-muted mt-0.5">Pre-configured platform defaults for Lead Funnels, WhatsApp Cloud messages, and Email templates.</p>
            </div>

            {/* Template Sub-Tabs */}
            <div className="flex gap-2 p-1 bg-background rounded-2xl border border-border">
              <button
                onClick={() => setTemplateTab('funnel')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  templateTab === 'funnel' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-muted hover:text-white'
                }`}
              >
                Lead Funnel Templates
              </button>
              <button
                onClick={() => setTemplateTab('whatsapp')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  templateTab === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-muted hover:text-white'
                }`}
              >
                WhatsApp Cloud Templates
              </button>
              <button
                onClick={() => setTemplateTab('email')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  templateTab === 'email' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-muted hover:text-white'
                }`}
              >
                Email Templates
              </button>
            </div>
          </div>

          {/* Sub-Tab 1: Lead Funnel Templates */}
          {templateTab === 'funnel' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Standard B2B Sales Funnel', stages: ['Lead Ingested', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Closed Won'], defaultFor: 'General Sales' },
                { name: 'Real Estate Buyer Journey', stages: ['Site Visit Inquiry', 'Property Shortlisted', 'Site Visit Done', 'Negotiation', 'Booking Done'], defaultFor: 'Real Estate' },
                { name: 'Automobile Dealership Pipeline', stages: ['Test Drive Request', 'Test Drive Completed', 'Financing Option', 'Vehicle Booking', 'Delivered'], defaultFor: 'Automotive' },
              ].map(f => (
                <div key={f.name} className="p-4 rounded-2xl bg-background border border-purple-500/20 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-white">{f.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300">{f.defaultFor}</span>
                  </div>
                  <div className="space-y-1.5">
                    {f.stages.map((stg, idx) => (
                      <div key={stg} className="text-xs p-2 rounded-lg bg-card border border-border flex items-center justify-between text-muted">
                        <span>{idx + 1}. {stg}</span>
                        <CheckCircle2 size={13} className="text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sub-Tab 2: WhatsApp Cloud Templates */}
          {templateTab === 'whatsapp' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'welcome_greeting_v1', category: 'UTILITY', content: 'Hello {{1}}, welcome to {{2}}! Your assigned representative is {{3}}. Reply YES to get started.', status: 'APPROVED' },
                { name: 'demo_confirmation_alert', category: 'MARKETING', content: 'Hi {{1}}, your demo session with {{2}} is confirmed for {{3}}. Click link to join.', status: 'APPROVED' },
                { name: 'payment_reminder_notice', category: 'UTILITY', content: 'Dear {{1}}, your subscription invoice {{2}} is due on {{3}}. Pay online to avoid suspension.', status: 'APPROVED' },
                { name: 'lead_followup_reminder', category: 'MARKETING', content: 'Hi {{1}}, following up on your inquiry for {{2}}. Are you ready for next steps?', status: 'APPROVED' },
              ].map(w => (
                <div key={w.name} className="p-4 rounded-2xl bg-background border border-emerald-500/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                      {w.name}
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {w.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted font-mono bg-card p-3 rounded-xl border border-border leading-relaxed">
                    {w.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Sub-Tab 3: Email Templates */}
          {templateTab === 'email' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Cold Lead Introductory Pitch', subject: 'Transform your sales operations with {{companyName}}', preview: 'Hi {{firstName}}, I noticed your company is growing rapidly...' },
                { title: 'Quotation & Proposal Delivery', subject: 'Your customized proposal from {{companyName}}', preview: 'Dear {{firstName}}, please find attached the formal proposal...' },
              ].map(e => (
                <div key={e.title} className="p-4 rounded-2xl bg-background border border-indigo-500/20 space-y-2">
                  <h4 className="font-bold text-sm text-white">{e.title}</h4>
                  <p className="text-xs font-semibold text-indigo-300">Subject: {e.subject}</p>
                  <p className="text-xs text-muted bg-card p-3 rounded-xl border border-border italic">{e.preview}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FEATURE 5: WHATSAPP CLOUD USES TABLE ────────────────────────────────── */}
      {(activeSection === 'overview' || activeSection === 'whatsapp') && (
        <div className="crm-card p-0 overflow-hidden shadow-2xl border border-emerald-500/30">
          <div className="p-5 border-b flex justify-between items-center flex-wrap gap-4 bg-card" style={{ borderColor: 'rgb(var(--border))' }}>
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald-400" />
                <h2 className="font-extrabold text-lg text-white">Whatsapp Cloud Uses</h2>
              </div>
              <p className="text-xs text-muted mt-0.5">Platform WhatsApp Cloud API message throughput, quota limits, and date-wise log inspection.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="crm-table w-full">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Plan</th>
                  <th>Uses (Sent)</th>
                  <th>Limit Quota</th>
                  <th>Date-Wise Chat Button</th>
                  <th>Message Sent</th>
                  <th className="text-right">Edit</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(comp => (
                  <tr key={comp.id} className="hover:bg-card/60 transition-colors">
                    <td>
                      <p className="font-bold text-sm text-white">{comp.name}</p>
                    </td>
                    <td>
                      <span className="text-xs font-bold text-indigo-300">{comp.plan.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-extrabold text-emerald-400">
                        {comp.whatsappUsed.toLocaleString('en-IN')} Msgs
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-bold text-muted">
                        {comp.whatsappLimit.toLocaleString('en-IN')} Msgs
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenChatLogModal(comp)}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 flex items-center gap-1.5"
                      >
                        <Calendar size={13} /> View Date-Wise Logs
                      </button>
                    </td>
                    <td>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Active Delivery
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleOpenEditModal(comp)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg"
                      >
                        Edit Quota
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FEATURE 6: PENDING APPROVALS QUEUE ──────────────────────────────────── */}
      {(activeSection === 'overview' || activeSection === 'pending') && (
        <div className="crm-card p-0 overflow-hidden shadow-2xl border border-amber-500/30">
          <div className="p-5 border-b flex justify-between items-center flex-wrap gap-4 bg-card" style={{ borderColor: 'rgb(var(--border))' }}>
            <div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-amber-400" />
                <h2 className="font-extrabold text-lg text-white">Pending Approval Queue</h2>
              </div>
              <p className="text-xs text-muted mt-0.5">Payment-verified plan upgrade requests submitted by Tenant Admins via Razorpay.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="crm-table w-full">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Requested Plan</th>
                  <th>Payment Amount</th>
                  <th>Razorpay Order ID</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {upgradeRequests.map(req => (
                  <tr key={req.id}>
                    <td className="font-bold text-white text-sm">{req.companyName}</td>
                    <td><span className="font-bold text-indigo-300">{req.requestedPlan}</span></td>
                    <td className="font-mono font-bold text-emerald-400">₹{req.amountInr.toLocaleString('en-IN')}</td>
                    <td className="font-mono text-xs text-muted">{req.razorpayOrderId}</td>
                    <td>
                      <span className={`text-xs px-2.5 py-0.5 rounded font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                        req.status === 'REJECTED' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="text-right">
                      {req.status === 'PENDING_APPROVAL' ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => handleApproveUpgrade(req.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md">
                            Approve →
                          </button>
                          <button onClick={() => handleRejectUpgrade(req.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted italic">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FEATURE 7: COMPANIES AND THEIR EMPLOYEES AND THEIR DETAILS ─────────── */}
      {(activeSection === 'overview' || activeSection === 'employees') && (
        <div className="crm-card p-0 overflow-hidden shadow-2xl border border-indigo-500/30">
          <div className="p-5 border-b flex justify-between items-center flex-wrap gap-4 bg-card" style={{ borderColor: 'rgb(var(--border))' }}>
            <div>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-purple-400" />
                <h2 className="font-extrabold text-lg text-white">Companies and Their Employees and Their Details</h2>
              </div>
              <p className="text-xs text-muted mt-0.5">Full organizational staff directory listing Admins, Managers, Team Leaders, and Sales Reps with status controls.</p>
            </div>
          </div>

          <div className="p-5 space-y-6">
            {companies.map(comp => (
              <div key={comp.id} className="p-4 rounded-2xl bg-background border border-border space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2 border-b pb-3 border-border/60">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-base text-white">{comp.name}</h3>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded font-extrabold ${
                        comp.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {comp.isActive ? 'WORKSPACE ACTIVE' : 'WORKSPACE BLOCKED'}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      Tenant Admin: <strong className="text-white">{comp.adminName}</strong> ({comp.adminEmail}) • Key: <strong className="font-mono text-purple-300">{comp.registrationKey}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleBlockCompany(comp)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      comp.isActive ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30' : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300'
                    }`}
                  >
                    {comp.isActive ? <Ban size={13} /> : <Unlock size={13} />}
                    {comp.isActive ? 'Block Company' : 'Unblock Company'}
                  </button>
                </div>

                {/* Employees Table */}
                <div className="overflow-x-auto">
                  <table className="crm-table w-full">
                    <thead>
                      <tr>
                        <th>Employee Name & Email</th>
                        <th>Role</th>
                        <th>Key Used</th>
                        <th>Last Login</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: `usr_${comp.id}_1`, name: comp.adminName, email: comp.adminEmail, role: 'ADMIN', key: comp.registrationKey, lastLogin: 'Today at 10:15 AM', active: comp.isActive },
                        { id: `usr_${comp.id}_2`, name: 'Rajesh Mehta', email: 'rajesh.mgr@acme.com', role: 'MANAGER', key: `${comp.registrationKey.slice(0, 4)}-RX-1024`, lastLogin: 'Today at 09:30 AM', active: comp.isActive },
                        { id: `usr_${comp.id}_3`, name: 'Sunita Verma', email: 'sunita.hr@acme.com', role: 'HR', key: `${comp.registrationKey.slice(0, 4)}-RX-1025`, lastLogin: 'Yesterday', active: comp.isActive },
                        { id: `usr_${comp.id}_4`, name: 'Amit Shah', email: 'amit.tl@acme.com', role: 'TEAM_LEADER', key: `${comp.registrationKey.slice(0, 4)}-RX-1026`, lastLogin: 'Today at 08:45 AM', active: comp.isActive },
                        { id: `usr_${comp.id}_5`, name: 'Rajesh Kumar', email: 'rajesh.rep@acme.com', role: 'SALES_EXEC', key: `${comp.registrationKey.slice(0, 4)}-RX-1027`, lastLogin: 'Today at 11:20 AM', active: comp.isActive },
                      ].map(emp => (
                        <tr key={emp.id}>
                          <td>
                            <p className="font-bold text-xs text-white">{emp.name}</p>
                            <p className="text-[11px] text-muted">{emp.email}</p>
                          </td>
                          <td>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
                              {emp.role}
                            </span>
                          </td>
                          <td>
                            <span className="font-mono text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                              {emp.key}
                            </span>
                          </td>
                          <td><span className="text-[11px] text-muted font-mono">{emp.lastLogin}</span></td>
                          <td>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              emp.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {emp.active ? 'ACTIVE' : 'BLOCKED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FEATURE 3 MODAL: COMPANY DETAILS EDIT & UPGRADE PLAN ────────────────── */}
      {editModalOpen && editingCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-card border border-indigo-500/40 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-muted text-white flex items-center justify-center hover:bg-red-500/20 hover:text-red-300"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b pb-4 border-border">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                <Edit2 size={18} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Company Details Edit & Upgrade Plan</h3>
                <p className="text-xs text-muted">Modify company details, change subscription plan tier, set seat quota, or update expiry date.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-muted font-bold block mb-1">Company Name</label>
                <input
                  className="crm-input text-sm h-10 w-full"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted font-bold block mb-1">Select Subscription Plan</label>
                  <select
                    className="crm-input text-sm h-10 w-full font-bold text-indigo-300"
                    value={editPlan}
                    onChange={e => handleEditPlanChange(e.target.value as PlanType)}
                  >
                    <option value="FREE_TRIAL">Free Trial (10 Users · 15-40 Days)</option>
                    <option value="GROWTH">Growth Plan (20 Users · All AI · No WA/Email)</option>
                    <option value="BUSINESS">Business Plan (50 Users · All Features)</option>
                    <option value="ENTERPRISE">Enterprise Plan (100 Users · All Features)</option>
                  </select>
                </div>

                <div>
                  <label className="text-muted font-bold block mb-1">Allocated User Seats</label>
                  <input
                    type="number"
                    className="crm-input text-sm h-10 w-full font-mono font-bold"
                    value={editSeats}
                    onChange={e => setEditSeats(+e.target.value)}
                  />
                </div>
              </div>

              {/* Free Trial Duration Adjustment Slider (15 to 40 days) */}
              {editPlan === 'FREE_TRIAL' && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Clock size={14} /> Free Trial Duration (15 to 40 Days)
                    </label>
                    <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {editTrialDuration} Days Duration
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={40}
                    step={1}
                    value={editTrialDuration}
                    onChange={e => handleTrialDurationChange(+e.target.value)}
                    className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-muted font-mono font-bold">
                    <button type="button" onClick={() => handleTrialDurationChange(15)} className="hover:text-amber-300">15d (Min)</button>
                    <button type="button" onClick={() => handleTrialDurationChange(20)} className="hover:text-amber-300">20d</button>
                    <button type="button" onClick={() => handleTrialDurationChange(30)} className="hover:text-amber-300">30d (Default)</button>
                    <button type="button" onClick={() => handleTrialDurationChange(40)} className="hover:text-amber-300">40d (Max)</button>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    Free Trial includes 10 Users and Basic AI (Lead Score only). Expiry date automatically recalibrated to {editExpiryDate}.
                  </p>
                </div>
              )}

              <div>
                <label className="text-muted font-bold block mb-1">Plan / Key Expiry Date</label>
                <input
                  type="date"
                  className="crm-input text-sm h-10 w-full font-mono"
                  value={editExpiryDate}
                  onChange={e => setEditExpiryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={() => handleToggleBlockCompany(editingCompany)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                  editingCompany.isActive
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {editingCompany.isActive ? <Ban size={14} /> : <Unlock size={14} />}
                {editingCompany.isActive ? 'Block Company' : 'Unblock Company'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-background border border-border text-muted font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCompanyEdit}
                  className="btn-primary text-xs px-5 py-2.5 font-bold shadow-lg"
                >
                  Save Changes →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── WHATSAPP DATE-WISE CHAT LOG MODAL ────────────────────────────────────── */}
      {chatLogModalOpen && chatLogCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-card border border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setChatLogModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-muted text-white flex items-center justify-center hover:bg-red-500/20 hover:text-red-300"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b pb-4 border-border">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Date-Wise WhatsApp Chat Logs</h3>
                <p className="text-xs text-muted">{chatLogCompany.name} • Daily message throughput & delivery statistics.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-background border border-border flex justify-between items-center text-xs">
                <span>Total WhatsApp Messages Sent:</span>
                <strong className="text-emerald-400 font-mono text-sm font-bold">
                  {chatLogCompany.whatsappUsed.toLocaleString('en-IN')} / {chatLogCompany.whatsappLimit.toLocaleString('en-IN')}
                </strong>
              </div>

              <table className="crm-table w-full">
                <thead>
                  <tr>
                    <th>Date Window</th>
                    <th>Messages Sent</th>
                    <th>Delivery Success Rate</th>
                    <th>Active Chats</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyLogs.map(log => (
                    <tr key={log.date}>
                      <td className="font-mono text-xs font-bold text-white">{log.date}</td>
                      <td className="font-mono text-xs font-bold text-emerald-400">{log.messagesSent.toLocaleString('en-IN')}</td>
                      <td>
                        <span className="text-xs font-bold text-emerald-300">{log.deliveryRate}%</span>
                      </td>
                      <td className="font-mono text-xs text-muted">{log.activeChats} Conversations</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setChatLogModalOpen(false)}
                className="btn-primary text-xs px-5 py-2.5 font-bold"
              >
                Close Logs Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── KEY GENERATOR MODAL ─────────────────────────────────────────────────── */}
      {genKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-card border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setGenKeyModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-muted text-white flex items-center justify-center hover:bg-red-500/20 hover:text-red-300"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b pb-4 border-border">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                <Key size={18} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Generate Company Registration Key</h3>
                <p className="text-xs text-muted">Create security key for tenant activation (Format: ACME-KX-7421).</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-muted font-bold block mb-1">Company Name *</label>
                <input
                  className="crm-input text-sm h-10 w-full"
                  placeholder="e.g. Global Logistics Corp"
                  value={genCompanyName}
                  onChange={e => setGenCompanyName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted font-bold block mb-1">Plan Tier</label>
                  <select
                    className="crm-input text-sm h-10 w-full font-bold text-purple-300"
                    value={genPlan}
                    onChange={e => handleGenPlanChange(e.target.value as PlanType)}
                  >
                    <option value="FREE_TRIAL">Free Trial (10 Users · 15-40 Days)</option>
                    <option value="GROWTH">Growth Plan (20 Users · All AI · No WA/Email)</option>
                    <option value="BUSINESS">Business Plan (50 Users · All Features)</option>
                    <option value="ENTERPRISE">Enterprise Plan (100 Users · All Features)</option>
                  </select>
                </div>

                <div>
                  <label className="text-muted font-bold block mb-1">User Quota (Seats)</label>
                  <input
                    type="number"
                    className="crm-input text-sm h-10 w-full font-mono font-bold"
                    value={genSeats}
                    onChange={e => setGenSeats(+e.target.value)}
                  />
                </div>
              </div>

              {genPlan === 'FREE_TRIAL' ? (
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Clock size={14} /> Trial Validity Days (15 to 40 Days)
                    </label>
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300">
                      {genValidityDays} Days
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={40}
                    step={1}
                    value={genValidityDays}
                    onChange={e => setGenValidityDays(Math.max(15, Math.min(40, +e.target.value)))}
                    className="w-full accent-purple-400 cursor-pointer h-2 bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-muted font-mono font-bold">
                    <span>15d (Min)</span>
                    <span>20d</span>
                    <span>30d (Default)</span>
                    <span>40d (Max)</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-muted font-bold block mb-1">Validity Window (Days)</label>
                  <select
                    className="crm-input text-sm h-10 w-full font-bold"
                    value={genValidityDays}
                    onChange={e => setGenValidityDays(+e.target.value)}
                  >
                    <option value={30}>30 Days (1 Month)</option>
                    <option value={90}>90 Days (3 Months)</option>
                    <option value={180}>180 Days (6 Months)</option>
                    <option value={365}>365 Days (1 Year)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button
                onClick={() => setGenKeyModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-background border border-border text-muted font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateKey}
                className="btn-primary text-xs px-5 py-2.5 font-bold shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                Generate & Issue Key →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
