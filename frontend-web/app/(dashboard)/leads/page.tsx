'use client';

import { useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadFunnelDistribution } from '@/components/leads/LeadFunnelDistribution';
import { Target, Sliders, Plus, Upload, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LeadsPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'funnel'>('directory');

  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();
  const canAccessFunnel = rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' || rawRole === 'MANAGER' || rawRole === 'OWNER';

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="Leads Management"
        actions={
          <div className="flex items-center gap-2">
            {canAccessFunnel && (
              <div className="flex gap-1.5 mr-2">
                <button
                  onClick={() => setActiveTab('directory')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'directory' ? 'bg-brand/25 text-brand-400 border border-brand/30' : 'bg-muted text-muted-foreground'}`}
                >
                  <Target size={13} /> Leads Directory
                </button>
                <button
                  onClick={() => setActiveTab('funnel')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'funnel' ? 'bg-brand/25 text-brand-400 border border-brand/30' : 'bg-muted text-muted-foreground'}`}
                >
                  <Sliders size={13} /> Funnel & Distribution Engine
                </button>
              </div>
            )}
            {canAccessFunnel && (
              <button className="btn-secondary text-sm gap-1.5">
                <Upload size={14} /> Import CSV
              </button>
            )}
            <button className="btn-primary text-sm gap-1.5">
              <Plus size={14} /> New Lead
            </button>
          </div>
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        {canAccessFunnel && activeTab === 'funnel' ? <LeadFunnelDistribution /> : <LeadsTable />}
      </main>
    </div>
  );
}
