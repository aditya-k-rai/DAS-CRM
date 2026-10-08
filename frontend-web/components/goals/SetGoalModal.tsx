'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  Sliders,
  Users,
  Phone,
  MessageCircle,
  DollarSign,
  Calendar,
  Check,
  Save,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { GlobalGoalSettings, UserGoalTarget } from '@/lib/serverGoals';
import { PerformanceRecord } from '@/lib/goalMetricsEngine';

interface SetGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalSettings: GlobalGoalSettings;
  userOverrides: UserGoalTarget[];
  allUsers: PerformanceRecord[];
  onSave: (payload: {
    globalSettings: GlobalGoalSettings;
    userOverrides: UserGoalTarget[];
  }) => Promise<void>;
}

export function SetGoalModal({
  isOpen,
  onClose,
  globalSettings: initialGlobal,
  userOverrides: initialOverrides,
  allUsers,
  onSave,
}: SetGoalModalProps) {
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'INDIVIDUAL'>('GLOBAL');
  const [globalSettings, setGlobalSettings] = useState<GlobalGoalSettings>(initialGlobal);
  const [userOverrides, setUserOverrides] = useState<UserGoalTarget[]>(initialOverrides);
  const [selectedRepId, setSelectedRepId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter eligible users strictly to Sales Executives and Team Leaders
  const eligibleUsers = allUsers.filter(u => {
    const r = (u.userRole || '').toUpperCase();
    if (r.includes('ADMIN') || r.includes('SUPER') || r.includes('MANAGER') || r.includes('HR') || r.includes('OWNER')) {
      return false;
    }
    return r.includes('SALES') || r.includes('EXEC') || r.includes('REP') || r.includes('LEAD') || r.includes('TL');
  });

  useEffect(() => {
    setGlobalSettings(initialGlobal);
    setUserOverrides(initialOverrides);
    if (eligibleUsers.length > 0 && !selectedRepId) {
      setSelectedRepId(eligibleUsers[0].userId);
    }
  }, [initialGlobal, initialOverrides, isOpen, eligibleUsers, selectedRepId]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGlobalChange = (field: keyof GlobalGoalSettings, value: any) => {
    setGlobalSettings(prev => ({
      ...prev,
      [field]: typeof prev[field] === 'number' ? Number(value) || 0 : value,
    }));
  };

  const handleOverrideChange = (userId: string, field: keyof UserGoalTarget, value: any) => {
    const user = eligibleUsers.find(u => u.userId === userId);
    setUserOverrides(prev => {
      const existing = prev.find(o => o.userId === userId);
      const parsedVal = typeof value === 'number' || !isNaN(Number(value)) ? Number(value) : value;

      if (existing) {
        return prev.map(o => (o.userId === userId ? { ...o, [field]: parsedVal } : o));
      } else {
        const newOverride: UserGoalTarget = {
          userId,
          userName: user?.userName || 'User',
          userEmail: user?.userEmail || '',
          userRole: user?.userRole || 'SALES_EXEC',
          [field]: parsedVal,
        };
        return [...prev, newOverride];
      }
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave({
        globalSettings,
        userOverrides,
      });
      showToast('✓ Goals and targets saved successfully!');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      alert('Failed to save goals: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRep = eligibleUsers.find(u => u.userId === selectedRepId) || eligibleUsers[0] || allUsers[0];
  const selectedOverride = userOverrides.find(o => o.userId === selectedRep?.userId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Sales Goals & Performance Target Hub
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Admin & Manager Control
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure daily call quotas, optional WhatsApp targets, monthly revenue targets, and meetings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-2">
          <button
            onClick={() => setActiveTab('GLOBAL')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'GLOBAL'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders size={14} />
            1. Global Default Targets
          </button>
          <button
            onClick={() => setActiveTab('INDIVIDUAL')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'INDIVIDUAL'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={14} />
            2. Individual Rep Overrides
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GLOBAL SETTINGS */}
          {activeTab === 'GLOBAL' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-3">
                <Sparkles size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Company-Wide Baseline Targets</p>
                  <p className="text-indigo-300/80 mt-0.5">
                    These baseline daily and monthly targets automatically apply to all Sales Executives and Team Leaders unless customized individually in Tab 2.
                  </p>
                </div>
              </div>

              {/* Daily Targets */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Phone size={14} className="text-emerald-400" /> Daily Activity Targets (Per Rep)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Daily Calls */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Daily Calls Target</label>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">Required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={globalSettings.dailyCallsTarget}
                        onChange={e => handleGlobalChange('dailyCallsTarget', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 font-medium">calls/day</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Tracks Fresh Calls (Lead First Touch) & Follow-ups</p>
                  </div>

                  {/* Daily WhatsApp (Optional) */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Daily WhatsApp Target</label>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Optional</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={globalSettings.dailyWhatsappTarget}
                        onChange={e => handleGlobalChange('dailyWhatsappTarget', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 font-medium">msgs/day</span>
                    </div>
                    <p className="text-[10px] text-slate-500">WA Direct + WhatsApp Cloud messages (0 = optional)</p>
                  </div>
                </div>
              </div>

              {/* Monthly Targets */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <DollarSign size={14} className="text-amber-400" /> Monthly Revenue & Meeting Targets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Monthly Revenue */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Monthly Revenue Target (₹)</label>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">Primary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step={10000}
                        min={0}
                        value={globalSettings.monthlyRevenueTarget}
                        onChange={e => handleGlobalChange('monthlyRevenueTarget', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">Won deals closed revenue quota</p>
                  </div>

                  {/* Monthly Meetings (Optional) */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Monthly Meetings Target</label>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Optional</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={globalSettings.monthlyMeetingsTarget}
                        onChange={e => handleGlobalChange('monthlyMeetingsTarget', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 font-medium">meetings</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Scheduled client meetings & visits (0 = optional)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INDIVIDUAL OVERRIDES */}
          {activeTab === 'INDIVIDUAL' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Rep Selection List */}
                <div className="w-full md:w-1/3 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Select Sales Rep / TL
                  </label>
                  <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                    {eligibleUsers.map(user => {
                      const isSel = user.userId === selectedRepId;
                      const hasOverride = userOverrides.some(o => o.userId === user.userId);
                      return (
                        <button
                          key={user.userId}
                          type="button"
                          onClick={() => setSelectedRepId(user.userId)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSel
                              ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-md'
                              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                              style={{ background: `${user.avatarColor}20`, color: user.avatarColor }}
                            >
                              {user.initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{user.userName}</p>
                              <span className="text-[10px] text-slate-400 block truncate">{user.userRole}</span>
                            </div>
                          </div>
                          {hasOverride && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                              Custom
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rep Specific Target Form */}
                <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white">{selectedRep?.userName}</h4>
                      <p className="text-xs text-slate-400">
                        {selectedRep?.userRole} · {selectedRep?.userEmail}
                      </p>
                    </div>
                    {selectedOverride ? (
                      <button
                        type="button"
                        onClick={() => setUserOverrides(prev => prev.filter(o => o.userId !== selectedRep?.userId))}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} /> Reset to Global Defaults
                      </button>
                    ) : (
                      <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
                        <Check size={12} /> Using Global Defaults
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Daily Calls */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">Daily Calls Target</label>
                        <span className="text-[9px] text-emerald-400 font-bold uppercase">Required</span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={selectedOverride?.dailyCallsTarget ?? globalSettings.dailyCallsTarget}
                        onChange={e => handleOverrideChange(selectedRep.userId, 'dailyCallsTarget', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Daily WhatsApp (Optional) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">Daily WhatsApp Target</label>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase">Optional</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={selectedOverride?.dailyWhatsappTarget ?? globalSettings.dailyWhatsappTarget}
                        onChange={e => handleOverrideChange(selectedRep.userId, 'dailyWhatsappTarget', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Monthly Revenue Target */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">Monthly Revenue Target (₹)</label>
                        <span className="text-[9px] text-emerald-400 font-bold uppercase">Primary</span>
                      </div>
                      <input
                        type="number"
                        step={10000}
                        min={0}
                        value={selectedOverride?.monthlyRevenueTarget ?? globalSettings.monthlyRevenueTarget}
                        onChange={e => handleOverrideChange(selectedRep.userId, 'monthlyRevenueTarget', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Monthly Meetings Target (Optional) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">Monthly Meetings Target</label>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase">Optional</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={selectedOverride?.monthlyMeetingsTarget ?? globalSettings.monthlyMeetingsTarget}
                        onChange={e => handleOverrideChange(selectedRep.userId, 'monthlyMeetingsTarget', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="text-xs text-slate-400">
            {toastMessage ? (
              <span className="text-emerald-400 font-bold">{toastMessage}</span>
            ) : (
              'Changes immediately take effect across all Sales & Team Leader dashboards.'
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              {isSaving ? 'Saving Goals...' : 'Save & Publish Targets'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
