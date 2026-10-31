'use client';

/**
 * MarketplaceModal.tsx
 * Replicates the roomform.ai Marketplace modal and AI 3D Generation wizard
 * as seen in screenshots:
 * - Screenshot 2026-10-31 133111.png (Catalog / Search empty/loading state)
 * - Screenshot 2026-10-31 133134.png (Marketplace product listings search results)
 * - Screenshot 2026-10-31 133151.png & 133203.png (Product details view)
 * - Screenshot 2026-10-31 133215.png (Processing Image modal)
 * - Screenshot 2026-10-31 133229.png (Segmented Image Preview modal)
 * - Screenshot 2026-10-31 133337.png (AI-Estimated Dimensions modal)
 * - Screenshot 2026-10-31 133348.png & 133403.png (Model generation initiated)
 */

import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ExternalLink,
  Sparkles,
  Check,
  Star,
  Layers,
  Info,
  Loader2,
  Box,
} from 'lucide-react';

export interface MarketplaceProduct {
  id: string;
  name: string;
  retailer: string;
  retailerColor: string;
  priceUSD: number;
  discountPct?: number;
  rating: number;
  reviewCount: number;
  distanceInfo: string;
  imageUrl: string;
  segmentedImageUrl?: string;
  modelUrl?: string;
  category: 'seating' | 'tables' | 'beds' | 'storage' | 'lighting' | 'decor';
  dimensions: { width: number; depth: number; height: number }; // in inches
  color: string;
  material: string;
  features: string[];
  description: string;
}

