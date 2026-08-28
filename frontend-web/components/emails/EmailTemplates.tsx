'use client';

import { useState } from 'react';
import { Mail, Plus, Copy, Trash2, Edit2, Send, Eye, Check } from 'lucide-react';

const TEMPLATES = [
  {
    id: '1', name: 'Initial Outreach',
    subject: 'Exploring CRM solutions for {{company_name}}',
    category: 'Outreach', usedCount: 42,
    body: `Hi {{contact_first_name}},

I noticed {{company_name}} is growing rapidly in the {{industry}} space — congratulations on your progress!

We help companies like yours streamline their sales process with our CRM platform, DAS CRM. Teams using DAS CRM typically see a 30% improvement in lead conversion within the first 90 days.

Would you be open to a 15-minute call this week to explore how we can help {{company_name}}?

Best regards,
{{sender_name}}
{{sender_designation}}, {{org_name}}`,
  },
  {
    id: '2', name: 'Follow-Up After Demo',
    subject: 'Next Steps: {{company_name}} × DAS CRM Partnership',
    category: 'Follow-Up', usedCount: 28,
    body: `Hi {{contact_first_name}},

Thank you for taking the time to join our demo yesterday! I hope it gave you a clear picture of how DAS CRM can transform your sales operations.

As discussed, here are the next steps:
1. Review the attached proposal (₹{{deal_value}})
2. Loop in your technical team if needed
3. Schedule a Q&A call for any outstanding queries

The proposal is valid until {{quote_valid_until}}. Feel free to reply to this email with any questions.

Looking forward to partnering with {{company_name}}!

Warm regards,
{{sender_name}}`,
  },
  {
    id: '3', name: 'Deal Won — Welcome Onboard',
    subject: '🎉 Welcome to DAS CRM, {{company_name}}!',
    category: 'Post-Sale', usedCount: 17,
    body: `Hi {{contact_first_name}},

We're thrilled to welcome {{company_name}} to the DAS CRM family! 🎉

Your account has been set up and is ready to go. Here's what happens next:

✅ Account Activation: Your login credentials have been sent to {{contact_email}}
📅 Onboarding Call: We'll schedule a call within 2 business days
📚 Training: Access our self-paced training library at training.das_crm.com
🛠️ Support: Reach us at support@das_crm.com or via in-app chat

Your dedicated account manager is {{account_manager_name}} — feel free to reach them directly.

Let's build something great together!

Team DAS CRM`,
  },
];

const CATEGORIES = ['All', 'Outreach', 'Follow-Up', 'Post-Sale', 'Re-engagement'];
const VARIABLES = ['{{contact_first_name}}', '{{company_name}}', '{{industry}}', '{{deal_value}}', '{{sender_name}}', '{{org_name}}', '{{quote_valid_until}}', '{{contact_email}}'];

export function EmailTemplates() {
  const [category, setCategory]         = useState('All');
  const [selected, setSelected]         = useState<typeof TEMPLATES[0] | null>(TEMPLATES[0]);
  const [editing, setEditing]           = useState(false);
  const [editBody, setEditBody]         = useState(TEMPLATES[0].body);
  const [copied, setCopied]             = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selected?.body ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const filtered = TEMPLATES.filter(t => category === 'All' || t.category === category);

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Template list */}
      <div className="col-span-12 lg:col-span-4 space-y-3">
        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`pill-tab text-xs py-1 px-3 ${category === c ? 'active' : ''}`}>{c}
            </button>
          ))}
        </div>

        {filtered.map(tmpl => (
          <div
            key={tmpl.id}
            onClick={() => { setSelected(tmpl); setEditBody(tmpl.body); setEditing(false); }}
            className="crm-card cursor-pointer transition-all"
            style={{
              borderColor: selected?.id === tmpl.id ? 'rgba(99,102,241,0.5)' : 'rgb(var(--border))',
              background: selected?.id === tmpl.id ? 'rgba(99,102,241,0.06)' : 'rgb(var(--card))',
            }}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Mail size={14} style={{ color: 'rgb(129,140,248)' }} />
                <p className="font-semibold text-sm">{tmpl.name}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))' }}>
                {tmpl.category}
              </span>
            </div>
            <p className="text-xs text-muted truncate">{tmpl.subject}</p>
            <p className="text-xs text-muted mt-1">Used {tmpl.usedCount}× by team</p>
          </div>
        ))}

        <button className="btn-secondary w-full text-sm flex items-center justify-center gap-1.5">
          <Plus size={14} /> Create New Template
        </button>
      </div>

      {/* Template editor / preview */}
      <div className="col-span-12 lg:col-span-8">
        {selected ? (
          <div className="crm-card h-full flex flex-col">
            {/* Template header */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
              <div>
                <h3 className="font-bold text-base">{selected.name}</h3>
                <p className="text-xs text-muted mt-0.5">Subject: {selected.subject}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
                  {copied ? <><Check size={12} style={{ color: '#22c55e' }} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
                <button onClick={() => setEditing(!editing)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
                  <Edit2 size={12} /> {editing ? 'Preview' : 'Edit'}
                </button>
                <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
                  <Send size={12} /> Use Template
                </button>
              </div>
            </div>

            {/* Subject preview */}
            <div className="mb-3 p-2.5 rounded-lg" style={{ background: 'rgb(var(--background))', border: '1px solid rgb(var(--border))' }}>
              <span className="text-xs text-muted mr-2">Subject:</span>
              <span className="text-sm font-medium">{selected.subject}</span>
            </div>

            {/* Body */}
            {editing ? (
              <textarea
                className="crm-input text-sm flex-1 resize-none font-mono text-xs leading-relaxed"
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
              />
            ) : (
              <div className="flex-1 overflow-auto p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap" style={{ background: 'rgb(var(--background))', color: 'rgb(var(--muted-foreground))' }}>
                {selected.body}
              </div>
            )}

            {/* Variables reference */}
            <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
              <p className="text-xs font-semibold text-muted mb-2">Available Variables (auto-filled on send):</p>
              <div className="flex gap-1.5 flex-wrap">
                {VARIABLES.map(v => (
                  <span key={v} className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(99,102,241,0.12)', color: 'rgb(129,140,248)' }}>
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="crm-card flex items-center justify-center h-48 text-muted">
            Select a template to preview it
          </div>
        )}
      </div>
    </div>
  );
}
