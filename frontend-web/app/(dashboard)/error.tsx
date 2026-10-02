'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DAS CRM Dashboard Error]', error);
  }, [error]);

  const handleClearCacheAndReload = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('das_crm_') || key.startsWith('@das_crm_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('das_crm_')) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch (_) {}

    window.location.href = '/login';
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-slate-900/90 backdrop-blur-sm p-8 shadow-2xl text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
          <AlertTriangle size={28} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">Page Error</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            This page encountered an error. This is usually caused by stale cached data from a previous session.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-left">
          <p className="text-[11px] font-mono text-rose-300 break-all leading-relaxed">
            {error.message?.length > 200 ? error.message.slice(0, 200) + '...' : (error.message || 'Unknown error')}
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => reset()}
            className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <RefreshCw size={14} /> Try Again
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => { window.location.href = '/dashboard'; }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Home size={14} /> Dashboard
            </button>
            <button
              onClick={handleClearCacheAndReload}
              className="flex-1 px-4 py-2.5 rounded-xl border border-amber-500/30 hover:bg-amber-500/10 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 size={14} /> Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
