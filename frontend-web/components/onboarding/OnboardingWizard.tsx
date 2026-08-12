'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Users, Target, Shield, Check, ArrowRight,
  Zap, Globe, DollarSign, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';

const INDUSTRY_TEMPLATES = [
  { id: 'real_estate', title: 'Real Estate & Properties', desc: 'Preconfigured for Site Visits, Broker Leads, Property Types, & Floor Plans.', icon: '🏢', color: '#6366f1' },
  { id: 'saas', title: 'SaaS & Tech Subscriptions', desc: 'Preconfigured for Trial Signups, Monthly Recurring Revenue (MRR), & Demo Calls.', icon: '💻', color: '#3b82f6' },
  { id: 'automobile', title: 'Automobile Dealerships', desc: 'Preconfigured for Test Drives, Vehicle Quotations, & Financing Leads.', icon: '🚗', color: '#8b5cf6' },
  { id: 'manufacturing', title: 'Manufacturing & B2B', desc: 'Preconfigured for Bulk Quotations, RFQs, Procurement Pipeline, & Specs.', icon: '🏭', color: '#f59e0b' },
  { id: 'services', title: 'Agency & Consulting Services', desc: 'Preconfigured for Retainers, Deliverable Milestones, & Project Quotes.', icon: '🤝', color: '#22c55e' },
];

