'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Users, Shield, Zap, DollarSign, Tag, Check, X,
  Plus, Trash2, Edit2, Key, CheckCircle2, MessageSquare, Mail, RefreshCw, QrCode, CreditCard,
  Ban, Lock, Unlock, TrendingUp, UserX, UserCheck, Eye, ChevronRight, UserPlus
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
  phone?: string;
  companyType?: string;
  sector?: string;
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

interface InDepthCompanyDetails {
  organization: {
    id: string;
    name: string;
    adminName: string;
    adminEmail: string;
    phone?: string;
    city?: string;
    state?: string;
    gstNumber?: string;
    companyType?: string;
    sector?: string;
    isActive: boolean;
    registrationKey: string;
    createdAt: string;
  };
  subscription?: {
    planTier: PlanType;
    memberLimit: number;
    trialExpiresAt?: string;
  };
  leadStats: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    totalDeals: number;
    wonDeals: number;
    totalRevenue: number;
  };
  employees: CompanyEmployee[];
}

interface KeyRecord {
  id: string;
  key: string;
  planTier: PlanType;
  memberLimit: number;
  validityDays: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
  qrCodeDataUrl?: string;
  createdBy?: { email: string };
}

interface Coupon {
  id: string;
  code: string;
  discountPct: number;
  planAllowed: string;
  validUntil: string;
  usesRemaining: number;
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

const INITIAL_COMPANIES: CompanyRecord[] = [
  { id: 'comp_1', name: 'Acme Sales Solutions', adminName: 'Vikram Singh', adminEmail: 'vikram.admin@acme.com', registrationKey: 'ACME-KX-7421', plan: 'FREE_TRIAL', trialDaysLeft: 14, isExpired: false, seatsAllocated: 6, seatsUsed: 4, totalUsersCount: 4, totalLeads: 142, convertedLeads: 38, conversionRate: 27, isActive: true, createdAt: '2026-08-01' },
  { id: 'comp_2', name: 'Sunita Real Estate Ltd', adminName: 'Sunita Sharma', adminEmail: 'sunita@sunitare.in', registrationKey: 'SUNI-KX-8812', plan: 'PRO', trialDaysLeft: 0, isExpired: false, seatsAllocated: 20, seatsUsed: 14, totalUsersCount: 14, totalLeads: 450, convertedLeads: 112, conversionRate: 25, isActive: true, createdAt: '2026-07-15' },
  { id: 'comp_3', name: 'Lakshmi Auto Dealerships', adminName: 'Ramesh Patel', adminEmail: 'ramesh@lakshmiauto.com', registrationKey: 'LAKS-KX-3301', plan: 'STARTER', trialDaysLeft: 0, isExpired: false, seatsAllocated: 6, seatsUsed: 5, totalUsersCount: 5, totalLeads: 88, convertedLeads: 19, conversionRate: 22, isActive: true, createdAt: '2026-08-05' },
  { id: 'comp_4', name: 'TechCorp Enterprise', adminName: 'Kavita Nair', adminEmail: 'kavita@techcorp.io', registrationKey: 'TECH-KX-9941', plan: 'PRO_MAX', trialDaysLeft: 0, isExpired: false, seatsAllocated: 100, seatsUsed: 62, totalUsersCount: 62, totalLeads: 1240, convertedLeads: 420, conversionRate: 34, isActive: true, createdAt: '2026-06-10' },
];

const INITIAL_KEYS: KeyRecord[] = [
  { id: 'key_1', key: 'ACME-KX-7421', planTier: 'FREE_TRIAL', memberLimit: 6, validityDays: 7, status: 'USED', expiresAt: '2026-08-20', createdAt: '2026-08-01' },
  { id: 'key_2', key: 'SUNI-KX-8812', planTier: 'PRO', memberLimit: 20, validityDays: 30, status: 'USED', expiresAt: '2026-09-01', createdAt: '2026-07-15' },
  { id: 'key_3', key: 'GLOB-KX-4109', planTier: 'PRO_MAX', memberLimit: 100, validityDays: 15, status: 'ACTIVE', expiresAt: '2026-08-28', createdAt: '2026-08-12' },
];

const INITIAL_COUPONS: Coupon[] = [
  { id: '1', code: 'WELCOME50', discountPct: 50, planAllowed: 'All Plans', validUntil: 'Dec 31, 2026', usesRemaining: 42 },
  { id: '2', code: 'ENTERPRISE30', discountPct: 30, planAllowed: 'PRO_MAX', validUntil: 'Sep 30, 2026', usesRemaining: 18 },
];

const INITIAL_UPGRADE_REQUESTS: UpgradeRequest[] = [
  { id: 'upg_1', companyName: 'Acme Sales Solutions', requestedPlan: 'PRO Plan', amountInr: 4999, razorpayOrderId: 'order_Nx7K92M', status: 'PENDING_APPROVAL', requestedAt: 'Today at 14:32' },
  { id: 'upg_2', companyName: 'Lakshmi Auto Dealerships', requestedPlan: 'Pro 50 Plan', amountInr: 9999, razorpayOrderId: 'order_Lk882A', status: 'PENDING_APPROVAL', requestedAt: 'Yesterday' },
];

export function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<CompanyRecord[]>(INITIAL_COMPANIES);
  const [keysList, setKeysList] = useState<KeyRecord[]>(INITIAL_KEYS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>(INITIAL_UPGRADE_REQUESTS);
  const [activeTab, setActiveTab] = useState<'key_gen' | 'companies' | 'upgrades' | 'coupons'>('key_gen');

  // In-Depth Detail Modal State
  const [inDepthModalOpen, setInDepthModalOpen] = useState(false);
  const [inDepthData, setInDepthData] = useState<InDepthCompanyDetails | null>(null);
  const [inDepthLoading, setInDepthLoading] = useState(false);
  const [newSeatInput, setNewSeatInput] = useState<number>(10);

  // Key Generator Form State
  const [genCompanyName, setGenCompanyName] = useState('ACME International');
  const [genPlan, setGenPlan] = useState<PlanType>('FREE_TRIAL');
  const [genSeats, setGenSeats] = useState(6);
  const [genValidityDays, setGenValidityDays] = useState(7);
  const [genWhatsApp, setGenWhatsApp] = useState(false);
  const [genEmailAuto, setGenEmailAuto] = useState(false);

  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);

