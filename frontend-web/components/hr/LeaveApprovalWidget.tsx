'use client';

import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

const leaves = [
  { name: 'Sunita Verma', type: 'SICK', days: 2, from: 'Aug 11', to: 'Aug 12', reason: 'Medical appointment', status: 'PENDING', avatar: 'SV' },
  { name: 'Ravi Singh', type: 'CASUAL', days: 1, from: 'Aug 13', to: 'Aug 13', reason: 'Personal work', status: 'PENDING', avatar: 'RS' },
  { name: 'Deepak Joshi', type: 'ANNUAL', days: 3, from: 'Aug 18', to: 'Aug 20', reason: 'Family trip', status: 'PENDING', avatar: 'DJ' },
  { name: 'Kavita Nair', type: 'COMPENSATORY', days: 1, from: 'Aug 14', to: 'Aug 14', reason: 'Worked weekend', status: 'PENDING', avatar: 'KN' },
];

const typeColor: Record<string, string> = {
  SICK: 'rgb(239,68,68)', CASUAL: 'rgb(245,158,11)',
  ANNUAL: 'rgb(59,130,246)', COMPENSATORY: 'rgb(139,92,246)',
  UNPAID: 'rgb(100,116,139)', MATERNITY: 'rgb(236,72,153)', PATERNITY: 'rgb(99,102,241)',
};

export function LeaveApprovalWidget() {
  return (
    <div className="crm-card flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Leave Requests</h3>
          <p className="text-xs mt-0.5 text-muted">4 pending approval</p>
        </div>
        <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.2)', color: 'rgb(245,158,11)' }}>4</span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {leaves.map((l) => (
          <div key={l.name} className="p-3 rounded-lg border" style={{ background: 'rgb(var(--background))', borderColor: 'rgb(var(--border))' }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="avatar w-8 h-8 text-xs">{l.avatar}</div>
                <div>
                  <p className="text-sm font-medium leading-tight">{l.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: `${typeColor[l.type]}18`, color: typeColor[l.type] }}>{l.type}</span>
                    <span className="text-xs text-muted">{l.days}d · {l.from}–{l.to}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted mb-2 ml-10">{l.reason}</p>
            <div className="flex gap-2 ml-10">
              <button className="btn-primary text-xs px-3 py-1 flex items-center gap-1">
                <CheckCircle2 size={11} /> Approve
              </button>
              <button className="btn-danger text-xs px-3 py-1 flex items-center gap-1">
                <XCircle size={11} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-ghost w-full text-sm mt-2">View all leave requests →</button>
    </div>
  );
}
