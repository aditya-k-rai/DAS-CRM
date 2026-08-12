'use client';

import { useState } from 'react';
import {
  Building2, Users, Shield, Zap, DollarSign, Tag, Check, X,
  Plus, Trash2, Edit2, Key, CheckCircle2, MessageSquare, Mail, RefreshCw, Percent
} from 'lucide-react';
import { useAuth, CompanySubscription, PlanType } from '@/context/AuthContext';

interface CompanyRecord {
  id: string;
  name: string;
  domain: string;
  ownerName: string;
  ownerEmail: string;
  plan: PlanType;
  trialDaysLeft: number;
  isExpired: boolean;
  seatsAllocated: number;
  seatsUsed: number;
  whatsApp: boolean;
  emailAuto: boolean;
  appliedCoupon?: string;
}

interface Coupon {
  id: string;
  code: string;
  discountPct: number;
  planAllowed: string;
  validUntil: string;
  usesRemaining: number;
}

const INITIAL_COMPANIES: CompanyRecord[] = [
  { id: 'comp_1', name: 'Acme Sales Solutions', domain: 'acme.com', ownerName: 'John Doe', ownerEmail: 'john@acme.com', plan: 'FREE_TRIAL', trialDaysLeft: 18, isExpired: false, seatsAllocated: 5, seatsUsed: 7, whatsApp: false, emailAuto: false },
  { id: 'comp_2', name: 'Sunita Real Estate Ltd', domain: 'sunitare.in', ownerName: 'Sunita Sharma', ownerEmail: 'sunita@sunitare.in', plan: 'PRO', trialDaysLeft: 0, isExpired: false, seatsAllocated: 15, seatsUsed: 12, whatsApp: true, emailAuto: true, appliedCoupon: 'WELCOME20' },
  { id: 'comp_3', name: 'Lakshmi Auto Dealerships', domain: 'lakshmiauto.com', ownerName: 'Ramesh Patel', ownerEmail: 'ramesh@lakshmiauto.com', plan: 'FREE_TRIAL', trialDaysLeft: 0, isExpired: true, seatsAllocated: 5, seatsUsed: 4, whatsApp: false, emailAuto: false },
  { id: 'comp_4', name: 'TechCorp Enterprise', domain: 'techcorp.io', ownerName: 'Kavita Nair', ownerEmail: 'kavita@techcorp.io', plan: 'PRO_MAX', trialDaysLeft: 0, isExpired: false, seatsAllocated: 50, seatsUsed: 38, whatsApp: true, emailAuto: true, appliedCoupon: 'ENTERPRISE30' },
];

const INITIAL_COUPONS: Coupon[] = [
  { id: '1', code: 'WELCOME50', discountPct: 50, planAllowed: 'All Plans', validUntil: 'Dec 31, 2026', usesRemaining: 42 },
  { id: '2', code: 'ENTERPRISE30', discountPct: 30, planAllowed: 'PRO_MAX', validUntil: 'Sep 30, 2026', usesRemaining: 18 },
  { id: '3', code: 'FREETRIAL30', discountPct: 100, planAllowed: 'PRO', validUntil: 'Aug 31, 2026', usesRemaining: 5 },
];

