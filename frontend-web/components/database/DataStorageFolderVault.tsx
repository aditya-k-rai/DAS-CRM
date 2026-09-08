'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Folder,
  FileBadge,
  Mail,
  Send,
  Download,
  Check,
  Clock,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  ChevronRight,
  Lock,
  Archive,
  FileSpreadsheet,
  Package,
  Receipt,
  Scale
} from 'lucide-react';
import {
  checkGoogleDriveStatus,
  listGoogleDriveFiles,
  requestFolderDataOnEmail,
  getFolderMailRequests,
  GoogleDriveConnectionStatus,
  GoogleDriveStoredFile,
  FolderMailRequestResult,
} from '../../lib/googleDriveService';
import { useAuth } from '@/context/AuthContext';

export const DataStorageFolderVault: React.FC = () => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<GoogleDriveConnectionStatus | null>(null);
  const [files, setFiles] = useState<GoogleDriveStoredFile[]>([]);
  const [mailRequests, setMailRequests] = useState<FolderMailRequestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'HIERARCHY' | 'FILES' | 'MAIL_LOGS'>('HIERARCHY');

  // Selected hierarchy node state
  const [activeMainFolder, setActiveMainFolder] = useState<'EMPLOYEES' | 'LEADS' | 'QUOTATIONS' | 'PRODUCTS' | 'DOCUMENTS'>('EMPLOYEES');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('Amit Shah');
  const [selectedSubCat, setSelectedSubCat] = useState<'DP' | 'Documents' | 'Details'>('Documents');

  // Email request modal state
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailTargetFolder, setMailTargetFolder] = useState<string>('Employees/Amit Shah/Documents');
  const [mailRecipient, setMailRecipient] = useState<string>('');
  const [mailFormat, setMailFormat] = useState<'ZIP' | 'CSV_MANIFEST' | 'SECURE_LINK'>('ZIP');
  const [mailNotes, setMailNotes] = useState<string>('');
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [mailSuccessToast, setMailSuccessToast] = useState<string | null>(null);

  const EMPLOYEES = ['Amit Shah', 'Priya Sharma', 'Sunita Verma', 'Amit Patel'];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [st, fl, ml] = await Promise.all([
        checkGoogleDriveStatus(),
        listGoogleDriveFiles(),
        getFolderMailRequests(),
      ]);
      setStatus(st);
      setFiles(fl);
      setMailRequests(ml);
    } catch (err) {
      console.warn('Failed to fetch Drive storage data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (currentUser?.email) {
      setMailRecipient(currentUser.email);
    }
  }, [currentUser]);

  // Compute active folder path
  const getActiveFolderPath = (): string => {
    if (activeMainFolder === 'EMPLOYEES') {
      return `Employees/${selectedEmployee}/${selectedSubCat}`;
    }
    if (activeMainFolder === 'LEADS') return 'Leads/Spreadsheets & Ingestions';
    if (activeMainFolder === 'QUOTATIONS') return 'Quotations & Invoices';
    if (activeMainFolder === 'PRODUCTS') return 'Products/Media & Specs';
    if (activeMainFolder === 'DOCUMENTS') return 'Documents/Company Legal & KYC';
    return 'Company Root';
  };

  const handleOpenMailModal = (folderPathOverride?: string) => {
    const target = folderPathOverride || getActiveFolderPath();
    setMailTargetFolder(target);
    if (currentUser?.email) {
      setMailRecipient(currentUser.email);
    }
    setShowMailModal(true);
  };

  const handleSendFolderEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailRecipient.trim()) return;

    setIsSendingMail(true);
    try {
      const result = await requestFolderDataOnEmail({
        folderPath: mailTargetFolder,
        recipientEmail: mailRecipient.trim(),
        category: activeMainFolder,
        employeeName: activeMainFolder === 'EMPLOYEES' ? selectedEmployee : undefined,
        subCategory: activeMainFolder === 'EMPLOYEES' ? selectedSubCat : undefined,
        format: mailFormat,
        notes: mailNotes.trim(),
      });

      setMailRequests(prev => [result, ...prev]);
      setShowMailModal(false);
      setMailSuccessToast(`✅ Folder data package [${mailTargetFolder}] dispatched to ${mailRecipient}!`);
      setTimeout(() => setMailSuccessToast(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch email request');
    } finally {
      setIsSendingMail(false);
    }
  };

  const currentFolderFiles = files.filter(f => {
    if (activeMainFolder === 'EMPLOYEES') {
      return f.employeeName?.toLowerCase() === selectedEmployee.toLowerCase() &&
        (!f.subCategory || f.subCategory.toLowerCase() === selectedSubCat.toLowerCase());
    }
    return f.category === activeMainFolder;
  });

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {mailSuccessToast && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{mailSuccessToast}</p>
              <p className="text-xs text-emerald-400/80">The requested package has been compiled and emailed to the admin.</p>
            </div>
          </div>
          <button
            onClick={() => setMailSuccessToast(null)}
            className="text-xs font-bold px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Top Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl backdrop-blur-md">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
              <Cloud className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-black text-xl text-foreground tracking-tight">
                  Google Drive Multi-Tenant Vault
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Service Account Connected
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Hierarchical folder structure: <span className="text-foreground/80 font-medium">Company</span> &gt; <span className="text-foreground/80 font-medium">Employees</span> &gt; <span className="text-indigo-400 font-semibold">[Employee Name]</span> &gt; <span className="text-foreground/80 font-medium">[DP | Documents | Details]</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-border bg-accent/30 p-1 text-xs font-bold">
              <button
                onClick={() => setViewMode('HIERARCHY')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all ${
                  viewMode === 'HIERARCHY'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FolderTree className="h-3.5 w-3.5" />
                Folder Hierarchy
              </button>
              <button
                onClick={() => setViewMode('FILES')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all ${
                  viewMode === 'FILES'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                All Files ({files.length})
              </button>
              <button
                onClick={() => setViewMode('MAIL_LOGS')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all ${
                  viewMode === 'MAIL_LOGS'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                Mail Logs ({mailRequests.length})
              </button>
            </div>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-indigo-500/50 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              Sync
            </button>

            <button
              onClick={() => handleOpenMailModal('Company Root (All Data)')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Mail className="h-3.5 w-3.5" />
              Request Data on Mail
            </button>
          </div>
        </div>

        {/* 4 Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Identity */}
          <div className="rounded-xl border border-border/70 bg-gradient-to-br from-card to-accent/20 p-4 transition-all hover:border-emerald-500/40">
            <div className="flex items-center gap-2 text-emerald-400 mb-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Identity</span>
            </div>
            <div className="font-mono text-sm font-black text-foreground truncate">
              das-crm-drive
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Project: <span className="font-semibold text-foreground/80">das-crm-506400</span>
            </p>
          </div>

          {/* Card 2: Folder Organization */}
          <div className="rounded-xl border border-border/70 bg-gradient-to-br from-card to-accent/20 p-4 transition-all hover:border-indigo-500/40">
            <div className="flex items-center gap-2 text-indigo-400 mb-1.5">
              <FolderTree className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Folder Organization</span>
            </div>
            <div className="text-sm font-black text-foreground">
              Dedicated Folders
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              Employees • Leads • Quotes • Products
            </p>
          </div>

          {/* Card 3: Vault Files */}
          <div className="rounded-xl border border-border/70 bg-gradient-to-br from-card to-accent/20 p-4 transition-all hover:border-cyan-500/40">
            <div className="flex items-center gap-2 text-cyan-400 mb-1.5">
              <FileText className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Vault Files</span>
            </div>
            <div className="text-sm font-black text-foreground">
              {files.length} Stored
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Direct streaming ready
            </p>
          </div>

          {/* Card 4: Database Load */}
          <div className="rounded-xl border border-border/70 bg-gradient-to-br from-card to-accent/20 p-4 transition-all hover:border-amber-500/40">
            <div className="flex items-center gap-2 text-amber-400 mb-1.5">
              <DatabaseZap className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Database Load</span>
            </div>
            <div className="text-sm font-black text-emerald-400">
              0% (URL Only)
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              No binary load in PostgreSQL
            </p>
          </div>
        </div>

        {/* View Mode Content */}
        {viewMode === 'HIERARCHY' && (
          <div className="mt-6 border border-border/70 rounded-2xl bg-accent/10 p-5 space-y-5">
            {/* Company Root Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📁</span>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">
                    Acme Sales Solutions (Company Root)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Google Drive &amp; Local Vault Multi-Tenant Sync
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenMailModal(getActiveFolderPath())}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 text-xs font-bold transition-all"
                >
                  <Mail className="h-3.5 w-3.5 text-indigo-400" />
                  Email This Folder
                </button>
              </div>
            </div>

            {/* Folder Tabs / Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                onClick={() => setActiveMainFolder('EMPLOYEES')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                  activeMainFolder === 'EMPLOYEES'
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-bold shadow-sm'
                    : 'border-border/60 bg-card hover:bg-accent/40 text-muted-foreground'
                }`}
              >
                <User className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-extrabold">Employees/</div>
                  <div className="text-[10px] opacity-70 truncate">Per-Employee Vaults</div>
                </div>
              </button>

              <button
                onClick={() => setActiveMainFolder('LEADS')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                  activeMainFolder === 'LEADS'
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-bold shadow-sm'
                    : 'border-border/60 bg-card hover:bg-accent/40 text-muted-foreground'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-extrabold">Leads/</div>
                  <div className="text-[10px] opacity-70 truncate">CSVs &amp; Ingestions</div>
                </div>
              </button>

              <button
                onClick={() => setActiveMainFolder('QUOTATIONS')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                  activeMainFolder === 'QUOTATIONS'
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-bold shadow-sm'
                    : 'border-border/60 bg-card hover:bg-accent/40 text-muted-foreground'
                }`}
              >
                <Receipt className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-extrabold">Quotations/</div>
                  <div className="text-[10px] opacity-70 truncate">Invoices &amp; Quotes</div>
                </div>
              </button>

              <button
                onClick={() => setActiveMainFolder('PRODUCTS')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                  activeMainFolder === 'PRODUCTS'
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-bold shadow-sm'
                    : 'border-border/60 bg-card hover:bg-accent/40 text-muted-foreground'
                }`}
              >
                <Package className="h-4 w-4 text-purple-400 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-extrabold">Products/</div>
                  <div className="text-[10px] opacity-70 truncate">Images &amp; Specs</div>
                </div>
              </button>

              <button
                onClick={() => setActiveMainFolder('DOCUMENTS')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                  activeMainFolder === 'DOCUMENTS'
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-bold shadow-sm'
                    : 'border-border/60 bg-card hover:bg-accent/40 text-muted-foreground'
                }`}
              >
                <Scale className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-extrabold">Documents/</div>
                  <div className="text-[10px] opacity-70 truncate">Legal &amp; KYC</div>
                </div>
              </button>
            </div>

            {/* If EMPLOYEES is selected, render employee tree */}
            {activeMainFolder === 'EMPLOYEES' && (
              <div className="rounded-xl border border-border/80 bg-card/70 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <span className="font-bold text-sm text-foreground">Employees/</span>
                    <span className="text-xs rounded-full bg-indigo-500/15 text-indigo-400 px-2.5 py-0.5 font-medium border border-indigo-500/30">
                      Dedicated Per-Employee Folders
                    </span>
                  </div>

                  {/* Employee chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {EMPLOYEES.map(emp => (
                      <button
                        key={emp}
                        onClick={() => setSelectedEmployee(emp)}
                        className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                          selectedEmployee === emp
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-accent/40 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {emp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategory Folders for Employee */}
                <div className="pl-2 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Folder className="h-4 w-4 text-amber-400" />
                    <span className="text-foreground font-bold">{selectedEmployee}/</span>
                    <span className="text-muted-foreground/80 font-mono text-[11px]">
                      Path: Google Drive &gt; Acme &gt; Employees &gt; {selectedEmployee}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedSubCat('DP')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selectedSubCat === 'DP'
                          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/50'
                          : 'border-border bg-accent/20 hover:bg-accent/40 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <span>🖼️</span>
                        <span>📁 DP/</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Avatars &amp; Profile Pictures
                      </p>
                    </button>

                    <button
                      onClick={() => setSelectedSubCat('Documents')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selectedSubCat === 'Documents'
                          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/50'
                          : 'border-border bg-accent/20 hover:bg-accent/40 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <span>📑</span>
                        <span>📁 Documents/</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        KYC, PAN, Aadhaar, Resume
                      </p>
                    </button>

                    <button
                      onClick={() => setSelectedSubCat('Details')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selectedSubCat === 'Details'
                          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/50'
                          : 'border-border bg-accent/20 hover:bg-accent/40 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <span>💳</span>
                        <span>📁 Details/</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Bank Details, Agreements
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Folder Actions & File Viewer */}
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-400">📂</span>
                  <span className="text-muted-foreground">Active Folder:</span>
                  <span className="font-extrabold text-foreground font-mono">
                    {getActiveFolderPath()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-accent/30 px-3 py-1.5 text-xs text-muted-foreground font-semibold">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>View &amp; Download Only</span>
                  </span>

                  <button
                    onClick={() => handleOpenMailModal(getActiveFolderPath())}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-pink-600/15 border border-pink-500/30 text-pink-300 hover:bg-pink-500/25 font-bold text-xs transition-all"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Request Folder on Mail
                  </button>
                </div>
              </div>

              {/* Files Table for Selected Folder */}
              {currentFolderFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-xs font-medium">No files stored in this folder yet.</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5 max-w-md mx-auto">
                    Files uploaded through CRM modules (Employee Profiles, KYC, Leads, Quotations, Products) are automatically fetched and stored here in Google Drive.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {currentFolderFiles.map(file => (
                    <div
                      key={file.fileId}
                      className="flex items-center justify-between py-2.5 px-1 hover:bg-accent/20 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-foreground">{file.fileName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {file.folderPath} • {(file.sizeBytes / 1024).toFixed(1)} KB • {file.uploadedAt}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {file.driveViewUrl && (
                          <a
                            href={file.driveViewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded bg-accent/40 hover:bg-accent text-xs font-semibold text-foreground transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {file.driveDownloadUrl && (
                          <a
                            href={file.driveDownloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 text-xs font-semibold transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Mode: ALL FILES */}
        {viewMode === 'FILES' && (
          <div className="mt-6 border border-border/70 rounded-2xl bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground">
                All Multi-Tenant Vault Files ({files.length})
              </h3>
              <button
                onClick={() => handleOpenMailModal('All Files Vault Dump')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 transition-all"
              >
                <Mail className="h-3.5 w-3.5" />
                Email Entire Archive
              </button>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                No files found in vault.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-bold">
                      <th className="pb-2.5">File Name</th>
                      <th className="pb-2.5">Category / Path</th>
                      <th className="pb-2.5">Employee</th>
                      <th className="pb-2.5">Size</th>
                      <th className="pb-2.5">Uploaded</th>
                      <th className="pb-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {files.map(f => (
                      <tr key={f.fileId} className="hover:bg-accent/20 transition-colors">
                        <td className="py-2.5 font-bold text-foreground flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-indigo-400" />
                          {f.fileName}
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-muted-foreground">{f.folderPath}</td>
                        <td className="py-2.5 font-semibold text-foreground/90">{f.employeeName || '—'}</td>
                        <td className="py-2.5 text-muted-foreground">{(f.sizeBytes / 1024).toFixed(1)} KB</td>
                        <td className="py-2.5 text-muted-foreground">{f.uploadedAt}</td>
                        <td className="py-2.5 text-right">
                          {f.driveDownloadUrl && (
                            <a
                              href={f.driveDownloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* View Mode: MAIL LOGS */}
        {viewMode === 'MAIL_LOGS' && (
          <div className="mt-6 border border-border/70 rounded-2xl bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-400" />
                  Admin Folder Data Email Requests History
                </h3>
                <p className="text-xs text-muted-foreground">
                  Audit log of all folder-wise data packages requested and delivered via email.
                </p>
              </div>

              <button
                onClick={() => handleOpenMailModal()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md hover:opacity-95 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                New Email Request
              </button>
            </div>

            {mailRequests.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                No email requests sent yet. Click &quot;New Email Request&quot; to export any folder.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-bold">
                      <th className="pb-2.5">Folder Path</th>
                      <th className="pb-2.5">Recipient Admin Email</th>
                      <th className="pb-2.5">Format</th>
                      <th className="pb-2.5">Files / Size</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5">Requested At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {mailRequests.map(r => (
                      <tr key={r.requestId} className="hover:bg-accent/20 transition-colors">
                        <td className="py-3 font-bold text-foreground font-mono text-[11px]">{r.folderPath}</td>
                        <td className="py-3 font-semibold text-indigo-300">{r.recipientEmail}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded bg-accent text-[10px] font-bold">
                            {r.format}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {r.fileCount} files ({r.totalSizeMb})
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                            <Check className="h-2.5 w-2.5" />
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground">{new Date(r.requestedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Request Folder Data on Email */}
      {showMailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground">
                    Request Folder Data via Email
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Compile and send folder contents directly to your inbox
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMailModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 rounded-lg hover:bg-accent"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendFolderEmail} className="space-y-4 text-xs">
              {/* Target Folder */}
              <div>
                <label className="block font-bold text-foreground mb-1">
                  Target Folder Path
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={mailTargetFolder}
                    onChange={(e) => setMailTargetFolder(e.target.value)}
                    required
                    placeholder="e.g. Employees/Amit Shah/Documents"
                    className="w-full rounded-xl border border-border bg-accent/30 px-3.5 py-2.5 font-mono text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  You can specify specific subfolders like <code className="text-indigo-400">Employees/Amit Shah</code> or <code className="text-indigo-400">Leads</code> or <code className="text-indigo-400">Company Root (All Data)</code>.
                </p>
              </div>

              {/* Recipient Email */}
              <div>
                <label className="block font-bold text-foreground mb-1">
                  Admin Recipient Email
                </label>
                <input
                  type="email"
                  value={mailRecipient}
                  onChange={(e) => setMailRecipient(e.target.value)}
                  required
                  placeholder="admin@company.com"
                  className="w-full rounded-xl border border-border bg-accent/30 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Export Format */}
              <div>
                <label className="block font-bold text-foreground mb-1">
                  Package Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMailFormat('ZIP')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      mailFormat === 'ZIP'
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500'
                        : 'border-border bg-accent/20 text-muted-foreground hover:bg-accent/40'
                    }`}
                  >
                    📦 ZIP Archive
                  </button>
                  <button
                    type="button"
                    onClick={() => setMailFormat('CSV_MANIFEST')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      mailFormat === 'CSV_MANIFEST'
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500'
                        : 'border-border bg-accent/20 text-muted-foreground hover:bg-accent/40'
                    }`}
                  >
                    📊 CSV Manifest
                  </button>
                  <button
                    type="button"
                    onClick={() => setMailFormat('SECURE_LINK')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      mailFormat === 'SECURE_LINK'
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500'
                        : 'border-border bg-accent/20 text-muted-foreground hover:bg-accent/40'
                    }`}
                  >
                    🔗 Cloud Link
                  </button>
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block font-bold text-foreground mb-1">
                  Internal Notes / Audit Memo (Optional)
                </label>
                <textarea
                  value={mailNotes}
                  onChange={(e) => setMailNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Q3 Compliance verification audit export"
                  className="w-full rounded-xl border border-border bg-accent/30 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowMailModal(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-accent/40 hover:bg-accent text-muted-foreground hover:text-foreground font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingMail}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
                >
                  {isSendingMail ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Dispatching to Email...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send Folder Data to Mail
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
