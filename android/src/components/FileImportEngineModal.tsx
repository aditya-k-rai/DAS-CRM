/**
 * FileImportEngineModal.tsx — DAS CRM Android
 * Interactive CSV / Excel Extraction & Ingestion Engine.
 * Parses files on-device via xlsx, sends structured data + metadata to NestJS backend.
 */

import React, { useState, useRef } from 'react';
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
  Platform,
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

export interface ParsedSheet {
  name: string;
  isBlocked: boolean;
  data: string[][]; // [row][col]
  columnMappings: string[];
  blockedColumns: boolean[];
  blockedRows: boolean[];
  columnWidths: number[];
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
  'Google Ads',
  'Meta Ads (FB & Insta)',
  'LinkedIn Ads',
  'Microsoft Ads (Bing)',
  'Pinterest Ads',
  'X (Twitter) Ads',
  'IndiaMART',
  'TradeIndia',
  'Justdial',
  'Lotwaala',
  'Website Forms',
  'Custom Channel',
];

const FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: 'name', label: '👤 Name' },
  { value: 'email', label: '📧 Email' },
  { value: 'phone', label: '📞 Phone' },
  { value: 'company', label: '🏢 Company' },
  { value: 'value', label: '💰 Value' },
  { value: 'city', label: '📍 City' },
  { value: 'budget', label: '💵 Budget' },
  { value: 'custom', label: '📋 Custom Field' },
  { value: 'block', label: '🚫 Block Column' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const inferFieldRole = (header: string): string => {
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

const sanitizeNumericValue = (val: string): string => {
  if (!val) return '₹0';
  let clean = val.replace(/[^0-9.]/g, '');
  if (!clean) return '₹0';
  const parts = clean.split('.');
  if (parts.length > 2) clean = parts.join('');
  const num = parseFloat(clean);
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
};

const sanitizePhoneValue = (val: string): string => {
  if (!val) return '';
  let clean = val.replace(/[^0-9+]/g, '');
  if (!clean.startsWith('+') && clean.length === 10) clean = '+91' + clean;
  return clean;
};

const getFileFormat = (uri: string, name: string): string => {
  const ext = (name || uri.split('.').pop() || 'FILE').toUpperCase();
  if (['CSV'].includes(ext)) return 'CSV';
  if (['XLS'].includes(ext)) return 'XLS';
  if (['XLSX', 'XLSM', 'XLTX', 'XLTM'].includes(ext)) return 'XLSX';
  if (['XML'].includes(ext)) return 'XML';
  return ext;
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

  // File State
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [detectedFormat, setDetectedFormat] = useState('');
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Validation State
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [inputFileName, setInputFileName] = useState('');

  // ── Pick & Parse File ────────────────────────────────────────────────────

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel',
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'application/vnd.ms-excel.sheet.macroEnabled.12',
               'text/xml', 'application/xml'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const rawName = asset.name || 'Imported_File';
      const ext = rawName.split('.').pop()?.toUpperCase() || 'FILE';

      setDetectedFormat(ext);
      setFileName(rawName);
      setInputFileName(rawName.replace(/\.[^/.]+$/, ''));
      setFileSize(formatBytes(asset.size || 0));

      // Read file content as binary ArrayBuffer
      let response: ArrayBuffer | null = null;

      if (asset.uri) {
        const fr = await fetch(asset.uri);
        response = await fr.arrayBuffer();
      }

      if (!response) {
        Alert.alert('Error', 'Could not read file content.');
        return;
      }

      let parsedSheets: ParsedSheet[] = [];

      if (ext === 'CSV' || ext === 'TSV' || ext === 'TXT') {
        // Parse CSV directly
        const text = new TextDecoder().decode(response);
        parsedSheets = parseCSVText(text, rawName);
      } else {
        // Parse Excel binary via xlsx
        const workbook = XLSX.read(response, { type: 'array', cellDates: true, cellNF: true });
        parsedSheets = workbook.SheetNames.map((sheetName, idx) => {
          const ws = workbook.Sheets[sheetName];
          const rawMatrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];

          let maxCols = 0;
          rawMatrix.forEach(row => { if (row.length > maxCols) maxCols = row.length; });
          if (maxCols === 0) maxCols = 5;

          const normalizedMatrix = rawMatrix.map(row => {
            const copy = [...row].map(v => String(v ?? '').trim());
            while (copy.length < maxCols) copy.push('');
            return copy;
          });

          if (normalizedMatrix.length === 0) {
            normalizedMatrix.push(['Name', 'Email', 'Phone', 'Company', 'Value']);
          }

          const firstRow = normalizedMatrix[0] || [];
          const colMappings = firstRow.map((h: string) => inferFieldRole(h));
          const blockedCols = new Array(maxCols).fill(false);
          const blockedRows = new Array(normalizedMatrix.length).fill(false);
          const colWidths = new Array(maxCols).fill(130);

          return {
            name: sheetName,
            isBlocked: false,
            data: normalizedMatrix,
            columnMappings: colMappings,
            blockedColumns: blockedCols,
            blockedRows,
            columnWidths: colWidths,
          };
        });
      }

      setSheets(parsedSheets);
      setActiveSheetIdx(0);
    } catch (err) {
      Alert.alert('Parse Error', 'Could not read or parse the selected file. Please try again.');
      console.error('File parse error:', err);
    }
  };

  const parseCSVText = (text: string, sheetName: string): ParsedSheet[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const delimiter = (lines[0] || '').includes('\t') ? '\t' : ',';
    const maxCols = Math.max(...lines.map(l => l.split(delimiter).length));
    const normalized = lines.map(line => {
      const cols = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
      while (cols.length < maxCols) cols.push('');
      return cols;
    });

    if (normalized.length === 0) normalized.push(['Name', 'Email', 'Phone', 'Company', 'Value']);

    const firstRow = normalized[0] || [];
    const colMappings = firstRow.map(h => inferFieldRole(h));

    return [{
      name: sheetName.replace(/\.[^/.]+$/, ''),
      isBlocked: false,
      data: normalized,
      columnMappings: colMappings,
      blockedColumns: new Array(maxCols).fill(false),
      blockedRows: new Array(normalized.length).fill(false),
      columnWidths: new Array(maxCols).fill(130),
    }];
  };

  // ── Sheet Controls ───────────────────────────────────────────────────────

  const moveSheetLeft = (idx: number) => {
    if (idx <= 0) return;
    setSheets(prev => {
      const copy = [...prev];
      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
      return copy;
    });
    if (activeSheetIdx === idx) setActiveSheetIdx(idx - 1);
    else if (activeSheetIdx === idx - 1) setActiveSheetIdx(idx);
  };

  const moveSheetRight = (idx: number) => {
    if (idx >= sheets.length - 1) return;
    setSheets(prev => {
      const copy = [...prev];
      [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
      return copy;
    });
    if (activeSheetIdx === idx) setActiveSheetIdx(idx + 1);
    else if (activeSheetIdx === idx + 1) setActiveSheetIdx(idx);
  };

  const toggleBlockSheet = (idx: number) => {
    setSheets(prev => prev.map((s, i) => i === idx ? { ...s, isBlocked: !s.isBlocked } : s));
  };

  // ── Column & Row Controls ────────────────────────────────────────────────

  const updateColumnMapping = (cIdx: number, role: string) => {
    setSheets(prev => prev.map((s, sIdx) => {
      if (sIdx !== activeSheetIdx) return s;
      const copy = [...s.columnMappings];
      copy[cIdx] = role;
      return { ...s, columnMappings: copy };
    }));
  };

  const toggleBlockColumn = (cIdx: number) => {
    setSheets(prev => prev.map((s, sIdx) => {
      if (sIdx !== activeSheetIdx) return s;
      const copy = [...s.blockedColumns];
      copy[cIdx] = !copy[cIdx];
      return { ...s, blockedColumns: copy };
    }));
  };

  const toggleBlockRow = (rIdx: number) => {
    setSheets(prev => prev.map((s, sIdx) => {
      if (sIdx !== activeSheetIdx) return s;
      const copy = [...s.blockedRows];
      copy[rIdx] = !copy[rIdx];
      return { ...s, blockedRows: copy };
    }));
  };

  const updateCell = (rIdx: number, cIdx: number, val: string) => {
    setSheets(prev => prev.map((s, sIdx) => {
      if (sIdx !== activeSheetIdx) return s;
      const copyData = s.data.map((r, i) => i === rIdx ? [...r] : r);
      copyData[rIdx][cIdx] = val;
      return { ...s, data: copyData };
    }));
  };

  const addRow = () => {
    setSheets(prev => prev.map((s, sIdx) => {
      if (sIdx !== activeSheetIdx) return s;
      const newRow = new Array(s.data[0]?.length || 5).fill('');
      return {
        ...s,
        data: [...s.data, newRow],
        blockedRows: [...s.blockedRows, false],
      };
    }));
  };

  // ── Inject & Commit to Backend ───────────────────────────────────────────

  const handleCommitIngestion = async () => {
    if (!inputFileName.trim()) {
      Alert.alert('Missing File Name', 'Please enter a File Name to save this import record.');
      return;
    }
    if (!selectedPlatform) {
      Alert.alert('Missing Platform', 'Please select a Source Platform from the dropdown.');
      return;
    }

    setIsLoading(true);

    try {
      const extractedLeads: ImportedLead[] = [];

      sheets.forEach(sheet => {
        if (sheet.isBlocked) return;

        sheet.data.forEach((row, rIdx) => {
          if (rIdx === 0) return; // skip header row
          if (sheet.blockedRows[rIdx]) return;

          const lead: ImportedLead = {
            id: `lead_${Date.now()}_${rIdx}`,
            name: '',
            email: 'No Email Provided',
            phone: '',
            company: 'Independent Prospect',
            source: selectedPlatform,
            status: 'NEW LEAD',
            value: '₹25,000',
            assignedRep: 'Rajesh Kumar',
            city: '',
            budget: '',
            requirement: '',
            callSyncStatus: 'Synced: Just Now • Pending',
            customFields: {},
            createdAt: 'Just now',
          };

          let hasData = false;

          row.forEach((cellVal, cIdx) => {
            if (sheet.blockedColumns[cIdx]) return;
            const role = sheet.columnMappings[cIdx];
            if (role === 'block') return;

            const v = cellVal.trim();
            if (!v) return;

            if (role === 'name') { lead.name = v; hasData = true; }
            else if (role === 'email') { lead.email = v.toLowerCase(); hasData = true; }
            else if (role === 'phone') { lead.phone = sanitizePhoneValue(v); hasData = true; }
            else if (role === 'company') { lead.company = v; }
            else if (role === 'value') { lead.value = sanitizeNumericValue(v); }
            else if (role === 'city') { lead.city = v; }
            else if (role === 'budget') { lead.budget = v; }
            else if (role === 'custom') {
              const headerName = sheet.data[0]?.[cIdx] || `Col_${cIdx + 1}`;
              const fieldKey = `col_${headerName.toLowerCase().replace(/\s+/g, '_')}`;
              lead.customFields[fieldKey] = v;
            }
          });

          // Fallback name
          if (!lead.name && (lead.email !== 'No Email Provided' || lead.phone)) {
            lead.name = lead.email !== 'No Email Provided'
              ? lead.email.split('@')[0]
              : `Lead ${extractedLeads.length + 1}`;
            hasData = true;
          }

          if (hasData) extractedLeads.push(lead);
        });
      });

      if (extractedLeads.length === 0) {
        Alert.alert('No Data', 'No valid lead records found to import. Check column mappings.');
        setIsLoading(false);
        return;
      }

      // ── Send structured data + metadata to NestJS backend ──────────────
      const audit: FileAuditRecord = {
        filename: `${inputFileName.trim()} (${detectedFormat || 'FILE'})`,
        fileSize: fileSize || '—',
        platform: selectedPlatform,
        count: extractedLeads.length,
        date: formatDate(),
      };

      // Attempt API call (graceful fallback to local-only if offline)
      try {
        await apiService.importLeadsFromFile(token || '', {
          leads: extractedLeads,
          fileName: audit.filename,
          fileSize: audit.fileSize,
          platform: audit.platform,
          importedAt: audit.date,
          sheetCount: sheets.filter(s => !s.isBlocked).length,
          totalRows: sheets.reduce((a, s) => a + s.data.length, 0),
          blockedSheets: sheets.filter(s => s.isBlocked).length,
        });
      } catch (_apiErr) {
        // Backend unavailable — continue with local import
        console.warn('Backend sync unavailable, importing locally:', _apiErr);
      }

      onImportSuccess(extractedLeads, audit);
      handleClose();
    } catch (err) {
      const msg = (err as Error).message || 'Unknown error during ingestion.';
      Alert.alert('Ingestion Failed', msg);
      onImportError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSheets([]);
    setActiveSheetIdx(0);
    setFileName('');
    setFileSize('');
    setDetectedFormat('');
    setInputFileName('');
    setSelectedPlatform('');
    setIsLoading(false);
    onClose();
  };

  const activeSheet = sheets[activeSheetIdx];
  const isReady = inputFileName.trim().length > 0 && selectedPlatform.length > 0 && sheets.length > 0;
  const totalRows = sheets.reduce((a, s) => a + s.data.length, 0);
  const totalCols = sheets[0]?.data[0]?.length || 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={styles.container}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>📥 Import CSV / Excel</Text>
            <Text style={styles.headerSub}>Parse on-device • Send to backend</Text>
          </View>
          {detectedFormat ? (
            <View style={styles.formatBadge}>
              <Text style={styles.formatBadgeText}>{detectedFormat}</Text>
            </View>
          ) : null}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── Upload Bar ─────────────────────────────────────────────────── */}
        <View style={styles.uploadBar}>
          <TouchableOpacity style={styles.pickBtn} onPress={handlePickFile} disabled={isLoading}>
            <Text style={styles.pickBtnText}>📁 {fileName ? 'Change File' : 'Select File'}</Text>
          </TouchableOpacity>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>File Name *</Text>
              <TextInput
                style={styles.metaInput}
                value={inputFileName}
                onChangeText={setInputFileName}
                placeholder="e.g. Q3_Aug_Leads"
                placeholderTextColor="#475569"
              />
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Source Platform *</Text>
              <View style={styles.selectWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.platformChip, selectedPlatform === '' && styles.platformChipActive]}
                    onPress={() => setSelectedPlatform('')}
                  >
                    <Text style={[styles.platformChipText, selectedPlatform === '' && styles.platformChipTextActive]}>—</Text>
                  </TouchableOpacity>
                  {PLATFORMS.map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.platformChip, selectedPlatform === p && styles.platformChipActive]}
                      onPress={() => setSelectedPlatform(p)}
                    >
                      <Text style={[styles.platformChipText, selectedPlatform === p && styles.platformChipTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Analytics Row */}
          <View style={styles.analyticsRow}>
            <View style={styles.analyticItem}>
              <Text style={styles.analyticValue}>{sheets.length}</Text>
              <Text style={styles.analyticLabel}>Sheets</Text>
            </View>
            <View style={styles.analyticDivider} />
            <View style={styles.analyticItem}>
              <Text style={styles.analyticValue}>{totalRows}</Text>
              <Text style={styles.analyticLabel}>Rows</Text>
            </View>
            <View style={styles.analyticDivider} />
            <View style={styles.analyticItem}>
              <Text style={styles.analyticValue}>{totalCols}</Text>
              <Text style={styles.analyticLabel}>Cols</Text>
            </View>
            {fileSize ? (
              <>
                <View style={styles.analyticDivider} />
                <View style={styles.analyticItem}>
                  <Text style={styles.analyticValue}>{fileSize}</Text>
                  <Text style={styles.analyticLabel}>Size</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* ── Sheet Tab Bar ──────────────────────────────────────────────── */}
        {sheets.length > 0 && (
          <View style={styles.sheetTabBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              {sheets.map((s, idx) => (
                <View key={idx} style={styles.sheetTabRow}>
                  <TouchableOpacity
                    style={[
                      styles.sheetTab,
                      activeSheetIdx === idx && styles.sheetTabActive,
                      s.isBlocked && styles.sheetTabBlocked,
                    ]}
                    onPress={() => setActiveSheetIdx(idx)}
                  >
                    <Text style={[
                      styles.sheetTabText,
                      activeSheetIdx === idx && styles.sheetTabTextActive,
                      s.isBlocked && styles.sheetTabTextBlocked,
                    ]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    {s.isBlocked && (
                      <View style={styles.blockedBadge}>
                        <Text style={styles.blockedBadgeText}>BLOCKED</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.sheetControls}>
                    <TouchableOpacity style={styles.sheetCtrlBtn} onPress={() => moveSheetLeft(idx)} disabled={idx === 0}>
                      <Text style={styles.sheetCtrlBtnText}>◀</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sheetCtrlBtn} onPress={() => moveSheetRight(idx)} disabled={idx === sheets.length - 1}>
                      <Text style={styles.sheetCtrlBtnText}>▶</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sheetCtrlBtn, s.isBlocked && styles.sheetCtrlBtnUnblock]}
                      onPress={() => toggleBlockSheet(idx)}
                    >
                      <Text style={styles.sheetCtrlBtnText}>{s.isBlocked ? '👁' : '🚫'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.addRowBtn} onPress={addRow}>
              <Text style={styles.addRowBtnText}>+ Row</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Grid Editor ────────────────────────────────────────────────── */}
        <ScrollView style={styles.gridArea} contentContainerStyle={styles.gridContent}>
          {sheets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>No File Loaded</Text>
              <Text style={styles.emptySub}>Tap "Select File" to upload CSV / Excel</Text>
            </View>
          ) : activeSheet?.isBlocked ? (
            <View style={styles.blockedState}>
              <Text style={styles.emptyIcon}>🚫</Text>
              <Text style={styles.emptyTitle}>Sheet Blocked</Text>
              <Text style={styles.emptySub}>Tap 👁 in the tab bar to unblock</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Column Mapping Header */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.colHeaderRow}>
                    <View style={[styles.rowControlCell, styles.cornerCell]}>
                      <Text style={styles.cornerLabel}>Row</Text>
                    </View>
                    {activeSheet.data[0]?.map((_, cIdx) => (
                      <View key={cIdx} style={[styles.colHeaderCell, activeSheet.blockedColumns[cIdx] && styles.colHeaderCellBlocked]}>
                        <View style={styles.colHeaderTop}>
                          <Text style={styles.colHeaderLabel}>Col {cIdx + 1}</Text>
                          <TouchableOpacity
                            style={[styles.blockColBtn, activeSheet.blockedColumns[cIdx] && styles.blockColBtnActive]}
                            onPress={() => toggleBlockColumn(cIdx)}
                          >
                            <Text style={[styles.blockColBtnText, activeSheet.blockedColumns[cIdx] && styles.blockColBtnTextActive]}>
                              {activeSheet.blockedColumns[cIdx] ? '👁' : '🚫'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.selectWrapper}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {FIELD_OPTIONS.map(opt => (
                              <TouchableOpacity
                                key={opt.value}
                                style={[
                                  styles.fieldChip,
                                  activeSheet.columnMappings[cIdx] === opt.value && styles.fieldChipActive,
                                  activeSheet.blockedColumns[cIdx] && styles.fieldChipDisabled,
                                ]}
                                disabled={activeSheet.blockedColumns[cIdx]}
                                onPress={() => updateColumnMapping(cIdx, opt.value)}
                              >
                                <Text style={[
                                  styles.fieldChipText,
                                  activeSheet.columnMappings[cIdx] === opt.value && styles.fieldChipTextActive,
                                ]}>
                                  {opt.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* Data Rows */}
                <ScrollView style={{ maxHeight: 340 }}>
                  {activeSheet.data.map((row, rIdx) => {
                    const isHeader = rIdx === 0;
                    const isBlocked = activeSheet.blockedRows[rIdx];
                    return (
                      <View key={rIdx} style={[styles.dataRow, isHeader && styles.headerRow, isBlocked && styles.blockedRow]}>
                        {/* Row Controls */}
                        <View style={[styles.rowControlCell, isBlocked && styles.rowControlCellBlocked]}>
                          <Text style={styles.rowNumText}>#{rIdx + 1}</Text>
                          <TouchableOpacity
                            style={[styles.blockRowBtn, isBlocked && styles.blockRowBtnActive]}
                            onPress={() => toggleBlockRow(rIdx)}
                          >
                            <Text style={[styles.blockRowBtnText, isBlocked && styles.blockRowBtnTextActive]}>
                              {isBlocked ? '👁' : '🚫'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Data Cells */}
                        {row.map((cellVal, cIdx) => {
                          const isColBlocked = activeSheet.blockedColumns[cIdx];
                          const isCellBlocked = isColBlocked || isBlocked;
                          return (
                            <View key={cIdx} style={[styles.dataCell, isCellBlocked && styles.dataCellBlocked]}>
                              <TextInput
                                style={[styles.cellInput, isHeader && styles.cellInputHeader, isCellBlocked && styles.cellInputBlocked]}
                                value={cellVal}
                                editable={!isCellBlocked}
                                onChangeText={v => updateCell(rIdx, cIdx, v)}
                                placeholder="—"
                                placeholderTextColor="#334155"
                              />
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </ScrollView>
          )}
        </ScrollView>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.validationMsg}>
            {!inputFileName.trim() && (
              <Text style={styles.validationText}>⚠️ Enter File Name to unlock injection</Text>
            )}
            {!selectedPlatform && inputFileName.trim() && (
              <Text style={styles.validationText}>⚠️ Select Source Platform to unlock injection</Text>
            )}
            {isReady && (
              <Text style={[styles.validationText, { color: '#34d399' }]}>✅ Ready to inject {totalRows - sheets.length} records</Text>
            )}
          </View>

          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.injectBtn, !isReady && styles.injectBtnDisabled]}
              onPress={handleCommitIngestion}
              disabled={!isReady || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.injectBtnText}>✅ Confirm &amp; Inject Leads</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  headerSub: { fontSize: 10, color: '#64748b', marginTop: 1 },
  formatBadge: {
    backgroundColor: '#0ea5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    marginRight: 10,
  },
  formatBadgeText: { fontSize: 10, fontWeight: '900', color: '#ffffff' },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '900' },

  // Upload Bar
  uploadBar: { backgroundColor: '#0f172a', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  pickBtn: { backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  pickBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  metaRow: { gap: 8 },
  metaItem: { marginBottom: 6 },
  metaLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 3 },
  metaInput: {
    backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7, color: '#ffffff', fontSize: 12, fontWeight: '700',
  },
  selectWrapper: { flexDirection: 'row' },
  platformChip: {
    backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5, marginRight: 6,
  },
  platformChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  platformChipText: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  platformChipTextActive: { color: '#ffffff' },

  // Analytics Row
  analyticsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#020617', borderRadius: 12, paddingVertical: 8, marginTop: 6,
    borderWidth: 1, borderColor: '#1e293b',
  },
  analyticItem: { alignItems: 'center' },
  analyticValue: { fontSize: 15, fontWeight: '900', color: '#38bdf8' },
  analyticLabel: { fontSize: 9, color: '#64748b', fontWeight: '700' },
  analyticDivider: { width: 1, height: 28, backgroundColor: '#1e293b' },

  // Sheet Tab Bar
  sheetTabBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#0b1329', borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  sheetTabRow: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  sheetTab: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617',
    borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    marginRight: 4,
  },
  sheetTabActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  sheetTabBlocked: { backgroundColor: '#1e293b', borderColor: '#334155' },
  sheetTabText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  sheetTabTextActive: { color: '#ffffff' },
  sheetTabTextBlocked: { color: '#475569', textDecorationLine: 'line-through' },
  blockedBadge: { backgroundColor: '#ef4444', borderRadius: 4, paddingHorizontal: 4, marginLeft: 4 },
  blockedBadgeText: { fontSize: 7, fontWeight: '900', color: '#ffffff' },
  sheetControls: { flexDirection: 'row', marginLeft: 2 },
  sheetCtrlBtn: { width: 22, height: 22, borderRadius: 6, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginHorizontal: 1 },
  sheetCtrlBtnUnblock: { backgroundColor: '#065f46' },
  sheetCtrlBtnText: { fontSize: 10, fontWeight: '900', color: '#94a3b8' },
  addRowBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 6 },
  addRowBtnText: { fontSize: 10, fontWeight: '800', color: '#818cf8' },

  // Grid Area
  gridArea: { flex: 1, backgroundColor: '#030712', padding: 4 },
  gridContent: { flexGrow: 1 },

  // Empty / Blocked States
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  blockedState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff', marginBottom: 4 },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center' },

  // Column Header Row
  colHeaderRow: { flexDirection: 'row' },
  cornerCell: { width: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b1329', borderRightWidth: 1, borderRightColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  cornerLabel: { fontSize: 9, fontWeight: '900', color: '#64748b' },
  colHeaderCell: { borderRightWidth: 1, borderRightColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#1e293b', padding: 4, minWidth: 110, backgroundColor: '#0b1329' },
  colHeaderCellBlocked: { backgroundColor: '#1e293b' },
  colHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  colHeaderLabel: { fontSize: 9, fontWeight: '800', color: '#64748b' },
  blockColBtn: { width: 20, height: 20, borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  blockColBtnActive: { backgroundColor: '#065f46', borderColor: '#34d399' },
  blockColBtnText: { fontSize: 10 },
  blockColBtnTextActive: {},
  fieldChip: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, marginRight: 4 },
  fieldChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  fieldChipDisabled: { opacity: 0.4 },
  fieldChipText: { fontSize: 8, color: '#94a3b8', fontWeight: '700' },
  fieldChipTextActive: { color: '#ffffff' },

  // Data Rows
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1e293b', backgroundColor: '#090d16', minHeight: 42 },
  headerRow: { backgroundColor: '#0f172a' },
  blockedRow: { backgroundColor: '#1e1b1b', opacity: 0.7 },
  rowControlCell: { width: 60, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#1e293b', backgroundColor: '#0b1329' },
  rowControlCellBlocked: { backgroundColor: '#1e293b' },
  rowNumText: { fontSize: 8, fontWeight: '800', color: '#475569', marginBottom: 2 },
  blockRowBtn: { width: 20, height: 20, borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  blockRowBtnActive: { backgroundColor: '#065f46', borderColor: '#34d399' },
  blockRowBtnText: { fontSize: 10 },
  blockRowBtnTextActive: {},
  dataCell: { borderRightWidth: 1, borderRightColor: '#1e293b', minWidth: 110, justifyContent: 'center' },
  dataCellBlocked: { backgroundColor: '#1e293b', opacity: 0.6 },
  cellInput: {
    paddingHorizontal: 6, paddingVertical: 6, color: '#e2e8f0', fontSize: 11,
    fontWeight: '500', backgroundColor: 'transparent',
  },
  cellInputHeader: { fontWeight: '900', color: '#818cf8' },
  cellInputBlocked: { color: '#475569', textDecorationLine: 'line-through' },

  // Footer
  footer: {
    backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b',
    paddingHorizontal: 14, paddingVertical: 10, paddingBottom: 34,
  },
  validationMsg: { marginBottom: 8 },
  validationText: { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
  footerActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
  injectBtn: { flex: 2, backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  injectBtnDisabled: { opacity: 0.4 },
  injectBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});
