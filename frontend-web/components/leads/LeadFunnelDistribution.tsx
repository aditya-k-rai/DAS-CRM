'use client';

import { useState } from 'react';
import {
  Target, Zap, Sliders, Shield, Users, ArrowRight, CheckCircle2,
  Lock, Eye, EyeOff, RefreshCw, Layers, Phone, MessageSquare, Mail, Globe, Share2, FileSpreadsheet, UserCheck
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
  { id: '1', serialNo: 'POOL-2026-0891', source: 'Facebook Ads',   receivedAt: '2 mins ago',  status: 'UNCLAIMED' },
  { id: '2', serialNo: 'POOL-2026-0892', source: 'Google Ads',     receivedAt: '5 mins ago',  status: 'UNCLAIMED' },
  { id: '3', serialNo: 'POOL-2026-0893', source: 'WhatsApp Webhook',receivedAt: '8 mins ago',  status: 'UNCLAIMED' },
  { id: '4', serialNo: 'POOL-2026-0894', source: 'Instagram Ads',  receivedAt: '12 mins ago', status: 'ACQUIRED', acquiredBy: 'Rajesh Mehta (Manager A)', acquiredAt: '10 mins ago' },
  { id: '5', serialNo: 'POOL-2026-0895', source: 'LinkedIn Leads', receivedAt: '15 mins ago', status: 'UNCLAIMED' },
];

export function LeadFunnelDistribution() {
  const [distMode, setDistMode]             = useState<DistMode>('SPEED_CLAIM');
  const [managerARange, setManagerA]       = useState('1 - 100');
  const [managerBRange, setManagerB]       = useState('101 - 200');
  const [directManager, setDirectManager]   = useState('Rajesh Mehta (Manager A)');
  const [pool, setPool]                     = useState<UnclaimedLeadPoolItem[]>(INITIAL_POOL);
  const [acquiredNotice, setAcquiredNotice] = useState<string | null>(null);
  const [allocatedSuccess, setAllocatedSuccess] = useState<string | null>(null);
  const { currentUser, subscription }       = useAuth();

  const handleClaimLead = (id: string) => {
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

  const handleManagerAllocate = (targetName: string) => {
    setAllocatedSuccess(`✓ Allocated batch lead to ${targetName}! Notification sent.`);
    setTimeout(() => setAllocatedSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
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
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Sliders size={18} className="text-indigo-400" /> Admin Lead Funnel Distribution Engine
            </h3>
            <p className="text-xs text-muted mt-0.5">Configure how ingested leads funnel to Managers & Team Leaders</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded font-bold bg-indigo-500/20 text-indigo-300">
            MODE: {distMode}
          </span>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">Anonymized Serial # Pool (Blind Claim Queue)</h4>
                <p className="text-xs text-muted">Personal contact details hidden until acquired by Manager</p>
              </div>
              {acquiredNotice && (
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-scale-in">
                  {acquiredNotice}
                </span>
              )}
            </div>

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
                        <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/15 px-2 py-1 rounded">
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
    </div>
  );
}
