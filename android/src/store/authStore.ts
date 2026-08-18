/**
 * authStore.ts — DAS CRM Android
 * Mirrors frontend-web/context/AuthContext.tsx logic exactly.
 * Persists session via AsyncStorage (equivalent to localStorage).
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types (identical to web AuthContext) ───────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'HR'
  | 'MANAGER'
  | 'TEAM_LEADER'
  | 'SALES_EXEC';

export type PlanType =
  | 'FREE_TRIAL'
  | 'STARTER'
  | 'BASIC'
  | 'PRO'
  | 'PRO_50'
  | 'PRO_MAX'
  | 'ENTERPRISE';

export interface CompanySubscription {
  id: string;
  companyName: string;
  planType: PlanType;
  trialDaysLeft: number;
  isExpired: boolean;
  userSeatsAllocated: number;
  userSeatsUsed: number;
  hasTeamLeaders: boolean;
  features: {
    whatsApp: boolean;
    emailAutomation: boolean;
    aiLeadScoring: boolean;
    customSalaryBuilder: boolean;
    exportCSV: boolean;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  companyId: string;
  companyName: string;
  managerId?: string;
  teamLeaderId?: string;
}

export interface RoleTransitionLock {
  id: string;
  oldRole: string;
  newRole: string;
  initiatedAt: string;
  expiresAt: string;
  hoursRemaining: number;
}

// ─── Mock / Demo Data (identical to web AuthContext) ────────────────────────

export const MOCK_COMPANY_SUB: CompanySubscription = {
  id: 'comp_acme',
  companyName: 'Acme Sales Solutions',
  planType: 'FREE_TRIAL',
  trialDaysLeft: 14,
  isExpired: false,
  userSeatsAllocated: 6,
  userSeatsUsed: 4,
  hasTeamLeaders: true,
  features: {
    whatsApp: false,
    emailAutomation: false,
    aiLeadScoring: true,
    customSalaryBuilder: true,
    exportCSV: true,
  },
};

export const DEMO_USERS: Record<UserRole, UserProfile> = {
  SUPER_ADMIN: {
    id: 'usr_super',
    name: 'Super Administrative',
    email: 'adtyamighty@gmail.com',
    role: 'SUPER_ADMIN',
    avatar: 'SA',
    companyId: 'platform_system',
    companyName: 'NexCRM System Admin',
  },
  ADMIN: {
    id: 'usr_admin',
    name: 'Vikram Singh (Tenant Admin)',
    email: 'vikram.admin@acme.com',
    role: 'ADMIN',
    avatar: 'VS',
    companyId: 'comp_acme',
    companyName: 'Acme Sales Solutions',
  },
  HR: {
    id: 'usr_hr',
    name: 'Sunita Verma (HR Manager)',
    email: 'sunita.hr@acme.com',
    role: 'HR',
    avatar: 'SV',
    companyId: 'comp_acme',
    companyName: 'Acme Sales Solutions',
  },
  MANAGER: {
    id: 'usr_mgr',
    name: 'Rajesh Mehta (Department Manager)',
    email: 'rajesh.mgr@acme.com',
    role: 'MANAGER',
    avatar: 'RM',
    companyId: 'comp_acme',
    companyName: 'Acme Sales Solutions',
  },
  TEAM_LEADER: {
    id: 'usr_tl',
    name: 'Amit Shah (Team Leader)',
    email: 'amit.tl@acme.com',
    role: 'TEAM_LEADER',
    avatar: 'AS',
    companyId: 'comp_acme',
    companyName: 'Acme Sales Solutions',
    managerId: 'usr_mgr',
  },
  SALES_EXEC: {
    id: 'usr_rep',
    name: 'Rajesh Kumar (Employee)',
    email: 'rajesh.rep@acme.com',
    role: 'SALES_EXEC',
    avatar: 'RK',
    companyId: 'comp_acme',
    companyName: 'Acme Sales Solutions',
    managerId: 'usr_mgr',
    teamLeaderId: 'usr_tl',
  },
};

// ─── Helper Functions (identical to web AuthContext) ─────────────────────────

export function normalizeRoleStr(r?: any): UserRole {
  if (!r) return 'ADMIN';
  let str = '';
  if (typeof r === 'string') {
    str = r;
  } else if (typeof r === 'object' && r !== null) {
    str =
      typeof r.name === 'string'
        ? r.name
        : typeof r.role === 'string'
        ? r.role
        : String(r);
  } else {
    str = String(r);
  }

  const norm = str.trim().toUpperCase();
  if (norm === 'SUPER_ADMIN' || norm === 'SYSTEM_ADMIN' || norm === 'SUPERADMIN')
    return 'SUPER_ADMIN';
  if (
    norm === 'ADMIN' ||
    norm === 'TENANT_ADMIN' ||
    norm === 'OWNER' ||
    norm === 'COMPANY_ADMIN'
  )
    return 'ADMIN';
  if (
    norm === 'HR' ||
    norm === 'HR_MANAGER' ||
    norm === 'HUMAN_RESOURCES' ||
    norm === 'HR_ADMIN' ||
    norm === 'HR_EXEC'
  )
    return 'HR';
  if (norm === 'MANAGER' || norm === 'DEPT_MANAGER' || norm === 'SALES_MANAGER')
    return 'MANAGER';
  if (norm === 'TEAM_LEADER' || norm === 'TL' || norm === 'LEAD')
    return 'TEAM_LEADER';
  if (
    norm === 'SALES_EXEC' ||
    norm === 'EMPLOYEE' ||
    norm === 'STAFF' ||
    norm === 'REP' ||
    norm === 'EXECUTIVE' ||
    norm === 'SALES_REP' ||
    norm === 'SALES' ||
    norm === 'USER' ||
    norm === 'VIEWER'
  )
    return 'SALES_EXEC';

  return 'ADMIN';
}

export function inferRoleFromEmail(email?: string | null): UserRole | null {
  if (!email) return null;
  const em = email.toLowerCase().trim();
  if (em === 'adtyamighty@gmail.com') return 'SUPER_ADMIN';
  if (
    em.includes('sunita.hr') ||
    em.includes('hr.manager') ||
    em.includes('hr@') ||
    em.includes('.hr@') ||
    em.startsWith('hr.')
  )
    return 'HR';
  if (
    em.includes('rajesh.mgr') ||
    em.includes('manager@') ||
    em.includes('.mgr@') ||
    em.startsWith('mgr.') ||
    em.includes('.manager@')
  )
    return 'MANAGER';
  if (
    em.includes('amit.tl') ||
    em.includes('lead@') ||
    em.includes('.tl@') ||
    em.startsWith('tl.') ||
    em.includes('teamleader@')
  )
    return 'TEAM_LEADER';
  if (
    em.includes('rajesh.rep') ||
    em.includes('sales@') ||
    em.includes('.rep@') ||
    em.includes('exec@') ||
    em.includes('employee@') ||
    em.startsWith('rep.')
  )
    return 'SALES_EXEC';
  if (
    em.includes('vikram.admin') ||
    em.includes('admin@') ||
    em.includes('owner@')
  )
    return 'ADMIN';
  return null;
}

export function validateEmailRoleMatch(
  email?: string | null,
  selectedRole?: UserRole,
): { valid: boolean; expectedRole?: UserRole } {
  if (!email || !selectedRole) return { valid: true };
  const expected = inferRoleFromEmail(email);
  if (!expected) return { valid: true };
  return {
    valid: normalizeRoleStr(expected) === normalizeRoleStr(selectedRole),
    expectedRole: expected,
  };
}

/** Returns the default tab/screen name for navigation after login. */
export function getPostLoginDefaultTab(role: UserRole): string {
  switch (role) {
    case 'HR':
      return 'HR';
    case 'ADMIN':
    case 'MANAGER':
    case 'TEAM_LEADER':
    case 'SALES_EXEC':
    default:
      return 'Dashboard';
  }
}

