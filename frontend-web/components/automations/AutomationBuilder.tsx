'use client';

import { useState } from 'react';
import { Plus, Zap, ChevronRight, ToggleLeft, ToggleRight, Trash2, Play, Clock, Target, Mail, MessageSquare, Users, CheckSquare, Bell, AlertTriangle, ArrowRight } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────
type TriggerType = 'lead_created' | 'lead_status_changed' | 'lead_score_above' | 'deal_stage_changed' | 'task_overdue' | 'no_activity';
type ActionType  = 'send_email' | 'create_task' | 'assign_lead' | 'send_notification' | 'change_status' | 'add_tag' | 'webhook';

interface Automation {
  id: string;
  name: string;
  isActive: boolean;
  trigger: TriggerType;
  condition: string;
  actions: ActionType[];
  runsTotal: number;
  lastRun: string;
}

// ─── Static Data ────────────────────────────────────────
const EXISTING: Automation[] = [
  { id: '1', name: 'New Lead Auto-Assign', isActive: true,  trigger: 'lead_created',         condition: 'Source = Website',          actions: ['assign_lead', 'send_notification'],  runsTotal: 142, lastRun: '2h ago' },
  { id: '2', name: 'Hot Lead Alert',       isActive: true,  trigger: 'lead_score_above',      condition: 'Score ≥ 80',                actions: ['send_notification', 'create_task'], runsTotal: 38,  lastRun: '5h ago' },
  { id: '3', name: 'Won Deal Celebration', isActive: false, trigger: 'deal_stage_changed',    condition: 'Stage = Closed Won',        actions: ['send_email', 'add_tag'],            runsTotal: 17,  lastRun: '2d ago' },
  { id: '4', name: 'Follow-up Reminder',  isActive: true,  trigger: 'no_activity',           condition: 'No activity for 3 days',    actions: ['create_task', 'send_notification'], runsTotal: 91,  lastRun: '30m ago' },
];

const TRIGGERS: { key: TriggerType; label: string; icon: any; color: string; description: string }[] = [
  { key: 'lead_created',        label: 'Lead Created',          icon: Target,       color: '#6366f1', description: 'When a new lead enters the system' },
  { key: 'lead_status_changed', label: 'Lead Status Changed',   icon: ArrowRight,   color: '#f59e0b', description: 'When a lead status is updated' },
  { key: 'lead_score_above',    label: 'Lead Score Threshold',  icon: Zap,          color: '#22c55e', description: 'When lead score crosses a threshold' },
  { key: 'deal_stage_changed',  label: 'Deal Stage Changed',    icon: Zap,          color: '#8b5cf6', description: 'When a deal moves to a new pipeline stage' },
  { key: 'task_overdue',        label: 'Task Overdue',          icon: AlertTriangle, color: '#ef4444', description: 'When a task passes its due date' },
  { key: 'no_activity',         label: 'No Activity (X days)',  icon: Clock,        color: '#ec4899', description: 'When a lead has no activity for N days' },
];

const ACTIONS: { key: ActionType; label: string; icon: any; color: string }[] = [
  { key: 'send_email',          label: 'Send Email',            icon: Mail,         color: '#6366f1' },
  { key: 'create_task',         label: 'Create Follow-up Task', icon: CheckSquare,  color: '#f59e0b' },
  { key: 'assign_lead',         label: 'Assign Lead to Rep',    icon: Users,        color: '#22c55e' },
  { key: 'send_notification',   label: 'Send Notification',     icon: Bell,         color: '#8b5cf6' },
  { key: 'change_status',       label: 'Change Lead Status',    icon: Target,       color: '#ec4899' },
  { key: 'add_tag',             label: 'Add Tag to Lead',       icon: Plus,         color: '#14b8a6' },
  { key: 'webhook',             label: 'Send Webhook',          icon: Zap,          color: '#f97316' },
];

