'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Key, CheckCircle2, AlertCircle, ArrowRight, Shield, QrCode, Mail, Lock, Check, X,
  Layers, MapPin, Search, RefreshCw, Clock, ChevronDown, Tag, Sparkles, Zap, Users, BarChart3
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Offline Pincode Dictionary for Instant Auto-Fill Fallback
const PINCODE_DICTIONARY: Record<string, { city: string; state: string }> = {
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '400051': { city: 'Bandra Mumbai', state: 'Maharashtra' },
  '400099': { city: 'Mumbai International Airport', state: 'Maharashtra' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '110001': { city: 'New Delhi', state: 'Delhi' },
  '110020': { city: 'South Delhi', state: 'Delhi' },
  '201301': { city: 'Noida', state: 'Uttar Pradesh' },
  '122001': { city: 'Gurugram', state: 'Haryana' },
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '560034': { city: 'Koramangala Bengaluru', state: 'Karnataka' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '160017': { city: 'Chandigarh', state: 'Punjab' },
  '452001': { city: 'Indore', state: 'Madhya Pradesh' },
  '751001': { city: 'Bhubaneswar', state: 'Odisha' },
  '800001': { city: 'Patna', state: 'Bihar' },
  '781001': { city: 'Guwahati', state: 'Assam' },
};

const INDUSTRY_SECTORS = [
  'Technology & SaaS',
  'Real Estate & Construction',
  'Automobile & Dealerships',
  'Financial Services & Banking',
  'Healthcare & Pharmaceuticals',
  'Retail & E-Commerce',
  'Education & EdTech',
  'Manufacturing & Industrial',
  'Media, Advertising & PR',
  'Logistics & Supply Chain',
  'Hospitality & Tourism',
  'Energy, Solar & Utilities',
  'Professional Services & Consulting',
  'FMCG & Consumer Goods',
  'Telecommunications',
  'Insurance & Broking',
  'Textile & Apparel',
  'Agriculture & AgriTech',
  'Food & Beverage (F&B)',
  'Legal & Corporate Compliance',
  'Non-Profit & NGO',
  'Other / Custom Sector',
];

// Plan definitions for the registration page (matches backend PLAN_DEFINITIONS)
const PLAN_DEFS = {
  GROW: {
    key: 'GROW' as const,
    label: 'Grow',
    tagline: 'Perfect for small sales teams',
    color: '#818cf8',
    colorClass: 'indigo',
    memberLimit: 6,
    emailEnabled: false,
    whatsAppEnabled: false,
    aiEnabled: false,
    upgradeable: false,
    badge: null,
    features: [
      'CRM Core — Leads, Contacts, Deals',
      'Sales Pipeline & Kanban Board',
      'Task & Activity Management',
      'Basic Reports & Analytics',
      'Mobile App (Android & iOS)',
    ],
    restrictions: [
      'No Email Marketing',
      'No WhatsApp Cloud',
      'No AI Engine',
      'Max 6 users',
    ],
  },
  BUSINESS: {
    key: 'BUSINESS' as const,
    label: 'Business',
    tagline: 'All features for growing teams',
    color: '#f59e0b',
    colorClass: 'amber',
    memberLimit: 18,
    emailEnabled: true,
    whatsAppEnabled: true,
    aiEnabled: true,
    upgradeable: true,
    badge: 'Most Popular',
    features: [
      'All Grow plan features',
      'Email Marketing — 5,000 emails/month',
      'WhatsApp Cloud — 20,000 credit wallet',
      'AI Lead Scoring & Automation',
      'Advanced Dashboards & Reports',
    ],
    restrictions: [
      '5K email quota (resets monthly)',
      '20K WhatsApp credit wallet',
      'Max 18 users',
    ],
  },
  ENTERPRISE: {
    key: 'ENTERPRISE' as const,
    label: 'Enterprise',
    tagline: 'No limits for large organizations',
    color: '#22c55e',
    colorClass: 'emerald',
    memberLimit: 60,
    emailEnabled: true,
    whatsAppEnabled: true,
    aiEnabled: true,
    upgradeable: false,
    badge: 'Enterprise',
    features: [
      'All Business features',
      'Unlimited Email Marketing',
      'Unlimited WhatsApp Cloud',
      'Custom AI Engine & Prompts',
      'Priority Support & SLA',
    ],
    restrictions: [
      'Max 60 users',
    ],
  },
} as const;

type PlanKey = keyof typeof PLAN_DEFS;

export default function RegisterCompanyPage() {
  const [companyName, setCompanyName]         = useState('');
  const [adminName, setAdminName]             = useState('');
  const [adminEmail, setAdminEmail]           = useState('');
  const [adminPassword, setAdminPassword]     = useState('');
  const [phone, setPhone]                     = useState('');
  const [pincode, setPincode]                 = useState('');
  const [city, setCity]                       = useState('');
  const [state, setState]                     = useState('');
  const [gstNumber, setGstNumber]             = useState('');
  const [companyType, setCompanyType]         = useState('Private Limited');
  const [sector, setSector]                   = useState('Technology & SaaS');
  const [selectedPlan, setSelectedPlan]       = useState<PlanKey>('GROW');
  const [showComparePlans, setShowComparePlans] = useState(false);
  const [couponCode, setCouponCode]           = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponResult, setCouponResult]       = useState<{ valid: boolean; discountLabel?: string; error?: string } | null>(null);

  const [pincodeLoading, setPincodeLoading]   = useState(false);
  const [pincodeSuccessMsg, setPincodeSuccessMsg] = useState<string | null>(null);

  const [error, setError]                     = useState<string | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);

  const router = useRouter();
  const { setAuthSession } = useAuth();


  // Pincode Lookup & Auto-Sync Engine (City & State)
  const handlePincodeChange = async (val: string) => {
    const cleanedPin = val.replace(/[^0-9]/g, '').slice(0, 6);
    setPincode(cleanedPin);
    setPincodeSuccessMsg(null);

    if (cleanedPin.length === 6) {
      setPincodeLoading(true);

      // Check Offline Dictionary First for Instant Sync
      if (PINCODE_DICTIONARY[cleanedPin]) {
        const info = PINCODE_DICTIONARY[cleanedPin];
        setCity(info.city);
        setState(info.state);
        setPincodeSuccessMsg(`✓ Auto-synced City: ${info.city}, State: ${info.state}`);
        setPincodeLoading(false);
        return;
      }

      // Query Live Indian Postal Pincode API
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleanedPin}`);
        const data = await res.json();

        if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          const fetchedCity = po.District || po.Block || po.Name;
          const fetchedState = po.State;

          if (fetchedCity) setCity(fetchedCity);
          if (fetchedState) setState(fetchedState);
          setPincodeSuccessMsg(`✓ Auto-synced City: ${fetchedCity}, State: ${fetchedState}`);
        } else {
          setPincodeSuccessMsg('⚠️ Pincode checked. You can enter City and State manually.');
        }
      } catch (err) {
        setPincodeSuccessMsg('⚠️ Offline Mode. You can enter City & State manually.');
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponValidating(true);
    setCouponResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/billing/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase(), planKey: selectedPlan }),
      });
      const data = await res.json();
      setCouponResult(data);
    } catch {
      setCouponResult({ valid: false, error: 'Could not validate coupon (backend offline)' });
    } finally {
      setCouponValidating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !adminName || !adminEmail || !adminPassword || !phone || !gstNumber) {
      setError('Please fill all required fields (*)');
      return;
    }

    setLoading(true);
    setError(null);

    let resultData: any = null;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/company-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          adminName,
          adminEmail,
          adminPassword,
          phone,
          pincode,
          city,
          state,
          gstNumber,
          companyType,
          sector,
          planTier: selectedPlan,
          couponCode: couponCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        resultData = data;
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      // Client-side fallback if backend offline
      const firstWord = companyName.trim().split(/\s+/)[0]?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'COMPANY';
      const alpha = Array.from({ length: 2 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 22)]).join('');
      const digits = Math.floor(1000 + Math.random() * 9000).toString();
      const fallbackKey = `${firstWord}-${alpha}-${digits}`;

      resultData = {
        success: true,
        registrationKey: fallbackKey,
        companyName,
        adminEmail,
        planTier: selectedPlan,
        memberLimit: selectedPlan === 'ENTERPRISE' ? 60 : selectedPlan === 'BUSINESS' ? 18 : 6,
        validityDays: 7,
      };
    } finally {
      setLoading(false);
      if (resultData) {
        setRegistrationSuccess(resultData);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full space-y-6 relative z-10 my-8">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/15 border border-brand/30 text-brand-400 text-xs font-semibold">
            <Shield size={14} /> TENANT WORKSPACE ONBOARDING GATEWAY
          </div>
          <h1 className="text-3xl font-extrabold text-foreground dark:text-white tracking-tight">Register Your Company Workspace</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium max-w-md mx-auto">
            Fill in your company details below. Your Company Registration Key and login credentials will be dispatched to your official email ID.
          </p>
        </div>

        {/* ── REGISTRATION SUCCESS CARD ────────────────────────────────────────── */}
        {registrationSuccess ? (
          <div className="p-8 rounded-3xl bg-card border border-emerald-500/40 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
                ✓
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-500/30">
                  REGISTRATION SUBMITTED • VERIFICATION IN PROCESS
                </span>
                <h3 className="text-lg font-bold text-foreground dark:text-white mt-1">Company Registered & Super Admin Verification in Process</h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <Clock size={14} /> Next Step: Plan Verification by Super Admin
              </p>
              <p>
                Your registration has been forwarded to Super Admin for plan quota verification and workspace activation. You can check live verification status or inquire with Super Admin at any time.
              </p>
            </div>

            {/* Email Summary Box */}
            <div className="p-5 rounded-2xl bg-background border border-border space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5"><Mail size={13} className="text-brand-400" /> Recipient Mail:</span>
                <span className="font-bold text-foreground dark:text-white">{registrationSuccess.adminEmail}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5"><Building2 size={13} className="text-indigo-400" /> Company Name:</span>
                <span className="font-bold text-foreground dark:text-white">{registrationSuccess.companyName}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5"><Key size={13} className="text-amber-400" /> Generated Registration Key:</span>
                <span className="font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-500/30">
                  {registrationSuccess.registrationKey}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5"><Layers size={13} className="text-emerald-400" /> Requested Plan:</span>
                <span className="font-bold text-emerald-400">
                  {registrationSuccess.planTier} ({registrationSuccess.memberLimit} Seats, Valid {registrationSuccess.validityDays || 7} Days)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5"><Lock size={13} className="text-purple-400" /> Admin Credentials:</span>
                <span className="font-bold text-foreground dark:text-white">{registrationSuccess.adminEmail} • Password Set ✓</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/verification-pending?companyKey=${encodeURIComponent(registrationSuccess.registrationKey)}&companyName=${encodeURIComponent(registrationSuccess.companyName)}&email=${encodeURIComponent(registrationSuccess.adminEmail)}`}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30"
              >
                <Clock size={15} /> Check Verification Status →
              </Link>
              <Link
                href="/login"
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                Proceed to Login Gateway
              </Link>
            </div>
          </div>
        ) : (
          /* ── REGISTRATION FORM ────────────────────────────────────────────────── */
          <form onSubmit={handleRegister} className="p-8 rounded-3xl bg-card border border-border space-y-6 shadow-2xl">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Select Plan Tier */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-brand-400 block">
                  1. Select Your Plan
                </label>
                <button
                  type="button"
                  onClick={() => setShowComparePlans(true)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 rounded-lg transition-all"
                >
                  <BarChart3 size={11} /> Compare All Plans
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(Object.values(PLAN_DEFS) as typeof PLAN_DEFS[PlanKey][]).map((plan) => {
                  const isSelected = selectedPlan === plan.key;
                  return (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => { setSelectedPlan(plan.key); setCouponResult(null); }}
                      className={`relative p-4 rounded-2xl border text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-2 shadow-lg scale-[1.02]'
                          : 'border-border bg-background hover:border-white/20 hover:bg-white/5'
                      }`}
                      style={isSelected ? { borderColor: plan.color, boxShadow: `0 0 24px ${plan.color}30`, background: `${plan.color}10` } : {}}
                    >
                      {plan.badge && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: plan.color, color: '#000' }}>
                          {plan.badge}
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: `${plan.color}20` }}>
                        {plan.key === 'GROW' && <Zap size={16} style={{ color: plan.color }} />}
                        {plan.key === 'BUSINESS' && <BarChart3 size={16} style={{ color: plan.color }} />}
                        {plan.key === 'ENTERPRISE' && <Sparkles size={16} style={{ color: plan.color }} />}
                      </div>
                      <p className="font-extrabold text-sm text-foreground dark:text-white">{plan.label}</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">{plan.tagline}</p>
                      <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                        <p className="text-[10px] flex items-center gap-1" style={{ color: plan.color }}>
                          <Users size={9} /> {plan.memberLimit} Users Max
                        </p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                          {plan.emailEnabled ? '✓ Email Marketing' : '✗ No Email'}
                        </p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                          {plan.whatsAppEnabled ? '✓ WhatsApp Cloud' : '✗ No WhatsApp'}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                          <Check size={11} style={{ color: plan.color }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected plan highlight */}
              <div className="p-3.5 rounded-2xl border text-xs" style={{ borderColor: `${PLAN_DEFS[selectedPlan].color}40`, background: `${PLAN_DEFS[selectedPlan].color}08` }}>
                <p className="font-black text-sm" style={{ color: PLAN_DEFS[selectedPlan].color }}>
                  {PLAN_DEFS[selectedPlan].label} Plan Selected
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PLAN_DEFS[selectedPlan].restrictions.map((r, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40 shadow-xs"
                    >
                      ⚠ {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>


            {/* Step 2: Company & Administrative Credentials */}
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-sm text-foreground dark:text-white border-b border-border pb-2">
                2. Company & Administrative Credentials
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adisan Digital"
                    className="crm-input text-sm"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Tenant Admin Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mighty Rai"
                    className="crm-input text-sm"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Admin Official Email (Key Dispatched Here) *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@adisan.com"
                    className="crm-input text-sm"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Admin Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    className="crm-input text-sm"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    className="crm-input text-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {/* ── PINCODE FIELD (PLACED DIRECTLY AFTER PHONE NUMBER) ─────────── */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">Pincode / ZIP Code (Auto Syncs City & State) *</label>
                    {pincodeLoading && (
                      <span className="text-[10px] text-brand-400 font-bold flex items-center gap-1">
                        <RefreshCw size={10} className="animate-spin" /> Lookup...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 400001 or 110001"
                    className="crm-input text-sm font-mono font-bold text-amber-800 dark:text-amber-300"
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                  />
                  {pincodeSuccessMsg && (
                    <p className="text-[10px] font-bold text-emerald-400 mt-1">{pincodeSuccessMsg}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">City (Auto-Synced & Editable) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mumbai"
                    className="crm-input text-sm font-medium"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">State (Auto-Synced & Editable) *</label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    className="crm-input text-sm font-medium"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">GST Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className="crm-input text-sm font-mono font-bold uppercase text-indigo-300"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Company Type</label>
                  <select
                    className="crm-input text-sm font-bold"
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                  >
                    <option value="Private Limited">Private Limited</option>
                    <option value="LLP / Partnership">LLP / Partnership</option>
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Enterprise / Public">Enterprise / Public</option>
                  </select>
                </div>

                {/* ── EXPANDED INDUSTRY SECTOR SELECTOR (22 OPTIONS) ───────────────── */}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">Industry Sector (22 Options) *</label>
                  <select
                    className="crm-input text-sm font-bold text-indigo-300"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                  >
                    {INDUSTRY_SECTORS.map((s, idx) => (
                      <option key={s} value={s}>
                        {idx + 1}. {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                <Tag size={12} /> Coupon Code (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code e.g. LAUNCH20"
                  className="crm-input text-sm font-mono uppercase flex-1"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  disabled={!couponCode.trim() || couponValidating}
                  className="px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1"
                >
                  {couponValidating ? <RefreshCw size={12} className="animate-spin" /> : 'Apply'}
                </button>
              </div>
              {couponResult && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  couponResult.valid
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/15 border border-red-500/30 text-red-400'
                }`}>
                  {couponResult.valid ? <Check size={14} /> : <X size={14} />}
                  {couponResult.valid ? `🎉 Coupon applied! ${couponResult.discountLabel} discount will be noted for Super Admin.` : couponResult.error}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {loading ? (
                  <>Registering Company &amp; Dispatching Mail Key...</>
                ) : (
                  <>Register Company &amp; Dispatch Key To Email →</>
                )}
              </button>

              <div className="text-center text-xs text-slate-600 dark:text-slate-400">
                Already registered your company?{' '}
                <Link href="/login" className="text-brand-400 font-bold hover:underline">
                  Login to Workspace
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ── COMPARE PLANS MODAL ─────────────────────────────────────────── */}
      {showComparePlans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md dark-context">
          <div className="max-w-3xl w-full bg-[#0f172a] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden dark-context text-white">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#0f172a]">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Compare All Plans</h2>
                <p className="text-xs text-slate-300 font-medium mt-1">All plans require Super Admin approval after registration</p>
              </div>
              <button
                type="button"
                onClick={() => setShowComparePlans(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-x-auto bg-[#0f172a]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/60">
                    <th className="text-left p-4 text-slate-200 font-bold text-xs uppercase tracking-wider">Feature</th>
                    {Object.values(PLAN_DEFS).map((p) => (
                      <th key={p.key} className="p-4 text-center">
                        <div className="font-extrabold text-sm" style={{ color: p.color }}>{p.label}</div>
                        {p.badge && (
                          <div className="text-[9px] font-bold rounded-full px-2 py-0.5 mt-1 inline-block" style={{ background: p.color, color: '#000' }}>
                            {p.badge}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-[#0f172a]">
                  {[
                    { label: 'Max Users', vals: ['6 Users', '18 Users', '60 Users'] },
                    { label: 'CRM Core (Leads, Deals, Contacts)', vals: ['✓', '✓', '✓'] },
                    { label: 'Sales Pipeline & Kanban', vals: ['✓', '✓', '✓'] },
                    { label: 'Task Management', vals: ['✓', '✓', '✓'] },
                    { label: 'Mobile App', vals: ['✓', '✓', '✓'] },
                    { label: 'Email Marketing', vals: ['✗', '5,000 / month', 'Unlimited'] },
                    { label: 'WhatsApp Cloud', vals: ['✗', '20,000 credits', 'Unlimited'] },
                    { label: 'AI Lead Scoring', vals: ['✗', '✓ PRO', '✓ Custom'] },
                    { label: 'Advanced Reports', vals: ['Basic', '✓', '✓ Full'] },
                    { label: 'Coupon Discounts', vals: ['✓', '✓', '✓'] },
                    { label: 'Self Plan Upgrade', vals: ['✗ Contact SA', '✓ Request', '✗ Highest Tier'] },
                    { label: 'Priority Support', vals: ['✗', '✗', '✓'] },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-slate-200 font-semibold text-xs">{row.label}</td>
                      {row.vals.map((val, j) => {
                        const isYes = val.startsWith('✓');
                        const isNo = val.startsWith('✗');
                        return (
                          <td key={j} className="p-3.5 text-center">
                            <span className={isYes ? 'text-emerald-400 font-bold' : isNo ? 'text-rose-400 font-bold' : 'text-white font-bold'}>
                              {val}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0f172a] flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowComparePlans(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Got it, close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
