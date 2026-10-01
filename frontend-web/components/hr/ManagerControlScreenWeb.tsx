import React, { useState } from 'react';
import { EmployeeProfileWeb as EmployeeProfile } from './EmployeeListWidget';
import EmployeeDriveVaultModal from './EmployeeDriveVaultModal';

interface Props {
  employee: EmployeeProfile;
  allEmployees?: EmployeeProfile[];
  onBack: () => void;
  onUpdateEmployee: (updated: EmployeeProfile) => void;
}

export default function ManagerControlScreenWeb({ employee, allEmployees = [], onBack, onUpdateEmployee }: Props) {
  const [changeSupervisorModalOpen, setChangeSupervisorModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string; pipeline: string; leads: number }[]>([]);

  const [leadAuditModalOpen, setLeadAuditModalOpen] = useState(false);
  const [leadCategory, setLeadCategory] = useState<'TOTAL' | 'CONNECTED' | 'NEGOTIATED' | 'MEETING' | 'WON'>('TOTAL');

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveNote, setLeaveNote] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revertNote, setRevertNote] = useState('');

  const [rolesReportModalOpen, setRolesReportModalOpen] = useState(false);
  const [driveVaultOpen, setDriveVaultOpen] = useState(false);

  // Compute Senior Users above Manager (Organization Admin)
  const computeSeniorUsers = () => {
    const list: Array<{ id: string; name: string; role: string; email: string; label: string }> = [
      { id: 'admin_root', name: 'Admin', role: 'Admin', email: 'admin@das.com', label: 'Admin' },
    ];

    if (allEmployees && allEmployees.length > 0) {
      allEmployees.forEach(emp => {
        if (emp.id === employee.id || emp.email?.toLowerCase() === employee.email?.toLowerCase()) return;
        if (emp.role === 'ADMIN') {
          const lbl = `${emp.name} (Admin)`;
          if (!list.some(item => item.label === lbl || item.name === emp.name)) {
            list.push({
              id: emp.id,
              name: emp.name,
              role: 'Admin',
              email: emp.email,
              label: lbl,
            });
          }
        }
      });
    }

    return list;
  };

  const seniorUsers = computeSeniorUsers();

  const handleSupervisorChange = async (selectedLabel: string) => {
    const isDirectAdmin =
      !selectedLabel ||
      selectedLabel.toLowerCase() === 'admin' ||
      selectedLabel.toLowerCase() === 'organization admin' ||
      selectedLabel.toLowerCase() === 'direct / admin';

    let resolvedManagerId: string | null = null;
    if (!isDirectAdmin) {
      const match = seniorUsers.find(
        s =>
          s.label.toLowerCase() === selectedLabel.toLowerCase() ||
          s.name.toLowerCase() === selectedLabel.toLowerCase() ||
          s.email.toLowerCase() === selectedLabel.toLowerCase() ||
          s.id === selectedLabel
      );
      if (match) {
        resolvedManagerId = match.id;
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('das_crm_assigned_managers') || '{}');
        stored[employee.id] = selectedLabel;
        if (employee.email) {
          stored[employee.email.toLowerCase().trim()] = selectedLabel;
        }
        localStorage.setItem('das_crm_assigned_managers', JSON.stringify(stored));

        const extraStaff = JSON.parse(localStorage.getItem('das_crm_extra_staff') || '[]');
        const updatedExtra = extraStaff.map((st: any) => {
          if (st.id === employee.id || (employee.email && st.email?.toLowerCase().trim() === employee.email.toLowerCase().trim())) {
            return { ...st, assignedManager: selectedLabel, managerId: resolvedManagerId };
          }
          return st;
        });
        localStorage.setItem('das_crm_extra_staff', JSON.stringify(updatedExtra));

        window.dispatchEvent(new CustomEvent('das-crm-staff-updated'));
        window.dispatchEvent(new CustomEvent('user-directory-updated'));
        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const bc = new BroadcastChannel('das_crm_sync');
            bc.postMessage({ type: 'USER_DIRECTORY_INVALIDATED', timestamp: Date.now() });
            bc.close();
          } catch (_) {}
        }
      } catch (_) {}
    }

    // Sync to backend API
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('das_crm_token') || localStorage.getItem('token')) : null;
      const compId = typeof window !== 'undefined' ? (localStorage.getItem('das_crm_org_id') || localStorage.getItem('companyId')) : null;
      await fetch(`${apiBase}/users/${employee.id}/manager`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(compId ? { 'x-organization-id': compId } : {}),
        },
        body: JSON.stringify({
          managerId: resolvedManagerId || selectedLabel,
          assignedManager: selectedLabel,
          organizationId: compId,
        }),
      }).catch(() => null);
    } catch (_) {}

    onUpdateEmployee({ ...employee, assignedManager: selectedLabel, managerId: resolvedManagerId });
    setChangeSupervisorModalOpen(false);
  };

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
        <button onClick={onBack} className="px-4 py-2 bg-slate-800 text-sky-400 text-xs font-bold rounded-xl border border-slate-700 transition hover:bg-slate-700">
          ← Back to Directory
        </button>
        <span className={`px-3 py-1 text-xs font-black rounded-lg uppercase border ${
          employee.role === 'ADMIN'
            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            : 'bg-purple-500/15 border-purple-500/40 text-purple-400'
        }`}>
          {employee.role === 'ADMIN' ? 'ADMIN & EXECUTIVE CONTROL' : 'DEPARTMENT MANAGER CONTROL'}
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

        {employee.role !== 'ADMIN' && (
          <div className="flex gap-3">
            <button
              onClick={() => setChangeSupervisorModalOpen(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              Assigned Under (Change) ✏️
            </button>
          </div>
        )}
      </div>

      {/* Department Staff Assigned Under Manager */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-white">
            👥 {employee.role === 'ADMIN' ? `Organization Staff & Department Leads Overseen by ${employee.name}` : `Department Staff Assigned Under ${employee.name}`}
          </h3>
          <button onClick={() => setStaffModalOpen(true)} className={`px-3 py-1 bg-slate-800 ${employee.role === 'ADMIN' ? 'text-rose-400' : 'text-purple-400'} text-xs font-bold rounded-lg border border-slate-700`}>
            {employee.role === 'ADMIN' ? 'Manage Staff ✏️' : 'Add / Change Staff ✏️'}
          </button>
        </div>
        {staffList.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
            {employee.role === 'ADMIN' ? 'No additional direct subordinates configured.' : `No department staff assigned under ${employee.name} yet.`}
          </div>
        ) : (
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
        )}
      </div>

      {/* Department Pipeline Audit */}
      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-4">
        📊 {employee.role === 'ADMIN' ? 'Organization Pipeline Lead Audit' : 'Department Pipeline Lead Audit'}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button onClick={() => { setLeadCategory('TOTAL'); setLeadAuditModalOpen(true); }} className="bg-slate-900 border border-sky-500/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-sky-400">0</div>
          <div className="text-xs font-bold text-slate-400 mt-1">{employee.role === 'ADMIN' ? 'Total Org Leads →' : 'Total Dept Leads →'}</div>
        </button>

        <button onClick={() => { setLeadCategory('CONNECTED'); setLeadAuditModalOpen(true); }} className="bg-slate-900 border border-emerald-500/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-emerald-400">0</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Connected →</div>
        </button>

        <button onClick={() => { setLeadCategory('NEGOTIATED'); setLeadAuditModalOpen(true); }} className="bg-slate-900 border border-indigo-500/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-indigo-400">0</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Negotiated →</div>
        </button>

        <button onClick={() => { setLeadCategory('WON'); setLeadAuditModalOpen(true); }} className="bg-slate-900 border border-emerald-400/40 p-4 rounded-xl text-left">
          <div className="text-2xl font-black text-emerald-300">0</div>
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

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setRolesReportModalOpen(true)}
          className={`flex-1 py-3 ${employee.role === 'ADMIN' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-purple-600 hover:bg-purple-500'} text-white text-xs font-bold rounded-xl transition`}
        >
          📋 {employee.role === 'ADMIN' ? 'Share Executive & Admin Governance Report →' : 'Share Manager Roles & Responsibilities Report →'}
        </button>
        <button
          onClick={() => setDriveVaultOpen(true)}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
        >
          ☁️ {employee.name}&apos;s Firebase Storage Vault (DP, KYC, Docs) →
        </button>
      </div>

      {/* Modals */}
      {rolesReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-black text-white mb-4">
              📋 {employee.role === 'ADMIN' ? 'Executive & Admin Governance Report' : 'Manager Governance & Responsibility Report'}
            </h3>
            <button
              onClick={() => { setRolesReportModalOpen(false); alert(employee.role === 'ADMIN' ? 'Executive Report Shared!' : 'Manager Report Shared!'); }}
              className={`w-full py-2 ${employee.role === 'ADMIN' ? 'bg-rose-600' : 'bg-purple-600'} text-white text-xs font-bold rounded-xl`}
            >
              {employee.role === 'ADMIN' ? 'Share Executive Report →' : 'Share Manager Report →'}
            </button>
          </div>
        </div>
      )}

      {/* Google Drive Vault Modal */}
      {driveVaultOpen && (
        <EmployeeDriveVaultModal
          employee={employee}
          isOpen={driveVaultOpen}
          onClose={() => setDriveVaultOpen(false)}
        />
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
                  Select a senior executive / organization administrator to oversee this manager:
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

                const badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';

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
