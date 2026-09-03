'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, FileSpreadsheet, X, Plus, Sliders,
  Layers, CheckCircle, Ban, Eye, Type, AlertCircle
} from 'lucide-react';

import { LeadAllocationModal } from './LeadAllocationModal';

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

  const [resizingColIdx, setResizingColIdx] = useState<number | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // File Drop / Selection Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    onImportLeads(extractedLeads, {
      filename: `${fileName.trim()} (${detectedFormat || 'FILE'})`,
      fileSize: fileSize || '—',
      platform: selectedPlatform,
      count: extractedLeads.length,
      date: formattedDate,
    });

    setCommittedLeadsCount(extractedLeads.length);
    setIsAllocationModalOpen(true);
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

        {/* METADATA & UPLOAD BAR */}
        <div className="p-4 bg-slate-900/60 border-b border-border/60 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* File Picker / Dropzone */}
          <div>
            <label className="text-muted block mb-1 font-bold flex items-center gap-1">
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
            <label className="text-muted block mb-1 font-bold flex items-center gap-1">
              <Type size={13} className="text-amber-400" /> File Name (Required to Inject) *
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
            <label className="text-muted block mb-1 font-bold flex items-center gap-1">
              <Sliders size={13} className="text-emerald-400" /> Source Platform (Required to Inject) *
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
          <div className="flex items-center justify-around bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-center">
              <span className="text-[10px] text-muted font-bold block">TOTAL SHEETS</span>
              <span className="text-sm font-black text-indigo-400">{sheets.length}</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="text-center">
              <span className="text-[10px] text-muted font-bold block">TOTAL ROWS</span>
              <span className="text-sm font-black text-cyan-400">{totalRowsCount}</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="text-center">
              <span className="text-[10px] text-muted font-bold block">TOTAL COLS</span>
              <span className="text-sm font-black text-emerald-400">{totalColsCount}</span>
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

        {/* IN-POPUP EXCEL GRID EDITOR */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4 relative">
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
            <div className="overflow-x-auto rounded-xl border border-border/80 shadow-2xl">
              <table className="w-full text-left text-xs border-collapse">
                
                {/* COLUMN FIELD ASSIGNMENT HEADER ROW */}
                <thead className="bg-slate-900 text-muted border-b border-border select-none">
                  <tr>
                    <th className="p-2 text-center text-slate-500 w-20 border-r border-border/40 font-bold text-[10px]">
                      Row Controls
                    </th>

                    {activeSheet.data[0]?.map((_, cIdx) => (
                      <th
                        key={cIdx}
                        style={{
                          width: `${activeSheet.columnWidths[cIdx] || 160}px`,
                          minWidth: `${activeSheet.columnWidths[cIdx] || 140}px`,
                        }}
                        className={`p-2.5 border-r border-border/40 last:border-0 relative group ${
                          activeSheet.blockedColumns[cIdx] ? 'bg-rose-950/40 text-rose-300' : 'bg-slate-900'
                        }`}
                      >
                        <div className="space-y-1.5">
                          {/* Column Field Role Selector */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                              Col {cIdx + 1}
                            </span>

                            <button
                              onClick={() => toggleBlockColumn(cIdx)}
                              title={activeSheet.blockedColumns[cIdx] ? 'Unblock Column' : 'Block Column'}
                              className={`p-1 rounded text-[10px] font-bold ${
                                activeSheet.blockedColumns[cIdx]
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {activeSheet.blockedColumns[cIdx] ? '👁️ Unblock' : '🚫 Block'}
                            </button>
                          </div>

                          <select
                            value={activeSheet.columnMappings[cIdx] || 'custom'}
                            onChange={e => updateColumnMapping(cIdx, e.target.value)}
                            disabled={activeSheet.blockedColumns[cIdx]}
                            className="crm-input w-full text-[10px] font-extrabold bg-slate-950 text-indigo-300 py-1"
                          >
                            {FIELD_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Draggable Column Width Divider Line */}
                        <div
                          onMouseDown={(e) => handleMouseDownResize(e, cIdx)}
                          title="Hold & Drag to Resize Column Width"
                          className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-20 group-hover:bg-cyan-500/40 hover:bg-cyan-400 flex items-center justify-center transition-colors"
                        >
                          <div className="w-[2px] h-full bg-slate-700/80 group-hover:bg-cyan-300" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* GRID CELL DATA ROWS */}
                <tbody className="divide-y divide-border/40 bg-slate-900/40">
                  {activeSheet.data.map((row, rIdx) => {
                    const isRowBlocked = activeSheet.blockedRows[rIdx];
                    const isHeaderRow = rIdx === 0 && activeSheet.rowMappings[0] === 'header';

                    return (
                      <tr
                        key={rIdx}
                        className={`transition-colors ${
                          isRowBlocked
                            ? 'bg-rose-950/20 opacity-60 line-through'
                            : isHeaderRow
                            ? 'bg-indigo-950/30 font-bold'
                            : 'hover:bg-slate-800/60'
                        }`}
                      >
                        {/* Row Shift & Block Controls Cell */}
                        <td className="p-2 border-r border-border/40 text-center select-none bg-slate-950">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => shiftRowUp(rIdx)}
                              disabled={rIdx === 0}
                              title="Shift Row Up"
                              className="p-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 disabled:opacity-20 text-[9px] font-bold"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => shiftRowDown(rIdx)}
                              disabled={rIdx === activeSheet.data.length - 1}
                              title="Shift Row Down"
                              className="p-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 disabled:opacity-20 text-[9px] font-bold"
                            >
                              ▼
                            </button>
                            <button
                              onClick={() => toggleBlockRow(rIdx)}
                              title={isRowBlocked ? 'Unblock Row' : 'Block Row'}
                              className={`p-1 rounded text-[9px] font-bold ${
                                isRowBlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {isRowBlocked ? '👁️' : '🚫'}
                            </button>
                          </div>
                          <span className="text-[9px] font-bold text-slate-500 block mt-0.5">#{rIdx + 1}</span>
                        </td>

                        {/* Editable Cells */}
                        {row.map((cellVal, cIdx) => {
                          const isColBlocked = activeSheet.blockedColumns[cIdx];

                          return (
                            <td
                              key={cIdx}
                              style={{
                                width: `${activeSheet.columnWidths[cIdx] || 160}px`,
                                maxWidth: `${activeSheet.columnWidths[cIdx] || 160}px`,
                              }}
                              className={`p-1.5 border-r border-border/40 last:border-0 ${
                                isColBlocked || isRowBlocked ? 'bg-slate-950/80' : ''
                              }`}
                            >
                              <input
                                value={cellVal}
                                onChange={e => updateCell(rIdx, cIdx, e.target.value)}
                                disabled={isColBlocked || isRowBlocked}
                                className={`w-full bg-transparent border-0 px-2 py-1 text-xs rounded focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none truncate transition-all ${
                                  isHeaderRow ? 'font-black text-indigo-300' : 'font-medium text-slate-200'
                                } ${isColBlocked || isRowBlocked ? 'line-through text-slate-600' : ''}`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS BAR */}
        <div className="p-4 bg-slate-900 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            {!fileName.trim() && (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertCircle size={14} /> Enter File Name above to unlock injection.
              </span>
            )}
            {!selectedPlatform && (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertCircle size={14} /> Select Source Platform above to unlock injection.
              </span>
            )}
            {isReadyToInject && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle size={14} /> Ready to Extract &amp; Ingest Lead Directory Records.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-secondary px-4 py-2 text-xs font-bold">
              Cancel
            </button>

            {/* Strict Validation Button: Disabled until File Name & Platform are filled */}
            <button
              onClick={handleCommitIngestion}
              disabled={!isReadyToInject}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-brand hover:from-indigo-500 hover:to-brand-400 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <CheckCircle size={15} /> Confirm &amp; Ingest Leads into Pipeline
            </button>
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
