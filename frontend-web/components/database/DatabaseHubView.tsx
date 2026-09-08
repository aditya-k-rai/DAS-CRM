'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Database,
  FileSpreadsheet,
  HardDrive,
  Upload,
  Layers,
  Sparkles,
  ArrowUpDown,
  History,
  FolderTree,
  Mail,
  CheckCircle2
} from 'lucide-react';
import { ImportWizard } from '@/components/imports/ImportWizard';
import { DataStorageFolderVault } from './DataStorageFolderVault';

export type DatabaseTab = 'imports' | 'storage';

interface DatabaseHubViewProps {
  initialTab?: DatabaseTab;
}

export const DatabaseHubView: React.FC<DatabaseHubViewProps> = ({ initialTab = 'imports' }) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as DatabaseTab | null;
  const [activeTab, setActiveTab] = useState<DatabaseTab>(tabParam || initialTab);

  useEffect(() => {
    if (tabParam && (tabParam === 'imports' || tabParam === 'storage')) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: DatabaseTab) => {
    setActiveTab(tab);
    router.replace(`/database?tab=${tab}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Mode Switcher */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card/90 to-accent/20 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-cyan-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
              <Database className="h-7 w-7 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-foreground tracking-tight">
                  Database &amp; Data Hub
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-3 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="h-3 w-3" />
                  Enterprise Storage &amp; Ingestion
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Centralized hub for bulk lead ingestion pipelines, sync history, multi-tenant Google Drive vaults, and folder-wise email export requests.
              </p>
            </div>
          </div>

          {/* TWO PRIMARY BUTTONS / TABS */}
          <div className="flex p-1.5 rounded-2xl border border-border bg-accent/30 shadow-inner">
            {/* Button 1: Lead Import History */}
            <button
              id="btn-tab-lead-imports"
              onClick={() => handleTabChange('imports')}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
                activeTab === 'imports'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-400/40'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              }`}
            >
              <FileSpreadsheet className={`h-4 w-4 ${activeTab === 'imports' ? 'text-white' : 'text-indigo-400'}`} />
              <span>Lead Import History</span>
            </button>

            {/* Button 2: Data Storage */}
            <button
              id="btn-tab-data-storage"
              onClick={() => handleTabChange('storage')}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
                activeTab === 'storage'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 ring-1 ring-purple-400/40'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              }`}
            >
              <HardDrive className={`h-4 w-4 ${activeTab === 'storage' ? 'text-white' : 'text-purple-400'}`} />
              <span>Data Storage (Vault)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering based on Tab */}
      {activeTab === 'imports' ? (
        <div className="space-y-6">
          <ImportWizard />
        </div>
      ) : (
        <div className="space-y-6">
          <DataStorageFolderVault />
        </div>
      )}
    </div>
  );
};
