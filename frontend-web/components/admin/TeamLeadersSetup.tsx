'use client';

import { useState } from 'react';
import { Shield, Plus, Users, UserCheck, ArrowRight, Lock, CheckCircle2, Edit3, PhoneCall, Target, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface EmployeeNode {
  id: string;
  name: string;
  role: string;
  reportingTo: string;
  type: 'TL' | 'DIRECT_EMP' | 'TL_EMP';
  callsMade: number;
  leadsHandled: number;
  revenue: string;
}

interface ManagerNode {
  id: string;
  name: string;
  children: EmployeeNode[];
}

const INITIAL_HIERARCHY: ManagerNode[] = [
  {
    id: 'mgr_1',
    name: 'Amit Shah (Department Manager A)',
    children: [
      { id: 'tl_1',  name: 'Priya Sharma (Team Leader)', role: 'TEAM_LEADER', reportingTo: 'Amit Shah (Manager)', type: 'TL', callsMade: 184, leadsHandled: 42, revenue: '$38,500' },
      { id: 'emp_1', name: 'Rajesh Kumar (Sales Executive)', role: 'SALES_EXEC', reportingTo: 'Priya Sharma (TL)', type: 'TL_EMP', callsMade: 84, leadsHandled: 31, revenue: '$22,000' },
      { id: 'emp_2', name: 'Ananya Rep (Sales Executive)', role: 'SALES_EXEC', reportingTo: 'Amit Shah (Direct Report)', type: 'DIRECT_EMP', callsMade: 65, leadsHandled: 24, revenue: '$18,500' },
    ],
  },
  {
    id: 'mgr_2',
    name: 'Neha Joshi (Department Manager B)',
    children: [
      { id: 'tl_2',  name: 'Karan Verma (Team Leader)', role: 'TEAM_LEADER', reportingTo: 'Neha Joshi (Manager)', type: 'TL', callsMade: 156, leadsHandled: 38, revenue: '$32,000' },
      { id: 'emp_3', name: 'Sunita Verma (Sales Executive)', role: 'SALES_EXEC', reportingTo: 'Neha Joshi (Direct Report)', type: 'DIRECT_EMP', callsMade: 92, leadsHandled: 28, revenue: '$14,500' },
    ],
  },
];

export function TeamLeadersSetup() {
  const { currentUser } = useAuth();
  const [hierarchy, setHierarchy] = useState<ManagerNode[]>(INITIAL_HIERARCHY);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTLName, setNewTLName]       = useState('');
  const [notice, setNotice]             = useState<string | null>(null);

  // Authority Re-assignment Modal State
  const [reassignNode, setReassignNode] = useState<EmployeeNode | null>(null);
  const [newSupervisor, setNewSupervisor] = useState('');

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  const handleCreateTL = () => {
    if (!isAdmin || !newTLName.trim()) return;

    setHierarchy(prev => prev.map(m => {
      if (m.id === 'mgr_1') {
        return {
          ...m,
          children: [
            ...m.children,
            {
              id: `tl_${Date.now()}`,
              name: `${newTLName} (Team Leader)`,
              role: 'TEAM_LEADER',
              reportingTo: m.name,
              type: 'TL',
              callsMade: 0,
              leadsHandled: 0,
              revenue: '$0',
            },
          ],
        };
      }
      return m;
    }));

    setNotice(`✓ Created Team Leader "${newTLName}" under Manager A`);
    setTimeout(() => setNotice(null), 3000);
    setNewTLName('');
    setShowAddModal(false);
  };

  const handleSaveReassignment = () => {
    if (!reassignNode || !newSupervisor) return;

    setHierarchy(prev => prev.map(m => ({
      ...m,
      children: m.children.map(c => c.id === reassignNode.id ? { ...c, reportingTo: newSupervisor } : c),
    })));

    setNotice(`✓ Updated ${reassignNode.name}'s supervisor to: ${newSupervisor}`);
    setTimeout(() => setNotice(null), 3000);
    setReassignNode(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Tenant Admin Authorization Shield */}
      <div className="crm-card border-l-4 border-l-indigo-500 bg-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="avatar w-12 h-12 text-base font-bold bg-indigo-500/20 text-indigo-300">
              <Shield size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Company Organizational Hierarchy &amp; Authority Editor</h1>
                <span className="text-xs px-2.5 py-0.5 rounded font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  TENANT ADMIN EXCLUSIVE CONTROL
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                🔒 Only Tenant Admin can re-assign Team Leaders and Employees across Managers or Team Leaders.
              </p>
            </div>
          </div>

          {isAdmin ? (
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs gap-1.5 flex items-center font-bold px-4 py-2.5">
              <Plus size={14} /> Create Team Leader (TL)
            </button>
          ) : (
            <div className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 font-bold">
              <Lock size={13} /> Admin Authorization Required
            </div>
          )}
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-bold animate-scale-in">
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}

      {/* Hierarchy Tree Visualizer */}
      <div className="space-y-4">
        {hierarchy.map(m => (
          <div key={m.id} className="crm-card space-y-3 border-indigo-500/30">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  MANAGER
                </span>
                <h3 className="font-bold text-sm text-white">{m.name}</h3>
              </div>
              <span className="text-xs text-muted font-medium">{m.children.length} Direct Reports</span>
            </div>

            <div className="space-y-2 pl-4 border-l-2 border-indigo-500/30">
              {m.children.map(child => (
                <div key={child.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center ${child.type === 'TL' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                      {child.type === 'TL' ? 'TL' : 'EMP'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{child.name}</p>
                      <p className="text-xs text-muted">Supervisor: <strong className="text-indigo-400">{child.reportingTo}</strong></p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 font-medium">
                        <span>📞 {child.callsMade} Calls</span>
                        <span>🎯 {child.leadsHandled} Leads</span>
                        <span className="text-emerald-400 font-bold">💰 {child.revenue}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${child.type === 'TL' ? 'bg-blue-500/15 text-blue-400' : child.type === 'DIRECT_EMP' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                      {child.type === 'TL' ? 'Team Leader' : child.type === 'DIRECT_EMP' ? 'Direct to Manager' : 'Under TL'}
                    </span>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setReassignNode(child);
                          setNewSupervisor(child.reportingTo);
                        }}
                        className="btn-secondary text-xs gap-1 px-2.5 py-1 flex items-center"
                      >
                        <Edit3 size={12} /> Edit Authority
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add TL Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="crm-card w-full max-w-md relative z-10 space-y-4 animate-scale-in">
            <h3 className="font-bold text-base text-white">Create New Team Leader (TL)</h3>
            <p className="text-xs text-muted">Authorized by Tenant Admin only. Assigns a new TL under Manager A.</p>
            <div>
              <label className="text-xs text-muted block mb-1">Team Leader Name *</label>
              <input
                className="crm-input text-sm h-10 w-full"
                placeholder="e.g. Anil Kapoor"
                value={newTLName}
                onChange={e => setNewTLName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-secondary text-xs" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary text-xs font-bold px-4" onClick={handleCreateTL}>
                Create Team Leader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Authority Modal */}
      {reassignNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setReassignNode(null)} />
          <div className="crm-card w-full max-w-md relative z-10 space-y-4 animate-scale-in">
            <h3 className="font-bold text-base text-white">✏️ Re-assign Supervisor Authority</h3>
            <p className="text-xs text-muted">Re-assigning <strong className="text-white">{reassignNode.name}</strong> under a new Manager or Team Leader.</p>

            <div>
              <label className="text-xs text-muted block mb-2 font-semibold">Select New Supervisor *</label>
              <div className="space-y-2">
                {['Amit Shah (Department Manager A)', 'Neha Joshi (Department Manager B)', 'Priya Sharma (Team Leader)', 'Karan Verma (Team Leader)'].map(sup => (
                  <button
                    key={sup}
                    onClick={() => setNewSupervisor(sup)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition-all ${newSupervisor === sup ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-background border-border text-muted hover:border-brand/40'}`}
                  >
                    {newSupervisor === sup ? '✓ ' : ''}{sup}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-secondary text-xs" onClick={() => setReassignNode(null)}>Cancel</button>
              <button className="btn-primary text-xs font-bold px-4" onClick={handleSaveReassignment}>
                Save Re-assignment ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
