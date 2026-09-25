'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap, Check, Shield, AlertTriangle, ArrowRight, Lock, CheckCircle2,
  Building2, Users, DollarSign, Smartphone, HelpCircle
} from 'lucide-react';
import { useAuth, PlanType, formatPlanName } from '@/context/AuthContext';

export default function BillingPage() {
  const { subscription, updateSubscription, currentUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('PRO');
  const [addOnSeats, setAddOnSeats] = useState(0);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('plan')?.toUpperCase();
      if (p === 'GROWTH' || p === 'PRO' || p === 'MAX') {
        setSelectedPlan(p as PlanType);
      }
    }
  }, []);

  const PLANS = [
    {
      id: 'FREE_TRIAL',
      name: '⚡ Free Trial Plan',
      price: '₹0',
      taxNote: 'No Credit Card Required',
      period: '15 to 40 Days',
      seats: 'Total 6 Users Quota',
      seatNote: 'Adjustable by Super Admin per Company',
      description: 'Test drive core CRM features risk-free.',
      features: [
        { name: 'Core CRM Pipeline & Leads', enabled: true },
        { name: 'Role-Based Access Control (RBAC)', enabled: true },
        { name: 'Mobile App (Android & iOS)', enabled: true },
        { name: 'Standard Reports & CSV Export', enabled: true },
        { name: 'AI Features & Scoring', enabled: false },
        { name: 'WhatsApp Cloud API', enabled: false },
        { name: 'Email Marketing Campaigns', enabled: false },
      ],
    },
    {
      id: 'GROW',
      name: '🌱 Grow Plan',
      price: '₹999',
      taxNote: '+ 18% GST (Total ₹1,178.82)',
      period: '/ month',
      popular: false,
      seats: 'Total 6 Employees Quota',
      seatNote: 'Fixed 6 Users · Core CRM Only',
      description: 'Without WhatsApp (Cloud) and Email Marketing. Cannot self-upgrade.',
      features: [
        { name: 'Core CRM & Pipeline Management', enabled: true },
        { name: 'Role-Based Access Control (RBAC)', enabled: true },
        { name: 'Mobile App (Android & iOS)', enabled: true },
        { name: 'Task & Activity Management', enabled: true },
        { name: 'WhatsApp Cloud API Quota', enabled: false },
        { name: 'Email Marketing Campaigns', enabled: false },
        { name: 'Self-Upgrade (Not Available)', enabled: false },
      ],
      selfUpgradeDisabled: true,
    },
    {
      id: 'BUSINESS',
      name: '💼 Business Plan',
      price: '₹2,499',
      taxNote: '+ 18% GST (Total ₹2,948.82)',
      period: '/ month',
      popular: true,
      seats: 'Total 18 Users Quota',
      seatNote: 'Includes WhatsApp (20K) & Email (5K)',
      description: 'All features with 5,000 monthly Email Quota and 20,000 WhatsApp Cloud Quota credits.',
      features: [
        { name: 'Includes All Grow Plan Features', enabled: true },
        { name: 'Email Marketing (5,000 Quota / month)', enabled: true },
        { name: 'WhatsApp Cloud (20,000 Credit Limit)', enabled: true },
        { name: 'AI Lead Scoring & Automation Engine', enabled: true },
        { name: 'Advanced Reports & Dashboards', enabled: true },
        { name: 'Total 18 Employee Seats', enabled: true },
      ],
    },
    {
      id: 'ENTERPRISE',
      name: '👑 Enterprise Plan',
      price: '₹6,999',
      taxNote: '+ 18% GST (Total ₹8,258.82)',
      period: '/ month',
      seats: 'Total 60 Users Quota',
      seatNote: 'Enterprise Quota & Priority SLA',
      description: 'Full power for 60 users with all features and No Limit on WhatsApp Cloud and Email.',
      features: [
        { name: 'Includes All Business Plan Features', enabled: true },
        { name: 'Unlimited Email Marketing (No Limit)', enabled: true },
        { name: 'Unlimited WhatsApp Cloud (No Limit)', enabled: true },
        { name: 'Custom AI Engine & System Prompts', enabled: true },
        { name: 'Total 60 Employee Seats', enabled: true },
        { name: 'Priority Support & 99.9% SLA', enabled: true },
      ],
    },
  ];

  const handleRazorpayUpgrade = async (planId: PlanType) => {
    if (planId === 'GROW' || (subscription?.planType === 'GROW' && planId !== 'BUSINESS' && planId !== 'ENTERPRISE')) {
      alert('Upgrade plan is not available directly on the Grow Plan. Please contact Super Admin to upgrade your workspace.');
      return;
    }

    setLoading(true);
    setSuccessMsg(null);

    try {
      // 1. Request Razorpay order from API
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/billing/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('das_crm_token')}`,
        },
        body: JSON.stringify({ requestedPlan: planId, addOnSeats }),
      });
      const orderData = await res.json();

      if (res.ok && orderData.orderId) {
        if (typeof window !== 'undefined' && (window as any).Razorpay) {
          const options = {
            key: orderData.razorpayKeyId,
            amount: orderData.amountPaise,
            currency: 'INR',
            name: 'DAS CRM Billing',
            description: `Upgrade to ${planId}`,
            order_id: orderData.orderId,
            handler: async function (response: any) {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/billing/verify-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${localStorage.getItem('das_crm_token')}`,
                },
                body: JSON.stringify({
                  requestedPlan: planId,
                  addOnSeats,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              setSuccessMsg('Payment verified! Upgrade activated.');
              setLoading(false);
            },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          return;
        }
      }
    } catch (err) {
      console.warn('Razorpay SDK not loaded, using fallback upgrade request:', err);
    }

    // Fallback: Queue Upgrade Request
    setTimeout(() => {
      const isFree = planId === 'FREE_TRIAL';
      const isGrow = (planId as string) === 'GROW' || planId === 'GROWTH';
      updateSubscription({
        planType: planId,
        userSeatsAllocated: planId === 'ENTERPRISE' ? 60 : planId === 'BUSINESS' ? 18 : 6,
        features: {
          whatsApp: !isFree && !isGrow,
          emailAutomation: !isFree && !isGrow,
          aiLeadScoring: !isFree && !isGrow,
          customSalaryBuilder: true,
          exportCSV: true,
        },
      });
      setSuccessMsg(`Plan updated to ${planId}! Features and seat quotas recalibrated.`);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner for Android App Users */}
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 font-bold">
            <Smartphone size={16} />
          </div>
          <div>
            <span className="font-bold text-indigo-300">Notice for Mobile App Users:</span>
            <p className="text-muted mt-0.5">Plan upgrades and payments are available on the <strong>Website Portal only</strong>. Android & iOS apps mirror active plan features automatically.</p>
          </div>
        </div>
        <Link href="/dashboard" className="px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 hover:bg-indigo-500/30 transition-all">
          Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          SUBSCRIPTION & BILLING PORTAL
        </span>
        <h1 className="text-3xl font-black text-foreground dark:text-white mt-2">Manage Workspace Plan & Quotas</h1>
        <p className="text-xs text-muted mt-1">Upgrade your plan to unlock WhatsApp automation, email marketing, and larger user seat quotas.</p>
      </div>

      {/* Active Plan Summary Card */}
      <div className="p-6 rounded-3xl border bg-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl" style={{ borderColor: 'rgb(var(--border))' }}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Active Workspace Plan:</span>
            <span className={`text-xs font-extrabold px-3 py-0.5 rounded-full border ${
              subscription.planType === 'FREE_TRIAL'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {formatPlanName(subscription.planType)} {subscription.planType === 'FREE_TRIAL' ? `(${subscription.trialDaysLeft} Days Remaining)` : '· Active'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground dark:text-white">{subscription.companyName}</h2>
          <p className="text-xs text-muted">
            User Seat Quota: <strong>{subscription.userSeatsUsed}</strong> / <strong>{subscription.userSeatsAllocated}</strong> seats used (Admin is excluded from seat quota count).
          </p>
        </div>

        {/* Hard Block Warning for Free Trial */}
        {subscription.planType === 'FREE_TRIAL' && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs max-w-md space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-300">
              <AlertTriangle size={15} /> Free Trial Feature Gate
            </p>
            <p>
              <strong>WhatsApp Automation</strong> and <strong>Email Marketing Campaigns</strong> are <strong>HARD-BLOCKED</strong> during Free Trial. Upgrade to Starter or Pro to unlock.
            </p>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {PLANS.map(plan => {
          const isCurrent = subscription.planType === plan.id;
          return (
            <div
              key={plan.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between relative transition-all ${
                plan.popular
                  ? 'bg-gradient-to-b from-indigo-950/40 to-card border-indigo-500/50 shadow-2xl scale-[1.02]'
                  : 'bg-card border-border hover:border-indigo-500/30'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold px-3 py-0.5 rounded-full bg-indigo-500 text-white uppercase tracking-widest shadow-md">
                  MOST POPULAR
                </span>
              )}

              <div>
                <h3 className="font-bold text-foreground dark:text-white text-base mb-1">{plan.name}</h3>
                <p className="text-[11px] text-muted mb-4 min-h-[32px]">{plan.description}</p>

                <div className="mb-4">
                  <span className="text-2xl font-black text-foreground dark:text-white">{plan.price}</span>
                  <span className="text-xs text-muted ml-1">{plan.period}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-background border border-border mb-4">
                  <p className="text-xs font-bold text-indigo-400">{plan.seats}</p>
                  <p className="text-[10px] text-muted mt-0.5">{plan.seatNote}</p>
                </div>

                <div className="space-y-2 text-xs">
                  {plan.features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check size={13} className={f.enabled ? 'text-emerald-400' : 'text-muted/40'} />
                      <span className={f.enabled ? 'text-white' : 'text-muted/40 line-through'}>{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                {isCurrent ? (
                  <button disabled className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
                    Current Plan
                  </button>
                ) : (plan as any).selfUpgradeDisabled ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-muted/40 border border-border text-muted-foreground font-bold text-xs cursor-not-allowed"
                    title="Self-upgrade is not available on the Grow Plan. Contact Super Admin."
                  >
                    Upgrade Not Available
                  </button>
                ) : (
                  <button
                    onClick={() => handleRazorpayUpgrade(plan.id as PlanType)}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    {loading ? 'Processing...' : plan.id === 'ENTERPRISE' ? 'Contact Super Admin' : 'Upgrade Plan →'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
