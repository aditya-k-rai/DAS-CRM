'use client';

import React from 'react';
import { AdminControlCenterView } from '@/components/admin/AdminControlCenterView';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AdminControlCenterPage() {
  const { currentUser } = useAuth();
  const rawRole = (currentUser?.role || '').toUpperCase().trim();
  const isAdmin = rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' || rawRole === 'TENANT_ADMIN' || rawRole === 'OWNER' || rawRole.includes('ADMIN');

  if (!isAdmin && currentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-white">Access Restricted</h2>
          <p className="text-xs text-slate-400">
            The Admin Control Center is restricted to Company Admins and Super Administrators only.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <AdminControlCenterView />;
}
