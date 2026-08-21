'use client';

import { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Download, Smartphone, Laptop, CheckCircle2, Shield, Edit3, FileText, Sparkles, Save } from 'lucide-react';
import { useAuth, normalizeRoleStr } from '@/context/AuthContext';

interface ReleaseInfo {
  version: string;
  releaseDate: string;
  androidApkUrl: string;
  androidSize: string;
  macDmgUrl: string;
  macSize: string;
  readmeTitle: string;
  readmeMarkdown: string;
  features: string[];
}

const DEFAULT_RELEASE: ReleaseInfo = {
  version: 'v2.5.0 Stable',
  releaseDate: 'August 19, 2026',
  androidApkUrl: 'https://github.com/aditya-k-rai/DAS-CRM/releases/download/v2.5.0/DAS-CRM-v2.5.0.apk',
  androidSize: '24.8 MB',
  macDmgUrl: 'https://github.com/aditya-k-rai/DAS-CRM/releases/download/v2.5.0/DAS-CRM-v2.5.0.dmg',
  macSize: '68.5 MB',
  readmeTitle: '🚀 DAS CRM v2.5.0 — Major Mobile & Desktop Release',
  readmeMarkdown: `### 🌟 Highlights & Major Features in v2.5.0:

1. **⚡ Real-Time Camera Attendance & Geo-Fencing Verification**:
   - Front & Back camera turn functionality for selfie verification.
   - High-accuracy GPS geo-fencing distance calculation with interactive map auditing.

2. **🎯 3-Model Lead Funnel Engine & Column Drag/Shift Controls**:
   - Auto-Round-Robin, Quota Cap, and Vanish Pool lead routing models.
   - Interactive column re-ordering, column renaming, and admin record editing.

3. **📞 Android Ephemeral Call Telemetry & Midnight Auto-Purge**:
   - Device call log sync with connected phone matching.
   - 1-day local call log storage with automated 00:00:00 midnight auto-purge.

4. **💼 Leaving Employee Lead & Work Handover Engine**:
   - Admin authority to re-allocate departing staff member's active leads and deal pipeline.
   - Enforced Manager scope rules for team subordinates.

5. **🟢 Google Sheets Live 2-Way Sync & CSV/Excel Ingestion**:
   - Connect published Google Sheets web URLs with live 2-way sync status.
   - Multi-column auto-mapping engine for CSV, XLSX, and XLS files.`,
  features: [
    'Real-time Camera & Geo-Fencing Verification',
    '3-Model Lead Funnel Routing Engine',
    '1-Day Ephemeral Call History Sync & Midnight Purge',
    'Admin Leaving Employee Lead Handover Engine',
    'Google Sheets Live 2-Way Sync Connector',
    'Multi-Format CSV & Excel Ingestion',
  ],
};

