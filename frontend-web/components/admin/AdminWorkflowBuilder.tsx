'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Settings, Palette, FileText, List, LayoutGrid } from 'lucide-react';

const DEFAULT_STATUSES = [
  { id: '1', name: 'New', color: '#6366f1', isDefault: true, isWon: false, isLost: false },
  { id: '2', name: 'Contacted', color: '#f59e0b', isDefault: false, isWon: false, isLost: false },
  { id: '3', name: 'Qualified', color: '#3b82f6', isDefault: false, isWon: false, isLost: false },
  { id: '4', name: 'Proposal', color: '#8b5cf6', isDefault: false, isWon: false, isLost: false },
  { id: '5', name: 'Negotiation', color: '#ec4899', isDefault: false, isWon: false, isLost: false },
  { id: '6', name: 'Won', color: '#22c55e', isDefault: false, isWon: true, isLost: false },
  { id: '7', name: 'Lost', color: '#ef4444', isDefault: false, isWon: false, isLost: true },
];

const TABS = [
  { id: 'statuses', label: 'Lead Statuses', icon: List },
  { id: 'pipeline', label: 'Pipeline Stages', icon: LayoutGrid },
  { id: 'sources', label: 'Lead Sources', icon: FileText },
  { id: 'fields', label: 'Custom Fields', icon: Settings },
];

const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#ef4444', '#14b8a6', '#f97316', '#a855f7'];

export function AdminWorkflowBuilder() {
  const [activeTab, setActiveTab] = useState('statuses');
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#6366f1');

  const addStatus = () => {
    if (!newStatusName.trim()) return;
    setStatuses((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newStatusName, color: newStatusColor, isDefault: false, isWon: false, isLost: false },
    ]);
    setNewStatusName('');
  };

  const removeStatus = (id: string) => setStatuses((prev) => prev.filter((s) => s.id !== id));
  const updateStatus = (id: string, field: string, value: any) =>
    setStatuses((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));

  return (
    <div>
      {/* Info banner */}
      <div className="crm-card mb-4 py-3 px-4 flex items-center gap-3" style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}>
        <Settings size={16} style={{ color: 'rgb(129,140,248)' }} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'rgb(129,140,248)' }}>Admin-Only Zone</p>
          <p className="text-xs text-muted">Changes here affect the entire organization. Team Leaders and Sales staff cannot access this page.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Tab sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <div className="crm-card p-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeTab === tab.id ? 'active' : ''}`}
                style={{
                  background: activeTab === tab.id ? 'rgb(26,27,75)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'rgb(var(--muted-foreground))',
                  boxShadow: activeTab === tab.id ? 'inset 2px 0 0 rgb(99,102,241)' : 'none',
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="col-span-12 lg:col-span-9">
          {activeTab === 'statuses' && (
            <div className="crm-card">
              <div className="mb-4">
                <h3 className="font-semibold">Lead Statuses</h3>
                <p className="text-xs text-muted mt-0.5">Customize the stages of your lead lifecycle. Drag to reorder.</p>
              </div>

              {/* Existing statuses */}
              <div className="flex flex-col gap-2 mb-4">
                {statuses.map((status) => (
                  <div key={status.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--background))' }}>
                    <GripVertical size={14} className="cursor-grab text-muted flex-shrink-0" />

                    {/* Color picker */}
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 rounded-full border-2 border-white cursor-pointer" style={{ background: status.color, boxShadow: `0 0 0 1px ${status.color}` }} />
                    </div>

                    {/* Name */}
                    <input
                      className="crm-input text-sm h-8 flex-1"
                      value={status.name}
                      onChange={(e) => updateStatus(status.id, 'name', e.target.value)}
                    />

                    {/* Badges */}
                    <div className="flex items-center gap-2">
                      {status.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: 'rgb(129,140,248)' }}>Default</span>
                      )}
                      {status.isWon && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: 'rgb(34,197,94)' }}>Won</span>
                      )}
                      {status.isLost && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: 'rgb(239,68,68)' }}>Lost</span>
                      )}
                    </div>

                    {/* Color selector */}
                    <div className="flex gap-1">
                      {COLORS.map((c) => (
                        <button key={c} onClick={() => updateStatus(status.id, 'color', c)}
                          className="w-5 h-5 rounded-full border-2 transition-all"
                          style={{ background: c, borderColor: status.color === c ? 'white' : 'transparent' }}
                        />
                      ))}
                    </div>

                    {!status.isDefault && !status.isWon && !status.isLost && (
                      <button onClick={() => removeStatus(status.id)} className="btn-ghost w-7 h-7 p-0 flex items-center justify-center rounded flex-shrink-0" style={{ color: 'rgb(239,68,68)' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new status */}
              <div className="flex gap-2 p-3 rounded-xl border border-dashed" style={{ borderColor: 'rgb(var(--border))' }}>
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 rounded-full" style={{ background: newStatusColor }} />
                </div>
                <input
                  className="crm-input text-sm h-8 flex-1"
                  placeholder="New status name..."
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addStatus()}
                />
                <div className="flex gap-1">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setNewStatusColor(c)}
                      className="w-5 h-5 rounded-full border-2 transition-all"
                      style={{ background: c, borderColor: newStatusColor === c ? 'white' : 'transparent' }}
                    />
                  ))}
                </div>
                <button onClick={addStatus} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="crm-card">
              <h3 className="font-semibold mb-1">Pipeline Stages</h3>
              <p className="text-xs text-muted mb-4">Configure deal pipeline stages and win probabilities.</p>
              <div className="text-center py-12 text-muted">
                <LayoutGrid size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Pipeline stage builder coming in the next build iteration.</p>
              </div>
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="crm-card">
              <h3 className="font-semibold mb-1">Lead Sources</h3>
              <p className="text-xs text-muted mb-4">Manage where your leads come from.</p>
              <div className="text-center py-12 text-muted">
                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Lead sources management coming in the next build iteration.</p>
              </div>
            </div>
          )}

          {activeTab === 'fields' && (
            <div className="crm-card">
              <h3 className="font-semibold mb-1">Custom Fields</h3>
              <p className="text-xs text-muted mb-4">Add industry-specific fields to leads, contacts, and deals.</p>
              <div className="text-center py-12 text-muted">
                <Settings size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Custom field builder coming in the next build iteration.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
