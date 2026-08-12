'use client';

import { MoreHorizontal, Shield, Users, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const EMPLOYEES = [
  { id: '1', name: 'Rajesh Kumar', code: 'EMP001', dept: 'Sales', tl: 'Amit Shah', base: '₹45,000', joined: 'Jan 15, 2024', canSelfCheckIn: true, status: 'active' },
  { id: '2', name: 'Priya Sharma', code: 'EMP002', dept: 'Sales', tl: 'Amit Shah', base: '₹35,000', joined: 'Mar 1, 2024', canSelfCheckIn: true, status: 'active' },
  { id: '3', name: 'Sunita Verma', code: 'EMP003', dept: 'Support', tl: 'Neha Joshi', base: '₹30,000', joined: 'Jun 10, 2023', canSelfCheckIn: false, status: 'active' },
  { id: '4', name: 'Amit Patel', code: 'EMP004', dept: 'Sales', tl: 'Amit Shah', base: '₹40,000', joined: 'Nov 5, 2023', canSelfCheckIn: true, status: 'active' },
  { id: '5', name: 'Meera Kapoor', code: 'EMP005', dept: 'Marketing', tl: 'Neha Joshi', base: '₹38,000', joined: 'Apr 20, 2024', canSelfCheckIn: false, status: 'active' },
];

export function EmployeeListWidget() {
  return (
    <div className="crm-card overflow-hidden p-0">
      <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'rgb(var(--border))' }}>
        <div>
          <h3 className="font-semibold">Employees</h3>
          <p className="text-xs mt-0.5 text-muted">24 total · HR can toggle self check-in access</p>
        </div>
        <Link href="/hr/employees" className="btn-secondary text-xs px-3 py-1.5">View All →</Link>
      </div>

      <div className="overflow-x-auto">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Code</th>
              <th>Team Leader</th>
              <th>Base Salary</th>
              <th>Joined</th>
              <th>Self Check-In</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {EMPLOYEES.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar w-8 h-8 text-xs">{emp.name.split(' ').map((n) => n[0]).join('')}</div>
                    <div>
                      <p className="font-medium text-sm">{emp.name}</p>
                      <p className="text-xs text-muted">{emp.dept}</p>
                    </div>
                  </div>
                </td>
                <td><span className="text-xs font-mono" style={{ color: 'rgb(var(--muted-foreground))' }}>{emp.code}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <Shield size={12} style={{ color: 'rgb(var(--brand-400))' }} />
                    <span className="text-sm">{emp.tl}</span>
                  </div>
                </td>
                <td><span className="font-semibold text-sm" style={{ color: 'rgb(var(--brand-400))' }}>{emp.base}</span></td>
                <td><span className="text-sm text-muted">{emp.joined}</span></td>
                <td>
                  <button className="flex items-center gap-1.5 text-xs font-medium transition-all">
                    {emp.canSelfCheckIn ? (
                      <><ToggleRight size={20} style={{ color: 'rgb(34,197,94)' }} /><span style={{ color: 'rgb(34,197,94)' }}>Enabled</span></>
                    ) : (
                      <><ToggleLeft size={20} style={{ color: 'rgb(var(--muted-foreground))' }} /><span className="text-muted">Disabled</span></>
                    )}
                  </button>
                </td>
                <td>
                  <Link href={`/hr/employees/${emp.id}`}>
                    <button className="btn-ghost w-8 h-8 p-0 rounded-md flex items-center justify-center">
                      <ExternalLink size={13} />
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
