'use client';

import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Target,
  DollarSign,
  MessageCircle,
  Zap,
  RefreshCw,
  Save,
  Check,
  AlertTriangle,
  Sliders,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface AIScoreConfig {
  budgetWeight: number;
  intentWeight: number;
  engagementWeight: number;
  productFitWeight: number;
  responseWeight: number;
  hotThresholdMin: number;
  warmThresholdMin: number;
  coldThresholdMin: number;
  showOnLeadsTable: boolean;
  showBreakdownDetail: boolean;
  autoRecalculate: boolean;
}

interface ScoreSummary {
  distribution: {
    hot: number;
    warm: number;
    cold: number;
    low: number;
    total: number;
  };
  config: {
    hotThresholdMin: number;
    warmThresholdMin: number;
    coldThresholdMin: number;
  };
}

const DEFAULT_CONFIG: AIScoreConfig = {
  budgetWeight: 20,
  intentWeight: 25,
  engagementWeight: 20,
  productFitWeight: 20,
  responseWeight: 15,
  hotThresholdMin: 9,
  warmThresholdMin: 7,
  coldThresholdMin: 4,
  showOnLeadsTable: true,
  showBreakdownDetail: true,
  autoRecalculate: true,
};

const SCORE_FACTORS = [
  { key: 'budgetWeight', label: 'Budget', icon: DollarSign, color: '#8b5cf6', description: 'How much the lead can spend' },
  { key: 'intentWeight', label: 'Intent', icon: Target, color: '#ec4899', description: 'Signs of purchase intent' },
  { key: 'engagementWeight', label: 'Engagement', icon: MessageCircle, color: '#3b82f6', description: 'Website visits, emails opened' },
  { key: 'productFitWeight', label: 'Product Fit', icon: Zap, color: '#f59e0b', description: 'Match with your offerings' },
  { key: 'responseWeight', label: 'Response', icon: TrendingUp, color: '#22c55e', description: 'Speed & quality of responses' },
];

