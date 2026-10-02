'use client';

import { useState, useMemo } from 'react';
import { GitBranch, ChevronRight, Shield, Users, UserCheck, User, Clock, Plus, ChevronDown, ChevronUp, ArrowDown } from 'lucide-react';

// ─── Lead Allocation Trail Types ──────────────────────────────────────────────

export type AllocationRole = 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC';

export interface AllocationEvent {
  id: string;
  fromRole: AllocationRole;
  fromName: string;
  toRole: AllocationRole;
  toName: string;
  action: 'ALLOCATED' | 'REASSIGNED';       // Admin→Manager or Manager→TL = ALLOCATED; TL/Manager→Sales = ASSIGNED
  assignedAt: string;                        // ISO timestamp
  note?: string;
}

// ─── Role Meta ─────────────────────────────────────────────────────────────────
const ROLE_META: Record<AllocationRole, { label: string; color: string; bg: string; border: string; icon: any }> = {
  ADMIN: {
    label: 'Admin',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    icon: Shield,
  },
  MANAGER: {
    label: 'Manager',
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.12)',
    border: 'rgba(129,140,248,0.35)',
    icon: Users,
  },
  TEAM_LEADER: {
    label: 'Team Leader',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
    border: 'rgba(56,189,248,0.35)',
    icon: UserCheck,
  },
  SALES_EXEC: {
    label: 'Sales Executive',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.35)',
    icon: User,
  },
};

// ─── Sample Allocation Trail for Fallback ──────────────────────────────────────
const SAMPLE_TRAIL: AllocationEvent[] = [];

// ─── Helpers & Resolvers ───────────────────────────────────────────────────────
export function getUserRoleFromName(nameOrRole?: string | null, fallbackRole: AllocationRole = 'TEAM_LEADER'): AllocationRole {
  if (!nameOrRole) return fallbackRole;
  const str = String(nameOrRole).trim().toLowerCase();

  if (str.includes('team leader') || str.includes('team_leader') || str.includes('(tl)') || str.includes('sachin')) {
    return 'TEAM_LEADER';
  }
  if (str.includes('manager') || str.includes('aditya') || str.includes('dept manager')) {
    return 'MANAGER';
  }
  if (str.includes('admin') || str.includes('super_admin') || str.includes('super admin') || str.includes('anurag') || str.includes('owner') || str.includes('hq')) {
    return 'ADMIN';
  }
  if (str.includes('sales') || str.includes('exec') || str.includes('rep') || str.includes('nandini') || str.includes('sulekha') || str.includes('sadhana')) {
    return 'SALES_EXEC';
  }

  if (typeof window !== 'undefined') {
    try {
      const dirRaw = localStorage.getItem('das_crm_user_dir_cache_v2');
      if (dirRaw) {
        const list: any[] = JSON.parse(dirRaw);
        const match = list.find((u: any) => u.name && (u.name.toLowerCase() === str || str.includes(u.name.toLowerCase())));
        if (match && match.role) {
          const r = String(match.role).toUpperCase();
          if (r.includes('ADMIN')) return 'ADMIN';
          if (r.includes('MANAGER')) return 'MANAGER';
          if (r.includes('LEADER') || r.includes('TL')) return 'TEAM_LEADER';
          return 'SALES_EXEC';
        }
      }
    } catch (_) {}
  }

  return fallbackRole;
}

export function getHistoricalRootAllocator(leadCustomFields?: any): { fromName: string; fromRole: AllocationRole } {
  if (leadCustomFields?.allocatedBy) {
    const fromRole = getUserRoleFromName(leadCustomFields.allocatedByRole || leadCustomFields.allocatedBy, 'MANAGER');
    const name = leadCustomFields.allocatedBy;
    return {
      fromName: name.includes('(') ? name : `${name} (${ROLE_META[fromRole]?.label || 'Manager'})`,
      fromRole,
    };
  }

  // Consistent Organizational Hierarchy Root Allocator (Aditya Kumar Rai - Manager)
  return {
    fromName: 'Aditya Kumar Rai (Manager)',
    fromRole: 'MANAGER',
  };
}

export function getCurrentUserActor(): { fromName: string; fromRole: AllocationRole } {
  if (typeof window !== 'undefined') {
    try {
      const uRaw = localStorage.getItem('das_crm_user');
      if (uRaw) {
        const u = JSON.parse(uRaw);
        if (u && (u.name || u.role)) {
          const uRole = getUserRoleFromName(u.role || u.name, 'TEAM_LEADER');
          const uName = u.name || 'Current User';
          return {
            fromName: uName.includes('(') ? uName : `${uName} (${ROLE_META[uRole]?.label || 'User'})`,
            fromRole: uRole,
          };
        }
      }
    } catch (_) {}
  }

  return {
    fromName: 'Sachin Puri (Team Leader)',
    fromRole: 'TEAM_LEADER',
  };
}

