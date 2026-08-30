/**
 * FileImportEngineModal.tsx — DAS CRM Android
 * Interactive CSV / Excel Extraction & Ingestion Engine.
 * Smooth grid matching web LeadsTable controls: reorder columns, rename headers,
 * cycle widths, block rows/cols — responsive for phone + tablet.
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Keyboard,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface ImportedLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: string;
  value: string;
  assignedRep: string;
  city: string;
  budget: string;
  requirement: string;
  callSyncStatus: string;
  customFields: Record<string, string>;
  createdAt: string;
}

export interface FileAuditRecord {
  filename: string;
  fileSize: string;
  platform: string;
  count: number;
  date: string;
}

export interface ColumnDef {
  key: string;       // stable identity key (col_0, col_1, ...)
  header: string;    // display name (editable)
  index: number;     // original column index in file
  role: string;      // field mapping role
  blocked: boolean;  // col excluded from import
  width: number;     // display width in px
}

export interface ParsedSheet {
  name: string;
  isBlocked: boolean;
  headers: string[];
  data: string[][];        // [row][col]
  columns: ColumnDef[];    // ordered, with roles
  blockedRows: boolean[];
}

export interface FileImportEngineModalProps {
  visible: boolean;
  onClose: () => void;
  onImportSuccess: (leads: ImportedLead[], audit: FileAuditRecord) => void;
  onImportError?: (msg: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORMS = [
  'Google Ads', 'Meta Ads (FB & Insta)', 'LinkedIn Ads', 'Microsoft Ads (Bing)',
  'Pinterest Ads', 'X (Twitter) Ads', 'IndiaMART', 'TradeIndia',
  'Justdial', 'Lotwaala', 'Website Forms', 'Custom Channel',
];

const FIELD_ROLE_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'name',     label: '👤 Name',      color: '#818cf8' },
  { value: 'email',    label: '📧 Email',     color: '#f59e0b' },
  { value: 'phone',    label: '📞 Phone',     color: '#34d399' },
  { value: 'company',   label: '🏢 Company',   color: '#f472b6' },
  { value: 'value',    label: '💰 Value',      color: '#fb923c' },
  { value: 'city',      label: '📍 City',      color: '#38bdf8' },
  { value: 'budget',   label: '💵 Budget',    color: '#a78bfa' },
  { value: 'custom',   label: '📋 Custom',   color: '#94a3b8' },
  { value: 'block',    label: '🚫 Block',     color: '#ef4444' },
];

const WIDTH_CYCLE = [100, 140, 190]; // 3 width states

const inferRole = (header: string): string => {
  const h = (header || '').toLowerCase();
  if (h.includes('name') || h.includes('client') || h.includes('contact') || h.includes('full')) return 'name';
  if (h.includes('email') || h.includes('mail')) return 'email';
  if (h.includes('phone') || h.includes('mobile') || h.includes('tel') || h.includes('number')) return 'phone';
  if (h.includes('company') || h.includes('org') || h.includes('business') || h.includes('firm')) return 'company';
  if (h.includes('value') || h.includes('amount') || h.includes('price') || h.includes('deal') || h.includes('budget') || h.includes('coin')) return 'value';
  if (h.includes('city') || h.includes('location') || h.includes('area')) return 'city';
  if (h.includes('budget')) return 'budget';
  return 'custom';
};

const getRoleColor = (role: string): string =>
  FIELD_ROLE_OPTIONS.find(o => o.value === role)?.color ?? '#94a3b8';

const getRoleLabel = (role: string): string =>
  FIELD_ROLE_OPTIONS.find(o => o.value === role)?.label ?? role;

const sanitizeNumeric = (val: string): string => {
  if (!val) return '₹0';
  const clean = val.replace(/[^0-9.]/g, '');
  if (!clean) return '₹0';
  const num = parseFloat(clean);
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
};

const sanitizePhone = (val: string): string => {
  if (!val) return '';
  const clean = val.replace(/[^0-9+]/g, '');
  if (!clean.startsWith('+') && clean.length === 10) return '+91' + clean;
  return clean;
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (): string => {
  const now = new Date();
  return `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const FileImportEngineModal: React.FC<FileImportEngineModalProps> = ({
  visible,
  onClose,
  onImportSuccess,
  onImportError,
}) => {
  const { token } = useAuthStore();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTablet = screenWidth >= 600;

  // ── State ────────────────────────────────────────────────────────────────
  const [fileName, setFileName]       = useState('');
  const [fileSize, setFileSize]       = useState('');
  const [format, setFormat]           = useState('');
  const [sheets, setSheets]           = useState<ParsedSheet[]>([]);
  const [activeIdx, setActiveIdx]     = useState(0);
  const [loading, setLoading]         = useState(false);

  const [inputFileName, setInputFileName]     = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');

  // Column rename modal
  const [renameColKey, setRenameColKey]       = useState<string | null>(null);
  const [renameValue, setRenameValue]         = useState('');

  // ── Helpers ──────────────────────────────────────────────────────────────

  const activeSheet = sheets[activeIdx];

  const totalRows = sheets.reduce((a, s) => a + s.data.length, 0);
  const totalCols  = activeSheet?.columns.length ?? 0;
  const totalDataRows = activeSheet?.data.length ?? 0;

  // ── File Pick ───────────────────────────────────────────────────────────

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv', 'text/comma-separated-values',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel.sheet.macroEnabled.12',
          'text/xml', 'application/xml',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;
      const asset   = result.assets[0];
      const rawName = asset.name || 'Imported_File';
      const ext     = (rawName.split('.').pop() || 'FILE').toUpperCase();

      setFormat(rawName.split('.').pop()?.toUpperCase() || '');
      setFileName(rawName);
      setInputFileName(rawName.replace(/\.[^/.]+$/, ''));
      setFileSize(formatBytes(asset.size || 0));

      let response: ArrayBuffer | null = null;
      if (asset.uri) {
        const fr = await fetch(asset.uri);
        response = await fr.arrayBuffer();
      }
      if (!response) { Alert.alert('Error', 'Could not read file.'); return; }

      let parsed: ParsedSheet[] = [];

      if (ext === 'CSV' || ext === 'TSV' || ext === 'TXT') {
        parsed = parseCSV(new TextDecoder().decode(response), rawName);
      } else {
        const wb = XLSX.read(response, { type: 'array', cellDates: true, cellNF: true });
        parsed = wb.SheetNames.map(sheetName => {
          const ws  = wb.Sheets[sheetName];
          const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];

          let maxC = 0;
          raw.forEach(r => { if (r.length > maxC) maxC = r.length; });
          if (maxC === 0) maxC = 5;

          const matrix = raw.map(row => {
            const copy = [...row].map(v => String(v ?? '').trim());
            while (copy.length < maxC) copy.push('');
            return copy;
          });

          if (matrix.length === 0) matrix.push(['Name', 'Email', 'Phone', 'Company', 'Value']);

          const headers = matrix[0] || [];
          const columns: ColumnDef[] = headers.map((h, i) => ({
            key:    `col_${i}`,
            header:  String(h),
            index:  i,
            role:   inferRole(h),
            blocked: false,
            width:  WIDTH_CYCLE[1],
          }));

          return {
            name:        sheetName,
            isBlocked:   false,
            headers,
            data:        matrix.slice(1),
            columns,
            blockedRows: new Array(matrix.length - 1).fill(false),
          };
        });
      }

      setSheets(parsed);
      setActiveIdx(0);
    } catch (err) {
      Alert.alert('Parse Error', 'Could not read or parse the selected file.');
      console.error(err);
    }
  };

  const parseCSV = (text: string, name: string): ParsedSheet[] => {
    const lines     = text.split(/\r?\n/).filter(l => l.trim());
    const delim     = (lines[0] || '').includes('\t') ? '\t' : ',';
    const maxC      = Math.max(0, ...lines.map(l => l.split(delim).length));
    const matrix    = lines.map(l => {
      const cols = l.split(delim).map(v => v.trim().replace(/^["']|["']$/g, ''));
      while (cols.length < maxC) cols.push('');
      return cols;
    });

    if (matrix.length === 0) matrix.push(['Name', 'Email', 'Phone', 'Company', 'Value']);

    const headers  = matrix[0] || [];
    const columns: ColumnDef[] = headers.map((h, i) => ({
      key:    `col_${i}`,
      header:  String(h),
      index:  i,
      role:   inferRole(h),
      blocked: false,
      width:  WIDTH_CYCLE[1],
    }));

    return [{
      name:        name.replace(/\.[^/.]+$/, ''),
      isBlocked:   false,
      headers,
      data:        matrix.slice(1),
      columns,
      blockedRows: new Array(matrix.length - 1).fill(false),
    }];
  };

  // ── Column Controls ─────────────────────────────────────────────────────

  const moveCol = useCallback((key: string, dir: 'left' | 'right') => {
    setSheets(prev => prev.map((s, i) => {
      if (i !== activeIdx) return s;
      const idx = s.columns.findIndex(c => c.key === key);
      if (idx < 0) return s;
      const target = dir === 'left' ? idx - 1 : idx + 1;
      if (target < 0 || target >= s.columns.length) return s;
      const cols = [...s.columns];
      [cols[idx], cols[target]] = [cols[target], cols[idx]];
      return { ...s, columns: cols };
    }));
  }, [activeIdx]);

  const setColRole = useCallback((key: string, role: string) => {
    setSheets(prev => prev.map((s, i) => {
      if (i !== activeIdx) return s;
      return {
        ...s,
        columns: s.columns.map(c => c.key === key ? { ...c, role } : c),
      };
    }));
  }, [activeIdx]);

  const cycleColWidth = useCallback((key: string) => {
    setSheets(prev => prev.map((s, i) => {
      if (i !== activeIdx) return s;
      return {
        ...s,
        columns: s.columns.map(c => {
          if (c.key !== key) return c;
          const nextIdx = (WIDTH_CYCLE.indexOf(c.width) + 1) % WIDTH_CYCLE.length;
          return { ...c, width: WIDTH_CYCLE[nextIdx] };
        }),
      };
    }));
  }, [activeIdx]);

  const toggleBlockCol = useCallback((key: string) => {
    setSheets(prev => prev.map((s, i) => {
      if (i !== activeIdx) return s;
      return {
        ...s,
        columns: s.columns.map(c =>
          c.key === key ? { ...c, blocked: !c.blocked, role: !c.blocked ? 'block' : inferRole(c.header) } : c
        ),
      };
    }));
  }, [activeIdx]);

  const openRenameCol = (key: string) => {
    const col = activeSheet?.columns.find(c => c.key === key);
    if (!col) return;
    setRenameColKey(key);
    setRenameValue(col.header);
  };

  const saveColRename = () => {
    if (!renameColKey || !renameValue.trim()) { setRenameColKey(null); return; }
    setSheets(prev => prev.map((s, i) => {
      if (i !== activeIdx) return s;
      return {
        ...s,
        columns: s.columns.map(c =>
          c.key === renameColKey ? { ...c, header: renameValue.trim() } : c
        ),
      };
    }));
    setRenameColKey(null);
  };

  // ── Row Controls ────────────────────────────────────────────────────────

  const toggleBlockRow = useCallback((rIdx: number) => {
    setSheets(prev => prev.map((s, i) => {
      if (i !== activeIdx) return s;
      const copy = [...s.blockedRows];
      copy[rIdx] = !copy[rIdx];
      return { ...s, blockedRows: copy };
    }));
  }, [activeIdx]);

  const updateCell = useCallback((rIdx: number, key: string, val: string) => {
    setSheets(prev => prev.map((s, i) => {
      if (i !== activeIdx) return s;
      const colDef = s.columns.find(c => c.key === key);
      if (!colDef) return s;
      const dataCopy = s.data.map((r, ri) => ri === rIdx ? [...r] : r);
      dataCopy[rIdx][colDef.index] = val;
      return { ...s, data: dataCopy };
    }));
  }, [activeIdx]);

  const addRow = useCallback(() => {
    setSheets(prev => prev.map((s, i) => {
      if (i !== activeIdx) return s;
      const newRow = new Array(s.columns.length).fill('');
      return {
        ...s,
        data: [...s.data, newRow],
        blockedRows: [...s.blockedRows, false],
      };
    }));
  }, [activeIdx]);

  // ── Sheet Controls ───────────────────────────────────────────────────────

  const toggleBlockSheet = (idx: number) => {
    setSheets(prev => prev.map((s, i) => i === idx ? { ...s, isBlocked: !s.isBlocked } : s));
  };

  // ── Commit ──────────────────────────────────────────────────────────────

  const handleCommit = async () => {
    if (!inputFileName.trim()) { Alert.alert('Missing', 'Enter a File Name.'); return; }
    if (!selectedPlatform) { Alert.alert('Missing', 'Select a Source Platform.'); return; }

    setLoading(true);
    try {
      const leads: ImportedLead[] = [];

      sheets.forEach(sheet => {
        if (sheet.isBlocked) return;
        sheet.data.forEach((row, rIdx) => {
          if (sheet.blockedRows[rIdx]) return;

          const lead: ImportedLead = {
            id: `lead_${Date.now()}_${rIdx}`,
            name: '', email: 'No Email Provided', phone: '',
            company: 'Independent Prospect', source: selectedPlatform,
            status: 'NEW LEAD', value: '₹25,000', assignedRep: 'Rajesh Kumar',
            city: '', budget: '', requirement: '',
            callSyncStatus: 'Synced: Just Now • Pending',
            customFields: {}, createdAt: 'Just now',
          };

          let hasData = false;
          sheet.columns.forEach(col => {
            if (col.blocked) return;
            const raw = (row[col.index] || '').trim();
            if (!raw) return;
            switch (col.role) {
              case 'name':    lead.name = raw; hasData = true; break;
              case 'email':   lead.email = raw.toLowerCase(); hasData = true; break;
              case 'phone':   lead.phone = sanitizePhone(raw); hasData = true; break;
              case 'company': lead.company = raw; break;
              case 'value':   lead.value = sanitizeNumeric(raw); break;
              case 'city':    lead.city = raw; break;
              case 'budget':  lead.budget = raw; break;
              case 'custom': {
                const fk = `col_${col.header.toLowerCase().replace(/\s+/g, '_')}`;
                lead.customFields[fk] = raw;
                break;
              }
            }
          });

          if (!lead.name && (lead.email !== 'No Email Provided' || lead.phone)) {
            lead.name = lead.email !== 'No Email Provided'
              ? lead.email.split('@')[0]
              : `Lead ${leads.length + 1}`;
            hasData = true;
          }

          if (hasData) leads.push(lead);
        });
      });

      if (leads.length === 0) {
        Alert.alert('No Data', 'No valid records found. Check column mappings.');
        setLoading(false); return;
      }

      const audit: FileAuditRecord = {
        filename: `${inputFileName.trim()} (${format || 'FILE'})`,
        fileSize: fileSize || '—',
        platform: selectedPlatform,
        count: leads.length,
        date: formatDate(),
      };

      try {
        await apiService.importLeadsFromFile(token || '', {
          leads, fileName: audit.filename, fileSize: audit.fileSize,
          platform: audit.platform, importedAt: audit.date,
          sheetCount: sheets.filter(s => !s.isBlocked).length,
          totalRows: sheets.reduce((a, s) => a + s.data.length, 0),
          blockedSheets: sheets.filter(s => s.isBlocked).length,
        });
      } catch (_) { /* offline fallback */ }

      onImportSuccess(leads, audit);
      handleClose();
    } catch (err) {
      const msg = (err as Error).message || 'Unknown error';
      Alert.alert('Ingestion Failed', msg);
      onImportError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSheets([]); setActiveIdx(0); setFileName(''); setFileSize('');
    setFormat(''); setInputFileName(''); setSelectedPlatform('');
    setLoading(false); setRenameColKey(null); onClose();
  };

  const isReady = inputFileName.trim().length > 0 && selectedPlatform.length > 0 && sheets.length > 0;
  const ROW_H   = 44;
  const HDR_H   = 56;
  const ROW_CTRL_W = 48;
  const MAX_VISIBLE_ROWS = Math.floor((screenHeight - 480) / ROW_H);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={styles.container}>

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>📥 Import CSV / Excel</Text>
            <Text style={styles.headerSub}>
              {sheets.length > 0
                ? `${sheets.length} sheet${sheets.length > 1 ? 's' : ''} · ${totalDataRows} row${totalDataRows !== 1 ? 's' : ''} · ${totalCols} col${totalCols !== 1 ? 's' : ''}`
                : 'Parse on-device · Send to backend'}
            </Text>
          </View>
          {format ? (
            <View style={styles.formatBadge}><Text style={styles.formatBadgeText}>{format}</Text></View>
          ) : null}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── UPLOAD BAR ────────────────────────────────────────────────── */}
        <View style={[styles.uploadBar, isTablet && styles.uploadBarTablet]}>
          <TouchableOpacity
            style={[styles.pickBtn, isTablet && styles.pickBtnTablet]}
            onPress={handlePickFile}
            disabled={loading}
          >
            <Text style={styles.pickBtnText}>📁 {fileName ? 'Change File' : 'Select File'}</Text>
          </TouchableOpacity>

          {fileName ? (
            <View style={[styles.metaGrid, isTablet && styles.metaGridTablet]}>
              {/* File Name */}
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>File Name *</Text>
                <TextInput
                  style={[styles.metaInput, isTablet && styles.metaInputTablet]}
                  value={inputFileName}
                  onChangeText={setInputFileName}
                  placeholder="e.g. Q3_Aug_Leads"
                  placeholderTextColor="#475569"
                  autoCorrect={false}
                />
              </View>

              {/* Source Platform */}
              <View style={[styles.metaField, { flex: 2 }]}>
                <Text style={styles.metaLabel}>Source Platform *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.platformRow}>
                    {PLATFORMS.map(p => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.platformChip, selectedPlatform === p && styles.platformChipActive]}
                        onPress={() => setSelectedPlatform(p)}
                      >
                        <Text style={[styles.platformChipText, selectedPlatform === p && styles.platformChipTextActive]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          ) : null}

          {/* Analytics strip */}
          {sheets.length > 0 && (
            <View style={[styles.analyticsRow, isTablet && styles.analyticsRowTablet]}>
              {[
                { v: sheets.length,           l: 'Sheets' },
                { v: totalDataRows,           l: 'Rows' },
                { v: totalCols,                l: 'Cols' },
                { v: fileSize,                l: 'Size' },
              ].map(({ v, l }, i) => (
                <React.Fragment key={l}>
                  {i > 0 && <View style={styles.analyticDivider} />}
                  <View style={styles.analyticItem}>
                    <Text style={styles.analyticValue}>{v}</Text>
                    <Text style={styles.analyticLabel}>{l}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* ── SHEET TABS ───────────────────────────────────────────────── */}
        {sheets.length > 1 && (
          <View style={[styles.sheetTabBar, isTablet && styles.sheetTabBarTablet]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={styles.sheetTabRow}>
                {sheets.map((s, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.sheetTab,
                      activeIdx === idx && styles.sheetTabActive,
                      s.isBlocked && styles.sheetTabBlocked,
                    ]}
                    onPress={() => setActiveIdx(idx)}
                  >
                    <Text style={[styles.sheetTabText, activeIdx === idx && styles.sheetTabTextActive, s.isBlocked && styles.sheetTabTextBlocked]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    {s.isBlocked && <Text style={styles.blockedDot}>●</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.sheetBlockBtn} onPress={() => toggleBlockSheet(activeIdx)}>
              <Text style={styles.sheetBlockBtnText}>{sheets[activeIdx]?.isBlocked ? '👁' : '🚫'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── GRID AREA ────────────────────────────────────────────────── */}
        <View style={styles.gridContainer}>
          {sheets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>No File Loaded</Text>
              <Text style={styles.emptySub}>Tap "Select File" to upload CSV or Excel</Text>
            </View>
          ) : activeSheet?.isBlocked ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🚫</Text>
              <Text style={styles.emptyTitle}>Sheet Blocked</Text>
              <Text style={styles.emptySub}>Tap the eye icon above to unblock</Text>
            </View>
          ) : (
            <View style={styles.gridInner}>
              {/* ── COLUMN HEADER ROW ────────────────────────────────── */}
              <View style={styles.gridHeaderRow}>
                {/* Row-num corner cell */}
                <View style={[styles.rowNumCorner, { width: ROW_CTRL_W }]}>
                  <Text style={styles.cornerLabel}>Row</Text>
                </View>

                {/* Scrollable column headers */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row' }}>
                    {activeSheet.columns.map(col => (
                      <View key={col.key} style={[styles.colHeader, { width: col.width }]}>
                        {/* Column top bar: label + controls */}
                        <View style={styles.colHeaderTop}>
                          <TextInput
                            style={[styles.colHeaderLabel, col.blocked && styles.colHeaderLabelBlocked]}
                            value={col.header}
                            onChangeText={txt => {
                              setSheets(prev => prev.map((s, i) => i !== activeIdx ? s : {
                                ...s,
                                columns: s.columns.map(c => c.key === col.key ? { ...c, header: txt } : c),
                              }));
                            }}
                            editable={!col.blocked}
                            placeholder="Column name"
                            placeholderTextColor="#475569"
                          />
                          {/* Block col */}
                          <TouchableOpacity
                            style={[styles.colActionBtn, col.blocked && styles.colActionBtnActive]}
                            onPress={() => toggleBlockCol(col.key)}
                          >
                            <Text style={styles.colActionBtnText}>{col.blocked ? '👁' : '🚫'}</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Field role selector */}
                        {!col.blocked && (
                          <View style={styles.roleSelector}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              {FIELD_ROLE_OPTIONS.map(opt => (
                                <TouchableOpacity
                                  key={opt.value}
                                  style={[
                                    styles.roleChip,
                                    col.role === opt.value && styles.roleChipActive,
                                    { borderColor: opt.color + '60' },
                                    col.role === opt.value && { backgroundColor: opt.color + '30', borderColor: opt.color },
                                  ]}
                                  onPress={() => setColRole(col.key, opt.value)}
                                >
                                  <Text style={[
                                    styles.roleChipText,
                                    col.role === opt.value && { color: opt.color },
                                  ]}>
                                    {opt.label}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* ── DATA ROWS ─────────────────────────────────────────── */}
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
                <View style={{ paddingBottom: 80 }}>
                  {activeSheet.data.map((row, rIdx) => {
                    const isBlocked = activeSheet.blockedRows[rIdx];
                    return (
                      <View key={rIdx} style={[styles.gridRow, isBlocked && styles.gridRowBlocked]}>
                        {/* Row number + block */}
                        <View style={[styles.rowNumCell, { width: ROW_CTRL_W }]}>
                          <Text style={[styles.rowNumText, isBlocked && styles.rowNumTextBlocked]}>{rIdx + 1}</Text>
                          <TouchableOpacity
                            style={[styles.rowBlockBtn, isBlocked && styles.rowBlockBtnActive]}
                            onPress={() => toggleBlockRow(rIdx)}
                          >
                            <Text style={styles.rowBlockBtnText}>{isBlocked ? '👁' : '🚫'}</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Scrollable cells */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={{ flexDirection: 'row' }}>
                            {activeSheet.columns.map(col => {
                              const cellBlocked = col.blocked || isBlocked;
                              return (
                                <View key={col.key} style={[styles.gridCell, { width: col.width }, cellBlocked && styles.gridCellBlocked]}>
                                  <TextInput
                                    style={[
                                      styles.cellInput,
                                      col.role !== 'custom' && { color: getRoleColor(col.role) },
                                      cellBlocked && styles.cellInputBlocked,
                                    ]}
                                    value={row[col.index] || ''}
                                    editable={!cellBlocked}
                                    onChangeText={v => updateCell(rIdx, col.key, v)}
                                    placeholder="—"
                                    placeholderTextColor="#1e293b"
                                    multiline={false}
                                  />
                                </View>
                              );
                            })}
                          </View>
                        </ScrollView>
                      </View>
                    );
                  })}

                  {/* Add row button */}
                  <TouchableOpacity style={styles.addRowBtn} onPress={addRow}>
                    <Text style={styles.addRowBtnText}>+ Add Row</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <View style={[styles.footer, isTablet && styles.footerTablet]}>
          {/* Validation status */}
          <View style={styles.validationRow}>
            {!inputFileName.trim() && <Text style={styles.warnText}>⚠️ Enter File Name</Text>}
            {!selectedPlatform && inputFileName.trim() && <Text style={styles.warnText}>⚠️ Select Source Platform</Text>}
            {isReady && <Text style={styles.readyText}>✅ Ready to import {totalDataRows} record{totalDataRows !== 1 ? 's' : ''}</Text>}
          </View>

          {/* Actions */}
          <View style={[styles.footerActions, isTablet && styles.footerActionsTablet]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.injectBtn, !isReady && styles.injectBtnDisabled]}
              onPress={handleCommit}
              disabled={!isReady || loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#ffffff" />
                : <Text style={styles.injectBtnText}>✅ Confirm &amp; Import</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── RENAME COLUMN MODAL ──────────────────────────────────────── */}
        {renameColKey && (
          <View style={styles.renameOverlay}>
            <View style={[styles.renameCard, isTablet && styles.renameCardTablet]}>
              <Text style={styles.renameTitle}>✏️ Rename Column</Text>
              <TextInput
                style={styles.renameInput}
                value={renameValue}
                onChangeText={setRenameValue}
                placeholder="Column name"
                placeholderTextColor="#64748b"
                autoFocus
                onSubmitEditing={saveColRename}
              />
              <View style={styles.renameActions}>
                <TouchableOpacity style={styles.renameCancelBtn} onPress={() => setRenameColKey(null)}>
                  <Text style={styles.renameCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.renameSaveBtn} onPress={saveColRename}>
                  <Text style={styles.renameSaveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#090d16',
    paddingTop: 52, paddingBottom: 34,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  headerTablet: { paddingHorizontal: 24 },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#ffffff' },
  headerSub: { fontSize: 10, color: '#64748b', marginTop: 2 },
  formatBadge: {
    backgroundColor: '#0ea5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 10,
  },
  formatBadgeText: { fontSize: 10, fontWeight: '900', color: '#ffffff' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '900' },

  // ── Upload Bar ──────────────────────────────────────────────────────────
  uploadBar: { backgroundColor: '#0f172a', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  uploadBarTablet: { paddingHorizontal: 24 },
  pickBtn: { backgroundColor: '#4f46e5', paddingVertical: 11, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  pickBtnTablet: { paddingVertical: 13, borderRadius: 14 },
  pickBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },

  metaGrid: { gap: 8 },
  metaGridTablet: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  metaField: { marginBottom: 6 },
  metaLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 },
  metaInput: {
    backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, color: '#ffffff', fontSize: 12, fontWeight: '700',
  },
  metaInputTablet: { fontSize: 13, paddingVertical: 9 },

  platformRow: { flexDirection: 'row', gap: 6 },
  platformChip: {
    backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  platformChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  platformChipText: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  platformChipTextActive: { color: '#ffffff' },

  analyticsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#020617', borderRadius: 12, paddingVertical: 8, marginTop: 8,
    borderWidth: 1, borderColor: '#1e293b',
  },
  analyticsRowTablet: { marginTop: 12, paddingVertical: 10, borderRadius: 14 },
  analyticItem: { alignItems: 'center', flex: 1 },
  analyticValue: { fontSize: 16, fontWeight: '900', color: '#38bdf8' },
  analyticLabel: { fontSize: 9, color: '#64748b', fontWeight: '700', marginTop: 1 },
  analyticDivider: { width: 1, height: 28, backgroundColor: '#1e293b' },

  // ── Sheet Tabs ──────────────────────────────────────────────────────────
  sheetTabBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#0b1329', borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  sheetTabBarTablet: { paddingHorizontal: 24 },
  sheetTabRow: { flexDirection: 'row', gap: 6 },
  sheetTab: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7,
  },
  sheetTabActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  sheetTabBlocked: { backgroundColor: '#1e293b', borderColor: '#334155' },
  sheetTabText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  sheetTabTextActive: { color: '#ffffff' },
  sheetTabTextBlocked: { color: '#475569', textDecorationLine: 'line-through' },
  blockedDot: { color: '#ef4444', fontSize: 8, marginLeft: 4 },
  sheetBlockBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  sheetBlockBtnText: { fontSize: 16 },

  // ── Grid ────────────────────────────────────────────────────────────────
  gridContainer: { flex: 1, backgroundColor: '#030712', padding: 4 },
  gridInner: { flex: 1 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: '#ffffff', marginBottom: 4 },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center' },

  // Column Header Row
  gridHeaderRow: { flexDirection: 'row', alignItems: 'flex-start' },
  rowNumCorner: {
    height: 64, backgroundColor: '#0b1329',
    borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center',
  },
  cornerLabel: { fontSize: 10, fontWeight: '800', color: '#475569', marginTop: 2 },

  colHeader: {
    backgroundColor: '#0b1329', borderRightWidth: 1, borderBottomWidth: 2, borderColor: '#1e293b',
    paddingVertical: 6, paddingHorizontal: 4, minWidth: 100,
  },
  colHeaderTop: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  colHeaderLabel: {
    flex: 1, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4,
    color: '#e2e8f0', fontSize: 11, fontWeight: '700',
  },
  colHeaderLabelBlocked: { color: '#475569', textDecorationLine: 'line-through', backgroundColor: '#1e293b' },
  colActionBtn: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#020617',
    borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
  },
  colActionBtnActive: { backgroundColor: '#065f46', borderColor: '#34d399' },
  colActionBtnText: { fontSize: 13 },

  roleSelector: { gap: 3 },
  roleChip: {
    backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b',
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginRight: 3,
  },
  roleChipActive: {},
  roleChipText: { fontSize: 9, color: '#94a3b8', fontWeight: '700' },

  // Grid Rows
  gridRow: { flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: 1, borderColor: '#1e293b', minHeight: 44 },
  gridRowBlocked: { backgroundColor: '#1e1111', opacity: 0.7 },

  rowNumCell: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0b1329', borderRightWidth: 1, borderColor: '#1e293b',
    gap: 2, paddingVertical: 6,
  },
  rowNumText: { fontSize: 10, fontWeight: '800', color: '#475569' },
  rowNumTextBlocked: { color: '#ef4444' },
  rowBlockBtn: {
    width: 24, height: 24, borderRadius: 7, backgroundColor: '#020617',
    borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
  },
  rowBlockBtnActive: { backgroundColor: '#065f46', borderColor: '#34d399' },
  rowBlockBtnText: { fontSize: 12 },

  gridCell: {
    borderRightWidth: 1, borderColor: '#1e293b',
    justifyContent: 'center', minWidth: 100,
  },
  gridCellBlocked: { backgroundColor: '#1e293b', opacity: 0.6 },
  cellInput: {
    paddingHorizontal: 6, paddingVertical: 8, color: '#e2e8f0', fontSize: 12,
    fontWeight: '500', backgroundColor: 'transparent',
  },
  cellInputBlocked: { color: '#475569' },

  addRowBtn: {
    backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155',
    borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
    marginTop: 8, marginHorizontal: 4,
  },
  addRowBtnText: { fontSize: 12, fontWeight: '800', color: '#818cf8' },

  // ── Footer ──────────────────────────────────────────────────────────────
  footer: {
    backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 34,
  },
  footerTablet: { paddingHorizontal: 24 },
  validationRow: { marginBottom: 8 },
  warnText: { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
  readyText: { fontSize: 11, fontWeight: '700', color: '#34d399' },
  footerActions: { flexDirection: 'row', gap: 8 },
  footerActionsTablet: { gap: 12 },
  cancelBtn: {
    flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
    paddingVertical: 13, borderRadius: 12, alignItems: 'center',
  },
  cancelBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
  injectBtn: {
    flex: 2, backgroundColor: '#4f46e5', paddingVertical: 13,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  injectBtnDisabled: { opacity: 0.4 },
  injectBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },

  // ── Rename Modal ───────────────────────────────────────────────────────
  renameOverlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  renameCard: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
    borderRadius: 16, padding: 20, width: '85%', maxWidth: 360,
  },
  renameCardTablet: { maxWidth: 420, padding: 24 },
  renameTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff', marginBottom: 12 },
  renameInput: {
    backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    color: '#ffffff', fontSize: 13, fontWeight: '600', marginBottom: 16,
  },
  renameActions: { flexDirection: 'row', gap: 10 },
  renameCancelBtn: {
    flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155',
    paddingVertical: 11, borderRadius: 10, alignItems: 'center',
  },
  renameCancelBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
  renameSaveBtn: {
    flex: 1, backgroundColor: '#4f46e5', paddingVertical: 11,
    borderRadius: 10, alignItems: 'center',
  },
  renameSaveBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});
