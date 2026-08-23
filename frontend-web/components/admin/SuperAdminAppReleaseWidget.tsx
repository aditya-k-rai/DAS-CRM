'use client';

import React, { useState } from 'react';
import { Upload, Download, CheckCircle, Smartphone, Monitor } from 'lucide-react';

export default function SuperAdminAppReleaseWidget() {
  const [version, setVersion] = useState('v1.4.2');
  const [platform, setPlatform] = useState<'ANDROID_APK' | 'MAC_DMG'>('ANDROID_APK');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [speedMbps, setSpeedMbps] = useState(0);

  const [releases, setReleases] = useState([
    {
      version: 'v1.4.2',
      platform: 'ANDROID_APK',
      fileName: 'DAS_CRM_Android_v1.4.2.apk',
      fileSize: '48.2 MB',
      driveDownloadUrl: 'https://drive.google.com/uc?export=download&id=demo_apk_id',
      uploadedAt: 'Aug 22, 2026',
    },
    {
      version: 'v1.4.2',
      platform: 'MAC_DMG',
      fileName: 'DAS_CRM_Mac_v1.4.2.dmg',
      fileSize: '82.6 MB',
      driveDownloadUrl: 'https://drive.google.com/uc?export=download&id=demo_dmg_id',
      uploadedAt: 'Aug 22, 2026',
    },
  ]);

  const handleUploadRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select an .apk or .dmg installer file');
      return;
    }

    setIsUploading(true);
    setUploadPercent(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      const speed = Number((Math.random() * 5 + 3).toFixed(2));
      setSpeedMbps(speed);
      if (current >= 100) {
        clearInterval(interval);
        setUploadPercent(100);
        setIsUploading(false);

        const newRelease = {
          version,
          platform,
          fileName: selectedFile.name,
          fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
          driveDownloadUrl: `https://drive.google.com/uc?export=download&id=rel_${Date.now()}`,
          uploadedAt: 'Just now',
        };

        setReleases([newRelease, ...releases]);
        alert(`✅ App Release (${platform}) stored in Google Drive folder! Speed: ${speed} MB/s`);
        setSelectedFile(null);
      } else {
        setUploadPercent(current);
      }
    }, 400);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white max-w-4xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            SuperAdmin Google Drive App Releases Manager
          </h2>
          <p className="text-xs text-slate-400">
            Upload Android (.apk) and Mac (.dmg) installer packages directly to Google Drive.
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black rounded-lg">
          SUPERADMIN ONLY
        </span>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleUploadRelease} className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Version String</label>
            <input
              type="text"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. v1.4.2"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Target Platform</label>
            <select
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
            >
              <option value="ANDROID_APK">Android App Package (.apk)</option>
              <option value="MAC_DMG">Mac Desktop Disk Image (.dmg)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Select Package File</label>
            <input
              type="file"
              accept=".apk,.dmg"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-400"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        {isUploading && (
          <div className="bg-slate-900 p-3 rounded-lg border border-indigo-500/30 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-indigo-400">Uploading to Google Drive Folder... {uploadPercent}%</span>
              <span className="text-emerald-400">Transfer Speed: {speedMbps} MB/s</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${uploadPercent}%` }} />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
        >
          <Upload className="w-4 h-4" />
          Upload Package to Google Drive &amp; Publish Release →
        </button>
      </form>

      {/* Published Releases */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Published App Releases in Google Drive
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {releases.map((rel, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {rel.platform === 'ANDROID_APK' ? (
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <Smartphone className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/30">
                    <Monitor className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-white">{rel.fileName}</h4>
                  <p className="text-[10px] text-slate-400">
                    Version: <span className="text-indigo-300 font-semibold">{rel.version}</span> • Size: {rel.fileSize} • Uploaded: {rel.uploadedAt}
                  </p>
                </div>
              </div>

              <a
                href={rel.driveDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs rounded-lg flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
