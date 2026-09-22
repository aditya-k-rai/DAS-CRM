'use client';

import React, { useState, useRef, useCallback, memo, useMemo } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import * as XLSX from 'xlsx';
import {
  Upload, FileSpreadsheet, X, Plus, Sliders,
  Layers, CheckCircle, Ban, Eye, Type, AlertCircle,
  Cloud, CloudUpload, Zap, Folder, Check, Clock, RefreshCw,
  AlertTriangle, Target, Filter, Phone, Mail, User, ShieldAlert,
  Save, FastForward, UserX
} from 'lucide-react';

import { LeadAllocationModal } from './LeadAllocationModal';
import {
  uploadFileToGoogleDrive,
  uploadLeadSpreadsheetToDrive,
  formatTimestampedFileName,
  GoogleDriveUploadProgress,
} from '../../lib/googleDriveService';

export interface FileImportEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportLeads: (leads: any[], fileAuditRecord: { filename: string; fileSize: string; platform: string; count: number; date: string }) => void;
}

export interface ParsedSheet {
  name: string;
  isBlocked?: boolean;
  order: number;
  data: string[][]; // Row-major cell matrix [row][col]
  columnMappings: string[]; // Field role per column
  blockedColumns: boolean[];
  rowMappings: string[]; // Field role per row
  blockedRows: boolean[];
  columnWidths: number[];
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

const FIELD_OPTIONS = [
  { value: 'name', label: 'Name (Lead / Contact)' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'company', label: 'Company Name' },
  { value: 'value', label: 'Lead Value (₹ Numeric)' },
  { value: 'city', label: 'City / Location' },
  { value: 'budget', label: 'Budget Range' },
  { value: 'custom', label: 'Custom Field' },
  { value: 'block', label: '🚫 Block Column' },
];

// ─── Virtualized Grid Helpers ─────────────────────────────────────────────────

interface VirtualizedGridProps {
  activeSheet: ParsedSheet;
  toggleBlockColumn: (cIdx: number) => void;
  updateColumnMapping: (cIdx: number, value: string) => void;
  handleMouseDownResize: (e: React.MouseEvent, cIdx: number) => void;
  shiftRowUp: (rIdx: number) => void;
  shiftRowDown: (rIdx: number) => void;
  toggleBlockRow: (rIdx: number) => void;
  updateCell: (rIdx: number, cIdx: number, value: string) => void;
}

interface GridRowProps {
  rIdx: number;
  row: string[];
  isRowBlocked: boolean;
  isHeaderRow: boolean;
  rowCount: number;
  columnWidths: number[];
  blockedColumns: boolean[];
  shiftRowUp: (rIdx: number) => void;
  shiftRowDown: (rIdx: number) => void;
  toggleBlockRow: (rIdx: number) => void;
  updateCell: (rIdx: number, cIdx: number, value: string) => void;
}

const ROW_HEIGHT = 40; // px – fixed row height for the virtual list

/**
 * Memoized individual row renderer. Only re-renders when its own data changes,
 * preventing the "all rows re-render on every keystroke" problem.
 */
const GridRow = memo(({
  rIdx, row, isRowBlocked, isHeaderRow, rowCount,
  columnWidths, blockedColumns,
  shiftRowUp, shiftRowDown, toggleBlockRow, updateCell,
}: GridRowProps) => {
  return (
    <div
      style={{ display: 'flex', height: ROW_HEIGHT, borderBottom: '1px solid rgba(71,85,105,0.6)' }}
      className={
        isRowBlocked
          ? 'bg-rose-950/30 opacity-60'
          : isHeaderRow
          ? 'bg-indigo-700/40 border-b-2 border-indigo-500/60'
          : rIdx % 2 === 0
          ? 'bg-slate-900'
          : 'bg-slate-950'
      }
    >
      {/* Row Controls Cell */}
      <div
        style={{ width: 80, minWidth: 80 }}
        className="flex flex-col items-center justify-center gap-0.5 border-r-2 border-slate-600/60 bg-slate-900/80 select-none shrink-0"
      >
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => shiftRowUp(rIdx)}
            disabled={rIdx === 0}
            title="Shift Row Up"
            className="p-0.5 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200 disabled:opacity-20 text-[9px] font-bold leading-none"
          >▲</button>
          <button
            onClick={() => shiftRowDown(rIdx)}
            disabled={rIdx === rowCount - 1}
            title="Shift Row Down"
            className="p-0.5 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200 disabled:opacity-20 text-[9px] font-bold leading-none"
          >▼</button>
          <button
            onClick={() => toggleBlockRow(rIdx)}
            title={isRowBlocked ? 'Unblock Row' : 'Block Row'}
            className={`p-0.5 rounded text-[9px] font-bold ${isRowBlocked ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-500/20 text-rose-300'}`}
          >
            {isRowBlocked ? '👁️' : '🚫'}
          </button>
        </div>
        <span className={`text-[9px] font-black block ${isHeaderRow ? 'text-indigo-300' : 'text-slate-400'}`}>#{rIdx + 1}</span>
      </div>

      {/* Editable Data Cells */}
      {row.map((cellVal, cIdx) => {
        const isColBlocked = blockedColumns[cIdx];
        const w = columnWidths[cIdx] || 160;
        return (
          <div
            key={cIdx}
            style={{ width: w, minWidth: w, maxWidth: w }}
            className={`flex items-center border-r border-slate-600/50 last:border-0 shrink-0 ${
              isColBlocked || isRowBlocked ? 'bg-slate-950' : ''
            }`}
          >
            <input
              defaultValue={cellVal}
              onBlur={e => updateCell(rIdx, cIdx, e.target.value)}
              disabled={isColBlocked || isRowBlocked}
              className={`w-full bg-transparent border-0 px-2 py-1 text-xs rounded focus:bg-slate-800 focus:ring-1 focus:ring-indigo-400 outline-none truncate ${
                isHeaderRow ? 'font-black text-indigo-200' : 'font-medium text-slate-100'
              } ${isColBlocked || isRowBlocked ? 'line-through text-slate-600' : ''}`}
            />
          </div>
        );
      })}
    </div>
  );
});
GridRow.displayName = 'GridRow';

const CHUNK_SIZE = 500;       // rows per batch
const PRELOAD_THRESHOLD = 100; // expand when this many rows remain in current chunk

/**
 * VirtualizedGrid — 500-row chunked rendering strategy.
 *
 * Instead of loading all N rows at once, it starts with the first 500 rows
 * and tracks `renderLimit` (the number of rows currently active in the list).
 * When the user scrolls to within PRELOAD_THRESHOLD rows of the limit,
 * the next chunk of 500 is unlocked seamlessly — giving both smooth scrolling
 * AND low initial memory/paint cost.
 *
 * The sticky column-mapping header is a flex div (not a table) for exact
 * pixel-width alignment with the virtual row body.
 */
