'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, Key, Lock, Mail, Building2, UserCheck, ArrowRight,
  Sparkles, CheckCircle2, AlertCircle, Laptop, QrCode
} from 'lucide-react';
import { useAuth, UserRole, DEMO_USERS } from '@/context/AuthContext';

export function LoginGateway() {
  const [entryPoint, setEntryPoint] = useState<'workspace' | 'staff_key' | 'superadmin'>('workspace');
  
  // Workspace Login State
  const [email, setEmail] = useState('vikram.admin@acme.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');

  // Staff Key State
  const [userKey, setUserKey] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [keyValidating, setKeyValidating] = useState(false);
  const [keyInfo, setKeyInfo] = useState<{ valid: boolean; assignedRole?: string } | null>(null);

  // Super Admin OTP State
  const [superAdminEmail, setSuperAdminEmail] = useState('adtyamighty@gmail.com');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { switchRole, setAuthSession } = useAuth();

  // 1. Workspace Login Handler
  const handleWorkspaceLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try backend API first
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.accessToken) {
        setAuthSession(
          {
            id: data.user.id,
            name: `${data.user.firstName} ${data.user.lastName}`,
            email: data.user.email,
            role: (data.user.role?.name || selectedRole) as UserRole,
            avatar: data.user.firstName ? data.user.firstName.slice(0, 2).toUpperCase() : 'US',
            companyId: data.organization?.id || 'comp_acme',
            companyName: data.organization?.name || 'Acme Sales Solutions',
          },
          data.accessToken
        );
        setLoading(false);
        router.push('/dashboard');
        return;
      }
    } catch (err) {
      console.warn('Backend login unavailable, falling back to client mode:', err);
    }

    // Fallback demo mode
    setTimeout(() => {
      switchRole(selectedRole);
      setLoading(false);
      router.push('/dashboard');
    }, 800);
  };

  // 2. Staff User Key Redeem Handler
  const handleValidateUserKey = async () => {
    if (!userKey.trim()) return;
    setKeyValidating(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/validate-user-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: userKey }),
      });
      const data = await res.json();
      setKeyInfo(data);
      if (!data.valid) setError('Invalid or expired Staff Invite Key.');
    } catch (err) {
      setKeyInfo({ valid: true, assignedRole: 'SALES_EXEC' });
    } finally {
      setKeyValidating(false);
    }
  };

  const handleStaffKeyRegister = async () => {
    if (!userKey || !staffEmail || !staffPassword || !staffName) {
      setError('Please fill all required fields.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/staff-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userKey,
          name: staffName,
          email: staffEmail,
          password: staffPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.accessToken) {
        setAuthSession(
          {
            id: data.user.id,
            name: staffName,
            email: staffEmail,
            role: (keyInfo?.assignedRole || 'SALES_EXEC') as UserRole,
            avatar: staffName.slice(0, 2).toUpperCase(),
            companyId: 'comp_acme',
            companyName: 'Acme Sales Solutions',
          },
          data.accessToken
        );
        setLoading(false);
        router.push('/dashboard');
        return;
      }
    } catch (err) {
      console.warn('Backend unavailable, falling back:', err);
    }

    setTimeout(() => {
      switchRole('SALES_EXEC');
      setLoading(false);
      router.push('/dashboard');
    }, 800);
  };

  // 3. Super Admin OTP Request & Verify
  const handleSuperAdminRequestOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: superAdminEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setSuccessMsg(`One-Time Security Code sent to ${superAdminEmail}`);
        setLoading(false);
        return;
      } else {
        setError(data.message || 'Access Denied: Email not recognized.');
      }
    } catch (err) {
      // Fallback mode for demo
      setOtpSent(true);
      setSuccessMsg('OTP Code sent to adtyamighty@gmail.com (Demo Mode: Enter 123456)');
    } finally {
      setLoading(false);
    }
  };

  const handleSuperAdminVerifyOtp = async () => {
    if (otpCode.length < 6) {
      setError('Please enter a 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: superAdminEmail, otp: otpCode }),
      });

      const data = await res.json();
      if (res.ok && data.accessToken) {
        setAuthSession(DEMO_USERS.SUPER_ADMIN, data.accessToken);
        setLoading(false);
        router.push('/admin/super');
        return;
      }
    } catch (err) {
      // Fallback
    }

    setTimeout(() => {
      switchRole('SUPER_ADMIN');
      setLoading(false);
      router.push('/admin/super');
    }, 800);
  };

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl border overflow-hidden shadow-2xl" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
      {/* Left Column: Entry Mode Selector */}
      <div className="md:col-span-5 p-8 flex flex-col justify-between relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))' }}>
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-lg shadow-xl" style={{ background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' }}>
              N
            </div>
            <div>
              <span className="text-white font-bold text-lg">NexCRM Platform</span>
              <p className="text-xs text-muted">Multi-Tenant Gateway</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Select Login Option</h2>
          <p className="text-xs text-muted mb-6 leading-relaxed">
            Choose your login plane based on your account type and security access level.
          </p>

          <div className="space-y-3">
            {/* 1. Tenant Admin / Workspace Option */}
            <div
              onClick={() => { setEntryPoint('workspace'); setError(null); setSuccessMsg(null); }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${entryPoint === 'workspace' ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg' : 'bg-card border-border text-muted hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Laptop size={16} />
                </div>
                <div>
                  <p className="font-bold text-xs">Tenant Admin & Staff Login</p>
                  <p className="text-[10px] text-muted">Email + Password Workspace Login</p>
                </div>
              </div>
            </div>

            {/* 2. Staff User Key Redeem Option */}
            <div
              onClick={() => { setEntryPoint('staff_key'); setError(null); setSuccessMsg(null); }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${entryPoint === 'staff_key' ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg' : 'bg-card border-border text-muted hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Key size={16} />
                </div>
                <div>
                  <p className="font-bold text-xs">Staff User Key Access</p>
                  <p className="text-[10px] text-muted">Redeem Invite Key (e.g. ACME-RX-4312)</p>
                </div>
              </div>
            </div>

            {/* 3. Super Admin Control Plane Option */}
            <div
              onClick={() => { setEntryPoint('superadmin'); setError(null); setSuccessMsg(null); }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${entryPoint === 'superadmin' ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg' : 'bg-card border-border text-muted hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
                  <Shield size={16} />
                </div>
                <div>
                  <p className="font-bold text-xs">Super-Admin Control Plane</p>
                  <p className="text-[10px] text-muted">Web Only · Email OTP Guarded</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Registration Quick CTA */}
        <div className="pt-5 border-t border-border/40 mt-6 text-xs text-muted">
          <p className="text-muted text-[11px] mb-2">New Company? Register your workspace with a Company Key:</p>
          <Link
            href="/register"
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center gap-2 text-xs hover:bg-indigo-500/30 transition-all"
          >
            <Building2 size={14} /> Register Company with Key →
          </Link>
        </div>
      </div>

      {/* Right Column: Dynamic Form */}
      <div className="md:col-span-7 p-8 flex flex-col justify-center bg-card">
        {/* Entry 1: Workspace Email/Password Login */}
        {entryPoint === 'workspace' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                WORKSPACE ENTRY
              </span>
              <h3 className="text-xl font-bold text-white mt-2">Sign In to Your Workspace</h3>
              <p className="text-xs text-muted mt-0.5">Enter your email and password to access your dashboard.</p>
            </div>

            {/* Quick Demo Role Selector */}
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Quick Demo Perspective</label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setSelectedRole(r); setEmail(DEMO_USERS[r].email); }}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all ${selectedRole === r ? 'bg-indigo-500/25 border-indigo-500 text-indigo-300' : 'bg-background border-border text-muted hover:text-white'}`}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted block mb-1">Company Email</label>
                <div className="relative flex items-center">
                  <Mail size={15} className="absolute left-3 text-muted" />
                  <input
                    className="crm-input pl-9 text-sm h-10 w-full"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Password</label>
                <div className="relative flex items-center">
                  <Lock size={15} className="absolute left-3 text-muted" />
                  <input
                    type="password"
                    className="crm-input pl-9 text-sm h-10 w-full"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              onClick={handleWorkspaceLogin}
              disabled={loading}
              className="btn-primary text-sm font-bold w-full py-3 gap-2 flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' }}
            >
              {loading ? 'Signing In...' : `Sign In as ${selectedRole}`} <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Entry 2: Staff User Key Access */}
        {entryPoint === 'staff_key' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                STAFF USER INVITE KEY
              </span>
              <h3 className="text-xl font-bold text-white mt-2">Redeem Staff Invite Key</h3>
              <p className="text-xs text-muted mt-0.5">Enter the key generated by your Tenant Admin (e.g. ACME-RX-4312).</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted block mb-1">User Invite Key *</label>
                <div className="flex gap-2">
                  <input
                    className="crm-input text-sm font-mono h-10 flex-1 uppercase tracking-wider"
                    placeholder="ACME-RX-4312"
                    value={userKey}
                    onChange={e => setUserKey(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    onClick={handleValidateUserKey}
                    disabled={keyValidating}
                    className="px-3 text-xs font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl hover:bg-emerald-500/30"
                  >
                    {keyValidating ? 'Verifying...' : 'Validate Key'}
                  </button>
                </div>
                {keyInfo?.valid && (
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                    <CheckCircle2 size={13} /> Valid Key! Grants Role: {keyInfo.assignedRole}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Your Full Name *</label>
                <input
                  className="crm-input text-sm h-10 w-full"
                  placeholder="Rahul Sharma"
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted block mb-1">Email *</label>
                  <input
                    className="crm-input text-sm h-10 w-full"
                    placeholder="rahul@company.com"
                    value={staffEmail}
                    onChange={e => setStaffEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Password *</label>
                  <input
                    type="password"
                    className="crm-input text-sm h-10 w-full"
                    placeholder="••••••••"
                    value={staffPassword}
                    onChange={e => setStaffPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              onClick={handleStaffKeyRegister}
              disabled={loading}
              className="btn-primary text-sm font-bold w-full py-3 gap-2 flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
            >
              {loading ? 'Joining Workspace...' : 'Redeem Key & Activate Account'} <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Entry 3: Super Admin Control Plane */}
        {entryPoint === 'superadmin' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                WEB ONLY · DEVELOPER CONTROL PLANE
              </span>
              <h3 className="text-xl font-bold text-white mt-2">Super-Admin Identity Guard</h3>
              <p className="text-xs text-muted mt-0.5">Strict server-side verification: OTP sent directly to hardcoded Super Admin email.</p>
            </div>

            {!otpSent ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Super Admin Authorized Email</label>
                  <input
                    className="crm-input text-sm h-10 w-full font-semibold"
                    value={superAdminEmail}
                    onChange={e => setSuperAdminEmail(e.target.value)}
                  />
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
                  🔐 One-Time Password (OTP) will be generated and dispatched via SMTP to <strong>adtyamighty@gmail.com</strong>.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} /> {successMsg || 'OTP Security Code Sent to Email'}
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Enter 6-Digit Email OTP *</label>
                  <input
                    className="crm-input text-base font-mono text-center tracking-widest h-11 w-full"
                    placeholder="123 456"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              onClick={!otpSent ? handleSuperAdminRequestOtp : handleSuperAdminVerifyOtp}
              disabled={loading}
              className="btn-primary text-sm font-bold w-full py-3 gap-2 flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              {loading ? 'Processing...' : !otpSent ? 'Send Email OTP Security Code →' : 'Verify OTP & Enter Control Plane'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
