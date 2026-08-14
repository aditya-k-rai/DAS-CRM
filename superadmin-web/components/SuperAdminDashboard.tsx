'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Users, Shield, Zap, DollarSign, Tag, Check, X,
  Plus, Trash2, Edit2, Key, CheckCircle2, MessageSquare, Mail, RefreshCw, QrCode, CreditCard,
  Ban, Lock, Unlock, TrendingUp, UserX, UserCheck, Eye, ChevronRight, Calendar, Sparkles, Filter, Layers, Clock, PhoneCall
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

const INITIAL_COMPANIES: CompanyRecord[] = [];
const INITIAL_KEYS: KeyRecord[] = [];
const INITIAL_UPGRADE_REQUESTS: UpgradeRequest[] = [];

export function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<CompanyRecord[]>(INITIAL_COMPANIES);
  const [keysList, setKeysList] = useState<KeyRecord[]>(INITIAL_KEYS);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>(INITIAL_UPGRADE_REQUESTS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'templates' | 'whatsapp' | 'pending' | 'employees'>('overview');
  const [templateTab, setTemplateTab] = useState<'funnel' | 'whatsapp' | 'email'>('funnel');

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState<PlanType>('FREE_TRIAL');
  const [editSeats, setEditSeats] = useState(6);
  const [editExpiryDate, setEditExpiryDate] = useState('');

  const [chatLogModalOpen, setChatLogModalOpen] = useState(false);
  const [chatLogCompany, setChatLogCompany] = useState<CompanyRecord | null>(null);
  const [dailyLogs, setDailyLogs] = useState<WhatsAppDailyLog[]>([]);

  const [genKeyModalOpen, setGenKeyModalOpen] = useState(false);
  const [genCompanyName, setGenCompanyName] = useState('');
  const [genPlan, setGenPlan] = useState<PlanType>('FREE_TRIAL');
  const [genSeats, setGenSeats] = useState(6);
  const [genValidityDays, setGenValidityDays] = useState(30);

  const [selectedCompanyForEmployees, setSelectedCompanyForEmployees] = useState<CompanyRecord | null>(null);
  const [companyEmployees, setCompanyEmployees] = useState<CompanyEmployee[]>([]);

  useEffect(() => {
    fetchBackendData();
  }, []);

  const fetchBackendData = async () => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const compRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies`, { headers });
      if (compRes.ok) {
        const data = await compRes.json();
        if (Array.isArray(data)) setCompanies(data);
      }

      const keysRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/keys`, { headers });
      if (keysRes.ok) {
        const data = await keysRes.json();
        if (data.companyKeys) setKeysList(data.companyKeys);
      }
    } catch (err) {
      console.warn('Backend API connection notice:', err);
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
    setEditModalOpen(true);
  };

  const handleSaveCompanyEdit = async () => {
    if (!editingCompany) return;
    setCompanies(prev => prev.map(c => c.id === editingCompany.id ? { ...c, name: editName, plan: editPlan, seatsAllocated: editSeats, expiryDate: editExpiryDate } : c));
    setEditModalOpen(false);
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
      }
    } catch (e) {
      setGenKeyModalOpen(false);
    }
  };

  const handleToggleBlockUser = async (empId: string) => {
    setCompanyEmployees(prev => prev.map(e => e.id === empId ? { ...e, isActive: !e.isActive } : e));
  };

  const totalCompanies = companies.length;
  const totalUsers = companies.reduce((acc, c) => acc + (c.totalUsersCount || 0), 0);
  const activeCompanies = companies.filter(c => c.isActive).length;
  const activeFreeTrials = companies.filter(c => c.plan === 'FREE_TRIAL').length;
  const activePaidPlans = companies.filter(c => c.plan !== 'FREE_TRIAL').length;

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Top Banner KPI Header */}
      <div className="crm-card p-6 border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 relative overflow-hidden shadow-2xl rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
              👑 SYSTEM OVERLORD PORTAL
            </span>
            <h1 className="text-2xl font-black text-white mt-2">Super Admin Control Center</h1>
            <p className="text-xs text-slate-400">Multi-Tenant Organization Management, Key Provisioning & System Templates</p>
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

        {/* 7 KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Total Client Companies</span>
            <span className="text-xl font-black text-white">{totalCompanies}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Total Active Users</span>
            <span className="text-xl font-black text-cyan-400">{totalUsers}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Active Companies</span>
            <span className="text-xl font-black text-emerald-400">{activeCompanies}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Active Free Trials</span>
            <span className="text-xl font-black text-amber-400">{activeFreeTrials}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Active Paid Plans</span>
            <span className="text-xl font-black text-indigo-400">{activePaidPlans}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Pending Requests</span>
            <span className="text-xl font-black text-purple-400">{upgradeRequests.length}</span>
          </div>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 text-xs font-bold rounded-xl border ${activeTab === 'overview' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
          🏢 Keys & Companies Table
        </button>
        <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 text-xs font-bold rounded-xl border ${activeTab === 'templates' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
          📑 System Templates Hub
        </button>
        <button onClick={() => setActiveTab('whatsapp')} className={`px-4 py-2 text-xs font-bold rounded-xl border ${activeTab === 'whatsapp' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
          💬 WhatsApp Cloud Usage & Logs
        </button>
        <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 text-xs font-bold rounded-xl border ${activeTab === 'pending' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
          💳 Pending Upgrade Approvals ({upgradeRequests.length})
        </button>
      </div>

      {/* Section 1: Keys & Companies Table */}
      {activeTab === 'overview' && (
        <div className="crm-card p-5 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 size={16} className="text-cyan-400" /> Keys and Their Companies Table
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Key</th>
                  <th className="p-3">Company Name</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">No. of Users</th>
                  <th className="p-3 text-right">Edit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No client companies registered yet. Generate a Company Key above to onboard your first customer!
                    </td>
                  </tr>
                ) : (
                  companies.map(c => (
                    <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 font-mono text-cyan-400 font-bold">{c.registrationKey || 'N/A'}</td>
                      <td className="p-3 font-bold text-white">{c.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {c.plan}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{c.expiryDate || 'N/A'}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">{c.seatsUsed}/{c.seatsAllocated}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleOpenEditModal(c)} className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/40 rounded-lg font-bold text-[11px] inline-flex items-center gap-1">
                          <Edit2 size={12} /> Edit Details
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

      {/* Edit Company Modal */}
      {editModalOpen && editingCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-lg w-full p-6 bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl relative space-y-4">
            <button onClick={() => setEditModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold">✕</button>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit2 size={18} className="text-cyan-400" /> Edit Company & Upgrade Plan
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Company Name</label>
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
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleSaveCompanyEdit} className="btn-primary text-xs px-5 py-2">Save Company Changes</button>
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
                <input className="crm-input w-full text-sm" placeholder="e.g. Apex Tech Solutions" value={genCompanyName} onChange={e => setGenCompanyName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Plan Tier</label>
                  <select className="crm-input w-full text-sm" value={genPlan} onChange={e => setGenPlan(e.target.value as PlanType)}>
                    <option value="FREE_TRIAL">FREE_TRIAL (7 Days, 6 Seats)</option>
                    <option value="STARTER">STARTER (30 Days, 10 Seats)</option>
                    <option value="PRO">PRO (30 Days, 25 Seats)</option>
                    <option value="PRO_MAX">PRO_MAX (365 Days, 100 Seats)</option>
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