const VirtualizedGrid: React.FC<VirtualizedGridProps> = ({
  activeSheet, toggleBlockColumn, updateColumnMapping,
  handleMouseDownResize, shiftRowUp, shiftRowDown, toggleBlockRow, updateCell,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<FixedSizeList>(null);

  const totalRows = activeSheet.data.length;

  // How many rows are currently unlocked for the list to render.
  // Starts at CHUNK_SIZE and grows in CHUNK_SIZE increments as the user scrolls.
  const [renderLimit, setRenderLimit] = useState(() => Math.min(CHUNK_SIZE, totalRows));

  // Reset chunk window whenever the active sheet changes (different tab / new file)
  React.useEffect(() => {
    setRenderLimit(Math.min(CHUNK_SIZE, totalRows));
    listRef.current?.scrollTo(0); // jump back to top on sheet switch
  }, [activeSheet.name, totalRows]);

  // Fired by react-window on every scroll / layout tick.
  // When the last overscan row is within PRELOAD_THRESHOLD of the current limit,
  // expand by another CHUNK_SIZE — capped at totalRows.
  const handleItemsRendered = useCallback(
    ({ overscanStopIndex }: { overscanStopIndex: number }) => {
      if (overscanStopIndex >= renderLimit - PRELOAD_THRESHOLD && renderLimit < totalRows) {
        setRenderLimit(prev => Math.min(prev + CHUNK_SIZE, totalRows));
      }
    },
    [renderLimit, totalRows]
  );

  // Total pixel width of the grid (controls col + all data cols)
  const totalWidth = 80 + activeSheet.columnWidths.reduce((s, w) => s + (w || 160), 0);

  // Memoized per-row renderer — receives only the row index from react-window
  const RowRenderer = useCallback(({ index, style }: ListChildComponentProps) => {
    const row = activeSheet.data[index];
    const isRowBlocked = activeSheet.blockedRows[index];
    const isHeaderRow = index === 0 && activeSheet.rowMappings[0] === 'header';
    return (
      <div style={style}>
        <GridRow
          rIdx={index}
          row={row}
          isRowBlocked={isRowBlocked}
          isHeaderRow={isHeaderRow}
          rowCount={totalRows}
          columnWidths={activeSheet.columnWidths}
          blockedColumns={activeSheet.blockedColumns}
          shiftRowUp={shiftRowUp}
          shiftRowDown={shiftRowDown}
          toggleBlockRow={toggleBlockRow}
          updateCell={updateCell}
        />
      </div>
    );
  }, [activeSheet, totalRows, shiftRowUp, shiftRowDown, toggleBlockRow, updateCell]);

  const loadPercent = Math.round((renderLimit / totalRows) * 100);
  const isFullyLoaded = renderLimit >= totalRows;

  return (
    <div className="flex-1 overflow-hidden rounded-xl border border-border/80 shadow-2xl flex flex-col bg-slate-950" ref={containerRef}>

      {/* ── Single Unified Horizontal Scroll Engine (Syncs Header & Data Body) ── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-950 flex flex-col">
        <div style={{ width: totalWidth, minWidth: '100%' }} className="flex flex-col shrink-0">

          {/* ── Column-Mapping Header ───────────────────────────────── */}
          <div className="shrink-0 bg-slate-900 border-b-2 border-slate-700 select-none flex">
            {/* Row Controls column header */}
            <div
              style={{ width: 80, minWidth: 80 }}
              className="px-2 py-3 text-center border-r-2 border-slate-600 font-black text-[10px] text-slate-300 uppercase tracking-widest shrink-0 bg-slate-800"
            >
              # Controls
            </div>

            {activeSheet.data[0]?.map((_, cIdx) => {
              const w = activeSheet.columnWidths[cIdx] || 160;
              const isBlocked = activeSheet.blockedColumns[cIdx];
              return (
                <div
                  key={cIdx}
                  style={{ width: w, minWidth: w }}
                  className={`p-2 border-r border-slate-600/70 last:border-0 relative group shrink-0 ${
                    isBlocked ? 'bg-rose-950/50' : 'bg-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">
                        Col {cIdx + 1}
                      </span>
                      <button
                        onClick={() => toggleBlockColumn(cIdx)}
                        title={isBlocked ? 'Unblock Column' : 'Block Column'}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                          isBlocked
                            ? 'bg-emerald-500/25 text-emerald-200 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {isBlocked ? '👁 On' : '🚫 Off'}
                      </button>
                    </div>
                    <select
                      value={activeSheet.columnMappings[cIdx] || 'custom'}
                      onChange={e => updateColumnMapping(cIdx, e.target.value)}
                      disabled={isBlocked}
                      style={{ backgroundColor: '#090d16', color: '#c7d2fe', colorScheme: 'dark', borderColor: '#334155' }}
                      className="w-full text-[10px] font-extrabold bg-[#090d16] text-indigo-200 py-1 px-1.5 rounded-lg border border-slate-700 outline-none"
                    >
                      {FIELD_OPTIONS.map(opt => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-slate-900 text-slate-100 font-semibold"
                          style={{ backgroundColor: '#090d16', color: '#f8fafc' }}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Drag-to-resize handle */}
                  <div
                    onMouseDown={e => handleMouseDownResize(e, cIdx)}
                    title="Drag to resize column"
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-20 hover:bg-cyan-400/60 flex items-center justify-center transition-colors"
                  >
                    <div className="w-[2px] h-full bg-slate-600 group-hover:bg-cyan-300" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Chunk-Loaded Virtual Row Body — always shows exactly 10 rows ── */}
          <div className="shrink-0" style={{ background: 'rgb(2 6 23)', height: 10 * ROW_HEIGHT }}>
            <FixedSizeList
              ref={listRef}
              height={10 * ROW_HEIGHT}           /* exactly 10 rows visible at all times */
              itemCount={renderLimit}            /* currently unlocked chunk */
              itemSize={ROW_HEIGHT}
              width={totalWidth}
              overscanCount={20}                 /* pre-paint 20 rows above+below viewport */
              onItemsRendered={handleItemsRendered}
              style={{ willChange: 'transform', overflowX: 'hidden' }}
            >
              {RowRenderer}
            </FixedSizeList>
          </div>

        </div>
      </div>

      {/* ── Status Bar ─────────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 py-1.5 bg-slate-950 border-t border-slate-700/60 flex items-center justify-between gap-3">
        {/* Left: counts */}
        <span className="text-[10px] text-slate-400 font-bold">
          {renderLimit.toLocaleString()} / {totalRows.toLocaleString()} rows loaded
          &nbsp;·&nbsp;{(activeSheet.data[0]?.length || 0)} cols
        </span>

        {/* Centre: mini progress bar */}
        <div className="flex-1 max-w-xs h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFullyLoaded
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400'
            }`}
            style={{ width: `${loadPercent}%` }}
          />
        </div>

        {/* Right: label */}
        <span className={`text-[10px] font-bold ${isFullyLoaded ? 'text-emerald-400' : 'text-indigo-300'}`}>
          {isFullyLoaded
            ? '✅ All rows loaded'
            : `⚡ ${loadPercent}% — scroll to load more`}
        </span>
      </div>
    </div>
  );
};

export const FileImportEngineModal: React.FC<FileImportEngineModalProps> = ({
  isOpen,
  onClose,
  onImportLeads,
}) => {
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('');

  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);

  // Google Drive Cloud Upload Telemetry State
  const [selectedFileBlob, setSelectedFileBlob] = useState<File | null>(null);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [driveProgress, setDriveProgress] = useState<GoogleDriveUploadProgress | null>(null);
  const [isDriveUploaded, setIsDriveUploaded] = useState(false);

  // 🔍 Duplicate Leads Detection & Retargeting Resolution State
  const [duplicateRecords, setDuplicateRecords] = useState<DuplicateLeadRecord[]>([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicatesResolved, setDuplicatesResolved] = useState(true);
  const previousLeadsRef = useRef<any[]>(DEFAULT_PREVIOUS_LEADS);

  // ⚠️ Missing Contact Info (No Phone / No Email) Sanitation State
  const [isMissingContactModalOpen, setIsMissingContactModalOpen] = useState(false);
  const [skippedRowKeys, setSkippedRowKeys] = useState<Set<string>>(new Set());
  const [missingFilterTab, setMissingFilterTab] = useState<'ALL' | 'NO_PHONE' | 'NO_EMAIL' | 'NO_BOTH' | 'SKIPPED'>('ALL');
  const [editingValues, setEditingValues] = useState<Record<string, { phone?: string; email?: string }>>({});

  // Memoized Incomplete Contacts Scanner
  const incompleteContactRecords: IncompleteContactRecord[] = useMemo(() => {
    const list: IncompleteContactRecord[] = [];
    sheets.forEach((sheet, sIdx) => {
      if (sheet.isBlocked) return;

      const phoneColIdx = sheet.columnMappings.findIndex(m => m === 'phone');
      const emailColIdx = sheet.columnMappings.findIndex(m => m === 'email');
      const nameColIdx = sheet.columnMappings.findIndex(m => m === 'name');

      if (phoneColIdx < 0 && emailColIdx < 0) return;

      sheet.data.forEach((row, rIdx) => {
        if (rIdx === 0 && sheet.rowMappings[0] === 'header') return;
        if (sheet.blockedRows[rIdx]) return;

        const phone = phoneColIdx >= 0 ? (row[phoneColIdx] || '').trim() : '';
        const email = emailColIdx >= 0 ? (row[emailColIdx] || '').trim() : '';
        const name = nameColIdx >= 0 && row[nameColIdx]?.trim() ? row[nameColIdx].trim() : `Row #${rIdx + 1}`;

        const isPhoneMissing = phoneColIdx >= 0 && !phone;
        const isEmailMissing = emailColIdx >= 0 && !email;

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
            phoneColIndex: phoneColIdx,
            emailColIndex: emailColIdx,
            phoneColLabel: phoneColIdx >= 0 ? `COL ${phoneColIdx + 1} (Phone Number)` : 'Phone (Not Mapped)',
            emailColLabel: emailColIdx >= 0 ? `COL ${emailColIdx + 1} (Email Address)` : 'Email (Not Mapped)',
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
      const colIdx = s.columnMappings.findIndex(m => m === field);
      if (colIdx < 0) return s;
      const copyData = s.data.map((r, i) => i === rIdx ? [...r] : r);
      copyData[rIdx][colIdx] = val.trim();
      return { ...s, data: copyData };
    }));
  };

  const handleToggleSkipRow = (sIdx: number, rIdx: number) => {
    const key = `${sIdx}_${rIdx}`;
    setSkippedRowKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
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
      return true; // 'ALL'
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

      const phoneColIdx = sheet.columnMappings.findIndex(m => m === 'phone');
      const emailColIdx = sheet.columnMappings.findIndex(m => m === 'email');
      const nameColIdx = sheet.columnMappings.findIndex(m => m === 'name');

      sheet.data.forEach((row, rIdx) => {
        if (rIdx === 0 && sheet.rowMappings[0] === 'header') return;
        if (sheet.blockedRows[rIdx]) return;

        const phone = phoneColIdx >= 0 ? (row[phoneColIdx] || '').trim() : '';
        const email = emailColIdx >= 0 ? (row[emailColIdx] || '').trim().toLowerCase() : '';
        const name = nameColIdx >= 0 ? (row[nameColIdx] || '').trim() : `Row #${rIdx + 1}`;

        if (!phone && !email) return;

        let matchedPrev: any = null;
        let matchType: 'PHONE' | 'EMAIL' | 'BOTH' | null = null;

        // Compare against previous database leads
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

        // Compare within same file (intra-file duplicates)
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
            leadName: name || `Lead #${rIdx}`,
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
  React.useEffect(() => {
    if (!isOpen) return;
    const fetchExisting = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('http://localhost:4000/api/leads?limit=500', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const items = data.data || data.leads || data || [];
          if (Array.isArray(items) && items.length > 0) {
            const mapped = items.map((l: any) => ({
              id: l.id,
              name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.name || 'CRM Lead',
              phone: l.phone || '',
              email: l.email || '',
              createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Previously',
            }));
            previousLeadsRef.current = [...DEFAULT_PREVIOUS_LEADS, ...mapped];
          }
        }
      } catch (_) {}
    };
    fetchExisting();
  }, [isOpen]);

  const handleSetSingleResolution = (sheetIndex: number, rowIndex: number, resolution: 'RETARGET' | 'FILTER') => {
    setDuplicateRecords(prev =>
      prev.map(d => (d.sheetIndex === sheetIndex && d.rowIndex === rowIndex ? { ...d, resolution } : d))
    );
  };

  const handleBulkSetResolution = (resolution: 'RETARGET' | 'FILTER') => {
    setDuplicateRecords(prev => prev.map(d => ({ ...d, resolution })));
  };

  const handleApplyDuplicateResolutions = () => {
    // Exclude filtered rows from active sheet data by setting blockedRows
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
    setIsDuplicateModalOpen(false);
  };

  const [resizingColIdx, setResizingColIdx] = useState<number | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // File Drop / Selection Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileBlob(file);
    setIsDriveUploaded(false);
    setDriveProgress(null);

    const rawExt = file.name.split('.').pop()?.toUpperCase() || 'FILE';
    setDetectedFormat(rawExt);
    setFileName(file.name.replace(/\.[^/.]+$/, ''));
    const formattedSize = file.size >= 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(1) + ' KB';
    setFileSize(formattedSize);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });

        const parsedSheets: ParsedSheet[] = workbook.SheetNames.map((sheetName, idx) => {
          const ws = workbook.Sheets[sheetName];
          const rawMatrix: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];

          // Determine max columns
          let maxCols = 0;
          rawMatrix.forEach(row => {
            if (row.length > maxCols) maxCols = row.length;
          });
          if (maxCols === 0) maxCols = 5;

          // Pad all rows to maxCols
          const normalizedMatrix = rawMatrix.map(row => {
            const copy = [...row].map(val => String(val ?? '').trim());
            while (copy.length < maxCols) copy.push('');
            return copy;
          });

          // If empty, add default headers
          if (normalizedMatrix.length === 0) {
            normalizedMatrix.push(['Name', 'Email', 'Phone', 'Company', 'Value']);
          }

          const firstRow = normalizedMatrix[0] || [];

          // Infer column mappings
          const colMappings = firstRow.map(h => inferFieldRole(h));
          const blockedCols = new Array(maxCols).fill(false);
          const rowMappings = new Array(normalizedMatrix.length).fill('data');
          rowMappings[0] = 'header';
          const blockedRows = new Array(normalizedMatrix.length).fill(false);
          const colWidths = new Array(maxCols).fill(160);

          return {
            name: sheetName,
            isBlocked: false,
            order: idx,
            data: normalizedMatrix,
            columnMappings: colMappings,
            blockedColumns: blockedCols,
            rowMappings,
            blockedRows,
            columnWidths: colWidths,
          };
        });

        setSheets(parsedSheets);
        setActiveSheetIndex(0);
        runDeduplicationScan(parsedSheets);
      } catch (err) {
        alert('Error parsing spreadsheet file: ' + (err as Error).message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Helper to infer column field role based on header string
  const inferFieldRole = (headerStr: string): string => {
    const h = (headerStr || '').toLowerCase();
    if (h.includes('name') || h.includes('client') || h.includes('contact')) return 'name';
    if (h.includes('email') || h.includes('mail')) return 'email';
    if (h.includes('phone') || h.includes('mobile') || h.includes('tel')) return 'phone';
    if (h.includes('company') || h.includes('org') || h.includes('business')) return 'company';
    if (h.includes('value') || h.includes('budget') || h.includes('coin') || h.includes('amount') || h.includes('price')) return 'value';
    if (h.includes('city') || h.includes('location')) return 'city';
    return 'custom';
  };

  // Decimal & Formatting Sanitization Engine
  const sanitizeNumericValue = (valStr: string): number => {
    if (!valStr) return 0;
    // Strip non-numeric characters except decimals
    let clean = valStr.replace(/[^0-9.]/g, '');
    if (!clean) return 0;

    // Handle multiple decimal dots anomaly (e.g. 4.5000.0 -> 45000)
    const parts = clean.split('.');
    if (parts.length > 2) {
      clean = parts.join(''); // Merge all decimal points
    }
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const sanitizePhoneValue = (valStr: string): string => {
    if (!valStr) return '';
    let clean = valStr.replace(/[^0-9+]/g, '');
    if (!clean.startsWith('+') && clean.length === 10) {
      clean = '+91 ' + clean;
    }
    return clean || valStr;
  };

  // Active Sheet Helper Controls
  const activeSheet = sheets[activeSheetIndex];

  const updateCell = (rIdx: number, cIdx: number, val: string) => {
    if (!activeSheet) return;
    setSheets(prev => prev.map((s, sIdx) => {
      if (sIdx !== activeSheetIndex) return s;
      const copyData = s.data.map((r, i) => i === rIdx ? [...r] : r);
      copyData[rIdx][cIdx] = val;
      return { ...s, data: copyData };
    }));
  };

  const updateColumnMapping = (cIdx: number, role: string) => {
    if (!activeSheet) return;
    setSheets(prev => prev.map((s, sIdx) => {
      if (sIdx !== activeSheetIndex) return s;
      const copyCols = [...s.columnMappings];
      copyCols[cIdx] = role;
      return { ...s, columnMappings: copyCols };
    }));
  };

  const toggleBlockColumn = (cIdx: number) => {
    if (!activeSheet) return;
    setSheets(prev => prev.map((s, sIdx) => {
      if (sIdx !== activeSheetIndex) return s;
      const copyBlocked = [...s.blockedColumns];
      copyBlocked[cIdx] = !copyBlocked[cIdx];
      return { ...s, blockedColumns: copyBlocked };
    }));
  };

  const toggleBlockRow = (rIdx: number) => {
    if (!activeSheet) return;
    setSheets(prev => prev.map((s, sIdx) => {
      if (sIdx !== activeSheetIndex) return s;
      const copyBlocked = [...s.blockedRows];
      copyBlocked[rIdx] = !copyBlocked[rIdx];
      return { ...s, blockedRows: copyBlocked };
    }));
  };

  const shiftRowUp = (rIdx: number) => {
    if (rIdx <= 0 || !activeSheet) return;
    setSheets(prev => prev.map((s, sIdx) => {
      if (sIdx !== activeSheetIndex) return s;
      const copyData = [...s.data];
      const temp = copyData[rIdx];
      copyData[rIdx] = copyData[rIdx - 1];
      copyData[rIdx - 1] = temp;

      const copyBlocked = [...s.blockedRows];
      const tempB = copyBlocked[rIdx];
      copyBlocked[rIdx] = copyBlocked[rIdx - 1];
      copyBlocked[rIdx - 1] = tempB;

      return { ...s, data: copyData, blockedRows: copyBlocked };
    }));
  };

  const shiftRowDown = (rIdx: number) => {
    if (!activeSheet || rIdx >= activeSheet.data.length - 1) return;
    setSheets(prev => prev.map((s, sIdx) => {
      if (sIdx !== activeSheetIndex) return s;
      const copyData = [...s.data];
      const temp = copyData[rIdx];
      copyData[rIdx] = copyData[rIdx + 1];
      copyData[rIdx + 1] = temp;

      const copyBlocked = [...s.blockedRows];
      const tempB = copyBlocked[rIdx];
      copyBlocked[rIdx] = copyBlocked[rIdx + 1];
      copyBlocked[rIdx + 1] = tempB;

      return { ...s, data: copyData, blockedRows: copyBlocked };
    }));
  };

  const addRow = () => {
    if (!activeSheet) return;
    setSheets(prev => prev.map((s, sIdx) => {
      if (sIdx !== activeSheetIndex) return s;
      const newRow = new Array(s.data[0]?.length || 5).fill('');
      return {
        ...s,
        data: [...s.data, newRow],
        blockedRows: [...s.blockedRows, false],
        rowMappings: [...s.rowMappings, 'data'],
      };
    }));
  };

  // Sheet Tabs Reordering & Blocking
  const moveSheetLeft = (idx: number) => {
    if (idx <= 0) return;
    setSheets(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      return copy;
    });
    if (activeSheetIndex === idx) setActiveSheetIndex(idx - 1);
    else if (activeSheetIndex === idx - 1) setActiveSheetIndex(idx);
  };

  const moveSheetRight = (idx: number) => {
    if (idx >= sheets.length - 1) return;
    setSheets(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      return copy;
    });
    if (activeSheetIndex === idx) setActiveSheetIndex(idx + 1);
    else if (activeSheetIndex === idx + 1) setActiveSheetIndex(idx);
  };

  const toggleBlockSheet = (idx: number) => {
    setSheets(prev => prev.map((s, i) => i === idx ? { ...s, isBlocked: !s.isBlocked } : s));
  };

  // Draggable Column Resizer
  const handleMouseDownResize = (e: React.MouseEvent, cIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColIdx(cIdx);
    startXRef.current = e.clientX;
    startWidthRef.current = activeSheet?.columnWidths[cIdx] || 150;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const newWidth = Math.max(70, startWidthRef.current + deltaX);
      setSheets(prev => prev.map((s, sIdx) => {
        if (sIdx !== activeSheetIndex) return s;
        const copyW = [...s.columnWidths];
        copyW[cIdx] = newWidth;
        return { ...s, columnWidths: copyW };
      }));
    };

    const onMouseUp = () => {
      setResizingColIdx(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [committedLeadsCount, setCommittedLeadsCount] = useState(0);

  // Final Ingestion Commit Handler
  const handleCommitIngestion = () => {
    if (!fileName.trim()) {
      alert('Please enter a File Name before injecting data.');
      return;
    }
    if (!selectedPlatform) {
      alert('Please select a Source Platform from the dropdown.');
      return;
    }

    const extractedLeads: any[] = [];

    sheets.forEach(sheet => {
      if (sheet.isBlocked) return; // Skip blocked worksheets

      // Process rows (skip row 0 if header, skip blocked rows)
      sheet.data.forEach((row, rIdx) => {
        if (rIdx === 0 && sheet.rowMappings[0] === 'header') return; // Skip header row
        if (sheet.blockedRows[rIdx]) return; // Skip blocked rows (includes filtered duplicates)

        // Check if this row was marked for retargeting
        const dupMatch = duplicateRecords.find(d => d.sheetIndex === activeSheetIndex && d.rowIndex === rIdx);
        const isRetargeting = dupMatch?.resolution === 'RETARGET';

        const leadObj: any = {
          id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: '',
          email: '—',
          phone: '',
          company: 'Individual Lead',
          source: selectedPlatform,
          stage: isRetargeting ? 'Retargeting' : 'Prospecting',
          status: isRetargeting ? 'RETARGETING' : 'NEW',
          isRetargeting,
          tags: isRetargeting ? ['Retargeting', 'Duplicate Re-engagement'] : [],
          value: 0,
          assignedRep: 'Unassigned',
          customFields: {},
          createdAt: 'Just now',
        };

        let hasValidData = false;
        let firstCustomCell = '';

        row.forEach((cellVal, cIdx) => {
          if (sheet.blockedColumns[cIdx]) return; // Skip blocked columns
          const role = sheet.columnMappings[cIdx];
          if (role === 'block') return;

          const trimmed = (cellVal || '').toString().trim();
          if (!trimmed) return;

          hasValidData = true; // Any non-empty cell in unblocked columns makes row valid!

          if (role === 'name') { leadObj.name = trimmed; }
          else if (role === 'email') { leadObj.email = trimmed; }
          else if (role === 'phone') { leadObj.phone = sanitizePhoneValue(trimmed); }
          else if (role === 'company') { leadObj.company = trimmed; }
          else if (role === 'value') { leadObj.value = sanitizeNumericValue(trimmed); }
          else if (role === 'city') { leadObj.customFields['col_city'] = trimmed; }
          else if (role === 'budget') { leadObj.customFields['col_budget'] = trimmed; }
          else {
            const headerName = sheet.data[0]?.[cIdx] || `Col ${cIdx + 1}`;
            const cleanHeader = headerName.toLowerCase().replace(/\s+/g, '_');
            leadObj.customFields[`col_${cleanHeader}`] = trimmed;
            if (!firstCustomCell) firstCustomCell = trimmed;
          }
        });

        // Fallback for name if missing
        if (!leadObj.name) {
          if (leadObj.email && leadObj.email !== '—') {
            leadObj.name = leadObj.email.split('@')[0];
          } else if (leadObj.company && leadObj.company !== 'Individual Lead') {
            leadObj.name = leadObj.company;
          } else if (firstCustomCell) {
            leadObj.name = firstCustomCell;
          } else {
            leadObj.name = `Lead Record #${extractedLeads.length + 1}`;
          }
        }

        if (hasValidData) {
          extractedLeads.push(leadObj);
        }
      });
    });

    if (extractedLeads.length === 0) {
      alert('No unblocked lead records found to ingest.');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    const ext = (detectedFormat || 'xlsx').toLowerCase();
    const timestampedFileName = formatTimestampedFileName(fileName.trim() || 'Leads_Import', ext);

    // ☁️ Automatically archive the imported Excel spreadsheet to Google Drive with Date & Time in filename
    (async () => {
      try {
        let uploadBlob: Blob | File = selectedFileBlob!;
        if (!uploadBlob) {
          const wb = XLSX.utils.book_new();
          sheets.forEach(s => {
            const ws = XLSX.utils.aoa_to_sheet(s.data);
            XLSX.utils.book_append_sheet(wb, ws, s.name);
          });
          const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          uploadBlob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        }

        const driveResult = await uploadLeadSpreadsheetToDrive(
          uploadBlob,
          `${fileName.trim() || 'Leads_Import'}.${ext}`,
          'Acme Sales Solutions',
          (p) => {
            setDriveProgress(p);
            if (p.status === 'COMPLETED') setIsDriveUploaded(true);
          }
        );
        console.log('✅ Stored imported Excel to Google Drive:', driveResult.folderPath, driveResult.fileName);
      } catch (err) {
        console.warn('Auto-storage of imported Excel to Google Drive:', err);
      }
    })();

    onImportLeads(extractedLeads, {
      filename: timestampedFileName,
      fileSize: fileSize || '—',
      platform: selectedPlatform,
      count: extractedLeads.length,
      date: formattedDate,
    });

    setCommittedLeadsCount(extractedLeads.length);
    setIsAllocationModalOpen(true);
  };

  // Google Drive Upload Handler with Real-time Progress & Speed
  const handleUploadToGoogleDrive = async () => {
    if (!selectedFileBlob && sheets.length === 0) {
      alert('Please select a spreadsheet file first.');
      return;
    }

    setIsUploadingDrive(true);
    try {
      let uploadBlob: Blob | File = selectedFileBlob!;
      if (!uploadBlob) {
        const wb = XLSX.utils.book_new();
        sheets.forEach(s => {
          const ws = XLSX.utils.aoa_to_sheet(s.data);
          XLSX.utils.book_append_sheet(wb, ws, s.name);
        });
        const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        uploadBlob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      }

      const ext = (detectedFormat || 'xlsx').toLowerCase();
      const result = await uploadLeadSpreadsheetToDrive(
        uploadBlob,
        `${fileName.trim() || 'Leads_Import'}.${ext}`,
        'Acme Sales Solutions',
        (p) => {
          setDriveProgress(p);
        }
      );

      setIsDriveUploaded(true);
      setDriveProgress(result);
    } catch (err) {
      alert('Upload to Google Drive failed: ' + (err as Error).message);
    } finally {
      setIsUploadingDrive(false);
    }
  };

  if (!isOpen) return null;

  const totalRowsCount = sheets.reduce((acc, s) => acc + s.data.length, 0);
  const totalColsCount = sheets[0]?.data[0]?.length || 0;
  const isReadyToInject = fileName.trim().length > 0 && selectedPlatform.length > 0 && sheets.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="crm-card max-w-7xl w-full h-[92vh] flex flex-col bg-slate-950 border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden animate-scale-in dark-context">
        
        {/* HEADER TOOLBAR */}
        <div className="p-4 bg-slate-900 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-black">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  CSV / Excel / XML Extraction &amp; Interactive Import Engine
                </h2>
                {detectedFormat && (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {detectedFormat} FORMAT DETECTED
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                Upload `.csv`, `.xls`, `.xlsx`, `.xml`, `.xlsm`, `.xltx`, `.xltm` — Edit grid, assign row/col fields &amp; sanitize values.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <X size={18} />
          </button>
        </div>

        {/* METADATA & UPLOAD BAR — Top control strip with action buttons */}
        <div className="p-4 bg-slate-900/60 border-b border-border/60 flex flex-col gap-3 text-xs">
          {/* Row 1: File pickers + Platform + Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* File Picker / Dropzone */}
            <div>
              <label className="text-slate-300 block mb-1 font-bold flex items-center gap-1">
                <Upload size={13} className="text-indigo-400" /> Select / Drop Spreadsheet File
              </label>
              <input
                type="file"
                accept=".csv, .xls, .xlsx, .xml, .xlsm, .xltx, .xltm"
                onChange={handleFileChange}
                className="crm-input w-full text-xs font-semibold py-1.5"
              />
            </div>

            {/* Mandatory File Name Input */}
            <div>
              <label className="text-slate-300 block mb-1 font-bold flex items-center gap-1">
                <Type size={13} className="text-amber-400" /> File Name (Required) *
              </label>
              <input
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                placeholder="e.g. Q3_Aug_Lead_Campaign"
                className="crm-input w-full text-xs font-bold text-white bg-slate-950"
              />
            </div>

            {/* Mandatory Platform Dropdown */}
            <div>
              <label className="text-slate-300 block mb-1 font-bold flex items-center gap-1">
                <Sliders size={13} className="text-emerald-400" /> Source Platform (Required) *
              </label>
              <select
                value={selectedPlatform}
                onChange={e => setSelectedPlatform(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className={`crm-input w-full text-xs font-bold bg-slate-950 transition-all ${
                  !selectedPlatform && sheets.length > 0
                    ? 'border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                    : 'text-emerald-300'
                }`}
              >
                <option
                  value=""
                  className="bg-slate-900 text-slate-300"
                  style={{ backgroundColor: '#0f172a', color: '#cbd5e1' }}
                >
                  -- Select Platform Source --
                </option>
                {PLATFORMS.map(p => (
                  <option
                    key={p}
                    value={p}
                    className="bg-slate-900 text-white font-medium"
                    style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
                  >
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Analytics Badge */}
            <div className="flex items-center justify-around bg-slate-950 p-2.5 rounded-xl border border-slate-700">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-bold block">SHEETS</span>
                <span className="text-sm font-black text-indigo-400">{sheets.length}</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-bold block">ROWS</span>
                <span className="text-sm font-black text-cyan-400">{totalRowsCount.toLocaleString()}</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-bold block">COLS</span>
                <span className="text-sm font-black text-emerald-400">{totalColsCount}</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-bold block">FILE SIZE</span>
                <span className="text-sm font-black text-amber-400">{fileSize || '—'}</span>
              </div>
            </div>
          </div>

          {/* Row 2: Status hint + Action Buttons (moved UP here) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
            {/* Left: contextual status hint */}
            <div className="flex items-center gap-2 text-xs">
              {!fileName.trim() && (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <AlertCircle size={13} /> Enter a File Name to unlock upload.
                </span>
              )}
              {fileName.trim() && !selectedPlatform && (
                <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                  <AlertCircle size={13} /> Select Source Platform above to unlock upload (File Size: {fileSize || '—'} · Status: 0%).
                </span>
              )}
              {isReadyToInject && !isDriveUploaded && !isUploadingDrive && (
                <span className="text-sky-300 font-bold flex items-center gap-1">
                  <CloudUpload size={13} /> Ready — click &apos;Upload to Google Drive&apos; ({fileSize || '0%'}) to archive &amp; ingest.
                </span>
              )}
              {isUploadingDrive && (
                <span className="text-amber-300 font-bold flex items-center gap-1 animate-pulse">
                  <RefreshCw size={13} className="animate-spin" /> Archiving to Google Drive cold vault... {driveProgress?.progressPercent || 0}% ({fileSize})
                </span>
              )}
              {isDriveUploaded && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle size={13} /> Archived (100%)! Click &apos;Confirm &amp; Ingest&apos; to finish.
                </span>
              )}
            </div>

            {/* Right: Duplicate Resolution Alert Button + Cancel + Primary Action */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* ⚠️ Prominent Duplicate Lead Found Button */}
              {duplicateRecords.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsDuplicateModalOpen(true)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer border ${
                    !duplicatesResolved
                      ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-950/50 animate-pulse ring-2 ring-rose-500/40'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                  }`}
                  title={!duplicatesResolved ? 'Duplicates detected! Click to resolve (Retarget or Filter)' : 'Duplicates resolved! Click to review'}
                >
                  {!duplicatesResolved ? (
                    <>
                      <AlertTriangle size={14} className="text-amber-300" />
                      <span>⚠️ {duplicateRecords.length} Duplicate Leads Found (Action Required)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} className="text-emerald-400" />
                      <span>
                        ✓ {duplicateRecords.length} Duplicates Handled ({duplicateRecords.filter(d => d.resolution === 'RETARGET').length} Retargeted)
                      </span>
                    </>
                  )}
                </button>
              )}

              {/* ⚠️ Prominent Missing Contact Details Button */}
              {sheets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsMissingContactModalOpen(true)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer border ${
                    activeIncompleteRecords.length > 0
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-amber-950/40 animate-pulse ring-2 ring-amber-500/40'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                  }`}
                  title={activeIncompleteRecords.length > 0 ? 'Review leads with missing email or phone number' : 'All leads have phone and email'}
                >
                  {activeIncompleteRecords.length > 0 ? (
                    <>
                      <AlertTriangle size={14} className="text-amber-300 shrink-0" />
                      <span>
                        ⚠️ {activeIncompleteRecords.length} Missing Contact ({missingPhoneCount} No Phone · {missingEmailCount} No Email)
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                      <span>✓ All Contact Info Complete</span>
                    </>
                  )}
                </button>
              )}

              <button onClick={onClose} className="btn-secondary px-4 py-2 text-xs font-bold cursor-pointer">
                Cancel
              </button>

              {!isDriveUploaded ? (
                <button
                  type="button"
                  onClick={handleUploadToGoogleDrive}
                  disabled={!isReadyToInject || isUploadingDrive || (!duplicatesResolved && duplicateRecords.length > 0)}
                  title={!duplicatesResolved && duplicateRecords.length > 0 ? `Action Required: Resolve ${duplicateRecords.length} duplicate leads first` : !isReadyToInject ? 'Select Source Platform to unlock upload' : 'Upload and archive file to Google Drive'}
                  className={`px-5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 shadow-indigo-600/25 cursor-pointer ${
                    !duplicatesResolved && duplicateRecords.length > 0
                      ? 'bg-slate-800 border border-rose-500/40 text-rose-300 opacity-50 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white disabled:opacity-40 disabled:pointer-events-none'
                  }`}
                >
                  {isUploadingDrive ? (
                    <><RefreshCw size={14} className="animate-spin text-sky-300" /><span>Uploading ({driveProgress?.progressPercent || 0}% · {fileSize})...</span></>
                  ) : !duplicatesResolved && duplicateRecords.length > 0 ? (
                    <><Ban size={14} className="text-rose-400" /><span>Resolve {duplicateRecords.length} Duplicates First</span></>
                  ) : (
                    <><CloudUpload size={15} /><span>Upload to Google Drive {!isReadyToInject ? '(Locked: Select Platform)' : ''}</span></>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {committedLeadsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAllocationModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/50 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                      title="Return to Post-Import Lead Allocation"
                    >
                      <Zap size={14} className="text-amber-400" />
                      <span>⚡ Return to Allocation ({committedLeadsCount}) →</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCommitIngestion}
                    disabled={!isReadyToInject || (!duplicatesResolved && duplicateRecords.length > 0)}
                    title={!duplicatesResolved && duplicateRecords.length > 0 ? `Action Required: Resolve ${duplicateRecords.length} duplicate leads first` : 'Confirm & Ingest Leads'}
                    className={`px-5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                      !duplicatesResolved && duplicateRecords.length > 0
                        ? 'bg-slate-800 border-2 border-rose-500/60 text-rose-300 opacity-60 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-emerald-600 via-indigo-600 to-brand hover:from-emerald-500 hover:to-brand text-white ring-2 ring-emerald-400/50 shadow-emerald-500/25 animate-pulse'
                    }`}
                  >
                    {!duplicatesResolved && duplicateRecords.length > 0 ? (
                      <>
                        <Ban size={14} className="text-rose-400" />
                        <span>Resolve {duplicateRecords.length} Duplicates to Ingest</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        <span>Confirm &amp; Ingest Leads →</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WORKBOOK SHEET TAB BAR */}
        {sheets.length > 0 && (
          <div className="px-4 py-2 bg-slate-900 border-b border-border/80 flex items-center justify-between gap-2 overflow-x-auto select-none">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted px-2 flex items-center gap-1">
                <Layers size={13} /> SheetTabs:
              </span>
              {sheets.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveSheetIndex(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    activeSheetIndex === idx
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                      : s.isBlocked
                      ? 'bg-slate-900/60 text-slate-500 border-slate-800 line-through'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{s.name}</span>
                  {s.isBlocked && <span className="text-[9px] text-rose-400 font-extrabold px-1 rounded bg-rose-500/20">BLOCKED</span>}

                  {/* Sheet Shift Left / Right Controls */}
                  <div className="flex items-center gap-0.5 ml-1 opacity-70 hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSheetLeft(idx); }}
                      disabled={idx === 0}
                      title="Move Sheet Left"
                      className="p-0.5 hover:text-white disabled:opacity-20 text-[9px]"
                    >
                      ◀
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSheetRight(idx); }}
                      disabled={idx === sheets.length - 1}
                      title="Move Sheet Right"
                      className="p-0.5 hover:text-white disabled:opacity-20 text-[9px]"
                    >
                      ▶
                    </button>
                  </div>

                  {/* Block Sheet Toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBlockSheet(idx); }}
                    title={s.isBlocked ? 'Unblock Sheet' : 'Block Sheet'}
                    className={`ml-1 p-0.5 rounded text-[10px] ${s.isBlocked ? 'text-emerald-400 hover:text-emerald-300' : 'text-rose-400 hover:text-rose-300'}`}
                  >
                    {s.isBlocked ? <Eye size={12} /> : <Ban size={12} />}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addRow}
              className="px-3 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1 shrink-0 transition-all"
            >
              <Plus size={13} /> + Insert Blank Row
            </button>
          </div>
        )}

        {/* IN-POPUP EXCEL GRID EDITOR — Virtual Scroll for performance with 3k+ rows */}
        <div className="flex-1 overflow-hidden bg-slate-950 p-4 relative flex flex-col">
          {sheets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-center text-muted">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Upload size={32} />
              </div>
              <p className="font-extrabold text-sm text-white">No Spreadsheet File Loaded Yet</p>
              <p className="text-xs max-w-sm">
                Select or drop a `.csv`, `.xls`, `.xlsx`, `.xml`, `.xlsm`, `.xltx`, or `.xltm` file using the file selector bar above to begin extraction.
              </p>
            </div>
          ) : activeSheet?.isBlocked ? (
            <div className="h-full flex flex-col items-center justify-center space-y-2 text-center text-rose-400">
              <Ban size={36} />
              <p className="font-extrabold text-sm">Worksheet "{activeSheet.name}" is Blocked</p>
              <p className="text-xs text-muted">Click the unblock icon in the SheetTab bar above to include this sheet's data.</p>
            </div>
          ) : (
            <VirtualizedGrid
              activeSheet={activeSheet}
              toggleBlockColumn={toggleBlockColumn}
              updateColumnMapping={updateColumnMapping}
              handleMouseDownResize={handleMouseDownResize}
              shiftRowUp={shiftRowUp}
              shiftRowDown={shiftRowDown}
              toggleBlockRow={toggleBlockRow}
              updateCell={updateCell}
            />
          )}
        </div>

        {/* FOOTER — Google Drive cold vault status (action buttons are in the top metadata bar) */}
        <div className="px-5 py-2.5 bg-slate-900 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-500 flex-wrap">
            <Cloud size={13} className="text-indigo-400 shrink-0" />
            <span className="font-bold text-slate-400">Cold Vault:</span>
            <span className="font-mono text-slate-400 truncate max-w-xs sm:max-w-md">
              Google Drive › Acme Sales Solutions › Leads › {formatTimestampedFileName(fileName || 'Leads', (detectedFormat || 'xlsx').toLowerCase())}
            </span>
            {fileSize && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px] font-bold border border-slate-700">
                Size: {fileSize}
              </span>
            )}
          </span>
          <div className="flex items-center gap-3 shrink-0">
            {!isDriveUploaded && !isUploadingDrive && sheets.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[10px]">
                  Status: 0% · {fileSize || '0 KB'}
                </span>
                {!selectedPlatform ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30">
                    <AlertCircle size={12} className="text-amber-400 animate-pulse" /> Pending: Select Platform (0%)
                  </span>
                ) : (
                  <span className="text-sky-400 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30">
                    <Clock size={12} /> Ready to Upload (0%)
                  </span>
                )}
              </div>
            )}
            {isUploadingDrive && driveProgress && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[10px]">
                  {fileSize && `${fileSize} · `}{driveProgress.progressPercent}%
                </span>
                <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-150"
                    style={{ width: `${Math.max(4, driveProgress.progressPercent)}%` }}
                  />
                </div>
                <span className="text-sky-400 font-bold flex items-center gap-1 animate-pulse">
                  <RefreshCw size={11} className="animate-spin" /> {driveProgress.progressPercent}% · {driveProgress.speedMbps} MB/s
                </span>
              </div>
            )}
            {isDriveUploaded && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[10px]">{fileSize}</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                  <CheckCircle size={12} /> Archived to Cold Vault (100%)
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ⚠️ DUPLICATE LEAD RESOLUTION MODAL */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-rose-500/70 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl shadow-rose-950/60 overflow-hidden text-white">
            {/* Header */}
            <div className="p-4 bg-slate-950/80 border-b border-rose-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    Duplicate Leads Resolution Center
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {duplicateRecords.length} Duplicates Detected
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Phone numbers or emails match previous CRM records. Select whether to <strong>Retarget</strong> (keep &amp; re-engage) or <strong>Filter</strong> (remove from upload).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDuplicateModalOpen(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Bulk Action Controls Strip */}
            <div className="p-3 bg-slate-950/50 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400">Quick Bulk Actions:</span>
                <button
                  type="button"
                  onClick={() => handleBulkSetResolution('RETARGET')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/50 text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Target size={13} className="text-indigo-400" />
                  Mark All ({duplicateRecords.length}) as Retargeting
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSetResolution('FILTER')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/50 text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Filter size={13} className="text-rose-400" />
                  Filter Out All ({duplicateRecords.length}) Duplicates
                </button>
              </div>

              {/* Counter Pills */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  🎯 {duplicateRecords.filter(d => d.resolution === 'RETARGET').length} Retargeting
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  🗑️ {duplicateRecords.filter(d => d.resolution === 'FILTER').length} Filtered
                </span>
                {duplicateRecords.some(d => d.resolution === 'UNRESOLVED') && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    ⚠️ {duplicateRecords.filter(d => d.resolution === 'UNRESOLVED').length} Pending
                  </span>
                )}
              </div>
            </div>

            {/* Duplicate Leads List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {duplicateRecords.map((dup, idx) => {
                const isRetarget = dup.resolution === 'RETARGET';
                const isFilter = dup.resolution === 'FILTER';

                return (
                  <div
                    key={`${dup.sheetIndex}-${dup.rowIndex}-${idx}`}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isRetarget
                        ? 'bg-indigo-950/30 border-indigo-500/50'
                        : isFilter
                        ? 'bg-rose-950/20 border-rose-500/40 opacity-75'
                        : 'bg-slate-950/80 border-amber-500/40'
                    }`}
                  >
                    {/* Lead Info & Match Details */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 font-bold">
                          Row #{dup.rowIndex + 1}
                        </span>
                        <h4 className="text-sm font-black text-white truncate">{dup.leadName}</h4>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Match: {dup.matchType}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                        {dup.phone && (
                          <span className="flex items-center gap-1 font-mono text-emerald-400">
                            <Phone size={12} /> {dup.phone}
                          </span>
                        )}
                        {dup.email && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Mail size={12} className="text-amber-400" /> {dup.email}
                          </span>
                        )}
                      </div>

                      {dup.matchedExistingLead && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <User size={11} className="text-indigo-400" />
                          <span>
                            Previously registered as <strong className="text-white">{dup.matchedExistingLead.name}</strong> ({dup.matchedExistingLead.createdAt || 'Previous Upload'})
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Action Buttons for this Lead */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSetSingleResolution(dup.sheetIndex, dup.rowIndex, 'RETARGET')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
                          isRetarget
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Target size={13} />
                        {isRetarget ? '✓ Retargeting' : 'Retarget'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetSingleResolution(dup.sheetIndex, dup.rowIndex, 'FILTER')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
                          isFilter
                            ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Filter size={13} />
                        {isFilter ? '✓ Filtered (Exclude)' : 'Filter Out'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="text-xs">
                {duplicateRecords.some(d => d.resolution === 'UNRESOLVED') ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    Please choose Retarget or Filter for all duplicate records to proceed.
                  </span>
                ) : (
                  <span className="text-emerald-400 font-black flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    All duplicates resolved! Click &apos;Save &amp; Apply Resolution&apos; to unlock upload.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDuplicateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyDuplicateResolutions}
                  disabled={duplicateRecords.some(d => d.resolution === 'UNRESOLVED')}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Check size={14} />
                  Save &amp; Apply Resolution →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ Incomplete / Missing Contact Details Resolution Center Popup */}
      {isMissingContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in dark-context">
          <div className="crm-card max-w-4xl w-full max-h-[92vh] flex flex-col bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    Incomplete Contact Details Resolution Center
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      {activeIncompleteRecords.length} Active Conflict{activeIncompleteRecords.length !== 1 ? 's' : ''}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Spreadsheet rows missing Phone Number or Email Address. Add details manually, remove row, or skip/keep as-is.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMissingContactModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Summary Counters Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-900/60 border-b border-slate-800/80 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-bold">Total Incomplete:</span>
                <span className="font-black text-amber-400 text-sm">{activeIncompleteRecords.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-bold">No Phone:</span>
                <span className="font-black text-amber-300 text-sm">{missingPhoneCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-bold">No Email:</span>
                <span className="font-black text-rose-300 text-sm">{missingEmailCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-bold">No Phone &amp; Email:</span>
                <span className="font-black text-rose-400 text-sm">{missingBothCount}</span>
              </div>
            </div>

            {/* Filter Tabs & Bulk Actions Bar */}
            <div className="p-3 bg-slate-950 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'ALL', label: `All (${incompleteContactRecords.length})` },
                  { id: 'NO_PHONE', label: `No Phone (${missingPhoneCount})` },
                  { id: 'NO_EMAIL', label: `No Email (${missingEmailCount})` },
                  { id: 'NO_BOTH', label: `No Both (${missingBothCount})` },
                  { id: 'SKIPPED', label: `Skipped (${incompleteContactRecords.filter(r => r.isSkipped).length})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMissingFilterTab(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      missingFilterTab === tab.id
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Bulk Quick Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleBulkRemoveIncomplete}
                  disabled={activeIncompleteRecords.length === 0}
                  className="px-3 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <Ban size={12} />
                  Remove All Incomplete ({activeIncompleteRecords.length})
                </button>
                <button
                  type="button"
                  onClick={handleBulkSkipIncomplete}
                  disabled={activeIncompleteRecords.length === 0}
                  className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <FastForward size={12} />
                  Skip All &amp; Keep As-Is
                </button>
              </div>
            </div>

            {/* Incomplete Leads List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
              {filteredIncompleteList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <CheckCircle size={36} className="mx-auto text-emerald-400" />
                  <p className="text-sm font-bold text-white">No incomplete records matching this filter!</p>
                  <p className="text-xs">All records have valid phone and email contact details.</p>
                </div>
              ) : (
                filteredIncompleteList.map((rec: IncompleteContactRecord) => {
                  const rowKey = `${rec.sheetIndex}_${rec.rowIndex}`;
                  const currentPhoneInput = getEditingPhone(rowKey, rec.phone);
                  const currentEmailInput = getEditingEmail(rowKey, rec.email);

                  return (
                    <div
                      key={rowKey}
                      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                        rec.isSkipped
                          ? 'bg-slate-900/40 border-slate-800 opacity-70'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
                      }`}
                    >
                      {/* Lead Title & Meta */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                            Row #{rec.rowIndex + 1}
                          </span>
                          {sheets.length > 1 && (
                            <span className="text-[10px] font-bold text-slate-400">
                              Sheet: <strong className="text-slate-200">{rec.sheetName}</strong>
                            </span>
                          )}
                          <strong className="text-xs font-black text-white">{rec.leadName}</strong>
                          {rec.isSkipped && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                              ⏭️ Skipped (Allowed As-Is)
                            </span>
                          )}
                        </div>

                        {/* Row Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleToggleSkipRow(rec.sheetIndex, rec.rowIndex)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                              rec.isSkipped
                                ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                            }`}
                          >
                            <FastForward size={12} />
                            {rec.isSkipped ? '↩️ Unskip' : 'Skip (Keep As-Is)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveIncompleteRow(rec.sheetIndex, rec.rowIndex)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Ban size={12} />
                            Remove Row
                          </button>
                        </div>
                      </div>

                      {/* Fields: Phone & Email with Column Number and Manual Entry */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Phone Column Field */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                              <Phone size={11} className="text-amber-400" />
                              {rec.phoneColLabel}
                            </span>
                            {rec.isPhoneMissing ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                MISSING PHONE
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                                <Check size={10} /> Valid
                              </span>
                            )}
                          </div>

                          {rec.isPhoneMissing ? (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <input
                                type="text"
                                value={currentPhoneInput}
                                onChange={e => setFieldEdit(rowKey, 'phone', e.target.value)}
                                placeholder="Enter phone number..."
                                style={{ backgroundColor: '#090d16', color: '#ffffff', colorScheme: 'dark' }}
                                className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg text-xs font-bold text-white outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveMissingField(rec.sheetIndex, rec.rowIndex, 'phone', currentPhoneInput)}
                                disabled={!currentPhoneInput.trim()}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Save size={12} />
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs font-semibold text-slate-200">
                              {rec.phone}
                            </div>
                          )}
                        </div>

                        {/* Email Column Field */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                              <Mail size={11} className="text-rose-400" />
                              {rec.emailColLabel}
                            </span>
                            {rec.isEmailMissing ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                MISSING EMAIL
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                                <Check size={10} /> Valid
                              </span>
                            )}
                          </div>

                          {rec.isEmailMissing ? (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <input
                                type="email"
                                value={currentEmailInput}
                                onChange={e => setFieldEdit(rowKey, 'email', e.target.value)}
                                placeholder="Enter email address..."
                                style={{ backgroundColor: '#090d16', color: '#ffffff', colorScheme: 'dark' }}
                                className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg text-xs font-bold text-white outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveMissingField(rec.sheetIndex, rec.rowIndex, 'email', currentEmailInput)}
                                disabled={!currentEmailInput.trim()}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Save size={12} />
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs font-semibold text-slate-200">
                              {rec.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                {activeIncompleteRecords.length === 0 ? (
                  <span className="text-emerald-400 font-black flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    All records sanitized! Ready for import.
                  </span>
                ) : (
                  <span>
                    <strong className="text-white">{activeIncompleteRecords.length}</strong> incomplete records remaining. You may manually complete them or click &apos;Skip All&apos; to proceed.
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsMissingContactModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/25 cursor-pointer transition-all"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Import Lead Allocation Modal (Parity with Android) */}
      {isAllocationModalOpen && (
        <LeadAllocationModal
          isOpen={isAllocationModalOpen}
          onClose={() => {
            setIsAllocationModalOpen(false);
            onClose();
          }}
          onPreviewSheet={() => {
            // Return user to the previous interactive spreadsheet engine
            setIsAllocationModalOpen(false);
          }}
          totalLeadsCount={committedLeadsCount}
          fileName={fileName}
        />
      )}
    </div>
  );
};
