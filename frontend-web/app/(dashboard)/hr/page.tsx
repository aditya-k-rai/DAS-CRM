'use client';

import { useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { HRRoleDashboard } from '@/components/dashboard/HRRoleDashboard';
import { HRCallLogAudit } from '@/components/hr/HRCallLogAudit';
import { UserCog, PhoneCall } from 'lucide-react';

export default function HRPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'call_audit'>('attendance');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar
        title="HR Portal & Employee Audits"
        actions={
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'attendance' ? 'bg-brand/25 text-brand-400 border border-brand/30' : 'bg-muted text-muted-foreground'}`}
            >
              <UserCog size={13} /> Attendance & Payroll
            </button>
            <button
              onClick={() => setActiveTab('call_audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'call_audit' ? 'bg-brand/25 text-brand-400 border border-brand/30' : 'bg-muted text-muted-foreground'}`}
            >
              <PhoneCall size={13} /> Call Logs Audit
            </button>
          </div>
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'attendance' ? <HRRoleDashboard /> : <HRCallLogAudit />}
      </main>
    </div>
  );
}
