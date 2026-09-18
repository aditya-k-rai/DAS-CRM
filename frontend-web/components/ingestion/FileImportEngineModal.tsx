'use client';

import React, { useState, useRef, useCallback, memo } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import * as XLSX from 'xlsx';
import {
  Upload, FileSpreadsheet, X, Plus, Sliders,
  Layers, CheckCircle, Ban, Eye, Type, AlertCircle,
  Cloud, CloudUpload, Zap, Folder, Check, Clock, RefreshCw
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
    <div className="flex-1 overflow-hidden rounded-xl border border-border/80 shadow-2xl flex flex-col" ref={containerRef}>

      {/* ── Sticky Column-Mapping Header ───────────────────────────────── */}
      <div className="overflow-x-auto shrink-0 bg-slate-900 border-b-2 border-slate-700 select-none">
        <div style={{ width: totalWidth, display: 'flex' }}>

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
                    className="crm-input w-full text-[10px] font-extrabold bg-slate-950 text-indigo-200 py-0.5"
                  >
                    {FIELD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
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
      </div>

      {/* ── Chunk-Loaded Virtual Row Body ──────────────────────────────── */}
      <div className="flex-1 overflow-x-auto" style={{ background: 'rgb(2 6 23)' }}>
        <FixedSizeList
          ref={listRef}
          height={window?.innerHeight ? Math.max(300, window.innerHeight * 0.44) : 480}
          itemCount={renderLimit}           /* only the currently unlocked chunk */
          itemSize={ROW_HEIGHT}
          width={totalWidth}
          overscanCount={20}                /* pre-paint 20 rows above+below viewport */
          onItemsRendered={handleItemsRendered}
          style={{ willChange: 'transform', overflowX: 'hidden' }}
        >
          {RowRenderer}
        </FixedSizeList>
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
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

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
        if (sheet.blockedRows[rIdx]) return; // Skip blocked rows

        const leadObj: any = {
          id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: '',
          email: '—',
          phone: '',
          company: 'Individual Lead',
          source: selectedPlatform,
          stage: 'Prospecting',
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
      <div className="crm-card max-w-7xl w-full h-[92vh] flex flex-col bg-slate-950 border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        
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

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
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
                className="crm-input w-full text-xs font-bold text-emerald-300 bg-slate-950"
              >
                <option value="">-- Select Platform Source --</option>
                {PLATFORMS.map(p => (
                  <option key={p} value={p}>{p}</option>
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
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <AlertCircle size={13} /> Select Source Platform to unlock upload.
                </span>
              )}
              {isReadyToInject && !isDriveUploaded && !isUploadingDrive && (
                <span className="text-sky-300 font-bold flex items-center gap-1">
                  <CloudUpload size={13} /> Ready — click &apos;Upload to Google Drive&apos; to archive &amp; ingest.
                </span>
              )}
              {isUploadingDrive && (
                <span className="text-amber-300 font-bold flex items-center gap-1 animate-pulse">
                  <RefreshCw size={13} className="animate-spin" /> Archiving to Google Drive cold vault...
                </span>
              )}
              {isDriveUploaded && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle size={13} /> Archived! Click &apos;Confirm &amp; Ingest&apos; to finish.
                </span>
              )}
            </div>

            {/* Right: Cancel + Primary Action */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={onClose} className="btn-secondary px-4 py-2 text-xs font-bold cursor-pointer">
                Cancel
              </button>

              {!isDriveUploaded ? (
                <button
                  type="button"
                  onClick={handleUploadToGoogleDrive}
                  disabled={!isReadyToInject || isUploadingDrive}
                  title={!isReadyToInject ? 'Enter File Name and select Source Platform to unlock upload' : 'Upload and archive file to Google Drive'}
                  className="px-5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-indigo-600/25 cursor-pointer"
                >
                  {isUploadingDrive ? (
                    <><RefreshCw size={14} className="animate-spin text-sky-300" /><span>Uploading ({driveProgress?.progressPercent || 0}%)...</span></>
                  ) : (
                    <><CloudUpload size={15} /><span>Upload to Google Drive</span></>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCommitIngestion}
                  disabled={!isReadyToInject}
                  className="px-5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all bg-gradient-to-r from-emerald-600 via-indigo-600 to-brand hover:from-emerald-500 hover:to-brand text-white ring-2 ring-emerald-400/50 shadow-emerald-500/25 active:scale-95 cursor-pointer animate-pulse"
                >
                  <CheckCircle size={14} />
                  <span>Confirm &amp; Ingest Leads →</span>
                </button>
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
        <div className="px-5 py-2.5 bg-slate-900 border-t border-border/60 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Cloud size={12} className="text-indigo-400 shrink-0" />
            <span className="font-bold text-slate-400">Cold Vault:</span>
            <span className="font-mono text-slate-500 truncate max-w-xs sm:max-w-md">
              Google Drive › Acme Sales Solutions › Leads › {formatTimestampedFileName(fileName || 'Leads', (detectedFormat || 'xlsx').toLowerCase())}
            </span>
          </span>
          <div className="flex items-center gap-3 shrink-0">
            {!isDriveUploaded && !isUploadingDrive && sheets.length > 0 && (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Clock size={11} /> Pending Upload
              </span>
            )}
            {isUploadingDrive && driveProgress && (
              <div className="flex items-center gap-2">
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
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle size={11} /> Archived in Vault
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Post-Import Lead Allocation Modal (Parity with Android) */}
      {isAllocationModalOpen && (
        <LeadAllocationModal
          isOpen={isAllocationModalOpen}
          onClose={() => {
            setIsAllocationModalOpen(false);
            onClose();
          }}
          totalLeadsCount={committedLeadsCount}
          fileName={fileName}
        />
      )}
    </div>
  );
};
