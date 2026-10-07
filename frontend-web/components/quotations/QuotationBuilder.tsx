import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, GripVertical, Package, Percent, DollarSign,
  FileText, Send, Eye, Download, Check, Edit2, Building2,
  UserCheck, RefreshCw, Image as ImageIcon, ShieldCheck, CreditCard, ChevronRight,
  Maximize2, Columns, ZoomIn, ZoomOut, Sliders, Truck, AlignLeft, Hash,
  ChevronDown, ChevronUp, Smartphone, Calendar, ArrowUp, ArrowDown, EyeOff,
  Layers, RotateCcw, History, BookOpen, Sparkles, Clock, FolderOpen, FileCheck, Tag, X, List, Search, User,
  Mail, MessageSquare, Share2, Upload, FileDown, SlidersHorizontal, CheckCircle2,
  CloudUpload, Lock, CheckCircle
} from 'lucide-react';
import { exportQuotationAsDocx } from '../../lib/exportDocx';
import { uploadFileToGoogleDrive } from '../../lib/googleDriveService';

// ─── Interfaces & Section Layout Definitions ──────────────────
export type SectionId = 'HEADER' | 'PARTY_INFO' | 'ITEMS_TABLE' | 'SUMMARY_AND_BANK' | 'FOOTER_TERMS';

export const SECTION_METADATA: { id: SectionId; label: string; desc: string }[] = [
  { id: 'HEADER', label: 'Header & Company Details', desc: 'Logo, Address, GSTIN, Title, Date & Document #' },
  { id: 'PARTY_INFO', label: 'Buyer & Shipping Addresses', desc: 'Billed To, Shipped To Consignee, Tax Identifiers' },
  { id: 'ITEMS_TABLE', label: 'Line Items Table', desc: 'Product List, HSN Codes, Quantities, Rates & Tax' },
  { id: 'SUMMARY_AND_BANK', label: 'Bank Details & Financial Totals', desc: 'Bank A/C, Amount in Words, Tax & Grand Total' },
  { id: 'FOOTER_TERMS', label: 'Terms & Signatory Footer', desc: 'Terms & Conditions, E.&O.E., Authorized Signature' },
];
export type DocumentType = 'QUOTATION' | 'PROFORMA_INVOICE' | 'TAX_INVOICE' | 'PAYMENT_RECEIPT' | 'CREDIT_NOTE' | 'DELIVERY_CHALLAN';

export interface CustomColumn {
  id: string;
  name: string;
}

export interface SavedQuoteRecord {
  id: string;
  docNo: string;
  docType: DocumentType;
  partyName: string;
  companyName: string;
  savedAt: string;
  totalAmount: number;
  status: 'DRAFT' | 'GENERATED_SENT' | 'SENT';
  pdfUrl?: string;
  sentVia?: 'EMAIL' | 'WHATSAPP_DIRECT' | 'WHATSAPP_CLOUD';
  sentToLead?: string;
  itemsCount: number;
  createdByName?: string;
  createdByRole?: string;
  payload: {
    items: LineItem[];
    customColumns: CustomColumn[];
    sectionOrder: SectionId[];
    sectionGap: number;
    pdfTopPadding: number;
    pdfBottomPadding: number;
    globalGstRate: number;
    gstType?: 'CGST_SGST' | 'IGST' | 'CGST_UTGST' | 'EXEMPT';
    docDate: string;
    validUntilDate: string;
    companyDetails?: CompanyDetails;
    partyDetails?: PartyDetails;
    termsText?: string;
    pdfUrl?: string;
  };
}

