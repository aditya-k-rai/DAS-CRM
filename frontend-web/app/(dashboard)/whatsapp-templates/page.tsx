'use client';

import { useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import {
  MessageCircle, Plus, Search, Edit2, Copy, Trash2,
  X, ChevronRight, Send, FlaskConical, Tag,
  CheckCircle2, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types (from Android WhatsAppTemplatesScreen + whatsappTemplateEngine) ──
type TemplateCategory = 'OUTREACH' | 'PROPOSAL' | 'FOLLOWUP' | 'PROMOTION';

interface WhatsAppTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  text: string;
  isDefault?: boolean;
  usageCount?: number;
}

// ── Category styles ───────────────────────────────────────
const CAT_STYLES: Record<TemplateCategory, { bg: string; text: string; border: string; emoji: string; label: string }> = {
  OUTREACH:  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', emoji: '🌱', label: 'Outreach' },
  PROPOSAL:  { bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  border: 'border-indigo-500/30',  emoji: '📄', label: 'Proposal' },
  FOLLOWUP:  { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   emoji: '⏰', label: 'Follow-up' },
  PROMOTION: { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30',    emoji: '🎉', label: 'Promotion' },
};

// ── Default templates (mirrors whatsappTemplateEngine.ts DEFAULT_TEMPLATES) ──
const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  { id: 'tpl_1', title: '🌱 Initial Lead Outreach',       category: 'OUTREACH',  isDefault: true, usageCount: 248, text: "Hi {name}! I got to know that you inquired about our DAS CRM solution for {company}. Let's connect for a quick 5-minute call today!" },
  { id: 'tpl_2', title: '📄 GST Commercial Proposal',     category: 'PROPOSAL',  isDefault: true, usageCount: 175, text: "Hello {name}, please find our official commercial quote for {product} attached with 18% GST tax breakdown totaling {value}. Looking forward to your confirmation!" },
  { id: 'tpl_3', title: '⏰ SLA 15-Min Follow-Up',        category: 'FOLLOWUP',  isDefault: true, usageCount: 319, text: "Hi {name}, just following up from DAS CRM regarding our recent discussion for {company}. Do you have 5 minutes for a quick call today?" },
  { id: 'tpl_4', title: '🎉 Q3 Festival Discount Offer',  category: 'PROMOTION', isDefault: true, usageCount: 132, text: "Exciting news {name}! Get 20% off on {product} for {company} when you upgrade this week. Reply to claim your priority demo slot!" },
];

// ── Placeholder variables & Catalog Products ──
const PLACEHOLDERS = ['{name}', '{company}', '{value}', '{product}', '{price}', '{catalog_link}'];

const CATALOG_PRODUCTS = [
  { name: 'Executive Work Station', price: '₹22,500' },
  { name: 'DAS CRM Enterprise License (50 Seats)', price: '₹5,90,000 (Incl. 18% GST)' },
  { name: 'AI Lead Scoring Engine Pro', price: '₹1,41,600 (Incl. 18% GST)' },
  { name: 'Modular Conference Table (12 Seater)', price: '₹1,00,300 (Incl. 18% GST)' },
  { name: 'Custom Commercial Proposal Quote', price: '₹2,38,950' },
];

// ── Live variable interpolation ───────────────────────────
function interpolate(text: string, vars: Record<string, string>): string {
  return text
    .replace(/\{name\}/gi, vars.name || '{name}')
    .replace(/\{company\}/gi, vars.company || '{company}')
    .replace(/\{value\}/gi, vars.value || '{value}')
    .replace(/\{price\}/gi, vars.value || '{price}')
    .replace(/\{product\}/gi, vars.product || '{product}')
    .replace(/\{catalog_link\}/gi, 'https://dascrm.com/catalog');
}

// ── Template Form Modal ───────────────────────────────────
function TemplateModal({
  template, onClose, onSave,
}: {
  template: WhatsAppTemplate | null;
  onClose: () => void;
  onSave: (t: WhatsAppTemplate) => void;
}) {
  const [title, setTitle] = useState(template?.title ?? '');
  const [category, setCategory] = useState<TemplateCategory>(template?.category ?? 'OUTREACH');
  const [text, setText] = useState(template?.text ?? '');
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState('');

  const insertPlaceholder = (ph: string) => setText(prev => (prev ? prev + ' ' + ph : ph));

  const handleSave = () => {
    if (!title.trim() || !text.trim()) return;
    onSave({
      id: template?.id ?? `tpl_${Date.now()}`,
      title: title.trim(),
      category,
      text: text.trim(),
      isDefault: template?.isDefault,
      usageCount: template?.usageCount ?? 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/88 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-scale-in"
        style={{ background: 'rgb(var(--card))', borderRadius: '24px 24px 0 0', border: '1px solid rgb(var(--border))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--card))' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <MessageCircle size={18} className="text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-sm">
              {template ? 'Edit WhatsApp Template' : 'Create New WhatsApp Template'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-muted hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-muted text-xs font-semibold block mb-1.5">📌 Template Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 🌱 Initial Outreach" className="crm-input w-full" autoFocus />
          </div>

          {/* Category */}
          <div>
            <label className="text-muted text-xs font-semibold block mb-1.5">🏷️ Category</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(CAT_STYLES) as TemplateCategory[]).map((cat) => {
                const s = CAT_STYLES[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-bold transition-all',
                      category === cat ? `${s.bg} ${s.text} ${s.border}` : 'border-slate-800 text-muted hover:border-slate-600 hover:text-white'
                    )}
                  >
                    <span className="text-base">{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 📦 SELECT PRODUCT WITH PRICE OPTIONS (CATALOG PICKER) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <label className="text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <Tag size={14} className="text-emerald-400" /> 📦 Select Product with Price Options (Catalog Quick Insert)
            </label>
            <select
              value={selectedCatalogProduct}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCatalogProduct(val);
                const picked = CATALOG_PRODUCTS.find(p => p.name === val);
                if (picked) {
                  insertPlaceholder(`for ${picked.name} priced at ${picked.price}`);
                }
              }}
              className="crm-input w-full text-xs font-semibold text-white bg-slate-950 cursor-pointer focus:border-emerald-500"
            >
              <option value="">Choose Catalog Product &amp; Pricing to Insert...</option>
              {CATALOG_PRODUCTS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} — {p.price}
                </option>
              ))}
            </select>
          </div>

          {/* Message text */}
          <div>
            <label className="text-muted text-xs font-semibold block mb-1.5">📝 Template Message</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type message with {name}, {company}, {value}, {product}, {price} placeholders..."
              rows={5}
              className="crm-input w-full resize-none font-sans"
            />
          </div>

          {/* Insert placeholder buttons */}
          <div>
            <p className="text-muted text-xs font-semibold mb-2">Insert Placeholder Variables:</p>
            <div className="flex items-center gap-2 flex-wrap">
              {PLACEHOLDERS.map((ph) => (
                <button
                  key={ph}
                  onClick={() => insertPlaceholder(ph)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/25 transition-all"
                >
                  <Plus size={10} /> {ph}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          {text.trim() && (
            <div className="rounded-xl p-3.5 border border-emerald-500/20" style={{ background: 'rgb(var(--sidebar-bg))' }}>
              <p className="text-emerald-400 text-xs font-bold mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Live Preview (with default values)
              </p>
              <p className="text-white text-xs leading-relaxed whitespace-pre-wrap">
                {interpolate(text, { name: 'Rajesh Kumar', company: 'TechCorp Solutions', value: '₹5,90,000', product: 'Executive Work Station' })}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 text-xs py-2.5">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !text.trim()}
              className="btn-primary flex-1 text-xs py-2.5 gap-1.5 disabled:opacity-40"
              style={{ background: '#10b981' }}
            >
              <CheckCircle2 size={13} /> Save & Sync Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Send Preview Modal ────────────────────────────────────
function SendModal({ template, vars, onClose }: { template: WhatsAppTemplate; vars: Record<string, string>; onClose: () => void }) {
  const [phone, setPhone] = useState('');
  const finalMsg = interpolate(template.text, vars);

  const handleSend = () => {
    if (!phone.replace(/\D/g, '')) return;
    const cleaned = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(finalMsg)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/88 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="crm-card max-w-md w-full p-5 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Send size={16} className="text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-sm">Send via WhatsApp</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-muted hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <p className="text-muted text-xs mb-3">Template: <span className="text-white font-semibold">{template.title}</span></p>

        {/* Preview */}
        <div className="rounded-xl p-3 mb-4 border border-emerald-500/20" style={{ background: 'rgb(var(--sidebar-bg))' }}>
          <p className="text-white text-xs leading-relaxed whitespace-pre-wrap">{finalMsg}</p>
        </div>

        <div className="space-y-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Recipient phone with country code (+91...)"
            className="crm-input w-full"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary flex-1 text-xs py-2">Cancel</button>
            <button
              onClick={handleSend}
              disabled={phone.replace(/\D/g, '').length < 7}
              className="btn-primary flex-1 text-xs py-2 gap-1.5 disabled:opacity-40"
              style={{ background: '#10b981' }}
            >
              <Send size={13} /> Open WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(DEFAULT_TEMPLATES);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState<{ open: boolean; template: WhatsAppTemplate | null }>({ open: false, template: null });
  const [sendModal, setSendModal] = useState<WhatsAppTemplate | null>(null);

  // Live sandbox vars (mirrors Android WhatsAppTemplatesScreen variable sandbox)
  const [sandboxName, setSandboxName] = useState('Rajesh Kumar');
  const [sandboxCompany, setSandboxCompany] = useState('TechCorp Solutions');
  const [sandboxValue, setSandboxValue] = useState('₹5,90,000');
  const [sandboxProduct, setSandboxProduct] = useState('Enterprise Suite');

  const sandboxVars = { name: sandboxName, company: sandboxCompany, value: sandboxValue, product: sandboxProduct };

  const filtered = templates.filter((t) => {
    const matchCat = activeCategory === 'ALL' || t.category === activeCategory;
    const matchSearch = !search.trim() || t.title.toLowerCase().includes(search.toLowerCase()) || t.text.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSave = (t: WhatsAppTemplate) => {
    setTemplates((prev) => {
      const idx = prev.findIndex(x => x.id === t.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = t; return copy; }
      return [t, ...prev];
    });
  };

  const handleDuplicate = (t: WhatsAppTemplate) => {
    const dup: WhatsAppTemplate = { ...t, id: `tpl_dup_${Date.now()}`, title: `${t.title} (Copy)`, isDefault: false, usageCount: 0 };
    setTemplates((prev) => [dup, ...prev]);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remove this template?')) return;
    setTemplates((prev) => prev.filter(t => t.id !== id));
  };

  const totalUsage = templates.reduce((s, t) => s + (t.usageCount ?? 0), 0);

  return (
    <>
      <Topbar
        title="WhatsApp Direct Template Engine"
        actions={
          <button
            onClick={() => setEditModal({ open: true, template: null })}
            className="btn-primary text-xs gap-1.5 px-3 py-2"
          >
            <Plus size={14} /> Create Template
          </button>
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-auto animate-fade-in">

        {/* ── Stat Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Templates', value: templates.length, icon: MessageCircle, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
            { label: 'Total Sends',     value: totalUsage,       icon: Send,           color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
            { label: 'Outreach Tpls',  value: templates.filter(t => t.category === 'OUTREACH').length,  icon: Zap,   color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
            { label: 'Proposal Tpls',  value: templates.filter(t => t.category === 'PROPOSAL').length,  icon: Tag,   color: 'text-amber-400', bg: 'bg-amber-500/15' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between">
                <p className="text-muted text-xs font-medium">{s.label}</p>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.bg)}>
                  <s.icon size={15} className={s.color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Template List (left 2 cols) ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="crm-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                  <MessageCircle size={18} className="text-emerald-400" /> WhatsApp Template Engine
                </h2>
              </div>

              {/* Search + Category filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates..." className="crm-input pl-9 w-full" />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['ALL', ...Object.keys(CAT_STYLES)] as (TemplateCategory | 'ALL')[]).map((cat) => {
                    const s = cat !== 'ALL' ? CAT_STYLES[cat as TemplateCategory] : null;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
                          activeCategory === cat && s ? `${s.bg} ${s.text} ${s.border}` :
                          activeCategory === cat     ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' :
                          'border-slate-800 text-muted hover:text-white hover:border-slate-600'
                        )}
                      >
                        {cat === 'ALL' ? 'All' : CAT_STYLES[cat as TemplateCategory].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template cards */}
              {filtered.length === 0 ? (
                <div className="text-center py-10">
                  <MessageCircle size={36} className="text-muted mx-auto mb-3" />
                  <p className="text-white font-semibold">No templates found</p>
                  <p className="text-muted text-sm mt-1">Create your first template above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((tpl) => {
                    const cs = CAT_STYLES[tpl.category];
                    return (
                      <div key={tpl.id} className="rounded-xl border p-4 transition-all hover:border-slate-600 group" style={{ background: 'rgb(var(--sidebar-bg))', borderColor: 'rgb(var(--border))' }}>
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Title + Category */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <p className="text-white font-bold text-sm">{tpl.title}</p>
                              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0', cs.bg, cs.text, cs.border)}>
                                {cs.label}
                              </span>
                              {tpl.isDefault && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600 flex-shrink-0">
                                  Default
                                </span>
                              )}
                              {(tpl.usageCount ?? 0) > 0 && (
                                <span className="text-[10px] text-muted ml-auto flex-shrink-0">
                                  {tpl.usageCount} sends
                                </span>
                              )}
                            </div>

                            {/* Raw template text */}
                            <p className="text-muted text-xs leading-relaxed line-clamp-2 mb-2">{tpl.text}</p>

                            {/* Live preview */}
                            <div className="rounded-lg p-2.5 border border-emerald-500/15" style={{ background: 'rgb(var(--card))' }}>
                              <p className="text-emerald-400 text-[10px] font-bold mb-1 flex items-center gap-1"><CheckCircle2 size={10} /> Preview</p>
                              <p className="text-white text-xs leading-relaxed line-clamp-3 whitespace-pre-wrap">
                                {interpolate(tpl.text, sandboxVars)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-wrap" style={{ borderColor: 'rgb(var(--border))' }}>
                          <button onClick={() => setSendModal(tpl)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 transition-all">
                            <Send size={11} /> Send
                          </button>
                          <button onClick={() => setEditModal({ open: true, template: tpl })} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-500/25 transition-all">
                            <Edit2 size={11} /> Edit
                          </button>
                          <button onClick={() => handleDuplicate(tpl)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/25 transition-all">
                            <Copy size={11} /> Duplicate
                          </button>
                          {!tpl.isDefault && (
                            <button onClick={() => handleDelete(tpl.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold hover:bg-rose-500/20 transition-all ml-auto">
                              <Trash2 size={11} /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Live Variable Sandbox (right col) ── */}
          <div className="space-y-4">
            <div className="crm-card p-5">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical size={18} className="text-cyan-400" />
                <h3 className="text-white font-bold text-sm">Live Variable Sandbox</h3>
              </div>
              <p className="text-muted text-xs mb-4 leading-relaxed">
                Set test parameters below. All template previews update instantly.
              </p>

              <div className="space-y-3">
                {/* Catalog Product & Price Quick Pick Selector */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                  <label className="text-cyan-400 text-xs font-bold block">
                    📦 Select Product with Price Options:
                  </label>
                  <select
                    onChange={(e) => {
                      const picked = CATALOG_PRODUCTS.find(p => p.name === e.target.value);
                      if (picked) {
                        setSandboxProduct(picked.name);
                        setSandboxValue(picked.price);
                      }
                    }}
                    className="crm-input w-full text-xs font-semibold bg-slate-950 text-white cursor-pointer"
                  >
                    <option value="">Choose Catalog Product to Test...</option>
                    {CATALOG_PRODUCTS.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.price})
                      </option>
                    ))}
                  </select>
                </div>

                {[
                  { label: 'Client Name', key: 'name', value: sandboxName, set: setSandboxName, placeholder: 'e.g. Rajesh Kumar' },
                  { label: 'Company',     key: 'company', value: sandboxCompany, set: setSandboxCompany, placeholder: 'e.g. TechCorp Solutions' },
                  { label: 'Deal Value',  key: 'value', value: sandboxValue, set: setSandboxValue, placeholder: 'e.g. ₹5,90,000' },
                  { label: 'Product',     key: 'product', value: sandboxProduct, set: setSandboxProduct, placeholder: 'e.g. Enterprise Suite' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-muted text-[10px] font-semibold block mb-1">
                      <span className="text-cyan-400 font-bold">{`{${field.key}}`}</span> — {field.label}
                    </label>
                    <input
                      value={field.value}
                      onChange={(e) => field.set(e.target.value)}
                      placeholder={field.placeholder}
                      className="crm-input w-full text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Placeholder reference card */}
            <div className="crm-card p-4">
              <h4 className="text-white font-bold text-xs mb-3 flex items-center gap-2">
                <Tag size={13} className="text-amber-400" /> Available Placeholders
              </h4>
              <div className="space-y-2">
                {[
                  { ph: '{name}',    desc: 'Lead / client full name' },
                  { ph: '{company}', desc: 'Lead company / org name' },
                  { ph: '{value}',   desc: 'Deal / quote value (₹)' },
                  { ph: '{product}', desc: 'Product or service name' },
                ].map((p) => (
                  <div key={p.ph} className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold text-xs font-mono">{p.ph}</span>
                    <ChevronRight size={10} className="text-muted" />
                    <span className="text-muted text-xs">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {editModal.open && (
        <TemplateModal
          template={editModal.template}
          onClose={() => setEditModal({ open: false, template: null })}
          onSave={handleSave}
        />
      )}
      {sendModal && (
        <SendModal
          template={sendModal}
          vars={sandboxVars}
          onClose={() => setSendModal(null)}
        />
      )}
    </>
  );
}
