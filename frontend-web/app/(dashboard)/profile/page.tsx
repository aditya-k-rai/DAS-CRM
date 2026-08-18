'use client';

import { useState } from 'react';
import {
  User, Shield, Building2, Key, CreditCard, Calendar, Clock, DollarSign,
  TrendingUp, PhoneCall, Target, Download, LogOut, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Topbar } from '@/components/layout/Topbar';

export default function UserProfilePage() {
  const { currentUser, subscription, logout } = useAuth();
  const [downloadingLogs, setDownloadingLogs] = useState(false);
  const [downloadingPayslip, setDownloadingPayslip] = useState(false);

  const role: UserRole = (currentUser.role || 'SALES_EXEC') as UserRole;

  // Role color tokens
  const roleBadgeColor =
    role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
    role === 'HR' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' :
    role === 'MANAGER' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
    role === 'TEAM_LEADER' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  // Role-customized Telemetry Data
  const roleMetrics = {
    SUPER_ADMIN: {
      salesLabel: 'Total Platform Revenue Managed',
      salesVal: '$2.4M',
      callsLabel: 'System Telemetry Calls Logged',
      callsVal: '18.4k Calls',
      scopeLabel: 'Total Active Tenants',
      scopeVal: '42 Companies',
      goalLabel: 'Platform Uptime Target',
      goalVal: '99.99%',
    },
    ADMIN: {
      salesLabel: 'Total Organization Sales Volume',
      salesVal: '$148,500',
      callsLabel: 'Total System Calls Audited',
      callsVal: '1,420 Calls',
      scopeLabel: 'Total Ingested Leads',
      scopeVal: '1,420 Leads',
      goalLabel: 'System Conversion Target',
      goalVal: '28.5%',
    },
    HR: {
      salesLabel: 'Total Processed Payroll Volume',
      salesVal: '$64,200',
      callsLabel: 'HR Audit Calls Recorded',
      callsVal: '184 Calls',
      scopeLabel: 'Employees Audited',
      scopeVal: '24 Staff Members',
      goalLabel: 'Attendance Rate Today',
      goalVal: '95.5%',
    },
    MANAGER: {
      salesLabel: 'Department Revenue Managed',
      salesVal: '₹24.8L',
      callsLabel: 'Total Team Calls Supervised',
      callsVal: '580 Calls',
      scopeLabel: 'Open Leads Queue',
      scopeVal: '142 Leads',
      goalLabel: 'Department Goal Progress',
      goalVal: '82% Achieved',
    },
    TEAM_LEADER: {
      salesLabel: 'Team Unit Revenue',
      salesVal: '₹14.2L (🥇 #1 Team)',
      callsLabel: 'Total Unit Calls Logged',
      callsVal: '340 Calls',
      scopeLabel: 'Unassigned Unit Leads',
      scopeVal: '18 Leads',
      goalLabel: 'Team Conversion Rate',
      goalVal: '28.5%',
    },
    SALES_EXEC: {
      salesLabel: 'Personal Closed Sales',
      salesVal: '₹5.2L (12 Deals Won)',
      callsLabel: 'Personal Calls Made Today',
      callsVal: '38 Calls',
      scopeLabel: 'My Assigned Leads',
      scopeVal: '31 Leads',
      goalLabel: 'Personal Best Rate',
      goalVal: '38.7%',
    },
  }[role] || {
    salesLabel: 'Personal Closed Sales',
    salesVal: '₹5.2L',
    callsLabel: 'Personal Calls Made',
    callsVal: '38 Calls',
    scopeLabel: 'My Assigned Leads',
    scopeVal: '31 Leads',
    goalLabel: 'Personal Conversion Rate',
    goalVal: '38.7%',
  };

  // Export CSV functions
  const handleExportPerformanceCSV = () => {
    setDownloadingLogs(true);
    setTimeout(() => {
      const headers = ['Date', 'Metric', 'Value', 'Status'];
      const rows = [
        ['2026-08-19', roleMetrics.salesLabel, roleMetrics.salesVal, 'VERIFIED'],
        ['2026-08-19', roleMetrics.callsLabel, roleMetrics.callsVal, 'LOGGED'],
        ['2026-08-19', roleMetrics.scopeLabel, roleMetrics.scopeVal, 'ACTIVE'],
        ['2026-08-19', roleMetrics.goalLabel, roleMetrics.goalVal, 'ON TARGET'],
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${currentUser.name.replace(/\s+/g, '_')}_Performance_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadingLogs(false);
    }, 800);
  };

  const handleExportAttendanceCSV = () => {
    setDownloadingPayslip(true);
    setTimeout(() => {
      const headers = ['Month', 'Base Salary', 'Incentives', 'Overtime Money', 'Net Earning', 'Days Present', 'Leaves Taken'];
      const rows = [
        ['August 2026', '₹45,000', '₹12,500', '₹4,200', '₹61,700', '21 Days', '2 Days'],
        ['July 2026', '₹45,000', '₹10,800', '₹3,500', '₹59,300', '22 Days', '1 Day'],
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${currentUser.name.replace(/\s+/g, '_')}_Attendance_Payslip.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadingPayslip(false);
    }, 800);
  };

  return (
    <div className="flex-1 space-y-6 pb-12">
      <Topbar title="User & Workspace Profile" />

      <main className="px-4 sm:px-6 space-y-6 max-w-7xl mx-auto">

        {/* ── SECTION 1: USER & COMPANY IDENTITY BANNER ── */}
        <div className="crm-card p-6 border-l-4 border-l-brand bg-card">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="avatar w-16 h-16 text-xl font-bold bg-brand/20 text-brand-400 border border-brand/30">
                {currentUser.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-white">{currentUser.name}</h1>
                  <span className={`text-xs px-2.5 py-0.5 rounded font-extrabold border ${roleBadgeColor}`}>
                    ROLE: {role.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">{currentUser.email} • {currentUser.companyName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportPerformanceCSV}
                disabled={downloadingLogs}
                className="btn-secondary text-xs gap-1.5 flex items-center"
              >
                <Download size={14} /> {downloadingLogs ? 'Exporting...' : 'Export Telemetry CSV'}
              </button>
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="btn-danger text-xs gap-1.5 flex items-center"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: WORKSPACE IDENTIFIERS & SUBSCRIPTION ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="crm-card space-y-2">
            <div className="flex items-center gap-2 text-brand-400">
              <Building2 size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Company Name</span>
            </div>
            <p className="text-lg font-bold text-white">{currentUser.companyName}</p>
            <p className="text-xs text-muted">Organization ID: {currentUser.companyId}</p>
          </div>

          <div className="crm-card space-y-2">
            <div className="flex items-center gap-2 text-purple-400">
              <Key size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Company Registration Key</span>
            </div>
            <p className="text-lg font-mono font-bold text-purple-300">ACME-KX-7421</p>
            <p className="text-xs text-emerald-400 font-semibold">✓ Verified Workspace License</p>
          </div>

          <div className="crm-card space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <CreditCard size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Subscription Plan</span>
            </div>
            <p className="text-lg font-bold text-emerald-300">
              {subscription.planType.replace('_', ' ')} ({subscription.userSeatsAllocated} Seats)
            </p>
            <p className="text-xs text-amber-400 font-semibold">
              {subscription.planType === 'FREE_TRIAL' ? `${subscription.trialDaysLeft} Days Remaining` : 'Active Subscription'}
            </p>
          </div>
        </div>

        {/* ── SECTION 3: ROLE-CUSTOMIZED TELEMETRY & SALES METRICS ── */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-400" /> Role Performance &amp; Telemetry ({role.replace('_', ' ')})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="crm-card">
              <p className="text-xs text-muted font-medium mb-1">{roleMetrics.salesLabel}</p>
              <p className="text-2xl font-extrabold text-brand-400">{roleMetrics.salesVal}</p>
              <p className="text-xs text-emerald-400 font-semibold mt-1">✓ Synchronized</p>
            </div>
            <div className="crm-card">
              <p className="text-xs text-muted font-medium mb-1">{roleMetrics.callsLabel}</p>
              <p className="text-2xl font-extrabold text-white">{roleMetrics.callsVal}</p>
              <p className="text-xs text-brand-400 font-semibold mt-1">Logged Telemetry</p>
            </div>
            <div className="crm-card">
              <p className="text-xs text-muted font-medium mb-1">{roleMetrics.scopeLabel}</p>
              <p className="text-2xl font-extrabold text-blue-400">{roleMetrics.scopeVal}</p>
              <p className="text-xs text-blue-300 font-semibold mt-1">Active Scope</p>
            </div>
            <div className="crm-card">
              <p className="text-xs text-muted font-medium mb-1">{roleMetrics.goalLabel}</p>
              <p className="text-2xl font-extrabold text-emerald-400">{roleMetrics.goalVal}</p>
              <p className="text-xs text-emerald-400 font-semibold mt-1">Target Rate</p>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: ATTENDANCE & LEAVE RECORDS ── */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Calendar size={18} className="text-sky-400" /> Attendance &amp; Leave Audit
          </h2>
          <div className="crm-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-border mb-4">
              <div>
                <p className="text-xs text-muted mb-1">Today's Status</p>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ PRESENT (09:05 AM)
                </span>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Days Present (This Month)</p>
                <p className="text-xl font-bold text-white">21 Days</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Approved Leaves Taken</p>
                <p className="text-xl font-bold text-amber-400">2 Days Taken</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Remaining Leave Balance</p>
                <p className="text-xl font-bold text-sky-400">12 Days Remaining</p>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-muted">Audit Period: August 2026 • Scoped to authenticated user</p>
              <button
                onClick={handleExportAttendanceCSV}
                disabled={downloadingPayslip}
                className="btn-secondary text-xs gap-1.5 flex items-center"
              >
                <Download size={13} /> {downloadingPayslip ? 'Generating...' : 'Export Attendance & Payslip CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* ── SECTION 5: SALARY, INCENTIVES & OVERTIME EARNINGS ── */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-400" /> Salary, Incentives &amp; Overtime Earnings
          </h2>
          <div className="crm-card space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl border border-border bg-background">
                <p className="text-xs text-muted mb-1">Base Monthly Salary</p>
                <p className="text-xl font-extrabold text-white">₹45,000 / mo</p>
                <p className="text-xs text-muted mt-0.5">Fixed Base CTC</p>
              </div>
              <div className="p-3 rounded-xl border border-border bg-background">
                <p className="text-xs text-muted mb-1">Incentives &amp; Bonuses</p>
                <p className="text-xl font-extrabold text-emerald-400">+₹12,500</p>
                <p className="text-xs text-emerald-400 mt-0.5">Closed Deal Commissions</p>
              </div>
              <div className="p-3 rounded-xl border border-border bg-background">
                <p className="text-xs text-muted mb-1">Extra Working / Overtime</p>
                <p className="text-xl font-extrabold text-purple-400">+₹4,200</p>
                <p className="text-xs text-purple-300 mt-0.5">Weekend Shift Allowance</p>
              </div>
              <div className="p-3 rounded-xl border border-brand/40 bg-brand/10">
                <p className="text-xs text-brand-300 font-semibold mb-1">Total Net Processed Earnings</p>
                <p className="text-2xl font-extrabold text-brand-400">₹61,700</p>
                <p className="text-xs text-brand-300 mt-0.5">Net Monthly Payout</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
