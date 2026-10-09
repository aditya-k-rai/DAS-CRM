/**
 * moduleAccessStore.ts — DAS CRM Android
 * Zustand store for the Admin Control Center.
 * Manages per-user module access (view / share / edit) and active/inactive state.
 *
 * Architecture:
 * - Admin defines a policy per (userId, moduleKey) → { active, canView, canShare, canEdit }
 * - MoreControlsScreen and dashboard screens query this store before rendering a module
 * - Policies are persisted in AsyncStorage under '@das_crm_module_policies_v1'
 * - Default: ADMIN has full access; all other roles get conservative defaults
 *
 * Design: We purposely store policies as a flat map keyed by `${userId}:${moduleKey}`
 * for O(1) lookup with no nesting complexity.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ModuleKey } from '../types/moduleTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

// UserRole mirrors authStore.UserRole exactly — kept here to avoid circular imports
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'TEAM_LEADER' | 'HR' | 'SALES_EXEC' | 'UNASSIGNED';

export interface ModulePermission {
  active: boolean;   // Has access to this module at all
  canView: boolean;  // Can open/view the module
  canShare: boolean; // Can share content from the module (PDFs, leads, etc.)
  canEdit: boolean;  // Can create / edit / delete within the module
}

// Policy key: `${userId}:${moduleKey}`
type PolicyKey = string;

// An entry that represents a managed workspace user
export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
}

// Default permissions per role
const ROLE_DEFAULTS: Record<UserRole, ModulePermission> = {
  SUPER_ADMIN: { active: true,  canView: true,  canShare: true,  canEdit: true },
  ADMIN:       { active: true,  canView: true,  canShare: true,  canEdit: true },
  MANAGER:     { active: true,  canView: true,  canShare: true,  canEdit: true },
  TEAM_LEADER: { active: true,  canView: true,  canShare: true,  canEdit: false },
  HR:          { active: true,  canView: true,  canShare: false, canEdit: false },
  SALES_EXEC:  { active: true,  canView: true,  canShare: true,  canEdit: false },
  UNASSIGNED:  { active: false, canView: false, canShare: false, canEdit: false },
};

// Modules restricted by default per role (Admin/SuperAdmin have no restrictions)
const RESTRICTED_BY_DEFAULT: Record<UserRole, ModuleKey[]> = {
  SUPER_ADMIN: [],
  ADMIN:       [],
  MANAGER:     ['SETTINGS', 'PROFILE', 'DATABASE'],
  TEAM_LEADER: ['SETTINGS', 'PROFILE', 'DATABASE', 'IMPORT_EXPORT', 'AUTOMATIONS', 'AI_CONTROL', 'AI_HUB'],
  HR:          ['SETTINGS', 'PROFILE', 'DATABASE', 'IMPORT_EXPORT', 'AUTOMATIONS', 'DEALS', 'QUOTES', 'WA_TEMPLATES', 'AI_CONTROL', 'AI_HUB', 'PRODUCTS', 'PDF_CATALOG'],
  SALES_EXEC:  ['SETTINGS', 'PROFILE', 'DATABASE', 'IMPORT_EXPORT', 'AUTOMATIONS', 'WA_TEMPLATES', 'AI_CONTROL', 'AI_HUB', 'INTERVIEWS'],
  UNASSIGNED:  [],
};

// Permanent Default Modules per role — cannot be turned OFF by Admin
export const DEFAULT_MODULE_KEYS_BY_ROLE: Record<UserRole, ModuleKey[]> = {
  SUPER_ADMIN: [],
  ADMIN:       [],
  MANAGER:     ['LEADS', 'PIPELINE', 'REPORTS', 'ATTENDANCE', 'EMPLOYEES', 'DEALS', 'PRODUCTS', 'QUOTES', 'UPCOMING_COMMS', 'SUPPORT', 'GOALS', 'TASKS', 'FOLLOW_UPS', 'SETTINGS'],
  TEAM_LEADER: ['LEADS', 'PIPELINE', 'REPORTS', 'ATTENDANCE', 'EMPLOYEES', 'DEALS', 'GOALS', 'SETTINGS', 'UPCOMING_COMMS', 'SUPPORT', 'LEAD_ASSIGNMENT', 'TASKS', 'FOLLOW_UPS'],
  SALES_EXEC:  ['LEADS', 'DEALS', 'REPORTS', 'ATTENDANCE', 'SETTINGS', 'UPCOMING_COMMS', 'SUPPORT', 'TASKS', 'FOLLOW_UPS'],
  HR:          ['EMPLOYEES', 'ATTENDANCE', 'INTERVIEWS', 'UPCOMING_COMMS', 'SUPPORT', 'SETTINGS'],
  UNASSIGNED:  [],
};

export const isRoleDefaultModule = (role: UserRole, key: ModuleKey): boolean =>
  (DEFAULT_MODULE_KEYS_BY_ROLE[role] || []).includes(key);

export const STORAGE_KEY = '@das_crm_module_policies_v1';
export const USERS_CACHE_KEY = '@das_crm_managed_users_cache_v1';

// ─── Store ────────────────────────────────────────────────────────────────────

interface ModuleAccessState {
  // Core policy map: PolicyKey → ModulePermission
  policies: Record<PolicyKey, ModulePermission>;
  // Cached list of workspace users (populated from EmployeesScreen data)
  managedUsers: ManagedUser[];
  isHydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  getPermission: (userId: string, role: UserRole, moduleKey: ModuleKey, userEmail?: string) => ModulePermission;
  setPermission: (userId: string, moduleKey: ModuleKey, perm: Partial<ModulePermission>, userEmail?: string) => Promise<void>;
  setPolicies: (policies: Record<PolicyKey, ModulePermission>) => Promise<void>;
  resetUserPermissions: (userId: string, role: UserRole, userEmail?: string) => Promise<void>;
  resetAllPermissions: () => Promise<void>;
  setManagedUsers: (users: ManagedUser[]) => Promise<void>;
  getManagedUsers: () => ManagedUser[];
}

export const useModuleAccessStore = create<ModuleAccessState>()((set, get) => ({
  policies: {},
  managedUsers: [],
  isHydrated: false,

  hydrate: async () => {
    try {
      const [rawPolicies, rawUsers] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(USERS_CACHE_KEY),
      ]);
      const policies: Record<PolicyKey, ModulePermission> = rawPolicies ? JSON.parse(rawPolicies) : {};
      const managedUsers: ManagedUser[] = rawUsers ? JSON.parse(rawUsers) : [];
      set({ policies, managedUsers, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },

  getPermission: (userId, role, moduleKey, userEmail) => {
    // Permanent root access for Organization Head / Admin / Super Admin / Owner
    const normalizedRole = (role || '').toUpperCase();
    if (
      normalizedRole === 'ADMIN' ||
      normalizedRole === 'SUPER_ADMIN' ||
      normalizedRole === 'OWNER' ||
      normalizedRole === 'TENANT_ADMIN' ||
      normalizedRole.includes('ADMIN')
    ) {
      return { active: true, canView: true, canShare: true, canEdit: true };
    }

    const { policies } = get();
    const key: PolicyKey = `${userId}:${moduleKey}`;
    if (policies[key] !== undefined) return policies[key];

    if (userEmail) {
      const emailKey: PolicyKey = `${userEmail.toLowerCase().trim()}:${moduleKey}`;
      if (policies[emailKey] !== undefined) return policies[emailKey];
    }

    // Fresh user without explicit override: ONLY access role's default modules!
    const isDefault = (DEFAULT_MODULE_KEYS_BY_ROLE[role] ?? []).includes(moduleKey);
    return {
      active: isDefault,
      canView: isDefault,
      canShare: isDefault,
      canEdit: isDefault && (role === 'MANAGER' || (role === 'TEAM_LEADER' && (moduleKey === 'DEALS' || moduleKey === 'GOALS' || moduleKey === 'LEADS' || moduleKey === 'PIPELINE'))),
    };
  },

  setPermission: async (userId, moduleKey, patch, userEmail) => {
    const state = get();
    const targetUser = state.managedUsers.find((u) => u.id === userId);
    const targetRole = (targetUser?.role || '').toUpperCase();
    // Never apply policy overrides to Admins/SuperAdmins
    if (targetRole.includes('ADMIN') || targetRole.includes('OWNER')) {
      return;
    }

    const key: PolicyKey = `${userId}:${moduleKey}`;
    const existing = state.policies[key] ?? { active: true, canView: true, canShare: false, canEdit: false };
    const updated = { ...existing, ...patch };
    // Enforce logical consistency: if active=false, clear all sub-perms
    if (!updated.active) {
      updated.canView = false;
      updated.canShare = false;
      updated.canEdit = false;
    }
    // If canEdit=true, canView must be true
    if (updated.canEdit) updated.canView = true;

    const emailKey = userEmail ? `${userEmail.toLowerCase().trim()}:${moduleKey}` : null;
    const newPolicies = {
      ...state.policies,
      [key]: updated,
      ...(emailKey ? { [emailKey]: updated } : {}),
    };
    set({ policies: newPolicies });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPolicies));
  },

  setPolicies: async (newPolicies) => {
    set({ policies: newPolicies });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPolicies));
  },

  resetUserPermissions: async (userId, role, userEmail) => {
    const state = get();
    const emailPrefix = userEmail ? `${userEmail.toLowerCase().trim()}:` : null;
    const toRemove = Object.keys(state.policies).filter(
      (k) => k.startsWith(`${userId}:`) || (emailPrefix && k.startsWith(emailPrefix))
    );
    const newPolicies = { ...state.policies };
    toRemove.forEach((k) => delete newPolicies[k]);
    set({ policies: newPolicies });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPolicies));
  },

  resetAllPermissions: async () => {
    set({ policies: {} });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },

  setManagedUsers: async (users) => {
    set({ managedUsers: users });
    await AsyncStorage.setItem(USERS_CACHE_KEY, JSON.stringify(users));
  },

  getManagedUsers: () => get().managedUsers,
}));