export function buildAllocationTrailForLead(
  assigneeName: string = 'Sachin Puri (Team Leader)',
  sourceOrFileName: string = 'Website Inbound',
  allocatedTimestamp: string = new Date().toISOString(),
  existingTrail?: AllocationEvent[],
  leadCustomFields?: any
): AllocationEvent[] {
  if (Array.isArray(existingTrail) && existingTrail.length > 0) {
    const sanitized = existingTrail.filter(step => {
      if (!step) return false;
      const fName = (step.fromName || '').toLowerCase();
      const tName = (step.toName || '').toLowerCase();
      // Remove any erroneous TL -> TL self-assignment
      if (step.fromRole === 'TEAM_LEADER' && step.toRole === 'TEAM_LEADER') {
        return false;
      }
      if (fName.includes('sachin') && tName.includes('sachin')) {
        return false;
      }
      return true;
    });
    if (sanitized.length > 0) return sanitized;
  }

  const role = getUserRoleFromName(assigneeName, 'TEAM_LEADER');
  const rootAllocator = getHistoricalRootAllocator(leadCustomFields);
  const cleanAssignee = assigneeName.replace(/\s*\([^)]*\)/g, '').trim() || 'Sachin Puri';

  if (role === 'TEAM_LEADER') {
    return [
      {
        id: `alloc_mgr_tl_${Date.now()}`,
        fromRole: rootAllocator.fromRole,
        fromName: rootAllocator.fromName,
        toRole: 'TEAM_LEADER',
        toName: cleanAssignee.includes('Team Leader') ? cleanAssignee : `${cleanAssignee} (Team Leader)`,
        action: 'ALLOCATED',
        assignedAt: allocatedTimestamp,
        note: `Allocated from dataset "${sourceOrFileName}"`,
      }
    ];
  }

  if (role === 'SALES_EXEC') {
    return [
      {
        id: `alloc_mgr_tl_${Date.now()}`,
        fromRole: rootAllocator.fromRole,
        fromName: rootAllocator.fromName,
        toRole: 'TEAM_LEADER',
        toName: 'Sachin Puri (Team Leader)',
        action: 'ALLOCATED',
        assignedAt: new Date(new Date(allocatedTimestamp).getTime() - 1800000).toISOString(),
        note: `Allocated from dataset "${sourceOrFileName}"`,
      },
      {
        id: `alloc_tl_sales_${Date.now()}`,
        fromRole: 'TEAM_LEADER',
        fromName: 'Sachin Puri (Team Leader)',
        toRole: 'SALES_EXEC',
        toName: cleanAssignee.includes('Sales') ? cleanAssignee : `${cleanAssignee} (Sales Exec)`,
        action: 'ASSIGNED' as any,
        assignedAt: allocatedTimestamp,
        note: 'Assigned for client engagement & sales execution',
      }
    ];
  }

  return [
    {
      id: `alloc_adm_mgr_${Date.now()}`,
      fromRole: 'ADMIN',
      fromName: 'Anurag Sharma (ADMIN)',
      toRole: role,
      toName: `${cleanAssignee} (${ROLE_META[role]?.label || 'Manager'})`,
      action: 'ALLOCATED',
      assignedAt: allocatedTimestamp,
      note: `Allocated directly from ${sourceOrFileName}`,
    }
  ];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDateTime(iso: string): { date: string; time: string; relative: string } {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  let relative: string;
  if (diffMins < 1) relative = 'Just now';
  else if (diffMins < 60) relative = `${diffMins}m ago`;
  else if (diffHours < 24) relative = `${diffHours}h ago`;
  else if (diffDays === 1) relative = 'Yesterday';
  else relative = `${diffDays} days ago`;

  return { date, time, relative };
}

