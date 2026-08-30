/**
 * FileImportEngineModal.tsx — DAS CRM Android
 * Smooth, responsive CSV/Excel import grid.
 * Virtualized FlatList rows + synchronized horizontal scroll mirrors web LeadsTable.
 */

import React, {
  useState, useRef, useCallback, useMemo, useEffect, memo,
} from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ScrollView, FlatList, Alert, ActivityIndicator, useWindowDimensions,
  Keyboard,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';

// ─────────────────────────────────────────────────────────────────────────────
// Constants (MUST be before StyleSheet)
// ─────────────────────────────────────────────────────────────────────────────

const ROW_H      = 46;   // px — data row height
const HDR_H     = 70;   // px — column header height
const ROW_CTRL_W = 50;  // px — row-number / block column width

const WIDTH_CYCLE = [100, 150, 210]; // 3-state column width cycle

const FIELD_ROLE_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'name',    label: 'Name',    color: '#818cf8' },
  { value: 'email',   label: 'Email',   color: '#f59e0b' },
  { value: 'phone',   label: 'Phone',   color: '#34d399' },
  { value: 'company', label: 'Company', color: '#f472b6' },
  { value: 'value',   label: 'Value',   color: '#fb923c' },
  { value: 'city',    label: 'City',    color: '#38bdf8' },
  { value: 'budget',  label: 'Budget',  color: '#a78bfa' },
  { value: 'custom',  label: 'Custom',  color: '#94a3b8' },
  { value: 'block',   label: 'Block',   color: '#ef4444' },
];

