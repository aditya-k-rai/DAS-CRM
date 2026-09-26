'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Building2, UserX, LogOut, RefreshCw } from 'lucide-react';
import { useAuth, normalizeRoleStr, inferRoleFromEmail } from '@/context/AuthContext';
import { TenantAdminDashboard } from './TenantAdminDashboard';
import { HRRoleDashboard } from './HRRoleDashboard';
import { ManagerRoleDashboard } from './ManagerRoleDashboard';
import { TeamLeaderRoleDashboard } from './TeamLeaderRoleDashboard';
import { EmployeeRoleDashboard } from './EmployeeRoleDashboard';

export function RoleDashboardRouter() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const isRoleUnassigned =
    currentUser?.hasAssignedRole === false ||
    currentUser?.roleNotAssigned === true ||
    currentUser?.role === 'UNASSIGNED' ||
    normalizeRoleStr(currentUser?.role) === 'UNASSIGNED';

  const resolvedRole = isRoleUnassigned
    ? 'UNASSIGNED'
    : normalizeRoleStr(currentUser?.role || inferRoleFromEmail(currentUser?.email));

  useEffect(() => {
    if (isRoleUnassigned) return;

    if (resolvedRole === 'HR') {
      router.replace('/hr');
    } else if (resolvedRole === 'MANAGER') {
      router.replace('/dashboard/manager');
    } else if (resolvedRole === 'TEAM_LEADER') {
      router.replace('/dashboard/team-leader');
    } else if (resolvedRole === 'SALES_EXEC') {
      router.replace('/dashboard/sales');
    }
  }, [resolvedRole, isRoleUnassigned, router]);

  // STEP 6: Restricted Dashboard View for registered user without an assigned role
  if (isRoleUnassigned) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-3xl border border-amber-500/30 bg-card p-8 shadow-2xl text-center relative overflow-hidden backdrop-blur-md">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 mx-auto flex items-center justify-center mb-5 shadow-lg">
            <ShieldAlert size={32} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold mb-3 uppercase tracking-wider">
            <UserX size={13} /> Account Pending Role Assignment
          </div>

          <h1 className="text-2xl font-extrabold text-foreground mb-3 tracking-tight">
            Your role is not assigned. Contact Admin or Manager.
          </h1>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            You are logged into{' '}
            <strong className="text-foreground">{currentUser?.companyName || 'your company workspace'}</strong> as{' '}
            <span className="text-indigo-400 font-mono font-medium">{currentUser?.email}</span>. Your user account is
            registered, but an administrator has not yet assigned a role to your account.
          </p>

          <div className="bg-muted/40 rounded-2xl p-4 border border-border/60 text-left space-y-2 mb-6 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Building2 size={13} className="text-indigo-400" /> Company Workspace:
              </span>
              <span className="font-bold text-foreground">{currentUser?.companyName || 'Registered Tenant'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <UserX size={13} className="text-amber-400" /> Assigned Role:
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold font-mono">
                Unassigned
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Access Permissions:</span>
              <span className="text-muted-foreground">Restricted (No operational data)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <RefreshCw size={14} /> Refresh Role Status
            </button>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-foreground font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 1. HR & Payroll Dashboard
  if (resolvedRole === 'HR') {
    return <HRRoleDashboard />;
  }

  // 2. Department Manager Dashboard
  if (resolvedRole === 'MANAGER') {
    return <ManagerRoleDashboard />;
  }

  // 3. Team Leader Dashboard
  if (resolvedRole === 'TEAM_LEADER') {
    return <TeamLeaderRoleDashboard />;
  }

  // 4. Sales Executive / Employee Dashboard
  if (resolvedRole === 'SALES_EXEC') {
    return <EmployeeRoleDashboard />;
  }

  // 5. Tenant / Company Admin Dashboard (Default)
  return <TenantAdminDashboard />;
}