export const MARKETPLACE_ITEMS: MarketplaceProduct[] = [
  {
    id: 'bixler-sofa',
    name: 'Bixler Sofa',
    retailer: 'Homemakers Furniture',
    retailerColor: 'bg-orange-500 text-white',
    priceUSD: 399.99,
    discountPct: 47,
    rating: 4.9,
    reviewCount: 113,
    distanceInfo: 'Also nearby',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    segmentedImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/api/interior/models/Long%20Sofa.glb',
    category: 'seating',
    dimensions: { width: 72, depth: 34, height: 32 },
    color: '#3d5c3a',
    material: 'Green Textured Upholstery Fabric',
    features: ['Also nearby', '47% OFF', 'Solid hardwood frame', 'High-resilience foam cushions'],
    description: 'The Bixler Sofa blends mid-century modern profile with plush comfort. Tailored in an olive-green performance fabric with tapered dark walnut legs.',
  },
  {
    id: 'gojane-sofa',
    name: 'GOJANE 112.2 in. Sq...',
    retailer: 'Home Depot',
    retailerColor: 'bg-amber-600 text-white',
    priceUSD: 738.0,
    rating: 2.1,
    reviewCount: 14,
    distanceInfo: 'Nearby, 3 mi',
    imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/api/interior/models/84-couch-3dsmax-.glb',
    category: 'seating',
    dimensions: { width: 112, depth: 64, height: 34 },
    color: '#2e4a36',
    material: 'L-Shaped Sectional with Ottoman',
    features: ['Sectional Ottoman included', 'Pocket-coil spring core'],
    description: 'Spacious L-shaped modular sectional sofa in dark green fabric.',
  },
  {
    id: 'bobs-sofa-1',
    name: "Bob's Discount Furn...",
    retailer: "Bob's Discount Furniture",
    retailerColor: 'bg-red-600 text-white',
    priceUSD: 399.0,
    rating: 4.8,
    reviewCount: 94,
    distanceInfo: 'Nearby, 2 mi',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/api/interior/models/Single%20Sofa.glb',
    category: 'seating',
    dimensions: { width: 84, depth: 36, height: 35 },
    color: '#414833',
    material: 'Chenille Weave in Moss Green',
    features: ['Bob-O-Pedic Memory Foam', 'Stain-resistant treatment'],
    description: 'Cozy living room sofa with dual accent pillows and durable upholstery.',
  },
  {
    id: 'corduroy-cloud',
    name: 'Corduroy Cloud Mo...',
    retailer: 'Wayfair',
    retailerColor: 'bg-purple-600 text-white',
    priceUSD: 549.99,
    discountPct: 5,
    rating: 4.6,
    reviewCount: 78,
    distanceInfo: 'Free Delivery',
    imageUrl: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/api/interior/models/84-couch-3dsmax-.glb',
    category: 'seating',
    dimensions: { width: 90, depth: 40, height: 32 },
    color: '#556b2f',
    material: 'Wide Rib Corduroy',
    features: ['Down-alternative fill', 'Modular deep seat'],
    description: 'Ultra-soft corduroy cloud couch offering effortless sink-in relaxation.',
  },
  {
    id: 'ikea-morabo',
    name: 'IKEA Morabo Sofa',
    retailer: 'IKEA',
    retailerColor: 'bg-blue-600 text-white',
    priceUSD: 799.0,
    rating: 4.0,
    reviewCount: 340,
    distanceInfo: 'Nearby, 6 mi',
    imageUrl: 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/api/interior/models/Long%20Sofa.glb',
    category: 'seating',
    dimensions: { width: 81, depth: 36, height: 32 },
    color: '#365314',
    material: 'Grann/Bomstad Leather & Fabric',
    features: ['10-year warranty', 'Pocket springs'],
    description: 'Scandinavian minimalist sofa with clean lines and chrome metal legs.',
  },
  {
    id: 'midcentury-walmart',
    name: '110 inch Midcentury ...',
    retailer: 'Walmart - Noelse Shop',
    retailerColor: 'bg-blue-500 text-white',
    priceUSD: 319.99,
    discountPct: 42,
    rating: 3.5,
    reviewCount: 22,
    distanceInfo: 'Free 2-day delivery',
    imageUrl: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/api/interior/models/84-couch-3dsmax-.glb',
    category: 'seating',
    dimensions: { width: 110, depth: 35, height: 33 },
    color: '#1b4332',
    material: 'Forest Green Linen Blend',
    features: ['Extra-wide seating', 'Removable cushion covers'],
    description: 'Contemporary large-scale living room sofa with tapered wood feet.',
  },
  {
    id: 'homy-casa',
    name: 'Homy Casa DDSMY...',
    retailer: 'Home Depot',
    retailerColor: 'bg-amber-600 text-white',
    priceUSD: 1425.37,
    rating: 4.0,
    reviewCount: 42,
    distanceInfo: 'Nearby, 3 mi',
    imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/api/interior/models/Long%20Sofa.glb',
    category: 'seating',
    dimensions: { width: 104, depth: 70, height: 35 },
    color: '#2d6a4f',
    material: 'Deep Green Velvet Modular',
    features: ['Reversible chaise lounge', 'Solid steel bracket joints'],
    description: 'Luxury sectional with chaise designed for family lounges.',
  },
  {
    id: 'christopher-knight',
    name: 'Christopher Knight ...',
    retailer: 'Target',
    retailerColor: 'bg-red-500 text-white',
    priceUSD: 659.99,
    discountPct: 47,
    rating: 4.2,
    reviewCount: 180,
    distanceInfo: 'In stock nearby',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/api/interior/models/Single%20Sofa.glb',
    category: 'seating',
    dimensions: { width: 76, depth: 33, height: 32 },
    color: '#344e41',
    material: 'Sage Brushed Fabric',
    features: ['Mid-century tufting', 'Sturdy rubberwood legs'],
    description: 'Elegant apartment sofa with channel-tufted cushions and wood accent base.',
  },
  {
    id: 'bobs-discount-2',
    name: "Bob's Discount Furn...",
    retailer: "Bob's Discount Furniture",
    retailerColor: 'bg-red-600 text-white',
    priceUSD: 998.0,
    rating: 4.8,
    reviewCount: 65,
    distanceInfo: 'Nearby, 2 mi',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/api/interior/models/Long%20Sofa.glb',
    category: 'seating',
    dimensions: { width: 94, depth: 38, height: 36 },
    color: '#283618',
    material: '2-Piece Living Room Set',
    features: ['Dual sofa + loveseat ensemble'],
    description: 'Complete living room pairing in matching deep olive green tone.',
  },
  {
    id: 'corduroy-loveseat',
    name: '83" Corduroy Loves...',
    retailer: 'Walmart - Ecohom',
    retailerColor: 'bg-blue-500 text-white',
    priceUSD: 245.99,
    discountPct: 52,
    rating: 2.9,
    reviewCount: 16,
    distanceInfo: 'Free Shipping',
    imageUrl: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/api/interior/models/84-couch-3dsmax-.glb',
    category: 'seating',
    dimensions: { width: 83, depth: 34, height: 31 },
    color: '#386641',
    material: 'Ribbed Corduroy',
    features: ['High-density sponge', 'Tool-free 15 min assembly'],
    description: 'Compact 83-inch loveseat couch tailored for modern apartments.',
  },
  {
    id: 'dane-deep-seat',
    name: 'Dane Deep Seat Tuft...',
    retailer: 'Chita Living',
    retailerColor: 'bg-amber-700 text-white',
    priceUSD: 1249.0,
    discountPct: 26,
    rating: 5.0,
    reviewCount: 88,
    distanceInfo: 'In stock',
    imageUrl: 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/api/interior/models/84-couch-3dsmax-.glb',
    category: 'seating',
    dimensions: { width: 88, depth: 42, height: 34 },
    color: '#1a3a2a',
    material: 'Top-Grain Italian Velvet',
    features: ['Feather down blend', 'Solid birch frame'],
    description: 'Architectural deep-seat statement sofa with hand-tufted backrest.',
  },
  {
    id: 'ikea-morabo-w',
    name: 'IKEA Morabo Sofa w...',
    retailer: 'IKEA',
    retailerColor: 'bg-blue-600 text-white',
    priceUSD: 1149.0,
    rating: 3.2,
    reviewCount: 65,
    distanceInfo: 'Nearby, 21 mi',
    imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/api/interior/models/Long%20Sofa.glb',
    category: 'seating',
    dimensions: { width: 98, depth: 60, height: 32 },
    color: '#2d4a22',
    material: 'Sofa with Chaise Lounge',
    features: ['Removable washable covers'],
    description: 'Morabo sectional with chaise lounge in green fabric.',
  },
];

