'use client';

import { useAuth, UserRole, normalizeRoleStr, inferRoleFromEmail } from '@/context/AuthContext';
import { Lock, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackTitle?: string;
}

export function RoleGuard({ allowedRoles, children, fallbackTitle }: RoleGuardProps) {
  const { currentUser } = useAuth();
  const userRole = normalizeRoleStr(currentUser?.role || inferRoleFromEmail(currentUser?.email));
  const isAllowed = allowedRoles.includes(userRole);

  const getDashboardRoute = (role: UserRole): string => {
    switch (role) {
      case 'HR':
        return '/hr';
      case 'MANAGER':
        return '/dashboard/manager';
      case 'TEAM_LEADER':
        return '/dashboard/team-leader';
      case 'SALES_EXEC':
        return '/dashboard/sales';
      case 'SUPER_ADMIN':
        return '/admin/super';
      case 'ADMIN':
      default:
        return '/dashboard';
    }
  };

  if (!isAllowed) {
    const returnHref = getDashboardRoute(userRole);

    return (
      <div className="crm-card max-w-xl mx-auto my-12 p-8 text-center border border-rose-500/40 bg-rose-500/5 space-y-4 rounded-3xl animate-fade-in">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-lg">
          <ShieldAlert size={28} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white">403 — Access Restricted</h2>
          <p className="text-xs text-muted">
            {fallbackTitle || 'Your account credentials and assigned role do not have permission to view this dashboard.'}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border text-xs text-muted space-y-1 text-left">
          <div className="flex justify-between">
            <span>Account Email:</span>
            <strong className="text-white font-mono">{currentUser?.email || 'Unknown'}</strong>
          </div>
          <div className="flex justify-between">
            <span>Your Assigned Role:</span>
            <strong className="text-rose-300 font-mono uppercase font-extrabold">{userRole}</strong>
          </div>
        </div>
        <div className="pt-2">
          <Link href={returnHref} className="btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-2">
            <Lock size={13} /> Return to My Assigned Dashboard ({userRole})
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
