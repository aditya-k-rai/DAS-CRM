'use client';

import { useState } from 'react';
import {
  Building2, Users, Shield, Zap, DollarSign, Tag, Check, X,
  Plus, Trash2, Edit2, Key, CheckCircle2, MessageSquare, Mail, RefreshCw, QrCode, CreditCard
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
  { id: 'comp_1', name: 'Acme Sales Solutions', domain: 'acme.com', ownerName: 'Vikram Singh', ownerEmail: 'vikram.admin@acme.com', plan: 'FREE_TRIAL', trialDaysLeft: 14, isExpired: false, seatsAllocated: 6, seatsUsed: 4, whatsApp: false, emailAuto: false },
  { id: 'comp_2', name: 'Sunita Real Estate Ltd', domain: 'sunitare.in', ownerName: 'Sunita Sharma', ownerEmail: 'sunita@sunitare.in', plan: 'PRO', trialDaysLeft: 0, isExpired: false, seatsAllocated: 20, seatsUsed: 14, whatsApp: true, emailAuto: true, appliedCoupon: 'WELCOME20' },
  { id: 'comp_3', name: 'Lakshmi Auto Dealerships', domain: 'lakshmiauto.com', ownerName: 'Ramesh Patel', ownerEmail: 'ramesh@lakshmiauto.com', plan: 'STARTER', trialDaysLeft: 0, isExpired: false, seatsAllocated: 6, seatsUsed: 5, whatsApp: true, emailAuto: true },
  { id: 'comp_4', name: 'TechCorp Enterprise', domain: 'techcorp.io', ownerName: 'Kavita Nair', ownerEmail: 'kavita@techcorp.io', plan: 'PRO_MAX', trialDaysLeft: 0, isExpired: false, seatsAllocated: 100, seatsUsed: 62, whatsApp: true, emailAuto: true, appliedCoupon: 'ENTERPRISE30' },
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
  const [selectedComp, setSelectedComp] = useState<CompanyRecord>(INITIAL_COMPANIES[0]);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>(INITIAL_UPGRADE_REQUESTS);
  const [activeTab, setActiveTab] = useState<'companies' | 'key_gen' | 'upgrades' | 'coupons'>('companies');

  // Company Key Generator Form State
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
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState(20);
  const [newPlanAllowed, setNewPlan] = useState('All Plans');

  const { updateSubscription } = useAuth();

  // Helper to generate Key Format: Initial letter + 2 Alpha + 4 Digit (e.g. ACME-KX-7421)
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
        setKeyLoading(false);
        return;
      }
    } catch (e) {
      // Fallback
    }

    // Client-side fallback generation matching exact format: [INITIALS]-[2 ALPHA]-[4 DIGIT]
    const initials = genCompanyName.split(/\s+/).map(w => w[0]?.toUpperCase() || '').join('').slice(0, 4);
    const alpha = 'KX';
    const digits = Math.floor(1000 + Math.random() * 9000).toString();
    const key = `${initials}-${alpha}-${digits}`;
    
    setGeneratedKey(key);
    // Simple SVG QR placeholder data url
    setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${key}`);
    setKeyLoading(false);
  };

  const handleApproveUpgrade = (reqId: string) => {
    setUpgradeRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'APPROVED' } : r));
    // Also update acme company plan if applicable
    updateSubscription({
      planType: 'PRO',
      features: { whatsApp: true, emailAutomation: true, aiLeadScoring: true, customSalaryBuilder: true, exportCSV: true },
    });
  };

  const handleRejectUpgrade = (reqId: string) => {
    setUpgradeRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'REJECTED' } : r));
  };

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

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Navigation Header */}
      <div className="crm-card p-5 border-l-4 border-l-indigo-500 bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 font-extrabold flex items-center justify-center text-lg shadow-lg">
              DEV
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Super-Admin Platform Control Center</h1>
              <p className="text-xs text-muted">Web-only developer portal to issue company registration keys, review plan upgrades, and control tenant features.</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'companies' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-muted text-muted'}`}
            >
              <Building2 size={14} /> Companies ({companies.length})
            </button>

            <button
              onClick={() => setActiveTab('key_gen')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'key_gen' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-muted text-muted'}`}
            >
              <Key size={14} /> Key Generator
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

      {/* TAB 1: Companies Directory */}
      {activeTab === 'companies' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7 crm-card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: 'rgb(var(--border))' }}>
              <h3 className="font-bold text-sm text-white">Client Companies Directory</h3>
            </div>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Allocated Plan</th>
                  <th>User Quota</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(comp => {
                  const isSelected = selectedComp.id === comp.id;
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
                        <span className="text-xs px-2.5 py-0.5 rounded font-bold" style={{
                          background: comp.plan === 'FREE_TRIAL' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                          color: comp.plan === 'FREE_TRIAL' ? 'rgb(245,158,11)' : 'rgb(34,197,94)',
                        }}>
                          {comp.plan === 'FREE_TRIAL' ? `Free Trial (${comp.trialDaysLeft}d)` : comp.plan}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-bold text-white">
                          {comp.seatsUsed} / {comp.seatsAllocated} Users
                        </span>
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

          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="crm-card border-indigo-500/40 space-y-4">
              <div className="pb-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                <h3 className="font-bold text-base text-white">{selectedComp.name}</h3>
                <p className="text-xs text-muted">Owner: {selectedComp.ownerName} ({selectedComp.ownerEmail})</p>
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Allocate Subscription Plan</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['FREE_TRIAL', 'STARTER', 'PRO', 'PRO_MAX'] as PlanType[]).map(plan => {
                    const active = selectedComp.plan === plan;
                    return (
                      <button
                        key={plan}
                        onClick={() => handleUpdatePlan(selectedComp, plan)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${active ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-card border-border text-muted hover:text-white'}`}
                      >
                        <p>{plan.replace('_', ' ')}</p>
                        <p className="text-[10px] font-normal text-muted mt-0.5">
                          {plan === 'FREE_TRIAL' ? 'WhatsApp/Email Hard-Blocked' : 'Full Access'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Company Key Generator with QR Code */}
      {activeTab === 'key_gen' && (
        <div className="crm-card space-y-6">
          <div>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              SECURITY KEY GENERATION ENGINE
            </span>
            <h3 className="text-xl font-bold text-white mt-2">Generate Company Registration Key & QR Code</h3>
            <p className="text-xs text-muted mt-0.5">
              Generates keys formatted as: Company name initial letters + 2 Alpha characters + 4 Digits (e.g., <strong>ACME-KX-7421</strong>).
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
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">User Quota (Admin Excluded)</label>
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
                <Key size={16} /> {keyLoading ? 'Generating Key...' : 'Generate Key & Render QR Code'}
              </button>
            </div>

            {/* Rendered Key Output */}
            <div className="p-6 rounded-2xl bg-background border border-purple-500/30 flex flex-col items-center justify-center text-center space-y-4">
              {generatedKey ? (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    KEY GENERATED SUCCESSFULLY
                  </span>
                  <div className="font-mono text-2xl font-black text-white tracking-widest bg-card px-6 py-3 rounded-2xl border border-purple-500/40 shadow-xl">
                    {generatedKey}
                  </div>

                  {qrDataUrl && (
                    <div className="p-3 bg-white rounded-2xl shadow-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrDataUrl} alt="Company Key QR" className="w-40 h-40" />
                    </div>
                  )}

                  <p className="text-[11px] text-muted max-w-xs">
                    Share this key or QR code with the Tenant Admin to register their company workspace at <strong>/register</strong>.
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
    </div>
  );
}
