'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth, UserRole, normalizeRoleStr, inferRoleFromEmail } from '@/context/AuthContext';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackTitle?: string;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const userRole = normalizeRoleStr(currentUser?.role || inferRoleFromEmail(currentUser?.email));
  const isAllowed = allowedRoles.includes(userRole) || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'MANAGER';

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
      case 'ADMIN':
      default:
        return '/dashboard';
    }
  };

  useEffect(() => {
    if (!isAllowed) {
      router.replace(getDashboardRoute(userRole));
    }
  }, [isAllowed, userRole, router]);

  if (!isAllowed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="animate-spin text-primary" size={20} />
          <span>Navigating to your assigned workspace...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
