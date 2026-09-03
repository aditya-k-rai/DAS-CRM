'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { Layers, UserCheck, X, Check, ArrowRight, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export type AllocationMode = 'BATCHWISE' | 'DIRECT_ASSIGN';

export interface WebBatchRule {
  id: string;
  fromRow: number;
  toRow: number;
  assigneeId: string;
  assigneeName: string;
  role: string;
}

export interface LeadAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalLeadsCount?: number;
  fileName?: string;
  onAllocationComplete?: (result: {
    mode: AllocationMode;
    batchRules?: WebBatchRule[];
    assignedUser?: { id: string; name: string };
  }) => void;
}

const MOCK_TEAM = [
  { id: 'usr-1', name: 'Priya Sharma', role: 'Team Leader', leadsCount: 42, color: '#818cf8' },
  { id: 'usr-2', name: 'Rohan Kumar', role: 'Sales Exec', leadsCount: 28, color: '#34d399' },
  { id: 'usr-3', name: 'Amit Shah', role: 'Sales Exec', leadsCount: 19, color: '#f59e0b' },
  { id: 'usr-4', name: 'Neha Gupta', role: 'Sales Exec', leadsCount: 31, color: '#f472b6' },
];

export const LeadAllocationModal: React.FC<LeadAllocationModalProps> = ({
  isOpen,
  onClose,
  totalLeadsCount = 32,
  fileName = 'Lotwaala_August_2026_Work_Plan',
  onAllocationComplete,
}) => {
  const [mode, setMode] = useState<AllocationMode>('BATCHWISE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Batchwise Allocation State
  const [batchRules, setBatchRules] = useState<WebBatchRule[]>([]);
  const [runLoop, setRunLoop] = useState(true);

  // Direct Assign State
  const [selectedUser, setSelectedUser] = useState(MOCK_TEAM[0]);

  useEffect(() => {
    if (totalLeadsCount > 0) {
      const half = Math.max(1, Math.floor(totalLeadsCount / 2));
      setBatchRules([
        { id: 'b-1', fromRow: 1, toRow: half, assigneeId: 'usr-1', assigneeName: 'Priya Sharma (TL A)', role: 'Team Leader' },
        { id: 'b-2', fromRow: half + 1, toRow: totalLeadsCount, assigneeId: 'usr-2', assigneeName: 'Rohan Kumar (Sales Rep C)', role: 'Sales Exec' },
      ]);
    }
  }, [totalLeadsCount]);

  if (!isOpen) return null;

  const handleAddBatchRule = () => {
    const lastTo = batchRules[batchRules.length - 1]?.toRow || 0;
    if (lastTo >= totalLeadsCount) {
      alert(`All ${totalLeadsCount} rows are already covered by existing batch rules.`);
      return;
    }
    const nextFrom = lastTo + 1;
    const nextTo = Math.min(nextFrom + 15, totalLeadsCount);
    const nextUser = MOCK_TEAM[batchRules.length % MOCK_TEAM.length];

    setBatchRules(prev => [
      ...prev,
      {
        id: `b-${Date.now()}`,
        fromRow: nextFrom,
        toRow: nextTo,
        assigneeId: nextUser.id,
        assigneeName: `${nextUser.name} (${nextUser.role})`,
        role: nextUser.role,
      },
    ]);
  };

  const handleUpdateBatchRule = (id: string, patch: Partial<WebBatchRule>) => {
    setBatchRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const handleRemoveBatchRule = (id: string) => {
    if (batchRules.length <= 1) {
      alert('At least 1 batch rule is required.');
      return;
    }
    setBatchRules(prev => prev.filter(r => r.id !== id));
  };

  const handleConfirmAllocation = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);

      if (mode === 'BATCHWISE') {
        for (const r of batchRules) {
          if (r.fromRow > totalLeadsCount || r.toRow > totalLeadsCount) {
            alert(`Row numbers cannot exceed total dataset count of ${totalLeadsCount}.`);
            return;
          }
          if (r.fromRow > r.toRow) {
            alert(`Start row (${r.fromRow}) cannot be greater than End row (${r.toRow}).`);
            return;
          }
        }
        alert(`⚡ Batches Allocated Successfully!\n\n${batchRules.map(r => `• Rows ${r.fromRow}-${r.toRow} ➔ ${r.assigneeName}`).join('\n')}${runLoop ? '\n• Continuous Loop Routing: Enabled' : ''}`);
      } else {
        alert(`👤 Direct Assignment Complete!\nAll ${totalLeadsCount} leads assigned directly to ${selectedUser.name} (${selectedUser.role}).`);
      }

      onAllocationComplete?.({
        mode,
        batchRules: mode === 'BATCHWISE' ? batchRules : undefined,
        assignedUser: mode === 'DIRECT_ASSIGN' ? { id: selectedUser.id, name: selectedUser.name } : undefined,
      });
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">⚡ Post-Import Lead Allocation</h2>
                <span className="px-2 py-0.5 text-xs font-black text-indigo-400 bg-indigo-500/20 border border-indigo-500/40 rounded-full">
                  {totalLeadsCount} Leads Ingested
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                File: <span className="text-slate-200 font-semibold">{fileName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Allocation Mode Tabs */}
        <div className="flex p-2 bg-slate-950/50 border-b border-slate-800/80 gap-2 px-6">
          <button
            onClick={() => setMode('BATCHWISE')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              mode === 'BATCHWISE'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500'
                : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Layers size={14} />
            📦 Batchwise Allocation
          </button>
          <button
            onClick={() => setMode('DIRECT_ASSIGN')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              mode === 'DIRECT_ASSIGN'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500'
                : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <UserCheck size={14} />
            👤 Direct Single User Assign
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-4">

          {/* 📦 1. BATCHWISE MODE */}
          {mode === 'BATCHWISE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Total Ingested Dataset Size:</span>
                <span className="text-sm font-black text-sky-400">{totalLeadsCount} Rows</span>
              </div>

              {/* Batch Rules */}
              <div className="space-y-3">
                {batchRules.map((rule, idx) => (
                  <div key={rule.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-400">Batch Rule #{idx + 1}</span>
                      <button
                        onClick={() => handleRemoveBatchRule(rule.id)}
                        className="text-xs font-extrabold text-rose-400 hover:text-rose-300"
                      >
                        Remove ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">From Row</label>
                        <input
                          type="number"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                          value={rule.fromRow}
                          onChange={e => handleUpdateBatchRule(rule.id, { fromRow: Number(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">To Row (Max {totalLeadsCount})</label>
                        <input
                          type="number"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                          value={rule.toRow}
                          onChange={e => handleUpdateBatchRule(rule.id, { toRow: Number(e.target.value) || 1 })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Assignee (TL / Sales Rep)</label>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {MOCK_TEAM.map(usr => {
                          const isSel = rule.assigneeId === usr.id;
                          return (
                            <button
                              key={usr.id}
                              onClick={() => handleUpdateBatchRule(rule.id, { assigneeId: usr.id, assigneeName: `${usr.name} (${usr.role})`, role: usr.role })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                                isSel
                                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {usr.name} ({usr.role})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddBatchRule}
                className="w-full py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 text-xs font-extrabold transition-all"
              >
                + Add Custom Batch Range
              </button>

              {/* Loop Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <RefreshCw size={12} className="text-indigo-400" /> Continuous Loop Routing
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Automatically cycle batch distribution rules for new leads</p>
                </div>
                <input
                  type="checkbox"
                  checked={runLoop}
                  onChange={e => setRunLoop(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* 👤 2. DIRECT ASSIGN MODE */}
          {mode === 'DIRECT_ASSIGN' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 font-medium">Select Team Leader or Sales Rep to assign all {totalLeadsCount} ingested leads:</p>

              {MOCK_TEAM.map(usr => {
                const isSel = selectedUser.id === usr.id;
                return (
                  <div
                    key={usr.id}
                    onClick={() => setSelectedUser(usr)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSel
                        ? 'bg-indigo-500/15 border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h4 className={`text-sm font-black ${isSel ? 'text-indigo-300' : 'text-white'}`}>{usr.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{usr.role} • {usr.leadsCount} Active Leads</p>
                    </div>
                    {isSel && (
                      <span className="flex items-center gap-1 text-xs font-black text-indigo-400 bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/40">
                        <Check size={14} /> Selected
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Skip Allocation
          </button>
          <button
            onClick={handleConfirmAllocation}
            disabled={isSubmitting}
            className="flex-[2] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              'Processing Allocation...'
            ) : mode === 'BATCHWISE' ? (
              <>Confirm Batch Allocation <ArrowRight size={14} /></>
            ) : (
              <>Assign to {selectedUser.name} <ArrowRight size={14} /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
