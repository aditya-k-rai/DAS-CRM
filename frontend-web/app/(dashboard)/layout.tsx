'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { RoleTransitionBanner } from '@/components/role-transition/RoleTransitionBanner';
import { RoleTransitionModal } from '@/components/role-transition/RoleTransitionModal';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useEffect, useState } from 'react';

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
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
