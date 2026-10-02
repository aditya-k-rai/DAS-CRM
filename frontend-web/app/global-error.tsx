'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DAS CRM Global Error]', error);
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
    <html>
      <body className="bg-slate-950 text-white">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-slate-900/90 p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-2">Application Error</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                DAS CRM encountered a critical error. Clearing cached data usually resolves this.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-left">
              <p className="text-xs font-mono text-rose-300 break-all leading-relaxed">
                {error?.message || 'Unknown error'}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => reset()}
                className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <RefreshCw size={14} /> Try Again
              </button>
              <button
                onClick={handleClearCacheAndReload}
                className="w-full px-4 py-2.5 rounded-xl border border-amber-500/30 hover:bg-amber-500/10 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={14} /> Clear Cache & Re-Login
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
