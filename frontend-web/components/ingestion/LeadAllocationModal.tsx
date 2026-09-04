'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { Layers, UserCheck, X, Check, ArrowRight, ShieldCheck, Sparkles, RefreshCw, Eye, Edit3, Trash2, Clock, Plus, Save, AlertTriangle } from 'lucide-react';

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
  onDeleteAllocation?: () => void;
  onPreviewSheet?: () => void;
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

export interface ValidationConflict {
  hasConflict: boolean;
  message: string;
  conflictingRuleIds: string[];
}

export const validateBatchRules = (
  rules: WebBatchRule[],
  totalCount: number
): ValidationConflict => {
  const conflictingRuleIds: string[] = [];

  // 1. Check individual rule boundaries
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (r.fromRow < 1 || r.fromRow > totalCount) {
      return {
        hasConflict: true,
        message: `Batch Rule #${i + 1} From Row (${r.fromRow}) must be between 1 and ${totalCount}.`,
        conflictingRuleIds: [r.id],
      };
    }
    if (r.toRow < 1 || r.toRow > totalCount) {
      return {
        hasConflict: true,
        message: `Batch Rule #${i + 1} To Row (${r.toRow}) must be between 1 and ${totalCount}.`,
        conflictingRuleIds: [r.id],
      };
    }
    if (r.fromRow > r.toRow) {
      return {
        hasConflict: true,
        message: `Batch Rule #${i + 1} From Row (${r.fromRow}) cannot be greater than To Row (${r.toRow}).`,
        conflictingRuleIds: [r.id],
      };
    }
  }

  // 2. Check pairwise overlaps (cannot assign same row to two or more users)
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const r1 = rules[i];
      const r2 = rules[j];

      const overlapStart = Math.max(r1.fromRow, r2.fromRow);
      const overlapEnd = Math.min(r1.toRow, r2.toRow);

      if (overlapStart <= overlapEnd) {
        const overlapCount = overlapEnd - overlapStart + 1;
        return {
          hasConflict: true,
          message: `⚠️ Overlap Conflict Error: Rows ${overlapStart} to ${overlapEnd} (${overlapCount} rows) are assigned to both Batch Rule #${i + 1} (${r1.assigneeName}) and Batch Rule #${j + 1} (${r2.assigneeName}). A single row cannot be assigned to multiple users. Please edit row ranges or auto-adjust.`,
          conflictingRuleIds: [r1.id, r2.id],
        };
      }
    }
  }

  return { hasConflict: false, message: '', conflictingRuleIds: [] };
};

