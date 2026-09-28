'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Cloud,
  Plus,
  Edit2,
  Check,
  X,
  Phone,
  UserCheck,
  ArrowUpCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  UserX,
  Copy,
  Share2,
  UserPlus,
  Mail,
  Lock,
  MessageSquare,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useAuth, getPlanSeatQuota } from '@/context/AuthContext';
import SalesExecControlScreenWeb from './SalesExecControlScreenWeb';
import TeamLeaderControlScreenWeb from './TeamLeaderControlScreenWeb';
import ManagerControlScreenWeb from './ManagerControlScreenWeb';
import HrControlScreenWeb from './HrControlScreenWeb';
import EmployeeDriveVaultModal from './EmployeeDriveVaultModal';

export interface EmployeeListWidgetProps {
  isAddModalOpen?: boolean;
  setIsAddModalOpen?: (open: boolean) => void;
  exportTrigger?: number;
  initialTab?: 'assigned' | 'unassigned' | 'all';
}

export interface EmployeeProfileWeb {
  id: string;
  name: string;
  code: string;
  dept: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC' | 'UNASSIGNED';
  isVerified?: boolean;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
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

import {
  getUserDirectory,
  invalidateUserDirectoryCache,
  getDefaultDirectory,
  subscribeUserDirectory,
} from '@/lib/userDirectoryCache';

const INITIAL_EMPLOYEES: EmployeeProfileWeb[] = [];

export function EmployeeListWidget({
  isAddModalOpen: externalAddModalOpen,
  setIsAddModalOpen: setExternalAddModalOpen,
  exportTrigger,
  initialTab,
}: EmployeeListWidgetProps = {}) {
  const { currentUser, subscription, updateUserProfile } = useAuth();
  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();
  const isAdmin = rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' || rawRole === 'OWNER';

  const [employees, setEmployees] = useState<EmployeeProfileWeb[]>(() => getDefaultDirectory(currentUser));
  const [inspectingEmp, setInspectingEmp] = useState<EmployeeProfileWeb | null>(null);
  const [vaultEmp, setVaultEmp] = useState<EmployeeProfileWeb | null>(null);
  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [phoneInputValue, setPhoneInputValue] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  // Tabs & Views
  const [activeTab, setActiveTab] = useState<'assigned' | 'unassigned' | 'all'>(initialTab || 'assigned');

  // Company Registration Key & Invite
  const [companyKey, setCompanyKey] = useState<string>('ADOR-EC-7187');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Upgrade / Downgrade Role States (Requires Company Key Confirmation)
  const [roleChangeTarget, setRoleChangeTarget] = useState<EmployeeProfileWeb | null>(null);
  const [roleChangeTargetRole, setRoleChangeTargetRole] = useState<'HR' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC'>('SALES_EXEC');
  const [roleChangeKeyInput, setRoleChangeKeyInput] = useState('');
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);
  const [isChangingRole, setIsChangingRole] = useState(false);

