'use client';

import { useAuth, UserRole } from '@/context/AuthContext';
import { Lock, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackTitle?: string;
}

export function RoleGuard({ allowedRoles, children, fallbackTitle }: RoleGuardProps) {
  const { currentUser } = useAuth();
  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();

  const normalizeRole = (r?: string): UserRole => {
    const norm = (r || '').toString().trim().toUpperCase();
    if (norm === 'SUPER_ADMIN' || norm === 'SYSTEM_ADMIN' || norm === 'SUPERADMIN') return 'SUPER_ADMIN';
    if (norm === 'ADMIN' || norm === 'TENANT_ADMIN' || norm === 'OWNER' || norm === 'COMPANY_ADMIN') return 'ADMIN';
    if (norm === 'HR' || norm === 'HR_MANAGER' || norm === 'HUMAN_RESOURCES') return 'HR';
    if (norm === 'MANAGER' || norm === 'DEPT_MANAGER' || norm === 'SALES_MANAGER') return 'MANAGER';
    if (norm === 'TEAM_LEADER' || norm === 'TL' || norm === 'LEAD') return 'TEAM_LEADER';
    return 'SALES_EXEC';
  };

  const userRole = normalizeRole(rawRole);
  const isAllowed = allowedRoles.includes(userRole) || userRole === 'SUPER_ADMIN';

  if (!isAllowed) {
    return (
      <div className="crm-card max-w-xl mx-auto my-12 p-8 text-center border border-rose-500/40 bg-rose-500/5 space-y-4 rounded-3xl animate-fade-in">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-lg">
          <ShieldAlert size={28} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white">403 — Access Restricted</h2>
          <p className="text-xs text-muted">
            {fallbackTitle || 'Your account role does not have permission to view or manage this restricted workspace module.'}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border text-xs text-muted">
          Current Logged In Role: <strong className="text-rose-300 font-mono uppercase font-extrabold">{userRole}</strong>
        </div>
        <div className="pt-2">
          <Link href="/dashboard" className="btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-2">
            <Lock size={13} /> Return to My Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
