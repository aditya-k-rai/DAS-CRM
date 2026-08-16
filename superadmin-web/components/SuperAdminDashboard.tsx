'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Users, Shield, Zap, DollarSign, Tag, Check, X,
  Plus, Trash2, Edit2, Key, CheckCircle2, MessageSquare, Mail, RefreshCw, QrCode, CreditCard,
  Ban, Lock, Unlock, TrendingUp, UserX, UserCheck, Eye, ChevronRight, Calendar, Sparkles, Filter, Layers, Clock, PhoneCall, AlertCircle
} from 'lucide-react';

export type PlanType = 'FREE_TRIAL' | 'STARTER' | 'PRO' | 'PRO_MAX';

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

interface SystemTemplate {
  id: string;
  title: string;
  category: 'funnel' | 'whatsapp' | 'email';
  content: string;
  status: 'ACTIVE' | 'DRAFT';
}

const INITIAL_TEMPLATES: SystemTemplate[] = [
  {
    id: 'tmpl_funnel_1',
    title: 'Standard B2B Enterprise Lead Funnel',
    category: 'funnel',
    content: 'New Inquiry → Requirements Discovery → Proposal Sent → Contract Review → Deal Closed Won',
    status: 'ACTIVE',
  },
  {
    id: 'tmpl_wa_1',
    title: 'Welcome & Onboarding Key WhatsApp Message',
    category: 'whatsapp',
    content: 'Hi {{1}}, welcome to {{2}}! Your registration key {{3}} is active. Login to your dashboard.',
    status: 'ACTIVE',
  },
  {
    id: 'tmpl_email_1',
    title: 'Password Reset OTP Dispatch Email',
    category: 'email',
    content: 'Hello, your 6-digit OTP code to reset your account password is: {{OTP}}. Expires in 15 mins.',
    status: 'ACTIVE',
  },
];

const MOCK_DEMO_COMPANIES: CompanyRecord[] = [
  {
    id: 'comp_acme',
    name: 'Acme Sales Solutions',
    adminName: 'Vikram Singh',
    adminEmail: 'vikram.admin@acme.com',
    registrationKey: 'ACME-KX-7421',
    plan: 'PRO',
    trialDaysLeft: 24,
    isExpired: false,
    seatsAllocated: 20,
    seatsUsed: 5,
    totalUsersCount: 5,
    totalLeads: 142,
    convertedLeads: 38,
    conversionRate: 26.7,
    isActive: true,
    createdAt: '2026-01-10',
    expiryDate: '2026-09-15',
    whatsappUsed: 34234,
    whatsappLimit: 425245,
  },
  {
    id: 'comp_nexus',
    name: 'Nexus Digital Tech',
    adminName: 'Aditya Rai',
    adminEmail: 'dynamicadvancesolution@gmail.com',
    registrationKey: 'NEXUS-AT-6396',
    plan: 'FREE_TRIAL',
    trialDaysLeft: 7,
    isExpired: false,
    seatsAllocated: 5,
    seatsUsed: 1,
    totalUsersCount: 1,
    totalLeads: 15,
    convertedLeads: 4,
    conversionRate: 26.6,
    isActive: true,
    createdAt: '2026-08-14',
    expiryDate: '2026-08-21',
    whatsappUsed: 36747,
    whatsappLimit: 54454,
  },
  {
    id: 'comp_sunita',
    name: 'Sunita Real Estate Ltd',
    adminName: 'Sunita Sharma',
    adminEmail: 'sunita.admin@sunitarealty.com',
    registrationKey: 'SUN-KX-9012',
    plan: 'FREE_TRIAL',
    trialDaysLeft: 0,
    isExpired: true,
    seatsAllocated: 5,
    seatsUsed: 3,
    totalUsersCount: 3,
    totalLeads: 48,
    convertedLeads: 8,
    conversionRate: 16.6,
    isActive: true,
    createdAt: '2026-07-01',
    expiryDate: '2026-08-01',
    whatsappUsed: 12400,
    whatsappLimit: 50000,
  },
  {
    id: 'comp_apex',
    name: 'Apex Global Industries',
    adminName: 'Sanjay Kumar',
    adminEmail: 'sanjay@apex.com',
    registrationKey: 'APEX-MX-9021',
    plan: 'PRO_MAX',
    trialDaysLeft: 310,
    isExpired: false,
    seatsAllocated: 50,
    seatsUsed: 18,
    totalUsersCount: 18,
    totalLeads: 540,
    convertedLeads: 140,
    conversionRate: 25.9,
    isActive: true,
    createdAt: '2026-02-01',
    expiryDate: '2027-02-01',
    whatsappUsed: 42345,
    whatsappLimit: 500000,
  },
];

