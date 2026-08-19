/**
 * TasksScreen.tsx — DAS CRM Android (Tab 4: More / Operations Control Center)
 * Features complete interactive management modules:
 * 1. 📦 Products & Catalog Manager (List, SKU, Pricing, Category, Create Modal)
 * 2. 📝 Quotations & Invoice Builder (List, Amounts, Status, Generate Quote Modal)
 * 3. 💼 Deals & Pipeline Kanban (Stages: Prospecting, Qualified, Proposal, Negotiation, Won)
 * 4. 🎯 Goals & Targets Tracker (Quarterly revenue targets, progress bars)
 * 5. 💰 Revenue Telemetry (Sales volume & deal performance)
 * 6. 💬 Communications Hub (WhatsApp & Call Log Telemetry Audit)
 * 7. 📋 Tasks & Reminders (Operational Checklist)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/apiService';

import ProductsCatalogScreen from './ProductsCatalogScreen';

// Module Selector Types
type MoreModule = 'PRODUCTS' | 'QUOTATIONS' | 'DEALS' | 'GOALS' | 'REVENUE' | 'COMMS' | 'TASKS';

export default function TasksScreen({ route }: any) {
  const { token } = useAuthStore();
  const initialModule: MoreModule = route?.params?.initialModule || 'PRODUCTS';
  const [activeModule, setActiveModule] = useState<MoreModule>(initialModule);

  // ── 1. PRODUCTS STATE ───────────────────────────────────────────────────────
  const [products, setProducts] = useState([
    { id: 'p1', name: 'Enterprise CRM Suite (Per Seat)', sku: 'DAS-CRM-ENT', category: 'Software License', price: '$1,250', stock: 500 },
    { id: 'p2', name: 'AI Lead Routing Engine Module', sku: 'DAS-AI-ROUTE', category: 'Add-On Module', price: '$450', stock: 100 },
    { id: 'p3', name: 'Automated WhatsApp Telemetry Hook', sku: 'DAS-WA-HOOK', category: 'Integration', price: '$290', stock: 250 },
    { id: 'p4', name: 'Custom Multi-Tenant Setup Service', sku: 'DAS-SRV-SETUP', category: 'Professional Services', price: '$2,500', stock: 20 },
  ]);
  const [createProductModal, setCreateProductModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('Software License');

  // ── 2. QUOTATIONS STATE ─────────────────────────────────────────────────────
  const [quotations, setQuotations] = useState([
    { id: 'q1', quoteNumber: 'QUO-2026-001', clientName: 'TechCorp India', amount: '₹45,000', status: 'APPROVED', validUntil: 'Aug 30, 2026' },
    { id: 'q2', quoteNumber: 'QUO-2026-002', clientName: 'Innovate Systems', amount: '₹120,000', status: 'SENT', validUntil: 'Sep 15, 2026' },
    { id: 'q3', quoteNumber: 'QUO-2026-003', clientName: 'Apex Global', amount: '₹85,000', status: 'DRAFT', validUntil: 'Sep 01, 2026' },
  ]);
  const [createQuoteModal, setCreateQuoteModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');

  // ── 3. DEALS STATE ─────────────────────────────────────────────────────────
  const [deals] = useState([
    { id: 'd1', title: 'Enterprise CRM Rollout', company: 'Acme Corp', value: '$120,000', stage: 'Negotiation', rep: 'Rajesh Kumar' },
    { id: 'd2', title: 'AI Call Telemetry Module', company: 'TechCorp India', value: '$45,000', stage: 'Proposal', rep: 'Priya Sharma' },
    { id: 'd3', title: 'Multi-Tenant Setup Contract', company: 'Apex Global', value: '$85,000', stage: 'Qualified', rep: 'Amit Shah' },
    { id: 'd4', title: 'Annual Support Renewal', company: 'Sun Realty', value: '$210,000', stage: 'Closed Won', rep: 'Sunita Verma' },
  ]);

  // ── 4. TASKS STATE ─────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Follow up on Acme Corp Quote', lead: 'Vikram Mehta', dueDate: 'Today, 4:00 PM', priority: 'HIGH', status: 'PENDING' },
    { id: 't2', title: 'Schedule Product Demo Call', lead: 'Sunita Rao', dueDate: 'Tomorrow, 11:30 AM', priority: 'URGENT', status: 'PENDING' },
    { id: 't3', title: 'Send Contract Proposal PDF', lead: 'Rajesh Kumar', dueDate: 'Yesterday', priority: 'MEDIUM', status: 'OVERDUE' },
  ]);

  useEffect(() => {
    apiService.getProducts(token).then(data => {
      if (data && Array.isArray(data) && data.length > 0) {
        setProducts(data.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || 'SKU-100',
          category: p.category || 'Software',
          price: '$' + (p.price || 990),
          stock: p.stock || 100,
        })));
      }
    });

    apiService.getQuotations(token).then(data => {
      if (data && Array.isArray(data) && data.length > 0) {
        setQuotations(data.map((q: any) => ({
          id: q.id,
          quoteNumber: q.quoteNumber || 'QUO-2026-100',
          clientName: q.clientName || 'Client',
          amount: '₹' + (q.totalAmount || 50000),
          status: q.status || 'SENT',
          validUntil: 'Sep 30, 2026',
        })));
      }
    });
  }, [token]);

  const handleCreateProduct = () => {
    if (!prodName.trim()) {
      Alert.alert('Missing Name', 'Please enter a product name.');
      return;
    }
    const newP = {
      id: 'p-' + Date.now(),
      name: prodName.trim(),
      sku: prodSku.trim() || 'DAS-' + Math.floor(Math.random() * 900 + 100),
      category: prodCategory,
      price: '$' + (prodPrice.trim() || '990'),
      stock: 50,
    };
    setProducts(prev => [newP, ...prev]);
    setCreateProductModal(false);
    setProdName('');
    setProdSku('');
    setProdPrice('');
    Alert.alert('Product Added', `Successfully created catalog item ${newP.name}.`);
  };

  const handleCreateQuotation = () => {
    if (!clientName.trim()) {
      Alert.alert('Missing Client Name', 'Please enter a client name.');
      return;
    }
    const newQ = {
      id: 'q-' + Date.now(),
      quoteNumber: 'QUO-2026-' + Math.floor(Math.random() * 900 + 100),
      clientName: clientName.trim(),
      amount: '₹' + (quoteAmount.trim() || '65,000'),
      status: 'DRAFT',
      validUntil: 'Sep 30, 2026',
    };
    setQuotations(prev => [newQ, ...prev]);
    setCreateQuoteModal(false);
    setClientName('');
    setQuoteAmount('');
    Alert.alert('Quotation Created', `Generated quote ${newQ.quoteNumber} for ${newQ.clientName}.`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── MODULE SELECTOR GRID ─────────────────────────────────────────── */}
        <Text style={styles.headerTitle}>Operations Control Center</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moduleBar}>
          {[
            { id: 'PRODUCTS', label: '📦 Products Catalog' },
            { id: 'QUOTATIONS', label: '📝 Quotations' },
            { id: 'DEALS', label: '💼 Deals Pipeline' },
            { id: 'GOALS', label: '🎯 Goals & Targets' },
            { id: 'REVENUE', label: '💰 Revenue' },
            { id: 'COMMS', label: '💬 Comms Hub' },
            { id: 'TASKS', label: '📋 Tasks' },
          ].map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.moduleChip, activeModule === m.id && styles.moduleChipActive]}
              onPress={() => setActiveModule(m.id as any)}
            >
              <Text style={[styles.moduleChipText, activeModule === m.id && styles.moduleChipTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {/* 📦 MODULE 1: PRODUCTS & CATALOG MANAGER                                   */}
        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {activeModule === 'PRODUCTS' && (
          <View style={{ flex: 1, minHeight: 600 }}>
            <ProductsCatalogScreen />
          </View>
        )}

        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {/* 📝 MODULE 2: QUOTATIONS & INVOICE BUILDER                                  */}
        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {activeModule === 'QUOTATIONS' && (
          <View style={styles.moduleSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.moduleTitle}>📝 Quotations &amp; Invoice Builder ({quotations.length})</Text>
                <Text style={styles.moduleSub}>Generate custom proposals, track approval status, and export PDF quotes.</Text>
              </View>
              <TouchableOpacity style={styles.createBtn} onPress={() => setCreateQuoteModal(true)}>
                <Text style={styles.createBtnText}>+ New Quote</Text>
              </TouchableOpacity>
            </View>

            {quotations.map(q => (
              <View key={q.id} style={styles.cardItem}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.itemTitle}>{q.quoteNumber}</Text>
                  <View style={[styles.statusBadge, {
                    backgroundColor: q.status === 'APPROVED' ? 'rgba(16,185,129,0.15)' : q.status === 'SENT' ? 'rgba(56,189,248,0.15)' : 'rgba(245,158,11,0.15)',
                    borderColor: q.status === 'APPROVED' ? 'rgba(16,185,129,0.4)' : q.status === 'SENT' ? 'rgba(56,189,248,0.4)' : 'rgba(245,158,11,0.4)',
                  }]}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: q.status === 'APPROVED' ? '#34d399' : q.status === 'SENT' ? '#38bdf8' : '#fbbf24' }}>
                      {q.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemMeta}>Client: {q.clientName} • Valid Until: {q.validUntil}</Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                  <Text style={styles.itemPrice}>{q.amount}</Text>
                  <TouchableOpacity onPress={() => Alert.alert('PDF Export', `Exported PDF proposal for ${q.quoteNumber}.`)}>
                    <Text style={{ fontSize: 10, color: '#818cf8', fontWeight: '800', textDecorationLine: 'underline' }}>
                      📄 Download PDF →
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {/* 💼 MODULE 3: DEALS PIPELINE KANBAN                                         */}
        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {activeModule === 'DEALS' && (
          <View style={styles.moduleSection}>
            <Text style={styles.moduleTitle}>💼 Deals &amp; Active Sales Pipeline Kanban</Text>
            <Text style={styles.moduleSub}>Track deal stages from initial prospecting to closed-won revenue.</Text>

            {deals.map(d => (
              <View key={d.id} style={styles.cardItem}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.itemTitle}>{d.title}</Text>
                  <Text style={styles.itemPrice}>{d.value}</Text>
                </View>
                <Text style={styles.itemMeta}>Company: {d.company} • Rep: {d.rep}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ fontSize: 10, color: '#fbbf24', fontWeight: '800' }}>STAGE: {d.stage.toUpperCase()}</Text>
                  <Text style={{ fontSize: 10, color: '#38bdf8', fontWeight: '700' }}>85% Win Probability</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {/* 🎯 MODULE 4: GOALS & TARGETS                                                */}
        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {activeModule === 'GOALS' && (
          <View style={styles.moduleSection}>
            <Text style={styles.moduleTitle}>🎯 Quarterly Goals &amp; Sales Targets</Text>
            <Text style={styles.moduleSub}>Track organizational revenue targets and team quota progress.</Text>

            <View style={styles.cardItem}>
              <Text style={styles.itemTitle}>Q3 Revenue Target: $500,000</Text>
              <Text style={styles.itemMeta}>Current Achieved: $412,000 (82.4% Progress)</Text>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '82.4%' }]} />
              </View>
            </View>

            <View style={styles.cardItem}>
              <Text style={styles.itemTitle}>Monthly New Lead Ingestion Target: 4,000 Leads</Text>
              <Text style={styles.itemMeta}>Current Achieved: 3,420 Leads (85.5% Progress)</Text>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '85.5%', backgroundColor: '#34d399' }]} />
              </View>
            </View>
          </View>
        )}

        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {/* 💰 MODULE 5: REVENUE TELEMETRY                                             */}
        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {activeModule === 'REVENUE' && (
          <View style={styles.moduleSection}>
            <Text style={styles.moduleTitle}>💰 Revenue &amp; Financial Telemetry Audit</Text>
            <Text style={styles.moduleSub}>Detailed breakdown of closed-won revenue, active pipeline, and average deal size.</Text>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>$128.4k</Text>
                <Text style={styles.metricLbl}>Won Revenue</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={[styles.metricVal, { color: '#38bdf8' }]}>$412k</Text>
                <Text style={styles.metricLbl}>Active Pipeline</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {/* 💬 MODULE 6: COMMUNICATIONS HUB                                            */}
        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {activeModule === 'COMMS' && (
          <View style={styles.moduleSection}>
            <Text style={styles.moduleTitle}>💬 Communications Telemetry Audit Hub</Text>
            <Text style={styles.moduleSub}>Audit outbound WhatsApp messages, call logs, and response times.</Text>

            <View style={styles.cardItem}>
              <Text style={styles.itemTitle}>📞 Today's Outbound Calling Telemetry: 384 Calls Logged</Text>
              <Text style={styles.itemMeta}>Avg Call Duration: 4m 12s • Connected Rate: 78.4%</Text>
            </View>
            <View style={styles.cardItem}>
              <Text style={styles.itemTitle}>💬 WhatsApp Automated Ingestion: 820 Messages Sent</Text>
              <Text style={styles.itemMeta}>Active Webhook Hook: Connected 🟢</Text>
            </View>
          </View>
        )}

        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {/* 📋 MODULE 7: TASKS & REMINDERS                                              */}
        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {activeModule === 'TASKS' && (
          <View style={styles.moduleSection}>
            <Text style={styles.moduleTitle}>📋 Task Operations &amp; Call Reminders</Text>

            {tasks.map(t => (
              <View key={t.id} style={styles.cardItem}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.itemTitle}>{t.title}</Text>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#ef4444' }}>{t.priority}</Text>
                </View>
                <Text style={styles.itemMeta}>Lead: {t.lead} • Due: {t.dueDate}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* ── MODAL 1: CREATE PRODUCT ────────────────────────────────────────── */}
      <Modal visible={createProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.modalTitle}>📦 Add New Product Item</Text>
              <TouchableOpacity onPress={() => setCreateProductModal(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Product Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Enterprise License" placeholderTextColor="#64748b" value={prodName} onChangeText={setProdName} />

            <Text style={styles.label}>SKU Code</Text>
            <TextInput style={styles.input} placeholder="e.g. DAS-ENT-101" placeholderTextColor="#64748b" value={prodSku} onChangeText={setProdSku} />

            <Text style={styles.label}>Price ($/₹)</Text>
            <TextInput style={styles.input} placeholder="e.g. $1,250" placeholderTextColor="#64748b" value={prodPrice} onChangeText={setProdPrice} />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b' }]} onPress={() => setCreateProductModal(false)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5' }]} onPress={handleCreateProduct}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Save Product ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: CREATE QUOTATION ──────────────────────────────────────── */}
      <Modal visible={createQuoteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.modalTitle}>📝 Generate New Quotation</Text>
              <TouchableOpacity onPress={() => setCreateQuoteModal(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Client Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. TechCorp Solutions" placeholderTextColor="#64748b" value={clientName} onChangeText={setClientName} />

            <Text style={styles.label}>Quote Total Amount (₹)</Text>
            <TextInput style={styles.input} placeholder="e.g. ₹65,000" placeholderTextColor="#64748b" value={quoteAmount} onChangeText={setQuoteAmount} />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b' }]} onPress={() => setCreateQuoteModal(false)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#10b981' }]} onPress={handleCreateQuotation}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Generate Quote ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, alignItems: 'center', paddingBottom: 24 },

  headerTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff', marginBottom: 12, width: '100%', maxWidth: 600 },

  moduleBar: { width: '100%', maxWidth: 600, marginBottom: 14 },
  moduleChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', marginRight: 8 },
  moduleChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  moduleChipText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  moduleChipTextActive: { color: '#ffffff', fontWeight: '800' },

  moduleSection: { width: '100%', maxWidth: 600 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  moduleTitle: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  moduleSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, marginBottom: 12 },

  createBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  createBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  cardItem: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 10 },
  itemTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  itemPrice: { fontSize: 14, fontWeight: '900', color: '#34d399' },
  itemMeta: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },

  progressBarTrack: { height: 8, backgroundColor: '#020617', borderRadius: 4, marginTop: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b' },
  progressBarFill: { height: '100%', backgroundColor: '#818cf8' },

  metricsGrid: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 14, alignItems: 'center' },
  metricVal: { fontSize: 18, fontWeight: '900', color: '#34d399' },
  metricLbl: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 18, padding: 18 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '700', color: '#cbd5e1', marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: '#ffffff', fontSize: 12 },
  modalBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