export interface CompanyDetails {
  id: string;
  name: string;
  logoUrl: string;
  address: string;
  email: string;
  phone: string;
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
  email: string;
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
  customValues?: { [colId: string]: string };
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

export interface TermsTemplate {
  id: string;
  name: string;
  text: string;
}

export const DEFAULT_TERMS_TEMPLATES: TermsTemplate[] = [
  {
    id: 't-1',
    name: 'Standard Commercial',
    text: '1. All disputes are subject to local jurisdiction only.\n2. Payment must be cleared within 2-3 days of bill submission.\n3. Goods once sold will not be taken back or exchanged.',
  },
  {
    id: 't-2',
    name: '50% Advance & Balance',
    text: '1. 50% advance payment along with formal Purchase Order.\n2. Balance 50% upon delivery of goods / materials at site.\n3. Delivery within 7 to 10 working days from PO confirmation.',
  },
  {
    id: 't-3',
    name: 'Strict 7-Day Net',
    text: '1. 100% payment within 7 calendar days from invoice date.\n2. Overdue payments subject to 18% p.a. commercial interest.\n3. Goods remain company property until paid in full.',
  },
  {
    id: 't-4',
    name: 'Service & Annual AMC',
    text: '1. Service charges payable quarterly in advance.\n2. Replacement of hardware/spares billed separately at actuals.\n3. 24-hour turnaround SLA for emergency maintenance calls.',
  },
];

// ─── Default Data Templates ───

const INITIAL_COMPANIES: CompanyDetails[] = [
  {
    id: 'comp-1',
    name: '',
    logoUrl: '',
    address: '',
    email: '',
    phone: '',
    gstNo: '',
    panNo: '',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    branch: '',
    upiId: '',
  },
];

const INITIAL_PARTIES: PartyDetails[] = [];

const DEFAULT_CATALOG_PRODUCTS: any[] = [];

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

const INITIAL_SAVED_QUOTES: SavedQuoteRecord[] = [];

export interface QuotationBuilderProps {
  externalOpenHistory?: boolean;
  onExternalOpenHistoryHandled?: () => void;
}

export function QuotationBuilder({ externalOpenHistory, onExternalOpenHistoryHandled }: QuotationBuilderProps = {}) {
  // Document Type Flow
  const [docType, setDocType] = useState<DocumentType>('QUOTATION');

  // Currently editing quote ID (null for new quote)
  const [currentEditingQuoteId, setCurrentEditingQuoteId] = useState<string | null>(null);

  // Synced Catalog Products from Database (/products) & Local Cache
  const [catalogProducts, setCatalogProducts] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('das_crm_products_catalog_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p: any) => ({
              id: p.id,
              name: p.name,
              desc: p.overview || p.description || '',
              hsn: p.sku || '998313',
              price: Number(p.price || 0),
              tax: Number(p.taxRate || 18),
              unit: p.unit || 'Pieces (Pcs)',
              image: p.coverImage || p.imageUrl || '',
            }));
          }
        }
      } catch (_) {}
    }
    return DEFAULT_CATALOG_PRODUCTS;
  });

  // Firebase Storage Saving Telemetry State
  const [isSavingFirebase, setIsSavingFirebase] = useState<boolean>(false);
  const [firebaseSaveSuccess, setFirebaseSaveSuccess] = useState<boolean>(false);

  // Recent Saved Quotes History Engine & Drawer
  const [savedQuotes, setSavedQuotes] = useState<SavedQuoteRecord[]>(INITIAL_SAVED_QUOTES);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'GENERATED_SENT' | 'QUOTATIONS' | 'INVOICES' | 'SHARED_LEADS'>('ALL');

  useEffect(() => {
    if (externalOpenHistory) {
      setHistoryDrawerOpen(true);
      if (onExternalOpenHistoryHandled) onExternalOpenHistoryHandled();
    }
  }, [externalOpenHistory, onExternalOpenHistoryHandled]);

  // Fetch Quotes & Drafts with Firebase PDF links from Database & Local Vault
  useEffect(() => {
    // 1. Instantly load from local storage cache
    if (typeof window !== 'undefined') {
      try {
        const localSaved = localStorage.getItem('das_crm_saved_quotes');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedQuotes(parsed);
          }
        }
      } catch (_) {}
    }

    // 2. Listen to real-time quote updates across windows & lead workspace
    const handleRemoteQuotesUpdate = (e?: any) => {
      if (typeof window !== 'undefined') {
        try {
          const localSaved = localStorage.getItem('das_crm_saved_quotes');
          if (localSaved) {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed)) setSavedQuotes(parsed);
          }
        } catch (_) {}
      }
    };
    window.addEventListener('das_crm_quotes_updated', handleRemoteQuotesUpdate);
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('das_crm_quote_channel');
        bc.onmessage = () => handleRemoteQuotesUpdate();
      }
    } catch (_) {}

    // 3. Fetch from remote backend / Supabase if available
    const fetchSavedQuotes = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
        let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBase.startsWith('http://localhost')) {
          apiBase = '/api';
        }
        
        const rawData: any[] = [];
        const seenKeys = new Set<string>();

        // 1. Fetch from NestJS backend
        try {
          const resBackend = await fetch(`${apiBase}/quotations`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (resBackend && resBackend.ok) {
            const data = await resBackend.json();
            if (Array.isArray(data)) {
              for (const it of data) {
                const k = it.quoteNumber || it.id || it.docNo;
                if (k && !seenKeys.has(k)) {
                  seenKeys.add(k);
                  rawData.push(it);
                }
              }
            }
          }
        } catch (_) {}

        // 2. Fetch from Next.js /api/quotations (Firestore + multi-browser bridge)
        try {
          const resApi = await fetch('/api/quotations');
          if (resApi && resApi.ok) {
            const data = await resApi.json();
            if (Array.isArray(data)) {
              for (const it of data) {
                const k = it.quoteNumber || it.id || it.docNo;
                if (k && !seenKeys.has(k)) {
                  seenKeys.add(k);
                  rawData.push(it);
                }
              }
            }
          }
        } catch (_) {}

        if (rawData.length > 0) {
          const data = rawData;
          if (Array.isArray(data) && data.length > 0) {
            const mapped: SavedQuoteRecord[] = data.map((q: any): SavedQuoteRecord => {
              let parsedNotes: any = {};
              try {
                if (q.notes && (q.notes.startsWith('{') || q.notes.startsWith('['))) {
                  parsedNotes = JSON.parse(q.notes);
                }
              } catch (_) {}

              const resolvedPdf = q.pdfUrl || q.payload?.pdfUrl || parsedNotes.pdfUrl || parsedNotes.payload?.pdfUrl;

              return {
                id: q.id,
                docNo: q.quoteNumber || q.id,
                docType: (q.docType || parsedNotes.docType || 'QUOTATION') as DocumentType,
                partyName: q.clientName || parsedNotes.partyName || 'Client',
                companyName: q.clientCompany || parsedNotes.companyName || 'Company',
                savedAt: q.createdAt ? new Date(q.createdAt).toLocaleString('en-IN') : 'Recently',
                totalAmount: Number(q.totalAmount || 0),
                status: ((q.status === 'SENT' || q.status === 'GENERATED_SENT') ? 'GENERATED_SENT' : 'DRAFT') as 'SENT' | 'DRAFT' | 'GENERATED_SENT',
                pdfUrl: resolvedPdf,
                sentVia: q.sentVia || q.payload?.sentVia || parsedNotes.sentVia,
                sentToLead: q.sentToLead || (q.clientName && q.clientName !== 'Client' ? q.clientName : undefined),
                createdByName: q.createdByName || parsedNotes.createdByName,
                createdByRole: q.createdByRole || parsedNotes.createdByRole,
                itemsCount: q.itemsCount || (q.items ? q.items.length : 0),
                payload: q.payload || parsedNotes.payload || {
                  items: q.items || [],
                  customColumns: [],
                  sectionOrder: ['HEADER', 'PARTY_INFO', 'ITEMS_TABLE', 'SUMMARY_AND_BANK', 'FOOTER_TERMS'],
                  sectionGap: 10,
                  pdfTopPadding: 32,
                  pdfBottomPadding: 28,
                  globalGstRate: 18,
                  docDate: new Date().toISOString().split('T')[0],
                  validUntilDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                  pdfUrl: resolvedPdf,
                },
              };
            });

            setSavedQuotes(prev => {
              const remoteKeys = new Set(mapped.map((m: any) => m.id || m.docNo));
              const combined = [...mapped, ...prev.filter(p => !remoteKeys.has(p.id) && !remoteKeys.has(p.docNo))];
              try {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('das_crm_saved_quotes', JSON.stringify(combined));
                }
              } catch (_) {}
              return combined;
            });
          }
        }
      } catch (e) {
        console.warn('Backend quote sync deferred:', e);
      }
    };
    fetchSavedQuotes();

    return () => {
      window.removeEventListener('das_crm_quotes_updated', handleRemoteQuotesUpdate);
      if (bc) bc.close();
    };
  }, []);

  // View Mode & Zoom Scale State (With Auto-responsive scaling for Mobile Viewports)
  const [viewMode, setViewMode] = useState<'SPLIT' | 'FULL_PREVIEW'>('SPLIT');
  const [zoomScale, setZoomScale] = useState<number>(0.78);

  const calculateFitScale = () => {
    if (typeof window !== 'undefined') {
      const padding = window.innerWidth < 640 ? 20 : 40;
      const availableWidth = Math.max(260, Math.min(window.innerWidth - padding, 794));
      const fit = Math.round((availableWidth / 794) * 100) / 100;
      return Math.max(0.30, Math.min(1.0, fit));
    }
    return 0.78;
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setZoomScale(calculateFitScale());
        }
      }, 150);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mobile Tab State (BUILDER vs PREVIEW for Smartphone Viewports)
  const [mobileActiveTab, setMobileActiveTab] = useState<'BUILDER' | 'PREVIEW'>('BUILDER');
  const [showMobileMoreActions, setShowMobileMoreActions] = useState<boolean>(false);

  // PDF Page & Margin Controls State
  const [pdfMargin, setPdfMargin] = useState<number>(10); // 6mm, 10mm, 15mm
  const [pdfPageMode, setPdfPageMode] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [pdfTopPadding, setPdfTopPadding] = useState<number>(32); // 10px to 50px
  const [pdfBottomPadding, setPdfBottomPadding] = useState<number>(28); // 10px to 50px

  // Section Spacing, Ordering & Visibility State
  const [sectionGap, setSectionGap] = useState<number>(10); // 4px, 8px, 12px, 16px, 20px
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>([
    'HEADER',
    'PARTY_INFO',
    'ITEMS_TABLE',
    'SUMMARY_AND_BANK',
    'FOOTER_TERMS'
  ]);
  const [visibleSections, setVisibleSections] = useState<{ [key in SectionId]: boolean }>({
    HEADER: true,
    PARTY_INFO: true,
    ITEMS_TABLE: true,
    SUMMARY_AND_BANK: true,
    FOOTER_TERMS: true
  });

  const moveSectionUp = (id: SectionId) => {
    const index = sectionOrder.indexOf(id);
    if (index <= 0) return;
    const newOrder = [...sectionOrder];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    setSectionOrder(newOrder);
  };

  const moveSectionDown = (id: SectionId) => {
    const index = sectionOrder.indexOf(id);
    if (index === -1 || index >= sectionOrder.length - 1) return;
    const newOrder = [...sectionOrder];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    setSectionOrder(newOrder);
  };

  const toggleSectionVisibility = (id: SectionId) => {
    setVisibleSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetSectionLayout = () => {
    setSectionGap(10);
    setPdfTopPadding(32);
    setPdfBottomPadding(28);
    setSectionOrder(['HEADER', 'PARTY_INFO', 'ITEMS_TABLE', 'SUMMARY_AND_BANK', 'FOOTER_TERMS']);
    setVisibleSections({
      HEADER: true,
      PARTY_INFO: true,
      ITEMS_TABLE: true,
      SUMMARY_AND_BANK: true,
      FOOTER_TERMS: true
    });
  };

  // Table Column Visibility & Tax Mechanism Controls (GST Type, GST %, HSN/SAC & Custom Columns)
  const [globalGstRate, setGlobalGstRate] = useState<number>(18);
  const [gstType, setGstType] = useState<'CGST_SGST' | 'IGST' | 'CGST_UTGST' | 'EXEMPT'>('CGST_SGST');
  const [showGstColumn, setShowGstColumn] = useState<boolean>(true);
  const [showHsnColumn, setShowHsnColumn] = useState<boolean>(true);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([
    { id: 'col-1', name: 'Make / Brand' },
    { id: 'col-2', name: 'Warranty Period' },
  ]);

  const addCustomColumn = () => {
    const newColId = `col-${Date.now()}`;
    setCustomColumns(prev => [...prev, { id: newColId, name: `Column ${prev.length + 1}` }]);
  };

  const updateCustomColumnName = (id: string, name: string) => {
    setCustomColumns(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  const removeCustomColumn = (id: string) => {
    setCustomColumns(prev => prev.filter(c => c.id !== id));
  };

  // (Database Save Draft, Firebase Storage Sync, and Load Quote functions are implemented below with full financial & validation context)

  const handleDirectSendQuote = (record: SavedQuoteRecord, channel: 'EMAIL' | 'WHATSAPP_DIRECT' | 'WHATSAPP_CLOUD') => {
    if (channel === 'WHATSAPP_CLOUD') {
      alert('☁️ WhatsApp Cloud Integration is coming soon! Direct WhatsApp Web message is enabled now.');
      return;
    }

    const leadContact = record.sentToLead || (activeParty ? (activeParty.email || activeParty.phone) : '');

    setSavedQuotes(prev => prev.map(q => {
      if (q.id === record.id) {
        return {
          ...q,
          status: 'GENERATED_SENT',
          sentVia: channel,
          sentToLead: leadContact || (channel === 'EMAIL' ? 'lead@client.com' : '+91 98000 00000')
        };
      }
      return q;
    }));

    const buyerName = record.partyName;
    const sellerName = record.companyName;
    const docNo = record.docNo;
    const docTypeLabel = record.docType.replace('_', ' ');
    const totalFormatted = `₹${record.totalAmount.toLocaleString('en-IN')}`;

    if (channel === 'EMAIL') {
      const subject = encodeURIComponent(`${docTypeLabel} #${docNo} from ${sellerName}`);
      const body = encodeURIComponent(
        `Dear ${buyerName},\n\nPlease find attached the ${docTypeLabel} #${docNo} for total amount ${totalFormatted}.\n\n` +
        `Document Details:\n- Document #: ${docNo}\n- Total Amount: ${totalFormatted}\n- Issuer: ${sellerName}\n\n` +
        `Generated via DAS CRM (www.dascrm.com)\n\nBest regards,\n${record.createdByName || 'Sales Team'}`
      );
      window.open(`mailto:${leadContact || ''}?subject=${subject}&body=${body}`, '_blank');
    } else if (channel === 'WHATSAPP_DIRECT') {
      const message = encodeURIComponent(
        `Hello *${buyerName}*,\n\nHere is your official *${docTypeLabel} #${docNo}* from *${sellerName}*.\n\n` +
        `Total Amount: *${totalFormatted}*\n\n` +
        `Generated with DAS CRM — www.dascrm.com`
      );
      const cleanPhone = (leadContact || '').replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone ? cleanPhone : ''}?text=${message}`, '_blank');
    }
  };

  const handleNewQuoteReset = () => {
    const yr = new Date().getFullYear();
    setDocNo(`EST-${yr}-${Math.floor(1000 + Math.random() * 9000)}`);
    setItems([
      {
        id: `item-${Date.now()}`,
        productName: '',
        description: '',
        showDescription: false,
        hsnCode: '',
        showImage: false,
        unit: 'Nos',
        qty: 1,
        unitPrice: 0,
        taxRate: 18,
        discountType: 'flat',
        discountVal: 0,
        total: 0
      }
    ]);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__resetQuoteBuilder = handleNewQuoteReset;
    }
  }, [handleNewQuoteReset]);

  // Smooth Slidable Accordion Sections State — Closed by default, strictly one open at a time
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      // If clicked section is already open, close it (sink it)
      if (prev[key]) {
        return {};
      }
      // Exclusive accordion: close all others, open only key
      return { [key]: true };
    });
  };

  // Shipping Address State
  const [useSeparateShipping, setUseSeparateShipping] = useState<boolean>(false);
  const [customShippingAddress, setCustomShippingAddress] = useState<string>('');

  // Company State
  const [companies, setCompanies] = useState<CompanyDetails[]>(INITIAL_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(INITIAL_COMPANIES[0]?.id || 'comp-1');
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [newComp, setNewComp] = useState<Partial<CompanyDetails>>({});

  // Party State
  const [parties, setParties] = useState<PartyDetails[]>(INITIAL_PARTIES);
  const [selectedPartyId, setSelectedPartyId] = useState<string>(INITIAL_PARTIES[0]?.id || '');
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [newParty, setNewParty] = useState<Partial<PartyDetails>>({});

  // Line Items
  const [items, setItems] = useState<LineItem[]>([
    {
      id: 'item-1',
      productName: '',
      description: '',
      showDescription: false,
      hsnCode: '',
      showImage: false,
      unit: 'Nos',
      qty: 1,
      unitPrice: 0,
      taxRate: 18,
      discountType: 'flat',
      discountVal: 0,
      total: 0,
    },
  ]);

  // Document Metadata & Optional "Valid Until" Date State
  const [docNo, setDocNo] = useState(`EST-${new Date().getFullYear()}-0001`);
  const [docDate, setDocDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [validUntilDate, setValidUntilDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')
  );
  const [showValidUntil, setShowValidUntil] = useState<boolean>(true);

  // Sync tenant organization name from logged in user if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('das_crm_user') || '{}');
        const orgName = u?.organization?.name || u?.companyName;
        if (orgName) {
          setCompanies(prev => prev.map((c, i) => i === 0 ? { ...c, name: orgName } : c));
        }
      } catch (e) {}
    }
  }, []);

  // 📦 Sync Active Products directly from Product Section Database (/products) & Cache
  useEffect(() => {
    const handleRemoteUpdate = (e?: any) => {
      if (e?.detail && e.detail.id) {
        const p = e.detail;
        const item = {
          id: p.id,
          name: p.name,
          desc: p.overview || p.description || '',
          hsn: p.sku || '998313',
          price: Number(p.price || 0),
          tax: Number(p.taxRate || 18),
          unit: p.unit || 'Pieces (Pcs)',
          image: p.coverImage || p.imageUrl || '',
        };
        setCatalogProducts(prev => {
          const idx = prev.findIndex(cp => cp.id === item.id || cp.name === item.name);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = item;
            return next;
          }
          return [item, ...prev];
        });
        return;
      }
      try {
        const cached = localStorage.getItem('das_crm_products_catalog_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCatalogProducts(parsed.map((p: any) => ({
              id: p.id,
              name: p.name,
              desc: p.overview || p.description || '',
              hsn: p.sku || '998313',
              price: Number(p.price || 0),
              tax: Number(p.taxRate || 18),
              unit: p.unit || 'Pieces (Pcs)',
              image: p.coverImage || p.imageUrl || '',
            })));
          }
        }
      } catch (_) {}
    };

    window.addEventListener('das_crm_products_updated', handleRemoteUpdate);
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('das_crm_product_channel');
        bc.onmessage = (ev) => {
          if (ev.data?.type === 'PRODUCT_DELETED' && ev.data.productId) {
            setCatalogProducts(prev => prev.filter(cp => cp.id !== ev.data.productId));
          } else if (ev.data?.product) {
            handleRemoteUpdate({ detail: ev.data.product });
          } else {
            handleRemoteUpdate();
          }
        };
      }
    } catch (_) {}

    const fetchCatalogProducts = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
        let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBase.startsWith('http://localhost')) {
          apiBase = '/api';
        }
        let res: Response | null = null;
        try {
          res = await fetch(`${apiBase}/products`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          });
        } catch (_) {
          res = await fetch('/api/products');
        }
        if (res && res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCatalogProducts(data.map((p: any) => ({
              id: p.id,
              name: p.name,
              desc: p.description || p.overview || '',
              hsn: p.sku || '998313',
              price: Number(p.price || 0),
              tax: Number(p.taxRate || 18),
              unit: p.unit || 'Pieces (Pcs)',
              image: p.coverImage || p.imageUrl || '',
            })));
          }
        }
      } catch (e) {
        console.warn('Failed to sync products from backend catalog:', e);
      }
    };
    fetchCatalogProducts();

    return () => {
      window.removeEventListener('das_crm_products_updated', handleRemoteUpdate);
      if (bc) bc.close();
    };
  }, []);

  // 🏢 Sync Seller Company from seller-profile endpoint (cross-device persistent)
  useEffect(() => {
    // 1. Instantly load from localStorage cache
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('das_crm_seller_companies');
        if (cached) {
          const parsed: CompanyDetails[] = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCompanies(parsed);
            setSelectedCompanyId(parsed[0].id);
          }
        }
      } catch (_) {}
    }

    const fetchSellerProfile = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
        let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBase.startsWith('http://localhost')) {
          apiBase = '/api';
        }

        // Try Next.js /api/organization/seller-profile first (file-based persistent store)
        let profile: any = null;
        try {
          const res = await fetch('/api/organization/seller-profile');
          if (res.ok) profile = await res.json();
        } catch (_) {}

        // Fallback: Backend seller-profile (Prisma DB — cross-device)
        if (!profile || !profile.name) {
          try {
            const res = await fetch(`${apiBase}/organizations/seller-profile`, {
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            });
            if (res.ok) {
              profile = await res.json();
            }
          } catch (_) {}
        }

        if (profile && (profile.name || profile.address || profile.phone || profile.gstNumber || profile.logoUrl)) {
          setCompanies(prev => {
            const existing = prev[0] || {} as any;
            const comp: CompanyDetails = {
              id: profile.id || existing.id || 'comp-1',
              name: profile.name || existing.name || '',
              logoUrl: profile.logoUrl || existing.logoUrl || '',
              address: profile.address || existing.address || '',
              email: profile.email || existing.email || '',
              phone: profile.phone || existing.phone || '',
              gstNo: profile.gstNumber || profile.gstNo || existing.gstNo || '',
              panNo: profile.panNumber || profile.panNo || existing.panNo || '',
              bankName: profile.bankDetails?.bankName || existing.bankName || '',
              accountNo: profile.bankDetails?.accountNo || existing.accountNo || '',
              ifscCode: profile.bankDetails?.ifscCode || existing.ifscCode || '',
              branch: profile.bankDetails?.branch || existing.branch || '',
              upiId: profile.bankDetails?.upiId || existing.upiId || '',
            };
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem('das_crm_seller_companies', JSON.stringify([comp]));
              }
            } catch (_) {}
            return [comp];
          });
          setSelectedCompanyId(profile.id || 'comp-1');
        }
      } catch (e) {
        console.warn('Failed to load seller profile from backend:', e);
      }
    };
    fetchSellerProfile();

    // Listen to real-time company updates
    const handleRemoteCompanyUpdate = (e?: any) => {
      if (e?.detail && e.detail.name) {
        const updated = e.detail as CompanyDetails;
        setCompanies([updated]);
        setSelectedCompanyId(updated.id);
        return;
      }
      fetchSellerProfile();
    };
    window.addEventListener('das_crm_seller_profile_updated', handleRemoteCompanyUpdate);
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('das_crm_company_channel');
        bc.onmessage = () => fetchSellerProfile();
      }
    } catch (_) {}

    return () => {
      window.removeEventListener('das_crm_seller_profile_updated', handleRemoteCompanyUpdate);
      if (bc) bc.close();
    };
  }, []);

  // 👤 Sync Buyer / Client Parties from Database (/api/parties, /contacts & /leads)
  useEffect(() => {
    // 1. Instantly load saved parties from localStorage cache
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('das_crm_saved_parties');
        if (cached) {
          const parsed: PartyDetails[] = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setParties(parsed);
            setSelectedPartyId(parsed[0].id);
          }
        }
      } catch (_) {}
    }

    const fetchBuyers = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
        let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBase.startsWith('http://localhost')) {
          apiBase = '/api';
        }

        const fetchedParties: PartyDetails[] = [];
        const seenNames = new Set<string>();

        // Priority 1: /api/parties (file-based persistent store — always reliable)
        try {
          const res = await fetch('/api/parties');
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              data.forEach((p: any) => {
                if (!seenNames.has(p.name)) {
                  seenNames.add(p.name);
                  fetchedParties.push({
                    id: p.id,
                    name: p.name,
                    contactPerson: p.contactPerson || '',
                    email: p.email || '',
                    phone: p.phone || '',
                    address: p.address || 'Billed To Address',
                    shippingAddress: p.shippingAddress || '',
                    gstNo: p.gstNo || '',
                    panNo: p.panNo || '',
                  });
                }
              });
            }
          }
        } catch (_) {}

        // Priority 2: Backend /contacts (Prisma DB)
        try {
          const contactsRes = await fetch(`${apiBase}/contacts`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          });
          if (contactsRes.ok) {
            const cJson = await contactsRes.json();
            const cList = Array.isArray(cJson) ? cJson : cJson?.items || [];
            cList.forEach((c: any) => {
              const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.company?.name || 'Contact';
              if (!seenNames.has(fullName)) {
                seenNames.add(fullName);
                fetchedParties.push({
                  id: `contact-${c.id}`,
                  name: fullName,
                  contactPerson: fullName,
                  email: c.email || '',
                  phone: c.phone || '',
                  address: c.customFields?.address || (c.company?.name ? `${c.company.name}, Registered Office` : 'Billed To Address'),
                  shippingAddress: c.customFields?.shippingAddress || '',
                  gstNo: c.customFields?.gstNo || '',
                  panNo: c.customFields?.panNo || '',
                });
              }
            });
          }
        } catch (_) {}

        // Priority 3: Backend /leads
        try {
          const leadsRes = await fetch(`${apiBase}/leads`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          });
          if (leadsRes.ok) {
            const lJson = await leadsRes.json();
            const lList = Array.isArray(lJson) ? lJson : lJson?.items || [];
            lList.forEach((l: any) => {
              const leadName = l.name || [l.firstName, l.lastName].filter(Boolean).join(' ') || l.company || 'Lead Client';
              if (!seenNames.has(leadName)) {
                seenNames.add(leadName);
                fetchedParties.push({
                  id: `lead-${l.id}`,
                  name: leadName,
                  contactPerson: leadName,
                  email: l.email || '',
                  phone: l.phone || '',
                  address: l.address || l.company || 'Billed To Address',
                  shippingAddress: '',
                  gstNo: l.gstNumber || l.customFields?.gstNo || '',
                  panNo: l.panNumber || l.customFields?.panNo || '',
                });
              }
            });
          }
        } catch (_) {}

        // Merge with existing local party modifications so user edits are preserved
        let localSavedParties: PartyDetails[] = [];
        try {
          if (typeof window !== 'undefined') {
            const raw = localStorage.getItem('das_crm_saved_parties');
            if (raw) localSavedParties = JSON.parse(raw);
          }
        } catch (_) {}

        const mergedParties = fetchedParties.map(fp => {
          const custom = localSavedParties.find(cp => cp.id === fp.id || cp.name === fp.name);
          return custom ? { ...fp, ...custom } : fp;
        });
        localSavedParties.forEach(cp => {
          if (!mergedParties.some(mp => mp.id === cp.id)) {
            mergedParties.unshift(cp);
          }
        });

        if (mergedParties.length > 0) {
          setParties(mergedParties);
          setSelectedPartyId(prev => (prev && mergedParties.some(p => p.id === prev)) ? prev : mergedParties[0].id);
          // Update localStorage cache
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('das_crm_saved_parties', JSON.stringify(mergedParties));
            }
          } catch (_) {}
        }
      } catch (err) {
        console.warn('Failed to load buyers from backend:', err);
      }
    };
    fetchBuyers();

    // Listen to real-time party updates
    const handleRemotePartyUpdate = (e?: any) => {
      if (e?.detail && e.detail.name) {
        const updated = e.detail as PartyDetails;
        setParties(prev => {
          const exists = prev.find(p => p.id === updated.id);
          const next = exists ? prev.map(p => p.id === updated.id ? updated : p) : [updated, ...prev];
          try {
            localStorage.setItem('das_crm_saved_parties', JSON.stringify(next));
          } catch (_) {}
          return next;
        });
        return;
      }
      fetchBuyers();
    };
    window.addEventListener('das_crm_parties_updated', handleRemotePartyUpdate);
    let bcParty: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bcParty = new BroadcastChannel('das_crm_party_channel');
        bcParty.onmessage = () => fetchBuyers();
      }
    } catch (_) {}

    return () => {
      window.removeEventListener('das_crm_parties_updated', handleRemotePartyUpdate);
      if (bcParty) bcParty.close();
    };
  }, []);

  // Overall Discount & Terms
  const [overallDiscountType, setOverallDiscountType] = useState<'flat' | 'percent'>('flat');
  const [overallDiscountVal, setOverallDiscountVal] = useState(0);
  const [termsText, setTermsText] = useState(
    '1. All disputes are subject to local jurisdiction only.\n2. Payment must be cleared within agreed terms.'
  );

  // ── Terms Templates State (Select from Previous or Add New) ──
  const [termsTemplates, setTermsTemplates] = useState<TermsTemplate[]>(DEFAULT_TERMS_TEMPLATES);
  const [selectedTermsId, setSelectedTermsId] = useState<string>('t-1');
  const [isAddingNewTerms, setIsAddingNewTerms] = useState<boolean>(false);
  const [newTermsTemplateName, setNewTermsTemplateName] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('das_crm_terms_templates');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) setTermsTemplates(parsed);
        }
      } catch (e) {
        console.error('Failed to load terms templates from storage', e);
      }
    }
  }, []);

  const handleSaveCustomTerms = () => {
    if (!newTermsTemplateName.trim()) {
      alert('Please enter a template name.');
      return;
    }
    const newT: TermsTemplate = {
      id: `tmpl-${Date.now()}`,
      name: newTermsTemplateName.trim(),
      text: termsText,
    };
    const updated = [...termsTemplates, newT];
    setTermsTemplates(updated);
    setSelectedTermsId(newT.id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('das_crm_terms_templates', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save terms template', e);
      }
    }
    setNewTermsTemplateName('');
    setIsAddingNewTerms(false);
  };

  // ── More Controls Toggle State (Slides Sections 5 to 8) ──
  const [showMoreControls, setShowMoreControls] = useState<boolean>(false);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // ── Refresh & Compile PDF Engine State ──
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileSuccess, setCompileSuccess] = useState(false);
  const [compileVersion, setCompileVersion] = useState(1);
  const [lastCompiledAt, setLastCompiledAt] = useState<string | null>(null);
  const [isHighlightingPreview, setIsHighlightingPreview] = useState(false);

  // ── Word / DOCX Export State ──
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [docxSuccess, setDocxSuccess] = useState(false);

  // Refresh & Compile: Flushes active inputs, sanitizes item data, recomputes financials & forces preview re-render
  const handleCompilePdf = useCallback(() => {
    setIsCompiling(true);

    // 1. Flush any active focused input element so uncommitted keystrokes register
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 2. Sanitize and recalculate all line items strictly
    setItems(prevItems =>
      prevItems.map(it => {
        const qty = isNaN(Number(it.qty)) ? 1 : Math.max(0, Number(it.qty));
        const unitPrice = isNaN(Number(it.unitPrice)) ? 0 : Math.max(0, Number(it.unitPrice));
        const discountVal = isNaN(Number(it.discountVal)) ? 0 : Math.max(0, Number(it.discountVal));
        const taxRate = isNaN(Number(it.taxRate)) ? globalGstRate : Math.max(0, Number(it.taxRate));
        const base = qty * unitPrice;
        const itemDisc = it.discountType === 'percent' ? base * (discountVal / 100) : discountVal;
        const total = Math.max(0, base - itemDisc);
        return { ...it, qty, unitPrice, discountVal, taxRate, total };
      })
    );

    // 3. Force re-compilation of A4 preview with timestamp and visual highlight
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      setLastCompiledAt(timeStr);
      setCompileVersion(v => v + 1);
      setIsCompiling(false);
      setCompileSuccess(true);
      setIsHighlightingPreview(true);

      setTimeout(() => {
        setIsHighlightingPreview(false);
      }, 1800);

      setTimeout(() => {
        setCompileSuccess(false);
      }, 2500);
    }, 350);
  }, [globalGstRate]);


  // Selected Active Company & Party
  const activeCompany = (companies && companies.length > 0)
    ? (companies.find(c => c.id === selectedCompanyId) || companies[0])
    : null;
  const activeParty = (parties && parties.length > 0)
    ? (parties.find(p => p.id === selectedPartyId) || parties[0])
    : null;

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

  const effectiveGstTaxTotal = (gstType === 'EXEMPT' || globalGstRate === 0) ? 0 : gstTaxTotal;
  const grandTotal = Math.round(finalTaxable + effectiveGstTaxTotal);

  // ── Validation: Buyer, Seller & Product Selection Flags ──
  const hasSeller = Boolean(
    activeCompany &&
    activeCompany.name &&
    activeCompany.name.trim().length > 0 &&
    activeCompany.name !== 'Your Company'
  );

  const hasBuyer = Boolean(
    activeParty &&
    activeParty.name &&
    activeParty.name.trim().length > 0 &&
    activeParty.name !== 'Client / Party Name'
  );

  const hasProduct = Boolean(
    items &&
    items.length > 0 &&
    items.some(it => it.productName && it.productName.trim().length > 0 && (Number(it.qty) > 0 || Number(it.unitPrice) >= 0))
  );

  // Crucial: Save & Save Draft options are strictly clickable only after selecting/entering Buyer, Seller and Product
  const isReadyToSave = hasSeller && hasBuyer && hasProduct;

  // ── 8-Step Completion Checkers & Progress Flags ──
  const isStep1Done = Boolean(docNo?.trim() && docDate?.trim() && (!showValidUntil || (validUntilDate && validUntilDate.trim() !== '')));
  const isStep2Done = hasSeller;
  const isStep3Done = hasBuyer;
  const isStep4Done = hasProduct;
  const isStep5Done = Boolean(termsText && termsText.trim().length > 0);
  const isStep6Done = Boolean(gstType);
  const isStep7Done = Boolean(pdfMargin > 0 && pdfTopPadding > 0);
  const isStep8Done = Boolean(sectionOrder.length > 0);

  // ── 4 Core Steps (Required for Generation) & Optional Formatting Steps ──
  const coreCompletedCount = [isStep1Done, isStep2Done, isStep3Done, isStep4Done].filter(Boolean).length;
  const isCoreReady = coreCompletedCount === 4;
  const optionalCompletedCount = [isStep5Done, isStep6Done, isStep7Done, isStep8Done].filter(Boolean).length;
  const completedStepsCount = coreCompletedCount + optionalCompletedCount;

  // ⚡ 1-Click Quick-Fill Buyer & Item
  const handleQuickFillSampleData = () => {
    // 1. Ensure seller company is valid
    if (!hasSeller && companies.length > 0 && companies[0].name) {
      setSelectedCompanyId(companies[0].id);
    }
    // 2. Ensure buyer party is valid
    if (!hasBuyer && parties.length > 0 && parties[0].name) {
      setSelectedPartyId(parties[0].id);
    }
    // 3. Ensure product item is valid
    if (!hasProduct && catalogProducts.length > 0) {
      const sampleProd = catalogProducts[0];
      setItems([
        {
          id: `item-${Date.now()}`,
          productName: sampleProd.name || '',
          description: sampleProd.desc || '',
          showDescription: !!sampleProd.desc,
          hsnCode: sampleProd.hsn || '',
          showImage: false,
          unit: sampleProd.unit || 'Pieces (Pcs)',
          qty: 1,
          unitPrice: sampleProd.price || 0,
          taxRate: sampleProd.tax || 18,
          discountType: 'percent',
          discountVal: 0,
          total: sampleProd.price || 0,
        },
      ]);
    }
  };



  // ── Helper: Fetch any image URL and convert to base64 data URL for PDF embedding ──
  // Handles: data: URIs (already base64), relative paths (/products/…), absolute URLs
  const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    if (!url || url.trim() === '') return null;
    // Already a base64 data URL — use directly
    if (url.startsWith('data:')) return url;
    // Try fetching the image and converting
    try {
      const fetchUrl = url.startsWith('/') ? url : url;
      const resp = await fetch(fetchUrl, { cache: 'force-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      // Try localStorage cache for logos/product images that may have been saved there
      try {
        if (typeof window !== 'undefined') {
          const cacheKey = `das_crm_img_cache_${url}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached && cached.startsWith('data:')) return cached;
        }
      } catch {}
      return null;
    }
  };

  // 📄 Generate High-Fidelity Vector A4 PDF Blob using jsPDF
  const generateQuotationPdfBlob = async (): Promise<Blob> => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const H = 297;
    const margin = 12;

    // ── Pre-load logo and product images as base64 before drawing PDF ──
    const logoBase64 = activeCompany?.logoUrl ? await fetchImageAsBase64(activeCompany.logoUrl) : null;
    const itemImagesMap: Record<string, string | null> = {};
    for (const it of items) {
      if (it.showImage && it.imageUrl) {
        itemImagesMap[it.id] = await fetchImageAsBase64(it.imageUrl);
      }
    }

    // Navy Blue Top Brand Accent Bar (#002060)
    doc.setFillColor(0, 32, 96);
    doc.rect(0, 0, W, 3.5, 'F');

    // Header Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, 8, W - 2 * margin, 32, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, 8, W - 2 * margin, 32, 2, 2, 'D');

    // Company Logo + Name (logo occupies 14x14mm; text offset right when logo present)
    const logoX = margin + 2;
    const logoY = 10;
    const logoSize = 16;
    const textOffsetX = logoBase64 ? margin + logoSize + 4 : margin + 5;

    if (logoBase64) {
      try {
        // Draw white rounded background for logo
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(logoX, logoY, logoSize, logoSize, 1.5, 1.5, 'F');
        doc.addImage(logoBase64, 'JPEG', logoX, logoY, logoSize, logoSize);
      } catch (imgErr) {
        console.warn('[PDF] Could not embed logo:', imgErr);
      }
    }

    doc.setTextColor(0, 32, 96);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(activeCompany?.name || 'Company', textOffsetX, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const maxAddrWidth = W - textOffsetX - margin - 50; // leave space for doc title on right
    const addrLines = doc.splitTextToSize(activeCompany?.address || 'Registered Address', maxAddrWidth);
    doc.text(addrLines.slice(0, 2), textOffsetX, 22);
    doc.text(`Email: ${activeCompany?.email || ''} | Ph: ${activeCompany?.phone || ''}`, textOffsetX, logoBase64 ? 28 : 27);
    doc.text(`GSTIN: ${activeCompany?.gstNo || 'N/A'} | PAN: ${activeCompany?.panNo || 'N/A'}`, textOffsetX, logoBase64 ? 33 : 32);

    // Doc Title & Meta (Right Aligned)
    doc.setTextColor(0, 32, 96);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.text(getDocTitle(), W - margin - 5, 17, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Doc #: ${docNo}`, W - margin - 5, 23, { align: 'right' });
    doc.text(`Date: ${docDate}`, W - margin - 5, 28, { align: 'right' });
    if (showValidUntil && validUntilDate) {
      doc.text(`Valid Until: ${validUntilDate}`, W - margin - 5, 33, { align: 'right' });
    }

    // Buyer Info Card
    let currentY = 44;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, W - 2 * margin, 24, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, W - 2 * margin, 24, 2, 2, 'D');

    doc.setTextColor(0, 32, 96);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('BILLED TO / BUYER:', margin + 5, currentY + 6);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(activeParty?.name || 'Client Name', margin + 5, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(activeParty?.address || 'Client Address', margin + 5, currentY + 17);
    doc.text(`Contact: ${activeParty?.phone || ''} | ${activeParty?.email || ''} | GSTIN: ${activeParty?.gstNo || 'N/A'}`, margin + 5, currentY + 22);

    // Line Items Table Header
    currentY += 28;
    doc.setFillColor(0, 32, 96);
    doc.rect(margin, currentY, W - 2 * margin, 7, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('#', margin + 3, currentY + 4.8);
    doc.text('Item Description', margin + 12, currentY + 4.8);
    doc.text('HSN', margin + 95, currentY + 4.8);
    doc.text('Qty', margin + 115, currentY + 4.8, { align: 'right' });
    doc.text('Rate (₹)', margin + 140, currentY + 4.8, { align: 'right' });
    doc.text('GST %', margin + 158, currentY + 4.8, { align: 'right' });
    doc.text('Total (₹)', W - margin - 3, currentY + 4.8, { align: 'right' });

    // Rows
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    items.forEach((it, idx) => {
      if (currentY > 230) return;

      // Determine row height — taller rows when product image is shown
      const hasItemImg = it.showImage && !!itemImagesMap[it.id];
      const rowH = hasItemImg ? 10 : 7;

      const rowBg = idx % 2 === 0 ? 255 : 248;
      doc.setFillColor(rowBg, rowBg, rowBg);
      doc.rect(margin, currentY, W - 2 * margin, rowH, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, currentY + rowH, W - margin, currentY + rowH);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      const rowMidY = currentY + rowH / 2 + 1.5;

      doc.text(String(idx + 1), margin + 3, rowMidY);

      // Product image (inline, left of item name)
      let itemTextX = margin + 12;
      if (hasItemImg) {
        try {
          const imgSize = rowH - 2; // 8mm square
          doc.addImage(itemImagesMap[it.id]!, 'JPEG', itemTextX, currentY + 1, imgSize, imgSize);
          itemTextX += imgSize + 1.5;
        } catch { /* image embed failed — just skip */ }
      }

      const maxTitleWidth = 80 - (itemTextX - (margin + 12));
      const itemTitle = it.productName.length > 38 ? it.productName.substring(0, 36) + '…' : it.productName;
      doc.text(itemTitle, itemTextX, rowMidY);

      doc.text(it.hsnCode || '—', margin + 95, rowMidY);
      doc.text(`${it.qty} ${it.unit || ''}`.trim(), margin + 115, rowMidY, { align: 'right' });
      doc.text(it.unitPrice.toLocaleString('en-IN'), margin + 140, rowMidY, { align: 'right' });
      doc.text(`${it.taxRate}%`, margin + 158, rowMidY, { align: 'right' });
      doc.text(it.total.toLocaleString('en-IN'), W - margin - 3, rowMidY, { align: 'right' });
      currentY += rowH;
    });

    // Financial Totals Box
    currentY += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, currentY, W - margin, currentY);

    const totalsX = W - margin - 70;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Subtotal:', totalsX, currentY + 6);
    doc.text(`₹${subtotal.toLocaleString('en-IN')}`, W - margin - 3, currentY + 6, { align: 'right' });

    doc.text('Taxable Base:', totalsX, currentY + 11);
    doc.text(`₹${finalTaxable.toLocaleString('en-IN')}`, W - margin - 3, currentY + 11, { align: 'right' });

    doc.text(`GST Tax (${globalGstRate}%):`, totalsX, currentY + 16);
    doc.text(`₹${effectiveGstTaxTotal.toLocaleString('en-IN')}`, W - margin - 3, currentY + 16, { align: 'right' });

    doc.setFillColor(0, 32, 96);
    doc.rect(totalsX - 2, currentY + 19, 72, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Grand Total:', totalsX + 2, currentY + 24.5);
    doc.text(`₹${grandTotal.toLocaleString('en-IN')}`, W - margin - 3, currentY + 24.5, { align: 'right' });

    // Bank Info
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Bank & Settlement Details:', margin, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Bank: ${activeCompany?.bankName || 'HDFC Bank'} | A/C: ${activeCompany?.accountNo || '50200012345678'}`, margin, currentY + 11);
    doc.text(`IFSC: ${activeCompany?.ifscCode || 'HDFC0001234'} | UPI: ${activeCompany?.upiId || 'company@upi'}`, margin, currentY + 16);
    doc.text(`Amount in Words: ${numberToWordsINR(grandTotal)}`, margin, currentY + 22);

    // Terms & Conditions
    currentY += 32;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 32, 96);
    doc.text('Terms & Conditions:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const termsLines = doc.splitTextToSize(termsText || '1. Goods once sold will not be taken back.', W - 2 * margin);
    doc.text(termsLines.slice(0, 4), margin, currentY + 4);

    // Footer bar
    doc.setFillColor(248, 250, 252);
    doc.rect(0, H - 10, W, 10, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(0, H - 10, W, H - 10);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.text('Generated by DAS CRM — Official Quotation & Invoice Engine', margin, H - 4);
    doc.text('www.dascrm.com', W - margin, H - 4, { align: 'right' });

    return doc.output('blob');
  };

  // ── Helper: Convert Blob to Base64 Data URL ──
  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // ── Helper: Universally open or download quote PDF across all browsers ──
  const handleOpenOrDownloadPdf = async (record: SavedQuoteRecord, mode: 'VIEW' | 'DOWNLOAD' = 'VIEW') => {
    let targetUrl = record.pdfUrl;

    const isRealHttpUrl = Boolean(
      targetUrl &&
      targetUrl.startsWith('http') &&
      !targetUrl.includes('id=drive_') &&
      !targetUrl.includes('id=gdrive_') &&
      !targetUrl.includes('/drive_')
    );

    if (isRealHttpUrl && targetUrl) {
      if (mode === 'VIEW') {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
        return;
      } else {
        const a = document.createElement('a');
        a.href = targetUrl;
        a.download = `${record.docNo}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
    }

    if (targetUrl && targetUrl.startsWith('data:')) {
      try {
        const byteCharacters = atob(targetUrl.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        if (mode === 'VIEW') {
          window.open(blobUrl, '_blank');
        } else {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${record.docNo}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        return;
      } catch (_) {}
    }

    // Dynamic on-demand vector PDF regeneration fallback
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210;
      const H = 297;
      const margin = 12;

      doc.setFillColor(0, 32, 96);
      doc.rect(0, 0, W, 3.5, 'F');

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, 8, W - 2 * margin, 32, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, 8, W - 2 * margin, 32, 2, 2, 'D');

      doc.setTextColor(0, 32, 96);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(record.companyName || 'Company', margin + 5, 17);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Official Quotation & Proforma Document', margin + 5, 23);

      doc.setTextColor(0, 32, 96);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.text(record.docType.replace('_', ' '), W - margin - 5, 17, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Doc #: ${record.docNo}`, W - margin - 5, 23, { align: 'right' });
      doc.text(`Date: ${record.savedAt}`, W - margin - 5, 28, { align: 'right' });

      let currentY = 44;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY, W - 2 * margin, 20, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, W - 2 * margin, 20, 2, 2, 'D');

      doc.setTextColor(0, 32, 96);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('BILLED TO / BUYER:', margin + 5, currentY + 6);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(record.partyName || 'Client Name', margin + 5, currentY + 12);

      currentY += 24;
      doc.setFillColor(0, 32, 96);
      doc.rect(margin, currentY, W - 2 * margin, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Item Description', margin + 10, currentY + 4.8);
      doc.text('Total (₹)', W - margin - 5, currentY + 4.8, { align: 'right' });

      currentY += 7;
      const itemsList = record.payload?.items || [{ productName: 'Commercial Supply & Implementation', total: record.totalAmount }];
      itemsList.forEach((it: any, idx: number) => {
        doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 248);
        doc.rect(margin, currentY, W - 2 * margin, 7, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'normal');
        doc.text(it.productName || it.name || 'Commercial Item', margin + 10, currentY + 4.8);
        doc.text(`₹${Number(it.total || record.totalAmount).toLocaleString('en-IN')}`, W - margin - 5, currentY + 4.8, { align: 'right' });
        currentY += 7;
      });

      currentY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(0, 32, 96);
      doc.text(`Grand Total: ₹${record.totalAmount.toLocaleString('en-IN')}`, W - margin - 5, currentY + 5, { align: 'right' });

      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      if (mode === 'VIEW') {
        window.open(blobUrl, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${record.docNo}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      alert('Notice: Could not compile PDF on-demand: ' + (err as Error).message);
    }
  };

  // ☁️ SAVE TO FIREBASE STORAGE & SYNC TO DATABASE
  const handleSaveToFirebase = async (isExportTriggered: boolean | unknown = false): Promise<boolean> => {
    // If buyer or product is missing, smoothly quick-fill defaults instead of failing with an alert
    if (!isReadyToSave) {
      handleQuickFillSampleData();
    }

    setIsSavingFirebase(true);
    try {
      let pdfUrl = '';
      try {
        const pdfBlob = await generateQuotationPdfBlob();
        const base64DataUrl = await blobToDataUrl(pdfBlob);

        const driveResult = await uploadFileToGoogleDrive(
          pdfBlob,
          `${docNo}.pdf`,
          {
            companyName: activeCompany?.name || 'Company',
            category: 'QUOTATIONS',
            customFileName: docNo,
          }
        ).catch(() => null);

        // Prioritize real storage URL:
        if (driveResult?.gcsDownloadUrl && !driveResult.gcsDownloadUrl.includes('drive_')) {
          pdfUrl = driveResult.gcsDownloadUrl;
        } else if (driveResult?.driveDownloadUrl && !driveResult.driveDownloadUrl.includes('id=drive_') && !driveResult.driveDownloadUrl.includes('id=gdrive_')) {
          pdfUrl = driveResult.driveDownloadUrl;
        } else {
          pdfUrl = base64DataUrl;
        }
      } catch (uploadErr) {
        console.warn('PDF generation / upload notice:', uploadErr);
      }

      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;

      const partyDisplayName = (activeParty?.name && activeParty.name.trim() !== '' && activeParty.name !== 'Client / Party Name')
        ? activeParty.name
        : 'Client / Party';
      const companyDisplayName = (activeCompany?.name && activeCompany.name.trim() !== '' && activeCompany.name !== 'Your Company')
        ? activeCompany.name
        : 'Company / Organization';

      const recordPayload = {
        items: JSON.parse(JSON.stringify(items)),
        customColumns: JSON.parse(JSON.stringify(customColumns)),
        sectionOrder: [...sectionOrder],
        sectionGap,
        pdfTopPadding,
        pdfBottomPadding,
        globalGstRate,
        gstType,
        docDate,
        validUntilDate,
        companyDetails: activeCompany || undefined,
        partyDetails: activeParty || undefined,
        termsText,
        pdfUrl,
      };

      const quoteRecord: SavedQuoteRecord = {
        id: currentEditingQuoteId || `sq-${Date.now()}`,
        docNo,
        docType,
        partyName: partyDisplayName,
        companyName: companyDisplayName,
        savedAt: formattedDate,
        totalAmount: grandTotal,
        status: 'GENERATED_SENT',
        pdfUrl,
        itemsCount: items.length,
        createdByName: typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('das_crm_user') || '{}')?.name || 'Authorized Signatory') : 'Authorized Signatory',
        createdByRole: typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('das_crm_user') || '{}')?.role || 'Admin') : 'Admin',
        payload: recordPayload,
      };

      // 1. Instantly persist to state and localStorage (never loses user changes)
      setSavedQuotes(prev => {
        const next = [quoteRecord, ...prev.filter(q => q.id !== quoteRecord.id && q.docNo !== quoteRecord.docNo)];
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('das_crm_saved_quotes', JSON.stringify(next));
          }
        } catch (_) {}
        return next;
      });
      setCurrentEditingQuoteId(quoteRecord.id);

      // Broadcast update to all other open tabs, Lead Workspace, and CRM dashboards
      try {
        window.dispatchEvent(new CustomEvent('das_crm_quotes_updated', { detail: quoteRecord }));
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('das_crm_quote_channel');
          bc.postMessage({ type: 'QUOTE_SAVED', quote: quoteRecord });
          bc.close();
        }
      } catch (_) {}

      // 2. Safely sync to backend / Supabase database without blocking UI or throwing unhandled errors
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
        let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBase.startsWith('http://localhost')) {
          apiBase = '/api';
        }

        const isExistingBackendQuote = currentEditingQuoteId && !currentEditingQuoteId.startsWith('sq-');
        const endpoint = isExistingBackendQuote ? `${apiBase}/quotations/${currentEditingQuoteId}` : `${apiBase}/quotations`;

        let res: Response | null = null;
        try {
          res = await fetch(endpoint, {
            method: isExistingBackendQuote ? 'PUT' : 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              quoteNumber: docNo,
              docType,
              partyName: quoteRecord.partyName,
              companyName: quoteRecord.companyName,
              totalAmount: grandTotal,
              status: 'SENT',
              pdfUrl: quoteRecord.pdfUrl,
              items,
              payload: recordPayload,
            }),
          });
        } catch (_) {}

        // Also sync to /api/quotations for Firestore & multi-browser backup
        try {
          await fetch('/api/quotations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: quoteRecord.id,
              quoteNumber: docNo,
              docType,
              partyName: quoteRecord.partyName,
              companyName: quoteRecord.companyName,
              totalAmount: grandTotal,
              status: 'SENT',
              pdfUrl: quoteRecord.pdfUrl,
              items,
              payload: recordPayload,
            }),
          });
        } catch (_) {}

        if (res && res.ok) {
          const savedData = await res.json();
          if (savedData?.id) {
            quoteRecord.id = savedData.id;
            if (savedData.pdfUrl) {
              quoteRecord.pdfUrl = savedData.pdfUrl;
            }
            setSavedQuotes(prev => {
              const updated = prev.map(q => q.docNo === quoteRecord.docNo ? { ...q, id: savedData.id, pdfUrl: quoteRecord.pdfUrl } : q);
              try {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('das_crm_saved_quotes', JSON.stringify(updated));
                }
              } catch (_) {}
              return updated;
            });
            setCurrentEditingQuoteId(savedData.id);
          }
        }
      } catch (backendErr) {
        console.info('Backend database sync notice:', backendErr);
      }

      setFirebaseSaveSuccess(true);
      setTimeout(() => setFirebaseSaveSuccess(false), 3500);
      return true;
    } catch (err) {
      console.error('Save to Firebase Storage failed:', err);
      alert('Notice: ' + (err as Error).message);
      return false;
    } finally {
      setIsSavingFirebase(false);
    }
  };

  // 🖨️ PRINT / EXPORT PDF (A4) — Auto-triggers Save & Sync to Firebase, Supabase, and real-time dashboards
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportPdf = async () => {
    if (!isReadyToSave) {
      handleQuickFillSampleData();
    }

    setIsExportingPdf(true);
    handleCompilePdf();

    try {
      // 1. Auto-trigger Save & Sync (Firebase storage & Supabase database)
      await handleSaveToFirebase(true);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);

      // 2. Open official Print / Save as PDF modal
      setTimeout(() => {
        window.print();
      }, 150);
    } catch (err) {
      console.error('Export auto-save notice:', err);
      setTimeout(() => {
        window.print();
      }, 150);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // ── Download as Editable Word (.docx) — auto-saves when document is ready ──
  const handleDownloadDocx = useCallback(async () => {
    if (isReadyToSave) {
      try {
        await handleSaveToFirebase(true);
      } catch (err) {
        console.warn('Auto-save before DOCX export notice:', err);
      }
    }

    const _activeCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];
    const _activeParty = parties.find(p => p.id === selectedPartyId) || parties[0];
    const _docTitle = (() => {
      switch (docType) {
        case 'QUOTATION': return 'ESTIMATE / QUOTATION';
        case 'PROFORMA_INVOICE': return 'PROFORMA INVOICE';
        case 'TAX_INVOICE': return 'TAX INVOICE';
        case 'PAYMENT_RECEIPT': return 'PAYMENT RECEIPT';
        case 'CREDIT_NOTE': return 'CREDIT NOTE';
        case 'DELIVERY_CHALLAN': return 'DELIVERY CHALLAN';
        default: return 'DOCUMENT';
      }
    })();
    const _cgst = gstType === 'EXEMPT' || globalGstRate === 0 ? 0 : gstTaxTotal / 2;
    setIsExportingDocx(true);
    try {
      await exportQuotationAsDocx({
        docTitle: _docTitle,
        docNo,
        docDate,
        validUntilDate,
        showValidUntil,
        company: _activeCompany,
        party: _activeParty,
        useSeparateShipping,
        customShippingAddress,
        items,
        customColumns,
        showGstColumn,
        showHsnColumn,
        gstType,
        globalGstRate,
        overallDiscountType,
        overallDiscountVal,
        termsText,
        subtotal,
        totalItemDiscounts,
        overallDiscAmount,
        effectiveGstTaxTotal,
        grandTotal,
        cgst: _cgst,
        sgst: _cgst,
        igst: effectiveGstTaxTotal,
      });
      setDocxSuccess(true);
      setTimeout(() => setDocxSuccess(false), 2500);
    } catch (err) {
      console.error('DOCX export failed:', err);
      alert('Could not generate Word document. Please try again.');
    } finally {
      setIsExportingDocx(false);
    }
  }, [
    isReadyToSave, handleSaveToFirebase,
    docType, docNo, docDate, validUntilDate, showValidUntil,
    companies, selectedCompanyId, parties, selectedPartyId,
    useSeparateShipping, customShippingAddress,
    items, customColumns, showGstColumn, showHsnColumn, gstType, globalGstRate,
    overallDiscountType, overallDiscountVal, termsText,
    subtotal, totalItemDiscounts, overallDiscAmount, effectiveGstTaxTotal, grandTotal, gstTaxTotal,
  ]);

  // 💾 SAVE DRAFT TO DATABASE (PERSISTED FOR CONTINUOUS WORK-IN-PROGRESS EDITING)
  const handleSaveCurrentDraft = async () => {
    const partyDisplayName = (activeParty?.name && activeParty.name.trim() !== '' && activeParty.name !== 'Client / Party Name')
      ? activeParty.name
      : 'Draft Client';
    const companyDisplayName = (activeCompany?.name && activeCompany.name.trim() !== '' && activeCompany.name !== 'Your Company')
      ? activeCompany.name
      : 'Company / Organization';

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;

    let draftPdfUrl = '';
    try {
      const pdfBlob = await generateQuotationPdfBlob();
      const base64DataUrl = await blobToDataUrl(pdfBlob);

      const driveResult = await uploadFileToGoogleDrive(
        pdfBlob,
        `${docNo}-draft.pdf`,
        {
          companyName: companyDisplayName,
          category: 'QUOTATIONS',
          customFileName: `${docNo}-draft`,
        }
      ).catch(() => null);

      if (driveResult?.gcsDownloadUrl && !driveResult.gcsDownloadUrl.includes('drive_')) {
        draftPdfUrl = driveResult.gcsDownloadUrl;
      } else if (driveResult?.driveDownloadUrl && !driveResult.driveDownloadUrl.includes('id=drive_') && !driveResult.driveDownloadUrl.includes('id=gdrive_')) {
        draftPdfUrl = driveResult.driveDownloadUrl;
      } else {
        draftPdfUrl = base64DataUrl;
      }
    } catch (_) {}

    const recordPayload = {
      items: JSON.parse(JSON.stringify(items)),
      customColumns: JSON.parse(JSON.stringify(customColumns)),
      sectionOrder: [...sectionOrder],
      sectionGap,
      pdfTopPadding,
      pdfBottomPadding,
      globalGstRate,
      gstType,
      docDate,
      validUntilDate,
      companyDetails: activeCompany || undefined,
      partyDetails: activeParty || undefined,
      termsText,
      pdfUrl: draftPdfUrl,
    };

    const draftRecord: SavedQuoteRecord = {
      id: currentEditingQuoteId || `sq-${Date.now()}`,
      docNo,
      docType,
      partyName: partyDisplayName,
      companyName: companyDisplayName,
      savedAt: formattedDate,
      totalAmount: grandTotal,
      status: 'DRAFT',
      pdfUrl: draftPdfUrl,
      itemsCount: items.length,
      createdByName: typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('das_crm_user') || '{}')?.name || 'Authorized Signatory') : 'Authorized Signatory',
      createdByRole: typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('das_crm_user') || '{}')?.role || 'Admin') : 'Admin',
      payload: recordPayload,
    };

    // 1. Instantly persist to state and localStorage
    setSavedQuotes(prev => {
      const next = [draftRecord, ...prev.filter(q => q.id !== draftRecord.id && q.docNo !== draftRecord.docNo)];
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('das_crm_saved_quotes', JSON.stringify(next));
        }
      } catch (_) {}
      return next;
    });
    setCurrentEditingQuoteId(draftRecord.id);

    // Broadcast draft update
    try {
      window.dispatchEvent(new CustomEvent('das_crm_quotes_updated', { detail: draftRecord }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('das_crm_quote_channel');
        bc.postMessage({ type: 'QUOTE_SAVED', quote: draftRecord });
        bc.close();
      }
    } catch (_) {}

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);

    // 2. Safely sync to backend / Supabase database & Firestore
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBase.startsWith('http://localhost')) {
        apiBase = '/api';
      }

      const isExistingBackendQuote = currentEditingQuoteId && !currentEditingQuoteId.startsWith('sq-');
      const endpoint = isExistingBackendQuote ? `${apiBase}/quotations/${currentEditingQuoteId}` : `${apiBase}/quotations`;

      let res: Response | null = null;
      try {
        res = await fetch(endpoint, {
          method: isExistingBackendQuote ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            quoteNumber: docNo,
            docType,
            partyName: draftRecord.partyName,
            companyName: draftRecord.companyName,
            totalAmount: grandTotal,
            status: 'DRAFT',
            pdfUrl: draftPdfUrl,
            items,
            payload: recordPayload,
          }),
        });
      } catch (_) {}

      // Always also sync to /api/quotations for Firestore & multi-browser backup
      try {
        await fetch('/api/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: draftRecord.id,
            quoteNumber: docNo,
            docType,
            partyName: draftRecord.partyName,
            companyName: draftRecord.companyName,
            totalAmount: grandTotal,
            status: 'DRAFT',
            pdfUrl: draftPdfUrl,
            items,
            payload: recordPayload,
          }),
        });
      } catch (_) {}

      if (res && res.ok) {
        const savedData = await res.json();
        if (savedData?.id) {
          draftRecord.id = savedData.id;
          if (savedData.pdfUrl) {
            draftRecord.pdfUrl = savedData.pdfUrl;
          }
          setSavedQuotes(prev => {
            const updated = prev.map(q => q.docNo === draftRecord.docNo ? { ...q, id: savedData.id, pdfUrl: draftRecord.pdfUrl } : q);
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem('das_crm_saved_quotes', JSON.stringify(updated));
              }
            } catch (_) {}
            return updated;
          });
          setCurrentEditingQuoteId(savedData.id);
        }
      }
    } catch (e) {
      console.info('Backend quote draft save notice:', e);
    }
  };

  // 📂 LOAD QUOTE OR DRAFT BACK INTO BUILDER FOR FULL EDITING
  const handleLoadSavedQuote = (record: SavedQuoteRecord) => {
    setCurrentEditingQuoteId(record.id);
    setDocNo(record.docNo);
    setDocType(record.docType);
    if (record.payload) {
      if (record.payload.items) setItems(JSON.parse(JSON.stringify(record.payload.items)));
      if (record.payload.customColumns) setCustomColumns(JSON.parse(JSON.stringify(record.payload.customColumns)));
      if (record.payload.sectionOrder) setSectionOrder([...record.payload.sectionOrder]);
      if (record.payload.sectionGap) setSectionGap(record.payload.sectionGap);
      if (record.payload.pdfTopPadding) setPdfTopPadding(record.payload.pdfTopPadding);
      if (record.payload.pdfBottomPadding) setPdfBottomPadding(record.payload.pdfBottomPadding);
      if (record.payload.globalGstRate) setGlobalGstRate(record.payload.globalGstRate);
      if (record.payload.gstType) setGstType(record.payload.gstType);
      if (record.payload.docDate) setDocDate(record.payload.docDate);
      if (record.payload.validUntilDate) setValidUntilDate(record.payload.validUntilDate);
      if (record.payload.termsText) setTermsText(record.payload.termsText);
      if (record.payload.companyDetails) {
        setCompanies(prev => {
          const found = prev.find(c => c.name === record.payload.companyDetails!.name || c.id === record.payload.companyDetails!.id);
          if (found) {
            setSelectedCompanyId(found.id);
            return prev;
          }
          return [record.payload.companyDetails!, ...prev];
        });
        setSelectedCompanyId(record.payload.companyDetails.id);
      }
      if (record.payload.partyDetails) {
        setParties(prev => {
          const found = prev.find(p => p.name === record.payload.partyDetails!.name || p.id === record.payload.partyDetails!.id);
          if (found) {
            setSelectedPartyId(found.id);
            return prev;
          }
          return [record.payload.partyDetails!, ...prev];
        });
        setSelectedPartyId(record.payload.partyDetails.id);
      }
    }
    setHistoryDrawerOpen(false);
  };

  const handleImageFileUpload = (file: File, onSuccess: (dataUrl: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onSuccess(result);
          return;
        }
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1080, 1080);
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 1080, 1080);
        onSuccess(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => onSuccess(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // 🏢 SAVE / UPDATE SELLER COMPANY — persists to backend DB + file storage + localStorage
  const handleSaveNewCompany = async () => {
    if (!newComp.name || !newComp.name.trim()) {
      alert('Company Name is required.');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
    let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBase.startsWith('http://localhost')) {
      apiBase = '/api';
    }

    // Resolve logo: if base64 data URL, upload to static storage first
    let resolvedLogoUrl = newComp.logoUrl || activeCompany?.logoUrl || '';
    const originalLogoDataUrl = resolvedLogoUrl; // keep original base64 before uploading
    if (resolvedLogoUrl && resolvedLogoUrl.startsWith('data:')) {
      try {
        const uploadRes = await fetch('/api/products/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl: resolvedLogoUrl, fileName: `company_logo_${Date.now()}` }),
        });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          if (uploadJson?.url) {
            const returnedUrl = uploadJson.url;
            // If the server returned a static path (not base64), cache the base64 in
            // localStorage so fetchImageAsBase64 can recover it if the path 404s.
            if (returnedUrl && !returnedUrl.startsWith('data:') && originalLogoDataUrl.startsWith('data:')) {
              try {
                localStorage.setItem(`das_crm_img_cache_${returnedUrl}`, originalLogoDataUrl);
              } catch (_) {}
            }
            resolvedLogoUrl = returnedUrl;
          }
        }
      } catch (_) {}
    }


    const companyId = editingCompanyId || 'comp-1';
    const updatedCompany: CompanyDetails = {
      id: companyId,
      name: newComp.name.trim(),
      logoUrl: resolvedLogoUrl,
      address: newComp.address || activeCompany?.address || 'Registered Business Address',
      email: newComp.email || activeCompany?.email || '',
      phone: newComp.phone || activeCompany?.phone || '',
      gstNo: newComp.gstNo || activeCompany?.gstNo || '',
      panNo: newComp.panNo || activeCompany?.panNo || '',
      bankName: newComp.bankName || activeCompany?.bankName || 'HDFC Bank',
      accountNo: newComp.accountNo || activeCompany?.accountNo || '',
      ifscCode: newComp.ifscCode || activeCompany?.ifscCode || '',
      branch: newComp.branch || activeCompany?.branch || '',
      upiId: newComp.upiId || activeCompany?.upiId || '',
    };

    // 1. Update state immediately
    setCompanies(prev => {
      const exists = prev.find(c => c.id === companyId);
      return exists ? prev.map(c => c.id === companyId ? updatedCompany : c) : [updatedCompany, ...prev];
    });
    setSelectedCompanyId(companyId);

    // 2. Persist to localStorage immediately (instant cross-tab sync)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('das_crm_seller_companies', JSON.stringify([updatedCompany]));
      }
    } catch (_) {}

    const sellerPayload = {
      name: updatedCompany.name,
      logoUrl: updatedCompany.logoUrl,
      email: updatedCompany.email,
      phone: updatedCompany.phone,
      address: updatedCompany.address,
      gstNumber: updatedCompany.gstNo,
      panNumber: updatedCompany.panNo,
      bankDetails: {
        bankName: updatedCompany.bankName,
        accountNo: updatedCompany.accountNo,
        ifscCode: updatedCompany.ifscCode,
        branch: updatedCompany.branch,
        upiId: updatedCompany.upiId,
      },
    };

    // 3. Save to backend Prisma DB (cross-device persistent)
    try {
      await fetch(`${apiBase}/organizations/seller-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(sellerPayload),
      });
    } catch (_) {}

    // 4. Save to Next.js /api/organization/seller-profile (file-based fallback)
    try {
      await fetch('/api/organization/seller-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sellerPayload),
      });
    } catch (_) {}

    // Broadcast company update to all other open tabs & dashboards
    try {
      window.dispatchEvent(new CustomEvent('das_crm_seller_profile_updated', { detail: updatedCompany }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('das_crm_company_channel');
        bc.postMessage({ type: 'SELLER_PROFILE_UPDATED', company: updatedCompany });
        bc.close();
      }
    } catch (_) {}

    setCompanyModalOpen(false);
    setEditingCompanyId(null);
    setNewComp({});
  };

  // 👤 SAVE / UPDATE BUYER PARTY — persists to /api/parties + backend /contacts + localStorage
  const handleSaveNewParty = async () => {
    if (!newParty.name || !newParty.name.trim()) {
      alert('Client Party Name is required.');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
    let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBase.startsWith('http://localhost')) {
      apiBase = '/api';
    }

    const partyId = editingPartyId || `party-${Date.now()}`;
    const updatedParty: PartyDetails = {
      id: partyId,
      name: newParty.name.trim(),
      contactPerson: newParty.contactPerson ?? activeParty?.contactPerson ?? '',
      email: newParty.email || activeParty?.email || '',
      phone: newParty.phone || activeParty?.phone || '',
      address: newParty.address || activeParty?.address || 'Billed To Address',
      shippingAddress: newParty.shippingAddress ?? activeParty?.shippingAddress ?? '',
      gstNo: newParty.gstNo || activeParty?.gstNo || '',
      panNo: newParty.panNo || activeParty?.panNo || '',
    };

    // 1. Update state immediately
    setParties(prev => {
      const exists = prev.find(p => p.id === partyId);
      return exists ? prev.map(p => p.id === partyId ? updatedParty : p) : [updatedParty, ...prev];
    });
    if (!editingPartyId) setSelectedPartyId(partyId);

    // 2. Persist to localStorage immediately
    try {
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('das_crm_saved_parties') || '[]');
        const exists = existing.find((p: any) => p.id === partyId);
        const next = exists
          ? existing.map((p: any) => p.id === partyId ? updatedParty : p)
          : [updatedParty, ...existing];
        localStorage.setItem('das_crm_saved_parties', JSON.stringify(next));
      }
    } catch (_) {}

    const partyPayload = {
      id: partyId,
      name: updatedParty.name,
      contactPerson: updatedParty.contactPerson,
      email: updatedParty.email,
      phone: updatedParty.phone,
      address: updatedParty.address,
      shippingAddress: updatedParty.shippingAddress,
      gstNo: updatedParty.gstNo,
      panNo: updatedParty.panNo,
    };

    // 3. Save to Next.js /api/parties (file-based — cross-device persistent)
    try {
      if (editingPartyId) {
        await fetch(`/api/parties/${partyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partyPayload),
        });
      } else {
        await fetch('/api/parties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partyPayload),
        });
      }
    } catch (_) {}

    // 4. Also sync to backend /contacts if it's a backend-originated contact
    if (editingPartyId && editingPartyId.startsWith('contact-')) {
      const cleanId = editingPartyId.replace('contact-', '');
      try {
        await fetch(`${apiBase}/contacts/${cleanId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            firstName: updatedParty.name,
            email: updatedParty.email,
            phone: updatedParty.phone,
            customFields: {
              address: updatedParty.address,
              shippingAddress: updatedParty.shippingAddress,
              gstNo: updatedParty.gstNo,
              panNo: updatedParty.panNo,
            },
          }),
        });
      } catch (_) {}
    }

    // 5. Also sync to backend /leads if it's a backend-originated lead
    if (editingPartyId && editingPartyId.startsWith('lead-')) {
      const cleanId = editingPartyId.replace('lead-', '');
      const nameParts = updatedParty.name.trim().split(' ');
      const firstName = nameParts[0] || updatedParty.name;
      const lastName = nameParts.slice(1).join(' ') || '';
      try {
        await fetch(`${apiBase}/leads/${cleanId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email: updatedParty.email,
            phone: updatedParty.phone,
            customFields: {
              address: updatedParty.address,
              shippingAddress: updatedParty.shippingAddress,
              gstNo: updatedParty.gstNo,
              panNo: updatedParty.panNo,
            },
          }),
        });
      } catch (_) {}
    }

    // Broadcast party update to all other open tabs & dashboards
    try {
      window.dispatchEvent(new CustomEvent('das_crm_parties_updated', { detail: updatedParty }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('das_crm_party_channel');
        bc.postMessage({ type: 'PARTY_UPDATED', party: updatedParty });
        bc.close();
      }
    } catch (_) {}

    setPartyModalOpen(false);
    setEditingPartyId(null);
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

  // Render Individual Section Content based on Section ID
  const renderSectionContent = (secId: SectionId) => {
    switch (secId) {
      case 'HEADER':
        return (
          <div key="HEADER" style={{ marginBottom: `${sectionGap}px` }} className={`border-b border-slate-200 ${pdfMargin >= 15 ? 'pb-2 pt-0.5' : 'pb-2.5 pt-1'} flex justify-between items-start gap-3`}>
            {/* Header: Company Info + Document Title Block */}
            <div className="flex items-center gap-3.5 max-w-[65%]">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                {activeCompany?.logoUrl ? (
                  <img
                    src={activeCompany.logoUrl}
                    alt="Logo"
                    onError={(e) => {
                      const target = e.target as HTMLElement;
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-md object-cover border border-slate-200 shadow-sm"
                  />
                ) : null}
                <div
                  style={{ display: activeCompany?.logoUrl ? 'none' : 'flex', backgroundColor: '#002060', color: '#ffffff' }}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-md items-center justify-center font-black text-xs sm:text-sm border border-slate-200 shadow-sm uppercase"
                >
                  {activeCompany?.name ? activeCompany.name.slice(0, 2) : 'CO'}
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <h1 style={{ color: '#002060' }} className="text-[12px] sm:text-[14px] font-black tracking-tight uppercase leading-snug break-words">{activeCompany?.name || 'Your Company Name'}</h1>
                <p className="text-[9px] sm:text-[9.5px] text-slate-600 leading-snug break-words">{activeCompany?.address || 'Registered Business Address'}</p>
                <p className="text-[9px] sm:text-[9.5px] font-extrabold text-[#002060] mt-0.5">
                  GSTIN: <span className="font-mono">{activeCompany?.gstNo || 'N/A'}</span> • PAN: <span className="font-mono">{activeCompany?.panNo || 'N/A'}</span>
                </p>
                {activeCompany?.email && (
                  <p className="text-[8.5px] sm:text-[9px] text-slate-500">Email: {activeCompany.email}</p>
                )}
              </div>
            </div>

            <div className="text-right space-y-0.5 flex-shrink-0">
              <span style={{ backgroundColor: '#002060', color: '#ffffff' }} className="inline-block text-[9.5px] sm:text-[11px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded border border-[#00153e] shadow-sm">
                {getDocTitle()}
              </span>
              <p className="text-[11px] sm:text-xs font-black text-[#002060] pt-0.5 font-mono font-extrabold">
                {docNo}
              </p>
              <p className="text-[9px] sm:text-[9.5px] text-slate-600">Date: <strong className="text-slate-900">{docDate}</strong></p>
              {showValidUntil && validUntilDate && validUntilDate.trim() !== '' && (
                <p className="text-[9px] sm:text-[9.5px] text-slate-600">Valid Until: <strong className="text-slate-900">{validUntilDate}</strong></p>
              )}
            </div>
          </div>
        );

      case 'PARTY_INFO':
        return (
          <div key="PARTY_INFO" style={{ marginBottom: `${sectionGap}px` }} className={`bg-slate-50 border border-slate-200 rounded-lg ${pdfMargin >= 15 ? 'p-2' : 'p-2.5'} grid ${useSeparateShipping ? 'grid-cols-3' : 'grid-cols-2'} gap-2 sm:gap-3`}>
            {/* Billing Address Column */}
            <div>
              <span className="text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Billed To (Buyer)</span>
              <h4 className="text-[11px] sm:text-[12px] font-black text-slate-900 leading-snug break-words">{activeParty?.name || 'Client / Party Name'}</h4>
              {activeParty?.contactPerson && (
                <p className="text-[9px] sm:text-[9.5px] font-medium text-slate-700 mt-0.5">Attn: {activeParty.contactPerson}</p>
              )}
              <p className="text-[9px] sm:text-[9.5px] text-slate-600 mt-0.5 leading-snug break-words">{activeParty?.address || 'Client Address'}</p>
            </div>

            {/* Separate Shipping Address Column (if enabled) */}
            {useSeparateShipping && (
              <div className="border-l border-slate-200 pl-2 sm:pl-3">
                <span className="text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider text-[#002060] block mb-0.5 flex items-center gap-1">
                  🚚 Shipped To (Consignee)
                </span>
                <h4 className="text-[11px] sm:text-[12px] font-black text-slate-900 leading-snug break-words">{activeParty?.name || 'Client / Party Name'}</h4>
                <p className="text-[9px] sm:text-[9.5px] text-slate-600 mt-0.5 leading-snug break-words">
                  {customShippingAddress || activeParty?.shippingAddress || activeParty?.address || 'Shipping Address'}
                </p>
              </div>
            )}

            {/* Tax & Contact Column */}
            <div className="text-right space-y-0.5">
              <span className="text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Tax &amp; Identifiers</span>
              <p className="text-[9px] sm:text-[9.5px] font-bold text-slate-800">GSTIN: <span className="font-mono text-[#002060]">{activeParty?.gstNo || 'N/A'}</span></p>
              <p className="text-[9px] sm:text-[9.5px] font-bold text-slate-800">PAN: <span className="font-mono">{activeParty?.panNo || 'N/A'}</span></p>
              <p className="text-[9px] sm:text-[9.5px] text-slate-600">📞 {activeParty?.phone || 'N/A'}</p>
              <p className="text-[8.5px] sm:text-[9px] font-semibold text-slate-500">Place of Supply: <span className="text-slate-800 font-bold">Uttar Pradesh</span></p>
            </div>
          </div>
        );

      case 'ITEMS_TABLE':
        return (
          <div key="ITEMS_TABLE" style={{ marginBottom: `${sectionGap}px` }} className="overflow-hidden border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#002060', color: '#ffffff' }} className="text-[8.5px] sm:text-[9px] uppercase font-black tracking-wider border-b border-[#00153e]">
                  <th style={{ color: '#ffffff' }} className="py-1.5 px-1.5 sm:px-2 text-center w-6 sm:w-7">#</th>
                  <th style={{ color: '#ffffff' }} className="py-1.5 px-1.5 sm:px-2">Item &amp; Description</th>
                  {showHsnColumn && <th style={{ color: '#ffffff' }} className="py-1.5 px-1.5 sm:px-2 text-center">HSN/SAC</th>}
                  {customColumns.map(col => (
                    <th key={col.id} style={{ color: '#ffffff' }} className="py-1.5 px-1.5 sm:px-2 text-center">{col.name}</th>
                  ))}
                  <th style={{ color: '#ffffff' }} className="py-1.5 px-1.5 sm:px-2 text-center">Qty</th>
                  <th style={{ color: '#ffffff' }} className="py-1.5 px-1.5 sm:px-2 text-right">Rate (₹)</th>
                  {showGstColumn && <th style={{ color: '#ffffff' }} className="py-1.5 px-1.5 sm:px-2 text-center">GST %</th>}
                  <th style={{ color: '#ffffff' }} className="py-1.5 px-1.5 sm:px-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-[10px] sm:text-[10.5px]">
                {items.map((it, idx) => {
                  const baseRowTotal = it.qty * it.unitPrice;
                  const rowTax = baseRowTotal * (it.taxRate / 100);
                  const displayedRowTotal = showGstColumn ? Math.round(baseRowTotal + rowTax) : baseRowTotal;
                  return (
                    <tr key={it.id} className={idx % 2 === 1 ? 'bg-slate-50/70 text-slate-800' : 'text-slate-800'}>
                      <td className="py-1.5 px-1.5 sm:px-2 text-center font-bold text-slate-400 text-[9.5px] sm:text-[10px]">{idx + 1}</td>
                      <td className="py-1.5 px-1.5 sm:px-2">
                        <div className="flex items-start gap-1.5 sm:gap-2">
                          {it.showImage && it.imageUrl && (
                            <img
                              src={it.imageUrl}
                              alt="Prod"
                              className="w-4 h-4 sm:w-5 sm:h-5 aspect-square rounded border border-slate-200 object-cover flex-shrink-0 mt-0.5"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.onerror = null;
                                target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 leading-snug block text-[10px] sm:text-[10.5px] break-words">{it.productName}</span>
                            {it.showDescription && it.description && it.description.trim() !== '' && (
                              <p className="text-[8.5px] sm:text-[9px] text-slate-600 leading-snug font-normal break-words">{it.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      {showHsnColumn && (
                        <td className="py-1.5 px-1.5 sm:px-2 text-center font-mono text-[9px] sm:text-[9.5px] text-slate-600">{it.hsnCode || '998313'}</td>
                      )}
                      {customColumns.map(col => (
                        <td key={col.id} className="py-1.5 px-1.5 sm:px-2 text-center font-medium text-[9px] sm:text-[9.5px] text-slate-700">
                          {it.customValues?.[col.id] || '—'}
                        </td>
                      ))}
                      <td className="py-1.5 px-1.5 sm:px-2 text-center font-semibold text-[9.5px] sm:text-[10px]">{it.qty} {it.unit}</td>
                      <td className="py-1.5 px-1.5 sm:px-2 text-right font-semibold text-[9.5px] sm:text-[10px]">₹{it.unitPrice.toLocaleString('en-IN')}</td>
                      {showGstColumn && (
                        <td style={{ color: '#002060' }} className="py-1.5 px-1.5 sm:px-2 text-center font-bold text-[9.5px] sm:text-[10px]">{it.taxRate}%</td>
                      )}
                      <td className="py-1.5 px-1.5 sm:px-2 text-right font-black text-slate-900 text-[10px] sm:text-[10.5px]">
                        ₹{displayedRowTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );

      case 'SUMMARY_AND_BANK':
        return (
          <div key="SUMMARY_AND_BANK" style={{ marginBottom: `${sectionGap}px` }} className={`grid grid-cols-2 gap-2 sm:gap-3 border-t border-slate-200 ${pdfMargin >= 15 ? 'pt-2' : 'pt-2.5'}`}>
            {/* Bank Details & Amount in Words */}
            <div className="space-y-1.5">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-0.5">
                <span className="text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Bank Payment Details</span>
                <p className="text-[9px] sm:text-[9.5px] font-bold text-slate-800">Bank: {activeCompany?.bankName || 'N/A'}</p>
                <p style={{ color: '#002060' }} className="text-[9px] sm:text-[9.5px] font-bold font-mono">A/C No: {activeCompany?.accountNo || 'N/A'}</p>
                <p className="text-[9px] sm:text-[9.5px] text-slate-600">IFSC: <span className="font-mono">{activeCompany?.ifscCode || 'N/A'}</span> • Branch: {activeCompany?.branch || 'N/A'}</p>
                <p style={{ color: '#002060' }} className="text-[9px] sm:text-[9.5px] font-extrabold">UPI ID: {activeCompany?.upiId || 'N/A'}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span style={{ color: '#002060' }} className="text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider block">Total Amount (in words)</span>
                <p style={{ color: '#002060' }} className="text-[9px] sm:text-[10px] font-extrabold italic mt-0.5 leading-snug">
                  {numberToWordsINR(grandTotal)}
                </p>
              </div>
            </div>

            {/* Totals Calculation Box */}
            <div className="space-y-1 text-xs text-right bg-slate-50 border border-slate-200 rounded-lg p-2">
              <div className="flex justify-between text-slate-600 text-[9px] sm:text-[9.5px]">
                <span>Subtotal (Base Value):</span>
                <span className="font-bold text-slate-800">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {totalItemDiscounts > 0 && (
                <div className="flex justify-between text-slate-700 text-[9px] sm:text-[9.5px]">
                  <span>Item Discounts:</span>
                  <span className="font-bold">-₹{totalItemDiscounts.toLocaleString('en-IN')}</span>
                </div>
              )}
              {overallDiscAmount > 0 && (
                <div className="flex justify-between text-slate-700 text-[9px] sm:text-[9.5px]">
                  <span>Overall Discount:</span>
                  <span className="font-bold">-₹{overallDiscAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {gstType === 'EXEMPT' || globalGstRate === 0 ? (
                <div className="flex justify-between text-slate-600 text-[9px] sm:text-[9.5px]">
                  <span>GST Tax Rate:</span>
                  <span className="font-semibold text-emerald-700">0% (Nil Rated / Exempt)</span>
                </div>
              ) : gstType === 'IGST' ? (
                <div className="flex justify-between text-slate-600 text-[9px] sm:text-[9.5px]">
                  <span>IGST ({globalGstRate}%):</span>
                  <span className="font-semibold text-slate-700">₹{gstTaxTotal.toLocaleString('en-IN')}</span>
                </div>
              ) : gstType === 'CGST_UTGST' ? (
                <>
                  <div className="flex justify-between text-slate-600 text-[9px] sm:text-[9.5px]">
                    <span>CGST ({(globalGstRate / 2)}%):</span>
                    <span className="font-semibold text-slate-700">₹{(gstTaxTotal / 2).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[9px] sm:text-[9.5px]">
                    <span>UTGST ({(globalGstRate / 2)}%):</span>
                    <span className="font-semibold text-slate-700">₹{(gstTaxTotal / 2).toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-slate-600 text-[9px] sm:text-[9.5px]">
                    <span>CGST ({(globalGstRate / 2)}%):</span>
                    <span className="font-semibold text-slate-700">₹{(gstTaxTotal / 2).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[9px] sm:text-[9.5px]">
                    <span>SGST ({(globalGstRate / 2)}%):</span>
                    <span className="font-semibold text-slate-700">₹{(gstTaxTotal / 2).toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
              <div style={{ color: '#002060' }} className="flex justify-between font-bold border-t border-slate-200 pt-0.5 text-[9.5px] sm:text-[10px]">
                <span>
                  Total Tax ({gstType === 'EXEMPT' || globalGstRate === 0 ? '0% Exempt' : `${globalGstRate}% ${gstType === 'IGST' ? 'IGST' : gstType === 'CGST_UTGST' ? 'CGST+UTGST' : 'CGST+SGST'}`}):
                </span>
                <span>₹{(gstType === 'EXEMPT' || globalGstRate === 0 ? 0 : gstTaxTotal).toLocaleString('en-IN')}</span>
              </div>

              <div style={{ backgroundColor: '#002060', color: '#ffffff' }} className="rounded-lg p-1.5 mt-1 flex justify-between items-center font-black text-xs shadow-md border border-[#00153e]">
                <span style={{ color: '#e2e8f0' }} className="uppercase tracking-wider text-[9px] sm:text-[10px] font-bold">Grand Total</span>
                <span style={{ color: '#ffffff' }} className="text-xs sm:text-sm font-mono font-black">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        );

      case 'FOOTER_TERMS':
        return (
          <div key="FOOTER_TERMS" style={{ marginTop: `${sectionGap * 1.5}px` }} className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-4 items-end">
            <div className="space-y-0.5">
              <span className="text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider text-slate-500 block">Terms &amp; Conditions</span>
              <p className="text-[8.5px] sm:text-[9px] text-slate-600 whitespace-pre-line leading-snug break-words">{termsText}</p>
            </div>
            <div className="text-right space-y-2">
              <p className="text-[9.5px] sm:text-[10px] font-bold text-slate-800">For {activeCompany?.name || 'Company'}</p>
              <div className="inline-block border-b border-slate-400 w-32 pb-0.5 text-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Authorized Signatory</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render Spectro Executive Navy Blue (#002060) Unified A4 Document (Zero Color Conflict)
  const renderA4SheetDocument = () => {
    const bodySections = sectionOrder.filter(secId => secId !== 'FOOTER_TERMS' && visibleSections[secId]);
    const showFooterTerms = visibleSections['FOOTER_TERMS'];

    return (
      <div
        style={{
          paddingTop: `${pdfTopPadding}px`,
          paddingBottom: `${pdfBottomPadding + 28}px`,
          paddingLeft: `${pdfMargin}mm`,
          paddingRight: `${pdfMargin}mm`,
        }}
        className={`a4-document bg-white text-slate-900 shadow-2xl font-sans relative text-xs w-[210mm] min-w-[210mm] max-w-[210mm] flex flex-col justify-between box-border border-2 border-[#002060] ${
          pdfPageMode === 'SINGLE' ? 'min-h-[297mm] h-auto overflow-hidden' : 'min-h-[297mm] h-auto overflow-visible'
        }`}
      >
        {/* Top Official Spectro Navy Blue (#002060) Brand Color Bar */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-[#002060]"></div>

        {/* Body Content Sections (Header, Client Info, Items Table, Grand Totals & Bank) */}
        <div className="flex-1 flex flex-col">
          {bodySections.map(secId => renderSectionContent(secId))}
        </div>

        {/* 🏢 OFFICIAL FOOTER: Terms & Conditions + Authorized Signatory Block */}
        {showFooterTerms && (
          <div className="mt-auto mb-2">
            {renderSectionContent('FOOTER_TERMS')}
          </div>
        )}

        {/* 🔒 IMMUTABLE FIXED BOTTOM MENTION STRIP (Fixed at bottom edge of PDF, unaffected by spacing controls) */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-slate-50 border-t border-slate-200 px-4 text-center text-[10px] text-slate-500 font-medium flex items-center justify-between z-10">
          <span className="text-[10px] text-slate-500 font-medium">
            Generated by <strong className="text-slate-700 font-bold">DAS CRM</strong>
          </span>
          <a
            href="https://dascrm.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-semibold transition-colors flex items-center gap-1"
          >
            www.dascrm.com
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto pb-28 lg:pb-12 font-sans text-slate-900 dark:text-white px-1 sm:px-4">
      {/* ── TOP ACTION BAR & DOCUMENT TYPE FLOW SELECTOR ── */}
      <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3 sm:space-y-3.5 print-hide">
        {/* Top Header Row: Title, View Switcher & Primary Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded">
              PROCESS FLOW ENGINE
            </span>
            <h2 className="text-sm sm:text-lg font-black text-white mt-1 flex items-center gap-2 truncate">
              <FileText className="text-indigo-400 flex-shrink-0" size={17} />
              <span className="truncate">{getDocTitle()} GENERATOR &amp; CONVERTER</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5">
            {/* Desktop View Mode Switcher Controls */}
            <div className="hidden lg:flex items-center gap-1.5 bg-muted border border-border p-1 rounded-xl">
              <button
                onClick={() => {
                  setViewMode('SPLIT');
                  setZoomScale(calculateFitScale());
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'SPLIT' ? 'bg-indigo-600 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Columns size={14} /> Split Builder
              </button>
              <button
                onClick={() => {
                  setViewMode('FULL_PREVIEW');
                  setZoomScale(calculateFitScale());
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'FULL_PREVIEW' ? 'bg-indigo-600 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Maximize2 size={14} /> Full A4 Preview
              </button>
            </div>

            {/* Desktop Action Buttons Strip */}
            <div className="hidden sm:flex flex-wrap items-center gap-2">
              {/* ⚡ REFRESH & COMPILE PDF BUTTON */}
              <button
                type="button"
                onClick={handleCompilePdf}
                disabled={isCompiling}
                className={`px-3 py-2 text-xs font-black rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap border ${
                  compileSuccess
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40 shadow-emerald-600/25'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-indigo-400/30 shadow-indigo-600/25 active:scale-95'
                }`}
                title="Compile and synchronize all live edits into the A4 PDF sheet"
              >
                <RefreshCw size={14} className={isCompiling ? "animate-spin" : ""} />
                {isCompiling ? 'Compiling PDF...' : compileSuccess ? '✓ PDF Compiled' : 'Refresh & Compile'}
              </button>

              {/* 💾 SAVE DRAFT BUTTON */}
              <button
                type="button"
                onClick={handleSaveCurrentDraft}
                title={
                  currentEditingQuoteId
                    ? 'Update this draft in database & cloud vault'
                    : 'Save draft to database & cloud vault (always accessible)'
                }
                className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  savedSuccess
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 shadow'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-95'
                }`}
              >
                {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <RefreshCw size={14} />}
                {savedSuccess ? 'Draft Saved' : currentEditingQuoteId ? 'Update Draft' : 'Save Draft'}
              </button>

              {/* ☁️ SAVE & ARCHIVE TO FIREBASE STORAGE */}
              <button
                type="button"
                onClick={() => handleSaveToFirebase()}
                disabled={isSavingFirebase}
                title="Generate official vector PDF, upload to Firebase Storage cloud vault and sync across all dashboards"
                className={`px-3.5 py-2 text-xs font-black rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap border cursor-pointer ${
                  firebaseSaveSuccess
                    ? 'bg-emerald-600 text-white border-emerald-400/40 shadow-emerald-600/30'
                    : isSavingFirebase
                    ? 'bg-indigo-900/60 text-indigo-300 border-indigo-500/40 cursor-wait'
                    : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white border-sky-400/30 shadow-indigo-600/25 active:scale-95'
                }`}
              >
                {isSavingFirebase ? (
                  <><RefreshCw size={13} className="animate-spin" /> Archiving to Firebase...</>
                ) : firebaseSaveSuccess ? (
                  <><Check size={13} className="text-emerald-300" /> Synced to Firebase!</>
                ) : (
                  <><CloudUpload size={13} /> Save &amp; Sync (Firebase)</>
                )}
              </button>

              <button
                type="button"
                onClick={() => setHistoryDrawerOpen(true)}
                className="px-3.5 py-2 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 text-xs font-extrabold rounded-xl border border-indigo-500/40 flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer"
              >
                <History size={14} className="text-indigo-400" /> All Quotes ({savedQuotes.length})
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf || isSavingFirebase}
                title="Auto-save to Firebase & database, then open Print / Export PDF"
                className={`px-3.5 py-2 text-white text-xs font-black rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap border cursor-pointer ${
                  isExportingPdf || isSavingFirebase
                    ? 'bg-emerald-700/80 text-emerald-200 border-emerald-500/40 cursor-wait shadow-emerald-700/20'
                    : exportSuccess
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/40 shadow-emerald-600/20 active:scale-95'
                }`}
              >
                {isExportingPdf || isSavingFirebase ? (
                  <><RefreshCw size={14} className="animate-spin text-emerald-200" /> Auto-Saving &amp; Exporting...</>
                ) : exportSuccess ? (
                  <><Check size={14} className="text-white" /> Saved &amp; Exporting...</>
                ) : (
                  <><Download size={14} /> Print / Export PDF</>
                )}
              </button>

              {/* ⬇ DOWNLOAD AS EDITABLE WORD (.docx) BUTTON */}
              <button
                type="button"
                onClick={handleDownloadDocx}
                disabled={isExportingDocx}
                title="Download a fully editable Word document (.docx)"
                className={`px-3.5 py-2 text-xs font-black rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap border ${
                  docxSuccess
                    ? 'bg-teal-600 hover:bg-teal-500 text-white border-teal-400/40 shadow-teal-600/25'
                    : isExportingDocx
                    ? 'bg-blue-900/60 text-blue-300 border-blue-500/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-700 to-violet-700 hover:from-blue-600 hover:to-violet-600 text-white border-violet-400/30 shadow-violet-600/25 active:scale-95'
                }`}
              >
                {isExportingDocx ? (
                  <><RefreshCw size={13} className="animate-spin" /> .docx...</>
                ) : docxSuccess ? (
                  <><Check size={13} /> Word Ready!</>
                ) : (
                  <><FileDown size={13} /> Word (.docx)</>
                )}
              </button>
            </div>

            {/* 📱 SMARTPHONE RESPONSIVE ACTION BUTTONS (Clean, Non-crowded Mobile Action Strip) */}
            <div className="flex sm:hidden flex-col gap-2 w-full pt-1">
              <div className="grid grid-cols-2 gap-1.5 w-full">
                {/* ☁️ Save & Sync (Firebase) */}
                <button
                  type="button"
                  onClick={() => handleSaveToFirebase()}
                  disabled={isSavingFirebase}
                  className={`col-span-2 py-2.5 px-3 text-xs font-black rounded-xl shadow-lg flex items-center justify-center gap-2 border transition-all ${
                    firebaseSaveSuccess
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : isSavingFirebase
                      ? 'bg-indigo-900/60 text-indigo-300 border-indigo-500/40 cursor-wait'
                      : 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white border-sky-400/30 shadow-indigo-600/30 active:scale-95'
                  }`}
                >
                  {isSavingFirebase ? (
                    <><RefreshCw size={14} className="animate-spin" /> Archiving to Firebase...</>
                  ) : firebaseSaveSuccess ? (
                    <><Check size={14} /> Synced to Firebase Vault!</>
                  ) : (
                    <><CloudUpload size={14} /> Save &amp; Sync (Firebase)</>
                  )}
                </button>

                {/* 💾 Save Draft */}
                <button
                  type="button"
                  onClick={handleSaveCurrentDraft}
                  className={`py-2 px-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    savedSuccess
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-200 border-slate-700 active:scale-95'
                  }`}
                >
                  {savedSuccess ? <Check size={13} className="text-emerald-400" /> : <RefreshCw size={13} />}
                  <span>{savedSuccess ? 'Draft Saved' : 'Save Draft'}</span>
                </button>

                {/* 📜 All Quotes */}
                <button
                  type="button"
                  onClick={() => setHistoryDrawerOpen(true)}
                  className="py-2 px-2.5 bg-indigo-900/40 text-indigo-300 text-xs font-extrabold rounded-xl border border-indigo-500/40 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <History size={13} className="text-indigo-400" />
                  <span>Quotes ({savedQuotes.length})</span>
                </button>
              </div>

              {/* Mobile Secondary Action Dropdown / Expander */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowMobileMoreActions(prev => !prev)}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-400 hover:text-slate-200 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal size={12} className="text-indigo-400" />
                    Export PDF, Word &amp; Compile Tools
                  </span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showMobileMoreActions ? 'rotate-180 text-indigo-400' : ''}`} />
                </button>

                {showMobileMoreActions && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1.5 animate-fade-in">
                    <button
                      type="button"
                      onClick={handleCompilePdf}
                      disabled={isCompiling}
                      className="py-1.5 px-2 bg-slate-800 text-white border border-slate-700 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1"
                    >
                      <RefreshCw size={12} className={isCompiling ? "animate-spin" : ""} />
                      {isCompiling ? 'Compiling...' : '⚡ Re-Compile PDF'}
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      disabled={isExportingPdf || isSavingFirebase}
                      className="py-1.5 px-2 bg-emerald-600/90 text-white border border-emerald-500/40 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1"
                    >
                      <Download size={12} />
                      Export PDF (A4)
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadDocx}
                      disabled={isExportingDocx}
                      className="col-span-2 py-1.5 px-2 bg-gradient-to-r from-blue-700 to-indigo-700 text-white border border-indigo-400/30 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1"
                    >
                      <FileDown size={12} />
                      Download Word (.docx) Document
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar Sub-strip: Locked Status or Active Draft Editing Tag */}
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          {!isReadyToSave ? (
            <div className="text-[10.5px] font-bold text-sky-300 bg-sky-500/10 border border-sky-500/25 px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-3 shadow-sm w-full sm:w-auto flex-wrap">
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-sky-400 flex-shrink-0" />
                <span>
                  Setup in progress: <strong className="text-sky-200">{[!hasSeller && 'Seller', !hasBuyer && 'Buyer', !hasProduct && 'Product'].filter(Boolean).join(' • ')}</strong> pending. Click <strong>Save Draft</strong> anytime or quick-fill to finalize:
                </span>
              </div>
              <button
                type="button"
                onClick={handleQuickFillSampleData}
                className="text-[9.5px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1 w-full sm:w-auto justify-center"
              >
                <Sparkles size={11} /> Quick-Fill Buyer &amp; Item
              </button>
            </div>
          ) : (
            <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
              <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
              <span>Buyer, Seller &amp; Products Selected — Ready to Save &amp; Archive</span>
            </div>
          )}

          {currentEditingQuoteId && (
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-extrabold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <Edit2 size={11} /> Editing Draft #{docNo}
              </span>
              <button
                type="button"
                onClick={handleNewQuoteReset}
                className="text-[10.5px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
              >
                + New Blank Quote
              </button>
            </div>
          )}
        </div>

        {/* Bottom Row: Document Type Flow Selector Pills (Smooth Horizontal Touch Scrolling) */}
        <div className="pt-2.5 sm:pt-3 border-t border-slate-800/80 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar touch-pan-x flex-nowrap">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex-shrink-0 mr-1">
            Convert:
          </span>
          {(['QUOTATION', 'PROFORMA_INVOICE', 'TAX_INVOICE', 'PAYMENT_RECEIPT', 'CREDIT_NOTE'] as const).map(type => (
            <button
              key={type}
              onClick={() => handleConvertDoc(type)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                docType === type
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-card text-foreground hover:bg-muted/50 border border-border'
              }`}
            >
              {docType === type && <Check size={12} />}
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 📱 STICKY SEGMENTED CONTROL FOR SMARTPHONES (EDIT FORM vs LIVE A4 SHEET) */}
      <div className="flex lg:hidden sticky top-2 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-800/90 p-1.5 rounded-2xl w-full print-hide shadow-2xl gap-1.5">
        <button
          type="button"
          onClick={() => {
            setViewMode('SPLIT');
            setMobileActiveTab('BUILDER');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            viewMode === 'SPLIT' && mobileActiveTab === 'BUILDER'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white bg-slate-950/60'
          }`}
        >
          <Sliders size={13} />
          <span>1. Form Inputs ({coreCompletedCount}/4)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setViewMode('SPLIT');
            setMobileActiveTab('PREVIEW');
            setZoomScale(calculateFitScale());
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            (viewMode === 'FULL_PREVIEW' || (viewMode === 'SPLIT' && mobileActiveTab === 'PREVIEW'))
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white bg-slate-950/60'
          }`}
        >
          <Eye size={13} />
          <span>2. Live A4 Sheet</span>
        </button>
      </div>

      {/* ── FULL PREVIEW MODE ── */}
      {viewMode === 'FULL_PREVIEW' ? (
        <div className="flex flex-col items-center space-y-4 print-hide w-full max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 bg-slate-900 border border-slate-800 px-3 py-2 rounded-2xl text-xs font-bold text-white shadow-xl max-w-full">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                type="button"
                onClick={handleCompilePdf}
                disabled={isCompiling}
                className={`px-3 py-1 rounded-lg text-[11px] font-black flex items-center gap-1.5 transition-all shadow ${
                  compileSuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95'
                }`}
                title="Re-compile and sync all live data into the full A4 preview"
              >
                <RefreshCw size={12} className={isCompiling ? "animate-spin" : ""} />
                {isCompiling ? 'Compiling...' : compileSuccess ? '✓ PDF Synced' : 'Refresh & Compile'}
              </button>

              {lastCompiledAt && (
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Compiled {lastCompiledAt}
                </span>
              )}

              <button
                onClick={() => setZoomScale(calculateFitScale())}
                className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all"
              >
                <Smartphone size={13} /> Fit Screen
              </button>
            </div>

            <div className="flex items-center gap-2">
              <ZoomOut size={14} className="text-slate-400" />
              <input
                type="range"
                min="0.20"
                max="1.00"
                step="0.05"
                value={zoomScale}
                onChange={e => setZoomScale(Number(e.target.value))}
                className="w-20 sm:w-44 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <ZoomIn size={14} className="text-slate-400" />
              <span className="text-[10px] sm:text-[11px] font-black font-mono text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded border border-indigo-400/20">
                {Math.round(zoomScale * 100)}%
              </span>

              <div className="flex items-center gap-1 ml-1">
                {[0.50, 0.75, 1.0].map(s => (
                  <button
                    key={s}
                    onClick={() => setZoomScale(s)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-all ${
                      zoomScale === s
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {Math.round(s * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full max-w-full overflow-x-auto overflow-y-visible p-1 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-center">
            <div
              style={{
                width: `${Math.round(794 * zoomScale)}px`,
                minHeight: `${Math.round(1123 * zoomScale)}px`,
                position: 'relative',
              }}
              className={`flex-shrink-0 transition-all duration-300 shadow-2xl rounded-xl mx-auto ${
                isHighlightingPreview ? 'ring-4 ring-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.4)]' : ''
              }`}
            >
              <div
                key={`compiled-preview-full-${compileVersion}`}
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'top left',
                  width: '794px',
                }}
                className="absolute top-0 left-0 transition-all duration-200"
              >
                {renderA4SheetDocument()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── DUAL PANE LAYOUT (SPLIT BUILDER & LIVE PREVIEW) ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT PANE: CONTROLS & FORM BUILDER (SLIDABLE ACCORDION SECTIONS) ── */}
          <div className={`lg:col-span-6 space-y-4 sm:space-y-6 print-hide ${mobileActiveTab === 'PREVIEW' ? 'hidden lg:block' : 'block'}`}>
            {/* 📊 STEP COMPLETION & PROGRESS DASHBOARD */}
            <div className="crm-card bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Quotation Setup Progress</h4>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                        isCoreReady
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/20'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {isCoreReady ? '✓ 4/4 Core Steps Done • Ready to Export' : `${coreCompletedCount} of 4 Core Steps Done`}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      {isCoreReady 
                        ? 'Mandatory steps 1 to 4 are completed! Document is ready to export. Steps 5-8 below are optional.'
                        : 'Complete the 4 core steps (1 to 4) to prepare your quotation. Further formatting (5 to 8) is optional.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border transition-all ${
                    isCoreReady
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {Math.round((coreCompletedCount / 4) * 100)}% Ready
                  </span>
                </div>
              </div>

              {/* Dynamic Animated Progress Bar for the 4 Core Steps */}
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCoreReady
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'bg-gradient-to-r from-amber-500 to-indigo-500'
                  }`}
                  style={{ width: `${Math.max(8, (coreCompletedCount / 4) * 100)}%` }}
                />
              </div>

              {/* Mini Steps Navigation: 4 Core Required Steps + 4 Optional Controls */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-bold px-0.5">
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${isCoreReady ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                    CORE MANDATORY (STEPS 1 - 4):
                  </span>
                  <span className="text-slate-500 font-medium italic">
                    ADVANCED FORMATTING (STEPS 5 - 8 OPTIONAL)
                  </span>
                </div>

                <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-1 touch-pan-x sm:grid sm:grid-cols-8">
                  {[
                    { num: 1, label: '1. Dates', done: isStep1Done, key: 'metadata', opt: false },
                    { num: 2, label: '2. Seller', done: isStep2Done, key: 'company', opt: false },
                    { num: 3, label: '3. Buyer', done: isStep3Done, key: 'party', opt: false },
                    { num: 4, label: '4. Items', done: isStep4Done, key: 'items', opt: false },
                    { num: 5, label: '5. Terms', done: isStep5Done, key: 'terms', opt: true },
                    { num: 6, label: '6. Tax', done: isStep6Done, key: 'gst', opt: true },
                    { num: 7, label: '7. Margin', done: isStep7Done, key: 'pdf', opt: true },
                    { num: 8, label: '8. Layout', done: isStep8Done, key: 'layout', opt: true },
                  ].map(s => {
                    const isCurrentOpen = Boolean(openSections[s.key]);
                    return (
                      <button
                        key={s.num}
                        type="button"
                        onClick={() => {
                          if (s.num >= 5 && !showMoreControls) setShowMoreControls(true);
                          setOpenSections(prev => prev[s.key] ? {} : { [s.key]: true });
                        }}
                        className={`min-w-[68px] sm:min-w-0 flex-shrink-0 p-1.5 sm:p-1 rounded-xl sm:rounded-lg text-center border transition-all cursor-pointer ${
                          isCurrentOpen
                            ? 'bg-indigo-600/30 border-indigo-400 text-white ring-2 ring-indigo-500/50 shadow-md scale-[1.04]'
                            : s.done
                            ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 hover:bg-emerald-500/25'
                            : s.opt
                            ? 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                            : 'bg-slate-950 border-amber-500/30 text-amber-400 hover:text-amber-300'
                        }`}
                        title={s.opt ? `${s.label} (Optional)` : `${s.label} (Required)`}
                      >
                        <span className="text-[10px] font-mono font-black flex items-center justify-center">
                          {s.done ? <Check size={11} strokeWidth={3} className="text-emerald-400" /> : s.num}
                        </span>
                        <span className="text-[9px] sm:text-[8.5px] truncate block leading-tight font-semibold mt-0.5">
                          {s.label}{s.opt ? ' *' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 📅 1. DOCUMENT REFERENCE & DATES */}
            <div className={`crm-card rounded-2xl p-4 sm:p-5 transition-all duration-300 border ${
              openSections.metadata
                ? 'bg-slate-900 border-amber-500/60 ring-1 ring-amber-500/25 shadow-[0_4px_25px_rgba(245,158,11,0.12)]'
                : isStep1Done
                ? 'bg-slate-900/80 border-emerald-500/35 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
            }`}>
              <div
                onClick={() => toggleSection('metadata')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isStep1Done
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                      : openSections.metadata
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {isStep1Done ? <Check size={12} strokeWidth={3} /> : '1'}
                  </span>
                  <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isStep1Done ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    <Calendar size={15} /> 1. Document Reference &amp; Dates
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                    isStep1Done
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isStep1Done ? '✓ Completed' : 'Pending'}
                  </span>
                  <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                    <ChevronDown size={18} className={`transition-transform duration-300 transform ${openSections.metadata ? 'rotate-180 text-amber-400' : 'rotate-0 text-slate-400'}`} />
                  </button>
                </div>
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Doc Date</label>
                      <input
                        type="text"
                        value={docDate}
                        onChange={e => setDocDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
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
                            ? 'bg-slate-950 border-slate-800 text-white focus:border-amber-500 focus:outline-none'
                            : 'bg-slate-950/40 border-slate-800/50 text-slate-600 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  {/* 🗓️ OPTIONAL VALID UNTIL CHECKBOX TOGGLE */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
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

            {/* 🏢 2. SELECT SELLER / YOUR COMPANY */}
            <div className={`crm-card rounded-2xl p-4 sm:p-5 transition-all duration-300 border ${
              openSections.company
                ? 'bg-slate-900 border-sky-500/60 ring-1 ring-sky-500/25 shadow-[0_4px_25px_rgba(56,189,248,0.12)]'
                : isStep2Done
                ? 'bg-slate-900/80 border-emerald-500/35 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
            }`}>
              <div
                onClick={() => toggleSection('company')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isStep2Done
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                      : openSections.company
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {isStep2Done ? <Check size={12} strokeWidth={3} /> : '2'}
                  </span>
                  <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isStep2Done ? 'text-emerald-400' : 'text-indigo-400'
                  }`}>
                    <Building2 size={15} /> 2. Your Company / Seller
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeCompany) {
                        setEditingCompanyId(activeCompany.id);
                        setNewComp({ ...activeCompany });
                        setCompanyModalOpen(true);
                      }
                    }}
                    className="text-[10px] sm:text-[11px] font-extrabold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 sm:px-2.5 py-1 rounded-lg hover:bg-amber-500/25 transition-all flex items-center gap-1 active:scale-95 shadow-sm shadow-amber-500/10 cursor-pointer"
                    title="Edit currently selected company details"
                  >
                    <Edit2 size={12} /> <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCompanyId(null);
                      setNewComp({});
                      setCompanyModalOpen(true);
                    }}
                    className="text-[10px] sm:text-[11px] font-extrabold text-sky-300 bg-sky-500/15 border border-sky-500/30 px-2 sm:px-2.5 py-1 rounded-lg hover:bg-sky-500/25 transition-all active:scale-95 shadow-sm shadow-sky-500/10 cursor-pointer"
                  >
                    <Plus size={12} /> <span className="hidden sm:inline">Add Company</span><span className="sm:hidden">Add</span>
                  </button>
                  <span className={`text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full transition-all hidden xs:inline-block ${
                    isStep2Done
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isStep2Done ? '✓' : 'Pending'}
                  </span>
                  <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                    <ChevronDown size={18} className={`transition-transform duration-300 transform ${openSections.company ? 'rotate-180 text-sky-400' : 'rotate-0 text-slate-400'}`} />
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
                    {companies.length === 0 ? (
                      <option value="">No seller company profile found (Click '+ Add Company')</option>
                    ) : (
                      companies.map((comp, idx) => (
                        <option key={comp.id} value={comp.id}>
                          {idx === 0 ? `✨ (Recent) ${comp.name || 'Company Profile'}` : comp.name || 'Company Profile'} {comp.gstNo ? `— GSTIN: ${comp.gstNo}` : ''}
                        </option>
                      ))
                    )}
                  </select>

                  {!activeCompany ? (
                    <div className="bg-slate-950/60 border border-dashed border-indigo-500/30 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400">No company details entered. Click <strong className="text-indigo-400">+ Add Company</strong> to setup your business profile.</p>
                    </div>
                  ) : (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="relative w-9 h-9 flex-shrink-0">
                          {activeCompany.logoUrl ? (
                            <img
                              src={activeCompany.logoUrl}
                              alt="Logo"
                              onError={(e) => {
                                const target = e.target as HTMLElement;
                                target.style.display = 'none';
                                if (target.nextElementSibling) {
                                  (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                              className="w-9 h-9 rounded-lg object-cover border border-indigo-500/40"
                            />
                          ) : null}
                          <div
                            style={{ display: activeCompany.logoUrl ? 'none' : 'flex' }}
                            className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-black text-xs items-center justify-center border border-indigo-500/40 uppercase"
                          >
                            {activeCompany.name ? activeCompany.name.slice(0, 2) : 'CO'}
                          </div>
                        </div>
                        <div className="text-xs space-y-0.5 min-w-0 flex-1">
                          <p className="font-extrabold text-white truncate">{activeCompany.name || 'Your Company'}</p>
                          <p className="text-[11px] text-slate-400 truncate">{activeCompany.address || 'Address not specified'}</p>
                          <p className="text-[10px] font-bold text-indigo-400 mt-1">GSTIN: {activeCompany.gstNo || 'N/A'} • PAN: {activeCompany.panNo || 'N/A'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCompanyId(activeCompany.id);
                          setNewComp({ ...activeCompany });
                          setCompanyModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer flex-shrink-0"
                        title="Edit selected seller company"
                      >
                        <Edit2 size={13} /> Edit Info
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 👤 3. SELECT CLIENT / BUYER PARTY */}
            <div className={`crm-card rounded-2xl p-4 sm:p-5 transition-all duration-300 border ${
              openSections.party
                ? 'bg-slate-900 border-emerald-500/60 ring-1 ring-emerald-500/25 shadow-[0_4px_25px_rgba(16,185,129,0.12)]'
                : isStep3Done
                ? 'bg-slate-900/80 border-emerald-500/35 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
            }`}>
              <div
                onClick={() => toggleSection('party')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isStep3Done
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                      : openSections.party
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {isStep3Done ? <Check size={12} strokeWidth={3} /> : '3'}
                  </span>
                  <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isStep3Done ? 'text-emerald-400' : 'text-emerald-400'
                  }`}>
                    <UserCheck size={15} /> 3. Select Client / Buyer Party
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeParty) {
                        setEditingPartyId(activeParty.id);
                        setNewParty({ ...activeParty });
                        setPartyModalOpen(true);
                      }
                    }}
                    className="text-[10px] sm:text-[11px] font-extrabold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 sm:px-2.5 py-1 rounded-lg hover:bg-amber-500/25 transition-all flex items-center gap-1 active:scale-95 shadow-sm shadow-amber-500/10 cursor-pointer"
                    title="Edit currently selected party details"
                  >
                    <Edit2 size={12} /> <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPartyId(null);
                      setNewParty({});
                      setPartyModalOpen(true);
                    }}
                    className="text-[10px] sm:text-[11px] font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 sm:px-2.5 py-1 rounded-lg hover:bg-emerald-500/25 transition-all active:scale-95 shadow-sm shadow-emerald-500/10 cursor-pointer"
                  >
                    <Plus size={12} /> <span className="hidden sm:inline">Add Party</span><span className="sm:hidden">Add</span>
                  </button>
                  <span className={`text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full transition-all hidden xs:inline-block ${
                    isStep3Done
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isStep3Done ? '✓' : 'Pending'}
                  </span>
                  <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                    <ChevronDown size={18} className={`transition-transform duration-300 transform ${openSections.party ? 'rotate-180 text-emerald-400' : 'rotate-0 text-slate-400'}`} />
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
                    {parties.length === 0 ? (
                      <option value="">No client / buyer parties saved yet (Click '+ Add Party')</option>
                    ) : (
                      parties.map((party, idx) => (
                        <option key={party.id} value={party.id}>
                          {idx === 0 ? `✨ (Recent) ${party.name}` : party.name} — GSTIN: {party.gstNo || 'N/A'}
                        </option>
                      ))
                    )}
                  </select>

                  {!activeParty ? (
                    <div className="bg-slate-950/60 border border-dashed border-emerald-500/30 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400">No client party selected. Click <strong className="text-emerald-400">+ Add Party</strong> above to create your first buyer.</p>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-extrabold text-xs text-white truncate">{activeParty.name || 'Untitled Party'}</p>
                        <p className="text-[11px] text-slate-400 truncate">🏢 Billing: {activeParty.address || 'Address not specified'}</p>
                        <p className="text-[10px] font-bold text-emerald-400">GSTIN: {activeParty.gstNo || 'N/A'} • PAN: {activeParty.panNo || 'N/A'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPartyId(activeParty.id);
                          setNewParty({ ...activeParty });
                          setPartyModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer flex-shrink-0"
                        title="Edit selected client party"
                      >
                        <Edit2 size={13} /> Edit Info
                      </button>
                    </div>
                  )}

                  {/* 🚚 SEPARATE SHIPPING ADDRESS TOGGLE */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={useSeparateShipping}
                        onChange={e => setUseSeparateShipping(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Truck size={14} className="text-emerald-400" /> Shipping Address is different
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

            {/* 📦 4. PRODUCTS & LINE ITEMS */}
            <div className={`crm-card rounded-2xl p-4 sm:p-5 transition-all duration-300 border ${
              openSections.items
                ? 'bg-slate-900 border-purple-500/60 ring-1 ring-purple-500/25 shadow-[0_4px_25px_rgba(168,85,247,0.12)]'
                : isStep4Done
                ? 'bg-slate-900/80 border-emerald-500/35 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
            }`}>
              <div
                onClick={() => toggleSection('items')}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isStep4Done
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                      : openSections.items
                      ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/25'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {isStep4Done ? <Check size={12} strokeWidth={3} /> : '4'}
                  </span>
                  <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isStep4Done ? 'text-emerald-400' : 'text-purple-400'
                  }`}>
                    <Package size={15} /> 4. Products &amp; Line Items ({items.length})
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); addLineItem(); }}
                    className="text-[10px] sm:text-[11px] font-extrabold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2 sm:px-2.5 py-1 rounded-lg hover:bg-purple-500/30 flex items-center gap-1 transition-all active:scale-95 shadow-sm shadow-purple-500/10 cursor-pointer"
                  >
                    <Plus size={12} /> <span className="hidden sm:inline">Add Item</span><span className="sm:hidden">Add</span>
                  </button>
                  <span className={`text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full transition-all hidden xs:inline-block ${
                    isStep4Done
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isStep4Done ? '✓' : 'Pending'}
                  </span>
                  <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                    <ChevronDown size={18} className={`transition-transform duration-300 transform ${openSections.items ? 'rotate-180 text-purple-400' : 'rotate-0 text-slate-400'}`} />
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
                  {/* 👁️ TOGGLES: SHOW/HIDE GST % COLUMN & HSN/SAC COLUMN */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                        <Columns size={13} /> Table Column Controls
                      </span>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-slate-800/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-900/40 border border-slate-800/60 rounded-lg p-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showGstColumn}
                            onChange={e => setShowGstColumn(e.target.checked)}
                            className="w-4 h-4 rounded text-purple-500 bg-slate-950 border-slate-800 cursor-pointer accent-purple-600"
                          />
                          <span className="text-xs font-bold text-slate-200">
                            Display GST % Column &amp; Calculate Amount with GST
                          </span>
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-900/40 border border-slate-800/60 rounded-lg p-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showHsnColumn}
                            onChange={e => setShowHsnColumn(e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-500 bg-slate-950 border-slate-800 cursor-pointer accent-indigo-600"
                          />
                          <span className="text-xs font-bold text-slate-200">
                            Display HSN / SAC Code Column in Table
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 🛠️ MULTIPLE DYNAMIC CUSTOM COLUMNS MANAGER */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                        <Sliders size={13} /> Custom Table Columns ({customColumns.length})
                      </span>
                      <button
                        type="button"
                        onClick={addCustomColumn}
                        className="text-[10.5px] font-extrabold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-lg hover:bg-purple-500/30 flex items-center gap-1"
                      >
                        <Plus size={11} /> Add Custom Column
                      </button>
                    </div>

                    {customColumns.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {customColumns.map((col, cIdx) => (
                          <div key={col.id} className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1.5">
                            <span className="text-[10px] font-mono text-purple-400 font-bold px-1.5 py-0.5 bg-purple-500/10 rounded">
                              Col {cIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={col.name}
                              onChange={e => updateCustomColumnName(col.id, e.target.value)}
                              placeholder="Column Heading Name..."
                              className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-bold focus:border-purple-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeCustomColumn(col.id)}
                              className="p-1 text-slate-500 hover:text-rose-400"
                              title="Delete Column"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Line Items List */}
                  {items.map((item, idx) => (
                    <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-400">#{idx + 1} Line Item</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <select
                            onChange={e => {
                              const picked = catalogProducts.find(p => p.name === e.target.value);
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
                            className="bg-slate-900 border border-slate-800 text-[11px] sm:text-xs text-indigo-300 rounded-lg px-2 py-1 truncate max-w-[140px] sm:max-w-none cursor-pointer"
                          >
                            <option value="">Quick Pick Catalog Product...</option>
                            {catalogProducts.map(p => (
                              <option key={p.id || p.name} value={p.name} suppressHydrationWarning>
                                {p.name} (₹{p.price.toLocaleString('en-IN')})
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => removeLineItem(item.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 flex-shrink-0 cursor-pointer"
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
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Product Title (Custom or Catalog)</label>
                            <input
                              type="text"
                              value={item.productName}
                              onChange={e => updateLineItem(item.id, { productName: e.target.value })}
                              placeholder="Enter product title or select from catalog above..."
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

                        {/* 📁 DIRECT PRODUCT IMAGE FILE UPLOAD PICKER */}
                        {item.showImage && (
                          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10.5px] font-bold text-sky-300 flex items-center gap-1">
                                <Upload size={12} /> Product Image File Upload (Strict 1:1 Square 1080 × 1080 px)
                              </label>
                              {item.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() => updateLineItem(item.id, { imageUrl: '' })}
                                  className="text-[9.5px] font-bold text-rose-400 hover:underline"
                                >
                                  Remove Image
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="cursor-pointer bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all">
                                <Upload size={13} /> 📁 Pick &amp; Upload Image File (1080x1080)
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={e => {
                                    if (e.target.files?.[0]) {
                                      handleImageFileUpload(e.target.files[0], dataUrl =>
                                        updateLineItem(item.id, { imageUrl: dataUrl, showImage: true })
                                      );
                                    }
                                  }}
                                />
                              </label>
                              {item.imageUrl ? (
                                <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                                  <img
                                    src={item.imageUrl}
                                    alt="Prod preview"
                                    className="w-6 h-6 aspect-square rounded object-cover border border-slate-700"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      target.onerror = null;
                                      target.style.display = 'none';
                                    }}
                                  />
                                  <span className="text-[10px] text-emerald-400 font-bold">✓ Image Loaded</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">No image file chosen</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Product Description Input & Toggle */}
                        <div className="space-y-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <AlignLeft size={12} className="text-amber-400" /> Product Description
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
                            value={item.hsnCode || ''}
                            onChange={e => updateLineItem(item.id, { hsnCode: e.target.value })}
                            placeholder="e.g. 998313"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Quantity</label>
                          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateLineItem(item.id, { qty: Math.max(1, (Number(item.qty) || 1) - 1) })}
                              className="px-2 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-black cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={e => updateLineItem(item.id, { qty: Math.max(1, Number(e.target.value)) })}
                              className="w-full bg-transparent px-1 py-1.5 text-xs text-white font-bold text-center focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateLineItem(item.id, { qty: (Number(item.qty) || 1) + 1 })}
                              className="px-2 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-black cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Unit</label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={e => updateLineItem(item.id, { unit: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Rate (₹)</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => updateLineItem(item.id, { unitPrice: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">GST %</label>
                          <input
                            type="number"
                            value={item.taxRate}
                            onChange={e => updateLineItem(item.id, { taxRate: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-amber-400 font-bold text-center"
                          />
                        </div>
                      </div>

                      {/* 💰 Line Item Subtotal Display Banner for Smartphone & Quick Visibility */}
                      {(() => {
                        const baseVal = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
                        const taxVal = baseVal * ((Number(item.taxRate) || 0) / 100);
                        const itemGrand = showGstColumn ? Math.round(baseVal + taxVal) : baseVal;
                        return (
                          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
                            <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Row Subtotal {showGstColumn ? `(with ${item.taxRate}% GST)` : '(Base Rate)'}:
                            </span>
                            <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm">
                              ₹{itemGrand.toLocaleString('en-IN')}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Dynamic Custom Column Inputs */}
                      {customColumns.length > 0 && (
                        <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                          <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider block">
                            Custom Column Values:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {customColumns.map(col => (
                              <div key={col.id} className="space-y-0.5">
                                <label className="block text-[10px] font-bold text-slate-400 truncate">
                                  {col.name || 'Custom Column'}:
                                </label>
                                <input
                                  type="text"
                                  value={item.customValues?.[col.id] || ''}
                                  onChange={e => {
                                    const updated = { ...(item.customValues || {}), [col.id]: e.target.value };
                                    updateLineItem(item.id, { customValues: updated });
                                  }}
                                  placeholder={`Enter value for ${col.name}...`}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-purple-200 focus:border-purple-500 focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 🎛️ MORE CONTROLS TOGGLE BANNER BUTTON (SLIDES SECTIONS 5 TO 8) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowMoreControls(prev => !prev)}
                className={`group w-full p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all duration-300 select-none shadow-xl cursor-pointer ${
                  showMoreControls
                    ? 'bg-gradient-to-r from-violet-950/80 via-slate-900 to-indigo-950/80 border-violet-500/50 shadow-violet-500/15 ring-1 ring-violet-500/20'
                    : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-violet-500/40 hover:shadow-violet-500/10'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md flex-shrink-0 ${
                    showMoreControls
                      ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-violet-500/40 scale-105'
                      : 'bg-slate-800 text-violet-400 group-hover:bg-violet-500/20 group-hover:text-violet-300'
                  }`}>
                    <SlidersHorizontal size={18} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        More Controls &amp; Advanced Settings
                      </span>
                      <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/80">
                        Optional • Steps 5 - 8
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      5. Terms &amp; Conditions • 6. GST Tax Mechanism • 7. Page Margins • 8. Layout Engine
                    </p>
                  </div>
                </div>

                {/* Prominent High-Tech Action Button */}
                <div className="flex items-center justify-end flex-shrink-0">
                  {showMoreControls ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-950/90 text-violet-200 font-black text-xs border border-violet-500/60 shadow-lg shadow-violet-500/20 group-hover:bg-violet-900/70 transition-all">
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
                      <span>Click to Collapse</span>
                      <ChevronUp size={15} className="text-violet-300 transition-transform group-hover:-translate-y-0.5 duration-200" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white font-black text-xs shadow-lg shadow-violet-600/30 border border-violet-400/50 group-hover:from-violet-500 group-hover:via-indigo-500 group-hover:to-purple-500 group-hover:shadow-violet-500/40 group-hover:scale-[1.02] active:scale-[0.98] transition-all">
                      <Sparkles size={13} className="text-violet-200" />
                      <span>Click to Slide Open</span>
                      <ChevronDown size={15} className="text-white transition-transform group-hover:translate-y-0.5 duration-200" />
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* ── EXPANDABLE ADVANCED CONTROLS CONTAINER (SECTIONS 5 - 8) ── */}
            <div
              className={`space-y-4 sm:space-y-6 transition-all duration-500 ease-in-out overflow-hidden ${
                showMoreControls
                  ? 'opacity-100 max-h-[5000px] pt-1'
                  : 'opacity-0 max-h-0 pointer-events-none'
              }`}
            >
              {/* 📄 5. TERMS & CONDITIONS (PREVIOUS TEMPLATES & ADD NEW) */}
              <div className={`crm-card rounded-2xl p-4 sm:p-5 transition-all duration-300 border ${
                openSections.terms
                  ? 'bg-slate-900 border-sky-500/60 ring-1 ring-sky-500/25 shadow-[0_4px_25px_rgba(56,189,248,0.12)]'
                  : isStep5Done
                  ? 'bg-slate-900/80 border-emerald-500/35 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
              }`}>
                <div
                  onClick={() => toggleSection('terms')}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isStep5Done
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                        : openSections.terms
                        ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {isStep5Done ? <Check size={12} strokeWidth={3} /> : '5'}
                    </span>
                    <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      isStep5Done ? 'text-emerald-400' : 'text-sky-400'
                    }`}>
                      <FileText size={15} /> 5. Terms &amp; Conditions
                      <span className="text-[9.5px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/80">Optional</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                      isStep5Done
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {isStep5Done ? '✓ Configured' : 'Optional'}
                    </span>
                    <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                      <ChevronDown size={18} className={`transition-transform duration-300 transform ${openSections.terms ? 'rotate-180 text-sky-400' : 'rotate-0 text-slate-400'}`} />
                    </button>
                  </div>
                </div>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openSections.terms
                      ? 'grid-rows-[1fr] opacity-100 pt-3 border-t border-slate-800 mt-3'
                      : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                  }`}
                >
                  <div className="overflow-hidden space-y-3">
                    {/* Quick Select from Previous / Saved Templates */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <Sparkles size={12} className="text-sky-400" /> Select from Previous / Saved Templates:
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsAddingNewTerms(prev => !prev)}
                          className="text-[10px] font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-lg hover:bg-sky-500/20 transition-all flex items-center gap-1"
                        >
                          <Plus size={11} /> {isAddingNewTerms ? 'Close Form' : '+ Save Current as New Template'}
                        </button>
                      </div>

                      {/* Template Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {termsTemplates.map(tmpl => {
                          const isSelected = termsText.trim() === tmpl.text.trim();
                          return (
                            <button
                              key={tmpl.id}
                              type="button"
                              onClick={() => {
                                setSelectedTermsId(tmpl.id);
                                setTermsText(tmpl.text);
                              }}
                              className={`text-[10.5px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-500/25 text-sky-300 border-sky-400/60 shadow-sm shadow-sky-500/20 font-black'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                              }`}
                            >
                              {tmpl.name}
                            </button>
                          );
                        })}
                      </div>

                      {/* Add New Template Input Form */}
                      {isAddingNewTerms && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-2 animate-fade-in">
                          <label className="text-[10px] font-bold text-sky-300 block">
                            Name your current terms template to save it for future quotes:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newTermsTemplateName}
                              onChange={e => setNewTermsTemplateName(e.target.value)}
                              placeholder="e.g. 50-50 Milestone Terms, AMC Contract Terms..."
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:border-sky-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleSaveCustomTerms}
                              className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Save Template
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsAddingNewTerms(false)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Editable Terms Textarea */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">
                        Active Terms &amp; Conditions (Printed in PDF &amp; Word Export):
                      </label>
                      <textarea
                        value={termsText}
                        onChange={e => setTermsText(e.target.value)}
                        rows={3}
                        placeholder="Enter terms and conditions line by line..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 resize-none font-sans focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 🎚️ 6. GST TAX RATE & TAX TYPE (CGST / IGST / UTGST / EXEMPT) */}
              <div className={`crm-card rounded-2xl p-4 sm:p-5 transition-all duration-300 border ${
                openSections.gst
                  ? 'bg-slate-900 border-amber-500/60 ring-1 ring-amber-500/25 shadow-[0_4px_25px_rgba(245,158,11,0.12)]'
                  : isStep6Done
                  ? 'bg-slate-900/80 border-emerald-500/35 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
              }`}>
                <div
                  onClick={() => toggleSection('gst')}
                  className="flex items-center justify-between cursor-pointer select-none gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isStep6Done
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                        : openSections.gst
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {isStep6Done ? <Check size={12} strokeWidth={3} /> : '6'}
                    </span>
                    <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 truncate ${
                      isStep6Done ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      <Percent size={15} className="flex-shrink-0" /> 6. GST Tax Rate &amp; Tax Type
                      <span className="text-[9.5px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/80">Optional</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10.5px] sm:text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-lg">
                      {gstType === 'EXEMPT' || globalGstRate === 0 ? 'Exempt (0%)' : `${globalGstRate}% (${gstType.replace('_', '+')})`}
                    </span>
                    <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                      <ChevronDown size={18} className={`transition-transform duration-300 transform ${openSections.gst ? 'rotate-180 text-amber-400' : 'rotate-0 text-slate-400'}`} />
                    </button>
                  </div>
                </div>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openSections.gst
                      ? 'grid-rows-[1fr] opacity-100 pt-3 border-t border-slate-800 mt-3'
                      : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                  }`}
                >
                  <div className="overflow-hidden space-y-4">
                    {/* GST Tax Type Selector (CGST + SGST, IGST, CGST + UTGST, EXEMPT) */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black uppercase text-amber-400 tracking-wider">
                        Select GST Tax Type / Mechanism:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { id: 'CGST_SGST', label: 'CGST + SGST', sub: 'In-State Split' },
                          { id: 'IGST', label: 'IGST', sub: 'Integrated Interstate' },
                          { id: 'CGST_UTGST', label: 'CGST + UTGST', sub: 'Union Territory' },
                          { id: 'EXEMPT', label: 'EXEMPT / NIL', sub: '0% Tax Exempt' },
                        ].map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setGstType(t.id as any);
                              if (t.id === 'EXEMPT') {
                                handleApplyGlobalGst(0);
                              } else if (globalGstRate === 0) {
                                handleApplyGlobalGst(18);
                              }
                            }}
                            className={`py-2 px-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              gstType === t.id
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <p className="text-xs font-black truncate">{t.label}</p>
                            <p className={`text-[9.5px] truncate ${gstType === t.id ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                              {t.sub}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* GST Rate Slider & Presets */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300">GST Tax Rate Percentage</label>
                        <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded font-mono border border-amber-400/20">
                          {globalGstRate}% Imposed
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400">0%</span>
                        <input
                          type="range"
                          min={0}
                          max={28}
                          step={1}
                          value={globalGstRate}
                          onChange={e => {
                            const val = Number(e.target.value);
                            handleApplyGlobalGst(val);
                            if (val === 0) setGstType('EXEMPT');
                            else if (gstType === 'EXEMPT') setGstType('CGST_SGST');
                          }}
                          className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <span className="text-[10px] font-bold text-slate-400">28%</span>
                      </div>

                      {/* Quick GST Presets */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
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
                            onClick={() => {
                              handleApplyGlobalGst(preset.val);
                              if (preset.val === 0) setGstType('EXEMPT');
                              else if (gstType === 'EXEMPT') setGstType('CGST_SGST');
                            }}
                            className={`py-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                              globalGstRate === preset.val
                                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ⚙️ 7. PAGE MARGINS & SIZING CONTROLS */}
              <div className={`crm-card rounded-2xl p-4 sm:p-5 transition-all duration-300 border ${
                openSections.pdf
                  ? 'bg-slate-900 border-indigo-500/60 ring-1 ring-indigo-500/25 shadow-[0_4px_25px_rgba(99,102,241,0.12)]'
                  : isStep7Done
                  ? 'bg-slate-900/80 border-emerald-500/35 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
              }`}>
                <div
                  onClick={() => toggleSection('pdf')}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isStep7Done
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                        : openSections.pdf
                        ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/25'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {isStep7Done ? <Check size={12} strokeWidth={3} /> : '7'}
                    </span>
                    <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      isStep7Done ? 'text-emerald-400' : 'text-indigo-400'
                    }`}>
                      <Sliders size={15} /> 7. Page Margins &amp; Controls
                      <span className="text-[9.5px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/80">Optional</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                      isStep7Done
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {isStep7Done ? `✓ ${pdfMargin}mm Margin` : 'Pending'}
                    </span>
                    <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                      <ChevronDown size={18} className={`transition-transform duration-300 transform ${openSections.pdf ? 'rotate-180 text-indigo-400' : 'rotate-0 text-slate-400'}`} />
                    </button>
                  </div>
                </div>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openSections.pdf
                      ? 'grid-rows-[1fr] opacity-100 pt-3 border-t border-slate-800 mt-3'
                      : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                  }`}
                >
                  <div className="overflow-hidden space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                pdfPageMode === p.val ? 'bg-indigo-600 text-white shadow' : 'bg-slate-950 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Top and Bottom Padding Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Header Top Padding: {pdfTopPadding}px</label>
                        <div className="flex gap-1">
                          {[
                            { label: '16px Tight', val: 16 },
                            { label: '32px Std', val: 32 },
                            { label: '48px Max', val: 48 },
                          ].map(b => (
                            <button
                              key={b.val}
                              type="button"
                              onClick={() => setPdfTopPadding(b.val)}
                              className={`flex-1 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                pdfTopPadding === b.val ? 'bg-indigo-600 text-white shadow' : 'bg-slate-950 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Footer Bottom Padding: {pdfBottomPadding}px</label>
                        <div className="flex gap-1">
                          {[
                            { label: '12px Tight', val: 12 },
                            { label: '28px Std', val: 28 },
                            { label: '40px Max', val: 40 },
                          ].map(b => (
                            <button
                              key={b.val}
                              type="button"
                              onClick={() => setPdfBottomPadding(b.val)}
                              className={`flex-1 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                pdfBottomPadding === b.val ? 'bg-indigo-600 text-white shadow' : 'bg-slate-950 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🎨 8. SECTION LAYOUT, GAPS & POSITIONING */}
              <div className={`crm-card rounded-2xl p-4 sm:p-5 transition-all duration-300 border ${
                openSections.layout
                  ? 'bg-slate-900 border-violet-500/60 ring-1 ring-violet-500/25 shadow-[0_4px_25px_rgba(139,92,246,0.12)]'
                  : isStep8Done
                  ? 'bg-slate-900/80 border-emerald-500/35 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
              }`}>
                <div
                  onClick={() => toggleSection('layout')}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isStep8Done
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                        : openSections.layout
                        ? 'bg-violet-500 text-slate-950 shadow-md shadow-violet-500/25'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {isStep8Done ? <Check size={12} strokeWidth={3} /> : '8'}
                    </span>
                    <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      isStep8Done ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      <Layers size={15} /> 8. Section Layout, Gaps &amp; Positioning
                      <span className="text-[9.5px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/80">Optional</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); resetSectionLayout(); }}
                      className="text-[10.5px] font-extrabold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-lg hover:bg-amber-400/20 flex items-center gap-1 cursor-pointer"
                      title="Reset Layout to Default"
                    >
                      <RotateCcw size={11} /> Reset
                    </button>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                      isStep8Done
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {isStep8Done ? '✓ Completed' : 'Pending'}
                    </span>
                    <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                      <ChevronDown size={18} className={`transition-transform duration-300 transform ${openSections.layout ? 'rotate-180 text-violet-400' : 'rotate-0 text-slate-400'}`} />
                    </button>
                  </div>
                </div>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openSections.layout
                      ? 'grid-rows-[1fr] opacity-100 pt-3 border-t border-slate-800 mt-3'
                      : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                  }`}
                >
                  <div className="overflow-hidden space-y-4">
                    {/* Section Gap Slider & Presets */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300">Gap Between Sections</label>
                        <span className="text-[11px] font-black font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          {sectionGap}px Spacing
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="60"
                        step="1"
                        value={sectionGap}
                        onChange={e => setSectionGap(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />

                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { label: '4px Tight', val: 4 },
                          { label: '10px Std', val: 10 },
                          { label: '18px Wide', val: 18 },
                          { label: '30px Max', val: 30 },
                          { label: '50px Jumbo', val: 50 },
                        ].map(g => (
                          <button
                            key={g.val}
                            type="button"
                            onClick={() => setSectionGap(g.val)}
                            className={`py-1 rounded-lg text-[10px] font-extrabold transition-all truncate cursor-pointer ${
                              sectionGap === g.val
                                ? 'bg-amber-500 text-slate-950 shadow font-black'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section Position Re-ordering List */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                        Section Sequence &amp; Visibility Controls
                      </label>
                      <div className="space-y-1.5">
                        {sectionOrder.map((secId, idx) => {
                          const meta = SECTION_METADATA.find(m => m.id === secId);
                          const isVisible = visibleSections[secId];
                          return (
                            <div
                              key={secId}
                              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                                isVisible
                                  ? 'bg-slate-950 border-slate-800 text-white'
                                  : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-5 h-5 rounded bg-slate-900 border border-slate-800 text-[10px] font-black text-amber-400 flex items-center justify-center flex-shrink-0 font-mono">
                                  #{idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold truncate leading-tight">{meta?.label}</p>
                                  <p className="text-[10px] text-slate-500 truncate leading-tight">{meta?.desc}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                {/* Move Up */}
                                <button
                                  type="button"
                                  onClick={() => moveSectionUp(secId)}
                                  disabled={idx === 0}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                  title="Move Section Up"
                                >
                                  <ArrowUp size={13} />
                                </button>

                                {/* Move Down */}
                                <button
                                  type="button"
                                  onClick={() => moveSectionDown(secId)}
                                  disabled={idx === sectionOrder.length - 1}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                  title="Move Section Down"
                                >
                                  <ArrowDown size={13} />
                                </button>

                                {/* Visibility Toggle */}
                                <button
                                  type="button"
                                  onClick={() => toggleSectionVisibility(secId)}
                                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isVisible
                                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                                  }`}
                                  title={isVisible ? 'Hide Section' : 'Show Section'}
                                >
                                  {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANE: LIVE STALWART A4 PREVIEW (STICKY & RESPONSIVE FOR SMARTPHONES) ── */}
          <div className={`lg:col-span-6 sticky top-6 flex flex-col items-center print-hide w-full max-w-full ${mobileActiveTab === 'BUILDER' ? 'hidden lg:flex' : 'flex'}`}>
            {/* Header Toolbar */}
            <div className="w-full max-w-[210mm] flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-3.5 py-2 bg-slate-900 text-slate-300 rounded-t-xl border border-slate-800 text-[10px] font-bold shadow-md gap-2">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="flex items-center gap-1.5 text-[#002060] bg-white/90 px-2 py-0.5 rounded font-black truncate">
                  <span className="w-2 h-2 rounded-full bg-[#002060] animate-pulse flex-shrink-0"></span>
                  Spectro A4 Live Preview ({pdfMargin}mm Margin)
                </span>
                {lastCompiledAt && (
                  <span className="hidden xl:inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Compiled {lastCompiledAt}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-1.5 flex-wrap">
                {/* ⚡ Live Compile Button right on Preview Toolbar */}
                <button
                  type="button"
                  onClick={handleCompilePdf}
                  disabled={isCompiling}
                  className={`px-2.5 py-1 sm:py-0.5 rounded text-[9.5px] font-black flex items-center gap-1 transition-all shadow cursor-pointer ${
                    compileSuccess
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95'
                  }`}
                  title="Force compile latest live data into preview"
                >
                  <RefreshCw size={11} className={isCompiling ? "animate-spin" : ""} />
                  {isCompiling ? 'Compiling...' : compileSuccess ? '✓ Synced' : 'Compile'}
                </button>

                <button
                  type="button"
                  onClick={() => setZoomScale(calculateFitScale())}
                  className="px-2 py-1 sm:py-0.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all"
                  title="Fit Screen Width"
                >
                  <Smartphone size={11} /> Fit Screen
                </button>

                <div className="flex items-center gap-1 bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800">
                  <button onClick={() => setZoomScale(Math.max(0.20, Math.round((zoomScale - 0.05) * 100) / 100))} className="p-0.5 hover:text-foreground text-muted-foreground transition-colors" title="Zoom Out">
                    <ZoomOut size={12} />
                  </button>
                  <span className="text-indigo-400 font-mono font-black text-[10px] px-1">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button onClick={() => setZoomScale(Math.min(1.0, Math.round((zoomScale + 0.05) * 100) / 100))} className="p-0.5 hover:text-foreground text-muted-foreground transition-colors" title="Zoom In">
                    <ZoomIn size={12} />
                  </button>
                </div>

                <div className="flex items-center gap-1 ml-0.5">
                  {[0.50, 0.75, 1.0].map(s => (
                    <button
                      key={s}
                      onClick={() => setZoomScale(s)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                        zoomScale === s ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {Math.round(s * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scaled Preview Wrapper with Bounding Box Calculation */}
            <div className="w-full max-w-full overflow-x-auto overflow-y-visible p-1 sm:p-4 bg-slate-950 rounded-b-xl border border-t-0 border-slate-800 flex justify-center">
              <div
                style={{
                  width: `${Math.round(794 * zoomScale)}px`,
                  minHeight: `${Math.round(1123 * zoomScale)}px`,
                  position: 'relative',
                }}
                className={`flex-shrink-0 transition-all duration-300 shadow-2xl rounded-xl mx-auto ${
                  isHighlightingPreview ? 'ring-4 ring-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.4)]' : ''
                }`}
              >
                <div
                  key={`compiled-preview-split-${compileVersion}`}
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top left',
                    width: '794px',
                  }}
                  className="absolute top-0 left-0 transition-all duration-200"
                >
                  {renderA4SheetDocument()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Sheet Element (Hidden on Screen, Active on Print) */}
      <div className="printable-pdf-area hidden print:block">
        {renderA4SheetDocument()}
      </div>

      {/* ── MODAL: ADD / EDIT COMPANY ── */}
      {companyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-lg space-y-4 text-white max-h-[92vh] overflow-y-auto">
            <h3 className="text-sm font-black text-indigo-400 flex items-center gap-2">
              <Building2 size={18} /> {editingCompanyId ? 'Edit Seller Company' : 'Add New Seller Company'}
            </h3>
            <div className="space-y-2 text-xs">
              <input
                type="text"
                placeholder="Company Name *"
                value={newComp.name || ''}
                onChange={e => setNewComp({ ...newComp, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={newComp.email || ''}
                  onChange={e => setNewComp({ ...newComp, email: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
                <input
                  type="tel"
                  placeholder="Contact Phone Number *"
                  value={newComp.phone || ''}
                  onChange={e => setNewComp({ ...newComp, phone: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* 📁 DIRECT FILE UPLOAD FOR COMPANY LOGO */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <label className="block text-[11px] font-bold text-slate-300">
                  Company Logo (Upload File)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all">
                    <Upload size={14} /> Upload Logo File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.[0]) {
                          handleImageFileUpload(e.target.files[0], dataUrl => setNewComp({ ...newComp, logoUrl: dataUrl }));
                        }
                      }}
                    />
                  </label>
                  {newComp.logoUrl ? (
                    <div className="flex items-center gap-2">
                      <img src={newComp.logoUrl} alt="Logo preview" className="w-7 h-7 rounded border border-slate-700 object-cover" />
                      <span className="text-[10px] text-emerald-400 font-bold">✓ Logo Uploaded</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No file chosen</span>
                  )}
                </div>
              </div>

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
                onClick={() => { setCompanyModalOpen(false); setEditingCompanyId(null); }}
                className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewCompany}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
              >
                {editingCompanyId ? 'Update Company' : 'Save Company'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT PARTY ── */}
      {partyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-lg space-y-4 text-white max-h-[92vh] overflow-y-auto">
            <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2">
              <UserCheck size={18} /> {editingPartyId ? 'Edit Client Party' : 'Add New Client Party'}
            </h3>
            <div className="space-y-2 text-xs">
              <input
                type="text"
                placeholder="Party / Company Name *"
                value={newParty.name || ''}
                onChange={e => setNewParty({ ...newParty, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                required
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
                  placeholder="Email Address *"
                  value={newParty.email || ''}
                  onChange={e => setNewParty({ ...newParty, email: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={newParty.phone || ''}
                  onChange={e => setNewParty({ ...newParty, phone: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  required
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
                onClick={() => { setPartyModalOpen(false); setEditingPartyId(null); }}
                className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewParty}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
              >
                {editingPartyId ? 'Update Party' : 'Save Party'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📜 RECENT QUOTES & SAVED DRAFTS ENGINE MODAL / DRAWER */}
      {historyDrawerOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-end transition-all">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col p-4 sm:p-6 shadow-2xl text-white animate-slide-in-right overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-400/10 border border-indigo-400/30 px-2 py-0.5 rounded">
                  PERSISTENT STORAGE ENGINE
                </span>
                <h2 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-2">
                  <History className="text-indigo-400" size={20} /> All Quotes &amp; Saved Drafts ({savedQuotes.length})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNewQuoteReset}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Plus size={13} /> New Quote
                </button>
                <button
                  onClick={() => setHistoryDrawerOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground bg-muted rounded-xl cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-3 gap-2.5 py-3 border-b border-slate-800/80 text-xs flex-shrink-0">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Quotes &amp; Drafts</p>
                <p className="text-base font-black text-white">{savedQuotes.length}</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Saved Drafts</p>
                <p className="text-base font-black text-amber-400">
                  {savedQuotes.filter(q => q.status === 'DRAFT').length}
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Generated &amp; Sent</p>
                <p className="text-base font-black text-sky-400">
                  {savedQuotes.filter(q => q.status === 'GENERATED_SENT' || q.status === 'SENT').length}
                </p>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="py-3 border-b border-slate-800 space-y-2.5 flex-shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Search by Code (PI-2026-0412), Buyer Name, Seller, Amount, Date, or Creator..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-medium"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {[
                  { id: 'ALL', label: `All (${savedQuotes.length})` },
                  { id: 'QUOTATIONS', label: `Quotations (${savedQuotes.filter(q => !q.docType.includes('INVOICE')).length})` },
                  { id: 'INVOICES', label: `Invoices (${savedQuotes.filter(q => q.docType.includes('INVOICE')).length})` },
                  { id: 'SHARED_LEADS', label: `Shared to Leads (${savedQuotes.filter(q => Boolean(q.sentToLead)).length})` },
                  { id: 'DRAFT', label: `Drafts (${savedQuotes.filter(q => q.status === 'DRAFT').length})` },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setStatusFilter(filter.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                      statusFilter === filter.id
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quote Records List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {savedQuotes
                .filter(record => {
                  if (statusFilter === 'DRAFT' && record.status !== 'DRAFT') return false;
                  if (statusFilter === 'GENERATED_SENT' && (record.status !== 'GENERATED_SENT' && record.status !== 'SENT')) return false;
                  if (statusFilter === 'QUOTATIONS' && record.docType.includes('INVOICE')) return false;
                  if (statusFilter === 'INVOICES' && !record.docType.includes('INVOICE')) return false;
                  if (statusFilter === 'SHARED_LEADS' && !record.sentToLead) return false;

                  if (!historySearch.trim()) return true;
                  const term = historySearch.toLowerCase().trim();
                  const totalStr = record.totalAmount.toString();
                  const totalFormatted = `₹${record.totalAmount.toLocaleString('en-IN')}`;

                  return (
                    record.docNo.toLowerCase().includes(term) ||
                    record.partyName.toLowerCase().includes(term) ||
                    record.companyName.toLowerCase().includes(term) ||
                    record.savedAt.toLowerCase().includes(term) ||
                    (record.payload.docDate && record.payload.docDate.toLowerCase().includes(term)) ||
                    totalStr.includes(term) ||
                    totalFormatted.toLowerCase().includes(term) ||
                    (record.createdByName && record.createdByName.toLowerCase().includes(term)) ||
                    (record.createdByRole && record.createdByRole.toLowerCase().includes(term)) ||
                    (record.sentToLead && record.sentToLead.toLowerCase().includes(term))
                  );
                })
                .map(record => {
                  const isSent = record.status === 'GENERATED_SENT' || record.status === 'SENT';
                  return (
                    <div key={record.id} className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all space-y-3">
                      {/* Top Row: Doc No, Doc Type, Status Badge, Amount */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-black text-indigo-400">{record.docNo}</span>
                            <span className="text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                              {record.docType.replace('_', ' ')}
                            </span>
                            <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded ${
                              isSent ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {isSent ? 'GENERATED & SENT' : 'DRAFT'}
                            </span>
                            {record.pdfUrl && (
                              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <CloudUpload size={10} /> Firebase Synced
                              </span>
                            )}
                          </div>

                          {/* 👤 BUYER & 🏢 SELLER DISPLAY */}
                          <div className="text-xs space-y-0.5 pt-1">
                            <p className="text-[11.5px] font-bold text-slate-300 flex items-center gap-1.5 flex-wrap">
                              <span className="text-emerald-400 font-extrabold flex-shrink-0">👤 Buyer (Client):</span>
                              <strong className="text-white font-extrabold truncate">{record.partyName}</strong>
                            </p>
                            <p className="text-[10.5px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                              <span className="text-indigo-400 font-bold flex-shrink-0">🏢 Seller (Company):</span>
                              <span className="text-slate-300 font-semibold truncate">{record.companyName}</span>
                            </p>
                          </div>

                          {/* 👤 SHARED TO LEAD BADGE (HIGHLIGHTED FOR INVOICES & QUOTATIONS) */}
                          {record.sentToLead && (
                            <div className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border mt-1.5 ${
                              record.docType.includes('INVOICE')
                                ? 'bg-sky-500/15 border-sky-500/40 text-sky-200 shadow-sm'
                                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 shadow-sm'
                            }`}>
                              <span>{record.docType.includes('INVOICE') ? '🧾 Invoice Shared to Lead:' : '📄 Quotation Shared to Lead:'}</span>
                              <strong className="text-white font-black">{record.sentToLead}</strong>
                              {record.sentVia && (
                                <span className="text-[10px] font-semibold text-slate-300 ml-1">
                                  ({record.sentVia === 'EMAIL' ? '📧 Email' : record.sentVia === 'WHATSAPP_DIRECT' ? '💬 WhatsApp Direct' : '💬 WhatsApp'})
                                </span>
                              )}
                            </div>
                          )}

                          {/* 📧 / 💬 SENT VIA CHANNEL BADGE */}
                          {isSent && !record.sentToLead && (
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-300 mt-1">
                              {record.sentVia === 'EMAIL' ? (
                                <><span>📧</span> Sent via Email</>
                              ) : record.sentVia === 'WHATSAPP_DIRECT' ? (
                                <><span>💬</span> Sent via WhatsApp Direct</>
                              ) : (
                                <><span>☁️</span> Sent via WhatsApp Cloud</>
                              )}
                            </div>
                          )}

                          <p className="text-[10.5px] text-slate-400 flex items-center gap-1 pt-0.5">
                            <Clock size={11} className="text-slate-500" /> Saved on: <strong className="text-slate-300">{record.savedAt}</strong>
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black font-mono text-emerald-400">₹{record.totalAmount.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-slate-500">{record.itemsCount} Line Items</p>
                        </div>
                      </div>

                      {/* Generated By Creator & Quick Sharing Action Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-slate-900">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-black text-indigo-400 flex-shrink-0">
                            {record.createdByName ? record.createdByName.charAt(0) : 'A'}
                          </div>
                          <div className="text-[11px] truncate flex items-center gap-1">
                            <span className="text-slate-500">Generated by:</span>
                            <strong className="text-indigo-300 font-bold">{record.createdByName || 'Aditya Kumar Rai'}</strong>
                            {record.createdByRole && (
                              <span className="text-[9.5px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded">
                                {record.createdByRole}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Direct Channel Send & Load Controls */}
                        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto mt-1 sm:mt-0">
                          <button
                            type="button"
                            onClick={() => handleOpenOrDownloadPdf(record, 'VIEW')}
                            className="px-2 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                            title="Open official vector PDF in browser viewer"
                          >
                            <FileText size={12} /> View PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenOrDownloadPdf(record, 'DOWNLOAD')}
                            className="px-2 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                            title="Download vector PDF file"
                          >
                            <Download size={12} /> PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDirectSendQuote(record, 'EMAIL')}
                            className="px-2 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                            title="Send Quote via Email"
                          >
                            <Mail size={12} /> Email
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDirectSendQuote(record, 'WHATSAPP_DIRECT')}
                            className="px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                            title="Send Quote via WhatsApp Direct"
                          >
                            <MessageSquare size={12} /> WhatsApp
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleLoadSavedQuote(record);
                              setHistoryDrawerOpen(false);
                            }}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 shadow cursor-pointer transition-all"
                            title="Load this quote or draft into editor"
                          >
                            <FolderOpen size={12} /> {record.status === 'DRAFT' ? 'Edit Draft' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              setSavedQuotes(prev => prev.filter(q => q.id !== record.id));
                              try {
                                const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
                                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                                await fetch(`${apiBase}/quotations/${record.id}`, {
                                  method: 'DELETE',
                                  headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                                });
                              } catch (_) {}
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                            title="Delete Quote Record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* 📱 SMARTPHONE STICKY BOTTOM APP BAR (Floating 1-Thumb Quick Access) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] print-hide">
        {/* Total & Item Count Info */}
        <div className="flex flex-col min-w-0 pr-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            Total ({items.length} item{items.length === 1 ? '' : 's'})
          </span>
          <span className="text-sm font-black text-emerald-400 tracking-tight truncate">
            ₹{grandTotal.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Action Buttons Strip */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* View Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (mobileActiveTab === 'BUILDER') {
                setViewMode('SPLIT');
                setMobileActiveTab('PREVIEW');
                setZoomScale(calculateFitScale());
              } else {
                setViewMode('SPLIT');
                setMobileActiveTab('BUILDER');
              }
            }}
            className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
            title={mobileActiveTab === 'BUILDER' ? 'Switch to A4 Live Sheet' : 'Switch to Form Inputs'}
          >
            {mobileActiveTab === 'BUILDER' ? (
              <>
                <Eye size={13} className="text-indigo-400" />
                <span>Sheet</span>
              </>
            ) : (
              <>
                <Sliders size={13} className="text-violet-400" />
                <span>Form</span>
              </>
            )}
          </button>

          {/* Quick Save Draft */}
          <button
            type="button"
            onClick={handleSaveCurrentDraft}
            className={`p-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
              savedSuccess
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Quick Save Draft"
          >
            {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <RefreshCw size={14} />}
          </button>

          {/* Primary Save & Sync (Firebase) Button */}
          <button
            type="button"
            onClick={() => handleSaveToFirebase()}
            disabled={isSavingFirebase}
            className={`py-1.5 px-3 rounded-xl text-xs font-black text-white shadow-lg flex items-center gap-1.5 transition-all active:scale-95 border ${
              firebaseSaveSuccess
                ? 'bg-emerald-600 border-emerald-400'
                : isSavingFirebase
                ? 'bg-indigo-900/70 border-indigo-500/40 text-indigo-200 cursor-wait'
                : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 border-sky-400/30 shadow-indigo-600/30'
            }`}
            title="Save & Sync to Firebase Cloud Vault"
          >
            {isSavingFirebase ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : firebaseSaveSuccess ? (
              <Check size={13} />
            ) : (
              <CloudUpload size={13} />
            )}
            <span>{isSavingFirebase ? 'Syncing...' : firebaseSaveSuccess ? 'Synced!' : 'Save & Sync'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
