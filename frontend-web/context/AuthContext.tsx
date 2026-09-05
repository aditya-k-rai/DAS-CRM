'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC';
export type PlanType = 'FREE_TRIAL' | 'GROWTH' | 'BUSINESS' | 'ENTERPRISE' | 'PRO' | 'MAX' | 'STARTER' | 'BASIC' | 'PRO_50' | 'PRO_MAX';

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

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  FREE_TRIAL: {
    id: 'FREE_TRIAL',
    name: 'Free Trial Plan',
    seats: 10,
    durationMinDays: 15,
    durationMaxDays: 40,
    defaultDurationDays: 30,
    hasAllAiFeatures: false, // Basic AI only (Only Lead Score)
    hasWhatsApp: false,
    hasEmailMarketing: false,
    description: '10 Users · Basic AI (Lead Score only) · 15-40 days duration',
  },
  GROWTH: {
    id: 'GROWTH',
    name: 'Growth Plan',
    seats: 20,
    hasAllAiFeatures: true, // All AI features included
    hasWhatsApp: false, // Blocked
    hasEmailMarketing: false, // Blocked
    description: '20 Users · All AI Features · WhatsApp & Email excluded',
  },
  BUSINESS: {
    id: 'BUSINESS',
    name: 'Business Plan',
    seats: 50,
    hasAllAiFeatures: true,
    hasWhatsApp: true,
    hasEmailMarketing: true,
    description: '50 Users · All Features Included (All AI + WhatsApp + Email)',
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise Plan',
    seats: 100,
    hasAllAiFeatures: true,
    hasWhatsApp: true,
    hasEmailMarketing: true,
    description: '100 Users · All Features Included · Enterprise Scale & SLA',
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
    whatsApp: boolean; // HARD-BLOCKED during FREE_TRIAL and GROWTH
    emailAutomation: boolean; // HARD-BLOCKED during FREE_TRIAL and GROWTH
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

export const MOCK_COMPANY_SUB: CompanySubscription = {
  id: 'comp_acme',
  companyName: 'Acme Sales Solutions',
  planType: 'FREE_TRIAL',
  trialDaysLeft: 30,
  isExpired: false,
  userSeatsAllocated: 10, // Free Trial provides 10 Users quota
  userSeatsUsed: 6, // 6 Assigned roles
  hasTeamLeaders: true,
  features: {
    whatsApp: false, // Hard-blocked on FREE_TRIAL and GROWTH
    emailAutomation: false, // Hard-blocked on FREE_TRIAL and GROWTH
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

interface AuthContextType {
  currentUser: UserProfile;
  subscription: CompanySubscription;
  token: string | null;
  roleTransitionLock: RoleTransitionLock | null;
  isLocked: boolean;
  switchRole: (role: UserRole) => void;
  updateSubscription: (sub: Partial<CompanySubscription>) => void;
  toggleScenario: (hasTL: boolean) => void;
  canEdit: () => boolean;
  canAccessFeature: (feat: keyof CompanySubscription['features']) => boolean;
  canAccessAIFeature: (feature: 'lead-scoring' | 'chat-instructions' | 'templates' | 'automation' | 'analytics') => boolean;
  isSeatExceeded: boolean;
  setAuthSession: (user: UserProfile, token: string, sub?: CompanySubscription) => void;
  logout: () => void;
  setRoleLockState: (lock: RoleTransitionLock | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function normalizeRoleStr(r?: any): UserRole {
  if (!r) return 'ADMIN';
  let str = '';
  if (typeof r === 'string') {
    str = r;
  } else if (typeof r === 'object' && r !== null) {
    str = typeof r.name === 'string' ? r.name : typeof r.role === 'string' ? r.role : String(r);
  } else {
    str = String(r);
  }

  const norm = str.trim().toUpperCase();
  if (norm === 'SUPER_ADMIN' || norm === 'SYSTEM_ADMIN' || norm === 'SUPERADMIN') return 'SUPER_ADMIN';
  if (norm === 'ADMIN' || norm === 'TENANT_ADMIN' || norm === 'OWNER' || norm === 'COMPANY_ADMIN') return 'ADMIN';
  if (norm === 'HR' || norm === 'HR_MANAGER' || norm === 'HUMAN_RESOURCES' || norm === 'HR_ADMIN' || norm === 'HR_EXEC') return 'HR';
  if (norm === 'MANAGER' || norm === 'DEPT_MANAGER' || norm === 'SALES_MANAGER') return 'MANAGER';
  if (norm === 'TEAM_LEADER' || norm === 'TL' || norm === 'LEAD') return 'TEAM_LEADER';
  if (norm === 'SALES_EXEC' || norm === 'EMPLOYEE' || norm === 'STAFF' || norm === 'REP' || norm === 'EXECUTIVE' || norm === 'SALES_REP' || norm === 'SALES' || norm === 'USER' || norm === 'VIEWER') return 'SALES_EXEC';

  return 'ADMIN';
}

export function inferRoleFromEmail(email?: string | null): UserRole | null {
  if (!email) return null;
  const em = email.toLowerCase().trim();
  if (em === 'adtyamighty@gmail.com') return 'SUPER_ADMIN';
  if (em.includes('sunita.hr') || em.includes('hr.manager') || em.includes('hr@') || em.includes('.hr@') || em.startsWith('hr.')) return 'HR';
  if (em.includes('rajesh.mgr') || em.includes('manager@') || em.includes('.mgr@') || em.startsWith('mgr.') || em.includes('.manager@')) return 'MANAGER';
  if (em.includes('amit.tl') || em.includes('lead@') || em.includes('.tl@') || em.startsWith('tl.') || em.includes('teamleader@')) return 'TEAM_LEADER';
  if (em.includes('rajesh.rep') || em.includes('sales@') || em.includes('.rep@') || em.includes('exec@') || em.includes('employee@') || em.startsWith('rep.')) return 'SALES_EXEC';
  if (em.includes('vikram.admin') || em.includes('admin@') || em.includes('owner@')) return 'ADMIN';
  return null;
}

export function validateEmailRoleMatch(email?: string | null, selectedRole?: UserRole): { valid: boolean; expectedRole?: UserRole } {
  if (!email || !selectedRole) return { valid: true };
  const expected = inferRoleFromEmail(email);
  if (!expected) return { valid: true };
  return {
    valid: normalizeRoleStr(expected) === normalizeRoleStr(selectedRole),
    expectedRole: expected,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('das_crm_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.role || parsed.email)) {
            parsed.role = normalizeRoleStr(parsed.role || inferRoleFromEmail(parsed.email));
            if (parsed.role === 'SUPER_ADMIN' && parsed.email?.toLowerCase() !== 'adtyamighty@gmail.com') {
              parsed.role = 'ADMIN';
            }
            return parsed;
          }
        } catch (e) {}
      }
      const roleStr = localStorage.getItem('das_crm_active_role');
      if (roleStr) {
        const safeRole = normalizeRoleStr(roleStr);
        return DEMO_USERS[safeRole] || DEMO_USERS.ADMIN;
      }
    }
    return DEMO_USERS.ADMIN;
  });

  const [subscription, setSubscription] = useState<CompanySubscription>(MOCK_COMPANY_SUB);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('das_crm_token');
    }
    return null;
  });
  const [roleTransitionLock, setRoleTransitionLock] = useState<RoleTransitionLock | null>(null);

  // localStorage hydration is fully handled by the lazy useState initializer above.
  // Enforce plan features
  useEffect(() => {
    if (subscription.planType === 'FREE_TRIAL' || subscription.planType === 'GROWTH' || subscription.planType === 'STARTER') {
      setSubscription(prev => ({
        ...prev,
        features: { ...prev.features, whatsApp: false, emailAutomation: false },
      }));
    }
  }, [subscription.planType]);

  const switchRole = (role: UserRole) => {
    const normRole = normalizeRoleStr(role);
    const targetUser = DEMO_USERS[normRole] || DEMO_USERS.ADMIN;
    setCurrentUser(targetUser);
    setToken('demo_active_token');
    localStorage.setItem('das_crm_active_role', normRole);
    localStorage.setItem('das_crm_user', JSON.stringify(targetUser));
    localStorage.setItem('das_crm_token', 'demo_active_token');
  };

  const updateSubscription = (patch: Partial<CompanySubscription>) => {
    setSubscription(prev => {
      const updated = {
        ...prev,
        ...patch,
        features: { ...prev.features, ...(patch.features || {}) },
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
      return updated;
    });
  };

  const toggleScenario = (hasTL: boolean) => {
    setSubscription(prev => ({ ...prev, hasTeamLeaders: hasTL }));
  };

  const canEdit = useCallback((): boolean => {
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (roleTransitionLock) return false; // Lock out edits during 24hr transition
    if (subscription.isExpired) return false;
    return true;
  }, [currentUser.role, roleTransitionLock, subscription.isExpired]);

  const canAccessFeature = useCallback((feat: keyof CompanySubscription['features']): boolean => {
    if (currentUser.role === 'SUPER_ADMIN') return true;
    const plan = subscription.planType;
    // Hard block WhatsApp and Email Automation on FREE_TRIAL and GROWTH
    if ((plan === 'FREE_TRIAL' || plan === 'GROWTH' || plan === 'STARTER') && (feat === 'whatsApp' || feat === 'emailAutomation')) {
      return false;
    }
    return !!subscription.features[feat];
  }, [currentUser.role, subscription.planType, subscription.features]);

  const canAccessAIFeature = useCallback((feature: 'lead-scoring' | 'chat-instructions' | 'templates' | 'automation' | 'analytics'): boolean => {
    if (currentUser.role === 'SUPER_ADMIN') return true;
    const plan = subscription.planType;
    // Free Trial has ONLY the Lead Score feature
    if (plan === 'FREE_TRIAL' || plan === 'STARTER') {
      return feature === 'lead-scoring';
    }
    // Growth, Business, and Enterprise have all AI features
    return true;
  }, [currentUser.role, subscription.planType]);

  const isSeatExceeded = subscription.userSeatsUsed > subscription.userSeatsAllocated;

  const setAuthSession = (user: UserProfile, newTok: string, sub?: CompanySubscription) => {
    const normalizedUser = {
      ...user,
      role: normalizeRoleStr(user.role || inferRoleFromEmail(user.email)),
    };
    setCurrentUser(normalizedUser);
    setToken(newTok);
    if (sub) setSubscription(sub);
    localStorage.setItem('das_crm_user', JSON.stringify(normalizedUser));
    localStorage.setItem('das_crm_token', newTok);
    localStorage.setItem('das_crm_active_role', normalizedUser.role);
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(DEMO_USERS.ADMIN);
    setRoleTransitionLock(null);
    localStorage.removeItem('das_crm_user');
    localStorage.removeItem('das_crm_token');
    localStorage.removeItem('das_crm_active_role');
  };

  const setRoleLockState = (lock: RoleTransitionLock | null) => {
    setRoleTransitionLock(lock);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        subscription,
        token,
        roleTransitionLock,
        isLocked: !!roleTransitionLock,
        switchRole,
        updateSubscription,
        toggleScenario,
        canEdit,
        canAccessFeature,
        canAccessAIFeature,
        isSeatExceeded,
        setAuthSession,
        logout,
        setRoleLockState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      currentUser: DEMO_USERS.ADMIN,
      subscription: MOCK_COMPANY_SUB,
      token: null,
      roleTransitionLock: null,
      isLocked: false,
      switchRole: () => {},
      updateSubscription: () => {},
      toggleScenario: () => {},
      canEdit: () => true,
      canAccessFeature: () => true,
      canAccessAIFeature: () => true,
      isSeatExceeded: false,
      setAuthSession: () => {},
      logout: () => {},
      setRoleLockState: () => {},
    };
  }
  return ctx;
}
