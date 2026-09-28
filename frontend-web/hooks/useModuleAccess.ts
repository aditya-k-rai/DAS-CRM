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

export const RESTRICTED_BY_DEFAULT_ROLE: Record<string, string[]> = {
  SUPER_ADMIN: [],
  ADMIN:       [],
  MANAGER:     ['SETTINGS', 'PROFILE', 'DATABASE'],
  TEAM_LEADER: ['SETTINGS', 'PROFILE', 'DATABASE', 'AUTOMATIONS', 'AI_CONTROL'],
  HR:          ['SETTINGS', 'PROFILE', 'DATABASE', 'AUTOMATIONS', 'DEALS', 'QUOTES', 'WA_TEMPLATES', 'AI_CONTROL', 'PRODUCTS', 'PDF_CATALOG'],
  SALES_EXEC:  ['SETTINGS', 'PROFILE', 'DATABASE', 'AUTOMATIONS', 'DEALS', 'WA_TEMPLATES', 'AI_CONTROL', 'EMPLOYEES', 'INTERVIEWS'],
  UNASSIGNED:  ['LEADS', 'PIPELINE', 'PRODUCTS', 'PDF_CATALOG', 'QUOTES', 'DEALS', 'GOALS', 'COMMUNICATIONS', 'WA_TEMPLATES', 'EXTRA_EMAIL', 'UPCOMING_COMMS', 'AI_CONTROL', 'AUTOMATIONS', 'EMPLOYEES', 'ATTENDANCE', 'INTERVIEWS', 'REPORTS', 'DATABASE', 'PROFILE', 'SETTINGS', 'SUPPORT'],
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
    if (policies[key]) {
      return policies[key];
    }

    // Default policy based on role
    const isRestrictedByDefault = (RESTRICTED_BY_DEFAULT_ROLE[normalizedRole] || []).includes(moduleKey);
    const base = ROLE_DEFAULT_PERMISSIONS[normalizedRole] || ROLE_DEFAULT_PERMISSIONS.SALES_EXEC;

    if (isRestrictedByDefault) {
      return { active: false, canView: false, canShare: false, canEdit: false };
    }
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