export function OnboardingWizard() {
  const [step, setStep]           = useState<1 | 2 | 3 | 4>(1);
  const [orgName, setOrgName]     = useState('Acme Sales Solutions');
  const [template, setTemplate]   = useState('saas');
  const [currency, setCurrency]   = useState('INR');
  const [teamSize, setTeamSize]   = useState('10-50');
  const [invitedEmails, setInvited] = useState(['amit.shah@acme.com', 'priya.sharma@acme.com']);
  const [newEmail, setNewEmail]   = useState('');
  const [completing, setCompleting] = useState(false);
  const router = useRouter();

  const addInvite = () => {
    if (newEmail && !invitedEmails.includes(newEmail)) {
      setInvited([...invitedEmails, newEmail]);
      setNewEmail('');
    }
  };

  const finishSetup = () => {
    setCompleting(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="w-full max-w-3xl">
      {/* Header logo */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <span className="text-white font-extrabold text-2xl">N</span>
        </div>
        <h1 className="text-2xl font-bold">Set Up Your NexCRM Workspace</h1>
        <p className="text-sm text-muted mt-1">Customizing your sales CRM environment in under 2 minutes</p>
      </div>

      {/* Stepper bar */}
      <div className="crm-card p-4 mb-6">
        <div className="flex items-center justify-between">
          {[
            { s: 1, label: 'Organization' },
            { s: 2, label: 'Industry Template' },
            { s: 3, label: 'Team Members' },
            { s: 4, label: 'Ready' },
          ].map((item, i) => {
            const isActive = step === item.s;
            const isDone   = step > item.s;
            return (
              <div key={item.s} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: isDone ? 'rgba(34,197,94,0.2)' : isActive ? 'rgba(99,102,241,0.25)' : 'rgb(var(--muted))',
                      color: isDone ? 'rgb(34,197,94)' : isActive ? 'rgb(129,140,248)' : 'rgb(var(--muted-foreground))',
                      border: isActive ? '1px solid #6366f1' : '1px solid transparent',
                    }}
                  >
                    {isDone ? '✓' : item.s}
                  </div>
                  <span className={`text-xs font-semibold hidden md:inline ${isActive ? 'text-white' : 'text-muted'}`}>
                    {item.label}
                  </span>
                </div>
                {i < 3 && <ChevronRight size={14} className="text-muted flex-shrink-0 mx-auto" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Organization details */}
      {step === 1 && (
        <div className="crm-card space-y-5">
          <h2 className="text-lg font-bold">1. Organization Details</h2>

          <div>
            <label className="text-xs font-semibold text-muted block mb-1.5">Organization / Company Name</label>
            <input
              className="crm-input text-sm w-full"
              placeholder="e.g. Acme Corporation"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted block mb-1.5">Primary Currency</label>
              <select className="crm-input text-sm w-full" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="INR">₹ INR (Indian Rupee)</option>
                <option value="USD">$ USD (US Dollar)</option>
                <option value="EUR">€ EUR (Euro)</option>
                <option value="AED">AED (UAE Dirham)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-1.5">Expected Team Size</label>
              <select className="crm-input text-sm w-full" value={teamSize} onChange={e => setTeamSize(e.target.value)}>
                <option value="1-10">1 – 10 users</option>
                <option value="10-50">10 – 50 users</option>
                <option value="50-200">50 – 200 users</option>
                <option value="200+">200+ Enterprise</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              className="btn-primary text-sm px-6 gap-2 flex items-center"
              disabled={!orgName.trim()}
              onClick={() => setStep(2)}
            >
              Continue to Template <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Industry Template Selector */}
      {step === 2 && (
        <div className="crm-card space-y-5">
          <div>
            <h2 className="text-lg font-bold">2. Select Your Industry Template</h2>
            <p className="text-xs text-muted mt-0.5">This pre-configures lead statuses, pipeline stages, and custom fields suited to your workflow.</p>
          </div>

          <div className="space-y-3">
            {INDUSTRY_TEMPLATES.map(t => {
              const selected = template === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                  style={{
                    borderColor: selected ? t.color : 'rgb(var(--border))',
                    background: selected ? `${t.color}12` : 'rgb(var(--card))',
                  }}
                >
                  <span className="text-2xl mt-0.5">{t.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-white">{t.title}</h3>
                      {selected && <span className="text-xs font-bold" style={{ color: t.color }}>Selected ✓</span>}
                    </div>
                    <p className="text-xs text-muted mt-1 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-2">
            <button className="btn-secondary text-sm" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary text-sm px-6 gap-2 flex items-center" onClick={() => setStep(3)}>
              Continue to Team <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Invite Team Members */}
      {step === 3 && (
        <div className="crm-card space-y-5">
          <div>
            <h2 className="text-lg font-bold">3. Invite Team Leaders & Reps</h2>
            <p className="text-xs text-muted mt-0.5">Add colleague emails. They will receive an invitation to join your workspace.</p>
          </div>

          <div className="flex gap-2">
            <input
              className="crm-input text-sm flex-1"
              placeholder="colleague@company.com"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addInvite()}
            />
            <button className="btn-secondary text-sm px-4" onClick={addInvite}>+ Add</button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted">Pending Invites ({invitedEmails.length}):</p>
            {invitedEmails.map(email => (
              <div key={email} className="flex items-center justify-between p-2.5 rounded-xl border text-sm" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--background))' }}>
                <span className="font-medium text-white">{email}</span>
                <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: 'rgba(99,102,241,0.15)', color: 'rgb(129,140,248)' }}>
                  Team Member
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <button className="btn-secondary text-sm" onClick={() => setStep(2)}>Back</button>
            <button className="btn-primary text-sm px-6 gap-2 flex items-center" onClick={() => setStep(4)}>
              Review & Launch <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Ready to Launch */}
      {step === 4 && (
        <div className="crm-card text-center py-10 space-y-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e' }}>
            <CheckCircle2 size={36} style={{ color: '#22c55e' }} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">Your Workspace is Ready!</h2>
            <p className="text-sm text-muted mt-1 max-w-md mx-auto">
              Configured for <strong className="text-white">{orgName}</strong> with the <strong className="text-white">{INDUSTRY_TEMPLATES.find(t=>t.id===template)?.title}</strong> template.
            </p>
          </div>

          <div className="crm-card text-left max-w-md mx-auto space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
              <span className="text-muted">Organization:</span><span className="font-bold text-white">{orgName}</span>
            </div>
            <div className="flex justify-between py-1 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
              <span className="text-muted">Currency:</span><span className="font-bold text-white">{currency}</span>
            </div>
            <div className="flex justify-between py-1 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
              <span className="text-muted">Team Members:</span><span className="font-bold text-white">{invitedEmails.length + 1} users</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted">Role Hierarchy:</span><span className="font-bold text-emerald-400">Admin → Team Leader → Rep</span>
            </div>
          </div>

          <button
            onClick={finishSetup}
            disabled={completing}
            className="btn-primary text-base px-8 py-3 mx-auto flex items-center gap-2 font-bold shadow-xl"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' }}
          >
            {completing ? 'Launching Workspace...' : 'Launch Workspace Dashboard →'}
          </button>
        </div>
      )}
    </div>
  );
}
