'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, GripVertical, Eye, EyeOff, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';

type FieldType = 'text' | 'number' | 'dropdown' | 'date' | 'checkbox' | 'url' | 'phone' | 'textarea';
type Entity = 'Lead' | 'Contact' | 'Company' | 'Deal';

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  entity: Entity;
  required: boolean;
  visible: boolean;
  options?: string[];
  placeholder?: string;
}

const FIELD_TYPES: { key: FieldType; label: string; icon: string }[] = [
  { key: 'text',     label: 'Text',      icon: 'T'  },
  { key: 'number',   label: 'Number',    icon: '#'  },
  { key: 'dropdown', label: 'Dropdown',  icon: '▼'  },
  { key: 'date',     label: 'Date',      icon: '📅' },
  { key: 'checkbox', label: 'Checkbox',  icon: '☑'  },
  { key: 'url',      label: 'URL',       icon: '🔗' },
  { key: 'phone',    label: 'Phone',     icon: '📞' },
  { key: 'textarea', label: 'Long Text', icon: '¶'  },
];

const ENTITIES: Entity[] = ['Lead', 'Contact', 'Company', 'Deal'];

const DEFAULT_FIELDS: CustomField[] = [
  { id: '1', name: 'gst_number',  label: 'GST Number',       type: 'text',     entity: 'Company', required: false, visible: true,  placeholder: '27AAAAA0000A1Z5' },
  { id: '2', name: 'vertical',    label: 'Business Vertical', type: 'dropdown', entity: 'Lead',    required: true,  visible: true,  options: ['Real Estate', 'Automobile', 'IT/SaaS', 'Manufacturing', 'Retail'] },
  { id: '3', name: 'demo_date',   label: 'Demo Scheduled On', type: 'date',     entity: 'Lead',    required: false, visible: true  },
  { id: '4', name: 'linkedin_url',label: 'LinkedIn Profile',  type: 'url',      entity: 'Contact', required: false, visible: false },
  { id: '5', name: 'no_employees',label: 'No. of Employees',  type: 'number',   entity: 'Company', required: false, visible: true  },
];