// ─── AsyncStorage Keys ────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  user: 'nexcrm_user',
  token: 'nexcrm_token',
  role: 'nexcrm_active_role',
} as const;

// ─── Auth Store ───────────────────────────────────────────────────────────────

interface AuthState {
  currentUser: UserProfile;
  subscription: CompanySubscription;
  token: string | null;
  roleTransitionLock: RoleTransitionLock | null;
  isLocked: boolean;
  isHydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  updateSubscription: (patch: Partial<CompanySubscription>) => void;
  setAuthSession: (
    user: UserProfile,
    token: string,
    sub?: CompanySubscription,
  ) => Promise<void>;
  logout: () => Promise<void>;
  setRoleLockState: (lock: RoleTransitionLock | null) => void;
  canEdit: () => boolean;
  canAccessFeature: (
    feat: keyof CompanySubscription['features'],
  ) => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  currentUser: DEMO_USERS.ADMIN,
  subscription: MOCK_COMPANY_SUB,
  token: null,
  roleTransitionLock: null,
  isLocked: false,
  isHydrated: false,

  /** Load persisted session from AsyncStorage on app start. */
  hydrate: async () => {
    try {
      const [userStr, tokenStr, roleStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.user),
        AsyncStorage.getItem(STORAGE_KEYS.token),
        AsyncStorage.getItem(STORAGE_KEYS.role),
      ]);

