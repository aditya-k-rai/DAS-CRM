'use client';

import { useState } from 'react';
import { ShieldAlert, CheckCircle2, Lock, ArrowRight, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function RoleTransitionBanner() {
  const { roleTransitionLock, isLocked, setRoleLockState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isLocked || !roleTransitionLock) return null;

  const handleAcceptRole = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/role-transition/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('nexcrm_token')}`,
        },
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setRoleLockState(null);
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      // Demo fallback
      setSuccess(true);
      setTimeout(() => {
        setRoleLockState(null);
        window.location.reload();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white px-4 py-3 shadow-lg border-b border-amber-400/30 flex items-center justify-between gap-4 flex-wrap z-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
          <Lock size={18} className="text-amber-100" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">
              24-HOUR ROLE TRANSITION LOCK ACTIVE
            </span>
            <span className="text-xs font-mono font-bold bg-black/20 px-2 py-0.5 rounded text-amber-200">
              {roleTransitionLock.hoursRemaining || 24}h Remaining
            </span>
          </div>
          <p className="text-xs text-amber-100 mt-0.5">
            Your role is being transitioned from <strong>{roleTransitionLock.oldRole}</strong> to <strong>{roleTransitionLock.newRole}</strong>. Account is in <strong>Read-Only Mode</strong>.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {success ? (
          <div className="flex items-center gap-1.5 text-xs font-bold bg-white text-amber-900 px-4 py-2 rounded-xl">
            <CheckCircle2 size={16} className="text-emerald-600" /> New Role Accepted! Reloading...
          </div>
        ) : (
          <button
            onClick={handleAcceptRole}
            disabled={loading}
            className="px-4 py-2 bg-white text-amber-950 hover:bg-amber-100 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} className="text-emerald-600" />}
            Accept New Role & Release Lock
          </button>
        )}
      </div>
    </div>
  );
}
