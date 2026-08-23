import React, { useState } from 'react';
import { EmployeeProfileWeb as EmployeeProfile } from './EmployeeListWidget';

interface Props {
  employee: EmployeeProfile;
  onBack: () => void;
  onUpdateEmployee: (updated: EmployeeProfile) => void;
}

export default function TeamLeaderControlScreenWeb({ employee, onBack, onUpdateEmployee }: Props) {
  const [subordinatesModalOpen, setSubordinatesModalOpen] = useState(false);
  const [subordinatesList, setSubordinatesList] = useState([
    { id: 'sub-1', name: 'Amit Patel', role: 'Sales Exec', calls: 84, revenue: '$22,000', leads: 25 },
    { id: 'sub-2', name: 'Meera Kapoor', role: 'Sales Exec', calls: 65, revenue: '$18,500', leads: 15 },
  ]);

  const [leadAuditModalOpen, setLeadAuditModalOpen] = useState(false);
  const [leadCategory, setLeadCategory] = useState<'GOT' | 'CONNECTED' | 'NEGOTIATED' | 'MEETING' | 'WON'>('GOT');

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revertNote, setRevertNote] = useState('');

  const [rolesReportModalOpen, setRolesReportModalOpen] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [bankDetailsModalOpen, setBankDetailsModalOpen] = useState(false);

  const MOCK_LEAD_DISTRIBUTION = [
    { id: 'dist-1', leadName: 'Acme Corp SLA Proposal', distributedTo: 'Amit Patel (Sales Exec)', timestamp: 'Today, 10:15 AM', status: 'GOT' },
    { id: 'dist-2', leadName: 'LogiTech Enterprise Bot', distributedTo: 'Meera Kapoor (Sales Exec)', timestamp: 'Yesterday, 04:30 PM', status: 'CONNECTED' },
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
        <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-black rounded-lg uppercase">
          TEAM LEADER CONTROL
        </span>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-black text-white">{employee.name}</h2>
        <p className="text-slate-400 text-xs mt-1">✉️ Email: {employee.email} • 📞 Number: {employee.phone}</p>
        <p className="text-slate-400 text-xs mt-1">Assigned Under: <strong className="text-indigo-400">{employee.assignedManager}</strong></p>
      </div>

      {/* Subordinates Assigned Under TL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-white">👥 Employees Assigned Under {employee.name}</h3>
          <button onClick={() => setSubordinatesModalOpen(true)} className="px-3 py-1 bg-slate-800 text-indigo-400 text-xs font-bold rounded-lg border border-slate-700">
            Add / Change Staff ✏️
          </button>
        </div>
        <div className="space-y-2">
          {subordinatesList.map(sub => (
            <div key={sub.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-white">{sub.name} ({sub.role})</div>
                <div className="text-xs text-slate-400">{sub.calls} Calls • {sub.leads} Leads</div>
              </div>
              <div className="text-xs font-black text-emerald-400">{sub.revenue}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Distribution Audit */}
      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-4">📊 Lead Distribution & Status Audit</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button onClick={() => { setLeadCategory('GOT'); setLeadAuditModalOpen(true); }} className="bg-slate-900 border border-sky-500/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-sky-400">45</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Got & Distributed →</div>
        </button>

        <button onClick={() => { setLeadCategory('CONNECTED'); setLeadAuditModalOpen(true); }} className="bg-slate-900 border border-emerald-500/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-emerald-400">28</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Connected →</div>
        </button>

        <button onClick={() => { setLeadCategory('NEGOTIATED'); setLeadAuditModalOpen(true); }} className="bg-slate-900 border border-indigo-500/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-indigo-400">10</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Negotiated →</div>
        </button>

        <button onClick={() => { setLeadCategory('WON'); setLeadAuditModalOpen(true); }} className="bg-slate-900 border border-emerald-400/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-emerald-300">2</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Deals Won →</div>
        </button>
      </div>

      {/* Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button onClick={handleRedirectToAttendance} className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left">
          <div className="text-xs font-black text-sky-400">⏱️ Attendance Section (View {employee.name} Selected) →</div>
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

      <button onClick={() => setRolesReportModalOpen(true)} className="w-full py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl">
        📋 Share Roles & Responsibilities Report →
      </button>

      {/* Modals */}
      {subordinatesModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-4">👥 Subordinate Reps under {employee.name}</h3>
            <button onClick={() => setSubordinatesModalOpen(false)} className="w-full py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">Close</button>
          </div>
        </div>
      )}

      {leadAuditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-4">📊 Lead Distribution Log — {leadCategory}</h3>
            <button onClick={() => setLeadAuditModalOpen(false)} className="w-full py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">Close</button>
          </div>
        </div>
      )}

      {rolesReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-4">📜 TL Governance & Responsibility Report</h3>
            <button onClick={() => { setRolesReportModalOpen(false); alert('Report Shared!'); }} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">Share TL SLA Report →</button>
          </div>
        </div>
      )}
    </div>
  );
}
