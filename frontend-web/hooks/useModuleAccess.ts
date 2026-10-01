'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth, normalizeRoleStr } from '@/context/AuthContext';

export interface ModulePermission {
  active: boolean;   // Has access to this module at all
  canView: boolean;  // Can open/view the module
  canShare: boolean; // Can share content from the module (PDFs, leads, etc.)
  canEdit: boolean;  // Can create / edit / delete within the module
}

export const STORAGE_KEY = '@das_crm_module_policies_v1';
export const AUDIT_STORAGE_KEY = '@das_crm_control_center_audit_v1';

export const ROLE_DEFAULT_PERMISSIONS: Record<string, ModulePermission> = {
  SUPER_ADMIN: { active: true, canView: true, canShare: true, canEdit: true },
  ADMIN:       { active: true, canView: true, canShare: true, canEdit: true },
  MANAGER:     { active: true, canView: true, canShare: true, canEdit: true },
  TEAM_LEADER: { active: true, canView: true, canShare: true, canEdit: false },
  HR:          { active: true, canView: true, canShare: false, canEdit: false },
  SALES_EXEC:  { active: true, canView: true, canShare: true, canEdit: false },
  UNASSIGNED:  { active: false, canView: false, canShare: false, canEdit: false },
};

export const DEFAULT_MODULE_KEYS_BY_ROLE: Record<string, string[]> = {
  ADMIN:       ['LEADS', 'PIPELINE', 'EMPLOYEES', 'PRODUCTS', 'QUOTES', 'COMMUNICATIONS', 'WA_TEMPLATES', 'EXTRA_EMAIL', 'AI_CONTROL', 'PDF_CATALOG', 'REPORTS', 'AUTOMATIONS', 'DATABASE', 'ATTENDANCE', 'DEALS', 'GOALS', 'INTERVIEWS', 'UPCOMING_COMMS', 'SETTINGS', 'PROFILE', 'SUPPORT'],
  SUPER_ADMIN: ['LEADS', 'PIPELINE', 'EMPLOYEES', 'PRODUCTS', 'QUOTES', 'COMMUNICATIONS', 'WA_TEMPLATES', 'EXTRA_EMAIL', 'AI_CONTROL', 'PDF_CATALOG', 'REPORTS', 'AUTOMATIONS', 'DATABASE', 'ATTENDANCE', 'DEALS', 'GOALS', 'INTERVIEWS', 'UPCOMING_COMMS', 'SETTINGS', 'PROFILE', 'SUPPORT'],
  MANAGER:     ['LEADS', 'PIPELINE', 'REPORTS', 'ATTENDANCE', 'EMPLOYEES', 'DEALS', 'PRODUCTS', 'QUOTES', 'UPCOMING_COMMS', 'SUPPORT'],
  TEAM_LEADER: ['LEADS', 'ATTENDANCE', 'UPCOMING_COMMS', 'DEALS', 'REPORTS', 'SUPPORT'],
  SALES_EXEC:  ['LEADS', 'ATTENDANCE', 'UPCOMING_COMMS', 'SUPPORT'],
  HR:          ['EMPLOYEES', 'ATTENDANCE', 'INTERVIEWS', 'UPCOMING_COMMS', 'SUPPORT'],
  UNASSIGNED:  [],
};

export function useModuleAccess() {
  const { currentUser } = useAuth();
  const [policies, setPolicies] = useState<Record<string, ModulePermission>>({});

  const normalizedRole = useMemo(() => {
    const raw = (currentUser?.role || '').toUpperCase().trim();
    if (raw.includes('ADMIN') || raw.includes('OWNER') || raw.includes('SUPER_ADMIN')) return 'ADMIN';
    if (raw.includes('MANAGER')) return 'MANAGER';
    if (raw.includes('LEADER') || raw.includes('TL')) return 'TEAM_LEADER';
    if (raw.includes('HR')) return 'HR';
    if (raw === 'UNASSIGNED' || !raw) return 'UNASSIGNED';
    return 'SALES_EXEC';
  }, [currentUser?.role]);

  const isAdmin = normalizedRole === 'ADMIN';

  // Load policies from localStorage & listen for storage changes
  useEffect(() => {
    const loadPolicies = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setPolicies(JSON.parse(raw));
      } catch (_) {}
    };

    loadPolicies();
    window.addEventListener('storage', loadPolicies);
    return () => window.removeEventListener('storage', loadPolicies);
  }, []);

  const getPermission = useCallback((moduleKey: string): ModulePermission => {
    // Admin / Head always has permanent full access to every module
    if (isAdmin) {
      return { active: true, canView: true, canShare: true, canEdit: true };
    }

    const userId = currentUser?.id || '';
    const key = `${userId}:${moduleKey}`;

    // Check specific policy override
    if (policies[key] !== undefined) {
      return policies[key];
    }

    // Fresh user without explicit override: strictly whitelist role's permanent default modules
    const roleDefaults = DEFAULT_MODULE_KEYS_BY_ROLE[normalizedRole] || [];
    const isDefault = roleDefaults.includes(moduleKey);

    if (!isDefault) {
      return { active: false, canView: false, canShare: false, canEdit: false };
    }

    const base = ROLE_DEFAULT_PERMISSIONS[normalizedRole] || ROLE_DEFAULT_PERMISSIONS.SALES_EXEC;
    return { ...base };
  }, [isAdmin, currentUser?.id, policies, normalizedRole]);

  const hasAccess = useCallback((moduleKey: string): boolean => {
    return getPermission(moduleKey).active;
  }, [getPermission]);

  const canView = useCallback((moduleKey: string): boolean => {
    const p = getPermission(moduleKey);
    return p.active && p.canView;
  }, [getPermission]);

  const canShare = useCallback((moduleKey: string): boolean => {
    const p = getPermission(moduleKey);
    return p.active && p.canShare;
  }, [getPermission]);

  const canEdit = useCallback((moduleKey: string): boolean => {
    const p = getPermission(moduleKey);
    return p.active && p.canEdit;
  }, [getPermission]);

  return {
    isAdmin,
    role: normalizedRole,
    getPermission,
    hasAccess,
    canView,
    canShare,
    canEdit,
  };
}
