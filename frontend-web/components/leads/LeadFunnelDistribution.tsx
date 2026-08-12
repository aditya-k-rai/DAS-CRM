'use client';

import { useState, useEffect } from 'react';
import {
  Target, Zap, Sliders, Shield, Users, ArrowRight, CheckCircle2,
  Lock, Eye, EyeOff, RefreshCw, Layers, Phone, MessageSquare, Mail, Globe, Share2, FileSpreadsheet, UserCheck,
  Bell, AlertCircle, Ban, UserPlus, Clock, History, FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type DistMode = 'VOLUME' | 'SPEED_CLAIM' | 'DIRECT_ADMIN';

interface LeadSourceChannel {
  id: string;
  name: string;
  icon: string;
  color: string;
  todayCount: number;
  status: 'active' | 'paused';
}

const SOURCES: LeadSourceChannel[] = [
  { id: 'fb',  name: 'Facebook Ads',  icon: '📘', color: '#1877f2', todayCount: 42, status: 'active' },
  { id: 'ig',  name: 'Instagram Ads', icon: '📸', color: '#e1306c', todayCount: 38, status: 'active' },
  { id: 'ga',  name: 'Google Ads',    icon: '🔍', color: '#4285f4', todayCount: 29, status: 'active' },
  { id: 'seo', name: 'Google Organic',icon: '🌐', color: '#34a853', todayCount: 15, status: 'active' },
  { id: 'web', name: 'Website Form',  icon: '💻', color: '#6366f1', todayCount: 22, status: 'active' },
  { id: 'wa',  name: 'WhatsApp Webhook', icon: '💬', color: '#25d366', todayCount: 54, status: 'active' },
  { id: 'li',  name: 'LinkedIn Leads', icon: '💼', color: '#0a66c2', todayCount: 19, status: 'active' },
  { id: 'man', name: 'Manual Entry',   icon: '✍️', color: '#f59e0b', todayCount: 11, status: 'active' },
  { id: 'csv', name: 'Bulk Import',    icon: '📊', color: '#8b5cf6', todayCount: 65, status: 'active' },
  { id: 'oth', name: 'API / Other',    icon: '🔌', color: '#ec4899', todayCount: 8,  status: 'active' },
];

interface UnclaimedLeadPoolItem {
  id: string;
  serialNo: string;
  source: string;
  receivedAt: string;
  status: 'UNCLAIMED' | 'ACQUIRED';
  acquiredBy?: string;
  acquiredAt?: string;
}

const INITIAL_POOL: UnclaimedLeadPoolItem[] = [
  { id: '1', serialNo: 'POOL-2026-0891', source: 'Facebook Ads',    receivedAt: '2 mins ago',  status: 'UNCLAIMED' },
  { id: '2', serialNo: 'POOL-2026-0892', source: 'Google Ads',      receivedAt: '5 mins ago',  status: 'UNCLAIMED' },
  { id: '3', serialNo: 'POOL-2026-0893', source: 'WhatsApp Webhook',receivedAt: '8 mins ago',  status: 'UNCLAIMED' },
  { id: '4', serialNo: 'POOL-2026-0894', source: 'Instagram Ads',   receivedAt: '12 mins ago', status: 'ACQUIRED', acquiredBy: 'Rajesh Mehta (Manager A)', acquiredAt: '10 mins ago' },
  { id: '5', serialNo: 'POOL-2026-0895', source: 'LinkedIn Leads',  receivedAt: '15 mins ago', status: 'UNCLAIMED' },
];

interface AdminMasterPoolItem {
  id: string;
  serialNo: string;
  leadName: string;
  email: string;
  phone: string;
  source: string;
  statusName: string;
  statusColor: string;
  isAllocated: boolean;
  allocatedUser?: { id?: string; name: string; email: string; role: string } | null;
  lastUpdatedAt: string;
  latestUpdateDetails: string;
}

const INITIAL_ADMIN_MASTER_LEADS: AdminMasterPoolItem[] = [
  {
    id: '1',
    serialNo: 'POOL-2026-0891',
    leadName: 'Ananya Sharma',
    email: 'ananya.s@gmail.com',
    phone: '+91 98765 43210',
    source: 'Facebook Ads',
    statusName: 'New Lead',
    statusColor: '#6366f1',
    isAllocated: false,
    allocatedUser: null,
    lastUpdatedAt: '2 mins ago',
    latestUpdateDetails: 'Lead Ingested via Facebook Ads Webhook',
  },
  {
    id: '2',
    serialNo: 'POOL-2026-0892',
    leadName: 'Rohan Deshmukh',
    email: 'rohan.d@corp.in',
    phone: '+91 91234 56789',
    source: 'Google Ads',
    statusName: 'Contacted',
    statusColor: '#3b82f6',
    isAllocated: true,
    allocatedUser: { name: 'Rajesh Mehta', email: 'rajesh.mgr@company.com', role: 'MANAGER' },
    lastUpdatedAt: '5 mins ago',
    latestUpdateDetails: 'Status changed to Contacted by Rajesh Mehta (Intro call completed)',
  },
  {
    id: '3',
    serialNo: 'POOL-2026-0893',
    leadName: 'Kavita Verma',
    email: 'kavita@techsol.com',
    phone: '+91 99887 76655',
    source: 'WhatsApp Webhook',
    statusName: 'Qualified',
    statusColor: '#f59e0b',
    isAllocated: true,
    allocatedUser: { name: 'Neha Joshi', email: 'neha.mgr@company.com', role: 'MANAGER' },
    lastUpdatedAt: '12 mins ago',
    latestUpdateDetails: 'Requirement budget verified > ₹50,000/mo by Neha Joshi',
  },
  {
    id: '4',
    serialNo: 'POOL-2026-0894',
    leadName: 'Siddharth Rao',
    email: 'siddharth@innovate.in',
    phone: '+91 97654 32109',
    source: 'Instagram Ads',
    statusName: 'Proposal Sent',
    statusColor: '#8b5cf6',
    isAllocated: true,
    allocatedUser: { name: 'Amit Shah', email: 'amit.tl@company.com', role: 'TEAM_LEADER' },
    lastUpdatedAt: '25 mins ago',
    latestUpdateDetails: 'Quotation #Q-9041 sent via Email by Amit Shah',
  },
  {
    id: '5',
    serialNo: 'POOL-2026-0895',
    leadName: 'Pooja Nair',
    email: 'pooja.nair@enterprise.com',
    phone: '+91 94321 87654',
    source: 'LinkedIn Leads',
    statusName: 'Closed Won',
    statusColor: '#22c55e',
    isAllocated: true,
    allocatedUser: { name: 'Priya Sharma', email: 'priya.rep@company.com', role: 'SALES_EXEC' },
    lastUpdatedAt: '1 hour ago',
    latestUpdateDetails: 'Deal #D-8821 closed won ₹2,40,000 by Priya Sharma',
  },
];

interface EligibleManager {
  id: string;
  name: string;
  email: string;
  role: string;
  isWhitelisted: boolean;
}

export function LeadFunnelDistribution() {
  const [distMode, setDistMode]             = useState<DistMode>('SPEED_CLAIM');
  const [poolSubTab, setPoolSubTab]         = useState<'CLAIM_QUEUE' | 'ADMIN_MASTER_AUDIT'>('ADMIN_MASTER_AUDIT');
  const [managerARange, setManagerA]       = useState('1 - 100');
  const [managerBRange, setManagerB]       = useState('101 - 200');
  const [directManager, setDirectManager]   = useState('Rajesh Mehta (Manager A)');
  const [pool, setPool]                     = useState<UnclaimedLeadPoolItem[]>(INITIAL_POOL);
  const [adminMasterLeads, setAdminMasterLeads] = useState<AdminMasterPoolItem[]>(INITIAL_ADMIN_MASTER_LEADS);
  const [acquiredNotice, setAcquiredNotice] = useState<string | null>(null);
  const [pushNotificationAlert, setPushNotificationAlert] = useState<string | null>(
    '⚡ INSTANT PUSH NOTIFICATION (Web & Mobile FCM): New Lead Available in Acquire Pool (#POOL-2026-0891)'
  );
  const [allocatedSuccess, setAllocatedSuccess] = useState<string | null>(null);
  const [isWhitelistedUser, setIsWhitelistedUser] = useState(true);

  // Admin Access Guard Whitelist State
  const [whitelistManagers, setWhitelistManagers] = useState<EligibleManager[]>([
    { id: 'mgr_1', name: 'Rajesh Mehta', email: 'rajesh.mgr@company.com', role: 'MANAGER', isWhitelisted: true },
    { id: 'mgr_2', name: 'Neha Joshi', email: 'neha.mgr@company.com', role: 'MANAGER', isWhitelisted: true },
    { id: 'mgr_3', name: 'Vikram Singh', email: 'vikram.admin@acme.com', role: 'ADMIN', isWhitelisted: true },
    { id: 'mgr_4', name: 'Amit Shah', email: 'amit.tl@company.com', role: 'TEAM_LEADER', isWhitelisted: false },
  ]);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);

  const { currentUser, subscription }       = useAuth();

  useEffect(() => {
    fetchGrabPool();
    fetchWhitelist();
    fetchAdminMasterView();
  }, []);

  const fetchGrabPool = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/leads/distribution/open-pool`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('nexcrm_token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isWhitelisted !== undefined) setIsWhitelistedUser(data.isWhitelisted);
        if (Array.isArray(data.leads) && data.leads.length > 0) setPool(data.leads);
      }
    } catch (e) {}
  };

  const fetchAdminMasterView = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/leads/distribution/admin-master-view`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('nexcrm_token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setAdminMasterLeads(data);
      }
    } catch (e) {}
  };

  const fetchWhitelist = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/leads/distribution/whitelist`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('nexcrm_token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.eligibleManagers)) setWhitelistManagers(data.eligibleManagers);
      }
    } catch (e) {}
  };

  const handleClaimLead = async (id: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/leads/distribution/grab-lead/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('nexcrm_token')}` },
      });
    } catch (e) {}

    setPool(prev => prev.map(item => {
      if (item.id === id) {
        setAcquiredNotice(`✓ Acquired Lead ${item.serialNo}! Lead has vanished from other Managers' pool queues.`);
        setTimeout(() => setAcquiredNotice(null), 3500);
        return {
          ...item,
          status: 'ACQUIRED',
          acquiredBy: `${currentUser.name} (${currentUser.role})`,
          acquiredAt: 'Just now',
        };
      }
      return item;
    }));
  };

  const handleManagerAllocate = async (targetName: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/leads/distribution/manager-allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('nexcrm_token')}`,
        },
        body: JSON.stringify({ leadIds: ['lead_1'], targetUserId: 'usr_target' }),
      });
    } catch (e) {}

    setAllocatedSuccess(`✓ Allocated batch lead to ${targetName}! Notification sent.`);
    setTimeout(() => setAllocatedSuccess(null), 3000);
  };

  const handleToggleManagerWhitelist = (id: string) => {
    setWhitelistManagers(prev => prev.map(m => m.id === id ? { ...m, isWhitelisted: !m.isWhitelisted } : m));
  };

  return (
    <div className="space-y-6">
      {/* Real-Time Push Notification Alert Banner */}
      {pushNotificationAlert && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-indigo-900/40 border border-purple-500/40 shadow-xl flex items-center justify-between flex-wrap gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0 font-bold">
              <Bell size={18} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                REAL-TIME PUSH DISPATCHED (WEB & FCM MOBILE)
              </span>
              <p className="text-xs font-bold text-white mt-0.5">{pushNotificationAlert}</p>
            </div>
          </div>
          <button
            onClick={() => setPushNotificationAlert(null)}
            className="text-xs text-muted hover:text-white px-2 py-1"
          >
            Dismiss ✕
          </button>
        </div>
      )}

      {/* 10 Multi-Source Lead Ingestion Status */}
      <div className="crm-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Target size={18} className="text-brand-400" /> Multi-Source Lead Ingestion Channels (10 Sources)
            </h3>
            <p className="text-xs text-muted mt-0.5">Real-time incoming lead channels captured across web, ads, social, and webhooks</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            303 Leads Ingested Today
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {SOURCES.map(src => (
            <div key={src.id} className="p-3 rounded-xl border border-border bg-background hover:border-brand/40 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xl">{src.icon}</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Live</span>
              </div>
              <p className="font-bold text-xs text-white truncate">{src.name}</p>
              <p className="text-xs font-extrabold text-brand-400 mt-1">+{src.todayCount} leads</p>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Distribution Funnel Configurator */}
      <div className="crm-card space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Sliders size={18} className="text-indigo-400" /> Admin Lead Funnel Distribution Engine & Access Guard
            </h3>
            <p className="text-xs text-muted mt-0.5">Configure how ingested leads funnel to Managers, Team Leaders, and claim pools</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWhitelistModal(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs border border-purple-500/30 flex items-center gap-1.5"
            >
              <Shield size={13} /> Admin Whitelist Control ({whitelistManagers.filter(m => m.isWhitelisted).length} Authorized)
            </button>

            <span className="text-xs px-2.5 py-1 rounded font-bold bg-indigo-500/20 text-indigo-300">
              MODE: {distMode}
            </span>
          </div>
        </div>

        {/* 3 Model Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Model 1 */}
          <button
            onClick={() => setDistMode('VOLUME')}
            className={`p-4 rounded-xl border text-left transition-all ${distMode === 'VOLUME' ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg' : 'bg-background border-border text-muted hover:text-white'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-sm">Model 1: Custom Batch Quota</p>
              {distMode === 'VOLUME' && <span className="text-xs text-indigo-400 font-bold">Active ✓</span>}
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Batch quota ranges (e.g. Leads 1–100 to Manager A, Leads 101–200 to Manager B) with global capacity limits.
            </p>
          </button>

          {/* Model 2 */}
          <button
            onClick={() => setDistMode('SPEED_CLAIM')}
            className={`p-4 rounded-xl border text-left transition-all ${distMode === 'SPEED_CLAIM' ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg' : 'bg-background border-border text-muted hover:text-white'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-sm">Model 2: Dynamic "Grab" Flow</p>
              {distMode === 'SPEED_CLAIM' && <span className="text-xs text-indigo-400 font-bold">Active ✓</span>}
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Anonymized Serial # Pool. First View/Mark Acquires Lead; lead vanishes for all other Managers instantly!
            </p>
          </button>

          {/* Model 3 */}
          <button
            onClick={() => setDistMode('DIRECT_ADMIN')}
            className={`p-4 rounded-xl border text-left transition-all ${distMode === 'DIRECT_ADMIN' ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg' : 'bg-background border-border text-muted hover:text-white'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-sm">Model 3: Direct Admin Funnel</p>
              {distMode === 'DIRECT_ADMIN' && <span className="text-xs text-indigo-400 font-bold">Active ✓</span>}
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Manual targeting by Admin directly to a specific designated Manager or Department.
            </p>
          </button>
        </div>

        {/* Model 1 Config */}
        {distMode === 'VOLUME' && (
          <div className="p-4 rounded-xl bg-background border border-border space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted">Custom Batch Quota Ranges</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted block mb-1">Manager A Range (e.g. 1 - 100)</label>
                <input className="crm-input text-sm font-bold" value={managerARange} onChange={e => setManagerA(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Manager B Range (e.g. 101 - 200)</label>
                <input className="crm-input text-sm font-bold" value={managerBRange} onChange={e => setManagerB(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Model 2 Config */}
        {distMode === 'SPEED_CLAIM' && (
          <div className="space-y-4">
            {/* Pool View Selector: Blind Claim Queue vs Admin Master Audit Table */}
            <div className="flex items-center justify-between flex-wrap gap-2 bg-background p-2 rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPoolSubTab('ADMIN_MASTER_AUDIT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    poolSubTab === 'ADMIN_MASTER_AUDIT'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-muted text-muted-foreground hover:text-white'
                  }`}
                >
                  <FileText size={13} /> Admin Master Audit View (All Pool Leads + Allocation + Last Updated)
                </button>
                <button
                  onClick={() => setPoolSubTab('CLAIM_QUEUE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    poolSubTab === 'CLAIM_QUEUE'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-muted text-muted-foreground hover:text-white'
                  }`}
                >
                  <Lock size={13} /> Managers' Blind Claim Queue (Anonymized Serial #)
                </button>
              </div>

              {acquiredNotice && (
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-scale-in">
                  {acquiredNotice}
                </span>
              )}
            </div>

            {/* TAB 1: ADMIN MASTER AUDIT TABLE */}
            {poolSubTab === 'ADMIN_MASTER_AUDIT' && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Shield size={16} className="text-purple-400" /> Admin Master Lead Tracking & Pool Audit Directory
                  </h4>
                  <p className="text-xs text-muted">Complete visibility into allocated users, lead statuses, last activity timestamps, and latest updates across all pool leads.</p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>Serial # & Lead Name</th>
                        <th>Source Channel</th>
                        <th>Allocated User / Owner</th>
                        <th>Lead Status</th>
                        <th>When Last Updated</th>
                        <th>What Was Updated (Latest Activity)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminMasterLeads.map(item => (
                        <tr key={item.id} className="hover:bg-muted/10">
                          <td>
                            <div className="space-y-0.5">
                              <span className="font-mono text-[11px] font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/20">
                                {item.serialNo}
                              </span>
                              <p className="font-bold text-xs text-white mt-1">{item.leadName}</p>
                              <p className="text-[11px] text-muted">{item.email}</p>
                            </div>
                          </td>
                          <td>
                            <span className="text-xs font-semibold">{item.source}</span>
                          </td>
                          <td>
                            {item.isAllocated && item.allocatedUser ? (
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full inline-block border border-emerald-500/20">
                                  ✓ {item.allocatedUser.name}
                                </span>
                                <p className="text-[10px] text-muted">{item.allocatedUser.role} • {item.allocatedUser.email}</p>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full inline-block border border-amber-500/20">
                                ● Unassigned (In Pool Queue)
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className="text-xs px-2.5 py-0.5 rounded-full font-bold text-white border"
                              style={{ backgroundColor: `${item.statusColor}25`, borderColor: `${item.statusColor}50` }}
                            >
                              ● {item.statusName}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1 text-xs text-muted">
                              <Clock size={12} className="text-indigo-400" />
                              <span>{item.lastUpdatedAt}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <History size={13} className="text-purple-400 flex-shrink-0" />
                              <span className="text-xs text-white font-medium italic truncate max-w-xs">
                                "{item.latestUpdateDetails}"
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: MANAGERS' BLIND CLAIM QUEUE */}
            {poolSubTab === 'CLAIM_QUEUE' && (
              <>
                {!isWhitelistedUser ? (
                  <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-2">
                    <Lock size={32} className="mx-auto text-red-400" />
                    <h4 className="font-bold text-sm text-red-300">Admin Access Guard — Not Whitelisted</h4>
                    <p className="text-xs text-muted max-w-md mx-auto">
                      Your account is currently not on the Admin Eligibility Whitelist for the Acquire Pool. Contact your Tenant Admin to grant you claim access.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="crm-table">
                      <thead>
                        <tr>
                          <th>Anonymized Serial Number</th>
                          <th>Ingestion Channel</th>
                          <th>Received Timestamp</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pool.map(item => (
                          <tr key={item.id} className={item.status === 'ACQUIRED' ? 'opacity-40 bg-muted/10' : ''}>
                            <td>
                              <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded border border-indigo-500/20">
                                {item.serialNo}
                              </span>
                            </td>
                            <td><span className="text-xs font-semibold">{item.source}</span></td>
                            <td><span className="text-xs text-muted">{item.receivedAt}</span></td>
                            <td>
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${item.status === 'UNCLAIMED' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {item.status === 'UNCLAIMED' ? '● Unclaimed (Open Pool)' : `✓ Acquired by ${item.acquiredBy}`}
                              </span>
                            </td>
                            <td>
                              {item.status === 'UNCLAIMED' ? (
                                <button onClick={() => handleClaimLead(item.id)} className="btn-primary text-xs py-1 px-3">
                                  Acquire Lead →
                                </button>
                              ) : (
                                <span className="text-xs text-muted italic">Vanished from queue</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Model 3 Config */}
        {distMode === 'DIRECT_ADMIN' && (
          <div className="p-4 rounded-xl bg-background border border-border space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted">Direct Admin Funnel Targeting</h4>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Target Manager Selection</label>
                <select className="crm-input text-sm font-bold" value={directManager} onChange={e => setDirectManager(e.target.value)}>
                  <option value="Rajesh Mehta (Manager A)">Rajesh Mehta (Manager A)</option>
                  <option value="Neha Joshi (Manager B)">Neha Joshi (Manager B)</option>
                </select>
              </div>
              <button className="btn-primary text-xs font-bold mt-5 px-5 py-2.5">
                Funnel Next Batch →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Downstream Manager Allocation Control */}
      <div className="crm-card border-l-4 border-l-purple-500 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <UserCheck size={18} className="text-purple-400" /> Manager Allocation Control Panel (Downstream Distribution)
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {subscription.hasTeamLeaders ? 'Scenario A Active: Manager allocates to Team Leader (TL) → Staff' : 'Scenario B Active: Manager allocates directly to Staff / Sales Execs'}
            </p>
          </div>
          {allocatedSuccess && (
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-scale-in">
              {allocatedSuccess}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Scenario A TL Allocation */}
          {subscription.hasTeamLeaders ? (
            <>
              <div className="p-4 rounded-xl border border-border bg-background flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-white">Amit Shah (Team Leader - Unit 1)</p>
                  <p className="text-xs text-muted">5 Reps Supervised · 42 Leads Handled</p>
                </div>
                <button onClick={() => handleManagerAllocate('Amit Shah (TL)')} className="btn-secondary text-xs font-bold py-1 px-3">
                  Allocate to TL →
                </button>
              </div>
              <div className="p-4 rounded-xl border border-border bg-background flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-white">Neha Joshi (Team Leader - Unit 2)</p>
                  <p className="text-xs text-muted">4 Reps Supervised · 38 Leads Handled</p>
                </div>
                <button onClick={() => handleManagerAllocate('Neha Joshi (TL)')} className="btn-secondary text-xs font-bold py-1 px-3">
                  Allocate to TL →
                </button>
              </div>
            </>
          ) : (
            /* Scenario B Direct Staff Allocation */
            <>
              <div className="p-4 rounded-xl border border-border bg-background flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-white">Rajesh Kumar (Sales Executive)</p>
                  <p className="text-xs text-muted">Direct Supervision · 31 Leads Assigned</p>
                </div>
                <button onClick={() => handleManagerAllocate('Rajesh Kumar (Staff)')} className="btn-secondary text-xs font-bold py-1 px-3">
                  Allocate to Staff →
                </button>
              </div>
              <div className="p-4 rounded-xl border border-border bg-background flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-white">Priya Sharma (Sales Executive)</p>
                  <p className="text-xs text-muted">Direct Supervision · 24 Leads Assigned</p>
                </div>
                <button onClick={() => handleManagerAllocate('Priya Sharma (Staff)')} className="btn-secondary text-xs font-bold py-1 px-3">
                  Allocate to Staff →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── ADMIN ELIGIBILITY WHITELIST MODAL ────────────────────────────────────── */}
      {showWhitelistModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-card border border-purple-500/30 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowWhitelistModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted text-white flex items-center justify-center hover:bg-red-500/20"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded border border-purple-500/30">
                ADMIN ACCESS GUARD
              </span>
              <h3 className="text-lg font-bold text-white mt-1.5">Acquire Pool Eligibility Whitelist</h3>
              <p className="text-xs text-muted mt-0.5">
                Toggle which Managers or Team Leaders are authorized to view and claim leads from the Dynamic "Grab" Pool.
              </p>
            </div>

            <div className="space-y-2 border border-border rounded-2xl p-2 max-h-60 overflow-y-auto">
              {whitelistManagers.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                  <div>
                    <p className="font-bold text-xs text-white">{m.name}</p>
                    <p className="text-[11px] text-muted">{m.email} • Role: {m.role}</p>
                  </div>

                  <button
                    onClick={() => handleToggleManagerWhitelist(m.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      m.isWhitelisted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {m.isWhitelisted ? 'Whitelisted ✓' : 'Not Whitelisted'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowWhitelistModal(false)}
                className="btn-primary text-xs font-bold px-4 py-2"
              >
                Save Whitelist Rules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
