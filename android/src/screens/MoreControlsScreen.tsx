/**
 * MoreControlsScreen.tsx — DAS CRM Android
 * Operations Control Center with Top Horizontal Pill Action Buttons:
 * 1. 📦 Products Catalog (Full Catalog & Customization Portal)
 * 2. 📝 Quotations (Proposals, GST Estimates & PDF Export)
 * 3. 💼 Deals Pipeline (5-Stage Kanban Board)
 * 4. 📊 In-Depth Reports (Sales Volume, Call Telemetry & Rep Leaderboard)
 * 5. ⚡ Automations (Workflow Rules & WhatsApp Bot Triggers)
 * 6. 🔒 Audit Logs (Security & Access Telemetry)
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
import ProductsCatalogScreen from './ProductsCatalogScreen';

interface MoreControlsScreenProps {
  navigation?: any;
  onOpenProfile?: () => void;
  onOpenAppUpdates?: () => void;
  onNavigateTab?: (tabName: string) => void;
}

export default function MoreControlsScreen({
  navigation,
  onOpenProfile,
  onOpenAppUpdates,
  onNavigateTab,
}: MoreControlsScreenProps) {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'QUOTES' | 'DEALS' | 'REPORTS' | 'AUTOMATIONS' | 'AUDIT'>('PRODUCTS');

  return (
    <View style={styles.container}>
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Operations Control Center</Text>

        {/* ── HORIZONTAL TAB PILL BUTTON BAR ──────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabPillRow}>
          {/* 1. Products Catalog Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'PRODUCTS' && styles.pillBtnActive]}
            onPress={() => setActiveTab('PRODUCTS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'PRODUCTS' && styles.pillBtnTextActive]}>
              📦 Products Catalog
            </Text>
          </TouchableOpacity>

          {/* 2. Quotations Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'QUOTES' && styles.pillBtnActive]}
            onPress={() => setActiveTab('QUOTES')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'QUOTES' && styles.pillBtnTextActive]}>
              📝 Quotations
            </Text>
          </TouchableOpacity>

          {/* 3. Deals Pipeline Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'DEALS' && styles.pillBtnActive]}
            onPress={() => setActiveTab('DEALS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'DEALS' && styles.pillBtnTextActive]}>
              💼 Deals Pipeline
            </Text>
          </TouchableOpacity>

          {/* 4. In-Depth Reports Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'REPORTS' && styles.pillBtnActive]}
            onPress={() => setActiveTab('REPORTS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'REPORTS' && styles.pillBtnTextActive]}>
              📊 In-Depth Reports
            </Text>
          </TouchableOpacity>

          {/* 5. Automations Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'AUTOMATIONS' && styles.pillBtnActive]}
            onPress={() => setActiveTab('AUTOMATIONS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'AUTOMATIONS' && styles.pillBtnTextActive]}>
              ⚡ Automations
            </Text>
          </TouchableOpacity>

          {/* 6. Audit Logs Button */}
          <TouchableOpacity
            style={[styles.pillBtn, activeTab === 'AUDIT' && styles.pillBtnActive]}
            onPress={() => setActiveTab('AUDIT')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'AUDIT' && styles.pillBtnTextActive]}>
              🔒 Audit Logs
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── MODULE CONTENTS ─────────────────────────────────────────────────── */}
      <View style={{ flex: 1 }}>

        {/* 📦 MODULE 1: PRODUCTS & CATALOG CUSTOMIZATION */}
        {activeTab === 'PRODUCTS' && (
          <ProductsCatalogScreen />
        )}

        {/* 📝 MODULE 2: QUOTATIONS & PROPOSALS */}
        {activeTab === 'QUOTES' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>📝 Quotation Drafts &amp; PDF Proposals</Text>
                  <Text style={styles.moduleSub}>Generate custom client proposals with GST tax breakdown &amp; WhatsApp PDF export.</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('New Quotation', 'Opening quotation draft builder...')}>
                  <Text style={styles.actionBtnText}>+ New Quote</Text>
                </TouchableOpacity>
              </View>

              {[
                { id: 'Q-2026-0001', lead: 'Rajesh Kumar (TechCorp)', date: '19 Aug 2026', total: '₹5,20,000', status: 'SENT' },
                { id: 'Q-2026-0002', lead: 'Priya Sharma (LogiTech)', date: '18 Aug 2026', total: '₹3,50,000', status: 'ACCEPTED' },
                { id: 'Q-2026-0003', lead: 'Sunita Kapoor (Sunita RE)', date: '15 Aug 2026', total: '₹8,90,000', status: 'DRAFT' },
                { id: 'Q-2026-0004', lead: 'Vikram Malhotra (Apex)', date: '12 Aug 2026', total: '₹1,42,000', status: 'SENT' },
              ].map((q, idx) => (
                <View key={q.id} style={[styles.itemRow, idx < 3 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{q.id} • {q.lead}</Text>
                    <Text style={styles.itemSub}>{q.date} • Total: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{q.total}</Text></Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: q.status === 'ACCEPTED' ? 'rgba(52,211,153,0.15)' : q.status === 'SENT' ? 'rgba(56,189,248,0.15)' : 'rgba(251,191,36,0.15)' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: q.status === 'ACCEPTED' ? '#34d399' : q.status === 'SENT' ? '#38bdf8' : '#fbbf24' }}>
                      {q.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* 💼 MODULE 3: DEALS KANBAN & SALES PIPELINE */}
        {activeTab === 'DEALS' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>💼 Deals Kanban &amp; Sales Pipeline</Text>
                  <Text style={styles.moduleSub}>5-Stage active pipeline management across all tenant accounts.</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('New Deal', 'Creating new deal record...')}>
                  <Text style={styles.actionBtnText}>+ New Deal</Text>
                </TouchableOpacity>
              </View>

              {[
                { title: 'Enterprise CRM License', company: 'TechCorp Solutions', val: '₹5,20,000', stage: 'Prospecting', color: '#38bdf8' },
                { title: 'WhatsApp Bot Integration', company: 'LogiTech Freight', val: '₹3,50,000', stage: 'Qualification', color: '#818cf8' },
                { title: 'Real Estate Portal Rollout', company: 'Sunita Logistics', val: '₹8,90,000', stage: 'Proposal', color: '#c084fc' },
                { title: 'Multi-Tenant SLA Contract', company: 'Apex Global', val: '₹12,00,000', stage: 'Negotiation', color: '#fbbf24' },
                { title: 'Automobile CRM Rollout', company: 'Lakshmi Auto', val: '₹24,00,000', stage: 'Closed Won', color: '#34d399' },
              ].map((deal, idx) => (
                <View key={idx} style={[styles.itemRow, idx < 4 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{deal.title}</Text>
                    <Text style={styles.itemSub}>{deal.company} • Value: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{deal.val}</Text></Text>
                  </View>
                  <View style={[styles.stageBadge, { backgroundColor: deal.color + '20', borderColor: deal.color + '60' }]}>
                    <Text style={[styles.stageText, { color: deal.color }]}>{deal.stage}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* 📊 MODULE 4: IN-DEPTH OPERATIONS & TELEMETRY REPORTS */}
        {activeTab === 'REPORTS' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>📊 In-Depth Operations &amp; Sales Telemetry Report</Text>
                  <Text style={styles.moduleSub}>Real-time revenue metrics, call telemetry &amp; staff performance leaderboard.</Text>
                </View>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#34d399' }]}
                  onPress={() => Alert.alert('Export Telemetry', 'Comprehensive In-Depth Operations CSV exported to downloads.')}
                >
                  <Text style={[styles.actionBtnText, { color: '#090d16' }]}>📥 Export CSV</Text>
                </TouchableOpacity>
              </View>

              {/* Financial Telemetry Summary */}
              <View style={[styles.detailBox, { borderColor: 'rgba(52,211,153,0.3)', backgroundColor: 'rgba(52,211,153,0.06)' }]}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#34d399', marginBottom: 6 }}>💰 Revenue & Financial Telemetry</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Today's Closed Sales Volume:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#34d399' }}>$18,450</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Weekly Accumulated Sales:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>$84,200</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Monthly Closed Total:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#818cf8' }}>$128,400</Text>
                </View>
              </View>

              {/* Outbound Voice Telemetry Summary */}
              <View style={[styles.detailBox, { borderColor: 'rgba(129,140,248,0.3)', backgroundColor: 'rgba(129,140,248,0.06)' }]}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#818cf8', marginBottom: 6 }}>📞 Outbound Calling & Telemetry Audit</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Total Calls Attempted Today:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>384 Calls</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Connected & Talked:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#34d399' }}>246 Calls (64.1%)</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Cumulative Talk Time:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#38bdf8' }}>15h 12m (Avg 3m 42s/call)</Text>
                </View>
              </View>

              {/* Rep Performance Table */}
              <View style={styles.detailBox}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#ffffff', marginBottom: 8 }}>👥 Sales Rep Performance Leaderboard (Today)</Text>
                {[
                  { name: 'Mighty Rai', calls: 112, deals: 3, sales: '$8,500' },
                  { name: 'Priya Sharma', calls: 94, deals: 2, sales: '$4,200' },
                  { name: 'Amit Patel', calls: 86, deals: 2, sales: '$3,450' },
                  { name: 'Rajesh Kumar', calls: 92, deals: 1, sales: '$2,300' },
                ].map((rep, idx) => (
                  <View key={rep.name} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: idx < 3 ? 1 : 0, borderBottomColor: '#1e293b' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#e2e8f0' }}>{idx + 1}. {rep.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: '#818cf8', fontWeight: '700' }}>📞 {rep.calls} calls</Text>
                      <Text style={{ fontSize: 10, color: '#fbbf24', fontWeight: '800' }}>🤝 {rep.deals} deals</Text>
                      <Text style={{ fontSize: 11, color: '#34d399', fontWeight: '900' }}>{rep.sales}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {/* ⚡ MODULE 5: AUTOMATIONS */}
        {activeTab === 'AUTOMATIONS' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <Text style={styles.moduleTitle}>⚡ Workflow Automation Rules &amp; Triggers</Text>
              <Text style={styles.moduleSub}>Active lead distribution rules, WhatsApp auto-responders &amp; timeout hooks.</Text>

              {[
                { name: 'Auto-Assign Fresh Ingested Leads', trigger: 'On Ingestion', action: 'Round-Robin Distribution' },
                { name: 'Send WhatsApp Welcome Proposal', trigger: 'Status = Qualified', action: 'WhatsApp Cloud API' },
                { name: 'Vanish Pool Timeout Re-assignment', trigger: 'No Call in 30m', action: 'Handover to Pool' },
                { name: '5-Min Prior Automated Call Alert', trigger: 'Task Time - 5m', action: 'Push Notification' },
              ].map((rule, idx) => (
                <View key={idx} style={[styles.itemRow, idx < 3 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{rule.name}</Text>
                    <Text style={styles.itemSub}>Trigger: <Text style={{ color: '#818cf8' }}>{rule.trigger}</Text> → {rule.action}</Text>
                  </View>
                  <View style={styles.activePill}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#34d399' }}>ACTIVE</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* 🔒 MODULE 6: AUDIT LOGS */}
        {activeTab === 'AUDIT' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.moduleCard}>
              <Text style={styles.moduleTitle}>🔒 Security &amp; Telemetry Audit Logs</Text>
              <Text style={styles.moduleSub}>System audit trail of administrative actions, lead assignments &amp; call logs.</Text>

              {[
                { user: 'Super Admin', action: 'Enforced Hierarchy Assignment Rules', time: '10 mins ago' },
                { user: 'Mighty Rai (Sales)', action: 'Logged Call Outcome (4m 18s — Connected)', time: '25 mins ago' },
                { user: 'Priya Sharma (TL)', action: 'Punched In via Geofence (09:21 AM)', time: '1 hour ago' },
                { user: 'Vikram Singh (Mgr)', action: 'Allocated Lead Batch to Team A', time: '2 hours ago' },
              ].map((log, idx) => (
                <View key={idx} style={[styles.itemRow, idx < 3 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{log.user}</Text>
                    <Text style={styles.itemSub}>{log.action}</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '700' }}>{log.time}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  headerArea: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff', marginBottom: 10 },

  tabPillRow: { flexDirection: 'row', gap: 8, paddingRight: 16 },
  pillBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillBtnActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#818cf8',
  },
  pillBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
  },
  pillBtnTextActive: {
    color: '#ffffff',
  },

  scrollContent: { padding: 16, paddingBottom: 32 },
  moduleCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, pb: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  moduleTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  moduleSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 14 },

  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  actionBtnText: { fontSize: 10, fontWeight: '900', color: '#ffffff' },

  itemRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  itemSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stageBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  stageText: { fontSize: 10, fontWeight: '800' },
  activePill: { backgroundColor: 'rgba(52,211,153,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },

  detailBox: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 10, marginBottom: 10 },
});
