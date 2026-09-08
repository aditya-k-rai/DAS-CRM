'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  ExternalLink,
  FileText,
  Lock,
  Download,
  X,
  CheckCircle2,
  HardDrive,
  Folder,
  Image as ImageIcon,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import {
  listEmployeeDriveFiles,
  GoogleDriveStoredFile,
} from '@/lib/googleDriveService';
import { EmployeeProfileWeb } from './EmployeeListWidget';

interface Props {
  employee: EmployeeProfileWeb;
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
}

export default function EmployeeDriveVaultModal({
  employee,
  isOpen,
  onClose,
  companyName = 'Acme Sales Solutions',
}: Props) {
  const [activeSubFolder, setActiveSubFolder] = useState<'DP' | 'Documents' | 'Details'>('Documents');
  const [files, setFiles] = useState<GoogleDriveStoredFile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const empFiles = await listEmployeeDriveFiles(employee.name, companyName);
      setFiles(empFiles);
    } catch (err) {
      console.warn('Could not load employee drive files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen, employee.name]);

  if (!isOpen) return null;

  const filteredSubFiles = files.filter(f => {
    if (activeSubFolder === 'DP') return f.subCategory === 'DP' || f.category === 'PROFILES';
    if (activeSubFolder === 'Documents') return f.subCategory === 'Documents' || !f.subCategory;
    if (activeSubFolder === 'Details') return f.subCategory === 'Details';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-foreground">
                  {employee.name}&apos;s Google Drive Vault
                </h3>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  {employee.code}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Path: <span className="font-mono text-indigo-400">Google Drive &gt; {companyName} &gt; Employees &gt; {employee.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-Folders Selector */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveSubFolder('DP')}
            className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
              activeSubFolder === 'DP'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : 'bg-accent/40 border-border text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            📁 DP / Avatars
          </button>

          <button
            onClick={() => setActiveSubFolder('Documents')}
            className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
              activeSubFolder === 'Documents'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : 'bg-accent/40 border-border text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <FileText className="h-4 w-4" />
            📁 Official Docs
          </button>

          <button
            onClick={() => setActiveSubFolder('Details')}
            className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
              activeSubFolder === 'Details'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : 'bg-accent/40 border-border text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            📁 Other Details
          </button>
        </div>

        {/* Drive Storage Policy & Path Header */}
        <div className="rounded-2xl border border-border/80 bg-accent/20 p-4 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-foreground">
                Vault Path: <strong>Employees / {employee.name} / {activeSubFolder}</strong>
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-accent/30 px-3 py-1.5 text-xs text-muted-foreground font-semibold">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span>View &amp; Download Only</span>
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Staff DP, official KYC documents, and banking credentials uploaded in the Employee Profile &amp; HR screens are automatically archived here in Google Drive.
          </p>
        </div>

        {/* Existing Files inside this Employee SubFolder */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
              Archived in {activeSubFolder}/ ({filteredSubFiles.length})
            </h4>
            <button
              onClick={fetchFiles}
              disabled={loading}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-border/60 rounded-xl border border-border/70 bg-accent/20 p-2">
            {filteredSubFiles.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <HardDrive className="h-5 w-5 mx-auto text-muted-foreground/40 mb-1" />
                No files archived in this employee vault yet. Upload profile pictures and KYC docs in the Employee Profile screen to archive them to Google Drive.
              </div>
            ) : (
              filteredSubFiles.map((file) => (
                <div key={file.fileId} className="flex items-center justify-between py-2 px-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground truncate block max-w-xs" title={file.fileName}>
                        {file.fileName}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {(file.sizeBytes / 1024).toFixed(0)} KB • {file.folderPath}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={file.driveViewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 font-bold text-xs"
                    >
                      View in Drive <ExternalLink className="h-3 w-3" />
                    </a>
                    {file.driveDownloadUrl && (
                      <a
                        href={file.driveDownloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 font-bold text-xs"
                      >
                        <Download className="h-3 w-3" /> Download
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <CheckCircle2 className="h-3.5 w-3.5" /> Direct Cloud Streaming
          </span>
          <span>Zero database blob overhead</span>
        </div>
      </div>
    </div>
  );
}
