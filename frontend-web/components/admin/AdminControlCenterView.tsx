'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield, Lock, Check, X, Search, Users, Settings, Sparkles,
  RotateCcw, AlertTriangle, Layers, Zap, ChevronRight,
  CheckCircle2, History, UserCheck, Package, Receipt,
  MessageSquare, MessageCircle, Mail, FileText, BarChart3, Database,
  Calendar, Briefcase, TrendingUp, Radio, Building2, HelpCircle, Info,
  ArrowRight, RefreshCw, Copy, Send, ToggleLeft, ToggleRight, Edit3,
  Eye, EyeOff, Share2, Clock, Trash2
} from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';
import Link from 'next/link';
import { subscribeUserDirectory, invalidateUserDirectoryCache } from '@/lib/userDirectoryCache';
import { apiFetch } from '@/lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModulePermission {
  active: boolean;   // On = Visible in sidebar/dashboard | Off = Hidden entirely
  canView: boolean;  // Legacy — kept for backward compat; always synced with active
  canShare: boolean; // Legacy — kept for backward compat
  canEdit: boolean;  // Can create / edit / delete (only for QUOTES & PRODUCTS)
}

export interface ManagedWorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
  department?: string;
  phone?: string;
  isVerified?: boolean;
}

export interface ModuleDefinition {
  key: string;
  icon: any;
  label: string;
  description: string;
  category: 'SALES' | 'COMMUNICATION' | 'AI' | 'OPERATIONS' | 'ADMIN';
  href: string;
  hasEditControl?: boolean; // Only Quotations & Products have an additional Edit toggle
}

// ─── Module Registry ──────────────────────────────────────────────────────────

export const ALL_WEB_MODULES: ModuleDefinition[] = [
  // Sales & Revenue
  { key: 'LEADS',            icon: Users,         label: 'Leads Directory',               description: 'Lead generation, records, and contact directory',                          category: 'SALES',         href: '/leads' },
  { key: 'LEAD_ASSIGNMENT',  icon: Share2,        label: 'Lead Assignment & Distribution', description: 'Team leader & manager lead allocation rules and workload balancing',      category: 'SALES',         href: '/tl/lead-assignment' },
  { key: 'PIPELINE',         icon: Zap,           label: 'Lead Pipeline & Stages',        description: 'Kanban boards, ingestion rules, and stage movement',                      category: 'SALES',         href: '/pipeline' },
  { key: 'TASKS',            icon: Clock,         label: 'Follow-ups & Meetings Tracker', description: 'Task calendar, sales rep follow-ups, and meeting schedules',              category: 'SALES',         href: '/tasks' },
  { key: 'PRODUCTS',         icon: Package,       label: 'Product Catalogue',             description: 'Inventory, SKU management, pricing, and variants',                        category: 'SALES',         href: '/products',        hasEditControl: true },
  { key: 'PDF_CATALOG',      icon: FileText,      label: 'PDF Catalogue Generator',       description: 'Interactive product brochures and marketing collateral',                  category: 'SALES',         href: '/pdf-catalogue' },
  { key: 'QUOTES',           icon: Receipt,       label: 'Quotations & Invoices',         description: 'GST invoices, billing estimation, and proposals',                         category: 'SALES',         href: '/quotes',          hasEditControl: true },
  { key: 'DEALS',            icon: Briefcase,     label: 'Deals Management',              description: 'Closed deals tracking, contracts, and revenue share',                     category: 'SALES',         href: '/deals' },
  { key: 'GOALS',            icon: TrendingUp,    label: 'Goals & Targets',               description: 'Sales targets, employee quotas, and performance',                         category: 'SALES',         href: '/goals' },
  // Communication & Marketing
  { key: 'COMMUNICATIONS',  icon: MessageSquare,  label: 'WhatsApp Cloud API',        description: 'Cloud API broadcasts, customer chat inbox',                         category: 'COMMUNICATION', href: '/comms' },
  { key: 'WA_TEMPLATES',    icon: MessageCircle,  label: 'WhatsApp Direct Templates', description: 'Meta approved rich message templates and quick replies',             category: 'COMMUNICATION', href: '/whatsapp-templates' },
  { key: 'EXTRA_EMAIL',     icon: Mail,           label: 'Email Marketing',           description: 'Campaign builder, newsletters, and email tracking',                  category: 'COMMUNICATION', href: '/emails' },
  { key: 'UPCOMING_COMMS',  icon: Radio,          label: 'The Notice Board',          description: 'Company broadcast alerts, announcements, and bulletins',             category: 'COMMUNICATION', href: '/communicate' },
  // AI & Intelligence
  { key: 'AI_CONTROL',   icon: Sparkles,      label: 'AI Customization',          description: 'Lead scoring parameters, bot responses, prompts',                        category: 'AI',            href: '/admin/ai' },
  { key: 'AUTOMATIONS',  icon: Zap,           label: 'Workflow Automations',       description: 'Trigger-action bot rules and auto-assignment',                           category: 'OPERATIONS',    href: '/automations' },
  // Operations & HR
  { key: 'EMPLOYEES',    icon: UserCheck,     label: 'Employees & Hierarchy',     description: 'Staff directory, team leaders, and hierarchy builder',                    category: 'OPERATIONS',    href: '/hr/employees' },
  { key: 'ATTENDANCE',   icon: Calendar,      label: 'Attendance & Clock-In',     description: 'Daily employee check-in, leave requests, timesheets',                    category: 'OPERATIONS',    href: '/attendance' },
  { key: 'INTERVIEWS',   icon: Users,         label: 'Interview & Hiring',         description: 'Candidate screening, interview scheduling, hiring pipeline',             category: 'OPERATIONS',    href: '/hr/interviews' },
  { key: 'REPORTS',      icon: BarChart3,     label: 'Reports & Analytics',        description: 'Executive revenue charts, conversion analytics, telemetry',             category: 'OPERATIONS',    href: '/reports' },
  { key: 'DATABASE',     icon: Database,      label: 'Database & Storage',         description: 'Cloud data backups, raw database export, logs',                         category: 'OPERATIONS',    href: '/database' },
  // Administration
  { key: 'PROFILE',      icon: Building2,     label: 'Company Profile Settings',  description: 'Branding, company legal info, GSTIN, workspace configuration',           category: 'ADMIN',         href: '/profile' },
  { key: 'SETTINGS',     icon: Settings,      label: 'System Settings',           description: 'Global app security, themes, and notification preferences',              category: 'ADMIN',         href: '/settings' },
  { key: 'SUPPORT',      icon: HelpCircle,    label: 'Support & Help Desk',       description: 'Technical documentation, developer tickets, user guides',                category: 'ADMIN',         href: '/help' },
];

