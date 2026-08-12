'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC';

export type PlanType = 'FREE_TRIAL' | 'BASIC' | 'PRO' | 'PRO_MAX';

export interface CompanySubscription {
  id: string;
  companyName: string;
  planType: PlanType;
  trialDaysLeft: number;
  isExpired: boolean;
  userSeatsAllocated: number;
  userSeatsUsed: number;
  hasTeamLeaders: boolean; // Toggle Scenario A (With TL) vs Scenario B (Without TL)
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

export const MOCK_COMPANY_SUB: CompanySubscription = {
  id: 'comp_acme',
  companyName: 'Acme Sales Solutions',
  planType: 'FREE_TRIAL',
  trialDaysLeft: 18,
  isExpired: false,
  userSeatsAllocated: 10,
  userSeatsUsed: 7,
  hasTeamLeaders: true, // Default to Scenario A
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
    email: 'admin@platform.com',
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
  switchRole: (role: UserRole) => void;
  updateSubscription: (sub: Partial<CompanySubscription>) => void;
  toggleScenario: (hasTL: boolean) => void;
  canEdit: () => boolean;
  canAccessFeature: (feat: keyof CompanySubscription['features']) => boolean;
  isSeatExceeded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser]   = useState<UserProfile>(DEMO_USERS.SUPER_ADMIN);
  const [subscription, setSubscription] = useState<CompanySubscription>(MOCK_COMPANY_SUB);

  const switchRole = (role: UserRole) => {
    if (DEMO_USERS[role]) {
      setCurrentUser(DEMO_USERS[role]);
      localStorage.setItem('nexcrm_active_role', role);
    }
  };

  const updateSubscription = (patch: Partial<CompanySubscription>) => {
    setSubscription(prev => ({
      ...prev,
      ...patch,
      features: { ...prev.features, ...(patch.features || {}) },
    }));
  };

  const toggleScenario = (hasTL: boolean) => {
    setSubscription(prev => ({ ...prev, hasTeamLeaders: hasTL }));
  };

  const canEdit = (): boolean => {
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (subscription.isExpired) return false;
    return true;
  };

  const canAccessFeature = (feat: keyof CompanySubscription['features']): boolean => {
    if (currentUser.role === 'SUPER_ADMIN') return true;
    return !!subscription.features[feat];
  };

  const isSeatExceeded = subscription.userSeatsUsed > subscription.userSeatsAllocated;

  return (
    <AuthContext.Provider value={{
      currentUser,
      subscription,
      switchRole,
      updateSubscription,
      toggleScenario,
      canEdit,
      canAccessFeature,
      isSeatExceeded,
    }}>
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
      switchRole: () => {},
      updateSubscription: () => {},
      toggleScenario: () => {},
      canEdit: () => true,
      canAccessFeature: () => true,
      isSeatExceeded: false,
    };
  }
  return ctx;
}
