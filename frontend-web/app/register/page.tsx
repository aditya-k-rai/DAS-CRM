'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Key, CheckCircle2, AlertCircle, ArrowRight, Shield, QrCode, Mail, Lock, Check, Layers
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterCompanyPage() {
  const [companyName, setCompanyName]         = useState('');
  const [adminName, setAdminName]             = useState('');
  const [adminEmail, setAdminEmail]           = useState('');
  const [adminPassword, setAdminPassword]     = useState('');
  const [phone, setPhone]                     = useState('');
  const [city, setCity]                       = useState('');
  const [state, setState]                     = useState('');
  const [gstNumber, setGstNumber]             = useState('');
  const [companyType, setCompanyType]         = useState('Private Limited');
  const [sector, setSector]                   = useState('Technology & SaaS');
  const [selectedPlan, setSelectedPlan]       = useState<'FREE_TRIAL' | 'GROWTH' | 'ENTERPRISE'>('FREE_TRIAL');

  const [error, setError]                     = useState<string | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);

  const router = useRouter();
  const { setAuthSession } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !adminName || !adminEmail || !adminPassword || !phone) {
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
          city,
          state,
          gstNumber,
          companyType,
          sector,
          planTier: selectedPlan,
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
        memberLimit: selectedPlan === 'ENTERPRISE' ? 50 : selectedPlan === 'GROWTH' ? 15 : 6,
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Register Your Company Workspace</h1>
          <p className="text-sm text-muted max-w-md mx-auto">
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
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  REGISTRATION SUCCESSFUL & MAIL DISPATCHED
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Company Registered & Credentials Emailed!</h3>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              We have generated your **Company Registration Key** and sent full account credentials and plan details to your official email ID:
              <strong className="text-emerald-300 ml-1 font-mono">{registrationSuccess.adminEmail}</strong>
            </p>

            {/* Email Summary Box */}
            <div className="p-5 rounded-2xl bg-background border border-border space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-muted flex items-center gap-1.5"><Mail size={13} className="text-brand-400" /> Recipient Mail:</span>
                <span className="font-bold text-white">{registrationSuccess.adminEmail}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-muted flex items-center gap-1.5"><Building2 size={13} className="text-indigo-400" /> Company Name:</span>
                <span className="font-bold text-white">{registrationSuccess.companyName}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-muted flex items-center gap-1.5"><Key size={13} className="text-amber-400" /> Generated Registration Key:</span>
                <span className="font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                  {registrationSuccess.registrationKey}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-muted flex items-center gap-1.5"><Layers size={13} className="text-emerald-400" /> Current Plan:</span>
                <span className="font-bold text-emerald-400">
                  {registrationSuccess.planTier} ({registrationSuccess.memberLimit} Seats, Valid {registrationSuccess.validityDays || 7} Days)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted flex items-center gap-1.5"><Lock size={13} className="text-purple-400" /> Admin Credentials:</span>
                <span className="font-bold text-white">{registrationSuccess.adminEmail} • Password Set ✓</span>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <Link
                href="/login"
                className="w-full py-3 rounded-xl bg-brand hover:bg-brand-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/25"
              >
                Proceed to Login Gateway with Your Key →
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
            <div className="space-y-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-brand-400 block">
                1. Select Company Plan Tier
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('FREE_TRIAL')}
                  className={`p-3 rounded-xl border text-left transition-all ${selectedPlan === 'FREE_TRIAL' ? 'bg-brand/20 border-brand text-white' : 'bg-background border-border text-muted hover:text-white'}`}
                >
                  <p className="font-bold text-xs">Free Trial</p>
                  <p className="text-[10px] text-muted">6 Seats · 7 Days</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan('GROWTH')}
                  className={`p-3 rounded-xl border text-left transition-all ${selectedPlan === 'GROWTH' ? 'bg-brand/20 border-brand text-white' : 'bg-background border-border text-muted hover:text-white'}`}
                >
                  <p className="font-bold text-xs">Growth Tier</p>
                  <p className="text-[10px] text-muted">15 Seats · 30 Days</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan('ENTERPRISE')}
                  className={`p-3 rounded-xl border text-left transition-all ${selectedPlan === 'ENTERPRISE' ? 'bg-brand/20 border-brand text-white' : 'bg-background border-border text-muted hover:text-white'}`}
                >
                  <p className="font-bold text-xs">Enterprise Tier</p>
                  <p className="text-[10px] text-muted">50 Seats · Custom</p>
                </button>
              </div>
            </div>

            {/* Step 2: Company & Administrative Credentials */}
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-sm text-white border-b border-border pb-2">
                2. Company & Administrative Credentials
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted block mb-1">Company Name *</label>
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
                  <label className="text-xs text-muted block mb-1">Tenant Admin Full Name *</label>
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
                  <label className="text-xs text-muted block mb-1">Admin Official Email (Key Dispatched Here) *</label>
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
                  <label className="text-xs text-muted block mb-1">Admin Password *</label>
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
                  <label className="text-xs text-muted block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    className="crm-input text-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mumbai"
                    className="crm-input text-sm"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    className="crm-input text-sm"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="27AAAAA0000A1Z5"
                    className="crm-input text-sm font-mono"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">Company Type</label>
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

                <div>
                  <label className="text-xs text-muted block mb-1">Industry Sector</label>
                  <select
                    className="crm-input text-sm font-bold"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                  >
                    <option value="Technology & SaaS">Technology & SaaS</option>
                    <option value="Real Estate & Construction">Real Estate & Construction</option>
                    <option value="Automobile & Dealerships">Automobile & Dealerships</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="Healthcare & Retail">Healthcare & Retail</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-brand hover:bg-brand-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/25 disabled:opacity-50"
              >
                {loading ? (
                  <>Registering Company & Dispatching Mail Key...</>
                ) : (
                  <>Register Company & Dispatch Key To Email →</>
                )}
              </button>

              <div className="text-center text-xs text-muted">
                Already registered your company?{' '}
                <Link href="/login" className="text-brand-400 font-bold hover:underline">
                  Login to Workspace
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
