'use client';

import { useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Target, Clock, DollarSign, Phone, Mail, MessageSquare, Sparkles, ChevronDown } from 'lucide-react';

interface AILeadInsightProps {
  leadId?: string;
}

const SCORE_BREAKDOWN = [
  { label: 'Contact Completeness',  score: 22, max: 25, color: '#22c55e' },
  { label: 'Engagement Activity',   score: 18, max: 25, color: '#3b82f6' },
  { label: 'Deal Value Potential',  score: 20, max: 25, color: '#8b5cf6' },
  { label: 'Behavioural Signals',   score: 14, max: 25, color: '#f59e0b' },
];

const AI_RECOMMENDATIONS = [
  { type: 'action', icon: Phone, color: '#22c55e',  bg: 'rgba(34,197,94,0.1)',   text: 'Schedule a demo call within 24h — lead engagement is peaking based on recent email opens.' },
  { type: 'risk',   icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: 'No activity logged in 3 days. Risk of going cold. Send a follow-up now.' },
  { type: 'value',  icon: DollarSign,    color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  text: 'Based on company size (250+ employees), upsell to Enterprise License (₹49,999/yr).' },
];

const SIMILAR_LEADS = [
  { name: 'Akash Mehta', company: 'CloudBase Ltd', outcome: 'WON', value: '₹3.2L', days: 18 },
  { name: 'Divya Nair',  company: 'FinServe Co.',  outcome: 'WON', value: '₹2.8L', days: 22 },
  { name: 'Rajan Pillai',company: 'TechPark In.',  outcome: 'LOST', value: '—',    days: 31 },
];

export function AILeadInsight({ leadId }: AILeadInsightProps) {
  const [open, setOpen] = useState(true);
  const totalScore = SCORE_BREAKDOWN.reduce((s, b) => s + b.score, 0);

  return (
    <div className="crm-card">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between mb-4"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.3))' }}>
            <Brain size={14} style={{ color: 'rgb(167,139,250)' }} />
          </div>
          <span className="font-semibold text-sm">AI Lead Intelligence</span>
          <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(99,102,241,0.2)', color: 'rgb(129,140,248)' }}>
            <Sparkles size={9} className="inline mr-0.5" />Beta
          </span>
        </div>
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>

      {open && (
        <>
          {/* Score Ring */}
          <div className="flex items-center gap-4 mb-4 p-3 rounded-xl" style={{ background: 'rgb(var(--background))' }}>
            {/* SVG Score Ring */}
            <div className="relative flex-shrink-0">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgb(var(--border))" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="32"
                  fill="none"
                  stroke="url(#grad)"
                  strokeWidth="6"
                  strokeDasharray={`${(totalScore / 100) * 201} 201`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-white">{totalScore}</span>
                <span className="text-[9px] text-muted">/ 100</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm text-white mb-0.5">Lead Score: High Intent</p>
              <p className="text-xs text-muted mb-2">Top 15% of your pipeline this month</p>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} style={{ color: 'rgb(34,197,94)' }} />
                <span className="text-xs font-semibold" style={{ color: 'rgb(34,197,94)' }}>+7 pts in 24h (email opened 3×)</span>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Score Breakdown</p>
            <div className="space-y-2">
              {SCORE_BREAKDOWN.map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted">{b.label}</span>
                    <span className="font-semibold" style={{ color: b.color }}>{b.score} / {b.max}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border))' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(b.score / b.max) * 100}%`, background: b.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">AI Recommendations</p>
            <div className="space-y-2">
              {AI_RECOMMENDATIONS.map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl" style={{ background: rec.bg }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${rec.color}20` }}>
                    <rec.icon size={12} style={{ color: rec.color }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgb(var(--muted-foreground))' }}>{rec.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Similar Leads (Won/Lost patterns) */}
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Similar Leads (Pattern Match)</p>
            <div className="space-y-1.5">
              {SIMILAR_LEADS.map((sl) => (
                <div key={sl.name} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgb(var(--background))' }}>
                  <div>
                    <p className="text-xs font-medium">{sl.name}</p>
                    <p className="text-xs text-muted">{sl.company} · {sl.days}d to close</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{
                      background: sl.outcome === 'WON' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color:      sl.outcome === 'WON' ? 'rgb(34,197,94)'      : 'rgb(239,68,68)',
                    }}>
                      {sl.outcome}
                    </span>
                    {sl.value !== '—' && <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgb(var(--brand-400))' }}>{sl.value}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Predicted close date */}
          <div className="mt-4 p-3 rounded-xl border" style={{ borderColor: 'rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.05)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Clock size={13} style={{ color: 'rgb(129,140,248)' }} />
              <p className="text-xs font-semibold" style={{ color: 'rgb(129,140,248)' }}>Predicted Close Date</p>
            </div>
            <p className="text-sm font-bold text-white">Aug 24 – Aug 28, 2026</p>
            <p className="text-xs text-muted mt-0.5">Based on similar deals in your pipeline. Win probability: <span className="font-bold text-emerald-400">74%</span></p>
          </div>
        </>
      )}
    </div>
  );
}
