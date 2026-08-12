'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Key, CheckCircle2, AlertCircle, ArrowRight, Shield, QrCode
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterCompanyPage() {
  const [registrationKey, setRegistrationKey] = useState('ACME-KX-7421');
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

  const [keyValidating, setKeyValidating]     = useState(false);
  const [keyInfo, setKeyInfo]                 = useState<any>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [loading, setLoading]                 = useState(false);

  const router = useRouter();
  const { setAuthSession } = useAuth();

  const handleValidateKey = async () => {
    if (!registrationKey.trim()) return;
    setKeyValidating(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/validate-company-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: registrationKey }),
      });
      const data = await res.json();
      if (data.valid) {
        setKeyInfo(data);
      } else {
        setError('Invalid, expired, or already used Company Registration Key.');
      }
    } catch (err) {
      // Demo fallback key preview
      setKeyInfo({
        valid: true,
        planTier: 'FREE_TRIAL',
        memberLimit: 6,
        validityDays: 7,
        whatsAppEnabled: false,
        emailMarketingEnabled: false,
      });
    } finally {
      setKeyValidating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationKey || !companyName || !adminName || !adminEmail || !adminPassword || !phone) {
      setError('Please fill all required fields (*)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/company-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationKey,
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
        }),
      });

      const data = await res.json();
      if (res.ok && data.accessToken) {
        setAuthSession(
          {
            id: data.user.id,
            name: adminName,
            email: adminEmail,
            role: 'ADMIN',
            avatar: adminName.slice(0, 2).toUpperCase(),
            companyId: data.organization?.id || 'comp_new',
            companyName: companyName,
          },
          data.accessToken
        );
        setLoading(false);
        router.push('/dashboard');
        return;
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.warn('Backend unavailable, using fallback:', err);
    }

    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 py-12">
      <div className="w-full max-w-3xl rounded-3xl border overflow-hidden shadow-2xl bg-card" style={{ borderColor: 'rgb(var(--border))' }}>
        {/* Header Banner */}
        <div className="p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur">
                COMPANY REGISTRATION GATEWAY
              </span>
              <h1 className="text-2xl font-black mt-3">Register Your Company Workspace</h1>
              <p className="text-xs text-white/80 mt-1">Enter your Super-Admin issued Company Registration Key to activate your tenant workspace.</p>
            </div>
            <Link href="/login" className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/20 transition-all">
              ← Back to Login
            </Link>
          </div>
        </div>

        <form onSubmit={handleRegister} className="p-8 space-y-6">
          {/* Step 1: Key Validation Section */}
          <div className="p-5 rounded-2xl border bg-indigo-500/10 border-indigo-500/20 space-y-3">
            <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
              1. Company Registration Key * (Format: ACME-KX-7421)
            </label>
            <div className="flex gap-2">
              <input
                className="crm-input font-mono text-sm font-bold uppercase tracking-wider h-11 flex-1"
                placeholder="ACME-KX-7421"
                value={registrationKey}
                onChange={e => setRegistrationKey(e.target.value.toUpperCase())}
              />
              <button
                type="button"
                onClick={handleValidateKey}
                disabled={keyValidating}
                className="px-4 text-xs font-bold bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-md"
              >
                {keyValidating ? 'Checking...' : 'Validate Key'}
              </button>
            </div>

            {keyInfo && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Key Validated! Tier: <strong>{keyInfo.planTier || 'FREE_TRIAL'}</strong> ({keyInfo.memberLimit || 6} Seats Quota)</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-mono">
                  Valid {keyInfo.validityDays || 7} Days
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Company & Admin Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Company & Administrative Credentials</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted block mb-1">Company Name *</label>
                <input
                  className="crm-input text-sm h-10 w-full"
                  placeholder="Acme Tech Solutions Ltd"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Tenant Admin Full Name *</label>
                <input
                  className="crm-input text-sm h-10 w-full"
                  placeholder="Vikram Singh"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Admin Official Email *</label>
                <input
                  type="email"
                  className="crm-input text-sm h-10 w-full"
                  placeholder="admin@acmetech.com"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Admin Password *</label>
                <input
                  type="password"
                  className="crm-input text-sm h-10 w-full"
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Phone Number *</label>
                <input
                  className="crm-input text-sm h-10 w-full"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">City *</label>
                <input
                  className="crm-input text-sm h-10 w-full"
                  placeholder="Mumbai"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">State *</label>
                <input
                  className="crm-input text-sm h-10 w-full"
                  placeholder="Maharashtra"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">GST Number (Optional)</label>
                <input
                  className="crm-input text-sm h-10 w-full font-mono uppercase"
                  placeholder="27AAAAA0000A1Z5"
                  value={gstNumber}
                  onChange={e => setGstNumber(e.target.value.toUpperCase())}
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Company Type</label>
                <select
                  className="crm-input text-sm h-10 w-full"
                  value={companyType}
                  onChange={e => setCompanyType(e.target.value)}
                >
                  <option>Private Limited</option>
                  <option>LLP (Limited Liability Partnership)</option>
                  <option>Sole Proprietorship</option>
                  <option>Partnership Firm</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Industry Sector</label>
                <select
                  className="crm-input text-sm h-10 w-full"
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                >
                  <option>Technology & SaaS</option>
                  <option>Real Estate & Construction</option>
                  <option>Automobile Sales</option>
                  <option>Financial Services & Insurance</option>
                  <option>Manufacturing & Logistics</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-sm font-bold w-full py-3.5 gap-2 flex items-center justify-center shadow-xl"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            {loading ? 'Registering Company Workspace...' : 'Complete Registration & Open Dashboard'} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
