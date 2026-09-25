'use client';

import { ShieldAlert, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminPage() {
  const superAdminUrl = process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || 'http://localhost:3002';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[70vh]">
      <div className="crm-card max-w-xl w-full p-8 border border-amber-500/40 bg-card rounded-3xl shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Restricted Portal Access
          </span>
          <h2 className="text-xl font-black text-foreground">Super Admin Portal Is Strictly Separate</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            The Super Admin Dashboard controls all multi-tenant companies, subscription plans, quotas, and global platform users. It is exclusively hosted on its own standalone web portal and cannot be accessed inside tenant workspaces.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs text-left space-y-2 font-mono">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-bold">Dedicated Platform URL:</span>
            <a
              href={superAdminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:text-indigo-400 font-black hover:underline flex items-center gap-1"
            >
              {superAdminUrl} <ExternalLink size={12} />
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground font-sans">
            Tenant admin dashboards are strictly partitioned to manage only their own company data and employees.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Admin Dashboard
          </Link>
          <a
            href={superAdminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
          >
            Open Standalone Super Admin Web <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
