'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, FileText, CreditCard } from 'lucide-react';
import { EmployeeProfileWeb } from './EmployeeListWidget';

interface Props {
  employee: EmployeeProfileWeb;
  onBack: () => void;
  onUpdateEmployee: (updated: EmployeeProfileWeb) => void;
}

export default function ManagerControlScreenWeb({ employee, onBack, onUpdateEmployee }: Props) {
  const router = useRouter();

  const [showRoleUpgradeModal, setShowRoleUpgradeModal] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [showLeadPreviewModal, setShowLeadPreviewModal] = useState(false);
  const [leadCategory, setLeadCategory] = useState<'TOTAL' | 'CONNECTED' | 'NEGOTIATED' | 'MEETING_DONE' | 'WON'>('TOTAL');

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [revertNote, setRevertNote] = useState('');

  const [showShareRolesModal, setShowShareRolesModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  const SUPERVISORS = [
    'Tenant Admin (Vikram Singh)',
    'Vice President (Rakesh Sharma)',
    'CEO (SuperAdmin)',
  ];

  const handleRoleUpgrade = (newRole: 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC') => {
    onUpdateEmployee({ ...employee, role: newRole });
    setShowRoleUpgradeModal(false);
    alert(`⚡ Role upgraded to ${newRole.replace('_', ' ')}!`);
  };

  const handleChangeSupervisor = (sup: string) => {
    onUpdateEmployee({ ...employee, assignedManager: sup });
    setShowSupervisorModal(false);
    alert(`✏️ Supervisor changed to ${sup}.`);
  };

  const handleToggleLock = () => {
    const isLocked = !employee.isLocked;
    onUpdateEmployee({ ...employee, isLocked });
    alert(isLocked ? '🔒 Account screen locked!' : '🔓 Account screen unlocked!');
  };

  const handleInitiate10DayDelete = () => {
    const scheduledDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    onUpdateEmployee({ ...employee, isLocked: true, deletionScheduledAt: scheduledDate });
    setShowDeleteModal(false);
    alert('⚠️ 10-Day Grace Deletion Period initiated. Account locked.');
  };

  const handleRequestRevert = () => {
    if (!revertNote.trim()) {
      alert('Please enter a note explaining why deletion should be reverted.');
      return;
    }
    onUpdateEmployee({ ...employee, isLocked: false, deletionScheduledAt: null, deletionReason: revertNote });
    setShowDeleteModal(false);
    setRevertNote('');
    alert(`🎉 Deletion reverted! Note logged: "${revertNote}"`);
  };

  const handleApproveDeclineLeave = (approved: boolean) => {
    if (!leaveNote.trim()) {
      alert('Please enter a note for leave decision.');
      return;
    }
    setShowLeaveModal(false);
    setLeaveNote('');
    alert(approved ? `🟢 Leave approved with note: "${leaveNote}"` : `🔴 Leave declined with note: "${leaveNote}"`);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-6 text-white rounded-3xl border border-slate-800">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-sky-400 font-extrabold text-xs rounded-xl flex items-center gap-2 border border-slate-700 transition"
        >
          <ArrowLeft size={16} /> ← Back to All Staff Directory
        </button>

        <span className="text-xs font-black px-3 py-1 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/40">
          DEPARTMENT MANAGER CONTROL SCREEN
        </span>
      </div>

      {/* Profile Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white">{employee.name}</h2>
              {employee.isLocked && <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs rounded">🔒 LOCKED</span>}
            </div>
            <p className="text-xs text-slate-400 mt-1">✉️ Email: {employee.email} • 📞 Number: {employee.phone}</p>
            <p className="text-xs text-slate-300 mt-1">
              Assigned Under: <strong className="text-indigo-400 font-bold">{employee.assignedManager}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRoleUpgradeModal(true)}
              className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-bold text-xs rounded-xl hover:bg-indigo-600/30"
            >
              Upgrade Role ⚡
            </button>
            <button
              onClick={() => setShowSupervisorModal(true)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-700"
            >
              Assigned Under (Change) ✏️
            </button>
          </div>
        </div>

        {employee.deletionScheduledAt && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl">
            ⚠️ 10-Day Grace Deletion Period Active: Scheduled for purge. Account locked.
          </div>
        )}
      </div>

      {/* Subordinates Assigned Under Manager */}
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">👥 Department Staff Assigned Under {employee.name}</h3>
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        {employee.subordinates.map(sub => (
          <div key={sub.id} className="flex justify-between items-center text-xs border-b border-slate-800 pb-2 last:border-0">
            <span className="font-extrabold text-white">{sub.name} ({sub.role})</span>
            <span className="text-emerald-400 font-bold">💰 {sub.revenue} Pipeline • 🎯 {sub.leads} Leads</span>
          </div>
        ))}
      </div>

      {/* Department Pipeline Audit */}
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">📊 Department Pipeline Lead Audit</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => { setLeadCategory('TOTAL'); setShowLeadPreviewModal(true); }} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-slate-700">
          <p className="text-3xl font-black text-white">{employee.leads.totalReceived}</p>
          <p className="text-xs font-bold text-slate-400 mt-1">Total Dept Leads →</p>
        </button>

        <button onClick={() => { setLeadCategory('WON'); setShowLeadPreviewModal(true); }} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-slate-700">
          <p className="text-3xl font-black text-emerald-400">{employee.leads.won}</p>
          <p className="text-xs font-bold text-slate-400 mt-1">Won Deals →</p>
        </button>
      </div>

      {/* Operational Controls */}
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">⚙️ Department Manager Controls</h3>
      <div className="space-y-3">
        <button onClick={() => router.push(`/hr/attendance?employee=${encodeURIComponent(employee.name)}`)} className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
          <span>⏱️ Attendance Portal (View {employee.name} Selected)</span>
          <ExternalLink size={16} className="text-brand-400" />
        </button>

        <button onClick={() => setShowLeaveModal(true)} className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center justify-between">
          <span>📅 Pending Leave Request (Inspect Application &amp; Note)</span>
          <FileText size={16} />
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={handleToggleLock} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-white">
            {employee.isLocked ? '🔓 Unlock Screen' : '🔒 Lock Screen'}
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-300">
            🗑️ Delete (10 Days)
          </button>
        </div>

        <button onClick={() => setShowShareRolesModal(true)} className="w-full p-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-xs font-bold text-indigo-300">
          📋 Share Roles &amp; Responsibilities Report →
        </button>
      </div>

      {/* Bottom Compliance & Bank Telemetry Buttons */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">📄 Compliance, Documents &amp; Bank Telemetry</h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setShowDocsModal(true)} className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-sky-400 font-extrabold text-xs flex items-center justify-center gap-2 border border-slate-700">
            <FileText size={16} /> 📄 View Documents →
          </button>

          <button onClick={() => setShowBankModal(true)} className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-emerald-400 font-extrabold text-xs flex items-center justify-center gap-2 border border-slate-700">
            <CreditCard size={16} /> 💳 View Bank Details →
          </button>
        </div>
      </div>

      {/* Modals */}
      {showRoleUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-3">
            <h4 className="text-sm font-extrabold text-white">⚡ Upgrade Role</h4>
            {(['SALES_EXEC', 'TEAM_LEADER', 'MANAGER', 'HR'] as const).map(r => (
              <button key={r} onClick={() => handleRoleUpgrade(r)} className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white hover:border-indigo-500">
                {r.replace('_', ' ')}
              </button>
            ))}
            <button onClick={() => setShowRoleUpgradeModal(false)} className="w-full text-center text-xs text-slate-400 font-bold pt-2">Cancel</button>
          </div>
        </div>
      )}

      {showSupervisorModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-3">
            <h4 className="text-sm font-extrabold text-white">✏️ Change Assigned Supervisor</h4>
            {SUPERVISORS.map((sup, idx) => (
              <button key={idx} onClick={() => handleChangeSupervisor(sup)} className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white hover:border-indigo-500">
                {sup}
              </button>
            ))}
            <button onClick={() => setShowSupervisorModal(false)} className="w-full text-center text-xs text-slate-400 font-bold pt-2">Cancel</button>
          </div>
        </div>
      )}

      {showLeadPreviewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-3">
            <h4 className="text-sm font-extrabold text-white">🎯 Department Lead Audit — {leadCategory}</h4>
            {employee.leads.distributionBreakdown.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                <span className="font-bold text-white">Target: {item.targetName}</span>
                <span className="text-emerald-400 font-bold">{item.count} Leads</span>
              </div>
            ))}
            <button onClick={() => setShowLeadPreviewModal(false)} className="w-full p-3 bg-indigo-600 font-bold text-xs text-white rounded-xl">Close Audit →</button>
          </div>
        </div>
      )}

      {showShareRolesModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-3">
            <h4 className="text-sm font-extrabold text-white">📜 Manager Roles &amp; Responsibilities</h4>
            <p className="text-xs text-slate-300">Department Pipeline &amp; Revenue Governance Sheet for {employee.name}</p>
            <button
              onClick={() => {
                alert(`📜 Shared Manager Governance Sheet for ${employee.name}!`);
                setShowShareRolesModal(false);
              }}
              className="w-full p-3 bg-indigo-600 font-bold text-xs text-white rounded-xl"
            >
              Share Report →
            </button>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-3">
            <h4 className="text-sm font-extrabold text-white">📅 Pending Leave Application Inspection</h4>
            <input
              type="text"
              placeholder="Enter decision note..."
              value={leaveNote}
              onChange={e => setLeaveNote(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleApproveDeclineLeave(false)} className="p-3 bg-rose-600 font-bold text-xs text-white rounded-xl">Decline</button>
              <button onClick={() => handleApproveDeclineLeave(true)} className="p-3 bg-emerald-600 font-bold text-xs text-white rounded-xl">Approve</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-3">
            <h4 className="text-sm font-extrabold text-white">🗑️ Account Deletion (10-Day Grace)</h4>
            {employee.deletionScheduledAt ? (
              <div className="space-y-3">
                <p className="text-xs text-amber-400">Scheduled for purge. Revert note required:</p>
                <input
                  type="text"
                  placeholder="Enter reason to revert..."
                  value={revertNote}
                  onChange={e => setRevertNote(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                />
                <button onClick={handleRequestRevert} className="w-full p-3 bg-emerald-600 font-bold text-xs text-white rounded-xl">↺ Request Revert Deletion →</button>
              </div>
            ) : (
              <button onClick={handleInitiate10DayDelete} className="w-full p-3 bg-rose-600 font-bold text-xs text-white rounded-xl">Initiate 10-Day Purge →</button>
            )}
            <button onClick={() => setShowDeleteModal(false)} className="w-full text-center text-xs text-slate-400 font-bold pt-2">Cancel</button>
          </div>
        </div>
      )}

      {showDocsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-3">
            <h4 className="text-sm font-extrabold text-white">📄 Official Documents</h4>
            <p className="text-xs text-slate-300">PAN: {employee.documents.pan}</p>
            <p className="text-xs text-slate-300">Aadhaar: {employee.documents.aadhaar}</p>
            <button onClick={() => setShowDocsModal(false)} className="w-full p-3 bg-slate-800 font-bold text-xs text-white rounded-xl">Close Documents →</button>
          </div>
        </div>
      )}

      {showBankModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-3">
            <h4 className="text-sm font-extrabold text-white">💳 Bank Account Details</h4>
            <p className="text-xs text-slate-300">Bank: {employee.bankDetails.bankName}</p>
            <p className="text-xs text-slate-300">Account: {employee.bankDetails.accountNo}</p>
            <button onClick={() => setShowBankModal(false)} className="w-full p-3 bg-slate-800 font-bold text-xs text-white rounded-xl">Close Bank Details →</button>
          </div>
        </div>
      )}

    </div>
  );
}
