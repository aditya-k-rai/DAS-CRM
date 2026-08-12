'use client';

import { useState } from 'react';
import { Search, Tag, Package, MoreHorizontal, Star, Plus, Edit2, Trash2 } from 'lucide-react';

const CATEGORIES = ['All', 'Software', 'Hardware', 'Services', 'Consulting', 'SaaS'];

const PRODUCTS = [
  { id: '1', name: 'CRM Enterprise License',   sku: 'SW-001', category: 'Software',    price: 49999,  unit: 'per license/yr', stock: null,  rating: 4.8, sold: 142, taxRate: 18, isActive: true },
  { id: '2', name: 'CRM Pro License (Monthly)', sku: 'SW-002', category: 'SaaS',        price: 4999,   unit: 'per month',      stock: null,  rating: 4.6, sold: 89,  taxRate: 18, isActive: true },
  { id: '3', name: 'Android App Addon',         sku: 'SW-003', category: 'SaaS',        price: 1999,   unit: 'per month',      stock: null,  rating: 4.5, sold: 67,  taxRate: 18, isActive: true },
  { id: '4', name: 'Implementation & Onboarding', sku: 'SV-001', category: 'Services', price: 15000,  unit: 'one-time',       stock: null,  rating: 4.9, sold: 98,  taxRate: 0,  isActive: true },
  { id: '5', name: 'Data Migration Service',    sku: 'SV-002', category: 'Services',    price: 8000,   unit: 'per project',    stock: null,  rating: 4.7, sold: 43,  taxRate: 0,  isActive: true },
  { id: '6', name: 'Training Workshop (Half-Day)', sku: 'CN-001', category: 'Consulting', price: 5000, unit: 'per session',    stock: null,  rating: 4.8, sold: 31,  taxRate: 0,  isActive: true },
];

export function ProductsCatalog() {
  const [category, setCategory] = useState('All');
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = PRODUCTS.filter(p => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Products', value: PRODUCTS.length, color: 'rgb(129,140,248)' },
          { label: 'Active Products', value: PRODUCTS.filter(p=>p.isActive).length, color: 'rgb(34,197,94)' },
          { label: 'Total Units Sold', value: PRODUCTS.reduce((s,p)=>s+p.sold,0), color: 'rgb(245,158,11)' },
          { label: 'Catalog Revenue', value: '₹48.7L', color: 'rgb(167,139,250)' },
        ].map(s => (
          <div key={s.label} className="crm-card py-3">
            <p className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="crm-card p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b space-y-3" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`pill-tab text-xs py-1 px-3 ${category === c ? 'active' : ''}`}>{c}
              </button>
            ))}
          </div>
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="crm-input pl-9 h-9 text-sm" placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Tax Rate</th>
                <th>Units Sold</th>
                <th>Rating</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.12)' }}>
                        <Package size={16} style={{ color: 'rgb(129,140,248)' }} />
                      </div>
                      <p className="font-medium text-sm">{p.name}</p>
                    </div>
                  </td>
                  <td><span className="text-xs font-mono text-muted">{p.sku}</span></td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))' }}>
                      {p.category}
                    </span>
                  </td>
                  <td>
                    <div>
                      <span className="font-bold text-sm" style={{ color: 'rgb(var(--brand-400))' }}>
                        ₹{p.price.toLocaleString('en-IN')}
                      </span>
                      <p className="text-xs text-muted">{p.unit}</p>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm">{p.taxRate}% GST</span>
                  </td>
                  <td>
                    <span className="text-sm font-semibold">{p.sold} units</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Star size={12} style={{ color: 'rgb(245,158,11)', fill: 'rgb(245,158,11)' }} />
                      <span className="text-sm font-medium">{p.rating}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(34,197,94,0.12)', color: 'rgb(34,197,94)' }}>
                      Active
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center">
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center" style={{ color: 'rgb(239,68,68)' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
