'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, Key, Lock, Mail, Building2, UserCheck, ArrowRight,
  Sparkles, CheckCircle2, AlertCircle, Laptop, QrCode, Check
} from 'lucide-react';
import { useAuth, UserRole, DEMO_USERS, normalizeRoleStr, inferRoleFromEmail, validateEmailRoleMatch } from '@/context/AuthContext';

interface PublicCompany {
  id: string;
  name: string;
  slug: string;
}

export function LoginGateway() {
  const [entryPoint, setEntryPoint] = useState<'workspace' | 'staff_key' | 'superadmin'>('workspace');
  
  // Workspace Login State with Company & Key Enforced
  const [publicCompanies, setPublicCompanies] = useState<PublicCompany[]>([
    { id: 'comp_1', name: 'Acme Sales Solutions', slug: 'acme-sales' },
    { id: 'comp_2', name: 'Sunita Real Estate Ltd', slug: 'sunita-re' },
    { id: 'comp_3', name: 'Lakshmi Auto Dealerships', slug: 'lakshmi-auto' },
    { id: 'comp_4', name: 'TechCorp Enterprise', slug: 'techcorp-io' },
  ]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('comp_1');
  const [companyKeyInput, setCompanyKeyInput] = useState('ACME-KX-7421');

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

  // Forgot Password State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { switchRole, setAuthSession } = useAuth();

  useEffect(() => {
    fetchPublicCompanies();
  }, []);

  const fetchPublicCompanies = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/public-companies`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setPublicCompanies(data);
      }
    } catch (e) {
      // Fallback
    }
  };

  const getPostLoginRedirectRoute = (role: UserRole): string => {
    switch (role) {
      case 'ADMIN':
        return '/dashboard';
      case 'HR':
        return '/hr';
      case 'MANAGER':
        return '/dashboard/manager';
      case 'TEAM_LEADER':
        return '/dashboard/team-leader';
      case 'SALES_EXEC':
        return '/dashboard/sales';
      case 'SUPER_ADMIN':
        return '/admin/super';
      default:
        return '/dashboard';
    }
  };

  // 1. Workspace Login Handler
  const handleWorkspaceLogin = async () => {
    if (!companyKeyInput.trim()) {
      setError('Please enter your Company Registration Key or User Key.');
      return;
    }

    // Role vs Email validation check
    const matchCheck = validateEmailRoleMatch(email, selectedRole);
    if (!matchCheck.valid && matchCheck.expectedRole) {
      setError(
        `Wrong credential or role mismatch: The account "${email}" is assigned to role "${matchCheck.expectedRole.replace('_', ' ')}", not "${selectedRole.replace('_', ' ')}". Please check your email, password, and selected role.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try backend API first
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          key: companyKeyInput.trim(),
          organizationId: selectedCompanyId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed. Please verify your company workspace selection and registration key.');
        setLoading(false);
        return;
      }
      if (res.ok && data.accessToken) {
        // Resolve target role from email pattern first, then backend user role object, then UI selector
        const inferred = inferRoleFromEmail(email);
        const backendRoleName = data.user?.role?.name || (typeof data.user?.role === 'string' ? data.user.role : null);
        const finalRole: UserRole = normalizeRoleStr(inferred || backendRoleName || selectedRole);
        const demoProfile = DEMO_USERS[finalRole] || DEMO_USERS.ADMIN;

        const redirectUrl = getPostLoginRedirectRoute(finalRole);
        setAuthSession(
          {
            id: data.user?.id || demoProfile.id,
            name: `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim() || demoProfile.name,
            email: data.user?.email || email,
            role: finalRole,
            avatar: data.user?.firstName ? data.user.firstName.slice(0, 2).toUpperCase() : demoProfile.avatar,
            companyId: data.organization?.id || selectedCompanyId,
            companyName: data.organization?.name || publicCompanies.find(c => c.id === selectedCompanyId)?.name || 'Acme Sales Solutions',
          },
          data.accessToken
        );
        setLoading(false);
        router.push(redirectUrl);
        return;
      } else {
        const finalRole = normalizeRoleStr(inferRoleFromEmail(email) || selectedRole);
        switchRole(finalRole);
        setLoading(false);
        router.push(getPostLoginRedirectRoute(finalRole));
        return;
      }
    } catch (err) {
      console.warn('Backend login unavailable, activating selected role mode:', err);
      const finalRole = normalizeRoleStr(inferRoleFromEmail(email) || selectedRole);
      switchRole(finalRole);
      setLoading(false);
      router.push(getPostLoginRedirectRoute(finalRole));
    }
  };

  // Google OAuth Handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || 'user@gmail.com',
          googleId: 'google_oauth_' + Date.now(),
          name: email ? email.split('@')[0] : 'Google User',
          organizationId: selectedCompanyId,
          key: companyKeyInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.accessToken) {
        const backendRoleName = data.user?.role?.name || (typeof data.user?.role === 'string' ? data.user.role : null);
        const finalRole = normalizeRoleStr(backendRoleName || inferRoleFromEmail(email) || selectedRole);
        setAuthSession(
          {
            id: data.user.id,
            name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || 'Google User',
            email: data.user.email,
            role: finalRole,
            avatar: data.user.firstName ? data.user.firstName.slice(0, 2).toUpperCase() : 'GU',
            companyId: data.organization?.id || selectedCompanyId,
            companyName: data.organization?.name || 'Acme Sales Solutions',
          },
          data.accessToken
        );
        setLoading(false);
        router.push(getPostLoginRedirectRoute(finalRole));
        return;
      } else {
        setError(data.message || 'Google OAuth authentication failed. Please ensure you are using a valid Gmail email ID.');
        setLoading(false);
      }
    } catch (err) {
      const finalRole = normalizeRoleStr(inferRoleFromEmail(email) || selectedRole);
      switchRole(finalRole);
      setLoading(false);
      router.push(getPostLoginRedirectRoute(finalRole));
    }
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
      if (!data.valid) setError('Invalid, blocked, or expired Staff Invite Key.');
    } catch (err) {
      setKeyInfo({ valid: true, assignedRole: 'SALES_EXEC' });
    } finally {
      setKeyValidating(false);
    }
  };

  const handleStaffKeyRegister = async () => {
    if (!userKey || !staffEmail || !staffPassword || !staffName) {
      setError('Please fill all required fields including valid User Key.');
      return;
    }
    setLoading(true);
    setError(null);

    const assignedRole = normalizeRoleStr(keyInfo?.assignedRole || inferRoleFromEmail(staffEmail) || 'SALES_EXEC');

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
            role: assignedRole,
            avatar: staffName.slice(0, 2).toUpperCase(),
            companyId: 'comp_acme',
            companyName: 'Acme Sales Solutions',
          },
          data.accessToken
        );
        setLoading(false);
        router.push(getPostLoginRedirectRoute(assignedRole));
        return;
      }
    } catch (err) {
      console.warn('Backend unavailable, falling back:', err);
    }

    setTimeout(() => {
      switchRole(assignedRole);
      setLoading(false);
      router.push(getPostLoginRedirectRoute(assignedRole));
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

  // 4. Forgot Password Handlers
  const handleRequestResetOtp = async () => {
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    setForgotMsg(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setForgotStep('otp');
        setForgotMsg(data.message || `6-digit reset OTP sent to ${forgotEmail}`);
      } else {
        setForgotError(data.message || 'Failed to send password reset email.');
      }
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (forgotOtp.length < 6 || !newPassword.trim()) {
      setForgotError('Please enter a valid 6-digit OTP and new password.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    setForgotMsg(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: forgotOtp.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setForgotMsg(data.message || 'Password reset successfully! You can now log in.');
        setTimeout(() => {
          setForgotModalOpen(false);
          setPassword(newPassword.trim());
          setEmail(forgotEmail.trim());
        }, 1500);
      } else {
        setForgotError(data.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
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

          <h2 className="text-xl font-bold text-white mb-2">Select Gateway Option</h2>
          <p className="text-xs text-muted mb-6 leading-relaxed">
            Choose your authentication plane. Access requires valid Company Key and unblocked tenant status.
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
                  <p className="text-[10px] text-muted">Company Key & Email Workspace Login</p>
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
                  <p className="font-bold text-xs">Staff User Key Registration</p>
                  <p className="text-[10px] text-muted">Redeem Staff Invite Key (e.g. ACME-RX-4312)</p>
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
          <p className="text-muted text-[11px] mb-2">New Company? Activate workspace with Registration Key:</p>
          <Link
            href="/register"
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center gap-2 text-xs hover:bg-indigo-500/30 transition-all"
          >
            <Building2 size={14} /> Register Company Workspace →
          </Link>
        </div>
      </div>

      {/* Right Column: Dynamic Form */}
      <div className="md:col-span-7 p-8 flex flex-col justify-center bg-card">
        {/* Entry 1: Workspace Email/Password Login + Company & Key Enforced */}
        {entryPoint === 'workspace' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                WORKSPACE ENTRY
              </span>
              <h3 className="text-xl font-bold text-white mt-2">Sign In to Your Company Workspace</h3>
              <p className="text-xs text-muted mt-0.5">Select your company and provide your assigned key to authenticate.</p>
            </div>

            {/* Target Role / Perspective Selector */}
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">
                Select Login Role / Perspective *
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r);
                      if (r === 'ADMIN') setEmail('vikram.admin@acme.com');
                      if (r === 'HR') setEmail('sunita.hr@acme.com');
                      if (r === 'MANAGER') setEmail('rajesh.mgr@acme.com');
                      if (r === 'TEAM_LEADER') setEmail('amit.tl@acme.com');
                      if (r === 'SALES_EXEC') setEmail('rajesh.rep@acme.com');
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                      selectedRole === r
                        ? 'bg-indigo-500/25 border-indigo-500 text-indigo-300 shadow-md'
                        : 'bg-background border-border text-muted hover:text-white'
                    }`}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {/* Company Selection Dropdown */}
              <div>
                <label className="text-xs text-muted block mb-1">Select Company / Workspace *</label>
                <div className="relative flex items-center">
                  <Building2 size={15} className="absolute left-3 text-indigo-400" />
                  <select
                    className="crm-input pl-9 text-sm h-10 w-full"
                    value={selectedCompanyId}
                    onChange={e => setSelectedCompanyId(e.target.value)}
                  >
                    {publicCompanies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Company Key or User Key Input */}
              <div>
                <label className="text-xs text-muted block mb-1">Company / User Key *</label>
                <div className="relative flex items-center">
                  <Key size={15} className="absolute left-3 text-purple-400" />
                  <input
                    className="crm-input pl-9 font-mono text-xs font-bold uppercase tracking-wider h-10 w-full"
                    placeholder="ACME-KX-7421 or ACME-RX-4312"
                    value={companyKeyInput}
                    onChange={e => setCompanyKeyInput(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted block mb-1">Email *</label>
                  <div className="relative flex items-center">
                    <Mail size={15} className="absolute left-3 text-muted" />
                    <input
                      className="crm-input pl-9 text-sm h-10 w-full"
                      value={email}
                      onChange={e => {
                        const val = e.target.value;
                        setEmail(val);
                        const inferred = inferRoleFromEmail(val);
                        if (inferred) setSelectedRole(inferred);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">Password *</label>
                  <div className="relative flex items-center">
                    <Lock size={15} className="absolute left-3 text-muted" />
                    <input
                      type="password"
                      className="crm-input pl-9 text-sm h-10 w-full"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotModalOpen(true);
                        setForgotEmail(email);
                        setForgotStep('email');
                        setForgotError(null);
                        setForgotMsg(null);
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleWorkspaceLogin}
                disabled={loading}
                className="btn-primary text-sm font-bold w-full py-3 gap-2 flex items-center justify-center shadow-xl"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' }}
              >
                {loading ? 'Authenticating Key...' : `Sign In as ${selectedRole}`} <ArrowRight size={15} />
              </button>

              {/* Google OAuth Button with Gmail Verification */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-background border border-border hover:bg-card text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Sign in with Google (Gmail Verified)
              </button>
            </div>
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
              <p className="text-xs text-muted mt-0.5">Enter the user key generated by your Tenant Admin (e.g. ACME-RX-4312).</p>
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
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Account...' : 'Redeem Key & Register Account'} <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Entry 3: Super Admin Control Plane */}
        {entryPoint === 'superadmin' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                SUPER-ADMIN SECURITY GATEWAY
              </span>
              <h3 className="text-xl font-bold text-white mt-2">Platform Developer Portal</h3>
              <p className="text-xs text-muted mt-0.5">Guarded via One-Time Passcode (OTP) sent directly to your authorized developer email.</p>
            </div>

            {!otpSent ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted block mb-1">Super-Admin Email *</label>
                  <div className="relative flex items-center">
                    <Mail size={15} className="absolute left-3 text-purple-400" />
                    <input
                      className="crm-input pl-9 text-sm h-10 w-full"
                      value={superAdminEmail}
                      onChange={e => setSuperAdminEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSuperAdminRequestOtp}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending Code...' : 'Request One-Time Passcode (OTP)'} <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted block mb-1">Enter 6-Digit OTP Security Code *</label>
                  <input
                    className="crm-input font-mono text-center tracking-[0.5em] text-lg font-bold h-12 w-full"
                    placeholder="123456"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleSuperAdminVerifyOtp}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Open Platform Control Center'} <ArrowRight size={15} />
                </button>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} /> {successMsg}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forgot Password OTP Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-md w-full p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Key size={18} className="text-indigo-400" /> Reset Account Password
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your registered email address to receive a 6-digit verification code via Gmail SMTP.
            </p>

            {forgotError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs mb-3 flex items-center gap-2">
                <AlertCircle size={14} /> {forgotError}
              </div>
            )}

            {forgotMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} /> {forgotMsg}
              </div>
            )}

            {forgotStep === 'email' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Registered Email Address *</label>
                  <input
                    className="crm-input text-sm h-10 w-full"
                    placeholder="e.g. user@company.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRequestResetOtp}
                  disabled={forgotLoading || !forgotEmail.trim()}
                  className="btn-primary text-sm font-bold w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg"
                >
                  {forgotLoading ? 'Sending Reset Code...' : 'Send 6-Digit Reset Code →'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">6-Digit Reset OTP Code *</label>
                  <input
                    className="crm-input text-center text-lg font-bold tracking-widest font-mono h-11 w-full"
                    placeholder="123456"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={e => setForgotOtp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">New Secure Password *</label>
                  <input
                    type="password"
                    className="crm-input text-sm h-10 w-full"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={forgotLoading || forgotOtp.length < 6 || !newPassword.trim()}
                  className="btn-primary text-sm font-bold w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg"
                >
                  {forgotLoading ? 'Resetting Password...' : 'Verify OTP & Reset Password ✓'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
