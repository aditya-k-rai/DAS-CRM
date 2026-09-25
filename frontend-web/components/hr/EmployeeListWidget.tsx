'use client';

import { useState, useEffect } from 'react';
import { Users, ShieldCheck, Cloud, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SalesExecControlScreenWeb from './SalesExecControlScreenWeb';
import TeamLeaderControlScreenWeb from './TeamLeaderControlScreenWeb';
import ManagerControlScreenWeb from './ManagerControlScreenWeb';
import HrControlScreenWeb from './HrControlScreenWeb';
import EmployeeDriveVaultModal from './EmployeeDriveVaultModal';

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

const INITIAL_EMPLOYEES: EmployeeProfileWeb[] = [];

export function EmployeeListWidget() {
  const { currentUser, subscription } = useAuth();
  const [employees, setEmployees] = useState<EmployeeProfileWeb[]>([]);
  const [inspectingEmp, setInspectingEmp] = useState<EmployeeProfileWeb | null>(null);
  const [vaultEmp, setVaultEmp] = useState<EmployeeProfileWeb | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      try {
        const res = await fetch(`${apiBase}/users`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: EmployeeProfileWeb[] = data.map((u: any, idx: number) => {
              const rawRole = (u.role || 'SALES_EXEC').toUpperCase();
              let role: 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC' = 'SALES_EXEC';
              if (rawRole.includes('MANAGER')) role = 'MANAGER';
              else if (rawRole.includes('LEADER') || rawRole.includes('TL')) role = 'TEAM_LEADER';
              else if (rawRole.includes('HR')) role = 'HR';
              else if (rawRole.includes('ADMIN') || rawRole.includes('OWNER')) role = 'MANAGER';

              return {
                id: String(u.id),
                name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
                code: `EMP${String(idx + 1).padStart(3, '0')}`,
                dept: role === 'HR' ? 'Human Resources' : role === 'MANAGER' ? 'Executive & Management' : 'Sales & Growth',
                email: u.email,
                phone: u.phone || '—',
                role,
                assignedManager: 'Tenant Admin',
                baseSalary: '₹45,000',
                joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
                canSelfCheckIn: true,
                status: u.isActive !== false ? 'active' : 'inactive',
                documents: {
                  pan: 'VERIFIED',
                  aadhaar: 'AADHAAR_VERIFIED.pdf',
                  eduCert: 'DEGREE_VERIFIED.pdf',
                  offerLetter: 'OFFER_LETTER.pdf',
                  lastUpdatedDate: 'Recently',
                  historyLogs: [],
                },
                bankDetails: {
                  bankName: 'Direct Deposit',
                  accountHolder: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
                  accountNo: '••••••••',
                  ifscCode: '—',
                  upiId: u.email,
                  lastUpdatedDate: 'Recently',
                  historyLogs: [],
                },
                attendance: { presentDays: 0, absentDays: 0, leaveDays: 0, todayInTime: '—', todayOutTime: null, todayGps: '—' },
                leads: { totalReceived: 0, connected: 0, inNegotiation: 0, meetingScheduled: 0, won: 0, totalDistributed: 0, distributionBreakdown: [] },
                subordinates: [],
              };
            });
            setEmployees(mapped);
            return;
          }
        }
      } catch (e) {
        console.warn('Could not fetch real users:', e);
      }

      // Fallback to currently logged-in tenant user only
      if (currentUser) {
        setEmployees([
          {
            id: currentUser.id || 'admin_1',
            name: currentUser.name || 'Tenant Admin',
            code: 'EMP001',
            dept: 'Executive & Management',
            email: currentUser.email || 'admin@company.com',
            phone: '+91 98000 00000',
            role: 'MANAGER',
            assignedManager: 'Self (Tenant Owner)',
            baseSalary: '₹95,000',
            joined: 'Recently',
            canSelfCheckIn: true,
            status: 'active',
            documents: {
              pan: 'VERIFIED',
              aadhaar: 'AADHAAR_VERIFIED.pdf',
              eduCert: 'DEGREE_VERIFIED.pdf',
              offerLetter: 'OFFER_LETTER_ADMIN.pdf',
              lastUpdatedDate: 'Recently',
              historyLogs: [],
            },
            bankDetails: {
              bankName: 'Direct Deposit',
              accountHolder: currentUser.name || 'Admin',
              accountNo: '••••••••',
              ifscCode: '—',
              upiId: currentUser.email || 'admin@upi',
              lastUpdatedDate: 'Recently',
              historyLogs: [],
            },
            attendance: { presentDays: 0, absentDays: 0, leaveDays: 0, todayInTime: '—', todayOutTime: null, todayGps: '—' },
            leads: { totalReceived: 0, connected: 0, inNegotiation: 0, meetingScheduled: 0, won: 0, totalDistributed: 0, distributionBreakdown: [] },
            subordinates: [],
          }
        ]);
      } else {
        setEmployees([]);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const totalQuota = subscription?.userSeatsAllocated ?? 10;
  const activeCount = employees.length;

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
            Manage Name, Role, Assign Under, and click <strong className="text-white">Inspect &amp; Control →</strong> or <strong className="text-indigo-400">Drive Vault</strong> for dedicated employee cloud storage.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <ShieldCheck size={14} />
          <span>{activeCount} / {totalQuota > 0 ? totalQuota : '∞'} Seats Assigned ({subscription?.planType ? subscription.planType.replace('_', ' ') : 'Free Trial'})</span>
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

              <div className="flex gap-2">
                <button
                  onClick={() => setInspectingEmp(emp)}
                  className="flex-1 py-2.5 rounded-xl bg-brand/20 hover:bg-brand/30 border border-brand/40 text-brand-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  Inspect &amp; Control →
                </button>
                <button
                  onClick={() => setVaultEmp(emp)}
                  title={`Open ${emp.name}'s Google Drive Vault`}
                  className="px-3 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Cloud size={15} />
                  <span>Drive</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-Employee Google Drive Cloud Vault Modal */}
      {vaultEmp && (
        <EmployeeDriveVaultModal
          employee={vaultEmp}
          isOpen={!!vaultEmp}
          onClose={() => setVaultEmp(null)}
        />
      )}
    </div>
  );
}
