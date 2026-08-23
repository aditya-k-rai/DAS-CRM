import React, { useState } from 'react';
import { EmployeeProfileWeb as EmployeeProfile } from './EmployeeListWidget';

interface Props {
  employee: EmployeeProfile;
  onBack: () => void;
  onUpdateEmployee: (updated: EmployeeProfile) => void;
}

export default function HrControlScreenWeb({ employee, onBack, onUpdateEmployee }: Props) {
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revertNote, setRevertNote] = useState('');

  const [hiredLogsModalOpen, setHiredLogsModalOpen] = useState(false);
  const [firedLogsModalOpen, setFiredLogsModalOpen] = useState(false);
  const [rolesReportModalOpen, setRolesReportModalOpen] = useState(false);

  const MOCK_HIRED_EMPLOYEES = [
    { id: 'hire-1', name: 'Rohan Kumar', role: 'Sales Exec', date: 'Aug 01, 2026', interviewNotes: 'Passed HR & Sales Round' },
    { id: 'hire-2', name: 'Meera Kapoor', role: 'Sales Exec', date: 'Jul 15, 2026', interviewNotes: 'Excellent Communication & CRM Skills' },
  ];

  const MOCK_FIRED_EMPLOYEES = [
    { id: 'fire-1', name: 'Suresh Patel', role: 'Sales Exec', date: 'Aug 20, 2026', reason: '10-Day Grace Deletion Initiated' },
  ];

  const handleToggleLock = () => {
    const isLocked = !employee.isLocked;
    onUpdateEmployee({ ...employee, isLocked });
    alert(isLocked ? `🔒 Screen Locked for ${employee.name}` : `🔓 Screen Unlocked for ${employee.name}`);
  };

  const handleInitiate10DayDelete = () => {
    const purgeDate = new Date();
    purgeDate.setDate(purgeDate.getDate() + 10);
    const dateStr = purgeDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    onUpdateEmployee({ ...employee, isLocked: true, deletionScheduledAt: dateStr });
    setDeleteModalOpen(false);
    alert(`🗑️ 10-Day Purge Scheduled on ${dateStr}. Revert note request active for 10 days.`);
  };

  const handleRequestRevert = () => {
    if (!revertNote.trim()) {
      alert('Revert Note Required: Enter note explaining why deletion should be reverted.');
      return;
    }
    onUpdateEmployee({ ...employee, isLocked: false, deletionScheduledAt: null, deletionReason: revertNote });
    setDeleteModalOpen(false);
    setRevertNote('');
    alert(`↺ Deletion Reverted for ${employee.name}.\nNote: "${revertNote}"`);
  };

  const handleApproveDeclineLeave = (approved: boolean) => {
    if (!leaveNote.trim()) {
      alert('Note Required: Enter a decision note.');
      return;
    }
    setLeaveModalOpen(false);
    setLeaveNote('');
    alert(approved ? `🟢 Leave Approved for ${employee.name}` : `🔴 Leave Declined for ${employee.name}`);
  };

  const handleRedirectToAttendance = () => {
    alert(`⏱️ Attendance Section: Redirecting to Attendance Portal with ${employee.name} selected.`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-slate-950 text-white min-h-screen font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <button onClick={onBack} className="px-4 py-2 bg-slate-800 text-sky-400 text-xs font-bold rounded-xl border border-slate-700">
          ← Back to Directory
        </button>
        <span className="px-3 py-1 bg-sky-500/15 border border-sky-500/40 text-sky-400 text-xs font-black rounded-lg uppercase">
          HR MANAGER CONTROL
        </span>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-black text-white">{employee.name}</h2>
        <p className="text-slate-400 text-xs mt-1">✉️ Email: {employee.email} • 📞 Number: {employee.phone}</p>
        <p className="text-slate-400 text-xs mt-1">Assigned Under: <strong className="text-indigo-400">{employee.assignedManager}</strong></p>
      </div>

      {/* Recruitment & Offboarding Telemetry */}
      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-4">👥 Recruitment & Offboarding Telemetry</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button onClick={() => setHiredLogsModalOpen(true)} className="bg-slate-900 border border-emerald-500/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-emerald-400">18 Hired</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Total Employees Hired →</div>
        </button>

        <button onClick={() => setFiredLogsModalOpen(true)} className="bg-slate-900 border border-red-500/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-red-300">2 Fired</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Total Fired (10-Day Purged) →</div>
        </button>
      </div>

      {/* Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button onClick={() => setLeaveModalOpen(true)} className="bg-slate-900 border border-amber-500/40 p-4 rounded-xl text-left">
          <div className="text-xs font-black text-amber-400">📅 Pending Leave Approval (Inspect & Decision Note) →</div>
        </button>

        <button onClick={handleRedirectToAttendance} className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left">
          <div className="text-xs font-black text-sky-400">⏱️ Attendance Portal (View {employee.name} Selected) →</div>
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={handleToggleLock} className="flex-1 py-3 bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-700">
          {employee.isLocked ? '🔓 Unlock Screen' : '🔒 Lock Screen'}
        </button>
        <button onClick={() => setDeleteModalOpen(true)} className="flex-1 py-3 bg-red-500/15 text-red-300 text-xs font-bold rounded-xl border border-red-500/40">
          🗑️ Delete (10-Day Grace)
        </button>
      </div>

      <button onClick={() => setRolesReportModalOpen(true)} className="w-full py-3 bg-sky-600 text-white text-xs font-bold rounded-xl">
        📜 Share HR Governance & Policy Sheet →
      </button>

      {/* Modals */}
      {hiredLogsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-4">🟢 Total Employees Hired Log</h3>
            <div className="space-y-2 mb-4">
              {MOCK_HIRED_EMPLOYEES.map(h => (
                <div key={h.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs font-bold text-white">{h.name} ({h.role})</div>
                  <div className="text-xs text-emerald-400">Joined: {h.date}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setHiredLogsModalOpen(false)} className="w-full py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">Close</button>
          </div>
        </div>
      )}

      {firedLogsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-4">🔴 Total Fired Employees (10-Day Purge)</h3>
            <div className="space-y-2 mb-4">
              {MOCK_FIRED_EMPLOYEES.map(f => (
                <div key={f.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs font-bold text-white">{f.name} ({f.role})</div>
                  <div className="text-xs text-red-300">Reason: {f.reason}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setFiredLogsModalOpen(false)} className="w-full py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">Close</button>
          </div>
        </div>
      )}

      {rolesReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-4">📜 HR Policy & Governance Sheet</h3>
            <button onClick={() => { setRolesReportModalOpen(false); alert('HR Policy Sheet Shared!'); }} className="w-full py-2 bg-sky-600 text-white text-xs font-bold rounded-xl">Share HR Policy Sheet →</button>
          </div>
        </div>
      )}
    </div>
  );
}
