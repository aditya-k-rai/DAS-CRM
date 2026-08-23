'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import SalesExecControlScreenWeb from './SalesExecControlScreenWeb';
import TeamLeaderControlScreenWeb from './TeamLeaderControlScreenWeb';
import ManagerControlScreenWeb from './ManagerControlScreenWeb';
import HrControlScreenWeb from './HrControlScreenWeb';

export interface EmployeeProfileWeb {
  id: string;
  name: string;
  code: string;
  dept: string;
  email: string;
  phone: string;
  role: 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC';
  assignedManager: string;
  baseSalary: string;
  joined: string;
  canSelfCheckIn: boolean;
  status: string;
  isLocked?: boolean;
  deletionScheduledAt?: string | null;
  deletionReason?: string | null;

  documents: {
    pan: string;
    aadhaar: string;
    eduCert: string;
    offerLetter: string;
    lastUpdatedDate: string;
    historyLogs: { date: string; docType: string; oldValue: string; newValue: string }[];
  };

  bankDetails: {
    bankName: string;
    accountHolder: string;
    accountNo: string;
    ifscCode: string;
    upiId: string;
    lastUpdatedDate: string;
    historyLogs: { date: string; bankName: string; accountNo: string }[];
  };

  attendance: {
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    todayInTime: string;
    todayOutTime: string | null;
    todayGps: string;
  };

  leads: {
    totalReceived: number;
    connected: number;
    inNegotiation: number;
    meetingScheduled: number;
    won: number;
    totalDistributed: number;
    distributionBreakdown: { targetName: string; targetRole: string; count: number; dateStr: string }[];
  };

  subordinates: { id: string; name: string; role: string; calls: number; revenue: string; leads: number }[];

  hrMetrics?: {
    pendingLeavesCount: number;
    queriesResolvedCount: number;
    reportsGeneratedCount: number;
    totalHiredCount: number;
    totalFiredCount: number;
    interviewsConductedCount: number;
    salaryPendingCount: number;
    salaryReportsCount: number;
  };
}

