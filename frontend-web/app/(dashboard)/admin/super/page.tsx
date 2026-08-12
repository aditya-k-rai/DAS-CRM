import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';

export const metadata: Metadata = { title: 'Administrative Portal | Super Admin' };

export default function SuperAdminPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Administrative Portal" actions={
        <span className="text-xs px-3 py-1 rounded-full font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          SUPER ADMIN OVERLORD
        </span>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <SuperAdminDashboard />
      </main>
    </div>
  );
}
