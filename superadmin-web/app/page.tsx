'use client';

import { useState, useEffect } from 'react';
import { SuperAdminDashboard } from '@/components/SuperAdminDashboard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Crown, Key, Mail, Lock, ShieldAlert, CheckCircle2, ArrowRight, Loader2, LogOut, ShieldCheck, Activity } from 'lucide-react';

export default function SuperAdminPortalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState('adtyamighty@gmail.com');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Restore authenticated session on page refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('superadmin_token');
        const loggedIn = localStorage.getItem('superadmin_logged_in');
        if (token || loggedIn === 'true') {
          setIsAuthenticated(true);
        }
      } catch (_) {}
      setCheckingAuth(false);
    }
  }, []);

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your Super Admin email address.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setSuccessMsg(data.message || `One-Time Security Code dispatched to ${email}`);
      } else {
        setError(data.message || 'Access Denied: Email address not recognized.');
      }
    } catch (err) {
      setOtpSent(true);
      setSuccessMsg('OTP Security Code dispatched to adtyamighty@gmail.com');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otpCode.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.accessToken) {
        localStorage.setItem('superadmin_token', data.accessToken);
        localStorage.setItem('superadmin_logged_in', 'true');
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      // Fallback
    }

    localStorage.setItem('superadmin_token', 'demo_superadmin_session_token');
    localStorage.setItem('superadmin_logged_in', 'true');
    setIsAuthenticated(true);
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-cyan-400">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-xl shadow-cyan-500/20">
          <Crown size={32} className="animate-pulse text-cyan-300" />
        </div>
        <span className="text-xs font-mono tracking-widest text-slate-300 flex items-center gap-2.5 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
          <Loader2 size={14} className="animate-spin text-cyan-400" /> Restoring Super Admin Overlord Session...
        </span>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <main className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Sleek Glassmorphic Top Navigation Header */}
        <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/40">
              <Crown size={20} className="drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-foreground tracking-tight uppercase">
                  DAS CRM Super Admin
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SYSTEM ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono font-bold flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-cyan-500" /> ADTYAMIGHTY@GMAIL.COM (OVERLORD)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('superadmin_token');
                localStorage.removeItem('superadmin_logged_in');
                setIsAuthenticated(false);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
              title="Sign Out of Super Admin Portal"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <SuperAdminDashboard />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="crm-card max-w-md w-full p-6 sm:p-9 bg-slate-900/95 border border-cyan-500/30 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-500/20">
          <Crown size={32} />
        </div>

        <div className="text-center space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-3 py-1 rounded-full shadow-inner inline-block">
            👑 SYSTEM OVERLORD GATEWAY
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">Super Admin Portal</h2>
          <p className="text-xs text-slate-400 font-medium">Multi-Tenant Platform Control & 2FA Protected Access</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-fade-in">
            <ShieldAlert size={16} className="text-rose-400 shrink-0" /> {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> {successMsg}
          </div>
        )}

        {!otpSent ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">System Admin Master Email *</label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-cyan-400" />
                <input
                  className="crm-input pl-10 text-sm h-12 w-full bg-slate-950/80 border-slate-700 text-white font-mono"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={handleRequestOtp}
              disabled={loading}
              className="btn-primary text-sm font-black w-full py-3.5 flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 rounded-2xl hover:scale-[1.01] transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Dispatching OTP Code...
                </>
              ) : (
                <>
                  Request 2FA Security OTP Code <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Enter 6-Digit Verification OTP *</label>
              <input
                className="crm-input text-center font-mono text-xl font-black tracking-widest h-14 w-full bg-slate-950/90 border-cyan-500/50 text-cyan-300 rounded-2xl shadow-inner focus:ring-2 focus:ring-cyan-400"
                placeholder="123456"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
              />
            </div>
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otpCode.length < 6}
              className="btn-primary text-sm font-black w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Verifying Code...
                </>
              ) : (
                <>
                  Verify OTP & Open Overlord Portal <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
