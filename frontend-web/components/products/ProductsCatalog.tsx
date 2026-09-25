'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Tag,
  Package,
  MoreHorizontal,
  Star,
  Plus,
  Edit2,
  Trash2,
  FolderPlus,
  Layers,
  ShieldCheck,
  Check,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

interface ProductsCatalogProps {
  isAdmin?: boolean;
}

export interface ProductCardDisplayConfig {
  showImage: boolean;
  showName: boolean;
  showCategory: boolean;
  showSubCategory: boolean;
  showPrice: boolean;
  showGst: boolean;
  showInStock: boolean;
  showMoq: boolean;
  showSku: boolean;
  showDescription: boolean;
  showFeatures: boolean;
  showTapHint: boolean;
}

export const DEFAULT_CARD_DISPLAY_CONFIG: ProductCardDisplayConfig = {
  showImage: true,
  showName: true,
  showCategory: true,
  showSubCategory: true,
  showPrice: true,
  showGst: true,
  showInStock: true,
  showMoq: true,
  showSku: true,
  showDescription: false, // Clean display by default as requested
  showFeatures: false,    // Clean display by default as requested
  showTapHint: true,
};

const STORAGE_CARD_CONFIG_KEY = 'das_crm_product_card_display_config_v1';
const STORAGE_VIEW_MODE_KEY = 'das_crm_product_catalog_view_mode_v1';

