import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, Linking, Modal, Image, Dimensions, Switch, SafeAreaView,
  StatusBar, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
export type DocumentType = 'QUOTATION' | 'PROFORMA_INVOICE' | 'TAX_INVOICE' | 'PAYMENT_RECEIPT' | 'CREDIT_NOTE' | 'DELIVERY_CHALLAN';
export type SectionId = 'HEADER' | 'PARTY_INFO' | 'ITEMS_TABLE' | 'SUMMARY_AND_BANK' | 'FOOTER_TERMS';
export type GstType = 'CGST_SGST' | 'IGST' | 'CGST_UTGST' | 'EXEMPT';

export interface CompanyDetails {
  id: string; name: string; logoUrl: string; address: string;
  email: string; phone: string; gstNo: string; panNo: string;
  bankName: string; accountNo: string; ifscCode: string; branch: string; upiId: string;
}
export interface PartyDetails {
  id: string; name: string; contactPerson?: string; email: string;
  phone: string; address: string; shippingAddress?: string; gstNo: string; panNo: string;
}
export interface CustomColumn { id: string; name: string; }
export interface LineItem {
  id: string; productName: string; description?: string; showDescription: boolean;
  hsnCode?: string; customValues?: { [colId: string]: string }; imageUrl?: string;
  showImage: boolean; unit: string; qty: number; unitPrice: number;
  taxRate: number; discountType: 'flat' | 'percent'; discountVal: number; total: number;
}
export interface SavedQuoteRecord {
  id: string; docNo: string; docType: DocumentType; partyName: string;
  companyName: string; savedAt: string; totalAmount: number;
  status: 'DRAFT' | 'GENERATED_SENT' | 'SENT';
  sentVia?: 'EMAIL' | 'WHATSAPP_DIRECT' | 'WHATSAPP_CLOUD';
  sentToLead?: string; itemsCount: number; createdByName?: string; createdByRole?: string;
  payload?: {
    items: LineItem[]; customColumns: CustomColumn[]; sectionOrder: SectionId[];
    sectionGap: number; pdfTopPadding: number; pdfBottomPadding: number;
    globalGstRate: number; gstType: GstType; docDate: string; validUntilDate: string;
  };
}

const SECTION_META: { id: SectionId; label: string; desc: string }[] = [
  { id: 'HEADER', label: 'Header & Company Details', desc: 'Logo, Address, GSTIN, Title, Date & Doc #' },
  { id: 'PARTY_INFO', label: 'Buyer & Shipping Addresses', desc: 'Billed To, Shipped To Consignee, Tax Identifiers' },
  { id: 'ITEMS_TABLE', label: 'Line Items Table', desc: 'Product List, HSN Codes, Quantities, Rates & Tax' },
  { id: 'SUMMARY_AND_BANK', label: 'Bank Details & Financial Totals', desc: 'Bank A/C, Amount in Words, Tax & Grand Total' },
  { id: 'FOOTER_TERMS', label: 'Terms & Signatory Footer', desc: 'Terms & Conditions, E.&O.E., Authorized Signature' },
];

