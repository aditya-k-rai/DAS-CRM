/**
 * FileImportEngineModal.tsx — DAS CRM Android
 * Web-Inspired CSV/Excel Data Ingestion Portal & Interactive Grid.
 * Features:
 *  - Responsive Safe Area Insets (Prevents Top Notch & Bottom System Nav overlap)
 *  - Web-Inspired Column Headers (COL X title, Block pill, Sleek Dropdown Pill)
 *  - Interactive Role Picker Bottom Sheet with Custom Field Naming
 *  - Interactive Source Platform Selection Modal & Quick Chips
 *  - Row Controls Column ("Row Controls" sticky left header matching web)
 *  - Zero-Flicker 2-Axis Scroll Engine
 */

import React, {
  useState, useEffect, useCallback, memo, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ScrollView, FlatList, Alert, ActivityIndicator, useWindowDimensions,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';
import { LeadAllocationEngineModal } from './LeadAllocationEngineModal';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ROW_H        = 46;  // px — data row height
const ROW_CTRL_W   = 78;  // px — Row Controls column width (matches web "#1 / Block")
const WIDTH_CYCLE  = [120, 170, 240]; // 3-state column width cycle

const FIELD_ROLE_OPTIONS: { value: string; label: string; icon: string; color: string }[] = [
  { value: 'name',    label: 'Name (Lead / Contact)', icon: '👤', color: '#818cf8' },
  { value: 'email',   label: 'Email Address',         icon: '📧', color: '#f59e0b' },
  { value: 'phone',   label: 'Phone Number',          icon: '📱', color: '#34d399' },
  { value: 'company', label: 'Company Name',          icon: '🏢', color: '#f472b6' },
  { value: 'value',   label: 'Lead Value (₹)',        icon: '💰', color: '#fb923c' },
  { value: 'city',    label: 'City / Location',       icon: '📍', color: '#38bdf8' },
  { value: 'budget',  label: 'Budget Range',          icon: '📊', color: '#a78bfa' },
  { value: 'custom',  label: 'Custom Field',          icon: '✏️', color: '#94a3b8' },
  { value: 'block',   label: 'Block Column',          icon: '🚫', color: '#ef4444' },
];

const PLATFORMS = [
  'Google Ads', 'Meta Ads (FB & Insta)', 'LinkedIn Ads', 'Microsoft Ads (Bing)',
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

const getRoleColor = (r: string) => FIELD_ROLE_OPTIONS.find(o => o.value === r)?.color ?? '#94a3b8';
const getRoleIcon  = (r: string) => FIELD_ROLE_OPTIONS.find(o => o.value === r)?.icon  ?? '📌';
const sanitizeNum   = (v: string) => { if (!v) return '₹0'; const c = v.replace(/[^0-9.]/g,''); if (!c) return '₹0'; const n = parseFloat(c); return isNaN(n) ? '₹0' : `₹${n.toLocaleString('en-IN')}`; };
const sanitizePhone  = (v: string) => { if (!v) return ''; const c = v.replace(/[^0-9+]/g,''); if (!c.startsWith('+') && c.length===10) return '+91'+c; return c; };
const fmtBytes      = (b: number) => b < 1024 ? `${b} B` : b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`;
const fmtNow        = () => { const n = new Date(); return `${n.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}, ${n.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}`; };

// ─────────────────────────────────────────────────────────────────────────────
// Types
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
  key: string;
  header: string;
  index: number;
  role: string;
  blocked: boolean;
  width: number;
}

export interface ParsedSheet {
  name: string;
  isBlocked: boolean;
  data: string[][];
  columns: ColumnDef[];
  blockedRows: boolean[];
}

export interface DuplicateLeadRecord {
  sheetIndex: number;
  rowIndex: number;
  leadName: string;
  phone: string;
  email: string;
  matchType: 'PHONE' | 'EMAIL' | 'BOTH';
  matchedExistingLead?: {
    name: string;
    phone: string;
    email: string;
    createdAt?: string;
  };
  resolution: 'UNRESOLVED' | 'RETARGET' | 'FILTER';
}

export interface IncompleteContactRecord {
  sheetIndex: number;
  sheetName: string;
  rowIndex: number;
  leadName: string;
  phone: string;
  email: string;
  phoneColIndex: number;
  emailColIndex: number;
  phoneColLabel: string;
  emailColLabel: string;
  isPhoneMissing: boolean;
  isEmailMissing: boolean;
  isSkipped: boolean;
}

const DEFAULT_PREVIOUS_LEADS = [
  { id: 'prev-1', name: 'Sonu Sharma', phone: '91999689978', email: 'kant0959@gmail.com', createdAt: '2026-09-09' },
  { id: 'prev-2', name: 'Deepak Bhabar', phone: '916267012760', email: 'djbbr77@gmail.com', createdAt: '2026-09-09' },
  { id: 'prev-3', name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@acme.com', createdAt: '2026-08-15' },
  { id: 'prev-4', name: 'Priya Sharma', phone: '8765432109', email: 'priya@techcorp.in', createdAt: '2026-08-16' },
  { id: 'prev-5', name: 'Amit Shah', phone: '7654321098', email: 'amit@westreach.com', createdAt: '2026-08-20' },
  { id: 'prev-6', name: 'Neha Gupta', phone: '6543210987', email: 'neha@lotwaala.org', createdAt: '2026-08-22' },
  { id: 'prev-7', name: 'Vikram Mehta', phone: '9811122233', email: 'vikram@mehtas.com', createdAt: '2026-08-25' },
  { id: 'prev-8', name: 'Ananya Roy', phone: '9822233344', email: 'ananya@royenterprises.in', createdAt: '2026-08-28' },
];

export const isPhoneMatch = (p1: string, p2: string): boolean => {
  const c1 = (p1 || '').replace(/[^0-9]/g, '');
  const c2 = (p2 || '').replace(/[^0-9]/g, '');
  if (!c1 || !c2) return false;
  if (c1 === c2) return true;
  if (c1.length >= 10 && c2.length >= 10) {
    return c1.slice(-10) === c2.slice(-10);
  }
  return false;
};

export const isEmailMatch = (e1: string, e2: string): boolean => {
  const c1 = (e1 || '').trim().toLowerCase();
  const c2 = (e2 || '').trim().toLowerCase();
  if (!c1 || !c2 || !c1.includes('@') || !c2.includes('@')) return false;
  return c1 === c2;
};

export interface SavedImportSession {
  fileName: string;
  inputFileName: string;
  fileSize: string;
  fmt: string;
  selectedPlatform: string;
  sheets: ParsedSheet[];
  activeIdx: number;
}

export const DEFAULT_IMPORT_SESSION: SavedImportSession = {
  fileName: '25-27 May_user_data.xlsx',
  inputFileName: '25-27 May_user_data',
  fileSize: '8.1 KB',
  fmt: 'XLSX',
  selectedPlatform: 'Google Ads',
  activeIdx: 0,
  sheets: [
    {
      name: '25_May_2026',
      isBlocked: false,
      columns: [
        { key: 'col_0', header: 'User', index: 0, role: 'name', blocked: false, width: 170 },
        { key: 'col_1', header: 'Email Address', index: 1, role: 'email', blocked: false, width: 170 },
        { key: 'col_2', header: 'Phone Number', index: 2, role: 'phone', blocked: false, width: 170 },
        { key: 'col_3', header: 'Company Name', index: 3, role: 'company', blocked: false, width: 170 },
        { key: 'col_4', header: 'Lead Value', index: 4, role: 'value', blocked: false, width: 140 },
        { key: 'col_5', header: 'City', index: 5, role: 'city', blocked: false, width: 140 },
        { key: 'col_6', header: 'Requirement', index: 6, role: 'custom', blocked: false, width: 170 },
      ],
      blockedRows: [false, false, false, false, false, false, false, false, false, false, false],
      data: [
        ['Asfak Hunnani', 'Asfakhunnani@gmail.com', '+91 98765 43210', 'Hunnani Enterprises', '₹45,000', 'Mumbai', 'Enterprise CRM Suite'],
        ['Shruti Kamble', 'mblephoto403@gmail.com', '+91 98123 45678', 'Kamble Studios', '₹35,000', 'Pune', 'WhatsApp Cloud API'],
        ['Lalith Mukesh', 'lalithm300@gmail.com', '+91 97222 33445', 'Lalith Tech Labs', '₹75,000', 'Bangalore', 'AI Lead Scoring Engine'],
        ['Anshika Kharola', 'harolaanshika@gmail.com', '+91 99887 11223', 'Kharola Logistics', '₹60,000', 'Delhi', 'Cold Outreach Pipeline'],
        ['Abhishek Chouhan', 'k.chouhan42@gmail.com', '+91 96543 21098', 'Chouhan Corp', '₹30,000', 'Jaipur', 'Call Recording Integration'],
        ['Parag Hadiya', 'hadiyaparag7@gmail.com', '+91 98444 55667', 'Hadiya & Sons', '₹50,000', 'Ahmedabad', 'Catalog PDF Generator'],
        ['Ramesh Patel', 'ramesh.patel@gmail.com', '+91 98111 22334', 'Patel Industries', '₹90,000', 'Surat', 'Multi-Source Sync'],
        ['Sneha Deshmukh', 'sneha.d@outlook.com', '+91 97555 44332', 'Deshmukh Pharma', '₹1,20,000', 'Nagpur', 'Full Suite License'],
        ['Vikas Verma', 'vikas.verma@yahoo.com', '+91 98333 77889', 'Verma Tech Solutions', '₹40,000', 'Indore', 'Automated Lead Allocation'],
        ['Pooja Nair', 'pooja.nair@gmail.com', '+91 98999 11223', 'Nair Healthcare Ltd', '₹85,000', 'Kochi', 'WhatsApp Broadcasts'],
        ['Gaurav Mishra', 'gaurav.m@gmail.com', '+91 97444 88990', 'Mishra Traders', '₹28,000', 'Lucknow', 'HR & Attendance Sync'],
      ],
    },
    {
      name: '26_May_2026',
      isBlocked: false,
      columns: [
        { key: 'col_0', header: 'User', index: 0, role: 'name', blocked: false, width: 170 },
        { key: 'col_1', header: 'Email Address', index: 1, role: 'email', blocked: false, width: 170 },
        { key: 'col_2', header: 'Phone Number', index: 2, role: 'phone', blocked: false, width: 170 },
        { key: 'col_3', header: 'Company Name', index: 3, role: 'company', blocked: false, width: 170 },
        { key: 'col_4', header: 'Lead Value', index: 4, role: 'value', blocked: false, width: 140 },
        { key: 'col_5', header: 'City', index: 5, role: 'city', blocked: false, width: 140 },
        { key: 'col_6', header: 'Requirement', index: 6, role: 'custom', blocked: false, width: 170 },
      ],
      blockedRows: [false, false, false, false, false],
      data: [
        ['Vikram Sethi', 'vikram@sethi.com', '+91 98777 66655', 'Sethi Global Pvt Ltd', '₹1,10,000', 'Chandigarh', 'Enterprise SLA'],
        ['Meera Pillai', 'meera.p@outlook.com', '+91 98765 00112', 'Pillai Agro Exports', '₹65,000', 'Chennai', 'Lead Ingestion Portal'],
        ['Yusuf Ansari', 'yusuf.ansari@yahoo.com', '+91 97345 88902', 'Ansari Textiles', '₹45,000', 'Varanasi', 'Quotations Module'],
        ['Simran Kaur', 'simran.k@hotmail.com', '+91 99100 55678', 'Kaur Technologies', '₹80,000', 'Mohali', 'AI Chatbot Routing'],
        ['Deepak Malhotra', 'deepak.m@gmail.com', '+91 98444 11223', 'Malhotra Auto Spares', '₹55,000', 'Ludhiana', 'Deals Pipeline Kanban'],
      ],
    },
    {
      name: '27_May_2026',
      isBlocked: false,
      columns: [
        { key: 'col_0', header: 'User', index: 0, role: 'name', blocked: false, width: 170 },
        { key: 'col_1', header: 'Email Address', index: 1, role: 'email', blocked: false, width: 170 },
        { key: 'col_2', header: 'Phone Number', index: 2, role: 'phone', blocked: false, width: 170 },
        { key: 'col_3', header: 'Company Name', index: 3, role: 'company', blocked: false, width: 170 },
        { key: 'col_4', header: 'Lead Value', index: 4, role: 'value', blocked: false, width: 140 },
        { key: 'col_5', header: 'City', index: 5, role: 'city', blocked: false, width: 140 },
        { key: 'col_6', header: 'Requirement', index: 6, role: 'custom', blocked: false, width: 170 },
      ],
      blockedRows: [false, false, false],
      data: [
        ['Kiran Nair', 'kiran.nair@gmail.com', '+91 96543 21099', 'Nair Solar Power', '₹1,50,000', 'Thiruvananthapuram', 'Enterprise CRM'],
        ['Tarun Singhal', 'tarun.s@singhal.com', '+91 98112 33445', 'Singhal Steel Works', '₹95,000', 'Bhilai', 'Live Sync Telemetry'],
        ['Ritu Saxena', 'ritu.saxena@gmail.com', '+91 97123 99887', 'Saxena Design Hub', '₹38,000', 'Bhopal', 'Brochures & WhatsApp'],
      ],
    },
  ],
};

export interface FileImportEngineModalProps {
  visible: boolean;
  onClose: () => void;
  onImportSuccess: (leads: ImportedLead[], audit: FileAuditRecord) => void;
  onImportError?: (msg: string) => void;
  initialSession?: SavedImportSession | null;
  onSaveSession?: (session: SavedImportSession) => void;
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
    <Text style={[cellStyle.rowNumText, blocked && cellStyle.rowNumTextBlocked]}>#{index + 1}</Text>
    <TouchableOpacity style={[cellStyle.blockBtn, blocked && cellStyle.blockBtnActive]} onPress={onToggle}>
      <Text style={cellStyle.blockBtnText}>{blocked ? '👁' : '🚫'}</Text>
    </TouchableOpacity>
  </View>
));

const cellStyle = StyleSheet.create({
  cell:        { borderRightWidth: 1, borderColor: '#1e293b', justifyContent: 'center', minWidth: 100 },
  cellBlocked: { backgroundColor: '#1e293b', opacity: 0.5 },
  input:       { paddingHorizontal: 8, paddingVertical: 8, fontSize: 12, fontWeight: '500', backgroundColor: 'transparent' },
  rowNumCell:  { width: ROW_CTRL_W, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0b1329', borderRightWidth: 1, borderColor: '#1e293b', flexDirection: 'row', paddingHorizontal: 6 },
  rowNumText:  { fontSize: 10, fontWeight: '800', color: '#64748b' },
  rowNumTextBlocked: { color: '#ef4444' },
  blockBtn:    { width: 22, height: 22, borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  blockBtnActive: { backgroundColor: '#065f46', borderColor: '#34d399' },
  blockBtnText: { fontSize: 11 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const FileImportEngineModal: React.FC<FileImportEngineModalProps> = ({
  visible, onClose, onImportSuccess, onImportError,
  initialSession, onSaveSession,
}) => {
  const { token } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { width: SW } = useWindowDimensions();
  const isTablet = SW >= 600;

  // ── State (Starts fresh and empty unless an explicit initialSession is provided) ───
  const [fileName, setFileName]           = useState(initialSession?.fileName || '');
  const [fileSize, setFileSize]           = useState(initialSession?.fileSize || '');
  const [fmt,      setFmt]               = useState(initialSession?.fmt || '');
  const [sheets,   setSheets]            = useState<ParsedSheet[]>(initialSession?.sheets || []);
  const [activeIdx, setActiveIdx]         = useState(initialSession?.activeIdx || 0);
  const [loading,   setLoading]           = useState(false);
  const [inputFileName, setInputFileName] = useState(initialSession?.inputFileName || '');
  const [selectedPlatform, setSelectedPlatform] = useState(initialSession?.selectedPlatform || 'Google Ads');
  const [platformPickerOpen, setPlatformPickerOpen] = useState(false);

  // ⚡ Post-Import Lead Allocation Modal State (Parity with Web)
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [committedLeadsCount, setCommittedLeadsCount] = useState(0);

  // 🔍 Duplicate Leads Detection & Retargeting Resolution State
  const [duplicateRecords, setDuplicateRecords] = useState<DuplicateLeadRecord[]>([]);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicatesResolved, setDuplicatesResolved] = useState(true);
  const previousLeadsRef = React.useRef<any[]>(DEFAULT_PREVIOUS_LEADS);

  // ⚠️ Missing Contact Details Sanitation State
  const [missingContactModalOpen, setMissingContactModalOpen] = useState(false);
  const [skippedRowKeys, setSkippedRowKeys] = useState<Set<string>>(new Set());
  const [missingFilterTab, setMissingFilterTab] = useState<'ALL' | 'NO_PHONE' | 'NO_EMAIL' | 'NO_BOTH' | 'SKIPPED'>('ALL');
  const [editingValues, setEditingValues] = useState<Record<string, { phone?: string; email?: string }>>({});

  const incompleteContactRecords: IncompleteContactRecord[] = useMemo(() => {
    const list: IncompleteContactRecord[] = [];
    sheets.forEach((sheet, sIdx) => {
      if (sheet.isBlocked) return;

      const phoneCol = sheet.columns.find(c => c.role === 'phone');
      const emailCol = sheet.columns.find(c => c.role === 'email');
      const nameCol = sheet.columns.find(c => c.role === 'name');

      if (!phoneCol && !emailCol) return;

      sheet.data.forEach((row, rIdx) => {
        if (sheet.blockedRows[rIdx]) return;

        const phone = phoneCol ? (row[phoneCol.index] || '').trim() : '';
        const email = emailCol ? (row[emailCol.index] || '').trim() : '';
        const name = nameCol && row[nameCol.index]?.trim() ? row[nameCol.index].trim() : `Lead #${rIdx + 1}`;

        const isPhoneMissing = !!phoneCol && !phone;
        const isEmailMissing = !!emailCol && !email;

        if (isPhoneMissing || isEmailMissing) {
          const rowKey = `${sIdx}_${rIdx}`;
          const isSkipped = skippedRowKeys.has(rowKey);
          list.push({
            sheetIndex: sIdx,
            sheetName: sheet.name || `Sheet ${sIdx + 1}`,
            rowIndex: rIdx,
            leadName: name,
            phone,
            email,
            phoneColIndex: phoneCol ? phoneCol.index : -1,
            emailColIndex: emailCol ? emailCol.index : -1,
            phoneColLabel: phoneCol ? `COL ${phoneCol.index + 1} (Phone)` : 'Phone (Not Mapped)',
            emailColLabel: emailCol ? `COL ${emailCol.index + 1} (Email)` : 'Email (Not Mapped)',
            isPhoneMissing,
            isEmailMissing,
            isSkipped,
          });
        }
      });
    });
    return list;
  }, [sheets, skippedRowKeys]);

  const activeIncompleteRecords = useMemo(() => {
    return incompleteContactRecords.filter((r: IncompleteContactRecord) => !r.isSkipped);
  }, [incompleteContactRecords]);

  const missingPhoneCount = useMemo(() => {
    return activeIncompleteRecords.filter((r: IncompleteContactRecord) => r.isPhoneMissing).length;
  }, [activeIncompleteRecords]);

  const missingEmailCount = useMemo(() => {
    return activeIncompleteRecords.filter((r: IncompleteContactRecord) => r.isEmailMissing).length;
  }, [activeIncompleteRecords]);

  const missingBothCount = useMemo(() => {
    return activeIncompleteRecords.filter((r: IncompleteContactRecord) => r.isPhoneMissing && r.isEmailMissing).length;
  }, [activeIncompleteRecords]);

  const handleSaveMissingField = (sIdx: number, rIdx: number, field: 'phone' | 'email', val: string) => {
    setSheets(prev => prev.map((s, idx) => {
      if (idx !== sIdx) return s;
      const targetCol = s.columns.find(c => c.role === field);
      if (!targetCol) return s;
      const copyData = s.data.map((r, i) => i === rIdx ? [...r] : r);
      copyData[rIdx][targetCol.index] = val.trim();
      return { ...s, data: copyData };
    }));
  };

  const handleToggleSkipRow = (sIdx: number, rIdx: number) => {
    const key = `${sIdx}_${rIdx}`;
    setSkippedRowKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleRemoveIncompleteRow = (sIdx: number, rIdx: number) => {
    setSheets(prev => prev.map((s, idx) => {
      if (idx !== sIdx) return s;
      const copyBlocked = [...s.blockedRows];
      copyBlocked[rIdx] = true;
      return { ...s, blockedRows: copyBlocked };
    }));
  };

  const handleBulkRemoveIncomplete = () => {
    setSheets(prev => prev.map((sheet, sIdx) => {
      const copyBlocked = [...sheet.blockedRows];
      activeIncompleteRecords.forEach((rec: IncompleteContactRecord) => {
        if (rec.sheetIndex === sIdx) {
          copyBlocked[rec.rowIndex] = true;
        }
      });
      return { ...sheet, blockedRows: copyBlocked };
    }));
  };

  const handleBulkSkipIncomplete = () => {
    setSkippedRowKeys(prev => {
      const next = new Set(prev);
      activeIncompleteRecords.forEach((rec: IncompleteContactRecord) => {
        next.add(`${rec.sheetIndex}_${rec.rowIndex}`);
      });
      return next;
    });
  };

  const filteredIncompleteList = useMemo(() => {
    return incompleteContactRecords.filter((rec: IncompleteContactRecord) => {
      if (missingFilterTab === 'NO_PHONE') return rec.isPhoneMissing && !rec.isSkipped;
      if (missingFilterTab === 'NO_EMAIL') return rec.isEmailMissing && !rec.isSkipped;
      if (missingFilterTab === 'NO_BOTH') return rec.isPhoneMissing && rec.isEmailMissing && !rec.isSkipped;
      if (missingFilterTab === 'SKIPPED') return rec.isSkipped;
      return true;
    });
  }, [incompleteContactRecords, missingFilterTab]);

  const getEditingPhone = (key: string, defaultVal: string) => {
    return editingValues[key]?.phone !== undefined ? editingValues[key]?.phone! : defaultVal;
  };
  const getEditingEmail = (key: string, defaultVal: string) => {
    return editingValues[key]?.email !== undefined ? editingValues[key]?.email! : defaultVal;
  };
  const setFieldEdit = (key: string, field: 'phone' | 'email', val: string) => {
    setEditingValues(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: val,
      },
    }));
  };

  // Deduplication Scanner Function
  const runDeduplicationScan = useCallback((currentSheets: ParsedSheet[]) => {
    const dups: DuplicateLeadRecord[] = [];
    const seenInFile = new Map<string, { sheetIdx: number; rowIdx: number; name: string }>();

    currentSheets.forEach((sheet, sIdx) => {
      if (sheet.isBlocked) return;
      const phoneCol = sheet.columns.find(c => c.role === 'phone');
      const emailCol = sheet.columns.find(c => c.role === 'email');
      const nameCol = sheet.columns.find(c => c.role === 'name');

      sheet.data.forEach((row, rIdx) => {
        if (sheet.blockedRows[rIdx]) return;

        const phone = phoneCol ? (row[phoneCol.index] || '').trim() : '';
        const email = emailCol ? (row[emailCol.index] || '').trim().toLowerCase() : '';
        const name = nameCol ? (row[nameCol.index] || '').trim() : `Row #${rIdx + 1}`;

        if (!phone && !email) return;

        let matchedPrev: any = null;
        let matchType: 'PHONE' | 'EMAIL' | 'BOTH' | null = null;

        for (const prev of previousLeadsRef.current) {
          const pMatch = phone && isPhoneMatch(phone, prev.phone);
          const eMatch = email && isEmailMatch(email, prev.email);

          if (pMatch && eMatch) {
            matchedPrev = prev;
            matchType = 'BOTH';
            break;
          } else if (pMatch) {
            matchedPrev = prev;
            matchType = 'PHONE';
            break;
          } else if (eMatch) {
            matchedPrev = prev;
            matchType = 'EMAIL';
            break;
          }
        }

        if (!matchedPrev) {
          const phoneKey = phone ? `phone_${phone.replace(/[^0-9]/g, '').slice(-10)}` : '';
          const emailKey = email ? `email_${email}` : '';
          if (phoneKey && seenInFile.has(phoneKey)) {
            const first = seenInFile.get(phoneKey)!;
            matchedPrev = { name: first.name, phone, email, createdAt: `Row #${first.rowIdx + 1} in this file` };
            matchType = 'PHONE';
          } else if (emailKey && seenInFile.has(emailKey)) {
            const first = seenInFile.get(emailKey)!;
            matchedPrev = { name: first.name, phone, email, createdAt: `Row #${first.rowIdx + 1} in this file` };
            matchType = 'EMAIL';
          } else {
            if (phoneKey) seenInFile.set(phoneKey, { sheetIdx: sIdx, rowIdx: rIdx, name });
            if (emailKey) seenInFile.set(emailKey, { sheetIdx: sIdx, rowIdx: rIdx, name });
          }
        }

        if (matchedPrev && matchType) {
          dups.push({
            sheetIndex: sIdx,
            rowIndex: rIdx,
            leadName: name,
            phone,
            email,
            matchType,
            matchedExistingLead: matchedPrev,
            resolution: 'UNRESOLVED',
          });
        }
      });
    });

    setDuplicateRecords(dups);
    setDuplicatesResolved(dups.length === 0);
  }, []);

  // Fetch extra existing leads from backend API if online
  useEffect(() => {
    if (!visible) return;
    const fetchExisting = async () => {
      try {
        const res = await apiService.getLeads(token || '');
        if (res && Array.isArray(res) && res.length > 0) {
          const mapped = res.map((l: any) => ({
            id: l.id,
            name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.name || 'CRM Lead',
            phone: l.phone || '',
            email: l.email || '',
            createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Previously',
          }));
          previousLeadsRef.current = [...DEFAULT_PREVIOUS_LEADS, ...mapped];
        }
      } catch (_) {}
    };
    fetchExisting();
  }, [visible, token]);

  const handleSetSingleResolution = (sheetIndex: number, rowIndex: number, resolution: 'RETARGET' | 'FILTER') => {
    setDuplicateRecords(prev =>
      prev.map(d => (d.sheetIndex === sheetIndex && d.rowIndex === rowIndex ? { ...d, resolution } : d))
    );
  };

  const handleBulkSetResolution = (resolution: 'RETARGET' | 'FILTER') => {
    setDuplicateRecords(prev => prev.map(d => ({ ...d, resolution })));
  };

  const handleApplyDuplicateResolutions = () => {
    setSheets(prevSheets =>
      prevSheets.map((sheet, sIdx) => {
        const newBlocked = [...sheet.blockedRows];
        duplicateRecords.forEach(dup => {
          if (dup.sheetIndex === sIdx) {
            if (dup.resolution === 'FILTER') {
              newBlocked[dup.rowIndex] = true;
            } else if (dup.resolution === 'RETARGET') {
              newBlocked[dup.rowIndex] = false;
            }
          }
        });
        return { ...sheet, blockedRows: newBlocked };
      })
    );

    setDuplicatesResolved(true);
    setDuplicateModalOpen(false);
  };

  // Role / Custom Name Modal State
  const [pickerColKey, setPickerColKey]   = useState<string | null>(null);
  const [customNameInput, setCustomNameInput] = useState('');

  // Sync state if initialSession prop changes or modal opens
  useEffect(() => {
    if (visible) {
      if (initialSession) {
        setFileName(initialSession.fileName);
        setFileSize(initialSession.fileSize);
        setFmt(initialSession.fmt);
        setSheets(initialSession.sheets);
        setActiveIdx(initialSession.activeIdx || 0);
        setInputFileName(initialSession.inputFileName);
        setSelectedPlatform(initialSession.selectedPlatform);
      } else {
        // Reset to clean new import state
        setFileName('');
        setFileSize('');
        setFmt('');
        setSheets([]);
        setActiveIdx(0);
        setInputFileName('');
        setSelectedPlatform('Google Ads');
      }
    }
  }, [initialSession, visible]);

  const currentSession: SavedImportSession = useMemo(() => ({
    fileName,
    inputFileName,
    fileSize,
    fmt,
    selectedPlatform,
    sheets,
    activeIdx,
  }), [fileName, inputFileName, fileSize, fmt, selectedPlatform, sheets, activeIdx]);

  const activeSheet   = sheets[activeIdx];
  const totalDataRows = activeSheet?.data.length ?? 0;
  const totalCols     = activeSheet?.columns.length ?? 0;

  const totalTableWidth = useMemo(() => {
    if (!activeSheet) return 600;
    return ROW_CTRL_W + activeSheet.columns.reduce((sum, col) => sum + col.width, 0);
  }, [activeSheet]);

  const isReady = inputFileName.trim().length > 0 && selectedPlatform.length > 0 && sheets.length > 0;

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

      setFmt(ext);
      setFileName(rawName);
      setInputFileName(rawName.replace(/\.[^/.]+$/, ''));
      setFileSize(fmtBytes(asset.size || 0));

      let response: ArrayBuffer | null = null;
      if (asset.uri) {
        const fr = await fetch(asset.uri);
        response = await fr.arrayBuffer();
      }
      if (!response) { Alert.alert('Error', 'Could not read file contents.'); return; }

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
      runDeduplicationScan(parsed);
    } catch (err) {
      Alert.alert('Parse Error', 'Could not read or parse the selected spreadsheet file.');
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

  const setColRole = useCallback((key: string, role: string, customHeaderName?: string) => {
    setSheets(prev => prev.map((s, i) =>
      i !== activeIdx ? s : {
        ...s,
        columns: s.columns.map(c => {
          if (c.key !== key) return c;
          const nextHeader = customHeaderName !== undefined ? customHeaderName : c.header;
          return {
            ...c,
            role,
            header: nextHeader,
            blocked: role === 'block',
          };
        }),
      }
    ));
    setPickerColKey(null);
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

  const openPickerModal = (key: string) => {
    const col = activeSheet?.columns.find(c => c.key === key);
    if (!col) return;
    setCustomNameInput(col.header || '');
    setPickerColKey(key);
  };

  const handleSaveCustomName = () => {
    if (!pickerColKey) return;
    const name = customNameInput.trim() || 'Custom Field';
    setColRole(pickerColKey, 'custom', name);
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

  // ── Commit ──────────────────────────────────────────────────────────────

  const handleCommit = async () => {
    if (!inputFileName.trim()) { Alert.alert('Missing Info', 'Please enter a File Name.'); return; }
    if (!selectedPlatform)      { Alert.alert('Missing Info', 'Please select a Source Platform.'); return; }

    if (!duplicatesResolved && duplicateRecords.length > 0) {
      Alert.alert(
        'Action Required: Duplicate Leads Found',
        `This file contains ${duplicateRecords.length} duplicate leads. Please tap the red duplicate button above to either Retarget or Filter them out before proceeding.`,
      );
      return;
    }

    setLoading(true);
    try {
      const leads: ImportedLead[] = [];
      sheets.forEach(sheet => {
        if (sheet.isBlocked) return;
        sheet.data.forEach((row, rIdx) => {
          if (sheet.blockedRows[rIdx]) return;

          // Check if this row was marked for retargeting
          const dupRecord = duplicateRecords.find(d => d.sheetIndex === activeIdx && d.rowIndex === rIdx);
          const isRetargeting = dupRecord?.resolution === 'RETARGET';

          const lead: ImportedLead = {
            id: `lead_${Date.now()}_${rIdx}`,
            name:'', email:'No Email Provided', phone:'',
            company:'Independent Prospect', source: selectedPlatform,
            status: isRetargeting ? 'RETARGETING' : 'NEW LEAD',
            value:'₹25,000', assignedRep:'Rajesh Kumar',
            city:'', budget:'', requirement:'',
            callSyncStatus:'Synced: Just Now • Pending',
            customFields: isRetargeting ? { isRetargeting: 'true', campaign: 'Retargeting Campaign' } : {},
            createdAt:'Just now',
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

      if (leads.length === 0) { Alert.alert('No Valid Data', 'No active rows to import.'); setLoading(false); return; }

      const audit: FileAuditRecord = {
        filename:`${inputFileName.trim()} (${fmt||'FILE'})`,
        fileSize:fileSize||'—',
        platform:selectedPlatform,
        count:leads.length,
        date:fmtNow(),
      };

      try {
        await apiService.importLeadsFromFile(token||'', {
          leads,
          fileName:audit.filename,
          fileSize:audit.fileSize,
          platform:audit.platform,
          importedAt:audit.date,
          sheetCount:sheets.filter(s=>!s.isBlocked).length,
          totalRows:sheets.reduce((a,s)=>a+s.data.length,0),
          blockedSheets:sheets.filter(s=>s.isBlocked).length,
        });
      } catch (_) { /* offline fallback */ }

      setCommittedLeadsCount(leads.length);
      onSaveSession?.(currentSession);
      onImportSuccess(leads, audit);
      setAllocationModalOpen(true);
    } catch (err) {
      Alert.alert('Ingestion Error', (err as Error).message || 'Unknown error');
      onImportError?.((err as Error).message || '');
    } finally { setLoading(false); }
  };

  const handleClose = () => {
    onSaveSession?.(currentSession);
    setLoading(false);
    setPickerColKey(null);
    setPlatformPickerOpen(false);
    onClose();
  };

  // ── Row Renderer (Zero-Flicker Flex Row) ─────────────────────────
  const renderRow = useCallback(({ item: row, index: rIdx }: { item: string[]; index: number }) => {
    if (!activeSheet) return null;
    const isBlocked = activeSheet.blockedRows[rIdx];
    return (
      <View style={[rowStyle.row, isBlocked && rowStyle.rowBlocked, rIdx % 2 === 1 && rowStyle.rowAlt]}>
        <RowNumCell index={rIdx} blocked={isBlocked} onToggle={() => toggleBlockRow(rIdx)} />
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
      </View>
    );
  }, [activeSheet, toggleBlockRow, updateCell]);

  const keyExtractor = useCallback((_: string[], idx: number) => `row_${idx}`, []);
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ROW_H,
    offset: ROW_H * index,
    index,
  }), []);

  const PADX = isTablet ? 24 : 14;

  const currentPickerCol = useMemo(() => {
    if (!pickerColKey || !activeSheet) return null;
    return activeSheet.columns.find(c => c.key === pickerColKey) || null;
  }, [pickerColKey, activeSheet]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 36) },
      ]}>

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <View style={[styles.header, { paddingHorizontal: PADX }]}>
          <View style={styles.headerLeft}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.headerTitle}>📥 File Import Portal</Text>
              {fmt ? <View style={styles.formatBadge}><Text style={styles.formatBadgeText}>{fmt}</Text></View> : null}
            </View>
            <Text style={styles.headerSub}>
              {sheets.length > 0
                ? `${sheets.length} sheet${sheets.length>1?'s':''} · ${totalDataRows} rows · ${totalCols} cols`
                : 'Parse CSV, XLSX, TSV or XML spreadsheet files'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── UPLOAD BAR & METADATA SECTION ──────────────────────────── */}
        <View style={[styles.uploadBar, { paddingHorizontal: PADX }]}>
          <TouchableOpacity style={[styles.pickBtn, isTablet && styles.pickBtnTablet]} onPress={handlePickFile} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.pickBtnText}>📁 {fileName ? 'Change Spreadsheet File' : 'Select Spreadsheet File'}</Text>
          </TouchableOpacity>

          {fileName ? (
            <View style={{ marginTop: 10 }}>
              {/* File Name & Platform Row (Stack on Mobile, Row on Tablet) */}
              <View style={[styles.metaRow, isTablet && styles.metaRowTablet]}>
                <View style={styles.metaFieldBlock}>
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

                {/* Source Platform Selector Block */}
                <View style={styles.metaFieldBlock}>
                  <Text style={styles.metaLabel}>Source Platform *</Text>
                  
                  {/* Dropdown Select Button */}
                  <TouchableOpacity
                    style={[
                      styles.platformDropdownPill,
                      !selectedPlatform && styles.platformDropdownPillWarning,
                    ]}
                    onPress={() => setPlatformPickerOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.platformDropdownText, !selectedPlatform && { color: '#f59e0b' }]} numberOfLines={1}>
                      {selectedPlatform ? `📢 ${selectedPlatform}` : '⚠️ Select Source Platform...'}
                    </Text>
                    <Text style={{ fontSize: 10, color: selectedPlatform ? '#818cf8' : '#f59e0b' }}>▼</Text>
                  </TouchableOpacity>

                  {/* Quick Horizontal Chip Bar */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
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

              {/* Stats Bar */}
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

              {/* Conflict & Sanitation Action Badges */}
              <View style={{ flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {duplicateRecords.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.dupBadgeBtn,
                      !duplicatesResolved ? styles.dupBadgeBtnAlert : styles.dupBadgeBtnResolved,
                    ]}
                    onPress={() => setDuplicateModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dupBadgeBtnText, { color: !duplicatesResolved ? '#fda4af' : '#6ee7b7' }]}>
                      {!duplicatesResolved
                        ? `⚠️ ${duplicateRecords.length} Duplicates Found (Tap to Resolve)`
                        : `✓ ${duplicateRecords.length} Duplicates Handled`}
                    </Text>
                  </TouchableOpacity>
                )}

                {sheets.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.missingBadgeBtn,
                      activeIncompleteRecords.length > 0 ? styles.missingBadgeBtnAlert : styles.missingBadgeBtnResolved,
                    ]}
                    onPress={() => setMissingContactModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.missingBadgeBtnText}>
                      {activeIncompleteRecords.length > 0
                        ? `⚠️ ${activeIncompleteRecords.length} Incomplete Leads (${missingPhoneCount} Phone · ${missingEmailCount} Email)`
                        : '✓ All Contact Details Complete'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
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

        {/* ── GRID SYSTEM (SINGLE UNIFIED 2-AXIS SCROLL) ──────────────── */}
        <View style={styles.gridContainer}>
          {sheets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>Ready for New Lead Import</Text>
              <Text style={styles.emptySub}>
                Select a CSV or Excel (.xlsx, .xls) spreadsheet from your device to map columns and ingest leads.
              </Text>
              <TouchableOpacity
                style={[styles.pickBtn, { marginTop: 16, paddingHorizontal: 24, backgroundColor: '#4f46e5' }]}
                onPress={handlePickFile}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={[styles.pickBtnText, { color: '#ffffff', fontWeight: '800' }]}>
                  📂 Select Spreadsheet File
                </Text>
              </TouchableOpacity>
            </View>
          ) : activeSheet?.isBlocked ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🚫</Text>
              <Text style={styles.emptyTitle}>Sheet Is Blocked</Text>
              <Text style={styles.emptySub}>Tap the eye icon in the tab bar above to unblock this worksheet</Text>
            </View>
          ) : (
            <View style={styles.gridInner}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={{ flexDirection: 'column', flexGrow: 1 }}
                nestedScrollEnabled
              >
                <View style={{ minWidth: totalTableWidth, flex: 1 }}>

                  {/* ── WEB-INSPIRED COLUMN HEADERS ───────────────────────── */}
                  <View style={styles.headerRow}>
                    {/* Row Controls Sticky Header Cell */}
                    <View style={[styles.rowNumCorner, { width: ROW_CTRL_W }]}>
                      <Text style={styles.cornerLabel}>Row Controls</Text>
                    </View>

                    {activeSheet.columns.map(col => {
                      const currentRoleOpt = FIELD_ROLE_OPTIONS.find(o => o.value === col.role) || FIELD_ROLE_OPTIONS[7];
                      const roleDisplayLabel = col.role === 'custom'
                        ? (col.header ? `✏️ ${col.header}` : 'Custom Field')
                        : `${currentRoleOpt.icon} ${currentRoleOpt.label}`;

                      return (
                        <View key={col.key} style={[styles.colHeader, { width: col.width }]}>
                          {/* 1. Header Top Row: COL X + Web Block Pill */}
                          <View style={styles.colHeaderTop}>
                            <Text style={[styles.colIndexLabel, col.blocked && styles.colIndexLabelBlocked]} numberOfLines={1}>
                              {`COL ${col.index + 1}`}
                            </Text>
                            <TouchableOpacity
                              style={[styles.webBlockBtn, col.blocked && styles.webBlockBtnActive]}
                              onPress={() => toggleBlockCol(col.key)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.webBlockBtnText, col.blocked && styles.webBlockBtnTextActive]}>
                                {col.blocked ? '👁 Unblock' : '🚫 Block'}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {/* 2. Middle Row: Web Dropdown Selector Pill */}
                          <TouchableOpacity
                            style={[
                              styles.roleDropdownPill,
                              col.blocked && styles.roleDropdownPillBlocked,
                              { borderColor: col.blocked ? '#334155' : currentRoleOpt.color },
                            ]}
                            onPress={() => openPickerModal(col.key)}
                            disabled={col.blocked}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.roleDropdownText, { color: col.blocked ? '#64748b' : currentRoleOpt.color }]} numberOfLines={1}>
                              {col.blocked ? '🚫 Blocked' : roleDisplayLabel}
                            </Text>
                            <Text style={{ fontSize: 9, color: col.blocked ? '#475569' : currentRoleOpt.color }}>▼</Text>
                          </TouchableOpacity>

                          {/* 3. Bottom Controls: (←, →, ↔) */}
                          <View style={styles.colActionRow}>
                            <TouchableOpacity style={styles.colCtrlBtn} onPress={() => moveCol(col.key, 'left')} disabled={col.index === 0}>
                              <Text style={[styles.colCtrlBtnText, col.index===0 && styles.colCtrlBtnTextDisabled]}>←</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.colCtrlBtn} onPress={() => moveCol(col.key, 'right')} disabled={col.index === activeSheet.columns.length - 1}>
                              <Text style={styles.colCtrlBtnText}>→</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.colCtrlBtn, styles.colCtrlBtnWidth]} onPress={() => cycleColWidth(col.key)}>
                              <Text style={[styles.colCtrlBtnText, {fontSize:9}]}>↔ {col.width}px</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* ── VIRTUALIZED DATA ROWS (10 VISIBLE ROWS AT A TIME) ────── */}
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
                    style={[styles.rowList, { height: 10 * ROW_H }]}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled
                  />
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* ── FOOTER (SAFE AREA INSETS ELEVATED) ───────────────────────── */}
        <View style={[
          styles.footer,
          { paddingHorizontal: PADX, paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 14 },
        ]}>
          <View style={styles.validationRow}>
            {!inputFileName.trim() && <Text style={styles.warnText}>⚠️ Enter File Name above</Text>}
            {!selectedPlatform && inputFileName.trim() && <Text style={styles.warnText}>⚠️ Select Source Platform above</Text>}
            {duplicateRecords.length > 0 && !duplicatesResolved && (
              <TouchableOpacity onPress={() => setDuplicateModalOpen(true)} activeOpacity={0.7}>
                <Text style={[styles.warnText, { color: '#f43f5e', fontWeight: '900' }]}>
                  ⚠️ {duplicateRecords.length} Duplicate Leads Found — Tap to Resolve
                </Text>
              </TouchableOpacity>
            )}
            {sheets.length > 0 && activeIncompleteRecords.length > 0 && (
              <TouchableOpacity onPress={() => setMissingContactModalOpen(true)} activeOpacity={0.7}>
                <Text style={[styles.warnText, { color: '#f59e0b', fontWeight: '900' }]}>
                  ⚠️ {activeIncompleteRecords.length} Leads Missing Phone / Email — Tap to Resolve
                </Text>
              </TouchableOpacity>
            )}
            {isReady && duplicatesResolved && <Text style={styles.readyText}>✅ Ready to import {totalDataRows} lead record{totalDataRows !== 1 ? 's' : ''}</Text>}
          </View>
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            {committedLeadsCount > 0 && (
              <TouchableOpacity
                style={styles.returnAllocBtn}
                onPress={() => setAllocationModalOpen(true)}
              >
                <Text style={styles.returnAllocBtnText}>
                  ⚡ Allocation ({committedLeadsCount}) →
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.injectBtn,
                (!isReady || (!duplicatesResolved && duplicateRecords.length > 0)) && styles.injectBtnDisabled,
                (!duplicatesResolved && duplicateRecords.length > 0) && { backgroundColor: '#1e293b', borderColor: '#f43f5e', borderWidth: 1.5 },
              ]}
              onPress={handleCommit}
              disabled={!isReady || loading || (!duplicatesResolved && duplicateRecords.length > 0)}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={[styles.injectBtnText, (!duplicatesResolved && duplicateRecords.length > 0) && { color: '#f43f5e' }]}>
                  {!duplicatesResolved && duplicateRecords.length > 0
                    ? `Resolve ${duplicateRecords.length} Duplicates First`
                    : '🚀 Confirm & Ingest Leads →'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SOURCE PLATFORM SELECTION MODAL ───────────────────────── */}
        {platformPickerOpen && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setPlatformPickerOpen(false)}>
            <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setPlatformPickerOpen(false)}>
              <View style={[styles.pickerCard, isTablet && styles.pickerCardTablet, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 16 }]} onStartShouldSetResponder={() => true}>
                <View style={styles.pickerCardHeader}>
                  <View>
                    <Text style={styles.pickerTitle}>🌐 Select Source Lead Platform</Text>
                    <Text style={styles.pickerSub}>Select the channel where this lead spreadsheet originated from</Text>
                  </View>
                  <TouchableOpacity onPress={() => setPlatformPickerOpen(false)}>
                    <Text style={{ color: '#94a3b8', fontSize: 16, fontWeight: '800' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  <View style={{ gap: 6 }}>
                    {PLATFORMS.map(p => {
                      const isSelected = selectedPlatform === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.roleCard,
                            isSelected && { backgroundColor: 'rgba(79,70,229,0.2)', borderColor: '#818cf8' },
                          ]}
                          onPress={() => {
                            setSelectedPlatform(p);
                            setPlatformPickerOpen(false);
                          }}
                        >
                          <Text style={{ fontSize: 14 }}>{isSelected ? '✅' : '📢'}</Text>
                          <Text style={[styles.roleCardText, isSelected && { color: '#818cf8', fontWeight: '900' }]}>
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* ── ROLE PICKER & CUSTOM FIELD NAMING MODAL ─────────────────── */}
        {pickerColKey && currentPickerCol && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setPickerColKey(null)}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.pickerOverlay}
            >
              <View style={[styles.pickerCard, isTablet && styles.pickerCardTablet, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 16 }]}>
                <View style={styles.pickerCardHeader}>
                  <View>
                    <Text style={styles.pickerTitle}>🎯 Map Field for COL {currentPickerCol.index + 1}</Text>
                    <Text style={styles.pickerSub}>Original Header: "{currentPickerCol.header || 'Untitled'}"</Text>
                  </View>
                  <TouchableOpacity onPress={() => setPickerColKey(null)}>
                    <Text style={{ color: '#94a3b8', fontSize: 16, fontWeight: '800' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Role List */}
                <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                  <View style={styles.roleGrid}>
                    {FIELD_ROLE_OPTIONS.map(opt => {
                      const isSelected = currentPickerCol.role === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.roleCard,
                            isSelected && { backgroundColor: opt.color + '22', borderColor: opt.color },
                          ]}
                          onPress={() => {
                            if (opt.value === 'custom') {
                              setSheets(prev => prev.map((s, i) =>
                                i !== activeIdx ? s : { ...s, columns: s.columns.map(c => c.key === pickerColKey ? { ...c, role: 'custom' } : c) }
                              ));
                            } else {
                              setColRole(pickerColKey, opt.value);
                            }
                          }}
                        >
                          <Text style={{ fontSize: 14 }}>{opt.icon}</Text>
                          <Text style={[styles.roleCardText, isSelected && { color: opt.color, fontWeight: '900' }]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Custom Name Editor (When Custom is selected) */}
                {currentPickerCol.role === 'custom' && (
                  <View style={styles.customFieldBox}>
                    <Text style={styles.customFieldLabel}>✏️ Enter Custom Field Name:</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TextInput
                        style={styles.customFieldInput}
                        value={customNameInput}
                        onChangeText={setCustomNameInput}
                        placeholder="e.g. GST Number, Requirements..."
                        placeholderTextColor="#64748b"
                        autoFocus
                      />
                      <TouchableOpacity style={styles.customSaveBtn} onPress={handleSaveCustomName}>
                        <Text style={styles.customSaveBtnText}>Save ✓</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <TouchableOpacity style={styles.pickerCloseDoneBtn} onPress={() => setPickerColKey(null)}>
                  <Text style={styles.pickerCloseDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        )}

        {/* ── DUPLICATE LEADS RESOLUTION MODAL ───────────────────────── */}
        {duplicateModalOpen && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setDuplicateModalOpen(false)}>
            <View style={styles.dupModalOverlay}>
              <View style={[styles.dupModalCard, isTablet && { maxWidth: 540 }]}>
                {/* Header */}
                <View style={styles.dupModalHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.dupModalTitle}>⚠️ Duplicate Leads Detected</Text>
                      <View style={styles.dupCountPill}>
                        <Text style={styles.dupCountPillText}>{duplicateRecords.length}</Text>
                      </View>
                    </View>
                    <Text style={styles.dupModalSub}>
                      These leads already exist in your CRM. Choose to Retarget or Filter (remove) each lead.
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.dupCloseBtn} onPress={() => setDuplicateModalOpen(false)}>
                    <Text style={styles.dupCloseBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Bulk Actions */}
                <View style={styles.dupBulkRow}>
                  <TouchableOpacity
                    style={styles.dupBulkBtnRetarget}
                    onPress={() => handleBulkSetResolution('RETARGET')}
                  >
                    <Text style={styles.dupBulkBtnText}>🎯 Mark All as Retargeting</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dupBulkBtnFilter}
                    onPress={() => handleBulkSetResolution('FILTER')}
                  >
                    <Text style={styles.dupBulkBtnText}>🚫 Filter Out All Duplicates</Text>
                  </TouchableOpacity>
                </View>

                {/* Counter Strip */}
                <View style={styles.dupCounterStrip}>
                  <Text style={styles.dupCounterText}>
                    🎯 {duplicateRecords.filter(d => d.resolution === 'RETARGET').length} Retargeting · 🚫 {duplicateRecords.filter(d => d.resolution === 'FILTER').length} Filtered
                  </Text>
                  {duplicateRecords.filter(d => d.resolution === 'UNRESOLVED').length > 0 && (
                    <Text style={styles.dupPendingText}>
                      ⚠️ {duplicateRecords.filter(d => d.resolution === 'UNRESOLVED').length} Unresolved
                    </Text>
                  )}
                </View>

                {/* List of Duplicates */}
                <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                  {duplicateRecords.map((dup) => {
                    const isRetarget = dup.resolution === 'RETARGET';
                    const isFilter = dup.resolution === 'FILTER';
                    return (
                      <View key={`${dup.sheetIndex}_${dup.rowIndex}`} style={styles.dupLeadCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.dupLeadName} numberOfLines={1}>
                            Row #{dup.rowIndex + 1}: {dup.leadName}
                          </Text>
                          <View style={styles.dupMatchBadge}>
                            <Text style={styles.dupMatchBadgeText}>MATCH: {dup.matchType}</Text>
                          </View>
                        </View>
                        <Text style={styles.dupContactText}>
                          {dup.phone ? `📞 ${dup.phone}` : ''} {dup.email ? `✉️ ${dup.email}` : ''}
                        </Text>
                        {dup.matchedExistingLead && (
                          <Text style={styles.dupMatchedPrevText}>
                            Matched CRM lead: {dup.matchedExistingLead.name || 'Unnamed'} ({dup.matchedExistingLead.phone || dup.matchedExistingLead.email})
                          </Text>
                        )}

                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                          <TouchableOpacity
                            style={[styles.dupActionBtn, isRetarget && styles.dupActionBtnRetargetActive]}
                            onPress={() => handleSetSingleResolution(dup.sheetIndex, dup.rowIndex, 'RETARGET')}
                          >
                            <Text style={[styles.dupActionBtnText, isRetarget && { color: '#ffffff', fontWeight: '900' }]}>
                              {isRetarget ? '✓ Retargeting' : 'Retarget'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.dupActionBtn, isFilter && styles.dupActionBtnFilterActive]}
                            onPress={() => handleSetSingleResolution(dup.sheetIndex, dup.rowIndex, 'FILTER')}
                          >
                            <Text style={[styles.dupActionBtnText, isFilter && { color: '#ffffff', fontWeight: '900' }]}>
                              {isFilter ? '✓ Filtered' : 'Filter Out'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Save and Apply */}
                <TouchableOpacity
                  style={[
                    styles.dupApplyBtn,
                    duplicateRecords.some(d => d.resolution === 'UNRESOLVED') && { opacity: 0.6 }
                  ]}
                  onPress={handleApplyDuplicateResolutions}
                >
                  <Text style={styles.dupApplyBtnText}>Save & Apply Resolution ✓</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* ── INCOMPLETE / MISSING CONTACT DETAILS RESOLUTION MODAL ───── */}
        {missingContactModalOpen && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setMissingContactModalOpen(false)}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.missingModalOverlay}
            >
              <View style={[styles.missingModalCard, isTablet && { maxWidth: 560 }]}>
                {/* Header */}
                <View style={styles.missingModalHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.missingModalTitle}>⚠️ Missing Contact Details</Text>
                      <View style={styles.missingCountPill}>
                        <Text style={styles.missingCountPillText}>
                          {activeIncompleteRecords.length} Active
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.missingModalSub}>
                      Leads with missing phone numbers or emails. Add details manually, remove row, or skip/keep as-is.
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.dupCloseBtn} onPress={() => setMissingContactModalOpen(false)}>
                    <Text style={styles.dupCloseBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Counters Bar */}
                <View style={styles.missingCounterGrid}>
                  <View style={styles.missingCounterBox}>
                    <Text style={styles.missingCounterBoxLabel}>Total Incomplete</Text>
                    <Text style={[styles.missingCounterBoxVal, { color: '#f59e0b' }]}>{activeIncompleteRecords.length}</Text>
                  </View>
                  <View style={styles.missingCounterBox}>
                    <Text style={styles.missingCounterBoxLabel}>No Phone</Text>
                    <Text style={[styles.missingCounterBoxVal, { color: '#fcd34d' }]}>{missingPhoneCount}</Text>
                  </View>
                  <View style={styles.missingCounterBox}>
                    <Text style={styles.missingCounterBoxLabel}>No Email</Text>
                    <Text style={[styles.missingCounterBoxVal, { color: '#fda4af' }]}>{missingEmailCount}</Text>
                  </View>
                  <View style={styles.missingCounterBox}>
                    <Text style={styles.missingCounterBoxLabel}>No Both</Text>
                    <Text style={[styles.missingCounterBoxVal, { color: '#f43f5e' }]}>{missingBothCount}</Text>
                  </View>
                </View>

                {/* Filter Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8, maxHeight: 36 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {[
                      { id: 'ALL', label: `All (${incompleteContactRecords.length})` },
                      { id: 'NO_PHONE', label: `No Phone (${missingPhoneCount})` },
                      { id: 'NO_EMAIL', label: `No Email (${missingEmailCount})` },
                      { id: 'NO_BOTH', label: `No Both (${missingBothCount})` },
                      { id: 'SKIPPED', label: `Skipped (${incompleteContactRecords.filter(r => r.isSkipped).length})` },
                    ].map(tab => {
                      const isActive = missingFilterTab === tab.id;
                      return (
                        <TouchableOpacity
                          key={tab.id}
                          style={[styles.filterChip, isActive && styles.filterChipActive]}
                          onPress={() => setMissingFilterTab(tab.id as any)}
                        >
                          <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                            {tab.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Bulk Actions */}
                <View style={styles.dupBulkRow}>
                  <TouchableOpacity
                    style={styles.bulkActionBtnDanger}
                    onPress={handleBulkRemoveIncomplete}
                    disabled={activeIncompleteRecords.length === 0}
                  >
                    <Text style={styles.dupBulkBtnText}>🚫 Remove All Incomplete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bulkActionBtnNeutral}
                    onPress={handleBulkSkipIncomplete}
                    disabled={activeIncompleteRecords.length === 0}
                  >
                    <Text style={styles.dupBulkBtnText}>⏭️ Skip All & Keep</Text>
                  </TouchableOpacity>
                </View>

                {/* Incomplete Records List */}
                <ScrollView style={{ maxHeight: 270 }} showsVerticalScrollIndicator={false}>
                  {filteredIncompleteList.length === 0 ? (
                    <View style={{ padding: 24, alignItems: 'center' }}>
                      <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '800' }}>✓ No matching incomplete leads in this view</Text>
                    </View>
                  ) : (
                    filteredIncompleteList.map(rec => {
                      const rowKey = `${rec.sheetIndex}_${rec.rowIndex}`;
                      const phoneVal = getEditingPhone(rowKey, rec.phone);
                      const emailVal = getEditingEmail(rowKey, rec.email);

                      return (
                        <View key={rowKey} style={[styles.incompleteCard, rec.isSkipped && styles.incompleteCardSkipped]}>
                          {/* Row Header */}
                          <View style={styles.incompleteCardHeader}>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={styles.rowPill}>
                                <Text style={styles.rowPillText}>R#{rec.rowIndex + 1}</Text>
                              </View>
                              <Text style={styles.incompleteLeadName} numberOfLines={1}>
                                {rec.leadName}
                              </Text>
                            </View>
                            {rec.isSkipped ? (
                              <View style={styles.skippedBadge}>
                                <Text style={styles.skippedBadgeText}>SKIPPED / KEPT</Text>
                              </View>
                            ) : null}
                          </View>

                          {/* Phone Field Box with Column Info & Manual Add */}
                          <View style={styles.fieldBox}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={styles.fieldBoxLabel}>
                                📞 {rec.phoneColLabel}
                              </Text>
                              <Text style={[styles.fieldStatusText, rec.isPhoneMissing ? { color: '#f59e0b' } : { color: '#10b981' }]}>
                                {rec.isPhoneMissing ? 'Missing Number' : 'Available'}
                              </Text>
                            </View>
                            {rec.isPhoneMissing ? (
                              <View style={{ flexDirection: 'row', gap: 6 }}>
                                <TextInput
                                  style={styles.inlineFieldInput}
                                  value={phoneVal}
                                  onChangeText={val => setFieldEdit(rowKey, 'phone', val)}
                                  placeholder="Type phone number..."
                                  placeholderTextColor="#64748b"
                                  keyboardType="phone-pad"
                                />
                                <TouchableOpacity
                                  style={[styles.inlineSaveBtn, !phoneVal.trim() && { opacity: 0.4 }]}
                                  disabled={!phoneVal.trim()}
                                  onPress={() => handleSaveMissingField(rec.sheetIndex, rec.rowIndex, 'phone', phoneVal)}
                                >
                                  <Text style={styles.inlineSaveBtnText}>Save</Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <Text style={styles.fieldExistingValue}>{rec.phone}</Text>
                            )}
                          </View>

                          {/* Email Field Box with Column Info & Manual Add */}
                          <View style={[styles.fieldBox, { marginTop: 6 }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={styles.fieldBoxLabel}>
                                ✉️ {rec.emailColLabel}
                              </Text>
                              <Text style={[styles.fieldStatusText, rec.isEmailMissing ? { color: '#f43f5e' } : { color: '#10b981' }]}>
                                {rec.isEmailMissing ? 'Missing Email' : 'Available'}
                              </Text>
                            </View>
                            {rec.isEmailMissing ? (
                              <View style={{ flexDirection: 'row', gap: 6 }}>
                                <TextInput
                                  style={styles.inlineFieldInput}
                                  value={emailVal}
                                  onChangeText={val => setFieldEdit(rowKey, 'email', val)}
                                  placeholder="Type email address..."
                                  placeholderTextColor="#64748b"
                                  keyboardType="email-address"
                                  autoCapitalize="none"
                                />
                                <TouchableOpacity
                                  style={[styles.inlineSaveBtn, !emailVal.trim() && { opacity: 0.4 }]}
                                  disabled={!emailVal.trim()}
                                  onPress={() => handleSaveMissingField(rec.sheetIndex, rec.rowIndex, 'email', emailVal)}
                                >
                                  <Text style={styles.inlineSaveBtnText}>Save</Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <Text style={styles.fieldExistingValue}>{rec.email}</Text>
                            )}
                          </View>

                          {/* Card Footer Actions: Skip vs Remove */}
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                            <TouchableOpacity
                              style={[styles.cardActionBtn, rec.isSkipped ? styles.cardActionBtnUnskip : styles.cardActionBtnSkip]}
                              onPress={() => handleToggleSkipRow(rec.sheetIndex, rec.rowIndex)}
                            >
                              <Text style={styles.cardActionBtnText}>
                                {rec.isSkipped ? '↩️ Unskip Row' : '⏭️ Skip & Keep'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.cardActionBtn, styles.cardActionBtnRemove]}
                              onPress={() => handleRemoveIncompleteRow(rec.sheetIndex, rec.rowIndex)}
                            >
                              <Text style={[styles.cardActionBtnText, { color: '#fca5a5' }]}>
                                🗑️ Remove Row
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                {/* Done Button */}
                <TouchableOpacity
                  style={styles.missingDoneBtn}
                  onPress={() => setMissingContactModalOpen(false)}
                >
                  <Text style={styles.missingDoneBtnText}>Done / Return to Import Grid ✓</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        )}

        {/* ── POST-IMPORT LEAD ALLOCATION MODAL (PARITY WITH WEB) ──────── */}
        {allocationModalOpen && (
          <LeadAllocationEngineModal
            visible={allocationModalOpen}
            onClose={() => {
              setAllocationModalOpen(false);
              handleClose();
            }}
            totalLeadsCount={committedLeadsCount || totalDataRows}
            fileName={fileName || inputFileName}
            sourceType="EXCEL_CSV"
            onPreviewSheet={() => {
              // Return user immediately to the previous interactive spreadsheet grid!
              setAllocationModalOpen(false);
            }}
          />
        )}

      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const rowStyle = StyleSheet.create({
  row:        { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#1e293b', minHeight: ROW_H, alignItems: 'stretch', backgroundColor: '#090d16' },
  rowAlt:     { backgroundColor: '#0b1120' },
  rowBlocked: { backgroundColor: '#1e1111', opacity: 0.7 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingVertical: 10 },
  headerLeft:  { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  headerSub:   { fontSize: 10, color: '#64748b', marginTop: 2 },
  formatBadge: { backgroundColor: 'rgba(14,165,233,0.2)', borderWidth: 1, borderColor: '#0ea5e9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  formatBadgeText: { fontSize: 9, fontWeight: '900', color: '#38bdf8' },
  closeBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '900' },

  // Upload Bar & Metadata
  uploadBar:       { backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingVertical: 10 },
  pickBtn:         { backgroundColor: '#4f46e5', paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  pickBtnTablet:   { paddingVertical: 13, borderRadius: 14 },
  pickBtnText:     { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  
  metaRow:         { gap: 8 },
  metaRowTablet:   { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  metaFieldBlock:  { marginBottom: 4 },
  metaLabel:       { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 },
  metaInput:       { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: '#ffffff', fontSize: 12, fontWeight: '700' },
  metaInputTablet: { fontSize: 13, paddingVertical: 9 },

  // Platform Dropdown & Chips
  platformDropdownPill: { backgroundColor: '#020617', borderWidth: 1.5, borderColor: '#4f46e5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  platformDropdownPillWarning: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)' },
  platformDropdownText: { fontSize: 12, fontWeight: '800', color: '#ffffff', flex: 1, marginRight: 6 },

  platformRow:     { flexDirection: 'row', gap: 6 },
  platformChip:    { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  platformChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  platformChipText:    { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  platformChipTextActive: { color: '#ffffff' },

  // Analytics
  analyticsRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#020617', borderRadius: 12, paddingVertical: 8, marginTop: 8, borderWidth: 1, borderColor: '#1e293b' },
  analyticsRowTablet: { marginTop: 10, paddingVertical: 10, borderRadius: 14 },
  analyticItem:       { alignItems: 'center', flex: 1 },
  analyticValue:      { fontSize: 15, fontWeight: '900', color: '#38bdf8' },
  analyticLabel:      { fontSize: 9, color: '#64748b', fontWeight: '700', marginTop: 1 },
  analyticDivider:    { width: 1, height: 26, backgroundColor: '#1e293b' },

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
  sheetBlockBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  sheetBlockBtnText: { fontSize: 14 },

  // Grid Container
  gridContainer: { flex: 1, backgroundColor: '#030712' },
  gridInner:     { flex: 1 },
  emptyState:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon:     { fontSize: 48, marginBottom: 10 },
  emptyTitle:    { fontSize: 16, fontWeight: '900', color: '#ffffff', marginBottom: 4 },
  emptySub:      { fontSize: 12, color: '#64748b', textAlign: 'center', paddingHorizontal: 20 },

  // Column Header Row (Web-Inspired)
  headerRow:    { flexDirection: 'row', alignItems: 'stretch', backgroundColor: '#0b1329', borderBottomWidth: 2, borderBottomColor: '#1e293b' },
  rowNumCorner: { width: ROW_CTRL_W, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: '#1e293b', backgroundColor: '#0b1329', paddingHorizontal: 4 },
  cornerLabel:  { fontSize: 9, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },

  // Web Column Header Cell
  colHeader:       { backgroundColor: '#0b1329', borderRightWidth: 1, borderBottomWidth: 2, borderColor: '#1e293b', paddingVertical: 8, paddingHorizontal: 6, justifyContent: 'space-between' },
  colHeaderTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  colIndexLabel:   { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 0.5 },
  colIndexLabelBlocked: { color: '#ef4444', textDecorationLine: 'line-through' },
  webBlockBtn:     { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  webBlockBtnActive: { backgroundColor: '#065f46', borderColor: '#34d399' },
  webBlockBtnText:   { fontSize: 9, fontWeight: '800', color: '#f87171' },
  webBlockBtnTextActive: { color: '#34d399' },

  // Web Dropdown Pill Selector
  roleDropdownPill: { backgroundColor: '#020617', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  roleDropdownPillBlocked: { backgroundColor: '#1e293b', opacity: 0.6 },
  roleDropdownText: { fontSize: 11, fontWeight: '800', flex: 1, marginRight: 4 },

  // Action Bar
  colActionRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  colCtrlBtn:      { width: 24, height: 24, borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  colCtrlBtnWidth: { flex: 1, height: 24, width: undefined, paddingHorizontal: 6 },
  colCtrlBtnText:  { fontSize: 11, fontWeight: '800', color: '#94a3b8' },
  colCtrlBtnTextDisabled: { color: '#334155' },

  // Body List
  rowList: { flex: 1 },

  // Footer
  footer:        { backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 10 },
  validationRow: { marginBottom: 8 },
  warnText:      { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
  readyText:      { fontSize: 11, fontWeight: '700', color: '#34d399' },
  footerActions: { flexDirection: 'row', gap: 8 },
  cancelBtn:     { flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
  injectBtn:     { flex: 2, backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  injectBtnDisabled: { opacity: 0.4 },
  injectBtnText:     { color: '#ffffff', fontSize: 13, fontWeight: '900' },

  // Role / Platform Picker Sheet Modal
  pickerOverlay:    { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'flex-end', alignItems: 'center' },
  pickerCard:       { width: '100%', backgroundColor: '#0f172a', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: '#1e293b', padding: 18 },
  pickerCardTablet: { maxWidth: 480, borderRadius: 20, alignSelf: 'center', marginBottom: 40 },
  pickerCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  pickerTitle:      { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  pickerSub:        { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  roleGrid:         { gap: 6 },
  roleCard:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  roleCardText:     { fontSize: 12, color: '#cbd5e1', fontWeight: '700' },

  customFieldBox:   { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 12, marginTop: 10 },
  customFieldLabel: { fontSize: 11, fontWeight: '800', color: '#818cf8', marginBottom: 6 },
  customFieldInput: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, color: '#ffffff', fontSize: 12, fontWeight: '700' },
  customSaveBtn:    { backgroundColor: '#4f46e5', paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  customSaveBtnText:{ color: '#ffffff', fontSize: 12, fontWeight: '900' },

  pickerCloseDoneBtn: { backgroundColor: '#1e293b', paddingVertical: 11, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  pickerCloseDoneBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },

  // ⚠️ Duplicate Resolution Modal Styles
  dupBadgeBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginTop: 10, alignItems: 'center', borderWidth: 1.5 },
  dupBadgeBtnAlert: { backgroundColor: 'rgba(244,63,94,0.2)', borderColor: '#f43f5e' },
  dupBadgeBtnResolved: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10b981' },
  dupBadgeBtnText: { fontSize: 11, fontWeight: '900' },

  dupModalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.9)', justifyContent: 'center', alignItems: 'center', padding: 14 },
  dupModalCard: { width: '100%', maxWidth: 460, backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 2, borderColor: '#f43f5e', padding: 16 },
  dupModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 10 },
  dupModalTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  dupCountPill: { backgroundColor: 'rgba(244,63,94,0.25)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: '#f43f5e' },
  dupCountPillText: { fontSize: 10, fontWeight: '900', color: '#fda4af' },
  dupModalSub: { fontSize: 10, color: '#94a3b8', marginTop: 3, lineHeight: 14 },
  dupCloseBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  dupCloseBtnText: { color: '#cbd5e1', fontSize: 14, fontWeight: '800' },

  dupBulkRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  dupBulkBtnRetarget: { flex: 1, backgroundColor: 'rgba(99,102,241,0.25)', borderWidth: 1, borderColor: '#6366f1', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  dupBulkBtnFilter: { flex: 1, backgroundColor: 'rgba(244,63,94,0.2)', borderWidth: 1, borderColor: '#f43f5e', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  dupBulkBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },

  dupCounterStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#020617', padding: 8, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#1e293b' },
  dupCounterText: { fontSize: 10, fontWeight: '800', color: '#cbd5e1' },
  dupPendingText: { fontSize: 10, fontWeight: '900', color: '#f59e0b' },

  dupLeadCard: { backgroundColor: '#020617', borderRadius: 10, borderWidth: 1, borderColor: '#334155', padding: 10, marginBottom: 6 },
  dupLeadName: { fontSize: 12, fontWeight: '900', color: '#ffffff', flex: 1 },
  dupMatchBadge: { backgroundColor: 'rgba(245,158,11,0.2)', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  dupMatchBadgeText: { fontSize: 8, fontWeight: '900', color: '#fbbf24' },
  dupContactText: { fontSize: 10, color: '#94a3b8', marginTop: 3 },
  dupMatchedPrevText: { fontSize: 9, color: '#818cf8', fontWeight: '700', marginTop: 2 },

  dupActionBtn: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', paddingVertical: 7, borderRadius: 6, alignItems: 'center' },
  dupActionBtnRetargetActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  dupActionBtnFilterActive: { backgroundColor: '#dc2626', borderColor: '#f87171' },
  dupActionBtnText: { fontSize: 10, fontWeight: '800', color: '#cbd5e1' },

  dupApplyBtn: { backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  dupApplyBtnText: { color: '#020617', fontSize: 12, fontWeight: '900' },

  // ⚠️ Missing Contact Details Sanitation Styles
  missingBadgeBtn: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: '#f59e0b', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginTop: 4, alignItems: 'center', borderWidth: 1.5 },
  missingBadgeBtnAlert: { backgroundColor: 'rgba(245,158,11,0.2)', borderColor: '#f59e0b' },
  missingBadgeBtnResolved: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10b981' },
  missingBadgeBtnText: { fontSize: 11, fontWeight: '900', color: '#fcd34d' },

  missingModalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.92)', justifyContent: 'center', alignItems: 'center', padding: 14 },
  missingModalCard: { width: '100%', maxWidth: 480, backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 2, borderColor: '#f59e0b', padding: 16 },
  missingModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 8 },
  missingModalTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  missingCountPill: { backgroundColor: 'rgba(245,158,11,0.25)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: '#f59e0b' },
  missingCountPillText: { fontSize: 10, fontWeight: '900', color: '#fef08a' },
  missingModalSub: { fontSize: 10, color: '#94a3b8', marginTop: 3, lineHeight: 14 },

  missingCounterGrid: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  missingCounterBox: { flex: 1, backgroundColor: '#020617', paddingVertical: 6, paddingHorizontal: 4, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  missingCounterBoxLabel: { fontSize: 8, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  missingCounterBoxVal: { fontSize: 13, fontWeight: '900', marginTop: 2 },

  filterChip: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  filterChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  filterChipText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  filterChipTextActive: { color: '#ffffff', fontWeight: '900' },

  bulkActionBtnDanger: { flex: 1, backgroundColor: 'rgba(244,63,94,0.2)', borderWidth: 1, borderColor: '#f43f5e', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  bulkActionBtnNeutral: { flex: 1, backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: '#6366f1', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },

  incompleteCard: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 12, marginBottom: 8 },
  incompleteCardSkipped: { borderColor: '#475569', opacity: 0.75 },
  incompleteCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rowPill: { backgroundColor: '#1e293b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  rowPillText: { fontSize: 9, fontWeight: '900', color: '#cbd5e1' },
  incompleteLeadName: { fontSize: 12, fontWeight: '900', color: '#ffffff', flex: 1 },
  skippedBadge: { backgroundColor: 'rgba(100,116,139,0.2)', borderWidth: 1, borderColor: '#64748b', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  skippedBadgeText: { fontSize: 8, fontWeight: '900', color: '#94a3b8' },

  fieldBox: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', padding: 8 },
  fieldBoxLabel: { fontSize: 9, fontWeight: '800', color: '#cbd5e1' },
  fieldStatusText: { fontSize: 8, fontWeight: '900' },
  inlineFieldInput: { flex: 1, backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, color: '#ffffff', fontSize: 11, fontWeight: '700' },
  inlineSaveBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  inlineSaveBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  fieldExistingValue: { color: '#6ee7b7', fontSize: 11, fontWeight: '700' },

  cardActionBtn: { flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: 'center', borderWidth: 1 },
  cardActionBtnSkip: { backgroundColor: '#0f172a', borderColor: '#334155' },
  cardActionBtnUnskip: { backgroundColor: 'rgba(99,102,241,0.25)', borderColor: '#818cf8' },
  cardActionBtnRemove: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' },
  cardActionBtnText: { fontSize: 10, fontWeight: '800', color: '#cbd5e1' },

  missingDoneBtn: { backgroundColor: '#f59e0b', paddingVertical: 11, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  missingDoneBtnText: { color: '#020617', fontSize: 12, fontWeight: '900' },

  returnAllocBtn: { backgroundColor: 'rgba(79,70,229,0.25)', borderWidth: 1.5, borderColor: '#818cf8', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  returnAllocBtnText: { color: '#a5b4fc', fontSize: 11, fontWeight: '900' },
});