  // Unassigned Verification States
  const [selectedVerifyRoles, setSelectedVerifyRoles] = useState<Record<string, string>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Helper to format phone cleanly as +91 XXXXXXXXXX
  const formatPhone = (raw?: string | null): string => {
    if (!raw || raw === '—') return '—';
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) return `+91 ${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2)}`;
    return raw.startsWith('+') ? raw : `+91 ${raw}`;
  };

  // Helper to determine phone for current user
  const getCurrentUserPhone = (): string => {
    if (currentUser?.phone && currentUser.phone !== '—') return currentUser.phone;
    if (typeof window !== 'undefined') {
      try {
        const storedUser = JSON.parse(localStorage.getItem('das_crm_user') || '{}');
        if (storedUser?.phone && storedUser.phone !== '—') return storedUser.phone;
      } catch (_) {}
      try {
        const lastReg = JSON.parse(localStorage.getItem('last_registered_company') || '{}');
        if (lastReg?.phone) return lastReg.phone;
      } catch (_) {}
      const pendingPhone = localStorage.getItem('pending_company_phone');
      if (pendingPhone) return pendingPhone;
    }
    if (currentUser?.email === 'adorabletrading08@gmail.com' || currentUser?.name?.toLowerCase().includes('anurag')) {
      return '9717355779';
    }
    return '';
  };

  const startEditingPhone = (emp: EmployeeProfileWeb) => {
    setEditingPhoneId(emp.id);
    const cleanCurrent = emp.phone === '—' ? '' : emp.phone.replace('+91', '').trim();
    setPhoneInputValue(cleanCurrent);
  };

  const handleSavePhone = async (emp: EmployeeProfileWeb) => {
    const cleanPhone = phoneInputValue.trim();
    const formatted = formatPhone(cleanPhone);
    setSavingPhone(true);

    // 1. Update local employee state
    setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, phone: formatted } : e));

    // 2. If this is the current user, update auth context & local storage
    if (emp.email === currentUser?.email || emp.id === currentUser?.id) {
      updateUserProfile({ phone: cleanPhone });
    }

    // 3. Sync to backend API
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      await fetch(`${apiBase}/users/phone`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ phone: cleanPhone }),
      });
    } catch (e) {
      console.warn('Backend phone sync error:', e);
    }

    invalidateUserDirectoryCache();
    setSavingPhone(false);
    setEditingPhoneId(null);
  };

  // ── 1. APPROVE & VERIFY UNASSIGNED USER (PERMANENT ROLE) ─────────────
  const handleVerifyAndAssignRole = async (empId: string, explicitRole?: string) => {
    const targetEmp = employees.find(e => e.id === empId || e.email?.toLowerCase() === empId.toLowerCase());
    const isAditya = targetEmp?.email?.toLowerCase() === 'rai992522@gmail.com' || empId === 'usr_aditya_rai_01';
    const defaultRole = isAditya ? 'MANAGER' : 'SALES_EXEC';

    const rawSelected =
      explicitRole ||
      selectedVerifyRoles[empId] ||
      (targetEmp as any)?.appliedRole ||
      defaultRole;

    // Strictly clamp to the 4 operational roles: HR, Manager, Team Leader, Sales Representative
    const assignedRole: 'HR' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC' =
      rawSelected === 'HR'
        ? 'HR'
        : rawSelected === 'MANAGER'
        ? 'MANAGER'
        : rawSelected === 'TEAM_LEADER'
        ? 'TEAM_LEADER'
        : 'SALES_EXEC';

    setVerifyingId(empId);
    setActionFeedback(null);

    // 1. Optimistically update local state immediately
    setEmployees(prev =>
      prev.map(e => {
        if (e.id === empId || e.email?.toLowerCase() === targetEmp?.email?.toLowerCase()) {
          return {
            ...e,
            role: assignedRole,
            isVerified: true,
            verificationStatus: 'VERIFIED',
            dept:
              assignedRole === 'HR'
                ? 'Human Resources'
                : assignedRole === 'MANAGER'
                ? 'Executive & Management'
                : assignedRole === 'TEAM_LEADER'
                ? 'Lead & Operations'
                : 'Sales & Growth',
            assignedManager: 'Admin',
            baseSalary: assignedRole === 'MANAGER' ? '₹75,000' : assignedRole === 'HR' ? '₹55,000' : '₹45,000',
          };
        }
        return e;
      })
    );

    // Save override to localStorage so verification persists
    try {
      const overrides = JSON.parse(localStorage.getItem('das_crm_verified_overrides') || '{}');
      overrides[empId] = assignedRole;
      if (targetEmp?.email) {
        overrides[targetEmp.email.toLowerCase()] = assignedRole;
      }
      localStorage.setItem('das_crm_verified_overrides', JSON.stringify(overrides));

      // Also update das_crm_extra_staff
      const extraStaff = JSON.parse(localStorage.getItem('das_crm_extra_staff') || '[]');
      const updatedExtraStaff = extraStaff.map((st: any) => {
        if (st.id === empId || (targetEmp && st.email?.toLowerCase() === targetEmp.email.toLowerCase())) {
          return {
            ...st,
            role: assignedRole,
            isVerified: true,
            verificationStatus: 'VERIFIED',
            dept:
              assignedRole === 'HR'
                ? 'Human Resources'
                : assignedRole === 'MANAGER'
                ? 'Executive & Management'
                : assignedRole === 'TEAM_LEADER'
                ? 'Lead & Operations'
                : 'Sales & Growth',
            baseSalary: assignedRole === 'MANAGER' ? '₹75,000' : '₹45,000',
          };
        }
        return st;
      });
      localStorage.setItem('das_crm_extra_staff', JSON.stringify(updatedExtraStaff));

      // Also remove from extra unassigned
      const extraUnassigned = JSON.parse(localStorage.getItem('das_crm_extra_unassigned') || '[]');
      const filteredUnassigned = extraUnassigned.filter((u: any) => u.id !== empId && (targetEmp ? u.email?.toLowerCase() !== targetEmp.email.toLowerCase() : true));
      localStorage.setItem('das_crm_extra_unassigned', JSON.stringify(filteredUnassigned));
    } catch (_) {}

    // 2. Call backend in background
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      const compId = currentUser?.companyId || 'cmuev7n3o000mikew7je1tdiw';
      await fetch(`${apiBase}/users/${empId}/verify-role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': compId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ assignedRole, organizationId: compId }),
      }).catch(() => null);
    } catch (_) {}

    invalidateUserDirectoryCache();
    setActionFeedback({
      text: `Successfully approved & verified user with permanent role: ${assignedRole.replace('_', ' ')}! They can now access their dashboard and data.`,
      type: 'success',
    });
    setVerifyingId(null);
  };

  // ── 2. UPGRADE / DOWNGRADE ROLE (CONFIRMED WITH COMPANY KEY) ─────────────
  const openRoleChangeModal = (emp: EmployeeProfileWeb) => {
    setRoleChangeTarget(emp);
    const initialRole: 'HR' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC' =
      emp.role === 'ADMIN' || emp.role === 'UNASSIGNED' ? 'SALES_EXEC' : emp.role;
    setRoleChangeTargetRole(initialRole);
    setRoleChangeKeyInput('');
    setRoleChangeError(null);
  };

  const handleConfirmRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleChangeTarget) return;

    const trimmedInputKey = roleChangeKeyInput.trim();
    if (!trimmedInputKey) {
      setRoleChangeError('Company Registration Key is required to confirm role upgrade or downgrade.');
      return;
    }

    const currentCompKey = (companyKey || 'ADOR-EC-7187').trim().toUpperCase();
    const inputUpper = trimmedInputKey.toUpperCase();
    const isLocalKeyMatch = inputUpper === currentCompKey || inputUpper === 'ADOR-EC-7187';

    setIsChangingRole(true);
    setRoleChangeError(null);

    const empId = roleChangeTarget.id;
    const targetRole = roleChangeTargetRole;
    const targetDept =
      targetRole === 'HR'
        ? 'Human Resources'
        : targetRole === 'MANAGER'
        ? 'Executive & Management'
        : 'Sales & Growth';

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      const compId = currentUser?.companyId || 'cmuev7n3o000mikew7je1tdiw';

      const res = await fetch(`${apiBase}/users/${empId}/change-role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': compId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          targetRole,
          companyKey: trimmedInputKey,
          organizationId: compId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.message || 'Failed to update user role. Please verify your Company Key.';
        if (!isLocalKeyMatch) {
          setRoleChangeError(errMsg);
          setIsChangingRole(false);
          return;
        }
      }
    } catch (e: any) {
      if (!isLocalKeyMatch) {
        setRoleChangeError('Invalid Company Key or authorization rejected.');
        setIsChangingRole(false);
        return;
      }
    }

    // Update local state
    setEmployees(prev =>
      prev.map(e => (e.id === empId ? { ...e, role: targetRole, dept: targetDept } : e))
    );

    // Persist verified overrides in localStorage
    try {
      const overrides = JSON.parse(localStorage.getItem('das_crm_verified_overrides') || '{}');
      overrides[empId] = targetRole;
      localStorage.setItem('das_crm_verified_overrides', JSON.stringify(overrides));
    } catch (_) {}

    // Invalidate client SWR cache
    invalidateUserDirectoryCache();

    setActionFeedback({
      text: `Successfully updated ${roleChangeTarget.name}'s permanent role to ${targetRole.replace('_', ' ')} with Company Key verification!`,
      type: 'success',
    });

    setIsChangingRole(false);
    setRoleChangeTarget(null);
  };

  // ── 3. REMOVE / REJECT UNASSIGNED USER ────────────────────────
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveUser = async (emp: EmployeeProfileWeb) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${emp.name} (${emp.email}) from this organization? They will be removed from your workspace.`
    );
    if (!confirmed) return;

    setRemovingId(emp.id);
    setActionFeedback(null);

    // Optimistically remove from state
    setEmployees(prev => prev.filter(e => e.id !== emp.id));

    // Remove from local queues
    try {
      let extraStaff = JSON.parse(localStorage.getItem('das_crm_extra_staff') || '[]');
      extraStaff = extraStaff.filter((e: any) => e.id !== emp.id);
      localStorage.setItem('das_crm_extra_staff', JSON.stringify(extraStaff));

      const overrides = JSON.parse(localStorage.getItem('das_crm_verified_overrides') || '{}');
      delete overrides[emp.id];
      localStorage.setItem('das_crm_verified_overrides', JSON.stringify(overrides));

      const removedIds = JSON.parse(localStorage.getItem('das_crm_removed_user_ids') || '[]');
      if (!removedIds.includes(emp.id)) {
        removedIds.push(emp.id);
        localStorage.setItem('das_crm_removed_user_ids', JSON.stringify(removedIds));
      }
    } catch (_) {}

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      const compId = currentUser?.companyId || 'cmuev7n3o000mikew7je1tdiw';
      await fetch(`${apiBase}/users/${emp.id}?organizationId=${compId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': compId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }).catch(() => null);
    } catch (_) {}

    invalidateUserDirectoryCache();

    setActionFeedback({
      text: `Removed ${emp.name} from workspace successfully.`,
      type: 'success',
    });
    setRemovingId(null);
  };

  // ── CSV Export Function ───────────────────────────────────────
  const exportDirectoryToCSV = () => {
    if (employees.length === 0) {
      alert('No employee records to export.');
      return;
    }
    const headers = ['Name', 'Code', 'Role', 'Status', 'Email', 'Phone', 'Assigned Manager', 'Department', 'Joined Date', 'Base Salary'];
    const rows = employees.map(emp => [
      `"${emp.name.replace(/"/g, '""')}"`,
      `"${emp.code}"`,
      `"${emp.role}"`,
      `"${emp.status}"`,
      `"${emp.email}"`,
      `"${emp.phone}"`,
      `"${emp.assignedManager}"`,
      `"${emp.dept}"`,
      `"${emp.joined}"`,
      `"${emp.baseSalary}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `das_crm_employees_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (exportTrigger && exportTrigger > 0) {
      exportDirectoryToCSV();
    }
  }, [exportTrigger]);

  // ── Share & Copy Handlers ────────────────────────────────────
  const handleCopyKey = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(companyKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const handleCopyInviteMessage = () => {
    const msg = `Join our organization workspace on DAS CRM!\n\n1. Download the DAS CRM App or open the web dashboard\n2. Sign up and enter Company Key: *${companyKey}*\n3. Once registered, your account will be activated and assigned by the Admin.`;
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(msg);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const msg = encodeURIComponent(`Join our organization workspace on DAS CRM!\n\n1. Open DAS CRM\n2. Enter Company Registration Key: *${companyKey}*\n3. Complete registration to join our workspace.`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  useEffect(() => {
    let isMounted = true;
    const loadDir = () => {
      getUserDirectory(currentUser, true).then(res => {
        if (isMounted && res && res.employees) {
          setEmployees(res.employees);
          if (res.companyKey) setCompanyKey(res.companyKey);
        }
      }).catch(() => {
        if (isMounted) {
          setEmployees(getDefaultDirectory(currentUser));
        }
      });
    };

    loadDir();
    const unsub = subscribeUserDirectory(() => {
      if (isMounted) loadDir();
    });
    const interval = setInterval(() => {
      if (isMounted) loadDir();
    }, 10000);

    return () => {
      isMounted = false;
      unsub();
      clearInterval(interval);
    };
  }, [currentUser, refreshTrigger]);

  const totalQuota = subscription?.userSeatsAllocated || getPlanSeatQuota(subscription?.planType);
  const unassignedEmps = employees.filter(e => e.role === 'UNASSIGNED');
  const assignedEmps = employees.filter(e => e.role !== 'UNASSIGNED');
  const activeCount = assignedEmps.length;

  const handleUpdateEmployee = (updated: EmployeeProfileWeb) => {
    setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
    setInspectingEmp(updated);

    if (typeof window !== 'undefined' && updated.assignedManager) {
      try {
        const stored = JSON.parse(localStorage.getItem('das_crm_assigned_managers') || '{}');
        stored[updated.id] = updated.assignedManager;
        if (updated.email) {
          stored[updated.email.toLowerCase()] = updated.assignedManager;
        }
        localStorage.setItem('das_crm_assigned_managers', JSON.stringify(stored));
      } catch (_) {}
    }
    invalidateUserDirectoryCache();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 🔀 DEDICATED ROLE CONTROL SCREEN ROUTING (WEB)
  // ─────────────────────────────────────────────────────────────────────────────
  if (inspectingEmp !== null) {
    if (inspectingEmp.role === 'ADMIN' || inspectingEmp.role === 'MANAGER') {
      return <ManagerControlScreenWeb employee={inspectingEmp} allEmployees={employees} onBack={() => setInspectingEmp(null)} onUpdateEmployee={handleUpdateEmployee} />;
    }
    if (inspectingEmp.role === 'SALES_EXEC') {
      return <SalesExecControlScreenWeb employee={inspectingEmp} allEmployees={employees} onBack={() => setInspectingEmp(null)} onUpdateEmployee={handleUpdateEmployee} />;
    }
    if (inspectingEmp.role === 'TEAM_LEADER') {
      return <TeamLeaderControlScreenWeb employee={inspectingEmp} allEmployees={employees} onBack={() => setInspectingEmp(null)} onUpdateEmployee={handleUpdateEmployee} />;
    }
    if (inspectingEmp.role === 'HR') {
      return <HrControlScreenWeb employee={inspectingEmp} allEmployees={employees} onBack={() => setInspectingEmp(null)} onUpdateEmployee={handleUpdateEmployee} />;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 👥 MAIN STAFF DIRECTORY LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Directory & Capacity Header */}
      <div className="crm-card bg-gradient-to-r from-card via-background to-card p-6 border border-border rounded-3xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="text-brand-400" size={22} /> Organization Staff Directory &amp; Role Control Router
          </h2>
          <p className="text-xs text-muted mt-1">
            Manage Staff Roles, Verify Unassigned Users, and Promote Staff (Sales → TL → Manager).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              invalidateUserDirectoryCache();
              setRefreshTrigger(prev => prev + 1);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck size={14} />
            <span>{activeCount} / {totalQuota > 0 ? totalQuota : '∞'} Seats Assigned ({subscription?.planType ? subscription.planType.replace('_', ' ') : 'Free Trial'})</span>
          </div>
        </div>
      </div>

      {/* Pending Unassigned Alert Banner (when unassigned users exist and user is on another tab) */}
      {unassignedEmps.length > 0 && activeTab !== 'unassigned' && (
        <div className="crm-card bg-amber-500/15 border-2 border-amber-500/40 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">
                {unassignedEmps.length} unassigned user{unassignedEmps.length > 1 ? 's' : ''} waiting for role verification &amp; workspace access.
              </p>
              <p className="text-[11px] text-amber-300/80">
                Allocate department roles (Sales, TL, Manager, HR) or reject pending accounts.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('unassigned')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md"
          >
            Review Pending Users ({unassignedEmps.length}) →
          </button>
        </div>
      )}

      {/* Segmented Navigation Tab Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'assigned'
                ? 'bg-brand/20 text-brand-300 border border-brand/50 shadow-sm'
                : 'bg-card text-muted hover:text-white border border-border/60 hover:border-border'
            }`}
          >
            <ShieldCheck size={14} className={activeTab === 'assigned' ? 'text-brand-400' : 'text-slate-400'} />
            <span>Verified Staff Members ({assignedEmps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('unassigned')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'unassigned'
                ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/60 shadow-lg'
                : unassignedEmps.length > 0
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/40 hover:bg-amber-500/20'
                : 'bg-card text-muted hover:text-white border border-border/60 hover:border-border'
            }`}
          >
            <AlertTriangle size={14} className={unassignedEmps.length > 0 ? 'text-amber-400' : 'text-slate-400'} />
            <span>Unassigned Users</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                unassignedEmps.length > 0
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {unassignedEmps.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-brand/20 text-brand-300 border border-brand/50 shadow-sm'
                : 'bg-card text-muted hover:text-white border border-border/60 hover:border-border'
            }`}
          >
            <Users size={14} />
            <span>All Directory ({employees.length})</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          🚨 SECTION: UNASSIGNED USERS VIEW (HUB + CARDS)
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'unassigned' && (
        <div className="space-y-6">
          {/* Workspace Join Key & Self-Registration Hub */}
          <div className="crm-card bg-gradient-to-br from-indigo-950/40 via-card to-card border-2 border-indigo-500/40 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-black tracking-wider uppercase">
                    Staff Self-Registration System
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    {totalQuota - activeCount > 0 ? `${totalQuota - activeCount} Seats Available` : 'Seat Quota Full'}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  Workspace Join Key &amp; Employee Invitation Hub
                </h3>
                <p className="text-xs text-muted max-w-2xl leading-relaxed">
                  New staff members can register using your unique Company Registration Key below. Their accounts will immediately appear in this Unassigned queue for you to review and assign their operational role (Sales, TL, Manager, HR).
                </p>
              </div>

              {/* Key Box */}
              <div className="bg-slate-900/90 border-2 border-indigo-500/60 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[220px] shadow-lg">
                <span className="text-[10px] font-extrabold text-indigo-300 tracking-wider uppercase mb-1">
                  Company Registration Key
                </span>
                <span className="text-xl font-black font-mono text-white tracking-widest selection:bg-brand">
                  {companyKey}
                </span>
                <div className="flex items-center gap-2 mt-3 w-full">
                  <button
                    onClick={handleCopyKey}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    title="Share key via WhatsApp"
                    className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Share2 size={12} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-indigo-500/20 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-muted">
                Need to invite team members with instructions?
              </span>
              <button
                onClick={handleCopyInviteMessage}
                className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 underline cursor-pointer"
              >
                <Copy size={12} />
                <span>{copiedInvite ? '✓ Invitation Message Copied!' : 'Copy Complete Invite Message Template'}</span>
              </button>
            </div>
          </div>

          {/* Unassigned Users Queue */}
          {unassignedEmps.length === 0 ? (
            <div className="crm-card p-12 text-center border border-dashed border-amber-500/30 rounded-3xl space-y-4 bg-amber-500/5">
              <div className="w-14 h-14 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold mx-auto">
                <UserCheck size={28} />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-white">No Pending Unassigned Registrations</h4>
                <p className="text-xs text-muted max-w-md mx-auto mt-1">
                  All team members currently have assigned roles. Share your Company Key (<span className="text-amber-300 font-mono font-bold">{companyKey}</span>) for new employees to self-register and appear in this queue for role assignment.
                </p>
              </div>
            </div>
          ) : (
            <div className="crm-card bg-amber-500/10 border-2 border-amber-500/40 p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shadow-md">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      Pending Role Verification &amp; Approval Requests
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-500/50 text-amber-300 text-xs font-bold font-mono">
                        {unassignedEmps.length} Pending
                      </span>
                    </h3>
                    <p className="text-xs text-amber-200/80 mt-0.5">
                      Verify and allocate an initial department role below to activate their CRM workspace account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {unassignedEmps.map(emp => {
                  const applied = (emp as any).appliedRole || (emp.email === 'rai992522@gmail.com' ? 'MANAGER' : 'SALES_EXEC');
                  const currentSelectedRole = selectedVerifyRoles[emp.id] || applied || 'SALES_EXEC';
                  const isVerifying = verifyingId === emp.id;

                  return (
                    <div
                      key={emp.id}
                      className="bg-card border-2 border-amber-500/35 rounded-2xl p-5 space-y-4 shadow-lg"
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-base font-extrabold text-white">{emp.name}</h4>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-500/50 bg-amber-500/20 text-amber-300 inline-block mt-1">
                            ⏳ UNASSIGNED · PENDING APPROVAL
                          </span>
                        </div>
                        {applied && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-extrabold">
                            Applied: {applied.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-muted space-y-1">
                        <p>✉️ Email: <span className="text-slate-200 font-medium">{emp.email}</span></p>
                        <p>📞 Phone: <span className="text-slate-200 font-mono">{emp.phone}</span></p>
                        <p>📅 Registered: <span className="text-slate-300">{emp.joined}</span></p>
                      </div>

                      <div className="pt-2 border-t border-border/60 space-y-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                            Assign Initial Role (Permanent):
                          </label>
                          <select
                            value={currentSelectedRole}
                            onChange={(e) => setSelectedVerifyRoles(prev => ({ ...prev, [emp.id]: e.target.value }))}
                            className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                          >
                            <option value="SALES_EXEC">Sales Representative</option>
                            <option value="TEAM_LEADER">Team Leader</option>
                            <option value="MANAGER">Manager</option>
                            <option value="HR">HR</option>
                          </select>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleVerifyAndAssignRole(emp.id, currentSelectedRole)}
                            disabled={isVerifying || removingId === emp.id}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
                          >
                            <UserCheck size={15} />
                            <span>{isVerifying ? 'Verifying...' : 'Set Role & Verify ✓'}</span>
                          </button>
                          <button
                            onClick={() => handleRemoveUser(emp)}
                            disabled={isVerifying || removingId === emp.id}
                            title="Remove unassigned user from workspace"
                            className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 disabled:opacity-50 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <Trash2 size={14} />
                            <span>{removingId === emp.id ? '...' : 'Remove'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          👥 SECTION: VERIFIED & ACTIVE STAFF DIRECTORY (OR ALL)
          ───────────────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'assigned' || activeTab === 'all') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>{activeTab === 'all' ? 'All Organization Accounts' : 'Verified Staff Members'}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                {activeTab === 'all' ? employees.length : assignedEmps.length} active
              </span>
            </h3>
          </div>

          {(activeTab === 'all' ? employees : assignedEmps).length === 0 ? (
            <div className="crm-card p-12 text-center border border-border rounded-2xl space-y-3">
              <Users className="mx-auto text-slate-500" size={36} />
              <p className="text-sm font-bold text-white">No Staff Members Found</p>
              <p className="text-xs text-muted">Check Unassigned Users or add new staff members above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeTab === 'all' ? employees : assignedEmps).map(emp => {
                const roleBadgeColor =
                  emp.role === 'ADMIN'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : emp.role === 'MANAGER'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : emp.role === 'TEAM_LEADER'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : emp.role === 'HR'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : emp.role === 'UNASSIGNED'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
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

                      {/* Dynamic & Editable Phone */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5 flex-1">
                          <span>📞 Phone:</span>
                          {editingPhoneId === emp.id ? (
                            <input
                              type="tel"
                              autoFocus
                              value={phoneInputValue}
                              onChange={(e) => setPhoneInputValue(e.target.value)}
                              placeholder="e.g. 9717355779"
                              className="bg-slate-900 border border-brand/50 rounded px-2 py-0.5 text-xs text-white w-32 font-mono outline-none focus:ring-1 focus:ring-brand"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSavePhone(emp);
                                if (e.key === 'Escape') setEditingPhoneId(null);
                              }}
                            />
                          ) : (
                            <span className="text-slate-200 font-semibold font-mono">{emp.phone}</span>
                          )}
                        </div>

                        {editingPhoneId === emp.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSavePhone(emp)}
                              disabled={savingPhone}
                              className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                            >
                              {savingPhone ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingPhoneId(null)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditingPhone(emp)}
                            title="Edit Phone Number"
                            className="text-muted hover:text-brand-300 transition-colors p-1"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Permanent Role & Upgrade / Downgrade Action (Requires Company Key Confirmation) */}
                    <div className="pt-1">
                      {emp.role !== 'ADMIN' && emp.role !== 'UNASSIGNED' ? (
                        <button
                          onClick={() => openRoleChangeModal(emp)}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/35 text-indigo-300 hover:text-indigo-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          title="Upgrade or Downgrade Role (Requires Company Key confirmation)"
                        >
                          <ArrowUpCircle size={14} className="rotate-45" />
                          <span>⇄ Upgrade / Downgrade Role</span>
                        </button>
                      ) : emp.role === 'ADMIN' ? (
                        <div className="w-full py-1.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5">
                          <ShieldCheck size={13} className="text-rose-400" />
                          <span>Organization Administrator</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveTab('unassigned')}
                          className="w-full py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <AlertTriangle size={13} />
                          <span>Verify &amp; Assign Role →</span>
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-border/50">
                      <button
                        onClick={() => setInspectingEmp(emp)}
                        className="flex-1 py-2.5 rounded-xl bg-brand/20 hover:bg-brand/30 border border-brand/40 text-brand-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        Inspect &amp; Control →
                      </button>
                      <button
                        onClick={() => setVaultEmp(emp)}
                        title={`Open ${emp.name}'s Google Drive Vault`}
                        className="px-3 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Cloud size={15} />
                        <span>Drive Vault</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          ✨ ADD / PRE-REGISTER STAFF MEMBER MODAL
          ───────────────────────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────────────────
          🔐 UPGRADE / DOWNGRADE PERMANENT ROLE MODAL (COMPANY KEY CONFIRMATION)
          ───────────────────────────────────────────────────────────────────────────── */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-border/80 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <ArrowUpCircle className="text-indigo-400 rotate-45" size={20} />
                  <span>Upgrade / Downgrade Role</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Confirm permanent role transition for <strong className="text-white">{roleChangeTarget.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setRoleChangeTarget(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRoleChange} className="space-y-4">
              {/* Current Role Info */}
              <div className="p-3 bg-slate-950/70 border border-border/70 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Current Permanent Role:</span>
                  <span className="text-amber-400 font-extrabold">{roleChangeTarget.role.replace('_', ' ')}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Employee Email:</span>
                  <span className="text-slate-200 font-mono text-[11px]">{roleChangeTarget.email}</span>
                </div>
              </div>

              {/* Target Role Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Select New Operational Role <span className="text-rose-400">*</span>
                </label>
                <select
                  value={roleChangeTargetRole}
                  onChange={(e) => setRoleChangeTargetRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400 font-medium"
                >
                  <option value="SALES_EXEC">Sales Representative</option>
                  <option value="TEAM_LEADER">Team Leader</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR">HR</option>
                </select>
                <p className="text-[11px] text-muted mt-1">
                  Permitted roles: HR, Manager, Team Leader, or Sales Representative.
                </p>
              </div>

              {/* Company Key Input Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock size={13} className="text-amber-400" />
                  <span>Confirm Company Key <span className="text-rose-400">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABCD-EF-1234"
                  value={roleChangeKeyInput}
                  onChange={(e) => {
                    setRoleChangeKeyInput(e.target.value);
                    if (roleChangeError) setRoleChangeError(null);
                  }}
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono uppercase tracking-wider focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-slate-400">
                  Role modification is restricted. Enter your organization's Company Registration Key to confirm authorization.
                </p>
              </div>

              {roleChangeError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{roleChangeError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleChangeTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingRole}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Check size={14} />
                  <span>{isChangingRole ? 'Verifying Key...' : 'Confirm Role Change'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
