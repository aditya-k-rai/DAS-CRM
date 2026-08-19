'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC';
export type PlanType = 'FREE_TRIAL' | 'GROWTH' | 'PRO' | 'MAX' | 'STARTER' | 'BASIC' | 'PRO_50' | 'PRO_MAX' | 'ENTERPRISE';

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
    whatsApp: boolean; // HARD-BLOCKED during FREE_TRIAL
    emailAutomation: boolean; // HARD-BLOCKED during FREE_TRIAL
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
  trialDaysLeft: 14,
  isExpired: false,
  userSeatsAllocated: 6, // Starter default seat quota (excluding Admin)
  userSeatsUsed: 4,
  hasTeamLeaders: true,
  features: {
    whatsApp: false, // Hard-blocked on FREE_TRIAL
    emailAutomation: false, // Hard-blocked on FREE_TRIAL
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

  if (norm === 'SUPER_ADMIN' || norm === 'ADMIN' || norm === 'HR' || norm === 'MANAGER' || norm === 'TEAM_LEADER' || norm === 'SALES_EXEC') {
    return norm as UserRole;
  }

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
      const stored = localStorage.getItem('nexcrm_user');
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
      const roleStr = localStorage.getItem('nexcrm_active_role');
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
      return localStorage.getItem('nexcrm_token');
    }
    return null;
  });
  const [roleTransitionLock, setRoleTransitionLock] = useState<RoleTransitionLock | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nexcrm_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.role || parsed.email)) {
            parsed.role = normalizeRoleStr(parsed.role || inferRoleFromEmail(parsed.email));
            if (parsed.role === 'SUPER_ADMIN' && parsed.email?.toLowerCase() !== 'adtyamighty@gmail.com') {
              parsed.role = 'ADMIN';
            }
            setCurrentUser(parsed);
          }
        } catch (e) {}
      } else {
        const roleStr = localStorage.getItem('nexcrm_active_role');
        const safeRole = normalizeRoleStr(roleStr);
        setCurrentUser(DEMO_USERS[safeRole] || DEMO_USERS.ADMIN);
      }

      const tok = localStorage.getItem('nexcrm_token');
      if (tok) setToken(tok);
    }
  }, []);

  useEffect(() => {
    // Sync features when plan changes
    if (subscription.planType === 'FREE_TRIAL') {
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
    localStorage.setItem('nexcrm_active_role', normRole);
    localStorage.setItem('nexcrm_user', JSON.stringify(targetUser));
    localStorage.setItem('nexcrm_token', 'demo_active_token');
  };

  const updateSubscription = (patch: Partial<CompanySubscription>) => {
    setSubscription(prev => {
      const updated = {
        ...prev,
        ...patch,
        features: { ...prev.features, ...(patch.features || {}) },
      };
      // Always enforce HARD BLOCK on Free Trial for WhatsApp and Email Automation
      if (updated.planType === 'FREE_TRIAL') {
        updated.features.whatsApp = false;
        updated.features.emailAutomation = false;
      }
      return updated;
    });
  };

  const toggleScenario = (hasTL: boolean) => {
    setSubscription(prev => ({ ...prev, hasTeamLeaders: hasTL }));
  };

  const canEdit = (): boolean => {
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (roleTransitionLock) return false; // Lock out edits during 24hr transition
    if (subscription.isExpired) return false;
    return true;
  };

  const canAccessFeature = (feat: keyof CompanySubscription['features']): boolean => {
    if (currentUser.role === 'SUPER_ADMIN') return true;
    // Hard block WhatsApp and Email Automation on FREE_TRIAL
    if (subscription.planType === 'FREE_TRIAL' && (feat === 'whatsApp' || feat === 'emailAutomation')) {
      return false;
    }
    return !!subscription.features[feat];
  };

  const isSeatExceeded = subscription.userSeatsUsed > subscription.userSeatsAllocated;

  const setAuthSession = (user: UserProfile, newTok: string, sub?: CompanySubscription) => {
    const normalizedUser = {
      ...user,
      role: normalizeRoleStr(user.role || inferRoleFromEmail(user.email)),
    };
    setCurrentUser(normalizedUser);
    setToken(newTok);
    if (sub) setSubscription(sub);
    localStorage.setItem('nexcrm_user', JSON.stringify(normalizedUser));
    localStorage.setItem('nexcrm_token', newTok);
    localStorage.setItem('nexcrm_active_role', normalizedUser.role);
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(DEMO_USERS.ADMIN);
    setRoleTransitionLock(null);
    localStorage.removeItem('nexcrm_user');
    localStorage.removeItem('nexcrm_token');
    localStorage.removeItem('nexcrm_active_role');
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
      currentUser: DEMO_USERS.SUPER_ADMIN,
      subscription: MOCK_COMPANY_SUB,
      token: null,
      roleTransitionLock: null,
      isLocked: false,
      switchRole: () => {},
      updateSubscription: () => {},
      toggleScenario: () => {},
      canEdit: () => true,
      canAccessFeature: () => true,
      isSeatExceeded: false,
      setAuthSession: () => {},
      logout: () => {},
      setRoleLockState: () => {},
    };
  }
  return ctx;
}
