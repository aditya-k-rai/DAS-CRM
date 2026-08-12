'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Zap, Copy, Check } from 'lucide-react';

const TEMPLATES = [
  {
    key: 'indian_standard',
    name: 'Indian Standard Payroll',
    description: 'Basic + HRA + DA + PF + PT. Most commonly used in India.',
    badge: 'Popular',
    badgeColor: 'rgb(99,102,241)',
  },
  {
    key: 'fixed_ctc',
    name: 'Fixed CTC',
    description: 'Simple CTC breakdown. Enter CTC, split into components.',
    badge: 'Simple',
    badgeColor: 'rgb(34,197,94)',
  },
  {
    key: 'commission_based',
    name: 'Commission-Based',
    description: 'Base salary + % commission on deal value. Ideal for sales teams.',
    badge: 'Sales',
    badgeColor: 'rgb(245,158,11)',
  },
];

interface Component {
  id: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION' | string;
  calcType: 'fixed' | 'percentage' | string;
  value: number;
  on: string | null;
  isMandatory: boolean;
  description: string;
}

const DEFAULT_COMPONENT: Omit<Component, 'id'> = {
  name: '',
  type: 'EARNING',
  calcType: 'fixed',
  value: 0,
  on: null,
  isMandatory: false,
  description: '',
};