const CATALOG_PRODUCTS = [
  { name: 'Executive Work Station', price: 22500, tax: 18, unit: 'Nos', hsn: '998313', desc: 'Ergonomic Modular Desk System with Cable Management & Powder Coated Steel Frame', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=200&auto=format&fit=crop&q=60' },
  { name: 'DAS CRM Enterprise License (50 Seats)', price: 500000, tax: 18, unit: 'Set', hsn: '998314', desc: 'Annual Enterprise SaaS License with WhatsApp Cloud & AI Lead Scoring Engine', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&auto=format&fit=crop&q=60' },
  { name: 'AI Lead Scoring Engine Pro', price: 120000, tax: 18, unit: 'License', hsn: '998315', desc: 'Custom ML Lead Qualification & Predictive Analytics Module', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&auto=format&fit=crop&q=60' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const numberToWordsINR = (amount: number): string => {
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
  return `Rupees ${inWords(Math.round(amount))} Only`;
};

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const fmtDate = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};
const fmtTime = () => {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_COMPANIES: CompanyDetails[] = [
  { id:'comp-1', name:'Aarna Construction & Interiors', logoUrl:'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=200&auto=format&fit=crop&q=60', address:'Plot1, Ats-kasnaroad, Bindalenclave, Greater Noida, Uttar Pradesh, 201310', email:'info@aarnaconstructions.com', phone:'+91 98102 34567', gstNo:'09APMPL1329Q1Z8', panNo:'APML1329Q', bankName:'Punjab National Bank', accountNo:'6198002100003189', ifscCode:'PUNB0619800', branch:'DAV TIRAHA, Greater Noida', upiId:'aarna@pnb' },
  { id:'comp-2', name:'Spectro Tech India Pvt Ltd', logoUrl:'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60', address:'Plot No. 42, Sector 18, Cyber City, Gurugram, HR - 122002', email:'billing@spectrotech.in', phone:'+91 124 4567890', gstNo:'06AAAAC1234F1Z9', panNo:'AAAAC1234F', bankName:'HDFC Bank Ltd', accountNo:'50200044556677', ifscCode:'HDFC0000123', branch:'Cyber City', upiId:'spectro@hdfcbank' },
];
const INITIAL_PARTIES: PartyDetails[] = [
  { id:'party-1', name:'SPECTRO ANALYTICAL LABS PRIVATE LIMITED', contactPerson:'Site Procurement Manager', email:'info@spectro.in', phone:'+91 93194 95000', address:'S 1, SITE GNEPIP KASNA ROAD, SURAJPUR INDUSTRIAL AREA V Gautam Buddha Nagar 201310, GREATER NOIDA, Uttar Pradesh, 201310', shippingAddress:'Plot 4, Site V Industrial Park, Greater Noida, Uttar Pradesh - 201310', gstNo:'09APMPL1329Q1Z8', panNo:'APML1329Q' },
  { id:'party-2', name:'TechCorp Solutions Pvt Ltd', contactPerson:'Rajesh Varma', email:'rajesh@techcorp.com', phone:'+91 98765 43210', address:'Building 7, Mindspace IT Park, Madhapur, Hyderabad, TS - 500081', shippingAddress:'Warehouse 12, Mindspace Park, Hyderabad, TS - 500081', gstNo:'36AAACT9988K1ZP', panNo:'AAACT9988K' },
];

const INITIAL_SAVED_QUOTES: SavedQuoteRecord[] = [
  { id:'sq-1', docNo:'EST-2026-0891', docType:'QUOTATION', partyName:'SPECTRO ANALYTICAL LABS PRIVATE LIMITED', companyName:'Aarna Construction & Interiors', savedAt:'29/08/2026, 07:45 PM', totalAmount:238950, status:'GENERATED_SENT', sentVia:'EMAIL', sentToLead:'billing@spectroanalytical.com', itemsCount:1, createdByName:'Aditya Kumar Rai', createdByRole:'Tenant Admin', payload:{ items:[{ id:'item-1', productName:'Executive Work Station', description:'Ergonomic Modular Desk System', showDescription:true, hsnCode:'998313', customValues:{ 'col-1':'Aarna Modular', 'col-2':'1 Year Full Warranty' }, showImage:false, unit:'Nos', qty:9, unitPrice:22500, taxRate:18, discountType:'flat', discountVal:0, total:202500 }], customColumns:[{ id:'col-1', name:'Make / Brand' },{ id:'col-2', name:'Warranty Period' }], sectionOrder:['HEADER','PARTY_INFO','ITEMS_TABLE','SUMMARY_AND_BANK','FOOTER_TERMS'], sectionGap:10, pdfTopPadding:32, pdfBottomPadding:28, globalGstRate:18, gstType:'CGST_SGST', docDate:'13/01/2026', validUntilDate:'31/01/2026' } },
  { id:'sq-2', docNo:'PI-2026-0412', docType:'PROFORMA_INVOICE', partyName:'INFOSYS ENTERPRISE SOLUTIONS', companyName:'Aarna Construction & Interiors', savedAt:'29/08/2026, 06:15 PM', totalAmount:540000, status:'GENERATED_SENT', sentVia:'WHATSAPP_DIRECT', sentToLead:'+91 9810234567', itemsCount:2, createdByName:'Priya Sharma', createdByRole:'Sales Manager' },
  { id:'sq-3', docNo:'EST-2026-0892', docType:'QUOTATION', partyName:'TATA CONSULTANCY SERVICES', companyName:'Aarna Construction & Interiors', savedAt:'28/08/2026, 03:20 PM', totalAmount:185000, status:'DRAFT', itemsCount:1, createdByName:'Rajesh Kumar', createdByRole:'Sales Executive' },
];

// ─── Screen Component ──────────────────────────────────────────────────────────
interface QuotationsInvoicesScreenProps { onClose?: () => void; }

export const QuotationsInvoicesScreen: React.FC<QuotationsInvoicesScreenProps> = ({ onClose }) => {
  const [viewMode, setViewMode] = useState<'BUILDER' | 'LIVE_PREVIEW'>('BUILDER');
  const [docType, setDocType] = useState<DocumentType>('QUOTATION');
  const [docNo, setDocNo] = useState('EST-2026-0891');
  const [docDate, setDocDate] = useState(fmtDate());
  const [validUntilDate, setValidUntilDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 18);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  });
  const [showValidUntil, setShowValidUntil] = useState(true);

  // Company & Party
  const [companies, setCompanies] = useState<CompanyDetails[]>(INITIAL_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState(INITIAL_COMPANIES[0].id);
  const [parties, setParties] = useState<PartyDetails[]>(INITIAL_PARTIES);
  const [selectedPartyId, setSelectedPartyId] = useState(INITIAL_PARTIES[0].id);
  const [useSeparateShipping, setUseSeparateShipping] = useState(false);
  const [customShippingAddress, setCustomShippingAddress] = useState('Plot 4, Site V Industrial Park, Greater Noida, Uttar Pradesh - 201310');

  // Line Items
  const [items, setItems] = useState<LineItem[]>([{
    id:'item-1', productName:'Executive Work Station', description:'Ergonomic Modular Desk System with Cable Management & Powder Coated Steel Frame',
    showDescription:true, hsnCode:'998313', customValues:{ 'col-1':'Aarna Modular', 'col-2':'1 Year Full Warranty' },
    imageUrl:'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=200&auto=format&fit=crop&q=60',
    showImage:false, unit:'Nos', qty:9, unitPrice:22500, taxRate:18, discountType:'flat', discountVal:0, total:202500,
  }]);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([
    { id:'col-1', name:'Make / Brand' }, { id:'col-2', name:'Warranty Period' },
  ]);

  // GST & Tax
  const [globalGstRate, setGlobalGstRate] = useState(18);
  const [gstType, setGstType] = useState<GstType>('CGST_SGST');
  const [showGstColumn, setShowGstColumn] = useState(true);
  const [showHsnColumn, setShowHsnColumn] = useState(true);
  const [overallDiscountType, setOverallDiscountType] = useState<'flat'|'percent'>('flat');
  const [overallDiscountVal, setOverallDiscountVal] = useState(0);
  const [termsText, setTermsText] = useState('1. All disputes are subject to Greater Noida jurisdiction only.\n2. Payment must be cleared within 2-3 days of bill submission.');

  // Layout Controls
  const [sectionGap, setSectionGap] = useState(10);
  const [pdfTopPadding, setPdfTopPadding] = useState(32);
  const [pdfBottomPadding, setPdfBottomPadding] = useState(28);
  const [pdfMargin, setPdfMargin] = useState(10);
  const [pdfPageMode, setPdfPageMode] = useState<'SINGLE'|'MULTI'>('SINGLE');
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(['HEADER','PARTY_INFO','ITEMS_TABLE','SUMMARY_AND_BANK','FOOTER_TERMS']);
  const [visibleSections, setVisibleSections] = useState<{[k in SectionId]: boolean}>({
    HEADER:true, PARTY_INFO:true, ITEMS_TABLE:true, SUMMARY_AND_BANK:true, FOOTER_TERMS:true,
  });

  // Accordion state
  const [openSections, setOpenSections] = useState<{[k:string]: boolean}>({
    gst:true, pdf:true, layout:true, company:true, party:true, metadata:true, items:true, terms:true,
  });

  // History & Drafts
  const [savedQuotes, setSavedQuotes] = useState<SavedQuoteRecord[]>(INITIAL_SAVED_QUOTES);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL'|'DRAFT'|'GENERATED_SENT'>('ALL');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modals
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [newComp, setNewComp] = useState<Partial<CompanyDetails>>({});
  const [newParty, setNewParty] = useState<Partial<PartyDetails>>({});

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const activeCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];
  const activeParty = parties.find(p => p.id === selectedPartyId) || parties[0];

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalItemDiscounts = items.reduce((s, i) => {
    const base = i.qty * i.unitPrice;
    return s + (i.discountType === 'percent' ? base * i.discountVal / 100 : i.discountVal);
  }, 0);
  const taxableBase = Math.max(0, subtotal - totalItemDiscounts);
  const overallDiscAmount = overallDiscountType === 'percent' ? taxableBase * overallDiscountVal / 100 : overallDiscountVal;
  const finalTaxable = Math.max(0, taxableBase - overallDiscAmount);
  const gstTaxTotal = items.reduce((s, i) => {
    const base = i.qty * i.unitPrice;
    const disc = i.discountType === 'percent' ? base * i.discountVal / 100 : i.discountVal;
    return s + Math.max(0, base - disc) * i.taxRate / 100;
  }, 0);
  const effectiveGstTaxTotal = (gstType === 'EXEMPT' || globalGstRate === 0) ? 0 : gstTaxTotal;
  const grandTotal = Math.round(finalTaxable + effectiveGstTaxTotal);

  const cgst = gstType === 'EXEMPT' || globalGstRate === 0 ? 0 : gstTaxTotal / 2;
  const sgst = cgst;
  const igst = effectiveGstTaxTotal;
  const utgst = cgst;

  const getDocTitle = () => {
    switch(docType) {
      case 'QUOTATION': return 'ESTIMATE / QUOTATION';
      case 'PROFORMA_INVOICE': return 'PROFORMA INVOICE';
      case 'TAX_INVOICE': return 'TAX INVOICE';
      case 'PAYMENT_RECEIPT': return 'OFFICIAL RECEIPT';
      case 'CREDIT_NOTE': return 'CREDIT NOTE';
      case 'DELIVERY_CHALLAN': return 'DELIVERY CHALLAN';
    }
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const toggleSection = (k: string) => setOpenSections(p => ({ ...p, [k]: !p[k] }));

  const handleConvertDoc = (type: DocumentType) => {
    setDocType(type);
    const prefix = type === 'QUOTATION' ? 'EST' : type === 'PROFORMA_INVOICE' ? 'PI' : type === 'TAX_INVOICE' ? 'INV' : type === 'PAYMENT_RECEIPT' ? 'REC' : type === 'CREDIT_NOTE' ? 'CN' : 'DC';
    setDocNo(`${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const updateLineItem = useCallback((id: string, patch: Partial<LineItem>) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, ...patch };
      const base = updated.qty * updated.unitPrice;
      const disc = updated.discountType === 'percent' ? base * updated.discountVal / 100 : updated.discountVal;
      updated.total = Math.max(0, base - disc);
      return updated;
    }));
  }, []);

  const handleApplyGlobalGst = (rate: number) => {
    setGlobalGstRate(rate);
    setItems(prev => prev.map(it => {
      const updated = { ...it, taxRate: rate };
      const base = updated.qty * updated.unitPrice;
      const disc = updated.discountType === 'percent' ? base * updated.discountVal / 100 : updated.discountVal;
      updated.total = Math.max(0, base - disc);
      return updated;
    }));
    if (rate === 0) setGstType('EXEMPT');
    else if (gstType === 'EXEMPT') setGstType('CGST_SGST');
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`, productName:'New Line Item', description:'High quality industrial grade specification item',
      showDescription:true, hsnCode:'998313', showImage:false, unit:'Nos', qty:1, unitPrice:10000,
      taxRate:globalGstRate, discountType:'flat', discountVal:0, total:10000,
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeLineItem = (id: string) => {
    if (items.length <= 1) { Alert.alert('Notice', 'At least 1 line item is required.'); return; }
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handlePickImage = async (onSuccess: (uri: string) => void) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission Denied', 'Gallery access required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes:['images'], allowsEditing:true, quality:0.8, base64:true });
    if (!result.canceled && result.assets[0]) {
      onSuccess(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : result.assets[0].uri);
    }
  };

  const addCustomColumn = () => setCustomColumns(prev => [...prev, { id:`col-${Date.now()}`, name:`Column ${prev.length + 1}` }]);
  const updateCustomColumnName = (id: string, name: string) => setCustomColumns(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  const removeCustomColumn = (id: string) => setCustomColumns(prev => prev.filter(c => c.id !== id));

  const moveSectionUp = (id: SectionId) => {
    const idx = sectionOrder.indexOf(id);
    if (idx <= 0) return;
    const newOrder = [...sectionOrder];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    setSectionOrder(newOrder);
  };
  const moveSectionDown = (id: SectionId) => {
    const idx = sectionOrder.indexOf(id);
    if (idx === -1 || idx >= sectionOrder.length - 1) return;
    const newOrder = [...sectionOrder];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    setSectionOrder(newOrder);
  };
  const toggleSectionVisibility = (id: SectionId) => setVisibleSections(p => ({ ...p, [id]: !p[id] }));
  const resetSectionLayout = () => {
    setSectionGap(10); setPdfTopPadding(32); setPdfBottomPadding(28);
    setSectionOrder(['HEADER','PARTY_INFO','ITEMS_TABLE','SUMMARY_AND_BANK','FOOTER_TERMS']);
    setVisibleSections({ HEADER:true, PARTY_INFO:true, ITEMS_TABLE:true, SUMMARY_AND_BANK:true, FOOTER_TERMS:true });
  };

  const handleSaveCurrentDraft = () => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}, ${fmtTime()}`;
    const newRecord: SavedQuoteRecord = {
      id:`sq-${Date.now()}`, docNo, docType, partyName:activeParty.name, companyName:activeCompany.name,
      savedAt:formattedDate, totalAmount:grandTotal, status:'DRAFT', itemsCount:items.length,
      createdByName:'Aditya Kumar Rai', createdByRole:'Tenant Admin',
      payload: {
        items: JSON.parse(JSON.stringify(items)),
        customColumns: JSON.parse(JSON.stringify(customColumns)),
        sectionOrder:[...sectionOrder], sectionGap, pdfTopPadding, pdfBottomPadding,
        globalGstRate, gstType, docDate, validUntilDate,
      },
    };
    setSavedQuotes(prev => [newRecord, ...prev]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLoadSavedQuote = (record: SavedQuoteRecord) => {
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
    }
    setHistoryModalOpen(false);
    setViewMode('BUILDER');
  };

  const handleDirectSendQuote = (record: SavedQuoteRecord, channel: 'EMAIL'|'WHATSAPP_DIRECT'|'WHATSAPP_CLOUD') => {
    if (channel === 'WHATSAPP_CLOUD') { Alert.alert('Coming Soon', 'WhatsApp Cloud API integration is on the roadmap.'); return; }
    const leadContact = record.sentToLead || activeParty?.email || activeParty?.phone || '';
    setSavedQuotes(prev => prev.map(q => q.id === record.id ? { ...q, status:'GENERATED_SENT', sentVia:channel, sentToLead:leadContact } : q));
    if (channel === 'EMAIL') {
      const subject = encodeURIComponent(`${record.docType.replace('_',' ')} #${record.docNo} from ${record.companyName}`);
      const body = encodeURIComponent(`Dear ${record.partyName},\n\nPlease find attached the ${record.docType.replace('_',' ')} #${record.docNo} for total amount ₹${record.totalAmount.toLocaleString()}.\n\nDocument Details:\n- Doc #: ${record.docNo}\n- Total: ₹${record.totalAmount.toLocaleString()}\n- Issuer: ${record.companyName}\n\nGenerated via DAS CRM (www.dascrm.com)\n\nBest regards,\n${record.createdByName || 'Sales Team'}`);
      Linking.openURL(`mailto:${leadContact}?subject=${subject}&body=${body}`);
    } else if (channel === 'WHATSAPP_DIRECT') {
      const cleanPhone = String(leadContact).replace(/\D/g, '');
      const text = encodeURIComponent(`Hello *${record.partyName}*,\n\nHere is your official *${record.docType.replace('_',' ')} #${record.docNo}* from *${record.companyName}*.\n\nTotal Amount: *₹${record.totalAmount.toLocaleString()}*\n\nGenerated with DAS CRM — www.dascrm.com`);
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${text}`);
    }
  };

  const handleSaveCompanyModal = () => {
    if (!newComp.name?.trim()) { Alert.alert('Required', 'Company Name is required.'); return; }
    if (!newComp.email?.trim()) { Alert.alert('Required', 'Company Email is required.'); return; }
    if (!newComp.phone?.trim()) { Alert.alert('Required', 'Company Phone is required.'); return; }
    const comp: CompanyDetails = { id:`comp-${Date.now()}`, name:newComp.name.trim(), logoUrl:newComp.logoUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=200&auto=format&fit=crop&q=60', address:newComp.address || 'Address', email:newComp.email.trim(), phone:newComp.phone.trim(), gstNo:newComp.gstNo || 'GSTIN', panNo:newComp.panNo || 'PAN', bankName:newComp.bankName || 'Bank', accountNo:newComp.accountNo || 'A/C', ifscCode:newComp.ifscCode || 'IFSC', branch:newComp.branch || 'Branch', upiId:newComp.upiId || 'upi@bank' };
    setCompanies(prev => [comp, ...prev]);
    setSelectedCompanyId(comp.id);
    setCompanyModalOpen(false);
    setNewComp({});
  };

  const handleSavePartyModal = () => {
    if (!newParty.name?.trim()) { Alert.alert('Required', 'Party Name is required.'); return; }
    if (!newParty.email?.trim()) { Alert.alert('Required', 'Party Email is required.'); return; }
    if (!newParty.phone?.trim()) { Alert.alert('Required', 'Party Phone is required.'); return; }
    const party: PartyDetails = { id:`party-${Date.now()}`, name:newParty.name.trim(), contactPerson:newParty.contactPerson, email:newParty.email.trim(), phone:newParty.phone.trim(), address:newParty.address || 'Address', shippingAddress:newParty.shippingAddress, gstNo:newParty.gstNo || 'GSTIN', panNo:newParty.panNo || 'PAN' };
    setParties(prev => [party, ...prev]);
    setSelectedPartyId(party.id);
    setPartyModalOpen(false);
    setNewParty({});
  };

  const filteredQuotes = savedQuotes.filter(q => {
    const qry = historySearch.toLowerCase();
    const matchSearch = !qry || q.docNo.toLowerCase().includes(qry) || q.partyName.toLowerCase().includes(qry) || q.companyName.toLowerCase().includes(qry) || String(q.totalAmount).includes(qry) || (q.createdByName?.toLowerCase().includes(qry));
    const matchStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ─── Accordion Section Helper ───────────────────────────────────────────────
  const AccordionHeader = ({ label, color, sectionKey, badge }: { label: string; color: string; sectionKey: string; badge?: string }) => (
    <TouchableOpacity onPress={() => toggleSection(sectionKey)} activeOpacity={0.7} style={styles.accHeader}>
      <Text style={[styles.accHeaderText, { color }]}>{label}</Text>
      <View style={styles.accHeaderRight}>
        {badge && <View style={[styles.accBadge, { backgroundColor:`${color}20`, borderColor:`${color}50` }]}><Text style={[styles.accBadgeText, { color }]}>{badge}</Text></View>}
        <Text style={styles.accChevron}>{openSections[sectionKey] ? '▲' : '▼'}</Text>
      </View>
    </TouchableOpacity>
  );

  // ─── A4 Preview ─────────────────────────────────────────────────────────────
  const renderA4Preview = () => {
    const bodySections = sectionOrder.filter(secId => secId !== 'FOOTER_TERMS' && visibleSections[secId]);
    const showFooter = visibleSections['FOOTER_TERMS'];

    return (
      <View style={[styles.a4Paper, { paddingTop: pdfTopPadding, paddingBottom: pdfBottomPadding + 28, paddingHorizontal: pdfMargin }]}>
        {/* Navy Brand Bar */}
        <View style={styles.a4NavyBar} />

        {/* HEADER */}
        {bodySections.includes('HEADER') && visibleSections['HEADER'] && (
          <View style={[styles.a4Section, { marginBottom: sectionGap }]}>
            <View style={styles.a4HeaderRow}>
              <View style={styles.a4HeaderLeft}>
                {activeCompany.logoUrl ? (
                  <Image source={{ uri: activeCompany.logoUrl }} style={styles.a4Logo} />
                ) : (
                  <View style={styles.a4LogoFallback}><Text style={styles.a4LogoFallbackText}>{activeCompany.name.slice(0,2).toUpperCase()}</Text></View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.a4CompName}>{activeCompany.name}</Text>
                  <Text style={styles.a4CompSub}>{activeCompany.address}</Text>
                  <Text style={styles.a4CompTax}>GSTIN: {activeCompany.gstNo} • PAN: {activeCompany.panNo}</Text>
                  {activeCompany.email ? <Text style={styles.a4CompSub}>Email: {activeCompany.email}</Text> : null}
                </View>
              </View>
              <View style={styles.a4HeaderRight}>
                <View style={styles.a4Badge}><Text style={styles.a4BadgeText}>{getDocTitle()}</Text></View>
                <Text style={styles.a4DocNo}>{docNo}</Text>
                <Text style={styles.a4DateText}>Date: {docDate}</Text>
                {showValidUntil && validUntilDate ? <Text style={styles.a4DateText}>Valid Until: {validUntilDate}</Text> : null}
              </View>
            </View>
          </View>
        )}

        {/* PARTY_INFO */}
        {bodySections.includes('PARTY_INFO') && visibleSections['PARTY_INFO'] && (
          <View style={[styles.a4Section, { marginBottom: sectionGap }]}>
            <View style={styles.a4PartyGrid}>
              <View style={styles.a4PartyBilling}>
                <Text style={styles.a4PartyLabel}>Billed To (Buyer)</Text>
                <Text style={styles.a4PartyName}>{activeParty.name}</Text>
                {activeParty.contactPerson ? <Text style={styles.a4PartySub}>Attn: {activeParty.contactPerson}</Text> : null}
                <Text style={styles.a4PartySub}>{activeParty.address}</Text>
              </View>
              {useSeparateShipping && (
                <View style={styles.a4PartyShipping}>
                  <Text style={styles.a4PartyLabelBlue}>🚚 Shipped To (Consignee)</Text>
                  <Text style={styles.a4PartyName}>{activeParty.name}</Text>
                  <Text style={styles.a4PartySub}>{customShippingAddress || activeParty.shippingAddress || activeParty.address}</Text>
                </View>
              )}
              <View style={styles.a4PartyRight}>
                <Text style={styles.a4PartyLabel}>Tax & Identifiers</Text>
                <Text style={styles.a4PartySub}>GSTIN: <Text style={styles.a4PartyValue}>{activeParty.gstNo}</Text></Text>
                <Text style={styles.a4PartySub}>PAN: <Text style={styles.a4PartyValue}>{activeParty.panNo}</Text></Text>
                <Text style={styles.a4PartySub}>📞 {activeParty.phone}</Text>
                <Text style={styles.a4PartySub}>Place of Supply: <Text style={{ fontWeight:'800', color:'#0f172a' }}>Uttar Pradesh</Text></Text>
              </View>
            </View>
          </View>
        )}

        {/* ITEMS_TABLE */}
        {bodySections.includes('ITEMS_TABLE') && visibleSections['ITEMS_TABLE'] && (
          <View style={[styles.a4Section, { marginBottom: sectionGap }]}>
            <View style={styles.a4Table}>
              {/* Table Header */}
              <View style={styles.a4TableHeader}>
                <Text style={[styles.a4Th, { width:22 }]}>#</Text>
                <Text style={[styles.a4Th, { flex:1 }]}>Item & Description</Text>
                {showHsnColumn && <Text style={[styles.a4Th, { width:45, textAlign:'center' }]}>HSN/SAC</Text>}
                {customColumns.map(col => (
                  <Text key={col.id} style={[styles.a4Th, { width:55, textAlign:'center' }]}>{col.name}</Text>
                ))}
                <Text style={[styles.a4Th, { width:30, textAlign:'center' }]}>Qty</Text>
                <Text style={[styles.a4Th, { width:65, textAlign:'right' }]}>Rate (₹)</Text>
                {showGstColumn && <Text style={[styles.a4Th, { width:40, textAlign:'center' }]}>GST %</Text>}
                <Text style={[styles.a4Th, { width:70, textAlign:'right' }]}>Amount (₹)</Text>
              </View>
              {/* Table Rows */}
              {items.map((it, idx) => {
                const baseRowTotal = it.qty * it.unitPrice;
                const rowTax = baseRowTotal * it.taxRate / 100;
                const displayedRowTotal = showGstColumn ? Math.round(baseRowTotal + rowTax) : baseRowTotal;
                return (
                  <View key={it.id} style={[styles.a4TableRow, idx % 2 === 1 && { backgroundColor:'#f8fafc' }]}>
                    <Text style={[styles.a4TdNum, { width:22 }]}>{idx + 1}</Text>
                    <View style={{ flex:1 }}>
                      <View style={{ flexDirection:'row', alignItems:'flex-start', gap:4 }}>
                        {it.showImage && it.imageUrl ? <Image source={{ uri: it.imageUrl }} style={{ width:20, height:20, borderRadius:2, marginTop:1 }} /> : null}
                        <View style={{ flex:1 }}>
                          <Text style={styles.a4TdName}>{it.productName}</Text>
                          {it.showDescription && it.description ? <Text style={styles.a4TdDesc}>{it.description}</Text> : null}
                        </View>
                      </View>
                    </View>
                    {showHsnColumn && <Text style={[styles.a4TdMono, { width:45, textAlign:'center' }]}>{it.hsnCode || '998313'}</Text>}
                    {customColumns.map(col => (
                      <Text key={col.id} style={[styles.a4Td, { width:55, textAlign:'center' }]}>{it.customValues?.[col.id] || '—'}</Text>
                    ))}
                    <Text style={[styles.a4Td, { width:30, textAlign:'center' }]}>{it.qty} {it.unit}</Text>
                    <Text style={[styles.a4TdBold, { width:65, textAlign:'right' }]}>₹{it.unitPrice.toLocaleString('en-IN')}</Text>
                    {showGstColumn && <Text style={[styles.a4TdGst, { width:40, textAlign:'center' }]}>{it.taxRate}%</Text>}
                    <Text style={[styles.a4TdBold, { width:70, textAlign:'right' }]}>₹{displayedRowTotal.toLocaleString('en-IN')}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* SUMMARY_AND_BANK */}
        {bodySections.includes('SUMMARY_AND_BANK') && visibleSections['SUMMARY_AND_BANK'] && (
          <View style={[styles.a4Section, { marginBottom: sectionGap }]}>
            <View style={styles.a4SummaryGrid}>
              {/* Bank & Amount in Words */}
              <View style={{ flex:1, gap:6 }}>
                <View style={styles.a4BankBox}>
                  <Text style={styles.a4BoxLabel}>Bank Payment Details</Text>
                  <Text style={styles.a4BankText}>Bank: {activeCompany.bankName}</Text>
                  <Text style={styles.a4BankAcc}>A/C No: {activeCompany.accountNo}</Text>
                  <Text style={styles.a4BankText}>IFSC: {activeCompany.ifscCode} • Branch: {activeCompany.branch}</Text>
                  <Text style={styles.a4BankUpi}>UPI ID: {activeCompany.upiId}</Text>
                </View>
                <View style={styles.a4AmountWordsBox}>
                  <Text style={styles.a4AmountWordsLabel}>Total Amount (in words)</Text>
                  <Text style={styles.a4AmountWords}>{numberToWordsINR(grandTotal)}</Text>
                </View>
              </View>

              {/* Totals Calculation */}
              <View style={styles.a4TotalsBox}>
                <View style={styles.a4SumRow}><Text style={styles.a4SumLbl}>Subtotal (Base Value):</Text><Text style={styles.a4SumVal}>{fmt(subtotal)}</Text></View>
                {totalItemDiscounts > 0 && <View style={styles.a4SumRow}><Text style={styles.a4SumLbl}>Item Discounts:</Text><Text style={styles.a4SumVal}>-{fmt(totalItemDiscounts)}</Text></View>}
                {overallDiscAmount > 0 && <View style={styles.a4SumRow}><Text style={styles.a4SumLbl}>Overall Discount:</Text><Text style={styles.a4SumVal}>-{fmt(overallDiscAmount)}</Text></View>}
                {gstType === 'EXEMPT' || globalGstRate === 0 ? (
                  <View style={styles.a4SumRow}><Text style={styles.a4SumLbl}>GST Tax Rate:</Text><Text style={{ color:'#059669', fontSize:8 }}>0% (Nil Rated / Exempt)</Text></View>
                ) : gstType === 'IGST' ? (
                  <View style={styles.a4SumRow}><Text style={styles.a4SumLbl}>IGST ({globalGstRate}%):</Text><Text style={styles.a4SumVal}>{fmt(igst)}</Text></View>
                ) : gstType === 'CGST_UTGST' ? (
                  <>
                    <View style={styles.a4SumRow}><Text style={styles.a4SumLbl}>CGST ({(globalGstRate/2).toFixed(1)}%):</Text><Text style={styles.a4SumVal}>{fmt(cgst)}</Text></View>
                    <View style={styles.a4SumRow}><Text style={styles.a4SumLbl}>UTGST ({(globalGstRate/2).toFixed(1)}%):</Text><Text style={styles.a4SumVal}>{fmt(utgst)}</Text></View>
                  </>
                ) : (
                  <>
                    <View style={styles.a4SumRow}><Text style={styles.a4SumLbl}>CGST ({(globalGstRate/2).toFixed(1)}%):</Text><Text style={styles.a4SumVal}>{fmt(cgst)}</Text></View>
                    <View style={styles.a4SumRow}><Text style={styles.a4SumLbl}>SGST ({(globalGstRate/2).toFixed(1)}%):</Text><Text style={styles.a4SumVal}>{fmt(sgst)}</Text></View>
                  </>
                )}
                <View style={[styles.a4SumRow, { borderTopWidth:1, borderTopColor:'#e2e8f0', paddingTop:2 }]}>
                  <Text style={styles.a4TaxTotalLbl}>Total Tax ({gstType === 'EXEMPT' || globalGstRate === 0 ? '0% Exempt' : `${globalGstRate}% ${gstType === 'IGST' ? 'IGST' : gstType === 'CGST_UTGST' ? 'CGST+UTGST' : 'CGST+SGST'}`}):</Text>
                  <Text style={styles.a4SumVal}>{fmt(gstType === 'EXEMPT' || globalGstRate === 0 ? 0 : gstTaxTotal)}</Text>
                </View>
                <View style={styles.a4GrandRow}>
                  <Text style={styles.a4GrandLbl}>Grand Total</Text>
                  <Text style={styles.a4GrandVal}>{fmt(grandTotal)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* FOOTER_TERMS */}
        {showFooter && visibleSections['FOOTER_TERMS'] && (
          <View style={[styles.a4Section, { marginTop: sectionGap * 1.5 }]}>
            <View style={styles.a4FooterRow}>
              <View style={{ flex:1 }}>
                <Text style={styles.a4BoxLabel}>Terms & Conditions</Text>
                <Text style={styles.a4TermsBody}>{termsText}</Text>
              </View>
              <View style={{ alignItems:'flex-end' }}>
                <Text style={styles.a4SignFor}>For {activeCompany.name}</Text>
                <View style={styles.a4SignLine}><Text style={styles.a4SignText}>Authorized Signatory</Text></View>
              </View>
            </View>
          </View>
        )}

        {/* Fixed Bottom Strip */}
        <View style={styles.a4FixedBottomStrip}>
          <Text style={styles.a4BottomText}>Generated by <Text style={{ fontWeight:'900', color:'#1e293b' }}>DAS CRM</Text></Text>
          <Text style={styles.a4BottomLink}>www.dascrm.com</Text>
        </View>
      </View>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>📝 {getDocTitle()} Generator</Text>
        <View style={{ flexDirection:'row', gap:6 }}>
          <TouchableOpacity style={styles.topActionBtn} onPress={() => setHistoryModalOpen(true)}>
            <Text style={styles.topActionBtnText}>📁 All ({savedQuotes.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Action Bar */}
      <View style={styles.topActionBar}>
        <View style={styles.topBarRow}>
          {/* View Mode Switch */}
          <View style={styles.viewModeSwitcher}>
            <TouchableOpacity style={[styles.vmTab, viewMode==='BUILDER' && styles.vmTabActive]} onPress={() => setViewMode('BUILDER')}>
              <Text style={[styles.vmTabText, viewMode==='BUILDER' && styles.vmTabTextActive]}>⚙️ Builder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.vmTab, viewMode==='LIVE_PREVIEW' && styles.vmTabActive]} onPress={() => setViewMode('LIVE_PREVIEW')}>
              <Text style={[styles.vmTabText, viewMode==='LIVE_PREVIEW' && styles.vmTabTextActive]}>📄 Preview</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.topBarActions}>
            <TouchableOpacity style={[styles.topBarBtn, savedSuccess && styles.topBarBtnSuccess]} onPress={handleSaveCurrentDraft}>
              <Text style={styles.topBarBtnText}>{savedSuccess ? '✓ Saved' : '💾 Save Draft'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.topBarBtnPrimary]} onPress={() => setHistoryModalOpen(true)}>
              <Text style={styles.topBarBtnTextPrimary}>📁 All ({savedQuotes.length})</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Convert Document Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:8 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
            <Text style={{ fontSize:9, fontWeight:'900', color:'#64748b', marginRight:2 }}>CONVERT:</Text>
            {(['QUOTATION','PROFORMA_INVOICE','TAX_INVOICE','PAYMENT_RECEIPT','CREDIT_NOTE'] as DocumentType[]).map(t => (
              <TouchableOpacity key={t} style={[styles.convertPill, docType===t && styles.convertPillActive]} onPress={() => handleConvertDoc(t)}>
                <Text style={[styles.convertPillText, docType===t && styles.convertPillTextActive]}>{t.replace('_',' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      {viewMode === 'BUILDER' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* ── 1. Company Selector ── */}
          <View style={[styles.accCard, openSections.company && styles.accCardOpen]}>
            <AccordionHeader label="🏢 1. Seller Company" color="#38bdf8" sectionKey="company" />
            {openSections.company && (
              <View style={styles.accBody}>
                <View style={styles.companyRow}>
                  <TouchableOpacity style={styles.addBtn} onPress={() => setCompanyModalOpen(true)}>
                    <Text style={styles.addBtnText}>+ Add Company</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:8 }}>
                  <View style={{ flexDirection:'row', gap:8 }}>
                    {companies.map(c => (
                      <TouchableOpacity key={c.id} style={[styles.selBox, selectedCompanyId===c.id && styles.selBoxActive]} onPress={() => setSelectedCompanyId(c.id)}>
                        <Text style={[styles.selBoxName, selectedCompanyId===c.id && { color:'#38bdf8' }]} numberOfLines={1}>{c.name}</Text>
                        <Text style={styles.selBoxSub}>GST: {c.gstNo}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {activeCompany && (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailName}>{activeCompany.name}</Text>
                    <Text style={styles.detailSub}>{activeCompany.address}</Text>
                    <Text style={styles.detailContact}>GSTIN: {activeCompany.gstNo} • PAN: {activeCompany.panNo}</Text>
                    <Text style={styles.detailContact}>Bank: {activeCompany.bankName} | A/C: {activeCompany.accountNo}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ── 2. Party Selector ── */}
          <View style={[styles.accCard, openSections.party && styles.accCardOpen]}>
            <AccordionHeader label="👤 2. Client Buyer Party" color="#34d399" sectionKey="party" />
            {openSections.party && (
              <View style={styles.accBody}>
                <View style={styles.companyRow}>
                  <TouchableOpacity style={[styles.addBtn, { backgroundColor:'rgba(52,211,153,0.15)', borderColor:'rgba(52,211,153,0.4)' }]} onPress={() => setPartyModalOpen(true)}>
                    <Text style={[styles.addBtnText, { color:'#34d399' }]}>+ Add Party</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:8 }}>
                  <View style={{ flexDirection:'row', gap:8 }}>
                    {parties.map(p => (
                      <TouchableOpacity key={p.id} style={[styles.selBox, selectedPartyId===p.id && { borderColor:'#34d399' }]} onPress={() => setSelectedPartyId(p.id)}>
                        <Text style={[styles.selBoxName, selectedPartyId===p.id && { color:'#34d399' }]} numberOfLines={1}>{p.name}</Text>
                        <Text style={styles.selBoxSub}>Attn: {p.contactPerson || 'Client'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {activeParty && (
                  <View style={[styles.detailCard, { borderColor:'rgba(52,211,153,0.3)', backgroundColor:'rgba(52,211,153,0.05)' }]}>
                    <Text style={styles.detailName}>{activeParty.name}</Text>
                    <Text style={styles.detailSub}>🏢 Billing: {activeParty.address}</Text>
                    <Text style={styles.detailContact}>GSTIN: {activeParty.gstNo} • PAN: {activeParty.panNo}</Text>
                  </View>
                )}
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleText}>🚚 Shipping Address is different from Billing</Text>
                  <Switch value={useSeparateShipping} onValueChange={setUseSeparateShipping} trackColor={{ false:'#1e293b', true:'#10b981' }} />
                </View>
                {useSeparateShipping && (
                  <TextInput style={[styles.inputField, { marginTop:8 }]} placeholder="Enter Consignee / Shipping Address..." placeholderTextColor="#64748b" value={customShippingAddress} onChangeText={setCustomShippingAddress} multiline />
                )}
              </View>
            )}
          </View>

          {/* ── 3. Document Metadata ── */}
          <View style={[styles.accCard, openSections.metadata && styles.accCardOpen]}>
            <AccordionHeader label="📅 3. Document Reference & Dates" color="#fbbf24" sectionKey="metadata" />
            {openSections.metadata && (
              <View style={styles.accBody}>
                <View style={{ flexDirection:'row', gap:8 }}>
                  <View style={{ flex:1 }}>
                    <Text style={styles.fieldLabel}>Doc Number</Text>
                    <TextInput style={styles.inputField} value={docNo} onChangeText={setDocNo} />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={styles.fieldLabel}>Doc Date</Text>
                    <TextInput style={styles.inputField} value={docDate} onChangeText={setDocDate} />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={styles.fieldLabel}>Valid Until</Text>
                    <TextInput style={[styles.inputField, !showValidUntil && { opacity:0.5 }]} value={validUntilDate} onChangeText={setValidUntilDate} editable={showValidUntil} placeholder="31/01/2026" placeholderTextColor="#64748b" />
                  </View>
                </View>
                <TouchableOpacity style={styles.toggleRow} onPress={() => setShowValidUntil(!showValidUntil)}>
                  <Text style={styles.toggleText}>Include "Valid Until" Expiry Date in Document</Text>
                  <Switch value={showValidUntil} onValueChange={setShowValidUntil} trackColor={{ false:'#1e293b', true:'#f59e0b' }} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── 4. Line Items ── */}
          <View style={[styles.accCard, openSections.items && styles.accCardOpen]}>
            <AccordionHeader label={`📦 4. Line Items (${items.length})`} color="#a78bfa" sectionKey="items" badge={`${items.length} items`} />
            {openSections.items && (
              <View style={styles.accBody}>
                {/* Custom Column Manager */}
                <View style={styles.customColManager}>
                  <Text style={styles.customColTitle}>🛠️ Custom Table Columns ({customColumns.length})</Text>
                  <TouchableOpacity style={styles.customColAddBtn} onPress={addCustomColumn}>
                    <Text style={styles.customColAddBtnText}>+ Add Column</Text>
                  </TouchableOpacity>
                </View>
                {customColumns.length > 0 && (
                  <View style={{ gap:6, marginBottom:10 }}>
                    {customColumns.map((col, cIdx) => (
                      <View key={col.id} style={styles.customColRow}>
                        <View style={styles.customColIdx}><Text style={styles.customColIdxText}>{cIdx + 1}</Text></View>
                        <TextInput style={[styles.inputField, { flex:1 }]} value={col.name} onChangeText={v => updateCustomColumnName(col.id, v)} placeholder="Column Heading..." placeholderTextColor="#64748b" />
                        <TouchableOpacity style={styles.customColDel} onPress={() => removeCustomColumn(col.id)}><Text style={styles.customColDelText}>✕</Text></TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {items.map((it, idx) => (
                  <View key={it.id} style={styles.itemBox}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemIdx}>#{idx + 1} Line Item</Text>
                      <View style={{ flexDirection:'row', gap:6 }}>
                        <TouchableOpacity style={styles.catalogBtn} onPress={() => {}}>
                          <Text style={styles.catalogBtnText}>📦 Catalog</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeLineItem(it.id)}><Text style={styles.removeBtn}>Remove</Text></TouchableOpacity>
                      </View>
                    </View>

                    {/* Catalog Product Picker */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:6 }}>
                      <View style={{ flexDirection:'row', gap:6 }}>
                        {CATALOG_PRODUCTS.map(p => (
                          <TouchableOpacity key={p.name} style={[styles.catalogProductChip, it.productName === p.name && styles.catalogProductChipActive]} onPress={() => updateLineItem(it.id, { productName:p.name, description:p.desc, hsnCode:p.hsn, unitPrice:p.price, taxRate:p.tax, unit:p.unit, imageUrl:p.image })}>
                            <Text style={[styles.catalogProductChipText, it.productName === p.name && styles.catalogProductChipTextActive]}>{p.name.slice(0,20)}</Text>
                            <Text style={styles.catalogProductChipPrice}>₹{p.price.toLocaleString()}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    <TextInput style={[styles.inputField, { marginTop:8, fontWeight:'900' }]} placeholder="Product Title *" placeholderTextColor="#64748b" value={it.productName} onChangeText={v => updateLineItem(it.id, { productName:v })} />

                    {/* Description Toggle */}
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleText}>📝 Description Visible</Text>
                      <TouchableOpacity style={[styles.toggleBtn, it.showDescription && styles.toggleBtnOn]} onPress={() => updateLineItem(it.id, { showDescription:!it.showDescription })}>
                        <Text style={[styles.toggleBtnText, it.showDescription && styles.toggleBtnTextOn]}>{it.showDescription ? '✓ Shown' : 'Hidden'}</Text>
                      </TouchableOpacity>
                    </View>
                    {it.showDescription && (
                      <TextInput style={[styles.inputField, { marginTop:4 }]} placeholder="Enter product description, specs..." placeholderTextColor="#64748b" value={it.description || ''} onChangeText={v => updateLineItem(it.id, { description:v })} />
                    )}

                    {/* Image */}
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleText}>🖼️ Show Image in PDF</Text>
                      <View style={{ flexDirection:'row', gap:6 }}>
                        <TouchableOpacity style={styles.uploadBtn} onPress={() => handlePickImage(uri => updateLineItem(it.id, { imageUrl:uri }))}>
                          <Text style={styles.uploadBtnText}>📁 Pick</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.toggleBtn, it.showImage && styles.toggleBtnOn]} onPress={() => updateLineItem(it.id, { showImage:!it.showImage })}>
                          <Text style={[styles.toggleBtnText, it.showImage && styles.toggleBtnTextOn]}>{it.showImage ? '✓ Shown' : 'Hidden'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Qty / Unit / Rate / GST */}
                    <View style={{ flexDirection:'row', gap:6, marginTop:6 }}>
                      <View style={{ flex:1 }}>
                        <Text style={styles.fieldLabel}>HSN/SAC</Text>
                        <TextInput style={styles.inputField} value={it.hsnCode || ''} onChangeText={v => updateLineItem(it.id, { hsnCode:v })} placeholder="998313" placeholderTextColor="#64748b" />
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={styles.fieldLabel}>Qty</Text>
                        <TextInput style={styles.inputField} value={String(it.qty)} onChangeText={v => updateLineItem(it.id, { qty:Number(v)||1 })} keyboardType="numeric" />
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={styles.fieldLabel}>Unit</Text>
                        <TextInput style={styles.inputField} value={it.unit} onChangeText={v => updateLineItem(it.id, { unit:v })} placeholder="Nos" placeholderTextColor="#64748b" />
                      </View>
                      <View style={{ flex:1.5 }}>
                        <Text style={styles.fieldLabel}>Rate (₹)</Text>
                        <TextInput style={styles.inputField} value={String(it.unitPrice)} onChangeText={v => updateLineItem(it.id, { unitPrice:Number(v)||0 })} keyboardType="numeric" />
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={styles.fieldLabel}>GST %</Text>
                        <TextInput style={[styles.inputField, { color:'#fbbf24' }]} value={String(it.taxRate)} onChangeText={v => updateLineItem(it.id, { taxRate:Number(v)||0 })} keyboardType="numeric" />
                      </View>
                    </View>

                    {/* Custom Column Values */}
                    {customColumns.length > 0 && (
                      <View style={{ marginTop:8 }}>
                        <Text style={[styles.fieldLabel, { marginBottom:4 }]}>Custom Column Values:</Text>
                        <View style={{ gap:6 }}>
                          {customColumns.map(col => (
                            <View key={col.id} style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                              <Text style={{ fontSize:9, fontWeight:'800', color:'#a78bfa', flex:0.5 }}>{col.name}:</Text>
                              <TextInput style={[styles.inputField, { flex:1, color:'#e9d5ff' }]} value={it.customValues?.[col.id] || ''} onChangeText={v => updateLineItem(it.id, { customValues:{ ...(it.customValues||{}), [col.id]:v } })} placeholder={`Enter ${col.name}...`} placeholderTextColor="#64748b" />
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={styles.addItemBtn} onPress={addLineItem}>
                  <Text style={styles.addItemBtnText}>+ Add Line Item</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── 5. Terms ── */}
          <View style={[styles.accCard, openSections.terms && styles.accCardOpen]}>
            <AccordionHeader label="📄 5. Terms & Conditions" color="#38bdf8" sectionKey="terms" />
            {openSections.terms && (
              <View style={styles.accBody}>
                <TextInput style={[styles.inputField, { height:70 }]} value={termsText} onChangeText={setTermsText} multiline placeholder="Enter terms and conditions..." placeholderTextColor="#64748b" />
              </View>
            )}
          </View>

          {/* ── 6. GST Controls ── */}
          <View style={[styles.accCard, openSections.gst && styles.accCardOpen]}>
            <AccordionHeader
              label="🎚️ 6. GST Tax Rate & Column Controls"
              color="#f59e0b"
              sectionKey="gst"
              badge={gstType === 'EXEMPT' || globalGstRate === 0 ? 'Exempt (0%)' : `${globalGstRate}% (${gstType.replace('_','+')})`}
            />
            {openSections.gst && (
              <View style={styles.accBody}>
                {/* GST Type */}
                <Text style={[styles.fieldLabel, { marginBottom:6 }]}>GST Tax Type / Mechanism:</Text>
                <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                  {([
                    { id:'CGST_SGST' as GstType, label:'CGST + SGST', sub:'In-State Split' },
                    { id:'IGST' as GstType, label:'IGST', sub:'Interstate' },
                    { id:'CGST_UTGST' as GstType, label:'CGST + UTGST', sub:'Union Territory' },
                    { id:'EXEMPT' as GstType, label:'EXEMPT / NIL', sub:'0% Tax' },
                  ]).map(t => (
                    <TouchableOpacity key={t.id} style={[styles.gstTypeBtn, gstType===t.id && styles.gstTypeBtnActive]} onPress={() => { setGstType(t.id); if (t.id==='EXEMPT') handleApplyGlobalGst(0); else if (globalGstRate===0) handleApplyGlobalGst(18); }}>
                      <Text style={[styles.gstTypeBtnText, gstType===t.id && styles.gstTypeBtnTextActive]}>{t.label}</Text>
                      <Text style={[styles.gstTypeBtnSub, gstType===t.id && styles.gstTypeBtnTextActive]}>{t.sub}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* GST Rate */}
                <Text style={[styles.fieldLabel, { marginBottom:4 }]}>GST Tax Rate: {globalGstRate}%</Text>
                <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                  {[0, 5, 12, 18, 28].map(rate => (
                    <TouchableOpacity key={rate} style={[styles.gstPill, globalGstRate===rate && styles.gstPillActive]} onPress={() => handleApplyGlobalGst(rate)}>
                      <Text style={[styles.gstPillText, globalGstRate===rate && styles.gstPillTextActive]}>{rate}%</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Column Toggles */}
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleText}>Display GST % Column & Calculate with GST</Text>
                  <Switch value={showGstColumn} onValueChange={setShowGstColumn} trackColor={{ false:'#1e293b', true:'#f59e0b' }} />
                </View>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleText}>Display HSN / SAC Code Column</Text>
                  <Switch value={showHsnColumn} onValueChange={setShowHsnColumn} trackColor={{ false:'#1e293b', true:'#6366f1' }} />
                </View>
              </View>
            )}
          </View>

          {/* ── 7. PDF Controls ── */}
          <View style={[styles.accCard, openSections.pdf && styles.accCardOpen]}>
            <AccordionHeader label="⚙️ 7. PDF Page & Margin Controls" color="#818cf8" sectionKey="pdf" />
            {openSections.pdf && (
              <View style={styles.accBody}>
                {/* Margin */}
                <Text style={styles.fieldLabel}>Page Padding / Margin</Text>
                <View style={{ flexDirection:'row', gap:6, marginBottom:10 }}>
                  {[6, 10, 15].map(m => (
                    <TouchableOpacity key={m} style={[styles.marginBtn, pdfMargin===m && styles.marginBtnActive]} onPress={() => setPdfMargin(m)}>
                      <Text style={[styles.marginBtnText, pdfMargin===m && styles.marginBtnTextActive]}>{m}mm {m===6?'Compact':m===10?'Standard':'Spacious'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Page Mode */}
                <Text style={styles.fieldLabel}>Page Flow Mode</Text>
                <View style={{ flexDirection:'row', gap:6 }}>
                  {(['SINGLE','MULTI'] as const).map(p => (
                    <TouchableOpacity key={p} style={[styles.marginBtn, pdfPageMode===p && styles.marginBtnActive]} onPress={() => setPdfPageMode(p)}>
                      <Text style={[styles.marginBtnText, pdfPageMode===p && styles.marginBtnTextActive]}>{p==='SINGLE' ? '📄 1-Page Strict' : '📄📄 Multi-Page'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* ── 8. Section Layout Engine ── */}
          <View style={[styles.accCard, openSections.layout && styles.accCardOpen]}>
            <AccordionHeader label="🎨 8. Section Layout & Positioning" color="#fbbf24" sectionKey="layout" />
            {openSections.layout && (
              <View style={styles.accBody}>
                {/* Gap Control */}
                <Text style={styles.fieldLabel}>Gap Between Sections: {sectionGap}px</Text>
                <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                  {[4, 10, 18, 30, 50].map(g => (
                    <TouchableOpacity key={g} style={[styles.gapBtn, sectionGap===g && styles.gapBtnActive]} onPress={() => setSectionGap(g)}>
                      <Text style={[styles.gapBtnText, sectionGap===g && styles.gapBtnTextActive]}>{g}px</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Top/Bottom Padding */}
                <View style={{ flexDirection:'row', gap:8, marginBottom:10 }}>
                  <View style={{ flex:1 }}>
                    <Text style={styles.fieldLabel}>Top Page Space: {pdfTopPadding}px</Text>
                    {[15, 32, 45].map(v => (
                      <TouchableOpacity key={v} style={[styles.gapBtn, pdfTopPadding===v && styles.gapBtnActive, { marginTop:4 }]} onPress={() => setPdfTopPadding(v)}>
                        <Text style={[styles.gapBtnText, pdfTopPadding===v && styles.gapBtnTextActive]}>{v}px</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={styles.fieldLabel}>Bottom Space: {pdfBottomPadding}px</Text>
                    {[12, 28, 40].map(v => (
                      <TouchableOpacity key={v} style={[styles.gapBtn, pdfBottomPadding===v && styles.gapBtnActive, { marginTop:4 }]} onPress={() => setPdfBottomPadding(v)}>
                        <Text style={[styles.gapBtnText, pdfBottomPadding===v && styles.gapBtnTextActive]}>{v}px</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Section Order & Visibility */}
                <Text style={[styles.fieldLabel, { marginBottom:6 }]}>Section Sequence & Visibility</Text>
                {sectionOrder.map((secId, idx) => {
                  const meta = SECTION_META.find(m => m.id === secId);
                  const isVisible = visibleSections[secId];
                  return (
                    <View key={secId} style={[styles.sectionRow, !isVisible && styles.sectionRowHidden]}>
                      <Text style={styles.sectionRowIdx}>#{idx + 1}</Text>
                      <View style={{ flex:1 }}>
                        <Text style={styles.sectionRowLabel}>{meta?.label}</Text>
                        <Text style={styles.sectionRowDesc}>{meta?.desc}</Text>
                      </View>
                      <View style={{ flexDirection:'row', gap:4 }}>
                        <TouchableOpacity style={styles.secArrowBtn} onPress={() => moveSectionUp(secId)} disabled={idx===0}>
                          <Text style={[styles.secArrowText, idx===0 && { opacity:0.3 }]}>▲</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secArrowBtn} onPress={() => moveSectionDown(secId)} disabled={idx===sectionOrder.length-1}>
                          <Text style={[styles.secArrowText, idx===sectionOrder.length-1 && { opacity:0.3 }]}>▼</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.secArrowBtn, isVisible ? styles.secArrowBtnOn : {}]} onPress={() => toggleSectionVisibility(secId)}>
                          <Text style={[styles.secArrowText, isVisible ? styles.secArrowTextOn : {}]}>{isVisible ? '👁' : '🚫'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                <TouchableOpacity style={styles.resetBtn} onPress={resetSectionLayout}>
                  <Text style={styles.resetBtnText}>🔄 Reset Layout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Bottom Actions */}
          <View style={{ flexDirection:'row', gap:8, marginTop:16, marginBottom:32 }}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor:'#38bdf8' }]} onPress={() => handleSaveCurrentDraft()}>
              <Text style={styles.actionBtnText}>💾 Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor:'#10b981' }]} onPress={() => {
              const text = `Dear ${activeParty.name},\n\nPlease find ${getDocTitle()} #${docNo} for ₹${grandTotal.toLocaleString()}.\n\nItems: ${items.map(i=>`• ${i.productName} x${i.qty} = ₹${(i.qty*i.unitPrice).toLocaleString()}`).join('\n')}\n\nTotal: ₹${grandTotal.toLocaleString()}\n\nGenerated by DAS CRM`;
              Linking.openURL(`whatsapp://send?phone=${activeParty.phone}&text=${encodeURIComponent(text)}`);
            }}>
              <Text style={styles.actionBtnText}>💬 WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor:'#6366f1' }]} onPress={() => {
              Linking.openURL(`mailto:${activeParty.email}?subject=${encodeURIComponent(`${getDocTitle()} #${docNo}`)}&body=${encodeURIComponent(`Dear ${activeParty.name},\n\nPlease find attached ${getDocTitle()} #${docNo} for ₹${grandTotal.toLocaleString()}.\n\nRegards,\n${activeCompany.name}`)}`);
            }}>
              <Text style={styles.actionBtnText}>✉️ Email</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* ── LIVE A4 PREVIEW ── */
        <View style={styles.previewContainer}>
          <View style={styles.previewToolbar}>
            <Text style={styles.previewToolbarText}>📄 Live A4 Preview ({pdfMargin}mm Margin)</Text>
            <TouchableOpacity style={styles.splitToggleBtn} onPress={() => setViewMode('BUILDER')}>
              <Text style={styles.splitToggleBtnText}>← Back to Builder</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.previewScroll} showsVerticalScrollIndicator={false}>
            {renderA4Preview()}
          </ScrollView>
        </View>
      )}

      {/* ── MODAL: ADD COMPANY ── */}
      <Modal visible={companyModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🏢 Add New Seller Company</Text>
                <TouchableOpacity onPress={() => setCompanyModalOpen(false)}><Text style={{ color:'#94a3b8', fontSize:18 }}>✕</Text></TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ gap:8 }}>
                  <TextInput style={styles.modalInput} placeholder="Company Name *" placeholderTextColor="#64748b" value={newComp.name||''} onChangeText={v => setNewComp({...newComp, name:v})} />
                  <View style={{ flexDirection:'row', gap:8 }}>
                    <TextInput style={[styles.modalInput, { flex:1 }]} placeholder="Email *" placeholderTextColor="#64748b" value={newComp.email||''} onChangeText={v => setNewComp({...newComp, email:v})} keyboardType="email-address" />
                    <TextInput style={[styles.modalInput, { flex:1 }]} placeholder="Phone *" placeholderTextColor="#64748b" value={newComp.phone||''} onChangeText={v => setNewComp({...newComp, phone:v})} keyboardType="phone-pad" />
                  </View>
                  <TouchableOpacity style={styles.uploadBtn} onPress={() => handlePickImage(uri => setNewComp({...newComp, logoUrl:uri}))}>
                    <Text style={styles.uploadBtnText}>📁 Pick Logo Image</Text>
                  </TouchableOpacity>
                  <TextInput style={styles.modalInput} placeholder="Address" placeholderTextColor="#64748b" value={newComp.address||''} onChangeText={v => setNewComp({...newComp, address:v})} />
                  <View style={{ flexDirection:'row', gap:8 }}>
                    <TextInput style={[styles.modalInput, { flex:1 }]} placeholder="GSTIN" placeholderTextColor="#64748b" value={newComp.gstNo||''} onChangeText={v => setNewComp({...newComp, gstNo:v})} />
                    <TextInput style={[styles.modalInput, { flex:1 }]} placeholder="PAN" placeholderTextColor="#64748b" value={newComp.panNo||''} onChangeText={v => setNewComp({...newComp, panNo:v})} />
                  </View>
                  <TextInput style={styles.modalInput} placeholder="Bank Name" placeholderTextColor="#64748b" value={newComp.bankName||''} onChangeText={v => setNewComp({...newComp, bankName:v})} />
                  <View style={{ flexDirection:'row', gap:8 }}>
                    <TextInput style={[styles.modalInput, { flex:1.5 }]} placeholder="Account Number" placeholderTextColor="#64748b" value={newComp.accountNo||''} onChangeText={v => setNewComp({...newComp, accountNo:v})} />
                    <TextInput style={[styles.modalInput, { flex:1 }]} placeholder="IFSC Code" placeholderTextColor="#64748b" value={newComp.ifscCode||''} onChangeText={v => setNewComp({...newComp, ifscCode:v})} />
                  </View>
                  <View style={{ flexDirection:'row', gap:8 }}>
                    <TextInput style={[styles.modalInput, { flex:1 }]} placeholder="Branch" placeholderTextColor="#64748b" value={newComp.branch||''} onChangeText={v => setNewComp({...newComp, branch:v})} />
                    <TextInput style={[styles.modalInput, { flex:1 }]} placeholder="UPI ID" placeholderTextColor="#64748b" value={newComp.upiId||''} onChangeText={v => setNewComp({...newComp, upiId:v})} />
                  </View>
                </View>
              </ScrollView>
              <View style={{ flexDirection:'row', gap:8, marginTop:12 }}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setCompanyModalOpen(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCompanyModal}><Text style={styles.saveBtnText}>Save Company</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL: ADD PARTY ── */}
      <Modal visible={partyModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>👤 Add New Client Party</Text>
                <TouchableOpacity onPress={() => setPartyModalOpen(false)}><Text style={{ color:'#94a3b8', fontSize:18 }}>✕</Text></TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ gap:8 }}>
                  <TextInput style={styles.modalInput} placeholder="Party / Company Name *" placeholderTextColor="#64748b" value={newParty.name||''} onChangeText={v => setNewParty({...newParty, name:v})} />
                  <TextInput style={styles.modalInput} placeholder="Contact Person" placeholderTextColor="#64748b" value={newParty.contactPerson||''} onChangeText={v => setNewParty({...newParty, contactPerson:v})} />
                  <View style={{ flexDirection:'row', gap:8 }}>
                    <TextInput style={[styles.modalInput, { flex:1 }]} placeholder="Email *" placeholderTextColor="#64748b" value={newParty.email||''} onChangeText={v => setNewParty({...newParty, email:v})} keyboardType="email-address" />
                    <TextInput style={[styles.modalInput, { flex:1 }]} placeholder="Phone *" placeholderTextColor="#64748b" value={newParty.phone||''} onChangeText={v => setNewParty({...newParty, phone:v})} keyboardType="phone-pad" />
                  </View>
                  <TextInput style={styles.modalInput} placeholder="Billing Address" placeholderTextColor="#64748b" value={newParty.address||''} onChangeText={v => setNewParty({...newParty, address:v})} />
                  <TextInput style={styles.modalInput} placeholder="Shipping Address" placeholderTextColor="#64748b" value={newParty.shippingAddress||''} onChangeText={v => setNewParty({...newParty, shippingAddress:v})} />
                  <View style={{ flexDirection:'row', gap:8 }}>
                    <TextInput style={[styles.modalInput, { flex:1 }]} placeholder="GSTIN" placeholderTextColor="#64748b" value={newParty.gstNo||''} onChangeText={v => setNewParty({...newParty, gstNo:v})} />
                    <TextInput style={[styles.modalInput, { flex:1 }]} placeholder="PAN" placeholderTextColor="#64748b" value={newParty.panNo||''} onChangeText={v => setNewParty({...newParty, panNo:v})} />
                  </View>
                </View>
              </ScrollView>
              <View style={{ flexDirection:'row', gap:8, marginTop:12 }}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setPartyModalOpen(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor:'#10b981' }]} onPress={handleSavePartyModal}><Text style={styles.saveBtnText}>Save Party</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL: HISTORY DRAWER ── */}
      <Modal visible={historyModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height:'90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📁 Saved Quotation History</Text>
              <TouchableOpacity onPress={() => setHistoryModalOpen(false)}><Text style={{ color:'#94a3b8', fontSize:18 }}>✕</Text></TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.historyStatsRow}>
              <Text style={styles.historyStat}>Total: <Text style={styles.historyStatVal}>{savedQuotes.length}</Text></Text>
              <Text style={styles.historyStat}>Drafts: <Text style={styles.historyStatVal}>{savedQuotes.filter(q=>q.status==='DRAFT').length}</Text></Text>
              <Text style={styles.historyStat}>Sent: <Text style={styles.historyStatVal}>{savedQuotes.filter(q=>q.status==='GENERATED_SENT').length}</Text></Text>
            </View>

            {/* Search */}
            <TextInput style={[styles.modalInput, { marginTop:8 }]} placeholder="Search by Doc No, Buyer, Amount..." placeholderTextColor="#64748b" value={historySearch} onChangeText={setHistorySearch} />

            {/* Status Filter */}
            <View style={{ flexDirection:'row', gap:6, marginTop:8 }}>
              {(['ALL','DRAFT','GENERATED_SENT'] as const).map(f => (
                <TouchableOpacity key={f} style={[styles.statusChip, statusFilter===f && styles.statusChipActive]} onPress={() => setStatusFilter(f)}>
                  <Text style={[styles.statusChipText, statusFilter===f && styles.statusChipTextActive]}>{f === 'ALL' ? 'All' : f === 'DRAFT' ? 'Draft' : 'Sent'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* List */}
            <FlatList
              data={filteredQuotes}
              keyExtractor={item => item.id}
              style={{ marginTop:10 }}
              contentContainerStyle={{ paddingBottom:20 }}
              ListEmptyComponent={<View style={{ alignItems:'center', marginTop:40 }}><Text style={{ color:'#64748b', fontSize:13 }}>No records found</Text></View>}
              renderItem={({ item }) => (
                <View style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <View>
                      <Text style={styles.historyDocNo}>{item.docNo}</Text>
                      <View style={styles.historyTypeBadge}>
                        <Text style={styles.historyTypeBadgeText}>{item.docType.replace('_',' ')}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems:'flex-end' }}>
                      <Text style={styles.historyAmount}>₹{item.totalAmount.toLocaleString('en-IN')}</Text>
                      <View style={[styles.historyStatusBadge, item.status === 'DRAFT' ? styles.historyStatusDraft : styles.historyStatusSent]}>
                        <Text style={[styles.historyStatusText, item.status === 'DRAFT' ? styles.historyStatusTextDraft : styles.historyStatusTextSent]}>{item.status === 'DRAFT' ? '📝 Draft' : item.sentVia === 'WHATSAPP_DIRECT' ? '💬 WA' : item.sentVia === 'EMAIL' ? '✉️ Email' : '✓ Sent'}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.historyParty}>{item.partyName}</Text>
                  <Text style={styles.historyMeta}>By: {item.createdByName || 'Sales'} • {item.savedAt} • {item.itemsCount} item{item.itemsCount !== 1 ? 's' : ''}</Text>

                  {/* Action Buttons */}
                  <View style={styles.historyActions}>
                    <TouchableOpacity style={styles.historyActionBtn} onPress={() => handleLoadSavedQuote(item)}>
                      <Text style={styles.historyActionBtnText}>📂 Load</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.historyActionBtn, { backgroundColor:'rgba(52,211,153,0.15)', borderColor:'rgba(52,211,153,0.3)' }]} onPress={() => handleDirectSendQuote(item, 'EMAIL')}>
                      <Text style={[styles.historyActionBtnText, { color:'#34d399' }]}>✉️ Email</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.historyActionBtn, { backgroundColor:'rgba(52,211,153,0.15)', borderColor:'rgba(52,211,153,0.3)' }]} onPress={() => handleDirectSendQuote(item, 'WHATSAPP_DIRECT')}>
                      <Text style={[styles.historyActionBtnText, { color:'#34d399' }]}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.historyActionBtn, { backgroundColor:'rgba(244,63,94,0.1)', borderColor:'rgba(244,63,94,0.3)' }]} onPress={() => {
                      Alert.alert('Delete Quote', `Delete ${item.docNo}?`, [
                        { text:'Cancel', style:'cancel' },
                        { text:'Delete', style:'destructive', onPress:() => setSavedQuotes(prev => prev.filter(q => q.id !== item.id)) },
                      ]);
                    }}>
                      <Text style={[styles.historyActionBtnText, { color:'#f43f5e' }]}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            {/* New Quote Button */}
            <TouchableOpacity style={styles.newQuoteBtn} onPress={() => {
              setDocNo(`EST-2026-${Math.floor(1000 + Math.random() * 9000)}`);
              setDocType('QUOTATION');
              setItems([{ id:`item-${Date.now()}`, productName:'Executive Work Station', description:'Ergonomic Modular Desk System', showDescription:true, hsnCode:'998313', customValues:{ 'col-1':'Aarna Modular', 'col-2':'1 Year Full Warranty' }, showImage:false, unit:'Nos', qty:1, unitPrice:22500, taxRate:18, discountType:'flat', discountVal:0, total:22500 }]);
              setHistoryModalOpen(false);
              setViewMode('BUILDER');
            }}>
              <Text style={styles.newQuoteBtnText}>+ New Quote</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#090d16' },
  topHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:14, paddingVertical:10, backgroundColor:'#0f172a', borderBottomWidth:1, borderBottomColor:'#1e293b' },
  backBtn: { backgroundColor:'#1e293b', paddingHorizontal:10, paddingVertical:6, borderRadius:8, borderWidth:1, borderColor:'#334155' },
  backBtnText: { color:'#38bdf8', fontWeight:'900', fontSize:11 },
  headerTitle: { fontSize:12, fontWeight:'900', color:'#ffffff', flex:1, textAlign:'center' },
  topActionBtn: { backgroundColor:'rgba(99,102,241,0.2)', paddingHorizontal:8, paddingVertical:5, borderRadius:8, borderWidth:1, borderColor:'rgba(99,102,241,0.4)' },
  topActionBtnText: { color:'#818cf8', fontWeight:'900', fontSize:10 },
  topActionBar: { backgroundColor:'#020617', padding:10, borderBottomWidth:1, borderBottomColor:'#1e293b' },
  topBarRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  viewModeSwitcher: { flexDirection:'row', backgroundColor:'#1e293b', borderRadius:10, padding:3 },
  vmTab: { paddingHorizontal:12, paddingVertical:5, borderRadius:8 },
  vmTabActive: { backgroundColor:'#4f46e5' },
  vmTabText: { fontSize:10, fontWeight:'900', color:'#94a3b8' },
  vmTabTextActive: { color:'#ffffff' },
  topBarActions: { flexDirection:'row', gap:6 },
  topBarBtn: { backgroundColor:'#1e293b', paddingHorizontal:10, paddingVertical:5, borderRadius:8, borderWidth:1, borderColor:'#334155' },
  topBarBtnSuccess: { backgroundColor:'rgba(16,185,129,0.2)', borderColor:'rgba(16,185,129,0.4)' },
  topBarBtnPrimary: { backgroundColor:'rgba(99,102,241,0.2)', paddingHorizontal:10, paddingVertical:5, borderRadius:8, borderWidth:1, borderColor:'rgba(99,102,241,0.4)' },
  topBarBtnText: { fontSize:10, fontWeight:'900', color:'#e2e8f0' },
  topBarBtnTextPrimary: { fontSize:10, fontWeight:'900', color:'#818cf8' },
  convertPill: { paddingHorizontal:10, paddingVertical:5, borderRadius:8, backgroundColor:'#1e293b', borderWidth:1, borderColor:'#334155' },
  convertPillActive: { backgroundColor:'#4f46e5', borderColor:'#4f46e5' },
  convertPillText: { fontSize:9, fontWeight:'900', color:'#94a3b8' },
  convertPillTextActive: { color:'#ffffff' },
  scrollContent: { padding:10, paddingBottom:40 },
  accCard: { backgroundColor:'#0f172a', borderRadius:14, borderWidth:1, borderColor:'#1e293b', marginBottom:8, overflow:'hidden' },
  accCardOpen: { borderColor:'#334155' },
  accHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:12 },
  accHeaderText: { fontSize:12, fontWeight:'900', flex:1 },
  accHeaderRight: { flexDirection:'row', alignItems:'center', gap:8 },
  accBadge: { paddingHorizontal:6, paddingVertical:2, borderRadius:6, borderWidth:1 },
  accBadgeText: { fontSize:9, fontWeight:'900' },
  accChevron: { fontSize:10, color:'#64748b' },
  accBody: { padding:12, paddingTop:0, borderTopWidth:1, borderTopColor:'#1e293b' },
  companyRow: { flexDirection:'row', justifyContent:'flex-end' },
  addBtn: { backgroundColor:'rgba(56,189,248,0.15)', borderWidth:1, borderColor:'rgba(56,189,248,0.4)', paddingHorizontal:8, paddingVertical:4, borderRadius:8 },
  addBtnText: { color:'#38bdf8', fontSize:10, fontWeight:'900' },
  selBox: { backgroundColor:'#020617', borderWidth:1, borderColor:'#1e293b', paddingHorizontal:10, paddingVertical:8, borderRadius:10, minWidth:140 },
  selBoxActive: { borderColor:'#38bdf8' },
  selBoxName: { fontSize:11, fontWeight:'900', color:'#ffffff' },
  selBoxSub: { fontSize:9, color:'#64748b', marginTop:2 },
  detailCard: { backgroundColor:'rgba(99,102,241,0.1)', borderWidth:1, borderColor:'rgba(99,102,241,0.3)', borderRadius:12, padding:10, marginTop:8 },
  detailName: { fontSize:12, fontWeight:'900', color:'#ffffff' },
  detailSub: { fontSize:10, color:'#94a3b8', marginTop:2 },
  detailContact: { fontSize:10, color:'#818cf8', marginTop:2 },
  toggleRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:10, paddingTop:8, borderTopWidth:1, borderTopColor:'#1e293b' },
  toggleText: { fontSize:11, fontWeight:'800', color:'#cbd5e1', flex:1 },
  fieldLabel: { fontSize:10, fontWeight:'800', color:'#94a3b8', marginBottom:4 },
  inputField: { backgroundColor:'#020617', borderWidth:1, borderColor:'#1e293b', borderRadius:8, paddingHorizontal:10, paddingVertical:6, fontSize:11, color:'#ffffff' },
  itemBox: { backgroundColor:'#020617', borderRadius:12, borderWidth:1, borderColor:'#1e293b', padding:10, marginBottom:10 },
  itemHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  itemIdx: { fontSize:11, fontWeight:'900', color:'#94a3b8' },
  removeBtn: { color:'#f43f5e', fontSize:11, fontWeight:'900' },
  catalogBtn: { backgroundColor:'rgba(167,139,250,0.15)', borderWidth:1, borderColor:'rgba(167,139,250,0.3)', paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  catalogBtnText: { color:'#a78bfa', fontSize:10, fontWeight:'900' },
  catalogProductChip: { backgroundColor:'#1e293b', borderWidth:1, borderColor:'#334155', paddingHorizontal:8, paddingVertical:4, borderRadius:8 },
  catalogProductChipActive: { backgroundColor:'rgba(167,139,250,0.2)', borderColor:'rgba(167,139,250,0.5)' },
  catalogProductChipText: { fontSize:9, fontWeight:'900', color:'#94a3b8' },
  catalogProductChipTextActive: { color:'#e9d5ff' },
  catalogProductChipPrice: { fontSize:9, color:'#64748b' },
  toggleBtn: { backgroundColor:'#1e293b', paddingHorizontal:8, paddingVertical:4, borderRadius:6, borderWidth:1, borderColor:'#334155' },
  toggleBtnOn: { backgroundColor:'rgba(16,185,129,0.2)', borderColor:'rgba(16,185,129,0.4)' },
  toggleBtnText: { fontSize:10, fontWeight:'900', color:'#64748b' },
  toggleBtnTextOn: { color:'#34d399' },
  uploadBtn: { backgroundColor:'rgba(56,189,248,0.15)', borderWidth:1, borderColor:'rgba(56,189,248,0.4)', paddingHorizontal:8, paddingVertical:4, borderRadius:8 },
  uploadBtnText: { color:'#38bdf8', fontSize:10, fontWeight:'900' },
  customColManager: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  customColTitle: { fontSize:11, fontWeight:'900', color:'#a78bfa' },
  customColAddBtn: { backgroundColor:'rgba(167,139,250,0.15)', borderWidth:1, borderColor:'rgba(167,139,250,0.3)', paddingHorizontal:8, paddingVertical:4, borderRadius:8 },
  customColAddBtnText: { color:'#a78bfa', fontSize:10, fontWeight:'900' },
  customColRow: { flexDirection:'row', alignItems:'center', gap:6 },
  customColIdx: { width:24, height:24, borderRadius:12, backgroundColor:'rgba(167,139,250,0.2)', alignItems:'center', justifyContent:'center' },
  customColIdxText: { fontSize:10, fontWeight:'900', color:'#a78bfa' },
  customColDel: { width:24, height:24, borderRadius:12, backgroundColor:'rgba(244,63,94,0.1)', borderWidth:1, borderColor:'rgba(244,63,94,0.3)', alignItems:'center', justifyContent:'center' },
  customColDelText: { fontSize:10, fontWeight:'900', color:'#f43f5e' },
  addItemBtn: { backgroundColor:'rgba(167,139,250,0.15)', borderWidth:1, borderColor:'rgba(167,139,250,0.3)', paddingVertical:10, borderRadius:10, alignItems:'center', marginTop:4 },
  addItemBtnText: { color:'#a78bfa', fontWeight:'900', fontSize:12 },
  gstTypeBtn: { flex:1, backgroundColor:'#020617', borderWidth:1, borderColor:'#1e293b', borderRadius:10, padding:8, minWidth:70 },
  gstTypeBtnActive: { backgroundColor:'#f59e0b', borderColor:'#f59e0b' },
  gstTypeBtnText: { fontSize:10, fontWeight:'900', color:'#e2e8f0' },
  gstTypeBtnSub: { fontSize:8, color:'#64748b', marginTop:2 },
  gstTypeBtnTextActive: { color:'#0f172a' },
  gstPill: { paddingHorizontal:12, paddingVertical:6, borderRadius:8, backgroundColor:'#020617', borderWidth:1, borderColor:'#1e293b' },
  gstPillActive: { backgroundColor:'#f59e0b', borderColor:'#f59e0b' },
  gstPillText: { fontSize:11, fontWeight:'900', color:'#94a3b8' },
  gstPillTextActive: { color:'#0f172a' },
  marginBtn: { flex:1, paddingVertical:8, borderRadius:8, backgroundColor:'#020617', borderWidth:1, borderColor:'#1e293b', alignItems:'center' },
  marginBtnActive: { backgroundColor:'#4f46e5', borderColor:'#4f46e5' },
  marginBtnText: { fontSize:10, fontWeight:'900', color:'#94a3b8' },
  marginBtnTextActive: { color:'#ffffff' },
  gapBtn: { paddingHorizontal:10, paddingVertical:5, borderRadius:8, backgroundColor:'#020617', borderWidth:1, borderColor:'#1e293b' },
  gapBtnActive: { backgroundColor:'#f59e0b', borderColor:'#f59e0b' },
  gapBtnText: { fontSize:10, fontWeight:'900', color:'#94a3b8' },
  gapBtnTextActive: { color:'#0f172a' },
  sectionRow: { flexDirection:'row', alignItems:'center', backgroundColor:'#020617', borderRadius:10, padding:8, marginBottom:6, borderWidth:1, borderColor:'#1e293b', gap:8 },
  sectionRowHidden: { opacity:0.5, borderColor:'#1e293b' },
  sectionRowIdx: { fontSize:11, fontWeight:'900', color:'#f59e0b', width:24, textAlign:'center' },
  sectionRowLabel: { fontSize:11, fontWeight:'900', color:'#e2e8f0' },
  sectionRowDesc: { fontSize:9, color:'#64748b', marginTop:1 },
  secArrowBtn: { width:28, height:28, borderRadius:6, backgroundColor:'#1e293b', alignItems:'center', justifyContent:'center' },
  secArrowBtnOn: { backgroundColor:'rgba(99,102,241,0.3)' },
  secArrowText: { fontSize:12, color:'#94a3b8' },
  secArrowTextOn: { color:'#818cf8' },
  resetBtn: { backgroundColor:'rgba(245,158,11,0.15)', borderWidth:1, borderColor:'rgba(245,158,11,0.3)', paddingVertical:8, borderRadius:10, alignItems:'center', marginTop:8 },
  resetBtnText: { color:'#fbbf24', fontWeight:'900', fontSize:12 },
  actionBtn: { flex:1, paddingVertical:10, borderRadius:10, alignItems:'center' },
  actionBtnText: { color:'#ffffff', fontWeight:'900', fontSize:11 },
  previewContainer: { flex:1 },
  previewToolbar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#020617', paddingHorizontal:12, paddingVertical:8, borderBottomWidth:1, borderBottomColor:'#1e293b' },
  previewToolbarText: { fontSize:11, fontWeight:'900', color:'#4f46e5' },
  splitToggleBtn: { backgroundColor:'rgba(99,102,241,0.2)', paddingHorizontal:10, paddingVertical:4, borderRadius:8, borderWidth:1, borderColor:'rgba(99,102,241,0.4)' },
  splitToggleBtnText: { fontSize:10, fontWeight:'900', color:'#818cf8' },
  previewScroll: { padding:8, alignItems:'center' },

  // A4 Preview Styles
  a4Paper: { width:Math.min(SCREEN_WIDTH - 16, 380), minHeight:500, backgroundColor:'#ffffff', borderRadius:6, paddingBottom:32, borderWidth:2, borderColor:'#002060', position:'relative' },
  a4NavyBar: { height:4, backgroundColor:'#002060', marginTop:-12, marginHorizontal:-9999, marginBottom:8 },
  a4Section: {},
  a4HeaderRow: { flexDirection:'row', justifyContent:'space-between', borderBottomWidth:1, borderBottomColor:'#e2e8f0', paddingBottom:6 },
  a4HeaderLeft: { flexDirection:'row', alignItems:'flex-start', flex:1, gap:8 },
  a4Logo: { width:44, height:44, borderRadius:6, borderWidth:1, borderColor:'#e2e8f0' },
  a4LogoFallback: { width:44, height:44, borderRadius:6, backgroundColor:'#002060', alignItems:'center', justifyContent:'center' },
  a4LogoFallbackText: { color:'#ffffff', fontWeight:'900', fontSize:14 },
  a4CompName: { fontSize:11, fontWeight:'900', color:'#002060' },
  a4CompSub: { fontSize:8, color:'#475569', marginTop:1 },
  a4CompTax: { fontSize:8, fontWeight:'800', color:'#002060', marginTop:1 },
  a4HeaderRight: { alignItems:'flex-end', gap:2 },
  a4Badge: { backgroundColor:'#002060', paddingHorizontal:6, paddingVertical:2, borderRadius:4 },
  a4BadgeText: { color:'#ffffff', fontSize:7.5, fontWeight:'900' },
  a4DocNo: { fontSize:9.5, fontWeight:'900', color:'#002060', marginTop:2 },
  a4DateText: { fontSize:8, color:'#475569' },
  a4PartyGrid: { backgroundColor:'#f8fafc', borderWidth:1, borderColor:'#e2e8f0', borderRadius:8, padding:8 },
  a4PartyBilling: { flex:1 },
  a4PartyShipping: { flex:1, borderLeftWidth:1, borderLeftColor:'#e2e8f0', paddingLeft:8 },
  a4PartyRight: { alignItems:'flex-end' },
  a4PartyLabel: { fontSize:7.5, fontWeight:'900', color:'#64748b', textTransform:'uppercase' },
  a4PartyLabelBlue: { fontSize:7.5, fontWeight:'900', color:'#002060', textTransform:'uppercase' },
  a4PartyName: { fontSize:10, fontWeight:'900', color:'#0f172a', marginTop:1 },
  a4PartySub: { fontSize:8, color:'#475569', marginTop:1 },
  a4PartyValue: { fontFamily:'monospace', color:'#002060' },
  a4Table: { borderWidth:1, borderColor:'#e2e8f0', borderRadius:8, overflow:'hidden' },
  a4TableHeader: { flexDirection:'row', backgroundColor:'#002060', paddingVertical:5, paddingHorizontal:4, alignItems:'center' },
  a4Th: { fontSize:7.5, fontWeight:'900', color:'#ffffff' },
  a4TableRow: { flexDirection:'row', paddingVertical:5, paddingHorizontal:4, borderBottomWidth:1, borderBottomColor:'#f1f5f9', alignItems:'center' },
  a4TdNum: { fontSize:8, fontWeight:'900', color:'#94a3b8', textAlign:'center' },
  a4TdName: { fontSize:9, fontWeight:'900', color:'#0f172a' },
  a4TdDesc: { fontSize:7.5, color:'#64748b', marginTop:1 },
  a4TdMono: { fontSize:8, color:'#64748b', fontFamily:'monospace' },
  a4Td: { fontSize:8, color:'#334155' },
  a4TdBold: { fontSize:8.5, fontWeight:'900', color:'#0f172a' },
  a4TdGst: { fontSize:8, fontWeight:'900', color:'#002060' },
  a4SummaryGrid: { flexDirection:'row', gap:8 },
  a4BankBox: { backgroundColor:'#f8fafc', borderWidth:1, borderColor:'#e2e8f0', borderRadius:8, padding:8 },
  a4AmountWordsBox: { backgroundColor:'#f8fafc', borderWidth:1, borderColor:'#e2e8f0', borderRadius:8, padding:8 },
  a4BoxLabel: { fontSize:7.5, fontWeight:'900', color:'#64748b', textTransform:'uppercase', marginBottom:4 },
  a4BankText: { fontSize:8, color:'#334155', marginTop:1 },
  a4BankAcc: { fontSize:8, fontWeight:'800', color:'#002060', fontFamily:'monospace', marginTop:1 },
  a4BankUpi: { fontSize:8, fontWeight:'800', color:'#002060', marginTop:1 },
  a4AmountWordsLabel: { fontSize:7.5, fontWeight:'900', color:'#002060', marginBottom:2 },
  a4AmountWords: { fontSize:8.5, fontWeight:'800', color:'#002060', fontStyle:'italic' },
  a4TotalsBox: { width:155, backgroundColor:'#f8fafc', borderWidth:1, borderColor:'#e2e8f0', borderRadius:8, padding:8, gap:3 },
  a4SumRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  a4SumLbl: { fontSize:8, color:'#64748b' },
  a4SumVal: { fontSize:8, fontWeight:'800', color:'#0f172a' },
  a4TaxTotalLbl: { fontSize:8, fontWeight:'800', color:'#002060' },
  a4GrandRow: { flexDirection:'row', justifyContent:'space-between', backgroundColor:'#002060', borderRadius:6, padding:5, marginTop:2 },
  a4GrandLbl: { fontSize:8.5, fontWeight:'900', color:'#e2e8f0', textTransform:'uppercase' },
  a4GrandVal: { fontSize:10, fontWeight:'900', color:'#ffffff' },
  a4FooterRow: { flexDirection:'row', justifyContent:'space-between', borderTopWidth:1, borderTopColor:'#e2e8f0', paddingTop:8 },
  a4TermsBody: { fontSize:8, color:'#475569', marginTop:2 },
  a4SignFor: { fontSize:9, fontWeight:'800', color:'#0f172a', textAlign:'right' },
  a4SignLine: { borderTopWidth:1, borderTopColor:'#94a3b8', width:80, marginTop:16, alignItems:'center', paddingTop:2 },
  a4SignText: { fontSize:7, fontWeight:'800', color:'#64748b', textTransform:'uppercase' },
  a4FixedBottomStrip: { position:'absolute', bottom:0, left:0, right:0, height:22, backgroundColor:'#f8fafc', borderTopWidth:1, borderTopColor:'#e2e8f0', flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:10 },
  a4BottomText: { fontSize:7.5, color:'#64748b' },
  a4BottomLink: { fontSize:7.5, fontWeight:'800', color:'#4f46e5' },

  // Modal Styles
  modalOverlay: { flex:1, backgroundColor:'rgba(2,6,23,0.85)', justifyContent:'center', padding:16 },
  modalContent: { backgroundColor:'#0f172a', borderRadius:16, borderWidth:1, borderColor:'#1e293b', padding:16 },
  modalHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  modalTitle: { fontSize:14, fontWeight:'900', color:'#ffffff' },
  modalInput: { backgroundColor:'#020617', borderWidth:1, borderColor:'#1e293b', borderRadius:8, paddingHorizontal:10, paddingVertical:8, fontSize:12, color:'#ffffff' },
  cancelBtn: { flex:1, backgroundColor:'#1e293b', paddingVertical:10, borderRadius:10, alignItems:'center' },
  cancelBtnText: { color:'#94a3b8', fontWeight:'900', fontSize:12 },
  saveBtn: { flex:1, backgroundColor:'#4f46e5', paddingVertical:10, borderRadius:10, alignItems:'center' },
  saveBtnText: { color:'#ffffff', fontWeight:'900', fontSize:12 },
  historyStatsRow: { flexDirection:'row', gap:16, marginTop:10 },
  historyStat: { fontSize:11, color:'#64748b' },
  historyStatVal: { fontWeight:'900', color:'#e2e8f0' },
  statusChip: { paddingHorizontal:10, paddingVertical:4, borderRadius:8, backgroundColor:'#1e293b', borderWidth:1, borderColor:'#334155' },
  statusChipActive: { backgroundColor:'#4f46e5', borderColor:'#4f46e5' },
  statusChipText: { fontSize:10, fontWeight:'900', color:'#94a3b8' },
  statusChipTextActive: { color:'#ffffff' },
  historyCard: { backgroundColor:'#020617', borderRadius:12, borderWidth:1, borderColor:'#1e293b', padding:12, marginBottom:10 },
  historyCardHeader: { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  historyDocNo: { fontSize:12, fontWeight:'900', color:'#38bdf8' },
  historyTypeBadge: { backgroundColor:'rgba(99,102,241,0.2)', paddingHorizontal:6, paddingVertical:1, borderRadius:4, marginTop:2, alignSelf:'flex-start' },
  historyTypeBadgeText: { fontSize:8, fontWeight:'900', color:'#818cf8' },
  historyAmount: { fontSize:13, fontWeight:'900', color:'#34d399' },
  historyStatusBadge: { paddingHorizontal:6, paddingVertical:1, borderRadius:4, marginTop:2 },
  historyStatusDraft: { backgroundColor:'rgba(245,158,11,0.2)' },
  historyStatusSent: { backgroundColor:'rgba(16,185,129,0.2)' },
  historyStatusText: { fontSize:9, fontWeight:'900' },
  historyStatusTextDraft: { color:'#fbbf24' },
  historyStatusTextSent: { color:'#34d399' },
  historyParty: { fontSize:11, color:'#e2e8f0', marginBottom:2 },
  historyMeta: { fontSize:9, color:'#64748b', marginBottom:8 },
  historyActions: { flexDirection:'row', gap:6, flexWrap:'wrap' },
  historyActionBtn: { backgroundColor:'rgba(56,189,248,0.1)', borderWidth:1, borderColor:'rgba(56,189,248,0.3)', paddingHorizontal:10, paddingVertical:4, borderRadius:8 },
  historyActionBtnText: { fontSize:10, fontWeight:'900', color:'#38bdf8' },
  newQuoteBtn: { backgroundColor:'#4f46e5', paddingVertical:12, borderRadius:12, alignItems:'center', marginTop:10 },
  newQuoteBtnText: { color:'#ffffff', fontWeight:'900', fontSize:13 },
});