export function CustomFieldsBuilder() {
  const [entity, setEntity]             = useState<Entity>('Lead');
  const [fields, setFields]             = useState<CustomField[]>(DEFAULT_FIELDS);
  const [showForm, setShowForm]         = useState(false);
  const [newLabel, setNewLabel]         = useState('');
  const [newType, setNewType]           = useState<FieldType>('text');
  const [newRequired, setNewRequired]   = useState(false);
  const [newOptions, setNewOptions]     = useState('');

  const entityFields = fields.filter(f => f.entity === entity);

  const addField = () => {
    if (!newLabel.trim()) return;
    const field: CustomField = {
      id: Date.now().toString(),
      name: newLabel.toLowerCase().replace(/\s+/g, '_'),
      label: newLabel, type: newType, entity,
      required: newRequired, visible: true,
      ...(newType === 'dropdown' ? { options: newOptions.split(',').map(o => o.trim()).filter(Boolean) } : {}),
    };
    setFields(prev => [...prev, field]);
    setNewLabel(''); setNewType('text'); setNewRequired(false); setNewOptions(''); setShowForm(false);
  };

  const toggle = (id: string, key: 'visible' | 'required') =>
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: !f[key] } : f));

  const remove = (id: string) => setFields(prev => prev.filter(f => f.id !== id));

  return (
    <div className="max-w-4xl space-y-5">
      {/* Entity tabs */}
      <div className="flex gap-1">
        {ENTITIES.map(e => (
          <button key={e} onClick={() => setEntity(e)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: entity === e ? 'rgba(99,102,241,0.2)' : 'rgb(var(--muted))',
              color: entity === e ? 'rgb(129,140,248)' : 'rgb(var(--muted-foreground))',
              border: entity === e ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
            }}>
            {e} Fields
          </button>
        ))}
        <button onClick={() => setShowForm(!showForm)} className="btn-primary ml-auto text-sm">
          <Plus size={14} /> Add Field
        </button>
      </div>

      {/* Add Field Form */}
      {showForm && (
        <div className="crm-card" style={{ borderColor: 'rgba(99,102,241,0.3)' }}>
          <h3 className="font-semibold text-sm mb-4">New Custom Field for {entity}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Field Label *</label>
              <input className="crm-input text-sm" placeholder="e.g. GST Number" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Field Type</label>
              <select className="crm-input text-sm" value={newType} onChange={e => setNewType(e.target.value as FieldType)}>
                {FIELD_TYPES.map(ft => <option key={ft.key} value={ft.key}>{ft.label}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={newRequired} onChange={e => setNewRequired(e.target.checked)} className="w-4 h-4" />
                Required field
              </label>
            </div>
          </div>
          {newType === 'dropdown' && (
            <div className="mb-4">
              <label className="text-xs text-muted mb-1 block">Options (comma separated)</label>
              <input className="crm-input text-sm" placeholder="Option 1, Option 2, Option 3" value={newOptions} onChange={e => setNewOptions(e.target.value)} />
            </div>
          )}
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-primary text-sm" onClick={addField} disabled={!newLabel.trim()}>Create Field</button>
          </div>
        </div>
      )}

      {/* Fields list */}
      <div className="crm-card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <h3 className="font-semibold text-sm">{entity} Custom Fields</h3>
          <span className="text-xs text-muted">{entityFields.length} fields</span>
        </div>

        {entityFields.length === 0 ? (
          <div className="text-center py-10 text-muted text-sm">
            No custom fields for {entity} yet. <button className="text-brand underline ml-1" onClick={() => setShowForm(true)}>Add one →</button>
          </div>
        ) : (
          <div>
            {entityFields.map((f, i) => {
              const typeInfo = FIELD_TYPES.find(t => t.key === f.type);
              return (
                <div key={f.id} className="flex items-center gap-4 px-4 py-3 border-b hover:bg-muted/10 transition-all" style={{ borderColor: 'rgb(var(--border))' }}>
                  <GripVertical size={14} className="text-muted flex-shrink-0 cursor-grab" />

                  {/* Type badge */}
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'rgba(99,102,241,0.12)', color: 'rgb(129,140,248)' }}>
                    {typeInfo?.icon}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{f.label}</p>
                    <p className="text-xs text-muted">
                      {`{{${f.name}}}`} · {typeInfo?.label}
                      {f.required && <span className="text-red-400 ml-1.5">Required</span>}
                      {f.options && <span className="text-muted ml-1.5">· {f.options.length} options</span>}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggle(f.id, 'visible')} className="text-xs flex items-center gap-1 text-muted hover:text-white">
                      {f.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => remove(f.id)} className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center" style={{ color: 'rgb(239,68,68)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview card */}
      <div className="crm-card">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Eye size={14} style={{ color: 'rgb(129,140,248)' }} /> {entity} Form Preview (with custom fields)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Default fields */}
          <div>
            <label className="text-xs text-muted mb-1 block">Full Name <span className="text-red-400">*</span></label>
            <input className="crm-input text-sm h-9" placeholder="John Doe" disabled />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Email</label>
            <input className="crm-input text-sm h-9" placeholder="john@company.com" disabled />
          </div>
          {/* Custom fields */}
          {entityFields.filter(f => f.visible).map(f => (
            <div key={f.id}>
              <label className="text-xs text-muted mb-1 block">
                {f.label} {f.required && <span className="text-red-400">*</span>}
                <span className="ml-1.5 text-indigo-400 text-[10px]">[custom]</span>
              </label>
              {f.type === 'dropdown' ? (
                <select className="crm-input text-sm h-9" disabled>
                  <option>Select {f.label}...</option>
                  {f.options?.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea className="crm-input text-sm h-16 resize-none" disabled placeholder={f.placeholder} />
              ) : (
                <input className="crm-input text-sm h-9" type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} placeholder={f.placeholder} disabled />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
