import React, { useState } from 'react';
import { EmployeeProfileWeb as EmployeeProfile } from './EmployeeListWidget';

interface Props {
  employee: EmployeeProfile;
  onBack: () => void;
  onUpdateEmployee: (updated: EmployeeProfile) => void;
}

export default function SalesExecControlScreenWeb({ employee, onBack, onUpdateEmployee }: Props) {
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

  const SUPERVISORS = [
    'Tenant Admin (Vikram Singh)',
    'Manager A (Amit Shah)',
    'Manager B (Neha Joshi)',
    'Team Leader (Priya Sharma)',
  ];

  const MOCK_LEADS = [
    { id: 'lead-1', name: 'Rajesh Varma', company: 'TechCorp', phone: '+91 98765 43210', value: '$14,200', status: 'GOT', date: 'Today, 10:15 AM' },
    { id: 'lead-2', name: 'Priya Sharma', company: 'LogiTech', phone: '+91 98123 45678', value: '$9,500', status: 'CONNECTED', date: 'Yesterday, 4:45 PM' },
    { id: 'lead-3', name: 'Sunita Kapoor', company: 'Sunita Logistics', phone: '+91 97222 33344', value: '$22,000', status: 'NEGOTIATED', date: 'Aug 20, 2026' },
    { id: 'lead-4', name: 'Vikram Sethi', company: 'Sethi Ent', phone: '+91 98777 66655', value: '$11,800', status: 'WON', date: 'Aug 18, 2026' },
  ];

  const handleRoleUpgrade = (newRole: EmployeeProfile['role']) => {
    onUpdateEmployee({ ...employee, role: newRole });
    setUpgradeRoleModalOpen(false);
    alert(`⚡ Role Upgraded: ${employee.name} upgraded to ${newRole.replace('_', ' ')}.`);
  };

  const handleSupervisorChange = (sup: string) => {
    onUpdateEmployee({ ...employee, assignedManager: sup });
    setChangeSupervisorModalOpen(false);
    alert(`✏️ Supervisor Updated: ${employee.name} assigned under ${sup}.`);
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
          <p className="text-slate-400 text-xs mt-1">✉️ Email: {employee.email} • 📞 Number: {employee.phone}</p>
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
          <div className="text-2xl font-black text-sky-400">{employee.leads?.totalReceived || 35}</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Total Lead Got →</div>
        </button>

        <button
          onClick={() => { setLeadCategory('CONNECTED'); setLeadCollectionModalOpen(true); }}
          className="bg-slate-900 border border-emerald-500/40 p-4 rounded-xl text-left hover:border-emerald-400 transition"
        >
          <div className="text-2xl font-black text-emerald-400">{employee.leads?.connected || 22}</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Connected →</div>
        </button>

        <button
          onClick={() => { setLeadCategory('NEGOTIATED'); setLeadCollectionModalOpen(true); }}
          className="bg-slate-900 border border-indigo-500/40 p-4 rounded-xl text-left hover:border-indigo-400 transition"
        >
          <div className="text-2xl font-black text-indigo-400">{employee.leads?.inNegotiation || 8}</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Negotiated →</div>
        </button>

        <button
          onClick={() => { setLeadCategory('WON'); setLeadCollectionModalOpen(true); }}
          className="bg-slate-900 border border-emerald-400/40 p-4 rounded-xl text-left hover:border-emerald-300 transition"
        >
          <div className="text-2xl font-black text-emerald-300">{employee.leads?.won || 2}</div>
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
          <div className="text-xs text-slate-400 mt-1">Inspect 3-day leave application; approve/decline with mandatory note</div>
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
      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-4">📄 Documents & Bank Details Telemetry</h3>
      <div className="flex gap-4">
        <button
          onClick={() => setDocumentsModalOpen(true)}
          className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs font-bold rounded-xl border border-slate-800 transition"
        >
          📄 View Documents →
        </button>
        <button
          onClick={() => setBankDetailsModalOpen(true)}
          className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs font-bold rounded-xl border border-slate-800 transition"
        >
          💳 View Bank Details →
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
              {MOCK_LEADS.map(lead => (
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
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PENDING LEAVE APPLICATION ──────────────────────────────── */}
      {leaveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-2">📅 Pending Leave Application Inspection</h3>
            <p className="text-xs text-slate-300 mb-4">Applicant: <strong>{employee.name}</strong> • 3 Days (Medical Leave)</p>
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
            <button onClick={() => setDeleteModalOpen(false)} className="w-full mt-3 text-xs text-slate-400 hover:text-white font-bold text-center">Cancel</button>
          </div>
        </div>
      )}

      {/* ── MODAL: DOCUMENTS TELEMETRY ────────────────────────────────────── */}
      {documentsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-3">📄 Official Documents Telemetry</h3>
            <p className="text-xs text-slate-300 mb-2">PAN Card: {employee.documents?.pan || 'ABCDE1234F'}</p>
            <p className="text-xs text-slate-300 mb-4">Aadhaar ID: {employee.documents?.aadhaar || 'AADHAAR_VERIFIED.pdf'}</p>
            <button onClick={() => setDocumentsModalOpen(false)} className="w-full py-2 bg-slate-800 text-sky-400 text-xs font-bold rounded-xl">Close Documents →</button>
          </div>
        </div>
      )}

      {/* ── MODAL: BANK DETAILS TELEMETRY ─────────────────────────────────── */}
      {bankDetailsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-3">💳 Bank Account Details Telemetry</h3>
            <p className="text-xs text-slate-300 mb-2">Bank: {employee.bankDetails?.bankName || 'HDFC Bank'}</p>
            <p className="text-xs text-slate-300 mb-4">Account No: {employee.bankDetails?.accountNo || '50100987654321'}</p>
            <button onClick={() => setBankDetailsModalOpen(false)} className="w-full py-2 bg-slate-800 text-sky-400 text-xs font-bold rounded-xl">Close Bank Details →</button>
          </div>
        </div>
      )}
    </div>
  );
}
