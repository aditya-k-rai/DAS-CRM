'use client';

import { Shield, ExternalLink } from 'lucide-react';

export default function SuperAdminPage() {
  const superAdminUrl = process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || 'http://localhost:3002';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-xl">
        <Shield size={32} />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-extrabold text-white">Super Admin Control Plane</h2>
        <p className="text-xs text-muted leading-relaxed">
          The Super Admin Dashboard is exclusively hosted on the dedicated SuperAdmin Platform (<code className="text-indigo-300 font-mono">{superAdminUrl}</code>).
        </p>
      </div>

      <div className="pt-2">
        <a
          href={superAdminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl transition-all"
        >
          Open SuperAdmin Portal ({superAdminUrl}) <ExternalLink size={15} />
        </a>
      </div>
    </div>
  );
}
