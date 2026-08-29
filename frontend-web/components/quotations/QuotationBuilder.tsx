'use client';

import React, { useState } from 'react';
import {
  Plus, Trash2, GripVertical, Package, Percent, DollarSign,
  FileText, Send, Eye, Download, Check, Edit2, Building2,
  UserCheck, RefreshCw, Image as ImageIcon, ShieldCheck, CreditCard, ChevronRight,
  Maximize2, Columns, ZoomIn, ZoomOut, Sliders, Truck, AlignLeft, Hash,
  ChevronDown, ChevronUp, Smartphone, Calendar
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
  shippingAddress?: string;
  gstNo: string;
  panNo: string;
}

export interface LineItem {
  id: string;
  productName: string;
  description?: string;
  showDescription: boolean;
  hsnCode?: string;
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

// ─── Default Mock Data (Spectro Analytical Labs & Aarna Construction) ───
const INITIAL_COMPANIES: CompanyDetails[] = [
  {
    id: 'comp-1',
    name: 'Aarna Construction & Interiors',
    logoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=200&auto=format&fit=crop&q=60',
    address: 'Plot1, Ats-kasnaroad, Bindalenclave, Greater Noida, Uttar Pradesh, 201310',
    email: 'info@aarnaconstructions.com',
    gstNo: '09APMPL1329Q1Z8',
    panNo: 'APML1329Q',
    bankName: 'Punjab National Bank',
    accountNo: '6198002100003189',
    ifscCode: 'PUNB0619800',
    branch: 'DAV TIRAHA, Greater Noida',
    upiId: 'aarna@pnb',
  },
  {
    id: 'comp-2',
    name: 'Spectro Tech India Pvt Ltd',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60',
    address: 'Plot No. 42, Sector 18, Cyber City, Gurugram, HR - 122002',
    email: 'billing@spectrotech.in',
    gstNo: '06AAAAC1234F1Z9',
    panNo: 'AAAAC1234F',
    bankName: 'HDFC Bank Ltd',
    accountNo: '50200044556677',
    ifscCode: 'HDFC0000123',
    branch: 'Cyber City Branch',
    upiId: 'spectro@hdfcbank',
  },
];

const INITIAL_PARTIES: PartyDetails[] = [
  {
    id: 'party-1',
    name: 'SPECTRO ANALYTICAL LABS PRIVATE LIMITED',
    contactPerson: 'Site Procurement Manager',
    email: 'info@spectro.in',
    phone: '+91 93194 95000',
    address: 'S 1, SITE GNEPIP KASNA ROAD, SURAJPUR INDUSTRIAL AREA V Gautam Buddha Nagar 201310, GREATER NOIDA, Uttar Pradesh, 201310',
    shippingAddress: 'Plot 4, Site V Industrial Park, Greater Noida, Uttar Pradesh - 201310',
    gstNo: '09APMPL1329Q1Z8',
    panNo: 'APML1329Q',
  },
  {
    id: 'party-2',
    name: 'TechCorp Solutions Pvt Ltd',
    contactPerson: 'Rajesh Varma',
    email: 'rajesh@techcorp.com',
    phone: '+91 98765 43210',
    address: 'Building 7, Mindspace IT Park, Madhapur, Hyderabad, TS - 500081',
    shippingAddress: 'Warehouse 12, Mindspace Park, Hyderabad, TS - 500081',
    gstNo: '36AAACT9988K1ZP',
    panNo: 'AAACT9988K',
  },
];

const CATALOG_PRODUCTS = [
  {
    name: 'Executive Work Station',
    price: 22500,
    tax: 18,
    unit: 'Nos',
    hsn: '998313',
    desc: 'Ergonomic Modular Desk System with Cable Management & Powder Coated Steel Frame',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=200&auto=format&fit=crop&q=60'
  },
  {
    name: 'DAS CRM Enterprise License (50 Seats)',
    price: 500000,
    tax: 18,
    unit: 'Set',
    hsn: '998314',
    desc: 'Annual Enterprise SaaS License with WhatsApp Cloud & AI Lead Scoring Engine',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&auto=format&fit=crop&q=60'
  },
  {
    name: 'AI Lead Scoring Engine Pro',
    price: 120000,
    tax: 18,
    unit: 'License',
    hsn: '998315',
    desc: 'Custom Machine Learning Lead Qualification & Predictive Analytics Module',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&auto=format&fit=crop&q=60'
  },
];

// ─── Helper: Number to Words (Indian Rupee Spectro Format) ────
function numberToWordsINR(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return 'Rupees Zero Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  };

  const rounded = Math.round(amount);
  return `Rupees ${inWords(rounded)} Only`;
}

export function QuotationBuilder() {
  // Document Type Flow
  const [docType, setDocType] = useState<DocumentType>('QUOTATION');

  // View Mode & Zoom Scale State
  const [viewMode, setViewMode] = useState<'SPLIT' | 'FULL_PREVIEW'>('SPLIT');
  const [zoomScale, setZoomScale] = useState<number>(0.78);

  // Mobile Tab State (BUILDER vs PREVIEW for Smartphone Viewports)
  const [mobileActiveTab, setMobileActiveTab] = useState<'BUILDER' | 'PREVIEW'>('BUILDER');

  // PDF Page & Margin Controls State
  const [pdfMargin, setPdfMargin] = useState<number>(10); // 6mm, 10mm, 15mm
  const [pdfPageMode, setPdfPageMode] = useState<'SINGLE' | 'MULTI'>('SINGLE');

  // Table Column Visibility Controls (GST & HSN/SAC Columns)
  const [globalGstRate, setGlobalGstRate] = useState<number>(18);
  const [showGstColumn, setShowGstColumn] = useState<boolean>(true);
  const [showHsnColumn, setShowHsnColumn] = useState<boolean>(true);

  // Smooth Slidable Accordion Sections State
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    gst: true,
    pdf: true,
    company: true,
    party: true,
    metadata: true,
    items: true,
    terms: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Shipping Address State
  const [useSeparateShipping, setUseSeparateShipping] = useState<boolean>(false);
  const [customShippingAddress, setCustomShippingAddress] = useState<string>(
    'Plot 4, Site V Industrial Park, Greater Noida, Uttar Pradesh - 201310'
  );

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
      productName: 'Executive Work Station',
      description: 'Ergonomic Modular Desk System with Cable Management & Powder Coated Steel Frame',
      showDescription: true,
      hsnCode: '998313',
      imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=200&auto=format&fit=crop&q=60',
      showImage: false,
      unit: 'Nos',
      qty: 9,
      unitPrice: 22500,
      taxRate: 18,
      discountType: 'flat',
      discountVal: 0,
      total: 202500,
    },
  ]);

  // Document Metadata & Optional "Valid Until" Date State
  const [docNo, setDocNo] = useState('EST-2026-0891');
  const [docDate, setDocDate] = useState('13/01/2026');
  const [validUntilDate, setValidUntilDate] = useState('31/01/2026');
  const [showValidUntil, setShowValidUntil] = useState<boolean>(true);

  // Overall Discount & Terms
  const [overallDiscountType, setOverallDiscountType] = useState<'flat' | 'percent'>('flat');
  const [overallDiscountVal, setOverallDiscountVal] = useState(0);
  const [termsText, setTermsText] = useState(
    '1. All disputes are subject to Greater Noida jurisdiction only.\n2. Payment must be cleared within 2-3 days of bill submission.'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Selected Active Company & Party
  const activeCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];
  const activeParty = parties.find(p => p.id === selectedPartyId) || parties[0];

  // Apply Global GST Rate via Slider
  const handleApplyGlobalGst = (rate: number) => {
    setGlobalGstRate(rate);
    setItems(prev =>
      prev.map(it => {
        const updated = { ...it, taxRate: rate };
        const base = updated.qty * updated.unitPrice;
        const itemDisc = updated.discountType === 'percent' ? base * (updated.discountVal / 100) : updated.discountVal;
        updated.total = Math.max(0, base - itemDisc);
        return updated;
      })
    );
  };

  // Helper Line Item Calculations
  const updateLineItem = (id: string, patch: Partial<LineItem>) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it;
        const updated = { ...it, ...patch };
        const base = updated.qty * updated.unitPrice;
        const itemDisc = updated.discountType === 'percent' ? base * (updated.discountVal / 100) : updated.discountVal;
        updated.total = Math.max(0, base - itemDisc);
        return updated;
      })
    );
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      productName: 'New Executive Item',
      description: 'High quality industrial grade specification item',
      showDescription: true,
      hsnCode: '998313',
      showImage: false,
      unit: 'Nos',
      qty: 1,
      unitPrice: 10000,
      taxRate: globalGstRate,
      discountType: 'flat',
      discountVal: 0,
      total: 10000,
    };
    setItems([...items, newItem]);
  };

  const removeLineItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(it => it.id !== id));
  };

  // Grand Totals Calculation
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const totalItemDiscounts = items.reduce((sum, item) => {
    const base = item.qty * item.unitPrice;
    return sum + (item.discountType === 'percent' ? base * (item.discountVal / 100) : item.discountVal);
  }, 0);
  const taxableBase = Math.max(0, subtotal - totalItemDiscounts);

  const overallDiscAmount = overallDiscountType === 'percent'
    ? taxableBase * (overallDiscountVal / 100)
    : overallDiscountVal;

  const finalTaxable = Math.max(0, taxableBase - overallDiscAmount);
  const gstTaxTotal = items.reduce((sum, item) => {
    const base = item.qty * item.unitPrice;
    const disc = item.discountType === 'percent' ? base * (item.discountVal / 100) : item.discountVal;
    const tax = Math.max(0, base - disc) * (item.taxRate / 100);
    return sum + tax;
  }, 0);

  const grandTotal = Math.round(finalTaxable + gstTaxTotal);

  const handleSaveNewCompany = () => {
    if (!newComp.name) return;
    const comp: CompanyDetails = {
      id: `comp-${Date.now()}`,
      name: newComp.name,
      logoUrl: newComp.logoUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=200&auto=format&fit=crop&q=60',
      address: newComp.address || 'Address',
      gstNo: newComp.gstNo || 'GSTIN',
      panNo: newComp.panNo || 'PAN',
      bankName: newComp.bankName || 'Bank',
      accountNo: newComp.accountNo || 'A/C',
      ifscCode: newComp.ifscCode || 'IFSC',
      branch: newComp.branch || 'Branch',
      upiId: newComp.upiId || 'upi@bank',
    };
    setCompanies([comp, ...companies]);
    setSelectedCompanyId(comp.id);
    setCompanyModalOpen(false);
    setNewComp({});
  };

  const handleSaveNewParty = () => {
    if (!newParty.name) return;
    const party: PartyDetails = {
      id: `party-${Date.now()}`,
      name: newParty.name,
      contactPerson: newParty.contactPerson,
      email: newParty.email,
      phone: newParty.phone || 'Phone',
      address: newParty.address || 'Address',
      shippingAddress: newParty.shippingAddress,
      gstNo: newParty.gstNo || 'GSTIN',
      panNo: newParty.panNo || 'PAN',
    };
    setParties([party, ...parties]);
    setSelectedPartyId(party.id);
    setPartyModalOpen(false);
    setNewParty({});
  };

  const handleConvertDoc = (target: DocumentType) => {
    setDocType(target);
    const prefix = target === 'QUOTATION' ? 'EST' : target === 'PROFORMA_INVOICE' ? 'PI' : 'INV';
    setDocNo(`${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const getDocTitle = () => {
    switch (docType) {
      case 'QUOTATION': return 'ESTIMATE / QUOTATION';
      case 'PROFORMA_INVOICE': return 'PROFORMA INVOICE';
      case 'TAX_INVOICE': return 'TAX INVOICE';
      case 'PAYMENT_RECEIPT': return 'PAYMENT RECEIPT';
      case 'CREDIT_NOTE': return 'CREDIT NOTE';
      case 'DELIVERY_CHALLAN': return 'DELIVERY CHALLAN';
    }
  };

  // Render Spectro Executive Navy Blue (#002060) Unified A4 Document (Zero Color Conflict)
  const renderA4SheetDocument = () => (
    <div
      style={{ padding: `${pdfMargin}mm` }}
      className={`a4-document bg-white text-slate-900 shadow-2xl font-sans relative text-xs w-full max-w-[210mm] flex flex-col justify-between box-border border-2 border-[#002060] ${
        pdfPageMode === 'SINGLE' ? 'h-[297mm] min-h-[297mm] max-h-[297mm] overflow-hidden' : 'min-h-[297mm] h-auto overflow-visible'
      }`}
    >
      {/* Top Official Spectro Navy Blue (#002060) Brand Color Bar */}
      <div
        style={{
          marginTop: `-${pdfMargin}mm`,
          marginLeft: `-${pdfMargin}mm`,
          marginRight: `-${pdfMargin}mm`,
          marginBottom: pdfMargin >= 15 ? '10px' : '14px'
        }}
        className="h-2.5 bg-[#002060]"
      ></div>

      {/* Header: Company Info + Document Title Block */}
      <div className={`border-b border-slate-200 ${pdfMargin >= 15 ? 'pb-2 mb-2 pt-1' : 'pb-3 mb-3 pt-1.5'} flex justify-between items-start gap-4`}>
        <div className="flex items-start gap-3 max-w-[62%]">
          <img src={activeCompany.logoUrl} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-md object-cover border border-slate-200 shadow-sm flex-shrink-0" />
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-[11px] sm:text-sm font-black text-[#002060] tracking-tight uppercase leading-tight truncate">{activeCompany.name}</h1>
            <p className="text-[8.5px] sm:text-[9px] text-slate-600 leading-tight">{activeCompany.address}</p>
            <p className="text-[8.5px] sm:text-[9px] font-extrabold text-[#002060] mt-0.5">
              GSTIN: <span className="font-mono">{activeCompany.gstNo}</span> • PAN: <span className="font-mono">{activeCompany.panNo}</span>
            </p>
            {activeCompany.email && (
              <p className="text-[8px] sm:text-[8.5px] text-slate-500">Email: {activeCompany.email}</p>
            )}
          </div>
        </div>

        <div className="text-right space-y-0.5 flex-shrink-0">
          <span className="inline-block text-[9px] sm:text-[10.5px] font-black tracking-wider uppercase px-2.5 py-0.5 bg-[#002060] text-white rounded border border-[#00153e] shadow-sm">
            {getDocTitle()}
          </span>
          <p className="text-[10.5px] sm:text-xs font-black text-[#002060] pt-0.5 font-mono font-extrabold">
            {docNo}
          </p>
          <p className="text-[8.5px] sm:text-[9.5px] text-slate-600">Date: <strong className="text-slate-900">{docDate}</strong></p>
          {showValidUntil && validUntilDate && validUntilDate.trim() !== '' && (
            <p className="text-[8.5px] sm:text-[9.5px] text-slate-600">Valid Until: <strong className="text-slate-900">{validUntilDate}</strong></p>
          )}
        </div>
      </div>

      {/* Billed To / Buyer Party & Optional Separate Shipping Box (Harmonized Spectro Colors) */}
      <div className={`bg-slate-50 border border-slate-200 rounded-lg ${pdfMargin >= 15 ? 'p-2 mb-2' : 'p-2.5 mb-3'} grid ${useSeparateShipping ? 'grid-cols-3' : 'grid-cols-2'} gap-2 sm:gap-3`}>
        {/* Billing Address Column */}
        <div>
          <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Billed To (Buyer)</span>
          <h4 className="text-[10px] sm:text-[11.5px] font-black text-slate-900 leading-tight">{activeParty.name}</h4>
          {activeParty.contactPerson && (
            <p className="text-[8.5px] sm:text-[9px] font-medium text-slate-700 mt-0.5">Attn: {activeParty.contactPerson}</p>
          )}
          <p className="text-[8.5px] sm:text-[9px] text-slate-600 mt-0.5 leading-snug">{activeParty.address}</p>
        </div>

        {/* Separate Shipping Address Column (if enabled) */}
        {useSeparateShipping && (
          <div className="border-l border-slate-200 pl-2 sm:pl-3">
            <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-[#002060] block mb-0.5 flex items-center gap-1">
              🚚 Shipped To (Consignee)
            </span>
            <h4 className="text-[10px] sm:text-[11.5px] font-black text-slate-900 leading-tight">{activeParty.name}</h4>
            <p className="text-[8.5px] sm:text-[9px] text-slate-600 mt-0.5 leading-snug">
              {customShippingAddress || activeParty.shippingAddress || activeParty.address}
            </p>
          </div>
        )}

        {/* Tax & Contact Column */}
        <div className="text-right space-y-0.5">
          <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Tax &amp; Identifiers</span>
          <p className="text-[8.5px] sm:text-[9px] font-bold text-slate-800">GSTIN: <span className="font-mono text-[#002060]">{activeParty.gstNo}</span></p>
          <p className="text-[8.5px] sm:text-[9px] font-bold text-slate-800">PAN: <span className="font-mono">{activeParty.panNo}</span></p>
          <p className="text-[8.5px] sm:text-[9px] text-slate-600">📞 {activeParty.phone}</p>
          <p className="text-[8px] sm:text-[8.5px] font-semibold text-slate-500">Place of Supply: <span className="text-slate-800 font-bold">Uttar Pradesh</span></p>
        </div>
      </div>

      {/* Line Items Table (Spectro Navy Blue Header & Unified Borders) */}
      <div className={`overflow-hidden border border-slate-200 rounded-lg ${pdfMargin >= 15 ? 'mb-2' : 'mb-3'}`}>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#002060] text-white text-[8px] sm:text-[8.5px] uppercase font-black tracking-wider border-b border-[#00153e]">
              <th className="py-1.5 px-1.5 sm:px-2 text-center w-6 sm:w-7">#</th>
              <th className="py-1.5 px-1.5 sm:px-2">Item &amp; Description</th>
              {showHsnColumn && <th className="py-1.5 px-1.5 sm:px-2 text-center">HSN/SAC</th>}
              <th className="py-1.5 px-1.5 sm:px-2 text-center">Qty</th>
              <th className="py-1.5 px-1.5 sm:px-2 text-right">Rate (₹)</th>
              {showGstColumn && <th className="py-1.5 px-1.5 sm:px-2 text-center">GST %</th>}
              <th className="py-1.5 px-1.5 sm:px-2 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-[9.5px] sm:text-[10px]">
            {items.map((it, idx) => {
              const baseRowTotal = it.qty * it.unitPrice;
              const rowTax = baseRowTotal * (it.taxRate / 100);
              const displayedRowTotal = showGstColumn ? Math.round(baseRowTotal + rowTax) : baseRowTotal;
              return (
                <tr key={it.id} className={idx % 2 === 1 ? 'bg-slate-50/70 text-slate-800' : 'text-slate-800'}>
                  <td className="py-1.5 px-1.5 sm:px-2 text-center font-bold text-slate-400 text-[9px] sm:text-[9.5px]">{idx + 1}</td>
                  <td className="py-1.5 px-1.5 sm:px-2">
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      {it.showImage && it.imageUrl && (
                        <img src={it.imageUrl} alt="Prod" className="w-4 h-4 sm:w-5 sm:h-5 rounded border border-slate-200 object-cover flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold text-slate-900 leading-snug block text-[9.5px] sm:text-[10px]">{it.productName}</span>
                        {it.showDescription && it.description && it.description.trim() !== '' && (
                          <p className="text-[7.5px] sm:text-[8px] text-slate-500 leading-tight mt-0.5 font-normal">{it.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  {showHsnColumn && (
                    <td className="py-1.5 px-1.5 sm:px-2 text-center font-mono text-[8.5px] sm:text-[9px] text-slate-500">{it.hsnCode || '998313'}</td>
                  )}
                  <td className="py-1.5 px-1.5 sm:px-2 text-center font-semibold text-[9px] sm:text-[9.5px]">{it.qty} {it.unit}</td>
                  <td className="py-1.5 px-1.5 sm:px-2 text-right font-semibold text-[9px] sm:text-[9.5px]">₹{it.unitPrice.toLocaleString('en-IN')}</td>
                  {showGstColumn && (
                    <td className="py-1.5 px-1.5 sm:px-2 text-center font-bold text-[#002060] text-[9px] sm:text-[9.5px]">{it.taxRate}%</td>
                  )}
                  <td className="py-1.5 px-1.5 sm:px-2 text-right font-black text-slate-900 text-[9.5px] sm:text-[10px]">
                    ₹{displayedRowTotal.toLocaleString('en-IN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Financial Summary & Bank Details Section (Harmonized Spectro Colors) */}
      <div className={`grid grid-cols-2 gap-2 sm:gap-3 border-t border-slate-200 ${pdfMargin >= 15 ? 'pt-2 mb-2' : 'pt-2.5 mb-3'}`}>
        {/* Bank Details & Amount in Words */}
        <div className="space-y-1.5">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-0.5">
            <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Bank Payment Details</span>
            <p className="text-[8.5px] sm:text-[9px] font-bold text-slate-800">Bank: {activeCompany.bankName}</p>
            <p className="text-[8.5px] sm:text-[9px] font-bold text-[#002060] font-mono">A/C No: {activeCompany.accountNo}</p>
            <p className="text-[8.5px] sm:text-[9px] text-slate-600">IFSC: <span className="font-mono">{activeCompany.ifscCode}</span> • Branch: {activeCompany.branch}</p>
            <p className="text-[8.5px] sm:text-[9px] font-extrabold text-[#002060]">UPI ID: {activeCompany.upiId}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
            <span className="text-[7px] sm:text-[7.5px] font-black uppercase tracking-wider text-[#002060] block">Total Amount (in words)</span>
            <p className="text-[8.5px] sm:text-[9.5px] font-extrabold text-[#002060] italic mt-0.5">
              {numberToWordsINR(grandTotal)}
            </p>
          </div>
        </div>

        {/* Totals Calculation Box */}
        <div className="space-y-1 text-xs text-right bg-slate-50 border border-slate-200 rounded-lg p-2">
          <div className="flex justify-between text-slate-600 text-[8.5px] sm:text-[9.5px]">
            <span>Subtotal (Base Value):</span>
            <span className="font-bold text-slate-800">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {totalItemDiscounts > 0 && (
            <div className="flex justify-between text-slate-700 text-[8.5px] sm:text-[9.5px]">
              <span>Item Discounts:</span>
              <span className="font-bold">-₹{totalItemDiscounts.toLocaleString('en-IN')}</span>
            </div>
          )}
          {overallDiscAmount > 0 && (
            <div className="flex justify-between text-slate-700 text-[8.5px] sm:text-[9.5px]">
              <span>Overall Discount:</span>
              <span className="font-bold">-₹{overallDiscAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600 text-[8.5px] sm:text-[9.5px]">
            <span>CGST ({globalGstRate / 2}%):</span>
            <span className="font-semibold text-slate-700">₹{(gstTaxTotal / 2).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-600 text-[8.5px] sm:text-[9.5px]">
            <span>SGST ({globalGstRate / 2}%):</span>
            <span className="font-semibold text-slate-700">₹{(gstTaxTotal / 2).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-[#002060] font-bold border-t border-slate-200 pt-0.5 text-[9px] sm:text-[10px]">
            <span>Total Tax ({globalGstRate}% GST):</span>
            <span>₹{gstTaxTotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-[#002060] text-white rounded-lg p-1.5 mt-1 flex justify-between items-center font-black text-xs shadow-md border border-[#00153e]">
            <span className="uppercase tracking-wider text-[8.5px] sm:text-[9.5px] font-bold text-slate-200">Grand Total</span>
            <span className="text-xs sm:text-sm text-white font-mono font-black">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Terms & Conditions + Authorized Signatory Footer */}
      <div className="border-t border-slate-200 pt-1.5 grid grid-cols-2 gap-4 items-end mt-auto">
        <div className="space-y-0.5">
          <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-400 block">Terms &amp; Conditions</span>
          <p className="text-[7.5px] text-slate-500 whitespace-pre-line leading-tight">{termsText}</p>
          <p className="text-[7px] text-slate-400 italic pt-0.5">E. &amp; O.E. • Computer Generated Document</p>
        </div>
        <div className="text-right space-y-2">
          <p className="text-[9px] font-bold text-slate-800">For {activeCompany.name}</p>
          <div className="inline-block border-b border-slate-400 w-28 pb-0.5 text-center">
            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider">Authorized Signatory</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto pb-12 font-sans text-slate-900 dark:text-white px-2 sm:px-4">
      {/* ── TOP ACTION BAR & DOCUMENT TYPE FLOW SELECTOR ── */}
      <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 print-hide">
        <div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded">
            PROCESS FLOW ENGINE
          </span>
          <h2 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-2">
            <FileText className="text-indigo-400" size={18} />
            {getDocTitle()} GENERATOR &amp; CONVERTER
          </h2>
        </div>

        {/* View Mode Switcher Controls */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setViewMode('SPLIT')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'SPLIT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns size={14} /> Split Builder
          </button>
          <button
            onClick={() => setViewMode('FULL_PREVIEW')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'FULL_PREVIEW' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 size={14} /> Full A4 Preview
          </button>
        </div>

        {/* Process Flow Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {(['QUOTATION', 'PROFORMA_INVOICE', 'TAX_INVOICE', 'PAYMENT_RECEIPT', 'CREDIT_NOTE'] as const).map(type => (
            <button
              key={type}
              onClick={() => handleConvertDoc(type)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
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
            className="flex-1 md:flex-none px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
          >
            {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <RefreshCw size={14} />}
            {savedSuccess ? 'Draft Saved' : 'Save Draft'}
          </button>

          <button
            onClick={() => window.print()}
            className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
          >
            <Download size={14} /> Print / Export PDF (A4)
          </button>
        </div>
      </div>

      {/* 📱 MOBILE VIEW TAB SWITCHER (BUILDER FORM vs LIVE A4 SHEET) FOR SMARTPHONES */}
      {viewMode === 'SPLIT' && (
        <div className="flex lg:hidden bg-slate-900 border border-slate-800 p-1 rounded-xl w-full print-hide">
          <button
            onClick={() => setMobileActiveTab('BUILDER')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              mobileActiveTab === 'BUILDER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders size={14} /> 🛠️ Form Builder Inputs
          </button>
          <button
            onClick={() => setMobileActiveTab('PREVIEW')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              mobileActiveTab === 'PREVIEW' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye size={14} /> 📄 Live A4 Document
          </button>
        </div>
      )}

      {/* ── FULL PREVIEW MODE ── */}
      {viewMode === 'FULL_PREVIEW' ? (
        <div className="flex flex-col items-center space-y-4 print-hide">
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-white">
            <span>Zoom Scale:</span>
            {[0.5, 0.75, 0.85, 1.0].map(s => (
              <button
                key={s}
                onClick={() => setZoomScale(s)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${
                  zoomScale === s ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {Math.round(s * 100)}%
              </button>
            ))}
          </div>

          <div
            style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
            className="transition-transform duration-200 shadow-2xl rounded-xl overflow-hidden p-2 bg-slate-950 flex justify-center w-full max-w-[210mm]"
          >
            {renderA4SheetDocument()}
          </div>
        </div>
      ) : (
        /* ── DUAL PANE LAYOUT (SPLIT BUILDER & LIVE PREVIEW) ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT PANE: CONTROLS & FORM BUILDER (SLIDABLE ACCORDION SECTIONS) ── */}
          <div className={`lg:col-span-6 space-y-4 sm:space-y-6 print-hide ${mobileActiveTab === 'PREVIEW' ? 'hidden lg:block' : 'block'}`}>
            {/* 🎚️ 1. GST TAX RATE SLIDER & TABLE COLUMN TOGGLES (SMOOTH HEIGHT SLIDER) */}
            <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 transition-all duration-300">
              <div
                onClick={() => toggleSection('gst')}
                className="flex items-center justify-between cursor-pointer select-none gap-2"
              >
                <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 truncate">
                  <Percent size={16} className="flex-shrink-0" /> GST Tax Rate &amp; Column Controls ({globalGstRate}%)
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10.5px] sm:text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-lg">
                    {globalGstRate}% Imposed
                  </span>
                  <button className="text-slate-400 hover:text-white p-1">
                    {openSections.gst ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Smooth Grid Height Slide Down */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  openSections.gst
                    ? 'grid-rows-[1fr] opacity-100 pt-3 border-t border-slate-800 mt-3'
                    : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                }`}
              >
                <div className="overflow-hidden space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400">0%</span>
                    <input
                      type="range"
                      min={0}
                      max={28}
                      step={1}
                      value={globalGstRate}
                      onChange={e => handleApplyGlobalGst(Number(e.target.value))}
                      className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="text-[10px] font-bold text-slate-400">28%</span>
                  </div>

                  {/* Quick GST Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {[
                      { label: '0% Exempt', val: 0 },
                      { label: '5% Reduced', val: 5 },
                      { label: '12% Standard', val: 12 },
                      { label: '18% Standard', val: 18 },
                      { label: '28% Luxury', val: 28 },
                    ].map(preset => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => handleApplyGlobalGst(preset.val)}
                        className={`py-1.5 rounded-lg text-[10.5px] font-bold transition-all ${
                          globalGstRate === preset.val
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* 👁️ TOGGLES: SHOW/HIDE GST % COLUMN & HSN/SAC COLUMN */}
                  <div className="pt-3 border-t border-slate-800 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showGstColumn}
                          onChange={e => setShowGstColumn(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-800 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-200">
                          Display GST % Column &amp; Calculate Amount with GST
                        </span>
                      </label>
                      <span className="text-[10px] text-slate-400 italic pl-6 sm:pl-0">
                        ({showGstColumn ? 'Shows GST col & computes with GST' : 'Hides GST col & shows base rate'})
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showHsnColumn}
                          onChange={e => setShowHsnColumn(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-500 bg-slate-950 border-slate-800 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-200">
                          Display HSN / SAC Code Column in Table
                        </span>
                      </label>
                      <span className="text-[10px] text-slate-400 italic pl-6 sm:pl-0">
                        ({showHsnColumn ? 'HSN Code Visible' : 'HSN Code Hidden'})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ⚙️ 2. PDF MARGIN & PAGE MODE CONTROLS (SMOOTH HEIGHT SLIDER) */}
            <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 transition-all duration-300">
              <div
                onClick={() => toggleSection('pdf')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Sliders size={16} /> PDF Page &amp; Margin Controls
                </h3>
                <button className="text-slate-400 hover:text-white p-1">
                  {openSections.pdf ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  openSections.pdf
                    ? 'grid-rows-[1fr] opacity-100 pt-3 border-t border-slate-800 mt-3'
                    : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                }`}
              >
                <div className="overflow-hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Margin Control */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Page Padding / Margin</label>
                    <div className="flex gap-1.5">
                      {[
                        { label: '6mm Compact', val: 6 },
                        { label: '10mm Standard', val: 10 },
                        { label: '15mm Spacious', val: 15 },
                      ].map(m => (
                        <button
                          key={m.val}
                          type="button"
                          onClick={() => setPdfMargin(m.val)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            pdfMargin === m.val ? 'bg-indigo-600 text-white shadow' : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Mode Control */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Page Flow Mode</label>
                    <div className="flex gap-1.5">
                      {[
                        { label: '📄 1-Page Strict', val: 'SINGLE' },
                        { label: '📄📄 Multi-Page', val: 'MULTI' },
                      ].map(p => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => setPdfPageMode(p.val as any)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            pdfPageMode === p.val ? 'bg-indigo-600 text-white shadow' : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 🏢 3. SELLER / COMPANY SELECTOR (SMOOTH HEIGHT SLIDER) */}
            <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 transition-all duration-300">
              <div
                onClick={() => toggleSection('company')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Building2 size={16} /> 1. Select Seller / Your Company
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setCompanyModalOpen(true); }}
                    className="text-[10.5px] sm:text-[11px] font-extrabold text-sky-400 bg-sky-400/10 border border-sky-400/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg hover:bg-sky-400/20"
                  >
                    + Add Company
                  </button>
                  <button className="text-slate-400 hover:text-white p-1">
                    {openSections.company ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  openSections.company
                    ? 'grid-rows-[1fr] opacity-100 pt-3 border-t border-slate-800 mt-3'
                    : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                }`}
              >
                <div className="overflow-hidden space-y-4">
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

                  {activeCompany && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3 sm:p-3.5 flex items-start gap-3">
                      <img src={activeCompany.logoUrl} alt="Logo" className="w-9 h-9 rounded-lg object-cover border border-indigo-500/40" />
                      <div className="text-xs space-y-0.5 min-w-0 flex-1">
                        <p className="font-extrabold text-white truncate">{activeCompany.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{activeCompany.address}</p>
                        <p className="text-[10px] font-bold text-indigo-400 mt-1">GSTIN: {activeCompany.gstNo} • PAN: {activeCompany.panNo}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 👤 4. BUYER / PARTY SELECTOR & SEPARATE SHIPPING ADDRESS (SMOOTH HEIGHT SLIDER) */}
            <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 transition-all duration-300">
              <div
                onClick={() => toggleSection('party')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <UserCheck size={16} /> 2. Select Client / Buyer Party
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPartyModalOpen(true); }}
                    className="text-[10.5px] sm:text-[11px] font-extrabold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg hover:bg-emerald-400/20"
                  >
                    + Add Party
                  </button>
                  <button className="text-slate-400 hover:text-white p-1">
                    {openSections.party ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  openSections.party
                    ? 'grid-rows-[1fr] opacity-100 pt-3 border-t border-slate-800 mt-3'
                    : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                }`}
              >
                <div className="overflow-hidden space-y-4">
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

                  {activeParty && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 space-y-1">
                      <p className="font-extrabold text-xs text-white">{activeParty.name}</p>
                      <p className="text-[11px] text-slate-400">🏢 Billing: {activeParty.address}</p>
                      <p className="text-[10px] font-bold text-emerald-400">GSTIN: {activeParty.gstNo} • PAN: {activeParty.panNo}</p>
                    </div>
                  )}

                  {/* 🚚 SEPARATE SHIPPING ADDRESS TOGGLE */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSeparateShipping}
                        onChange={e => setUseSeparateShipping(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Truck size={14} className="text-emerald-400" /> Shipping Address (Consignee) is different from Billing Address
                      </span>
                    </label>

                    {useSeparateShipping && (
                      <div className="space-y-1 animate-fade-in">
                        <label className="block text-[10px] font-bold text-slate-400">Separate Shipping Address</label>
                        <textarea
                          rows={2}
                          value={customShippingAddress}
                          onChange={e => setCustomShippingAddress(e.target.value)}
                          placeholder="Enter Consignee / Shipping Address..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 📅 5. DOCUMENT METADATA & OPTIONAL VALID UNTIL DATE (SMOOTH HEIGHT SLIDER) */}
            <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 transition-all duration-300">
              <div
                onClick={() => toggleSection('metadata')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <Calendar size={16} /> 3. Document Reference &amp; Dates
                </h3>
                <button className="text-slate-400 hover:text-white p-1">
                  {openSections.metadata ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  openSections.metadata
                    ? 'grid-rows-[1fr] opacity-100 pt-3 border-t border-slate-800 mt-3'
                    : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                }`}
              >
                <div className="overflow-hidden space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Doc Date</label>
                      <input
                        type="text"
                        value={docDate}
                        onChange={e => setDocDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Valid Until (Optional)</label>
                      <input
                        type="text"
                        disabled={!showValidUntil}
                        value={validUntilDate}
                        onChange={e => setValidUntilDate(e.target.value)}
                        placeholder="e.g. 31/01/2026"
                        className={`w-full border rounded-xl px-3 py-1.5 text-xs ${
                          showValidUntil
                            ? 'bg-slate-950 border-slate-800 text-white'
                            : 'bg-slate-950/40 border-slate-800/50 text-slate-600 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  {/* 🗓️ OPTIONAL VALID UNTIL CHECKBOX TOGGLE */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showValidUntil}
                        onChange={e => setShowValidUntil(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-800 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-200">
                        Include "Valid Until" Expiry Date in Document Header
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-400 italic">
                      ({showValidUntil ? 'Valid Until Visible' : 'Valid Until Hidden'})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 📦 6. LINE ITEMS & PRODUCTS CATALOG PICKER (SMOOTH HEIGHT SLIDER) */}
            <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 transition-all duration-300">
              <div
                onClick={() => toggleSection('items')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <h3 className="text-xs font-black uppercase text-purple-400 tracking-wider flex items-center gap-1.5">
                  <Package size={16} /> 4. Products &amp; Line Items ({items.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); addLineItem(); }}
                    className="text-[11px] font-extrabold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2.5 py-1 rounded-lg hover:bg-purple-500/30 flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Item
                  </button>
                  <button className="text-slate-400 hover:text-white p-1">
                    {openSections.items ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  openSections.items
                    ? 'grid-rows-[1fr] opacity-100 pt-3 border-t border-slate-800 mt-3'
                    : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                }`}
              >
                <div className="overflow-hidden space-y-3">
                  {items.map((item, idx) => (
                    <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-400">#{idx + 1} Line Item</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <select
                            onChange={e => {
                              const picked = CATALOG_PRODUCTS.find(p => p.name === e.target.value);
                              if (picked) {
                                updateLineItem(item.id, {
                                  productName: picked.name,
                                  description: picked.desc,
                                  hsnCode: picked.hsn,
                                  unitPrice: picked.price,
                                  taxRate: picked.tax,
                                  unit: picked.unit,
                                  imageUrl: picked.image,
                                });
                              }
                            }}
                            className="bg-slate-900 border border-slate-800 text-[11px] sm:text-xs text-indigo-300 rounded-lg px-2 py-1 truncate max-w-[140px] sm:max-w-none"
                          >
                            <option value="">Quick Pick Catalog Product...</option>
                            {CATALOG_PRODUCTS.map(p => (
                              <option key={p.name} value={p.name}>{p.name} (₹{p.price.toLocaleString()})</option>
                            ))}
                          </select>

                          <button
                            onClick={() => removeLineItem(item.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 flex-shrink-0"
                            title="Remove Line Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Product Name & Description Controls */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          <div className="sm:col-span-7">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Product Title</label>
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
                              {item.showImage ? 'YES' : 'NO'}
                            </button>
                          </div>
                        </div>

                        {/* Product Description Input & Toggle */}
                        <div className="space-y-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <AlignLeft size={12} className="text-amber-400" /> Product Description (Small text below name)
                            </label>
                            <button
                              type="button"
                              onClick={() => updateLineItem(item.id, { showDescription: !item.showDescription })}
                              className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase transition-all ${
                                item.showDescription
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {item.showDescription ? '✓ Description Visible' : 'Description Hidden'}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={e => updateLineItem(item.id, { description: e.target.value })}
                            placeholder="Enter product description, specs, or serial numbers..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">HSN/SAC</label>
                          <input
                            type="text"
                            value={item.hsnCode || '998313'}
                            onChange={e => updateLineItem(item.id, { hsnCode: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-white text-center font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Qty</label>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={e => updateLineItem(item.id, { qty: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-white text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Unit</label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={e => updateLineItem(item.id, { unit: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-white text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Rate (₹)</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => updateLineItem(item.id, { unitPrice: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-white font-bold"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">GST %</label>
                          <input
                            type="number"
                            value={item.taxRate}
                            onChange={e => updateLineItem(item.id, { taxRate: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-amber-400 font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 📄 7. TERMS & CONDITIONS (SMOOTH HEIGHT SLIDER) */}
            <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 transition-all duration-300">
              <div
                onClick={() => toggleSection('terms')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <h3 className="text-xs font-black uppercase text-sky-400 tracking-wider">
                  5. Terms &amp; Conditions
                </h3>
                <button className="text-slate-400 hover:text-white p-1">
                  {openSections.terms ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  openSections.terms
                    ? 'grid-rows-[1fr] opacity-100 pt-3 border-t border-slate-800 mt-3'
                    : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                }`}
              >
                <div className="overflow-hidden">
                  <textarea
                    value={termsText}
                    onChange={e => setTermsText(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 resize-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANE: LIVE STALWART A4 PREVIEW (STICKY & RESPONSIVE FOR SMARTPHONES) ── */}
          <div className={`lg:col-span-6 sticky top-6 flex flex-col items-center print-hide ${mobileActiveTab === 'BUILDER' ? 'hidden lg:flex' : 'flex'}`}>
            {/* Header Toolbar */}
            <div className="w-full max-w-[210mm] flex items-center justify-between px-3 sm:px-3.5 py-2 bg-slate-900 text-slate-300 rounded-t-xl border border-slate-800 text-[10px] font-bold shadow-md">
              <span className="flex items-center gap-1.5 text-[#002060] bg-white/90 px-2 py-0.5 rounded font-black truncate">
                <span className="w-2 h-2 rounded-full bg-[#002060] animate-pulse flex-shrink-0"></span>
                Spectro A4 Live Preview ({pdfMargin}mm Margin · {globalGstRate}% GST)
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-slate-400 font-mono text-[9px] bg-slate-800 px-2 py-0.5 rounded">Scale: {Math.round(zoomScale * 100)}%</span>
                <button onClick={() => setZoomScale(Math.max(0.45, zoomScale - 0.05))} className="p-1 hover:text-white"><ZoomOut size={13} /></button>
                <button onClick={() => setZoomScale(Math.min(1.0, zoomScale + 0.05))} className="p-1 hover:text-white"><ZoomIn size={13} /></button>
              </div>
            </div>

            {/* Scaled Preview Wrapper */}
            <div className="w-full overflow-x-auto flex justify-center bg-slate-950 p-2 sm:p-4 rounded-b-xl border border-t-0 border-slate-800">
              <div style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }} className="transition-transform duration-150 flex justify-center">
                {renderA4SheetDocument()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Sheet Element (Hidden on Screen, Active on Print) */}
      <div className="hidden print:block">
        {renderA4SheetDocument()}
      </div>

      {/* ── MODAL: ADD NEW COMPANY ── */}
      {companyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-lg space-y-4 text-white">
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-lg space-y-4 text-white">
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
              <input
                type="text"
                placeholder="Shipping / Consignee Address (Optional)"
                value={newParty.shippingAddress || ''}
                onChange={e => setNewParty({ ...newParty, shippingAddress: e.target.value })}
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
