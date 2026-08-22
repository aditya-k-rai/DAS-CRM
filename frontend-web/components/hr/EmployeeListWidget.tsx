'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  ExternalLink,
  X,
  MapPin,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  ArrowRightLeft,
  Briefcase,
  Lock,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  TrendingUp,
  Share2,
  DollarSign,
  UserPlus,
  UserX,
  MessageSquare,
  Award,
  PhoneCall,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

  // Documents & Banking Telemetry (Bottom Buttons)
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

  // Attendance Telemetry
  attendance: {
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    todayInTime: string;
    todayOutTime: string | null;
    todayGps: string;
  };

  // Lead Breakdown
  leads: {
    totalReceived: number;
    connected: number;
    inNegotiation: number;
    meetingScheduled: number;
    won: number;
    totalDistributed: number;
    distributionBreakdown: { targetName: string; targetRole: string; count: number; dateStr: string }[];
  };

  // Subordinates list
  subordinates: { id: string; name: string; role: string; calls: number; revenue: string; leads: number }[];

  // HR Exclusive Telemetry
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
    name: 'Rajesh Kumar',
    code: 'EMP001',
    dept: 'Sales',
    email: 'rajesh.kumar@acme.com',
    phone: '+91 98765 43210',
    role: 'MANAGER',
    assignedManager: 'Tenant Admin (Vikram Singh)',
    baseSalary: '₹45,000',
    joined: 'Jan 15, 2024',
    canSelfCheckIn: true,
    status: 'active',
    documents: {
      pan: 'ABCDE1234F',
      aadhaar: 'AADHAAR_9876_VERIFIED.pdf',
      eduCert: 'DEGREE_MBA_2022.pdf',
      offerLetter: 'OFFER_LETTER_MGR.pdf',
      lastUpdatedDate: 'Aug 01, 2026',
      historyLogs: [
        { date: 'Aug 01, 2026', docType: 'PAN Card', oldValue: 'XYZDE9876K', newValue: 'ABCDE1234F' },
      ],
    },
    bankDetails: {
      bankName: 'HDFC Bank',
      accountHolder: 'Rajesh Kumar',
      accountNo: '50100987654321',
      ifscCode: 'HDFC0001234',
      upiId: 'rajesh@hdfcbank',
      lastUpdatedDate: 'Jul 28, 2026',
      historyLogs: [
        { date: 'Jul 28, 2026', bankName: 'ICICI Bank', accountNo: '9876XXXX4321' },
      ],
    },
    attendance: {
      presentDays: 21,
      absentDays: 1,
      leaveDays: 1,
      todayInTime: '09:15 AM',
      todayOutTime: '06:30 PM',
      todayGps: '28.440743, 77.531117',
    },
    leads: {
      totalReceived: 140,
      connected: 85,
      inNegotiation: 32,
      meetingScheduled: 18,
      won: 14,
      totalDistributed: 110,
      distributionBreakdown: [
        { targetName: 'Priya Sharma (TL)', targetRole: 'Team Leader', count: 45, dateStr: 'Today, 10:15 AM' },
        { targetName: 'Karan Verma (TL)', targetRole: 'Team Leader', count: 40, dateStr: 'Yesterday, 4:30 PM' },
        { targetName: 'Amit Patel (Exec)', targetRole: 'Sales Exec', count: 25, dateStr: 'Aug 20, 2:00 PM' },
      ],
    },
    subordinates: [
      { id: 'sub-1', name: 'Priya Sharma', role: 'Team Leader', calls: 184, revenue: '₹3,85,000', leads: 45 },
      { id: 'sub-2', name: 'Karan Verma', role: 'Team Leader', calls: 156, revenue: '₹3,20,000', leads: 40 },
      { id: 'sub-3', name: 'Amit Patel', role: 'Sales Exec', calls: 84, revenue: '₹2,20,000', leads: 25 },
    ],
  },
  {
    id: '2',
    name: 'Priya Sharma',
    code: 'EMP002',
    dept: 'Sales',
    email: 'priya.sharma@acme.com',
    phone: '+91 99887 11223',
    role: 'TEAM_LEADER',
    assignedManager: 'Manager A (Rajesh Kumar)',
    baseSalary: '₹35,000',
    joined: 'Mar 1, 2024',
    canSelfCheckIn: true,
    status: 'active',
    documents: {
      pan: 'PQRST3456U',
      aadhaar: 'AADHAAR_3344_VERIFIED.pdf',
      eduCert: 'DEGREE_BBA_2023.pdf',
      offerLetter: 'OFFER_LETTER_TL_2026.pdf',
      lastUpdatedDate: 'Jul 20, 2026',
      historyLogs: [],
    },
    bankDetails: {
      bankName: 'Kotak Bank',
      accountHolder: 'Priya Sharma',
      accountNo: '66778899001122',
      ifscCode: 'KKBK0004455',
      upiId: 'priya@kotak',
      lastUpdatedDate: 'Jun 18, 2026',
      historyLogs: [],
    },
    attendance: {
      presentDays: 22,
      absentDays: 0,
      leaveDays: 1,
      todayInTime: '09:05 AM',
      todayOutTime: null,
      todayGps: '28.440743, 77.531117',
    },
    leads: {
      totalReceived: 45,
      connected: 28,
      inNegotiation: 10,
      meetingScheduled: 5,
      won: 2,
      totalDistributed: 40,
      distributionBreakdown: [
        { targetName: 'Amit Patel', targetRole: 'Sales Exec', count: 25, dateStr: 'Today, 9:30 AM' },
        { targetName: 'Meera Kapoor', targetRole: 'Sales Exec', count: 15, dateStr: 'Yesterday, 3:15 PM' },
      ],
    },
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
    documents: {
      pan: 'KLMNO9012P',
      aadhaar: 'AADHAAR_1122_VERIFIED.pdf',
      eduCert: 'DEGREE_HR_2021.pdf',
      offerLetter: 'OFFER_LETTER_HR_2025.pdf',
      lastUpdatedDate: 'Aug 10, 2026',
      historyLogs: [],
    },
    bankDetails: {
      bankName: 'Axis Bank',
      accountHolder: 'Sunita Verma',
      accountNo: '91802003344556',
      ifscCode: 'UTIB0009988',
      upiId: 'sunita@axis',
      lastUpdatedDate: 'May 02, 2026',
      historyLogs: [],
    },
    attendance: {
      presentDays: 20,
      absentDays: 1,
      leaveDays: 2,
      todayInTime: '09:30 AM',
      todayOutTime: '06:15 PM',
      todayGps: '28.440743, 77.531117',
    },
    leads: {
      totalReceived: 25,
      connected: 15,
      inNegotiation: 5,
      meetingScheduled: 3,
      won: 2,
      totalDistributed: 20,
      distributionBreakdown: [],
    },
    subordinates: [],
    hrMetrics: {
      pendingLeavesCount: 3,
      queriesResolvedCount: 42,
      reportsGeneratedCount: 18,
      totalHiredCount: 12,
      totalFiredCount: 2,
      interviewsConductedCount: 28,
      salaryPendingCount: 2,
      salaryReportsCount: 8,
    },
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
    documents: {
      pan: 'VWXYZ7890A',
      aadhaar: 'AADHAAR_5566_VERIFIED.pdf',
      eduCert: 'DEGREE_BSC_2024.pdf',
      offerLetter: 'OFFER_LETTER_EXEC_2026.pdf',
      lastUpdatedDate: 'Aug 05, 2026',
      historyLogs: [],
    },
    bankDetails: {
      bankName: 'SBI Bank',
      accountHolder: 'Amit Patel',
      accountNo: '20201122334455',
      ifscCode: 'SBIN0001122',
      upiId: 'amit@sbi',
      lastUpdatedDate: 'Jul 12, 2026',
      historyLogs: [],
    },
    attendance: {
      presentDays: 21,
      absentDays: 1,
      leaveDays: 0,
      todayInTime: '09:00 AM',
      todayOutTime: '06:00 PM',
      todayGps: '28.440743, 77.531117',
    },
    leads: {
      totalReceived: 35,
      connected: 22,
      inNegotiation: 8,
      meetingScheduled: 3,
      won: 2,
      totalDistributed: 0,
      distributionBreakdown: [],
    },
    subordinates: [],
  },
];