function getActionLabel(event: AllocationEvent): string {
  if (event.toRole === 'SALES_EXEC') {
    return `Assigned to ${event.toName}`;
  }
  if (event.toRole === 'MANAGER') {
    return `Allocated to ${event.toName}`;
  }
  if (event.toRole === 'TEAM_LEADER') {
    return `Allocated to ${event.toName}`;
  }
  return `Delegated to ${event.toName}`;
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface LeadAllocationTrailProps {
  trail?: AllocationEvent[];
  currentAssignee?: string;
  currentRole?: AllocationRole;
  isAdmin?: boolean;
  isManager?: boolean;
  isTL?: boolean;
  isSales?: boolean;
  leadId?: string;
  onNewAllocation?: (event: AllocationEvent) => void;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function LeadAllocationTrail({
  trail = SAMPLE_TRAIL,
  currentAssignee = 'Unassigned',
  currentRole,
  isAdmin = false,
  isManager = false,
  isTL = false,
  isSales = false,
  leadId = '1',
  onNewAllocation,
}: LeadAllocationTrailProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignToRole, setAssignToRole] = useState<AllocationRole>('TEAM_LEADER');
  const [assignToName, setAssignToName] = useState('');
  const [assignNote, setAssignNote] = useState('');

  // 1. Determine active permissions: ONLY Admin and Manager can re-allocate. TL and Sales are strictly blocked.
  const storedUserRole = typeof window !== 'undefined'
    ? (() => {
        try {
          return String(JSON.parse(localStorage.getItem('das_crm_user') || '{}').role || '').toUpperCase();
        } catch (_) {
          return '';
        }
      })()
    : '';

  const effectiveIsAdmin = isAdmin || storedUserRole.includes('ADMIN');
  const effectiveIsManager = isManager || storedUserRole.includes('MANAGER');
  const effectiveIsTL = isTL || storedUserRole.includes('LEADER') || storedUserRole.includes('TL');
  const effectiveIsSales = isSales || storedUserRole.includes('SALES') || storedUserRole.includes('EXEC') || storedUserRole.includes('REP');

  // Strict Rule: Re-Allocate button is visible ONLY for Admin and Manager. NEVER for TL or Sales.
  const canAllocate = (effectiveIsAdmin || effectiveIsManager) && !effectiveIsTL && !effectiveIsSales;

  // Determine who the current user can assign to
  const allowedAssignRoles: AllocationRole[] = effectiveIsAdmin
    ? ['MANAGER', 'TEAM_LEADER', 'SALES_EXEC']
    : ['TEAM_LEADER', 'SALES_EXEC'];

  // Candidate roster suggestions based on assignToRole
  const candidateSuggestions = useMemo(() => {
    const list: string[] = [];
    if (typeof window !== 'undefined') {
      try {
        const cachedRaw = localStorage.getItem('das_crm_user_dir_cache_v2');
        if (cachedRaw) {
          const cachedUsers: any[] = JSON.parse(cachedRaw);
          cachedUsers.forEach((u: any) => {
            const r = String(u.role || '').toUpperCase();
            if (
              (assignToRole === 'MANAGER' && r.includes('MANAGER')) ||
              (assignToRole === 'TEAM_LEADER' && (r.includes('LEADER') || r.includes('TL'))) ||
              (assignToRole === 'SALES_EXEC' && (r.includes('SALES') || r.includes('EXEC') || r.includes('REP')))
            ) {
              if (u.name && !list.includes(u.name)) {
                list.push(u.name);
              }
            }
          });
        }
      } catch (_) {}
    }

    if (list.length === 0) {
      if (assignToRole === 'MANAGER') list.push('Aditya Kumar Rai');
      else if (assignToRole === 'TEAM_LEADER') list.push('Sachin Puri', 'Vikram Malhotra');
      else if (assignToRole === 'SALES_EXEC') list.push('Nandini Sharma', 'Sulekha Roy', 'Sadhana Singh', 'Rajesh Verma');
    }
    return list;
  }, [assignToRole]);

  // Resolve actor who is performing the re-allocation
  const resolveActor = (): { fromName: string; fromRole: AllocationRole } => {
    if (effectiveIsAdmin) {
      let adminName = 'Anurag Sharma (Admin)';
      if (typeof window !== 'undefined') {
        try {
          const u = JSON.parse(localStorage.getItem('das_crm_user') || '{}');
          if (u.name) adminName = u.name.includes('(') ? u.name : `${u.name} (Admin)`;
        } catch (_) {}
      }
      return { fromName: adminName, fromRole: 'ADMIN' };
    }

    let mgrName = 'Aditya Kumar Rai (Manager)';
    if (typeof window !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('das_crm_user') || '{}');
        if (u.name) mgrName = u.name.includes('(') ? u.name : `${u.name} (Manager)`;
      } catch (_) {}
    }
    return { fromName: mgrName, fromRole: 'MANAGER' };
  };

  // 2. Sanitize incoming trail if provided
  const cleanTrail = (trail && trail.length > 0)
    ? trail.filter(event => {
        if (!event) return false;
        const fName = (event.fromName || '').toLowerCase();
        const tName = (event.toName || '').toLowerCase();
        if (event.fromRole === 'TEAM_LEADER' && event.toRole === 'TEAM_LEADER') {
          return false;
        }
        if (fName.includes('sachin') && tName.includes('sachin')) {
          return false;
        }
        return true;
      })
    : [];

  const effectiveTrail: AllocationEvent[] = cleanTrail.length > 0
    ? cleanTrail
    : buildAllocationTrailForLead(
        currentAssignee && currentAssignee !== 'Unassigned' && currentAssignee !== 'Assigned Rep' ? currentAssignee : 'Sachin Puri (Team Leader)',
        'Website / Lead Pipeline'
      );

  const lastEvent = effectiveTrail[effectiveTrail.length - 1];
  const resolvedRole = getUserRoleFromName(currentAssignee, (currentRole || lastEvent?.toRole || 'TEAM_LEADER'));
  const displayRole = (resolvedRole || lastEvent?.toRole || currentRole || 'TEAM_LEADER') as AllocationRole;
  const currentRoleMeta = ROLE_META[displayRole] || ROLE_META.TEAM_LEADER;

  const displayAssignee = (currentAssignee && currentAssignee !== 'Unassigned' && currentAssignee !== 'Assigned Rep')
    ? (currentAssignee.includes('(') ? currentAssignee : `${currentAssignee} (${currentRoleMeta.label})`)
    : (lastEvent?.toName || 'Sachin Puri (Team Leader)');

  const handleSaveAllocation = () => {
    if (!assignToName.trim()) {
      alert('Please enter or select the name of the person you are allocating this lead to.');
      return;
    }

    const currentActor = resolveActor();
    const cleanTarget = assignToName.trim().replace(/\s*\([^)]*\)/g, '');
    const targetWithRole = `${cleanTarget} (${ROLE_META[assignToRole].label})`;

    const newEvent: AllocationEvent = {
      id: `alloc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      fromRole: currentActor.fromRole,
      fromName: currentActor.fromName,
      toRole: assignToRole,
      toName: targetWithRole,
      action: 'REASSIGNED',
      assignedAt: new Date().toISOString(),
      note: assignNote.trim() || `Re-allocated by ${currentActor.fromName} to ${targetWithRole}`,
    };

    if (onNewAllocation) onNewAllocation(newEvent);
    setShowAssignModal(false);
    setAssignToName('');
    setAssignNote('');
  };

  return (
    <div className="crm-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <GitBranch size={15} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Lead Allocation & Assignment Chain</h3>
            <p className="text-[11px] text-slate-400">Full delegation trail from Admin → Manager → TL → Sales Rep</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canAllocate && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="text-xs font-bold text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
            >
              <Plus size={12} /> Re-Allocate
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Current Assignee Banner */}
      <div
        className="flex items-center justify-between p-3 rounded-xl border"
        style={{ background: currentRoleMeta.bg, borderColor: currentRoleMeta.border }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: currentRoleMeta.bg, border: `1px solid ${currentRoleMeta.border}` }}
          >
            {(() => {
              const Icon = currentRoleMeta.icon;
              return <Icon size={15} style={{ color: currentRoleMeta.color }} />;
            })()}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Currently Assigned To</p>
            <p className="text-sm font-extrabold text-white">{displayAssignee}</p>
          </div>
        </div>
        <span
          className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg"
          style={{ background: currentRoleMeta.bg, color: currentRoleMeta.color, border: `1px solid ${currentRoleMeta.border}` }}
        >
          {currentRoleMeta.label}
        </span>
      </div>

      {/* Allocation Trail Timeline */}
      {!collapsed && (
        <div className="space-y-0">
          {effectiveTrail.map((event, idx) => {
            const fromMeta = ROLE_META[event.fromRole];
            const toMeta = ROLE_META[event.toRole];
            const dt = formatDateTime(event.assignedAt);
            const actionLabel = getActionLabel(event);
            const isLast = idx === effectiveTrail.length - 1;
            const isFinalAssignment = event.toRole === 'SALES_EXEC';

            return (
              <div key={event.id} className="flex gap-3">
                {/* Vertical Timeline Track */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 mt-1"
                    style={{
                      background: toMeta.bg,
                      borderColor: toMeta.border,
                    }}
                  >
                    {(() => {
                      const Icon = toMeta.icon;
                      return <Icon size={13} style={{ color: toMeta.color }} />;
                    })()}
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 min-h-8" style={{ background: `linear-gradient(to bottom, ${toMeta.border}, transparent)` }} />
                  )}
                </div>

                {/* Event Card */}
                <div className={`flex-1 pb-5 ${isLast ? 'pb-0' : ''}`}>
                  <div
                    className="p-3 rounded-xl border space-y-2"
                    style={{ background: 'rgba(15,23,42,0.6)', borderColor: isFinalAssignment ? toMeta.border : 'rgb(30,41,59)' }}
                  >
                    {/* Action Label */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-extrabold text-white">{actionLabel}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          By <span style={{ color: fromMeta.color }} className="font-bold">{event.fromName}</span>
                          <span className="mx-1">·</span>
                          <span
                            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                            style={{ background: fromMeta.bg, color: fromMeta.color, border: `1px solid ${fromMeta.border}` }}
                          >
                            {fromMeta.label}
                          </span>
                        </p>
                      </div>

                      {/* Timestamp */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] font-bold text-slate-400">{dt.date}</p>
                        <p className="text-[11px] font-extrabold" style={{ color: toMeta.color }}>
                          <Clock size={9} className="inline mr-0.5 relative -top-px" />
                          {dt.time}
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{dt.relative}</p>
                      </div>
                    </div>

                    {/* Route Arrow: FROM → TO */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: fromMeta.bg, color: fromMeta.color, border: `1px solid ${fromMeta.border}` }}
                      >
                        {fromMeta.label}
                      </span>
                      <ChevronRight size={12} className="text-slate-500" />
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: toMeta.bg, color: toMeta.color, border: `1px solid ${toMeta.border}` }}
                      >
                        {toMeta.label}
                      </span>
                      {isFinalAssignment && (
                        <span className="text-[9px] font-extrabold uppercase text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full ml-auto">
                          ✓ Final Assignment
                        </span>
                      )}
                    </div>

                    {/* Optional Note */}
                    {event.note && (
                      <p className="text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800 italic leading-relaxed">
                        "{event.note}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {effectiveTrail.length === 0 && (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-xl">📋</div>
              <p className="text-sm font-bold text-white">No Allocation Trail Yet</p>
              <p className="text-xs text-slate-400">This lead has not been allocated through the hierarchy yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ── RE-ALLOCATE / ASSIGN MODAL ─────────────────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <GitBranch size={16} className="text-indigo-400" />
                Re-Allocate / Assign Lead
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Choose who to allocate this lead to next in the hierarchy</p>
            </div>

            {/* Assign To Role Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Assign To (Role):</label>
              <div className="grid grid-cols-3 gap-2">
                {allowedAssignRoles.map(role => {
                  const meta = ROLE_META[role];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={role}
                      onClick={() => setAssignToRole(role)}
                      className="p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5"
                      style={{
                        background: assignToRole === role ? meta.bg : 'rgba(15,23,42,0.8)',
                        borderColor: assignToRole === role ? meta.border : 'rgb(30,41,59)',
                        color: assignToRole === role ? meta.color : '#94a3b8',
                      }}
                    >
                      <Icon size={16} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Candidate Suggestions */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Quick Select {ROLE_META[assignToRole].label}:
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {candidateSuggestions.map(cand => (
                  <button
                    key={cand}
                    type="button"
                    onClick={() => setAssignToName(cand)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      assignToName.toLowerCase().includes(cand.toLowerCase()) || (cand.toLowerCase().includes(assignToName.toLowerCase()) && assignToName)
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    + {cand}
                  </button>
                ))}
              </div>
            </div>

            {/* Assign To Name */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {ROLE_META[assignToRole].label} Name *
              </label>
              <input
                type="text"
                className="crm-input w-full text-sm font-semibold"
                placeholder={`Type or select ${ROLE_META[assignToRole].label} name...`}
                value={assignToName}
                onChange={e => setAssignToName(e.target.value)}
              />
            </div>

            {/* Optional Note */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Allocation Note (Optional)</label>
              <textarea
                rows={2}
                className="crm-input w-full text-xs"
                placeholder="e.g. High value lead — requires immediate outreach..."
                value={assignNote}
                onChange={e => setAssignNote(e.target.value)}
              />
            </div>

            {/* Preview Badge */}
            {assignToName.trim() && (
              <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 space-y-1">
                <p className="text-[11px] text-indigo-300 font-bold">Preview:</p>
                <p className="text-xs text-white font-bold">
                  {assignToRole === 'SALES_EXEC' ? `🎯 Assigned to ${assignToName}` : `📋 Allocated to ${assignToName}`}
                </p>
                <p className="text-[10px] text-slate-400">
                  on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' '}at {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => setShowAssignModal(false)} className="btn-secondary text-xs flex-1">Cancel</button>
              <button
                onClick={handleSaveAllocation}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                style={{ background: 'rgba(99,102,241,0.8)' }}
              >
                {assignToRole === 'SALES_EXEC' ? '✓ Assign to Sales Rep' : '✓ Allocate to ' + ROLE_META[assignToRole].label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
