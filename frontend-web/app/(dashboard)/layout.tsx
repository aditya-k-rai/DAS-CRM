'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { RoleTransitionBanner } from '@/components/role-transition/RoleTransitionBanner';
import { RoleTransitionModal } from '@/components/role-transition/RoleTransitionModal';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="flex min-h-screen relative overflow-x-hidden">
      <Sidebar />
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0"
        style={{ marginLeft: `var(--sidebar-offset, 0px)` }}
      >
        <style>{`
          @media (min-width: 1024px) {
            :root {
              --sidebar-offset: ${collapsed ? '68px' : '260px'};
            }
          }
        `}</style>
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