      let user: UserProfile = DEMO_USERS.ADMIN;

      if (userStr) {
        const parsed = JSON.parse(userStr) as UserProfile;
        if (parsed && (parsed.role || parsed.email)) {
          parsed.role = normalizeRoleStr(
            parsed.role || inferRoleFromEmail(parsed.email),
          );
          // Guard: only adtyamighty@gmail.com can be SUPER_ADMIN
          if (
            parsed.role === 'SUPER_ADMIN' &&
            parsed.email?.toLowerCase() !== 'adtyamighty@gmail.com'
          ) {
            parsed.role = 'ADMIN';
          }
          user = parsed;
        }
      } else if (roleStr) {
        const safeRole = normalizeRoleStr(roleStr);
        user = DEMO_USERS[safeRole] || DEMO_USERS.ADMIN;
      }

      set({
        currentUser: user,
        token: tokenStr || null,
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  switchRole: async (role: UserRole) => {
    const normRole = normalizeRoleStr(role);
    const targetUser = DEMO_USERS[normRole] || DEMO_USERS.ADMIN;
    set({ currentUser: targetUser, token: 'demo_active_token' });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.role, normRole),
      AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(targetUser)),
      AsyncStorage.setItem(STORAGE_KEYS.token, 'demo_active_token'),
    ]);
  },

  updateSubscription: (patch) => {
    set((state) => {
      const updated = {
        ...state.subscription,
        ...patch,
        features: { ...state.subscription.features, ...(patch.features || {}) },
      };
      if (updated.planType === 'FREE_TRIAL') {
        updated.features.whatsApp = false;
        updated.features.emailAutomation = false;
      }
      return { subscription: updated };
    });
  },

  setAuthSession: async (user, token, sub?) => {
    const normalizedUser: UserProfile = {
      ...user,
      role: normalizeRoleStr(user.role || inferRoleFromEmail(user.email)),
    };
    set({
      currentUser: normalizedUser,
      token,
      ...(sub ? { subscription: sub } : {}),
    });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(normalizedUser)),
      AsyncStorage.setItem(STORAGE_KEYS.token, token),
      AsyncStorage.setItem(STORAGE_KEYS.role, normalizedUser.role),
    ]);
  },

  logout: async () => {
    set({
      token: null,
      currentUser: DEMO_USERS.ADMIN,
      roleTransitionLock: null,
      isLocked: false,
    });
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.user),
      AsyncStorage.removeItem(STORAGE_KEYS.token),
      AsyncStorage.removeItem(STORAGE_KEYS.role),
    ]);
  },

  setRoleLockState: (lock) => {
    set({ roleTransitionLock: lock, isLocked: !!lock });
  },

  canEdit: () => {
    const { currentUser, roleTransitionLock, subscription } = get();
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (roleTransitionLock) return false;
    if (subscription.isExpired) return false;
    return true;
  },

  canAccessFeature: (feat) => {
    const { currentUser, subscription } = get();
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (
      subscription.planType === 'FREE_TRIAL' &&
      (feat === 'whatsApp' || feat === 'emailAutomation')
    ) {
      return false;
    }
    return !!subscription.features[feat];
  },
}));