const MOCK_DEMO_KEYS: KeyRecord[] = [
  {
    id: 'key_1',
    key: 'ACME-KX-7421',
    companyName: 'Acme Sales Solutions',
    planTier: 'PRO',
    memberLimit: 20,
    validityDays: 30,
    status: 'ACTIVE',
    expiresAt: '2026-09-15',
    createdAt: '2026-01-10',
  },
  {
    id: 'key_2',
    key: 'NEXUS-AT-6396',
    companyName: 'Nexus Digital Tech',
    planTier: 'FREE_TRIAL',
    memberLimit: 5,
    validityDays: 7,
    status: 'ACTIVE',
    expiresAt: '2026-08-21',
    createdAt: '2026-08-14',
  },
  {
    id: 'key_3',
    key: 'SUN-KX-9012',
    companyName: 'Sunita Real Estate Ltd',
    planTier: 'FREE_TRIAL',
    memberLimit: 5,
    validityDays: 30,
    status: 'EXPIRED',
    expiresAt: '2026-08-01',
    createdAt: '2026-07-01',
  },
  {
    id: 'key_4',
    key: 'APEX-MX-9021',
    companyName: 'Apex Global Industries',
    planTier: 'PRO_MAX',
    memberLimit: 50,
    validityDays: 365,
    status: 'ACTIVE',
    expiresAt: '2027-02-01',
    createdAt: '2026-02-01',
  },
];

const MOCK_DEMO_EMPLOYEES: Record<string, CompanyEmployee[]> = {
  comp_acme: [
    { id: 'usr_admin', name: 'Vikram Singh', email: 'vikram.admin@acme.com', role: 'ADMIN', isActive: true, createdAt: '2026-01-10', keyUsed: 'ACME-KX-7421', lastLoginAt: '2026-08-14' },
    { id: 'usr_hr', name: 'Sunita Verma', email: 'sunita.hr@acme.com', role: 'HR', isActive: true, createdAt: '2026-01-12', keyUsed: 'ACME-RX-4312', lastLoginAt: '2026-08-14' },
    { id: 'usr_mgr', name: 'Rajesh Mehta', email: 'rajesh.mgr@acme.com', role: 'MANAGER', isActive: true, createdAt: '2026-01-15', keyUsed: 'ACME-RX-4312', lastLoginAt: '2026-08-14' },
    { id: 'usr_tl', name: 'Amit Shah', email: 'amit.tl@acme.com', role: 'TEAM_LEADER', isActive: true, createdAt: '2026-01-18', keyUsed: 'ACME-RX-4312', lastLoginAt: '2026-08-13' },
    { id: 'usr_rep', name: 'Rajesh Kumar', email: 'rajesh.rep@acme.com', role: 'SALES_EXEC', isActive: true, createdAt: '2026-01-20', keyUsed: 'ACME-RX-4312', lastLoginAt: '2026-08-14' },
  ],
  comp_nexus: [
    { id: 'usr_aditya', name: 'Aditya Rai', email: 'dynamicadvancesolution@gmail.com', role: 'ADMIN', isActive: true, createdAt: '2026-08-14', keyUsed: 'NEXUS-AT-6396', lastLoginAt: '2026-08-14' },
  ],
  comp_sunita: [
    { id: 'usr_sunita', name: 'Sunita Sharma', email: 'sunita.admin@sunitarealty.com', role: 'ADMIN', isActive: true, createdAt: '2026-07-01', keyUsed: 'SUN-KX-9012', lastLoginAt: '2026-07-28' },
  ],
  comp_apex: [
    { id: 'usr_sanjay', name: 'Sanjay Kumar', email: 'sanjay@apex.com', role: 'ADMIN', isActive: true, createdAt: '2026-02-01', keyUsed: 'APEX-MX-9021', lastLoginAt: '2026-08-10' },
  ],
};

