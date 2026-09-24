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
  companyName = 'Adorable Trading',
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
      <div
        className="logout-confirm-dialog dark relative w-full max-w-md rounded-3xl border border-rose-500/35 p-6 shadow-2xl shadow-rose-950/50 backdrop-blur-xl animate-scaleUp space-y-5"
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
          color: '#ffffff',
        }}
      >
        {/* Top Radiant Glow Pill */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-full opacity-80" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {/* Pulsing Glowing Icon Circle */}
            <div
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-inner"
              style={{
                background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(225, 29, 72, 0.15) 50%, rgba(190, 18, 60, 0.1) 100%)',
                borderColor: 'rgba(244, 63, 94, 0.35)',
                color: '#fb7185',
              }}
            >
              <LogOut className="h-6 w-6 animate-pulse" style={{ color: '#fb7185' }} />
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-slate-900" />
            </div>

            <div>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border"
                style={{
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  borderColor: 'rgba(244, 63, 94, 0.35)',
                  color: '#fb7185',
                }}
              >
                Security &amp; Session
              </span>
              <h2 className="dialog-title text-lg font-black tracking-tight mt-1" style={{ color: '#ffffff' }}>
                Sign Out of Workspace?
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => !isLoggingOut && onClose()}
            disabled={isLoggingOut}
            className="p-2 rounded-xl transition-colors cursor-pointer"
            style={{ color: '#cbd5e1', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            title="Cancel & Close"
            aria-label="Close"
          >
            <X size={18} style={{ color: '#cbd5e1' }} />
          </button>
        </div>

        {/* Active Session Info Card */}
        <div
          className="rounded-2xl border p-3.5 space-y-2.5"
          style={{
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            borderColor: '#1e293b',
          }}
        >
          <div className="session-title text-[11px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
            Current Active Session
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
                  color: '#ffffff',
                }}
              >
                {userAvatar}
              </div>
              <div className="min-w-0">
                <div className="user-name text-xs font-bold truncate" style={{ color: '#ffffff' }}>{userName}</div>
                <div className="user-email text-[11px] truncate" style={{ color: '#94a3b8' }}>{userEmail}</div>
              </div>
            </div>

            <span
              className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wide shrink-0"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                color: '#c7d2fe',
              }}
            >
              {userRole}
            </span>
          </div>

          <div
            className="pt-2 border-t flex items-center justify-between text-[11px]"
            style={{ borderColor: 'rgba(30, 41, 59, 0.8)' }}
          >
            <span className="flex items-center gap-1.5">
              <Building size={12} style={{ color: '#94a3b8' }} />
              <strong className="company-name" style={{ color: '#f1f5f9' }}>{companyName}</strong>
            </span>
            <span className="inline-flex items-center gap-1 font-medium" style={{ color: '#34d399' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>
        </div>

        {/* Informative Security Notice */}
        <div
          className="flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed"
          style={{
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            borderColor: 'rgba(244, 63, 94, 0.28)',
            color: '#fecdd3',
          }}
        >
          <ShieldCheck size={16} className="shrink-0 mt-0.5" style={{ color: '#fb7185' }} />
          <span style={{ color: '#fecdd3' }}>
            Signing out terminates your current browser authorization tokens. Unsaved offline inputs will be cleared, while synced cloud leads and customer data remain completely safe.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="btn-cancel px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm"
            style={{
              backgroundColor: '#1e293b',
              borderColor: '#475569',
              color: '#ffffff',
            }}
          >
            Stay Signed In
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isLoggingOut}
            className="btn-confirm flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 border border-rose-400/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              background: 'linear-gradient(to right, #e11d48, #f43f5e, #dc2626)',
              color: '#ffffff',
            }}
          >
            {isLoggingOut ? (
              <>
                <RefreshCw size={14} className="animate-spin" style={{ color: '#ffffff' }} />
                <span style={{ color: '#ffffff' }}>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut size={14} style={{ color: '#ffffff' }} />
                <span style={{ color: '#ffffff' }}>Yes, Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
