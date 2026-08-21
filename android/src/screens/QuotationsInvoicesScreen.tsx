import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

export interface QuotationRecord {
  title: string;
  val: string;
  gst: string;
  total: string;
  date: string;
  status: string;
}

interface QuotationsInvoicesScreenProps {
  onClose?: () => void;
}

export const QuotationsInvoicesScreen: React.FC<QuotationsInvoicesScreenProps> = ({ onClose }) => {
  const [quotesList, setQuotesList] = useState<QuotationRecord[]>([
    { title: 'TechCorp Solutions (Enterprise 50 Seats)', val: '₹5,00,000', gst: '₹90,000 (18% GST)', total: '₹5,90,000', date: 'Yesterday', status: 'CONFIRMED' },
    { title: 'LogiTech Freight (Starter 10 Seats)', val: '₹1,20,000', gst: '₹21,60,000 (18% GST)', total: '₹1,41,600', date: '3 days ago', status: 'SENT' },
  ]);

  const [newQuoteClient, setNewQuoteClient] = useState('');
  const [newQuoteAmount, setNewQuoteAmount] = useState('');

  const handleCreateQuotation = () => {
    if (!newQuoteClient.trim() || !newQuoteAmount.trim()) {
      Alert.alert('Validation Error', 'Please enter client name and quotation base amount.');
      return;
    }
    const baseNum = parseFloat(newQuoteAmount.replace(/[^\d.]/g, '')) || 0;
    const gstNum = baseNum * 0.18;
    const totalNum = baseNum + gstNum;

    const newQ: QuotationRecord = {
      title: `${newQuoteClient.trim()} (Custom Package)`,
      val: `₹${baseNum.toLocaleString()}`,
      gst: `₹${gstNum.toLocaleString()} (18% GST)`,
      total: `₹${totalNum.toLocaleString()}`,
      date: 'Just Now',
      status: 'CONFIRMED',
    };
    setQuotesList([newQ, ...quotesList]);
    setNewQuoteClient('');
    setNewQuoteAmount('');
    Alert.alert('✅ Quotation Generated', `Created proposal for ${newQ.title} with total value of ${newQ.total}!`);
  };

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
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
          <Text style={styles.moduleTitle}>➕ Generate New Proposal / GST Estimate</Text>
          <View style={{ gap: 8, marginTop: 8 }}>
            <TextInput
              style={styles.inputField}
              placeholder="Client / Company Name"
              placeholderTextColor="#64748b"
              value={newQuoteClient}
              onChangeText={setNewQuoteClient}
            />
            <TextInput
              style={styles.inputField}
              placeholder="Base Amount (e.g. ₹5,00,000)"
              placeholderTextColor="#64748b"
              value={newQuoteAmount}
              onChangeText={setNewQuoteAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#fbbf24', paddingVertical: 10, alignItems: 'center' }]}
              onPress={handleCreateQuotation}
            >
              <Text style={{ color: '#090d16', fontWeight: '900', fontSize: 11 }}>Calculated +18% GST → Generate Quotation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Quotations Ledger */}
        <View style={[styles.moduleCard, { marginTop: 12 }]}>
          <Text style={styles.moduleTitle}>📋 Active Enterprise Quotations</Text>
          {quotesList.map((q, idx) => (
            <View key={idx} style={[styles.itemRow, idx < quotesList.length - 1 && styles.borderBottom]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{q.title}</Text>
                <Text style={styles.itemSub}>{q.date} • Base: {q.val} + {q.gst}</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#34d399' }}>{q.total}</Text>
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
  moduleTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  inputField: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#ffffff' },
  itemRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  itemSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
});