export function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<CompanyRecord[]>(MOCK_DEMO_COMPANIES);
  const [keysList, setKeysList] = useState<KeyRecord[]>(MOCK_DEMO_KEYS);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [templates, setTemplates] = useState<SystemTemplate[]>(INITIAL_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'edit_company' | 'templates' | 'whatsapp' | 'pending' | 'employees' | 'expired'>('overview');
  const [templateTab, setTemplateTab] = useState<'funnel' | 'whatsapp' | 'email'>('funnel');

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState<PlanType>('FREE_TRIAL');
  const [editSeats, setEditSeats] = useState(6);
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  const [chatLogModalOpen, setChatLogModalOpen] = useState(false);
  const [chatLogCompany, setChatLogCompany] = useState<CompanyRecord | null>(null);
  const [dailyLogs, setDailyLogs] = useState<WhatsAppDailyLog[]>([]);

  const [genKeyModalOpen, setGenKeyModalOpen] = useState(false);
  const [genCompanyName, setGenCompanyName] = useState('');
  const [genPlan, setGenPlan] = useState<PlanType>('FREE_TRIAL');
  const [genSeats, setGenSeats] = useState(6);
  const [genValidityDays, setGenValidityDays] = useState(30);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('comp_acme');
  const [companyEmployees, setCompanyEmployees] = useState<CompanyEmployee[]>(MOCK_DEMO_EMPLOYEES.comp_acme || []);

  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  useEffect(() => {
    fetchBackendData();
  }, []);

  useEffect(() => {
    if (selectedCompanyId && MOCK_DEMO_EMPLOYEES[selectedCompanyId]) {
      setCompanyEmployees(MOCK_DEMO_EMPLOYEES[selectedCompanyId]);
    }
  }, [selectedCompanyId]);

  const fetchBackendData = async () => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const compRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies`, { headers });
      if (compRes.ok) {
        const data = await compRes.json();
        if (Array.isArray(data) && data.length > 0) setCompanies(data);
      }

      const keysRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/keys`, { headers });
      if (keysRes.ok) {
        const data = await keysRes.json();
        if (data.companyKeys && data.companyKeys.length > 0) setKeysList(data.companyKeys);
      }
    } catch (err) {
      console.warn('Backend API notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (comp: CompanyRecord) => {
    setEditingCompany(comp);
    setEditName(comp.name);
    setEditPlan(comp.plan);
    setEditSeats(comp.seatsAllocated);
    setEditExpiryDate(comp.expiryDate);
    setEditIsActive(comp.isActive);
    setEditModalOpen(true);
  };

  const handleSaveCompanyEdit = async () => {
    if (!editingCompany) return;
    const isNowExpired = editExpiryDate ? new Date(editExpiryDate) < new Date() : false;
    const daysLeft = editExpiryDate
      ? Math.max(0, Math.ceil((new Date(editExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    setCompanies(prev => prev.map(c => c.id === editingCompany.id ? {
      ...c,
      name: editName,
      plan: editPlan,
      seatsAllocated: editSeats,
      expiryDate: editExpiryDate,
      isActive: editIsActive,
      isExpired: isNowExpired,
      trialDaysLeft: daysLeft,
    } : c));
    setEditModalOpen(false);
  };

  const handleExtendCompanyExpiry = (companyId: string, daysToExtend: number = 30) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysToExtend);
    const newExpiryStr = futureDate.toISOString().split('T')[0];

    setCompanies(prev => prev.map(c => c.id === companyId ? {
      ...c,
      expiryDate: newExpiryStr,
      isExpired: false,
      trialDaysLeft: daysToExtend,
    } : c));
  };

  const handleGenerateCompanyKey = async () => {
    if (!genCompanyName.trim()) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/generate-company-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyName: genCompanyName, planTier: genPlan, memberLimit: genSeats, validityDays: genValidityDays }),
      });
      if (res.ok) {
        const data = await res.json();
        setKeysList(prev => [data, ...prev]);
        setGenKeyModalOpen(false);
        setGenCompanyName('');
      } else {
        // Local state fallback
        const newKeyRecord: KeyRecord = {
          id: `key_${Date.now()}`,
          key: `${genCompanyName.substring(0, 4).toUpperCase()}-KX-${Math.floor(1000 + Math.random() * 9000)}`,
          companyName: genCompanyName,
          planTier: genPlan,
          memberLimit: genSeats,
          validityDays: genValidityDays,
          status: 'ACTIVE',
          expiresAt: '2026-09-30',
          createdAt: new Date().toISOString().split('T')[0],
        };
        setKeysList(prev => [newKeyRecord, ...prev]);
        setGenKeyModalOpen(false);
        setGenCompanyName('');
      }
    } catch (e) {
      setGenKeyModalOpen(false);
    }
  };

  const handleOpenDateWiseChatModal = (comp: CompanyRecord) => {
    setChatLogCompany(comp);
    setDailyLogs([
      { date: '2026-08-14', messagesSent: 1420, deliveryRate: 99.4, activeChats: 120 },
      { date: '2026-08-13', messagesSent: 1380, deliveryRate: 98.9, activeChats: 115 },
      { date: '2026-08-12', messagesSent: 1510, deliveryRate: 99.1, activeChats: 130 },
      { date: '2026-08-11', messagesSent: 1290, deliveryRate: 99.6, activeChats: 108 },
    ]);
    setChatLogModalOpen(true);
  };

  const handleToggleBlockUser = (empId: string) => {
    setCompanyEmployees(prev => prev.map(e => e.id === empId ? { ...e, isActive: !e.isActive } : e));
  };

  const handleAddTemplate = () => {
    if (!newTemplateTitle.trim() || !newTemplateContent.trim()) return;
    const newTmpl: SystemTemplate = {
      id: `tmpl_${Date.now()}`,
      title: newTemplateTitle,
      category: templateTab,
      content: newTemplateContent,
      status: 'ACTIVE',
    };
    setTemplates(prev => [newTmpl, ...prev]);
    setNewTemplateTitle('');
    setNewTemplateContent('');
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const totalCompanies = companies.length;
  const totalUsers = companies.reduce((acc, c) => acc + (c.totalUsersCount || 0), 0);
  const activeCompanies = companies.filter(c => c.isActive).length;
  const activeFreeTrials = companies.filter(c => c.plan === 'FREE_TRIAL').length;
  const activePaidPlans = companies.filter(c => c.plan !== 'FREE_TRIAL').length;
  const expiredCompanies = companies.filter(c => c.isExpired || (c.expiryDate && new Date(c.expiryDate) < new Date()));

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto pb-16">
      {/* 👑 SECTION 1: DASHBOARD TOP KPI OVAL CARDS HEADER (Matching Wireframe) */}
      <div className="crm-card p-6 border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 relative overflow-hidden shadow-2xl rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
              👑 SUPER ADMIN SYSTEM OVERLORD
            </span>
            <h1 className="text-2xl font-black text-white mt-2">Super Admin Dashboard</h1>
            <p className="text-xs text-slate-400">Multi-Tenant Platform Control & Management Center</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchBackendData} className="btn-primary text-xs px-4 py-2 flex items-center gap-2">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
            </button>
            <button onClick={() => setGenKeyModalOpen(true)} className="btn-primary text-xs px-4 py-2 flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600">
              <Key size={14} /> + Generate Company Key
            </button>
          </div>
        </div>

        {/* 4 OVAL CYAN PILL CARDS (Matching Wireframe Section 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Number Of Companies and Their Users */}
          <div className="p-4 rounded-3xl bg-cyan-500/15 border border-cyan-500/40 text-center shadow-lg hover:scale-[1.02] transition-transform">
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block">Number Of Companies & Their Users</span>
            <div className="mt-2 flex items-center justify-center gap-4">
              <div>
                <span className="text-2xl font-black text-white">{totalCompanies}</span>
                <span className="text-[10px] text-slate-400 block">Companies</span>
              </div>
              <div className="w-px h-8 bg-cyan-500/30" />
              <div>
                <span className="text-2xl font-black text-cyan-300">{totalUsers}</span>
                <span className="text-[10px] text-slate-400 block">Total Users</span>
              </div>
            </div>
          </div>

          {/* Card 2: Active Companies and Users */}
          <div className="p-4 rounded-3xl bg-teal-500/15 border border-teal-500/40 text-center shadow-lg hover:scale-[1.02] transition-transform">
            <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider block">Active Companies & Users</span>
            <div className="mt-2 flex items-center justify-center gap-4">
              <div>
                <span className="text-2xl font-black text-white">{activeCompanies}</span>
                <span className="text-[10px] text-slate-400 block">Active Cos.</span>
              </div>
              <div className="w-px h-8 bg-teal-500/30" />
              <div>
                <span className="text-2xl font-black text-emerald-300">{totalUsers}</span>
                <span className="text-[10px] text-slate-400 block">Active Users</span>
              </div>
            </div>
          </div>

          {/* Card 3: Active Free Trials and Plans */}
          <div className="p-4 rounded-3xl bg-amber-500/15 border border-amber-500/40 text-center shadow-lg hover:scale-[1.02] transition-transform">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">Active Free Trials & Plans</span>
            <div className="mt-2 flex items-center justify-center gap-4">
              <div>
                <span className="text-2xl font-black text-amber-400">{activeFreeTrials}</span>
                <span className="text-[10px] text-slate-400 block">Free Trials</span>
              </div>
              <div className="w-px h-8 bg-amber-500/30" />
              <div>
                <span className="text-2xl font-black text-indigo-300">{activePaidPlans}</span>
                <span className="text-[10px] text-slate-400 block">Paid Plans</span>
              </div>
            </div>
          </div>

          {/* Card 4: Plan Expired Companies */}
          <div
            onClick={() => setActiveTab('expired')}
            className="p-4 rounded-3xl bg-red-500/15 border border-red-500/40 text-center shadow-lg hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider block">Plan Expired Companies</span>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-2xl font-black text-red-400">{expiredCompanies.length}</span>
              <span className="text-xs text-slate-400">Expired Plans</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${activeTab === 'overview' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
          🔑 Keys & Their Companies Table
        </button>
        <button onClick={() => setActiveTab('expired')} className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${activeTab === 'expired' ? 'bg-red-500/20 border-red-500 text-red-300 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
          ⚠️ Plan Expired Companies ({expiredCompanies.length})
        </button>
        <button onClick={() => setActiveTab('templates')} className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${activeTab === 'templates' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
          📑 System Templates Hub
        </button>
        <button onClick={() => setActiveTab('whatsapp')} className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${activeTab === 'whatsapp' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
          💬 WhatsApp Cloud Uses & Logs
        </button>
        <button onClick={() => setActiveTab('pending')} className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${activeTab === 'pending' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
          💳 Pending Upgrade Approvals ({upgradeRequests.length})
        </button>
        <button onClick={() => setActiveTab('employees')} className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${activeTab === 'employees' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
          👥 Companies & Their Employees
        </button>
      </div>

      {/* ⚠️ EXPIRED COMPANIES SECTION */}
      {activeTab === 'expired' && (
        <div className="crm-card p-5 border-red-500/30 bg-slate-900/90 space-y-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <AlertCircle size={18} className="text-red-400" /> Plan Expired Companies List
              </h3>
              <p className="text-xs text-slate-400">Companies whose subscription plan or free trial expiry date has elapsed</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-300 border border-red-500/40">
              {expiredCompanies.length} Expired Tenants
            </span>
          </div>

          {expiredCompanies.length === 0 ? (
            <div className="p-8 text-center border border-slate-800 rounded-2xl bg-slate-950/50 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
              <p className="text-sm font-bold text-white">No Expired Companies</p>
              <p className="text-xs text-slate-400">All registered tenant companies have active subscriptions and valid plan expiry dates.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-red-500/20">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-red-500/20">
                  <tr>
                    <th className="p-3.5">Company Name</th>
                    <th className="p-3.5">Key</th>
                    <th className="p-3.5">Plan Tier</th>
                    <th className="p-3.5">Expiry Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {expiredCompanies.map(c => (
                    <tr key={c.id} className="hover:bg-red-500/5 transition-colors">
                      <td className="p-3.5">
                        <p className="font-extrabold text-white">{c.name}</p>
                        <p className="text-[10px] text-slate-400">{c.adminEmail}</p>
                      </td>
                      <td className="p-3.5 font-mono text-cyan-400 font-bold">{c.registrationKey}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 border border-amber-500/30 text-amber-300">
                          {c.plan}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-red-400 font-bold">{c.expiryDate}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/20 border border-red-500/40 text-red-400 flex items-center gap-1 w-max">
                          <AlertCircle size={11} /> PLAN EXPIRED
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleExtendCompanyExpiry(c.id, 30)}
                          className="px-3 py-1 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/40 rounded-xl font-bold text-xs inline-flex items-center gap-1 shadow"
                        >
                          <RefreshCw size={12} /> Extend Expiry (+30 Days)
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/40 rounded-xl font-bold text-xs inline-flex items-center gap-1"
                        >
                          <Edit2 size={12} /> Edit Date
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 🔑 SECTION 2: KEYS AND THEIR COMPANIES TABLE (Matching Wireframe Section 2) */}
      {(activeTab === 'overview' || activeTab === 'keys') && (
        <div className="crm-card p-5 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Key size={18} className="text-cyan-400" /> Keys and Their Companies Table
            </h3>
            <button onClick={() => setGenKeyModalOpen(true)} className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5">
              <Plus size={13} /> Add Key
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3.5 border-b border-slate-800">Keys</th>
                  <th className="p-3.5 border-b border-slate-800">Company Name</th>
                  <th className="p-3.5 border-b border-slate-800">Plan</th>
                  <th className="p-3.5 border-b border-slate-800">Expiry Date</th>
                  <th className="p-3.5 border-b border-slate-800">No of Users</th>
                  <th className="p-3.5 border-b border-slate-800 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {companies.map(c => {
                  const isCompExpired = c.isExpired || (c.expiryDate && new Date(c.expiryDate) < new Date());
                  return (
                    <tr key={c.id} className={`transition-colors ${isCompExpired ? 'bg-red-500/10 hover:bg-red-500/15' : 'hover:bg-slate-900/50'}`}>
                      <td className="p-3.5 font-mono text-cyan-400 font-bold">{c.registrationKey}</td>
                      <td className="p-3.5">
                        <p className="font-extrabold text-white">{c.name}</p>
                        {isCompExpired && (
                          <span className="text-[9px] font-black text-red-400 uppercase tracking-wider block">⚠️ PLAN EXPIRED</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${isCompExpired ? 'bg-red-500/20 border-red-500/40 text-red-300' : c.plan === 'FREE_TRIAL' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'}`}>
                          {c.plan} {isCompExpired ? '(EXPIRED)' : ''}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400">
                        <span className={isCompExpired ? 'text-red-400 font-bold' : ''}>{c.expiryDate}</span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400">{c.seatsUsed} Users ({c.seatsAllocated} Allocated)</td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {isCompExpired && (
                          <button onClick={() => handleExtendCompanyExpiry(c.id, 30)} className="px-2.5 py-1 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/40 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                            <RefreshCw size={11} /> +30 Days
                          </button>
                        )}
                        <button onClick={() => handleOpenEditModal(c)} className="px-3.5 py-1 bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/40 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                          <Edit2 size={12} /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📑 SECTION 4: SYSTEM TEMPLATES HUB ("Tamplets") (Matching Wireframe Section 4) */}
      {activeTab === 'templates' && (
        <div className="crm-card p-5 border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers size={18} className="text-cyan-400" /> System Templates Hub ("Tamplets")
            </h3>
            {/* 3 Sub-Tabs matching wireframe: Lead Funnel, Whatsapp Cloud, Email */}
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button onClick={() => setTemplateTab('funnel')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${templateTab === 'funnel' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                Lead Funnel Templates
              </button>
              <button onClick={() => setTemplateTab('whatsapp')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${templateTab === 'whatsapp' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                Whatsapp Cloud Templates
              </button>
              <button onClick={() => setTemplateTab('email')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${templateTab === 'email' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                Email Templates
              </button>
            </div>
          </div>

          {/* Add New Template Form */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Add New {templateTab.toUpperCase()} Template</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="crm-input text-xs w-full" placeholder="Template Title" value={newTemplateTitle} onChange={e => setNewTemplateTitle(e.target.value)} />
              <button onClick={handleAddTemplate} className="btn-primary text-xs py-2 px-4 font-bold flex items-center justify-center gap-1.5">
                <Plus size={14} /> Add Template
              </button>
            </div>
            <textarea className="crm-input text-xs w-full h-20" placeholder="Enter template content / stage structure..." value={newTemplateContent} onChange={e => setNewTemplateContent(e.target.value)} />
          </div>

          {/* Template Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.filter(t => t.category === templateTab).map(t => (
              <div key={t.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{t.title}</h4>
                  <button onClick={() => handleDeleteTemplate(t.id)} className="text-rose-400 hover:text-rose-300 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                  {t.content}
                </p>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block">
                  STATUS: {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 💬 SECTION 5: WHATSAPP CLOUD USES TABLE (Matching Wireframe Section 5) */}
      {(activeTab === 'overview' || activeTab === 'whatsapp') && (
        <div className="crm-card p-5 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-cyan-400" /> WhatsApp Cloud Uses Table
            </h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3.5 border-b border-slate-800">Company Name</th>
                  <th className="p-3.5 border-b border-slate-800">Plan</th>
                  <th className="p-3.5 border-b border-slate-800">Uses</th>
                  <th className="p-3.5 border-b border-slate-800">Limit</th>
                  <th className="p-3.5 border-b border-slate-800 text-center">Date Wise Chat Button</th>
                  <th className="p-3.5 border-b border-slate-800">Messages Sent</th>
                  <th className="p-3.5 border-b border-slate-800 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5 font-extrabold text-white">{c.name}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {c.plan}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-cyan-300 font-bold">{c.whatsappUsed.toLocaleString()}</td>
                    <td className="p-3.5 font-mono text-slate-400">{c.whatsappLimit.toLocaleString()}</td>
                    <td className="p-3.5 text-center">
                      <button onClick={() => handleOpenDateWiseChatModal(c)} className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/40 rounded-xl font-bold text-[11px] inline-flex items-center gap-1">
                        <Calendar size={12} /> Date Wise Chat Log
                      </button>
                    </td>
                    <td className="p-3.5 font-mono text-emerald-400 font-bold">{c.whatsappUsed.toLocaleString()} Sent</td>
                    <td className="p-3.5 text-right">
                      <button onClick={() => handleOpenEditModal(c)} className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/40 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 💳 SECTION 6: PENDING APPROVAL (Matching Wireframe Section 6) */}
      {(activeTab === 'overview' || activeTab === 'pending') && (
        <div className="crm-card p-5 border-slate-800 space-y-4">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <CreditCard size={18} className="text-purple-400" /> Pending Approval Queue ({upgradeRequests.length})
          </h3>
          {upgradeRequests.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No pending plan upgrade requests requiring Super Admin approval at this time.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upgradeRequests.map(req => (
                <div key={req.id} className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{req.companyName}</h4>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                      {req.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1 font-mono">
                    <p>Requested Plan: <strong className="text-cyan-300">{req.requestedPlan}</strong></p>
                    <p>Amount Paid: <strong className="text-emerald-400">₹{req.amountInr}</strong></p>
                    <p>Order ID: <span>{req.razorpayOrderId}</span></p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button className="px-3 py-1.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold">Reject</button>
                    <button className="btn-primary text-xs px-4 py-1.5">Approve Upgrade ✓</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 👥 SECTION 7: COMPANIES AND THEIR EMPLOYEES AND THEIR DETAILS (Matching Wireframe Section 7) */}
      {(activeTab === 'overview' || activeTab === 'employees') && (
        <div className="crm-card p-5 border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Users size={18} className="text-cyan-400" /> Companies and Their Employees and Their Details
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Select Company:</label>
              <select
                className="crm-input text-xs h-9 min-w-[200px]"
                value={selectedCompanyId}
                onChange={e => setSelectedCompanyId(e.target.value)}
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3.5 border-b border-slate-800">Employee Name</th>
                  <th className="p-3.5 border-b border-slate-800">Email Address</th>
                  <th className="p-3.5 border-b border-slate-800">Assigned Role</th>
                  <th className="p-3.5 border-b border-slate-800">Key Used</th>
                  <th className="p-3.5 border-b border-slate-800">Account Status</th>
                  <th className="p-3.5 border-b border-slate-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {companyEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No registered employees found for selected company workspace.
                    </td>
                  </tr>
                ) : (
                  companyEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3.5 font-bold text-white">{emp.name}</td>
                      <td className="p-3.5 font-mono text-cyan-300">{emp.email}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700 uppercase">
                          {emp.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400">{emp.keyUsed}</td>
                      <td className="p-3.5">
                        {emp.isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            DEACTIVATED
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleBlockUser(emp.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${emp.isActive ? 'bg-rose-600/20 border-rose-500/30 text-rose-300 hover:bg-rose-600/40' : 'bg-emerald-600/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/40'}`}
                        >
                          {emp.isActive ? 'Block User' : 'Unblock User'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🛠️ SECTION 3 MODAL: COMPANY DETAILS EDIT & UPGRADE PLAN (Matching Wireframe Section 3) */}
      {editModalOpen && editingCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-lg w-full p-6 bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl relative space-y-4">
            <button onClick={() => setEditModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold">✕</button>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit2 size={18} className="text-cyan-400" /> Company Details Edit & Upgrade Plan
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Company Name *</label>
                <input className="crm-input w-full text-sm" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Plan Tier</label>
                  <select className="crm-input w-full text-sm" value={editPlan} onChange={e => setEditPlan(e.target.value as PlanType)}>
                    <option value="FREE_TRIAL">FREE_TRIAL</option>
                    <option value="STARTER">STARTER</option>
                    <option value="PRO">PRO</option>
                    <option value="PRO_MAX">PRO_MAX</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">User Seats Allocated</label>
                  <input type="number" className="crm-input w-full text-sm" value={editSeats} onChange={e => setEditSeats(parseInt(e.target.value, 10))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Expiration Date</label>
                <input type="date" className="crm-input w-full text-sm" value={editExpiryDate} onChange={e => setEditExpiryDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Workspace Status</label>
                <select className="crm-input w-full text-sm" value={editIsActive ? 'ACTIVE' : 'SUSPENDED'} onChange={e => setEditIsActive(e.target.value === 'ACTIVE')}>
                  <option value="ACTIVE">ACTIVE (Normal Workspace Operation)</option>
                  <option value="SUSPENDED">SUSPENDED (Block Workspace Access)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleSaveCompanyEdit} className="btn-primary text-xs px-5 py-2">Save Company Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Date-Wise Chat Log Modal */}
      {chatLogModalOpen && chatLogCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-xl w-full p-6 bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl relative space-y-4">
            <button onClick={() => setChatLogModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold">✕</button>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar size={18} className="text-indigo-400" /> Date Wise Chat Logs for {chatLogCompany.name}
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Messages Sent</th>
                    <th className="p-3">Delivery Rate</th>
                    <th className="p-3">Active Chats</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {dailyLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="p-3 font-mono font-bold text-white">{log.date}</td>
                      <td className="p-3 font-mono text-cyan-300">{log.messagesSent}</td>
                      <td className="p-3 font-mono text-emerald-400">{log.deliveryRate}%</td>
                      <td className="p-3 font-mono text-slate-300">{log.activeChats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setChatLogModalOpen(false)} className="btn-primary text-xs px-5 py-2">Close Log</button>
            </div>
          </div>
        </div>
      )}

      {/* Key Generation Modal */}
      {genKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-md w-full p-6 bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl relative space-y-4">
            <button onClick={() => setGenKeyModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold">✕</button>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Key size={18} className="text-cyan-400" /> Generate Company Registration Key
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Company Name *</label>
                <input className="crm-input w-full text-sm" placeholder="e.g. Company B" value={genCompanyName} onChange={e => setGenCompanyName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Plan Tier</label>
                  <select className="crm-input w-full text-sm" value={genPlan} onChange={e => setGenPlan(e.target.value as PlanType)}>
                    <option value="FREE_TRIAL">FREE_TRIAL (7 Days, 5 Seats)</option>
                    <option value="STARTER">STARTER (30 Days, 10 Seats)</option>
                    <option value="PRO">PRO (30 Days, 20 Seats)</option>
                    <option value="PRO_MAX">PRO_MAX (365 Days, 50 Seats)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Member Seats</label>
                  <input type="number" className="crm-input w-full text-sm" value={genSeats} onChange={e => setGenSeats(parseInt(e.target.value, 10))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Validity Period (Days)</label>
                <input type="number" className="crm-input w-full text-sm" value={genValidityDays} onChange={e => setGenValidityDays(parseInt(e.target.value, 10))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setGenKeyModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleGenerateCompanyKey} className="btn-primary text-xs px-5 py-2">Generate Key Now →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
