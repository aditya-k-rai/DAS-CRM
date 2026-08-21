/**
 * MoreControlsScreen.tsx — DAS CRM Android (More Hub Directory)
 * Pure action button launcher hub to navigate & launch dedicated tools:
 * 1. 📦 Products & Services Catalog
 * 2. 💼 Deals Kanban & Sales Pipeline
 * 3. 📝 Quotations & PDF Proposals
 * 4. ⚡ Tasks & 5-Min Prior Reminders
 * 5. 👥 Employee Directory & Supervisor Hierarchy
 * 6. ⏱️ Attendance & Geofenced Punch
 * 7. ⚡ Workflow Automation Rules
 * 8. 🔒 Security & Telemetry Audit Logs
 * 9. 👤 User Profile & Account Settings
 * 10. 🚀 In-App Version & Software Updates
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import TasksScreen from './TasksScreen';
import ProductsCatalogScreen from './ProductsCatalogScreen';

interface MoreControlsScreenProps {
  navigation?: any;
  onOpenProductsCatalog?: () => void;
  onOpenProfile?: () => void;
  onOpenAppUpdates?: () => void;
  onNavigateTab?: (tabName: string) => void;
}

export default function MoreControlsScreen({
  navigation,
  onOpenProductsCatalog,
  onOpenProfile,
  onOpenAppUpdates,
  onNavigateTab,
}: MoreControlsScreenProps) {
  // Local Modals for embedded modules (Deals, Quotes, Automations, Audit, Tasks, Products)
  const [activeModal, setActiveModal] = useState<'DEALS' | 'QUOTES' | 'TASKS' | 'PRODUCTS' | 'AUTOMATIONS' | 'AUDIT' | null>(null);

  const handleLaunchProducts = () => {
    if (onOpenProductsCatalog) onOpenProductsCatalog();
    else setActiveModal('PRODUCTS');
  };

  const handleLaunchProfile = () => {
    if (onOpenProfile) onOpenProfile();
    else Alert.alert('User Profile', 'Open profile via top hamburger menu or profile icon.');
  };

  const handleLaunchUpdates = () => {
    if (onOpenAppUpdates) onOpenAppUpdates();
    else Alert.alert('App Updates', 'DAS CRM v2.5.0 (Build 112) is up to date.');
  };

  const handleNavigateTo = (tabName: string) => {
    if (onNavigateTab) {
      onNavigateTab(tabName);
    } else if (navigation) {
      navigation.navigate(tabName);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>⚡ More Options & Control Hub</Text>
          <Text style={styles.headerSubtitle}>
            Directory of all dedicated CRM tools, catalog portals, automations & modules. Tap any button to launch.
          </Text>
        </View>

        {/* ── CATEGORY 1: BUSINESS & SALES TOOLS ───────────────────────────── */}
        <Text style={styles.categoryTitle}>💼 Business &amp; Sales Management Modules</Text>
        <View style={styles.gridRow}>

          {/* 1. Products & Services Catalog */}
          <TouchableOpacity style={[styles.actionCard, { borderColor: 'rgba(52,211,153,0.4)', backgroundColor: 'rgba(52,211,153,0.08)' }]} onPress={handleLaunchProducts} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(52,211,153,0.2)' }]}>
              <Text style={{ fontSize: 22 }}>📦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleText}>Products & Catalog</Text>
              <Text style={styles.cardSubText}>Manage SKUs, pricing decks, brochure PDFs & WhatsApp items.</Text>
            </View>
            <Text style={styles.arrowText}>Launch →</Text>
          </TouchableOpacity>

          {/* 2. Deals Kanban Pipeline */}
          <TouchableOpacity style={[styles.actionCard, { borderColor: 'rgba(129,140,248,0.4)', backgroundColor: 'rgba(129,140,248,0.08)' }]} onPress={() => setActiveModal('DEALS')} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(129,140,248,0.2)' }]}>
              <Text style={{ fontSize: 22 }}>💼</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleText}>Deals Kanban & Pipeline</Text>
              <Text style={styles.cardSubText}>5-stage pipeline (Prospecting, Proposal, Negotiation, Won).</Text>
            </View>
            <Text style={styles.arrowText}>Open →</Text>
          </TouchableOpacity>

          {/* 3. Quotations Drafts & PDF */}
          <TouchableOpacity style={[styles.actionCard, { borderColor: 'rgba(56,189,248,0.4)', backgroundColor: 'rgba(56,189,248,0.08)' }]} onPress={() => setActiveModal('QUOTES')} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(56,189,248,0.2)' }]}>
              <Text style={{ fontSize: 22 }}>📝</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleText}>Quotations & Proposals</Text>
              <Text style={styles.cardSubText}>Draft client estimates with GST calculations & PDF export.</Text>
            </View>
            <Text style={styles.arrowText}>Open →</Text>
          </TouchableOpacity>

          {/* 4. Tasks & 5-Min Reminders */}
          <TouchableOpacity style={[styles.actionCard, { borderColor: 'rgba(251,191,36,0.4)', backgroundColor: 'rgba(251,191,36,0.08)' }]} onPress={() => setActiveModal('TASKS')} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(251,191,36,0.2)' }]}>
              <Text style={{ fontSize: 22 }}>⚡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleText}>Tasks & 5-Min Reminders</Text>
              <Text style={styles.cardSubText}>Automated call reminders, task lists & follow-up scheduler.</Text>
            </View>
            <Text style={styles.arrowText}>Open →</Text>
          </TouchableOpacity>

        </View>

        {/* ── CATEGORY 2: OPERATIONS & PEOPLE NAVIGATION ─────────────────────── */}
        <Text style={styles.categoryTitle}>👥 Operations &amp; Workforce Navigation</Text>
        <View style={styles.gridRow}>

          {/* 5. Employees Directory */}
          <TouchableOpacity style={[styles.actionCard, { borderColor: 'rgba(192,132,252,0.4)', backgroundColor: 'rgba(192,132,252,0.08)' }]} onPress={() => handleNavigateTo('Employees')} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(192,132,252,0.2)' }]}>
              <Text style={{ fontSize: 22 }}>👥</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleText}>Employee Directory</Text>
              <Text style={styles.cardSubText}>View staff hierarchy, assign leads & inspect performance.</Text>
            </View>
            <Text style={styles.arrowText}>Go to Screen →</Text>
          </TouchableOpacity>

          {/* 6. Attendance & Geofenced Punch */}
          <TouchableOpacity style={[styles.actionCard, { borderColor: 'rgba(45,212,191,0.4)', backgroundColor: 'rgba(45,212,191,0.08)' }]} onPress={() => handleNavigateTo('Attendance')} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(45,212,191,0.2)' }]}>
              <Text style={{ fontSize: 22 }}>⏱️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleText}>Attendance Portal</Text>
              <Text style={styles.cardSubText}>Geofenced selfie punch in/out & admin override controls.</Text>
            </View>
            <Text style={styles.arrowText}>Go to Screen →</Text>
          </TouchableOpacity>

        </View>

        {/* ── CATEGORY 3: SYSTEM, AUTOMATION & AUDIT ───────────────────────── */}
        <Text style={styles.categoryTitle}>🔒 System, Automation &amp; Settings</Text>
        <View style={styles.gridRow}>

          {/* 7. Workflow Automations */}
          <TouchableOpacity style={[styles.actionCard, { borderColor: 'rgba(244,114,182,0.4)', backgroundColor: 'rgba(244,114,182,0.08)' }]} onPress={() => setActiveModal('AUTOMATIONS')} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(244,114,182,0.2)' }]}>
              <Text style={{ fontSize: 22 }}>🤖</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleText}>Workflow Automations</Text>
              <Text style={styles.cardSubText}>Round-robin lead assignment, WhatsApp bots & timeouts.</Text>
            </View>
            <Text style={styles.arrowText}>Open →</Text>
          </TouchableOpacity>

          {/* 8. Security Audit Logs */}
          <TouchableOpacity style={[styles.actionCard, { borderColor: 'rgba(148,163,184,0.4)', backgroundColor: 'rgba(148,163,184,0.08)' }]} onPress={() => setActiveModal('AUDIT')} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(148,163,184,0.2)' }]}>
              <Text style={{ fontSize: 22 }}>🔒</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleText}>Security & Audit Logs</Text>
              <Text style={styles.cardSubText}>Real-time system access logs, call telemetry & security.</Text>
            </View>
            <Text style={styles.arrowText}>Open →</Text>
          </TouchableOpacity>

          {/* 9. User Profile & Account */}
          <TouchableOpacity style={[styles.actionCard, { borderColor: 'rgba(129,140,248,0.4)', backgroundColor: 'rgba(129,140,248,0.08)' }]} onPress={handleLaunchProfile} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(129,140,248,0.2)' }]}>
              <Text style={{ fontSize: 22 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleText}>My Profile & Account</Text>
              <Text style={styles.cardSubText}>View credentials, permissions, server sync & logout.</Text>
            </View>
            <Text style={styles.arrowText}>Open →</Text>
          </TouchableOpacity>

          {/* 10. Software Version & Updates */}
          <TouchableOpacity style={[styles.actionCard, { borderColor: 'rgba(56,189,248,0.4)', backgroundColor: 'rgba(56,189,248,0.08)' }]} onPress={handleLaunchUpdates} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(56,189,248,0.2)' }]}>
              <Text style={{ fontSize: 22 }}>🚀</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleText}>Check In-App Updates</Text>
              <Text style={styles.cardSubText}>Version checker, release notes & direct APK downloader.</Text>
            </View>
            <Text style={styles.arrowText}>Open →</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

      {/* ── MODALS FOR EMBEDDED SECTIONS ────────────────────────────────────── */}

      {/* 1. Products Portal Modal */}
      <Modal visible={activeModal === 'PRODUCTS'} transparent animationType="slide">
        <ProductsCatalogScreen onClose={() => setActiveModal(null)} />
      </Modal>

      {/* 2. Tasks & Reminders Modal */}
      <Modal visible={activeModal === 'TASKS'} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#090d16', paddingTop: 40 }}>
          <TouchableOpacity onPress={() => setActiveModal(null)} style={{ alignSelf: 'flex-end', paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '900' }}>✕ Close Tasks</Text>
          </TouchableOpacity>
          <TasksScreen />
        </View>
      </Modal>

      {/* 3. Deals Kanban Modal */}
      <Modal visible={activeModal === 'DEALS'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>💼 Deals Kanban & Pipeline Stages</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {[
                { title: 'Enterprise CRM License', company: 'TechCorp Ltd', val: '₹5,20,000', stage: 'Prospecting', color: '#38bdf8' },
                { title: 'Real Estate Portal Setup', company: 'Sunita RE', val: '₹8,50,000', stage: 'Qualification', color: '#818cf8' },
                { title: 'Interior Design Platform', company: 'Construkt Inc', val: '₹3,60,000', stage: 'Proposal', color: '#c084fc' },
                { title: 'Hotel Management System', company: 'Grand Palace', val: '₹12,00,000', stage: 'Negotiation', color: '#fbbf24' },
                { title: 'Automobile CRM Rollout', company: 'Lakshmi Auto', val: '₹24,00,000', stage: 'Won Deals', color: '#34d399' },
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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 4. Quotations Modal */}
      <Modal visible={activeModal === 'QUOTES'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>📝 Quotations Drafts & Proposals</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 5. Automations Modal */}
      <Modal visible={activeModal === 'AUTOMATIONS'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>🤖 Workflow Automations & Rules</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 6. Audit Logs Modal */}
      <Modal visible={activeModal === 'AUDIT'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>🔒 Security & Telemetry Audit Logs</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
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
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, paddingBottom: 32 },

  headerCard: { width: '100%', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  headerSubtitle: { fontSize: 11, color: '#94a3b8', marginTop: 3, lineHeight: 16 },

  categoryTitle: { fontSize: 12, fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', tracking: 1, marginTop: 12, marginBottom: 10 },

  gridRow: { gap: 10, marginBottom: 8 },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleText: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  cardSubText: { fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 14 },
  arrowText: { fontSize: 11, fontWeight: '800', color: '#818cf8' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, maxHeight: '80%', borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b', pb: 10 },
  modalTitleText: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  modalCloseBtn: { backgroundColor: '#1e293b', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  itemRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  itemSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  stageBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  stageText: { fontSize: 10, fontWeight: '800' },
});