const INITIAL_EMPLOYEES: EmployeeProfileWeb[] = [
  {
    id: '1',
    name: 'Amit Shah',
    code: 'EMP001',
    dept: 'Enterprise Sales',
    email: 'amit.shah@acme.com',
    phone: '+91 98765 43210',
    role: 'MANAGER',
    assignedManager: 'Tenant Admin (Vikram Singh)',
    baseSalary: '₹95,000',
    joined: 'Jan 15, 2022',
    canSelfCheckIn: true,
    status: 'active',
    documents: {
      pan: 'ABCDE1234F',
      aadhaar: 'AADHAAR_9876_VERIFIED.pdf',
      eduCert: 'DEGREE_MBA_2022.pdf',
      offerLetter: 'OFFER_LETTER_MANAGER.pdf',
      lastUpdatedDate: 'Aug 01, 2026',
      historyLogs: [{ date: 'Aug 01, 2026', docType: 'PAN Card', oldValue: 'XYZDE9876K', newValue: 'ABCDE1234F' }],
    },
    bankDetails: {
      bankName: 'HDFC Bank',
      accountHolder: 'Amit Shah',
      accountNo: '50100987654321',
      ifscCode: 'HDFC0001234',
      upiId: 'amit@hdfcbank',
      lastUpdatedDate: 'Jul 28, 2026',
      historyLogs: [{ date: 'Jul 28, 2026', bankName: 'ICICI Bank', accountNo: '9876XXXX4321' }],
    },
    attendance: { presentDays: 21, absentDays: 1, leaveDays: 1, todayInTime: '09:15 AM', todayOutTime: '06:30 PM', todayGps: '28.440743, 77.531117' },
    leads: {
      totalReceived: 140,
      connected: 85,
      inNegotiation: 32,
      meetingScheduled: 18,
      won: 14,
      totalDistributed: 110,
      distributionBreakdown: [
        { targetName: 'Priya Sharma (TL)', targetRole: 'Team Leader', count: 45, dateStr: 'Today, 10:15 AM' },
        { targetName: 'Meera Kapoor (Exec)', targetRole: 'Sales Exec', count: 40, dateStr: 'Yesterday, 4:30 PM' },
      ],
    },
    subordinates: [
      { id: 'sub-1', name: 'Priya Sharma', role: 'Team Leader', calls: 184, revenue: '₹3,85,000', leads: 45 },
      { id: 'sub-2', name: 'Amit Patel', role: 'Sales Exec', calls: 84, revenue: '₹2,20,000', leads: 25 },
    ],
  },
  {
    id: '2',
    name: 'Priya Sharma',
    code: 'EMP002',
    dept: 'Inside Sales',
    email: 'priya.sharma@acme.com',
    phone: '+91 99887 11223',
    role: 'TEAM_LEADER',
    assignedManager: 'Manager A (Amit Shah)',
    baseSalary: '₹65,000',
    joined: 'Mar 01, 2023',
    canSelfCheckIn: true,
    status: 'active',
    documents: { pan: 'PQRST3456U', aadhaar: 'AADHAAR_3344_VERIFIED.pdf', eduCert: 'DEGREE_BBA_2023.pdf', offerLetter: 'OFFER_LETTER_TL_2026.pdf', lastUpdatedDate: 'Jul 20, 2026', historyLogs: [] },
    bankDetails: { bankName: 'Kotak Bank', accountHolder: 'Priya Sharma', accountNo: '66778899001122', ifscCode: 'KKBK0004455', upiId: 'priya@kotak', lastUpdatedDate: 'Jun 18, 2026', historyLogs: [] },
    attendance: { presentDays: 22, absentDays: 0, leaveDays: 1, todayInTime: '09:05 AM', todayOutTime: null, todayGps: '28.440743, 77.531117' },
    leads: { totalReceived: 45, connected: 28, inNegotiation: 10, meetingScheduled: 5, won: 2, totalDistributed: 40, distributionBreakdown: [] },
    subordinates: [
      { id: 'sub-4', name: 'Amit Patel', role: 'Sales Exec', calls: 84, revenue: '₹2,20,000', leads: 25 },
      { id: 'sub-5', name: 'Meera Kapoor', role: 'Sales Exec', calls: 65, revenue: '₹1,85,000', leads: 15 },
    ],
  },
  {
    id: '3',
    name: 'Sunita Verma',
    code: 'EMP003',
    dept: 'Support & HR',
    email: 'sunita.hr@acme.com',
    phone: '+91 97654 32109',
    role: 'HR',
    assignedManager: 'Tenant Admin (Vikram Singh)',
    baseSalary: '₹30,000',
    joined: 'Jun 10, 2023',
    canSelfCheckIn: false,
    status: 'active',
    documents: { pan: 'KLMNO9012P', aadhaar: 'AADHAAR_1122_VERIFIED.pdf', eduCert: 'DEGREE_HR_2021.pdf', offerLetter: 'OFFER_LETTER_HR_2025.pdf', lastUpdatedDate: 'Aug 10, 2026', historyLogs: [] },
    bankDetails: { bankName: 'Axis Bank', accountHolder: 'Sunita Verma', accountNo: '91802003344556', ifscCode: 'UTIB0009988', upiId: 'sunita@axis', lastUpdatedDate: 'May 02, 2026', historyLogs: [] },
    attendance: { presentDays: 20, absentDays: 1, leaveDays: 2, todayInTime: '09:30 AM', todayOutTime: '06:15 PM', todayGps: '28.440743, 77.531117' },
    leads: { totalReceived: 25, connected: 15, inNegotiation: 5, meetingScheduled: 3, won: 2, totalDistributed: 20, distributionBreakdown: [] },
    subordinates: [],
    hrMetrics: { pendingLeavesCount: 3, queriesResolvedCount: 42, reportsGeneratedCount: 18, totalHiredCount: 12, totalFiredCount: 2, interviewsConductedCount: 28, salaryPendingCount: 2, salaryReportsCount: 8 },
  },
  {
    id: '4',
    name: 'Amit Patel',
    code: 'EMP004',
    dept: 'Sales',
    email: 'amit.patel@acme.com',
    phone: '+91 98111 22334',
    role: 'SALES_EXEC',
    assignedManager: 'Priya Sharma (Team Leader)',
    baseSalary: '₹40,000',
    joined: 'Nov 5, 2023',
    canSelfCheckIn: true,
    status: 'active',
    documents: { pan: 'VWXYZ7890A', aadhaar: 'AADHAAR_5566_VERIFIED.pdf', eduCert: 'DEGREE_BSC_2024.pdf', offerLetter: 'OFFER_LETTER_EXEC_2026.pdf', lastUpdatedDate: 'Aug 05, 2026', historyLogs: [] },
    bankDetails: { bankName: 'SBI Bank', accountHolder: 'Amit Patel', accountNo: '20201122334455', ifscCode: 'SBIN0001122', upiId: 'amit@sbi', lastUpdatedDate: 'Jul 12, 2026', historyLogs: [] },
    attendance: { presentDays: 21, absentDays: 1, leaveDays: 0, todayInTime: '09:00 AM', todayOutTime: '06:00 PM', todayGps: '28.440743, 77.531117' },
    leads: { totalReceived: 35, connected: 22, inNegotiation: 8, meetingScheduled: 3, won: 2, totalDistributed: 0, distributionBreakdown: [] },
    subordinates: [],
  },
];

