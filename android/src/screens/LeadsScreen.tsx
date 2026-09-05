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

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LeadsStackParamList } from '../../App';
import { useAuthStore, UserRole, normalizeRoleStr } from '../store/authStore';
import { apiService, LeadItem, FALLBACK_LEADS } from '../services/apiService';
import { callSyncEngine } from '../services/callSyncEngine';
import PostCallOutcomeModal, { CallOutcomeData } from '../components/PostCallOutcomeModal';
import { LeadIngestionControlCenterBar } from '../components/LeadIngestionControlCenterBar';
import {
  FileImportEngineModal,
  ImportedLead,
  FileAuditRecord,
  SavedImportSession,
  DEFAULT_IMPORT_SESSION,
} from '../components/FileImportEngineModal';
import { LeadAllocationEngineModal } from '../components/LeadAllocationEngineModal';
import { GoogleSheetsLiveSyncModal } from '../components/GoogleSheetsLiveSyncModal';
import { AIScoreBadge, generateMockAIScore } from '../components/AIScoreComponents';

type LeadsNavProp = StackNavigationProp<LeadsStackParamList, 'LeadsList'>;

export const isLeadContactedAndLocked = (lead: { status?: string; stage?: string; totalCalls?: number; callSyncStatus?: string }) => {
  if ((lead.totalCalls || 0) > 0) return true;
  if (lead.callSyncStatus && lead.callSyncStatus !== 'Never') return true;
  const s = (lead.status || lead.stage || '').toUpperCase();
  if (s.includes('CONTACT') || s.includes('QUALIFIED') || s.includes('NEGOTIAT') || s.includes('PROPOSAL') || s.includes('WON') || s.includes('FOLLOW')) {
    return true;
  }
  return false;
};

const FILTERS = ['ALL', 'NEW LEAD', 'QUALIFIED', 'IN NEGOTIATION', 'WON'];

interface IngestionAuditRecord {
  id: string;
  fileName: string;
  injectedAt: string;
  leadsCount: number;
  colsCount: number;
  platform: string;
  status: 'PENDING_ALLOCATION' | 'ALLOCATED';
  allocationSummary?: string;
}

const INITIAL_INGESTION_AUDITS: IngestionAuditRecord[] = [
  {
    id: 'aud-1',
    fileName: 'Q3_Enterprise_Prospects_Import.csv',
    injectedAt: '03 Sep 2026, 07:45 PM',
    leadsCount: 124,
    colsCount: 8,
    platform: 'Google Ads',
    status: 'PENDING_ALLOCATION',
  },
  {
    id: 'aud-2',
    fileName: 'Lotwaala_August_2026_Work_Plan.xlsx',
    injectedAt: '03 Sep 2026, 08:14 PM',
    leadsCount: 32,
    colsCount: 6,
    platform: 'Google Ads',
    status: 'ALLOCATED',
    allocationSummary: 'Assigned to Priya Sharma (TL A) [Rows 1-16], Rohan Kumar [Rows 17-32]',
  },
  {
    id: 'aud-3',
    fileName: 'West_Territory_Cold_Outreach.xlsx',
    injectedAt: '02 Sep 2026, 04:30 PM',
    leadsCount: 214,
    colsCount: 10,
    platform: 'Meta Ads',
    status: 'ALLOCATED',
    allocationSummary: 'Assigned to Amit Shah (Sales Exec) [Direct]',
  },
];

