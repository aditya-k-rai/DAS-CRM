import React, { useState } from 'react';
import { EmployeeProfileWeb as EmployeeProfile } from './EmployeeListWidget';

interface Props {
  employee: EmployeeProfile;
  onBack: () => void;
  onUpdateEmployee: (updated: EmployeeProfile) => void;
}

export default function ManagerControlScreenWeb({ employee, onBack, onUpdateEmployee }: Props) {
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffList, setStaffList] = useState([
    { id: 'dept-1', name: 'Priya Sharma', role: 'Team Leader', pipeline: '$38,500', leads: 45 },
    { id: 'dept-2', name: 'Rohan Kumar', role: 'Sales Exec', pipeline: '$22,000', leads: 25 },
  ]);

  const [leadAuditModalOpen, setLeadAuditModalOpen] = useState(false);
  const [leadCategory, setLeadCategory] = useState<'TOTAL' | 'CONNECTED' | 'NEGOTIATED' | 'MEETING' | 'WON'>('TOTAL');

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revertNote, setRevertNote] = useState('');

  const [rolesReportModalOpen, setRolesReportModalOpen] = useState(false);

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
        <span className="px-3 py-1 bg-purple-500/15 border border-purple-500/40 text-purple-400 text-xs font-black rounded-lg uppercase">
          DEPARTMENT MANAGER CONTROL
        </span>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-black text-white">{employee.name}</h2>
        <p className="text-slate-400 text-xs mt-1">✉️ Email: {employee.email} • 📞 Number: {employee.phone}</p>
        <p className="text-slate-400 text-xs mt-1">Assigned Under: <strong className="text-indigo-400">{employee.assignedManager}</strong></p>
      </div>

      {/* Department Staff Assigned Under Manager */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-white">👥 Department Staff Assigned Under {employee.name}</h3>
          <button onClick={() => setStaffModalOpen(true)} className="px-3 py-1 bg-slate-800 text-purple-400 text-xs font-bold rounded-lg border border-slate-700">
            Add / Change Staff ✏️
          </button>
        </div>
        <div className="space-y-2">
          {staffList.map(st => (
            <div key={st.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-white">{st.name} ({st.role})</div>
                <div className="text-xs text-slate-400">{st.leads} Dept Leads Managed</div>
              </div>
              <div className="text-xs font-black text-sky-400">{st.pipeline} Pipeline</div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Pipeline Audit */}
      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-4">📊 Department Pipeline Lead Audit</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button onClick={() => { setLeadCategory('TOTAL'); setLeadAuditModalOpen(true); }} className="bg-slate-900 border border-sky-500/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-sky-400">140</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Total Dept Leads →</div>
        </button>

        <button onClick={() => { setLeadCategory('CONNECTED'); setLeadAuditModalOpen(true); }} className="bg-slate-900 border border-emerald-500/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-emerald-400">85</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Connected →</div>
        </button>

        <button onClick={() => { setLeadCategory('NEGOTIATED'); setLeadAuditModalOpen(true); }} className="bg-slate-900 border border-indigo-500/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-indigo-400">32</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Negotiated →</div>
        </button>

        <button onClick={() => { setLeadCategory('WON'); setLeadAuditModalOpen(true); }} className="bg-slate-900 border border-emerald-400/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-emerald-300">14</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Won Deals →</div>
        </button>
      </div>

      {/* Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button onClick={handleRedirectToAttendance} className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left">
          <div className="text-xs font-black text-sky-400">⏱️ Attendance Portal (View {employee.name} Selected) →</div>
        </button>

        <button onClick={() => setLeaveModalOpen(true)} className="bg-slate-900 border border-amber-500/40 p-4 rounded-xl text-left">
          <div className="text-xs font-black text-amber-400">📅 Pending Leave Request (Inspect & Approve Note) →</div>
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

      <button onClick={() => setRolesReportModalOpen(true)} className="w-full py-3 bg-purple-600 text-white text-xs font-bold rounded-xl">
        📋 Share Manager Roles & Responsibilities Report →
      </button>

      {/* Modals */}
      {rolesReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-4">📋 Manager Governance & Responsibility Report</h3>
            <button onClick={() => { setRolesReportModalOpen(false); alert('Manager Report Shared!'); }} className="w-full py-2 bg-purple-600 text-white text-xs font-bold rounded-xl">Share Manager Report →</button>
          </div>
        </div>
      )}
    </div>
  );
}