export function SuperAdminDashboard() {
  const [companies, setCompanies]       = useState<CompanyRecord[]>(INITIAL_COMPANIES);
  const [selectedComp, setSelectedComp] = useState<CompanyRecord>(INITIAL_COMPANIES[0]);
  const [coupons, setCoupons]           = useState<Coupon[]>(INITIAL_COUPONS);
  const [activeTab, setActiveTab]       = useState<'companies' | 'coupons'>('companies');

  // Coupon form state
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [newCode, setNewCode]             = useState('');
  const [newDiscount, setNewDiscount]     = useState(20);
  const [newPlanAllowed, setNewPlan]      = useState('All Plans');

  const { updateSubscription }            = useAuth();

  const handleUpdatePlan = (comp: CompanyRecord, newPlan: PlanType) => {
    const isTrial = newPlan === 'FREE_TRIAL';
    const updated = {
      ...comp,
      plan: newPlan,
      whatsApp: !isTrial,
      emailAuto: !isTrial,
      isExpired: false,
      trialDaysLeft: isTrial ? 30 : 0,
    };
    setCompanies(prev => prev.map(c => c.id === comp.id ? updated : c));
    setSelectedComp(updated);

    if (comp.id === 'comp_1') {
      updateSubscription({
        planType: newPlan,
        trialDaysLeft: isTrial ? 30 : 0,
        isExpired: false,
        features: { whatsApp: !isTrial, emailAutomation: !isTrial, aiLeadScoring: true, customSalaryBuilder: true, exportCSV: true },
      });
    }
  };

  const handleToggleFeature = (comp: CompanyRecord, feat: 'whatsApp' | 'emailAuto') => {
    const updated = { ...comp, [feat]: !comp[feat] };
    setCompanies(prev => prev.map(c => c.id === comp.id ? updated : c));
    setSelectedComp(updated);

    if (comp.id === 'comp_1') {
      updateSubscription({
        features: {
          whatsApp: feat === 'whatsApp' ? updated.whatsApp : selectedComp.whatsApp,
          emailAutomation: feat === 'emailAuto' ? updated.emailAuto : selectedComp.emailAuto,
          aiLeadScoring: true, customSalaryBuilder: true, exportCSV: true,
        },
      });
    }
  };

  const handleUpdateSeats = (comp: CompanyRecord, seats: number) => {
    const updated = { ...comp, seatsAllocated: seats };
    setCompanies(prev => prev.map(c => c.id === comp.id ? updated : c));
    setSelectedComp(updated);

    if (comp.id === 'comp_1') {
      updateSubscription({ userSeatsAllocated: seats });
    }
  };

  const handleApplyCoupon = (comp: CompanyRecord, couponCode: string) => {
    const updated = { ...comp, appliedCoupon: couponCode };
    setCompanies(prev => prev.map(c => c.id === comp.id ? updated : c));
    setSelectedComp(updated);
  };

  const handleCreateCoupon = () => {
    if (!newCode.trim()) return;
    const coupon: Coupon = {
      id: Date.now().toString(),
      code: newCode.toUpperCase(),
      discountPct: newDiscount,
      planAllowed: newPlanAllowed,
      validUntil: 'Dec 31, 2026',
      usesRemaining: 50,
    };
    setCoupons([...coupons, coupon]);
    setNewCode('');
    setShowAddCoupon(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="crm-card p-5 border-l-4 border-l-indigo-500 bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-extrabold flex items-center justify-center text-lg">
              DEV
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Developer Platform Control Center</h1>
              <p className="text-xs text-muted">Minimal administrative panel to manage client companies, subscription plans, features, and discount coupons.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'companies' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-muted text-muted'}`}
            >
              <Building2 size={14} /> Companies & Plans ({companies.length})
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'coupons' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-muted text-muted'}`}
            >
              <Tag size={14} /> Offers & Coupons ({coupons.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Companies & Plans */}
      {activeTab === 'companies' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Companies List */}
          <div className="col-span-12 lg:col-span-7 crm-card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
              <h3 className="font-bold text-sm text-white">Client Companies Directory</h3>
            </div>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Allocated Plan</th>
                  <th>Seats</th>
                  <th>Offer Coupon</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {companies.map(comp => {
                  const isSelected = selectedComp.id === comp.id;
                  const seatExceeded = comp.seatsUsed > comp.seatsAllocated;
                  return (
                    <tr
                      key={comp.id}
                      onClick={() => setSelectedComp(comp)}
                      className={`cursor-pointer transition-all ${isSelected ? 'bg-indigo-500/10' : ''}`}
                    >
                      <td>
                        <p className="font-bold text-sm text-white">{comp.name}</p>
                        <p className="text-xs text-muted">{comp.ownerName}</p>
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded font-bold" style={{
                          background: comp.plan === 'FREE_TRIAL' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                          color: comp.plan === 'FREE_TRIAL' ? 'rgb(245,158,11)' : 'rgb(34,197,94)',
                        }}>
                          {comp.plan === 'FREE_TRIAL' ? `Free Trial (${comp.trialDaysLeft}d)` : comp.plan}
                        </span>
                      </td>
                      <td>
                        <span className={`text-xs font-bold ${seatExceeded ? 'text-red-400' : 'text-white'}`}>
                          {comp.seatsUsed} / {comp.seatsAllocated}
                        </span>
                      </td>
                      <td>
                        {comp.appliedCoupon ? (
                          <span className="text-xs px-2 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300">
                            {comp.appliedCoupon}
                          </span>
                        ) : (
                          <span className="text-xs text-muted">None</span>
                        )}
                      </td>
                      <td>
                        <button className="btn-secondary text-xs py-1 px-2">Edit →</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Allocation & Controls Inspector */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="crm-card border-indigo-500/40 space-y-4">
              <div className="pb-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                <h3 className="font-bold text-base text-white">{selectedComp.name}</h3>
                <p className="text-xs text-muted">Owner: {selectedComp.ownerName} ({selectedComp.ownerEmail})</p>
              </div>

              {/* Plan Picker */}
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Allocate Subscription Plan</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['FREE_TRIAL', 'BASIC', 'PRO', 'PRO_MAX'] as PlanType[]).map(plan => {
                    const active = selectedComp.plan === plan;
                    return (
                      <button
                        key={plan}
                        onClick={() => handleUpdatePlan(selectedComp, plan)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${active ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-card border-border text-muted hover:text-white'}`}
                      >
                        <p>{plan.replace('_', ' ')}</p>
                        <p className="text-[10px] font-normal text-muted mt-0.5">
                          {plan === 'FREE_TRIAL' ? '30 Days (WA/Email locked)' : 'Full Features'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feature Toggles */}
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Enable / Disable Features</label>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border">
                    <span className="font-semibold text-white">WhatsApp Messaging</span>
                    <button
                      onClick={() => handleToggleFeature(selectedComp, 'whatsApp')}
                      className={`px-3 py-1 rounded-full font-bold ${selectedComp.whatsApp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted'}`}
                    >
                      {selectedComp.whatsApp ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border">
                    <span className="font-semibold text-white">Email Automation Engine</span>
                    <button
                      onClick={() => handleToggleFeature(selectedComp, 'emailAuto')}
                      className={`px-3 py-1 rounded-full font-bold ${selectedComp.emailAuto ? 'bg-indigo-500/20 text-indigo-400' : 'bg-muted text-muted'}`}
                    >
                      {selectedComp.emailAuto ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Seat Limits */}
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Max User Seats Allocated</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={200}
                    className="crm-input text-sm font-bold w-20 h-9 text-center"
                    value={selectedComp.seatsAllocated}
                    onChange={e => handleUpdateSeats(selectedComp, +e.target.value)}
                  />
                  <span className="text-xs text-muted">Used: <strong className="text-white">{selectedComp.seatsUsed}</strong> seats</span>
                </div>
              </div>

              {/* Apply Offer Coupon */}
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Apply Discount Coupon / Offer</label>
                <select
                  className="crm-input text-xs h-9 w-full font-semibold"
                  value={selectedComp.appliedCoupon || ''}
                  onChange={e => handleApplyCoupon(selectedComp, e.target.value)}
                >
                  <option value="">— No Coupon Applied —</option>
                  {coupons.map(c => (
                    <option key={c.id} value={c.code}>{c.code} ({c.discountPct}% OFF)</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Offers & Coupons Manager */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white">Discount Coupons & Promotional Offers</h3>
            <button className="btn-primary text-sm gap-1.5 flex items-center" onClick={() => setShowAddCoupon(true)}>
              <Plus size={14} /> Create Coupon
            </button>
          </div>

          {/* Create Coupon Modal */}
          {showAddCoupon && (
            <div className="crm-card p-4 space-y-4 border-indigo-500/40">
              <h4 className="font-bold text-sm">Create New Offer Coupon</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Coupon Code *</label>
                  <input
                    className="crm-input text-sm font-mono uppercase"
                    placeholder="e.g. SUMMER30"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Discount %</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    className="crm-input text-sm"
                    value={newDiscount}
                    onChange={e => setNewDiscount(+e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Applicable Plan</label>
                  <select className="crm-input text-sm" value={newPlanAllowed} onChange={e => setNewPlan(e.target.value)}>
                    <option value="All Plans">All Plans</option>
                    <option value="PRO">PRO Plan</option>
                    <option value="PRO_MAX">PRO_MAX Plan</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button className="btn-secondary text-xs" onClick={() => setShowAddCoupon(false)}>Cancel</button>
                <button className="btn-primary text-xs" onClick={handleCreateCoupon}>Create Coupon</button>
              </div>
            </div>
          )}

          {/* Coupons Table */}
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
    </div>
  );
}
