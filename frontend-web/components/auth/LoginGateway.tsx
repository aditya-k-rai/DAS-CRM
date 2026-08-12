'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Key, Lock, Mail, Building2, UserCheck, ArrowRight,
  Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff, Smartphone, Laptop
} from 'lucide-react';
import { useAuth, UserRole, DEMO_USERS } from '@/context/AuthContext';

export function LoginGateway() {
  const [entryPoint, setEntryPoint]   = useState<'workspace' | 'superadmin'>('workspace');
  const [email, setEmail]             = useState('john@acme.com');
  const [password, setPassword]       = useState('••••••••••••');
  const [mfaCode, setMfaCode]         = useState('');
  const [totpSent, setTotpSent]       = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const router                        = useRouter();
  const { switchRole }                = useAuth();

  const handleWorkspaceLogin = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      switchRole(selectedRole);
      setLoading(false);
      router.push('/dashboard');
    }, 1000);
  };

  const handleSuperAdminLogin = () => {
    if (!totpSent) {
      setTotpSent(true);
      return;
    }
    if (mfaCode.length < 6) {
      setError('Please enter a valid 6-digit TOTP / MFA security code.');
      return;
    }
    setLoading(true);
    setError(null);
    setTimeout(() => {
      switchRole('SUPER_ADMIN');
      setLoading(false);
      router.push('/admin/super');
    }, 1000);
  };

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl border overflow-hidden shadow-2xl" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
      {/* Left Column: Branding & Entry Selector */}
      <div className="md:col-span-5 p-8 flex flex-col justify-between relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))' }}>
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-lg shadow-xl" style={{ background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' }}>
              N
            </div>
            <div>
              <span className="text-white font-bold text-lg">NexCRM Platform</span>
              <p className="text-xs text-muted">Dual Access Security Gateway</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Select Login Entry Point</h2>
          <p className="text-xs text-muted mb-6 leading-relaxed">
            Choose your login plane based on your user role & security authorization level.
          </p>

          <div className="space-y-3">
            {/* Workspace Entry Option */}
            <div
              onClick={() => { setEntryPoint('workspace'); setError(null); }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${entryPoint === 'workspace' ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg' : 'bg-card border-border text-muted hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Laptop size={16} />
                </div>
                <div>
                  <p className="font-bold text-xs">Multi-Tenant Workspace</p>
                  <p className="text-[10px] text-muted">Company Admin, HR, Manager, Employee, Viewer</p>
                </div>
              </div>
            </div>

            {/* Super Admin Control Plane Option */}
            <div
              onClick={() => { setEntryPoint('superadmin'); setError(null); }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${entryPoint === 'superadmin' ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg' : 'bg-card border-border text-muted hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
                  <Shield size={16} />
                </div>
                <div>
                  <p className="font-bold text-xs">Super-Admin Control Plane</p>
                  <p className="text-[10px] text-muted">Developer Portal (Web Only · MFA TOTP Secured)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border/40 mt-6 text-[11px] text-muted">
          <p className="font-semibold text-white">Zero-Trust Security Architecture</p>
          <p className="text-[10px] mt-0.5">Hardware Security Keys (FIDO2) & Encrypted JWT Auth Tokens</p>
        </div>
      </div>

      {/* Right Column: Dynamic Form */}
      <div className="md:col-span-7 p-8 flex flex-col justify-center bg-card">
        {/* Workspace Login Form */}
        {entryPoint === 'workspace' && (
          <div className="space-y-5">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                COMPANY WORKSPACE ENTRY
              </span>
              <h3 className="text-xl font-bold text-white mt-2">Sign In to Your Company CRM</h3>
              <p className="text-xs text-muted mt-0.5">Enter your email credentials or pick a demo role to test instant RBAC access.</p>
            </div>

            {/* Role Demo Quick Selector */}
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Select Role Perspective</label>
              <div className="grid grid-cols-3 gap-2">
                {(['ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setSelectedRole(r); setEmail(DEMO_USERS[r].email); }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${selectedRole === r ? 'bg-indigo-500/25 border-indigo-500 text-indigo-300 shadow-md' : 'bg-background border-border text-muted hover:text-white'}`}
                  >
                    {r}
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
              {loading ? 'Authenticating Workspace...' : `Sign In as ${selectedRole}`} <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Super-Admin Developer Control Plane Form */}
        {entryPoint === 'superadmin' && (
          <div className="space-y-5">
            <div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                WEB ONLY · DEVELOPER CONTROL PLANE
              </span>
              <h3 className="text-xl font-bold text-white mt-2">Super-Admin Platform Authentication</h3>
              <p className="text-xs text-muted mt-0.5">High-security portal for Developer & Platform Administrator.</p>
            </div>

            {!totpSent ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
                  🔒 Zero-Trust Enforcement: Hardware Security Key (FIDO2) or TOTP MFA Code required.
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Developer Admin Email</label>
                  <input className="crm-input text-sm h-10 w-full font-semibold" value="admin@platform.com" readOnly />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} /> MFA Challenge Sent: Check your Authenticator App (TOTP).
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Enter 6-Digit MFA / TOTP Security Code *</label>
                  <input
                    className="crm-input text-base font-mono text-center tracking-widest h-11 w-full"
                    placeholder="123 456"
                    maxLength={6}
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value)}
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
              onClick={handleSuperAdminLogin}
              disabled={loading}
              className="btn-primary text-sm font-bold w-full py-3 gap-2 flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              {loading ? 'Verifying MFA Token...' : !totpSent ? 'Request MFA Challenge →' : 'Verify & Enter Control Plane'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