export function AIScoreCustomization() {
  const [config, setConfig] = useState<AIScoreConfig>(DEFAULT_CONFIG);
  const [summary, setSummary] = useState<ScoreSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch config and summary on mount
  useEffect(() => {
    fetchAISettings();
  }, []);

  const fetchAISettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const [configRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/ai-scoring/config`),
        fetch(`${API_BASE}/ai-scoring/summary`),
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }
    } catch (err) {
      console.error('Failed to fetch AI settings:', err);
      setError('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof AIScoreConfig, value: number | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`${API_BASE}/ai-scoring/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error('Failed to save');

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save config:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      setError(null);

      const res = await fetch(`${API_BASE}/ai-scoring/scores/recalculate-all`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to recalculate');

      // Refresh summary after recalculation
      await fetchAISettings();
    } catch (err) {
      console.error('Failed to recalculate scores:', err);
      setError('Failed to recalculate scores');
    } finally {
      setRecalculating(false);
    }
  };

  const totalWeight = config.budgetWeight + config.intentWeight +
    config.engagementWeight + config.productFitWeight + config.responseWeight;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Score Distribution Overview */}
      {summary && (
        <div className="crm-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold">Lead Score Distribution</h2>
                <p className="text-xs text-muted">{summary.distribution.total} total leads scored</p>
              </div>
            </div>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={recalculating ? 'animate-spin' : ''} />
              {recalculating ? 'Recalculating...' : 'Recalculate All'}
            </button>
          </div>

          {/* Distribution Bars */}
          <div className="space-y-3">
            {[
              { key: 'hot', label: '🔥 Hot', color: '#ef4444', count: summary.distribution.hot },
              { key: 'warm', label: '🟢 Warm', color: '#22c55e', count: summary.distribution.warm },
              { key: 'cold', label: '🟡 Cold', color: '#eab308', count: summary.distribution.cold },
              { key: 'low', label: '⚪ Low', color: '#94a3b8', count: summary.distribution.low },
            ].map(({ key, label, color, count }) => {
              const percentage = summary.distribution.total > 0
                ? (count / summary.distribution.total) * 100
                : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300">{label}</span>
                    <span className="text-sm font-bold" style={{ color }}>
                      {count} leads ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Score Factor Weights */}
      <div className="crm-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Sliders size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold">Score Factor Weights</h2>
            <p className="text-xs text-muted">Adjust how each factor contributes to the overall AI score</p>
          </div>
        </div>

        {/* Weight Total Indicator */}
        <div className="mb-6 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Total Weight</span>
            <span className={`text-sm font-bold ${totalWeight === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {totalWeight}% {totalWeight !== 100 && '(should equal 100%)'}
            </span>
          </div>
        </div>

        {/* Weight Sliders */}
        <div className="space-y-6">
          {SCORE_FACTORS.map(({ key, label, icon: Icon, color, description }) => {
            const value = config[key as keyof AIScoreConfig] as number;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={16} style={{ color }} />
                    <span className="text-sm font-medium text-slate-200">{label}</span>
                    <span className="text-xs text-muted">— {description}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color }}>{value}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={value}
                  onChange={(e) => handleConfigChange(key as keyof AIScoreConfig, parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${color} 0%, ${color} ${(value / 50) * 100}%, #334155 ${(value / 50) * 100}%, #334155 100%)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Thresholds */}
      <div className="crm-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold">Tier Thresholds</h2>
            <p className="text-xs text-muted">Define the score ranges for each priority tier</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Hot */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="text-2xl">🔥</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-red-400 mb-1">Hot Priority</div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Clock size={12} />
                <span>Score {config.hotThresholdMin.toFixed(1)} to 10</span>
              </div>
            </div>
            <input
              type="number"
              min="7"
              max="10"
              step="0.1"
              value={config.hotThresholdMin}
              onChange={(e) => handleConfigChange('hotThresholdMin', parseFloat(e.target.value))}
              className="w-20 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm text-center focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Warm */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-2xl">🟢</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-emerald-400 mb-1">Warm Priority</div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Clock size={12} />
                <span>Score {config.warmThresholdMin.toFixed(1)} to {(config.hotThresholdMin - 0.1).toFixed(1)}</span>
              </div>
            </div>
            <input
              type="number"
              min="4"
              max="9"
              step="0.1"
              value={config.warmThresholdMin}
              onChange={(e) => handleConfigChange('warmThresholdMin', parseFloat(e.target.value))}
              className="w-20 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm text-center focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Cold */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-2xl">🟡</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-yellow-400 mb-1">Cold Priority</div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Clock size={12} />
                <span>Score {config.coldThresholdMin.toFixed(1)} to {(config.warmThresholdMin - 0.1).toFixed(1)}</span>
              </div>
            </div>
            <input
              type="number"
              min="1"
              max="7"
              step="0.1"
              value={config.coldThresholdMin}
              onChange={(e) => handleConfigChange('coldThresholdMin', parseFloat(e.target.value))}
              className="w-20 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm text-center focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Low */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-500/10 border border-slate-500/20">
            <span className="text-2xl">⚪</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-400 mb-1">Low Priority</div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Clock size={12} />
                <span>Score 0 to {(config.coldThresholdMin - 0.1).toFixed(1)}</span>
              </div>
            </div>
            <div className="w-20 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-sm text-center">
              0 - {(config.coldThresholdMin - 0.1).toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="crm-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Eye size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold">Display Settings</h2>
            <p className="text-xs text-muted">Control how AI scores appear in the CRM</p>
          </div>
        </div>

        <div className="space-y-4">
          <ToggleSetting
            icon={Eye}
            label="Show AI Scores on Leads Table"
            description="Display AI score badges in the leads list"
            enabled={config.showOnLeadsTable}
            onChange={(val) => handleConfigChange('showOnLeadsTable', val)}
          />
          <ToggleSetting
            icon={EyeOff}
            label="Show Score Breakdown"
            description="Allow users to click and see detailed score breakdown"
            enabled={config.showBreakdownDetail}
            onChange={(val) => handleConfigChange('showBreakdownDetail', val)}
          />
          <ToggleSetting
            icon={RefreshCw}
            label="Auto-Recalculate Scores"
            description="Automatically update scores when lead data changes"
            enabled={config.autoRecalculate}
            onChange={(val) => handleConfigChange('autoRecalculate', val)}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || totalWeight !== 100}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : totalWeight !== 100
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25'
          }`}
        >
          {saved ? (
            <>
              <Check size={18} />
              Saved!
            </>
          ) : (
            <>
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Settings'}
            </>
          )}
        </button>
      </div>

      {totalWeight !== 100 && (
        <p className="text-center text-amber-400 text-sm">
          ⚠️ Score weights must equal 100% to save changes
        </p>
      )}
    </div>
  );
}

// Toggle Setting Component
function ToggleSetting({
  icon: Icon,
  label,
  description,
  enabled,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-slate-400" />
        <div>
          <div className="text-sm font-medium text-slate-200">{label}</div>
          <div className="text-xs text-muted">{description}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-indigo-500' : 'bg-slate-600'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