// ─── Default Modules per Role (cannot be toggled Off by admin) ────────────────
// Dashboard is always a default for every role (rendered separately via route)
export const DEFAULT_MODULE_KEYS_BY_ROLE: Record<string, string[]> = {
  ADMIN:       [], // Admin has full access always — no defaults needed here
  MANAGER:     ['LEADS', 'PIPELINE', 'REPORTS', 'ATTENDANCE', 'EMPLOYEES', 'DEALS', 'PRODUCTS', 'QUOTES', 'UPCOMING_COMMS', 'SUPPORT', 'GOALS', 'TASKS', 'SETTINGS'],
  TEAM_LEADER: ['LEADS', 'PIPELINE', 'REPORTS', 'ATTENDANCE', 'EMPLOYEES', 'DEALS', 'GOALS', 'SETTINGS', 'UPCOMING_COMMS', 'SUPPORT', 'LEAD_ASSIGNMENT', 'TASKS'],
  SALES_EXEC:  ['LEADS', 'DEALS', 'REPORTS', 'ATTENDANCE', 'SETTINGS', 'UPCOMING_COMMS', 'SUPPORT', 'TASKS'],
  HR:          ['EMPLOYEES', 'ATTENDANCE', 'INTERVIEWS', 'UPCOMING_COMMS', 'SUPPORT', 'SETTINGS'],
  UNASSIGNED:  [],
};

