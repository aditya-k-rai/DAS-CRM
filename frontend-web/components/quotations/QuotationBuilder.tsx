'use client';

import { useState, useRef } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, Package, Percent, DollarSign, FileText, Send, Eye, Download, Check, Edit2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────
interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

const PRODUCTS = [
  { name: 'CRM Enterprise License', sku: 'SW-001', price: 49999, tax: 18 },
  { name: 'CRM Pro (Monthly)',       sku: 'SW-002', price: 4999,  tax: 18 },
  { name: 'Android App Addon',       sku: 'SW-003', price: 1999,  tax: 18 },
  { name: 'Implementation Service',  sku: 'SV-001', price: 15000, tax: 0  },
  { name: 'Data Migration Service',  sku: 'SV-002', price: 8000,  tax: 0  },
  { name: 'Training Workshop',       sku: 'CN-001', price: 5000,  tax: 0  },
];

const mkItem = (): LineItem => ({
  id: Date.now().toString(),
  description: '', qty: 1, unitPrice: 0, taxRate: 18, total: 0,
});

const calcItem = (it: LineItem): LineItem => ({
  ...it,
  total: it.qty * it.unitPrice * (1 + it.taxRate / 100),
});

// ─── Component ────────────────────────────────────────────
export function QuotationBuilder() {
  const [mode, setMode]                   = useState<'edit' | 'preview'>('edit');
  const [items, setItems]                 = useState<LineItem[]>([mkItem()]);
  const [discountType, setDiscountType]   = useState<'flat' | 'percent'>('percent');
  const [discountVal, setDiscountVal]     = useState(0);
  const [notes, setNotes]                 = useState('Thank you for the opportunity to work together.');
  const [terms, setTerms]                 = useState('Payment due within 15 days. GST included as per applicable slabs.');
  const [validDays, setValidDays]         = useState(15);
  const [quoteNo]                         = useState(`Q-${new Date().getFullYear()}-0001`);
  const [saved, setSaved]                 = useState(false);

  // Quick product insert
  const insertProduct = (idx: number, prod: typeof PRODUCTS[0]) => {
    setItems(prev => prev.map((it, i) => i === idx ? calcItem({ ...it, description: prod.name, unitPrice: prod.price, taxRate: prod.tax }) : it));
  };

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setItems(prev => prev.map((it, i) => i === idx ? calcItem({ ...it, ...patch }) : it));
  };

  const addItem    = () => setItems(prev => [...prev, mkItem()]);
  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  // Totals
  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const taxTotal = items.reduce((s, it) => s + it.qty * it.unitPrice * (it.taxRate / 100), 0);
  const discountAmount = discountType === 'percent' ? subtotal * (discountVal / 100) : discountVal;
  const grandTotal = subtotal + taxTotal - discountAmount;

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {['edit', 'preview'].map(m => (
            <button key={m} onClick={() => setMode(m as any)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all"
              style={{
                background: mode === m ? 'rgba(99,102,241,0.2)' : 'rgb(var(--muted))',
                color: mode === m ? 'rgb(129,140,248)' : 'rgb(var(--muted-foreground))',
              }}>
              {m === 'edit' ? <Edit2 size={13} /> : <Eye size={13} />}{m === 'edit' ? 'Edit' : 'Preview'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="btn-secondary text-sm gap-1.5 flex items-center">
            {saved ? <><Check size={13} style={{ color: '#22c55e' }} /> Saved</> : 'Save Draft'}
          </button>
          <button className="btn-secondary text-sm gap-1.5 flex items-center"><Send size={13} /> Send to Lead</button>
          <button className="btn-primary text-sm gap-1.5 flex items-center"><Download size={13} /> Export PDF</button>
        </div>
      </div>

      {/* Preview Mode */}
      {mode === 'preview' && (
        <div className="crm-card max-w-4xl mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
          {/* Letterhead */}
          <div className="flex items-start justify-between pb-6 mb-6 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg" style={{ background: 'linear-gradient(135deg,#4f46e5,#8b5cf6)' }}>N</div>
                <div>
                  <p className="font-bold text-base">Acme Sales Solutions</p>
                  <p className="text-xs text-muted">info@acme.com · +91 98765 43210</p>
                </div>
              </div>
              <p className="text-xs text-muted">GST: 27AAAAA0000A1Z5</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold" style={{ color: 'rgb(99,102,241)' }}>QUOTATION</p>
              <p className="text-sm font-semibold mt-1">{quoteNo}</p>
              <p className="text-xs text-muted">Date: {new Date().toLocaleDateString('en-IN')}</p>
              <p className="text-xs text-muted">Valid: {validDays} days</p>
            </div>
          </div>
          {/* Bill To */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Bill To</p>
            <p className="font-semibold">Rajesh Kumar — TechCorp Ltd</p>
            <p className="text-sm text-muted">rajesh@example.com · +91 98765 43210</p>
          </div>
          {/* Line Items */}
          <table className="w-full text-sm mb-6" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(99,102,241,0.1)' }}>
                {['#', 'Description', 'Qty', 'Unit Price', 'Tax', 'Total'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                  <td className="py-2.5 px-3 text-muted text-xs">{i + 1}</td>
                  <td className="py-2.5 px-3 font-medium">{it.description || '—'}</td>
                  <td className="py-2.5 px-3">{it.qty}</td>
                  <td className="py-2.5 px-3">{fmt(it.unitPrice)}</td>
                  <td className="py-2.5 px-3">{it.taxRate}%</td>
                  <td className="py-2.5 px-3 font-bold" style={{ color: 'rgb(99,102,241)' }}>{fmt(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2 text-sm">
              {[
                { label: 'Subtotal', val: fmt(subtotal) },
                { label: 'GST / Tax', val: fmt(taxTotal) },
                ...(discountVal > 0 ? [{ label: `Discount (${discountType === 'percent' ? `${discountVal}%` : 'flat'})`, val: `- ${fmt(discountAmount)}` }] : []),
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-muted"><span>{label}</span><span>{val}</span></div>
              ))}
              <div className="flex justify-between font-extrabold text-base pt-2 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                <span>Grand Total</span>
                <span style={{ color: 'rgb(99,102,241)' }}>{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>
          {/* Notes + Terms */}
          {notes && <div className="mb-3"><p className="text-xs text-muted font-semibold mb-1">Notes</p><p className="text-sm">{notes}</p></div>}
          {terms && <div><p className="text-xs text-muted font-semibold mb-1">Terms & Conditions</p><p className="text-sm text-muted">{terms}</p></div>}
        </div>
      )}

      {/* Edit Mode */}
      {mode === 'edit' && (
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Line Items */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {/* Quote meta */}
            <div className="crm-card grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><p className="text-xs text-muted mb-1">Quote #</p><p className="font-bold text-sm">{quoteNo}</p></div>
              <div>
                <p className="text-xs text-muted mb-1">Lead</p>
                <select className="crm-input text-sm h-8"><option>Rajesh Kumar — TechCorp</option></select>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Valid For (days)</p>
                <input type="number" className="crm-input text-sm h-8" value={validDays} onChange={e => setValidDays(+e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Date</p>
                <p className="text-sm font-semibold">{new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {/* Line items table */}
            <div className="crm-card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                <h3 className="font-semibold text-sm">Line Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--background))' }}>
                      {['', 'Description / Product', 'Qty', 'Unit Price (₹)', 'Tax %', 'Total', ''].map(h => (
                        <th key={h} className="text-left py-2.5 px-3 text-xs text-muted font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={it.id} className="border-b group" style={{ borderColor: 'rgb(var(--border))' }}>
                        <td className="py-2 px-2 text-muted"><GripVertical size={14} /></td>
                        <td className="py-2 px-2 min-w-[200px]">
                          <div className="relative">
                            <input
                              className="crm-input text-sm h-8 pr-8"
                              placeholder="Product or description..."
                              value={it.description}
                              onChange={e => updateItem(idx, { description: e.target.value })}
                            />
                            {/* Product quick-pick */}
                            <div className="absolute right-1 top-1 group/picker">
                              <button className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-white">
                                <Package size={12} />
                              </button>
                              <div className="hidden group-hover/picker:block absolute right-0 top-7 z-50 w-56 crm-card p-1 shadow-xl">
                                {PRODUCTS.map(p => (
                                  <button key={p.sku} onClick={() => insertProduct(idx, p)}
                                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-brand/10 hover:text-brand-400">
                                    <span className="font-medium">{p.name}</span>
                                    <span className="text-muted ml-1.5">₹{p.price.toLocaleString()}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 w-16">
                          <input type="number" min={1} className="crm-input text-sm h-8 text-center" value={it.qty}
                            onChange={e => updateItem(idx, { qty: +e.target.value })} />
                        </td>
                        <td className="py-2 px-2 w-32">
                          <input type="number" min={0} className="crm-input text-sm h-8" value={it.unitPrice}
                            onChange={e => updateItem(idx, { unitPrice: +e.target.value })} />
                        </td>
                        <td className="py-2 px-2 w-16">
                          <input type="number" min={0} max={100} className="crm-input text-sm h-8 text-center" value={it.taxRate}
                            onChange={e => updateItem(idx, { taxRate: +e.target.value })} />
                        </td>
                        <td className="py-2 px-3 font-bold text-sm whitespace-nowrap" style={{ color: 'rgb(99,102,241)' }}>
                          {fmt(it.total)}
                        </td>
                        <td className="py-2 px-2">
                          <button onClick={() => removeItem(it.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3">
                <button onClick={addItem} className="btn-secondary text-xs flex items-center gap-1.5">
                  <Plus size={12} /> Add Line Item
                </button>
              </div>
            </div>

            {/* Notes + Terms */}
            <div className="crm-card grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted font-semibold mb-1.5">Notes (shown on quote)</p>
                <textarea className="crm-input text-sm w-full h-20 resize-none" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-muted font-semibold mb-1.5">Terms & Conditions</p>
                <textarea className="crm-input text-sm w-full h-20 resize-none" value={terms} onChange={e => setTerms(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Right: Summary + Discount */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Totals summary */}
            <div className="crm-card space-y-3">
              <h3 className="font-semibold text-sm">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Tax / GST</span><span>{fmt(taxTotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Discount</span><span>- {fmt(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-base pt-2 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                  <span>Grand Total</span>
                  <span style={{ color: 'rgb(99,102,241)' }}>{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Discount */}
            <div className="crm-card">
              <h3 className="font-semibold text-sm mb-3">Discount</h3>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setDiscountType('percent')} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${discountType === 'percent' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-muted text-muted-foreground'}`}>
                  <Percent size={11} className="inline mr-1" />Percent
                </button>
                <button onClick={() => setDiscountType('flat')} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${discountType === 'flat' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-muted text-muted-foreground'}`}>
                  <DollarSign size={11} className="inline mr-1" />Flat (₹)
                </button>
              </div>
              <input type="number" min={0} className="crm-input text-sm w-full"
                placeholder={discountType === 'percent' ? 'e.g. 10 for 10%' : 'e.g. 5000'}
                value={discountVal || ''}
                onChange={e => setDiscountVal(+e.target.value)} />
            </div>

            {/* Status */}
            <div className="crm-card">
              <h3 className="font-semibold text-sm mb-3">Quote Status</h3>
              <div className="space-y-1.5">
                {[
                  { s: 'DRAFT',    color: '#6366f1' },
                  { s: 'SENT',     color: '#3b82f6' },
                  { s: 'ACCEPTED', color: '#22c55e' },
                  { s: 'REJECTED', color: '#ef4444' },
                ].map(({ s, color }) => (
                  <div key={s} className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ background: 'rgb(var(--background))' }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: s === 'DRAFT' ? color : 'rgb(var(--border))' }} />
                    <span className={`font-semibold ${s === 'DRAFT' ? '' : 'text-muted'}`} style={s === 'DRAFT' ? { color } : {}}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
