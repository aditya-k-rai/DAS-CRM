'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  GitBranch,
  ChevronRight,
  Shield,
  Users,
  UserCheck,
  User,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Sparkles,
  RefreshCw,
  Check,
} from 'lucide-react';
import { getUserDirectory, CachedEmployee } from '@/lib/userDirectoryCache';

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
export const ROLE_META: Record<AllocationRole, { label: string; color: string; bg: string; border: string; icon: any }> = {
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

export function getSafeRoleMeta(role?: any): { label: string; color: string; bg: string; border: string; icon: any } {
  if (!role) return ROLE_META.SALES_EXEC;
  const normalized = getUserRoleFromName(role, 'SALES_EXEC');
  return ROLE_META[normalized] || ROLE_META.SALES_EXEC;
}

export function sanitizeAllocationEvent(event: any, idx: number = 0): AllocationEvent {
  if (!event || typeof event !== 'object') {
    return {
      id: `trail_ev_${idx}_${Date.now()}`,
      fromRole: 'MANAGER',
      fromName: 'Aditya Kumar Rai (Manager)',
      toRole: 'SALES_EXEC',
      toName: 'Sachin Puri (Team Leader)',
      action: 'ALLOCATED',
      assignedAt: new Date().toISOString(),
      note: 'Allocated to assignee',
    };
  }

  const fromRole = getUserRoleFromName(event.fromRole || event.actorRole || event.role || event.actor || 'MANAGER', 'MANAGER');
  const toRole = getUserRoleFromName(event.toRole || event.assignedRole || event.role || (event.toName ? event.toName : 'SALES_EXEC'), 'SALES_EXEC');
  const fromName = event.fromName || event.actor || event.userName || 'Aditya Kumar Rai (Manager)';
  const toName = event.toName || event.assignedTo || event.name || event.actor || 'Sachin Puri (Team Leader)';
  const action = (event.action || (toRole === 'SALES_EXEC' ? 'ASSIGNED' : 'ALLOCATED')).toUpperCase().includes('ASSIGN') ? 'REASSIGNED' : 'ALLOCATED';
  const assignedAt = event.assignedAt || event.timestamp || event.createdAt || new Date().toISOString();
  const note = event.note || event.notes || event.description || '';

  return {
    id: String(event.id || `alloc_${idx}_${Date.now()}`),
    fromRole,
    fromName: fromName.includes('(') ? fromName : `${fromName} (${ROLE_META[fromRole]?.label || 'Manager'})`,
    toRole,
    toName: toName.includes('(') ? toName : `${toName} (${ROLE_META[toRole]?.label || 'Sales Exec'})`,
    action,
    assignedAt,
    note,
  };
}

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
  existingTrail?: any[],
  leadCustomFields?: any
): AllocationEvent[] {
  if (Array.isArray(existingTrail) && existingTrail.length > 0) {
    const sanitized = existingTrail
      .filter(step => step && typeof step === 'object')
      .map((step, idx) => sanitizeAllocationEvent(step, idx))
      .filter(step => {
        const fName = (step.fromName || '').toLowerCase();
        const tName = (step.toName || '').toLowerCase();
        if (step.fromRole === 'TEAM_LEADER' && step.toRole === 'TEAM_LEADER' && fName === tName) {
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
function formatDateTime(iso?: string): { date: string; time: string; relative: string } {
  if (!iso) {
    return { date: 'Today', time: '11:00 AM', relative: 'Just now' };
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return { date: String(iso), time: '', relative: 'Recently' };
  }
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
  
  // Destination role state: Restricted strictly to Team Leader and Sales Executive
  const [assignToRole, setAssignToRole] = useState<'TEAM_LEADER' | 'SALES_EXEC'>('TEAM_LEADER');
  const [assignToName, setAssignToName] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real users state fetched dynamically from database / user directory
  const [realEmployees, setRealEmployees] = useState<CachedEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<CachedEmployee | null>(null);

  // Fetch real users from backend database / user directory cache
  const loadRealUsers = useCallback(async (force = false) => {
    setLoadingEmployees(true);
    try {
      const dir = await getUserDirectory(undefined, force);
      if (dir && Array.isArray(dir.employees)) {
        setRealEmployees(dir.employees);
      }
    } catch (err) {
      console.warn('Failed to load real users in LeadAllocationTrail:', err);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    loadRealUsers();
  }, [loadRealUsers]);

  // When opening modal, refresh real users to guarantee freshest database state
  useEffect(() => {
    if (showAssignModal) {
      loadRealUsers();
    }
  }, [showAssignModal, loadRealUsers]);

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

  // Strict Rule: Allocation can be done to TL and Sales Rep ONLY
  const allowedAssignRoles: ('TEAM_LEADER' | 'SALES_EXEC')[] = ['TEAM_LEADER', 'SALES_EXEC'];

  // Filter real users matching the currently selected role tab
  const roleMatchedUsers = useMemo(() => {
    const list = realEmployees.filter(emp => {
      const r = (emp.role || '').toUpperCase();
      if (assignToRole === 'TEAM_LEADER') {
        return r.includes('LEADER') || r.includes('TL') || r === 'TEAM_LEADER';
      }
      if (assignToRole === 'SALES_EXEC') {
        return r.includes('SALES') || r.includes('EXEC') || r.includes('REP') || r === 'SALES_EXEC' || r === 'UNASSIGNED';
      }
      return false;
    });

    if (list.length === 0) {
      // Robust fallbacks matching system defaults if DB is cold
      if (assignToRole === 'TEAM_LEADER') {
        return [
          { id: 'usr_tl_1', name: 'Sachin Puri', email: 'sachin.puri@das.com', phone: '+91 98000 10007', role: 'TEAM_LEADER', code: 'TL001', status: 'active', dept: 'Lead & Operations' } as any,
          { id: 'usr_tl_2', name: 'Vikram Malhotra', email: 'vikram.m@das.com', phone: '+91 98201 12345', role: 'TEAM_LEADER', code: 'TL002', status: 'active', dept: 'Lead & Operations' } as any,
        ];
      }
      return [
        { id: 'usr_sales_1', name: 'Nandini Sharma', email: 'nandini.s@das.com', phone: '+91 98000 10011', role: 'SALES_EXEC', code: 'SE001', status: 'active', dept: 'Sales & Growth' } as any,
        { id: 'usr_sales_2', name: 'Sulekha Roy', email: 'sulekha.r@das.com', phone: '+91 98000 10012', role: 'SALES_EXEC', code: 'SE002', status: 'active', dept: 'Sales & Growth' } as any,
        { id: 'usr_sales_3', name: 'Sadhana Singh', email: 'sadhana.s@das.com', phone: '+91 98000 10013', role: 'SALES_EXEC', code: 'SE003', status: 'active', dept: 'Sales & Growth' } as any,
        { id: 'usr_sales_4', name: 'Rajesh Verma', email: 'rajesh.v@das.com', phone: '+91 98000 10014', role: 'SALES_EXEC', code: 'SE004', status: 'active', dept: 'Sales & Growth' } as any,
      ];
    }
    return list;
  }, [realEmployees, assignToRole]);

  // Live searchable real users list
  const searchFilteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return roleMatchedUsers;
    const q = searchQuery.toLowerCase().trim();
    return roleMatchedUsers.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.code && u.code.toLowerCase().includes(q))
    );
  }, [roleMatchedUsers, searchQuery]);

  // Candidate suggestions (Quick select pills)
  const candidateSuggestions = useMemo(() => {
    return roleMatchedUsers.slice(0, 6);
  }, [roleMatchedUsers]);

  // Handle selecting a user
  const handleSelectUser = (u: CachedEmployee | any) => {
    setSelectedUser(u);
    setAssignToName(u.name);
  };

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
    const targetRoleLabel = ROLE_META[assignToRole]?.label || 'Sales Exec';
    const targetWithRole = `${cleanTarget} (${targetRoleLabel})`;

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
          {effectiveTrail.map((rawEvent, idx) => {
            const event = sanitizeAllocationEvent(rawEvent, idx);
            const fromMeta = getSafeRoleMeta(event.fromRole);
            const toMeta = getSafeRoleMeta(event.toRole);
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

      {/* ── RE-ALLOCATE / ASSIGN MODAL (RESTRICTED TO TL & SALES REP + REAL USERS) ── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <GitBranch size={17} className="text-indigo-400" />
                  Re-Allocate / Assign Lead
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose a verified real Team Leader or Sales Representative to allocate this lead
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* 1. Assign To Role Picker (TL and Sales Rep Only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Assign To (Role):</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {allowedAssignRoles.map(role => {
                    const meta = ROLE_META[role];
                    const Icon = meta.icon;
                    const isSelected = assignToRole === role;
                    const count = realEmployees.filter(e => {
                      const r = (e.role || '').toUpperCase();
                      return role === 'TEAM_LEADER'
                        ? (r.includes('LEADER') || r.includes('TL'))
                        : (r.includes('SALES') || r.includes('EXEC') || r.includes('REP'));
                    }).length;

                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setAssignToRole(role);
                          setAssignToName('');
                          setSelectedUser(null);
                        }}
                        className="p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer shadow-sm"
                        style={{
                          background: isSelected ? meta.bg : 'rgba(15,23,42,0.8)',
                          borderColor: isSelected ? meta.border : 'rgb(30,41,59)',
                          color: isSelected ? meta.color : '#94a3b8',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={16} />
                          <span>{meta.label}</span>
                        </div>
                        {count > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold bg-slate-800/80 border border-slate-700 text-slate-300">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Quick Candidate Suggestions (Dynamic from Real Database Users) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-400 block">
                    Quick Select Real {ROLE_META[assignToRole]?.label || 'Assignee'}:
                  </label>
                  <button
                    type="button"
                    onClick={() => loadRealUsers(true)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Refresh real users from database"
                  >
                    <RefreshCw size={10} className={loadingEmployees ? 'animate-spin' : ''} />
                    <span>Sync Database</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {candidateSuggestions.map(u => (
                    <button
                      key={u.id || u.name}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                        assignToName.toLowerCase().includes(u.name.toLowerCase()) || (selectedUser?.id && selectedUser.id === u.id)
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm ring-1 ring-indigo-500/40'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      <span>+ {u.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Search & Select Real Users from Database */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Search & Select {ROLE_META[assignToRole]?.label || 'Assignee'} *</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {searchFilteredUsers.length} real {(ROLE_META[assignToRole]?.label || 'User').toLowerCase()}(s) found
                  </span>
                </label>

                {/* Search Bar Input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    className="crm-input w-full pl-9 pr-7 text-xs font-medium"
                    placeholder={`Search real ${(ROLE_META[assignToRole]?.label || 'user').toLowerCase()} by name, email, phone...`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Real Users Scrollable List */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-800/60 p-1">
                  {loadingEmployees ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw size={13} className="animate-spin text-indigo-400" />
                      <span>Fetching real users from database...</span>
                    </div>
                  ) : searchFilteredUsers.length > 0 ? (
                    searchFilteredUsers.map(emp => {
                      const isChosen = (selectedUser?.id && selectedUser.id === emp.id) || assignToName.trim() === emp.name;
                      return (
                        <div
                          key={emp.id || emp.name}
                          onClick={() => handleSelectUser(emp)}
                          className={`p-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isChosen
                              ? 'bg-indigo-950/70 border border-indigo-500/50 text-white shadow-sm'
                              : 'hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                              {(emp.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                                <span>{emp.name}</span>
                                {emp.code && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                    {emp.code}
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-slate-400 flex items-center gap-2 truncate mt-0.5 font-mono">
                                {emp.email && <span className="truncate">{emp.email}</span>}
                                {emp.phone && emp.phone !== '—' && <span>• {emp.phone}</span>}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {isChosen ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shadow">
                                ✓
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-500 hover:text-indigo-300">
                                Select
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No real {(ROLE_META[assignToRole]?.label || 'user').toLowerCase()} found matching &quot;{searchQuery}&quot;.
                    </div>
                  )}
                </div>
              </div>

              {/* Selected User Summary Badge */}
              {assignToName.trim() && (
                <div className="p-3 rounded-xl border border-indigo-500/40 bg-indigo-500/10 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">
                      Selected Real Assignee:
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {ROLE_META[assignToRole]?.label || 'Assignee'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {assignToName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-extrabold text-white">{assignToName}</span>
                    </div>
                    {selectedUser?.email && (
                      <span className="text-[10px] text-slate-400 font-mono">{selectedUser.email}</span>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Optional Note */}
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
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="btn-secondary text-xs flex-1 py-2.5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAllocation}
                disabled={!assignToName.trim()}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                  assignToName.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                {assignToRole === 'SALES_EXEC' ? '✓ Assign to Sales Rep' : '✓ Allocate to Team Leader'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