  // Coupon Form State
  const [showAddCoupon, setShowAddCoupon] = useState(false);

  const { updateSubscription } = useAuth();

  // Load companies & keys from backend on mount if available
  useEffect(() => {
    fetchBackendCompanies();
    fetchBackendKeys();
  }, []);

  const fetchBackendCompanies = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setCompanies(data);
      }
    } catch (e) {
      // Fallback
    }
  };

  const fetchBackendKeys = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/keys`);
      if (res.ok) {
        const data = await res.json();
        if (data.companyKeys) setKeysList(data.companyKeys);
      }
    } catch (e) {
      // Fallback
    }
  };

  // Generate Key Handler
  const handleGenerateCompanyKey = async () => {
    if (!genCompanyName.trim()) return;
    setKeyLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/generate-company-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('nexcrm_token')}`,
        },
        body: JSON.stringify({
          companyName: genCompanyName,
          planTier: genPlan,
          memberLimit: genSeats,
          validityDays: genValidityDays,
          whatsAppEnabled: genWhatsApp,
          emailMarketingEnabled: genEmailAuto,
        }),
      });

      const data = await res.json();
      if (res.ok && data.key) {
        setGeneratedKey(data.key);
        setQrDataUrl(data.qrCodeDataUrl);
        const newRecord: KeyRecord = {
          id: data.id || `key_${Date.now()}`,
          key: data.key,
          planTier: genPlan,
          memberLimit: genSeats,
          validityDays: genValidityDays,
          status: 'ACTIVE',
          expiresAt: data.expiresAt || new Date(Date.now() + genValidityDays * 86400000).toISOString().split('T')[0],
          createdAt: new Date().toISOString().split('T')[0],
          qrCodeDataUrl: data.qrCodeDataUrl,
        };
        setKeysList(prev => [newRecord, ...prev]);
        setKeyLoading(false);
        return;
      }
    } catch (e) {
      // Fallback
    }

    // Client-side fallback generation
    const initials = genCompanyName.split(/\s+/).map(w => w[0]?.toUpperCase() || '').join('').slice(0, 4);
    const alpha = 'KX';
    const digits = Math.floor(1000 + Math.random() * 9000).toString();
    const key = `${initials}-${alpha}-${digits}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${key}`;

    setGeneratedKey(key);
    setQrDataUrl(qrUrl);
    const newRecord: KeyRecord = {
      id: `key_${Date.now()}`,
      key,
      planTier: genPlan,
      memberLimit: genSeats,
      validityDays: genValidityDays,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + genValidityDays * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      qrCodeDataUrl: qrUrl,
    };
    setKeysList(prev => [newRecord, ...prev]);
    setKeyLoading(false);
  };

  // Block / Unblock Company
  const handleToggleCompanyBlock = async (comp: CompanyRecord) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies/${comp.id}/block`, {
        method: 'PATCH',
      });
    } catch (e) {}

    setCompanies(prev => prev.map(c => c.id === comp.id ? { ...c, isActive: !c.isActive } : c));
    if (inDepthData && inDepthData.organization.id === comp.id) {
      setInDepthData({
        ...inDepthData,
        organization: { ...inDepthData.organization, isActive: !comp.isActive }
      });
    }
  };

  // Revoke / Block Registration Key
  const handleRevokeKey = async (keyId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/keys/company/${keyId}/revoke`, {
        method: 'PATCH',
      });
    } catch (e) {}

    setKeysList(prev => prev.map(k => k.id === keyId ? { ...k, status: 'REVOKED' } : k));
  };

  // Open Indepth Details Modal for Company
  const handleOpenInDepthDetails = async (comp: CompanyRecord) => {
    setInDepthLoading(true);
    setInDepthModalOpen(true);
    setNewSeatInput(comp.seatsAllocated);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies/${comp.id}`);
      if (res.ok) {
        const data = await res.json();
        setInDepthData(data);
        setInDepthLoading(false);
        return;
      }
    } catch (e) {}

    // Fallback Mock Details for Demo
    setTimeout(() => {
      setInDepthData({
        organization: {
          id: comp.id,
          name: comp.name,
          adminName: comp.adminName,
          adminEmail: comp.adminEmail,
          phone: comp.phone || '+91 98765 43210',
          city: 'Mumbai',
          state: 'Maharashtra',
          gstNumber: '27AAAAA0000A1Z5',
          companyType: 'Private Limited',
          sector: 'Sales & Real Estate',
          isActive: comp.isActive,
          registrationKey: comp.registrationKey,
          createdAt: comp.createdAt,
        },
        subscription: {
          planTier: comp.plan,
          memberLimit: comp.seatsAllocated,
          trialExpiresAt: '2026-09-15',
        },
        leadStats: {
          totalLeads: comp.totalLeads,
          convertedLeads: comp.convertedLeads,
          conversionRate: comp.conversionRate,
          totalDeals: Math.floor(comp.totalLeads * 0.4),
          wonDeals: comp.convertedLeads,
          totalRevenue: comp.convertedLeads * 45000,
        },
        employees: [
          { id: 'usr_1', name: comp.adminName, email: comp.adminEmail, role: 'OWNER/ADMIN', isActive: true, lastLoginAt: '2026-08-12 18:45', createdAt: comp.createdAt, keyUsed: comp.registrationKey },
          { id: 'usr_2', name: 'Rahul Sharma', email: 'rahul.mgr@' + comp.name.toLowerCase().replace(/[^a-z]/g, '') + '.com', role: 'MANAGER', isActive: true, lastLoginAt: '2026-08-12 14:10', createdAt: '2026-08-02', keyUsed: `${comp.registrationKey.slice(0, 4)}-RX-1024` },
          { id: 'usr_3', name: 'Priya Verma', email: 'priya.hr@' + comp.name.toLowerCase().replace(/[^a-z]/g, '') + '.com', role: 'HR', isActive: true, lastLoginAt: '2026-08-11 09:30', createdAt: '2026-08-03', keyUsed: `${comp.registrationKey.slice(0, 4)}-RX-1025` },
          { id: 'usr_4', name: 'Amit Kumar', email: 'amit.sales@' + comp.name.toLowerCase().replace(/[^a-z]/g, '') + '.com', role: 'SALES_EXEC', isActive: true, lastLoginAt: '2026-08-12 16:20', createdAt: '2026-08-05', keyUsed: `${comp.registrationKey.slice(0, 4)}-RX-1026` },
          { id: 'usr_5', name: 'Sneha Patel', email: 'sneha.sales@' + comp.name.toLowerCase().replace(/[^a-z]/g, '') + '.com', role: 'SALES_EXEC', isActive: false, lastLoginAt: '2026-08-09 11:15', createdAt: '2026-08-06', keyUsed: `${comp.registrationKey.slice(0, 4)}-RX-1027` },
        ],
      });
      setInDepthLoading(false);
    }, 400);
  };

  // Toggle User Block inside Indepth Modal
  const handleToggleUserBlock = async (user: CompanyEmployee) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/users/${user.id}/block`, {
        method: 'PATCH',
      });
    } catch (e) {}

    if (inDepthData) {
      const updatedEmployees = inDepthData.employees.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u);
      setInDepthData({ ...inDepthData, employees: updatedEmployees });
    }
  };

  // Add / Modify Company Seats
  const handleUpdateCompanySeats = async (companyId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies/${companyId}/seats`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberLimit: newSeatInput }),
      });
    } catch (e) {}

    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, seatsAllocated: newSeatInput } : c));
    if (inDepthData && inDepthData.subscription) {
      setInDepthData({
        ...inDepthData,
        subscription: { ...inDepthData.subscription, memberLimit: newSeatInput }
      });
    }
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

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="crm-card p-5 border-l-4 border-l-indigo-500 bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 font-extrabold flex items-center justify-center text-lg shadow-lg">
              DEV
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Super-Admin Platform Control Center</h1>
              <p className="text-xs text-muted">Manage client companies, issue registration keys, block companies/users, and monitor lead metrics.</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('key_gen')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'key_gen' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-muted text-muted'}`}
            >
              <Key size={14} /> Key Engine & Registry
            </button>

            <button
              onClick={() => setActiveTab('companies')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'companies' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-muted text-muted'}`}
            >
              <Building2 size={14} /> Companies Directory ({companies.length})
            </button>

            <button
              onClick={() => setActiveTab('upgrades')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${activeTab === 'upgrades' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-muted text-muted'}`}
            >
              <CreditCard size={14} /> Upgrade Requests
              {upgradeRequests.filter(r => r.status === 'PENDING_APPROVAL').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-1 -right-1" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'coupons' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-muted text-muted'}`}
            >
              <Tag size={14} /> Coupons ({coupons.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Key Engine & Registry (Before Companies) */}
      {activeTab === 'key_gen' && (
        <div className="space-y-6">
          <div className="crm-card space-y-6">
            <div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                1. SECURITY KEY GENERATION ENGINE
              </span>
              <h3 className="text-xl font-bold text-white mt-2">Generate Company Registration Key & QR Code</h3>
              <p className="text-xs text-muted mt-0.5">
                Generates security keys required for company registration (Format: <strong>ACME-KX-7421</strong>). Without a valid key, login/register is denied.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted block mb-1">Target Company Name *</label>
                  <input
                    className="crm-input text-sm h-10 w-full"
                    placeholder="ACME Sales Solutions"
                    value={genCompanyName}
                    onChange={e => setGenCompanyName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted block mb-1">Entitled Plan Tier</label>
                    <select className="crm-input text-sm h-10 w-full" value={genPlan} onChange={e => setGenPlan(e.target.value as PlanType)}>
                      <option value="FREE_TRIAL">Free Trial (30d)</option>
                      <option value="STARTER">Starter Plan (6 seats)</option>
                      <option value="PRO">Pro Plan (20 seats)</option>
                      <option value="PRO_50">Pro 50 Plan (50 seats)</option>
                      <option value="PRO_MAX">Pro Max (Unlimited)</option>
                      <option value="ENTERPRISE">Enterprise (Negotiated)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-1">User Quota (Seats)</label>
                    <input
                      type="number"
                      className="crm-input text-sm h-10 w-full"
                      value={genSeats}
                      onChange={e => setGenSeats(+e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted block mb-1">Key Expiry Window</label>
                    <select className="crm-input text-sm h-10 w-full" value={genValidityDays} onChange={e => setGenValidityDays(+e.target.value)}>
                      <option value={7}>7 Days Validity</option>
                      <option value={15}>15 Days Validity</option>
                      <option value={30}>30 Days Validity</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateCompanyKey}
                  disabled={keyLoading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Key size={16} /> {keyLoading ? 'Generating Key...' : 'Generate Registration Key & QR Code'}
                </button>
              </div>

              {/* Rendered Key Output */}
              <div className="p-6 rounded-2xl bg-background border border-purple-500/30 flex flex-col items-center justify-center text-center space-y-4">
                {generatedKey ? (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      KEY GENERATED & ACTIVE
                    </span>
                    <div className="font-mono text-2xl font-black text-white tracking-widest bg-card px-6 py-3 rounded-2xl border border-purple-500/40 shadow-xl">
                      {generatedKey}
                    </div>

                    {qrDataUrl && (
                      <div className="p-3 bg-white rounded-2xl shadow-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrDataUrl} alt="Company Key QR" className="w-36 h-36" />
                      </div>
                    )}

                    <p className="text-[11px] text-muted max-w-xs">
                      Share this key or QR code with the Tenant Admin to activate their company at <strong>/register</strong>.
                    </p>
                  </>
                ) : (
                  <div className="text-muted space-y-2 py-8">
                    <QrCode size={48} className="mx-auto text-purple-400/40" />
                    <p className="text-xs">Fill details on the left and click Generate to produce formatted key & QR code.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Generated Keys Registry Table */}
          <div className="crm-card p-0 overflow-hidden space-y-3">
            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'rgb(var(--border))' }}>
              <div>
                <h3 className="font-bold text-base text-white">Company Registration Keys Registry</h3>
                <p className="text-xs text-muted">View all issued registration keys, their status, plan tier, and option to revoke/block key.</p>
              </div>
            </div>

            <table className="crm-table">
              <thead>
                <tr>
                  <th>Key Code</th>
                  <th>Plan Tier</th>
                  <th>Seat Limit</th>
                  <th>Validity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {keysList.map(k => (
                  <tr key={k.id}>
                    <td>
                      <span className="font-mono font-bold text-sm text-purple-300 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
                        {k.key}
                      </span>
                    </td>
                    <td><span className="text-xs font-bold text-white">{k.planTier}</span></td>
                    <td><span className="text-xs font-semibold text-muted">{k.memberLimit} Seats</span></td>
                    <td><span className="text-xs text-muted">{k.validityDays} Days (Expires {k.expiresAt})</span></td>
                    <td>
                      <span className={`text-xs px-2.5 py-0.5 rounded font-bold ${
                        k.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' :
                        k.status === 'USED' ? 'bg-indigo-500/20 text-indigo-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {k.status}
                      </span>
                    </td>
                    <td>
                      {k.status !== 'REVOKED' ? (
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-bold text-xs rounded-lg border border-red-500/30 flex items-center gap-1"
                        >
                          <Lock size={12} /> Revoke Key
                        </button>
                      ) : (
                        <span className="text-xs text-muted italic">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Client Companies Directory */}
      {activeTab === 'companies' && (
        <div className="crm-card p-0 overflow-hidden space-y-4">
          <div className="p-5 border-b flex justify-between items-center flex-wrap gap-3" style={{ borderColor: 'rgb(var(--border))' }}>
            <div>
              <h3 className="font-bold text-base text-white">Client Companies Directory</h3>
              <p className="text-xs text-muted">Overview of all tenant companies, keys used, plan details, user quota, lead stats, and block actions.</p>
            </div>
          </div>

          <table className="crm-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Admin & Key Used</th>
                <th>Plan Tier</th>
                <th>Seats (Used / Alloc)</th>
                <th>Leads Handled & Converted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(comp => (
                <tr key={comp.id} className={!comp.isActive ? 'opacity-60 bg-red-950/10' : ''}>
                  <td>
                    <p className="font-bold text-sm text-white">{comp.name}</p>
                    <p className="text-xs text-muted">Created: {comp.createdAt}</p>
                  </td>
                  <td>
                    <p className="text-xs font-semibold text-white">{comp.adminName}</p>
                    <p className="text-[11px] text-muted">{comp.adminEmail}</p>
                    <span className="font-mono text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 inline-block mt-0.5">
                      {comp.registrationKey}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs px-2.5 py-0.5 rounded font-bold" style={{
                      background: comp.plan === 'FREE_TRIAL' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                      color: comp.plan === 'FREE_TRIAL' ? 'rgb(245,158,11)' : 'rgb(34,197,94)',
                    }}>
                      {comp.plan.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-bold text-white">
                      {comp.seatsUsed} / {comp.seatsAllocated} Users
                    </span>
                  </td>
                  <td>
                    <div className="text-xs">
                      <span className="font-bold text-white">{comp.totalLeads} Handled</span>
                      <span className="text-emerald-400 font-bold ml-1.5">({comp.convertedLeads} Conv, {comp.conversionRate}%)</span>
                    </div>
                  </td>
                  <td>
                    <span className={`text-xs px-2.5 py-0.5 rounded font-bold ${
                      comp.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {comp.isActive ? 'ACTIVE' : 'BLOCKED'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenInDepthDetails(comp)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md"
                      >
                        <Eye size={13} /> Full Indepth →
                      </button>

                      <button
                        onClick={() => handleToggleCompanyBlock(comp)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                          comp.isActive
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {comp.isActive ? <Ban size={13} /> : <Unlock size={13} />}
                        {comp.isActive ? 'Block Company' : 'Unblock'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Plan Upgrade Requests Review */}
      {activeTab === 'upgrades' && (
        <div className="crm-card space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-white">Pending Plan Upgrade Requests</h3>
              <p className="text-xs text-muted">Review payment-verified upgrade requests submitted by Tenant Admins via Razorpay.</p>
            </div>
          </div>

          <table className="crm-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Requested Plan</th>
                <th>Payment Amount</th>
                <th>Razorpay Order ID</th>
                <th>Status</th>
                <th>Action</th>
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
                      req.status === 'REJECTED' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td>
                    {req.status === 'PENDING_APPROVAL' ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveUpgrade(req.id)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg">
                          Approve →
                        </button>
                        <button onClick={() => handleRejectUpgrade(req.id)} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg">
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: Coupons Manager */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white">Promotional Coupons</h3>
            <button className="btn-primary text-sm gap-1.5 flex items-center" onClick={() => setShowAddCoupon(true)}>
              <Plus size={14} /> Create Coupon
            </button>
          </div>

          <div className="crm-card p-0 overflow-hidden">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Discount %</th>
                  <th>Applicable Plan</th>
                  <th>Valid Until</th>
                  <th>Uses Remaining</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span className="font-mono text-sm font-bold text-purple-300 bg-purple-500/15 px-2.5 py-1 rounded">
                        {c.code}
                      </span>
                    </td>
                    <td><span className="font-bold text-emerald-400">{c.discountPct}% OFF</span></td>
                    <td><span className="text-xs text-muted">{c.planAllowed}</span></td>
                    <td><span className="text-xs text-muted">{c.validUntil}</span></td>
                    <td><span className="text-xs font-semibold">{c.usesRemaining} uses</span></td>
                    <td>
                      <button onClick={() => setCoupons(coupons.filter(x => x.id !== c.id))} className="text-red-400 hover:underline text-xs">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── IN-DEPTH COMPANY DETAILS MODAL ────────────────────────────────────── */}
      {inDepthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-card border border-indigo-500/30 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setInDepthModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-muted text-white flex items-center justify-center hover:bg-red-500/20 hover:text-red-300"
            >
              <X size={16} />
            </button>

            {inDepthLoading || !inDepthData ? (
              <div className="py-12 text-center text-muted space-y-2">
                <RefreshCw size={32} className="animate-spin mx-auto text-indigo-400" />
                <p className="text-xs font-semibold">Loading full company metrics and employee details...</p>
              </div>
            ) : (
              <>
                {/* Header Info */}
                <div className="flex justify-between items-start flex-wrap gap-4 border-b pb-4 border-border">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-white">{inDepthData.organization.name}</h2>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                        inDepthData.organization.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {inDepthData.organization.isActive ? 'WORKSPACE ACTIVE' : 'COMPANY BLOCKED'}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Admin: <strong>{inDepthData.organization.adminName}</strong> ({inDepthData.organization.adminEmail}) • Reg Key: <strong className="font-mono text-purple-300">{inDepthData.organization.registrationKey}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCompanyBlock({ id: inDepthData.organization.id, name: inDepthData.organization.name, adminName: inDepthData.organization.adminName, adminEmail: inDepthData.organization.adminEmail, registrationKey: inDepthData.organization.registrationKey, plan: inDepthData.subscription?.planTier || 'FREE_TRIAL', trialDaysLeft: 0, isExpired: false, seatsAllocated: inDepthData.subscription?.memberLimit || 6, seatsUsed: inDepthData.employees.length, totalUsersCount: inDepthData.employees.length, totalLeads: inDepthData.leadStats.totalLeads, convertedLeads: inDepthData.leadStats.convertedLeads, conversionRate: inDepthData.leadStats.conversionRate, isActive: inDepthData.organization.isActive, createdAt: inDepthData.organization.createdAt })}
                      className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                        inDepthData.organization.isActive
                          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {inDepthData.organization.isActive ? <Ban size={14} /> : <Unlock size={14} />}
                      {inDepthData.organization.isActive ? 'Block Company Workspace' : 'Unblock Workspace'}
                    </button>
                  </div>
                </div>

                {/* Lead Performance Summary Cards */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-indigo-400" /> Company Lead Performance Metrics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="crm-card p-4 bg-indigo-500/10 border-indigo-500/20">
                      <p className="text-[11px] text-muted font-bold">Total Leads Handled</p>
                      <p className="text-2xl font-black text-white mt-1">{inDepthData.leadStats.totalLeads}</p>
                    </div>

                    <div className="crm-card p-4 bg-emerald-500/10 border-emerald-500/20">
                      <p className="text-[11px] text-muted font-bold">Converted Leads</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">{inDepthData.leadStats.convertedLeads}</p>
                    </div>

                    <div className="crm-card p-4 bg-purple-500/10 border-purple-500/20">
                      <p className="text-[11px] text-muted font-bold">Conversion Rate</p>
                      <p className="text-2xl font-black text-purple-300 mt-1">{inDepthData.leadStats.conversionRate}%</p>
                    </div>

                    <div className="crm-card p-4 bg-amber-500/10 border-amber-500/20">
                      <p className="text-[11px] text-muted font-bold">Total Revenue Won</p>
                      <p className="text-2xl font-black text-amber-300 mt-1">₹{inDepthData.leadStats.totalRevenue.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {/* Plan & User Quota Controls */}
                <div className="p-4 rounded-2xl bg-card border border-border flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <span className="text-xs font-bold text-muted block">ACTIVE PLAN TIER</span>
                    <span className="text-sm font-black text-white">{inDepthData.subscription?.planTier.replace('_', ' ')}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-xs font-bold text-muted block">ALLOCATED USER SEATS</span>
                      <span className="text-xs font-bold text-white">{inDepthData.employees.length} Used / {inDepthData.subscription?.memberLimit} Allocated</span>
                    </div>

                    <div className="flex items-center gap-1 bg-background p-1.5 rounded-xl border border-border">
                      <input
                        type="number"
                        className="w-16 h-8 text-center text-xs font-bold bg-card text-white rounded border border-border"
                        value={newSeatInput}
                        onChange={e => setNewSeatInput(+e.target.value)}
                      />
                      <button
                        onClick={() => handleUpdateCompanySeats(inDepthData.organization.id)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg"
                      >
                        Set Seats
                      </button>
                    </div>
                  </div>
                </div>

                {/* Employees & Admin Details List */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Users size={14} className="text-purple-400" /> Company Employees & Admins ({inDepthData.employees.length})
                    </h4>
                  </div>

                  <div className="border border-border rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="crm-table">
                      <thead>
                        <tr>
                          <th>Employee Name & Email</th>
                          <th>Role</th>
                          <th>Key Used for Account</th>
                          <th>Last Login</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inDepthData.employees.map(u => (
                          <tr key={u.id} className={!u.isActive ? 'opacity-60 bg-red-950/20' : ''}>
                            <td>
                              <p className="font-bold text-xs text-white">{u.name}</p>
                              <p className="text-[11px] text-muted">{u.email}</p>
                            </td>
                            <td>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <span className="font-mono text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                {u.keyUsed}
                              </span>
                            </td>
                            <td>
                              <span className="text-[11px] text-muted font-mono">{u.lastLoginAt || 'Never'}</span>
                            </td>
                            <td>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                u.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                              }`}>
                                {u.isActive ? 'ACTIVE' : 'BLOCKED'}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleToggleUserBlock(u)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                                  u.isActive ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300' : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300'
                                }`}
                              >
                                {u.isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                                {u.isActive ? 'Block User' : 'Unblock'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
