'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Users, Shield, Zap, DollarSign, Tag, Check, X,
  Plus, Trash2, Edit2, Key, CheckCircle2, MessageSquare, Mail, RefreshCw, QrCode, CreditCard,
  Ban, Lock, Unlock, TrendingUp, UserX, UserCheck, Eye, ChevronRight, Calendar, Sparkles, Filter, Layers, Clock, PhoneCall, AlertCircle, Bot, SlidersHorizontal, ArrowRight
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export type PlanType = 'FREE_TRIAL' | 'GROWTH' | 'BUSINESS' | 'ENTERPRISE' | 'STARTER' | 'PRO' | 'PRO_MAX';
export type AITierType = 'BASIC' | 'PRO' | 'ENTERPRISE_CUSTOM';

export interface AICompanyConfig {
  enabled: boolean;
  tier: AITierType;
  customSystemPrompt: string;
  monthlyTokenLimit: number;
  tokensUsed: number;
}

export interface WhatsAppCompanyConfig {
  enabled: boolean;
  monthlyLimit: number;
  used: number;
  status: 'CONNECTED' | 'DISCONNECTED' | 'NOT_CONFIGURED';
  phoneNumber?: string;
}

export interface EmailCompanyConfig {
  enabled: boolean;
  monthlyLimit: number;
  used: number;
  senderDomain?: string;
}

export interface CompanyRecord {
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
  // Major Feature Configurations
  emailConfig: EmailCompanyConfig;
  whatsAppConfig: WhatsAppCompanyConfig;
  aiConfig: AICompanyConfig;
}

export interface CompanyEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  keyUsed: string;
}

