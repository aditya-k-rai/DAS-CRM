'use client';

import { Topbar } from '@/components/layout/Topbar';
import { SalaryConfigBuilder } from '@/components/hr/SalaryConfigBuilder';
import { Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SalaryConfigPage() {
  const { currentUser } = useAuth();
  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();
  const isAuthorized = rawRole === 'HR' || rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' || rawRole === 'OWNER' || rawRole.includes('MANAGER');

  if (!isAuthorized) {
    if (typeof window !== 'undefined') {
      window.location.replace('/dashboard');
    }
    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Salary Configuration" actions={
        <div className="flex gap-2">
          <button className="btn-secondary text-sm">Load Template</button>
          <button className="btn-primary text-sm">+ New Config</button>
        </div>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <SalaryConfigBuilder />
      </main>
    </div>
  );
}
