'use client';

import { Topbar } from '@/components/layout/Topbar';
import { EmployeeListWidget } from '@/components/hr/EmployeeListWidget';
import { Plus, Download, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function EmployeesPage() {
  const { currentUser } = useAuth();
  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();
  const isHrOrAdmin = rawRole === 'HR' || rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' || rawRole === 'OWNER';

  if (!isHrOrAdmin) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <Topbar title="Employee Directory & Reports" />
        <main className="flex-1 p-6 overflow-auto flex items-center justify-center">
          <div className="crm-card border border-red-500/30 bg-red-500/10 p-8 rounded-3xl text-center space-y-3 max-w-lg">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold mx-auto">
              <Lock size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Access Restricted to HR & Admins</h3>
            <p className="text-xs text-muted">
              The Employee Directory containing staff records and salary details is restricted exclusively to HR Managers and Company Admins.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Employee Directory & Reports" actions={
        <div className="flex gap-2">
          <button className="btn-secondary text-sm gap-1.5"><Download size={14} /> Export Directory</button>
          <button className="btn-primary text-sm gap-1.5"><Plus size={14} /> Add Employee</button>
        </div>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <EmployeeListWidget />
      </main>
    </div>
  );
}