// ─── Main Component ─────────────────────────────────────
export function AutomationBuilder() {
  const [automations, setAutomations]       = useState<Automation[]>(EXISTING);
  const [building, setBuilding]             = useState(false);
  const [step, setStep]                     = useState<1 | 2 | 3>(1);
  const [draftName, setDraftName]           = useState('');
  const [draftTrigger, setDraftTrigger]     = useState<TriggerType | null>(null);
  const [draftCondition, setDraftCondition] = useState('');
  const [draftActions, setDraftActions]     = useState<ActionType[]>([]);

  const toggleActive = (id: string) =>
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));

  const saveAutomation = () => {
    if (!draftName || !draftTrigger || draftActions.length === 0) return;
    setAutomations(prev => [...prev, {
      id: Date.now().toString(), name: draftName, isActive: true,
      trigger: draftTrigger, condition: draftCondition,
      actions: draftActions, runsTotal: 0, lastRun: 'Never',
    }]);
    setBuilding(false); setStep(1); setDraftName(''); setDraftTrigger(null); setDraftCondition(''); setDraftActions([]);
  };

  const toggleAction = (key: ActionType) =>
    setDraftActions(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: Existing automations list */}
      <div className="col-span-12 lg:col-span-7 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Active Automations', value: automations.filter(a=>a.isActive).length, color: 'rgb(34,197,94)' },
            { label: 'Total Runs (All Time)', value: automations.reduce((s,a)=>s+a.runsTotal,0), color: 'rgb(129,140,248)' },
            { label: 'Time Saved Est.', value: '14.2h', color: 'rgb(245,158,11)' },
          ].map(s => (
            <div key={s.label} className="crm-card py-3 px-4">
              <p className="text-xl sm:text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Automations list */}
        <div className="crm-card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
            <h3 className="font-semibold">Active Automations</h3>
            <span className="text-xs text-muted">{automations.length} total</span>
          </div>

          {automations.map(automation => {
            const trigger = TRIGGERS.find(t => t.key === automation.trigger);
            return (
              <div key={automation.id} className="flex items-start gap-4 p-4 border-b transition-colors hover:bg-muted/20" style={{ borderColor: 'rgb(var(--border))' }}>
                {/* Toggle */}
                <button onClick={() => toggleActive(automation.id)} className="mt-0.5 flex-shrink-0">
                  {automation.isActive
                    ? <ToggleRight size={24} style={{ color: 'rgb(34,197,94)' }} />
                    : <ToggleLeft  size={24} style={{ color: 'rgb(var(--muted-foreground))' }} />}
                </button>

                {/* Automation info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{automation.name}</p>
                    {!automation.isActive && (
                      <span className="text-xs px-1.5 py-0.5 rounded text-muted" style={{ background: 'rgb(var(--muted))' }}>Paused</span>
                    )}
                  </div>

                  {/* Trigger → Condition → Actions flow */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-medium" style={{ background: `${trigger?.color}18`, color: trigger?.color }}>
                      <Zap size={10} /> {trigger?.label}
                    </span>
                    {automation.condition && (
                      <>
                        <ChevronRight size={12} className="text-muted" />
                        <span className="text-muted">{automation.condition}</span>
                      </>
                    )}
                    <ChevronRight size={12} className="text-muted" />
                    {automation.actions.map(aKey => {
                      const act = ACTIONS.find(a => a.key === aKey);
                      return act ? (
                        <span key={aKey} className="flex items-center gap-1 px-2 py-0.5 rounded-full font-medium" style={{ background: `${act.color}18`, color: act.color }}>
                          <act.icon size={10} /> {act.label}
                        </span>
                      ) : null;
                    })}
                  </div>

                  <p className="text-xs text-muted mt-1.5">Ran {automation.runsTotal}× · Last: {automation.lastRun}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center">
                    <Play size={13} style={{ color: 'rgb(34,197,94)' }} />
                  </button>
                  <button className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center">
                    <Trash2 size={13} style={{ color: 'rgb(239,68,68)' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Builder panel */}
      <div className="col-span-12 lg:col-span-5">
        {!building ? (
          <div className="crm-card text-center py-12" style={{ borderStyle: 'dashed', borderColor: 'rgba(99,102,241,0.4)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(99,102,241,0.12)' }}>
              <Zap size={28} style={{ color: 'rgb(129,140,248)' }} />
            </div>
            <h3 className="font-bold text-lg mb-2">Build an Automation</h3>
            <p className="text-sm text-muted mb-6 max-w-xs mx-auto">Create no-code workflows that trigger automatically when conditions are met.</p>
            <button className="btn-primary px-6" onClick={() => { setBuilding(true); setStep(1); }}>
              <Plus size={14} /> Start Building
            </button>
          </div>
        ) : (
          <div className="crm-card">
            {/* Step indicator */}
            <div className="flex items-center gap-1 mb-5">
              {(['1. Trigger', '2. Condition', '3. Actions'] as const).map((label, i) => {
                const stepNum = (i + 1) as 1 | 2 | 3;
                const isActive = step === stepNum;
                const isDone   = step > stepNum;
                return (
                  <div key={label} className="flex items-center gap-1 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full transition-all"
                      style={{
                        background: isDone ? 'rgba(34,197,94,0.15)' : isActive ? 'rgba(99,102,241,0.2)' : 'rgb(var(--muted))',
                        color: isDone ? 'rgb(34,197,94)' : isActive ? 'rgb(129,140,248)' : 'rgb(var(--muted-foreground))',
                      }}>
                      <span>{isDone ? '✓' : stepNum}</span> {label}
                    </div>
                    {i < 2 && <ChevronRight size={12} className="text-muted flex-shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Automation Name */}
            <input
              className="crm-input text-sm mb-4 font-semibold"
              placeholder="Automation name (e.g. Hot Lead Alert)..."
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
            />

            {/* Step 1: Trigger */}
            {step === 1 && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Select Trigger Event</p>
                <div className="grid grid-cols-1 gap-2">
                  {TRIGGERS.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setDraftTrigger(t.key)}
                      className="flex items-start gap-3 p-3 rounded-xl border text-left transition-all"
                      style={{
                        borderColor: draftTrigger === t.key ? t.color : 'rgb(var(--border))',
                        background:  draftTrigger === t.key ? `${t.color}12`  : 'rgb(var(--background))',
                      }}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${t.color}18`, color: t.color }}>
                        <t.icon size={13} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{t.label}</p>
                        <p className="text-xs text-muted mt-0.5">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  className="btn-primary w-full mt-4"
                  disabled={!draftTrigger || !draftName}
                  onClick={() => setStep(2)}
                >
                  Next: Add Condition →
                </button>
              </div>
            )}

            {/* Step 2: Condition */}
            {step === 2 && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Add a Filter Condition (optional)</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <select className="crm-input text-sm h-9">
                    <option>Lead Source</option>
                    <option>Lead Score</option>
                    <option>Status</option>
                    <option>Owner</option>
                    <option>Company</option>
                    <option>Deal Value</option>
                  </select>
                  <select className="crm-input text-sm h-9">
                    <option>equals</option>
                    <option>contains</option>
                    <option>is greater than</option>
                    <option>is less than</option>
                    <option>is empty</option>
                  </select>
                </div>
                <input
                  className="crm-input text-sm mb-2"
                  placeholder="Value (e.g. Website, 80, New...)"
                  value={draftCondition}
                  onChange={e => setDraftCondition(e.target.value)}
                />
                <p className="text-xs text-muted mb-4">Leave blank to run on every trigger.</p>
                <div className="flex gap-2">
                  <button className="btn-secondary flex-1" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn-primary flex-1" onClick={() => setStep(3)}>Next: Actions →</button>
                </div>
              </div>
            )}

            {/* Step 3: Actions */}
            {step === 3 && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Select Actions to Execute</p>
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {ACTIONS.map(act => {
                    const selected = draftActions.includes(act.key);
                    return (
                      <button
                        key={act.key}
                        onClick={() => toggleAction(act.key)}
                        className="flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                        style={{
                          borderColor: selected ? act.color : 'rgb(var(--border))',
                          background:  selected ? `${act.color}12` : 'rgb(var(--background))',
                        }}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${act.color}18`, color: act.color }}>
                          <act.icon size={13} />
                        </div>
                        <span className="text-sm font-medium">{act.label}</span>
                        {selected && <span className="ml-auto text-xs font-bold" style={{ color: act.color }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
                  <button
                    className="btn-primary flex-1"
                    disabled={draftActions.length === 0 || !draftName || !draftTrigger}
                    onClick={saveAutomation}
                  >
                    <Zap size={14} /> Save Automation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
