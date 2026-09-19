'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Users, Shield, Zap, DollarSign, Tag, Check, X,
  Plus, Trash2, Edit2, Key, CheckCircle2, MessageSquare, Mail, RefreshCw, QrCode, CreditCard,
  Ban, Lock, Unlock, TrendingUp, UserX, UserCheck, Eye, ChevronRight, Calendar, Sparkles, Filter, Layers, Clock, PhoneCall, Bot, SlidersHorizontal
} from 'lucide-react';
import { useAuth, CompanySubscription, PlanType } from '@/context/AuthContext';

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
    totalUsersCount: 11,
    totalLeads: 142,
    convertedLeads: 38,
    conversionRate: 26.7,
    isActive: true,
    createdAt: '2026-08-01',
    expiryDate: '2026-09-30',
    emailConfig: { enabled: false, monthlyLimit: 5000, used: 120, senderDomain: 'acme.com' },
    whatsAppConfig: { enabled: false, monthlyLimit: 10000, used: 0, status: 'NOT_CONFIGURED' },
    aiConfig: { enabled: true, tier: 'BASIC', customSystemPrompt: 'Acme Sales AI Assistant.', monthlyTokenLimit: 100000, tokensUsed: 12000 },
  },
  {
    id: 'comp_growth',
    name: 'NextGen Growth Tech',
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
    emailConfig: { enabled: true, monthlyLimit: 25000, used: 6400, senderDomain: 'nextgen.com' },
    whatsAppConfig: { enabled: false, monthlyLimit: 20000, used: 0, status: 'DISCONNECTED' },
    aiConfig: { enabled: true, tier: 'PRO', customSystemPrompt: 'Retail AI Lead Assistant.', monthlyTokenLimit: 250000, tokensUsed: 74000 },
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
    emailConfig: { enabled: true, monthlyLimit: 100000, used: 28400, senderDomain: 'apexcorp.com' },
    whatsAppConfig: { enabled: true, monthlyLimit: 100000, used: 28400, status: 'CONNECTED', phoneNumber: '+919876543210' },
    aiConfig: { enabled: true, tier: 'PRO', customSystemPrompt: 'Enterprise Apex AI Assistant.', monthlyTokenLimit: 500000, tokensUsed: 198000 },
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
    emailConfig: { enabled: true, monthlyLimit: 500000, used: 198400, senderDomain: 'globalholdings.com' },
    whatsAppConfig: { enabled: true, monthlyLimit: 500000, used: 94200, status: 'CONNECTED', phoneNumber: '+919988776655' },
    aiConfig: { enabled: true, tier: 'ENTERPRISE_CUSTOM', customSystemPrompt: 'Global Enterprise Multi-regional AI Assistant.', monthlyTokenLimit: 2000000, tokensUsed: 740000 },
  },
];

const INITIAL_KEYS: KeyRecord[] = [
  { id: 'key_1', key: 'ACME-KX-7421', companyName: 'Acme Sales Solutions', planTier: 'FREE_TRIAL', memberLimit: 10, validityDays: 30, status: 'ACTIVE', expiresAt: '2026-09-30', createdAt: '2026-08-01' },
  { id: 'key_2', key: 'NGEN-GR-2041', companyName: 'NextGen Growth Tech', planTier: 'GROWTH', memberLimit: 20, validityDays: 365, status: 'ACTIVE', expiresAt: '2026-12-31', createdAt: '2026-07-15' },
  { id: 'key_3', key: 'APEX-BZ-5088', companyName: 'Apex Business Solutions', planTier: 'BUSINESS', memberLimit: 50, validityDays: 365, status: 'ACTIVE', expiresAt: '2026-12-31', createdAt: '2026-06-01' },
  { id: 'key_4', key: 'GLBL-EP-1002', companyName: 'Global Enterprise Holdings', planTier: 'ENTERPRISE', memberLimit: 100, validityDays: 365, status: 'ACTIVE', expiresAt: '2027-05-01', createdAt: '2026-05-01' },
];

