'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  ExternalLink,
  FileText,
  Upload,
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
  uploadEmployeeDpToDrive,
  uploadEmployeeDocumentToDrive,
  uploadEmployeeDetailToDrive,
  GoogleDriveStoredFile,
  GoogleDriveUploadProgress,
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
  const [uploadProgress, setUploadProgress] = useState<GoogleDriveUploadProgress | null>(null);
  const [docLabel, setDocLabel] = useState<string>('PAN_Card');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (activeSubFolder === 'DP') {
        await uploadEmployeeDpToDrive(file, employee.name, companyName, (p) => {
          setUploadProgress(p);
        });
      } else if (activeSubFolder === 'Documents') {
        await uploadEmployeeDocumentToDrive(file, employee.name, docLabel, companyName, (p) => {
          setUploadProgress(p);
        });
      } else {
        await uploadEmployeeDetailToDrive(file, employee.name, docLabel, companyName, (p) => {
          setUploadProgress(p);
        });
      }

      await fetchFiles();
      setTimeout(() => setUploadProgress(null), 3500);
    } catch (err) {
      console.error('Failed to upload file to employee drive vault:', err);
      setUploadProgress(null);
    }
  };

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
            onClick={() => { setActiveSubFolder('DP'); setDocLabel('Avatar_DP'); }}
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
            onClick={() => { setActiveSubFolder('Documents'); setDocLabel('Aadhaar_Card'); }}
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
            onClick={() => { setActiveSubFolder('Details'); setDocLabel('Bank_Passbook'); }}
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

        {/* Upload Action Box */}
        <div className="rounded-2xl border border-dashed border-indigo-500/40 bg-indigo-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-foreground">
                Target Folder: <strong>Employees / {employee.name} / {activeSubFolder}</strong>
              </span>
            </div>

            {activeSubFolder !== 'DP' && (
              <select
                value={docLabel}
                onChange={(e) => setDocLabel(e.target.value)}
                className="bg-card border border-border rounded-lg text-xs px-2.5 py-1 text-foreground font-semibold focus:outline-none focus:border-indigo-500"
              >
                {activeSubFolder === 'Documents' ? (
                  <>
                    <option value="Aadhaar_Card">Aadhaar Card (PDF/Img)</option>
                    <option value="PAN_Card">PAN Card (PDF/Img)</option>
                    <option value="Degree_Certificate">Degree Certificate</option>
                    <option value="Offer_Letter">Offer Letter</option>
                    <option value="Resume_CV">Resume / CV</option>
                  </>
                ) : (
                  <>
                    <option value="Bank_Passbook">Bank Passbook / Cheque</option>
                    <option value="Employment_Agreement">Employment Agreement</option>
                    <option value="Performance_Review">Performance Review Slip</option>
                    <option value="Address_Proof">Address Proof Utility Bill</option>
                  </>
                )}
              </select>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-colors shadow-md"
            >
              <Upload className="h-4 w-4" />
              Upload {activeSubFolder === 'DP' ? 'Display Picture (DP)' : docLabel.replace('_', ' ')} to Google Drive
            </button>
          </div>

          {/* Live Upload Progress */}
          {uploadProgress && (
            <div className="rounded-xl border border-indigo-500/50 bg-indigo-950/50 p-3 space-y-1.5 animate-in fade-in">
              <div className="flex justify-between text-xs font-bold text-indigo-300">
                <span>Streaming {uploadProgress.fileName}...</span>
                <span>{uploadProgress.progressPercent}% ({uploadProgress.speedMbps} MB/s)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 transition-all duration-150"
                  style={{ width: `${uploadProgress.progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="truncate">Destination: {uploadProgress.folderPath}</span>
                <span className="text-emerald-400 font-bold shrink-0">DB Load: 0%</span>
              </div>
            </div>
          )}
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
                No files uploaded to this employee folder yet. Click upload above to store documents directly in Google Drive.
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
