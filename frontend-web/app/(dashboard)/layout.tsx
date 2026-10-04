'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, normalizeRoleStr, inferRoleFromEmail } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleTransitionBanner } from '@/components/role-transition/RoleTransitionBanner';
import { RoleTransitionModal } from '@/components/role-transition/RoleTransitionModal';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useState } from 'react';

const ROUTE_TO_MODULE_KEY: Record<string, string> = {
  '/leads': 'LEADS',
  '/pipeline': 'PIPELINE',
  '/hr/employees': 'EMPLOYEES',
  '/products': 'PRODUCTS',
  '/quotes': 'QUOTES',
  '/comms': 'COMMUNICATIONS',
  '/whatsapp-templates': 'WA_TEMPLATES',
  '/emails': 'EXTRA_EMAIL',
  '/admin/ai': 'AI_CONTROL',
  '/pdf-catalogue': 'PDF_CATALOG',
  '/reports': 'REPORTS',
  '/automations': 'AUTOMATIONS',
  '/database': 'DATABASE',
  '/attendance': 'ATTENDANCE',
  '/deals': 'DEALS',
  '/goals': 'GOALS',
  '/hr/interviews': 'INTERVIEWS',
  '/communicate': 'UPCOMING_COMMS',
  '/notice-board': 'UPCOMING_COMMS',
  '/settings': 'SETTINGS',
  '/profile': 'PROFILE',
  '/help': 'SUPPORT',
  '/about': 'SUPPORT',
  '/tl/lead-assignment': 'LEAD_ASSIGNMENT',
  '/tasks': 'TASKS',
  '/follow-ups': 'TASKS',
};

const ROLE_DEFAULT_MODULES: Record<string, string[]> = {
  ADMIN:       Object.values(ROUTE_TO_MODULE_KEY),
  SUPER_ADMIN: Object.values(ROUTE_TO_MODULE_KEY),
  MANAGER:     ['LEADS', 'PIPELINE', 'REPORTS', 'ATTENDANCE', 'EMPLOYEES', 'DEALS', 'PRODUCTS', 'QUOTES', 'UPCOMING_COMMS', 'SUPPORT', 'GOALS', 'TASKS', 'SETTINGS'],
  TEAM_LEADER: ['LEADS', 'REPORTS', 'ATTENDANCE', 'EMPLOYEES', 'DEALS', 'GOALS', 'SETTINGS', 'UPCOMING_COMMS', 'SUPPORT', 'LEAD_ASSIGNMENT', 'TASKS'],
  SALES_EXEC:  ['LEADS', 'DEALS', 'REPORTS', 'ATTENDANCE', 'SETTINGS', 'UPCOMING_COMMS', 'SUPPORT', 'TASKS'],
  HR:          ['EMPLOYEES', 'ATTENDANCE', 'INTERVIEWS', 'UPCOMING_COMMS', 'SUPPORT', 'SETTINGS'],
  UNASSIGNED:  [],
};

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY: Route Guard — No unauthenticated access to any dashboard route.
// The guard checks:
//  1. A valid session token exists in localStorage
//  2. The currentUser has a real userId (not the default demo fallback)
//  3. The currentUser has a valid email (proof of real login)
// If any check fails → redirect to /login immediately with the return URL.
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_SENTINEL_IDS = new Set([
  'usr_admin',
  'usr_hr',
  'usr_mgr',
  'usr_tl',
  'usr_rep',
  'usr_unassigned',
  'usr_super',
]);

