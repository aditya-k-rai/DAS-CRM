'use client';

import React, { useState } from 'react';
import {
  Plus, Trash2, GripVertical, Package, Percent, DollarSign,
  FileText, Send, Eye, Download, Check, Edit2, Building2,
  UserCheck, RefreshCw, Image as ImageIcon, ShieldCheck, CreditCard, ChevronRight
} from 'lucide-react';

// ─── Interfaces ───────────────────────────────────────────────
export type DocumentType = 'QUOTATION' | 'PROFORMA_INVOICE' | 'TAX_INVOICE' | 'PAYMENT_RECEIPT' | 'CREDIT_NOTE' | 'DELIVERY_CHALLAN';

export interface CompanyDetails {
  id: string;
  name: string;
  logoUrl: string;
  address: string;
  email?: string;
  gstNo: string;
  panNo: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  branch: string;
  upiId: string;
}

export interface PartyDetails {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address: string;
  gstNo: string;
  panNo: string;
}

export interface LineItem {
  id: string;
  productName: string;
  imageUrl?: string;
  showImage: boolean;
  unit: string;
  qty: number;
  unitPrice: number;
  taxRate: number;
  discountType: 'flat' | 'percent';
  discountVal: number;
  total: number;
}

// ─── Default Mock Data ─────────────────────────────────────────
const INITIAL_COMPANIES: CompanyDetails[] = [
  {
    id: 'comp-1',
    name: 'Spectro Tech India Pvt Ltd',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60',
    address: 'Plot No. 42, Sector 18, Cyber City, Gurugram, Haryana - 122002',
    email: 'billing@spectrotech.in',
    gstNo: '06AAAAC1234F1Z9',
    panNo: 'AAAAC1234F',
    bankName: 'HDFC Bank Ltd',
    accountNo: '50200044556677',
    ifscCode: 'HDFC0000123',
    branch: 'Cyber City Branch',
    upiId: 'spectro@hdfcbank',
  },
  {
    id: 'comp-2',
    name: 'DAS CRM Technologies Enterprise',
    logoUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&auto=format&fit=crop&q=60',
    address: 'Suite 900, Tech Park Towers, Whitefield, Bengaluru, KA - 560066',
    email: 'accounts@dascrm.com',
    gstNo: '29AAAAA0000A1Z5',
    panNo: 'AAAAA0000A',
    bankName: 'ICICI Bank',
    accountNo: '0004050112233',
    ifscCode: 'ICIC0000004',
    branch: 'Whitefield Main Branch',
    upiId: 'dascrm@icici',
  },
];

const INITIAL_PARTIES: PartyDetails[] = [
  {
    id: 'party-1',
    name: 'TechCorp Solutions Pvt Ltd',
    contactPerson: 'Rajesh Varma',
    email: 'rajesh@techcorp.com',
    phone: '+91 98765 43210',
    address: 'Building 7, Mindspace IT Park, Madhapur, Hyderabad, TS - 500081',
    gstNo: '36AAACT9988K1ZP',
    panNo: 'AAACT9988K',
  },
  {
    id: 'party-2',
    name: 'LogiTech Freight Systems',
    contactPerson: 'Sunita Kapoor',
    email: 'accounts@logitechfreight.in',
    phone: '+91 98123 45678',
    address: 'Warehouse 14, JNPT Logistics Hub, Navi Mumbai, MH - 400707',
    gstNo: '27AAACL4455M1Z2',
    panNo: 'AAACL4455M',
  },
];

