import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { CreditCard, Check, Zap, Building2, Users, User, Shield } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Subscription & Billing | NexCRM' };

const PLANS = [
  { name: 'Basic', price: '₹1,999', period: '/month', users: '5 Users included', features: ['Core Lead Management', 'Basic Reports', 'Web CRM Access', 'Standard Support'], badge: 'Starter' },
  { name: 'Pro', price: '₹4,999', period: '/month', users: '15 Users included', features: ['All Basic Features', 'WatermelonDB Android App', 'Deals Kanban & Custom Pipelines', 'HR Portal (Attendance & Salary)'], badge: 'Popular', highlight: true },
  { name: 'Pro 50', price: '₹12,499', period: '/month', users: '50 Users included', features: ['All Pro Features', 'Automations Engine', 'Advanced Lead Scoring', 'Dedicated Account Manager'], badge: 'Growth' },
  { name: 'Pro Max', price: '₹24,999', period: '/month', users: 'Unlimited Users', features: ['All Pro 50 Features', 'Custom AI Scoring & Analytics', '99.9% SLA Guarantee', 'Custom API & Webhooks Integration'], badge: 'Enterprise' },
];

export default function BillingPage() {
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
          </div>
        </div>

        {/* Billing Plans */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="crm-card p-4 flex items-center justify-between" style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300">CURRENT PLAN</span>
                <h3 className="font-bold text-lg">Pro Plan</h3>
              </div>
              <p className="text-xs text-muted mt-1">15 Active User Seats · Renews on Sep 1, 2026</p>
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

                <button className={`w-full text-xs py-2 rounded-lg font-semibold transition-all ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}>
                  {plan.highlight ? 'Active Plan' : 'Upgrade Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
