'use client';

import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

interface LeaveRequest {
  name: string;
  type: string;
  days: number;
  from: string;
  to: string;
  reason: string;
  status: string;
  avatar: string;
}

const leaves: LeaveRequest[] = [];

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
          <p className="text-xs mt-0.5 text-muted">{leaves.length} pending approval</p>
        </div>
        <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.2)', color: 'rgb(245,158,11)' }}>{leaves.length}</span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg border-dashed" style={{ borderColor: 'rgb(var(--border))' }}>
            <Clock size={24} className="text-muted mb-2 opacity-50" />
            <p className="text-sm font-medium">No pending leave requests</p>
            <p className="text-xs text-muted mt-0.5">Staff leave applications will appear here for review</p>
          </div>
        ) : (
          leaves.map((l) => (
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
          ))
        )}
      </div>

      <button className="btn-ghost w-full text-sm mt-2">View all leave requests →</button>
    </div>
  );
}
