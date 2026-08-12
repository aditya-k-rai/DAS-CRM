'use client';

import { Users, Clock, FileText, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

const stats = [
  { label: 'Total Employees', value: '24', sub: '22 active · 2 on leave', icon: Users, color: 'brand', bg: 'rgba(99,102,241,0.12)', iconColor: 'rgb(129,140,248)' },
  { label: 'Present Today', value: '19', sub: '79.2% attendance rate', icon: CheckCircle2, color: 'green', bg: 'rgba(34,197,94,0.12)', iconColor: 'rgb(74,222,128)' },
  { label: 'On Leave Today', value: '3', sub: '2 approved · 1 pending', icon: Clock, color: 'orange', bg: 'rgba(245,158,11,0.12)', iconColor: 'rgb(251,191,36)' },
  { label: 'Payroll (Aug)', value: '₹8.4L', sub: '0 records paid · 24 generated', icon: DollarSign, color: 'purple', bg: 'rgba(139,92,246,0.12)', iconColor: 'rgb(167,139,250)' },
  { label: 'Leave Pending', value: '5', sub: 'Awaiting HR approval', icon: AlertCircle, color: 'red', bg: 'rgba(239,68,68,0.12)', iconColor: 'rgb(252,165,165)' },
  { label: 'Payslips Ready', value: '24', sub: 'Ready to download', icon: FileText, color: 'blue', bg: 'rgba(59,130,246,0.12)', iconColor: 'rgb(96,165,250)' },
];

export function HRStatCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="crm-card flex flex-col gap-2 animate-fade-in">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.iconColor, boxShadow: `0 0 12px ${s.bg}` }}>
            <s.icon size={17} />
          </div>
          <div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs font-medium leading-tight">{s.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--muted-foreground))' }}>{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
