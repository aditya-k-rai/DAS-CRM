'use client';

import React, { useState, useEffect, useRef } from 'react';

export function BackendActiveToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('Backend Refreshed & Active');
  const lastTimestampRef = useRef<number>(0);
  const hideTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    const checkHeartbeat = async () => {
      try {
        const res = await fetch(`${apiBase}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          const currentTimestamp = data?.lastRefreshedAt || Date.now();

          // If timestamp is newer than our last known check, trigger the toast!
          if (lastTimestampRef.current !== 0 && currentTimestamp > lastTimestampRef.current) {
            triggerPopup(data?.message || 'Backend Refreshed & Active');
          }
          lastTimestampRef.current = currentTimestamp;
        }
      } catch (_) {
        // Silent catch for network hiccups
      }
    };

    const triggerPopup = (msg: string) => {
      setMessage(msg);
      setVisible(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, 3800);
    };

    // Initial check after 3 seconds
    const initialTimer = setTimeout(checkHeartbeat, 3000);

    // Periodic check every 20 seconds
    const interval = setInterval(checkHeartbeat, 20000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/95 dark:bg-slate-950/95 border border-emerald-500/40 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 transition-all hover:scale-105"
      style={{ boxShadow: '0 10px 30px -5px rgba(16, 185, 129, 0.3)' }}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
      </span>
      <span className="text-xs font-semibold tracking-wide text-slate-100">
        {message}
      </span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="ml-1 text-slate-400 hover:text-white text-xs px-1 rounded transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