const CATALOG_PRODUCTS = [
  { name: 'DAS CRM Enterprise License (50 Seats)', price: 500000, tax: 18, unit: 'Set', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&auto=format&fit=crop&q=60' },
  { name: 'AI Lead Scoring & Automation Engine', price: 120000, tax: 18, unit: 'License', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&auto=format&fit=crop&q=60' },
  { name: 'WhatsApp Cloud API Gateway Setup', price: 45000, tax: 18, unit: 'Setup', image: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=200&auto=format&fit=crop&q=60' },
  { name: 'Dedicated Cloud Infrastructure Node', price: 85000, tax: 18, unit: 'Month', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&auto=format&fit=crop&q=60' },
  { name: 'Implementation & Training Workshop', price: 35000, tax: 18, unit: 'Hours', image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=200&auto=format&fit=crop&q=60' },
];

export function QuotationBuilder() {
  // Document Type Flow
  const [docType, setDocType] = useState<DocumentType>('QUOTATION');

  // Company State
  const [companies, setCompanies] = useState<CompanyDetails[]>(INITIAL_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(INITIAL_COMPANIES[0].id);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [newComp, setNewComp] = useState<Partial<CompanyDetails>>({});

  // Party State
  const [parties, setParties] = useState<PartyDetails[]>(INITIAL_PARTIES);
  const [selectedPartyId, setSelectedPartyId] = useState<string>(INITIAL_PARTIES[0].id);
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [newParty, setNewParty] = useState<Partial<PartyDetails>>({});

  // Line Items
  const [items, setItems] = useState<LineItem[]>([
    {
      id: 'item-1',
      productName: 'DAS CRM Enterprise License (50 Seats)',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&auto=format&fit=crop&q=60',
      showImage: true,
      unit: 'Set',
      qty: 1,
      unitPrice: 500000,
      taxRate: 18,
      discountType: 'percent',
      discountVal: 5,
      total: 560500,
    },
  ]);

  // Document Metadata
  const [docNo, setDocNo] = useState('QT-2026-0891');
  const [docDate, setDocDate] = useState('Aug 29, 2026');
  const [validUntilDate, setValidUntilDate] = useState('Sep 15, 2026');

  // Overall Discount & Terms
  const [overallDiscountType, setOverallDiscountType] = useState<'flat' | 'percent'>('percent');
  const [overallDiscountVal, setOverallDiscountVal] = useState(0);
  const [termsText, setTermsText] = useState(
    '1. 100% Payment required prior to license key dispatch.\n2. Goods/Services once sold are non-refundable.\n3. Subject to Gurugram / Delhi Jurisdiction.'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Selected Active Company & Party
  const activeCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];
  const activeParty = parties.find(p => p.id === selectedPartyId) || parties[0];

  // Helper Line Item Calculations
  const updateLineItem = (id: string, patch: Partial<LineItem>) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it;
        const updated = { ...it, ...patch };
        const base = updated.qty * updated.unitPrice;
        const itemDisc = updated.discountType === 'percent' ? base * (updated.discountVal / 100) : updated.discountVal;
        const taxable = base - itemDisc;
        const taxAmt = taxable * (updated.taxRate / 100);
        updated.total = taxable + taxAmt;
        return updated;
      })
    );
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: `item_${Date.now()}`,
      productName: 'AI Lead Scoring Engine Pro',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&auto=format&fit=crop&q=60',
      showImage: true,
      unit: 'License',
      qty: 1,
      unitPrice: 120000,
      taxRate: 18,
      discountType: 'percent',
      discountVal: 0,
      total: 141600,
    };
    setItems([...items, newItem]);
  };

  const removeLineItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(it => it.id !== id));
  };

  // Document Conversion Flow
  const handleConvertDoc = (targetType: DocumentType) => {
    setDocType(targetType);
    const prefix =
      targetType === 'QUOTATION' ? 'QT' :
      targetType === 'PROFORMA_INVOICE' ? 'PI' :
      targetType === 'TAX_INVOICE' ? 'INV' :
      targetType === 'PAYMENT_RECEIPT' ? 'REC' :
      targetType === 'CREDIT_NOTE' ? 'CN' : 'DC';
    setDocNo(`${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Financial Calculations
  const subtotal = items.reduce((acc, it) => acc + it.qty * it.unitPrice, 0);
  const totalItemDiscounts = items.reduce((acc, it) => {
    const base = it.qty * it.unitPrice;
    return acc + (it.discountType === 'percent' ? base * (it.discountVal / 100) : it.discountVal);
  }, 0);
  const taxableSubtotal = subtotal - totalItemDiscounts;
  const overallDiscAmount = overallDiscountType === 'percent' ? taxableSubtotal * (overallDiscountVal / 100) : overallDiscountVal;
  const finalTaxable = taxableSubtotal - overallDiscAmount;
  const gstTaxTotal = items.reduce((acc, it) => {
    const base = it.qty * it.unitPrice;
    const disc = it.discountType === 'percent' ? base * (it.discountVal / 100) : it.discountVal;
    const taxable = base - disc;
    return acc + taxable * (it.taxRate / 100);
  }, 0);
  const grandTotal = finalTaxable + gstTaxTotal;

  // Add Company Handler
  const handleSaveNewCompany = () => {
    if (!newComp.name) return;
    const created: CompanyDetails = {
      id: `comp_${Date.now()}`,
      name: newComp.name || 'New Company',
      logoUrl: newComp.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60',
      address: newComp.address || 'Company Address',
      email: newComp.email || '',
      gstNo: newComp.gstNo || 'GSTIN_PENDING',
      panNo: newComp.panNo || 'PAN_PENDING',
      bankName: newComp.bankName || 'HDFC Bank',
      accountNo: newComp.accountNo || '0000000000',
      ifscCode: newComp.ifscCode || 'HDFC0000001',
      branch: newComp.branch || 'Main Branch',
      upiId: newComp.upiId || 'company@upi',
    };
    setCompanies([...companies, created]);
    setSelectedCompanyId(created.id);
    setCompanyModalOpen(false);
    setNewComp({});
  };

  // Add Party Handler
  const handleSaveNewParty = () => {
    if (!newParty.name) return;
    const created: PartyDetails = {
      id: `party_${Date.now()}`,
      name: newParty.name || 'New Party',
      contactPerson: newParty.contactPerson || 'Contact Person',
      email: newParty.email || '',
      phone: newParty.phone || '+91 99999 88888',
      address: newParty.address || 'Party Address',
      gstNo: newParty.gstNo || 'PARTY_GSTIN',
      panNo: newParty.panNo || 'PARTY_PAN',
    };
    setParties([...parties, created]);
    setSelectedPartyId(created.id);
    setPartyModalOpen(false);
    setNewParty({});
  };

  const getDocTitle = () => {
    switch (docType) {
      case 'QUOTATION': return 'COMMERCIAL QUOTATION';
      case 'PROFORMA_INVOICE': return 'PROFORMA INVOICE (PI)';
      case 'TAX_INVOICE': return 'GST TAX INVOICE';
      case 'PAYMENT_RECEIPT': return 'PAYMENT RECEIPT';
      case 'CREDIT_NOTE': return 'CREDIT NOTE';
      case 'DELIVERY_CHALLAN': return 'DELIVERY CHALLAN';
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans text-slate-900 dark:text-white">
      {/* ── TOP ACTION BAR & DOCUMENT TYPE FLOW SELECTOR ── */}
      <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded">
            PROCESS FLOW ENGINE
          </span>
          <h2 className="text-lg font-black text-white mt-1 flex items-center gap-2">
            <FileText className="text-indigo-400" size={20} />
            {getDocTitle()} GENERATOR &amp; CONVERTER
          </h2>
        </div>

        {/* Process Flow Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {(['QUOTATION', 'PROFORMA_INVOICE', 'TAX_INVOICE', 'PAYMENT_RECEIPT', 'CREDIT_NOTE'] as const).map(type => (
            <button
              key={type}
              onClick={() => handleConvertDoc(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                docType === type
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {docType === type && <Check size={12} />}
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSavedSuccess(true); setTimeout(() => setSavedSuccess(false), 2000); }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
          >
            {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <RefreshCw size={14} />}
            {savedSuccess ? 'Draft Saved' : 'Save Draft'}
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <Download size={14} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* ── DUAL PANE LAYOUT (LEFT CONTROLS | RIGHT LIVE PDF PREVIEW) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT PANE: CONTROLS & FORM BUILDER (7 COLS) ── */}
        <div className="lg:col-span-6 space-y-6">
          {/* 1. SELLER / COMPANY SELECTOR (DROPDOWN - RECENT ON TOP) */}
          <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Building2 size={16} /> 1. Select Seller / Your Company
              </h3>
              <button
                onClick={() => setCompanyModalOpen(true)}
                className="text-[11px] font-extrabold text-sky-400 bg-sky-400/10 border border-sky-400/30 px-2.5 py-1 rounded-lg hover:bg-sky-400/20"
              >
                + Add / Edit Company
              </button>
            </div>

            {/* Dropdown Selector */}
            <select
              value={selectedCompanyId}
              onChange={e => setSelectedCompanyId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold cursor-pointer focus:border-indigo-500 focus:outline-none"
            >
              {companies.map((comp, idx) => (
                <option key={comp.id} value={comp.id}>
                  {idx === 0 ? `✨ (Recent) ${comp.name}` : comp.name} — GSTIN: {comp.gstNo}
                </option>
              ))}
            </select>

            {/* Active Company Preview */}
            {activeCompany && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3.5 flex items-start gap-3">
                <img src={activeCompany.logoUrl} alt="Logo" className="w-9 h-9 rounded-lg object-cover border border-indigo-500/40" />
                <div className="text-xs space-y-0.5 min-w-0 flex-1">
                  <p className="font-extrabold text-white truncate">{activeCompany.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{activeCompany.address}</p>
                  <p className="text-[10px] font-bold text-indigo-400 mt-1">GSTIN: {activeCompany.gstNo} • PAN: {activeCompany.panNo}</p>
                </div>
              </div>
            )}
          </div>

          {/* 2. BUYER / PARTY SELECTOR (DROPDOWN - RECENT ON TOP) */}
          <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                <UserCheck size={16} /> 2. Select Client / Buyer Party
              </h3>
              <button
                onClick={() => setPartyModalOpen(true)}
                className="text-[11px] font-extrabold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-1 rounded-lg hover:bg-emerald-400/20"
              >
                + Add New Party
              </button>
            </div>

            {/* Dropdown Selector */}
            <select
              value={selectedPartyId}
              onChange={e => setSelectedPartyId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold cursor-pointer focus:border-emerald-500 focus:outline-none"
            >
              {parties.map((party, idx) => (
                <option key={party.id} value={party.id}>
                  {idx === 0 ? `✨ (Recent) ${party.name}` : party.name} — GSTIN: {party.gstNo}
                </option>
              ))}
            </select>

            {/* Active Party Preview */}
            {activeParty && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 space-y-1">
                <p className="font-extrabold text-xs text-white">{activeParty.name}</p>
                <p className="text-[11px] text-slate-400">👤 Contact: <strong className="text-emerald-300">{activeParty.contactPerson}</strong> • 📞 {activeParty.phone}</p>
                <p className="text-[10px] font-bold text-emerald-400">GSTIN: {activeParty.gstNo} • PAN: {activeParty.panNo}</p>
              </div>
            )}
          </div>

          {/* 3. DOCUMENT METADATA */}
          <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">
              3. Document Reference &amp; Dates
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Doc Number</label>
                <input
                  type="text"
                  value={docNo}
                  onChange={e => setDocNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Date</label>
                <input
                  type="text"
                  value={docDate}
                  onChange={e => setDocDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Valid / Due Until</label>
                <input
                  type="text"
                  value={validUntilDate}
                  onChange={e => setValidUntilDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* 4. LINE ITEMS & PRODUCTS CATALOG PICKER WITH IMAGE TOGGLE */}
          <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-purple-400 tracking-wider flex items-center gap-1.5">
                <Package size={16} /> 4. Products &amp; Line Items
              </h3>
              <button
                onClick={addLineItem}
                className="text-[11px] font-extrabold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-3 py-1 rounded-lg hover:bg-purple-500/30 flex items-center gap-1"
              >
                <Plus size={12} /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  {/* Top Bar: Item Header & Quick Catalog Picker */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-400">#{idx + 1} Line Item</span>
                    <div className="flex items-center gap-2">
                      <select
                        onChange={e => {
                          const picked = CATALOG_PRODUCTS.find(p => p.name === e.target.value);
                          if (picked) {
                            updateLineItem(item.id, {
                              productName: picked.name,
                              unitPrice: picked.price,
                              taxRate: picked.tax,
                              unit: picked.unit,
                              imageUrl: picked.image,
                            });
                          }
                        }}
                        className="bg-slate-900 border border-slate-800 text-xs text-indigo-300 rounded-lg px-2 py-1"
                      >
                        <option value="">Quick Pick Catalog Product...</option>
                        {CATALOG_PRODUCTS.map(p => (
                          <option key={p.name} value={p.name}>{p.name} (₹{p.price.toLocaleString()})</option>
                        ))}
                      </select>

                      <button
                        onClick={() => removeLineItem(item.id)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                        title="Remove Line Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Product Title & Image Toggle */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-7">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Product Description / Title</label>
                      <input
                        type="text"
                        value={item.productName}
                        onChange={e => updateLineItem(item.id, { productName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                      />
                    </div>

                    <div className="sm:col-span-5 flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <ImageIcon size={14} className="text-sky-400" /> Image in PDF:
                      </span>
                      <button
                        onClick={() => updateLineItem(item.id, { showImage: !item.showImage })}
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition-all ${
                          item.showImage
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.showImage ? 'YES (Visible)' : 'NO (Hidden)'}
                      </button>
                    </div>
                  </div>

                  {/* Qty, Unit, Price, Tax */}
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Qty</label>
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={e => updateLineItem(item.id, { qty: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white text-center font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Unit</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={e => updateLineItem(item.id, { unit: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white text-center font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Rate (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={e => updateLineItem(item.id, { unitPrice: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">GST %</label>
                      <input
                        type="number"
                        min={0}
                        value={item.taxRate}
                        onChange={e => updateLineItem(item.id, { taxRate: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-amber-400 text-center font-extrabold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. DISCOUNT & TERMS */}
          <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-sky-400 tracking-wider">
              5. Overall Discount &amp; Terms &amp; Conditions
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Discount Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOverallDiscountType('percent')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                      overallDiscountType === 'percent' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    % Percentage
                  </button>
                  <button
                    onClick={() => setOverallDiscountType('flat')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                      overallDiscountType === 'flat' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    Flat ₹
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Discount Value</label>
                <input
                  type="number"
                  value={overallDiscountVal}
                  onChange={e => setOverallDiscountVal(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Terms &amp; Conditions</label>
              <textarea
                value={termsText}
                onChange={e => setTermsText(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 resize-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT PANE: LIVE PDF PREVIEW (SPECTRO COMMERCIAL GST INVOICE LAYOUT) (6 COLS) ── */}
        <div className="lg:col-span-6 sticky top-6">
          <div className="crm-card bg-white text-slate-900 border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-6 font-sans">
            {/* Header / Document Title */}
            <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <img src={activeCompany.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                <div>
                  <h1 className="text-base font-black text-slate-900">{activeCompany.name}</h1>
                  <p className="text-[10px] text-slate-500 max-w-xs leading-tight mt-0.5">{activeCompany.address}</p>
                  <p className="text-[10px] font-bold text-indigo-600 mt-1">GSTIN: {activeCompany.gstNo} • PAN: {activeCompany.panNo}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black tracking-wider uppercase px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {getDocTitle()}
                </span>
                <p className="text-xs font-extrabold text-slate-900 mt-2">Doc #: <span className="font-mono">{docNo}</span></p>
                <p className="text-[11px] text-slate-500 mt-0.5">Date: <strong>{docDate}</strong></p>
                <p className="text-[11px] text-slate-500">Valid: <strong>{validUntilDate}</strong></p>
              </div>
            </div>

            {/* Billed To / Party Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Billed To (Client / Buyer)</span>
                <h4 className="text-xs font-black text-slate-900">{activeParty.name}</h4>
                <p className="text-[10px] text-slate-600 mt-0.5">Attn: {activeParty.contactPerson}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{activeParty.address}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-700">GSTIN: <span className="font-mono">{activeParty.gstNo}</span></p>
                <p className="text-[10px] font-bold text-slate-700">PAN: <span className="font-mono">{activeParty.panNo}</span></p>
                <p className="text-[10px] text-slate-500 mt-1">✉️ {activeParty.email}</p>
                <p className="text-[10px] text-slate-500">📞 {activeParty.phone}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-100 text-slate-600 text-[10px] uppercase font-black">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Product Description</th>
                    <th className="py-2 px-2 text-center">Qty / Unit</th>
                    <th className="py-2 px-2 text-right">Rate</th>
                    <th className="py-2 px-2 text-center">GST %</th>
                    <th className="py-2 px-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((it, idx) => (
                    <tr key={it.id} className="text-slate-800">
                      <td className="py-2.5 px-2 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          {it.showImage && it.imageUrl && (
                            <img src={it.imageUrl} alt="Prod" className="w-8 h-8 rounded border border-slate-200 object-cover flex-shrink-0" />
                          )}
                          <div>
                            <span className="font-bold block text-slate-900">{it.productName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-semibold">{it.qty} {it.unit}</td>
                      <td className="py-2.5 px-2 text-right font-semibold">₹{it.unitPrice.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-center font-bold text-amber-600">{it.taxRate}%</td>
                      <td className="py-2.5 px-2 text-right font-black text-slate-900">₹{it.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Bank Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
              {/* Bank Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Bank Payment Details</span>
                <p className="text-[10px] font-bold text-slate-800">Bank: {activeCompany.bankName}</p>
                <p className="text-[10px] font-bold text-indigo-600">A/C No: {activeCompany.accountNo}</p>
                <p className="text-[10px] text-slate-600">IFSC: {activeCompany.ifscCode} • Branch: {activeCompany.branch}</p>
                <p className="text-[10px] font-extrabold text-emerald-600">UPI ID: {activeCompany.upiId}</p>
              </div>

              {/* Totals Box */}
              <div className="space-y-1.5 text-xs text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                </div>
                {totalItemDiscounts > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Item Discounts:</span>
                    <span className="font-bold">-₹{totalItemDiscounts.toLocaleString()}</span>
                  </div>
                )}
                {overallDiscAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Overall Discount:</span>
                    <span className="font-bold">-₹{overallDiscAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-amber-700">
                  <span>GST Tax Total (18%):</span>
                  <span className="font-bold">₹{gstTaxTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-indigo-600 border-t border-slate-300 pt-1.5">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Terms & Authorization Footer */}
            <div className="border-t border-slate-200 pt-4 grid grid-cols-2 gap-4 items-end">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Terms &amp; Conditions</span>
                <p className="text-[9px] text-slate-500 whitespace-pre-line leading-relaxed">{termsText}</p>
              </div>
              <div className="text-right space-y-4">
                <p className="text-[10px] font-bold text-slate-700">For {activeCompany.name}</p>
                <div className="inline-block border-b border-slate-400 w-32 pb-1 text-center">
                  <span className="text-[9px] font-bold text-slate-400">Authorized Signatory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL: ADD NEW COMPANY ── */}
      {companyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 text-white">
            <h3 className="text-sm font-black text-indigo-400 flex items-center gap-2">
              <Building2 size={18} /> Add New Seller Company
            </h3>
            <div className="space-y-2 text-xs">
              <input
                type="text"
                placeholder="Company Name *"
                value={newComp.name || ''}
                onChange={e => setNewComp({ ...newComp, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              />
              <input
                type="text"
                placeholder="Logo Image URL"
                value={newComp.logoUrl || ''}
                onChange={e => setNewComp({ ...newComp, logoUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              />
              <input
                type="text"
                placeholder="Company Address"
                value={newComp.address || ''}
                onChange={e => setNewComp({ ...newComp, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="GSTIN Number"
                  value={newComp.gstNo || ''}
                  onChange={e => setNewComp({ ...newComp, gstNo: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
                <input
                  type="text"
                  placeholder="PAN Number"
                  value={newComp.panNo || ''}
                  onChange={e => setNewComp({ ...newComp, panNo: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Bank Name"
                  value={newComp.bankName || ''}
                  onChange={e => setNewComp({ ...newComp, bankName: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
                <input
                  type="text"
                  placeholder="Account Number"
                  value={newComp.accountNo || ''}
                  onChange={e => setNewComp({ ...newComp, accountNo: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="IFSC Code"
                  value={newComp.ifscCode || ''}
                  onChange={e => setNewComp({ ...newComp, ifscCode: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
                <input
                  type="text"
                  placeholder="UPI ID"
                  value={newComp.upiId || ''}
                  onChange={e => setNewComp({ ...newComp, upiId: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCompanyModalOpen(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewCompany}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
              >
                Save Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD NEW PARTY ── */}
      {partyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 text-white">
            <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2">
              <UserCheck size={18} /> Add New Client Party
            </h3>
            <div className="space-y-2 text-xs">
              <input
                type="text"
                placeholder="Party / Company Name *"
                value={newParty.name || ''}
                onChange={e => setNewParty({ ...newParty, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              />
              <input
                type="text"
                placeholder="Contact Person Name"
                value={newParty.contactPerson || ''}
                onChange={e => setNewParty({ ...newParty, contactPerson: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Email Address (Optional)"
                  value={newParty.email || ''}
                  onChange={e => setNewParty({ ...newParty, email: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newParty.phone || ''}
                  onChange={e => setNewParty({ ...newParty, phone: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Billing Address"
                value={newParty.address || ''}
                onChange={e => setNewParty({ ...newParty, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="GSTIN Number"
                  value={newParty.gstNo || ''}
                  onChange={e => setNewParty({ ...newParty, gstNo: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
                <input
                  type="text"
                  placeholder="PAN Number"
                  value={newParty.panNo || ''}
                  onChange={e => setNewParty({ ...newParty, panNo: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPartyModalOpen(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewParty}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
              >
                Save Party
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
