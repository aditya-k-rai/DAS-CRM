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
  | 'GROWTH'
  | 'BUSINESS'
  | 'ENTERPRISE'
  | 'STARTER'
  | 'BASIC'
  | 'PRO'
  | 'PRO_50'
  | 'PRO_MAX'
  | 'MAX';

export interface PlanConfig {
  id: PlanType;
  name: string;
  seats: number;
  durationMinDays?: number;
  durationMaxDays?: number;
  defaultDurationDays?: number;
  hasAllAiFeatures: boolean;
  hasWhatsApp: boolean;
  hasEmailMarketing: boolean;
  description: string;
}

export function getPlanSeatQuota(planType?: string): number {
  if (!planType) return 18;
  const p = planType.toUpperCase().replace(/\s+/g, '_');
  switch (p) {
    case 'FREE_TRIAL':
    case 'TRIAL':
      return 6;
    case 'GROW':
    case 'GROWTH':
    case 'STARTER':
    case 'BASIC':
      return 6;
    case 'BUSINESS':
    case 'PRO':
      return 18;
    case 'PRO_50':
      return 50;
    case 'ENTERPRISE':
    case 'PRO_MAX':
    case 'MAX':
      return 60;
    default:
      return 18;
  }
}

export function formatPlanName(planType?: string): string {
  if (!planType) return 'Business Plan';
  const p = planType.toUpperCase().replace(/\s+/g, '_');
  switch (p) {
    case 'FREE_TRIAL': return 'Free Trial';
    case 'GROW': case 'GROWTH': return 'Grow Plan';
    case 'BUSINESS': return 'Business Plan';
    case 'ENTERPRISE': return 'Enterprise Plan';
    case 'PRO': return 'Pro Plan';
    case 'PRO_50': return 'Pro 50 Plan';
    case 'PRO_MAX': case 'MAX': return 'Enterprise Max';
    default: return `${planType.replace('_', ' ')} Plan`;
  }
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  FREE_TRIAL: {
    id: 'FREE_TRIAL',
    name: 'Free Trial Plan',
    seats: 6,
    durationMinDays: 15,
    durationMaxDays: 40,
    defaultDurationDays: 30,
    hasAllAiFeatures: false, // Basic AI only (Only Lead Score)
    hasWhatsApp: false,
    hasEmailMarketing: false,
    description: '6 Users · Core CRM · 15-40 days duration',
  },
  GROWTH: {
    id: 'GROWTH',
    name: 'Grow Plan',
    seats: 6,
    hasAllAiFeatures: false, // Blocked
    hasWhatsApp: false, // Blocked
    hasEmailMarketing: false, // Blocked
    description: '6 Users · Core CRM · WhatsApp & Email excluded',
  },
  BUSINESS: {
    id: 'BUSINESS',
    name: 'Business Plan',
    seats: 18,
    hasAllAiFeatures: true,
    hasWhatsApp: true,
    hasEmailMarketing: true,
    description: '18 Users · All Features Included (All AI + WhatsApp + Email)',
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise Plan',
    seats: 60,
    hasAllAiFeatures: true,
    hasWhatsApp: true,
    hasEmailMarketing: true,
    description: '60 Users · All Features Included · Enterprise Scale & SLA',
  },
};

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
  isLocked?: boolean;
  isSuspended?: boolean;
  deletionScheduledAt?: string | null;
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
  id: 'comp_default',
  companyName: 'DAS Organization',
  planType: 'BUSINESS',
  trialDaysLeft: 30,
  isExpired: false,
  userSeatsAllocated: 18, // Business Plan default: 18 Users
  userSeatsUsed: 1, // 1 Admin role active
  hasTeamLeaders: true,
  features: {
    whatsApp: true,
    emailAutomation: true,
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
    companyName: 'DAS CRM System Admin',
  },
  ADMIN: {
    id: 'usr_admin',
    name: 'Workspace Admin',
    email: 'admin@das.com',
    role: 'ADMIN',
    avatar: 'WA',
    companyId: 'comp_default',
    companyName: 'DAS Organization',
  },
  HR: {
    id: 'usr_hr',
    name: 'HR Manager',
    email: 'hr@das.com',
    role: 'HR',
    avatar: 'HR',
    companyId: 'comp_default',
    companyName: 'DAS Organization',
  },
  MANAGER: {
    id: 'usr_mgr',
    name: 'Department Manager',
    email: 'manager@das.com',
    role: 'MANAGER',
    avatar: 'DM',
    companyId: 'comp_default',
    companyName: 'DAS Organization',
  },
  TEAM_LEADER: {
    id: 'usr_tl',
    name: 'Team Leader',
    email: 'leader@das.com',
    role: 'TEAM_LEADER',
    avatar: 'TL',
    companyId: 'comp_default',
    companyName: 'DAS Organization',
    managerId: 'usr_mgr',
  },
  SALES_EXEC: {
    id: 'usr_rep',
    name: 'Sales Executive',
    email: 'sales@das.com',
    role: 'SALES_EXEC',
    avatar: 'SE',
    companyId: 'comp_default',
    companyName: 'DAS Organization',
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
    em.includes('hr.manager') ||
    em.includes('hr@') ||
    em.includes('.hr@') ||
    em.startsWith('hr.')
  )
    return 'HR';
  if (
    em.includes('manager@') ||
    em.includes('.mgr@') ||
    em.startsWith('mgr.') ||
    em.includes('.manager@')
  )
    return 'MANAGER';
  if (
    em.includes('lead@') ||
    em.includes('leader@') ||
    em.includes('.tl@') ||
    em.startsWith('tl.') ||
    em.includes('teamleader@')
  )
    return 'TEAM_LEADER';
  if (
    em.includes('sales@') ||
    em.includes('.rep@') ||
    em.includes('exec@') ||
    em.includes('employee@') ||
    em.startsWith('rep.')
  )
    return 'SALES_EXEC';
  if (
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
  user: 'das_crm_user',
  token: 'das_crm_token',
  role: 'das_crm_active_role',
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
  canAccessAIFeature: (
    feature: 'lead-scoring' | 'chat-instructions' | 'templates' | 'automation' | 'analytics',
  ) => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  currentUser: DEMO_USERS.ADMIN,
  subscription: MOCK_COMPANY_SUB,
  token: null,
  roleTransitionLock: null,
  isLocked: false,
  isHydrated: false,

  /** Load persisted session from AsyncStorage on app start with timeout safeguard. */
  hydrate: async () => {
    try {
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 800));
      const storagePromise = Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.user),
        AsyncStorage.getItem(STORAGE_KEYS.token),
        AsyncStorage.getItem(STORAGE_KEYS.role),
      ]);

      const results = await Promise.race([storagePromise, timeoutPromise]);
      if (!results) {
        set({ isHydrated: true });
        return;
      }

      const [userStr, tokenStr, roleStr] = results;

      let user: UserProfile = DEMO_USERS.ADMIN;

      if (userStr) {
        try {
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
        } catch {
          // Bad JSON: use default
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
      // WhatsApp and Email are blocked on FREE_TRIAL and GROWTH
      if (updated.planType === 'FREE_TRIAL' || updated.planType === 'GROWTH' || updated.planType === 'STARTER') {
        updated.features.whatsApp = false;
        updated.features.emailAutomation = false;
      }
      if (updated.planType === 'BUSINESS' || updated.planType === 'ENTERPRISE' || updated.planType === 'PRO' || updated.planType === 'PRO_50' || updated.planType === 'PRO_MAX' || updated.planType === 'MAX') {
        updated.features.whatsApp = true;
        updated.features.emailAutomation = true;
      }
      return { subscription: updated };
    });
  },

  setAuthSession: async (user, token, sub?) => {
    const normalizedUser: UserProfile = {
      ...user,
      role: normalizeRoleStr(user.role || inferRoleFromEmail(user.email)),
    };
    const effectivePlan = sub?.planType || (user as any)?.companyPlan || 'BUSINESS';
    const allocatedSeats = sub?.userSeatsAllocated || getPlanSeatQuota(effectivePlan);
    const resolvedSub: CompanySubscription = sub
      ? {
          ...sub,
          planType: effectivePlan as PlanType,
          userSeatsAllocated: allocatedSeats,
        }
      : {
          ...MOCK_COMPANY_SUB,
          companyName: user.companyName || MOCK_COMPANY_SUB.companyName,
          planType: effectivePlan as PlanType,
          userSeatsAllocated: allocatedSeats,
        };

    set({
      currentUser: normalizedUser,
      token,
      subscription: resolvedSub,
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
    const plan = subscription.planType;
    // Hard block WhatsApp and Email Marketing on FREE_TRIAL and GROWTH plans
    if (
      (plan === 'FREE_TRIAL' || plan === 'GROWTH' || plan === 'STARTER') &&
      (feat === 'whatsApp' || feat === 'emailAutomation')
    ) {
      return false;
    }
    return !!subscription.features[feat];
  },

  canAccessAIFeature: (feature) => {
    const { currentUser, subscription } = get();
    if (currentUser.role === 'SUPER_ADMIN') return true;
    const plan = subscription.planType;
    // Free Trial has ONLY the Lead Score feature
    if (plan === 'FREE_TRIAL' || plan === 'STARTER') {
      return feature === 'lead-scoring';
    }
    // Growth, Business, and Enterprise have all AI features
    return true;
  },
}));
