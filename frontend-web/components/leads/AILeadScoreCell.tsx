'use client';

import React, { useState } from 'react';
import { ChevronDown, TrendingUp, Target, DollarSign, MessageCircle, Zap, AlertTriangle, Lightbulb, X } from 'lucide-react';

export type ScoreTier = 'HOT' | 'WARM' | 'COLD' | 'LOW';

interface AIScoreData {
  totalScore: number;
  tier: ScoreTier;
  budgetScore: number;
  intentScore: number;
  engagementScore: number;
  productFitScore: number;
  responseScore: number;
  analysisSummary?: string;
  topFactors?: string[];
  riskFactors?: string[];
  recommendations?: string[];
  lastCalculatedAt?: string;
}

interface AILeadScoreCellProps {
  score: AIScoreData;
  compact?: boolean;
}

// Color mapping for tiers
const TIER_CONFIG = {
  HOT: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.35)',
    color: '#ef4444',
    label: 'Hot',
    emoji: '🔥',
  },
  WARM: {
    bg: 'rgba(34, 197, 94, 0.15)',
    border: 'rgba(34, 197, 94, 0.35)',
    color: '#22c55e',
    label: 'Warm',
    emoji: '🟢',
  },
  COLD: {
    bg: 'rgba(234, 179, 8, 0.15)',
    border: 'rgba(234, 179, 8, 0.35)',
    color: '#eab308',
    label: 'Cold',
    emoji: '🟡',
  },
  LOW: {
    bg: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.35)',
    color: '#94a3b8',
    label: 'Low',
    emoji: '⚪',
  },
};

// Score category config
const SCORE_CATEGORIES = [
  { key: 'budgetScore', label: 'Budget', icon: DollarSign, color: '#8b5cf6' },
  { key: 'intentScore', label: 'Intent', icon: Target, color: '#ec4899' },
  { key: 'engagementScore', label: 'Engagement', icon: MessageCircle, color: '#3b82f6' },
  { key: 'productFitScore', label: 'Product Fit', icon: Zap, color: '#f59e0b' },
  { key: 'responseScore', label: 'Response', icon: TrendingUp, color: '#22c55e' },
];

export function AILeadScoreCell({ score, compact = false }: AILeadScoreCellProps) {
  const [expanded, setExpanded] = useState(false);
  const config = TIER_CONFIG[score.tier] || TIER_CONFIG.LOW;

  const getScoreColor = (value: number) => {
    if (value >= 80) return '#22c55e';
    if (value >= 60) return '#3b82f6';
    if (value >= 40) return '#eab308';
    return '#94a3b8';
  };

  if (compact) {
    // Compact display for table cells
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold text-sm transition-all hover:opacity-80 cursor-pointer"
        style={{
          background: config.bg,
          border: `1px solid ${config.border}`,
          color: config.color,
        }}
        title="Click to view AI score breakdown"
      >
        <span>{config.emoji}</span>
        <span>{score.totalScore.toFixed(1)}</span>
      </button>
    );
  }

  return (
    <>
      {/* Compact Score Badge */}
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-sm transition-all hover:opacity-80 cursor-pointer shadow-sm"
        style={{
          background: config.bg,
          border: `1px solid ${config.border}`,
          color: config.color,
        }}
        title="Click to view AI score breakdown"
      >
        <span className="text-base">{config.emoji}</span>
        <span>{score.totalScore.toFixed(1)}</span>
        <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Modal */}
      {expanded && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: config.bg, border: `2px solid ${config.border}` }}
                >
                  {config.emoji}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Lead Score</h3>
                  <p className="text-xs text-slate-400">
                    {config.label} Priority · Score: {score.totalScore.toFixed(1)}/10
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Score Breakdown */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Score Breakdown
              </p>
              <div className="space-y-3">
                {SCORE_CATEGORIES.map((cat) => {
                  const value = score[cat.key as keyof AIScoreData] as number;
                  const Icon = cat.icon;
                  const percentage = (value / 10) * 100;
                  return (
                    <div key={cat.key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon size={14} style={{ color: cat.color }} />
                          <span className="text-xs font-medium text-slate-300">{cat.label}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: getScoreColor(value) }}>
                          {value.toFixed(0)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%`, background: getScoreColor(value) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analysis Summary */}
            {score.analysisSummary && (
              <div className="mb-4 p-3 rounded-xl border" style={{ borderColor: `${config.color}30`, background: `${config.bg}` }}>
                <p className="text-xs font-semibold text-slate-300 mb-1">AI Analysis</p>
                <p className="text-sm text-slate-200">{score.analysisSummary}</p>
              </div>
            )}

            {/* Top Factors */}
            {score.topFactors && score.topFactors.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <p className="text-xs font-semibold text-emerald-400 uppercase">Top Factors</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {score.topFactors.map((factor, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {score.riskFactors && score.riskFactors.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-amber-400" />
                  <p className="text-xs font-semibold text-amber-400 uppercase">Risk Factors</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {score.riskFactors.map((risk, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    >
                      {risk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {score.recommendations && score.recommendations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={14} className="text-indigo-400" />
                  <p className="text-xs font-semibold text-indigo-400 uppercase">Recommendations</p>
                </div>
                <div className="space-y-2">
                  {score.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      <span className="text-indigo-400 font-bold text-xs">{i + 1}.</span>
                      <p className="text-xs text-slate-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            {score.lastCalculatedAt && (
              <p className="text-[10px] text-slate-500 mt-4 text-center">
                Last calculated: {new Date(score.lastCalculatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Utility function to get tier from score
export function getScoreTier(score: number): ScoreTier {
  if (score >= 9) return 'HOT';
  if (score >= 7) return 'WARM';
  if (score >= 4) return 'COLD';
  return 'LOW';
}

// Utility function to get tier config
export function getTierConfig(tier: ScoreTier) {
  return TIER_CONFIG[tier] || TIER_CONFIG.LOW;
}

// Mock data generator for demo purposes
export function generateMockAIScore(score: number): AIScoreData {
  const tier = getScoreTier(score);
  return {
    totalScore: score,
    tier,
    budgetScore: Math.min(10, Math.max(1, score + (Math.random() * 4 - 2))),
    intentScore: Math.min(10, Math.max(1, score + (Math.random() * 4 - 2))),
    engagementScore: Math.min(10, Math.max(1, score + (Math.random() * 4 - 2))),
    productFitScore: Math.min(10, Math.max(1, score + (Math.random() * 4 - 2))),
    responseScore: Math.min(10, Math.max(1, score + (Math.random() * 4 - 2))),
    analysisSummary: tier === 'HOT'
      ? 'This is a high-priority lead showing strong signals across all metrics. Immediate follow-up recommended.'
      : tier === 'WARM'
      ? 'This lead shows moderate interest and engagement. Focus on building momentum with personalized outreach.'
      : tier === 'COLD'
      ? 'This lead needs more nurturing. Consider adjusting outreach strategy with different content.'
      : 'This lead has limited engagement. Focus on other high-priority prospects.',
    topFactors: tier !== 'LOW' ? ['High engagement with website', 'Attended demo session', 'Quotation opened'] : [],
    riskFactors: tier === 'COLD' || tier === 'LOW' ? ['No response in 5 days', 'Low email open rate'] : [],
    recommendations: [
      'Schedule a follow-up call within 24 hours',
      'Share case studies relevant to their industry',
    ],
    lastCalculatedAt: new Date().toISOString(),
  };
}