export default function LeadsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LeadsNavProp>();
  const { token } = useAuthStore();

  const [auditLogs, setAuditLogs] = useState<IngestionAuditRecord[]>(INITIAL_INGESTION_AUDITS);
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'PENDING' | 'ALLOCATED'>('ALL');

  // ── SEGMENTED SLIDER STATE ──────────────────────────────────────────────────
  const [activeSegment, setActiveSegment] = useState<'FUNNEL' | 'COLLECTIONS'>('COLLECTIONS');

  // ── VIEW MODE: EXCEL SPREADSHEET vs CARD FEED ──────────────────────────────
  const [viewMode, setViewMode] = useState<'EXCEL_GRID' | 'CARD_LIST'>('EXCEL_GRID');

  // ── COLLECTIONS & SEARCH STATE ──────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [leadsList, setLeadsList] = useState<LeadItem[]>(FALLBACK_LEADS);

  // ── MULTI-DIMENSIONAL ADVANCED FILTER STATE ──────────────────────────────────
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterPerson, setFilterPerson] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterDate, setFilterDate] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // ── DYNAMIC COLUMN REORDER, RENAME & EXCEL RESIZING STATE ────────────────
  const [colOrderModalOpen, setColOrderModalOpen] = useState(false);
  const [editingColKey, setEditingColKey] = useState<string | null>(null);
  const [editingColTitle, setEditingColTitle] = useState('');

  // ── EXCEL GRID CONSTANTS & REFS ────────────────────────────────────────────
  const EXCEL_ROW_H = 50;

  // bodyScrollRef: drives vertical scrolling of the data area.
  // rowNumScrollRef: row-number column mirrors it via onScroll offset.
  const bodyScrollRef = useRef<ScrollView>(null);
  const rowNumScrollRef = useRef<ScrollView>(null);

  const handleBodyScroll = useCallback((e: any) => {
    rowNumScrollRef.current?.scrollTo({
      y: e.nativeEvent.contentOffset.y,
      animated: false,
    });
  }, []);

  // ── COLUMN ORDER STATE ────────────────────────────────────────────────────
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

  const totalExcelWidth = useMemo(() => {
    return 44 + columnOrder.reduce((acc, colKey) => acc + (columnWidths[colKey] || 140), 0);
  }, [columnOrder, columnWidths]);

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

  const [auditDetailRecord, setAuditDetailRecord] = useState<IngestionAuditRecord | null>(null);

  // ── MODAL STATES ─────────────────────────────────────────────────────────────
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetRange, setSheetRange] = useState('Sheet1!A2:F');
  const [headerRowIdx, setHeaderRowIdx] = useState<number>(0);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([
    'Sheet1 - Web Leads',
    'Sheet2 - Cold Outreach',
  ]);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [savedImportSession, setSavedImportSession] = useState<SavedImportSession | null>(DEFAULT_IMPORT_SESSION);

  const handleImportSuccess = (leads: ImportedLead[], audit: FileAuditRecord) => {
    const converted: LeadItem[] = leads.map((l, i) => ({
      id: l.id || `lead_${Date.now()}_${i}`,
      name: l.name,
      company: l.company,
      email: l.email,
      phone: l.phone,
      status: l.status,
      value: l.value,
      source: l.source,
      priority: 'High',
      assignedRep: l.assignedRep,
      city: l.city,
      budget: l.budget,
      requirement: l.requirement,
      callSyncStatus: l.callSyncStatus,
    }));
    setLeadsList(prev => [...converted, ...prev]);
    setAllocatedLeadsCount(leads.length);
    setAllocationSourceType('EXCEL_CSV');

    Alert.alert(
      `📥 Import Complete — ${audit.count} Leads`,
      `File: ${audit.filename}\nPlatform: ${audit.platform}\nIngested: ${audit.date}\n\nConfigure Batchwise Allocation or Assign to Team Members now?`,
      [
        { text: 'Later', style: 'cancel' },
        { text: '⚡ Allocate Leads Now', onPress: () => setAllocationModalOpen(true) },
      ]
    );
  };

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

  // Lead Allocation & Strategy Engine Modal State
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [allocatedLeadsCount, setAllocatedLeadsCount] = useState(214);
  const [allocationSourceType, setAllocationSourceType] = useState<'EXCEL_CSV' | 'GOOGLE_SHEETS'>('EXCEL_CSV');

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

  const [rawCsvInput, setRawCsvInput] = useState('');

  const handleSaveEditedLead = () => {
    if (!editingLead) return;
    setLeadsList((prev) => prev.map((l) => (l.id === editingLead.id ? editingLead : l)));
    setEditingLead(null);
    Alert.alert('Lead Updated', 'Successfully updated lead details.');
  };

  const handleSyncGoogleSheet = async () => {
    if (!sheetUrl.trim()) {
      Alert.alert('Missing URL', 'Please enter a valid Google Sheet URL.');
      return;
    }
    const res = await apiService.syncGoogleSheets(token || '', sheetUrl.trim(), selectedSheets, headerRowIdx);
    if (res && res.leads && res.leads.length > 0) {
      setLeadsList((prev) => [...res.leads, ...prev]);
      setSheetModalOpen(false);
      setSheetUrl('');
      Alert.alert(
        '🟢 Google Sheet Multi-Tab Synced',
        `Ingested ${res.importedCount} live leads from ${selectedSheets.length} selected tabs in Google Sheet "${res.sheetTitle || 'Web Leads'}" into spreadsheet table!`
      );
    } else {
      Alert.alert('Sync Error', 'Could not sync Google Sheet. Check URL permissions.');
    }
  };

  const handleProcessCsvTextImport = async (inputStr?: string) => {
    const textToImport = inputStr || rawCsvInput;
    if (!textToImport.trim()) {
      const demoCsv = `Lead Name, Mobile Number, Business Firm, Mail Address, Lead Stage, Value
Rajesh Varma (CSV), +91 98765 11111, Varma Exports, rajesh@varma.com, NEW LEAD, ₹60,000
Sunil Malhotra (CSV), +91 98765 22222, Malhotra Retail, sunil@malhotra.com, QUALIFIED, ₹90,000`;
      const res = await apiService.importLeadsCsv(token || '', demoCsv, headerRowIdx);
      if (res && res.leads) {
        setLeadsList((prev) => [...res.leads, ...prev]);
        setImportModalOpen(false);
        setRawCsvInput('');
        Alert.alert('📥 CSV Import Complete', `Imported ${res.importedCount} lead records (Header Row #${headerRowIdx + 1}) into spreadsheet table!`);
      }
      return;
    }

    const res = await apiService.importLeadsCsv(token || '', textToImport, headerRowIdx);
    if (res && res.leads && res.leads.length > 0) {
      setLeadsList((prev) => [...res.leads, ...prev]);
      setImportModalOpen(false);
      setRawCsvInput('');
      Alert.alert('📥 CSV Import Complete', `Imported ${res.importedCount} lead records into spreadsheet table!`);
    } else {
      Alert.alert('Import Failed', 'Could not parse CSV structure.');
    }
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
      `Call result "${outcome.outcome}" saved for ${callingLeadData?.name || 'Lead'}.\n${outcome.scheduledTime ? `Callback scheduled for ${outcome.scheduledTime}` : ''
      }`
    );
  };

  const handleReassignLeadItem = (leadId: string, newAssignee: string) => {
    setLeadsList(prev => prev.map(item => item.id === leadId ? { ...item, assignedRep: newAssignee } : item));
    Alert.alert('👤 Assignee Updated', `Lead successfully assigned to ${newAssignee}.`);
  };

  const { currentUser } = useAuthStore();
  const userRole = (currentUser?.role || 'SALES_EXEC').toUpperCase();
  const userName = currentUser?.name || 'Mighty Rai';

  const activeFiltersCount = (filterPerson !== 'ALL' ? 1 : 0) +
    (filterRole !== 'ALL' ? 1 : 0) +
    (filterDate !== 'ALL' ? 1 : 0) +
    (filterStatus !== 'ALL' ? 1 : 0);

  const resetAllFilters = () => {
    setFilterPerson('ALL');
    setFilterRole('ALL');
    setFilterDate('ALL');
    setFilterStatus('ALL');
    setActiveFilter('ALL');
    setSearch('');
  };

  const filteredLeads = leadsList.filter((item) => {
    // 🔒 Role-Based Data Isolation Scoping (Except Admin)
    if (!userRole.includes('ADMIN')) {
      if (userRole.includes('MANAGER')) {
        if (item.assignedRep && !item.assignedRep.toLowerCase().includes(userName.toLowerCase()) && !item.assignedRep.includes('Manager A')) return false;
      } else if (userRole.includes('TL') || userRole.includes('LEADER')) {
        if (item.assignedRep && !item.assignedRep.toLowerCase().includes(userName.toLowerCase()) && !item.assignedRep.includes('TL A')) return false;
      } else {
        // Sales Rep (e.g. Amit Patel): can ONLY see leads assigned to him
        if (item.assignedRep && !item.assignedRep.toLowerCase().includes(userName.toLowerCase())) return false;
      }
    }

    // 1. Person-Wise Filter (Assigned Rep)
    if (filterPerson !== 'ALL') {
      if (filterPerson === 'UNASSIGNED') {
        const isUn = !item.assignedRep || item.assignedRep.toLowerCase().includes('unassigned') || item.assignedRep === '—';
        if (!isUn) return false;
      } else {
        if (!item.assignedRep || !item.assignedRep.toLowerCase().includes(filterPerson.toLowerCase())) return false;
      }
    }

    // 2. Person Role Filter
    if (filterRole !== 'ALL') {
      if (filterRole === 'TL') {
        const isTL = item.assignedRep && (item.assignedRep.includes('TL') || item.assignedRep.includes('Leader') || item.assignedRep.includes('Priya'));
        if (!isTL) return false;
      } else if (filterRole === 'SALES_EXEC') {
        const isExec = item.assignedRep && !item.assignedRep.includes('TL') && !item.assignedRep.includes('Leader') && !item.assignedRep.includes('Unassigned');
        if (!isExec) return false;
      } else if (filterRole === 'UNASSIGNED') {
        const isUn = !item.assignedRep || item.assignedRep.toLowerCase().includes('unassigned') || item.assignedRep === '—';
        if (!isUn) return false;
      }
    }

    // 3. Status Filter (Combined activeFilter & filterStatus)
    const effectiveStatus = filterStatus !== 'ALL' ? filterStatus : activeFilter;
    if (effectiveStatus !== 'ALL') {
      const itemS = (item.status || '').toUpperCase();
      const targetS = effectiveStatus.toUpperCase();
      if (!itemS.includes(targetS) && !targetS.includes(itemS)) return false;
    }

    // 4. Multi-field search — covers ALL fields, works in BOTH Excel Grid & Card List view
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

    return true;
  });

  // renderExcelRow inline — used directly inside vertical ScrollView
  const renderExcelRows = useCallback(() =>
    filteredLeads.map((item, index) => (
      <View
        key={item.id}
        style={[styles.excelDataRow, index % 2 === 1 && styles.excelRowAlt]}
      >
        <View style={styles.excelRowNum}>
          <Text style={styles.excelRowNumText}>{index + 1}</Text>
        </View>
        {columnOrder.map((colKey) =>
          renderExcelCell(item, colKey, columnWidths[colKey] || 140)
        )}
      </View>
    ))
    , [filteredLeads, columnOrder, columnWidths]);

  // ── RENDER EXCEL CELL BY COLUMN KEY ────────────────────────────────────────
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
      case 'assignedRep': {
        const isLocked = isLeadContactedAndLocked({ status: item.status, stage: item.status, totalCalls: item.callSyncStatus ? 1 : 0 });
        const isUnassigned = !item.assignedRep || item.assignedRep === 'Unassigned' || item.assignedRep === '—';

        if (isLocked) {
          return (
            <View key={colKey} style={[styles.excelDataCell, { width }]}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#020617', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#1e293b' }}
                onPress={() => Alert.alert('🔒 Assignment Locked', 'This lead has already been contacted by Sales/TL and cannot be reassigned to anyone else.')}
              >
                <Text style={{ fontSize: 10 }}>🔒</Text>
                <Text style={[styles.excelCellRep, { fontSize: 10, color: '#cbd5e1' }]} numberOfLines={1}>{item.assignedRep}</Text>
                <View style={{ backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                  <Text style={{ color: '#fbbf24', fontSize: 8, fontWeight: '900' }}>LOCKED</Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <View key={colKey} style={[styles.excelDataCell, { width }]}>
            <TouchableOpacity
              style={[
                { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
                isUnassigned && { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: '#f59e0b' },
              ]}
              onPress={() => {
                Alert.alert(
                  '👤 Reassign Lead',
                  `Assign ${item.name} (${isUnassigned ? 'Currently Unassigned' : item.assignedRep}) to:`,
                  [
                    { text: 'Priya Sharma (TL A)', onPress: () => handleReassignLeadItem(item.id, 'Priya Sharma (TL A)') },
                    { text: 'Rajesh Kumar (Sales Rep)', onPress: () => handleReassignLeadItem(item.id, 'Rajesh Kumar (Sales Rep)') },
                    { text: 'Rohan Kumar (Sales Exec)', onPress: () => handleReassignLeadItem(item.id, 'Rohan Kumar (Sales Exec)') },
                    { text: 'Amit Shah (Sales Exec)', onPress: () => handleReassignLeadItem(item.id, 'Amit Shah (Sales Exec)') },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
            >
              <Text style={[{ fontSize: 10, fontWeight: '800', color: '#818cf8' }, isUnassigned && { color: '#fbbf24' }]} numberOfLines={1}>
                {isUnassigned ? '⚠️ Unassigned' : item.assignedRep}
              </Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>▼</Text>
            </TouchableOpacity>
          </View>
        );
      }
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
          {/* 🛢️ Lead Integration & Ingestion Control Center Banner */}
          <LeadIngestionControlCenterBar
            onInsertLeadPress={() => setInsertModalOpen(true)}
            onImportCsvPress={() => setImportModalOpen(true)}
            onGoogleSheetsPress={() => setSheetModalOpen(true)}
            onExportCsvPress={() => handleProcessCsvTextImport()}
            onCustomColumnPress={() => { setEditingColKey(null); setEditingColTitle(''); setColOrderModalOpen(true); }}
            onAdjustColumnsPress={() => setColOrderModalOpen(true)}
            columnCount={columnOrder.length}
          />

          {/* 📊 Spreadsheet Ingestion & Employee Allocation Audit History Hub */}
          <View style={auditStyles.auditSectionCard}>
            {/* Header Row */}
            <View style={auditStyles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={auditStyles.sectionHeaderIcon}>📊</Text>
                  <Text style={auditStyles.sectionHeaderTitle}>Spreadsheet Ingestion &amp; Allocation Log</Text>
                </View>
                <Text style={auditStyles.sectionHeaderSub}>
                  Audit history of when, at what time, which sheets were injected, and employee assignments.
                </Text>
              </View>
            </View>

            {/* Segmented Filter Pills */}
            <View style={auditStyles.filterPillTrack}>
              {[
                { id: 'ALL', label: 'All Files', count: auditLogs.length },
                { id: 'PENDING', label: 'Pending', count: auditLogs.filter(a => a.status === 'PENDING_ALLOCATION').length, isWarn: true },
                { id: 'ALLOCATED', label: 'Allocated', count: auditLogs.filter(a => a.status === 'ALLOCATED').length, isSuccess: true },
              ].map(tab => {
                const isActive = auditFilter === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      auditStyles.filterPill,
                      isActive && auditStyles.filterPillActive,
                      isActive && tab.isWarn && auditStyles.filterPillActiveWarn,
                      isActive && tab.isSuccess && auditStyles.filterPillActiveSuccess,
                    ]}
                    onPress={() => setAuditFilter(tab.id as any)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        auditStyles.filterPillText,
                        isActive && auditStyles.filterPillTextActive,
                        isActive && tab.isWarn && { color: '#fbbf24' },
                        isActive && tab.isSuccess && { color: '#34d399' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                    <View
                      style={[
                        auditStyles.filterCountBadge,
                        isActive && auditStyles.filterCountBadgeActive,
                        isActive && tab.isWarn && { backgroundColor: 'rgba(245,158,11,0.25)' },
                        isActive && tab.isSuccess && { backgroundColor: 'rgba(16,185,129,0.25)' },
                      ]}
                    >
                      <Text
                        style={[
                          auditStyles.filterCountBadgeText,
                          isActive && auditStyles.filterCountBadgeTextActive,
                          isActive && tab.isWarn && { color: '#fbbf24' },
                          isActive && tab.isSuccess && { color: '#34d399' },
                        ]}
                      >
                        {tab.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Audit Log Cards List */}
            <View style={{ gap: 10, marginTop: 12 }}>
              {auditLogs
                .filter(item => {
                  if (auditFilter === 'PENDING') return item.status === 'PENDING_ALLOCATION';
                  if (auditFilter === 'ALLOCATED') return item.status === 'ALLOCATED';
                  return true;
                })
                .map(item => {
                  const isPending = item.status === 'PENDING_ALLOCATION';
                  const isCsv = item.fileName.toLowerCase().endsWith('.csv');
                  return (
                    <View
                      key={item.id}
                      style={[
                        auditStyles.logCard,
                        isPending ? auditStyles.logCardPending : auditStyles.logCardAllocated,
                      ]}
                    >
                      {/* Top Header: File Info & Status Badge */}
                      <View style={auditStyles.logCardTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
                          <View style={[auditStyles.fileIconBox, isCsv ? auditStyles.fileIconBoxCsv : auditStyles.fileIconBoxExcel]}>
                            <Text style={auditStyles.fileIconEmoji}>{isCsv ? '📊' : '📑'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={auditStyles.logCardFileName} numberOfLines={1}>
                              {item.fileName}
                            </Text>
                            <Text style={auditStyles.logCardTimestamp}>
                              🕒 {item.injectedAt}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[
                            auditStyles.statusBadge,
                            isPending ? auditStyles.statusBadgePending : auditStyles.statusBadgeAllocated,
                          ]}
                          onPress={() => setAuditDetailRecord(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={auditStyles.statusBadgeDot}>{isPending ? '⏳' : '✓'}</Text>
                          <Text style={[auditStyles.statusBadgeText, isPending ? { color: '#fbbf24' } : { color: '#34d399' }]}>
                            {isPending ? 'PENDING ALLOCATION' : 'ALLOCATED'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Middle: Metadata Pills Grid */}
                      <View style={auditStyles.metaChipsRow}>
                        <View style={auditStyles.metaChip}>
                          <Text style={auditStyles.metaChipIcon}>🌐</Text>
                          <Text style={auditStyles.metaChipLabel}>Source:</Text>
                          <Text style={[auditStyles.metaChipVal, { color: '#38bdf8' }]}>{item.platform}</Text>
                        </View>

                        <View style={auditStyles.metaChip}>
                          <Text style={auditStyles.metaChipIcon}>📈</Text>
                          <Text style={auditStyles.metaChipLabel}>Rows:</Text>
                          <Text style={[auditStyles.metaChipVal, { color: '#34d399' }]}>{item.leadsCount} Leads</Text>
                        </View>

                        <View style={auditStyles.metaChip}>
                          <Text style={auditStyles.metaChipIcon}>📐</Text>
                          <Text style={auditStyles.metaChipLabel}>Cols:</Text>
                          <Text style={[auditStyles.metaChipVal, { color: '#818cf8' }]}>{item.colsCount || 6} Fields</Text>
                        </View>
                      </View>

                      {/* Allocated Summary Box if already allocated */}
                      {!isPending && item.allocationSummary && (
                        <View style={auditStyles.allocatedSummaryBox}>
                          <Text style={auditStyles.allocatedSummaryIcon}>👥</Text>
                          <Text style={auditStyles.allocatedSummaryText} numberOfLines={2}>
                            {item.allocationSummary}
                          </Text>
                        </View>
                      )}

                      {/* Pending Action Banner */}
                      {isPending && (
                        <View style={auditStyles.pendingBanner}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={{ fontSize: 13 }}>⚠️</Text>
                              <Text style={auditStyles.pendingBannerTitle}>
                                {item.leadsCount} Leads Unassigned
                              </Text>
                            </View>
                            <Text style={auditStyles.pendingBannerSub}>
                              Dataset is unallocated. Assign to Team Leader or sales reps.
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={auditStyles.allocateCtaBtn}
                            onPress={() => {
                              setAllocatedLeadsCount(item.leadsCount);
                              setAllocationSourceType('EXCEL_CSV');
                              setAllocationModalOpen(true);
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={auditStyles.allocateCtaBtnText}>⚡ Allocate Now →</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Card Footer Action Buttons */}
                      <View style={auditStyles.cardFooterRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {/* Preview & Edit Sheet Primary Action Button */}
                          <TouchableOpacity
                            style={auditStyles.btnPreviewSheet}
                            onPress={() => {
                              setAuditDetailRecord(null);
                              setAllocationModalOpen(false);
                              setImportModalOpen(true);
                            }}
                            activeOpacity={0.75}
                          >
                            <Text style={auditStyles.btnPreviewSheetIcon}>👁️</Text>
                            <Text style={auditStyles.btnPreviewSheetText}>Preview &amp; Edit Sheet</Text>
                          </TouchableOpacity>

                          {/* Delete Action Button */}
                          <TouchableOpacity
                            style={auditStyles.btnDeleteSheet}
                            onPress={() => {
                              Alert.alert(
                                '🗑️ Delete Sheet Allocation',
                                `Are you sure you want to delete the allocation record for ${item.fileName}?\n\nℹ️ 7-Day Retention Policy: Historical allocation logs automatically auto-delete after 7 days.`,
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: () => {
                                      setAuditLogs(prev => prev.filter(a => a.id !== item.id));
                                      Alert.alert('Purged', `Sheet allocation record ${item.fileName} deleted.`);
                                    },
                                  },
                                ]
                              );
                            }}
                            activeOpacity={0.75}
                          >
                            <Text style={auditStyles.btnDeleteSheetIcon}>🗑️</Text>
                            <Text style={auditStyles.btnDeleteSheetText}>Delete</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Retention Policy Indicator Pill (Informative, NOT button) */}
                        <View style={auditStyles.retentionBadge}>
                          <Text style={auditStyles.retentionBadgeIcon}>⏳</Text>
                          <Text style={auditStyles.retentionBadgeText}>7-Day Retention</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
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

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: activeFiltersCount > 0 ? 'rgba(245,158,11,0.2)' : '#1e293b', borderColor: activeFiltersCount > 0 ? '#f59e0b' : '#334155' },
                ]}
                onPress={() => setFilterModalOpen(true)}
              >
                <Text style={[styles.actionBtnText, activeFiltersCount > 0 && { color: '#fbbf24' }]}>
                  🎛️ Filter {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }]} onPress={() => setColOrderModalOpen(true)}>
                <Text style={[styles.actionBtnText, { color: '#a5b4fc' }]}>🔀 Reorder</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Person Filter Chips Bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6, marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#64748b', marginRight: 2 }}>PERSON:</Text>
                {[
                  { id: 'ALL', label: 'All Persons' },
                  { id: 'Priya', label: '👤 Priya (TL)' },
                  { id: 'Rajesh', label: '👤 Rajesh' },
                  { id: 'Rohan', label: '👤 Rohan' },
                  { id: 'Amit', label: '👤 Amit' },
                  { id: 'UNASSIGNED', label: '⚠️ Unassigned' },
                ].map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, filterPerson === p.id && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                    onPress={() => setFilterPerson(p.id)}
                  >
                    <Text style={[{ fontSize: 9, fontWeight: '800', color: '#94a3b8' }, filterPerson === p.id && { color: '#ffffff' }]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

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
            /*
             * UNIFIED 2-AXIS SCROLL ARCHITECTURE — ZERO FLICKER
             * Single outer horizontal ScrollView contains Header + Data Rows.
             * Inner container sets minWidth = totalExcelWidth and flex = 1 vertically.
             */
            <View style={styles.excelOuter}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={{ flexDirection: 'column', flexGrow: 1 }}
                nestedScrollEnabled
              >
                <View style={{ minWidth: totalExcelWidth, flex: 1 }}>
                  {/* ── STICKY HEADER TOOLBAR ─────────────────────────── */}
                  <View style={styles.excelToolbar}>
                    <View style={styles.excelRowNumCorner}>
                      <Text style={styles.excelRowNumCornerText}>#</Text>
                    </View>
                    {columnOrder.map((colKey, colIdx) => {
                      const colWidth = columnWidths[colKey] || 140;
                      const colName = columnNames[colKey] || colKey;
                      return (
                        <View key={colKey} style={[styles.excelColControl, { width: colWidth }]}>
                          <TouchableOpacity
                            style={styles.excelColTitleBtn}
                            onPress={() => openHeaderRenameModal(colKey)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.excelColTitleText} numberOfLines={1}>{colName}</Text>
                          </TouchableOpacity>
                          <View style={styles.excelColControls}>
                            <TouchableOpacity
                              style={[styles.excelColBtn, colIdx === 0 && styles.excelColBtnDisabled]}
                              disabled={colIdx === 0}
                              onPress={() => moveColumnLeft(colKey)}
                              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                            >
                              <Text style={styles.excelColBtnText}>←</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.excelColBtn, colIdx === columnOrder.length - 1 && styles.excelColBtnDisabled]}
                              disabled={colIdx === columnOrder.length - 1}
                              onPress={() => moveColumnRight(colKey)}
                              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                            >
                              <Text style={styles.excelColBtnText}>→</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.excelColBtn}
                              onPress={() => toggleColumnWidth(colKey)}
                              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                            >
                              <Text style={styles.excelColBtnText}>↔</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* ── DATA BODY: VERTICAL SCROLLVIEW ─────────────────── */}
                  <ScrollView
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled
                    style={styles.excelBodyList}
                  >
                    {renderExcelRows()}
                  </ScrollView>
                </View>
              </ScrollView>
            </View>
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
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.leadName}>{item.name}</Text>
                      {item.aiScore && (
                        <AIScoreBadge score={item.aiScore} compact />
                      )}
                    </View>
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

                  <View style={{ marginVertical: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#34d399', letterSpacing: 0.3 }}>
                      📞 {item.phone}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
                    {(() => {
                      const isLocked = isLeadContactedAndLocked({ status: item.status, stage: item.status, totalCalls: item.callSyncStatus ? 1 : 0 });
                      const isUnassigned = !item.assignedRep || item.assignedRep === 'Unassigned' || item.assignedRep === '—';

                      if (isLocked) {
                        return (
                          <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#020617', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#1e293b' }}
                            onPress={() => Alert.alert('🔒 Assignment Locked', 'This lead has already been contacted by Sales/TL and cannot be reassigned to anyone else.')}
                          >
                            <Text style={{ fontSize: 10 }}>🔒</Text>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#cbd5e1' }}>{item.assignedRep}</Text>
                            <View style={{ backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                              <Text style={{ color: '#fbbf24', fontSize: 8, fontWeight: '900' }}>LOCKED</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      }

                      return (
                        <TouchableOpacity
                          style={[
                            { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
                            isUnassigned && { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: '#f59e0b' },
                          ]}
                          onPress={() => {
                            Alert.alert(
                              '👤 Reassign Lead',
                              `Assign ${item.name} (${isUnassigned ? 'Currently Unassigned' : item.assignedRep}) to:`,
                              [
                                { text: 'Priya Sharma (TL A)', onPress: () => handleReassignLeadItem(item.id, 'Priya Sharma (TL A)') },
                                { text: 'Rajesh Kumar (Sales Rep)', onPress: () => handleReassignLeadItem(item.id, 'Rajesh Kumar (Sales Rep)') },
                                { text: 'Rohan Kumar (Sales Exec)', onPress: () => handleReassignLeadItem(item.id, 'Rohan Kumar (Sales Exec)') },
                                { text: 'Amit Shah (Sales Exec)', onPress: () => handleReassignLeadItem(item.id, 'Amit Shah (Sales Exec)') },
                                { text: 'Cancel', style: 'cancel' },
                              ]
                            );
                          }}
                        >
                          <Text style={[{ fontSize: 11, fontWeight: '800', color: '#818cf8' }, isUnassigned && { color: '#fbbf24' }]}>
                            👤 {isUnassigned ? '⚠️ Unassigned' : item.assignedRep}
                          </Text>
                          <Text style={{ color: '#64748b', fontSize: 9 }}>▼</Text>
                        </TouchableOpacity>
                      );
                    })()}

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

      {/* ── MODAL: SHEET AUDIT ALLOCATION BREAKDOWN MODAL ────────────────── */}
      <Modal visible={!!auditDetailRecord} transparent animationType="fade" onRequestClose={() => setAuditDetailRecord(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentSmall, { width: '92%', maxWidth: 420, backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 10 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#ffffff' }}>📄 Sheet Ingestion &amp; Allocation Audit</Text>
                <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Assigned employee quota breakdown telemetry</Text>
              </View>
              <TouchableOpacity onPress={() => setAuditDetailRecord(null)} style={{ backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {auditDetailRecord && (
              <View style={{ gap: 12 }}>
                <View style={{ backgroundColor: '#020617', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#818cf8' }}>📄 Sheet File Name: {auditDetailRecord.fileName}</Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>🕒 Date &amp; Time of Import: <Text style={{ color: '#f8fafc', fontWeight: '800' }}>{auditDetailRecord.injectedAt}</Text></Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>📊 No. of Rows &amp; Columns: <Text style={{ color: '#34d399', fontWeight: '900' }}>{auditDetailRecord.leadsCount} Rows</Text> • <Text style={{ color: '#38bdf8', fontWeight: '900' }}>{auditDetailRecord.colsCount || 6} Columns</Text></Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>📡 Source Platform: <Text style={{ color: '#a5b4fc', fontWeight: '800' }}>{auditDetailRecord.platform}</Text></Text>
                </View>

                <View style={{ backgroundColor: 'rgba(99,102,241,0.1)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(99,102,241,0.35)', gap: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#818cf8' }}>👤 Assigned To Whom (Employee Allocation):</Text>
                  {auditDetailRecord.status === 'PENDING_ALLOCATION' ? (
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#fbbf24' }}>
                      ⚠️ Unassigned / Pending Allocation (Tap 'Allocate Leads Now' on the audit card to assign sales reps).
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#f8fafc', lineHeight: 18 }}>
                      {auditDetailRecord.allocationSummary || 'Assigned to sales reps upon spreadsheet ingestion.'}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={{ backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 4 }}
                  onPress={() => setAuditDetailRecord(null)}
                >
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>Close Breakdown</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ── MODAL 1: INLINE HEADER RENAME MODAL ─────────────────────────────── */}
      <Modal visible={!!editingColKey} transparent animationType="fade" onRequestClose={() => setEditingColKey(null)}>
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
      <Modal visible={colOrderModalOpen} transparent animationType="slide" onRequestClose={() => setColOrderModalOpen(false)}>
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
      <Modal visible={!!editingLead} transparent animationType="slide" onRequestClose={() => setEditingLead(null)}>
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
      <Modal visible={insertModalOpen} transparent animationType="slide" onRequestClose={() => setInsertModalOpen(false)}>
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

      {/* ── MODAL 5: GOOGLE SHEETS LIVE SYNC PORTAL MODAL ───────────────── */}
      <GoogleSheetsLiveSyncModal
        visible={sheetModalOpen}
        onClose={() => setSheetModalOpen(false)}
        onSyncComplete={(count) => {
          Alert.alert('🟢 Live Sync Active', `Ingested ${count} live lead records from Google Sheets API.`);
        }}
      />

      {/* ── MODAL 6: FILE IMPORT ENGINE (CSV / Excel / XLSX) ────────────── */}
      <FileImportEngineModal
        visible={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
        initialSession={savedImportSession}
        onSaveSession={setSavedImportSession}
      />

      {/* ── MODAL 7: POST-CALL OUTCOME MODAL ───────────────────────────────── */}
      <PostCallOutcomeModal
        visible={postCallModalOpen}
        leadId={callingLeadData?.id || ''}
        leadName={callingLeadData?.name || ''}
        phone={callingLeadData?.phone || ''}
        onSaveOutcome={handleSaveCallOutcome}
        onClose={() => setPostCallModalOpen(false)}
      />

      {/* ── MODAL 8: LEAD ALLOCATION & DISTRIBUTION ENGINE ────────────── */}
      <LeadAllocationEngineModal
        visible={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        totalLeadsCount={allocatedLeadsCount}
        sourceType={allocationSourceType}
        onPreviewSheet={() => {
          setAllocationModalOpen(false);
          setImportModalOpen(true);
        }}
      />

      {/* ── MODAL 9: MULTI-DIMENSIONAL ADVANCED LEAD FILTER ─────────────────────── */}
      <Modal visible={filterModalOpen} animationType="slide" transparent onRequestClose={() => setFilterModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(3,7,18,0.85)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: '#0f172a',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderWidth: 1,
            borderColor: '#1e293b',
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 16,
            maxHeight: '85%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#ffffff' }}>🎛️ Advanced Lead Multi-Filter</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Filter by Person, Employee Role, Date Range & Status</Text>
              </View>
              <TouchableOpacity onPress={() => setFilterModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {/* 1. PERSON-WISE FILTER */}
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#818cf8', marginTop: 8, marginBottom: 6, textTransform: 'uppercase' }}>
                👤 1. Assigned Person (Employee)
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { id: 'ALL', label: 'All Persons' },
                  { id: 'Priya', label: 'Priya Sharma (TL A)' },
                  { id: 'Rajesh', label: 'Rajesh Kumar (Sales)' },
                  { id: 'Rohan', label: 'Rohan Kumar (Exec)' },
                  { id: 'Amit', label: 'Amit Shah (Sales Exec)' },
                  { id: 'Neha', label: 'Neha Gupta (Exec)' },
                  { id: 'UNASSIGNED', label: '⚠️ Unassigned Leads' },
                ].map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, filterPerson === item.id && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                    onPress={() => setFilterPerson(item.id)}
                  >
                    <Text style={[{ fontSize: 11, fontWeight: '700', color: '#94a3b8' }, filterPerson === item.id && { color: '#ffffff', fontWeight: '900' }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 2. ROLE-WISE FILTER */}
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#34d399', marginTop: 14, marginBottom: 6, textTransform: 'uppercase' }}>
                🏢 2. Employee Role
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { id: 'ALL', label: 'All Roles' },
                  { id: 'TL', label: 'Team Leader (TL)' },
                  { id: 'SALES_EXEC', label: 'Sales Representative / Exec' },
                  { id: 'UNASSIGNED', label: '⚠️ Unassigned' },
                ].map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, filterRole === item.id && { backgroundColor: '#10b981', borderColor: '#34d399' }]}
                    onPress={() => setFilterRole(item.id)}
                  >
                    <Text style={[{ fontSize: 11, fontWeight: '700', color: '#94a3b8' }, filterRole === item.id && { color: '#ffffff', fontWeight: '900' }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 3. DATE RANGE FILTER */}
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#fbbf24', marginTop: 14, marginBottom: 6, textTransform: 'uppercase' }}>
                📅 3. Date Range / Ingestion Time
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { id: 'ALL', label: 'All Time' },
                  { id: 'TODAY', label: 'Today' },
                  { id: 'YESTERDAY', label: 'Yesterday' },
                  { id: 'THIS_WEEK', label: 'This Week (7 Days)' },
                  { id: 'THIS_MONTH', label: 'This Month (30 Days)' },
                ].map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, filterDate === item.id && { backgroundColor: '#f59e0b', borderColor: '#fbbf24' }]}
                    onPress={() => setFilterDate(item.id)}
                  >
                    <Text style={[{ fontSize: 11, fontWeight: '700', color: '#94a3b8' }, filterDate === item.id && { color: '#030712', fontWeight: '900' }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 4. STATUS / FUNNEL STAGE FILTER */}
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#38bdf8', marginTop: 14, marginBottom: 6, textTransform: 'uppercase' }}>
                📊 4. Lead Status / Stage
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {['ALL', 'NEW LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON'].map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, (filterStatus === s || activeFilter === s) && { backgroundColor: '#0284c7', borderColor: '#38bdf8' }]}
                    onPress={() => { setFilterStatus(s); setActiveFilter(s); }}
                  >
                    <Text style={[{ fontSize: 11, fontWeight: '700', color: '#94a3b8' }, (filterStatus === s || activeFilter === s) && { color: '#ffffff', fontWeight: '900' }]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: '#1e293b',
              marginTop: 10,
              gap: 12,
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: '#1e293b',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#334155',
                }}
                onPress={resetAllFilters}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '800' }}>✕ Reset Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1.5,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: '#4f46e5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 3,
                }}
                onPress={() => setFilterModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>
                  Apply ({filteredLeads.length} Matches) →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: SHEET ALLOCATION AUDIT DETAIL ───────────────────────────── */}
      <Modal visible={!!auditDetailRecord} transparent animationType="fade" onRequestClose={() => setAuditDetailRecord(null)}>
        <View style={styles.modalOverlay}>
          {auditDetailRecord && (
            <View style={[styles.modalContent, { maxWidth: 380, backgroundColor: '#0b1329', borderColor: '#1e293b' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>📑</Text>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#ffffff' }}>Spreadsheet Audit Record</Text>
                </View>
                <TouchableOpacity onPress={() => setAuditDetailRecord(null)}>
                  <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 14 }}>
                Detailed ingestion telemetry &amp; employee batch allocation summary.
              </Text>

              <View style={{ backgroundColor: '#030712', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 12, gap: 8, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>File Name:</Text>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#f8fafc' }}>{auditDetailRecord.fileName}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>Injected At:</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#cbd5e1' }}>{auditDetailRecord.injectedAt}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>Platform:</Text>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#38bdf8' }}>{auditDetailRecord.platform}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>Dataset Size:</Text>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#34d399' }}>{auditDetailRecord.leadsCount} Rows • {auditDetailRecord.colsCount || 6} Cols</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>Status:</Text>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: auditDetailRecord.status === 'PENDING_ALLOCATION' ? '#fbbf24' : '#34d399' }}>
                    {auditDetailRecord.status === 'PENDING_ALLOCATION' ? '⏳ Unassigned Pending' : '✓ Allocated'}
                  </Text>
                </View>
                {auditDetailRecord.allocationSummary && (
                  <View style={{ marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
                    <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Allocation Distribution:</Text>
                    <Text style={{ fontSize: 11, color: '#86efac', fontWeight: '700' }}>{auditDetailRecord.allocationSummary}</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: 'rgba(14, 165, 233, 0.15)', borderWidth: 1, borderColor: '#0284c7', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                  onPress={() => {
                    setAuditDetailRecord(null);
                    setAllocationModalOpen(false);
                    setImportModalOpen(true);
                  }}
                >
                  <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: '800' }}>👁️ Preview Sheet</Text>
                </TouchableOpacity>

                {auditDetailRecord.status === 'PENDING_ALLOCATION' ? (
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#f59e0b', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                    onPress={() => {
                      setAllocatedLeadsCount(auditDetailRecord.leadsCount);
                      setAllocationSourceType('EXCEL_CSV');
                      setAuditDetailRecord(null);
                      setAllocationModalOpen(true);
                    }}
                  >
                    <Text style={{ color: '#000000', fontSize: 11, fontWeight: '900' }}>⚡ Allocate Leads →</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                    onPress={() => {
                      setAllocatedLeadsCount(auditDetailRecord.leadsCount);
                      setAllocationSourceType('EXCEL_CSV');
                      setAuditDetailRecord(null);
                      setAllocationModalOpen(true);
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900' }}>🔄 Re-Allocate →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
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

  // 📊 EXCEL SPREADSHEET TABLE STYLES
  excelOuter: { flex: 1, backgroundColor: '#030712' },

  // Sticky row-number column (fixed on the left, never scrolls horizontally)
  excelStickyCol: {
    width: 44,
    backgroundColor: '#0b1329',
    borderRightWidth: 2,
    borderRightColor: '#1e293b',
    zIndex: 2,
  },

  // Toolbar: horizontal strip of column control chips (no longer a ScrollView — lives inside hScrollRef)
  excelToolbar: {
    flexDirection: 'row',
    backgroundColor: '#0b1329',
    borderBottomWidth: 2,
    borderBottomColor: '#1e293b',
  },
  excelToolbarInner: { flexDirection: 'row', alignItems: 'stretch', minWidth: 1400 },

  // Row number corner cell (in sticky column header)
  excelRowNumCorner: { width: 44, height: 56, backgroundColor: '#0b1329', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: '#1e293b' },
  excelRowNumCornerText: { fontSize: 11, fontWeight: '900', color: '#475569' },

  // Row number cell (in the sticky column body)
  excelRowNumCell: { width: 44, height: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1329' },

  // Column control cell (title + ← → ↔ buttons side by side)
  excelColControl: { height: 56, flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#1e293b', paddingHorizontal: 6 },
  excelColTitleBtn: { flex: 1, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 5, justifyContent: 'center' },
  excelColTitleText: { fontSize: 10, fontWeight: '800', color: '#818cf8' },
  excelColControls: { flexDirection: 'row', gap: 3, marginLeft: 4 },
  excelColBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 6, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  excelColBtnDisabled: { opacity: 0.3 },
  excelColBtnText: { fontSize: 11, fontWeight: '900', color: '#38bdf8' },

  // Data body (inside horizontal ScrollView — no horizontal scrolling needed here)
  excelBodyList: { flex: 1 },
  excelBodyContent: {},   // no minWidth needed — width is driven by columns

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

  // Data rows — no row-number cell; that's now in the sticky column
  excelDataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1e293b', backgroundColor: '#090d16', height: 50 },
  excelRowNum: { width: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1329', borderRightWidth: 1, borderRightColor: '#1e293b' },
  excelRowNumText: { fontSize: 10, fontWeight: '700', color: '#475569' },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
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

const auditStyles = StyleSheet.create({
  auditSectionCard: {
    backgroundColor: '#0a1020',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderIcon: {
    fontSize: 16,
  },
  sectionHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  sectionHeaderSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 14,
  },
  importSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  importSheetBtnIcon: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  importSheetBtnText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },

  filterPillTrack: {
    flexDirection: 'row',
    backgroundColor: '#060a15',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
    gap: 5,
  },
  filterPillActive: {
    backgroundColor: '#1e293b',
  },
  filterPillActiveWarn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  filterPillActiveSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  filterPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  filterCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  filterCountBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748b',
  },
  filterCountBadgeTextActive: {
    color: '#ffffff',
  },

  logCard: {
    backgroundColor: '#070c18',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
  },
  logCardPending: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: '#090e1c',
  },
  logCardAllocated: {
    borderColor: '#1e293b',
    backgroundColor: '#070c18',
  },

  logCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fileIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconBoxCsv: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  fileIconBoxExcel: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  fileIconEmoji: {
    fontSize: 15,
  },
  logCardFileName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
  },
  logCardTimestamp: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusBadgeAllocated: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusBadgeDot: {
    fontSize: 9,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  metaChipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metaChipIcon: {
    fontSize: 9.5,
  },
  metaChipLabel: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
  },
  metaChipVal: {
    fontSize: 9.5,
    fontWeight: '800',
  },

  allocatedSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginBottom: 10,
  },
  allocatedSummaryIcon: {
    fontSize: 11,
  },
  allocatedSummaryText: {
    fontSize: 10,
    color: '#86efac',
    fontWeight: '600',
    flex: 1,
  },

  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 10,
    padding: 9,
    marginBottom: 10,
  },
  pendingBannerTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fbbf24',
  },
  pendingBannerSub: {
    fontSize: 9,
    color: '#fef3c7',
    marginTop: 1.5,
    opacity: 0.85,
  },
  allocateCtaBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#f59e0b',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  allocateCtaBtnText: {
    color: '#000000',
    fontSize: 10.5,
    fontWeight: '900',
  },

  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 9,
  },
  btnPreviewSheet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnPreviewSheetIcon: {
    fontSize: 11,
  },
  btnPreviewSheetText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },

  btnDeleteSheet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnDeleteSheetIcon: {
    fontSize: 9.5,
  },
  btnDeleteSheetText: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '800',
  },

  retentionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4.5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  retentionBadgeIcon: {
    fontSize: 9,
  },
  retentionBadgeText: {
    color: '#94a3b8',
    fontSize: 8.5,
    fontWeight: '700',
  },
});
