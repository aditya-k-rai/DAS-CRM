'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { RoleTransitionBanner } from '@/components/role-transition/RoleTransitionBanner';
import { RoleTransitionModal } from '@/components/role-transition/RoleTransitionModal';
import { SidebarProvider } from '@/context/SidebarContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen relative overflow-x-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 lg:ml-[260px]">
          <RoleTransitionBanner />
          {children}
          <RoleTransitionModal />
        </div>
      </div>
    </SidebarProvider>
  );
}
