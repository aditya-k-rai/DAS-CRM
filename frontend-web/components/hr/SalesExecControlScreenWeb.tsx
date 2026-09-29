import React, { useState } from 'react';
import { EmployeeProfileWeb as EmployeeProfile } from './EmployeeListWidget';
import EmployeeDriveVaultModal from './EmployeeDriveVaultModal';

interface Props {
  employee: EmployeeProfile;
  allEmployees?: EmployeeProfile[];
  onBack: () => void;
  onUpdateEmployee: (updated: EmployeeProfile) => void;
}

export default function SalesExecControlScreenWeb({ employee, allEmployees = [], onBack, onUpdateEmployee }: Props) {
  const [upgradeRoleModalOpen, setUpgradeRoleModalOpen] = useState(false);
  const [changeSupervisorModalOpen, setChangeSupervisorModalOpen] = useState(false);

  // 🎯 Lead Collection Modal State
  const [leadCollectionModalOpen, setLeadCollectionModalOpen] = useState(false);
  const [leadCategory, setLeadCategory] = useState<'GOT' | 'CONNECTED' | 'NEGOTIATED' | 'WON'>('GOT');

  // 📅 Leave Decision Modal State
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');

  // 🗑️ 10-Day Deletion Engine State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revertNote, setRevertNote] = useState('');

  // 📄 Docs & Bank Details Modals
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [bankDetailsModalOpen, setBankDetailsModalOpen] = useState(false);
  const [driveVaultOpen, setDriveVaultOpen] = useState(false);

  // Build Senior Users above Sales Executive (Admin, Managers, Team Leaders)
  const computeSeniorUsers = () => {
    const list: Array<{ id: string; name: string; role: string; email: string; label: string }> = [];

    // Filter real employees from directory
    if (allEmployees && allEmployees.length > 0) {
      allEmployees.forEach(emp => {
        if (emp.id === employee.id || emp.email?.toLowerCase() === employee.email?.toLowerCase()) return;
        if (emp.role === 'ADMIN' || emp.role === 'MANAGER' || emp.role === 'TEAM_LEADER') {
          const roleTitle = emp.role === 'ADMIN' ? 'Admin' : emp.role === 'MANAGER' ? 'Manager' : 'Team Leader';
          list.push({
            id: emp.id,
            name: emp.name,
            role: roleTitle,
            email: emp.email,
            label: `${emp.name} (${roleTitle})`,
          });
        }
      });
    }

    // Fallback senior defaults if list is empty
    if (list.length === 0) {
      list.push(
        { id: 'admin-default', name: 'Anurag Sharma', role: 'Admin', email: 'adorabletrading08@gmail.com', label: 'Anurag Sharma (Admin)' },
        { id: 'mgr-default', name: 'Aditya Kumar Rai', role: 'Manager', email: 'rai992522@gmail.com', label: 'Aditya Kumar Rai (Manager)' },
        { id: 'tl-default', name: 'Sachin Puri', role: 'Team Leader', email: 'sachinpuri938@gmail.com', label: 'Sachin Puri (Team Leader)' }
      );
    }

    return list;
  };

  const seniorUsers = computeSeniorUsers();

  const MOCK_LEADS: Array<{ id: string; name: string; company: string; phone: string; value: string; status: string; date: string }> = [];

  const handleRoleUpgrade = (newRole: EmployeeProfile['role']) => {
    onUpdateEmployee({ ...employee, role: newRole });
    setUpgradeRoleModalOpen(false);
  };

  const handleSupervisorChange = (selectedLabel: string) => {
    // Persist to localStorage for reactive sync across tabs
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('das_crm_assigned_managers') || '{}');
        stored[employee.id] = selectedLabel;
        if (employee.email) {
          stored[employee.email.toLowerCase()] = selectedLabel;
        }
        localStorage.setItem('das_crm_assigned_managers', JSON.stringify(stored));
      } catch (_) {}
    }

    onUpdateEmployee({ ...employee, assignedManager: selectedLabel });
    setChangeSupervisorModalOpen(false);
  };

  const handleToggleLock = () => {
    const isLocked = !employee.isLocked;
    onUpdateEmployee({ ...employee, isLocked });
    alert(isLocked ? `🔒 Screen Locked: ${employee.name} account screen LOCKED.` : `🔓 Screen Unlocked: ${employee.name} account screen UNLOCKED.`);
  };

  const handleInitiate10DayDelete = () => {
    const purgeDate = new Date();
    purgeDate.setDate(purgeDate.getDate() + 10);
    const dateStr = purgeDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    onUpdateEmployee({ ...employee, isLocked: true, deletionScheduledAt: dateStr });
    setDeleteModalOpen(false);
    alert(`🗑️ 10-Day Purge Scheduled: Account locked. Scheduled for purge on ${dateStr}. Revert note request option open for 10 days.`);
  };

  const handleRequestRevert = () => {
    if (!revertNote.trim()) {
      alert('Revert Note Required: Please enter a note explaining why deletion should be reverted.');
      return;
    }
    onUpdateEmployee({ ...employee, isLocked: false, deletionScheduledAt: null, deletionReason: revertNote });
    setDeleteModalOpen(false);
    setRevertNote('');
    alert(`↺ Deletion Reverted: Deletion reverted for ${employee.name}.\nNote: "${revertNote}"`);
  };

  const handleApproveDeclineLeave = (approved: boolean) => {
    if (!leaveNote.trim()) {
      alert('Note Required: Please enter a decision note.');
      return;
    }
    setLeaveModalOpen(false);
    setLeaveNote('');
    alert(approved ? `🟢 Leave Approved for ${employee.name}.\nNote: "${leaveNote}"` : `🔴 Leave Declined for ${employee.name}.\nNote: "${leaveNote}"`);
  };

  const handleRedirectToAttendance = () => {
    alert(`⏱️ Attendance Section: Redirecting to Attendance Portal with ${employee.name} pre-selected.`);
  };

  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneVal, setPhoneVal] = useState(employee.phone || '');

  const savePhone = () => {
    const digits = phoneVal.replace(/\D/g, '');
    const formatted = digits.length === 10 ? `+91 ${digits}` : phoneVal.trim().startsWith('+') ? phoneVal.trim() : `+91 ${phoneVal.trim()}`;
    onUpdateEmployee({ ...employee, phone: formatted });
    setEditingPhone(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-slate-950 text-white min-h-screen font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl border border-slate-700 transition"
        >
          ← Back to Directory
        </button>
        <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black rounded-lg uppercase">
          SALES EXECUTIVE CONTROL
        </span>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-white">{employee.name}</h2>
            {employee.isLocked && <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs font-bold rounded-md">🔒 LOCKED</span>}
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs mt-1 flex-wrap">
            <span>✉️ Email: <strong className="text-white font-medium">{employee.email}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              📞 Number:
              {editingPhone ? (
                <span className="inline-flex items-center gap-1">
                  <input
                    value={phoneVal}
                    onChange={(e) => setPhoneVal(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-white w-32 font-mono"
                    placeholder="9717355779"
                    autoFocus
                  />
                  <button onClick={savePhone} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded">Save</button>
                  <button onClick={() => setEditingPhone(false)} className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded">✕</button>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <strong className="text-white font-mono">{employee.phone}</strong>
                  <button onClick={() => { setPhoneVal(employee.phone.replace('+91', '').trim()); setEditingPhone(true); }} className="text-slate-400 hover:text-sky-300 text-[10px]" title="Edit phone number">✏️</button>
                </span>
              )}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">Assigned Under: <strong className="text-indigo-400">{employee.assignedManager}</strong></p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setUpgradeRoleModalOpen(true)}
            className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/40 transition"
          >
            Upgrade Role ⚡
          </button>
          <button
            onClick={() => setChangeSupervisorModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            Assigned Under (Change) ✏️
          </button>
        </div>
      </div>

      {employee.deletionScheduledAt && (
        <div className="bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl p-4 mb-6">
          ⚠️ 10-DAY GRACE DELETION ACTIVE: Account locked. Scheduled for purge on {employee.deletionScheduledAt}.
        </div>
      )}

      {/* Lead Collection & Status Portal */}
      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-4">🎯 Lead Collection & Status Portal</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => { setLeadCategory('GOT'); setLeadCollectionModalOpen(true); }}
          className="bg-slate-900 border border-sky-500/40 p-4 rounded-xl text-left hover:border-sky-400 transition"
        >
          <div className="text-2xl font-black text-sky-400">{employee.leads?.totalReceived || 0}</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Total Lead Got →</div>
        </button>

        <button
          onClick={() => { setLeadCategory('CONNECTED'); setLeadCollectionModalOpen(true); }}
          className="bg-slate-900 border border-emerald-500/40 p-4 rounded-xl text-left hover:border-emerald-400 transition"
        >
          <div className="text-2xl font-black text-emerald-400">{employee.leads?.connected || 0}</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Connected →</div>
        </button>

        <button
          onClick={() => { setLeadCategory('NEGOTIATED'); setLeadCollectionModalOpen(true); }}
          className="bg-slate-900 border border-indigo-500/40 p-4 rounded-xl text-left hover:border-indigo-400 transition"
        >
          <div className="text-2xl font-black text-indigo-400">{employee.leads?.inNegotiation || 0}</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Negotiated →</div>
        </button>

        <button
          onClick={() => { setLeadCategory('WON'); setLeadCollectionModalOpen(true); }}
          className="bg-slate-900 border border-emerald-400/40 p-4 rounded-xl text-left hover:border-emerald-300 transition"
        >
          <div className="text-2xl font-black text-emerald-300">{employee.leads?.won || 0}</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Won Deals →</div>
        </button>
      </div>

      {/* Operational Actions */}
      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-4">⚙️ Executive Operations & Governance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleRedirectToAttendance}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left hover:border-sky-500 transition"
        >
          <div className="text-xs font-black text-sky-400">⏱️ Attendance Section (View {employee.name} Selected) →</div>
          <div className="text-xs text-slate-400 mt-1">Redirects to attendance portal with staff member pre-selected in filter</div>
        </button>

        <button
          onClick={() => setLeaveModalOpen(true)}
          className="bg-slate-900 border border-amber-500/40 p-4 rounded-xl text-left hover:border-amber-400 transition"
        >
          <div className="text-xs font-black text-amber-400">📅 Pending Leave Request (Inspect & Approve Note) →</div>
          <div className="text-xs text-slate-400 mt-1">Inspect leave application; approve/decline with mandatory note</div>
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={handleToggleLock}
          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition"
        >
          {employee.isLocked ? '🔓 Unlock Screen' : '🔒 Lock Screen'}
        </button>
        <button
          onClick={() => setDeleteModalOpen(true)}
          className="flex-1 py-3 bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-bold rounded-xl border border-red-500/40 transition"
        >
          🗑️ Delete (10-Day Grace)
        </button>
      </div>

      {/* Compliance Buttons */}
      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-4">📄 Documents, Bank &amp; Firebase Storage Vault Telemetry</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setDocumentsModalOpen(true)}
          className="py-3 bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs font-bold rounded-xl border border-slate-800 transition text-center"
        >
          📄 View Documents →
        </button>
        <button
          onClick={() => setBankDetailsModalOpen(true)}
          className="py-3 bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs font-bold rounded-xl border border-slate-800 transition text-center"
        >
          💳 View Bank Details →
        </button>
        <button
          onClick={() => setDriveVaultOpen(true)}
          className="py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/40 transition text-center flex items-center justify-center gap-1.5"
        >
          ☁️ Firebase Storage Vault →
        </button>
      </div>

      {/* ── MODAL: LEAD COLLECTION PAGE ───────────────────────────────────── */}
      {leadCollectionModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">🎯 Lead Collection — {leadCategory} LEADS</h3>
              <button onClick={() => setLeadCollectionModalOpen(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {MOCK_LEADS.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No {leadCategory.toLowerCase()} leads recorded for this executive.
                </div>
              ) : (
                MOCK_LEADS.map(lead => (
                  <div key={lead.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-white">{lead.name} ({lead.company})</div>
                      <div className="text-xs text-slate-400">{lead.phone} • {lead.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-400">{lead.value}</div>
                      <div className="text-xs text-sky-400 font-bold">{leadCategory}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PENDING LEAVE APPLICATION ──────────────────────────────── */}
      {leaveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-2">📅 Pending Leave Application Inspection</h3>
            <p className="text-xs text-slate-300 mb-4">Applicant: <strong>{employee.name}</strong></p>
            <textarea
              placeholder="Enter decision note..."
              value={leaveNote}
              onChange={e => setLeaveNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white mb-4 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-3">
              <button onClick={() => handleApproveDeclineLeave(false)} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl">Decline</button>
              <button onClick={() => handleApproveDeclineLeave(true)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl">Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: 10-DAY GRACE DELETE & REVERT ───────────────────────────── */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-2">🗑️ Account Deletion (10-Day Grace Period)</h3>
            {employee.deletionScheduledAt ? (
              <div>
                <p className="text-xs text-amber-300 mb-3">Scheduled for purge on {employee.deletionScheduledAt}. Account locked. Enter note to revert:</p>
                <textarea
                  placeholder="Enter reason to revert deletion..."
                  value={revertNote}
                  onChange={e => setRevertNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white mb-4 focus:outline-none focus:border-emerald-500"
                />
                <button onClick={handleRequestRevert} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl">↺ Request to Revert Deletion →</button>
              </div>
            ) : (
              <button onClick={handleInitiate10DayDelete} className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl">Initiate 10-Day Purge →</button>
            )}
            <button onClick={() => setDeleteModalOpen(false)} className="w-full mt-3 text-xs text-slate-400 hover:text-slate-200 font-bold text-center transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* ── MODAL: DOCUMENTS TELEMETRY ────────────────────────────────────── */}
      {documentsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-3">📄 Official Documents Telemetry</h3>
            <p className="text-xs text-slate-300 mb-2">PAN Card: {employee.documents?.pan || 'Not provided'}</p>
            <p className="text-xs text-slate-300 mb-4">Aadhaar ID: {employee.documents?.aadhaar || 'Not provided'}</p>
            <button onClick={() => setDocumentsModalOpen(false)} className="w-full py-2 bg-slate-800 text-sky-400 text-xs font-bold rounded-xl">Close Documents →</button>
          </div>
        </div>
      )}

      {/* ── MODAL: BANK DETAILS TELEMETRY ─────────────────────────────────── */}
      {bankDetailsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-3">💳 Bank Account Details Telemetry</h3>
            <p className="text-xs text-slate-300 mb-2">Bank: {employee.bankDetails?.bankName || 'Not provided'}</p>
            <p className="text-xs text-slate-300 mb-4">Account No: {employee.bankDetails?.accountNo || 'Not provided'}</p>
            <button onClick={() => setBankDetailsModalOpen(false)} className="w-full py-2 bg-slate-800 text-sky-400 text-xs font-bold rounded-xl">Close Bank Details →</button>
          </div>
        </div>
      )}

      {/* ── MODAL: GOOGLE DRIVE EMPLOYEE VAULT ───────────────────────────── */}
      {driveVaultOpen && (
        <EmployeeDriveVaultModal
          employee={employee}
          isOpen={driveVaultOpen}
          onClose={() => setDriveVaultOpen(false)}
        />
      )}

      {/* ── MODAL: UPGRADE ROLE ───────────────────────────────────────────── */}
      {upgradeRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-sm font-black text-white mb-3">⚡ Upgrade Role for {employee.name}</h3>
            <div className="space-y-2 mb-4">
              {(['SALES_EXEC', 'TEAM_LEADER', 'HR', 'MANAGER', 'ADMIN'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => handleRoleUpgrade(r)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-left transition border ${
                    employee.role === r
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-indigo-500/50'
                  }`}
                >
                  {r === 'ADMIN' ? '👑 Company Admin (Executive)' : r.replace('_', ' ')}
                </button>
              ))}
            </div>
            <button
              onClick={() => setUpgradeRoleModalOpen(false)}
              className="w-full py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: CHANGE SUPERVISOR ──────────────────────────────────────── */}
      {changeSupervisorModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>✏️ Assign Under for {employee.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a senior manager or team leader to oversee this executive:
                </p>
              </div>
              <button
                onClick={() => setChangeSupervisorModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {seniorUsers.map(senior => {
                const isSelected =
                  employee.assignedManager === senior.label ||
                  employee.assignedManager === senior.name ||
                  (senior.role === 'Admin' && (employee.assignedManager === 'Admin' || employee.assignedManager === 'Organization Admin'));

                const badgeBg =
                  senior.role === 'Admin'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : senior.role === 'Manager'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

                return (
                  <button
                    key={senior.id}
                    onClick={() => handleSupervisorChange(senior.label)}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black border ${badgeBg}`}>
                        {senior.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{senior.name}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${badgeBg}`}>
                            {senior.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{senior.email}</span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setChangeSupervisorModalOpen(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