export const CATEGORY_STYLES: Record<string, { label: string; badgeBg: string; badgeText: string; borderColor: string }> = {
  SALES:         { label: 'Sales & Revenue',          badgeBg: 'bg-emerald-500/15', badgeText: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
  COMMUNICATION: { label: 'Communication & Outreach', badgeBg: 'bg-sky-500/15',     badgeText: 'text-sky-400',     borderColor: 'border-sky-500/30' },
  AI:            { label: 'AI Intelligence',          badgeBg: 'bg-purple-500/15',  badgeText: 'text-purple-400',  borderColor: 'border-purple-500/30' },
  OPERATIONS:    { label: 'Operations & HR',          badgeBg: 'bg-amber-500/15',   badgeText: 'text-amber-400',   borderColor: 'border-amber-500/30' },
  ADMIN:         { label: 'Administration & System',  badgeBg: 'bg-rose-500/15',    badgeText: 'text-rose-400',    borderColor: 'border-rose-500/30' },
};

// Role-based modules that are OFF by default (restricted unless admin explicitly turns On)
const RESTRICTED_BY_DEFAULT_ROLE: Record<string, string[]> = {
  SUPER_ADMIN: [],
  ADMIN:       [],
  MANAGER:     ['SETTINGS', 'PROFILE', 'DATABASE'],
  TEAM_LEADER: ['SETTINGS', 'PROFILE', 'DATABASE', 'AUTOMATIONS', 'AI_CONTROL'],
  HR:          ['SETTINGS', 'PROFILE', 'DATABASE', 'AUTOMATIONS', 'DEALS', 'QUOTES', 'WA_TEMPLATES', 'AI_CONTROL', 'PRODUCTS', 'PDF_CATALOG'],
  SALES_EXEC:  ['SETTINGS', 'PROFILE', 'DATABASE', 'AUTOMATIONS', 'DEALS', 'WA_TEMPLATES', 'AI_CONTROL', 'EMPLOYEES', 'INTERVIEWS'],
  UNASSIGNED:  ALL_WEB_MODULES.map(m => m.key),
};

const STORAGE_KEY = '@das_crm_module_policies_v1';
const AUDIT_STORAGE_KEY = '@das_crm_control_center_audit_v1';

export interface AuditLogEntry {
  id: string;
  ts: string;
  adminName: string;
  targetName: string;
  targetRole: string;
  moduleLabel: string;
  action: string;
}

export interface AdminControlCenterViewProps {
  onClose?: () => void;
  isModal?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminControlCenterView({ onClose, isModal = false }: AdminControlCenterViewProps) {
  const { currentUser } = useAuth();

  const [managedUsers, setManagedUsers] = useState<ManagedWorkspaceUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [policies, setPolicies] = useState<Record<string, ModulePermission>>({});
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [companyKey, setCompanyKey] = useState<string>('ADOR-EC-7187');
  const [copiedKey, setCopiedKey] = useState(false);
  const [allowManagerLeadDelete, setAllowManagerLeadDelete] = useState<boolean>(false);
  const [togglingManagerDelete, setTogglingManagerDelete] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Fetch initial Manager lead deletion permission status
  useEffect(() => {
    apiFetch('/leads/settings/delete-permissions')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setAllowManagerLeadDelete(Boolean(data.allowManagerLeadDelete));
        }
      })
      .catch(() => null);
  }, []);

  // Load Policies & Audit logs from localStorage & backend
  useEffect(() => {
    let localPolicies: Record<string, ModulePermission> = {};
    try {
      const rawPol = localStorage.getItem(STORAGE_KEY);
      if (rawPol) {
        localPolicies = JSON.parse(rawPol);
        setPolicies(localPolicies);
      }
      const rawAud = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (rawAud) setAuditLogs(JSON.parse(rawAud));
    } catch (_) {}

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const token = typeof window !== 'undefined' ? (localStorage.getItem('das_crm_token') || localStorage.getItem('token')) : null;
    let compId = currentUser?.companyId || (typeof window !== 'undefined' ? (localStorage.getItem('das_crm_org_id') || localStorage.getItem('companyId') || '') : '');
    if (compId === 'comp_das' || compId === 'comp_default' || compId === 'platform_system') {
      compId = '';
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(compId ? { 'x-organization-id': compId } : {}),
    };

    const fetchUrl = compId
      ? `${apiBase}/users/module-policies?organizationId=${compId}`
      : `${apiBase}/users/module-policies`;

    fetch(fetchUrl, { headers: requestHeaders })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.policies && Object.keys(data.policies).length > 0) {
          setPolicies(prev => {
            const merged = { ...data.policies, ...prev };
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch (_) {}
            return merged;
          });
        } else if (Object.keys(localPolicies).length > 0) {
          // If server is empty but local has policies, seed to server
          fetch(`${apiBase}/users/module-policies`, {
            method: 'PATCH',
            headers: requestHeaders,
            body: JSON.stringify({
              organizationId: compId,
              policies: localPolicies,
            }),
          }).catch(() => null);
        }

        if (data?.auditLogs && Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
          setAuditLogs(prev => {
            const map = new Map<string, AuditLogEntry>();
            data.auditLogs.forEach((a: AuditLogEntry) => map.set(a.id, a));
            prev.forEach((a: AuditLogEntry) => { if (!map.has(a.id)) map.set(a.id, a); });
            const mergedAudit = Array.from(map.values()).slice(0, 100);
            try { localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(mergedAudit)); } catch (_) {}
            return mergedAudit;
          });
        }
      })
      .catch(() => null);
  }, [currentUser?.id, currentUser?.companyId]);

  // ── Load Workspace Users ──────────────────────────────────────────────────

  const loadWorkspaceUsers = useCallback(async () => {
    setManagedUsers(prev => {
      if (prev.length === 0) setLoadingUsers(true);
      return prev;
    });
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const token = typeof window !== 'undefined' ? (localStorage.getItem('das_crm_token') || localStorage.getItem('token')) : null;
    let compId = currentUser?.companyId || (typeof window !== 'undefined' ? (localStorage.getItem('das_crm_org_id') || localStorage.getItem('companyId') || '') : '');
    if (compId === 'comp_das' || compId === 'comp_default' || compId === 'platform_system') {
      compId = '';
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(compId ? { 'x-organization-id': compId } : {}),
    };

    try {
      const keyUrl = compId
        ? `${apiBase}/users/company-key?organizationId=${compId}`
        : `${apiBase}/users/company-key`;
      let keyRes = await fetch(keyUrl, { headers: requestHeaders }).catch(() => null);
      if (!keyRes?.ok) keyRes = await fetch(compId ? `/api/v1/users/company-key?organizationId=${compId}` : `/api/v1/users/company-key`, { headers: requestHeaders }).catch(() => null);
      if (keyRes?.ok) {
        const keyJson = await keyRes.json();
        if (keyJson?.companyKey) setCompanyKey(keyJson.companyKey);
      }
    } catch (_) {}

    let realUsers: ManagedWorkspaceUser[] = [];

    try {
      const usersUrl = compId ? `${apiBase}/users?organizationId=${compId}` : `${apiBase}/users`;
      let res = await fetch(usersUrl, { headers: requestHeaders }).catch(() => null);
      if (!res?.ok) res = await fetch(compId ? `/api/v1/users?organizationId=${compId}` : `/api/v1/users`, { headers: requestHeaders }).catch(() => null);

      if (res?.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || data.users || []);

        if (Array.isArray(items) && items.length > 0) {
          let storedOverrides: Record<string, string> = {};
          try { storedOverrides = JSON.parse(localStorage.getItem('das_crm_verified_overrides') || '{}'); } catch (_) {}

          if (storedOverrides['rai992522@gmail.com'] === 'SALES_EXEC') {
            storedOverrides['rai992522@gmail.com'] = 'MANAGER';
            try { localStorage.setItem('das_crm_verified_overrides', JSON.stringify(storedOverrides)); } catch (_) {}
          }

          let removedIds: string[] = [];
          try { removedIds = JSON.parse(localStorage.getItem('das_crm_removed_user_ids') || '[]'); } catch (_) {}

          realUsers = items
            .filter((u: any) => {
              const uId = String(u.id);
              if (removedIds.includes(uId)) return false;
              const rawRole = ((u.role?.name || u.role || '') as string).toUpperCase().trim();
              const isAdm = rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' || rawRole === 'OWNER' || rawRole === 'TENANT_ADMIN' || rawRole.includes('ADMIN');
              const isSelf = (currentUser?.id && uId === String(currentUser.id)) || (currentUser?.email && u.email?.toLowerCase() === currentUser.email?.toLowerCase());
              return !isAdm && !isSelf;
            })
            .map((u: any) => {
              const uId = String(u.id);
              const overrideRole = storedOverrides[uId] || storedOverrides[u.email?.toLowerCase()] || (u.email?.toLowerCase() === 'rai992522@gmail.com' ? 'MANAGER' : undefined);
              const rawRole = (u.role?.name || u.role || '').toUpperCase();
              let finalRole = 'SALES_EXEC';
              if (overrideRole) finalRole = overrideRole;
              else if (rawRole.includes('MANAGER')) finalRole = 'MANAGER';
              else if (rawRole.includes('LEADER') || rawRole.includes('TL')) finalRole = 'TEAM_LEADER';
              else if (rawRole.includes('HR')) finalRole = 'HR';
              else if (u.roleId === null || rawRole === 'UNASSIGNED' || !rawRole) finalRole = 'UNASSIGNED';

              const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.email || 'Workspace Member';
              const initials = fullName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'WM';
              return {
                id: uId, name: fullName, email: u.email || '',
                role: finalRole, avatarInitials: initials,
                department: u.department || (finalRole === 'HR' ? 'Human Resources' : finalRole === 'MANAGER' ? 'Executive & Management' : finalRole === 'TEAM_LEADER' ? 'Lead & Operations' : 'Sales & Growth'),
                phone: u.phone || '', isVerified: u.isVerified ?? (finalRole !== 'UNASSIGNED'),
              };
            });
        }
      }
    } catch (e) { console.warn('Users fetch error:', e); }

    // Merge extra staff from localStorage
    try {
      let storedOverrides: Record<string, string> = {};
      try { storedOverrides = JSON.parse(localStorage.getItem('das_crm_verified_overrides') || '{}'); } catch (_) {}
      let removedIds: string[] = [];
      try { removedIds = JSON.parse(localStorage.getItem('das_crm_removed_user_ids') || '[]'); } catch (_) {}

      const extraStaff = JSON.parse(localStorage.getItem('das_crm_extra_staff') || '[]');
      if (Array.isArray(extraStaff)) {
        extraStaff.forEach((st: any) => {
          const uId = String(st.id);
          const emailLower = st.email?.toLowerCase();
          const rawRole = (st.role || '').toUpperCase();
          const isAdm = rawRole.includes('ADMIN') || rawRole.includes('OWNER');
          const isSelf = (currentUser?.id && uId === String(currentUser.id)) || (currentUser?.email && emailLower === currentUser.email?.toLowerCase());
          if (!isAdm && !isSelf && !removedIds.includes(uId) && !realUsers.some(u => u.id === uId)) {
            const overrideRole = storedOverrides[uId] || (emailLower && storedOverrides[emailLower]);
            const finalRole = overrideRole || st.role || 'SALES_EXEC';
            const fullName = st.name || st.email || 'Team Member';
            const initials = fullName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'TM';
            realUsers.push({ id: uId, name: fullName, email: st.email || '', role: finalRole, avatarInitials: initials, department: finalRole === 'MANAGER' ? 'Executive & Management' : finalRole === 'HR' ? 'Human Resources' : 'Sales & Growth', phone: st.phone || '', isVerified: finalRole !== 'UNASSIGNED' });
          }
        });
      }

      // Merge unassigned staff
      const extraUnassigned = JSON.parse(localStorage.getItem('das_crm_extra_unassigned') || '[]');
      if (Array.isArray(extraUnassigned)) {
        extraUnassigned.forEach((st: any) => {
          const uId = String(st.id);
          const emailLower = st.email?.toLowerCase();
          if (!removedIds.includes(uId) && !realUsers.some(u => u.id === uId)) {
            const overrideRole = storedOverrides[uId] || (emailLower && storedOverrides[emailLower]);
            const finalRole = overrideRole || st.appliedRole || 'UNASSIGNED';
            const fullName = st.name || st.email || 'Unassigned Staff';
            const initials = fullName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'US';
            realUsers.push({ id: uId, name: fullName, email: st.email || '', role: finalRole, avatarInitials: initials, department: finalRole !== 'UNASSIGNED' ? 'Sales & Growth' : 'Pending Assignment', phone: '', isVerified: finalRole !== 'UNASSIGNED' });
          }
        });
      }
    } catch (_) {}

    // Fallback with known workspace members
    if (realUsers.length === 0) {
      let storedOverrides: Record<string, string> = {};
      try { storedOverrides = JSON.parse(localStorage.getItem('das_crm_verified_overrides') || '{}'); } catch (_) {}
      let removedIds: string[] = [];
      try { removedIds = JSON.parse(localStorage.getItem('das_crm_removed_user_ids') || '[]'); } catch (_) {}

      // If no users returned from backend, do not inject third-party fallbacks
    }

    setManagedUsers(realUsers);
    if (realUsers.length > 0) {
      setSelectedUserId(prev => (prev && realUsers.some(u => u.id === prev) ? prev : realUsers[0].id));
    } else {
      setSelectedUserId('');
    }
    setLoadingUsers(false);
  }, [currentUser?.companyId, currentUser?.id, currentUser?.email]);

  useEffect(() => {
    loadWorkspaceUsers();
    const unsub = subscribeUserDirectory(() => loadWorkspaceUsers());
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadWorkspaceUsers();
      }
    }, 45000);
    return () => { unsub(); clearInterval(interval); };
  }, [loadWorkspaceUsers]);

  // ── Role Change Handler ───────────────────────────────────────────────────

  const handleVerifyOrChangeRole = async (targetUser: ManagedWorkspaceUser, newRole: string) => {
    try {
      const uId = targetUser.id;
      const emailLower = targetUser.email.toLowerCase();
      let storedOverrides: Record<string, string> = {};
      try { storedOverrides = JSON.parse(localStorage.getItem('das_crm_verified_overrides') || '{}'); } catch (_) {}
      storedOverrides[uId] = newRole;
      if (emailLower) storedOverrides[emailLower] = newRole;
      localStorage.setItem('das_crm_verified_overrides', JSON.stringify(storedOverrides));

      try {
        const extraStaff = JSON.parse(localStorage.getItem('das_crm_extra_staff') || '[]');
        localStorage.setItem('das_crm_extra_staff', JSON.stringify(extraStaff.map((st: any) => (st.id === uId || st.email?.toLowerCase() === emailLower ? { ...st, role: newRole, isVerified: newRole !== 'UNASSIGNED' } : st))));
      } catch (_) {}

      if (newRole !== 'UNASSIGNED') {
        try {
          const extraUnassigned = JSON.parse(localStorage.getItem('das_crm_extra_unassigned') || '[]');
          localStorage.setItem('das_crm_extra_unassigned', JSON.stringify(extraUnassigned.filter((u: any) => u.id !== uId)));
        } catch (_) {}
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = typeof window !== 'undefined' ? localStorage.getItem('das_crm_token') : null;
      const compId = currentUser?.companyId || '';
      fetch(`${apiBase}/users/${uId}/verify-role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-organization-id': compId, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ assignedRole: newRole, organizationId: compId }),
      }).catch(() => null);

      invalidateUserDirectoryCache();
      await loadWorkspaceUsers();
      showToast(`✓ Role updated to ${newRole.replace('_', ' ')} for ${targetUser.name}`);
    } catch (err) { console.error('Role update error:', err); }
  };

  const handleCopyKey = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(companyKey);
      setCopiedKey(true);
      showToast('✓ Company Registration Key copied!');
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  // ── Computed Values ───────────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    return managedUsers.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [managedUsers, searchQuery, roleFilter]);

  const selectedUser = useMemo(() => {
    return managedUsers.find(u => u.id === selectedUserId) || (managedUsers.length > 0 ? managedUsers[0] : null);
  }, [managedUsers, selectedUserId]);

  const syncPolicyToBackend = async (
    userId: string,
    userEmail: string | undefined,
    moduleKey: string,
    permission: ModulePermission,
    auditEntry: AuditLogEntry,
    allPolicies: Record<string, ModulePermission>,
  ) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const token = typeof window !== 'undefined' ? (localStorage.getItem('das_crm_token') || localStorage.getItem('token')) : null;
    let compId = currentUser?.companyId || (typeof window !== 'undefined' ? (localStorage.getItem('das_crm_org_id') || localStorage.getItem('companyId') || '') : '');
    if (compId === 'comp_das' || compId === 'comp_default' || compId === 'platform_system') {
      compId = '';
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(compId ? { 'x-organization-id': compId } : {}),
    };

    try {
      const url = compId
        ? `${apiBase}/users/module-policies?organizationId=${compId}`
        : `${apiBase}/users/module-policies`;

      await fetch(url, {
        method: 'PATCH',
        headers: requestHeaders,
        body: JSON.stringify({
          organizationId: compId,
          userId,
          userEmail,
          moduleKey,
          permission,
          auditEntry,
          policies: allPolicies,
        }),
      });
    } catch (e) {
      console.warn('Failed to sync module policy to server:', e);
    }
  };

  // Get the effective On/Off status of a module for a user
  const isModuleOn = (userId: string, userRole: string, moduleKey: string, userEmail?: string): boolean => {
    const normalizedRole = (userRole || '').toUpperCase();
    if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'OWNER' || normalizedRole === 'TENANT_ADMIN' || normalizedRole.includes('ADMIN') || (currentUser?.id && userId === currentUser.id)) return true;
    const key = `${userId}:${moduleKey}`;
    const emailKey = userEmail ? `${userEmail.toLowerCase().trim()}:${moduleKey}` : null;
    if (policies[key] !== undefined) return Boolean(policies[key].active);
    if (emailKey && policies[emailKey] !== undefined) return Boolean(policies[emailKey].active);
    // Fresh user default: only default modules for their assigned role are active/visible
    return Boolean((DEFAULT_MODULE_KEYS_BY_ROLE[normalizedRole] || []).includes(moduleKey));
  };

  // Get the edit permission for a module
  const canEditModule = (userId: string, userRole: string, moduleKey: string, userEmail?: string): boolean => {
    const normalizedRole = (userRole || '').toUpperCase();
    if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || normalizedRole.includes('ADMIN')) return true;
    const key = `${userId}:${moduleKey}`;
    const emailKey = userEmail ? `${userEmail.toLowerCase().trim()}:${moduleKey}` : null;
    if (policies[key]) return Boolean(policies[key].canEdit);
    if (emailKey && policies[emailKey]) return Boolean(policies[emailKey].canEdit);
    // Default edit rights by role
    const editableRoles: Record<string, string[]> = {
      MANAGER:     ['QUOTES', 'PRODUCTS', 'LEADS', 'PIPELINE', 'DEALS', 'GOALS'],
      TEAM_LEADER: ['LEADS', 'PIPELINE'],
      HR:          [],
      SALES_EXEC:  [],
    };
    return (editableRoles[normalizedRole] || []).includes(moduleKey);
  };

  // Is this module a default (non-toggleable) for this user's role?
  const isDefaultModule = (userRole: string, moduleKey: string): boolean => {
    return (DEFAULT_MODULE_KEYS_BY_ROLE[userRole] || []).includes(moduleKey);
  };

  // Toggle On/Off visibility for a module
  const handleToggleVisibility = (userId: string, moduleKey: string, moduleLabel: string, currentlyOn: boolean) => {
    if (!selectedUser) return;
    const normalizedRole = (selectedUser.role || '').toUpperCase();
    if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN' || normalizedRole.includes('ADMIN') || (currentUser?.id && userId === currentUser.id)) {
      showToast('⚠️ Admin has permanent full access — cannot restrict.');
      return;
    }
    if (isDefaultModule(selectedUser.role, moduleKey)) {
      showToast(`⚠️ "${moduleLabel}" is a default module for ${selectedUser.role.replace('_', ' ')} and cannot be hidden.`);
      return;
    }

    const key = `${userId}:${moduleKey}`;
    const emailKey = selectedUser.email ? `${selectedUser.email.toLowerCase().trim()}:${moduleKey}` : null;
    const nextOn = !currentlyOn;
    const updatedPerm: ModulePermission = nextOn
      ? { active: true, canView: true, canShare: true, canEdit: canEditModule(userId, selectedUser.role, moduleKey, selectedUser.email) }
      : { active: false, canView: false, canShare: false, canEdit: false };

    const nextPolicies = {
      ...policies,
      [key]: updatedPerm,
      ...(emailKey ? { [emailKey]: updatedPerm } : {}),
    };
    setPolicies(nextPolicies);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPolicies));
    window.dispatchEvent(new CustomEvent('das-crm-module-policy-updated'));

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random()}`,
      ts: new Date().toLocaleString(),
      adminName: currentUser?.name || 'Admin',
      targetName: selectedUser.name,
      targetRole: selectedUser.role,
      moduleLabel,
      action: `Visibility → ${nextOn ? 'ON (Visible)' : 'OFF (Hidden)'}`,
    };
    const nextAudit = [auditEntry, ...auditLogs.slice(0, 49)];
    setAuditLogs(nextAudit);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(nextAudit));
    showToast(`✓ ${moduleLabel} is now ${nextOn ? '🟢 Visible' : '🔴 Hidden'} for ${selectedUser.name}`);

    syncPolicyToBackend(userId, selectedUser.email, moduleKey, updatedPerm, auditEntry, nextPolicies);
  };

  // Toggle Edit permission (only for QUOTES and PRODUCTS)
  const handleToggleEdit = (userId: string, moduleKey: string, moduleLabel: string, currentEdit: boolean) => {
    if (!selectedUser) return;
    const key = `${userId}:${moduleKey}`;
    const emailKey = selectedUser.email ? `${selectedUser.email.toLowerCase().trim()}:${moduleKey}` : null;
    const currentOn = isModuleOn(userId, selectedUser.role, moduleKey, selectedUser.email);
    const updatedPerm: ModulePermission = { active: currentOn, canView: currentOn, canShare: currentOn, canEdit: !currentEdit };
    const nextPolicies = {
      ...policies,
      [key]: updatedPerm,
      ...(emailKey ? { [emailKey]: updatedPerm } : {}),
    };
    setPolicies(nextPolicies);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPolicies));
    window.dispatchEvent(new CustomEvent('das-crm-module-policy-updated'));
    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`, ts: new Date().toLocaleString(),
      adminName: currentUser?.name || 'Admin', targetName: selectedUser.name, targetRole: selectedUser.role,
      moduleLabel, action: `Edit permission → ${!currentEdit ? 'ALLOWED' : 'REMOVED'}`,
    };
    const nextAudit = [auditEntry, ...auditLogs.slice(0, 49)];
    setAuditLogs(nextAudit);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(nextAudit));
    showToast(`✓ Edit for ${moduleLabel} ${!currentEdit ? 'enabled' : 'disabled'} for ${selectedUser.name}`);

    syncPolicyToBackend(userId, selectedUser.email, moduleKey, updatedPerm, auditEntry, nextPolicies);
  };

  // Bulk Presets
  const handleApplyPreset = (preset: 'SHOW_ALL' | 'HIDE_ALL' | 'RESET_DEFAULTS') => {
    if (!selectedUser) return;
    const normalizedRole = (selectedUser.role || '').toUpperCase();
    if (normalizedRole === 'ADMIN' || normalizedRole.includes('ADMIN') || (currentUser?.id && selectedUser.id === currentUser.id)) {
      showToast('⚠️ Admin has permanent root authority — cannot be modified.');
      return;
    }

    const nextPolicies = { ...policies };
    const emailLower = selectedUser.email ? selectedUser.email.toLowerCase().trim() : null;

    ALL_WEB_MODULES.forEach(mod => {
      const key = `${selectedUser.id}:${mod.key}`;
      const emailKey = emailLower ? `${emailLower}:${mod.key}` : null;
      const isDefault = isDefaultModule(selectedUser.role, mod.key);
      if (isDefault) return; // Never touch default modules
      if (preset === 'SHOW_ALL') {
        const perm = { active: true, canView: true, canShare: true, canEdit: mod.hasEditControl ? true : canEditModule(selectedUser.id, selectedUser.role, mod.key, selectedUser.email) };
        nextPolicies[key] = perm;
        if (emailKey) nextPolicies[emailKey] = perm;
      } else if (preset === 'HIDE_ALL') {
        const perm = { active: false, canView: false, canShare: false, canEdit: false };
        nextPolicies[key] = perm;
        if (emailKey) nextPolicies[emailKey] = perm;
      } else if (preset === 'RESET_DEFAULTS') {
        delete nextPolicies[key];
        if (emailKey) delete nextPolicies[emailKey];
      }
    });

    setPolicies(nextPolicies);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPolicies));
    window.dispatchEvent(new CustomEvent('das-crm-module-policy-updated'));

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`, ts: new Date().toLocaleString(),
      adminName: currentUser?.name || 'Admin', targetName: selectedUser.name, targetRole: selectedUser.role,
      moduleLabel: 'All Non-Default Modules', action: `Bulk preset: ${preset.replace('_', ' ')}`,
    };
    const nextAudit = [auditEntry, ...auditLogs.slice(0, 49)];
    setAuditLogs(nextAudit);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(nextAudit));
    showToast(`✓ Applied "${preset.replace('_', ' ')}" to ${selectedUser.name}`);

    syncPolicyToBackend(selectedUser.id, selectedUser.email, 'ALL', { active: true, canView: true, canShare: true, canEdit: false }, auditEntry, nextPolicies);
  };

  // Admin Toggle for Manager Lead Deletion Authority (Manager Roles Only)
  const handleToggleManagerDelete = async () => {
    const nextVal = !allowManagerLeadDelete;
    setTogglingManagerDelete(true);
    try {
      const res = await apiFetch('/leads/settings/manager-delete-permission', {
        method: 'PATCH',
        body: JSON.stringify({ allowManagerLeadDelete: nextVal }),
      });
      if (res.ok) {
        setAllowManagerLeadDelete(nextVal);
        try {
          localStorage.setItem('das_crm_allow_manager_delete', String(nextVal));
        } catch (_) {}
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('das_crm_permissions_updated', {
              detail: { allowManagerLeadDelete: nextVal },
            })
          );
        }

        const newAudit: AuditLogEntry = {
          id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          ts: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          adminName: currentUser?.name || currentUser?.email || 'Admin',
          targetName: 'Manager Role (All Managers)',
          targetRole: 'MANAGER',
          moduleLabel: 'Lead Permanent Deletion Authority',
          action: nextVal ? 'GRANTED: Manager Lead Deletion Enabled (Company Key Required)' : 'REVOKED: Manager Lead Deletion Disabled',
        };
        setAuditLogs(prev => {
          const updated = [newAudit, ...prev].slice(0, 100);
          try { localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated)); } catch (_) {}
          return updated;
        });

        showToast(
          nextVal
            ? '✓ Manager Delete Permission ENABLED: Managers can now delete leads with Company Key confirmation.'
            : '✓ Manager Delete Permission DISABLED: Managers can no longer delete leads.'
        );
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`⚠️ Failed to update permission: ${err.message || 'Error'}`);
      }
    } catch (err: any) {
      showToast(`⚠️ Error: ${err.message || 'Network error'}`);
    } finally {
      setTogglingManagerDelete(false);
    }
  };

  const filteredModules = useMemo(() => {
    return ALL_WEB_MODULES.filter(m => categoryFilter === 'ALL' || m.category === categoryFilter);
  }, [categoryFilter]);

  // Split into default and configurable
  const { defaultModules, configurableModules } = useMemo(() => {
    if (!selectedUser) return { defaultModules: [], configurableModules: filteredModules };
    const defaults = filteredModules.filter(m => isDefaultModule(selectedUser.role, m.key));
    const configurable = filteredModules.filter(m => !isDefaultModule(selectedUser.role, m.key));
    return { defaultModules: defaults, configurableModules: configurable };
  }, [filteredModules, selectedUser]);

  const activeOverridesCount = useMemo(() => {
    return Object.keys(policies).filter(k => !(currentUser?.id && k.startsWith(`${currentUser.id}:`))).length;
  }, [policies, currentUser?.id]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`space-y-6 ${isModal ? 'p-2' : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[200] px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 size={16} className="text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Header Banner ─────────────────────────────────────────────── */}
      <div className="crm-card p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl relative overflow-hidden shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-black shadow-lg">
              <Shield size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-white tracking-tight">🛡️ Admin Control Center</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Module Visibility Command
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Control which modules are <strong className="text-white">visible (On)</strong> or <strong className="text-slate-300">hidden (Off)</strong> in each employee's sidebar. Default modules cannot be hidden.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button onClick={() => loadWorkspaceUsers()} disabled={loadingUsers} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50">
              <RefreshCw size={14} className={`text-indigo-400 ${loadingUsers ? 'animate-spin' : ''}`} />
              <span>Sync Directory</span>
            </button>
            <button onClick={() => setShowAuditModal(true)} className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
              <History size={14} className="text-cyan-400" />
              <span>Audit Trail ({auditLogs.length})</span>
            </button>
            {isModal && onClose && (
              <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"><X size={18} /></button>
            )}
          </div>
        </div>

        {/* Admin Protection Notice */}
        <div className="flex items-center gap-3 p-3 bg-indigo-950/60 border border-indigo-500/30 rounded-xl text-xs text-indigo-200">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm flex-shrink-0">👑</div>
          <div className="flex-1 min-w-0">
            <span className="font-extrabold text-white">Organization Head Protected: </span>
            <span className="text-slate-300">
              Admin account (<strong>{currentUser?.name || currentUser?.email || 'Admin'}</strong>) has permanent root access to all modules. Only subordinate workspace employees are configured below.
            </span>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-800/80">
          {[
            { label: 'Managed Employees', value: `${managedUsers.length} Staff`, color: 'text-white' },
            { label: 'Configurable Modules', value: `${ALL_WEB_MODULES.length} Modules`, color: 'text-indigo-400' },
            { label: 'Active Overrides', value: `${activeOverridesCount} Rules`, color: 'text-emerald-400' },
            { label: 'Admin Authority', value: '🛡️ Full Root Access', color: 'text-amber-400 text-xs' },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{item.label}</span>
              <span className={`text-lg font-black mt-0.5 block ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main 2-Column Layout ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left: User Selector ────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-3">
          <div className="crm-card p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                <Users size={14} className="text-indigo-400" /> Workspace Team Members
              </h3>
              <span className="text-[10px] font-bold text-slate-400">{filteredUsers.length} of {managedUsers.length}</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, role..."
                style={{ backgroundColor: '#090d16', color: '#ffffff', colorScheme: 'dark' }}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs font-bold text-white outline-none"
              />
            </div>

            {/* Role Filter */}
            <div className="flex gap-1.5 flex-wrap">
              {['ALL', 'SALES_EXEC', 'TEAM_LEADER', 'MANAGER', 'HR', 'UNASSIGNED'].map(r => (
                <button key={r} type="button" onClick={() => setRoleFilter(r)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${roleFilter === r ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}>
                  {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* User List */}
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
              {loadingUsers ? (
                <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading workspace members...</div>
              ) : filteredUsers.map(user => {
                const isSelected = selectedUser?.id === user.id;
                const roleColors: Record<string, string> = {
                  TEAM_LEADER: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                  SALES_EXEC:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                  MANAGER:     'bg-purple-500/20 text-purple-300 border-purple-500/30',
                  HR:          'bg-sky-500/20 text-sky-300 border-sky-500/30',
                  UNASSIGNED:  'bg-slate-700/40 text-slate-300 border-slate-600',
                };
                const badgeColor = roleColors[user.role] || 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';

                // Count hidden modules for this user
                const hiddenCount = ALL_WEB_MODULES.filter(m => !isModuleOn(user.id, user.role, m.key)).length;

                return (
                  <div key={user.id} onClick={() => setSelectedUserId(user.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-indigo-600/20 border-indigo-500 shadow-md' : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'}`}>
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                          {user.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-black truncate ${isSelected ? 'text-indigo-200' : 'text-white'}`}>{user.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase ${badgeColor}`}>{user.role.replace('_', ' ')}</span>
                        {hiddenCount > 0 && <span className="text-[9px] text-rose-400 font-bold">{hiddenCount} hidden</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && !loadingUsers && managedUsers.length > 0 && (
                <div className="p-6 text-center text-slate-500 text-xs font-bold">No members match the current filter.</div>
              )}
              {managedUsers.length === 0 && !loadingUsers && (
                <div className="p-6 text-center bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-3">
                  <Users size={20} className="mx-auto text-slate-500" />
                  <div>
                    <h4 className="text-xs font-bold text-white">No Subordinate Staff Yet</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Share your Company Key so team members can register.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Module Visibility Matrix ──────────────────────── */}
        <div className="lg:col-span-8 space-y-4">
          {selectedUser ? (
            <div className="crm-card p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">

              {/* Selected User Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                    {selectedUser.avatarInitials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-white">{selectedUser.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        {selectedUser.role.replace('_', ' ')}
                      </span>
                      {selectedUser.isVerified ? (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Verified Staff
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle size={10} /> Unassigned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedUser.email} • {selectedUser.department}</p>
                  </div>
                </div>

                {/* Bulk Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button type="button" onClick={() => handleApplyPreset('SHOW_ALL')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-black transition-all cursor-pointer flex items-center gap-1"
                    title="Make all non-default modules visible">
                    <Eye size={10} /> Show All
                  </button>
                  <button type="button" onClick={() => handleApplyPreset('HIDE_ALL')}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-black transition-all cursor-pointer flex items-center gap-1"
                    title="Hide all non-default modules">
                    <EyeOff size={10} /> Hide All
                  </button>
                  <button type="button" onClick={() => handleApplyPreset('RESET_DEFAULTS')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-[10px] font-black transition-all cursor-pointer flex items-center gap-1"
                    title="Reset to role default visibility">
                    <RotateCcw size={10} /> Reset Defaults
                  </button>
                </div>
              </div>

              {/* 🛡️ Manager Lead Permanent Deletion Authority (Manager Roles Only) */}
              {(selectedUser.role === 'MANAGER' || roleFilter === 'MANAGER') && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-amber-950/30 border border-purple-500/40 space-y-3 shadow-xl animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                        <Trash2 size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black text-white">Manager Lead Permanent Deletion Control</h4>
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            MANAGER ROLES ONLY
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                            allowManagerLeadDelete
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}>
                            {allowManagerLeadDelete ? 'ENABLED (ON)' : 'DISABLED (OFF)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          Authorize Manager accounts to select and permanently delete leads and their records. Every deletion strictly requires <strong>Company Key confirmation</strong> on every request.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleManagerDelete}
                      disabled={togglingManagerDelete}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border transition-all cursor-pointer shadow-md self-start sm:self-center flex-shrink-0 ${
                        allowManagerLeadDelete
                          ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400 shadow-purple-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Admin Control: Toggle whether Managers have permission to permanently delete leads (Requires Company Key)"
                    >
                      {togglingManagerDelete ? (
                        <RefreshCw size={14} className="animate-spin text-white" />
                      ) : allowManagerLeadDelete ? (
                        <ToggleRight size={16} className="text-emerald-300" />
                      ) : (
                        <ToggleLeft size={16} className="text-slate-500" />
                      )}
                      <span>Manager Delete: {allowManagerLeadDelete ? 'ON (Allowed)' : 'OFF (Blocked)'}</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] text-slate-400 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                    <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                      <Lock size={11} /> High Security Action: Requires Company Key ({companyKey || 'Configured'}) confirmation
                    </span>
                    <span className="text-slate-500">Applies exclusively to workspace Manager accounts</span>
                  </div>
                </div>
              )}

              {/* Unassigned Quick Verification */}
              {(selectedUser.role === 'UNASSIGNED' || !selectedUser.isVerified) && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0"><AlertTriangle size={16} /></div>
                    <div>
                      <h4 className="text-xs font-black text-amber-300">⚡ Unassigned Staff Member</h4>
                      <p className="text-[11px] text-slate-400">Select role below to approve and grant workspace access</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[['SALES_EXEC', 'bg-emerald-600 hover:bg-emerald-500', 'Verify Sales Exec'], ['TEAM_LEADER', 'bg-amber-600 hover:bg-amber-500', 'Verify TL'], ['MANAGER', 'bg-purple-600 hover:bg-purple-500', 'Verify Manager'], ['HR', 'bg-sky-600 hover:bg-sky-500', 'Verify HR']].map(([role, cls, label]) => (
                      <button key={role} type="button" onClick={() => handleVerifyOrChangeRole(selectedUser, role)}
                        className={`px-3 py-1.5 rounded-lg ${cls} text-white text-[11px] font-black cursor-pointer shadow-sm transition-all`}>
                        ✓ {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Filter */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module Category:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {['ALL', 'SALES', 'COMMUNICATION', 'AI', 'OPERATIONS', 'ADMIN'].map(cat => (
                    <button key={cat} type="button" onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${categoryFilter === cat ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}>
                      {cat === 'ALL' ? 'All Modules' : CATEGORY_STYLES[cat]?.label || cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Module Sections ─────────────────────────────────────── */}
              <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1">

                {/* Default Modules (Protected / Cannot be hidden) */}
                {defaultModules.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Lock size={12} className="text-amber-400 flex-shrink-0" />
                      <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">Default Modules — Protected (Always Visible)</span>
                      <div className="flex-1 h-px bg-amber-500/20" />
                      <span className="text-[9px] text-slate-500 font-bold">Cannot be hidden</span>
                    </div>
                    {defaultModules.map(mod => {
                      const Icon = mod.icon;
                      const catStyle = CATEGORY_STYLES[mod.category] || CATEGORY_STYLES.SALES;
                      return (
                        <div key={mod.key} className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-3 opacity-75">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="p-2 rounded-xl bg-slate-900 border border-amber-500/25 text-amber-400 flex-shrink-0 mt-0.5"><Icon size={16} /></div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-black text-white">{mod.label}</h4>
                                <span className={`px-2 py-0.5 text-[9px] font-black rounded border ${catStyle.badgeBg} ${catStyle.badgeText} ${catStyle.borderColor}`}>{catStyle.label}</span>
                                <span className="px-2 py-0.5 text-[9px] font-black rounded border bg-amber-500/15 text-amber-400 border-amber-500/30 flex items-center gap-1">
                                  <Lock size={8} /> DEFAULT
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">{mod.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-start md:self-center">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              Always On
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Configurable Modules (Admin can toggle On/Off) */}
                {configurableModules.length > 0 && (
                  <div className="space-y-2">
                    {defaultModules.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Layers size={12} className="text-indigo-400 flex-shrink-0" />
                        <span className="text-[11px] font-black text-indigo-400 uppercase tracking-wider">Configurable Modules — Admin Controlled</span>
                        <div className="flex-1 h-px bg-indigo-500/20" />
                      </div>
                    )}
                    {configurableModules.map(mod => {
                      const Icon = mod.icon;
                      const catStyle = CATEGORY_STYLES[mod.category] || CATEGORY_STYLES.SALES;
                      const isOn = isModuleOn(selectedUser.id, selectedUser.role, mod.key, selectedUser.email);
                      const editAllowed = mod.hasEditControl ? canEditModule(selectedUser.id, selectedUser.role, mod.key, selectedUser.email) : null;

                      return (
                        <div key={mod.key} className={`p-3.5 rounded-xl border transition-all ${isOn ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700' : 'bg-slate-950/40 border-slate-900 opacity-60'}`}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            {/* Module Info */}
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`p-2 rounded-xl border flex-shrink-0 mt-0.5 ${isOn ? 'bg-slate-900 border-slate-800 text-indigo-400' : 'bg-slate-950 border-slate-900 text-slate-600'}`}>
                                <Icon size={16} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className={`text-xs font-black ${isOn ? 'text-white' : 'text-slate-500'}`}>{mod.label}</h4>
                                  <span className={`px-2 py-0.5 text-[9px] font-black rounded border ${catStyle.badgeBg} ${catStyle.badgeText} ${catStyle.borderColor}`}>{catStyle.label}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">{mod.description}</p>
                              </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                              {/* On/Off Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleVisibility(selectedUser.id, mod.key, mod.label, isOn)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                                  isOn
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 shadow-sm'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                                }`}
                                title={isOn ? 'Click to hide this module from user\'s sidebar' : 'Click to show this module in user\'s sidebar'}
                              >
                                {isOn ? (
                                  <><ToggleRight size={14} className="text-emerald-400" /> On</>
                                ) : (
                                  <><ToggleLeft size={14} className="text-slate-500" /> Off</>
                                )}
                              </button>

                              {/* Edit toggle — only for QUOTES and PRODUCTS */}
                              {mod.hasEditControl && isOn && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleEdit(selectedUser.id, mod.key, mod.label, editAllowed ?? false)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                                    editAllowed
                                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25'
                                      : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'
                                  }`}
                                  title={editAllowed ? 'Remove edit/create/delete permission' : 'Grant edit/create/delete permission'}
                                >
                                  <Edit3 size={12} className={editAllowed ? 'text-purple-400' : 'text-slate-500'} />
                                  Edit {editAllowed ? 'On' : 'Off'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* No user selected / No staff */
            <div className="crm-card p-10 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 shadow-xl text-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center shadow-inner">
                <Shield size={32} />
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-base font-black text-white">No Subordinate Employees in Workspace</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  As Organization Head, you retain 100% full root access across all modules. To manage permissions for staff, share your workspace registration key so employees can register.
                </p>
              </div>
              <div className="p-4 bg-slate-950 border border-indigo-500/30 rounded-2xl max-w-md mx-auto text-left space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Workspace Company Key</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active Workspace</span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-800 font-mono text-sm font-black text-indigo-300">
                  <span>{companyKey}</span>
                  <button onClick={handleCopyKey} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all">
                    <Copy size={12} /> {copiedKey ? 'Copied!' : 'Copy Key'}
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <Link href="/hr/employees" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <span>Manage Staff Directory</span><ArrowRight size={12} />
                  </Link>
                  <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join our workspace on DAS CRM!\n\nCompany Key: *${companyKey}*`)}`}
                    target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                    <Send size={12} /><span>Invite via WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Global Manager Role Lead Deletion Switch (Fallback when no staff selected) */}
              <div className="p-4 bg-slate-950/80 border border-purple-500/30 rounded-2xl max-w-md mx-auto text-left space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 size={15} className="text-purple-400" />
                    <span className="text-xs font-black text-white">Manager Lead Deletion Authority</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">Manager Only</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Enable or disable lead deletion permission for all Managers in this workspace (Requires Company Key).
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className={`text-xs font-bold ${allowManagerLeadDelete ? 'text-emerald-400' : 'text-slate-500'}`}>
                    Status: {allowManagerLeadDelete ? 'ENABLED (ON)' : 'DISABLED (OFF)'}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleManagerDelete}
                    disabled={togglingManagerDelete}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      allowManagerLeadDelete
                        ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {togglingManagerDelete ? <RefreshCw size={12} className="animate-spin" /> : allowManagerLeadDelete ? <ToggleRight size={14} className="text-emerald-300" /> : <ToggleLeft size={14} className="text-slate-400" />}
                    <span>{allowManagerLeadDelete ? 'Turn OFF' : 'Turn ON'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Audit Trail Modal ─────────────────────────────────────────── */}
      {showAuditModal && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="crm-card max-w-2xl w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"><History size={18} /></div>
                <div>
                  <h3 className="text-sm font-black text-white">📜 Admin Control Center Audit Trail</h3>
                  <p className="text-xs text-slate-400">Chronological history of all module visibility overrides.</p>
                </div>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-slate-300">By: {log.adminName}</span>
                    <span className="font-mono text-slate-500">{log.ts}</span>
                  </div>
                  <div className="text-white font-bold">
                    Target: <span className="text-indigo-300">{log.targetName}</span> ({log.targetRole}) • Module: <span className="text-cyan-300">{log.moduleLabel}</span>
                  </div>
                  <p className="text-emerald-400 font-mono text-[11px]">{log.action}</p>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs font-bold">No visibility overrides recorded yet.</div>
              )}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button onClick={() => setShowAuditModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer">Close Audit Trail</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