export default function DownloadsPage() {
  const { currentUser } = useAuth();
  const [release, setRelease] = useState<ReleaseInfo>(DEFAULT_RELEASE);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Edit form state for Super Admin
  const [editVersion, setEditVersion] = useState('');
  const [editAndroidUrl, setEditAndroidUrl] = useState('');
  const [editAndroidSize, setEditAndroidSize] = useState('24.8 MB');
  const [editMacUrl, setEditMacUrl] = useState('');
  const [editMacSize, setEditMacSize] = useState('68.5 MB');
  const [editTitle, setEditTitle] = useState('');
  const [editMarkdown, setEditMarkdown] = useState('');
  const [downloadMsg, setDownloadMsg] = useState('');
  const [apkUploadStatus, setApkUploadStatus] = useState('');
  const [dmgUploadStatus, setDmgUploadStatus] = useState('');

  const currentRole = normalizeRoleStr(currentUser?.role);
  const canManageRelease = currentRole === 'SUPER_ADMIN';

  useEffect(() => {
    const saved = localStorage.getItem('das_crm_release_info');
    if (saved) {
      try {
        setRelease(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const openEditor = () => {
    setEditVersion(release.version);
    setEditAndroidUrl(release.androidApkUrl);
    setEditAndroidSize(release.androidSize);
    setEditMacUrl(release.macDmgUrl);
    setEditMacSize(release.macSize);
    setEditTitle(release.readmeTitle);
    setEditMarkdown(release.readmeMarkdown);
    setApkUploadStatus('');
    setDmgUploadStatus('');
    setEditModalOpen(true);
  };

  const saveRelease = () => {
    const updated: ReleaseInfo = {
      ...release,
      version: editVersion,
      androidApkUrl: editAndroidUrl,
      androidSize: editAndroidSize,
      macDmgUrl: editMacUrl,
      macSize: editMacSize,
      readmeTitle: editTitle,
      readmeMarkdown: editMarkdown,
    };
    setRelease(updated);
    localStorage.setItem('das_crm_release_info', JSON.stringify(updated));
    setEditModalOpen(false);
    alert('✅ Release Readme, APK & DMG Files updated successfully!');
  };

  const handleDownloadAndroid = () => {
    setDownloadMsg('🤖 Triggering Direct Android APK Download (24.8 MB)...');
    setTimeout(() => setDownloadMsg(''), 4000);
    window.open(release.androidApkUrl, '_blank');
  };

  const handleDownloadMac = () => {
    setDownloadMsg('🍏 Triggering Direct Mac Desktop DMG Download (68.5 MB)...');
    setTimeout(() => setDownloadMsg(''), 4000);
    window.open(release.macDmgUrl, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-white">
      <Topbar
        title="DAS CRM Direct App Downloads"
        actions={
          canManageRelease ? (
            <button
              onClick={openEditor}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Edit3 size={14} />
              <span>Edit Release Readme &amp; Notes (Super Admin)</span>
            </button>
          ) : undefined
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 max-w-6xl mx-auto w-full">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold">
                <Sparkles size={13} />
                <span>LATEST STABLE RELEASE • {release.version}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Download Official DAS CRM Native Apps
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Install DAS CRM directly on your Android smartphone or macOS desktop computer for instant real-time synchronization, offline telemetry, and native hardware features.
              </p>
            </div>

            {canManageRelease && (
              <button
                onClick={openEditor}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all flex-shrink-0"
              >
                <FileText size={15} />
                <span>Upload &amp; Manage Readme</span>
              </button>
            )}
          </div>
        </div>

        {downloadMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-bounce">
            {downloadMsg}
          </div>
        )}

        {/* 🚀 DOWNLOAD BUTTON CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 🤖 ANDROID DOWNLOAD CARD */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/60 transition-all shadow-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
                  <Smartphone size={26} />
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold">
                  Android APK • {release.androidSize}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">DAS CRM for Android</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Full mobile suite with Geo-Fencing, Camera Attendance Selfie verification, WhatsApp quick launchers, and 1-Day Call Telemetry Auto-Purge.
                </p>
              </div>

              <div className="pt-2 space-y-1.5">
                {['Requires Android 8.0 (API 26) or higher', 'Geo-Fencing & Camera Permissions Supported', 'Direct In-App APK Updater Built-in'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleDownloadAndroid}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Download size={18} />
              <span>🤖 Download in Android (.apk Direct)</span>
            </button>
          </div>

          {/* 🍏 MAC DOWNLOAD CARD */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-sky-500/30 hover:border-sky-500/60 transition-all shadow-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shadow-lg">
                  <Laptop size={26} />
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold">
                  macOS DMG • {release.macSize}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">DAS CRM for macOS (Mac)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Native Apple Silicon (M1/M2/M3) &amp; Intel desktop app with multi-window CRM control, desktop push notifications, and high-performance lead pipeline.
                </p>
              </div>

              <div className="pt-2 space-y-1.5">
                {['Supports macOS 12.0 (Monterey) or higher', 'Universal Binary for M-Series & Intel Chips', 'Keyboard Shortcuts & Native Windowing'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 size={14} className="text-sky-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleDownloadMac}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Download size={18} />
              <span>🍏 Download in Mac (.dmg Direct)</span>
            </button>
          </div>
        </div>

        {/* 📝 RELEASE README & UPDATE FEATURES SECTION */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-indigo-400" />
              <h3 className="text-base font-extrabold text-white">{release.readmeTitle}</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Released {release.releaseDate}</span>
          </div>

          <div className="prose prose-invert prose-xs max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
            {release.readmeMarkdown}
          </div>
        </div>

      </main>

      {/* 📝 SUPER ADMIN EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">Super Admin Readme &amp; Release Editor</h3>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Release Version Tag</label>
                <input
                  type="text"
                  value={editVersion}
                  onChange={e => setEditVersion(e.target.value)}
                  className="crm-input w-full text-xs font-mono bg-slate-950 text-indigo-400"
                />
              </div>

              {/* 🤖 ANDROID APK FILE UPLOADER */}
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-emerald-400 font-extrabold flex items-center gap-1.5">
                    <span>🤖 Upload New Android APK File (.apk)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">{editAndroidSize}</span>
                </div>
                <input
                  type="file"
                  accept=".apk"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                      const blobUrl = URL.createObjectURL(file);
                      setEditAndroidUrl(blobUrl);
                      setEditAndroidSize(sizeMb);
                      setApkUploadStatus(`✅ Uploaded ${file.name} (${sizeMb})`);
                    }
                  }}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                />
                {apkUploadStatus && (
                  <p className="text-[11px] text-emerald-400 font-bold">{apkUploadStatus}</p>
                )}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Direct APK Download URL</label>
                  <input
                    type="text"
                    value={editAndroidUrl}
                    onChange={e => setEditAndroidUrl(e.target.value)}
                    className="crm-input w-full text-xs font-mono bg-slate-900 text-emerald-400"
                  />
                </div>
              </div>

              {/* 🍏 MAC DMG FILE UPLOADER */}
              <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sky-400 font-extrabold flex items-center gap-1.5">
                    <span>🍏 Upload New Mac Desktop App File (.dmg, .zip)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">{editMacSize}</span>
                </div>
                <input
                  type="file"
                  accept=".dmg,.zip,.pkg"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                      const blobUrl = URL.createObjectURL(file);
                      setEditMacUrl(blobUrl);
                      setEditMacSize(sizeMb);
                      setDmgUploadStatus(`✅ Uploaded ${file.name} (${sizeMb})`);
                    }
                  }}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-sky-600 file:text-white hover:file:bg-sky-500 cursor-pointer"
                />
                {dmgUploadStatus && (
                  <p className="text-[11px] text-sky-400 font-bold">{dmgUploadStatus}</p>
                )}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Direct DMG Download URL</label>
                  <input
                    type="text"
                    value={editMacUrl}
                    onChange={e => setEditMacUrl(e.target.value)}
                    className="crm-input w-full text-xs font-mono bg-slate-900 text-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Readme Header Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="crm-input w-full text-xs bg-slate-950 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Readme Markdown / Update Features Text</label>
                <textarea
                  rows={6}
                  value={editMarkdown}
                  onChange={e => setEditMarkdown(e.target.value)}
                  className="crm-input w-full text-xs font-mono bg-slate-950 text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveRelease}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all"
              >
                <Save size={14} />
                <span>Save Readme &amp; Release Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