const PLATFORMS = [
  'Google Ads', 'Meta Ads', 'LinkedIn Ads', 'Microsoft Ads',
  'Pinterest Ads', 'X (Twitter) Ads', 'IndiaMART', 'TradeIndia',
  'Justdial', 'Lotwaala', 'Website Forms', 'Custom Channel',
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const inferRole = (h: string): string => {
  const l = (h || '').toLowerCase();
  if (/name|client|contact|full/.test(l)) return 'name';
  if (/email|mail/.test(l)) return 'email';
  if (/phone|mobile|tel|number/.test(l)) return 'phone';
  if (/company|org|business|firm/.test(l)) return 'company';
  if (/value|amount|price|deal|budget|coin/.test(l)) return 'value';
  if (/city|location|area/.test(l)) return 'city';
  if (/budget/.test(l)) return 'budget';
  return 'custom';
};

const getRoleColor  = (r: string) => FIELD_ROLE_OPTIONS.find(o => o.value === r)?.color  ?? '#94a3b8';
const getRoleLabel  = (r: string) => FIELD_ROLE_OPTIONS.find(o => o.value === r)?.label  ?? r;
const sanitizeNum   = (v: string) => { if (!v) return '₹0'; const c = v.replace(/[^0-9.]/g,''); if (!c) return '₹0'; const n = parseFloat(c); return isNaN(n) ? '₹0' : `₹${n.toLocaleString('en-IN')}`; };
const sanitizePhone  = (v: string) => { if (!v) return ''; const c = v.replace(/[^0-9+]/g,''); if (!c.startsWith('+') && c.length===10) return '+91'+c; return c; };
const fmtBytes      = (b: number) => b < 1024 ? `${b} B` : b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`;
const fmtNow        = () => { const n = new Date(); return `${n.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}, ${n.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}`; };

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ImportedLead { id:string; name:string; email:string; phone:string; company:string; source:string; status:string; value:string; assignedRep:string; city:string; budget:string; requirement:string; callSyncStatus:string; customFields:Record<string,string>; createdAt:string; }
export interface FileAuditRecord { filename:string; fileSize:string; platform:string; count:number; date:string; }

export interface ColumnDef {
  key:    string;
  header: string;
  index:  number;
  role:   string;
  blocked: boolean;
  width:  number;
}

export interface ParsedSheet {
  name:        string;
  isBlocked:   boolean;
  data:        string[][];
  columns:     ColumnDef[];
  blockedRows: boolean[];
}

export interface FileImportEngineModalProps {
  visible: boolean;
  onClose: () => void;
  onImportSuccess: (leads: ImportedLead[], audit: FileAuditRecord) => void;
  onImportError?: (msg: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Memoized Cell Components
// ─────────────────────────────────────────────────────────────────────────────

const GridCell = memo(({
  value, colWidth, role, blocked, onChange,
}: {
  value: string; colWidth: number; role: string; blocked: boolean; onChange: (v: string) => void;
}) => (
  <View style={[cellStyle.cell, { width: colWidth }, blocked && cellStyle.cellBlocked]}>
    <TextInput
      style={[cellStyle.input, { color: blocked ? '#475569' : getRoleColor(role) }]}
      value={value}
      editable={!blocked}
      onChangeText={onChange}
      placeholder="—"
      placeholderTextColor="#1e293b"
      multiline={false}
      scrollEnabled={false}
    />
  </View>
));

const RowNumCell = memo(({
  index, blocked, onToggle,
}: {
  index: number; blocked: boolean; onToggle: () => void;
}) => (
  <View style={cellStyle.rowNumCell}>
    <Text style={[cellStyle.rowNumText, blocked && cellStyle.rowNumTextBlocked]}>{index + 1}</Text>
    <TouchableOpacity style={[cellStyle.blockBtn, blocked && cellStyle.blockBtnActive]} onPress={onToggle}>
      <Text style={cellStyle.blockBtnText}>{blocked ? '👁' : '🚫'}</Text>
    </TouchableOpacity>
  </View>
));

// Styles for memoized cells (separate to avoid recreating on each render)
const cellStyle = StyleSheet.create({
  cell:        { borderRightWidth: 1, borderColor: '#1e293b', justifyContent: 'center', minWidth: 100 },
  cellBlocked: { backgroundColor: '#1e293b', opacity: 0.6 },
  input:       { paddingHorizontal: 6, paddingVertical: 8, fontSize: 12, fontWeight: '500', backgroundColor: 'transparent' },
  rowNumCell:  { width: ROW_CTRL_W, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1329', borderRightWidth: 1, borderColor: '#1e293b', gap: 2, paddingVertical: 6 },
  rowNumText:  { fontSize: 11, fontWeight: '700', color: '#475569' },
  rowNumTextBlocked: { color: '#ef4444' },
  blockBtn:    { width: 26, height: 26, borderRadius: 7, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  blockBtnActive: { backgroundColor: '#065f46', borderColor: '#34d399' },
  blockBtnText: { fontSize: 13 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const FileImportEngineModal: React.FC<FileImportEngineModalProps> = ({
  visible, onClose, onImportSuccess, onImportError,
}) => {
  const { token } = useAuthStore();
  const { width: SW, height: SH } = useWindowDimensions();
  const isTablet = SW >= 600;

  // ── State ────────────────────────────────────────────────────────────────
  const [fileName, setFileName]           = useState('');
  const [fileSize, setFileSize]           = useState('');
  const [fmt,      setFmt]               = useState('');
  const [sheets,   setSheets]            = useState<ParsedSheet[]>([]);
  const [activeIdx, setActiveIdx]         = useState(0);
  const [loading,   setLoading]           = useState(false);
  const [inputFileName,   setInputFileName]   = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [renameKey, setRenameKey]         = useState<string | null>(null);
  const [renameVal, setRenameVal]         = useState('');

  // Scroll sync ref — horizontal scroll position shared between header & rows
  const hScrollRef  = useRef<ScrollView>(null);
  const hScrollRef2 = useRef<ScrollView>(null);

  const activeSheet = sheets[activeIdx];
  const totalDataRows = activeSheet?.data.length ?? 0;
  const totalCols     = activeSheet?.columns.length ?? 0;

  const isReady = inputFileName.trim().length > 0 && selectedPlatform.length > 0 && sheets.length > 0;

  // ── Scroll Sync ─────────────────────────────────────────────────────────
  // When header scrolls, sync the body; when body scrolls, sync the header.
  const handleHeaderScroll = (e: any) => {
    hScrollRef2.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false });
  };
  const handleBodyScroll = (e: any) => {
    hScrollRef.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false });
  };

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

      setFmt(rawName.split('.').pop()?.toUpperCase() || '');
      setFileName(rawName);
      setInputFileName(rawName.replace(/\.[^/.]+$/, ''));
      setFileSize(fmtBytes(asset.size || 0));

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
          const ws   = wb.Sheets[sheetName];
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

          const columns: ColumnDef[] = matrix[0].map((h: unknown, i: number) => ({
            key:    `col_${i}`,
            header: String(h),
            index:  i,
            role:   inferRole(String(h)),
            blocked: false,
            width:  WIDTH_CYCLE[1],
          }));

          return {
            name:        sheetName,
            isBlocked:   false,
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
    const lines  = text.split(/\r?\n/).filter(l => l.trim());
    const delim  = (lines[0] || '').includes('\t') ? '\t' : ',';
    const maxC   = Math.max(0, ...lines.map(l => l.split(delim).length));
    const matrix = lines.map(l => {
      const cols = l.split(delim).map(v => v.trim().replace(/^["']|["']$/g, ''));
      while (cols.length < maxC) cols.push('');
      return cols;
    });
    if (matrix.length === 0) matrix.push(['Name', 'Email', 'Phone', 'Company', 'Value']);

    const columns: ColumnDef[] = matrix[0].map((h: unknown, i: number) => ({
      key:    `col_${i}`,
      header: String(h),
      index:  i,
      role:   inferRole(String(h)),
      blocked: false,
      width:  WIDTH_CYCLE[1],
    }));

    return [{
      name:        name.replace(/\.[^/.]+$/, ''),
      isBlocked:   false,
      data:        matrix.slice(1),
      columns,
      blockedRows: new Array(matrix.length - 1).fill(false),
    }];
  };

  // ── Column Controls ─────────────────────────────────────────────────────

  const moveCol = useCallback((key: string, dir: 'left' | 'right') => {
    setSheets(prev => prev.map((s, i) => {
      if (i !== activeIdx) return s;
      const idx    = s.columns.findIndex(c => c.key === key);
      const target = dir === 'left' ? idx - 1 : idx + 1;
      if (idx < 0 || target < 0 || target >= s.columns.length) return s;
      const cols   = [...s.columns];
      [cols[idx], cols[target]] = [cols[target], cols[idx]];
      return { ...s, columns: cols };
    }));
  }, [activeIdx]);

  const setColRole = useCallback((key: string, role: string) => {
    setSheets(prev => prev.map((s, i) =>
      i !== activeIdx ? s : { ...s, columns: s.columns.map(c => c.key === key ? { ...c, role } : c) }
    ));
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
          c.key === key
            ? { ...c, blocked: !c.blocked, role: !c.blocked ? 'block' : inferRole(c.header) }
            : c
        ),
      };
    }));
  }, [activeIdx]);

  const openRenameCol = (key: string) => {
    const col = activeSheet?.columns.find(c => c.key === key);
    if (!col) return;
    setRenameKey(key);
    setRenameVal(col.header);
  };

  const saveRenameCol = () => {
    if (!renameKey || !renameVal.trim()) { setRenameKey(null); return; }
    setSheets(prev => prev.map((s, i) =>
      i !== activeIdx ? s : { ...s, columns: s.columns.map(c => c.key === renameKey ? { ...c, header: renameVal.trim() } : c) }
    ));
    setRenameKey(null);
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
      return { ...s, data: [...s.data, newRow], blockedRows: [...s.blockedRows, false] };
    }));
  }, [activeIdx]);

  // ── Commit ──────────────────────────────────────────────────────────────

  const handleCommit = async () => {
    if (!inputFileName.trim()) { Alert.alert('Missing', 'Enter a File Name.'); return; }
    if (!selectedPlatform)      { Alert.alert('Missing', 'Select a Source Platform.'); return; }
    setLoading(true);
    try {
      const leads: ImportedLead[] = [];
      sheets.forEach(sheet => {
        if (sheet.isBlocked) return;
        sheet.data.forEach((row, rIdx) => {
          if (sheet.blockedRows[rIdx]) return;
          const lead: ImportedLead = {
            id: `lead_${Date.now()}_${rIdx}`,
            name:'', email:'No Email Provided', phone:'',
            company:'Independent Prospect', source: selectedPlatform,
            status:'NEW LEAD', value:'₹25,000', assignedRep:'Rajesh Kumar',
            city:'', budget:'', requirement:'',
            callSyncStatus:'Synced: Just Now • Pending',
            customFields:{}, createdAt:'Just now',
          };
          let hasData = false;
          sheet.columns.forEach(col => {
            if (col.blocked) return;
            const raw = (row[col.index]||'').trim();
            if (!raw) return;
            switch (col.role) {
              case 'name':    lead.name    = raw; hasData = true; break;
              case 'email':   lead.email   = raw.toLowerCase(); hasData = true; break;
              case 'phone':   lead.phone   = sanitizePhone(raw); hasData = true; break;
              case 'company': lead.company = raw; break;
              case 'value':   lead.value   = sanitizeNum(raw); break;
              case 'city':    lead.city    = raw; break;
              case 'budget':  lead.budget  = raw; break;
              case 'custom':  lead.customFields[`col_${col.header.toLowerCase().replace(/\s+/g,'_')}`] = raw; break;
            }
          });
          if (!lead.name && (lead.email !== 'No Email Provided' || lead.phone)) {
            lead.name = lead.email !== 'No Email Provided' ? lead.email.split('@')[0] : `Lead ${leads.length+1}`;
            hasData = true;
          }
          if (hasData) leads.push(lead);
        });
      });
      if (leads.length === 0) { Alert.alert('No Data','No valid records found.'); setLoading(false); return; }
      const audit: FileAuditRecord = { filename:`${inputFileName.trim()} (${fmt||'FILE'})`, fileSize:fileSize||'—', platform:selectedPlatform, count:leads.length, date:fmtNow() };
      try {
        await apiService.importLeadsFromFile(token||'', { leads, fileName:audit.filename, fileSize:audit.fileSize, platform:audit.platform, importedAt:audit.date, sheetCount:sheets.filter(s=>!s.isBlocked).length, totalRows:sheets.reduce((a,s)=>a+s.data.length,0), blockedSheets:sheets.filter(s=>s.isBlocked).length });
      } catch (_) { /* offline */ }
      onImportSuccess(leads, audit);
      handleClose();
    } catch (err) {
      Alert.alert('Ingestion Failed', (err as Error).message || 'Unknown error');
      onImportError?.((err as Error).message || '');
    } finally { setLoading(false); }
  };

  const handleClose = () => {
    setSheets([]); setActiveIdx(0); setFileName(''); setFileSize('');
    setFmt(''); setInputFileName(''); setSelectedPlatform('');
    setLoading(false); setRenameKey(null); onClose();
  };

  // ── Render ──────────────────────────────────────────────────────────────

  const PADX = isTablet ? 24 : 14;
  const PADY = isTablet ? 14 : 10;

  // Virtualized row renderer for FlatList
  const renderRow = ({ item: row, index: rIdx }: { item: string[]; index: number }) => {
    if (!activeSheet) return null;
    const isBlocked = activeSheet.blockedRows[rIdx];
    return (
      <View style={[rowStyle.row, isBlocked && rowStyle.rowBlocked]}>
        <RowNumCell index={rIdx} blocked={isBlocked} onToggle={() => toggleBlockRow(rIdx)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={rowStyle.rowCells}>
          {activeSheet.columns.map(col => (
            <GridCell
              key={col.key}
              value={row[col.index] || ''}
              colWidth={col.width}
              role={col.role}
              blocked={col.blocked || isBlocked}
              onChange={v => updateCell(rIdx, col.key, v)}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const keyExtractor = (_: string[], idx: number) => `row_${idx}`;

  const getItemLayout = (_: any, index: number) => ({
    length: ROW_H,
    offset: ROW_H * index,
    index,
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={[styles.container, { paddingTop: 52, paddingBottom: 34 }]}>

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <View style={[styles.header, { paddingHorizontal: PADX, paddingBottom: 12 }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>📥 Import CSV / Excel</Text>
            <Text style={styles.headerSub}>
              {sheets.length > 0
                ? `${sheets.length} sheet${sheets.length>1?'s':''} · ${totalDataRows} rows · ${totalCols} cols`
                : 'Parse on-device · Send to backend'}
            </Text>
          </View>
          {fmt ? <View style={styles.formatBadge}><Text style={styles.formatBadgeText}>{fmt}</Text></View> : null}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── UPLOAD BAR ────────────────────────────────────────────────── */}
        <View style={[styles.uploadBar, { paddingHorizontal: PADX, paddingVertical: PADY }]}>
          <TouchableOpacity style={[styles.pickBtn, isTablet && styles.pickBtnTablet]} onPress={handlePickFile} disabled={loading}>
            <Text style={styles.pickBtnText}>📁 {fileName ? 'Change File' : 'Select File'}</Text>
          </TouchableOpacity>

          {fileName ? (
            <>
              <View style={[styles.metaRow, isTablet && styles.metaRowTablet]}>
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
                <View style={[styles.metaField, { flex: 2 }]}>
                  <Text style={styles.metaLabel}>Source Platform *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.platformRow}>
                      {PLATFORMS.map(p => (
                        <TouchableOpacity
                          key={p}
                          style={[styles.platformChip, selectedPlatform===p && styles.platformChipActive]}
                          onPress={() => setSelectedPlatform(p)}
                        >
                          <Text style={[styles.platformChipText, selectedPlatform===p && styles.platformChipTextActive]}>{p}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <View style={[styles.analyticsRow, isTablet && styles.analyticsRowTablet]}>
                {[{v:sheets.length,l:'Sheets'},{v:totalDataRows,l:'Rows'},{v:totalCols,l:'Cols'},{v:fileSize,l:'Size'}].map(({v,l},i) => (
                  <React.Fragment key={l}>
                    {i>0 && <View style={styles.analyticDivider}/>}
                    <View style={styles.analyticItem}>
                      <Text style={styles.analyticValue}>{v}</Text>
                      <Text style={styles.analyticLabel}>{l}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </>
          ) : null}
        </View>

        {/* ── SHEET TABS ───────────────────────────────────────────────── */}
        {sheets.length > 1 && (
          <View style={[styles.sheetTabBar, { paddingHorizontal: PADX }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flex:1}}>
              <View style={styles.sheetTabRow}>
                {sheets.map((s, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.sheetTab, activeIdx===idx&&styles.sheetTabActive, s.isBlocked&&styles.sheetTabBlocked]}
                    onPress={() => setActiveIdx(idx)}
                  >
                    <Text style={[styles.sheetTabText, activeIdx===idx&&styles.sheetTabTextActive, s.isBlocked&&styles.sheetTabTextBlocked]} numberOfLines={1}>{s.name}</Text>
                    {s.isBlocked && <Text style={styles.blockedDot}>●</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.sheetBlockBtn} onPress={() => setSheets(prev=>prev.map((s,i)=>i===activeIdx?{...s,isBlocked:!s.isBlocked}:s))}>
              <Text style={styles.sheetBlockBtnText}>{sheets[activeIdx]?.isBlocked ? '👁' : '🚫'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── GRID ─────────────────────────────────────────────────────── */}
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
              {/* ── COLUMN HEADERS ────────────────────────────────────── */}
              <View style={styles.headerRow}>
                <View style={[styles.rowNumCorner, { width: ROW_CTRL_W }]}>
                  <Text style={styles.cornerLabel}>Row</Text>
                </View>
                <ScrollView
                  ref={hScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  scrollEventThrottle={16}
                  onScroll={handleHeaderScroll}
                  scrollEnabled={true}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ alignItems: 'flex-start' }}
                >
                  <View style={{ flexDirection: 'row' }}>
                    {activeSheet.columns.map(col => (
                      <View key={col.key} style={[styles.colHeader, { width: col.width }]}>
                        {/* Top: editable header name + block button */}
                        <View style={styles.colHeaderTop}>
                          <TouchableOpacity
                            style={{ flex: 1, minWidth: 40, backgroundColor:'#020617', borderWidth:1, borderColor: col.blocked ? '#334155' : '#1e293b', borderRadius:6, paddingHorizontal:6, paddingVertical:5, justifyContent:'center' }}
                            onPress={() => openRenameCol(col.key)}
                            disabled={col.blocked}
                          >
                            <Text style={[styles.colHeaderName, col.blocked && styles.colHeaderNameBlocked]} numberOfLines={1}>
                              {col.header || `Col ${col.index+1}`}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.colBlockBtn, col.blocked && styles.colBlockBtnActive]} onPress={() => toggleBlockCol(col.key)}>
                            <Text style={styles.colBlockBtnText}>{col.blocked ? '👁' : '🚫'}</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Bottom: role chips row */}
                        <View style={styles.roleRow}>
                          {FIELD_ROLE_OPTIONS.map(opt => (
                            <TouchableOpacity
                              key={opt.value}
                              style={[
                                styles.roleChip,
                                col.role === opt.value && { backgroundColor: opt.color + '30', borderColor: opt.color },
                              ]}
                              onPress={() => setColRole(col.key, opt.value)}
                              disabled={col.blocked}
                            >
                              <Text style={[styles.roleChipText, col.role === opt.value && { color: opt.color }]}>
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                          {/* Reorder & resize */}
                          <TouchableOpacity style={styles.colCtrlBtn} onPress={() => moveCol(col.key, 'left')} disabled={col.index === 0}>
                            <Text style={[styles.colCtrlBtnText, col.index===0 && styles.colCtrlBtnTextDisabled]}>←</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.colCtrlBtn} onPress={() => moveCol(col.key, 'right')} disabled={col.index === activeSheet.columns.length - 1 && activeSheet.columns.findIndex(c=>c.key===col.key) === activeSheet.columns.length - 1}>
                            <Text style={styles.colCtrlBtnText}>→</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.colCtrlBtn, styles.colCtrlBtnWidth]} onPress={() => cycleColWidth(col.key)}>
                            <Text style={[styles.colCtrlBtnText, {fontSize:10}]}>↔</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* ── DATA ROWS (virtualized FlatList) ───────────────────── */}
              <View style={{ flex: 1 }}>
                <ScrollView
                  ref={hScrollRef2}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onScroll={handleBodyScroll}
                  style={styles.bodyHS}
                  contentContainerStyle={{ minWidth: activeSheet.columns.reduce((a,c)=>a+c.width,0) + ROW_CTRL_W + 20 }}
                >
                  <View style={{ minWidth: ROW_CTRL_W }}>
                    <FlatList
                      data={activeSheet.data}
                      renderItem={renderRow}
                      keyExtractor={keyExtractor}
                      getItemLayout={getItemLayout}
                      removeClippedSubviews={true}
                      maxToRenderPerBatch={15}
                      windowSize={10}
                      initialNumToRender={20}
                      key={activeIdx}
                      style={styles.rowList}
                    />
                  </View>
                </ScrollView>
              </View>
            </View>
          )}
        </View>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <View style={[styles.footer, { paddingHorizontal: PADX, paddingBottom: 34 }]}>
          <View style={styles.validationRow}>
            {!inputFileName.trim() && <Text style={styles.warnText}>⚠️ Enter File Name</Text>}
            {!selectedPlatform && inputFileName.trim() && <Text style={styles.warnText}>⚠️ Select Source Platform</Text>}
            {isReady && <Text style={styles.readyText}>✅ Ready to import {totalDataRows} record{totalDataRows !== 1 ? 's' : ''}</Text>}
          </View>
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.injectBtn, !isReady && styles.injectBtnDisabled]} onPress={handleCommit} disabled={!isReady || loading}>
              {loading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.injectBtnText}>✅ Confirm &amp; Import</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── RENAME COLUMN MODAL ──────────────────────────────────────── */}
        {renameKey && (
          <View style={styles.renameOverlay}>
            <View style={[styles.renameCard, isTablet && styles.renameCardTablet]}>
              <Text style={styles.renameTitle}>✏️ Rename Column</Text>
              <TextInput
                style={styles.renameInput}
                value={renameVal}
                onChangeText={setRenameVal}
                placeholder="Column name"
                placeholderTextColor="#64748b"
                autoFocus
                onSubmitEditing={saveRenameCol}
              />
              <View style={styles.renameActions}>
                <TouchableOpacity style={styles.renameCancelBtn} onPress={() => setRenameKey(null)}>
                  <Text style={styles.renameCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.renameSaveBtn} onPress={saveRenameCol}>
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

const rowStyle = StyleSheet.create({
  row:        { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#1e293b', minHeight: ROW_H, alignItems: 'stretch' },
  rowBlocked: { backgroundColor: '#1e1111', opacity: 0.7 },
  rowCells:   { flexDirection: 'row', alignItems: 'stretch' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerLeft:  { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#ffffff' },
  headerSub:   { fontSize: 10, color: '#64748b', marginTop: 2 },
  formatBadge: { backgroundColor: '#0ea5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 10 },
  formatBadgeText: { fontSize: 10, fontWeight: '900', color: '#ffffff' },
  closeBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '900' },

  // Upload Bar
  uploadBar:       { backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  pickBtn:         { backgroundColor: '#4f46e5', paddingVertical: 11, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  pickBtnTablet:   { paddingVertical: 13, borderRadius: 14 },
  pickBtnText:     { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  metaRow:         { gap: 8 },
  metaRowTablet:   { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  metaField:       { marginBottom: 6 },
  metaLabel:       { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 },
  metaInput:       { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: '#ffffff', fontSize: 12, fontWeight: '700' },
  metaInputTablet: { fontSize: 13, paddingVertical: 9 },
  platformRow:     { flexDirection: 'row', gap: 6 },
  platformChip:    { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  platformChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  platformChipText:    { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  platformChipTextActive: { color: '#ffffff' },

  // Analytics
  analyticsRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#020617', borderRadius: 12, paddingVertical: 8, marginTop: 8, borderWidth: 1, borderColor: '#1e293b' },
  analyticsRowTablet: { marginTop: 12, paddingVertical: 10, borderRadius: 14 },
  analyticItem:       { alignItems: 'center', flex: 1 },
  analyticValue:      { fontSize: 16, fontWeight: '900', color: '#38bdf8' },
  analyticLabel:      { fontSize: 9, color: '#64748b', fontWeight: '700', marginTop: 1 },
  analyticDivider:    { width: 1, height: 28, backgroundColor: '#1e293b' },

  // Sheet Tabs
  sheetTabBar:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, backgroundColor: '#0b1329', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  sheetTabRow:   { flexDirection: 'row', gap: 6 },
  sheetTab:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  sheetTabActive:   { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  sheetTabBlocked: { backgroundColor: '#1e293b', borderColor: '#334155' },
  sheetTabText:     { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  sheetTabTextActive:  { color: '#ffffff' },
  sheetTabTextBlocked: { color: '#475569', textDecorationLine: 'line-through' },
  blockedDot:    { color: '#ef4444', fontSize: 8, marginLeft: 4 },
  sheetBlockBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  sheetBlockBtnText: { fontSize: 16 },

  // Grid
  gridContainer: { flex: 1, backgroundColor: '#030712', padding: 4 },
  gridInner:     { flex: 1 },
  emptyState:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon:     { fontSize: 52, marginBottom: 10 },
  emptyTitle:    { fontSize: 17, fontWeight: '900', color: '#ffffff', marginBottom: 4 },
  emptySub:      { fontSize: 12, color: '#64748b', textAlign: 'center' },

  // Column Header Row
  headerRow:    { flexDirection: 'row', alignItems: 'stretch', backgroundColor: '#0b1329', borderBottomWidth: 2, borderBottomColor: '#1e293b' },
  rowNumCorner: { width: ROW_CTRL_W, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: '#1e293b' },
  cornerLabel:  { fontSize: 10, fontWeight: '800', color: '#475569', marginTop: 2 },

  // Column Header Cell
  colHeader:    { backgroundColor: '#0b1329', borderRightWidth: 1, borderBottomWidth: 2, borderColor: '#1e293b', paddingVertical: 6, paddingHorizontal: 4, minWidth: 100 },
  colHeaderTop: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
  colHeaderName:     { fontSize: 11, fontWeight: '700', color: '#e2e8f0' },
  colHeaderNameBlocked: { color: '#475569', textDecorationLine: 'line-through' },
  colBlockBtn:  { width: 28, height: 28, borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  colBlockBtnActive: { backgroundColor: '#065f46', borderColor: '#34d399' },
  colBlockBtnText:   { fontSize: 13 },

  // Role Chips
  roleRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 3, alignItems: 'center' },
  roleChip:    { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  roleChipText:    { fontSize: 9, color: '#94a3b8', fontWeight: '700' },

  // Column Ctrl Buttons (← → ↔)
  colCtrlBtn:    { width: 22, height: 22, borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  colCtrlBtnWidth: { width: 26 },
  colCtrlBtnText:    { fontSize: 12, fontWeight: '800', color: '#94a3b8' },
  colCtrlBtnTextDisabled: { color: '#334155' },

  // Body horizontal scroll
  bodyHS:    { flex: 1 },
  rowList:   { flex: 1 },

  // Footer
  footer:       { backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 10 },
  validationRow: { marginBottom: 8 },
  warnText:      { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
  readyText:      { fontSize: 11, fontWeight: '700', color: '#34d399' },
  footerActions: { flexDirection: 'row', gap: 8 },
  cancelBtn:     { flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
  injectBtn:     { flex: 2, backgroundColor: '#4f46e5', paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  injectBtnDisabled: { opacity: 0.4 },
  injectBtnText:     { color: '#ffffff', fontSize: 13, fontWeight: '900' },

  // Rename Modal
  renameOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  renameCard:    { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 16, padding: 20, width: '85%', maxWidth: 360 },
  renameCardTablet: { maxWidth: 420, padding: 24 },
  renameTitle:   { fontSize: 15, fontWeight: '900', color: '#ffffff', marginBottom: 12 },
  renameInput:   { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#ffffff', fontSize: 13, fontWeight: '600', marginBottom: 16 },
  renameActions: { flexDirection: 'row', gap: 10 },
  renameCancelBtn: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  renameCancelBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
  renameSaveBtn:  { flex: 1, backgroundColor: '#4f46e5', paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  renameSaveBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});
