'use client';

import { Topbar } from '@/components/layout/Topbar';
import { SalaryConfigBuilder } from '@/components/hr/SalaryConfigBuilder';
import { Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SalaryConfigPage() {
  const { currentUser } = useAuth();
  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();
  const isHrOrAdmin = rawRole === 'HR' || rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' || rawRole === 'OWNER';

  if (!isHrOrAdmin) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <Topbar title="Salary Configuration" />
        <main className="flex-1 p-6 overflow-auto flex items-center justify-center">
          <div className="crm-card border border-red-500/30 bg-red-500/10 p-8 rounded-3xl text-center space-y-3 max-w-lg">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold mx-auto">
              <Lock size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Access Restricted to HR & Admins</h3>
            <p className="text-xs text-muted">
              Salary and Payroll configuration details are restricted exclusively to HR Managers and Company Admins.
            </p>
          </div>
        </main>
      </div>
    );
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
