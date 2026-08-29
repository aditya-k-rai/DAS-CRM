import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Modal,
  Image,
} from 'react-native';

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

interface QuotationsInvoicesScreenProps {
  onClose?: () => void;
}

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
    branch: 'Cyber City',
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
    gstNo: '09APMPL1329Q1Z8',
    panNo: 'APML1329Q',
  },
  {
    id: 'party-2',
    name: 'TechCorp Solutions Pvt Ltd',
    contactPerson: 'Rajesh Varma',
    email: 'rajesh@techcorp.com',
    phone: '+91 98765 43210',
    address: 'Mindspace IT Park, Hyderabad, TS - 500081',
    gstNo: '36AAACT9988K1ZP',
    panNo: 'AAACT9988K',
  },
];

const CATALOG_PRODUCTS = [
  { name: 'Executive Work Station', price: 22500, tax: 18, unit: 'Nos', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=200&auto=format&fit=crop&q=60' },
  { name: 'DAS CRM Enterprise Suite (50 Seats)', price: 500000, tax: 18, unit: 'Set', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&auto=format&fit=crop&q=60' },
  { name: 'AI Lead Scoring Engine Pro', price: 120000, tax: 18, unit: 'License', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&auto=format&fit=crop&q=60' },
];

export const QuotationsInvoicesScreen: React.FC<QuotationsInvoicesScreenProps> = ({ onClose }) => {
  const [docType, setDocType] = useState<DocumentType>('QUOTATION');
  const [companies, setCompanies] = useState<CompanyDetails[]>(INITIAL_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(INITIAL_COMPANIES[0].id);

  const [parties, setParties] = useState<PartyDetails[]>(INITIAL_PARTIES);
  const [selectedPartyId, setSelectedPartyId] = useState<string>(INITIAL_PARTIES[0].id);

  const [docNo, setDocNo] = useState('EST-2026-0891');
  const [docDate, setDocDate] = useState('13/01/2026');

  const [items, setItems] = useState<LineItem[]>([
    {
      id: 'item-1',
      productName: 'Executive Work Station',
      imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=200&auto=format&fit=crop&q=60',
      showImage: false,
      unit: 'Nos',
      qty: 9,
      unitPrice: 22500,
      taxRate: 18,
      discountType: 'flat',
      discountVal: 0,
      total: 238950,
    },
  ]);

  const activeCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];
  const activeParty = parties.find((p) => p.id === selectedPartyId) || parties[0];

  const updateLineItem = (id: string, patch: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((it) => {
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

  const handleConvertDoc = (type: DocumentType) => {
    setDocType(type);
    const prefix = type === 'QUOTATION' ? 'QT' : type === 'PROFORMA_INVOICE' ? 'PI' : type === 'TAX_INVOICE' ? 'INV' : 'REC';
    setDocNo(`${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const totalTax = items.reduce((s, it) => {
    const base = it.qty * it.unitPrice;
    const disc = it.discountType === 'percent' ? base * (it.discountVal / 100) : it.discountVal;
    return s + (base - disc) * (it.taxRate / 100);
  }, 0);
  const grandTotal = items.reduce((s, it) => s + it.total, 0);

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi ${activeParty.name}!\n\nHere is your official commercial proposal from ${activeCompany.name}:\n\n• Document No: ${docNo}\n• Client: ${activeParty.name}\n• Items: ${items.map((i) => i.productName).join(', ')}\n• Subtotal: ₹${subtotal.toLocaleString()}\n• GST Tax (18%): ₹${totalTax.toLocaleString()}\n• Grand Total: ₹${grandTotal.toLocaleString()}\n\nBank Transfer: ${activeCompany.bankName} (A/C: ${activeCompany.accountNo}, IFSC: ${activeCompany.ifscCode})`
    );
    const waUrl = `whatsapp://send?text=${text}`;
    Linking.canOpenURL(waUrl).then((supported) => {
      if (supported) Linking.openURL(waUrl);
      else Alert.alert('📝 Proposal Generated', `Created invoice #${docNo} for ${activeParty.name} totaling ₹${grandTotal.toLocaleString()}`);
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back to Operations</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>📝 Quotations &amp; GST Invoices</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Document Process Flow Selector */}
        <View style={styles.moduleCard}>
          <Text style={styles.moduleTitle}>⚡ Document Process Flow</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['QUOTATION', 'PROFORMA_INVOICE', 'TAX_INVOICE', 'PAYMENT_RECEIPT'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.flowPill, docType === t && styles.flowPillActive]}
                  onPress={() => handleConvertDoc(t)}
                >
                  <Text style={[styles.flowPillText, docType === t && styles.flowPillTextActive]}>{t.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Company & Party Pickers */}
        <View style={[styles.moduleCard, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>🏢 1. Seller Company: <Text style={{ color: '#38bdf8' }}>{activeCompany.name}</Text></Text>
          <Text style={styles.sectionSub}>GSTIN: {activeCompany.gstNo} • Bank: {activeCompany.bankName}</Text>

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>👤 2. Client Buyer Party: <Text style={{ color: '#34d399' }}>{activeParty.name}</Text></Text>
          <Text style={styles.sectionSub}>Attn: {activeParty.contactPerson} • Phone: {activeParty.phone}</Text>
        </View>

        {/* Line Items */}
        <View style={[styles.moduleCard, { marginTop: 10 }]}>
          <Text style={styles.moduleTitle}>📦 3. Line Items &amp; Image Visibility</Text>
          {items.map((it, idx) => (
            <View key={it.id} style={styles.itemBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#94a3b8' }}>#{idx + 1} {it.productName}</Text>
                <TouchableOpacity
                  style={[styles.imgToggle, it.showImage ? styles.imgToggleOn : styles.imgToggleOff]}
                  onPress={() => updateLineItem(it.id, { showImage: !it.showImage })}
                >
                  <Text style={{ fontSize: 9, fontWeight: '900', color: it.showImage ? '#34d399' : '#64748b' }}>
                    Img: {it.showImage ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                <TextInput
                  style={[styles.inputField, { flex: 1 }]}
                  placeholder="Rate (₹)"
                  placeholderTextColor="#64748b"
                  value={String(it.unitPrice)}
                  onChangeText={(v) => updateLineItem(it.id, { unitPrice: Number(v) || 0 })}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.inputField, { width: 60 }]}
                  placeholder="Qty"
                  placeholderTextColor="#64748b"
                  value={String(it.qty)}
                  onChangeText={(v) => updateLineItem(it.id, { qty: Number(v) || 1 })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Live Summary Card */}
        <View style={[styles.moduleCard, { marginTop: 10, backgroundColor: '#020617', borderColor: '#3b82f6' }]}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#38bdf8' }}>📄 Live Summary: {docNo}</Text>
          <View style={{ marginTop: 6, gap: 3 }}>
            <View style={styles.sumRow}><Text style={styles.sumLabel}>Subtotal:</Text><Text style={styles.sumVal}>₹{subtotal.toLocaleString()}</Text></View>
            <View style={styles.sumRow}><Text style={styles.sumLabel}>GST (18%):</Text><Text style={styles.sumVal}>₹{totalTax.toLocaleString()}</Text></View>
            <View style={[styles.sumRow, { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 4 }]}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#ffffff' }}>Grand Total:</Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#34d399' }}>₹{grandTotal.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShareWhatsApp}>
            <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 11, textAlign: 'center' }}>
              💬 Share Commercial Proposal via WhatsApp
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  backBtnText: { color: '#38bdf8', fontWeight: '900', fontSize: 11 },
  headerTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  scrollContent: { padding: 14, paddingBottom: 32 },
  moduleCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  moduleTitle: { fontSize: 13, fontWeight: '900', color: '#ffffff' },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  sectionSub: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  flowPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' },
  flowPillActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  flowPillText: { fontSize: 10, fontWeight: '900', color: '#94a3b8' },
  flowPillTextActive: { color: '#ffffff' },
  itemBox: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 10, marginTop: 8 },
  imgToggle: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  imgToggleOn: { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.4)' },
  imgToggleOff: { backgroundColor: '#1e293b' },
  inputField: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, color: '#ffffff' },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumLabel: { fontSize: 11, color: '#94a3b8' },
  sumVal: { fontSize: 11, fontWeight: '700', color: '#ffffff' },
  shareBtn: { backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 10, marginTop: 10, alignItems: 'center' },
});
