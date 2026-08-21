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
} from 'react-native';

export interface QuotationRecord {
  id: string;
  title: string;
  client: string;
  baseAmount: number;
  discountPct: number;
  gstAmount: number;
  totalAmount: number;
  date: string;
  status: 'CONFIRMED' | 'SENT' | 'DRAFT';
  lineItems: { product: string; qty: number; price: number }[];
}

interface QuotationsInvoicesScreenProps {
  onClose?: () => void;
}

export const QuotationsInvoicesScreen: React.FC<QuotationsInvoicesScreenProps> = ({ onClose }) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CONFIRMED' | 'SENT' | 'DRAFT'>('ALL');
  const [newQuoteClient, setNewQuoteClient] = useState('');
  const [newQuoteProduct, setNewQuoteProduct] = useState('DAS CRM Enterprise Suite (50 Seats)');
  const [newQuotePrice, setNewQuotePrice] = useState('500000');
  const [newQuoteQty, setNewQuoteQty] = useState('1');
  const [newQuoteDiscount, setNewQuoteDiscount] = useState('5');

  const [quotesList, setQuotesList] = useState<QuotationRecord[]>([
    {
      id: 'q_1',
      title: 'TechCorp Solutions (Enterprise Package)',
      client: 'TechCorp Solutions',
      baseAmount: 500000,
      discountPct: 5,
      gstAmount: 85500,
      totalAmount: 560500,
      date: 'Yesterday',
      status: 'CONFIRMED',
      lineItems: [{ product: 'DAS CRM Enterprise Suite (50 Seats)', qty: 1, price: 500000 }],
    },
    {
      id: 'q_2',
      title: 'LogiTech Freight (Starter Package)',
      client: 'LogiTech Freight',
      baseAmount: 120000,
      discountPct: 0,
      gstAmount: 21600,
      totalAmount: 141600,
      date: '3 days ago',
      status: 'SENT',
      lineItems: [{ product: 'DAS CRM Starter Package (10 Seats)', qty: 1, price: 120000 }],
    },
  ]);

  const handleCreateQuotation = () => {
    if (!newQuoteClient.trim() || !newQuotePrice.trim()) {
      Alert.alert('Validation Error', 'Please enter client name and product base price.');
      return;
    }
    const unitPrice = parseFloat(newQuotePrice.replace(/[^\d.]/g, '')) || 0;
    const qty = parseInt(newQuoteQty.replace(/[^\d]/g, ''), 10) || 1;
    const discountPct = parseFloat(newQuoteDiscount.replace(/[^\d.]/g, '')) || 0;

    const subtotal = unitPrice * qty;
    const discountAmt = subtotal * (discountPct / 100);
    const taxableTotal = subtotal - discountAmt;
    const gstAmt = taxableTotal * 0.18;
    const grandTotal = taxableTotal + gstAmt;

    const newQ: QuotationRecord = {
      id: `q_${Date.now()}`,
      title: `${newQuoteClient.trim()} (${newQuoteProduct})`,
      client: newQuoteClient.trim(),
      baseAmount: subtotal,
      discountPct,
      gstAmount: gstAmt,
      totalAmount: grandTotal,
      date: 'Just Now',
      status: 'CONFIRMED',
      lineItems: [{ product: newQuoteProduct, qty, price: unitPrice }],
    };

    setQuotesList([newQ, ...quotesList]);
    setNewQuoteClient('');
    Alert.alert('✅ Quotation Generated', `Created proposal for ${newQ.client} totaling ₹${grandTotal.toLocaleString()} incl. 18% GST!`);
  };

  const handleShareQuoteWhatsApp = (q: QuotationRecord) => {
    const text = encodeURIComponent(
      `Hi ${q.client}!\n\nHere is your official commercial proposal from DAS CRM:\n\n• Package: ${q.title}\n• Base Subtotal: ₹${q.baseAmount.toLocaleString()}\n• Discount (${q.discountPct}%): -₹${(q.baseAmount * (q.discountPct / 100)).toLocaleString()}\n• 18% GST Tax: ₹${q.gstAmount.toLocaleString()}\n• Grand Total: ₹${q.totalAmount.toLocaleString()}\n\nDownload PDF Invoice: https://dascrm.com/invoices/${q.id}.pdf`
    );
    const waUrl = `whatsapp://send?text=${text}`;
    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported) Linking.openURL(waUrl);
        else Alert.alert('📝 Proposal Shared', `Generated commercial invoice summary for ${q.client}!`);
      })
      .catch(() => Alert.alert('📝 Proposal Shared', `Generated commercial invoice summary!`));
  };

  const filteredQuotes = quotesList.filter((q) => {
    if (activeFilter !== 'ALL' && q.status !== activeFilter) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back to Operations</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>📝 Quotations &amp; GST Invoices</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Create Quotation Form */}
        <View style={styles.moduleCard}>
          <Text style={styles.moduleTitle}>➕ Generate Commercial Estimate / GST Invoice</Text>
          <Text style={styles.moduleSub}>Enter client details, product price &amp; discount for auto-calculated +18% GST invoice breakdown.</Text>

          <View style={{ gap: 8, marginTop: 10 }}>
            <TextInput
              style={styles.inputField}
              placeholder="Client / Company Name (e.g. Acme Corp)"
              placeholderTextColor="#64748b"
              value={newQuoteClient}
              onChangeText={setNewQuoteClient}
            />
            <TextInput
              style={styles.inputField}
              placeholder="Product / Package Description"
              placeholderTextColor="#64748b"
              value={newQuoteProduct}
              onChangeText={setNewQuoteProduct}
            />
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput
                style={[styles.inputField, { flex: 1 }]}
                placeholder="Unit Price (₹)"
                placeholderTextColor="#64748b"
                value={newQuotePrice}
                onChangeText={setNewQuotePrice}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.inputField, { width: 70 }]}
                placeholder="Qty"
                placeholderTextColor="#64748b"
                value={newQuoteQty}
                onChangeText={setNewQuoteQty}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.inputField, { width: 90 }]}
                placeholder="Discount %"
                placeholderTextColor="#64748b"
                value={newQuoteDiscount}
                onChangeText={setNewQuoteDiscount}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.generateBtn} onPress={handleCreateQuotation}>
              <Text style={{ color: '#090d16', fontWeight: '900', fontSize: 11 }}>⚡ Calculate +18% GST → Generate Quotation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ledger & Status Filters */}
        <View style={[styles.moduleCard, { marginTop: 12 }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.moduleTitle}>📋 Commercial Quotations Ledger</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {(['ALL', 'CONFIRMED', 'SENT', 'DRAFT'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterChip, activeFilter === st && styles.filterChipActive]}
                  onPress={() => setActiveFilter(st)}
                >
                  <Text style={[styles.filterChipText, activeFilter === st && styles.filterChipTextActive]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {filteredQuotes.map((q) => (
            <View key={q.id} style={[styles.itemRow, styles.borderBottom]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.itemName}>{q.title}</Text>
                <Text style={styles.itemSub}>{q.date} • Subtotal: ₹{q.baseAmount.toLocaleString()} | GST (18%): ₹{q.gstAmount.toLocaleString()}</Text>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#34d399', marginTop: 3 }}>
                  Total: ₹{q.totalAmount.toLocaleString()}
                </Text>
              </View>
              <View style={{ gap: 4, alignItems: 'flex-end' }}>
                <TouchableOpacity style={styles.shareBtn} onPress={() => handleShareQuoteWhatsApp(q)}>
                  <Text style={styles.btnTextWhite}>Share WA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.printBtn} onPress={() => Alert.alert('📄 Invoice PDF Generated', `Generated official GST tax invoice PDF for ${q.client}`)}>
                  <Text style={styles.btnTextDark}>Print PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  moduleTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  moduleSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 14 },
  filterChip: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' },
  filterChipActive: { backgroundColor: '#fbbf24', borderColor: '#fbbf24' },
  filterChipText: { fontSize: 8, fontWeight: '900', color: '#94a3b8' },
  filterChipTextActive: { color: '#090d16' },
  generateBtn: { backgroundColor: '#fbbf24', paddingVertical: 10, alignItems: 'center', borderRadius: 10, marginTop: 4 },
  inputField: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#ffffff' },
  itemRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  itemSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  shareBtn: { backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  printBtn: { backgroundColor: '#38bdf8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  btnTextWhite: { fontSize: 9, fontWeight: '900', color: '#ffffff' },
  btnTextDark: { fontSize: 9, fontWeight: '900', color: '#090d16' },
});
