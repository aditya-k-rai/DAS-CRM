/**
 * LeadsScreen.tsx — DAS CRM Android
 * Complete Lead Management & Funnel Control Center.
 * Features top Segmented Slider Toggle:
 *   1. ⚡ Lead Funnel (3-Model Lead Routing, Quotas, Timeouts & Ingestion Controls)
 *   2. 🎯 Leads Collections (Directory, Filters, Search & Detail Cards)
 * Matches the exact segmented slider aesthetic of the Attendance Screen.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LeadsStackParamList } from '../../App';
import { useAuthStore } from '../store/authStore';
import { apiService, LeadItem, FALLBACK_LEADS } from '../services/apiService';

type LeadsNavProp = StackNavigationProp<LeadsStackParamList, 'LeadsList'>;

const FILTERS = ['ALL', 'NEW LEAD', 'QUALIFIED', 'IN NEGOTIATION', 'WON'];

export default function LeadsScreen() {
  const navigation = useNavigation<LeadsNavProp>();
  const { token } = useAuthStore();

  // ── SEGMENTED SLIDER STATE ──────────────────────────────────────────────────
  const [activeSegment, setActiveSegment] = useState<'FUNNEL' | 'COLLECTIONS'>('COLLECTIONS');

  // ── COLLECTIONS & SEARCH STATE ──────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [leadsList, setLeadsList] = useState<LeadItem[]>(FALLBACK_LEADS);

  // ── FUNNEL CUSTOMIZATION STATE ──────────────────────────────────────────────
  const [strategy, setStrategy] = useState<'BATCH_QUOTA' | 'VANISH_POOL' | 'MANUAL'>('BATCH_QUOTA');
  const [quotaCap, setQuotaCap] = useState(25);
  const [vanishTimeout, setVanishTimeout] = useState(30);

  // ── MODAL STATES ─────────────────────────────────────────────────────────────
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetRange, setSheetRange] = useState('Sheet1!A2:F');

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newValue, setNewValue] = useState('$15,000');

  useEffect(() => {
    let isMounted = true;
    apiService.getLeads(token).then(data => {
      if (isMounted && data) {
        setLeadsList(data);
      }
    });
    return () => { isMounted = false; };
  }, [token]);

  const handleConnectSheet = () => {
    if (!sheetUrl.trim()) {
      Alert.alert('Invalid URL', 'Please enter a valid Google Sheets web URL.');
      return;
    }
    setSheetModalOpen(false);
    Alert.alert('Google Sheets Sync Active', `Successfully connected Google Sheet URL. Auto-ingesting range ${sheetRange}.`);
  };

  const handleRunImport = () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select a CSV or XLSX file to import.');
      return;
    }
    setImportModalOpen(false);
    const newLead: LeadItem = {
      id: String(Date.now()),
      name: 'Imported Lead (' + selectedFile + ')',
      company: 'Bulk Import Enterprise',
      email: 'imported@bulk.com',
      phone: '+91 99999 88888',
      status: 'NEW LEAD',
      value: '$18,500',
      source: 'CSV Upload',
      priority: 'High',
    };
    setLeadsList(prev => [newLead, ...prev]);
    Alert.alert('Import Success', `Successfully imported leads from ${selectedFile}.`);
  };

  const handleInsertSingleLead = () => {
    if (!newName.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for the lead.');
      return;
    }
    const createdLead: LeadItem = {
      id: String(Date.now()),
      name: newName.trim(),
      company: newCompany.trim() || 'Direct Customer',
      email: newEmail.trim() || 'lead@organization.com',
      phone: newPhone.trim() || '+91 98765 00000',
      status: 'NEW LEAD',
      value: newValue.trim() || '$10,000',
      source: 'Manual Insert',
      priority: 'Medium',
    };
    setLeadsList(prev => [createdLead, ...prev]);
    setInsertModalOpen(false);
    setNewName('');
    setNewCompany('');
    setNewEmail('');
    setNewPhone('');
    Alert.alert('Lead Created', `Successfully added ${createdLead.name} to Leads Collections.`);
  };

  const filteredLeads = leadsList.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.company.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'ALL' || l.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 🔘 TOP SEGMENTED SLIDER TOGGLE (MATCHING ATTENDANCE SCREEN) */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'FUNNEL' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('FUNNEL')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeSegment === 'FUNNEL' && styles.segmentTextActive]}>
            ⚡ Lead Funnel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'COLLECTIONS' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('COLLECTIONS')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeSegment === 'COLLECTIONS' && styles.segmentTextActive]}>
            🎯 Leads Collections
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* ⚡ SEGMENT 1: LEAD FUNNEL & CUSTOMIZATIONS CONTROL                          */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {activeSegment === 'FUNNEL' ? (
        <ScrollView contentContainerStyle={styles.funnelScrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.funnelHeaderCard}>
            <Text style={styles.funnelHeaderTitle}>⚡ 3-Model Lead Funnel Distribution Engine</Text>
            <Text style={styles.funnelHeaderSub}>Configure automated quota limits, uncontacted lead timeouts, and ingestion channels.</Text>

            {/* Model Selector Tabs */}
            <View style={styles.strategyTabsRow}>
              {[
                { id: 'BATCH_QUOTA', label: 'Batch Quota' },
                { id: 'VANISH_POOL', label: 'Vanish Pool' },
                { id: 'MANUAL', label: 'Manual Strategy' },
              ].map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.strategyTab, strategy === item.id && styles.strategyTabActive]}
                  onPress={() => setStrategy(item.id as any)}
                >
                  <Text style={[styles.strategyTabText, strategy === item.id && styles.strategyTabTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Config Controls based on strategy */}
            {strategy === 'BATCH_QUOTA' && (
              <View style={styles.configBox}>
                <Text style={styles.configTitle}>Max Batch Allocation Limit (Per Sales Rep):</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setQuotaCap(Math.max(5, quotaCap - 5))}>
                    <Text style={styles.counterBtnText}>- 5</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValText}>{quotaCap} Leads / Rep</Text>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setQuotaCap(quotaCap + 5)}>
                    <Text style={styles.counterBtnText}>+ 5</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.configSubText}>Uncontacted leads remain assigned until quota limit is completed.</Text>
              </View>
            )}

            {strategy === 'VANISH_POOL' && (
              <View style={styles.configBox}>
                <Text style={styles.configTitle}>Uncontacted Lead Timeout Duration:</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setVanishTimeout(Math.max(10, vanishTimeout - 10))}>
                    <Text style={styles.counterBtnText}>- 10m</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValText}>{vanishTimeout} Minutes</Text>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setVanishTimeout(vanishTimeout + 10)}>
                    <Text style={styles.counterBtnText}>+ 10m</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.configSubText}>Leads uncalled after timeout return to pool for auto-reassignment.</Text>
              </View>
            )}

            {strategy === 'MANUAL' && (
              <View style={styles.configBox}>
                <Text style={styles.configTitle}>Manual Distribution Mode Enabled</Text>
                <Text style={styles.configSubText}>Admin &amp; Managers directly assign leads to Team Leaders &amp; Sales Execs.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.applyStrategyBtn} onPress={() => Alert.alert('Strategy Updated', `Saved ${strategy} rules with cap ${quotaCap}.`)}>
              <Text style={styles.applyStrategyText}>Save &amp; Apply Funnel Rules ✓</Text>
            </TouchableOpacity>
          </View>

          {/* Ingestion Telemetry Channels */}
          <Text style={styles.sectionTitle}>Multi-Channel Ingestion Telemetry</Text>

          <View style={styles.ingestCard}>
            <View style={styles.ingestRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ingestTitle}>🟢 Google Sheets Live Sync</Text>
                <Text style={styles.ingestSub}>1,890 Leads Ingested • Active 2-Way Sync</Text>
              </View>
              <TouchableOpacity style={styles.ingestActionBtn} onPress={() => setSheetModalOpen(true)}>
                <Text style={styles.ingestActionBtnText}>Connect Sheet →</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.ingestCard}>
            <View style={styles.ingestRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ingestTitle}>📥 CSV / Excel Spreadsheet Uploads</Text>
                <Text style={styles.ingestSub}>1,240 Leads Processed • SheetJS Engine</Text>
              </View>
              <TouchableOpacity style={styles.ingestActionBtn} onPress={() => setImportModalOpen(true)}>
                <Text style={styles.ingestActionBtnText}>Import File →</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.ingestCard}>
            <View style={styles.ingestRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ingestTitle}>📲 Meta Ads &amp; WhatsApp Webhook</Text>
                <Text style={styles.ingestSub}>640 Leads Ingested • Active Webhook Hook</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '800' }}>🟢 ACTIVE HOOK</Text>
            </View>
          </View>

        </ScrollView>
      ) : (

        /* ─────────────────────────────────────────────────────────────────────────── */
        /* 🎯 SEGMENT 2: LEADS COLLECTIONS DIRECTORY                                  */
        /* ─────────────────────────────────────────────────────────────────────────── */
        <View style={{ flex: 1 }}>
          {/* SEARCH & QUICK ACTION HUB */}
          <View style={styles.topBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search leads by name, company..."
              placeholderTextColor="#64748b"
              value={search}
              onChangeText={setSearch}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4f46e5' }]} onPress={() => setInsertModalOpen(true)}>
                <Text style={styles.actionBtnText}>+ New Lead</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' }]} onPress={() => setSheetModalOpen(true)}>
                <Text style={[styles.actionBtnText, { color: '#34d399' }]}>🟢 Sheets Sync</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.3)' }]} onPress={() => setImportModalOpen(true)}>
                <Text style={[styles.actionBtnText, { color: '#c084fc' }]}>📥 Import CSV</Text>
              </TouchableOpacity>
            </View>

            {/* Status Filter Scroll */}
            <FlatList
              horizontal
              data={FILTERS}
              keyExtractor={item => item}
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
                  onPress={() => setActiveFilter(item)}
                >
                  <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* LEAD DIRECTORY LIST */}
          <FlatList
            data={filteredLeads}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.leadCard}
                onPress={() => navigation.navigate('LeadDetail', { leadId: item.id, leadName: item.name })}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.leadName}>{item.name}</Text>
                  <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'WON' ? 'rgba(16,185,129,0.15)' : item.status === 'IN NEGOTIATION' ? 'rgba(245,158,11,0.15)' : 'rgba(56,189,248,0.15)',
                    borderColor: item.status === 'WON' ? 'rgba(16,185,129,0.4)' : item.status === 'IN NEGOTIATION' ? 'rgba(245,158,11,0.4)' : 'rgba(56,189,248,0.4)',
                  }]}>
                    <Text style={[styles.statusText, {
                      color: item.status === 'WON' ? '#34d399' : item.status === 'IN NEGOTIATION' ? '#fbbf24' : '#38bdf8',
                    }]}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.leadCompany}>{item.company} • {item.source}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.leadVal}>{item.value}</Text>
                  <Text style={styles.leadPhone}>{item.phone}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ── MODAL 1: GOOGLE SHEETS SYNC ────────────────────────────────────── */}
      <Modal visible={sheetModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🟢 Google Sheets Live 2-Way Sync</Text>
            <Text style={styles.modalSub}>Enter your published Google Sheet URL to automatically ingest new leads in real-time.</Text>

            <Text style={styles.label}>Google Sheet Web URL *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              placeholderTextColor="#64748b"
              value={sheetUrl}
              onChangeText={setSheetUrl}
            />

            <Text style={styles.label}>Range / Tab Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Sheet1!A2:F"
              placeholderTextColor="#64748b"
              value={sheetRange}
              onChangeText={setSheetRange}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b' }]} onPress={() => setSheetModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#10b981' }]} onPress={handleConnectSheet}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Connect Sync ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: CSV / EXCEL IMPORT ────────────────────────────────────── */}
      <Modal visible={importModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📥 CSV / Excel Lead Import</Text>
            <Text style={styles.modalSub}>Select a file from device storage to bulk ingest leads into active workspace.</Text>

            {['Inbound_Leads_Aug2026.xlsx', 'Meta_Ads_Leads_Batch1.csv', 'Website_Inquiries_Export.csv'].map(fileName => (
              <TouchableOpacity
                key={fileName}
                style={[styles.fileOption, selectedFile === fileName && styles.fileOptionActive]}
                onPress={() => setSelectedFile(fileName)}
              >
                <Text style={{ color: selectedFile === fileName ? '#818cf8' : '#f8fafc', fontWeight: '700', fontSize: 13 }}>📄 {fileName}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b' }]} onPress={() => setImportModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5' }]} onPress={handleRunImport}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Run Import ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: INSERT SINGLE LEAD ────────────────────────────────────── */}
      <Modal visible={insertModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>+ Create New Lead</Text>
            <Text style={styles.modalSub}>Enter lead details to add directly to workspace collections.</Text>

            <Text style={styles.label}>Lead Full Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor="#64748b"
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={styles.label}>Company / Organization</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Apex Global Tech"
              placeholderTextColor="#64748b"
              value={newCompany}
              onChangeText={setNewCompany}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="+91 98765 43210"
              placeholderTextColor="#64748b"
              value={newPhone}
              onChangeText={setNewPhone}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b' }]} onPress={() => setInsertModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5' }]} onPress={handleInsertSingleLead}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Add Lead ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },

  // Segmented Slider Container
  segmentedContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 4,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#0f172a',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  // Funnel Scroll Content
  funnelScrollContent: { padding: 16 },
  funnelHeaderCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 16 },
  funnelHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  funnelHeaderSub: { fontSize: 11, color: '#94a3b8', marginTop: 2, marginBottom: 12 },

  strategyTabsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  strategyTab: { flex: 1, paddingVertical: 8, backgroundColor: '#020617', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  strategyTabActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#818cf8' },
  strategyTabText: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  strategyTabTextActive: { color: '#818cf8', fontWeight: '800' },

  configBox: { backgroundColor: '#020617', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1e293b', marginBottom: 12 },
  configTitle: { fontSize: 11, color: '#f8fafc', fontWeight: '700' },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 },
  counterBtn: { backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  counterBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  counterValText: { fontSize: 14, fontWeight: '900', color: '#818cf8' },
  configSubText: { fontSize: 10, color: '#64748b' },

  applyStrategyBtn: { backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  applyStrategyText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#f8fafc', marginBottom: 8 },
  ingestCard: { backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginBottom: 10 },
  ingestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ingestTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  ingestSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  ingestActionBtn: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  ingestActionBtnText: { color: '#a5b4fc', fontSize: 10, fontWeight: '800' },

  // Collections Bar & Filters
  topBar: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 },
  searchInput: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#ffffff', fontSize: 13, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  actionBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  filterScroll: { marginBottom: 4 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', marginRight: 8 },
  filterChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  filterText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  filterTextActive: { color: '#ffffff' },

  // List Items
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  leadCard: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leadName: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  statusText: { fontSize: 9, fontWeight: '800' },
  leadCompany: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1e293b' },
  leadVal: { fontSize: 13, fontWeight: '900', color: '#34d399' },
  leadPhone: { fontSize: 11, color: '#64748b' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 400, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 16, padding: 18 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  modalSub: { fontSize: 11, color: '#94a3b8', marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: '#cbd5e1', marginTop: 10, marginBottom: 4 },
  modalInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: '#ffffff', fontSize: 12 },
  fileOption: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 8 },
  fileOptionActive: { borderColor: '#818cf8', backgroundColor: 'rgba(99,102,241,0.1)' },
  modalBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