export const LeadAllocationModal: React.FC<LeadAllocationModalProps> = ({
  isOpen,
  onClose,
  totalLeadsCount = 32,
  fileName = 'Lotwaala_August_2026_Work_Plan',
  onDeleteAllocation,
  onPreviewSheet,
  onAllocationComplete,
}) => {
  const [mode, setMode] = useState<AllocationMode>('BATCHWISE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Batchwise Allocation State
  const [batchRules, setBatchRules] = useState<WebBatchRule[]>([]);
  const [runLoop, setRunLoop] = useState(true);

  // Direct Assign State
  const [selectedUser, setSelectedUser] = useState(MOCK_TEAM[0]);

  // 👁️ Preview & Edit Sheet State
  const [isSheetPreviewMode, setIsSheetPreviewMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sheetRows, setSheetRows] = useState([
    { id: '1', name: 'Rajesh Kumar', email: 'rajesh@acme.com', phone: '+91 98765 43210', company: 'Acme Solutions', city: 'Delhi NCR' },
    { id: '2', name: 'Priya Sharma', email: 'priya@techcorp.in', phone: '+91 87654 32109', company: 'TechCorp India', city: 'Mumbai' },
    { id: '3', name: 'Amit Shah', email: 'amit@westreach.com', phone: '+91 76543 21098', company: 'West Reach Pvt', city: 'Ahmedabad' },
    { id: '4', name: 'Neha Gupta', email: 'neha@lotwaala.org', phone: '+91 65432 10987', company: 'Lotwaala Work Plan', city: 'Bengaluru' },
  ]);

  const handleAddPreviewRow = () => {
    setSheetRows(prev => [
      ...prev,
      {
        id: String(Date.now()),
        name: 'New Lead Record',
        email: 'lead@example.com',
        phone: '+91 90000 00000',
        company: 'New Prospect',
        city: 'Unmapped',
      },
    ]);
  };

  useEffect(() => {
    if (totalLeadsCount > 0) {
      setBatchRules(prev => {
        if (prev.length === 0) {
          const half = Math.max(1, Math.floor(totalLeadsCount / 2));
          return [
            { id: 'b-1', fromRow: 1, toRow: half, assigneeId: 'usr-1', assigneeName: 'Priya Sharma (TL A)', role: 'Team Leader' },
            { id: 'b-2', fromRow: Math.min(half + 1, totalLeadsCount), toRow: totalLeadsCount, assigneeId: 'usr-2', assigneeName: 'Rohan Kumar (Sales Rep C)', role: 'Sales Exec' },
          ];
        }
        // Auto-clamp existing batch rules to current totalLeadsCount
        let start = 1;
        const countPerRule = Math.max(1, Math.floor(totalLeadsCount / prev.length));
        return prev.map((rule, idx) => {
          const isLast = idx === prev.length - 1;
          const end = isLast ? totalLeadsCount : Math.min(start + countPerRule - 1, totalLeadsCount);
          const res = {
            ...rule,
            fromRow: start,
            toRow: Math.max(start, end),
          };
          start = Math.min(end + 1, totalLeadsCount);
          return res;
        });
      });
    }
  }, [totalLeadsCount]);

  if (!isOpen) return null;

  const validation = validateBatchRules(batchRules, totalLeadsCount);

  const handleAddBatchRule = () => {
    const lastTo = batchRules[batchRules.length - 1]?.toRow || 0;
    if (lastTo >= totalLeadsCount) {
      alert(`All ${totalLeadsCount} rows are already covered by existing batch rules.`);
      return;
    }
    const nextFrom = Math.min(lastTo + 1, totalLeadsCount);
    const nextTo = totalLeadsCount;
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
    setBatchRules(prev => {
      const targetIndex = prev.findIndex(r => r.id === id);
      if (targetIndex === -1) return prev;

      const rawUpdated = prev.map(r => r.id === id ? { ...r, ...patch } : r);

      // Cascade rule adjustments to keep ranges valid & contiguous
      return rawUpdated.map((rule, idx) => {
        let f = Math.min(Math.max(1, rule.fromRow), totalLeadsCount);
        let t = Math.min(Math.max(f, rule.toRow), totalLeadsCount);

        // If target rule's toRow was updated, auto-sync subsequent rule's fromRow & toRow
        if (idx > 0) {
          const prevRule = rawUpdated[idx - 1];
          if (prevRule.toRow < totalLeadsCount) {
            f = Math.min(prevRule.toRow + 1, totalLeadsCount);
            if (t < f) t = Math.min(f + 10, totalLeadsCount);
          }
        }

        return {
          ...rule,
          fromRow: f,
          toRow: Math.max(f, t),
        };
      });
    });
  };

  const handleRemoveBatchRule = (id: string) => {
    if (batchRules.length <= 1) {
      alert('At least 1 batch rule is required.');
      return;
    }
    setBatchRules(prev => prev.filter(r => r.id !== id));
  };

  const handleAutoFixRanges = () => {
    if (batchRules.length === 0) return;
    const countPerRule = Math.max(1, Math.floor(totalLeadsCount / batchRules.length));
    let currentStart = 1;

    const fixed = batchRules.map((rule, idx) => {
      const isLast = idx === batchRules.length - 1;
      const endRow = isLast ? totalLeadsCount : Math.min(currentStart + countPerRule - 1, totalLeadsCount);
      const updatedRule = {
        ...rule,
        fromRow: currentStart,
        toRow: Math.max(currentStart, endRow),
      };
      currentStart = Math.min(endRow + 1, totalLeadsCount);
      return updatedRule;
    });

    setBatchRules(fixed);
  };

  const [allocationSuccessModalOpen, setAllocationSuccessModalOpen] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{ title: string; items: string[] }>({
    title: '',
    items: [],
  });

  const handleConfirmAllocation = () => {
    if (mode === 'BATCHWISE' && validation.hasConflict) {
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);

      const items = mode === 'BATCHWISE'
        ? batchRules.map(r => `• Rows ${r.fromRow}-${r.toRow} ➔ ${r.assigneeName}`)
        : [`• All ${totalLeadsCount} leads assigned directly to ${selectedUser.name} (${selectedUser.role})`];

      if (mode === 'BATCHWISE' && runLoop) {
        items.push('• Continuous Loop Routing: Enabled');
      }

      setSuccessDetails({
        title: mode === 'BATCHWISE' ? '⚡ Batches Allocated Successfully!' : '👤 Direct Assignment Complete!',
        items,
      });

      setAllocationSuccessModalOpen(true);
    }, 400);
  };

  const handleDoneSuccessModal = () => {
    setAllocationSuccessModalOpen(false);
    onAllocationComplete?.({
      mode,
      batchRules: mode === 'BATCHWISE' ? batchRules : undefined,
      assignedUser: mode === 'DIRECT_ASSIGN' ? { id: selectedUser.id, name: selectedUser.name } : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-white">⚡ Post-Import Lead Allocation</h2>
                <span className="px-2 py-0.5 text-xs font-black text-indigo-400 bg-indigo-500/20 border border-indigo-500/40 rounded-full">
                  {totalLeadsCount} Leads Ingested
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center gap-1">
                  <Clock size={10} /> Auto-Deletes in 7 Days
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                File: <span className="text-slate-200 font-semibold">{fileName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onPreviewSheet) {
                  onClose();
                  onPreviewSheet();
                } else {
                  setIsSheetPreviewMode(!isSheetPreviewMode);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border ${
                isSheetPreviewMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Open Sheet Editor to preview & edit rows and columns"
            >
              <Eye size={13} />
              {isSheetPreviewMode ? 'Close Sheet Editor' : '👁️ Preview & Edit Sheet'}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-extrabold flex items-center gap-1 transition-all"
              title="Delete Sheet Allocation record (7-Day retention policy)"
            >
              <Trash2 size={13} /> Delete
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
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

          {/* 👁️ PREVIEW & EDIT SHEET GRID VIEW */}
          {isSheetPreviewMode ? (
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-cyan-500/30 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                    <Edit3 size={14} /> 📊 2-Axis Sheet Preview &amp; Editor
                  </h3>
                  <p className="text-[10px] text-slate-400">Edit cells directly before or after allocation. Changes persist across CRM.</p>
                </div>
                <button
                  onClick={handleAddPreviewRow}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs flex items-center gap-1 transition-all"
                >
                  <Plus size={12} /> + Add Row
                </button>
              </div>

              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                      <th className="p-2 w-10">#</th>
                      <th className="p-2">Lead Name</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Company</th>
                      <th className="p-2">City</th>
                      <th className="p-2 w-10">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sheetRows.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-2 font-mono text-slate-500 text-[10px]">{idx + 1}</td>
                        <td className="p-1">
                          <input
                            value={r.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSheetRows(prev => prev.map(item => item.id === r.id ? { ...item, name: val } : item));
                            }}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-200 px-2 py-1 rounded text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            value={r.email}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSheetRows(prev => prev.map(item => item.id === r.id ? { ...item, email: val } : item));
                            }}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-300 px-2 py-1 rounded text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            value={r.phone}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSheetRows(prev => prev.map(item => item.id === r.id ? { ...item, phone: val } : item));
                            }}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-emerald-400 font-mono px-2 py-1 rounded text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            value={r.company}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSheetRows(prev => prev.map(item => item.id === r.id ? { ...item, company: val } : item));
                            }}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-300 px-2 py-1 rounded text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            value={r.city}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSheetRows(prev => prev.map(item => item.id === r.id ? { ...item, city: val } : item));
                            }}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-indigo-300 px-2 py-1 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button
                            onClick={() => setSheetRows(prev => prev.filter(item => item.id !== r.id))}
                            className="p-1 text-red-400 hover:text-red-300 text-xs font-bold"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    alert('✓ Sheet modifications saved successfully!');
                    setIsSheetPreviewMode(false);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1 shadow-md"
                >
                  <Save size={13} /> Save Sheet Edits
                </button>
              </div>
            </div>
          ) : null}

          {/* DELETE ALLOCATION RETENTION WARNING MODAL */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-red-500/40 p-5 rounded-2xl max-w-sm w-full space-y-3 shadow-2xl">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle size={20} />
                  <h4 className="text-sm font-extrabold text-white">Delete Sheet Allocation?</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Are you sure you want to delete this sheet allocation record for <span className="font-bold text-white">{fileName}</span>?
                  <br /><br />
                  <span className="text-amber-400 font-semibold">ℹ️ 7-Day Retention Notice:</span> Expired sheet allocation history is automatically purged after 7 days.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold">Cancel</button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      onDeleteAllocation?.();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-md"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 📦 1. BATCHWISE MODE */}
          {mode === 'BATCHWISE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Total Ingested Dataset Size:</span>
                <span className="text-sm font-black text-sky-400">{totalLeadsCount} Rows</span>
              </div>

              {/* ERROR NOTIFICATION BANNER (When overlap or boundary conflict occurs) */}
              {validation.hasConflict && (
                <div className="p-4 bg-rose-950/40 border-2 border-rose-500/80 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5">
                      <Sparkles size={16} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-rose-300 uppercase tracking-wide">
                        Batch Allocation Conflict Error
                      </h4>
                      <p className="text-xs text-rose-200/90 font-medium mt-1 leading-relaxed">
                        {validation.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleAutoFixRanges}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <Sparkles size={13} /> ✨ Auto-Adjust Non-Overlapping Ranges
                    </button>
                  </div>
                </div>
              )}

              {/* Batch Rules */}
              <div className="space-y-3">
                {batchRules.map((rule, idx) => {
                  const isConflicting = validation.conflictingRuleIds.includes(rule.id);
                  return (
                    <div
                      key={rule.id}
                      className={`p-4 rounded-xl space-y-3 transition-all ${
                        isConflicting
                          ? 'bg-rose-950/20 border-2 border-rose-500/90 shadow-lg shadow-rose-950/40'
                          : 'bg-slate-950/80 border border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black ${isConflicting ? 'text-rose-400' : 'text-indigo-400'}`}>
                            Batch Rule #{idx + 1}
                          </span>
                          {isConflicting && (
                            <span className="px-2 py-0.5 text-[9px] font-black text-rose-400 bg-rose-500/20 border border-rose-500/40 rounded-md uppercase">
                              ⚠️ Conflict
                            </span>
                          )}
                        </div>
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
                            className={`w-full px-3 py-1.5 bg-slate-900 border rounded-lg text-xs font-bold text-white focus:outline-none ${
                              isConflicting ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-indigo-500'
                            }`}
                            value={rule.fromRow}
                            onChange={e => handleUpdateBatchRule(rule.id, { fromRow: Number(e.target.value) || 1 })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">To Row (Max {totalLeadsCount})</label>
                          <input
                            type="number"
                            className={`w-full px-3 py-1.5 bg-slate-900 border rounded-lg text-xs font-bold text-white focus:outline-none ${
                              isConflicting ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-indigo-500'
                            }`}
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
                );
              })}
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

        {/* ⚡ SLEEK SUCCESS NOTIFICATION MODAL */}
        {allocationSuccessModalOpen && (
          <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 border-2 border-emerald-500/50 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl shadow-emerald-950/50 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl font-black shadow-lg">
                <Check size={28} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">{successDetails.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Lead distribution rules committed to database.</p>
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-left space-y-2 font-mono text-xs text-emerald-300">
                {successDetails.items.map((line, i) => (
                  <p key={i} className="flex items-center gap-1.5 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>

              <button
                onClick={handleDoneSuccessModal}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
              >
                Done &amp; Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
