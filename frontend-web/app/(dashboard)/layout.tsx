'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleTransitionBanner } from '@/components/role-transition/RoleTransitionBanner';
import { RoleTransitionModal } from '@/components/role-transition/RoleTransitionModal';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useState } from 'react';

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
  const { collapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <div className="flex min-h-screen relative overflow-x-hidden">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 ${
          collapsed ? 'lg:ml-[68px]' : 'lg:ml-[260px]'
        }`}
      >
        <RoleTransitionBanner />
        {children}
        <RoleTransitionModal />
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
