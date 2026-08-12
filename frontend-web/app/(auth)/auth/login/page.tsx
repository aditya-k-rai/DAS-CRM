'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 mb-8 lg:hidden">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <span className="font-bold text-lg">NexCRM</span>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
        <p style={{ color: 'rgb(var(--muted-foreground))' }}>Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Email address</label>
          <input
            id="email"
            type="email"
            className="crm-input"
            placeholder="john@company.com"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Password</label>
            <Link href="/auth/forgot-password" className="text-xs" style={{ color: 'rgb(var(--brand-400))' }}>
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={show ? 'text' : 'password'}
              className="crm-input pr-10"
              placeholder="••••••••"
              required
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--muted-foreground))' }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input id="remember" type="checkbox" className="rounded" />
          <label htmlFor="remember" className="text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>Remember me for 30 days</label>
        </div>

        <button type="submit" className="btn-primary w-full mt-2 h-11 text-base" disabled={loading}>
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Signing in...</>
          ) : (
            <>Sign In <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="divider" />
        <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 px-3 text-xs" style={{ background: 'rgb(var(--background))', color: 'rgb(var(--muted-foreground))' }}>
          or
        </span>
      </div>

      <p className="text-center text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
        Don't have an account?{' '}
        <Link href="/auth/register" className="font-semibold" style={{ color: 'rgb(var(--brand-400))' }}>
          Create one free →
        </Link>
      </p>
    </div>
  );
}
