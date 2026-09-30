'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { EmployeeListWidget } from '@/components/hr/EmployeeListWidget';
import { Download, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const dynamic = 'force-dynamic';

function EmployeesContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'assigned' | 'unassigned' | 'all' | null;
  const [exportTrigger, setExportTrigger] = useState(0);
  const [currentTab, setCurrentTab] = useState<'assigned' | 'unassigned' | 'all'>(
    tabParam === 'unassigned' || tabParam === 'all' ? tabParam : 'assigned'
  );

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
      <Topbar
        title="Employee Directory & Staff Management"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExportTrigger(Date.now())}
              className="btn-secondary text-xs gap-1.5 cursor-pointer hover:bg-slate-800 transition-all"
              title="Download CSV report of all employees"
            >
              <Download size={14} /> Export Directory
            </button>
          </div>
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        <EmployeeListWidget
          exportTrigger={exportTrigger}
          initialTab={currentTab}
          key={currentTab}
        />
      </main>
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col min-h-0 p-6 items-center justify-center text-xs text-slate-400">
          Loading Employee Directory...
        </div>
      }
    >
      <EmployeesContent />
    </Suspense>
  );
}
