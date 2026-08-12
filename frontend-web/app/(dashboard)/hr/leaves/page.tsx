'use client';

import { Topbar } from '@/components/layout/Topbar';
import { LeaveApprovalWidget } from '@/components/hr/LeaveApprovalWidget';
import { Plus, Filter, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LeavesPage() {
  const { currentUser } = useAuth();
  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();
  const isHrOrAdmin = rawRole === 'HR' || rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' || rawRole === 'OWNER';

  if (!isHrOrAdmin) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <Topbar title="Leave Management" />
        <main className="flex-1 p-6 overflow-auto flex items-center justify-center">
          <div className="crm-card border border-red-500/30 bg-red-500/10 p-8 rounded-3xl text-center space-y-3 max-w-lg">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold mx-auto">
              <Lock size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Access Restricted to HR & Admins</h3>
            <p className="text-xs text-muted">
              The Leave Approval Queue allows approving or rejecting leave applications for all company employees and is restricted exclusively to HR Managers and Admins.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Leave Management" actions={
        <div className="flex gap-2">
          <button className="btn-secondary text-sm gap-1.5"><Filter size={14} /> Filter</button>
          <button className="btn-primary text-sm gap-1.5"><Plus size={14} /> Apply Leave</button>
        </div>
      } />
      <main className="flex-1 p-6 overflow-auto grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <LeaveApprovalWidget />
        </div>
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="crm-card">
            <h3 className="font-semibold mb-2">Leave Policy Summary</h3>
            <p className="text-xs text-muted mb-4">Standard Organization Allocations</p>
            <div className="space-y-3">
              {[
                { name: 'Casual Leave (CL)', days: '12 days/yr', color: 'rgb(245,158,11)' },
                { name: 'Sick Leave (SL)', days: '6 days/yr', color: 'rgb(239,68,68)' },
                { name: 'Annual / Paid Leave (PL)', days: '15 days/yr', color: 'rgb(59,130,246)' },
                { name: 'Compensatory Off', days: 'Earned', color: 'rgb(139,92,246)' },
              ].map((policy) => (
                <div key={policy.name} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgb(var(--background))' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: policy.color }} />
                    <span className="text-sm font-medium">{policy.name}</span>
                  </div>
                  <span className="text-xs font-semibold">{policy.days}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
