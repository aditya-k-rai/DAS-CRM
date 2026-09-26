'use client';

import { Topbar } from '@/components/layout/Topbar';
import { CreditCard, Check, Zap, Building2, Users, User, Shield, Info } from 'lucide-react';
import Link from 'next/link';
import { useAuth, getPlanSeatQuota, formatPlanName, normalizeRoleStr } from '@/context/AuthContext';

const PLANS = [
  {
    name: 'Grow',
    price: '₹999',
    period: '/month',
    users: '6 Users Quota',
    features: ['Core CRM & Pipeline', 'Mobile App (Android & iOS)', 'Task & Activity Tracking', 'No WhatsApp Cloud', 'No Email Marketing', 'Self-Upgrade Disabled'],
    badge: 'Starter',
    upgradeDisabled: true,
  },
  {
    name: 'Business',
    price: '₹2,499',
    period: '/month',
    users: '18 Users Quota',
    features: ['All Grow Features', 'Email Marketing (5K / mo)', 'WhatsApp Cloud (20K Quota)', 'AI Lead Scoring Engine', 'Advanced Reports & Pipeline'],
    badge: 'Popular',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '₹6,999',
    period: '/month',
    users: '60 Users Quota',
    features: ['All Business Features', 'Unlimited Email Marketing', 'Unlimited WhatsApp Cloud', 'Enterprise Custom AI Engine', 'Priority SLA & Dedicated Support'],
    badge: 'Enterprise',
  },
];

export default function BillingPage() {
  const { currentUser, subscription } = useAuth();
  const normalizedRole = normalizeRoleStr(currentUser?.role);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(normalizedRole);
  const planName = formatPlanName(subscription?.planType);
  const seats = subscription?.userSeatsAllocated || getPlanSeatQuota(subscription?.planType);

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-background">
        <Topbar title="Subscription & Billing" />
        <main className="flex-1 p-6 flex items-center justify-center min-h-[70vh]">
          <div className="crm-card p-8 text-center max-w-md w-full space-y-5 border border-rose-500/30 bg-rose-500/5 shadow-2xl rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30 shadow-lg">
              <Shield size={32} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Admin Dashboard Only
              </span>
              <h2 className="text-xl font-extrabold text-white mt-3">Access Restricted</h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Billing and subscription settings are restricted exclusively to Workspace Administrators.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/leads"
                className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                ← Return to My Workspace
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Subscription & Billing" />
      <main className="flex-1 p-6 overflow-auto grid grid-cols-12 gap-6">
        {/* Settings Sub-nav */}
        <div className="col-span-12 lg:col-span-3">
          <div className="crm-card p-2 space-y-1">
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <Building2 size={16} /> Organization Profile
            </Link>
            <Link href="/settings/team" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <Users size={16} /> Team & Members
            </Link>
            <Link href="/settings/billing" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-brand/10 text-white border-l-2 border-brand">
              <CreditCard size={16} /> Subscription & Billing
            </Link>
            <Link href="/settings/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <User size={16} /> My Account Profile
            </Link>
            <Link href="/about" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-muted/50 transition-all">
              <Info size={16} /> About & Developer
            </Link>
          </div>
        </div>

        {/* Billing Plans */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="crm-card p-4 flex items-center justify-between" style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300">CURRENT PLAN</span>
                <h3 className="font-bold text-lg">{planName}</h3>
              </div>
              <p className="text-xs text-muted mt-1">{seats} Active User Seats · Renews on Sep 1, 2026</p>
            </div>
            <button className="btn-secondary text-sm">Manage Invoices</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`crm-card flex flex-col justify-between p-4 relative ${plan.highlight ? 'border-brand shadow-lg shadow-brand/10' : ''}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand text-white">
                    RECOMMENDED
                  </span>
                )}
                <div>
                  <span className="text-xs text-muted font-medium uppercase tracking-wider">{plan.badge}</span>
                  <h4 className="text-lg font-bold mt-1">{plan.name}</h4>
                  <div className="flex items-baseline gap-1 my-3">
                    <span className="text-2xl font-extrabold">{plan.price}</span>
                    <span className="text-xs text-muted">{plan.period}</span>
                  </div>
                  <p className="text-xs font-semibold text-brand mb-3">{plan.users}</p>

                  <ul className="space-y-2 text-xs text-muted mb-4 border-t pt-3" style={{ borderColor: 'rgb(var(--border))' }}>
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-400 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={plan.upgradeDisabled}
                  className={`w-full text-xs py-2 rounded-lg font-semibold transition-all ${
                    plan.highlight
                      ? 'btn-primary'
                      : plan.upgradeDisabled
                      ? 'bg-muted/40 border border-border text-muted cursor-not-allowed'
                      : 'btn-secondary'
                  }`}
                >
                  {plan.highlight ? 'Active Plan' : plan.upgradeDisabled ? 'Upgrade Not Available' : 'Upgrade Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
