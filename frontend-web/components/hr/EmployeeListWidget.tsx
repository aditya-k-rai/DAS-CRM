'use client';

import { useState } from 'react';
import { Shield, Users, ExternalLink, X, MapPin, CheckCircle2, UserCheck, RefreshCw, ArrowRightLeft, Briefcase, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface EmployeeProfileWeb {
  id: string;
  name: string;
  code: string;
  dept: string;
  role: 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC';
  assignedManager: string;
  baseSalary: string;
  joined: string;
  canSelfCheckIn: boolean;
  status: string;

  // Attendance Telemetry
  attendance: {
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    todayInTime: string;
    todayOutTime: string | null;
    todayGps: string;
    selfieUrl: string;
  };

  // Lead Distribution Breakdown
  leads: {
    totalReceived: number;
    totalDistributed: number;
    distributionBreakdown: { targetName: string; targetRole: string; count: number }[];
  };

  // Subordinates list
  subordinates: { id: string; name: string; role: string; calls: number; revenue: string }[];
}

const INITIAL_EMPLOYEES: EmployeeProfileWeb[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    code: 'EMP001',
    dept: 'Sales',
    role: 'MANAGER',
    assignedManager: 'Manager A (Vikram Singh)',
    baseSalary: '₹45,000',
    joined: 'Jan 15, 2024',
    canSelfCheckIn: true,
    status: 'active',
    attendance: {
      presentDays: 21,
      absentDays: 1,
      leaveDays: 1,
      todayInTime: '09:15 AM',
      todayOutTime: '06:30 PM',
      todayGps: '28.440743, 77.531117',
      selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    leads: {
      totalReceived: 140,
      totalDistributed: 110,
      distributionBreakdown: [
        { targetName: 'Priya Sharma (TL)', targetRole: 'Team Leader', count: 45 },
        { targetName: 'Karan Verma (TL)', targetRole: 'Team Leader', count: 40 },
        { targetName: 'Amit Patel (Exec)', targetRole: 'Sales Exec', count: 25 },
      ],
    },
    subordinates: [
      { id: 'sub-1', name: 'Priya Sharma', role: 'Team Leader', calls: 184, revenue: '₹3,85,000' },
      { id: 'sub-2', name: 'Karan Verma', role: 'Team Leader', calls: 156, revenue: '₹3,20,000' },
      { id: 'sub-3', name: 'Amit Patel', role: 'Sales Exec', calls: 84, revenue: '₹2,20,000' },
    ],
  },
  {
    id: '2',
    name: 'Priya Sharma',
    code: 'EMP002',
    dept: 'Sales',
    role: 'TEAM_LEADER',
    assignedManager: 'Manager A (Rajesh Kumar)',
    baseSalary: '₹35,000',
    joined: 'Mar 1, 2024',
    canSelfCheckIn: true,
    status: 'active',
    attendance: {
      presentDays: 22,
      absentDays: 0,
      leaveDays: 1,
      todayInTime: '09:05 AM',
      todayOutTime: null,
      todayGps: '28.440743, 77.531117',
      selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    leads: {
      totalReceived: 45,
      totalDistributed: 40,
      distributionBreakdown: [
        { targetName: 'Amit Patel', targetRole: 'Sales Exec', count: 25 },
        { targetName: 'Meera Kapoor', targetRole: 'Sales Exec', count: 15 },
      ],
    },
    subordinates: [
      { id: 'sub-4', name: 'Amit Patel', role: 'Sales Exec', calls: 84, revenue: '₹2,20,000' },
      { id: 'sub-5', name: 'Meera Kapoor', role: 'Sales Exec', calls: 65, revenue: '₹1,85,000' },
    ],
  },
  {
    id: '3',
    name: 'Sunita Verma',
    code: 'EMP003',
    dept: 'Support & HR',
    role: 'HR',
    assignedManager: 'Manager B (Neha Joshi)',
    baseSalary: '₹30,000',
    joined: 'Jun 10, 2023',
    canSelfCheckIn: false,
    status: 'active',
    attendance: {
      presentDays: 20,
      absentDays: 1,
      leaveDays: 2,
      todayInTime: '09:30 AM',
      todayOutTime: '06:15 PM',
      todayGps: '28.440743, 77.531117',
      selfieUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    },
    leads: {
      totalReceived: 25,
      totalDistributed: 20,
      distributionBreakdown: [{ targetName: 'HR Recruitment Desk', targetRole: 'HR Ops', count: 20 }],
    },
    subordinates: [],
  },
  {
    id: '4',
    name: 'Amit Patel',
    code: 'EMP004',
    dept: 'Sales',
    role: 'SALES_EXEC',
    assignedManager: 'Manager A (Rajesh Kumar)',
    baseSalary: '₹40,000',
    joined: 'Nov 5, 2023',
    canSelfCheckIn: true,
    status: 'active',
    attendance: {
      presentDays: 21,
      absentDays: 1,
      leaveDays: 0,
      todayInTime: '09:10 AM',
      todayOutTime: null,
      todayGps: '28.440743, 77.531117',
      selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    leads: {
      totalReceived: 25,
      totalDistributed: 25,
      distributionBreakdown: [{ targetName: 'Direct Client Inbound', targetRole: 'Sales Exec', count: 25 }],
    },
    subordinates: [],
  },
];

export function EmployeeListWidget() {
  const { currentUser } = useAuth();
  const rawRole = (currentUser?.role || '').toString().trim().toUpperCase();
  const isAdmin = rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' || rawRole === 'OWNER';

  const [employees, setEmployees] = useState<EmployeeProfileWeb[]>(INITIAL_EMPLOYEES);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeProfileWeb | null>(null);
  const [modalTab, setModalTab] = useState<'PROFILE' | 'ATTENDANCE' | 'SUBORDINATES' | 'LEADS'>('PROFILE');
  const [selectedManager, setSelectedManager] = useState('');

  // Leaving Employee Handover Modal State (Admin Exclusive)
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [departingEmpId, setDepartingEmpId] = useState('4');
  const [recipientEmpId, setRecipientEmpId] = useState('1');

  const MANAGERS_LIST = ['Manager A (Rajesh Kumar)', 'Manager B (Neha Joshi)', 'Manager C (Vikram Singh)'];

  const openInspector = (emp: EmployeeProfileWeb) => {
    setSelectedEmp(emp);
    setSelectedManager(emp.assignedManager);
    setModalTab('PROFILE');
  };

  const handleSaveReassignment = () => {
    if (!selectedEmp) return;
    setEmployees(prev =>
      prev.map(e => (e.id === selectedEmp.id ? { ...e, assignedManager: selectedManager } : e))
    );
    setSelectedEmp({ ...selectedEmp, assignedManager: selectedManager });
    alert(`Successfully re-assigned ${selectedEmp.name}'s supervisor to ${selectedManager}!`);
  };

  // Bulk Lead & Work Transfer Handler
  const handleExecuteHandover = () => {
    const departing = employees.find(e => e.id === departingEmpId);
    const recipient = employees.find(e => e.id === recipientEmpId);

    if (!departing || !recipient) {
      alert('Please select valid departing and recipient staff members.');
      return;
    }
    if (departing.id === recipient.id) {
      alert('Departing employee and recipient employee cannot be the same person.');
      return;
    }

    const leadsToTransfer = departing.leads.totalReceived;

    setEmployees(prev =>
      prev.map(e => {
        if (e.id === departing.id) {
          return {
            ...e,
            leads: { ...e.leads, totalReceived: 0, totalDistributed: 0, distributionBreakdown: [] },
          };
        }
        if (e.id === recipient.id) {
          return {
            ...e,
            leads: {
              ...e.leads,
              totalReceived: e.leads.totalReceived + leadsToTransfer,
              totalDistributed: e.leads.totalDistributed + leadsToTransfer,
              distributionBreakdown: [
                ...e.leads.distributionBreakdown,
                { targetName: `Handover from ${departing.name}`, targetRole: 'Work Transfer', count: leadsToTransfer },
              ],
            },
          };
        }
        return e;
      })
    );

    setHandoverModalOpen(false);
    alert(`✅ Work & Lead Handover Complete!\nTransferred all ${leadsToTransfer} active leads and work status from ${departing.name} to ${recipient.name}.`);
  };

  return (
    <div className="crm-card overflow-hidden p-0 space-y-4">
      {/* Admin Exclusive Handover Banner */}
      {isAdmin && (
        <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
              <Briefcase size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm">Departing Staff Lead &amp; Work Handover Center</h4>
              <p className="text-xs text-muted">Admin can transfer all active leads, deals &amp; work status from a leaving employee to any recipient staff member.</p>
            </div>
          </div>
          <button
            onClick={() => setHandoverModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg transition-all"
          >
            💼 Execute Work Handover →
          </button>
        </div>
      )}

      <div className="px-4 pt-2 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Employee &amp; Manager Directory</h3>
          <p className="text-xs text-muted">Click any staff row to open full Profile, Attendance, Subordinates &amp; Lead Allocation Controls</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="crm-table w-full text-xs text-left text-slate-300">
          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-border">
            <tr>
              <th className="p-3">Employee</th>
              <th className="p-3">Code</th>
              <th className="p-3">Role</th>
              <th className="p-3">Assigned Manager</th>
              <th className="p-3">Base Salary</th>
              <th className="p-3">Leads Handled</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-900/60 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={emp.attendance.selfieUrl} alt={emp.name} className="w-8 h-8 rounded-full border border-indigo-500 object-cover" />
                    <div>
                      <p className="font-bold text-white text-sm">{emp.name}</p>
                      <p className="text-xs text-muted">{emp.dept}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono text-slate-400">{emp.code}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${emp.role === 'MANAGER' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : emp.role === 'TEAM_LEADER' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                    {emp.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3 font-semibold text-indigo-300">{emp.assignedManager}</td>
                <td className="p-3 font-semibold text-emerald-400">{emp.baseSalary}</td>
                <td className="p-3 font-mono font-bold text-cyan-300">{emp.leads.totalReceived} Leads</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => openInspector(emp)}
                    className="px-3 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 text-xs font-bold transition-all flex items-center gap-1 ml-auto"
                  >
                    Open Profile <ExternalLink size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 🔍 IN-DEPTH PROFILE INSPECTOR MODAL                                         */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="crm-card max-w-2xl w-full p-6 border-indigo-500/40 bg-slate-900 space-y-4 rounded-2xl shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <img src={selectedEmp.attendance.selfieUrl} alt={selectedEmp.name} className="w-12 h-12 rounded-full border-2 border-indigo-500 object-cover" />
                <div>
                  <h3 className="text-lg font-extrabold text-white">{selectedEmp.name} ({selectedEmp.code})</h3>
                  <p className="text-xs text-muted">{selectedEmp.dept} • Joined {selectedEmp.joined}</p>
                  <span className="text-[10px] font-extrabold text-indigo-400 uppercase mt-0.5 block">ROLE: {selectedEmp.role.replace('_', ' ')}</span>
                </div>
              </div>
              <button onClick={() => setSelectedEmp(null)} className="text-muted hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex gap-2 border-b border-border pb-2 text-xs font-bold">
              {[
                { id: 'PROFILE', label: '👤 Profile & Manager' },
                { id: 'ATTENDANCE', label: '⏱️ Attendance Audit' },
                { id: 'SUBORDINATES', label: `👥 Subordinates (${selectedEmp.subordinates.length})` },
                { id: 'LEADS', label: `🎯 Lead Distribution (${selectedEmp.leads.totalReceived})` },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setModalTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${modalTab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs max-h-96 overflow-y-auto pr-1">

              {/* TAB 1: PROFILE & MANAGER RE-ASSIGNMENT */}
              {modalTab === 'PROFILE' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-border space-y-3">
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                      <ArrowRightLeft size={16} className="text-indigo-400" /> Manager Authority &amp; Supervisor Re-Assignment
                    </h4>
                    <p className="text-muted">Current Assigned Manager: <strong className="text-indigo-300">{selectedEmp.assignedManager}</strong></p>

                    {isAdmin ? (
                      <div className="space-y-2">
                        <label className="text-slate-300 font-bold block">Re-Assign to New Manager (Change Manager A → Manager B):</label>
                        <select
                          value={selectedManager}
                          onChange={e => setSelectedManager(e.target.value)}
                          className="crm-input w-full bg-slate-900 text-xs font-bold text-white"
                        >
                          {MANAGERS_LIST.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleSaveReassignment}
                          className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg transition-all"
                        >
                          Save Manager Re-Assignment Authority ✓
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted flex items-center gap-1"><Lock size={12} /> Only Tenant Administrators can re-assign manager authority.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ATTENDANCE AUDIT */}
              {modalTab === 'ATTENDANCE' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-950 border border-border">
                      <p className="text-lg font-black text-emerald-400">{selectedEmp.attendance.presentDays}</p>
                      <p className="text-[10px] text-muted font-bold">Present Days</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-border">
                      <p className="text-lg font-black text-red-400">{selectedEmp.attendance.absentDays}</p>
                      <p className="text-[10px] text-muted font-bold">Absent Days</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-border">
                      <p className="text-lg font-black text-amber-400">{selectedEmp.attendance.leaveDays}</p>
                      <p className="text-[10px] text-muted font-bold">Approved Leaves</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-border space-y-2">
                    <h4 className="font-extrabold text-white text-sm">Today's Punch Record &amp; Geo-Location</h4>
                    <p className="text-slate-300">Punch In Time: <strong className="text-emerald-400 font-mono">{selectedEmp.attendance.todayInTime}</strong></p>
                    <p className="text-slate-300">Punch Out Time: <strong className="text-white font-mono">{selectedEmp.attendance.todayOutTime || 'Currently Active'}</strong></p>
                    <a
                      href={`https://maps.google.com/?q=${selectedEmp.attendance.todayGps}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 font-bold hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <MapPin size={13} /> GPS Coordinates: {selectedEmp.attendance.todayGps} ↗
                    </a>
                  </div>
                </div>
              )}

              {/* TAB 3: SUBORDINATES LIST */}
              {modalTab === 'SUBORDINATES' && (
                <div className="space-y-3">
                  {selectedEmp.subordinates.length === 0 ? (
                    <p className="text-muted italic text-center py-6">No direct subordinates assigned under this staff member.</p>
                  ) : (
                    selectedEmp.subordinates.map(sub => (
                      <div key={sub.id} className="p-3 rounded-xl bg-slate-950 border border-border flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-sm">{sub.name}</p>
                          <p className="text-xs text-indigo-400 font-semibold">{sub.role}</p>
                        </div>
                        <div className="text-right font-mono">
                          <p className="text-xs text-slate-300">{sub.calls} Calls Logged</p>
                          <p className="text-xs font-bold text-emerald-400">{sub.revenue}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: LEAD ALLOCATION & DISTRIBUTION BREAKDOWN */}
              {modalTab === 'LEADS' && (
                <div className="space-y-4">
                  {/* Scope Rule Alert */}
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                    {isAdmin
                      ? '👑 ADMIN AUTHORITY: Admin can re-allocate leads to ANY employee or manager across teams.'
                      : '🔒 MANAGER SCOPE: Managers can only distribute leads to direct subordinates under their own team.'}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-border space-y-1">
                    <h4 className="font-extrabold text-white text-sm">Lead Distribution Telemetry</h4>
                    <p className="text-slate-300">Total Leads Received: <strong className="text-emerald-400 font-mono text-sm">{selectedEmp.leads.totalReceived} Leads</strong></p>
                    <p className="text-slate-400">Total Distributed to Subordinates: <strong className="text-indigo-300 font-mono">{selectedEmp.leads.totalDistributed} Leads</strong></p>
                  </div>

                  <h5 className="font-extrabold text-white text-xs">Distribution Breakdown per Staff Member:</h5>
                  <div className="space-y-2">
                    {selectedEmp.leads.distributionBreakdown.map((item, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950 border border-border flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{item.targetName}</p>
                          <p className="text-[10px] text-muted">{item.targetRole}</p>
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold font-mono">
                          {item.count} Leads Assigned
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-border">
              <button onClick={() => setSelectedEmp(null)} className="btn-secondary text-xs px-4 py-2">
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 💼 LEAVING EMPLOYEE WORK & LEAD HANDOVER MODAL (ADMIN EXCLUSIVE)           */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {handoverModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="crm-card max-w-lg w-full p-6 border-indigo-500/40 bg-slate-900 space-y-4 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={20} className="text-indigo-400" />
                <div>
                  <h3 className="font-extrabold text-white text-base">Departing Staff Lead &amp; Work Handover</h3>
                  <p className="text-xs text-muted">Admin can transfer all active leads, deals &amp; work status from a leaving employee to any recipient staff member.</p>
                </div>
              </div>
              <button onClick={() => setHandoverModalOpen(false)} className="text-muted hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Select Departing Employee (Source) *</label>
                <select
                  value={departingEmpId}
                  onChange={e => setDepartingEmpId(e.target.value)}
                  className="crm-input w-full bg-slate-950 font-bold text-red-400"
                >
                  {employees.map(e => (
                    <option key={`dep-${e.id}`} value={e.id}>
                      🚪 DEPARTING: {e.name} ({e.role}) • {e.leads.totalReceived} Active Leads
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Select Recipient Staff Member / Manager (Destination) *</label>
                <select
                  value={recipientEmpId}
                  onChange={e => setRecipientEmpId(e.target.value)}
                  className="crm-input w-full bg-slate-950 font-bold text-emerald-400"
                >
                  {employees.map(e => (
                    <option key={`rec-${e.id}`} value={e.id}>
                      📥 RECIPIENT: {e.name} ({e.role}) • Currently {e.leads.totalReceived} Leads
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button onClick={() => setHandoverModalOpen(false)} className="btn-secondary text-xs px-4 py-2">
                Cancel
              </button>
              <button
                onClick={handleExecuteHandover}
                className="btn-primary text-xs px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Transfer All Work &amp; Leads ✓
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
