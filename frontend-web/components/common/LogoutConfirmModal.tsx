'use client';

/**
 * LogoutConfirmModal.tsx — DAS CRM Web
 *
 * Modern, enterprise-grade glassmorphic confirmation modal for signing out.
 * Prevents accidental logouts, displays active workspace & user context,
 * and ensures safe, secure session termination.
 */

import React, { useEffect, useState } from 'react';
import { LogOut, ShieldCheck, AlertTriangle, X, RefreshCw, Building, User } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  companyName?: string;
  userAvatar?: string;
}

export function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  userName = 'Current User',
  userEmail = '',
  userRole = 'ADMIN',
  companyName = 'Acme Sales Solutions',
  userAvatar = 'AU',
}: LogoutConfirmModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoggingOut) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoggingOut, onClose]);

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    setIsLoggingOut(true);
    // Smooth transition before trigger
    setTimeout(() => {
      onConfirm();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Dark frosted glass backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={() => !isLoggingOut && onClose()}
      />

      {/* Cyber-enterprise Dialog Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-900/98 to-slate-950/98 border border-rose-500/30 p-6 shadow-2xl shadow-rose-950/40 backdrop-blur-xl animate-scaleUp text-foreground space-y-5">
        {/* Top Radiant Glow Pill */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-full opacity-80" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {/* Pulsing Glowing Icon Circle */}
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 via-red-500/15 to-rose-600/10 text-rose-400 border border-rose-500/35 shadow-inner">
              <LogOut className="h-6 w-6 text-rose-400 animate-pulse" />
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-slate-900" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-400 border border-rose-500/30">
                Security &amp; Session
              </span>
              <h2 className="text-lg font-black text-white tracking-tight mt-1">
                Sign Out of Workspace?
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => !isLoggingOut && onClose()}
            disabled={isLoggingOut}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Active Session Info Card */}
        <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2.5">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Current Active Session
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-md">
                {userAvatar}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{userName}</div>
                <div className="text-[11px] text-muted-foreground truncate">{userEmail}</div>
              </div>
            </div>

            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase tracking-wide shrink-0">
              {userRole}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building size={12} className="text-slate-400" />
              <strong className="text-slate-300">{companyName}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>
        </div>

        {/* Informative Security Notice */}
        <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-200/90 leading-relaxed">
          <ShieldCheck size={16} className="text-rose-400 shrink-0 mt-0.5" />
          <span>
            Signing out terminates your current browser authorization tokens. Unsaved offline inputs will be cleared, while synced cloud leads and customer data remain completely safe.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            Stay Signed In
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 border border-rose-400/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoggingOut ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut size={14} />
                <span>Yes, Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
