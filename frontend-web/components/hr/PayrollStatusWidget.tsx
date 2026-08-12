'use client';

import { CheckCircle2, Clock, AlertCircle, DollarSign } from 'lucide-react';

const payrollData = [
  { name: 'Rajesh Kumar', dept: 'Sales', gross: '₹52,400', net: '₹47,800', status: 'GENERATED' },
  { name: 'Priya Sharma', dept: 'Sales', gross: '₹38,200', net: '₹34,600', status: 'APPROVED' },
  { name: 'Sunita Verma', dept: 'Support', gross: '₹32,000', net: '₹29,200', status: 'GENERATED' },
  { name: 'Amit Patel', dept: 'Sales', gross: '₹45,000', net: '₹40,900', status: 'PAID' },
  { name: 'Meera Kapoor', dept: 'Marketing', gross: '₹41,600', net: '₹37,800', status: 'DRAFT' },
];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: 'Draft',     color: 'rgb(100,116,139)', bg: 'rgba(100,116,139,0.12)' },
  GENERATED: { label: 'Generated', color: 'rgb(245,158,11)',  bg: 'rgba(245,158,11,0.12)'  },
  APPROVED:  { label: 'Approved',  color: 'rgb(59,130,246)',  bg: 'rgba(59,130,246,0.12)'  },
  PAID:      { label: 'Paid',      color: 'rgb(34,197,94)',   bg: 'rgba(34,197,94,0.12)'   },
};

export function PayrollStatusWidget() {
  return (
    <div className="crm-card flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Payroll — Aug 2026</h3>
          <p className="text-xs mt-0.5 text-muted">₹8.4L total · 0 paid</p>
        </div>
        <button className="btn-primary text-xs px-3 py-1.5">Generate All</button>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted mb-1.5">
          <span>Payroll Progress</span>
          <span>1 / 24 paid</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border))' }}>
          <div className="h-full rounded-full" style={{ width: '4%', background: 'linear-gradient(90deg, rgb(79,70,229), rgb(139,92,246))' }} />
        </div>
        <div className="flex gap-3 mt-2">
          {Object.entries(STATUS_CFG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
              <span className="text-xs text-muted">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-auto">
        {payrollData.map((emp) => {
          const cfg = STATUS_CFG[emp.status];
          return (
            <div key={emp.name} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgb(var(--background))' }}>
              <div>
                <p className="text-sm font-medium">{emp.name}</p>
                <p className="text-xs text-muted">{emp.dept}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: 'rgb(var(--brand-400))' }}>{emp.net}</p>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn-ghost w-full text-sm mt-1">View all payroll records →</button>
    </div>
  );
}