function isRealAuthenticatedUser(id?: string, email?: string): boolean {
  if (!id || !email) return false;
  if (DEMO_SENTINEL_IDS.has(id)) return false;
  if (email.endsWith('@das.com')) return false;
  return true;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('das_crm_user') : null;

    let isRealSession = false;

    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        isRealSession = Boolean(storedToken && isRealAuthenticatedUser(parsed?.id, parsed?.email));
      } catch (_) {
        isRealSession = false;
      }
    }

    if (!isRealSession) {
      // Clear any stale/invalid demo session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('das_crm_token');
        localStorage.removeItem('das_crm_user');
        localStorage.removeItem('das_crm_active_role');
        localStorage.removeItem('das_crm_subscription');
      }
      // Redirect to login, preserving the intended destination
      const returnUrl = encodeURIComponent(pathname || '/dashboard');
      router.replace(`/login?returnTo=${returnUrl}`);
    }
  }, [pathname, router]);

  // During the guard check, don't render children to prevent flash of content
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('das_crm_user') : null;

  if (!storedToken || !storedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  let isRealSession = false;
  try {
    const parsed = JSON.parse(storedUser);
    isRealSession = Boolean(storedToken && isRealAuthenticatedUser(parsed?.id, parsed?.email));
  } catch (_) {}

  if (!isRealSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  useRealtimeSync();
  const { collapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useAuth();

  const rawRole = (currentUser?.role || '').toUpperCase().trim();
  const normalizedRole = normalizeRoleStr(rawRole || inferRoleFromEmail(currentUser?.email));
  const isUnassigned = currentUser?.hasAssignedRole === false || normalizedRole === 'UNASSIGNED';
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(normalizedRole);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Strict route-level module access guard for non-admin users
  useEffect(() => {
    if (isAdmin || !pathname) return;

    // 1. Unassigned users can only stay on /dashboard (role pending screen)
    if (isUnassigned) {
      if (!pathname.startsWith('/dashboard')) {
        router.replace('/dashboard');
      }
      return;
    }

    // 2. Control Center is strictly restricted to Admin / Super Admin
    if (pathname.startsWith('/admin/control-center')) {
      router.replace('/dashboard');
      return;
    }

    // 3. Find if current route corresponds to a controlled module
    const matchedPath = Object.keys(ROUTE_TO_MODULE_KEY).find(p => pathname === p || pathname.startsWith(p + '/'));
    if (matchedPath) {
      const modKey = ROUTE_TO_MODULE_KEY[matchedPath];
      let hasAccess = false;
      try {
        const rawPolicies = localStorage.getItem('@das_crm_module_policies_v1');
        const policies = rawPolicies ? JSON.parse(rawPolicies) : {};
        const policyKeyId = currentUser?.id ? `${currentUser.id}:${modKey}` : null;
        const policyKeyEmail = currentUser?.email ? `${currentUser.email.toLowerCase().trim()}:${modKey}` : null;

        if (policyKeyId && policies[policyKeyId] !== undefined) {
          hasAccess = Boolean(policies[policyKeyId].active);
        } else if (policyKeyEmail && policies[policyKeyEmail] !== undefined) {
          hasAccess = Boolean(policies[policyKeyEmail].active);
        } else {
          // Fresh user: strictly permitted only to their role defaults
          const defaults = ROLE_DEFAULT_MODULES[normalizedRole] || [];
          hasAccess = defaults.includes(modKey);
        }
      } catch (_) {
        const defaults = ROLE_DEFAULT_MODULES[normalizedRole] || [];
        hasAccess = defaults.includes(modKey);
      }

      if (!hasAccess) {
        router.replace('/dashboard');
      }
    }
  }, [pathname, isAdmin, isUnassigned, normalizedRole, currentUser?.id, currentUser?.email, router]);

  return (
    <div className="flex min-h-screen relative overflow-x-hidden">
      <ErrorBoundary fallbackTitle="Sidebar Error">
        <Sidebar />
      </ErrorBoundary>
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 ${
          collapsed ? 'lg:ml-[68px]' : 'lg:ml-[260px]'
        }`}
      >
        <ErrorBoundary fallbackTitle="Navigation Error">
          <RoleTransitionBanner />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Page Error">
          {children}
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Modal Error" showClearCache={false}>
          <RoleTransitionModal />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AuthGuard>
        <DashboardContent>{children}</DashboardContent>
      </AuthGuard>
    </SidebarProvider>
  );
}
