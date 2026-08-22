'use client';

import { useState } from 'react';
import {
  User, Shield, Building2, Key, CreditCard, Calendar, Clock, DollarSign,
  TrendingUp, PhoneCall, Target, Download, LogOut, CheckCircle2, AlertCircle, Sparkles,
  FileText, History, Lock, Edit2
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

  // 📄 15-DAY DOCUMENTS UPDATE LOCK & HISTORY
  const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
  const [lastDocChangedAt, setLastDocChangedAt] = useState<number | null>(
    Date.now() - 18 * 24 * 60 * 60 * 1000
  );
  const timeSinceLastDocChange = lastDocChangedAt ? Date.now() - lastDocChangedAt : FIFTEEN_DAYS_MS + 1000;
  const isDocLocked = timeSinceLastDocChange < FIFTEEN_DAYS_MS;
  const docDaysRemaining = Math.ceil((FIFTEEN_DAYS_MS - timeSinceLastDocChange) / (1000 * 60 * 60 * 24));

  const [showDocModal, setShowDocModal] = useState(false);
  const [showDocHistoryModal, setShowDocHistoryModal] = useState(false);
  const [panInput, setPanInput] = useState('ABCDE1234F');
  const [aadhaarInput, setAadhaarInput] = useState('AADHAAR_9876_VERIFIED.pdf');
  const [eduCertInput, setEduCertInput] = useState('DEGREE_BTECH_2024.pdf');
  const [docHistoryLogs, setDocHistoryLogs] = useState<{ date: string; docType: string; oldValue: string; newValue: string }[]>([
    { date: 'Aug 01, 2026', docType: 'PAN Card', oldValue: 'XYZDE9876K', newValue: 'ABCDE1234F' },
    { date: 'Jul 15, 2026', docType: 'Aadhaar ID', oldValue: 'AADHAAR_OLD.pdf', newValue: 'AADHAAR_9876_VERIFIED.pdf' },
  ]);

  // 💳 15-DAY BANK DETAILS UPDATE LOCK & HISTORY
  const [lastBankChangedAt, setLastBankChangedAt] = useState<number | null>(
    Date.now() - 20 * 24 * 60 * 60 * 1000
  );
  const timeSinceLastBankChange = lastBankChangedAt ? Date.now() - lastBankChangedAt : FIFTEEN_DAYS_MS + 1000;
  const isBankLocked = timeSinceLastBankChange < FIFTEEN_DAYS_MS;
  const bankDaysRemaining = Math.ceil((FIFTEEN_DAYS_MS - timeSinceLastBankChange) / (1000 * 60 * 60 * 24));

  const [showBankModal, setShowBankModal] = useState(false);
  const [showBankHistoryModal, setShowBankHistoryModal] = useState(false);
  const [bankNameInput, setBankNameInput] = useState('HDFC Bank');
  const [accountHolderInput, setAccountHolderInput] = useState(currentUser.name || 'Vikram Singh');
  const [accountNoInput, setAccountNoInput] = useState('50100987654321');
  const [ifscCodeInput, setIfscCodeInput] = useState('HDFC0001234');
  const [bankHistoryLogs, setBankHistoryLogs] = useState<{ date: string; bankName: string; accountNo: string }[]>([
    { date: 'Jul 28, 2026', bankName: 'ICICI Bank', accountNo: '9876XXXX4321' },
    { date: 'May 10, 2026', bankName: 'SBI Bank', accountNo: '1122XXXX9900' },
  ]);

  const handleSaveDocuments = () => {
    if (isDocLocked) {
      alert(`🔒 Documents can only be updated once every 15 days. Next update eligible in ${docDaysRemaining} days.`);
      return;
    }
    const newLog = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      docType: 'PAN / Aadhaar Update',
      oldValue: 'Previous Records',
      newValue: `PAN: ${panInput}`,
    };
    setDocHistoryLogs(prev => [newLog, ...prev]);
    setLastDocChangedAt(Date.now());
    setShowDocModal(false);
    alert('✅ Documents updated! 15-day cooldown locked.');
  };

  const handleSaveBankDetails = () => {
    if (isBankLocked) {
      alert(`🔒 Bank details can only be updated once every 15 days. Next update eligible in ${bankDaysRemaining} days.`);
      return;
    }
    const newLog = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      bankName: bankNameInput,
      accountNo: accountNoInput,
    };
    setBankHistoryLogs(prev => [newLog, ...prev]);
    setLastBankChangedAt(Date.now());
    setShowBankModal(false);
    alert('✅ Bank details updated! 15-day cooldown locked.');
  };

  const handleExportPerformanceCSV = () => {
    setDownloadingLogs(true);
    setTimeout(() => {
      const headers = ['Date', 'Metric', 'Value', 'Status'];
      const rows = [
        ['2026-08-19', roleMetrics.salesLabel, roleMetrics.salesVal, 'VERIFIED'],
        ['2026-08-19', roleMetrics.callsLabel, roleMetrics.callsVal, 'LOGGED'],
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
              <div className="relative group cursor-pointer" title="Update Profile Picture">
                <div className="avatar w-16 h-16 text-xl font-bold bg-brand/20 text-brand-400 border border-brand/30 shadow-md">
                  {currentUser.avatar}
                </div>
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

        {/* ── SECTION 2: DOCUMENTS & BANK DETAILS CARDS (15-DAY LOCK RULE) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 📄 Documents Card */}
          <div className="crm-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <FileText size={16} className="text-sky-400" /> Identity &amp; Verification Documents
              </h3>
              <button onClick={() => setShowDocHistoryModal(true)} className="text-xs text-sky-400 font-bold hover:underline">
                View History Log 📜
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <p>• PAN Card: <strong className="text-sky-300">{panInput}</strong></p>
              <p>• Aadhaar / Govt ID: <strong className="text-white">{aadhaarInput}</strong></p>
              <p>• Educational Cert: <strong className="text-white">{eduCertInput}</strong></p>
            </div>

            <button
              onClick={() => setShowDocModal(true)}
              className={`w-full py-2 rounded-xl text-xs font-bold border transition-all ${
                isDocLocked ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-slate-900 border-slate-800 text-sky-300 hover:border-sky-500/40'
              }`}
            >
              {isDocLocked ? `🔒 Documents Locked (Next update in ${docDaysRemaining} days)` : '✏️ Upload / Update Identity Documents →'}
            </button>
          </div>

          {/* 💳 Bank Details Card */}
          <div className="crm-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-400" /> Bank &amp; Payout Telemetry
              </h3>
              <button onClick={() => setShowBankHistoryModal(true)} className="text-xs text-sky-400 font-bold hover:underline">
                View History Log 📜
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <p>• Bank Name: <strong className="text-emerald-300">{bankNameInput}</strong></p>
              <p>• Account Holder: <strong className="text-white">{accountHolderInput}</strong></p>
              <p>• Account Number: <strong className="text-white">{accountNoInput}</strong></p>
              <p>• IFSC Code: <strong className="text-white">{ifscCodeInput}</strong></p>
            </div>

            <button
              onClick={() => setShowBankModal(true)}
              className={`w-full py-2 rounded-xl text-xs font-bold border transition-all ${
                isBankLocked ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-slate-900 border-slate-800 text-emerald-300 hover:border-emerald-500/40'
              }`}
            >
              {isBankLocked ? `🔒 Bank Details Locked (Next update in ${bankDaysRemaining} days)` : '✏️ Update Bank &amp; Payout Details →'}
            </button>
          </div>

        </div>

        {/* ── SECTION 3: WORKSPACE IDENTIFIERS & SUBSCRIPTION ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="crm-card space-y-2">
            <div className="flex items-center gap-2 text-brand-400">
              <Building2 size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Company Name</span>
            </div>
            <p className="text-lg font-bold text-white">{currentUser.companyName}</p>
          </div>

          <div className="crm-card space-y-2">
            <div className="flex items-center gap-2 text-purple-400">
              <Key size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Company Key</span>
            </div>
            <p className="text-lg font-mono font-bold text-purple-300">ACME-KX-7421</p>
          </div>

          <div className="crm-card space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <CreditCard size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Subscription Plan</span>
            </div>
            <p className="text-lg font-bold text-emerald-300">{subscription.planType}</p>
          </div>
        </div>

        {/* ── SECTION 4: ROLE-CUSTOMIZED TELEMETRY ── */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-400" /> Role Performance &amp; Telemetry ({role.replace('_', ' ')})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="crm-card">
              <p className="text-xs text-muted font-medium mb-1">{roleMetrics.salesLabel}</p>
              <p className="text-2xl font-extrabold text-brand-400">{roleMetrics.salesVal}</p>
            </div>
            <div className="crm-card">
              <p className="text-xs text-muted font-medium mb-1">{roleMetrics.callsLabel}</p>
              <p className="text-2xl font-extrabold text-white">{roleMetrics.callsVal}</p>
            </div>
            <div className="crm-card">
              <p className="text-xs text-muted font-medium mb-1">{roleMetrics.scopeLabel}</p>
              <p className="text-2xl font-extrabold text-blue-400">{roleMetrics.scopeVal}</p>
            </div>
            <div className="crm-card">
              <p className="text-xs text-muted font-medium mb-1">{roleMetrics.goalLabel}</p>
              <p className="text-2xl font-extrabold text-emerald-400">{roleMetrics.goalVal}</p>
            </div>
          </div>
        </div>

      </main>

      {/* ── MODAL 1: EDIT DOCUMENTS (15-DAY LOCK CHECK) ────────────────────── */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">📄 Upload / Update Identity Documents</h3>
            <p className="text-xs text-slate-400">Rule: Documents can only be updated once every 15 days.</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">PAN Card Number *</label>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" value={panInput} onChange={e => setPanInput(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Aadhaar Document / ID *</label>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" value={aadhaarInput} onChange={e => setAadhaarInput(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Educational Certificate Link *</label>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" value={eduCertInput} onChange={e => setEduCertInput(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowDocModal(false)} className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
              <button onClick={handleSaveDocuments} className="flex-1 py-2 rounded-xl bg-brand hover:bg-brand-500 text-white font-bold text-xs">Save Documents ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: DOC HISTORY LOG ──────────────────────────────────────── */}
      {showDocHistoryModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">📜 Historical Documents Audit Log</h3>
              <button onClick={() => setShowDocHistoryModal(false)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {docHistoryLogs.map((log, i) => (
                <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <p className="font-bold text-white">{log.docType} ({log.date})</p>
                  <p className="text-sky-400">Updated to: {log.newValue}</p>
                  <p className="text-slate-500">Old Record: {log.oldValue}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: EDIT BANK DETAILS (15-DAY LOCK CHECK) ─────────────────── */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">💳 Update Bank &amp; Payout Telemetry</h3>
            <p className="text-xs text-slate-400">Rule: Bank details can only be updated once every 15 days.</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Bank Name *</label>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" value={bankNameInput} onChange={e => setBankNameInput(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Account Holder Name *</label>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" value={accountHolderInput} onChange={e => setAccountHolderInput(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Account Number *</label>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" value={accountNoInput} onChange={e => setAccountNoInput(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">IFSC Code *</label>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" value={ifscCodeInput} onChange={e => setIfscCodeInput(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowBankModal(false)} className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
              <button onClick={handleSaveBankDetails} className="flex-1 py-2 rounded-xl bg-brand hover:bg-brand-500 text-white font-bold text-xs">Save Bank Details ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: BANK HISTORY LOG ────────────────────────────────────── */}
      {showBankHistoryModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">📜 Historical Bank Details Audit Log</h3>
              <button onClick={() => setShowBankHistoryModal(false)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {bankHistoryLogs.map((log, i) => (
                <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <p className="font-bold text-white">{log.bankName} ({log.date})</p>
                  <p className="text-emerald-400">Account: {log.accountNo}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