interface MarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartModelGeneration: (product: MarketplaceProduct, customDims: { width: number; depth: number; height: number }) => void;
}

type ModalFlowStep =
  | 'catalog'
  | 'productDetail'
  | 'processingImage'
  | 'segmentedPreview'
  | 'estimatedDimensions';

export function MarketplaceModal({
  isOpen,
  onClose,
  onStartModelGeneration,
}: MarketplaceModalProps) {
  const [currentStep, setCurrentStep] = useState<ModalFlowStep>('catalog');
  const [searchQuery, setSearchQuery] = useState('green couch');
  const [activeCatalogTab, setActiveCatalogTab] = useState<'web' | 'official' | 'all'>('web');
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(MARKETPLACE_ITEMS[0]);
  const [dimUnits, setDimUnits] = useState<'in' | 'ft' | 'm'>('in');
  const [customDims, setCustomDims] = useState<{ width: number; depth: number; height: number }>({
    width: 72,
    depth: 34,
    height: 32,
  });

  if (!isOpen) return null;

  // Open product detail
  const handleSelectProduct = (prod: MarketplaceProduct) => {
    setSelectedProduct(prod);
    setCustomDims(prod.dimensions);
    setCurrentStep('productDetail');
  };

  // Launch AI Generation Wizard
  const handleStartAIGeneration = () => {
    setCurrentStep('processingImage');
    // Progress automatically after short realistic delay
    setTimeout(() => {
      setCurrentStep('segmentedPreview');
    }, 1400);
  };

  const handleProceedToDimensions = () => {
    setCurrentStep('estimatedDimensions');
  };

  const handleFinishGeneration = () => {
    if (selectedProduct) {
      onStartModelGeneration(selectedProduct, customDims);
    }
    onClose();
    setCurrentStep('catalog');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white text-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* ═══════════════════════════════════════════════════════════════
            FLOW 1: CATALOG SEARCH VIEW (Screenshot 2026-10-31 133134.png)
            ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 'catalog' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Top Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
                <h2 className="text-base font-bold text-slate-900 ml-1">Marketplace</h2>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-xl flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search models..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Search size={13} />
                  <span>Search</span>
                </button>

                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <SlidersHorizontal size={13} />
                  <span>Filters</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
                  >
                    <span>Sort: Relevance</span>
                    <ChevronDown size={13} />
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-Header Tabs & Location */}
            <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveCatalogTab('web')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeCatalogTab === 'web'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span className="text-xs">🌐</span>
                  <span>Web</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCatalogTab('official')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeCatalogTab === 'official'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Check size={13} className="text-blue-500" />
                  <span>Official Partners</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCatalogTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeCatalogTab === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Layers size={13} />
                  <span>All</span>
                </button>
              </div>

              {/* Location Pill */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs font-medium">
                <MapPin size={12} className="text-red-500" />
                <span>New York City</span>
              </div>
            </div>

            {/* Product Cards Grid (Screenshot 133134) */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {MARKETPLACE_ITEMS.filter(item =>
                  !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.material.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(product => (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="group bg-white rounded-2xl border border-slate-200 hover:border-orange-500/80 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Retailer Header Tag */}
                      <div className="p-2 pb-0">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold truncate max-w-full ${product.retailerColor}`}>
                          {product.retailer}
                        </span>
                      </div>

                      {/* Product Image */}
                      <div className="relative aspect-4/3 p-3 flex items-center justify-center overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Product Title & Price */}
                      <div className="px-3 pb-1">
                        <h4 className="text-[11px] font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            ${product.priceUSD.toFixed(2)}
                          </span>
                          {product.discountPct && (
                            <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1 rounded">
                              {product.discountPct}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Info: Rating & Location */}
                    <div className="px-3 pb-2.5 pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-50">
                      <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span>{product.rating}</span>
                      </div>
                      <span className="text-blue-600/80 truncate text-[9px] font-medium">
                        {product.distanceInfo}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            FLOW 2: PRODUCT DETAIL VIEW (Screenshots 133151 & 133203)
            ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 'productDetail' && selectedProduct && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('catalog')}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 text-xs font-medium"
                >
                  <ChevronLeft size={16} />
                  <span>Back to listings</span>
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Details Body */}
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Product Large Image Preview Box */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 aspect-4/3 flex items-center justify-center overflow-hidden shadow-inner">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              {/* Product Info & Action Area */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedProduct.name}</h3>
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="text-xl font-extrabold text-blue-600 font-mono">
                      ${selectedProduct.priceUSD.toFixed(2)}
                    </span>
                    {selectedProduct.discountPct && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-600 border border-rose-200">
                        {selectedProduct.discountPct}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        size={14}
                        className={i <= Math.floor(selectedProduct.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-slate-800">{selectedProduct.rating}</span>
                  <span className="text-slate-400">({selectedProduct.reviewCount} reviews)</span>
                </div>

                {/* Retailer Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                  <span>🏪</span>
                  <span>{selectedProduct.retailer}</span>
                </div>

                {/* Description */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Description</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{selectedProduct.description}</p>
                </div>

                {/* Key Features */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">Key Features</span>
                  <div className="space-y-1">
                    {selectedProduct.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <Check size={13} className="text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => window.open('https://google.com/search?q=' + encodeURIComponent(selectedProduct.name), '_blank')}
                    className="w-full py-2.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ExternalLink size={14} />
                    <span>Visit Site</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartAIGeneration}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all group"
                  >
                    <Box size={15} />
                    <span>Generate 3D Model</span>
                  </button>

                  {/* Informational Notice */}
                  <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-700 flex items-start gap-2">
                    <Info size={14} className="shrink-0 mt-0.5 text-blue-500" />
                    <span>
                      Web products will be converted to 3D models. Quality may vary based on available product information.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            FLOW 3: PROCESSING IMAGE (Screenshot 2026-10-31 133215.png)
            ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 'processingImage' && selectedProduct && (
          <div className="flex flex-col h-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Processing Image...</h3>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Image Box with Spinner Overlay */}
            <div className="relative aspect-16/9 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center max-h-[380px]">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-full h-full object-cover opacity-40 blur-xs"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                <Loader2 size={36} className="animate-spin text-white/90" />
                <span className="text-xs font-medium text-white/80">Removing background...</span>
              </div>
            </div>

            {/* Product summary card */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">{selectedProduct.name}</h4>
                <p className="text-[11px] text-slate-500">
                  ${selectedProduct.priceUSD.toFixed(2)} from {selectedProduct.retailer}
                </p>
              </div>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-semibold text-slate-700 flex items-center gap-1"
              >
                <ExternalLink size={10} /> View Product Page
              </button>
            </div>

            {/* Status notification */}
            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
              <div>
                <span className="font-bold block">Analyzing Product...</span>
                <span className="text-[11px] text-blue-700">Estimating dimensions and identifying product details with AI.</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Cost: <span className="font-bold text-blue-600 font-mono">10 credits</span> (You have 9,235)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('productDetail')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep('segmentedPreview')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            FLOW 4: SEGMENTED IMAGE PREVIEW (Screenshot 2026-10-31 133229.png)
            ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 'segmentedPreview' && selectedProduct && (
          <div className="flex flex-col h-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Segmented Image Preview</h3>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Segmented Image (Clean cutout) */}
            <div className="aspect-16/9 bg-slate-50 rounded-2xl border border-slate-200 p-6 flex items-center justify-center overflow-hidden max-h-[380px]">
              <img
                src={selectedProduct.segmentedImageUrl || selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="max-h-full object-contain filter drop-shadow-lg"
              />
            </div>

            {/* AI Refinement Pill */}
            <button
              type="button"
              className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles size={13} />
              <span>AI Refinement</span>
            </button>

            {/* Product summary card */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">{selectedProduct.name}</h4>
                <p className="text-[11px] text-slate-500">
                  ${selectedProduct.priceUSD.toFixed(2)} from {selectedProduct.retailer}
                </p>
              </div>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-semibold text-slate-700 flex items-center gap-1"
              >
                <ExternalLink size={10} /> View Product Page
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Cost: <span className="font-bold text-blue-600 font-mono">10 credits</span> (You have 9,235)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('productDetail')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProceedToDimensions}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
                >
                  Configure Dimensions →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            FLOW 5: AI-ESTIMATED DIMENSIONS (Screenshot 2026-10-31 133337.png)
            ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 'estimatedDimensions' && selectedProduct && (
          <div className="flex flex-col h-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">AI-Estimated Dimensions</h3>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Segmented Thumbnail Strip */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-20 h-14 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shrink-0">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="max-h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{selectedProduct.name}</h4>
                  <span className="text-xs font-extrabold text-blue-600 font-mono">
                    ${selectedProduct.priceUSD.toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{selectedProduct.retailer}</p>
              </div>
            </div>

            {/* Amber AI Notice Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <span className="text-sm">💡</span>
              <div>
                <span className="font-bold text-amber-950 block">AI-Estimated Dimensions</span>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  No listing dimensions available, so we&apos;ve estimated them. Click the product name above to find exact dimensions on the retailer&apos;s website.
                </p>
              </div>
            </div>

            {/* Dimensions Configurators */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Object Dimensions (Optional)</span>
                {/* Units Toggles */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDimUnits('in')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      dimUnits === 'in' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Inches (in)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDimUnits('ft')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      dimUnits === 'ft' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Feet (ft)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDimUnits('m')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      dimUnits === 'm' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Meters (m)
                  </button>
                </div>
              </div>

              {/* 3 Input fields: Width, Depth, Height */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Width ({dimUnits})</label>
                  <input
                    type="text"
                    value={`~${customDims.width}"`}
                    onChange={e => {
                      const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || customDims.width;
                      setCustomDims({ ...customDims, width: num });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Depth ({dimUnits})</label>
                  <input
                    type="text"
                    value={`~${customDims.depth}"`}
                    onChange={e => {
                      const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || customDims.depth;
                      setCustomDims({ ...customDims, depth: num });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Height ({dimUnits})</label>
                  <input
                    type="text"
                    value={`~${customDims.height}"`}
                    onChange={e => {
                      const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || customDims.height;
                      setCustomDims({ ...customDims, height: num });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Explanatory Alignment Diagram */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500">
                <div>
                  <span className="font-bold text-slate-700 block">Width</span>
                  <span>Left ↔ Right</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">Depth</span>
                  <span>Front ↔ Back</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">Height</span>
                  <span>Bottom ↔ Top</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Cost: <span className="font-bold text-blue-600 font-mono">10 credits</span> (You have 9,235)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('segmentedPreview')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinishGeneration}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <Sparkles size={13} />
                  <span>Generate with Estimated Dims</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