export function SalaryConfigBuilder() {
  const [configName, setConfigName] = useState('');
  const [components, setComponents] = useState<Component[]>([]);
  const [workingDays, setWorkingDays] = useState(26);
  const [overtimeRate, setOvertimeRate] = useState(0);
  const [leaveDeduction, setLeaveDeduction] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadTemplate = (key: string) => {
    setSelectedTemplate(key);
    // Pre-populate with template defaults (blank values for user to fill)
    const templateComponents: Record<string, Component[]> = {
      indian_standard: [
        { id: '1', name: 'Basic Salary', type: 'EARNING', calcType: 'percentage', value: 40, on: 'ctc', isMandatory: true, description: '% of CTC' },
        { id: '2', name: 'HRA', type: 'EARNING', calcType: 'percentage', value: 20, on: 'ctc', isMandatory: false, description: '% of CTC' },
        { id: '3', name: 'Dearness Allowance', type: 'EARNING', calcType: 'percentage', value: 10, on: 'basic', isMandatory: false, description: '% of Basic' },
        { id: '4', name: 'Travel Allowance', type: 'EARNING', calcType: 'fixed', value: 1600, on: null, isMandatory: false, description: 'Fixed amount' },
        { id: '5', name: 'Special Allowance', type: 'EARNING', calcType: 'fixed', value: 0, on: null, isMandatory: false, description: 'Remainder amount' },
        { id: '6', name: 'PF (Employee)', type: 'DEDUCTION', calcType: 'percentage', value: 12, on: 'basic', isMandatory: true, description: '% of Basic' },
        { id: '7', name: 'Professional Tax', type: 'DEDUCTION', calcType: 'fixed', value: 200, on: null, isMandatory: false, description: '₹/month' },
        { id: '8', name: 'TDS', type: 'DEDUCTION', calcType: 'fixed', value: 0, on: null, isMandatory: false, description: 'As per slab' },
      ],
      fixed_ctc: [
        { id: '1', name: 'Basic Salary', type: 'EARNING', calcType: 'percentage', value: 50, on: 'ctc', isMandatory: true, description: '% of CTC' },
        { id: '2', name: 'HRA', type: 'EARNING', calcType: 'percentage', value: 25, on: 'ctc', isMandatory: false, description: '% of CTC' },
        { id: '3', name: 'Special Allowance', type: 'EARNING', calcType: 'percentage', value: 25, on: 'ctc', isMandatory: false, description: '% of CTC' },
        { id: '4', name: 'PF (Employee)', type: 'DEDUCTION', calcType: 'fixed', value: 1800, on: null, isMandatory: false, description: 'Fixed ₹1,800' },
        { id: '5', name: 'Professional Tax', type: 'DEDUCTION', calcType: 'fixed', value: 200, on: null, isMandatory: false, description: 'Fixed ₹200' },
      ],
      commission_based: [
        { id: '1', name: 'Base Salary', type: 'EARNING', calcType: 'fixed', value: 0, on: null, isMandatory: true, description: 'Fixed monthly base' },
        { id: '2', name: 'Commission Rate (%)', type: 'EARNING', calcType: 'percentage', value: 5, on: 'deal_value', isMandatory: false, description: '% of deals closed' },
        { id: '3', name: 'Performance Bonus', type: 'EARNING', calcType: 'fixed', value: 0, on: null, isMandatory: false, description: 'Manual bonus' },
        { id: '4', name: 'PF (Employee)', type: 'DEDUCTION', calcType: 'percentage', value: 12, on: 'basic', isMandatory: false, description: '% of Base' },
        { id: '5', name: 'Professional Tax', type: 'DEDUCTION', calcType: 'fixed', value: 200, on: null, isMandatory: false, description: '₹200/month' },
      ],
    };
    setComponents(templateComponents[key] ?? []);
    setConfigName(TEMPLATES.find((t) => t.key === key)?.name ?? '');
  };

  const addComponent = (type: 'EARNING' | 'DEDUCTION') => {
    setComponents((prev) => [
      ...prev,
      { ...DEFAULT_COMPONENT, id: Date.now().toString(), type },
    ]);
  };

  const updateComponent = (id: string, field: string, value: any) => {
    setComponents((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  };

  const earnings = components.filter((c) => c.type === 'EARNING');
  const deductions = components.filter((c) => c.type === 'DEDUCTION');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Left: Templates */}
      <div className="col-span-12 lg:col-span-4">
        <div className="crm-card">
          <h3 className="font-semibold mb-1">Start from a Template</h3>
          <p className="text-xs text-muted mb-4">Or build from scratch by adding components below</p>
          <div className="flex flex-col gap-3">
            {TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.key}
                onClick={() => loadTemplate(tmpl.key)}
                className="p-3 rounded-xl border cursor-pointer transition-all"
                style={{
                  borderColor: selectedTemplate === tmpl.key ? tmpl.badgeColor : 'rgb(var(--border))',
                  background: selectedTemplate === tmpl.key ? `${tmpl.badgeColor}10` : 'rgb(var(--background))',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{tmpl.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${tmpl.badgeColor}20`, color: tmpl.badgeColor }}>
                    {tmpl.badge}
                  </span>
                </div>
                <p className="text-xs text-muted">{tmpl.description}</p>
                {selectedTemplate === tmpl.key && (
                  <div className="flex items-center gap-1 mt-2" style={{ color: tmpl.badgeColor }}>
                    <Check size={12} />
                    <span className="text-xs font-medium">Loaded</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Config settings */}
        <div className="crm-card mt-4">
          <h3 className="font-semibold mb-3">Config Settings</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium block mb-1.5">Working Days / Month</label>
              <input type="number" className="crm-input" value={workingDays} onChange={(e) => setWorkingDays(+e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5">Overtime Rate (₹/hour)</label>
              <input type="number" className="crm-input" value={overtimeRate} onChange={(e) => setOvertimeRate(+e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Leave Deduction</p>
                <p className="text-xs text-muted">Pro-rate salary based on attendance</p>
              </div>
              <button
                onClick={() => setLeaveDeduction(!leaveDeduction)}
                className="relative w-11 h-6 rounded-full transition-all"
                style={{ background: leaveDeduction ? 'rgb(79,70,229)' : 'rgb(var(--border))' }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                  style={{
                    background: 'white',
                    left: leaveDeduction ? 'calc(100% - 22px)' : '2px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Component Builder */}
      <div className="col-span-12 lg:col-span-8">
        <div className="crm-card mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Salary Components</h3>
              <p className="text-xs text-muted">Add earnings and deductions. All fields are fully editable.</p>
            </div>
            <input
              className="crm-input w-48 text-sm"
              placeholder="Config name..."
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
            />
          </div>

          {/* EARNINGS */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: 'rgb(34,197,94)' }} />
                <h4 className="text-sm font-semibold" style={{ color: 'rgb(34,197,94)' }}>EARNINGS</h4>
                <span className="text-xs text-muted">({earnings.length} components)</span>
              </div>
              <button onClick={() => addComponent('EARNING')} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                <Plus size={12} /> Add Earning
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {earnings.map((comp) => (
                <ComponentRow key={comp.id} comp={comp} onChange={updateComponent} onRemove={removeComponent} />
              ))}
              {earnings.length === 0 && (
                <div className="text-center py-6 rounded-xl border border-dashed" style={{ borderColor: 'rgb(var(--border))', color: 'rgb(var(--muted-foreground))' }}>
                  <Plus size={20} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No earnings added. Click "Add Earning" or load a template.</p>
                </div>
              )}
            </div>
          </div>

          {/* DEDUCTIONS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: 'rgb(239,68,68)' }} />
                <h4 className="text-sm font-semibold" style={{ color: 'rgb(239,68,68)' }}>DEDUCTIONS</h4>
                <span className="text-xs text-muted">({deductions.length} components)</span>
              </div>
              <button onClick={() => addComponent('DEDUCTION')} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                <Plus size={12} /> Add Deduction
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {deductions.map((comp) => (
                <ComponentRow key={comp.id} comp={comp} onChange={updateComponent} onRemove={removeComponent} />
              ))}
              {deductions.length === 0 && (
                <div className="text-center py-6 rounded-xl border border-dashed" style={{ borderColor: 'rgb(var(--border))', color: 'rgb(var(--muted-foreground))' }}>
                  <p className="text-sm">No deductions added.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary">Preview Calculation</button>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2" disabled={!configName || components.length === 0}>
            {saved ? <><Check size={16} /> Saved!</> : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ComponentRow({ comp, onChange, onRemove }: { comp: any; onChange: any; onRemove: any }) {
  const isEarning = comp.type === 'EARNING';
  const color = isEarning ? 'rgb(34,197,94)' : 'rgb(239,68,68)';
  const bg = isEarning ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';

  return (
    <div className="p-3 rounded-xl border transition-all" style={{ borderColor: 'rgb(var(--border))', background: bg }}>
      <div className="grid grid-cols-12 gap-2 items-center">
        <div className="col-span-1 flex items-center justify-center">
          <GripVertical size={14} style={{ color: 'rgb(var(--muted-foreground))' }} className="cursor-grab" />
        </div>
        <div className="col-span-4">
          <input
            className="crm-input text-xs h-8"
            placeholder="Component name"
            value={comp.name}
            onChange={(e) => onChange(comp.id, 'name', e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <select
            className="crm-input text-xs h-8"
            value={comp.calcType}
            onChange={(e) => onChange(comp.id, 'calcType', e.target.value)}
          >
            <option value="fixed">Fixed (₹)</option>
            <option value="percentage">% of</option>
            <option value="formula">Formula</option>
          </select>
        </div>
        <div className="col-span-2">
          <input
            className="crm-input text-xs h-8"
            type="number"
            placeholder={comp.calcType === 'percentage' ? '% value' : '₹ amount'}
            value={comp.value}
            onChange={(e) => onChange(comp.id, 'value', +e.target.value)}
          />
        </div>
        {comp.calcType === 'percentage' && (
          <div className="col-span-2">
            <select className="crm-input text-xs h-8" value={comp.on ?? ''} onChange={(e) => onChange(comp.id, 'on', e.target.value)}>
              <option value="">Base</option>
              <option value="ctc">of CTC</option>
              <option value="basic">of Basic</option>
              <option value="gross">of Gross</option>
              <option value="deal_value">of Deal Value</option>
            </select>
          </div>
        )}
        <div className="col-span-1 flex items-center justify-end">
          <button onClick={() => onRemove(comp.id)} className="btn-ghost w-7 h-7 p-0 rounded-md flex items-center justify-center" style={{ color: 'rgb(239,68,68)' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {comp.description && (
        <p className="text-xs text-muted mt-1 ml-7">{comp.description}</p>
      )}
    </div>
  );
}
