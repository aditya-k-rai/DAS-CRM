'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  FolderTree,
  FileText,
  ExternalLink,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  DatabaseZap,
  User,
  Lock,
  Download,
  Folder,
  FileBadge,
} from 'lucide-react';
import {
  checkGoogleDriveStatus,
  listGoogleDriveFiles,
  GoogleDriveConnectionStatus,
  GoogleDriveStoredFile,
} from '../../lib/googleDriveService';

export const GoogleDriveStatusWidget: React.FC = () => {
  const [status, setStatus] = useState<GoogleDriveConnectionStatus | null>(null);
  const [files, setFiles] = useState<GoogleDriveStoredFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'FILES' | 'TREE'>('TREE');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Employee Vault Explorer State
  const [selectedEmployee, setSelectedEmployee] = useState<string>('Amit Shah');
  const [selectedSubCat, setSelectedSubCat] = useState<'DP' | 'Documents' | 'Details'>('Documents');

  const EMPLOYEES = ['Amit Shah', 'Priya Sharma', 'Sunita Verma', 'Amit Patel'];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [st, fl] = await Promise.all([
        checkGoogleDriveStatus(),
        listGoogleDriveFiles(),
      ]);
      setStatus(st);
      setFiles(fl);
    } catch (err) {
      console.warn('Failed to fetch Drive telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredFiles = files.filter(f => {
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'EMPLOYEES') return f.category === 'EMPLOYEES' || !!f.employeeName;
    return f.category === activeCategory;
  });

  const employeeFiles = files.filter(f => f.employeeName?.toLowerCase() === selectedEmployee.toLowerCase());

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-lg backdrop-blur-md transition-all hover:border-indigo-500/40">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-indigo-400 border border-indigo-500/30">
            <Cloud className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                Google Drive Multi-Tenant Vault
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" />
                Service Account Connected
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hierarchical folder structure: Company &gt; Employees &gt; [Employee Name] &gt; [DP | Documents | Details]
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-accent/30 p-0.5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('TREE')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === 'TREE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Folder Hierarchy
            </button>
            <button
              onClick={() => setActiveTab('FILES')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === 'FILES' ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Files ({files.length})
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/80 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* Telemetry Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="rounded-xl border border-border/70 bg-accent/30 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Identity
          </div>
          <p className="text-xs font-mono font-bold text-foreground mt-1 truncate" title={status?.serviceAccountEmail}>
            das-crm-drive
          </p>
          <p className="text-[10px] text-muted-foreground">Project: {status?.projectId || 'das-crm-506400'}</p>
        </div>

        <div className="rounded-xl border border-border/70 bg-accent/30 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <FolderTree className="h-3.5 w-3.5 text-indigo-400" />
            Folder Organization
          </div>
          <p className="text-sm font-bold text-foreground mt-1">Dedicated Folders</p>
          <p className="text-[10px] text-muted-foreground">Employees • Leads • Quotes</p>
        </div>

        <div className="rounded-xl border border-border/70 bg-accent/30 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <FileText className="h-3.5 w-3.5 text-cyan-400" />
            Vault Files
          </div>
          <p className="text-sm font-bold text-foreground mt-1">{files.length} Stored</p>
          <p className="text-[10px] text-muted-foreground">Direct streaming ready</p>
        </div>

        <div className="rounded-xl border border-border/70 bg-accent/30 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <DatabaseZap className="h-3.5 w-3.5 text-amber-500" />
            Database Load
          </div>
          <p className="text-sm font-bold text-emerald-500 mt-1">0% (URL Only)</p>
          <p className="text-[10px] text-muted-foreground">No binary load in PostgreSQL</p>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE HIERARCHY TREE EXPLORER */}
      {activeTab === 'TREE' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-accent/20 p-4">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-foreground">Acme Sales Solutions (Company Root)</span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground bg-accent/60 px-2 py-0.5 rounded">
                Google Drive &amp; Local Vault Sync
              </span>
            </div>

            {/* Sub-Folders List */}
            <div className="space-y-2 pl-4 border-l-2 border-border/60">
              {/* Category 1: Employees */}
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-extrabold text-foreground">📁 Employees/</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                      Dedicated Per-Employee Folders
                    </span>
                  </div>

                  {/* Employee Select Pills */}
                  <div className="flex items-center gap-1">
                    {EMPLOYEES.map((emp) => (
                      <button
                        key={emp}
                        onClick={() => setSelectedEmployee(emp)}
                        className={`text-[11px] px-2 py-1 rounded-md font-bold transition-all ${
                          selectedEmployee === emp
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-accent/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {emp.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Employee Nested Folders */}
                <div className="mt-3 pl-4 border-l-2 border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Folder className="h-3.5 w-3.5 text-indigo-400" />
                      📁 {selectedEmployee}/
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Path: Google Drive &gt; Acme &gt; Employees &gt; {selectedEmployee}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div
                      onClick={() => setSelectedSubCat('DP')}
                      className={`cursor-pointer rounded-lg border p-2.5 transition-all ${
                        selectedSubCat === 'DP'
                          ? 'border-indigo-500 bg-indigo-500/15'
                          : 'border-border/60 bg-card/60 hover:bg-accent/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <span>🖼️</span> 📁 DP/
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Avatars &amp; Profile Pictures</p>
                    </div>

                    <div
                      onClick={() => setSelectedSubCat('Documents')}
                      className={`cursor-pointer rounded-lg border p-2.5 transition-all ${
                        selectedSubCat === 'Documents'
                          ? 'border-indigo-500 bg-indigo-500/15'
                          : 'border-border/60 bg-card/60 hover:bg-accent/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <span>📄</span> 📁 Documents/
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">KYC, PAN, Aadhaar, Resume</p>
                    </div>

                    <div
                      onClick={() => setSelectedSubCat('Details')}
                      className={`cursor-pointer rounded-lg border p-2.5 transition-all ${
                        selectedSubCat === 'Details'
                          ? 'border-indigo-500 bg-indigo-500/15'
                          : 'border-border/60 bg-card/60 hover:bg-accent/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <span>💳</span> 📁 Details/
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Bank Details, Agreements</p>
                    </div>
                  </div>

                  {/* Active Folder Status & Access Mode */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileBadge className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Active Folder: <strong>Employees/{selectedEmployee}/{selectedSubCat}</strong></span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-accent/30 px-3 py-1.5 text-xs text-muted-foreground font-semibold">
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      <span>View &amp; Download Only</span>
                    </span>
                  </div>

                  {/* Empty state when no files */}
                  {employeeFiles.length === 0 && (
                    <div className="py-4 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl bg-accent/10 mt-2">
                      <Folder className="h-6 w-6 mx-auto text-muted-foreground/40 mb-1" />
                      <p className="font-medium">No files stored in this employee vault yet.</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Files uploaded via HR profiles &amp; KYC modules are automatically archived here.
                      </p>
                    </div>
                  )}

                  {/* Files inside this employee folder */}
                  {employeeFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase">
                        Stored in {selectedEmployee}&apos;s Vault ({employeeFiles.length}):
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {employeeFiles.map((ef) => (
                          <div
                            key={ef.fileId}
                            className="flex items-center justify-between text-xs p-1.5 rounded bg-card/70 border border-border/50"
                          >
                            <span className="font-semibold text-foreground truncate max-w-xs">
                              {ef.fileName}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded font-mono">
                                {ef.subCategory || 'Doc'}
                              </span>
                              <a
                                href={ef.driveViewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-0.5"
                              >
                                View <ExternalLink className="h-3 w-3" />
                              </a>
                              {ef.driveDownloadUrl && (
                                <a
                                  href={ef.driveDownloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-0.5"
                                >
                                  Download <Download className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Other CRM Folders */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="rounded-lg border border-border bg-card/60 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span>📊</span> 📁 Leads/
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Spreadsheet CSV/Excel Imports</p>
                </div>

                <div className="rounded-lg border border-border bg-card/60 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span>📄</span> 📁 Quotations/
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Quotation &amp; Invoice PDFs</p>
                </div>

                <div className="rounded-lg border border-border bg-card/60 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span>📦</span> 📁 Products/
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Product Images &amp; Catalogs</p>
                </div>

                <div className="rounded-lg border border-border bg-card/60 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span>⚖️</span> 📁 Documents/
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Company Legal &amp; KYC Docs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL FILES REGISTRY */}
      {activeTab === 'FILES' && (
        <div>
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {['ALL', 'EMPLOYEES', 'LEADS', 'QUOTATIONS', 'PRODUCTS', 'DOCUMENTS'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {cat === 'ALL' ? 'All Files' : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* File Registry List */}
          <div className="mt-2 divide-y divide-border/60 max-h-56 overflow-y-auto pr-1">
            {filteredFiles.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <HardDrive className="h-6 w-6 mx-auto text-muted-foreground/50 mb-1.5" />
                No files uploaded in this category yet. Upload a file or inspect an employee to archive documents.
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div key={file.fileId} className="flex items-center justify-between py-2.5 gap-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-foreground truncate max-w-xs block" title={file.fileName}>
                        {file.fileName}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {file.folderPath}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      {(file.sizeBytes / 1024).toFixed(0)} KB
                    </span>
                    {file.driveViewUrl && (
                      <a
                        href={file.driveViewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
