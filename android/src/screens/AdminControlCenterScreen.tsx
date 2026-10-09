/**
 * AdminControlCenterScreen.tsx — DAS CRM Android
 * Full 1:1 Parity with Web AdminControlCenterView.tsx
 *
 * Capabilities:
 * 1. Live Metrics Bar (Staff count, 20 Modules, Active Overrides, Admin Full Authority).
 * 2. Directory with Search & Role Filter Tabs (All Roles, Sales Exec, Team Leader, Manager, HR, Unassigned).
 * 3. Complete workspace employee loading (Real /users API + Cached & Local Staff + Auto-sync).
 * 4. Per-User Module Access Matrix:
 *    - Bulk Presets: Show All, Hide All, Reset Defaults.
 *    - Manager Lead Deletion Control: Admin toggle with Company Key security notice.
 *    - Quick Verification 1-tap buttons for Unassigned members.
 *    - Category Filter Tabs: ALL, SALES, COMMUNICATION, AI, OPERATIONS, ADMIN.
 *    - Protected Default Modules (Always On baseline).
 *    - Configurable Admin-Controlled Modules (Visibility ON/OFF + Edit Rights for Products & Quotes).
 * 5. Full Audit Trail Modal with Clear History & timestamped logs.
 * 6. Real-time Backend Sync (/users/module-policies & /leads/settings/manager-delete-permission).
 * 7. In-app floating Toast notifications.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useModuleAccessStore, ManagedUser, ModulePermission, UserRole, DEFAULT_MODULE_KEYS_BY_ROLE } from '../store/moduleAccessStore';
import { getApiBase } from '../config/api';
import { useAuthStore } from '../store/authStore';
import type { ModuleKey } from '../types/moduleTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Module Registry (Matching Web ALL_WEB_MODULES) ──────────────────────────

export interface ModuleDef {
  key: ModuleKey;
  icon: string;
  label: string;
  description: string;
  category: 'SALES' | 'COMMUNICATION' | 'AI' | 'OPERATIONS' | 'ADMIN';
  hasEditControl?: boolean; // Quotations & Products have an additional Edit toggle
}

export const ALL_MODULES: ModuleDef[] = [
  // Sales & Revenue
  { key: 'LEADS',            icon: '👥', label: 'Leads Directory',               description: 'Lead generation, records, and contact directory',                          category: 'SALES' },
  { key: 'PIPELINE',         icon: '⚡', label: 'Lead Pipeline & Stages',        description: 'Kanban boards, ingestion rules, and stage movement',                      category: 'SALES' },
  { key: 'TASKS',            icon: '⏰', label: 'Follow-ups & Meetings Tracker', description: 'Task calendar, sales rep follow-ups, and meeting schedules',              category: 'SALES' },
  { key: 'PRODUCTS',         icon: '📦', label: 'Product Catalogue',             description: 'Inventory, SKU management, pricing, and variants',                        category: 'SALES',        hasEditControl: true },
  { key: 'PDF_CATALOG',      icon: '📄', label: 'PDF Catalogue Generator',       description: 'Interactive product brochures and marketing collateral',                  category: 'SALES' },
  { key: 'QUOTES',           icon: '🧾', label: 'Quotations & Invoices',         description: 'GST invoices, billing estimation, and proposals',                         category: 'SALES',        hasEditControl: true },
  { key: 'DEALS',            icon: '💼', label: 'Deals Management',              description: 'Closed deals tracking, contracts, and revenue share',                     category: 'SALES' },
  { key: 'GOALS',            icon: '📈', label: 'Goals & Targets',               description: 'Sales targets, employee quotas, and performance',                         category: 'SALES' },
  // Communication & Marketing
  { key: 'COMMUNICATIONS',  icon: '💬', label: 'WhatsApp Cloud API',            description: 'Cloud API broadcasts, customer chat inbox',                                category: 'COMMUNICATION' },
  { key: 'WA_TEMPLATES',    icon: '📝', label: 'WhatsApp Direct Templates',     description: 'Meta approved rich message templates and quick replies',                    category: 'COMMUNICATION' },
  { key: 'EXTRA_EMAIL',     icon: '✉️', label: 'Email Marketing',               description: 'Campaign builder, newsletters, and email tracking',                         category: 'COMMUNICATION' },
  { key: 'UPCOMING_COMMS',  icon: '📻', label: 'The Notice Board',              description: 'Company broadcast alerts, announcements, and bulletins',                    category: 'COMMUNICATION' },
  // AI & Intelligence
  { key: 'AI_CONTROL',      icon: '✨', label: 'AI Customization',              description: 'Lead scoring parameters, bot responses, prompts',                        category: 'AI' },
  { key: 'AUTOMATIONS',     icon: '⚡', label: 'Workflow Automations',           description: 'Trigger-action bot rules and auto-assignment',                           category: 'OPERATIONS' },
  // Operations & HR
  { key: 'EMPLOYEES',       icon: '🧑‍💼', label: 'Employees & Hierarchy',         description: 'Staff directory, team leaders, and hierarchy builder',                    category: 'OPERATIONS' },
  { key: 'ATTENDANCE',      icon: '📅', label: 'Attendance & Clock-In',         description: 'Daily employee check-in, leave requests, timesheets',                    category: 'OPERATIONS' },
  { key: 'INTERVIEWS',      icon: '👤', label: 'Interview & Hiring',             description: 'Candidate screening, interview scheduling, hiring pipeline',             category: 'OPERATIONS' },
  { key: 'REPORTS',         icon: '📊', label: 'Reports & Analytics',            description: 'Executive revenue charts, conversion analytics, telemetry',             category: 'OPERATIONS' },
  { key: 'DATABASE',        icon: '🗄️', label: 'Database & Storage',             description: 'Cloud data backups, raw database export, logs',                         category: 'OPERATIONS' },
  // Administration
  { key: 'PROFILE',         icon: '🏢', label: 'Company Profile Settings',      description: 'Branding, company legal info, GSTIN, workspace configuration',           category: 'ADMIN' },
  { key: 'SETTINGS',        icon: '⚙️', label: 'System Settings',               description: 'Global app security, themes, and notification preferences',              category: 'ADMIN' },
  { key: 'SUPPORT',         icon: '❓', label: 'Support & Help Desk',           description: 'Technical documentation, developer tickets, user guides',                category: 'ADMIN' },
];

export const CATEGORY_STYLES: Record<string, { label: string; badgeBg: string; badgeText: string; borderColor: string }> = {
  SALES:         { label: 'Sales & Revenue',          badgeBg: 'rgba(16, 185, 129, 0.15)', badgeText: '#34d399', borderColor: 'rgba(16, 185, 129, 0.35)' },
  COMMUNICATION: { label: 'Communication & Outreach', badgeBg: 'rgba(14, 165, 233, 0.15)', badgeText: '#38bdf8', borderColor: 'rgba(14, 165, 233, 0.35)' },
  AI:            { label: 'AI Intelligence',          badgeBg: 'rgba(168, 85, 247, 0.15)', badgeText: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.35)' },
  OPERATIONS:    { label: 'Operations & HR',          badgeBg: 'rgba(245, 158, 11, 0.15)', badgeText: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.35)' },
  ADMIN:         { label: 'Administration & System',  badgeBg: 'rgba(244, 63, 94, 0.15)',  badgeText: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.35)' },
};

export const ROLE_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', bg: 'rgba(244,63,94,0.18)', text: '#f43f5e', border: 'rgba(244,63,94,0.35)' },
  ADMIN:       { label: 'Admin',       bg: 'rgba(99,102,241,0.18)', text: '#818cf8', border: 'rgba(99,102,241,0.35)' },
  MANAGER:     { label: 'Manager',     bg: 'rgba(168,85,247,0.18)', text: '#c084fc', border: 'rgba(168,85,247,0.35)' },
  TEAM_LEADER: { label: 'Team Leader', bg: 'rgba(245,158,11,0.18)', text: '#fbbf24', border: 'rgba(245,158,11,0.35)' },
  SALES_EXEC:  { label: 'Sales Exec',  bg: 'rgba(16,185,129,0.18)', text: '#34d399', border: 'rgba(16,185,129,0.35)' },
  HR:          { label: 'HR',          bg: 'rgba(14,165,233,0.18)', text: '#38bdf8', border: 'rgba(14,165,233,0.35)' },
  UNASSIGNED:  { label: 'Unassigned',  bg: 'rgba(100,116,139,0.18)',text: '#94a3b8', border: 'rgba(100,116,139,0.35)' },
};

// ─── Storage Keys & Types ─────────────────────────────────────────────────────

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

export interface Props {
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminControlCenterScreen({ onClose }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const store = useModuleAccessStore();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [companyKey, setCompanyKey] = useState<string>('ADOR-EC-7187');
  const [allowManagerLeadDelete, setAllowManagerLeadDelete] = useState<boolean>(false);
  const [togglingManagerDelete, setTogglingManagerDelete] = useState<boolean>(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const userRole = (currentUser?.role || '').toUpperCase().trim();
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'OWNER' || userRole.includes('ADMIN');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // ─── Fetch Manager Lead Delete Permission & Company Key ─────────────────────

  useEffect(() => {
    const apiBase = getApiBase();
    const token = useAuthStore.getState().token;
    const compId = currentUser?.companyId || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-organization-id': compId,
    };

    fetch(`${apiBase}/leads/settings/delete-permissions`, { headers })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setAllowManagerLeadDelete(Boolean(data.allowManagerLeadDelete));
        }
      })
      .catch(() => null);

    fetch(`${apiBase}/users/company-key?organizationId=${compId}`, { headers })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data?.companyKey) setCompanyKey(data.companyKey);
        }
      })
      .catch(() => null);
  }, [currentUser?.companyId]);

  // ─── Load Policies & Audit Logs ─────────────────────────────────────────────

  useEffect(() => {
    const loadPoliciesAndAudit = async () => {
      try {
        const rawAud = await AsyncStorage.getItem(AUDIT_STORAGE_KEY);
        if (rawAud) setAuditLogs(JSON.parse(rawAud));
      } catch (_) {}

      const apiBase = getApiBase();
      const token = useAuthStore.getState().token;
      const compId = currentUser?.companyId || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-organization-id': compId,
      };

      try {
        const fetchUrl = compId
          ? `${apiBase}/users/module-policies?organizationId=${compId}`
          : `${apiBase}/users/module-policies`;

        const res = await fetch(fetchUrl, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data?.policies && Object.keys(data.policies).length > 0) {
            const currentPolicies = store.policies;
            const merged = { ...data.policies, ...currentPolicies };
            await store.setPolicies(merged);
          }
          if (data?.auditLogs && Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
            setAuditLogs((prev) => {
              const map = new Map<string, AuditLogEntry>();
              data.auditLogs.forEach((a: AuditLogEntry) => map.set(a.id, a));
              prev.forEach((a: AuditLogEntry) => { if (!map.has(a.id)) map.set(a.id, a); });
              const mergedAudit = Array.from(map.values()).slice(0, 100);
              AsyncStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(mergedAudit)).catch(() => null);
              return mergedAudit;
            });
          }
        }
      } catch (_) {}
    };

    loadPoliciesAndAudit();
  }, [currentUser?.companyId, store]);

  // ─── Load Workspace Users (Matching Web Full Directory Logic) ────────────────

  const loadWorkspaceUsers = useCallback(async (signal?: AbortSignal) => {
    setLoadingUsers(true);
    const apiBase = getApiBase();
    const token = useAuthStore.getState().token;
    const compId = currentUser?.companyId || '';
    const userId = currentUser?.id || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-organization-id': compId,
    };

    let realUsers: ManagedUser[] = [];
    let roleOverrides: Record<string, string> = {};
    let removedIds: string[] = [];

    try {
      const rawOverrides = await AsyncStorage.getItem('@das_crm_verified_overrides');
      if (rawOverrides) roleOverrides = JSON.parse(rawOverrides);
      const rawRemoved = await AsyncStorage.getItem('@das_crm_removed_user_ids');
      if (rawRemoved) removedIds = JSON.parse(rawRemoved);
    } catch (_) {}

    if (roleOverrides['rai992522@gmail.com'] === 'SALES_EXEC') {
      roleOverrides['rai992522@gmail.com'] = 'MANAGER';
    }

    try {
      const res = await fetch(`${apiBase}/users?organizationId=${compId}`, { headers, signal });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || data.users || [];
        if (Array.isArray(items) && items.length > 0) {
          realUsers = items
            .filter((u: any) => {
              const uId = String(u.id);
              if (removedIds.includes(uId)) return false;
              const rawRole = ((u.role?.name || u.role || '') as string).toUpperCase().trim();
              const isAdm = rawRole.includes('ADMIN') || rawRole.includes('OWNER') || rawRole === 'SUPER_ADMIN';
              const isSelf = uId === userId || (currentUser?.email && u.email?.toLowerCase() === currentUser.email?.toLowerCase());
              return !isAdm && !isSelf;
            })
            .map((u: any) => {
              const uId = String(u.id);
              const userEmail = (u.email || '').toLowerCase().trim();
              const overrideRole = roleOverrides[uId] || roleOverrides[userEmail] || (userEmail === 'rai992522@gmail.com' ? 'MANAGER' : undefined);
              const rawRole = (u.role?.name || u.role || '').toUpperCase();
              let finalRole: UserRole = 'SALES_EXEC';
              if (overrideRole) finalRole = overrideRole as UserRole;
              else if (rawRole.includes('MANAGER')) finalRole = 'MANAGER';
              else if (rawRole.includes('LEADER') || rawRole.includes('TL')) finalRole = 'TEAM_LEADER';
              else if (rawRole.includes('HR')) finalRole = 'HR';
              else if (!rawRole || rawRole === 'UNASSIGNED') finalRole = 'UNASSIGNED';

              const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.email || 'Team Member';
              const initials = fullName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'TM';
              return {
                id: uId,
                name: fullName,
                email: u.email || '',
                role: finalRole,
                avatarInitials: initials,
              };
            });
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }

    // Baseline fallback staff if backend returned no subordinates
    const baselineStaff: ManagedUser[] = [
      { id: 'cmukk5cq2000nf01vkfpi00d5', name: 'Aditya Kumar Rai', email: 'rai992522@gmail.com', role: (roleOverrides['rai992522@gmail.com'] as UserRole) || 'MANAGER', avatarInitials: 'AR' },
      { id: 'cmukv4tgl000n7d2d65001ydp', name: 'Sachin Puri', email: 'sachinpuri938@gmail.com', role: (roleOverrides['sachinpuri938@gmail.com'] as UserRole) || 'TEAM_LEADER', avatarInitials: 'SP' },
      { id: 'cmuhp0517000ngg2dq93a6nlp', name: 'Nandini Rastogi', email: 'rastoginandini92@gmail.com', role: (roleOverrides['rastoginandini92@gmail.com'] as UserRole) || 'SALES_EXEC', avatarInitials: 'NR' },
      { id: 'cmukwwdv9000ng42dghtw6t3z', name: 'Sulekha Tomar', email: 'sulekhatmr@gmail.com', role: (roleOverrides['sulekhatmr@gmail.com'] as UserRole) || 'SALES_EXEC', avatarInitials: 'ST' },
      { id: 'cmukykfoe000nht2d0ylnsd3t', name: 'Sadhana', email: 'sadhnadikshit98@gmail.com', role: (roleOverrides['sadhnadikshit98@gmail.com'] as UserRole) || 'SALES_EXEC', avatarInitials: 'SD' },
    ];

    baselineStaff.forEach((b) => {
      if (!removedIds.includes(b.id) && !removedIds.includes(b.email.toLowerCase()) && !realUsers.some((u) => u.id === b.id || u.email.toLowerCase() === b.email.toLowerCase())) {
        realUsers.push(b);
      }
    });

    if (!signal?.aborted) {
      await store.setManagedUsers(realUsers);
      setUsers(realUsers);
      setLoadingUsers(false);
    }
  }, [currentUser?.companyId, currentUser?.id, currentUser?.email, store]);

  useEffect(() => {
    const controller = new AbortController();
    loadWorkspaceUsers(controller.signal);
    return () => controller.abort();
  }, [loadWorkspaceUsers]);

  // ─── Sync Policy Changes to Backend ─────────────────────────────────────────

  const syncPolicyToBackend = async (
    targetUserId: string,
    targetUserEmail: string | undefined,
    moduleKey: string,
    permission: ModulePermission,
    auditEntry: AuditLogEntry,
    allPolicies: Record<string, ModulePermission>,
  ) => {
    const apiBase = getApiBase();
    const token = useAuthStore.getState().token;
    const compId = currentUser?.companyId || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-organization-id': compId,
    };

    try {
      const url = compId
        ? `${apiBase}/users/module-policies?organizationId=${compId}`
        : `${apiBase}/users/module-policies`;

      await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          organizationId: compId,
          userId: targetUserId,
          userEmail: targetUserEmail,
          moduleKey,
          permission,
          auditEntry,
          policies: allPolicies,
        }),
      });
    } catch (_) {}
  };

  // ─── Permission Check Helpers ───────────────────────────────────────────────

  const isDefaultModule = (role: string, modKey: string): boolean => {
    return (DEFAULT_MODULE_KEYS_BY_ROLE[role as UserRole] || []).includes(modKey as ModuleKey);
  };

  const isModuleVisible = (user: ManagedUser, modKey: ModuleKey): boolean => {
    const perm = store.getPermission(user.id, user.role, modKey, user.email);
    return perm.active;
  };

  const isModuleEditable = (user: ManagedUser, modKey: ModuleKey): boolean => {
    const perm = store.getPermission(user.id, user.role, modKey, user.email);
    return Boolean(perm.canEdit);
  };

  // ─── Toggle Module Visibility ───────────────────────────────────────────────

  const handleToggleVisibility = async (user: ManagedUser, mod: ModuleDef, currentOn: boolean) => {
    if (isDefaultModule(user.role, mod.key)) {
      showToast(`⚠️ "${mod.label}" is a protected baseline for ${user.role.replace('_', ' ')}.`);
      return;
    }

    const nextOn = !currentOn;
    setSavingKey(`${user.id}:${mod.key}:active`);

    const editRights = mod.hasEditControl ? isModuleEditable(user, mod.key) : false;
    const patchedPerm: ModulePermission = nextOn
      ? { active: true, canView: true, canShare: true, canEdit: editRights }
      : { active: false, canView: false, canShare: false, canEdit: false };

    await store.setPermission(user.id, mod.key, patchedPerm, user.email);

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ts: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      adminName: 'Admin',
      targetName: user.name,
      targetRole: user.role,
      moduleLabel: mod.label,
      action: `Visibility → ${nextOn ? 'ON (Visible)' : 'OFF (Hidden)'}`,
    };

    const nextAudit = [auditEntry, ...auditLogs.slice(0, 99)];
    setAuditLogs(nextAudit);
    await AsyncStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(nextAudit));

    showToast(`✓ ${mod.label} is now ${nextOn ? '🟢 Visible' : '🔴 Hidden'} for ${user.name}`);
    setSavingKey(null);

    syncPolicyToBackend(user.id, user.email, mod.key, patchedPerm, auditEntry, store.policies);
  };

  // ─── Toggle Edit Rights (Products & Quotes) ──────────────────────────────────

  const handleToggleEdit = async (user: ManagedUser, mod: ModuleDef, currentEdit: boolean) => {
    const nextEdit = !currentEdit;
    setSavingKey(`${user.id}:${mod.key}:canEdit`);

    const currentOn = isModuleVisible(user, mod.key);
    const patchedPerm: ModulePermission = { active: currentOn, canView: currentOn, canShare: currentOn, canEdit: nextEdit };

    await store.setPermission(user.id, mod.key, patchedPerm, user.email);

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ts: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      adminName: 'Admin',
      targetName: user.name,
      targetRole: user.role,
      moduleLabel: mod.label,
      action: `Edit Rights → ${nextEdit ? 'ALLOWED (ON)' : 'REMOVED (OFF)'}`,
    };

    const nextAudit = [auditEntry, ...auditLogs.slice(0, 99)];
    setAuditLogs(nextAudit);
    await AsyncStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(nextAudit));

    showToast(`✓ Edit for ${mod.label} ${nextEdit ? 'enabled' : 'disabled'} for ${user.name}`);
    setSavingKey(null);

    syncPolicyToBackend(user.id, user.email, mod.key, patchedPerm, auditEntry, store.policies);
  };

  // ─── Bulk Presets (Show All, Hide All, Reset Defaults) ──────────────────────

  const handleApplyPreset = async (user: ManagedUser, preset: 'SHOW_ALL' | 'HIDE_ALL' | 'RESET_DEFAULTS') => {
    const emailLower = user.email ? user.email.toLowerCase().trim() : null;

    if (preset === 'RESET_DEFAULTS') {
      await store.resetUserPermissions(user.id, user.role, user.email);
    } else {
      for (const mod of ALL_MODULES) {
        if (isDefaultModule(user.role, mod.key)) continue;
        if (preset === 'SHOW_ALL') {
          const perm: ModulePermission = {
            active: true,
            canView: true,
            canShare: true,
            canEdit: mod.hasEditControl ? (user.role === 'MANAGER') : false,
          };
          await store.setPermission(user.id, mod.key, perm, user.email);
        } else if (preset === 'HIDE_ALL') {
          const perm: ModulePermission = { active: false, canView: false, canShare: false, canEdit: false };
          await store.setPermission(user.id, mod.key, perm, user.email);
        }
      }
    }

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ts: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      adminName: 'Admin',
      targetName: user.name,
      targetRole: user.role,
      moduleLabel: 'All Non-Default Modules',
      action: `Bulk preset: ${preset.replace('_', ' ')}`,
    };

    const nextAudit = [auditEntry, ...auditLogs.slice(0, 99)];
    setAuditLogs(nextAudit);
    await AsyncStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(nextAudit));

    showToast(`✓ Applied "${preset.replace('_', ' ')}" to ${user.name}`);
    syncPolicyToBackend(user.id, user.email, 'ALL', { active: true, canView: true, canShare: true, canEdit: false }, auditEntry, store.policies);
  };

  // ─── Toggle Manager Lead Deletion Authority ─────────────────────────────────

  const handleToggleManagerDelete = async () => {
    const nextVal = !allowManagerLeadDelete;
    setTogglingManagerDelete(true);
    const apiBase = getApiBase();
    const token = useAuthStore.getState().token;
    const compId = currentUser?.companyId || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-organization-id': compId,
    };

    try {
      const res = await fetch(`${apiBase}/leads/settings/manager-delete-permission`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ allowManagerLeadDelete: nextVal }),
      });

      if (res.ok) {
        setAllowManagerLeadDelete(nextVal);
        await AsyncStorage.setItem('@das_crm_allow_manager_delete', String(nextVal));

        const newAudit: AuditLogEntry = {
          id: `aud_${Date.now()}`,
          ts: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          adminName: 'Admin',
          targetName: 'Manager Role (All Managers)',
          targetRole: 'MANAGER',
          moduleLabel: 'Lead Permanent Deletion Authority',
          action: nextVal ? 'GRANTED: Manager Lead Deletion Enabled' : 'REVOKED: Manager Lead Deletion Disabled',
        };

        const nextAudit = [newAudit, ...auditLogs.slice(0, 99)];
        setAuditLogs(nextAudit);
        await AsyncStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(nextAudit));

        showToast(
          nextVal
            ? '✓ Manager Delete Permission ENABLED (Company Key Required)'
            : '✓ Manager Delete Permission DISABLED'
        );
      } else {
        showToast('⚠️ Failed to update Manager delete permission');
      }
    } catch (_) {
      showToast('⚠️ Network error updating permission');
    } finally {
      setTogglingManagerDelete(false);
    }
  };

  // ─── Quick Verification for Unassigned ──────────────────────────────────────

  const handleVerifyRole = async (targetUser: ManagedUser, newRole: UserRole) => {
    const apiBase = getApiBase();
    const token = useAuthStore.getState().token;
    const compId = currentUser?.companyId || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-organization-id': compId,
    };

    try {
      let roleOverrides: Record<string, string> = {};
      const rawOverrides = await AsyncStorage.getItem('@das_crm_verified_overrides');
      if (rawOverrides) roleOverrides = JSON.parse(rawOverrides);
      roleOverrides[targetUser.id] = newRole;
      if (targetUser.email) roleOverrides[targetUser.email.toLowerCase().trim()] = newRole;
      await AsyncStorage.setItem('@das_crm_verified_overrides', JSON.stringify(roleOverrides));

      fetch(`${apiBase}/users/${targetUser.id}/verify-role`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ assignedRole: newRole, organizationId: compId }),
      }).catch(() => null);

      showToast(`✓ Role updated to ${newRole.replace('_', ' ')} for ${targetUser.name}`);
      await loadWorkspaceUsers();
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser({ ...targetUser, role: newRole });
      }
    } catch (_) {
      showToast('⚠️ Failed to verify role');
    }
  };

  // ─── Computed Filters ───────────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const filteredModules = useMemo(() => {
    return ALL_MODULES.filter((m) => categoryFilter === 'ALL' || m.category === categoryFilter);
  }, [categoryFilter]);

  const activeOverridesCount = useMemo(() => {
    return Object.keys(store.policies).filter((k) => !k.startsWith('admin:')).length;
  }, [store.policies]);

  // If user is not admin, show restricted screen
  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: '#ef4444' }]}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>🛡️</Text>
          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 6 }}>Admin Access Restricted</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginBottom: 16 }}>
            The Admin Control Center is restricted exclusively to Organization Administrators.
          </Text>
          <TouchableOpacity style={{ backgroundColor: '#4f46e5', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 }} onPress={onClose}>
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>← Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUB-VIEW: SELECTED USER MODULE ACCESS EDITOR
  // ─────────────────────────────────────────────────────────────────────────────

  if (selectedUser) {
    const user = selectedUser;
    const roleBadge = ROLE_BADGES[user.role] || ROLE_BADGES.SALES_EXEC;
    const defaultMods = filteredModules.filter((m) => isDefaultModule(user.role, m.key));
    const configMods = filteredModules.filter((m) => !isDefaultModule(user.role, m.key));

    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Floating Toast */}
        {toastMessage && (
          <View style={[styles.toastBanner, { top: Math.max(insets.top + 6, 16) }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border, paddingTop: Math.max(insets.top + 4, 16) }]}>
          <TouchableOpacity onPress={() => setSelectedUser(null)} style={[styles.btnAction, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]} activeOpacity={0.75}>
            <Text style={[styles.btnActionText, { color: colors.primary }]}>← Directory</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, paddingHorizontal: 4 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{user.name}</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>{user.email}</Text>
          </View>
          <View style={[styles.roleBadgePill, { backgroundColor: roleBadge.bg, borderColor: roleBadge.border }]}>
            <Text style={[styles.roleBadgeText, { color: roleBadge.text }]}>{roleBadge.label}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 24) + 80 }} showsVerticalScrollIndicator={false}>

          {/* User Profile Banner & Bulk Actions */}
          <View style={[styles.userHeaderCard, { backgroundColor: isDark ? 'rgba(30,27,75,0.45)' : 'rgba(238,242,255,0.7)', borderColor: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.largeAvatar, { backgroundColor: roleBadge.bg, borderColor: roleBadge.border }]}>
                <Text style={[styles.largeAvatarText, { color: roleBadge.text }]}>{user.avatarInitials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={[styles.userNameLg, { color: colors.text }]}>{user.name}</Text>
                  {user.role !== 'UNASSIGNED' ? (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>✓ Verified Staff</Text>
                    </View>
                  ) : (
                    <View style={styles.unassignedBadge}>
                      <Text style={styles.unassignedBadgeText}>⚠️ Unassigned</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.userDeptText, { color: colors.textMuted }]}>{user.email}</Text>
              </View>
            </View>

            {/* Bulk Presets Bar */}
            <View style={styles.bulkPresetsRow}>
              <TouchableOpacity style={[styles.presetBtn, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.35)' }]} onPress={() => handleApplyPreset(user, 'SHOW_ALL')} activeOpacity={0.75}>
                <Text style={[styles.presetBtnText, { color: '#34d399' }]}>🟢 Show All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.presetBtn, { backgroundColor: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.35)' }]} onPress={() => handleApplyPreset(user, 'HIDE_ALL')} activeOpacity={0.75}>
                <Text style={[styles.presetBtnText, { color: '#f43f5e' }]}>🔴 Hide All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.presetBtn, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.35)' }]} onPress={() => handleApplyPreset(user, 'RESET_DEFAULTS')} activeOpacity={0.75}>
                <Text style={[styles.presetBtnText, { color: '#818cf8' }]}>🔄 Reset Defaults</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 🛡️ Manager Lead Permanent Deletion Authority (Manager Roles Only) */}
          {user.role === 'MANAGER' && (
            <View style={[styles.managerDeleteCard, { backgroundColor: isDark ? 'rgba(88,28,135,0.25)' : 'rgba(243,232,255,0.7)', borderColor: 'rgba(168,85,247,0.4)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={styles.managerDeleteIconBox}>
                  <Text style={{ fontSize: 20 }}>🗑️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[styles.mgrDeleteTitle, { color: colors.text }]}>Manager Lead Deletion Authority</Text>
                    <View style={[styles.statusBadge, { backgroundColor: allowManagerLeadDelete ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)', borderColor: allowManagerLeadDelete ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)' }]}>
                      <Text style={[styles.statusBadgeText, { color: allowManagerLeadDelete ? '#34d399' : '#f43f5e' }]}>
                        {allowManagerLeadDelete ? 'ENABLED (ON)' : 'DISABLED (OFF)'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.mgrDeleteDesc, { color: colors.textMuted }]}>
                    Authorize Manager accounts to select and permanently delete leads. Every deletion strictly requires Company Key confirmation.
                  </Text>
                </View>
              </View>

              <View style={styles.mgrDeleteActionRow}>
                <View style={styles.securityBox}>
                  <Text style={styles.securityBoxText}>🔒 Requires Key: {companyKey || 'Configured'}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.mgrDeleteToggleBtn, { backgroundColor: allowManagerLeadDelete ? '#7c3aed' : colors.cardBgElevated, borderColor: allowManagerLeadDelete ? '#a855f7' : colors.border }]}
                  onPress={handleToggleManagerDelete}
                  disabled={togglingManagerDelete}
                  activeOpacity={0.8}
                >
                  {togglingManagerDelete ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={{ color: allowManagerLeadDelete ? '#ffffff' : colors.text, fontSize: 11, fontWeight: '900' }}>
                      {allowManagerLeadDelete ? '✓ Manager Delete: ON' : '✕ Manager Delete: OFF'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Unassigned Quick Role Assignment */}
          {user.role === 'UNASSIGNED' && (
            <View style={[styles.unassignedPromptBox, { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }]}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#fbbf24', marginBottom: 4 }}>⚡ Unassigned Staff Member</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 10 }}>Select a role below to verify and grant CRM access:</Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { role: 'SALES_EXEC' as UserRole, label: 'Sales Exec', bg: '#059669' },
                  { role: 'TEAM_LEADER' as UserRole, label: 'Team Leader', bg: '#d97706' },
                  { role: 'MANAGER' as UserRole, label: 'Manager', bg: '#7c3aed' },
                  { role: 'HR' as UserRole, label: 'HR', bg: '#0284c7' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.role}
                    style={[styles.verifyRoleBtn, { backgroundColor: item.bg }]}
                    onPress={() => handleVerifyRole(user, item.role)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.verifyRoleBtnText}>✓ {item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Category Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ gap: 6, paddingVertical: 6 }}>
            {['ALL', 'SALES', 'COMMUNICATION', 'AI', 'OPERATIONS', 'ADMIN'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, categoryFilter === cat && { backgroundColor: colors.primary + '25', borderColor: colors.primary }]}
                onPress={() => setCategoryFilter(cat)}
                activeOpacity={0.75}
              >
                <Text style={[styles.catChipText, { color: categoryFilter === cat ? colors.primary : colors.textMuted }]}>
                  {cat === 'ALL' ? 'All Modules' : CATEGORY_STYLES[cat]?.label || cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Section 1: Default Baseline Modules (Locked) ──────────────────── */}
          {defaultMods.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <View style={styles.sectionHeader}>
                <Text style={{ fontSize: 13 }}>⭐</Text>
                <Text style={styles.sectionTitleGold}>Default Modules — Protected (Always Visible)</Text>
                <View style={styles.sectionLineGold} />
                <Text style={styles.lockedHint}>Cannot be hidden</Text>
              </View>

              {defaultMods.map((mod) => {
                const catStyle = CATEGORY_STYLES[mod.category] || CATEGORY_STYLES.SALES;
                return (
                  <View key={mod.key} style={[styles.moduleCard, { backgroundColor: isDark ? 'rgba(245,158,11,0.05)' : 'rgba(254,243,199,0.5)', borderColor: 'rgba(245,158,11,0.25)', opacity: 0.85 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[styles.modIconBox, { backgroundColor: catStyle.badgeBg, borderColor: catStyle.borderColor }]}>
                        <Text style={{ fontSize: 16 }}>{mod.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={[styles.modLabelText, { color: colors.text }]}>{mod.label}</Text>
                          <View style={[styles.categoryPill, { backgroundColor: catStyle.badgeBg, borderColor: catStyle.borderColor }]}>
                            <Text style={[styles.categoryPillText, { color: catStyle.badgeText }]}>{catStyle.label}</Text>
                          </View>
                          <View style={styles.defaultPill}>
                            <Text style={styles.defaultPillText}>🔒 DEFAULT</Text>
                          </View>
                        </View>
                        <Text style={[styles.modDescText, { color: colors.textMuted }]} numberOfLines={1}>{mod.description}</Text>
                      </View>
                    </View>

                    <View style={styles.alwaysOnBadge}>
                      <Text style={styles.alwaysOnBadgeText}>Always On</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Section 2: Configurable Modules (Admin Controlled) ────────────── */}
          {configMods.length > 0 && (
            <View style={{ marginTop: 18 }}>
              <View style={styles.sectionHeader}>
                <Text style={{ fontSize: 13 }}>⚙️</Text>
                <Text style={[styles.sectionTitleIndigo, { color: colors.primary }]}>Configurable Modules — Admin Controlled</Text>
                <View style={[styles.sectionLineIndigo, { backgroundColor: colors.primary + '30' }]} />
              </View>

              {configMods.map((mod) => {
                const catStyle = CATEGORY_STYLES[mod.category] || CATEGORY_STYLES.SALES;
                const isVisible = isModuleVisible(user, mod.key);
                const isEditable = isModuleEditable(user, mod.key);
                const isSaving = savingKey?.startsWith(`${user.id}:${mod.key}`);

                return (
                  <View key={mod.key} style={[styles.moduleCard, { backgroundColor: isVisible ? colors.cardBg : colors.cardBgElevated + '80', borderColor: isVisible ? colors.border : colors.border + '55', opacity: isVisible ? 1 : 0.65 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[styles.modIconBox, { backgroundColor: isVisible ? catStyle.badgeBg : 'rgba(30,41,59,0.4)', borderColor: isVisible ? catStyle.borderColor : 'rgba(30,41,59,0.3)' }]}>
                        <Text style={{ fontSize: 16 }}>{mod.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={[styles.modLabelText, { color: isVisible ? colors.text : colors.textMuted }]}>{mod.label}</Text>
                          <View style={[styles.categoryPill, { backgroundColor: catStyle.badgeBg, borderColor: catStyle.borderColor }]}>
                            <Text style={[styles.categoryPillText, { color: catStyle.badgeText }]}>{catStyle.label}</Text>
                          </View>
                        </View>
                        <Text style={[styles.modDescText, { color: colors.textMuted }]} numberOfLines={1}>{mod.description}</Text>
                      </View>
                    </View>

                    {/* Toggle Controls */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {/* Visibility Switch */}
                      {isSaving && savingKey?.endsWith(':active') ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <TouchableOpacity
                          style={[styles.toggleBtn, { backgroundColor: isVisible ? 'rgba(16,185,129,0.18)' : colors.cardBgElevated, borderColor: isVisible ? 'rgba(16,185,129,0.4)' : colors.border }]}
                          onPress={() => handleToggleVisibility(user, mod, isVisible)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.toggleBtnText, { color: isVisible ? '#34d399' : colors.textMuted }]}>
                            {isVisible ? '🟢 On' : '🔴 Off'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Edit Rights Toggle (Products & Quotes) */}
                      {mod.hasEditControl && isVisible && (
                        <TouchableOpacity
                          style={[styles.toggleBtn, { backgroundColor: isEditable ? 'rgba(168,85,247,0.18)' : colors.cardBgElevated, borderColor: isEditable ? 'rgba(168,85,247,0.4)' : colors.border }]}
                          onPress={() => handleToggleEdit(user, mod, isEditable)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.toggleBtnText, { color: isEditable ? '#c084fc' : colors.textMuted }]}>
                            ✏️ Edit {isEditable ? 'On' : 'Off'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN VIEW: TEAM MEMBERS DIRECTORY & CONTROL CENTER COCKPIT
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Floating Toast */}
      {toastMessage && (
        <View style={[styles.toastBanner, { top: Math.max(insets.top + 6, 16) }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border, paddingTop: Math.max(insets.top + 4, 16) }]}>
        <TouchableOpacity onPress={onClose} style={[styles.btnAction, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]} activeOpacity={0.75}>
          <Text style={[styles.btnActionText, { color: colors.primary }]}>← Dashboard</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>🛡️ Control Center</Text>
          </View>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Module visibility & role management</Text>
        </View>
        <TouchableOpacity style={[styles.btnAction, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, marginRight: 6 }]} onPress={() => loadWorkspaceUsers()} activeOpacity={0.75}>
          <Text style={[styles.btnActionText, { color: colors.primary }]}>🔄 Sync</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnAction, { backgroundColor: 'rgba(14,165,233,0.15)', borderColor: 'rgba(14,165,233,0.3)' }]} onPress={() => setShowAuditModal(true)} activeOpacity={0.75}>
          <Text style={[styles.btnActionText, { color: '#38bdf8' }]}>📋 Audit ({auditLogs.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 24) + 80 }} showsVerticalScrollIndicator={false}>

        {/* 👑 Organization Head Protection Banner */}
        <View style={[styles.adminProtectionCard, { backgroundColor: isDark ? 'rgba(30,27,75,0.45)' : 'rgba(238,242,255,0.7)', borderColor: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.25)' }]}>
          <Text style={{ fontSize: 20 }}>👑</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.adminProtectionTitle, { color: colors.text }]}>Organization Head Protected</Text>
            <Text style={[styles.adminProtectionDesc, { color: colors.textMuted }]}>
              Administrator accounts (<Text style={{ fontWeight: '800', color: colors.text }}>Admin</Text>) possess permanent, unrestricted master access across all modules. Tap any workspace employee below to configure their permissions.
            </Text>
          </View>
        </View>

        {/* Live Metrics Cockpit */}
        <View style={[styles.metricsGrid, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={styles.metricCol}>
            <Text style={[styles.metricVal, { color: colors.text }]}>{users.length}</Text>
            <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Staff</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metricCol}>
            <Text style={[styles.metricVal, { color: colors.primary }]}>{ALL_MODULES.length}</Text>
            <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Modules</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metricCol}>
            <Text style={[styles.metricVal, { color: '#34d399' }]}>{activeOverridesCount}</Text>
            <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Overrides</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metricCol}>
            <Text style={[styles.metricVal, { color: '#fbbf24' }]}>Full Root</Text>
            <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Authority</Text>
          </View>
        </View>

        {/* Search Employees Input */}
        <View style={[styles.searchBar, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search employees by name, email, role..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Role Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilterScroll} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
          {['ALL', 'SALES_EXEC', 'TEAM_LEADER', 'MANAGER', 'HR', 'UNASSIGNED'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleTabChip, roleFilter === r && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setRoleFilter(r)}
              activeOpacity={0.75}
            >
              <Text style={[styles.roleTabChipText, { color: roleFilter === r ? '#ffffff' : colors.textMuted }]}>
                {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Employee Directory List */}
        {loadingUsers ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading workspace directory...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>👥</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Staff Found</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              {searchQuery ? 'No employees match your search query.' : 'Share your workspace registration key so employees can join.'}
            </Text>
            <TouchableOpacity style={[styles.btnReload, { backgroundColor: colors.primary }]} onPress={() => loadWorkspaceUsers()} activeOpacity={0.8}>
              <Text style={styles.btnReloadText}>Reload Directory</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 10 }}>
            {filteredUsers.map((user) => {
              const roleBadge = ROLE_BADGES[user.role] || ROLE_BADGES.SALES_EXEC;
              const hiddenCount = ALL_MODULES.filter((m) => !isModuleVisible(user, m.key)).length;

              return (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.employeeCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                  onPress={() => setSelectedUser(user)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.avatarBox, { backgroundColor: roleBadge.bg, borderColor: roleBadge.border }]}>
                    <Text style={[styles.avatarText, { color: roleBadge.text }]}>{user.avatarInitials}</Text>
                  </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.employeeName, { color: colors.text }]} numberOfLines={1}>{user.name}</Text>
                    </View>
                    <Text style={[styles.employeeEmail, { color: colors.textMuted }]} numberOfLines={1}>{user.email}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      {hiddenCount > 0 ? (
                        <Text style={{ fontSize: 10, color: '#f43f5e', fontWeight: '800' }}>👁️ {hiddenCount} hidden</Text>
                      ) : (
                        <Text style={{ fontSize: 10, color: '#34d399', fontWeight: '800' }}>✓ All Visible</Text>
                      )}
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={[styles.roleBadgePill, { backgroundColor: roleBadge.bg, borderColor: roleBadge.border }]}>
                      <Text style={[styles.roleBadgeText, { color: roleBadge.text }]}>{roleBadge.label}</Text>
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 16, fontWeight: '800' }}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* ─── Audit Trail Modal ─────────────────────────────────────────────────── */}
      <Modal visible={showAuditModal} transparent animationType="slide" onRequestClose={() => setShowAuditModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 18 }}>📋</Text>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Admin Override Audit Trail</Text>
                  <Text style={[styles.modalSub, { color: colors.textMuted }]}>Full history of all module access modifications</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAuditModal(false)} style={[styles.modalCloseBtn, { backgroundColor: colors.cardBgElevated }]}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
              {auditLogs.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>No administrative overrides recorded yet.</Text>
                </View>
              ) : (
                auditLogs.map((log, idx) => (
                  <View key={log.id} style={[styles.auditRow, { borderBottomColor: colors.border, borderBottomWidth: idx < auditLogs.length - 1 ? 1 : 0 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>
                        {log.targetName} <Text style={{ fontSize: 10, color: colors.textMuted }}>({log.targetRole || 'Staff'})</Text>
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 1 }}>
                        {log.moduleLabel}: <Text style={{ color: log.action.includes('ON') || log.action.includes('GRANTED') ? '#34d399' : '#f43f5e' }}>{log.action}</Text>
                      </Text>
                      <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>By: {log.adminName} · {log.ts}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.35)' }]}
                onPress={async () => {
                  await AsyncStorage.removeItem(AUDIT_STORAGE_KEY);
                  setAuditLogs([]);
                  showToast('✓ Audit history cleared');
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#f43f5e', fontSize: 11, fontWeight: '800' }}>🗑️ Clear History</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, { flex: 1, backgroundColor: colors.primary }]}
                onPress={() => setShowAuditModal(false)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Toast
  toastBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  toastText: { color: '#ffffff', fontSize: 12, fontWeight: '800', textAlign: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 6,
  },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  headerSub: { fontSize: 10, marginTop: 1 },
  btnAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnActionText: { fontSize: 11, fontWeight: '800' },

  // Admin Protection Banner
  adminProtectionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  adminProtectionTitle: { fontSize: 12, fontWeight: '900' },
  adminProtectionDesc: { fontSize: 11, marginTop: 2, lineHeight: 15 },

  // Metrics Bar
  metricsGrid: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricCol: { flex: 1, alignItems: 'center' },
  metricVal: { fontSize: 15, fontWeight: '900' },
  metricLbl: { fontSize: 9, fontWeight: '700', marginTop: 2 },
  metricDivider: { width: 1, height: 26, marginHorizontal: 2 },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 12, fontWeight: '600', paddingVertical: 0 },

  // Role Filters
  roleFilterScroll: { marginBottom: 6 },
  roleTabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  roleTabChipText: { fontSize: 11, fontWeight: '800' },

  // Directory Cards
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '900' },
  employeeName: { fontSize: 13, fontWeight: '800' },
  employeeEmail: { fontSize: 11, marginTop: 1 },
  roleBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },

  // User Header & Bulk Actions (Detail View)
  userHeaderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  largeAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeAvatarText: { fontSize: 16, fontWeight: '900' },
  userNameLg: { fontSize: 15, fontWeight: '900' },
  userDeptText: { fontSize: 11, marginTop: 2 },
  verifiedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  verifiedBadgeText: { fontSize: 9, fontWeight: '800', color: '#34d399' },
  unassignedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  unassignedBadgeText: { fontSize: 9, fontWeight: '800', color: '#fbbf24' },

  bulkPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99,102,241,0.2)',
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetBtnText: { fontSize: 10, fontWeight: '900' },

  // Manager Lead Deletion Box
  managerDeleteCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  managerDeleteIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(168,85,247,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mgrDeleteTitle: { fontSize: 12, fontWeight: '900' },
  mgrDeleteDesc: { fontSize: 10, marginTop: 3, lineHeight: 14 },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 8, fontWeight: '900' },
  mgrDeleteActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(168,85,247,0.2)',
  },
  securityBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  securityBoxText: { fontSize: 9, fontWeight: '700', color: '#fbbf24' },
  mgrDeleteToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },

  // Unassigned Verification Box
  unassignedPromptBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  verifyRoleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  verifyRoleBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },

  // Category Filter
  categoryScroll: { marginBottom: 6 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  catChipText: { fontSize: 11, fontWeight: '800' },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitleGold: { fontSize: 10, fontWeight: '900', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionLineGold: { flex: 1, height: 1, backgroundColor: 'rgba(245,158,11,0.25)' },
  lockedHint: { fontSize: 9, color: '#94a3b8', fontWeight: '700' },

  sectionTitleIndigo: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionLineIndigo: { flex: 1, height: 1 },

  // Module Cards
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  modIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modLabelText: { fontSize: 12, fontWeight: '800' },
  modDescText: { fontSize: 9, marginTop: 1 },
  categoryPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  categoryPillText: { fontSize: 8, fontWeight: '900' },
  defaultPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  defaultPillText: { fontSize: 8, fontWeight: '900', color: '#fbbf24' },
  alwaysOnBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  alwaysOnBadgeText: { fontSize: 9, fontWeight: '900', color: '#34d399' },

  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleBtnText: { fontSize: 10, fontWeight: '900' },

  // Loading & Empty
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 12, fontWeight: '700' },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyTitle: { fontSize: 14, fontWeight: '800' },
  emptyDesc: { fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 16 },
  btnReload: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  btnReloadText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 14, fontWeight: '900' },
  modalSub: { fontSize: 10, marginTop: 1 },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditRow: { paddingVertical: 10 },
  modalActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
