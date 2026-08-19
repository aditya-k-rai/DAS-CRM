/**
 * MoreControlsScreen.tsx — DAS CRM Android
 * Advanced Control Hub (Deals Kanban, Quotations, Products Catalog, Automations, Audit Logs).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MoreControlsScreen() {
  const [activeTab, setActiveTab] = useState<'DEALS' | 'QUOTES' | 'PRODUCTS' | 'AUTOMATIONS' | 'AUDIT'>('DEALS');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>⚡ Advanced Control Hub</Text>
          <Text style={styles.headerSubtitle}>Modular access to Deals Kanban, Quotations, Catalog, Automations &amp; Audit Logs.</Text>
        </View>

        {/* ── MODULE SELECTOR TABS ─────────────────────────────────────────── */}
        <View style={styles.tabRow}>
          {(['DEALS', 'QUOTES', 'PRODUCTS', 'AUTOMATIONS', 'AUDIT'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab === 'DEALS' ? '💼 Deals' : tab === 'QUOTES' ? '📝 Quotes' : tab === 'PRODUCTS' ? '📦 Products' : tab === 'AUTOMATIONS' ? '⚡ Rules' : '🔒 Audit'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── MODULE 1: DEALS KANBAN ───────────────────────────────────────── */}
        {activeTab === 'DEALS' && (
          <View style={styles.moduleBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.moduleTitle}>💼 Deals &amp; Pipeline Stages</Text>
              <TouchableOpacity style={styles.actionPill} onPress={() => Alert.alert('New Deal', 'Creating new deal record.')}>
                <Text style={styles.actionPillText}>+ New Deal</Text>
              </TouchableOpacity>
            </View>

            {[
              { title: 'Enterprise CRM License', company: 'TechCorp Ltd', val: '$52,000', stage: 'Prospecting', color: '#38bdf8' },
              { title: 'Real Estate Portal Setup', company: 'Sunita RE', val: '$85,000', stage: 'Qualification', color: '#818cf8' },
              { title: 'Interior Design Platform', company: 'Construkt Inc', val: '$36,000', stage: 'Proposal', color: '#c084fc' },
              { title: 'Hotel Management System', company: 'Grand Palace', val: '$120,000', stage: 'Negotiation', color: '#fbbf24' },
              { title: 'Automobile CRM Rollout', company: 'Lakshmi Auto', val: '$240,000', stage: 'Won Deals', color: '#34d399' },
            ].map((deal, idx) => (
              <View key={idx} style={[styles.itemRow, idx < 4 && styles.borderBottom]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{deal.title}</Text>
                  <Text style={styles.itemSub}>{deal.company} • Value: {deal.val}</Text>
                </View>
                <View style={[styles.stageBadge, { backgroundColor: deal.color + '20', borderColor: deal.color + '60' }]}>
                  <Text style={[styles.stageText, { color: deal.color }]}>{deal.stage}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── MODULE 2: QUOTATIONS ─────────────────────────────────────────── */}
        {activeTab === 'QUOTES' && (
          <View style={styles.moduleBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.moduleTitle}>📝 Quotation Drafts &amp; PDF Export</Text>
              <TouchableOpacity style={styles.actionPill} onPress={() => Alert.alert('New Quote', 'Opening quotation draft builder.')}>
                <Text style={styles.actionPillText}>+ New Quote</Text>
              </TouchableOpacity>
            </View>

            {[
              { id: 'Q-2026-0001', lead: 'Rajesh Kumar (TechCorp)', date: '19 Aug 2026', total: '₹5,20,000', status: 'SENT' },
              { id: 'Q-2026-0002', lead: 'Priya Sharma (LogiTech)', date: '18 Aug 2026', total: '₹3,50,000', status: 'ACCEPTED' },
              { id: 'Q-2026-0003', lead: 'Vikram Mehta (Acme)', date: '15 Aug 2026', total: '₹1,42,000', status: 'DRAFT' },
            ].map((q, idx) => (
              <View key={q.id} style={[styles.itemRow, idx < 2 && styles.borderBottom]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{q.id} • {q.lead}</Text>
                  <Text style={styles.itemSub}>{q.date} • Total: {q.total}</Text>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '800', color: q.status === 'ACCEPTED' ? '#34d399' : q.status === 'SENT' ? '#38bdf8' : '#fbbf24' }}>
                  {q.status}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── MODULE 3: PRODUCTS CATALOG ───────────────────────────────────── */}
        {activeTab === 'PRODUCTS' && (
          <View style={styles.moduleBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.moduleTitle}>📦 Products &amp; Services Catalog</Text>
              <TouchableOpacity style={styles.actionPill} onPress={() => Alert.alert('Add Product', 'Adding new catalog item.')}>
                <Text style={styles.actionPillText}>+ Add Product</Text>
              </TouchableOpacity>
            </View>

            {[
              { name: 'CRM Enterprise License', sku: 'SW-001', price: '₹49,999 / yr', tax: '18% GST', units: '142 sold' },
              { name: 'CRM Pro License (Monthly)', sku: 'SW-002', price: '₹4,999 / mo', tax: '18% GST', units: '89 sold' },
              { name: 'Android Mobile App Addon', sku: 'SW-003', price: '₹1,999 / mo', tax: '18% GST', units: '67 sold' },
            ].map((p, idx) => (
              <View key={p.sku} style={[styles.itemRow, idx < 2 && styles.borderBottom]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{p.name} ({p.sku})</Text>
                  <Text style={styles.itemSub}>{p.price} • {p.units}</Text>
                </View>
                <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '700' }}>Active</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── MODULE 4: AUTOMATIONS ────────────────────────────────────────── */}
        {activeTab === 'AUTOMATIONS' && (
          <View style={styles.moduleBox}>
            <Text style={styles.moduleTitle}>⚡ Workflow Automation Rules</Text>
            {[
              { name: 'Auto-Assign Fresh Leads', trigger: 'On Ingestion', action: 'Round Robin Distribution' },
              { name: 'Send WhatsApp Welcome', trigger: 'Status = Qualified', action: 'WhatsApp API Template' },
              { name: 'Vanish Pool Timeout', trigger: 'No Call in 30m', action: 'Re-assign Lead' },
            ].map((rule, idx) => (
              <View key={idx} style={[styles.itemRow, idx < 2 && styles.borderBottom]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{rule.name}</Text>
                  <Text style={styles.itemSub}>Trigger: {rule.trigger} → {rule.action}</Text>
                </View>
                <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '800' }}>ACTIVE</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── MODULE 5: AUDIT LOGS ─────────────────────────────────────────── */}
        {activeTab === 'AUDIT' && (
          <View style={styles.moduleBox}>
            <Text style={styles.moduleTitle}>🔒 Security &amp; Telemetry Audit Logs</Text>
            {[
              { user: 'Admin User', action: 'Updated Company Key Policy', time: '10m ago' },
              { user: 'Rajesh Rep', action: 'Logged Call (04:12)', time: '25m ago' },
              { user: 'Priya Rep', action: 'Changed Status to Won ($12.0L)', time: '1h ago' },
            ].map((log, idx) => (
              <View key={idx} style={[styles.itemRow, idx < 2 && styles.borderBottom]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{log.user}: {log.action}</Text>
                  <Text style={styles.itemSub}>{log.time}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, alignItems: 'center', paddingBottom: 24 },

  headerBox: { width: '100%', maxWidth: 600, marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 2 },
  headerSubtitle: { fontSize: 11, color: '#94a3b8' },

  tabRow: { width: '100%', maxWidth: 600, flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 12, padding: 3, marginBottom: 14, gap: 2 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: 'rgba(99,102,241,0.25)' },
  tabBtnText: { fontSize: 10, color: '#64748b', fontWeight: '700' },
  tabBtnTextActive: { color: '#a5b4fc' },

  moduleBox: { width: '100%', maxWidth: 600, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  moduleTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff', marginBottom: 8 },

  actionPill: { backgroundColor: '#4f46e5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  actionPillText: { fontSize: 10, color: '#ffffff', fontWeight: '800' },

  itemRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  itemSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  stageBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  stageText: { fontSize: 9, fontWeight: '800' },
});
