'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { AuthProvider } from '@/context/AuthContext';
import { RoleTransitionBanner } from '@/components/role-transition/RoleTransitionBanner';
import { RoleTransitionModal } from '@/components/role-transition/RoleTransitionModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col" style={{ marginLeft: 'var(--sidebar-width)' }}>
          <RoleTransitionBanner />
          {children}
          <RoleTransitionModal />
        </div>
      </div>
    </AuthProvider>
  );
}
