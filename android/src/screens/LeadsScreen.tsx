/**
 * LeadsScreen.tsx — DAS CRM Android
 * Complete Lead Management & Interactive Excel Spreadsheet Data Grid.
 * Features:
 *   1. 📊 Interactive Excel Spreadsheet Data Grid:
 *      - Reorder columns forward & backward (← and → shift arrow buttons)
 *      - Inline Column Header Rename (Tap header to rename column title)
 *      - Expand / shrink line separator between columns (Excel Column Width Extender │↔│)
 *      - Custom spreadsheet fields: Assigned Rep, City, Budget, Requirement, Call Telemetry Stats
 *   2. ⚡ Lead Funnel (3-Model Lead Routing, Quotas, Timeouts & Ingestion Controls)
 *   3. 🎯 Leads Collections (Directory, Filters, Search & Lead Record Editing)
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LeadsStackParamList } from '../../App';
import { useAuthStore, UserRole, normalizeRoleStr } from '../store/authStore';
import { apiService, LeadItem, FALLBACK_LEADS } from '../services/apiService';
import { callSyncEngine } from '../services/callSyncEngine';
import PostCallOutcomeModal, { CallOutcomeData } from '../components/PostCallOutcomeModal';

type LeadsNavProp = StackNavigationProp<LeadsStackParamList, 'LeadsList'>;

const FILTERS = ['ALL', 'NEW LEAD', 'QUALIFIED', 'IN NEGOTIATION', 'WON'];

export default function LeadsScreen() {
  const navigation = useNavigation<LeadsNavProp>();
  const { token } = useAuthStore();

  // ── SEGMENTED SLIDER STATE ──────────────────────────────────────────────────
  const [activeSegment, setActiveSegment] = useState<'FUNNEL' | 'COLLECTIONS'>('COLLECTIONS');

  // ── VIEW MODE: EXCEL SPREADSHEET vs CARD FEED ──────────────────────────────
  const [viewMode, setViewMode] = useState<'EXCEL_GRID' | 'CARD_LIST'>('EXCEL_GRID');

  // ── COLLECTIONS & SEARCH STATE ──────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [leadsList, setLeadsList] = useState<LeadItem[]>(FALLBACK_LEADS);

  // ── DYNAMIC COLUMN REORDER, RENAME & EXCEL RESIZING STATE ────────────────
  const [colOrderModalOpen, setColOrderModalOpen] = useState(false);
  const [editingColKey, setEditingColKey] = useState<string | null>(null);
  const [editingColTitle, setEditingColTitle] = useState('');

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'name',
    'email',
    'phone',
    'company',
    'source',
    'status',
    'value',
    'assignedRep',
    'city',
    'budget',
    'requirement',
  ]);

  const [columnNames, setColumnNames] = useState<Record<string, string>>({
    name: 'NAME COLUMN',
    email: 'EMAIL COLUMN',
    phone: 'NUMBER / PHONE COLUMN',
    company: 'COMPANY COLUMN',
    source: 'SOURCE',
    status: 'SALES STAGE',
    value: 'LEAD VALUE',
    assignedRep: 'ASSIGNED REP',
    city: 'CITY (CUSTOM)',
    budget: 'BUDGET (CUSTOM)',
    requirement: 'REQUIREMENT (CUSTOM)',
  });

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 140,
    email: 175,
    phone: 165,
    company: 150,
    source: 110,
    status: 125,
    value: 115,
    assignedRep: 135,
    city: 110,
    budget: 100,
    requirement: 150,
  });

  const moveColumnLeft = (colKey: string) => {
    const idx = columnOrder.indexOf(colKey);
    if (idx <= 0) return;
    const newOrder = [...columnOrder];
    const temp = newOrder[idx - 1];
    newOrder[idx - 1] = newOrder[idx];
    newOrder[idx] = temp;
    setColumnOrder(newOrder);
  };

  const moveColumnRight = (colKey: string) => {
    const idx = columnOrder.indexOf(colKey);
    if (idx === -1 || idx >= columnOrder.length - 1) return;
    const newOrder = [...columnOrder];
    const temp = newOrder[idx + 1];
    newOrder[idx + 1] = newOrder[idx];
    newOrder[idx] = temp;
    setColumnOrder(newOrder);
  };

  const toggleColumnWidth = (colKey: string) => {
    const currW = columnWidths[colKey] || 140;
    const nextW = currW === 140 ? 210 : currW === 210 ? 280 : 140;
    setColumnWidths((prev) => ({ ...prev, [colKey]: nextW }));
  };

  const openHeaderRenameModal = (colKey: string) => {
    setEditingColKey(colKey);
    setEditingColTitle(columnNames[colKey] || colKey);
  };

  const saveHeaderRename = () => {
    if (editingColKey && editingColTitle.trim()) {
      setColumnNames((prev) => ({ ...prev, [editingColKey]: editingColTitle.trim().toUpperCase() }));
      setEditingColKey(null);
      setEditingColTitle('');
    }
  };

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
  const [newValue, setNewValue] = useState('');
  const [newSource, setNewSource] = useState('Manual Entry');

  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);

  // Post-Call Outcome Modal State
  const [postCallModalOpen, setPostCallModalOpen] = useState(false);
  const [callingLeadData, setCallingLeadData] = useState<{ id: string; name: string; phone: string } | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    const data = await apiService.getLeads(token || '');
    if (data && data.length > 0) {
      setLeadsList(data);
    }
  };

  const handleCreateLead = () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Missing Fields', 'Please fill in Name and Phone Number.');
      return;
    }

    const newLead: LeadItem = {
      id: 'lead-' + Date.now(),
      name: newName.trim(),
      company: newCompany.trim() || 'Independent Prospect',
      email: newEmail.trim() || 'No Email Provided',
      phone: newPhone.trim(),
      status: 'NEW LEAD',
      value: newValue.trim() ? (newValue.startsWith('₹') || newValue.startsWith('$') ? newValue : '₹' + newValue) : '₹25,000',
      source: newSource,
      priority: 'High',
      assignedRep: 'Rajesh Kumar',
      city: 'Mumbai',
      budget: '50k-1L',
      requirement: 'CRM Enterprise',
      callSyncStatus: 'Synced: Today 2:45 PM • Connected',
    };

    setLeadsList((prev) => [newLead, ...prev]);
    setInsertModalOpen(false);
    setNewName('');
    setNewCompany('');
    setNewEmail('');
    setNewPhone('');
    setNewValue('');
    Alert.alert('Lead Created', `Added ${newLead.name} to workspace collection.`);
  };

  const handleSaveEditedLead = () => {
    if (!editingLead) return;
    setLeadsList((prev) => prev.map((l) => (l.id === editingLead.id ? editingLead : l)));
    setEditingLead(null);
    Alert.alert('Lead Updated', 'Successfully updated lead details.');
  };

  const handleInitiateCallLead = (leadId: string, leadName: string, phone: string) => {
    setCallingLeadData({ id: leadId, name: leadName, phone });
    callSyncEngine.initiateCall(leadId, leadName, phone);
    setPostCallModalOpen(true);
  };

  const handleSaveCallOutcome = (outcome: CallOutcomeData) => {
    setPostCallModalOpen(false);
    Alert.alert(
      'Outcome Logged',
      `Call result "${outcome.outcome}" saved for ${callingLeadData?.name || 'Lead'}.\n${
        outcome.scheduledTime ? `Callback scheduled for ${outcome.scheduledTime}` : ''
      }`
    );
  };

  const filteredLeads = leadsList.filter((item) => {
    // Multi-field search \u2014 covers ALL fields, works in BOTH Excel Grid & Card List view
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.assignedRep && item.assignedRep.toLowerCase().includes(q)) ||
        item.status.toLowerCase().includes(q) ||
        (item.source && item.source.toLowerCase().includes(q)) ||
        (item.city && item.city.toLowerCase().includes(q)) ||
        (item.budget && item.budget.toLowerCase().includes(q)) ||
        (item.requirement && item.requirement.toLowerCase().includes(q)) ||
        (item.value && item.value.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    if (activeFilter === 'ALL') return true;
    return item.status.toUpperCase() === activeFilter.toUpperCase();
  });

  // Render Excel Cell by Column Key
  const renderExcelCell = (item: LeadItem, colKey: string, width: number) => {
    switch (colKey) {
      case 'name':
        return (
          <TouchableOpacity
            key={colKey}
            style={[styles.excelDataCell, { width }]}
            onPress={() => navigation.navigate('LeadDetail', { leadId: item.id, leadName: item.name })}
          >
            <Text style={styles.excelCellName} numberOfLines={1}>{item.name}</Text>
          </TouchableOpacity>
        );
      case 'email':
        return (
          <View key={colKey} style={[styles.excelDataCell, { width }]}>
            <Text style={styles.excelCellEmail} numberOfLines={1}>{item.email}</Text>
          </View>
        );
      case 'phone':
        return (
          <View key={colKey} style={[styles.excelDataCell, { width, flexDirection: 'column', justifyContent: 'center' }]}>
            <Text style={styles.excelCellPhone}>{item.phone}</Text>
            <Text style={styles.excelCellTelemetry} numberOfLines={1}>
              {item.callSyncStatus || 'Synced: Today 2:45 PM • Connected'}
            </Text>
          </View>
        );
      case 'company':
        return (
          <View key={colKey} style={[styles.excelDataCell, { width }]}>
            <Text style={styles.excelCellCompany} numberOfLines={1}>{item.company}</Text>
          </View>
        );
      case 'source':
        return (
          <View key={colKey} style={[styles.excelDataCell, { width }]}>
            <View style={styles.excelSourceBadge}>
              <Text style={styles.excelSourceText}>{item.source}</Text>
            </View>
          </View>
        );
      case 'status':
        return (
          <View key={colKey} style={[styles.excelDataCell, { width }]}>
            <View style={[styles.excelStagePill, {
              backgroundColor: item.status.includes('Won') || item.status === 'WON' ? 'rgba(16,185,129,0.15)' : item.status.includes('Negotiation') ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
              borderColor: item.status.includes('Won') || item.status === 'WON' ? 'rgba(16,185,129,0.4)' : item.status.includes('Negotiation') ? 'rgba(245,158,11,0.4)' : 'rgba(99,102,241,0.4)',
            }]}>
              <Text style={[styles.excelStageText, {
                color: item.status.includes('Won') || item.status === 'WON' ? '#34d399' : item.status.includes('Negotiation') ? '#fbbf24' : '#818cf8',
              }]}>{item.status}</Text>
            </View>
          </View>
        );
      case 'value':
        return (
          <View key={colKey} style={[styles.excelDataCell, { width }]}>
            <Text style={styles.excelCellValue}>{item.value}</Text>
          </View>
        );
      case 'assignedRep':
        return (
          <View key={colKey} style={[styles.excelDataCell, { width }]}>
            <Text style={styles.excelCellRep}>{item.assignedRep || 'Unassigned'}</Text>
          </View>
        );
      case 'city':
        return (
          <View key={colKey} style={[styles.excelDataCell, { width }]}>
            <Text style={styles.excelCellCustom}>{item.city || 'Mumbai'}</Text>
          </View>
        );
      case 'budget':
        return (
          <View key={colKey} style={[styles.excelDataCell, { width }]}>
            <Text style={styles.excelCellCustom}>{item.budget || '50k-1L'}</Text>
          </View>
        );
      case 'requirement':
        return (
          <View key={colKey} style={[styles.excelDataCell, { width }]}>
            <Text style={styles.excelCellCustom} numberOfLines={1}>{item.requirement || 'CRM Suite'}</Text>
          </View>
        );
      default:
        return (
          <View key={colKey} style={[styles.excelDataCell, { width }]}>
            <Text style={styles.excelCellCustom}>-</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── TOP SEGMENTED SLIDER (FUNNEL vs COLLECTIONS) ───────────────────── */}
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <TouchableOpacity
            style={[styles.sliderSegment, activeSegment === 'FUNNEL' && styles.sliderSegmentActive]}
            onPress={() => setActiveSegment('FUNNEL')}
          >
            <Text style={[styles.sliderText, activeSegment === 'FUNNEL' && styles.sliderTextActive]}>
              ⚡ Lead Funnel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sliderSegment, activeSegment === 'COLLECTIONS' && styles.sliderSegmentActive]}
            onPress={() => setActiveSegment('COLLECTIONS')}
          >
            <Text style={[styles.sliderText, activeSegment === 'COLLECTIONS' && styles.sliderTextActive]}>
              🎯 Leads Collections
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* ⚡ SEGMENT 1: LEAD ROUTING FUNNEL WORKSPACE                               */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {activeSegment === 'FUNNEL' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.cardBox}>
            <Text style={styles.cardTitle}>🔄 Lead Distribution Strategy Engine</Text>
            <Text style={styles.cardSub}>Choose how incoming lead traffic is routed across rep quotas.</Text>

            <View style={styles.strategyRow}>
              {[
                { id: 'BATCH_QUOTA', label: '📦 Batch Quota (25 Leads/Rep)' },
                { id: 'VANISH_POOL', label: '⏱️ Vanishing Pool (30m Claim)' },
                { id: 'MANUAL', label: '👤 Manual Allocation Only' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.strategyChip, strategy === s.id && styles.strategyChipActive]}
                  onPress={() => setStrategy(s.id as any)}
                >
                  <Text style={[styles.strategyText, strategy === s.id && styles.strategyTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
        </ScrollView>
      ) : (

        /* ─────────────────────────────────────────────────────────────────────────── */
        /* 🎯 SEGMENT 2: LEADS COLLECTIONS DIRECTORY (EXCEL GRID / CARD FEED)          */
        /* ─────────────────────────────────────────────────────────────────────────── */
        <View style={{ flex: 1 }}>
          {/* SEARCH & EXCEL CONTROLS HUB */}
          <View style={styles.topBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search by name, company, phone, email, status, city, budget, source, rep..."
              placeholderTextColor="#64748b"
              value={search}
              onChangeText={setSearch}
            />

            {/* Search Results Count & Clear Button */}
            {search.trim().length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 2 }}>
                <View style={{
                  backgroundColor: filteredLeads.length > 0 ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
                  borderWidth: 1,
                  borderColor: filteredLeads.length > 0 ? 'rgba(52,211,153,0.35)' : 'rgba(239,68,68,0.35)',
                  borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
                }}>
                  <Text style={{
                    fontSize: 10, fontWeight: '800',
                    color: filteredLeads.length > 0 ? '#34d399' : '#ef4444',
                  }}>
                    {filteredLeads.length > 0
                      ? `✓ ${filteredLeads.length} match${filteredLeads.length !== 1 ? 'es' : ''} found`
                      : '✗ No results found'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSearch('')}
                  style={{ backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#94a3b8' }}>✕ Clear</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4f46e5' }]} onPress={() => setInsertModalOpen(true)}>
                <Text style={styles.actionBtnText}>+ New Lead</Text>
              </TouchableOpacity>

              {/* VIEW MODE TOGGLE */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: viewMode === 'EXCEL_GRID' ? '#0284c7' : '#1e293b' }]}
                onPress={() => setViewMode(viewMode === 'EXCEL_GRID' ? 'CARD_LIST' : 'EXCEL_GRID')}
              >
                <Text style={styles.actionBtnText}>
                  {viewMode === 'EXCEL_GRID' ? '📊 Excel Grid' : '📱 Card View'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }]} onPress={() => setColOrderModalOpen(true)}>
                <Text style={[styles.actionBtnText, { color: '#a5b4fc' }]}>🔀 Reorder</Text>
              </TouchableOpacity>
            </View>

            {/* Status Filter Scroll */}
            <FlatList
              horizontal
              data={FILTERS}
              keyExtractor={(item) => item}
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

          {/* ─────────────────────────────────────────────────────────────────────────── */}
          {/* 📊 EXCEL SPREADSHEET TABLE GRID VIEW                                      */}
          {/* ─────────────────────────────────────────────────────────────────────────── */}
          {viewMode === 'EXCEL_GRID' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.excelScrollView}>
              <View style={styles.excelTableContainer}>

                {/* 📊 EXCEL HEADER ROW WITH SHIFT ARROWS, INLINE RENAME & LINE EXTENDER */}
                <View style={styles.excelHeaderRow}>
                  {columnOrder.map((colKey, colIdx) => {
                    const colWidth = columnWidths[colKey] || 140;
                    const colName = columnNames[colKey] || colKey;

                    return (
                      <View key={colKey} style={[styles.excelHeaderCell, { width: colWidth }]}>
                        {/* Header Title + Inline Rename Action */}
                        <TouchableOpacity onPress={() => openHeaderRenameModal(colKey)} style={{ flex: 1 }}>
                          <Text style={styles.excelHeaderTitle} numberOfLines={1}>
                            {colName}
                          </Text>
                        </TouchableOpacity>

                        {/* Shift Forward / Backward Arrow Controls */}
                        <View style={styles.excelShiftControlsRow}>
                          <TouchableOpacity
                            style={[styles.arrowBtn, colIdx === 0 && { opacity: 0.3 }]}
                            disabled={colIdx === 0}
                            onPress={() => moveColumnLeft(colKey)}
                          >
                            <Text style={styles.arrowBtnText}>←</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.arrowBtn, colIdx === columnOrder.length - 1 && { opacity: 0.3 }]}
                            disabled={colIdx === columnOrder.length - 1}
                            onPress={() => moveColumnRight(colKey)}
                          >
                            <Text style={styles.arrowBtnText}>→</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Line Separator Extender Button (Column Width Resizer) */}
                        <TouchableOpacity
                          style={styles.colWidthExtenderBtn}
                          onPress={() => toggleColumnWidth(colKey)}
                        >
                          <Text style={styles.colWidthExtenderText}>│↔│</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                {/* 📊 EXCEL DATA ROWS */}
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  {filteredLeads.map((leadItem, rowIdx) => (
                    <View key={leadItem.id} style={[styles.excelDataRow, rowIdx % 2 === 1 && styles.excelRowAlt]}>
                      {columnOrder.map((colKey) => {
                        const colWidth = columnWidths[colKey] || 140;
                        return renderExcelCell(leadItem, colKey, colWidth);
                      })}
                    </View>
                  ))}
                </ScrollView>

              </View>
            </ScrollView>
          ) : (

            /* 📱 CLASSIC CARD FEED VIEW */
            <FlatList
              data={filteredLeads}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.leadCard}
                  onPress={() => navigation.navigate('LeadDetail', { leadId: item.id, leadName: item.name })}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.leadName}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <TouchableOpacity style={styles.editRowBtn} onPress={() => setEditingLead(item)}>
                        <Text style={styles.editRowBtnText}>✏️ Edit</Text>
                      </TouchableOpacity>
                      <View style={[styles.statusBadge, {
                        backgroundColor: item.status === 'WON' ? 'rgba(16,185,129,0.15)' : 'rgba(56,189,248,0.15)',
                        borderColor: item.status === 'WON' ? 'rgba(16,185,129,0.4)' : 'rgba(56,189,248,0.4)',
                      }]}>
                        <Text style={[styles.statusText, { color: item.status === 'WON' ? '#34d399' : '#38bdf8' }]}>{item.status}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.leadCompany}>{item.company} • {item.email}</Text>

                  <View style={styles.cardFooter}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.leadVal}>{item.value}</Text>
                      <Text style={styles.leadPhone}>{item.phone}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={{ backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                        onPress={() => handleInitiateCallLead(item.id, item.name, item.phone)}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>📞 Call</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{ backgroundColor: '#25D366', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                        onPress={() => callSyncEngine.initiateWhatsApp(item.name, item.phone)}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>💬 WA</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}

        </View>
      )}

      {/* ── MODAL 1: INLINE HEADER RENAME MODAL ─────────────────────────────── */}
      <Modal visible={!!editingColKey} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>✏️ Rename Column Header</Text>
            <Text style={styles.modalSub}>Customize column header title displayed on spreadsheet grid.</Text>

            <TextInput
              style={styles.modalInput}
              value={editingColTitle}
              onChangeText={setEditingColTitle}
              placeholder="Enter Header Name..."
              placeholderTextColor="#64748b"
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b', flex: 1 }]} onPress={() => setEditingColKey(null)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5', flex: 1 }]} onPress={saveHeaderRename}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Save Title ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: DYNAMIC COLUMN REORDER & RENAME ───────────────────────── */}
      <Modal visible={colOrderModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔀 Reorder &amp; Edit Columns</Text>
            <Text style={styles.modalSub}>Shift column positions forward/backward and customize display names.</Text>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {columnOrder.map((colKey, idx) => (
                <View key={colKey} style={styles.colItemRow}>
                  <TextInput
                    style={styles.colNameInput}
                    value={columnNames[colKey] || colKey}
                    onChangeText={(text) => setColumnNames((prev) => ({ ...prev, [colKey]: text }))}
                  />
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.colShiftBtn, idx === 0 && { opacity: 0.3 }]}
                      disabled={idx === 0}
                      onPress={() => moveColumnLeft(colKey)}
                    >
                      <Text style={styles.colShiftBtnText}>← Shift</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.colShiftBtn, idx === columnOrder.length - 1 && { opacity: 0.3 }]}
                      disabled={idx === columnOrder.length - 1}
                      onPress={() => moveColumnRight(colKey)}
                    >
                      <Text style={styles.colShiftBtnText}>Shift →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5', marginTop: 14 }]} onPress={() => setColOrderModalOpen(false)}>
              <Text style={{ color: '#ffffff', fontWeight: '800' }}>Save Column Layout ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: EDIT LEAD RECORD ──────────────────────────────────────── */}
      <Modal visible={!!editingLead} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {editingLead && (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>✏️ Admin Edit Lead Record</Text>
              <Text style={styles.modalSub}>Update lead details across active workspace collections.</Text>

              <Text style={styles.label}>Lead Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={editingLead.name}
                onChangeText={(text) => setEditingLead({ ...editingLead, name: text })}
              />

              <Text style={styles.label}>Company / Firm</Text>
              <TextInput
                style={styles.modalInput}
                value={editingLead.company}
                onChangeText={(text) => setEditingLead({ ...editingLead, company: text })}
              />

              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                value={editingLead.email}
                onChangeText={(text) => setEditingLead({ ...editingLead, email: text })}
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                value={editingLead.phone}
                onChangeText={(text) => setEditingLead({ ...editingLead, phone: text })}
              />

              <Text style={styles.label}>Lead Value ($/₹)</Text>
              <TextInput
                style={styles.modalInput}
                value={editingLead.value}
                onChangeText={(text) => setEditingLead({ ...editingLead, value: text })}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b' }]} onPress={() => setEditingLead(null)}>
                  <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#10b981' }]} onPress={handleSaveEditedLead}>
                  <Text style={{ color: '#ffffff', fontWeight: '800' }}>Save Lead ✓</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* ── MODAL 4: NEW LEAD CREATION ──────────────────────────────────────── */}
      <Modal visible={insertModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Text style={styles.modalTitle}>+ Create New Lead Record</Text>
              <TouchableOpacity onPress={() => setInsertModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Add a prospect to active CRM collections.</Text>

            <Text style={styles.label}>Lead Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#64748b"
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={styles.label}>Company / Organization</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Apex Global Ltd"
              placeholderTextColor="#64748b"
              value={newCompany}
              onChangeText={setNewCompany}
            />

            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />

            <Text style={styles.label}>Lead Value (₹)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. ₹50,000"
              placeholderTextColor="#64748b"
              value={newValue}
              onChangeText={setNewValue}
            />

            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#10b981', marginTop: 14 }]} onPress={handleCreateLead}>
              <Text style={{ color: '#ffffff', fontWeight: '800' }}>Create Lead Record →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 5: POST-CALL OUTCOME MODAL ───────────────────────────────── */}
      <PostCallOutcomeModal
        visible={postCallModalOpen}
        leadId={callingLeadData?.id || ''}
        leadName={callingLeadData?.name || ''}
        phone={callingLeadData?.phone || ''}
        onSaveOutcome={handleSaveCallOutcome}
        onClose={() => setPostCallModalOpen(false)}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },

  sliderContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  sliderTrack: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 14, padding: 3, borderWidth: 1, borderColor: '#1e293b' },
  sliderSegment: { flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: 'center' },
  sliderSegmentActive: { backgroundColor: '#4f46e5' },
  sliderText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  sliderTextActive: { color: '#ffffff', fontWeight: '900' },

  scrollContent: { padding: 16 },
  cardBox: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '900', color: '#ffffff' },
  cardSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, marginBottom: 10 },

  strategyRow: { gap: 6 },
  strategyChip: { backgroundColor: '#020617', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },
  strategyChipActive: { borderColor: '#818cf8', backgroundColor: 'rgba(99,102,241,0.15)' },
  strategyText: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  strategyTextActive: { color: '#818cf8', fontWeight: '900' },

  ingestCard: { backgroundColor: '#0f172a', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#1e293b', marginBottom: 10 },
  ingestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ingestTitle: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  ingestSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  ingestActionBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  ingestActionBtnText: { color: '#38bdf8', fontSize: 10, fontWeight: '800' },

  topBar: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6 },
  searchInput: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7, color: '#ffffff', fontSize: 11, marginBottom: 8 },

  actionRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', alignItems: 'center' },
  actionBtnText: { fontSize: 10, fontWeight: '800', color: '#ffffff' },

  filterScroll: { marginBottom: 6 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', marginRight: 6 },
  filterChipActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#818cf8' },
  filterText: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  filterTextActive: { color: '#818cf8', fontWeight: '900' },

  // 📊 EXCEL SPREADSHEET TABLE STYLES (MATCHES USER SCREENSHOT)
  excelScrollView: { flex: 1, backgroundColor: '#030712' },
  excelTableContainer: { minWidth: 1400, paddingBottom: 20 },

  excelHeaderRow: { flexDirection: 'row', backgroundColor: '#0b1329', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingVertical: 6 },
  excelHeaderCell: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0b1329',
  },
  excelHeaderTitle: { fontSize: 10, fontWeight: '900', color: '#818cf8', letterSpacing: 0.5 },

  excelShiftControlsRow: { flexDirection: 'row', gap: 2, marginLeft: 4 },
  arrowBtn: { backgroundColor: '#1e293b', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#334155' },
  arrowBtnText: { color: '#38bdf8', fontSize: 10, fontWeight: '900' },

  colWidthExtenderBtn: { marginLeft: 4, paddingHorizontal: 3, paddingVertical: 2, borderRadius: 4, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' },
  colWidthExtenderText: { color: '#64748b', fontSize: 8, fontWeight: '800' },

  excelDataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1e293b', backgroundColor: '#090d16', minHeight: 48 },
  excelRowAlt: { backgroundColor: '#0b1120' },
  excelDataCell: { paddingHorizontal: 8, paddingVertical: 8, borderRightWidth: 1, borderRightColor: '#1e293b', justifyContent: 'center' },

  excelCellName: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  excelCellEmail: { fontSize: 10, color: '#38bdf8', fontWeight: '600' },
  excelCellPhone: { fontSize: 11, fontWeight: '900', color: '#34d399' },
  excelCellTelemetry: { fontSize: 8, color: '#64748b', marginTop: 1 },
  excelCellCompany: { fontSize: 11, fontWeight: '800', color: '#ffffff' },

  excelSourceBadge: { backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  excelSourceText: { fontSize: 9, color: '#a5b4fc', fontWeight: '800' },

  excelStagePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, alignSelf: 'flex-start' },
  excelStageText: { fontSize: 9, fontWeight: '800' },

  excelCellValue: { fontSize: 11, fontWeight: '900', color: '#34d399' },
  excelCellRep: { fontSize: 10, color: '#cbd5e1', fontWeight: '700' },
  excelCellCustom: { fontSize: 10, color: '#94a3b8' },

  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  leadCard: { backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leadName: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  statusText: { fontSize: 9, fontWeight: '800' },
  leadCompany: { fontSize: 11, color: '#94a3b8', marginTop: 2, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 8 },
  leadVal: { fontSize: 13, fontWeight: '900', color: '#34d399' },
  leadPhone: { fontSize: 10, color: '#64748b' },

  editRowBtn: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  editRowBtnText: { color: '#818cf8', fontSize: 9, fontWeight: '800' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 440, backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', padding: 18 },
  modalContentSmall: { width: '100%', maxWidth: 380, backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  modalTitle: { fontSize: 15, fontWeight: '800', color: '#ffffff', marginBottom: 2 },
  modalSub: { fontSize: 10, color: '#94a3b8', marginBottom: 12 },
  label: { fontSize: 10, color: '#cbd5e1', fontWeight: '700', marginTop: 8, marginBottom: 4 },
  modalInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, color: '#ffffff', fontSize: 11 },
  modalBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },

  colItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#020617', padding: 8, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#1e293b' },
  colNameInput: { flex: 1, color: '#ffffff', fontSize: 11, fontWeight: '700', paddingHorizontal: 6 },
  colShiftBtn: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  colShiftBtnText: { color: '#38bdf8', fontSize: 9, fontWeight: '800' },
});
