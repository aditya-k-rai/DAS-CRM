'use client';

import { Shield, ExternalLink } from 'lucide-react';
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';

export default function SuperAdminPage() {
  const superAdminUrl = process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || 'http://localhost:3002';

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6">
      {/* SuperAdmin Quick Portal Access Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-purple-950/70 border border-indigo-500/30 flex items-center justify-between flex-wrap gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">Super Admin Multi-Tenant Control Hub</h2>
            <p className="text-xs text-slate-300">
              Direct access enabled in this workspace. You can also open the dedicated SuperAdmin Platform at <code className="text-indigo-300 font-mono">{superAdminUrl}</code>.
            </p>
          </div>
        </div>
        <a
          href={superAdminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all shrink-0 cursor-pointer"
        >
          Open Dedicated Portal ({superAdminUrl}) <ExternalLink size={13} />
        </a>
      </div>

      {/* Embedded SuperAdmin Dashboard */}
      <SuperAdminDashboard />
    </div>
  );
}
