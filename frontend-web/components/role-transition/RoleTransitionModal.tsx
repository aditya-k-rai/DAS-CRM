'use client';

import { useState } from 'react';
import { ShieldAlert, CheckCircle2, Lock, FileText, Mail, ArrowRight, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function RoleTransitionModal() {
  const { roleTransitionLock, isLocked, setRoleLockState, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isLocked || !roleTransitionLock) return null;

  const handleAccept = async () => {
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/role-transition/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('nexcrm_token')}`,
        },
      });
    } catch (e) {
      // Fallback
    } finally {
      setLoading(false);
      setRoleLockState(null);
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-amber-500/30 bg-card overflow-hidden shadow-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Lock size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              24-HOUR TRANSITION WINDOW
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Role Change Pending Review</h2>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 text-xs text-amber-100">
          <div className="flex justify-between items-center pb-2 border-b border-amber-500/20">
            <span className="text-muted">User Account:</span>
            <strong className="text-white">{currentUser.name}</strong>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-amber-500/20">
            <span className="text-muted">Previous Role:</span>
            <strong className="text-red-400">{roleTransitionLock.oldRole}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">New Role Assigned:</span>
            <strong className="text-indigo-400 font-bold">{roleTransitionLock.newRole}</strong>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted">
          <p className="flex items-center gap-2 text-white font-semibold">
            <FileText size={15} className="text-indigo-400" /> Automated Activity Export:
          </p>
          <p className="pl-6">
            Accepting this role will generate a PDF report of your activities under <strong>{roleTransitionLock.oldRole}</strong>. A download link valid for 7 days will be emailed to you (<strong>{currentUser.email}</strong>) and your Tenant Admin.
          </p>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <CheckCircle2 size={16} /> Accept Role & Generate PDF Export
          </button>
        </div>
      </div>
    </div>
  );
}