export function EmployeeListWidget() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState<EmployeeProfileWeb[]>(INITIAL_EMPLOYEES);

  // Inspector State
  const [inspectingEmp, setInspectingEmp] = useState<EmployeeProfileWeb | null>(null);

  // Sub Modals State
  const [showRoleUpgradeModal, setShowRoleUpgradeModal] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [showLeadPreviewModal, setShowLeadPreviewModal] = useState(false);
  const [previewLeadCategory, setPreviewLeadCategory] = useState<'TOTAL' | 'CONNECTED' | 'NEGOTIATION' | 'WON'>('TOTAL');

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [revertNote, setRevertNote] = useState('');

  const [showShareRolesModal, setShowShareRolesModal] = useState(false);

  const [showHrTelemetryModal, setShowHrTelemetryModal] = useState(false);
  const [hrTelemetryCategory, setHrTelemetryCategory] = useState('HIRED');

  // 📄 Documents & 💳 Bank Modals (Bottom Buttons)
  const [showViewDocsModal, setShowViewDocsModal] = useState(false);
  const [showViewBankModal, setShowViewBankModal] = useState(false);

  // Handlers
  const handleUpgradeRole = (newRole: 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC') => {
    if (!inspectingEmp) return;
    setEmployees(prev => prev.map(e => e.id === inspectingEmp.id ? { ...e, role: newRole } : e));
    setInspectingEmp(prev => prev ? { ...prev, role: newRole } : null);
    setShowRoleUpgradeModal(false);
    alert(`✅ Role upgraded to ${newRole.replace('_', ' ')}!`);
  };

  const handleChangeSupervisor = (newSupervisor: string) => {
    if (!inspectingEmp) return;
    setEmployees(prev => prev.map(e => e.id === inspectingEmp.id ? { ...e, assignedManager: newSupervisor } : e));
    setInspectingEmp(prev => prev ? { ...prev, assignedManager: newSupervisor } : null);
    setShowSupervisorModal(false);
    alert(`✅ Supervisor changed to ${newSupervisor}.`);
  };

  const handleToggleLockScreen = () => {
    if (!inspectingEmp) return;
    const nextLocked = !inspectingEmp.isLocked;
    setEmployees(prev => prev.map(e => e.id === inspectingEmp.id ? { ...e, isLocked: nextLocked } : e));
    setInspectingEmp(prev => prev ? { ...prev, isLocked: nextLocked } : null);
    alert(nextLocked ? '🔒 Account screen locked!' : '🔓 Account screen unlocked!');
  };

  const handleInitiate10DayDeletion = () => {
    if (!inspectingEmp) return;
    const scheduledDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    setEmployees(prev => prev.map(e => e.id === inspectingEmp.id ? { ...e, isLocked: true, deletionScheduledAt: scheduledDate } : e));
    setInspectingEmp(prev => prev ? { ...prev, isLocked: true, deletionScheduledAt: scheduledDate } : null);
    setShowDeleteModal(false);
    alert('⚠️ 10-Day Grace Deletion Period initiated. Account locked and scheduled for purge.');
  };

  const handleRequestRevertDeletion = () => {
    if (!inspectingEmp) return;
    if (!revertNote.trim()) {
      alert('Please enter a note explaining why deletion should be reverted.');
      return;
    }
    setEmployees(prev => prev.map(e => e.id === inspectingEmp.id ? { ...e, isLocked: false, deletionScheduledAt: null, deletionReason: revertNote } : e));
    setInspectingEmp(prev => prev ? { ...prev, isLocked: false, deletionScheduledAt: null, deletionReason: revertNote } : null);
    setShowDeleteModal(false);
    setRevertNote('');
    alert(`🎉 Deletion reverted! Note logged: "${revertNote}"`);
  };

  const handleApproveOrDeclineLeave = (approved: boolean) => {
    if (!leaveNote.trim()) {
      alert('Please enter a note for approving or declining the leave application.');
      return;
    }
    setShowLeaveModal(false);
    setLeaveNote('');
    alert(approved ? `✅ Leave approved with note: "${leaveNote}"` : `🔴 Leave declined with note: "${leaveNote}"`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="crm-card bg-gradient-to-r from-card via-background to-card p-6 border border-border rounded-3xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="text-brand-400" size={22} /> Organization Staff Directory &amp; Role Inspector
          </h2>
          <p className="text-xs text-muted mt-1">
            Manage Name, Role, Assign Under, and click <strong className="text-white">Inspect &amp; Control →</strong> for role-tailored operations.
          </p>
        </div>
      </div>

      {/* Main Staff Cards / Directory View */}
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
                    {emp.deletionScheduledAt && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">⏳ 10d PURGE</span>}
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

              {/* Inspect & Control Button */}
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

      {/* 🔍 ROLE-TAILORED INSPECTOR DRAWER MODAL */}
      {inspectingEmp && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-extrabold text-white">{inspectingEmp.name}</h3>
                  <button
                    onClick={() => setShowRoleUpgradeModal(true)}
                    className="px-2 py-0.5 rounded-md bg-brand/20 border border-brand/40 text-brand-300 font-bold text-[10px]"
                  >
                    Upgrade Role ⚡
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">{inspectingEmp.email} • {inspectingEmp.phone}</p>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                  Assign Under: <strong className="text-indigo-400">{inspectingEmp.assignedManager}</strong>
                  <button
                    onClick={() => setShowSupervisorModal(true)}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold"
                  >
                    Change ✏️
                  </button>
                </p>
              </div>
              <button onClick={() => setInspectingEmp(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            {/* ── 1. SALES EXEC INSPECTOR ────────────────────────────────────── */}
            {inspectingEmp.role === 'SALES_EXEC' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">🎯 Lead Performance &amp; Status</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setPreviewLeadCategory('TOTAL'); setShowLeadPreviewModal(true); }} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left">
                    <p className="text-lg font-black text-white">{inspectingEmp.leads.totalReceived}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Total Leads Got →</p>
                  </button>

                  <button onClick={() => { setPreviewLeadCategory('CONNECTED'); setShowLeadPreviewModal(true); }} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left">
                    <p className="text-lg font-black text-amber-400">{inspectingEmp.leads.connected}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Connected (Feedback) →</p>
                  </button>

                  <button onClick={() => { setPreviewLeadCategory('NEGOTIATION'); setShowLeadPreviewModal(true); }} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left">
                    <p className="text-lg font-black text-indigo-400">{inspectingEmp.leads.inNegotiation}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">In Negotiation →</p>
                  </button>

                  <button onClick={() => { setPreviewLeadCategory('WON'); setShowLeadPreviewModal(true); }} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left">
                    <p className="text-lg font-black text-emerald-400">{inspectingEmp.leads.won}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Won Deals →</p>
                  </button>
                </div>

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">⚙️ Operations &amp; Admin Controls</h4>
                <div className="space-y-2">
                  <button onClick={() => router.push(`/hr/attendance?employee=${encodeURIComponent(inspectingEmp.name)}`)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
                    <span>⏱️ Attendance Portal (View {inspectingEmp.name})</span>
                    <ExternalLink size={14} className="text-brand-400" />
                  </button>

                  <button onClick={() => setShowLeaveModal(true)} className="w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center justify-between">
                    <span>📅 Pending Leave Request (Inspect &amp; Approve Note)</span>
                    <FileText size={14} />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleToggleLockScreen} className={`p-2.5 rounded-xl border text-xs font-bold ${inspectingEmp.isLocked ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-200'}`}>
                      {inspectingEmp.isLocked ? '🔓 Unlock Screen' : '🔒 Lock Screen'}
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-300">
                      {inspectingEmp.deletionScheduledAt ? '⏳ Revert Delete' : '🗑️ Delete (10 Days)'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── 2. TEAM LEADER INSPECTOR ────────────────────────────────────── */}
            {inspectingEmp.role === 'TEAM_LEADER' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">👥 Employees Assigned Under {inspectingEmp.name}</h4>
                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {inspectingEmp.subordinates.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 last:border-0">
                      <span className="font-bold text-white">{sub.name} ({sub.role})</span>
                      <span className="text-indigo-400 font-semibold">📞 {sub.calls} Calls • 🎯 {sub.leads} Leads</span>
                    </div>
                  ))}
                </div>

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">📊 Unit Lead Status Audit</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setPreviewLeadCategory('TOTAL'); setShowLeadPreviewModal(true); }} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left">
                    <p className="text-lg font-black text-white">{inspectingEmp.leads.totalReceived}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Got &amp; Distributed →</p>
                  </button>

                  <button onClick={() => { setPreviewLeadCategory('CONNECTED'); setShowLeadPreviewModal(true); }} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left">
                    <p className="text-lg font-black text-amber-400">{inspectingEmp.leads.connected}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Connected →</p>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  <button onClick={() => router.push(`/hr/attendance?employee=${encodeURIComponent(inspectingEmp.name)}`)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200">
                    ⏱️ Attendance Portal (View {inspectingEmp.name}) →
                  </button>
                  <button onClick={() => setShowLeaveModal(true)} className="w-full p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300">
                    📅 Pending Leave Request (Inspect &amp; Note) →
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleToggleLockScreen} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white">
                      {inspectingEmp.isLocked ? '🔓 Unlock' : '🔒 Lock'}
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-300">
                      🗑️ Delete (10 Days)
                    </button>
                  </div>
                  <button onClick={() => setShowShareRolesModal(true)} className="w-full p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-xs font-bold text-indigo-300">
                    📜 Share Roles &amp; Responsibilities Report →
                  </button>
                </div>
              </div>
            )}

            {/* ── 3. MANAGER INSPECTOR ────────────────────────────────────────── */}
            {inspectingEmp.role === 'MANAGER' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">👥 Department Staff Assigned Under {inspectingEmp.name}</h4>
                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {inspectingEmp.subordinates.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 last:border-0">
                      <span className="font-bold text-white">{sub.name} ({sub.role})</span>
                      <span className="text-emerald-400 font-semibold">💰 {sub.revenue} • 🎯 {sub.leads} Leads</span>
                    </div>
                  ))}
                </div>

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">📊 Department Pipeline Lead Audit</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setPreviewLeadCategory('TOTAL'); setShowLeadPreviewModal(true); }} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left">
                    <p className="text-lg font-black text-white">{inspectingEmp.leads.totalReceived}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Total Dept Leads →</p>
                  </button>

                  <button onClick={() => { setPreviewLeadCategory('WON'); setShowLeadPreviewModal(true); }} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left">
                    <p className="text-lg font-black text-emerald-400">{inspectingEmp.leads.won}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Won Deals →</p>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  <button onClick={() => router.push(`/hr/attendance?employee=${encodeURIComponent(inspectingEmp.name)}`)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200">
                    ⏱️ Attendance Portal (View {inspectingEmp.name}) →
                  </button>
                  <button onClick={() => setShowLeaveModal(true)} className="w-full p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300">
                    📅 Pending Leave Request (Inspect &amp; Note) →
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleToggleLockScreen} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white">
                      {inspectingEmp.isLocked ? '🔓 Unlock' : '🔒 Lock'}
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-300">
                      🗑️ Delete (10 Days)
                    </button>
                  </div>
                  <button onClick={() => setShowShareRolesModal(true)} className="w-full p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-xs font-bold text-indigo-300">
                    📜 Share Roles &amp; Responsibilities Report →
                  </button>
                </div>
              </div>
            )}

            {/* ── 4. HR INSPECTOR ────────────────────────────────────────────── */}
            {inspectingEmp.role === 'HR' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">📋 HR Action Controls</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowLeaveModal(true)} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left">
                    <p className="text-lg font-black text-sky-400">{inspectingEmp.hrMetrics?.pendingLeavesCount || 3}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Pending Leave Approve →</p>
                  </button>

                  <button onClick={() => { setHrTelemetryCategory('RESOLVED'); setShowHrTelemetryModal(true); }} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left">
                    <p className="text-lg font-black text-emerald-400">{inspectingEmp.hrMetrics?.queriesResolvedCount || 42}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Queries Resolved →</p>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleToggleLockScreen} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white">
                      {inspectingEmp.isLocked ? '🔓 Unlock' : '🔒 Lock'}
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-300">
                      🗑️ Delete (10 Days)
                    </button>
                  </div>
                  <button onClick={() => setShowShareRolesModal(true)} className="w-full p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-xs font-bold text-indigo-300">
                    📜 Share HR Governance &amp; Policy Sheet →
                  </button>
                </div>
              </div>
            )}

            {/* ── 5. BOTTOM SHARED BUTTONS FOR ALL EMPLOYEES & ROLES ──────────────── */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">📑 Documents &amp; Banking Telemetry (Bottom)</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowViewDocsModal(true)}
                  className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-300 font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  📄 View Documents →
                </button>

                <button
                  onClick={() => setShowViewBankModal(true)}
                  className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  💳 View Bank Details →
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL: VIEW EMPLOYEE DOCUMENTS (BOTTOM BUTTON) ─────────────────── */}
      {showViewDocsModal && inspectingEmp && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">📄 {inspectingEmp.name}'s Documents</h3>
              <button onClick={() => setShowViewDocsModal(false)} className="text-slate-400">✕</button>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <p>• PAN Card: <strong className="text-sky-400">{inspectingEmp.documents.pan}</strong></p>
              <p>• Aadhaar Document: <strong className="text-white">{inspectingEmp.documents.aadhaar}</strong></p>
              <p>• Educational Cert: <strong className="text-white">{inspectingEmp.documents.eduCert}</strong></p>
              <p>• Offer Letter: <strong className="text-white">{inspectingEmp.documents.offerLetter}</strong></p>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400">📜 Old Document Updates History Log:</h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {(inspectingEmp.documents.historyLogs.length ? inspectingEmp.documents.historyLogs : [{ date: 'Aug 01, 2026', docType: 'PAN Card', oldValue: 'XYZDE9876K', newValue: 'ABCDE1234F' }]).map((log, i) => (
                  <div key={i} className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
                    <p className="font-bold text-white">{log.docType} ({log.date})</p>
                    <p className="text-sky-400">Updated to: {log.newValue}</p>
                    <p className="text-slate-500">Old Record: {log.oldValue}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setShowViewDocsModal(false)} className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs">
              Done Viewing Documents
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW EMPLOYEE BANK DETAILS (BOTTOM BUTTON) ──────────────── */}
      {showViewBankModal && inspectingEmp && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">💳 {inspectingEmp.name}'s Bank &amp; Payout Details</h3>
              <button onClick={() => setShowViewBankModal(false)} className="text-slate-400">✕</button>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <p>• Bank Name: <strong className="text-emerald-400">{inspectingEmp.bankDetails.bankName}</strong></p>
              <p>• Account Holder: <strong className="text-white">{inspectingEmp.bankDetails.accountHolder}</strong></p>
              <p>• Account Number: <strong className="text-white">{inspectingEmp.bankDetails.accountNo}</strong></p>
              <p>• IFSC Code: <strong className="text-white">{inspectingEmp.bankDetails.ifscCode}</strong></p>
              <p>• UPI ID: <strong className="text-indigo-400">{inspectingEmp.bankDetails.upiId}</strong></p>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400">📜 Old Bank Updates History Log:</h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {(inspectingEmp.bankDetails.historyLogs.length ? inspectingEmp.bankDetails.historyLogs : [{ date: 'Jul 28, 2026', bankName: 'ICICI Bank', accountNo: '9876XXXX4321' }]).map((log, i) => (
                  <div key={i} className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
                    <p className="font-bold text-white">{log.bankName} ({log.date})</p>
                    <p className="text-emerald-400">Account: {log.accountNo}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setShowViewBankModal(false)} className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs">
              Done Viewing Bank Details
            </button>
          </div>
        </div>
      )}

      {/* ── ROLE UPGRADE MODAL ─────────────────────────────────────────── */}
      {showRoleUpgradeModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">⚡ Upgrade Staff Role</h3>
            <div className="space-y-2">
              {['SALES_EXEC', 'TEAM_LEADER', 'MANAGER', 'HR'].map(r => (
                <button key={r} onClick={() => handleUpgradeRole(r as any)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs font-bold text-white">
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
            <button onClick={() => setShowRoleUpgradeModal(false)} className="w-full py-2 text-xs font-bold text-slate-400">Cancel</button>
          </div>
        </div>
      )}

      {/* ── SUPERVISOR CHANGE MODAL ────────────────────────────────────── */}
      {showSupervisorModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">✏️ Change Assigned Supervisor</h3>
            <div className="space-y-2">
              {['Tenant Admin (Vikram Singh)', 'Manager A (Rajesh Kumar)', 'Manager B (Neha Joshi)', 'Priya Sharma (Team Leader)'].map(m => (
                <button key={m} onClick={() => handleChangeSupervisor(m)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs font-bold text-white">
                  {m}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSupervisorModal(false)} className="w-full py-2 text-xs font-bold text-slate-400">Cancel</button>
          </div>
        </div>
      )}

      {/* ── LEAD PREVIEW MODAL ─────────────────────────────────────────── */}
      {showLeadPreviewModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">📦 {previewLeadCategory} Leads Collection</h3>
              <button onClick={() => setShowLeadPreviewModal(false)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[
                { name: 'Acme Corp (Vikram)', status: 'IN NEGOTIATION', value: '$14,200' },
                { name: 'LogiTech Systems', status: 'CONTACTED', value: '$8,500' },
                { name: 'Sunita Logistics', status: 'WON', value: '$28,000' },
              ].map((ld, i) => (
                <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-white">{ld.name}</p>
                    <p className="text-emerald-400 font-semibold text-[11px]">{ld.value}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">{ld.status}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowLeadPreviewModal(false); setInspectingEmp(null); router.push('/leads'); }} className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-500 text-white font-extrabold text-xs">
              Open Full Lead Collection Page →
            </button>
          </div>
        </div>
      )}

      {/* ── LEAVE INSPECTION MODAL ─────────────────────────────────────── */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">📅 Pending Leave Request Inspection</h3>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white">Applicant: {inspectingEmp?.name}</p>
              <p>Type: Medical Sick Leave (2 Days)</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Inspector Note / Remarks *</label>
              <textarea rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" placeholder="Enter remarks..." value={leaveNote} onChange={e => setLeaveNote(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleApproveOrDeclineLeave(false)} className="flex-1 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 font-bold text-xs">🔴 Decline</button>
              <button onClick={() => handleApproveOrDeclineLeave(true)} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">🟢 Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 10-DAY DELETION MODAL ──────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">🗑️ Account Deletion (10-Day Grace Period)</h3>
            {inspectingEmp?.deletionScheduledAt ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  ⚠️ Account is in 10-Day Grace Deletion Period. Account is locked.
                </div>
                <textarea rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" placeholder="Enter reason to revert..." value={revertNote} onChange={e => setRevertNote(e.target.value)} />
                <button onClick={handleRequestRevertDeletion} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs">↺ Request to Revert Account Deletion →</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
                <button onClick={handleInitiate10DayDeletion} className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-extrabold text-xs">Start 10-Day Purge →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SHARE ROLES MODAL ──────────────────────────────────────────── */}
      {showShareRolesModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">📜 Roles &amp; Responsibilities Report</h3>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <p>Staff: {inspectingEmp?.name} ({inspectingEmp?.role})</p>
              <p>Supervisor: {inspectingEmp?.assignedManager}</p>
            </div>
            <button onClick={() => { alert('📜 Report exported!'); setShowShareRolesModal(false); }} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs">Share Report →</button>
          </div>
        </div>
      )}

      {/* ── HR TELEMETRY MODAL ─────────────────────────────────────────── */}
      {showHrTelemetryModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">📊 HR Telemetry — {hrTelemetryCategory}</h3>
            <button onClick={() => setShowHrTelemetryModal(false)} className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs">Close HR Audit →</button>
          </div>
        </div>
      )}
    </div>
  );
}