export function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<CompanyRecord[]>(INITIAL_COMPANIES);
  const [keysList, setKeysList] = useState<KeyRecord[]>(INITIAL_KEYS);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  
  const [activeSection, setActiveSection] = useState<
    'overview' | 'features_hub' | 'keys' | 'edit_modal' | 'templates' | 'whatsapp' | 'pending' | 'employees'
  >('overview');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalTab, setEditModalTab] = useState<'general' | 'email' | 'whatsapp' | 'ai'>('general');
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);

  // Edit states
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState<PlanType>('FREE_TRIAL');
  const [editSeats, setEditSeats] = useState(10);
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editEmailEnabled, setEditEmailEnabled] = useState(true);
  const [editEmailLimit, setEditEmailLimit] = useState(25000);
  const [editWAEnabled, setEditWAEnabled] = useState(true);
  const [editWALimit, setEditWALimit] = useState(50000);
  const [editAIEnabled, setEditAIEnabled] = useState(true);
  const [editAITier, setEditAITier] = useState<AITierType>('PRO');
  const [editAIPrompt, setEditAIPrompt] = useState('');

  const [chatLogModalOpen, setChatLogModalOpen] = useState(false);
  const [chatLogCompany, setChatLogCompany] = useState<CompanyRecord | null>(null);
  const [dailyLogs, setDailyLogs] = useState<WhatsAppDailyLog[]>([]);

  const { updateSubscription } = useAuth();

  const handleOpenEditModal = (comp: CompanyRecord, tab: 'general' | 'email' | 'whatsapp' | 'ai' = 'general') => {
    setEditingCompany(comp);
    setEditModalTab(tab);
    setEditName(comp.name);
    setEditPlan(comp.plan);
    setEditSeats(comp.seatsAllocated);
    setEditExpiryDate(comp.expiryDate);

    setEditEmailEnabled(comp.emailConfig?.enabled ?? true);
    setEditEmailLimit(comp.emailConfig?.monthlyLimit ?? 25000);

    setEditWAEnabled(comp.whatsAppConfig?.enabled ?? true);
    setEditWALimit(comp.whatsAppConfig?.monthlyLimit ?? 50000);

    setEditAIEnabled(comp.aiConfig?.enabled ?? true);
    setEditAITier(comp.aiConfig?.tier || 'PRO');
    setEditAIPrompt(comp.aiConfig?.customSystemPrompt || '');

    setEditModalOpen(true);
  };

  const handleSaveCompanyEdit = () => {
    if (!editingCompany) return;
    setCompanies(prev => prev.map(c => c.id === editingCompany.id ? {
      ...c,
      name: editName,
      plan: editPlan,
      seatsAllocated: editSeats,
      expiryDate: editExpiryDate,
      emailConfig: { ...c.emailConfig, enabled: editEmailEnabled, monthlyLimit: editEmailLimit },
      whatsAppConfig: { ...c.whatsAppConfig, enabled: editWAEnabled, monthlyLimit: editWALimit },
      aiConfig: { ...c.aiConfig, enabled: editAIEnabled, tier: editAITier, customSystemPrompt: editAIPrompt },
    } : c));
    setEditModalOpen(false);
  };

  const handleToggleInstantFeature = (companyId: string, feature: 'email' | 'whatsapp' | 'ai', nextState: boolean) => {
    setCompanies(prev => prev.map(c => {
      if (c.id !== companyId) return c;
      if (feature === 'email') return { ...c, emailConfig: { ...c.emailConfig, enabled: nextState } };
      if (feature === 'whatsapp') return { ...c, whatsAppConfig: { ...c.whatsAppConfig, enabled: nextState } };
      if (feature === 'ai') return { ...c, aiConfig: { ...c.aiConfig, enabled: nextState } };
      return c;
    }));
  };

  const totalCompanies = companies.length;
  const totalUsers = companies.reduce((acc, c) => acc + c.totalUsersCount, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-foreground">
      {/* ── TOP BANNER & SECTION TABS ─────────────────────────────────────────────── */}
      <div className="crm-card p-6 border-cyan-500/40 bg-gradient-to-r from-slate-950 via-cyan-950/80 to-slate-950 text-white shadow-2xl rounded-3xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 font-black flex items-center justify-center text-xl shadow-xl border border-cyan-500/40">
              SA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">Super Admin Dashboard</h1>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PLATFORM CONTROL HUB
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Control hub for managing company keys, subscriptions, WhatsApp Cloud, Email Marketing, AI Engine, and User Seats.</p>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center gap-2 pt-6 mt-6 border-t border-slate-800 overflow-x-auto">
          <button onClick={() => setActiveSection('overview')} className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${activeSection === 'overview' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
            🔑 Overview & Keys
          </button>
          <button onClick={() => setActiveSection('features_hub')} className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${activeSection === 'features_hub' ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
            <Zap size={14} className="text-purple-400" /> ⚡ Company Features Hub
          </button>
        </div>
      </div>

      {/* FEATURES HUB TAB */}
      {activeSection === 'features_hub' && (
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
              <tbody className="divide-y divide-border">
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5">
                      <p className="font-black text-foreground">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{c.registrationKey} • {c.plan}</p>
                    </td>

                    <td className="p-3.5 font-mono font-bold text-emerald-500 dark:text-emerald-400">
                      {c.seatsUsed} / {c.seatsAllocated} Seats
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleInstantFeature(c.id, 'email', !c.emailConfig?.enabled)}
                        className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all ${c.emailConfig?.enabled ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'}`}
                      >
                        <Mail size={12} /> {c.emailConfig?.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleInstantFeature(c.id, 'whatsapp', !c.whatsAppConfig?.enabled)}
                        className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all ${c.whatsAppConfig?.enabled ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'}`}
                      >
                        <MessageSquare size={12} /> {c.whatsAppConfig?.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleInstantFeature(c.id, 'ai', !c.aiConfig?.enabled)}
                        className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all ${c.aiConfig?.enabled ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'}`}
                      >
                        <Bot size={12} /> {c.aiConfig?.enabled ? c.aiConfig?.tier : 'DISABLED'}
                      </button>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenEditModal(c, 'email')}
                        className="px-3.5 py-1.5 bg-purple-600/20 border border-purple-500/40 text-purple-600 dark:text-purple-300 hover:bg-purple-600/30 rounded-xl font-bold text-xs inline-flex items-center gap-1.5"
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

      {/* OVERVIEW / KEYS TAB */}
      {(activeSection === 'overview' || activeSection === 'keys') && (
        <div className="crm-card p-5 border-border bg-card space-y-4 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg text-foreground flex items-center gap-2">
              <Key size={18} className="text-cyan-500" /> Keys and Their Companies Table
            </h2>
            <span className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 w-max">
              <Shield size={12} /> Auto-Created via Company Registration
            </span>
          </div>

          <div className="overflow-x-auto border border-border rounded-2xl">
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
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-3.5 font-mono text-cyan-600 dark:text-cyan-400 font-extrabold">{c.registrationKey}</td>
                    <td className="p-3.5 font-extrabold text-foreground">{c.name}</td>
                    <td className="p-3.5 font-bold text-indigo-500">{c.plan}</td>
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
                    <td className="p-3.5 font-mono text-muted-foreground">{c.expiryDate}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {c.seatsUsed} / {c.seatsAllocated} Allocated
                    </td>
                    <td className="p-3.5 text-right">
                      <button onClick={() => handleOpenEditModal(c, 'general')} className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/40 text-cyan-600 dark:text-cyan-300 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                        <Edit2 size={12} /> Edit & Features
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MULTI TAB EDIT MODAL */}
      {editModalOpen && editingCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 bg-card border border-cyan-500/40 rounded-3xl shadow-2xl relative space-y-5 text-foreground">
            <button onClick={() => setEditModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground font-black text-lg">✕</button>
            <h3 className="text-lg font-black text-foreground">Manage Company Features & Subscription</h3>

            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-2xl border border-border text-xs font-extrabold">
              <button onClick={() => setEditModalTab('general')} className={`px-3 py-1.5 rounded-xl ${editModalTab === 'general' ? 'bg-cyan-500 text-slate-950' : 'text-muted-foreground'}`}>General & Seats</button>
              <button onClick={() => setEditModalTab('email')} className={`px-3 py-1.5 rounded-xl ${editModalTab === 'email' ? 'bg-cyan-500 text-slate-950' : 'text-muted-foreground'}`}>Email Marketing</button>
              <button onClick={() => setEditModalTab('whatsapp')} className={`px-3 py-1.5 rounded-xl ${editModalTab === 'whatsapp' ? 'bg-cyan-500 text-slate-950' : 'text-muted-foreground'}`}>WhatsApp Cloud</button>
              <button onClick={() => setEditModalTab('ai')} className={`px-3 py-1.5 rounded-xl ${editModalTab === 'ai' ? 'bg-purple-600 text-white' : 'text-muted-foreground'}`}>AI Customization</button>
            </div>

            {editModalTab === 'general' && (
              <div className="space-y-3 text-xs">
                <input className="crm-input w-full font-bold" value={editName} onChange={e => setEditName(e.target.value)} />
                <input type="number" className="crm-input w-full font-mono font-bold" value={editSeats} onChange={e => setEditSeats(+e.target.value)} />
              </div>
            )}

            {editModalTab === 'email' && (
              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-2 font-bold text-foreground">
                  <input type="checkbox" checked={editEmailEnabled} onChange={e => setEditEmailEnabled(e.target.checked)} className="w-5 h-5 accent-emerald-500" /> Enable Email Marketing
                </label>
                <input type="number" className="crm-input w-full font-mono font-bold" value={editEmailLimit} onChange={e => setEditEmailLimit(+e.target.value)} disabled={!editEmailEnabled} />
              </div>
            )}

            {editModalTab === 'whatsapp' && (
              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-2 font-bold text-foreground">
                  <input type="checkbox" checked={editWAEnabled} onChange={e => setEditWAEnabled(e.target.checked)} className="w-5 h-5 accent-indigo-500" /> Enable WhatsApp Cloud
                </label>
                <input type="number" className="crm-input w-full font-mono font-bold" value={editWALimit} onChange={e => setEditWALimit(+e.target.value)} disabled={!editWAEnabled} />
              </div>
            )}

            {editModalTab === 'ai' && (
              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-2 font-bold text-foreground">
                  <input type="checkbox" checked={editAIEnabled} onChange={e => setEditAIEnabled(e.target.checked)} className="w-5 h-5 accent-purple-500" /> Enable AI Sales Assistant
                </label>
                <textarea className="crm-input w-full h-20 font-mono" value={editAIPrompt} onChange={e => setEditAIPrompt(e.target.value)} disabled={!editAIEnabled} />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleSaveCompanyEdit} className="btn-primary text-xs px-5 py-2">Save Settings ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
