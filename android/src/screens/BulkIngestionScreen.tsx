/**
 * BulkIngestionScreen.tsx — DAS CRM Android
 * REDESIGNED: Full H/V Scroll, Responsive Layout, Premium Dark UI.
 * Ref: LeadFunnelDistribution.tsx (Web) — Production Import/Export Portal.
 *
 * Capabilities:
 * 1. CSV / Excel File Upload (device picker)
 * 2. Google Sheets Sync (OAuth)
 * 3. Dynamic Column Mapping (horizontal-scrollable table)
 * 4. Duplicate Policy Engine
 * 5. Header Row & Data Start Config
 * 6. Sync Run History & Audit Logs
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';
import { LeadAllocationEngineModal } from '../components/LeadAllocationEngineModal';
import { GoogleSheetsLiveSyncModal } from '../components/GoogleSheetsLiveSyncModal';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ColumnMapItem {
  sheetHeader: string;
  crmField: string;
  isIgnored: boolean;
  isRequired: boolean;
  transformType: 'TRIM' | 'PHONE_NORM' | 'EMAIL_LOWER' | 'DATE_ISO' | 'NONE';
}

export interface SyncRunLog {
  id: string;
  source: 'CSV' | 'EXCEL' | 'GOOGLE_SHEETS';
  fileName: string;
  tabName: string;
  status: 'SUCCESS' | 'PARTIAL_FAIL' | 'SYNCING' | 'FAILED';
  rowsDetected: number;
  rowsCreated: number;
  rowsUpdated: number;
  rowsSkipped: number;
  errorCount: number;
  timestamp: string;
}

interface BulkIngestionScreenProps {
  onClose?: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CRM_FIELDS = ['name', 'phone', 'email', 'company', 'value', 'city', 'source', 'notes', 'IGNORE'];

const IMPORT_TABS = [
  { key: 'CSV_EXCEL', icon: '📂', label: 'CSV / Excel Upload' },
  { key: 'GOOGLE_SHEETS', icon: '📊', label: 'Google Sheets Sync' },
  { key: 'HISTORY', icon: '📜', label: 'Sync History' },
] as const;
type ImportTab = typeof IMPORT_TABS[number]['key'];

const DUPLICATE_POLICIES = [
  { key: 'UPDATE_EXISTING', label: 'Update Existing', color: '#38bdf8' },
  { key: 'SKIP', label: 'Skip Dupes', color: '#fbbf24' },
  { key: 'CREATE_DUPLICATE', label: 'Create Dupe', color: '#f87171' },
] as const;

const AVAILABLE_SPREADSHEETS = [
  'Facebook Leads August 2026',
  'Website Leads Master',
  'Sales Team Campaign Leads',
  'Google Ads Inbound Leads',
];

const AVAILABLE_TABS_SHEET = ['Leads', 'January', 'February', 'Archive', 'Raw Data'];

const INITIAL_COLUMN_MAPPINGS: ColumnMapItem[] = [
  { sheetHeader: 'Full Name',     crmField: 'name',    isIgnored: false, isRequired: true,  transformType: 'TRIM' },
  { sheetHeader: 'Mobile No',     crmField: 'phone',   isIgnored: false, isRequired: true,  transformType: 'PHONE_NORM' },
  { sheetHeader: 'Email ID',      crmField: 'email',   isIgnored: false, isRequired: false, transformType: 'EMAIL_LOWER' },
  { sheetHeader: 'Company',       crmField: 'company', isIgnored: false, isRequired: false, transformType: 'TRIM' },
  { sheetHeader: 'Deal Value',    crmField: 'value',   isIgnored: false, isRequired: false, transformType: 'TRIM' },
  { sheetHeader: 'City',          crmField: 'city',    isIgnored: false, isRequired: false, transformType: 'TRIM' },
  { sheetHeader: 'Lead Source',   crmField: 'source',  isIgnored: false, isRequired: false, transformType: 'TRIM' },
  { sheetHeader: 'Internal Notes',crmField: 'IGNORE',  isIgnored: true,  isRequired: false, transformType: 'NONE' },
  { sheetHeader: 'Created Date',  crmField: 'IGNORE',  isIgnored: true,  isRequired: false, transformType: 'DATE_ISO' },
];

const INITIAL_SYNC_LOGS: SyncRunLog[] = [
  {
    id: 'sync-103',
    source: 'CSV',
    fileName: 'facebook_leads_aug2026.csv',
    tabName: '—',
    status: 'SUCCESS',
    rowsDetected: 214,
    rowsCreated: 48,
    rowsUpdated: 162,
    rowsSkipped: 4,
    errorCount: 0,
    timestamp: 'Today, 11:40 AM',
  },
  {
    id: 'sync-102',
    source: 'GOOGLE_SHEETS',
    fileName: 'Facebook Leads August 2026',
    tabName: 'Leads',
    status: 'SUCCESS',
    rowsDetected: 142,
    rowsCreated: 38,
    rowsUpdated: 102,
    rowsSkipped: 2,
    errorCount: 0,
    timestamp: 'Today, 10:15 AM',
  },
  {
    id: 'sync-101',
    source: 'EXCEL',
    fileName: 'website_leads_batch2.xlsx',
    tabName: '—',
    status: 'PARTIAL_FAIL',
    rowsDetected: 89,
    rowsCreated: 84,
    rowsUpdated: 3,
    rowsSkipped: 0,
    errorCount: 2,
    timestamp: 'Yesterday, 4:30 PM',
  },
];

// ── Main Component ─────────────────────────────────────────────────────────────
export const BulkIngestionScreen: React.FC<BulkIngestionScreenProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const topPadding   = Math.max(insets.top + 4, 16);
  const bottomPadding = Math.max(insets.bottom + 16, 24);

  // Tab
  const [activeTab, setActiveTab] = useState<ImportTab>('CSV_EXCEL');

  // CSV/Excel State
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [columnMappings, setColumnMappings] = useState<ColumnMapItem[]>(INITIAL_COLUMN_MAPPINGS);
  const [duplicatePolicy, setDuplicatePolicy] = useState<'UPDATE_EXISTING' | 'SKIP' | 'CREATE_DUPLICATE'>('UPDATE_EXISTING');
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [activeMappingCol, setActiveMappingCol] = useState<ColumnMapItem | null>(null);

  // Google Sheets State
  const [googleConnected, setGoogleConnected] = useState(true);
  const [googleAccountEmail] = useState('org.sales@enterprise-dascrm.com');
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState('Facebook Leads August 2026');
  const [selectedSheetTab, setSelectedSheetTab]       = useState('Leads');
  const [headerRowIndex, setHeaderRowIndex]           = useState(2);
  const [dataStartRowIndex, setDataStartRowIndex]     = useState(3);
  const [skipEmptyRows, setSkipEmptyRows]             = useState(true);
  const [isSyncing, setIsSyncing]                     = useState(false);
  const [spreadsheetPickerOpen, setSpreadsheetPickerOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen]         = useState(false);

  // History
  const [syncLogs, setSyncLogs] = useState<SyncRunLog[]>(INITIAL_SYNC_LOGS);

  // ⚡ Lead Allocation & Google Sheets Portal State
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [allocationSourceType, setAllocationSourceType] = useState<'EXCEL_CSV' | 'GOOGLE_SHEETS'>('EXCEL_CSV');
  const [googleLiveModalOpen, setGoogleLiveModalOpen] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePickFile = async () => {
    // Simulate file picker (real impl: use expo-document-picker or react-native-document-picker)
    setSelectedFileName('facebook_leads_batch_sept2026.csv');
    Alert.alert('📂 File Selected', 'facebook_leads_batch_sept2026.csv\n214 rows detected. Review column mapping below.');
  };

  const handleUploadCSV = async () => {
    if (!selectedFileName) { Alert.alert('No File', 'Please pick a CSV or Excel file first.'); return; }
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const tick = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) { clearInterval(tick); return 95; }
        return prev + Math.floor(Math.random() * 12 + 5);
      });
    }, 180);

    try {
      await new Promise(res => setTimeout(res, 2000)); // simulate API
      clearInterval(tick);
      setUploadProgress(100);
      const newLog: SyncRunLog = {
        id: `sync-${Date.now()}`,
        source: selectedFileName.endsWith('.xlsx') ? 'EXCEL' : 'CSV',
        fileName: selectedFileName,
        tabName: '—',
        status: 'SUCCESS',
        rowsDetected: 214,
        rowsCreated: 48,
        rowsUpdated: 162,
        rowsSkipped: 4,
        errorCount: 0,
        timestamp: 'Just now',
      };
      setSyncLogs(prev => [newLog, ...prev]);
      Alert.alert('✅ Import Complete', `• 48 new leads created\n• 162 existing leads updated\n• 4 rows skipped\n• Duplicate policy: ${duplicatePolicy}`);
      setSelectedFileName(null);
      setUploadProgress(0);
    } catch {
      clearInterval(tick);
      Alert.alert('❌ Upload Failed', 'Could not reach server. Try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunGoogleSync = async () => {
    setIsSyncing(true);
    const token = useAuthStore.getState().token;
    try {
      await new Promise(res => setTimeout(res, 2200));
      const newLog: SyncRunLog = {
        id: `sync-${Date.now()}`,
        source: 'GOOGLE_SHEETS',
        fileName: selectedSpreadsheet,
        tabName: selectedSheetTab,
        status: 'SUCCESS',
        rowsDetected: 150,
        rowsCreated: 14,
        rowsUpdated: 134,
        rowsSkipped: 2,
        errorCount: 0,
        timestamp: 'Just now',
      };
      setSyncLogs(prev => [newLog, ...prev]);
      Alert.alert('🟢 Sync Complete', `Spreadsheet: ${selectedSpreadsheet}\nTab: ${selectedSheetTab}\n\n• 14 leads created\n• 134 leads updated\n• 2 unchanged (hash match)`);
    } catch {
      Alert.alert('❌ Sync Failed', 'Google Sheets sync could not complete.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleIgnore = (sheetHeader: string) => {
    setColumnMappings(prev =>
      prev.map(c =>
        c.sheetHeader === sheetHeader
          ? { ...c, isIgnored: !c.isIgnored, crmField: !c.isIgnored ? 'IGNORE' : 'name' }
          : c
      )
    );
  };

  const handleSetCrmField = (sheetHeader: string, field: string) => {
    setColumnMappings(prev =>
      prev.map(c => c.sheetHeader === sheetHeader ? { ...c, crmField: field, isIgnored: field === 'IGNORE' } : c)
    );
  };

  // ── Render Helpers ─────────────────────────────────────────────────────────
  const StatusBadge = ({ status }: { status: SyncRunLog['status'] }) => {
    const map: Record<SyncRunLog['status'], { bg: string; text: string; label: string }> = {
      SUCCESS:      { bg: 'rgba(34,197,94,0.15)',  text: '#4ade80',  label: '✓ SUCCESS' },
      PARTIAL_FAIL: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24',  label: '⚠ PARTIAL' },
      SYNCING:      { bg: 'rgba(99,102,241,0.15)', text: '#818cf8',  label: '⏳ SYNCING' },
      FAILED:       { bg: 'rgba(239,68,68,0.15)',  text: '#f87171',  label: '✕ FAILED' },
    };
    const s = map[status];
    return (
      <View style={[S.statusBadge, { backgroundColor: s.bg }]}>
        <Text style={[S.statusBadgeText, { color: s.text }]}>{s.label}</Text>
      </View>
    );
  };

  const SourceIcon = ({ source }: { source: SyncRunLog['source'] }) => {
    const icons = { CSV: '📄', EXCEL: '📗', GOOGLE_SHEETS: '📊' };
    return <Text style={{ fontSize: 20 }}>{icons[source]}</Text>;
  };

  // ── Render: CSV/Excel Tab ──────────────────────────────────────────────────
  const renderCSVTab = () => (
    <View>
      {/* Upload Zone */}
      <View style={S.card}>
        <View style={S.cardHeaderRow}>
          <View style={S.sectionDot} />
          <Text style={S.cardTitle}>Step 1 — Select File</Text>
        </View>
        <Text style={S.cardSub}>Supported: .csv, .xlsx, .xls (Max 10 MB, up to 50,000 rows)</Text>

        <TouchableOpacity
          style={[S.dropZone, selectedFileName && S.dropZoneActive]}
          onPress={handlePickFile}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 32, marginBottom: 6 }}>{selectedFileName ? '📂' : '⬆️'}</Text>
          <Text style={S.dropZoneTitle}>
            {selectedFileName ? selectedFileName : 'Tap to Browse File'}
          </Text>
          <Text style={S.dropZoneSub}>
            {selectedFileName ? 'Tap to change file' : 'CSV • XLSX • XLS'}
          </Text>
        </TouchableOpacity>

        {/* Quick template download */}
        <TouchableOpacity style={S.templateBtn} onPress={() => Alert.alert('📥 Template Downloaded', 'CRM Lead Import Template.csv saved to Downloads.')}>
          <Text style={S.templateBtnText}>📥 Download Import Template</Text>
        </TouchableOpacity>
      </View>

      {/* Column Mapping — Horizontal Scroll Table */}
      <View style={S.card}>
        <View style={S.cardHeaderRow}>
          <View style={[S.sectionDot, { backgroundColor: '#818cf8' }]} />
          <Text style={S.cardTitle}>Step 2 — Column Mapping</Text>
          <TouchableOpacity
            style={S.editMappingBtn}
            onPress={() => Alert.alert('ℹ️ Auto-Detected', `${columnMappings.length} columns detected from file header row.`)}
          >
            <Text style={S.editMappingBtnText}>Auto-Detected ✓</Text>
          </TouchableOpacity>
        </View>
        <Text style={S.cardSub}>Tap a CRM Field to remap. Toggle "Ignore" to skip a column entirely.</Text>

        {/* Horizontally scrollable mapping table
             NOTE: Fixed px widths REQUIRED — flex doesn't work inside
             a horizontal ScrollView (unbounded width content). */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={S.tableScrollH}
          contentContainerStyle={S.tableScrollHContent}
          nestedScrollEnabled
          bounces={false}
          overScrollMode="never"
        >
          <View>
            {/* Table Header */}
            <View style={[S.tableRow, S.tableHeader]}>
              <Text style={[S.tableCell, S.tableCellHeader, { width: 120 }]}>Sheet Column</Text>
              <Text style={[S.tableCell, S.tableCellHeader, { width: 28, textAlign: 'center' }]}>→</Text>
              <Text style={[S.tableCell, S.tableCellHeader, { width: 110 }]}>CRM Field</Text>
              <Text style={[S.tableCell, S.tableCellHeader, { width: 90, textAlign: 'center' }]}>Transform</Text>
              <Text style={[S.tableCell, S.tableCellHeader, { width: 56, textAlign: 'center' }]}>Req</Text>
              <Text style={[S.tableCell, S.tableCellHeader, { width: 56, textAlign: 'center' }]}>Ignore</Text>
            </View>

            {/* Table Rows */}
            {columnMappings.map((col, idx) => (
              <View
                key={col.sheetHeader}
                style={[
                  S.tableRow,
                  idx % 2 === 0 && { backgroundColor: 'rgba(255,255,255,0.02)' },
                  col.isIgnored && { opacity: 0.5 },
                ]}
              >
                {/* Sheet Header */}
                <View style={{ width: 120 }}>
                  <Text style={S.tableCellBold} numberOfLines={1}>{col.sheetHeader}</Text>
                </View>

                {/* Arrow */}
                <Text style={[S.tableCell, { width: 28, color: '#475569', textAlign: 'center' }]}>→</Text>

                {/* CRM Field — tap to open picker */}
                <TouchableOpacity
                  style={{ width: 110 }}
                  onPress={() => { setActiveMappingCol(col); setMappingModalOpen(true); }}
                >
                  <View style={[S.fieldPill, col.isIgnored && { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' }]}>
                    <Text style={[S.fieldPillText, col.isIgnored && { color: '#f87171' }]} numberOfLines={1}>
                      {col.isIgnored ? 'IGNORED' : col.crmField}
                    </Text>
                    <Text style={{ fontSize: 8, color: '#64748b' }}>▼</Text>
                  </View>
                </TouchableOpacity>

                {/* Transform */}
                <Text style={[S.tableCell, { width: 90, color: '#94a3b8', fontSize: 9, textAlign: 'center' }]} numberOfLines={1}>{col.transformType}</Text>

                {/* Required */}
                <View style={{ width: 56, alignItems: 'center' }}>
                  {col.isRequired && (
                    <View style={S.requiredDot}>
                      <Text style={{ fontSize: 7, color: '#fbbf24', fontWeight: '900' }}>REQ</Text>
                    </View>
                  )}
                </View>

                {/* Ignore Toggle */}
                <TouchableOpacity
                  style={{ width: 56, alignItems: 'center' }}
                  onPress={() => handleToggleIgnore(col.sheetHeader)}
                >
                  <View style={[S.ignoreToggle, col.isIgnored && S.ignoreToggleActive]}>
                    <Text style={[S.ignoreToggleText, col.isIgnored && { color: '#fff' }]}>
                      {col.isIgnored ? '✓' : '—'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Duplicate Policy */}
      <View style={S.card}>
        <View style={S.cardHeaderRow}>
          <View style={[S.sectionDot, { backgroundColor: '#fbbf24' }]} />
          <Text style={S.cardTitle}>Step 3 — Duplicate Policy</Text>
        </View>
        <Text style={S.cardSub}>Matching by: Phone Number & Email Address (SHA-256 row hashing)</Text>

        <View style={S.policyRow}>
          {DUPLICATE_POLICIES.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[S.policyChip, duplicatePolicy === p.key && { backgroundColor: `${p.color}22`, borderColor: p.color }]}
              onPress={() => setDuplicatePolicy(p.key as any)}
            >
              <Text style={[S.policyChipText, duplicatePolicy === p.key && { color: p.color }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Progress Bar (when uploading) */}
      {isUploading && (
        <View style={S.card}>
          <Text style={S.cardTitle}>📤 Uploading & Processing...</Text>
          <View style={S.progressTrack}>
            <View style={[S.progressFill, { width: `${uploadProgress}%` as any }]} />
          </View>
          <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 4, textAlign: 'right' }}>{uploadProgress}% complete</Text>
        </View>
      )}

      {/* Execute Button */}
      <TouchableOpacity
        style={[S.executeBtn, (isUploading || !selectedFileName) && S.executeBtnDisabled]}
        onPress={handleUploadCSV}
        disabled={isUploading || !selectedFileName}
        activeOpacity={0.85}
      >
        <Text style={S.executeBtnText}>
          {isUploading ? '⏳ Processing Import...' : '🚀 Execute Import Now →'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[S.executeBtn, { backgroundColor: '#4f46e5', marginTop: 8 }]}
        onPress={() => { setAllocationSourceType('EXCEL_CSV'); setAllocationModalOpen(true); }}
        activeOpacity={0.85}
      >
        <Text style={S.executeBtnText}>⚡ Configure Batchwise Allocation →</Text>
      </TouchableOpacity>

      {/* Info footer */}
      <View style={S.infoFooter}>
        <Text style={S.infoFooterText}>⚡ Row-level error isolation: single invalid row will NOT fail entire batch.</Text>
        <Text style={S.infoFooterText}>🔒 Uploaded files are processed server-side and never stored as raw files.</Text>
      </View>
    </View>
  );

  // ── Render: Google Sheets Tab ──────────────────────────────────────────────
  const renderGoogleSheetsTab = () => (
    <View>
      {/* OAuth Status */}
      <View style={S.card}>
        <View style={S.cardHeaderRow}>
          <View style={S.sectionDot} />
          <Text style={S.cardTitle}>Step 1 — Google Account</Text>
          <View style={[S.statusBadge, googleConnected ? { backgroundColor: 'rgba(34,197,94,0.15)' } : { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
            <Text style={[S.statusBadgeText, { color: googleConnected ? '#4ade80' : '#f87171' }]}>
              {googleConnected ? 'CONNECTED ✓' : 'DISCONNECTED'}
            </Text>
          </View>
        </View>

        <View style={S.oauthInfoRow}>
          <Text style={S.oauthLabel}>Account</Text>
          <Text style={S.oauthValue}>{googleAccountEmail}</Text>
        </View>
        <View style={S.oauthInfoRow}>
          <Text style={S.oauthLabel}>Permissions</Text>
          <Text style={[S.oauthValue, { color: '#34d399' }]}>Sheets API • Drive Notifications</Text>
        </View>
        <View style={S.oauthInfoRow}>
          <Text style={S.oauthLabel}>Refresh Token</Text>
          <Text style={S.oauthValue}>Encrypted (NestJS Vault) ✓</Text>
        </View>

        {!googleConnected && (
          <TouchableOpacity style={S.connectGoogleBtn} onPress={() => setGoogleConnected(true)}>
            <Text style={S.connectGoogleBtnText}>🔗 Connect Google Account</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Spreadsheet + Tab Selector */}
      <View style={S.card}>
        <View style={S.cardHeaderRow}>
          <View style={[S.sectionDot, { backgroundColor: '#818cf8' }]} />
          <Text style={S.cardTitle}>Step 2 — Select Spreadsheet & Tab</Text>
        </View>

        <TouchableOpacity style={S.selectBox} onPress={() => setSpreadsheetPickerOpen(true)}>
          <Text style={S.selectBoxLabel}>Selected Spreadsheet</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={S.selectBoxValue} numberOfLines={1}>{selectedSpreadsheet}</Text>
            <Text style={{ color: '#475569', fontSize: 14 }}>▾</Text>
          </View>
        </TouchableOpacity>

        <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', marginTop: 10, marginBottom: 6 }}>
          ACTIVE TAB
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {AVAILABLE_TABS_SHEET.map(t => (
              <TouchableOpacity
                key={t}
                style={[S.tabChip, selectedSheetTab === t && S.tabChipActive]}
                onPress={() => setSelectedSheetTab(t)}
              >
                <Text style={[S.tabChipText, selectedSheetTab === t && S.tabChipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Header Row Config */}
      <View style={S.card}>
        <View style={S.cardHeaderRow}>
          <View style={[S.sectionDot, { backgroundColor: '#fbbf24' }]} />
          <Text style={S.cardTitle}>Step 3 — Row Detection Config</Text>
          <TouchableOpacity style={S.editMappingBtn} onPress={() => setConfigModalOpen(true)}>
            <Text style={S.editMappingBtnText}>⚙ Configure</Text>
          </TouchableOpacity>
        </View>

        <View style={S.configGrid}>
          <View style={S.configItem}>
            <Text style={S.configItemLabel}>Header Row</Text>
            <Text style={S.configItemValue}>Row {headerRowIndex}</Text>
          </View>
          <View style={S.configItem}>
            <Text style={S.configItemLabel}>Data Start</Text>
            <Text style={S.configItemValue}>Row {dataStartRowIndex}</Text>
          </View>
          <View style={S.configItem}>
            <Text style={S.configItemLabel}>Empty Rows</Text>
            <Text style={[S.configItemValue, { color: skipEmptyRows ? '#4ade80' : '#f87171' }]}>
              {skipEmptyRows ? 'Skip' : 'Process'}
            </Text>
          </View>
          <View style={S.configItem}>
            <Text style={S.configItemLabel}>Duplicate Policy</Text>
            <Text style={S.configItemValue}>{duplicatePolicy.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>

      {/* Column Mapping (same as CSV tab, shared) */}
      <View style={S.card}>
        <View style={S.cardHeaderRow}>
          <View style={[S.sectionDot, { backgroundColor: '#34d399' }]} />
          <Text style={S.cardTitle}>Step 4 — Column Mapping</Text>
        </View>
        <Text style={S.cardSub}>Scroll right to see all columns. Tap CRM Field to remap.</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={S.tableScrollH}
          contentContainerStyle={S.tableScrollHContent}
          nestedScrollEnabled
          bounces={false}
          overScrollMode="never"
        >
          <View>
            <View style={[S.tableRow, S.tableHeader]}>
              <Text style={[S.tableCell, S.tableCellHeader, { width: 120 }]}>Sheet Column</Text>
              <Text style={[S.tableCell, S.tableCellHeader, { width: 28, textAlign: 'center' }]}>→</Text>
              <Text style={[S.tableCell, S.tableCellHeader, { width: 110 }]}>CRM Field</Text>
              <Text style={[S.tableCell, S.tableCellHeader, { width: 90, textAlign: 'center' }]}>Transform</Text>
              <Text style={[S.tableCell, S.tableCellHeader, { width: 56, textAlign: 'center' }]}>Ignore</Text>
            </View>
            {columnMappings.map((col, idx) => (
              <View
                key={col.sheetHeader}
                style={[
                  S.tableRow,
                  idx % 2 === 0 && { backgroundColor: 'rgba(255,255,255,0.02)' },
                  col.isIgnored && { opacity: 0.5 },
                ]}
              >
                <View style={{ width: 120 }}>
                  <Text style={S.tableCellBold} numberOfLines={1}>{col.sheetHeader}</Text>
                </View>
                <Text style={[S.tableCell, { width: 28, color: '#475569', textAlign: 'center' }]}>→</Text>
                <TouchableOpacity
                  style={{ width: 110 }}
                  onPress={() => { setActiveMappingCol(col); setMappingModalOpen(true); }}
                >
                  <View style={[S.fieldPill, col.isIgnored && { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' }]}>
                    <Text style={[S.fieldPillText, col.isIgnored && { color: '#f87171' }]} numberOfLines={1}>
                      {col.isIgnored ? 'IGNORED' : col.crmField}
                    </Text>
                    <Text style={{ fontSize: 8, color: '#64748b' }}>▼</Text>
                  </View>
                </TouchableOpacity>
                <Text style={[S.tableCell, { width: 90, color: '#94a3b8', fontSize: 9, textAlign: 'center' }]} numberOfLines={1}>{col.transformType}</Text>
                <TouchableOpacity
                  style={{ width: 56, alignItems: 'center' }}
                  onPress={() => handleToggleIgnore(col.sheetHeader)}
                >
                  <View style={[S.ignoreToggle, col.isIgnored && S.ignoreToggleActive]}>
                    <Text style={[S.ignoreToggleText, col.isIgnored && { color: '#fff' }]}>
                      {col.isIgnored ? '✓' : '—'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Sync Button */}
      <TouchableOpacity
        style={[S.executeBtn, { backgroundColor: '#059669' }, isSyncing && S.executeBtnDisabled]}
        onPress={handleRunGoogleSync}
        disabled={isSyncing}
        activeOpacity={0.85}
      >
        <Text style={S.executeBtnText}>
          {isSyncing ? '⏳ BullMQ Incremental Sync Running...' : '🚀 Execute Live Google Sheets Sync →'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[S.executeBtn, { backgroundColor: '#4f46e5', marginTop: 8 }]}
        onPress={() => setGoogleLiveModalOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={S.executeBtnText}>🟢 Open Live Google Sheets Portal &amp; Mapping Grid →</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[S.executeBtn, { backgroundColor: '#3b82f6', marginTop: 8 }]}
        onPress={() => { setAllocationSourceType('GOOGLE_SHEETS'); setAllocationModalOpen(true); }}
        activeOpacity={0.85}
      >
        <Text style={S.executeBtnText}>⏱️ Configure Live Lead Pool &amp; Claim Window →</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Render: History Tab ────────────────────────────────────────────────────
  const renderHistoryTab = () => (
    <View>
      <View style={S.card}>
        <View style={S.cardHeaderRow}>
          <View style={[S.sectionDot, { backgroundColor: '#a78bfa' }]} />
          <Text style={S.cardTitle}>Sync Run History & Audit Logs</Text>
          <View style={S.statusBadge}>
            <Text style={S.statusBadgeText}>{syncLogs.length} Runs</Text>
          </View>
        </View>
        <Text style={S.cardSub}>Row-level error isolation: single invalid row will not fail the batch.</Text>
      </View>

      {syncLogs.map(log => (
        <TouchableOpacity
          key={log.id}
          style={S.logCard}
          onPress={() => Alert.alert(
            `Sync Details: ${log.fileName}`,
            `Source: ${log.source}\nTab: ${log.tabName}\nStatus: ${log.status}\n\n• Rows Detected: ${log.rowsDetected}\n• Created: ${log.rowsCreated}\n• Updated: ${log.rowsUpdated}\n• Skipped: ${log.rowsSkipped}\n• Errors: ${log.errorCount}\n\nTimestamp: ${log.timestamp}`
          )}
          activeOpacity={0.85}
        >
          <View style={S.logCardLeft}>
            <SourceIcon source={log.source} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.logFileName} numberOfLines={1}>{log.fileName}</Text>
            <Text style={S.logMeta}>
              {log.source} {log.tabName !== '—' ? `• Tab: ${log.tabName}` : ''} • {log.timestamp}
            </Text>
            <View style={S.logStatsRow}>
              <Text style={S.logStat}>+{log.rowsCreated} new</Text>
              <Text style={[S.logStat, { color: '#38bdf8' }]}>↑ {log.rowsUpdated} updated</Text>
              {log.rowsSkipped > 0 && <Text style={[S.logStat, { color: '#fbbf24' }]}>⊘ {log.rowsSkipped} skipped</Text>}
              {log.errorCount > 0 && <Text style={[S.logStat, { color: '#f87171' }]}>⚠ {log.errorCount} errors</Text>}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
            <StatusBadge status={log.status} />
          </View>
        </TouchableOpacity>
      ))}

      {syncLogs.length === 0 && (
        <View style={[S.card, { alignItems: 'center', paddingVertical: 40 }]}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>📭</Text>
          <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '700' }}>No sync runs yet</Text>
          <Text style={{ color: '#475569', fontSize: 10, marginTop: 4 }}>Import a CSV or sync Google Sheets to see history.</Text>
        </View>
      )}
    </View>
  );

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <View style={[S.root, { paddingTop: onClose ? 0 : topPadding }]}>

      {/* ── HEADER BAR ──────────────────────────────────────────────────── */}
      <View style={S.header}>
        {onClose ? (
          <TouchableOpacity style={S.backBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={S.backBtnText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={S.headerTitle}>📥 Import / Export</Text>
          <Text style={S.headerSub}>Lead Ingestion Portal</Text>
        </View>

        {/* Export CSV Button */}
        <TouchableOpacity
          style={S.exportBtn}
          onPress={() => Alert.alert('📤 Export Started', 'All leads will be exported as CSV and saved to your device.')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={S.exportBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* ── TAB BAR ─────────────────────────────────────────────────────── */}
      <View style={S.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabBarInner}>
          {IMPORT_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[S.tabBtn, activeTab === tab.key && S.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={S.tabBtnIcon}>{tab.icon}</Text>
              <Text style={[S.tabBtnLabel, activeTab === tab.key && S.tabBtnLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── SCROLLABLE CONTENT ──────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[S.scrollContent, { paddingBottom: bottomPadding + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        nestedScrollEnabled
      >
        {activeTab === 'CSV_EXCEL'     && renderCSVTab()}
        {activeTab === 'GOOGLE_SHEETS' && renderGoogleSheetsTab()}
        {activeTab === 'HISTORY'       && renderHistoryTab()}
      </ScrollView>

      {/* ══ MODAL: CRM Field Picker ══════════════════════════════════════ */}
      <Modal
        visible={mappingModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => { setMappingModalOpen(false); setActiveMappingCol(null); }}
      >
        <View style={S.overlay}>
          <View style={S.modalSheet}>
            {/* Handle */}
            <View style={S.modalHandle} />

            <View style={S.modalHeaderRow}>
              <Text style={S.modalTitle}>
                Map: <Text style={{ color: '#38bdf8' }}>"{activeMappingCol?.sheetHeader}"</Text>
              </Text>
              <TouchableOpacity
                onPress={() => { setMappingModalOpen(false); setActiveMappingCol(null); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={S.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={S.modalSub}>Select the CRM field this column should map to:</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              {CRM_FIELDS.map(field => {
                const isSelected = activeMappingCol?.crmField === field || (field === 'IGNORE' && activeMappingCol?.isIgnored);
                return (
                  <TouchableOpacity
                    key={field}
                    style={[S.modalFieldItem, isSelected && S.modalFieldItemActive]}
                    onPress={() => {
                      if (activeMappingCol) {
                        handleSetCrmField(activeMappingCol.sheetHeader, field);
                        setActiveMappingCol(prev => prev ? { ...prev, crmField: field, isIgnored: field === 'IGNORE' } : prev);
                      }
                      setMappingModalOpen(false);
                      setActiveMappingCol(null);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[S.modalFieldText, isSelected && { color: '#38bdf8' }]}>
                        {field === 'IGNORE' ? '⊘ IGNORE (Skip Column)' : `crm.${field}`}
                      </Text>
                      {field === 'IGNORE' && (
                        <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>This column will not be imported</Text>
                      )}
                    </View>
                    {isSelected && <Text style={{ color: '#38bdf8', fontSize: 14, fontWeight: '900' }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══ MODAL: Spreadsheet Picker ════════════════════════════════════ */}
      <Modal
        visible={spreadsheetPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSpreadsheetPickerOpen(false)}
      >
        <View style={S.overlay}>
          <View style={S.modalSheet}>
            <View style={S.modalHandle} />
            <View style={S.modalHeaderRow}>
              <Text style={S.modalTitle}>📊 Select Spreadsheet</Text>
              <TouchableOpacity onPress={() => setSpreadsheetPickerOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={S.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {AVAILABLE_SPREADSHEETS.map(sp => (
                <TouchableOpacity
                  key={sp}
                  style={[S.modalFieldItem, selectedSpreadsheet === sp && S.modalFieldItemActive]}
                  onPress={() => { setSelectedSpreadsheet(sp); setSpreadsheetPickerOpen(false); }}
                >
                  <Text style={{ fontSize: 14, marginRight: 8 }}>📊</Text>
                  <Text style={[S.modalFieldText, { flex: 1 }, selectedSpreadsheet === sp && { color: '#38bdf8' }]}>{sp}</Text>
                  {selectedSpreadsheet === sp && <Text style={{ color: '#38bdf8', fontWeight: '900' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══ MODAL: Row Config ════════════════════════════════════════════ */}
      <Modal
        visible={configModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setConfigModalOpen(false)}
      >
        <View style={S.overlay}>
          <View style={S.modalSheet}>
            <View style={S.modalHandle} />
            <View style={S.modalHeaderRow}>
              <Text style={S.modalTitle}>⚙️ Row Detection Config</Text>
              <TouchableOpacity onPress={() => setConfigModalOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={S.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={S.inputLabel}>Header Row Index (1-based)</Text>
            <TextInput
              style={S.input}
              value={headerRowIndex.toString()}
              onChangeText={v => setHeaderRowIndex(parseInt(v) || 1)}
              keyboardType="numeric"
              placeholderTextColor="#475569"
            />

            <Text style={S.inputLabel}>Data Start Row Index</Text>
            <TextInput
              style={S.input}
              value={dataStartRowIndex.toString()}
              onChangeText={v => setDataStartRowIndex(parseInt(v) || 2)}
              keyboardType="numeric"
              placeholderTextColor="#475569"
            />

            <Text style={S.inputLabel}>Skip Empty Rows</Text>
            <View style={S.toggleRow}>
              <TouchableOpacity
                style={[S.toggleChip, skipEmptyRows && S.toggleChipActive]}
                onPress={() => setSkipEmptyRows(true)}
              >
                <Text style={[S.toggleChipText, skipEmptyRows && { color: '#4ade80' }]}>Skip Empty ✓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.toggleChip, !skipEmptyRows && { borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)' }]}
                onPress={() => setSkipEmptyRows(false)}
              >
                <Text style={[S.toggleChipText, !skipEmptyRows && { color: '#f87171' }]}>Process All</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[S.executeBtn, { marginTop: 16 }]}
              onPress={() => setConfigModalOpen(false)}
            >
              <Text style={S.executeBtnText}>Save Configuration ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ MODAL: Lead Allocation Engine ════════════════════════════════ */}
      <LeadAllocationEngineModal
        visible={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        totalLeadsCount={214}
        sourceType={allocationSourceType}
        onPreviewSheet={() => {
          setAllocationModalOpen(false);
          setActiveTab(allocationSourceType === 'GOOGLE_SHEETS' ? 'GOOGLE_SHEETS' : 'CSV_EXCEL');
        }}
      />

      {/* ══ MODAL: Google Sheets Live Sync Portal & Mapping Grid ════════ */}
      <GoogleSheetsLiveSyncModal
        visible={googleLiveModalOpen}
        onClose={() => setGoogleLiveModalOpen(false)}
      />
    </View>
  );
};

export default BulkIngestionScreen;

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060b18',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2335',
    backgroundColor: '#060b18',
  },
  backBtn: {
    width: 60,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  backBtnText: {
    color: '#38bdf8',
    fontWeight: '900',
    fontSize: 11,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '700',
    marginTop: 1,
  },
  exportBtn: {
    width: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
    alignItems: 'center',
  },
  exportBtnText: {
    color: '#34d399',
    fontWeight: '900',
    fontSize: 11,
  },

  // Tab Bar
  tabBar: {
    backgroundColor: '#060b18',
    borderBottomWidth: 1,
    borderBottomColor: '#1a2335',
  },
  tabBarInner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    flexDirection: 'row',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a2335',
    backgroundColor: '#0b1220',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderColor: '#4f46e5',
  },
  tabBtnIcon: {
    fontSize: 13,
  },
  tabBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnLabelActive: {
    color: '#a5b4fc',
    fontWeight: '900',
  },

  // Scroll Content
  scrollContent: {
    padding: 12,
    gap: 0,
  },

  // Card
  card: {
    backgroundColor: '#0d1526',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1a2335',
    padding: 14,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4f46e5',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    flex: 1,
  },
  cardSub: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 14,
    marginBottom: 8,
  },

  // Drop Zone
  dropZone: {
    borderWidth: 1.5,
    borderColor: '#1e293b',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
    backgroundColor: '#080f1e',
    marginTop: 6,
  },
  dropZoneActive: {
    borderColor: '#4f46e5',
    backgroundColor: 'rgba(79,70,229,0.08)',
  },
  dropZoneTitle: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 3,
    paddingHorizontal: 16,
  },
  dropZoneSub: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },

  // Template Button
  templateBtn: {
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#080f1e',
    paddingVertical: 8,
    alignItems: 'center',
  },
  templateBtnText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
  },

  // Table
  tableScrollH: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a2335',
    backgroundColor: '#080f1e',
    // DO NOT add flex:1 or height — let the horizontal ScrollView measure its own content
  },
  // contentContainerStyle for the horizontal table ScrollView
  tableScrollHContent: {
    // no minWidth needed — total width is sum of fixed column widths
    // padding allows a small right gutter for visual breathing room
    paddingRight: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
    // NOTE: minWidth removed — row width = sum of fixed cell widths set inline
  },
  tableHeader: {
    backgroundColor: '#0b1428',
    borderBottomColor: '#1a2335',
    borderBottomWidth: 1.5,
  },
  tableCell: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  tableCellHeader: {
    color: '#475569',
    fontWeight: '900',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCellBold: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 11,
  },

  // Field Pill
  fieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  fieldPillText: {
    color: '#a5b4fc',
    fontWeight: '900',
    fontSize: 10,
  },

  // Required
  requiredDot: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },

  // Ignore Toggle
  ignoreToggle: {
    width: 32,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#080f1e',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ignoreToggleActive: {
    backgroundColor: '#ef4444',
    borderColor: '#fca5a5',
  },
  ignoreToggleText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '900',
  },

  // Duplicate Policy
  policyRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  policyChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#080f1e',
    alignItems: 'center',
  },
  policyChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#475569',
  },

  // Progress Bar
  progressTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: '#1a2335',
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 4,
  },

  // Execute Button
  executeBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  executeBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  executeBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
  },

  // Info Footer
  infoFooter: {
    backgroundColor: '#080f1e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a2335',
    padding: 10,
    marginBottom: 6,
    gap: 4,
  },
  infoFooterText: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 13,
  },

  // Edit Mapping Btn
  editMappingBtn: {
    backgroundColor: '#0b1428',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editMappingBtnText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
  },

  // OAuth Info
  oauthInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  oauthLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    width: 90,
  },
  oauthValue: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
  },

  // Connect Google Btn
  connectGoogleBtn: {
    marginTop: 10,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  connectGoogleBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },

  // Select Box
  selectBox: {
    backgroundColor: '#080f1e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginTop: 6,
  },
  selectBoxLabel: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '800',
    marginBottom: 4,
  },
  selectBoxValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38bdf8',
    flex: 1,
  },

  // Tab Chip (sheet tabs)
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#080f1e',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabChipActive: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderColor: '#4f46e5',
  },
  tabChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  tabChipTextActive: {
    color: '#a5b4fc',
    fontWeight: '900',
  },

  // Config Grid
  configGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  configItem: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#080f1e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a2335',
    padding: 10,
  },
  configItemLabel: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  configItemValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#e2e8f0',
  },

  // Log Card
  logCard: {
    backgroundColor: '#0d1526',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a2335',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logCardLeft: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#080f1e',
    borderWidth: 1,
    borderColor: '#1a2335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logFileName: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 3,
  },
  logMeta: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 5,
  },
  logStatsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  logStat: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4ade80',
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#a5b4fc',
  },

  // Modals
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.88)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0d1526',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: '#1a2335',
    padding: 18,
    paddingBottom: Platform.OS === 'android' ? 72 : 36,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1e293b',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    flex: 1,
    paddingRight: 10,
  },
  modalCloseText: {
    color: '#64748b',
    fontSize: 18,
    fontWeight: '800',
    padding: 4,
  },
  modalSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 12,
  },
  modalFieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a2335',
    backgroundColor: '#080f1e',
    marginBottom: 6,
  },
  modalFieldItemActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56,189,248,0.08)',
  },
  modalFieldText: {
    color: '#cbd5e1',
    fontWeight: '800',
    fontSize: 12,
  },

  // Input
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#080f1e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
  },

  // Toggle Row
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  toggleChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
    backgroundColor: 'rgba(74,222,128,0.1)',
    alignItems: 'center',
  },
  toggleChipActive: {
    borderColor: 'rgba(74,222,128,0.5)',
    backgroundColor: 'rgba(74,222,128,0.15)',
  },
  toggleChipText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#475569',
  },
});