export interface KeyRecord {
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

export interface UpgradeRequest {
  id: string;
  companyName: string;
  requestedPlan: string;
  amountInr: number;
  razorpayOrderId: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

export interface WhatsAppDailyLog {
  date: string;
  messagesSent: number;
  deliveryRate: number;
  activeChats: number;
}

export interface SystemTemplate {
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
    plan: 'FREE_TRIAL',
    trialDaysLeft: 30,
    isExpired: false,
    seatsAllocated: 10,
    seatsUsed: 6,
    totalUsersCount: 11,
    totalLeads: 142,
    convertedLeads: 38,
    conversionRate: 26.7,
    isActive: true,
    createdAt: '2026-08-01',
    expiryDate: '2026-09-30',
    emailConfig: { enabled: false, monthlyLimit: 5000, used: 120, senderDomain: 'acme.com' },
    whatsAppConfig: { enabled: false, monthlyLimit: 10000, used: 0, status: 'NOT_CONFIGURED' },
    aiConfig: {
      enabled: true,
      tier: 'BASIC',
      customSystemPrompt: 'You are Acme Sales AI Assistant. Prioritize high intent B2B software leads.',
      monthlyTokenLimit: 100000,
      tokensUsed: 14200,
    },
  },
  {
    id: 'comp_nextgen',
    name: 'NextGen Retail Tech',
    adminName: 'Aditya Rai',
    adminEmail: 'dynamicadvancesolution@gmail.com',
    registrationKey: 'NEXT-GT-2026',
    plan: 'GROWTH',
    trialDaysLeft: 28,
    isExpired: false,
    seatsAllocated: 20,
    seatsUsed: 14,
    totalUsersCount: 17,
    totalLeads: 215,
    convertedLeads: 62,
    conversionRate: 28.8,
    isActive: true,
    createdAt: '2026-08-10',
    expiryDate: '2026-09-10',
    emailConfig: { enabled: true, monthlyLimit: 25000, used: 8400, senderDomain: 'nextgenretail.in' },
    whatsAppConfig: { enabled: false, monthlyLimit: 20000, used: 0, status: 'DISCONNECTED' },
    aiConfig: {
      enabled: true,
      tier: 'PRO',
      customSystemPrompt: 'Assist retail store owners with lead scoring, sentiment analysis, and quick deals pitch.',
      monthlyTokenLimit: 250000,
      tokensUsed: 89000,
    },
  },
  {
    id: 'comp_apex',
    name: 'Apex Global Industries',
    adminName: 'Sanjay Kumar',
    adminEmail: 'sanjay@apex.com',
    registrationKey: 'APEX-MX-9021',
    plan: 'BUSINESS',
    trialDaysLeft: 310,
    isExpired: false,
    seatsAllocated: 50,
    seatsUsed: 38,
    totalUsersCount: 44,
    totalLeads: 540,
    convertedLeads: 140,
    conversionRate: 25.9,
    isActive: true,
    createdAt: '2026-02-01',
    expiryDate: '2027-02-01',
    emailConfig: { enabled: true, monthlyLimit: 100000, used: 42100, senderDomain: 'apexcorp.com' },
    whatsAppConfig: { enabled: true, monthlyLimit: 100000, used: 42345, status: 'CONNECTED', phoneNumber: '+919876543210' },
    aiConfig: {
      enabled: true,
      tier: 'PRO',
      customSystemPrompt: 'Enterprise Apex AI Concierge. Analyze lead sentiment and automate deal closing proposals.',
      monthlyTokenLimit: 500000,
      tokensUsed: 210000,
    },
  },
  {
    id: 'comp_enterprise',
    name: 'Global Dynamics Enterprise',
    adminName: 'Sunita Sharma',
    adminEmail: 'sunita.admin@sunitarealty.com',
    registrationKey: 'GLOB-ENT-100X',
    plan: 'ENTERPRISE',
    trialDaysLeft: 340,
    isExpired: false,
    seatsAllocated: 100,
    seatsUsed: 72,
    totalUsersCount: 90,
    totalLeads: 1840,
    convertedLeads: 490,
    conversionRate: 26.6,
    isActive: true,
    createdAt: '2026-01-01',
    expiryDate: '2027-01-01',
    emailConfig: { enabled: true, monthlyLimit: 500000, used: 198400, senderDomain: 'globaldynamics.com' },
    whatsAppConfig: { enabled: true, monthlyLimit: 500000, used: 120400, status: 'CONNECTED', phoneNumber: '+919988776655' },
    aiConfig: {
      enabled: true,
      tier: 'ENTERPRISE_CUSTOM',
      customSystemPrompt: 'You are Global Dynamics AI Overlord. Fully custom prompt for multi-regional real estate lead scoring and automated WhatsApp dispatch.',
      monthlyTokenLimit: 2000000,
      tokensUsed: 780000,
    },
  },
];

const MOCK_DEMO_KEYS: KeyRecord[] = [
  { id: 'key_1', key: 'ACME-KX-7421', companyName: 'Acme Sales Solutions', planTier: 'FREE_TRIAL', memberLimit: 10, validityDays: 30, status: 'ACTIVE', expiresAt: '2026-09-30', createdAt: '2026-08-01' },
  { id: 'key_2', key: 'NEXT-GT-2026', companyName: 'NextGen Retail Tech', planTier: 'GROWTH', memberLimit: 20, validityDays: 30, status: 'ACTIVE', expiresAt: '2026-09-10', createdAt: '2026-08-10' },
  { id: 'key_3', key: 'APEX-MX-9021', companyName: 'Apex Global Industries', planTier: 'BUSINESS', memberLimit: 50, validityDays: 365, status: 'ACTIVE', expiresAt: '2027-02-01', createdAt: '2026-02-01' },
  { id: 'key_4', key: 'GLOB-ENT-100X', companyName: 'Global Dynamics Enterprise', planTier: 'ENTERPRISE', memberLimit: 100, validityDays: 365, status: 'ACTIVE', expiresAt: '2027-01-01', createdAt: '2026-01-01' },
];

const MOCK_DEMO_EMPLOYEES: Record<string, CompanyEmployee[]> = {
  comp_acme: [
    { id: 'usr_admin', name: 'Vikram Singh', email: 'vikram.admin@acme.com', role: 'ADMIN', isActive: true, createdAt: '2026-01-10', keyUsed: 'ACME-KX-7421', lastLoginAt: '2026-08-14' },
    { id: 'usr_hr', name: 'Sunita Verma', email: 'sunita.hr@acme.com', role: 'HR', isActive: true, createdAt: '2026-01-12', keyUsed: 'ACME-RX-4312', lastLoginAt: '2026-08-14' },
    { id: 'usr_mgr', name: 'Rajesh Mehta', email: 'rajesh.mgr@acme.com', role: 'MANAGER', isActive: true, createdAt: '2026-01-15', keyUsed: 'ACME-RX-4312', lastLoginAt: '2026-08-14' },
    { id: 'usr_tl', name: 'Amit Shah', email: 'amit.tl@acme.com', role: 'TEAM_LEADER', isActive: true, createdAt: '2026-01-18', keyUsed: 'ACME-RX-4312', lastLoginAt: '2026-08-13' },
    { id: 'usr_rep', name: 'Rajesh Kumar', email: 'rajesh.rep@acme.com', role: 'SALES_EXEC', isActive: true, createdAt: '2026-01-20', keyUsed: 'ACME-RX-4312', lastLoginAt: '2026-08-14' },
  ],
  comp_nextgen: [
    { id: 'usr_aditya', name: 'Aditya Rai', email: 'dynamicadvancesolution@gmail.com', role: 'ADMIN', isActive: true, createdAt: '2026-08-14', keyUsed: 'NEXT-GT-2026', lastLoginAt: '2026-08-14' },
  ],
  comp_apex: [
    { id: 'usr_sanjay', name: 'Sanjay Kumar', email: 'sanjay@apex.com', role: 'ADMIN', isActive: true, createdAt: '2026-02-01', keyUsed: 'APEX-MX-9021', lastLoginAt: '2026-08-10' },
  ],
  comp_enterprise: [
    { id: 'usr_sunita', name: 'Sunita Sharma', email: 'sunita.admin@sunitarealty.com', role: 'ADMIN', isActive: true, createdAt: '2026-01-01', keyUsed: 'GLOB-ENT-100X', lastLoginAt: '2026-07-28' },
  ],
};

export function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<CompanyRecord[]>(MOCK_DEMO_COMPANIES);
  const [keysList, setKeysList] = useState<KeyRecord[]>(MOCK_DEMO_KEYS);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [templates, setTemplates] = useState<SystemTemplate[]>(INITIAL_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'features_hub' | 'keys' | 'templates' | 'whatsapp' | 'pending' | 'employees' | 'expired'>('overview');
  const [templateTab, setTemplateTab] = useState<'funnel' | 'whatsapp' | 'email'>('funnel');

  // Multi-tab Company Edit Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalTab, setEditModalTab] = useState<'general' | 'email' | 'whatsapp' | 'ai'>('general');
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);

  // General Edit Fields
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState<PlanType>('FREE_TRIAL');
  const [editSeats, setEditSeats] = useState(10);
  const [editTrialDuration, setEditTrialDuration] = useState(30);
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Email Feature Edit Fields
  const [editEmailEnabled, setEditEmailEnabled] = useState(true);
  const [editEmailLimit, setEditEmailLimit] = useState(25000);
  const [editEmailSenderDomain, setEditEmailSenderDomain] = useState('');

