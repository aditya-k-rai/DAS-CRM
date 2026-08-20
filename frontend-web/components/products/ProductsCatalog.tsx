'use client';

import { useState } from 'react';
import { Search, Tag, Package, MoreHorizontal, Star, Plus, Edit2, Trash2, FolderPlus, Layers, ShieldCheck, Check, Sparkles, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ProductsCatalogProps {
  isAdmin?: boolean;
}

interface ProductItemWeb {
  id: string;
  name: string;
  sku: string;
  category: string;
  subCategory: string;
  price: number;
  unit: string;
  stock: number | null;
  minOrderQty: number;
  rating: number;
  sold: number;
  taxRate: number;
  isActive: boolean;
  coverImage: string;
  overview: string;
  specs: string[];
  volumeDiscounts: { tier: string; minQty: number; discountPct: number; finalPrice: number }[];
}

const INITIAL_PRODUCTS: ProductItemWeb[] = [
  {
    id: '1',
    name: 'DAS CRM Enterprise Suite',
    sku: 'DAS-ENT-001',
    category: 'Software & Cloud',
    subCategory: 'Enterprise Licenses',
    price: 49999,
    unit: 'per license/yr',
    stock: 250,
    minOrderQty: 1,
    rating: 4.9,
    sold: 142,
    taxRate: 18,
    isActive: true,
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    overview: 'Full-stack enterprise CRM solution featuring automated lead scoring, multi-level workforce hierarchy controls, real-time telemetry, and anti-tamper attendance verification.',
    specs: ['Unlimited User Seats', 'AI Telemetry Engine Enabled', 'Server-Authoritative Time Sync', '24/7 Dedicated Account Manager'],
    volumeDiscounts: [
      { tier: '1 - 9 Units', minQty: 1, discountPct: 0, finalPrice: 49999 },
      { tier: '10 - 49 Units', minQty: 10, discountPct: 15, finalPrice: 42499 },
      { tier: '50+ Units', minQty: 50, discountPct: 30, finalPrice: 34999 },
    ],
  },
  {
    id: '2',
    name: 'AI Lead Scoring Engine Pro',
    sku: 'AI-LSE-002',
    category: 'Software & Cloud',
    subCategory: 'AI Add-ons',
    price: 14999,
    unit: 'per month',
    stock: 500,
    minOrderQty: 1,
    rating: 4.8,
    sold: 89,
    taxRate: 18,
    isActive: true,
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    overview: 'Predictive machine learning engine that calculates real-time lead score (0-100) based on telemetry interactions, call frequency, and WhatsApp engagements.',
    specs: ['Predictive Lead Conversion Model', 'Automated Hot Lead Alerts', 'Custom Scoring Rules Configurator'],
    volumeDiscounts: [
      { tier: '1 - 5 Units', minQty: 1, discountPct: 0, finalPrice: 14999 },
      { tier: '6 - 20 Units', minQty: 6, discountPct: 10, finalPrice: 13499 },
    ],
  },
  {
    id: '3',
    name: 'WhatsApp Automation Bot Engine',
    sku: 'WA-BOT-003',
    category: 'Automation & APIs',
    subCategory: 'Messaging Gateways',
    price: 8999,
    unit: 'per month',
    stock: 1000,
    minOrderQty: 1,
    rating: 4.7,
    sold: 215,
    taxRate: 18,
    isActive: true,
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    overview: 'Direct WhatsApp Cloud API integration with AI Humanize message generator, catalog sharing, and automated 15-day call date follow-up scheduling.',
    specs: ['Official Meta Business API Connector', 'Interactive Template Builder', 'Automated Follow-up Scheduler'],
    volumeDiscounts: [
      { tier: '1 - 9 Units', minQty: 1, discountPct: 0, finalPrice: 8999 },
      { tier: '10+ Units', minQty: 10, discountPct: 20, finalPrice: 7199 },
    ],
  },
  {
    id: '4',
    name: 'Cloud Telemetry License',
    sku: 'CLOUD-TEL-004',
    category: 'Infrastructure',
    subCategory: 'Cloud Storage',
    price: 4999,
    unit: 'per month',
    stock: 750,
    minOrderQty: 1,
    rating: 4.6,
    sold: 67,
    taxRate: 18,
    isActive: true,
    coverImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    overview: 'High-availability secure storage for call audio recordings, selfie attendance verification images, and automated audit logs.',
    specs: ['256-bit AES Encryption', 'Automatic 30-Day Backup Retention', 'SOC2 Compliant Cloud Vault'],
    volumeDiscounts: [
      { tier: '1 - 10 Units', minQty: 1, discountPct: 0, finalPrice: 4999 },
    ],
  },
];

export function ProductsCatalog({ isAdmin = true }: ProductsCatalogProps) {
  const [products, setProducts] = useState<ProductItemWeb[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<string[]>(['All', 'Software & Cloud', 'Automation & APIs', 'Infrastructure', 'Services']);
  const [subCategories, setSubCategories] = useState<Record<string, string[]>>({
    'Software & Cloud': ['Enterprise Licenses', 'AI Add-ons', 'SaaS Subscriptions'],
    'Automation & APIs': ['Messaging Gateways', 'Workflow Engines'],
    'Infrastructure': ['Cloud Storage', 'Telemetry Nodes'],
    'Services': ['Onboarding', 'Training'],
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [search, setSearch] = useState('');

  // Inspector Modal State
  const [inspectorProduct, setInspectorProduct] = useState<ProductItemWeb | null>(null);

  // Delete confirmation modal state
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<ProductItemWeb | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Product Modal State
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Software & Cloud');
  const [newProdSubCategory, setNewProdSubCategory] = useState('Enterprise Licenses');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('100');
  const [newProdGst, setNewProdGst] = useState('18');

  // New Category / Sub-Category Modal State
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createSubCategoryOpen, setCreateSubCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newSubCatName, setNewSubCatName] = useState('');
  const [parentCatForSub, setParentCatForSub] = useState('Software & Cloud');

  const filtered = products.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSubCat = selectedSubCategory === 'All' || p.subCategory === selectedSubCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSubCat && matchSearch;
  });

  const handleCreateProduct = () => {
    if (!newProdName.trim() || !newProdSku.trim() || !newProdPrice) {
      alert('Please fill out Product Name, SKU, and Price.');
      return;
    }

    const priceNum = parseFloat(newProdPrice) || 0;
    const newProd: ProductItemWeb = {
      id: Date.now().toString(),
      name: newProdName.trim(),
      sku: newProdSku.trim().toUpperCase(),
      category: newProdCategory,
      subCategory: newProdSubCategory,
      price: priceNum,
      unit: 'per license',
      stock: parseInt(newProdStock) || 100,
      minOrderQty: 1,
      rating: 5.0,
      sold: 0,
      taxRate: parseInt(newProdGst) || 18,
      isActive: true,
      coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      overview: 'Newly created product item in DAS CRM Catalog.',
      specs: ['Standard License', 'DAS CRM Certified'],
      volumeDiscounts: [
        { tier: '1 - 9 Units', minQty: 1, discountPct: 0, finalPrice: priceNum },
        { tier: '10+ Units', minQty: 10, discountPct: 15, finalPrice: Math.round(priceNum * 0.85) },
      ],
    };

    setProducts(prev => [newProd, ...prev]);
    setCreateProductOpen(false);
    setNewProdName('');
    setNewProdSku('');
    setNewProdPrice('');
    alert(`✅ Product "${newProd.name}" added successfully to catalog!`);
  };

  // ─── Admin Delete Product (permanently removes from database) ───────────────
  const handleDeleteProduct = async (product: ProductItemWeb) => {
    if (!isAdmin) {
      alert('⛔ Access Denied: Only Admins can delete products.');
      return;
    }
    setDeleteConfirmProduct(product);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmProduct) return;
    setIsDeleting(true);
    try {
      // Call backend DELETE /api/products/:id
      const response = await fetch(`/api/products/${deleteConfirmProduct.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok || response.status === 200) {
        // Optimistic UI: remove from local state immediately
        setProducts(prev => prev.filter(p => p.id !== deleteConfirmProduct.id));
        if (inspectorProduct?.id === deleteConfirmProduct.id) setInspectorProduct(null);
        alert(`🗑️ Product "${deleteConfirmProduct.name}" has been permanently deleted from the database.`);
      } else if (response.status === 403) {
        alert('⛔ Access Denied: Only Admins can delete products.');
      } else if (response.status === 404) {
        alert('⚠️ Product not found. It may have already been deleted.');
        setProducts(prev => prev.filter(p => p.id !== deleteConfirmProduct.id));
      } else {
        // Fallback: delete from local state anyway (offline mode)
        setProducts(prev => prev.filter(p => p.id !== deleteConfirmProduct.id));
        if (inspectorProduct?.id === deleteConfirmProduct.id) setInspectorProduct(null);
        alert(`🗑️ Product "${deleteConfirmProduct.name}" deleted (offline mode).`);
      }
    } catch (err) {
      // Network error: still remove from local state (offline-first)
      setProducts(prev => prev.filter(p => p.id !== deleteConfirmProduct.id));
      if (inspectorProduct?.id === deleteConfirmProduct.id) setInspectorProduct(null);
      alert(`🗑️ Product "${deleteConfirmProduct.name}" deleted from local catalog.`);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmProduct(null);
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const trimmed = newCatName.trim();
    if (!categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed]);
      setSubCategories(prev => ({ ...prev, [trimmed]: [] }));
    }
    setCreateCategoryOpen(false);
    setNewCatName('');
    alert(`✅ Category "${trimmed}" added!`);
  };

  const handleAddSubCategory = () => {
    if (!newSubCatName.trim()) return;
    const trimmed = newSubCatName.trim();
    setSubCategories(prev => {
      const existing = prev[parentCatForSub] || [];
      return { ...prev, [parentCatForSub]: [...existing, trimmed] };
    });
    setCreateSubCategoryOpen(false);
    setNewSubCatName('');
    alert(`✅ Sub-Category "${trimmed}" added under "${parentCatForSub}"!`);
  };

  return (
    <div className="space-y-4">
      {/* Quick Action & Summary Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Package className="text-brand-400" size={22} />
            <span>Product &amp; Catalog Management</span>
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {products.length} Products
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCreateCategoryOpen(true)}
            className="btn-secondary text-xs gap-1.5 flex items-center"
          >
            <FolderPlus size={14} /> + Category
          </button>

          <button
            onClick={() => setCreateSubCategoryOpen(true)}
            className="btn-secondary text-xs gap-1.5 flex items-center"
          >
            <Layers size={14} /> + Sub-Category
          </button>

          <button
            onClick={() => setCreateProductOpen(true)}
            className="btn-primary text-xs gap-1.5 flex items-center shadow-lg shadow-brand/20"
          >
            <Plus size={14} /> Create Product
          </button>
        </div>
      </div>

      {/* Main Catalog Card */}
      <div className="crm-card p-0 overflow-hidden">
        {/* Category & Sub-Category Tree Filter Bar */}
        <div className="p-4 border-b space-y-3 bg-slate-900/60" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category:</span>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => {
                  setSelectedCategory(c);
                  setSelectedSubCategory('All');
                }}
                className={`pill-tab text-xs py-1 px-3 ${selectedCategory === c ? 'active' : ''}`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Sub-Category Tree Bar */}
          {selectedCategory !== 'All' && subCategories[selectedCategory] && (
            <div className="flex items-center gap-2 flex-wrap pt-1 pl-4 border-l-2 border-indigo-500">
              <span className="text-xs font-bold text-indigo-400">Sub-Category:</span>
              <button
                onClick={() => setSelectedSubCategory('All')}
                className={`pill-tab text-xs py-0.5 px-2.5 ${selectedSubCategory === 'All' ? 'active' : ''}`}
              >
                All Sub-Categories
              </button>
              {subCategories[selectedCategory].map(sc => (
                <button
                  key={sc}
                  onClick={() => setSelectedSubCategory(sc)}
                  className={`pill-tab text-xs py-0.5 px-2.5 ${selectedSubCategory === sc ? 'active' : ''}`}
                >
                  {sc}
                </button>
              ))}
            </div>
          )}

          <div className="relative max-w-sm pt-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="crm-input pl-9 h-9 text-sm"
              placeholder="Search product name, SKU, or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Product Name &amp; SKU</th>
                <th>Category / Sub-Category</th>
                <th>Unit Price</th>
                <th>Tax Rate</th>
                <th>Stock Qty</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <img src={p.coverImage} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-slate-800" />
                      <div>
                        <p className="font-bold text-sm text-white hover:text-indigo-400 cursor-pointer" onClick={() => setInspectorProduct(p)}>
                          {p.name}
                        </p>
                        <span className="text-xs font-mono text-slate-400">SKU: {p.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {p.category}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.subCategory}</p>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="font-bold text-sm text-emerald-400">
                        ₹{p.price.toLocaleString('en-IN')}
                      </span>
                      <p className="text-[11px] text-slate-400">{p.unit}</p>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-bold text-slate-300">{p.taxRate}% GST</span>
                  </td>
                  <td>
                    <span className="text-xs font-bold text-slate-200">{p.stock ? `${p.stock} units` : 'Unlimited'}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-white">{p.rating}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setInspectorProduct(p)}
                        className="btn-secondary text-xs py-1 px-2.5 gap-1"
                      >
                        🔍 Inspect
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="text-xs py-1 px-2.5 rounded-lg font-bold transition-all bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 hover:border-red-500 hover:text-red-300 flex items-center gap-1"
                          title="Admin: Permanently delete this product from database"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔍 FULL PRODUCT SPECIFICATION INSPECTOR MODAL */}
      {inspectorProduct && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img src={inspectorProduct.coverImage} alt={inspectorProduct.name} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                <div>
                  <h3 className="text-lg font-extrabold text-white">{inspectorProduct.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">SKU: {inspectorProduct.sku} • {inspectorProduct.category}</p>
                </div>
              </div>
              <button onClick={() => setInspectorProduct(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800">
                <X size={18} />
              </button>
            </div>

            {/* Overview & Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Unit Base Price</span>
                <p className="text-2xl font-extrabold text-emerald-400">₹{inspectorProduct.price.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-400">{inspectorProduct.unit} • {inspectorProduct.taxRate}% GST Tax Included</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory &amp; MOQ</span>
                <p className="text-lg font-bold text-white">Stock: {inspectorProduct.stock ? `${inspectorProduct.stock} Available` : 'Digital Cloud License'}</p>
                <p className="text-xs text-slate-400">Minimum Order Qty: {inspectorProduct.minOrderQty} unit</p>
              </div>
            </div>

            {/* Product Overview */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Product Description &amp; Overview</h4>
              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                {inspectorProduct.overview}
              </p>
            </div>

            {/* Technical Specifications List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Key Features &amp; Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {inspectorProduct.specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Volume Discount Tier Pricing Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">📊 Volume Discount Tier Pricing</h4>
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Quantity Tier</th>
                      <th className="p-2.5">Discount %</th>
                      <th className="p-2.5">Final Tier Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {inspectorProduct.volumeDiscounts.map((tier, idx) => (
                      <tr key={idx} className="hover:bg-slate-950/40">
                        <td className="p-2.5 font-bold text-white">{tier.tier}</td>
                        <td className="p-2.5 text-amber-400 font-semibold">{tier.discountPct}% OFF</td>
                        <td className="p-2.5 font-extrabold text-emerald-400">₹{tier.finalPrice.toLocaleString('en-IN')} / unit</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {isAdmin && inspectorProduct && (
                <button
                  onClick={() => {
                    setInspectorProduct(null);
                    handleDeleteProduct(inspectorProduct);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl transition-all"
                >
                  <Trash2 size={13} /> Delete Product Permanently
                </button>
              )}
              <button onClick={() => setInspectorProduct(null)} className="btn-primary text-xs px-5 ml-auto">Close Inspector</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {createProductOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>📦 Create New Product Item</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Product Name</label>
                <input
                  type="text"
                  className="crm-input w-full"
                  placeholder="e.g. DAS CRM Enterprise License"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">SKU Code</label>
                  <input
                    type="text"
                    className="crm-input w-full uppercase font-mono"
                    placeholder="e.g. DAS-ENT-005"
                    value={newProdSku}
                    onChange={e => setNewProdSku(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Unit Price (₹)</label>
                  <input
                    type="number"
                    className="crm-input w-full font-bold text-emerald-400"
                    placeholder="49999"
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Category</label>
                  <select
                    className="crm-input w-full"
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value)}
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Sub-Category</label>
                  <input
                    type="text"
                    className="crm-input w-full"
                    placeholder="e.g. Enterprise Licenses"
                    value={newProdSubCategory}
                    onChange={e => setNewProdSubCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Stock Qty</label>
                  <input
                    type="number"
                    className="crm-input w-full"
                    value={newProdStock}
                    onChange={e => setNewProdStock(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">GST Tax %</label>
                  <select
                    className="crm-input w-full"
                    value={newProdGst}
                    onChange={e => setNewProdGst(e.target.value)}
                  >
                    <option value="0">0% GST</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setCreateProductOpen(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleCreateProduct} className="btn-primary text-xs">Save &amp; Add Product</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {createCategoryOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📁 Add New Category</span>
            </h3>
            <input
              type="text"
              className="crm-input w-full text-xs font-semibold"
              placeholder="e.g. Software & Cloud"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setCreateCategoryOpen(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleAddCategory} className="btn-primary text-xs">Save Category</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SUB-CATEGORY MODAL */}
      {createSubCategoryOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📂 Add Sub-Category</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Select Parent Category</label>
                <select
                  className="crm-input w-full"
                  value={parentCatForSub}
                  onChange={e => setParentCatForSub(e.target.value)}
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Sub-Category Name</label>
                <input
                  type="text"
                  className="crm-input w-full font-semibold"
                  placeholder="e.g. AI Add-ons"
                  value={newSubCatName}
                  onChange={e => setNewSubCatName(e.target.value)}
                />
              </div>
            </div>
              <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setCreateSubCategoryOpen(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleAddSubCategory} className="btn-primary text-xs">Save Sub-Category</button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ ADMIN DELETE CONFIRMATION MODAL */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            {/* Warning Header */}
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Delete Product Permanently?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action <strong className="text-red-400">cannot be undone</strong>. The product will be permanently removed from the database and will no longer be visible to anyone.</p>
              </div>
            </div>

            {/* Product Info Card */}
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 space-y-1">
              <p className="text-xs font-bold text-white">📦 {deleteConfirmProduct.name}</p>
              <p className="text-[11px] font-mono text-slate-400">SKU: {deleteConfirmProduct.sku} • {deleteConfirmProduct.category}</p>
              <p className="text-[11px] text-emerald-400 font-bold">₹{deleteConfirmProduct.price.toLocaleString('en-IN')} / {deleteConfirmProduct.unit}</p>
            </div>

            {/* Admin Badge */}
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-amber-400" />
              <span className="text-[11px] font-bold text-amber-300">Admin-Only Action — Permanently deletes from production database</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                disabled={isDeleting}
                className="btn-secondary text-xs flex-1"
              >
                Cancel — Keep Product
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={13} />
                {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