// Toggle Switch Component for Card Display Configuration Modal
function ToggleSwitch({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all">
      <div className="space-y-0.5 pr-3">
        <p className="text-sm font-bold text-slate-100">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? 'bg-indigo-600' : 'bg-slate-700'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

interface ProductItemWeb {
  id: string;
  name: string;
  sku: string;
  category: string;
  subCategory: string;
  brand?: string;
  color?: string;
  unit: string;
  price: number;
  stock: number | null;
  minOrderQty: number;
  rating: number;
  sold: number;
  taxRate: number;
  isActive: boolean;
  coverImage: string;
  images?: string[];
  overview: string;
  specs: string[];
  features?: string[];
  volumeDiscounts: { tier: string; minQty: number; discountPct: number; finalPrice: number }[];
}

export const UNIT_OPTIONS = [
  'Pieces (Pcs)',
  'Kilogram (Kg)',
  'Litre (Ltr)',
  'Grams (g)',
  'Metre (m)',
  'Box',
  'Pack',
  'Set',
  'Units',
  'Hours (Hrs)',
  'License',
];

export const DEFAULT_BRANDS = [
  'Generic / Unbranded',
  'DAS Technologies',
  'Apple',
  'Samsung',
  'Sony',
  'HP',
  'Dell',
  'Logitech',
  'Bosch',
  'Tata',
];

const INITIAL_PRODUCTS: ProductItemWeb[] = [];

export function ProductsCatalog({ isAdmin = true }: ProductsCatalogProps) {
  const [products, setProducts] = useState<ProductItemWeb[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<string[]>(['All', 'Software & Cloud', 'Automation & APIs', 'Infrastructure', 'Services']);
  const [subCategories, setSubCategories] = useState<Record<string, string[]>>({
    'Software & Cloud': ['Enterprise Licenses', 'AI Add-ons', 'SaaS Subscriptions'],
    'Automation & APIs': ['Messaging Gateways', 'Workflow Engines'],
    'Infrastructure': ['Cloud Storage', 'Telemetry Nodes'],
    'Services': ['Onboarding', 'Training'],
  });

  const [brands, setBrands] = useState<string[]>(DEFAULT_BRANDS);
  const [createBrandOpen, setCreateBrandOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [search, setSearch] = useState('');

  // Inspector Modal State
  const [inspectorProduct, setInspectorProduct] = useState<ProductItemWeb | null>(null);

  // Delete confirmation modal state
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<ProductItemWeb | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Card Display Configuration State ─────────────────────────────────────
  const [cardConfig, setCardConfig] = useState<ProductCardDisplayConfig>(DEFAULT_CARD_DISPLAY_CONFIG);
  const [tempConfig, setTempConfig] = useState<ProductCardDisplayConfig>(DEFAULT_CARD_DISPLAY_CONFIG);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Load View Mode from localStorage
    try {
      const savedView = localStorage.getItem(STORAGE_VIEW_MODE_KEY);
      if (savedView === 'grid' || savedView === 'table') {
        setViewMode(savedView);
      }
    } catch {}

    // 2. Load Card Config from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_CARD_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...DEFAULT_CARD_DISPLAY_CONFIG, ...parsed };
        setCardConfig(merged);
        setTempConfig(merged);
      }
    } catch {}

    // 3. Fetch products and remote card config from Backend
    const fetchCatalogData = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      try {
        const res = await fetch(`${apiBase}/products`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProducts(data.map((p: any) => ({
              id: p.id,
              name: p.name,
              sku: p.sku || 'SKU-001',
              category: p.category || 'General',
              subCategory: p.subCategory || 'Standard',
              brand: p.brand || 'Generic / Unbranded',
              color: p.color || '',
              unit: p.unit || 'Pieces (Pcs)',
              price: Number(p.price) || 0,
              stock: p.stock !== undefined ? p.stock : 100,
              minOrderQty: p.minOrderQty || 1,
              rating: p.rating || 5.0,
              sold: p.sold || 0,
              taxRate: p.taxRate || 18,
              isActive: p.isActive !== false,
              coverImage: p.imageUrl || (p.images && p.images[0]) || p.coverImage || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
              images: p.images || (p.imageUrl ? [p.imageUrl] : []),
              overview: p.description || p.overview || '',
              specs: p.features || p.specs || [],
              features: p.features || [],
              volumeDiscounts: p.volumeDiscounts || [],
            })));
          }
        }
      } catch (e) {
        console.warn('Could not fetch products:', e);
      }

      // Sync Card Display Config from Backend
      try {
        const configRes = await fetch(`${apiBase}/products/card-display-config`, { headers });
        if (configRes.ok) {
          const remoteConfig = await configRes.json();
          if (remoteConfig && typeof remoteConfig === 'object') {
            const merged = { ...DEFAULT_CARD_DISPLAY_CONFIG, ...remoteConfig };
            setCardConfig(merged);
            setTempConfig(merged);
            try {
              localStorage.setItem(STORAGE_CARD_CONFIG_KEY, JSON.stringify(merged));
            } catch {}
          }
        }
      } catch (err) {
        // Ignore network error, local config preserved
      }
    };

    fetchCatalogData();
  }, []);

  // New Product Modal State
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Software & Cloud');
  const [newProdSubCategory, setNewProdSubCategory] = useState('Enterprise Licenses');
  const [newProdBrand, setNewProdBrand] = useState('Generic / Unbranded');
  const [newProdColor, setNewProdColor] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('Pieces (Pcs)');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('100');
  const [newProdGst, setNewProdGst] = useState('18');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdFeatures, setNewProdFeatures] = useState<string[]>(['Gold Plated', 'Waterproof']);
  const [featureTagInput, setFeatureTagInput] = useState('');
  const [newProdImages, setNewProdImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
  ]);
  const [imageUploadError, setImageUploadError] = useState('');

  // New Category / Sub-Category Modal State
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createSubCategoryOpen, setCreateSubCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newSubCatName, setNewSubCatName] = useState('');
  const [parentCatForSub, setParentCatForSub] = useState('Software & Cloud');

  const filtered = products.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSubCat = selectedSubCategory === 'All' || p.subCategory === selectedSubCategory;
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
      (p.overview && p.overview.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSubCat && matchSearch;
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImageUploadError('');

    Array.from(files).forEach((file) => {
      // 1MB limit check (1,048,576 bytes)
      if (file.size > 1024 * 1024) {
        setImageUploadError(`⚠️ "${file.name}" exceeds 1MB limit. Please upload images under 1MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewProdImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setNewProdImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddFeatureTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || featureTagInput).trim();
    if (!tag) return;
    if (!newProdFeatures.includes(tag)) {
      setNewProdFeatures(prev => [...prev, tag]);
    }
    setFeatureTagInput('');
  };

  const handleRemoveFeatureTag = (tagToRemove: string) => {
    setNewProdFeatures(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleCreateProduct = async () => {
    if (!newProdName.trim() || !newProdPrice) {
      alert('Please fill out Product Name and Unit Price.');
      return;
    }

    if (newProdImages.length < 2) {
      alert('⚠️ Image Requirement: Please upload at least 2 images for the product (under 1MB each, 1080×1080px recommended).');
      return;
    }

    const priceNum = parseFloat(newProdPrice) || 0;
    const finalSku = newProdSku.trim()
      ? newProdSku.trim().toUpperCase()
      : ('DAS-' + Math.floor(100000 + Math.random() * 900000));

    const newProd: ProductItemWeb = {
      id: Date.now().toString(),
      name: newProdName.trim(),
      sku: finalSku,
      category: newProdCategory,
      subCategory: newProdSubCategory,
      brand: newProdBrand.trim() || 'Generic / Unbranded',
      color: newProdColor.trim(),
      unit: newProdUnit,
      price: priceNum,
      stock: parseInt(newProdStock) || 100,
      minOrderQty: 1,
      rating: 5.0,
      sold: 0,
      taxRate: parseInt(newProdGst) || 18,
      isActive: true,
      coverImage: newProdImages[0] || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      images: newProdImages,
      overview: newProdDescription.trim() || 'Newly created product item in DAS CRM Catalog.',
      specs: newProdFeatures.length > 0 ? newProdFeatures : ['Standard Specification'],
      features: newProdFeatures,
      volumeDiscounts: [
        { tier: '1 - 9 Units', minQty: 1, discountPct: 0, finalPrice: priceNum },
        { tier: '10+ Units', minQty: 10, discountPct: 15, finalPrice: Math.round(priceNum * 0.85) },
      ],
    };

    // Try posting to API
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      await fetch(`${apiBase}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: newProd.name,
          sku: newProd.sku,
          category: newProd.category,
          subCategory: newProd.subCategory,
          brand: newProd.brand,
          color: newProd.color,
          unit: newProd.unit,
          price: newProd.price,
          stock: newProd.stock,
          taxRate: newProd.taxRate,
          description: newProd.overview,
          features: newProd.features,
          imageUrl: newProd.coverImage,
          images: newProd.images,
        }),
      });
    } catch (err) {
      console.warn('API create product fallback to local state:', err);
    }

    setProducts(prev => [newProd, ...prev]);
    setCreateProductOpen(false);
    setNewProdName('');
    setNewProdSku('');
    setNewProdPrice('');
    setNewProdColor('');
    setNewProdDescription('');
    setNewProdFeatures(['Gold Plated', 'Waterproof']);
    alert(`✅ Product "${newProd.name}" (${newProd.sku}) added successfully to catalog!`);
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

  const handleAddBrand = () => {
    if (!newBrandName.trim()) return;
    const trimmed = newBrandName.trim();
    if (!brands.includes(trimmed)) {
      setBrands(prev => [...prev, trimmed]);
    }
    setNewProdBrand(trimmed);
    setCreateBrandOpen(false);
    setNewBrandName('');
    alert(`✅ Brand "${trimmed}" added!`);
  };

  // ─── Admin Card Display Handlers ──────────────────────────────────────────
  const handleOpenConfigModal = () => {
    if (!isAdmin) {
      alert('🔒 Admin Access Required: Only Organization Admins are permitted to configure product card display fields on this screen.');
      return;
    }
    setTempConfig({ ...cardConfig });
    setConfigModalOpen(true);
  };

  const handleSaveCardConfig = async () => {
    if (!isAdmin) {
      alert('🔒 Admin Access Required: Only Organization Admins can save card display preferences.');
      return;
    }
    setCardConfig(tempConfig);
    try {
      localStorage.setItem(STORAGE_CARD_CONFIG_KEY, JSON.stringify(tempConfig));
    } catch {}

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
    try {
      await fetch(`${apiBase}/products/card-display-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(tempConfig),
      });
    } catch (err) {
      console.warn('Could not sync card display config with backend:', err);
    }

    setConfigModalOpen(false);
    setToastMessage('✅ Display Settings Saved: Product catalog card display configuration updated successfully!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResetCardConfig = () => {
    setTempConfig(DEFAULT_CARD_DISPLAY_CONFIG);
  };

  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem(STORAGE_VIEW_MODE_KEY, mode);
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification for Display Settings Saved */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white p-1 rounded-lg"
          >
            <X size={14} />
          </button>
        </div>
      )}

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
            onClick={() => setCreateBrandOpen(true)}
            className="btn-secondary text-xs gap-1.5 flex items-center"
          >
            <Tag size={14} /> + Brand
          </button>

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

      {/* Admin Card Display Customization Action Banner */}
      <div className="w-full">
        <button
          type="button"
          onClick={handleOpenConfigModal}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-indigo-500/30 bg-slate-900/70 hover:bg-slate-900/90 transition-all text-left shadow-lg group backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg flex-shrink-0">
              ⚙️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                  Configure Product Card Display
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
                  {isAdmin ? 'ADMIN ONLY' : '🔒 ADMIN ONLY'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAdmin
                  ? 'Admin Governance: Control which attributes appear on catalog cards across the organization.'
                  : 'Only Organization Admins can configure visible screen fields & card attributes'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
              {isAdmin ? 'Customize →' : 'Locked'}
            </span>
          </div>
        </button>
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

          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <div className="relative max-w-sm flex-1 min-w-[240px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="crm-input pl-9 h-9 text-sm w-full"
                placeholder="Search product name, SKU, or category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* View Mode Switcher: Cards View vs Table View */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Switch to Card Grid View (Configurable fields)"
              >
                <LayoutGrid size={13} />
                <span>Cards View</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Switch to Tabular List View"
              >
                <TableIcon size={13} />
                <span>Table View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Products Content: Configurable Cards Grid View vs Table View */}
        {viewMode === 'grid' ? (
          <div className="p-4 sm:p-5">
            {filtered.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">📦</div>
                <p className="text-sm font-bold text-white">
                  {search ? 'No products match your search' : 'No products in your catalog yet'}
                </p>
                <p className="text-xs text-slate-400 max-w-sm">
                  {search
                    ? `No products matching "${search}".`
                    : 'Your company product catalog is ready. Create products and services to attach to proposals, send via WhatsApp, and quote to clients.'}
                </p>
                {!search && isAdmin && (
                  <button
                    onClick={() => setCreateProductOpen(true)}
                    className="mt-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Create First Product
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filtered.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setInspectorProduct(p)}
                    className="p-4 rounded-2xl flex flex-col justify-between hover:border-indigo-500/60 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer group relative overflow-hidden bg-slate-900/60 border border-slate-800/80"
                  >
                    <div className="space-y-3">
                      {/* 1. Cover Image */}
                      {cardConfig.showImage && (
                        <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                          <img
                            src={p.coverImage}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {p.images && p.images.length > 1 && (
                            <span className="absolute top-2 right-2 bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow border border-indigo-400/30">
                              +{p.images.length - 1} Photos
                            </span>
                          )}
                          <span className="absolute bottom-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm text-emerald-400 border border-emerald-500/30">
                            {p.stock && p.stock > 0 ? 'Active' : 'Out of Stock'}
                          </span>
                        </div>
                      )}

                      {/* 2. Taxonomy: Category, Sub-Category, SKU */}
                      {(cardConfig.showCategory || cardConfig.showSubCategory || cardConfig.showSku) && (
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {cardConfig.showCategory && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                📁 {p.category}
                              </span>
                            )}
                            {cardConfig.showSubCategory && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                📂 {p.subCategory}
                              </span>
                            )}
                          </div>
                          {cardConfig.showSku && (
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              {p.sku}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 3. Product Name */}
                      {cardConfig.showName && (
                        <div>
                          <h3 className="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                            {p.name}
                          </h3>
                          {p.brand && (
                            <span className="inline-block text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium mt-1">
                              🏷️ {p.brand}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 4. Price & GST */}
                      {cardConfig.showPrice && (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-extrabold text-emerald-400">
                            ₹{p.price.toLocaleString('en-IN')}
                          </span>
                          {cardConfig.showGst && (
                            <span className="text-xs text-slate-400 font-medium">
                              (+{p.taxRate}% GST)
                            </span>
                          )}
                          <span className="text-xs text-slate-500">/ {p.unit}</span>
                        </div>
                      )}

                      {/* 5. Inventory Stock & MOQ */}
                      {(cardConfig.showInStock || cardConfig.showMoq) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {cardConfig.showInStock && (
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                p.stock && p.stock >= 10
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : p.stock && p.stock > 0
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-red-500/15 text-red-300 border-red-500/30'
                              }`}
                            >
                              {p.stock && p.stock >= 10
                                ? `🟢 In Stock (${p.stock} Units)`
                                : p.stock && p.stock > 0
                                ? `⚠️ Low Stock (${p.stock} Units)`
                                : '🔴 Out of Stock'}
                            </span>
                          )}

                          {cardConfig.showMoq && (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                              📦 MOQ: {p.minOrderQty} {p.unit}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 6. Product Description */}
                      {cardConfig.showDescription && (
                        <p className="text-xs text-slate-400 line-clamp-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                          {p.overview || 'No description provided.'}
                        </p>
                      )}

                      {/* 7. Feature Specs */}
                      {cardConfig.showFeatures && p.features && p.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.features.slice(0, 3).map((feat, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800 font-medium"
                            >
                              ✓ {feat}
                            </span>
                          ))}
                          {p.features.length > 3 && (
                            <span className="text-[10px] text-slate-500 font-semibold self-center">
                              +{p.features.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer / Hint & Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {cardConfig.showTapHint ? (
                        <span className="text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                          🔍 Click Card to View Full Specs &amp; Tier Pricing →
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">
                          SKU: {p.sku}
                        </span>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(p);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Admin: Delete product"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Products Table */
          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Product / SKU</th>
                  <th>Category &amp; Brand</th>
                  <th>Price / Unit</th>
                  <th>Colour &amp; Features</th>
                  <th>Tax</th>
                  <th>Stock</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">📦</div>
                        <p className="text-sm font-bold text-white">
                          {search ? 'No products match your search' : 'No products in your catalog yet'}
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {search
                            ? `No products matching "${search}".`
                            : 'Your company product catalog is ready. Create products and services to attach to proposals, send via WhatsApp, and quote to clients.'}
                        </p>
                        {!search && isAdmin && (
                          <button
                            onClick={() => setCreateProductOpen(true)}
                            className="mt-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-1.5"
                          >
                            <Plus size={14} /> Create First Product
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img src={p.coverImage} alt={p.name} className="w-11 h-11 rounded-xl object-cover border border-slate-800" />
                          {p.images && p.images.length > 1 && (
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-extrabold px-1 rounded-full shadow" title={`${p.images.length} images`}>
                              +{p.images.length - 1}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white hover:text-indigo-400 cursor-pointer" onClick={() => setInspectorProduct(p)}>
                            {p.name}
                          </p>
                          <span className="text-[11px] font-mono text-slate-400">SKU: {p.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {p.category}
                        </span>
                        <p className="text-[11px] text-slate-400 font-semibold">{p.subCategory}</p>
                        {p.brand && (
                          <span className="inline-block text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
                            🏷️ {p.brand}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="font-bold text-sm text-emerald-400">
                          ₹{p.price.toLocaleString('en-IN')}
                        </span>
                        <p className="text-[11px] text-slate-400 font-medium">per {p.unit}</p>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1 max-w-[180px]">
                        {p.color ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"></span>
                            <span className="font-medium">{p.color}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">No color specified</span>
                        )}
                        {p.features && p.features.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {p.features.slice(0, 2).map((feat, idx) => (
                              <span key={idx} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-medium">
                                ✨ {feat}
                              </span>
                            ))}
                            {p.features.length > 2 && (
                              <span className="text-[9px] text-slate-400">+{p.features.length - 2}</span>
                            )}
                          </div>
                        )}
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
                )))}
              </tbody>
            </table>
          </div>
        )}
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
                  <p className="text-xs text-slate-400 font-mono">
                    SKU: {inspectorProduct.sku} • {inspectorProduct.category} &gt; {inspectorProduct.subCategory}
                  </p>
                </div>
              </div>
              <button onClick={() => setInspectorProduct(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Multi-Image Gallery */}
            {inspectorProduct.images && inspectorProduct.images.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Gallery ({inspectorProduct.images.length} Images)</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {inspectorProduct.images.map((imgUri, idx) => (
                    <img
                      key={idx}
                      src={imgUri}
                      alt={`Product view ${idx + 1}`}
                      className="w-20 h-20 rounded-xl object-cover border border-slate-700 flex-shrink-0 hover:scale-105 transition-transform"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Key Specs Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Brand</span>
                <p className="text-xs font-bold text-amber-300 mt-0.5">{inspectorProduct.brand || 'Generic / Unbranded'}</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Colour</span>
                <p className="text-xs font-bold text-slate-200 mt-0.5">{inspectorProduct.color || 'Standard / None'}</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Unit Type</span>
                <p className="text-xs font-bold text-indigo-400 mt-0.5">{inspectorProduct.unit}</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">SKU Code</span>
                <p className="text-xs font-bold font-mono text-slate-300 mt-0.5">{inspectorProduct.sku}</p>
              </div>
            </div>

            {/* Overview & Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Unit Base Price</span>
                <p className="text-2xl font-extrabold text-emerald-400">₹{inspectorProduct.price.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-400">per {inspectorProduct.unit} • {inspectorProduct.taxRate}% GST Tax Included</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory &amp; Stock</span>
                <p className="text-lg font-bold text-white">Stock: {inspectorProduct.stock ? `${inspectorProduct.stock} ${inspectorProduct.unit} Available` : 'Available on Demand'}</p>
                <p className="text-xs text-slate-400">Minimum Order Qty: {inspectorProduct.minOrderQty} {inspectorProduct.unit}</p>
              </div>
            </div>

            {/* Product Overview */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Product Description &amp; Overview</h4>
              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                {inspectorProduct.overview || 'No additional description provided.'}
              </p>
            </div>

            {/* Features & Specifications List */}
            {inspectorProduct.features && inspectorProduct.features.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Key Features &amp; Highlights</h4>
                <div className="flex flex-wrap gap-2">
                  {inspectorProduct.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-200 bg-slate-950 p-2 rounded-lg border border-slate-800 font-semibold">
                      <Sparkles size={13} className="text-amber-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                        <td className="p-2.5 font-extrabold text-emerald-400">₹{tier.finalPrice.toLocaleString('en-IN')} / {inspectorProduct.unit}</td>
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

      {/* 📦 CREATE NEW PRODUCT MODAL */}
      {createProductOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>📦 Create New Product Item</span>
              </h3>
              <button onClick={() => setCreateProductOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block text-slate-300 mb-1 font-bold">Product Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  className="crm-input w-full"
                  placeholder="e.g. DAS CRM Enterprise License / Gold Plated HDMI Cable"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                />
              </div>

              {/* SKU & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-bold">SKU Code (Optional)</label>
                    <span className="text-[10px] text-slate-500 italic">Auto-generated if blank</span>
                  </div>
                  <input
                    type="text"
                    className="crm-input w-full uppercase font-mono"
                    placeholder="e.g. DAS-ENT-005 (Optional)"
                    value={newProdSku}
                    onChange={e => setNewProdSku(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Unit Price (₹) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    className="crm-input w-full font-bold text-emerald-400"
                    placeholder="49999"
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Category & Sub-Category Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold">Category</label>
                    <button
                      type="button"
                      onClick={() => setCreateCategoryOpen(true)}
                      className="text-[10px] text-indigo-400 hover:underline font-bold"
                    >
                      + Add Category
                    </button>
                  </div>
                  <select
                    className="crm-input w-full"
                    value={newProdCategory}
                    onChange={e => {
                      const newCat = e.target.value;
                      setNewProdCategory(newCat);
                      const availableSubs = subCategories[newCat] || ['General'];
                      setNewProdSubCategory(availableSubs[0] || 'General');
                    }}
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold">Sub-Category (Selection)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setParentCatForSub(newProdCategory);
                        setCreateSubCategoryOpen(true);
                      }}
                      className="text-[10px] text-indigo-400 hover:underline font-bold"
                    >
                      + Add Sub-Category
                    </button>
                  </div>
                  <select
                    className="crm-input w-full font-semibold"
                    value={newProdSubCategory}
                    onChange={e => setNewProdSubCategory(e.target.value)}
                  >
                    {(subCategories[newProdCategory] && subCategories[newProdCategory].length > 0
                      ? subCategories[newProdCategory]
                      : ['General', 'Standard']
                    ).map(sc => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Brand & Colour */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-bold">Brand (Optional)</label>
                    <button
                      type="button"
                      onClick={() => setCreateBrandOpen(true)}
                      className="text-[10px] text-amber-400 hover:underline font-bold"
                    >
                      + Add Brand
                    </button>
                  </div>
                  <select
                    className="crm-input w-full"
                    value={newProdBrand}
                    onChange={e => setNewProdBrand(e.target.value)}
                  >
                    {brands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Colour (Optional)</label>
                  <input
                    type="text"
                    className="crm-input w-full"
                    placeholder="e.g. Midnight Black, Gold, Silver"
                    value={newProdColor}
                    onChange={e => setNewProdColor(e.target.value)}
                  />
                </div>
              </div>

              {/* Unit Type, Stock Qty, GST Tax % */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Unit Type</label>
                  <select
                    className="crm-input w-full"
                    value={newProdUnit}
                    onChange={e => setNewProdUnit(e.target.value)}
                  >
                    {UNIT_OPTIONS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
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

              {/* Product Description */}
              <div>
                <label className="block text-slate-300 mb-1 font-bold">Product Description</label>
                <textarea
                  rows={2}
                  className="crm-input w-full resize-none leading-relaxed"
                  placeholder="Enter detailed product description, specifications, and warranty details..."
                  value={newProdDescription}
                  onChange={e => setNewProdDescription(e.target.value)}
                />
              </div>

              {/* Key Features Chips (1-2 words like Gold Plated) */}
              <div>
                <label className="block text-slate-300 mb-1 font-bold">Features (1-2 words, e.g. Gold Plated, Waterproof)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="crm-input flex-1 text-xs"
                    placeholder="Type feature (e.g. Gold Plated) and hit Enter or click Add"
                    value={featureTagInput}
                    onChange={e => setFeatureTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeatureTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddFeatureTag()}
                    className="btn-secondary text-xs px-3 font-bold"
                  >
                    + Add Feature
                  </button>
                </div>

                {/* Suggestions Pills */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <span className="text-[10px] text-slate-500 font-semibold">Quick Add:</span>
                  {['Gold Plated', 'Waterproof', 'Wireless', 'Stainless Steel', 'Premium Cotton', '1-Year Warranty'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddFeatureTag(tag)}
                      className="text-[10px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                {/* Active Features Badges */}
                <div className="flex flex-wrap gap-1.5 min-h-[28px] p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {newProdFeatures.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">No features added yet.</span>
                  ) : (
                    newProdFeatures.map((feat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full"
                      >
                        ✨ {feat}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeatureTag(feat)}
                          className="hover:text-red-400 ml-0.5"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Product Images (2 or more upload, under 1MB, 1080x1080px) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-slate-300 font-bold">Product Images (2 or more required)</label>
                    <p className="text-[10px] text-slate-400">Under 1MB each • 1080 × 1080 px (Square recommended)</p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    newProdImages.length >= 2
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {newProdImages.length >= 2 ? `✅ ${newProdImages.length} images uploaded` : `⚠️ ${newProdImages.length}/2 min required`}
                  </span>
                </div>

                {imageUploadError && (
                  <p className="text-[11px] text-red-400 font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    {imageUploadError}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex-1 flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-700 bg-slate-950 hover:bg-slate-900 transition-colors">
                    <span className="text-xs font-bold text-indigo-400">📁 Click to Upload Product Images</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Select multiple images (Max 1MB each)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Thumbnail Previews */}
                <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {newProdImages.map((uri, idx) => (
                    <div key={idx} className="relative group flex-shrink-0">
                      <img
                        src={uri}
                        alt={`Upload preview ${idx + 1}`}
                        className="w-16 h-16 rounded-lg object-cover border border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow hover:bg-red-500"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-center text-slate-200">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setCreateProductOpen(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleCreateProduct} className="btn-primary text-xs">Save &amp; Add Product</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE BRAND MODAL */}
      {createBrandOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🏷️ Add New Brand</span>
            </h3>
            <p className="text-xs text-slate-400">Add a brand name to select across all products in your catalog.</p>
            <input
              type="text"
              className="crm-input w-full text-xs font-semibold"
              placeholder="e.g. Apple, Samsung, Sony, DAS"
              value={newBrandName}
              onChange={e => setNewBrandName(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setCreateBrandOpen(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleAddBrand} className="btn-primary text-xs">Save Brand</button>
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

      {/* ⚙️ ADMIN PRODUCT CARD DISPLAY CONFIGURATION MODAL */}
      {configModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[65] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>⚙️ Configure Product Card Display</span>
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 tracking-wider">
                    ADMIN ONLY
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Admin Governance: Control which attributes appear on catalog cards across the organization.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfigModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Clean Default View Info Callout */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-800/50 flex items-start gap-2.5">
              <span className="text-base flex-shrink-0">💡</span>
              <p className="text-xs text-indigo-200 leading-relaxed">
                <span className="font-extrabold text-white">Clean Default View:</span> Cards show Image, Name, Category, Subcategory, Price, GST, In-Stock, and MOQ. Description and specs tags are hidden by default to keep cards sleek and readable.
              </p>
            </div>

            {/* 👁️ LIVE CARD PREVIEW */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Eye size={13} /> Live Card Preview
                </span>
                <span className="text-[10px] text-slate-400 italic">Reactive preview</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#020617] border border-indigo-500/60 shadow-xl shadow-indigo-950/30 space-y-3 transition-all">
                <div className="flex items-start gap-3.5">
                  {tempConfig.showImage && (
                    <img
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80"
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {(tempConfig.showCategory || tempConfig.showSubCategory || tempConfig.showSku) && (
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {tempConfig.showCategory && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              📁 CRM &amp; Sales Software
                            </span>
                          )}
                          {tempConfig.showSubCategory && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              📂 Lead Management
                            </span>
                          )}
                        </div>
                        {tempConfig.showSku && (
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                            DAS-CRM-001
                          </span>
                        )}
                      </div>
                    )}

                    {tempConfig.showName && (
                      <h4 className="text-sm font-extrabold text-white">DAS CRM Enterprise Suite</h4>
                    )}

                    {tempConfig.showPrice && (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold text-emerald-400">₹2,999 - ₹4,999</span>
                        {tempConfig.showGst && (
                          <span className="text-[10px] text-slate-400 font-medium">(+18% GST)</span>
                        )}
                      </div>
                    )}

                    {(tempConfig.showInStock || tempConfig.showMoq) && (
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        {tempConfig.showInStock && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            🟢 In Stock (250 Units)
                          </span>
                        )}
                        {tempConfig.showMoq && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            📦 MOQ: 1 Unit(s)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {tempConfig.showDescription && (
                  <p className="text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                    Full sales automation, WhatsApp Cloud API, Email Marketing &amp; AI Lead Scoring.
                  </p>
                )}

                {tempConfig.showFeatures && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-medium bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                      ✓ Unlimited Lead Ingestion
                    </span>
                    <span className="text-[10px] font-medium bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                      ✓ WhatsApp Cloud API (100K Quota)
                    </span>
                  </div>
                )}

                {tempConfig.showTapHint && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-indigo-400">
                      🔍 Click Card to View Full Product Specs &amp; Tier Pricing →
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 1: CORE INFORMATION & IDENTIFICATION */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                1. Core Information &amp; Identification
              </h4>
              <div className="space-y-2">
                <ToggleSwitch
                  label="🖼️ Product Cover Image"
                  description="Display product image thumbnail on the card"
                  enabled={tempConfig.showImage}
                  onChange={(val) => setTempConfig(prev => ({ ...prev, showImage: val }))}
                />
                <ToggleSwitch
                  label="🏷️ Product Name"
                  description="Display product title header"
                  enabled={tempConfig.showName}
                  onChange={(val) => setTempConfig(prev => ({ ...prev, showName: val }))}
                />
                <ToggleSwitch
                  label="🔖 SKU Identifier"
                  description="Display SKU tag (e.g. DAS-CRM-001)"
                  enabled={tempConfig.showSku}
                  onChange={(val) => setTempConfig(prev => ({ ...prev, showSku: val }))}
                />
              </div>
            </div>

            {/* SECTION 2: TAXONOMY & HIERARCHY */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                2. Taxonomy &amp; Hierarchy
              </h4>
              <div className="space-y-2">
                <ToggleSwitch
                  label="📁 Parent Category Badge"
                  description="Show primary parent category pill"
                  enabled={tempConfig.showCategory}
                  onChange={(val) => setTempConfig(prev => ({ ...prev, showCategory: val }))}
                />
                <ToggleSwitch
                  label="📂 Sub-Category Badge"
                  description="Show nested sub-category classification"
                  enabled={tempConfig.showSubCategory}
                  onChange={(val) => setTempConfig(prev => ({ ...prev, showSubCategory: val }))}
                />
              </div>
            </div>

            {/* SECTION 3: PRICING, TAXES & INVENTORY */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                3. Pricing, Taxes &amp; Inventory
              </h4>
              <div className="space-y-2">
                <ToggleSwitch
                  label="💰 Price Range"
                  description="Show minimum and maximum price range"
                  enabled={tempConfig.showPrice}
                  onChange={(val) => setTempConfig(prev => ({ ...prev, showPrice: val }))}
                />
                <ToggleSwitch
                  label="🧾 GST Tax Rate"
                  description="Display tax percentage suffix (+18% GST)"
                  enabled={tempConfig.showGst}
                  onChange={(val) => setTempConfig(prev => ({ ...prev, showGst: val }))}
                />
                <ToggleSwitch
                  label="🟢 In-Stock Quantity Badge"
                  description="Show current inventory status and units count"
                  enabled={tempConfig.showInStock}
                  onChange={(val) => setTempConfig(prev => ({ ...prev, showInStock: val }))}
                />
                <ToggleSwitch
                  label="📦 Minimum Order Quantity (MOQ)"
                  description="Show minimum required units badge"
                  enabled={tempConfig.showMoq}
                  onChange={(val) => setTempConfig(prev => ({ ...prev, showMoq: val }))}
                />
              </div>
            </div>

            {/* SECTION 4: EXTENDED DETAILS (OPTIONAL CLUTTER) */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                4. Extended Details (Optional Clutter)
              </h4>
              <div className="space-y-2">
                <ToggleSwitch
                  label="📝 Product Description Text"
                  description="Display multi-line overview on card (turn OFF for clean card)"
                  enabled={tempConfig.showDescription}
                  onChange={(val) => setTempConfig(prev => ({ ...prev, showDescription: val }))}
                />
                <ToggleSwitch
                  label="⚡ Feature Specs Badges"
                  description="Display bullet tags on card (turn OFF for clean card)"
                  enabled={tempConfig.showFeatures}
                  onChange={(val) => setTempConfig(prev => ({ ...prev, showFeatures: val }))}
                />
                <ToggleSwitch
                  label="🔍 Click Card Hint"
                  description="Show footer hint for inspector modal"
                  enabled={tempConfig.showTapHint}
                  onChange={(val) => setTempConfig(prev => ({ ...prev, showTapHint: val }))}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetCardConfig}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
              >
                ↺ Reset Clean View
              </button>
              <button
                type="button"
                onClick={handleSaveCardConfig}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
              >
                💾 Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