  // WhatsApp Feature Edit Fields
  const [editWAEnabled, setEditWAEnabled] = useState(true);
  const [editWALimit, setEditWALimit] = useState(50000);
  const [editWAPhoneNumber, setEditWAPhoneNumber] = useState('');

  // AI Customization Edit Fields
  const [editAIEnabled, setEditAIEnabled] = useState(true);
  const [editAITier, setEditAITier] = useState<AITierType>('PRO');
  const [editAIPrompt, setEditAIPrompt] = useState('');
  const [editAITokenLimit, setEditAITokenLimit] = useState(250000);

  // Date Wise Chat Log Modal
  const [chatLogModalOpen, setChatLogModalOpen] = useState(false);
  const [chatLogCompany, setChatLogCompany] = useState<CompanyRecord | null>(null);
  const [dailyLogs, setDailyLogs] = useState<WhatsAppDailyLog[]>([]);

  // Selected company for employee table
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
    } else {
      setCompanyEmployees([]);
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
        if (Array.isArray(data) && data.length > 0) {
          // Merge API results with feature config schema defaults
          const formatted = data.map((c: any) => ({
            ...c,
            emailConfig: c.emailConfig || { enabled: true, monthlyLimit: 25000, used: 1200 },
            whatsAppConfig: c.whatsAppConfig || { enabled: true, monthlyLimit: 50000, used: 4500, status: 'CONNECTED' },
            aiConfig: c.aiConfig || { enabled: true, tier: 'PRO', customSystemPrompt: 'Standard CRM Lead AI assistant.', monthlyTokenLimit: 250000, tokensUsed: 15000 },
          }));
          setCompanies(formatted);
        }
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

  const handleOpenEditModal = (comp: CompanyRecord, initialTab: 'general' | 'email' | 'whatsapp' | 'ai' = 'general') => {
    setEditingCompany(comp);
    setEditModalTab(initialTab);

    // General
    setEditName(comp.name);
    setEditPlan(comp.plan);
    const defaultSeats = comp.seatsAllocated || (comp.plan === 'FREE_TRIAL' ? 10 : comp.plan === 'GROWTH' ? 20 : comp.plan === 'BUSINESS' ? 50 : 100);
    setEditSeats(defaultSeats);
    const defaultTrialDays = comp.trialDaysLeft > 0 ? Math.min(40, Math.max(15, comp.trialDaysLeft)) : 30;
    setEditTrialDuration(defaultTrialDays);
    setEditExpiryDate(comp.expiryDate || new Date(Date.now() + defaultTrialDays * 86400000).toISOString().split('T')[0]);
    setEditIsActive(comp.isActive);

    // Email
    setEditEmailEnabled(comp.emailConfig?.enabled ?? true);
    setEditEmailLimit(comp.emailConfig?.monthlyLimit ?? 25000);
    setEditEmailSenderDomain(comp.emailConfig?.senderDomain || `${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);

    // WhatsApp
    setEditWAEnabled(comp.whatsAppConfig?.enabled ?? true);
    setEditWALimit(comp.whatsAppConfig?.monthlyLimit ?? 50000);
    setEditWAPhoneNumber(comp.whatsAppConfig?.phoneNumber || '+919876543210');

    // AI
    setEditAIEnabled(comp.aiConfig?.enabled ?? true);
    setEditAITier(comp.aiConfig?.tier || 'PRO');
    setEditAIPrompt(comp.aiConfig?.customSystemPrompt || `Assist ${comp.name} sales reps with high conversion lead scoring.`);
    setEditAITokenLimit(comp.aiConfig?.monthlyTokenLimit || 250000);

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
      emailConfig: {
        ...c.emailConfig,
        enabled: editEmailEnabled,
        monthlyLimit: editEmailLimit,
        senderDomain: editEmailSenderDomain,
      },
      whatsAppConfig: {
        ...c.whatsAppConfig,
        enabled: editWAEnabled,
        monthlyLimit: editWALimit,
        phoneNumber: editWAPhoneNumber,
        status: editWAEnabled ? (c.whatsAppConfig?.status === 'NOT_CONFIGURED' ? 'CONNECTED' : c.whatsAppConfig?.status) : 'DISCONNECTED',
      },
      aiConfig: {
        ...c.aiConfig,
        enabled: editAIEnabled,
        tier: editAITier,
        customSystemPrompt: editAIPrompt,
        monthlyTokenLimit: editAITokenLimit,
      },
    } : c));

    setEditModalOpen(false);
  };

  const handleToggleInstantFeature = (companyId: string, feature: 'email' | 'whatsapp' | 'ai', nextState: boolean) => {
    setCompanies(prev => prev.map(c => {
      if (c.id !== companyId) return c;
      if (feature === 'email') {
        return { ...c, emailConfig: { ...c.emailConfig, enabled: nextState } };
      } else if (feature === 'whatsapp') {
        return {
          ...c,
          whatsAppConfig: {
            ...c.whatsAppConfig,
            enabled: nextState,
            status: nextState ? (c.whatsAppConfig.status === 'NOT_CONFIGURED' ? 'CONNECTED' : c.whatsAppConfig.status) : 'DISCONNECTED',
          },
        };
      } else if (feature === 'ai') {
        return { ...c, aiConfig: { ...c.aiConfig, enabled: nextState } };
      }
      return c;
    }));
  };

  const handleQuickAdjustSeats = (companyId: string, delta: number) => {
    setCompanies(prev => prev.map(c => {
      if (c.id !== companyId) return c;
      const updated = Math.max(c.seatsUsed, c.seatsAllocated + delta);
      return { ...c, seatsAllocated: updated };
    }));
  };

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
    } else if (newPlan === 'BUSINESS' || newPlan === 'PRO') {
      setEditSeats(50);
      const expiry = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      setEditExpiryDate(expiry);
    } else if (newPlan === 'ENTERPRISE' || newPlan === 'PRO_MAX') {
      setEditSeats(100);
      const expiry = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
      setEditExpiryDate(expiry);
    }
  };

  const handleTrialDurationChange = (days: number) => {
    const clamped = Math.max(15, Math.min(40, days));
    setEditTrialDuration(clamped);
    const expiry = new Date(Date.now() + clamped * 86400000).toISOString().split('T')[0];
    setEditExpiryDate(expiry);
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
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 max-w-7xl mx-auto pb-16 text-foreground">
      {/* 👑 SECTION 1: DASHBOARD HERO BANNER (Explicit High Contrast Gradient Wrapper) */}
      <div className="crm-card p-6 border-cyan-500/40 bg-gradient-to-r from-slate-950 via-cyan-950/80 to-slate-950 relative overflow-hidden shadow-2xl rounded-3xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <img src="/das-logo.png" alt="DAS CRM Logo" className="h-12 w-auto object-contain rounded-xl border border-cyan-500/40 shadow-lg bg-slate-900 p-1" />
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 rounded-full shadow-inner inline-flex items-center gap-1.5">
                👑 SUPER ADMIN SYSTEM OVERLORD
              </span>
              <h1 className="text-2xl font-black text-white mt-1.5 tracking-tight">Super Admin Dashboard</h1>
              <p className="text-xs text-cyan-100/70">Multi-Tenant Platform Control & Management Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={fetchBackendData} className="px-4 py-2 text-xs font-extrabold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 shadow-lg transition-all border border-cyan-400/30">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
            </button>
          </div>
        </div>

        {/* 4 OVAL KPI CARDS (High contrast text in all themes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/50 text-center shadow-lg hover:scale-[1.02] transition-transform">
            <span className="text-[11px] font-extrabold text-cyan-300 uppercase tracking-wider block">Total Companies & Users</span>
            <div className="mt-2 flex items-center justify-center gap-4">
              <div>
                <span className="text-2xl font-black text-white">{totalCompanies}</span>
                <span className="text-[10px] text-slate-300 block font-bold">Companies</span>
              </div>
              <div className="w-px h-8 bg-cyan-500/40" />
              <div>
                <span className="text-2xl font-black text-cyan-300">{totalUsers}</span>
                <span className="text-[10px] text-slate-300 block font-bold">Total Users</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/50 text-center shadow-lg hover:scale-[1.02] transition-transform">
            <span className="text-[11px] font-extrabold text-teal-300 uppercase tracking-wider block">Active Companies & Users</span>
            <div className="mt-2 flex items-center justify-center gap-4">
              <div>
                <span className="text-2xl font-black text-white">{activeCompanies}</span>
                <span className="text-[10px] text-slate-300 block font-bold">Active Cos.</span>
              </div>
              <div className="w-px h-8 bg-teal-500/40" />
              <div>
                <span className="text-2xl font-black text-emerald-300">{totalUsers}</span>
                <span className="text-[10px] text-slate-300 block font-bold">Active Users</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/50 text-center shadow-lg hover:scale-[1.02] transition-transform">
            <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider block">Trials & Paid Plans</span>
            <div className="mt-2 flex items-center justify-center gap-4">
              <div>
                <span className="text-2xl font-black text-amber-400">{activeFreeTrials}</span>
                <span className="text-[10px] text-slate-300 block font-bold">Free Trials</span>
              </div>
              <div className="w-px h-8 bg-amber-500/40" />
              <div>
                <span className="text-2xl font-black text-indigo-300">{activePaidPlans}</span>
                <span className="text-[10px] text-slate-300 block font-bold">Paid Plans</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('expired')}
            className="p-4 rounded-2xl bg-slate-900/90 border border-red-500/50 text-center shadow-lg hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <span className="text-[11px] font-extrabold text-red-300 uppercase tracking-wider block">Plan Expired Companies</span>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-2xl font-black text-red-400">{expiredCompanies.length}</span>
              <span className="text-xs text-slate-300 font-bold">Expired Plans</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${activeTab === 'overview' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-500 dark:text-cyan-300 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          🔑 Keys & Companies Table
        </button>
        <button
          onClick={() => setActiveTab('features_hub')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all flex items-center gap-1.5 ${activeTab === 'features_hub' ? 'bg-purple-500/20 border-purple-500 text-purple-600 dark:text-purple-300 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          <Zap size={14} className="text-purple-400" /> ⚡ Company Features & Quotas Hub
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${activeTab === 'expired' ? 'bg-red-500/20 border-red-500 text-red-500 dark:text-red-300 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          ⚠️ Expired Companies ({expiredCompanies.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${activeTab === 'templates' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-500 dark:text-cyan-300 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          📑 System Templates Hub
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${activeTab === 'whatsapp' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-500 dark:text-indigo-300 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          💬 WhatsApp Cloud Logs
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${activeTab === 'pending' ? 'bg-amber-500/20 border-amber-500 text-amber-500 dark:text-amber-300 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          💳 Upgrades Pending ({upgradeRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${activeTab === 'employees' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-500 dark:text-cyan-300 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          👥 Tenant Employees
        </button>
      </div>

      {/* ⚡ NEW SECTION: COMPANY FEATURES & QUOTAS HUB (Side-by-side Feature Matrix & Instant Toggles) */}
      {activeTab === 'features_hub' && (
        <div className="crm-card p-5 border-purple-500/40 bg-card space-y-4 rounded-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Zap size={18} className="text-purple-500" /> Company Features & Quotas Hub
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Super Admin Master Control: Instantly enable/disable Email Marketing, WhatsApp Cloud, AI Engine, and adjust User Seats for any company.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-extrabold text-xs flex items-center gap-1.5 w-max">
              <Shield size={14} /> Instant Global Cascade (All Employees & Admins)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-400" /> Super Admin Rule:
            </p>
            <p>
              Toggling feature switches below updates tenant company subscription capabilities in real-time. Disabling a feature immediately locks access for all employees & company admins belonging to that tenant workspace.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Company Name</th>
                  <th className="p-3.5">User Seats Ratio</th>
                  <th className="p-3.5">Email Marketing</th>
                  <th className="p-3.5">WhatsApp Cloud</th>
                  <th className="p-3.5">AI Engine & Tier</th>
                  <th className="p-3.5 text-right">Configure Features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5">
                      <p className="font-black text-foreground">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{c.registrationKey} • {c.plan}</p>
                    </td>

                    {/* User Seats Allocation */}
                    <td className="p-3.5 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-500 dark:text-emerald-400">
                          {c.seatsUsed} / {c.seatsAllocated} Seats
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQuickAdjustSeats(c.id, -5)}
                            className="w-5 h-5 rounded bg-muted border border-border flex items-center justify-center font-black hover:bg-muted/80 text-foreground"
                            title="Decrease seats"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleQuickAdjustSeats(c.id, 5)}
                            className="w-5 h-5 rounded bg-muted border border-border flex items-center justify-center font-black hover:bg-muted/80 text-foreground"
                            title="Increase seats (+5)"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Email Marketing Toggle */}
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleInstantFeature(c.id, 'email', !c.emailConfig?.enabled)}
                        className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all ${c.emailConfig?.enabled ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'}`}
                      >
                        <Mail size={12} /> {c.emailConfig?.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </td>

                    {/* WhatsApp Cloud Toggle */}
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleInstantFeature(c.id, 'whatsapp', !c.whatsAppConfig?.enabled)}
                        className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all ${c.whatsAppConfig?.enabled ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'}`}
                      >
                        <MessageSquare size={12} /> {c.whatsAppConfig?.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </td>

                    {/* AI Engine & Tier Toggle */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleInstantFeature(c.id, 'ai', !c.aiConfig?.enabled)}
                          className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all ${c.aiConfig?.enabled ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'}`}
                        >
                          <Bot size={12} /> {c.aiConfig?.enabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                        {c.aiConfig?.enabled && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-muted border border-border text-foreground">
                            {c.aiConfig?.tier}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenEditModal(c, 'email')}
                        className="px-3.5 py-1.5 bg-purple-600/20 border border-purple-500/40 text-purple-600 dark:text-purple-300 hover:bg-purple-600/30 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <SlidersHorizontal size={13} /> Edit Quotas & Prompts
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ⚠️ EXPIRED COMPANIES SECTION */}
      {activeTab === 'expired' && (
        <div className="crm-card p-5 border-red-500/30 bg-card space-y-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <AlertCircle size={18} className="text-red-400" /> Plan Expired Companies List
              </h3>
              <p className="text-xs text-muted-foreground">Companies whose subscription plan or free trial expiry date has elapsed</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40">
              {expiredCompanies.length} Expired Tenants
            </span>
          </div>

          {expiredCompanies.length === 0 ? (
            <div className="p-8 text-center border border-border rounded-2xl bg-muted/20 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-foreground">No Expired Companies</p>
              <p className="text-xs text-muted-foreground">All registered tenant companies have active subscriptions and valid plan expiry dates.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-red-500/30">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-extrabold tracking-wider border-b border-red-500/30">
                  <tr>
                    <th className="p-3.5">Company Name</th>
                    <th className="p-3.5">Key</th>
                    <th className="p-3.5">Plan Tier</th>
                    <th className="p-3.5">Expiry Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expiredCompanies.map(c => (
                    <tr key={c.id} className="hover:bg-red-500/5 transition-colors">
                      <td className="p-3.5">
                        <p className="font-extrabold text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.adminEmail}</p>
                      </td>
                      <td className="p-3.5 font-mono text-cyan-500 font-bold">{c.registrationKey}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 border border-amber-500/30 text-amber-500">
                          {c.plan}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-red-500 font-bold">{c.expiryDate}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/20 border border-red-500/40 text-red-500 flex items-center gap-1 w-max">
                          <AlertCircle size={11} /> PLAN EXPIRED
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleExtendCompanyExpiry(c.id, 30)}
                          className="px-3 py-1 bg-emerald-600/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-600/30 rounded-xl font-bold text-xs inline-flex items-center gap-1 shadow"
                        >
                          <RefreshCw size={12} /> Extend Expiry (+30 Days)
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/40 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-600/30 rounded-xl font-bold text-xs inline-flex items-center gap-1"
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

      {/* 🔑 SECTION 2: KEYS AND THEIR COMPANIES TABLE */}
      {(activeTab === 'overview' || activeTab === 'keys') && (
        <div className="crm-card p-5 border-border bg-card space-y-4 rounded-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Key size={18} className="text-cyan-500" /> Keys and Their Companies Table
            </h3>
            <span className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 w-max">
              <Shield size={12} /> Auto-Created via Company Registration
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Registration Key</th>
                  <th className="p-3.5">Company Name</th>
                  <th className="p-3.5">Plan Tier</th>
                  <th className="p-3.5">Active Features</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5">Users & Seats</th>
                  <th className="p-3.5 text-right">Edit Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companies.map(c => {
                  const isCompExpired = c.isExpired || (c.expiryDate && new Date(c.expiryDate) < new Date());
                  return (
                    <tr key={c.id} className={`transition-colors ${isCompExpired ? 'bg-red-500/10 hover:bg-red-500/15' : 'hover:bg-muted/40'}`}>
                      <td className="p-3.5 font-mono text-cyan-600 dark:text-cyan-400 font-extrabold">{c.registrationKey}</td>
                      <td className="p-3.5">
                        <p className="font-extrabold text-foreground">{c.name}</p>
                        {isCompExpired && (
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-wider block">⚠️ PLAN EXPIRED</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${isCompExpired ? 'bg-red-500/20 border-red-500/40 text-red-500' : c.plan === 'FREE_TRIAL' ? 'bg-amber-500/20 border-amber-500/30 text-amber-500' : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-500'}`}>
                          {c.plan} {isCompExpired ? '(EXPIRED)' : ''}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${c.emailConfig?.enabled ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-muted text-muted-foreground'}`}>
                            MAIL: {c.emailConfig?.enabled ? 'ON' : 'OFF'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${c.whatsAppConfig?.enabled ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' : 'bg-muted text-muted-foreground'}`}>
                            WA: {c.whatsAppConfig?.enabled ? 'ON' : 'OFF'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${c.aiConfig?.enabled ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30' : 'bg-muted text-muted-foreground'}`}>
                            AI: {c.aiConfig?.enabled ? c.aiConfig.tier : 'OFF'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground">
                        <span className={isCompExpired ? 'text-red-500 font-bold' : ''}>{c.expiryDate}</span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {c.seatsUsed} Used ({c.seatsAllocated} Allocated)
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {isCompExpired && (
                          <button onClick={() => handleExtendCompanyExpiry(c.id, 30)} className="px-2.5 py-1 bg-emerald-600/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-600/30 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                            <RefreshCw size={11} /> +30 Days
                          </button>
                        )}
                        <button onClick={() => handleOpenEditModal(c, 'general')} className="px-3.5 py-1 bg-cyan-600/20 border border-cyan-500/40 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-600/30 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                          <Edit2 size={12} /> Edit & Features
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

      {/* 📑 SECTION 4: SYSTEM TEMPLATES HUB */}
      {activeTab === 'templates' && (
        <div className="crm-card p-5 border-border bg-card space-y-4 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Layers size={18} className="text-cyan-500" /> System Templates Hub ("Tamplets")
            </h3>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-xl border border-border">
              <button onClick={() => setTemplateTab('funnel')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${templateTab === 'funnel' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                Lead Funnel Templates
              </button>
              <button onClick={() => setTemplateTab('whatsapp')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${templateTab === 'whatsapp' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                Whatsapp Cloud Templates
              </button>
              <button onClick={() => setTemplateTab('email')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${templateTab === 'email' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                Email Templates
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-3">
            <h4 className="text-xs font-bold text-cyan-500 dark:text-cyan-300 uppercase tracking-wider">Add New {templateTab.toUpperCase()} Template</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="crm-input text-xs w-full" placeholder="Template Title" value={newTemplateTitle} onChange={e => setNewTemplateTitle(e.target.value)} />
              <button onClick={handleAddTemplate} className="btn-primary text-xs py-2 px-4 font-bold flex items-center justify-center gap-1.5">
                <Plus size={14} /> Add Template
              </button>
            </div>
            <textarea className="crm-input text-xs w-full h-20" placeholder="Enter template content / stage structure..." value={newTemplateContent} onChange={e => setNewTemplateContent(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.filter(t => t.category === templateTab).map(t => (
              <div key={t.id} className="p-4 rounded-2xl bg-muted/30 border border-border relative space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">{t.title}</h4>
                  <button onClick={() => handleDeleteTemplate(t.id)} className="text-rose-500 hover:text-rose-400 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-mono bg-muted/60 p-3 rounded-xl border border-border leading-relaxed">
                  {t.content}
                </p>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block">
                  STATUS: {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 💬 SECTION 5: WHATSAPP CLOUD USES TABLE */}
      {(activeTab === 'overview' || activeTab === 'whatsapp') && (
        <div className="crm-card p-5 border-border bg-card space-y-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <MessageSquare size={18} className="text-cyan-500" /> WhatsApp Cloud Uses & Logs Table
            </h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Company Name</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5">WhatsApp Feature Status</th>
                  <th className="p-3.5">Messages Used / Limit</th>
                  <th className="p-3.5 text-center">Date Wise Chat Log</th>
                  <th className="p-3.5 text-right">Edit Configuration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 font-black text-foreground">{c.name}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
                        {c.plan}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${c.whatsAppConfig?.enabled ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-rose-500/20 text-rose-500 border-rose-500/30'}`}>
                        {c.whatsAppConfig?.enabled ? 'ENABLED' : 'DISABLED BY SUPER ADMIN'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-cyan-600 dark:text-cyan-300 font-bold">
                      {(c.whatsAppConfig?.used ?? 0).toLocaleString()} / {(c.whatsAppConfig?.monthlyLimit ?? 0).toLocaleString()} Msgs
                    </td>
                    <td className="p-3.5 text-center">
                      <button onClick={() => handleOpenDateWiseChatModal(c)} className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600/30 rounded-xl font-bold text-[11px] inline-flex items-center gap-1">
                        <Calendar size={12} /> Date Wise Chat Log
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <button onClick={() => handleOpenEditModal(c, 'whatsapp')} className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/40 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-600/30 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                        <Edit2 size={12} /> Edit WA Settings
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 💳 SECTION 6: PENDING APPROVAL */}
      {(activeTab === 'overview' || activeTab === 'pending') && (
        <div className="crm-card p-5 border-border bg-card space-y-4 rounded-2xl">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <CreditCard size={18} className="text-purple-400" /> Pending Approval Queue ({upgradeRequests.length})
          </h3>
          {upgradeRequests.length === 0 ? (
            <div className="p-8 text-center bg-muted/30 rounded-2xl border border-border text-muted-foreground text-xs">
              No pending plan upgrade requests requiring Super Admin approval at this time.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upgradeRequests.map(req => (
                <div key={req.id} className="p-4 rounded-2xl bg-muted/40 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">{req.companyName}</h4>
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                      {req.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 font-mono">
                    <p>Requested Plan: <strong className="text-cyan-500">{req.requestedPlan}</strong></p>
                    <p>Amount Paid: <strong className="text-emerald-500">₹{req.amountInr}</strong></p>
                    <p>Order ID: <span>{req.razorpayOrderId}</span></p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button className="px-3 py-1.5 bg-rose-600/20 text-rose-500 border border-rose-500/30 rounded-xl text-xs font-bold">Reject</button>
                    <button className="btn-primary text-xs px-4 py-1.5">Approve Upgrade ✓</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 👥 SECTION 7: COMPANIES AND THEIR EMPLOYEES */}
      {(activeTab === 'overview' || activeTab === 'employees') && (
        <div className="crm-card p-5 border-border bg-card space-y-4 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Users size={18} className="text-cyan-500" /> Companies and Their Employees
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Select Company Workspace:</label>
              <select
                className="crm-input text-xs h-9 min-w-[200px]"
                value={selectedCompanyId}
                onChange={e => setSelectedCompanyId(e.target.value)}
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.seatsUsed}/{c.seatsAllocated} Seats)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Employee Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Registration Key Used</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companyEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No registered employees found for selected company workspace.
                    </td>
                  </tr>
                ) : (
                  companyEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 font-bold text-foreground">{emp.name}</td>
                      <td className="p-3.5 font-mono text-cyan-600 dark:text-cyan-300">{emp.email}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border uppercase">
                          {emp.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground">{emp.keyUsed}</td>
                      <td className="p-3.5">
                        {emp.isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30">
                            DEACTIVATED / BLOCKED
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleBlockUser(emp.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${emp.isActive ? 'bg-rose-600/20 border-rose-500/30 text-rose-500 hover:bg-rose-600/30' : 'bg-emerald-600/20 border-emerald-500/30 text-emerald-500 hover:bg-emerald-600/30'}`}
                        >
                          {emp.isActive ? 'Block Employee' : 'Unblock Employee'}
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

      {/* 🛠️ SECTION 3 MULTI-TAB MODAL: COMPANY EDIT & FEATURE CONTROL HUB */}
      {editModalOpen && editingCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-card border border-cyan-500/40 rounded-3xl shadow-2xl relative space-y-5 text-foreground">
            <button onClick={() => setEditModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground font-black text-lg">✕</button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center font-black">
                <Building2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">Manage Company Features & Subscription</h3>
                <p className="text-xs text-muted-foreground font-mono">{editingCompany.name} • {editingCompany.registrationKey}</p>
              </div>
            </div>

            {/* Modal Internal Navigation Tabs */}
            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-2xl border border-border overflow-x-auto text-xs font-extrabold">
              <button
                onClick={() => setEditModalTab('general')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${editModalTab === 'general' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <SlidersHorizontal size={14} /> General & Seats
              </button>
              <button
                onClick={() => setEditModalTab('email')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${editModalTab === 'email' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Mail size={14} /> Email Marketing
              </button>
              <button
                onClick={() => setEditModalTab('whatsapp')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${editModalTab === 'whatsapp' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <MessageSquare size={14} /> WhatsApp Cloud
              </button>
              <button
                onClick={() => setEditModalTab('ai')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${editModalTab === 'ai' ? 'bg-purple-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Bot size={14} /> AI Engine Customization
              </button>
            </div>

            {/* TAB 1: GENERAL & SEATS */}
            {editModalTab === 'general' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Company Name *</label>
                  <input className="crm-input w-full text-sm font-bold" value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Subscription Plan Tier</label>
                    <select className="crm-input w-full text-sm font-bold text-cyan-500" value={editPlan} onChange={e => handleEditPlanChange(e.target.value as PlanType)}>
                      <option value="FREE_TRIAL">Free Trial (10 Users · 15-40 Days)</option>
                      <option value="GROWTH">Growth Plan (20 Users · All AI · No WA/Email)</option>
                      <option value="BUSINESS">Business Plan (50 Users · All Features)</option>
                      <option value="ENTERPRISE">Enterprise Plan (100 Users · All Features)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Total Allocated User Seats</label>
                    <input type="number" className="crm-input w-full text-sm font-mono font-bold" value={editSeats} onChange={e => setEditSeats(parseInt(e.target.value, 10))} />
                  </div>
                </div>

                {editPlan === 'FREE_TRIAL' && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                        <Clock size={14} /> Free Trial Duration (15 to 40 Days)
                      </label>
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500">
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
                      className="w-full accent-amber-500 cursor-pointer h-2 bg-muted rounded-lg"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Expiration Date</label>
                    <input type="date" className="crm-input w-full text-sm font-bold" value={editExpiryDate} onChange={e => setEditExpiryDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Workspace Operation Status</label>
                    <select className="crm-input w-full text-sm font-bold" value={editIsActive ? 'ACTIVE' : 'SUSPENDED'} onChange={e => setEditIsActive(e.target.value === 'ACTIVE')}>
                      <option value="ACTIVE">ACTIVE (Normal Workspace Operation)</option>
                      <option value="SUSPENDED">SUSPENDED (Block Workspace Access)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EMAIL MARKETING */}
            {editModalTab === 'email' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                      <Mail size={16} className="text-emerald-500" /> Enable Email Marketing Feature
                    </h4>
                    <p className="text-[11px] text-muted-foreground">Controls access for all admins & employees of {editingCompany.name}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editEmailEnabled}
                    onChange={e => setEditEmailEnabled(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Monthly Email Quota Limit</label>
                    <input
                      type="number"
                      className="crm-input w-full text-sm font-mono font-bold"
                      value={editEmailLimit}
                      onChange={e => setEditEmailLimit(+e.target.value)}
                      disabled={!editEmailEnabled}
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Sender Domain Verification</label>
                    <input
                      className="crm-input w-full text-sm font-mono"
                      placeholder="e.g. company.com"
                      value={editEmailSenderDomain}
                      onChange={e => setEditEmailSenderDomain(e.target.value)}
                      disabled={!editEmailEnabled}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: WHATSAPP CLOUD */}
            {editModalTab === 'whatsapp' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                      <MessageSquare size={16} className="text-indigo-500" /> Enable WhatsApp Cloud Feature
                    </h4>
                    <p className="text-[11px] text-muted-foreground">Controls broadcast & live chat access for all employees of {editingCompany.name}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editWAEnabled}
                    onChange={e => setEditWAEnabled(e.target.checked)}
                    className="w-5 h-5 accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Monthly Message Limit</label>
                    <input
                      type="number"
                      className="crm-input w-full text-sm font-mono font-bold"
                      value={editWALimit}
                      onChange={e => setEditWALimit(+e.target.value)}
                      disabled={!editWAEnabled}
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Configured WhatsApp Phone Number</label>
                    <input
                      className="crm-input w-full text-sm font-mono"
                      placeholder="+91..."
                      value={editWAPhoneNumber}
                      onChange={e => setEditWAPhoneNumber(e.target.value)}
                      disabled={!editWAEnabled}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: AI CUSTOMIZATION */}
            {editModalTab === 'ai' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                      <Bot size={16} className="text-purple-500" /> Enable AI Sales Assistant & Lead Engine
                    </h4>
                    <p className="text-[11px] text-muted-foreground">Controls AI lead scoring and smart response generator for {editingCompany.name}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editAIEnabled}
                    onChange={e => setEditAIEnabled(e.target.checked)}
                    className="w-5 h-5 accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">AI Tier Allocation</label>
                    <select
                      className="crm-input w-full text-sm font-extrabold text-purple-600 dark:text-purple-300"
                      value={editAITier}
                      onChange={e => setEditAITier(e.target.value as AITierType)}
                      disabled={!editAIEnabled}
                    >
                      <option value="BASIC">BASIC (Lead Score Only)</option>
                      <option value="PRO">PRO (Score + Sentiment + Pitch)</option>
                      <option value="ENTERPRISE_CUSTOM">ENTERPRISE CUSTOM (Full AI + Custom Bot Prompt)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Monthly AI Token Limit</label>
                    <input
                      type="number"
                      className="crm-input w-full text-sm font-mono font-bold"
                      value={editAITokenLimit}
                      onChange={e => setEditAITokenLimit(+e.target.value)}
                      disabled={!editAIEnabled}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Custom AI Assistant System Instructions / Persona Prompt</label>
                  <textarea
                    className="crm-input w-full h-24 text-xs font-mono"
                    placeholder="Enter custom instructions for tenant's sales reps AI assistant..."
                    value={editAIPrompt}
                    onChange={e => setEditAIPrompt(e.target.value)}
                    disabled={!editAIEnabled}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button onClick={() => setEditModalOpen(false)} className="px-4 py-2.5 bg-muted text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button onClick={handleSaveCompanyEdit} className="btn-primary text-xs px-6 py-2.5 shadow-lg bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-extrabold">
                Save Company Features & Quotas ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date-Wise Chat Log Modal */}
      {chatLogModalOpen && chatLogCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-card border border-indigo-500/30 rounded-3xl shadow-2xl relative space-y-4 text-foreground">
            <button onClick={() => setChatLogModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground font-bold">✕</button>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar size={18} className="text-indigo-500" /> Date Wise Chat Logs for {chatLogCompany.name}
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Messages Sent</th>
                    <th className="p-3">Delivery Rate</th>
                    <th className="p-3">Active Chats</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dailyLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-muted/50">
                      <td className="p-3 font-mono font-bold text-foreground">{log.date}</td>
                      <td className="p-3 font-mono text-cyan-500">{log.messagesSent}</td>
                      <td className="p-3 font-mono text-emerald-500">{log.deliveryRate}%</td>
                      <td className="p-3 font-mono text-muted-foreground">{log.activeChats}</td>
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
    </div>
  );
}
