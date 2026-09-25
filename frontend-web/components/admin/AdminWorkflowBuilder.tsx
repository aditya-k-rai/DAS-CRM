'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  Settings,
  List,
  LayoutGrid,
  FileText,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Percent,
  Sparkles,
  Save,
  RotateCcw,
} from 'lucide-react';
import {
  WORKFLOW_PALETTE_COLORS,
  useWorkflowLeadStatuses,
  useWorkflowPipelineStages,
  useWorkflowLeadSources,
  useWorkflowCustomFields,
  WorkflowLeadStatus,
  WorkflowPipelineStage,
  WorkflowLeadSource,
  WorkflowCustomField,
  DEFAULT_LEAD_STATUSES,
  DEFAULT_PIPELINE_STAGES,
} from '@/lib/workflowService';

const TABS = [
  { id: 'statuses', label: 'Lead Statuses', icon: List, badge: 'Core' },
  { id: 'pipeline', label: 'Pipeline Stages', icon: LayoutGrid, badge: 'Deals' },
  { id: 'sources', label: 'Lead Sources', icon: FileText, badge: 'Channels' },
  { id: 'fields', label: 'Custom Fields', icon: Settings, badge: 'Schema' },
];

export function AdminWorkflowBuilder() {
  const [activeTab, setActiveTab] = useState('statuses');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Workflow Hooks
  const { statuses, saveStatuses } = useWorkflowLeadStatuses();
  const { stages, saveStages } = useWorkflowPipelineStages();
  const { sources, saveSources } = useWorkflowLeadSources();
  const { customFields, saveCustomFields } = useWorkflowCustomFields();

  // Local draft states
  const [localStatuses, setLocalStatuses] = useState<WorkflowLeadStatus[]>(statuses);
  const [localStages, setLocalStages] = useState<WorkflowPipelineStage[]>(stages);
  const [localSources, setLocalSources] = useState<WorkflowLeadSource[]>(sources);
  const [localFields, setLocalFields] = useState<WorkflowCustomField[]>(customFields);

  // Keep local drafts synchronized if remote/hook updates
  useState(() => {
    setLocalStatuses(statuses);
  });

  // Forms
  // 1. Status Form
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState(WORKFLOW_PALETTE_COLORS[0]);

  // 2. Stage Form
  const [newStageName, setNewStageName] = useState('');
  const [newStageProb, setNewStageProb] = useState(50);
  const [newStageColor, setNewStageColor] = useState(WORKFLOW_PALETTE_COLORS[2]);

  // 3. Source Form
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceCategory, setNewSourceCategory] = useState('Inbound Paid');

  // 4. Field Form
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldEntity, setNewFieldEntity] = useState<'LEADS' | 'CONTACTS' | 'DEALS'>('LEADS');
  const [newFieldType, setNewFieldType] = useState<'TEXT' | 'NUMBER' | 'DROPDOWN' | 'DATE' | 'TOGGLE'>('TEXT');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Status Handlers
  const handleAddStatus = () => {
    if (!newStatusName.trim()) return;
    const item: WorkflowLeadStatus = {
      id: `status_${Date.now()}`,
      name: newStatusName.trim(),
      color: newStatusColor,
      order: localStatuses.length,
      isDefault: false,
      isWon: false,
      isLost: false,
    };
    const updated = [...localStatuses, item];
    setLocalStatuses(updated);
    saveStatuses(updated);
    setNewStatusName('');
    showToast(`✓ Added "${item.name}" to Lead Statuses`);
  };

  const handleUpdateStatus = (id: string, field: keyof WorkflowLeadStatus, value: any) => {
    const updated = localStatuses.map((s) => (s.id === id ? { ...s, [field]: value } : s));
    setLocalStatuses(updated);
    saveStatuses(updated);
  };

  const handleRemoveStatus = (id: string) => {
    const updated = localStatuses.filter((s) => s.id !== id);
    setLocalStatuses(updated);
    saveStatuses(updated);
    showToast('Removed status from workflow');
  };

  const handleMoveStatus = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= localStatuses.length) return;
    const updated = [...localStatuses];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    const reordered = updated.map((s, idx) => ({ ...s, order: idx }));
    setLocalStatuses(reordered);
    saveStatuses(reordered);
  };

  // Pipeline Stage Handlers
  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    const item: WorkflowPipelineStage = {
      id: `stage_${Date.now()}`,
      name: newStageName.trim(),
      probability: Math.min(100, Math.max(0, Number(newStageProb) || 0)),
      color: newStageColor,
      order: localStages.length,
    };
    const updated = [...localStages, item];
    setLocalStages(updated);
    saveStages(updated);
    setNewStageName('');
    showToast(`✓ Added stage "${item.name}" (${item.probability}%)`);
  };

  const handleUpdateStage = (id: string, field: keyof WorkflowPipelineStage, value: any) => {
    const updated = localStages.map((s) => (s.id === id ? { ...s, [field]: value } : s));
    setLocalStages(updated);
    saveStages(updated);
  };

  const handleRemoveStage = (id: string) => {
    if (localStages.length <= 1) {
      alert('Pipeline must retain at least one stage.');
      return;
    }
    const updated = localStages.filter((s) => s.id !== id);
    setLocalStages(updated);
    saveStages(updated);
    showToast('Removed stage from sales pipeline');
  };

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= localStages.length) return;
    const updated = [...localStages];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    const reordered = updated.map((s, idx) => ({ ...s, order: idx }));
    setLocalStages(reordered);
    saveStages(reordered);
  };

  // Source Handlers
  const handleAddSource = () => {
    if (!newSourceName.trim()) return;
    const item: WorkflowLeadSource = {
      id: `src_${Date.now()}`,
      name: newSourceName.trim(),
      category: newSourceCategory,
    };
    const updated = [...localSources, item];
    setLocalSources(updated);
    saveSources(updated);
    setNewSourceName('');
    showToast(`✓ Added lead source "${item.name}"`);
  };

  const handleRemoveSource = (id: string) => {
    const updated = localSources.filter((s) => s.id !== id);
    setLocalSources(updated);
    saveSources(updated);
    showToast('Lead source removed');
  };

  // Custom Field Handlers
  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const item: WorkflowCustomField = {
      id: `cf_${Date.now()}`,
      label: newFieldLabel.trim(),
      entity: newFieldEntity,
      type: newFieldType,
      required: newFieldRequired,
    };
    const updated = [...localFields, item];
    setLocalFields(updated);
    saveCustomFields(updated);
    setNewFieldLabel('');
    showToast(`✓ Added custom field "${item.label}"`);
  };

  const handleRemoveField = (id: string) => {
    const updated = localFields.filter((f) => f.id !== id);
    setLocalFields(updated);
    saveCustomFields(updated);
    showToast('Custom field removed');
  };

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset Workflow Stages & Lead Statuses to system default templates?')) {
      setLocalStatuses(DEFAULT_LEAD_STATUSES);
      saveStatuses(DEFAULT_LEAD_STATUSES);
      setLocalStages(DEFAULT_PIPELINE_STAGES);
      saveStages(DEFAULT_PIPELINE_STAGES);
      showToast('🔄 Reset to system default stages and statuses!');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 text-sm font-semibold">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Info & Admin Guard Banner */}
      <div
        className="crm-card py-3.5 px-4 flex items-center justify-between flex-wrap gap-3"
        style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.25)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Settings size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">Lifecycle & Workflow Stage Configuration Hub</p>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 border border-indigo-500/30">
                Tenant Master Engine
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Stages and statuses configured here automatically control lead filters, pipelines, deals kanban, and mobile apps organization-wide.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefaults}
            className="btn-ghost text-xs px-3 py-1.5 rounded-lg border border-border/60 hover:border-slate-600 flex items-center gap-1.5 text-muted hover:text-white"
            title="Reset workflow stages to factory defaults"
          >
            <RotateCcw size={13} /> Reset Defaults
          </button>
          <button
            onClick={() => {
              saveStatuses(localStatuses);
              saveStages(localStages);
              saveSources(localSources);
              saveCustomFields(localFields);
              showToast('💾 All lifecycle stages and workflow schemas verified & saved!');
            }}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <Save size={13} /> Save All Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <div className="crm-card p-2 space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.id === 'statuses'
                      ? localStatuses.length
                      : tab.id === 'pipeline'
                      ? localStages.length
                      : tab.id === 'sources'
                      ? localSources.length
                      : localFields.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Real-time sync badge */}
          <div className="crm-card p-3 mt-3 border border-slate-800/80 bg-slate-950/40 text-[11px] text-muted space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Broadcast Active</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Updates propagate instantly across Leads Directory, Kanban Pipeline, Ingestion Modals, and Android devices.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          {/* TAB 1: LEAD STATUSES */}
          {activeTab === 'statuses' && (
            <div className="crm-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <List size={16} className="text-indigo-400" /> Lead Statuses &amp; Lifecycle Stages
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Configure the exact sequence of stages a prospect transitions through. Reorder or edit colors.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                  {localStatuses.length} Stages Configured
                </span>
              </div>

              {/* Status List */}
              <div className="space-y-2">
                {localStatuses.map((status, index) => (
                  <div
                    key={status.id}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-slate-700"
                    style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--background))' }}
                  >
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5 text-slate-500">
                      <button
                        onClick={() => handleMoveStatus(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 hover:text-white disabled:opacity-20"
                        title="Move Stage Up"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        onClick={() => handleMoveStatus(index, 'down')}
                        disabled={index === localStatuses.length - 1}
                        className="p-0.5 hover:text-white disabled:opacity-20"
                        title="Move Stage Down"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>

                    {/* Color Swatch */}
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white/80 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: status.color }}
                    />

                    {/* Name Input */}
                    <input
                      className="crm-input text-xs font-semibold h-8 flex-1 text-white bg-slate-950/60"
                      value={status.name}
                      onChange={(e) => handleUpdateStatus(status.id, 'name', e.target.value)}
                    />

                    {/* Flags / Badges */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {status.isDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                          Initial
                        </span>
                      )}
                      {status.isWon && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Won Deal
                        </span>
                      )}
                      {status.isLost && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          Dropped
                        </span>
                      )}
                    </div>

                    {/* Color Palette Selector */}
                    <div className="flex gap-1 items-center flex-shrink-0">
                      {WORKFLOW_PALETTE_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleUpdateStatus(status.id, 'color', c)}
                          className="w-4 h-4 rounded-full border transition-transform hover:scale-125"
                          style={{
                            background: c,
                            borderColor: status.color === c ? '#ffffff' : 'transparent',
                            boxShadow: status.color === c ? `0 0 0 1px ${c}` : 'none',
                          }}
                        />
                      ))}
                    </div>

                    {/* Delete button (only custom) */}
                    {!status.isDefault && !status.isWon && !status.isLost && (
                      <button
                        onClick={() => handleRemoveStatus(status.id)}
                        className="btn-ghost w-7 h-7 p-0 flex items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/15 flex-shrink-0"
                        title="Delete custom stage"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Status */}
              <div className="p-3.5 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 space-y-2.5">
                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Plus size={13} className="text-indigo-400" /> Add New Lead Status
                </p>
                <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                  <div className="w-7 h-7 rounded-full border border-slate-600 flex-shrink-0" style={{ background: newStatusColor }} />
                  <input
                    className="crm-input text-xs h-8 flex-1"
                    placeholder="Enter status name (e.g. Needs Assessment)..."
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                  />
                  <div className="flex gap-1 items-center">
                    {WORKFLOW_PALETTE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewStatusColor(c)}
                        className="w-4 h-4 rounded-full border transition-transform hover:scale-125"
                        style={{
                          background: c,
                          borderColor: newStatusColor === c ? '#ffffff' : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                  <button onClick={handleAddStatus} className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1">
                    <Plus size={12} /> Add Status
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PIPELINE STAGES */}
          {activeTab === 'pipeline' && (
            <div className="crm-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <LayoutGrid size={16} className="text-indigo-400" /> Sales Deal Pipeline Stages
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Configure the columns displayed on your Deals Kanban board and their win probabilities.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                  {localStages.length} Pipeline Columns
                </span>
              </div>

              {/* Stage List */}
              <div className="space-y-2">
                {localStages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-slate-700"
                    style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--background))' }}
                  >
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5 text-slate-500">
                      <button
                        onClick={() => handleMoveStage(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 hover:text-white disabled:opacity-20"
                        title="Move Stage Left / Up"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        onClick={() => handleMoveStage(index, 'down')}
                        disabled={index === localStages.length - 1}
                        className="p-0.5 hover:text-white disabled:opacity-20"
                        title="Move Stage Right / Down"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>

                    {/* Color Swatch */}
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white/80 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: stage.color }}
                    />

                    {/* Stage Name */}
                    <input
                      className="crm-input text-xs font-semibold h-8 flex-1 text-white bg-slate-950/60"
                      value={stage.name}
                      onChange={(e) => handleUpdateStage(stage.id, 'name', e.target.value)}
                    />

                    {/* Win Probability Slider & Input */}
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                      <Percent size={12} className="text-slate-400" />
                      <span className="text-[11px] font-bold text-indigo-300 w-9 text-right">{stage.probability}%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={stage.probability}
                        onChange={(e) => handleUpdateStage(stage.id, 'probability', Number(e.target.value))}
                        className="w-20 accent-indigo-500 cursor-pointer"
                        title="Win Probability (%)"
                      />
                    </div>

                    {/* Color Palette Selector */}
                    <div className="flex gap-1 items-center flex-shrink-0">
                      {WORKFLOW_PALETTE_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleUpdateStage(stage.id, 'color', c)}
                          className="w-4 h-4 rounded-full border transition-transform hover:scale-125"
                          style={{
                            background: c,
                            borderColor: stage.color === c ? '#ffffff' : 'transparent',
                            boxShadow: stage.color === c ? `0 0 0 1px ${c}` : 'none',
                          }}
                        />
                      ))}
                    </div>

                    {/* Delete button */}
                    {localStages.length > 1 && (
                      <button
                        onClick={() => handleRemoveStage(stage.id)}
                        className="btn-ghost w-7 h-7 p-0 flex items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/15 flex-shrink-0"
                        title="Delete stage"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Pipeline Stage */}
              <div className="p-3.5 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 space-y-2.5">
                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Plus size={13} className="text-indigo-400" /> Add New Pipeline Stage
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  <div className="sm:col-span-5">
                    <input
                      className="crm-input text-xs h-8 w-full"
                      placeholder="e.g. Legal / Security Review..."
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-2">
                    <span className="text-xs text-muted font-medium">Win:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="crm-input text-xs h-8 w-16 text-center font-bold"
                      value={newStageProb}
                      onChange={(e) => setNewStageProb(Number(e.target.value))}
                    />
                    <span className="text-xs text-muted">%</span>
                  </div>
                  <div className="sm:col-span-2 flex gap-1 items-center">
                    {WORKFLOW_PALETTE_COLORS.slice(0, 5).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewStageColor(c)}
                        className="w-4 h-4 rounded-full border transition-transform hover:scale-125"
                        style={{ background: c, borderColor: newStageColor === c ? '#fff' : 'transparent' }}
                      />
                    ))}
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <button onClick={handleAddStage} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 w-full justify-center">
                      <Plus size={12} /> Add Stage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEAD SOURCES */}
          {activeTab === 'sources' && (
            <div className="crm-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <FileText size={16} className="text-indigo-400" /> Inbound Lead Sources &amp; Channels
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Control which acquisition channels are available across ingestion, forms, and ad sync integrations.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                  {localSources.length} Channels
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {localSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <div>
                        <p className="text-xs font-bold text-white">{source.name}</p>
                        <p className="text-[10px] text-muted">{source.category || 'General Inbound'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSource(source.id)}
                      className="btn-ghost w-7 h-7 p-0 flex items-center justify-center rounded text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Source */}
              <div className="p-3.5 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 space-y-2">
                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Plus size={13} className="text-indigo-400" /> Add Custom Lead Source
                </p>
                <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                  <input
                    className="crm-input text-xs h-8 flex-1"
                    placeholder="Source channel name (e.g. WhatsApp Inbound)..."
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                  />
                  <select
                    className="crm-input text-xs h-8"
                    value={newSourceCategory}
                    onChange={(e) => setNewSourceCategory(e.target.value)}
                  >
                    <option value="Inbound Paid">Inbound Paid</option>
                    <option value="B2B Marketplace">B2B Marketplace</option>
                    <option value="Organic Direct">Organic Direct</option>
                    <option value="Offline Referral">Offline Referral</option>
                    <option value="Events & Conferences">Events & Conferences</option>
                  </select>
                  <button onClick={handleAddSource} className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1">
                    <Plus size={12} /> Add Source
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOM FIELDS */}
          {activeTab === 'fields' && (
            <div className="crm-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Settings size={16} className="text-indigo-400" /> Custom Schema Fields
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Define industry-specific custom attributes attached to Leads, Contacts, and Deals.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                  {localFields.length} Custom Fields
                </span>
              </div>

              <div className="space-y-2">
                {localFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {field.entity}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-2">
                          {field.label}
                          {field.required && (
                            <span className="text-[10px] text-amber-400 font-bold">* Required</span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted">Type: {field.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveField(field.id)}
                      className="btn-ghost w-7 h-7 p-0 flex items-center justify-center rounded text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Field */}
              <div className="p-3.5 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 space-y-2.5">
                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Plus size={13} className="text-indigo-400" /> Add Custom Field
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-4">
                    <input
                      className="crm-input text-xs h-8 w-full"
                      placeholder="Field Label (e.g. GSTIN)..."
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      className="crm-input text-xs h-8 w-full"
                      value={newFieldEntity}
                      onChange={(e) => setNewFieldEntity(e.target.value as any)}
                    >
                      <option value="LEADS">Leads</option>
                      <option value="CONTACTS">Contacts</option>
                      <option value="DEALS">Deals</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      className="crm-input text-xs h-8 w-full"
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as any)}
                    >
                      <option value="TEXT">Text</option>
                      <option value="NUMBER">Number</option>
                      <option value="DROPDOWN">Dropdown</option>
                      <option value="DATE">Date</option>
                      <option value="TOGGLE">Toggle (Boolean)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <button onClick={handleAddField} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 w-full justify-center">
                      <Plus size={12} /> Add Field
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