export function EmployeeListWidget() {
  const [employees, setEmployees] = useState<EmployeeProfileWeb[]>(INITIAL_EMPLOYEES);
  const [inspectingEmp, setInspectingEmp] = useState<EmployeeProfileWeb | null>(null);

  const handleUpdateEmployee = (updated: EmployeeProfileWeb) => {
    setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
    setInspectingEmp(updated);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 🔀 DEDICATED ROLE CONTROL SCREEN ROUTING (WEB)
  // ─────────────────────────────────────────────────────────────────────────────
  if (inspectingEmp !== null) {
    if (inspectingEmp.role === 'SALES_EXEC') {
      return <SalesExecControlScreenWeb employee={inspectingEmp} onBack={() => setInspectingEmp(null)} onUpdateEmployee={handleUpdateEmployee} />;
    }
    if (inspectingEmp.role === 'TEAM_LEADER') {
      return <TeamLeaderControlScreenWeb employee={inspectingEmp} onBack={() => setInspectingEmp(null)} onUpdateEmployee={handleUpdateEmployee} />;
    }
    if (inspectingEmp.role === 'MANAGER') {
      return <ManagerControlScreenWeb employee={inspectingEmp} onBack={() => setInspectingEmp(null)} onUpdateEmployee={handleUpdateEmployee} />;
    }
    if (inspectingEmp.role === 'HR') {
      return <HrControlScreenWeb employee={inspectingEmp} onBack={() => setInspectingEmp(null)} onUpdateEmployee={handleUpdateEmployee} />;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 👥 MAIN STAFF DIRECTORY LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="crm-card bg-gradient-to-r from-card via-background to-card p-6 border border-border rounded-3xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="text-brand-400" size={22} /> Organization Staff Directory &amp; Role Control Router
          </h2>
          <p className="text-xs text-muted mt-1">
            Manage Name, Role, Assign Under, and click <strong className="text-white">Inspect &amp; Control →</strong> for dedicated role screens.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp => {
          const roleBadgeColor =
            emp.role === 'MANAGER'
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              : emp.role === 'TEAM_LEADER'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : emp.role === 'HR'
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

          return (
            <div
              key={emp.id}
              className={`crm-card p-5 rounded-2xl border transition-all hover:border-brand/40 space-y-4 ${
                emp.isLocked ? 'bg-rose-950/10 border-rose-900/40' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    {emp.name}
                    {emp.isLocked && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">🔒 LOCKED</span>}
                  </h3>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border inline-block mt-1 ${roleBadgeColor}`}>
                    {emp.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted space-y-1">
                <p>👤 Assign Under: <strong className="text-indigo-400 font-bold">{emp.assignedManager}</strong></p>
                <p>✉️ Email: <span className="text-slate-300">{emp.email}</span></p>
                <p>📞 Phone: <span className="text-slate-300">{emp.phone}</span></p>
              </div>

              <button
                onClick={() => setInspectingEmp(emp)}
                className="w-full py-2.5 rounded-xl bg-brand/20 hover:bg-brand/30 border border-brand/40 text-brand-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                Inspect &amp; Control →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
